import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;
let isInitializing = false;
let initializationPromise: Promise<Database> | null = null;

// Database configuration for better performance and lock handling
const DB_CONFIG = {
  busyTimeout: 30000, // 30 seconds timeout for busy database
  retryAttempts: 3,
  retryDelay: 1000, // 1 second delay between retries
};

// Enhanced initialization with retry logic and proper connection handling
export const initializeDatabase = async (): Promise<Database> => {
  if (db) {
    return db;
  }

  if (isInitializing && initializationPromise) {
    return initializationPromise;
  }

  isInitializing = true;
  
  initializationPromise = (async () => {
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < DB_CONFIG.retryAttempts) {
      try {
        console.log(`Database initialization attempt ${attempts + 1}/${DB_CONFIG.retryAttempts}`);
        
        db = await Database.load('sqlite:app3.db');
        
        // Configure SQLite for better concurrency and performance
        await db.execute(`
          PRAGMA journal_mode = WAL;
          PRAGMA synchronous = NORMAL;
          PRAGMA cache_size = 10000;
          PRAGMA temp_store = memory;
          PRAGMA mmap_size = 268435456;
          PRAGMA busy_timeout = ${DB_CONFIG.busyTimeout};
        `);

        console.log('Database initialized successfully with optimized settings');
        isInitializing = false;
        return db;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown database error');
        console.error(`Database initialization attempt ${attempts + 1} failed:`, lastError.message);
        
        attempts++;
        if (attempts < DB_CONFIG.retryAttempts) {
          console.log(`Retrying in ${DB_CONFIG.retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, DB_CONFIG.retryDelay));
        }
      }
    }

    isInitializing = false;
    initializationPromise = null;
    throw new Error(`Failed to initialize database after ${DB_CONFIG.retryAttempts} attempts. Last error: ${lastError?.message}`);
  })();

  return initializationPromise;
};

export const getDatabase = (): Database => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return db;
};

// Enhanced database operations with retry logic for lock handling
export const executeWithRetry = async <T>(
  operation: (db: Database) => Promise<T>,
  maxRetries: number = DB_CONFIG.retryAttempts
): Promise<T> => {
  let attempts = 0;
  let lastError: Error | null = null;

  while (attempts < maxRetries) {
    try {
      const database = getDatabase();
      return await operation(database);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Check if it's a database lock error
      const isLockError = lastError.message.toLowerCase().includes('locked') ||
                         lastError.message.toLowerCase().includes('busy') ||
                         lastError.message.toLowerCase().includes('database is locked');
      
      if (isLockError && attempts < maxRetries - 1) {
        attempts++;
        const delay = DB_CONFIG.retryDelay * Math.pow(2, attempts - 1); // Exponential backoff
        console.warn(`Database lock detected (attempt ${attempts}/${maxRetries}). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw lastError;
    }
  }

  throw lastError || new Error('Operation failed after maximum retries');
};

// Transaction wrapper with proper error handling
export const executeTransaction = async <T>(
  operations: (db: Database) => Promise<T>
): Promise<T> => {
  return executeWithRetry(async (database) => {
    await database.execute('BEGIN IMMEDIATE TRANSACTION');
    
    try {
      const result = await operations(database);
      await database.execute('COMMIT');
      return result;
    } catch (error) {
      await database.execute('ROLLBACK');
      throw error;
    }
  });
};

// Batch operations helper to reduce lock contention
export const executeBatch = async (
  queries: Array<{ sql: string; values?: unknown[] }>
): Promise<void> => {
  return executeTransaction(async (database) => {
    for (const query of queries) {
      if (query.values) {
        await database.execute(query.sql, query.values);
      } else {
        await database.execute(query.sql);
      }
    }
  });
};

export const closeDatabase = async (): Promise<void> => {
  if (db) {
    try {
      // Close all open transactions and statements
      await db.execute('PRAGMA optimize');
      await db.close();
      console.log('Database closed successfully');
    } catch (error) {
      console.error('Error closing database:', error);
    } finally {
      db = null;
      isInitializing = false;
      initializationPromise = null;
    }
  }
};
