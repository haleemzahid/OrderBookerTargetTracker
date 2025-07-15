import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export const initializeDatabase = async (): Promise<Database> => {
  if (!db) {
    db = await Database.load('sqlite:app3.db');
  }
  return db;
};

export const getDatabase = (): Database => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return db;
};

export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await db.close();
    db = null;
  }
};
