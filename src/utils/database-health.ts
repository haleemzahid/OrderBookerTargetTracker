// Database health check utility
import { initializeDatabase, executeWithRetry, executeTransaction } from '../services/database';

export const testDatabaseHealth = async (): Promise<{
  status: 'healthy' | 'degraded' | 'error';
  latency: number;
  error?: string;
}> => {
  const startTime = Date.now();
  
  try {
    await initializeDatabase();
    
    // Test basic connectivity
    await executeWithRetry(async (db) => {
      await db.select('SELECT 1 as test');
    });
    
    // Test transaction handling
    await executeTransaction(async (db) => {
      await db.select('SELECT COUNT(*) as count FROM orders LIMIT 1');
      return true;
    });
    
    const latency = Date.now() - startTime;
    
    return {
      status: latency < 1000 ? 'healthy' : 'degraded',
      latency
    };
    
  } catch (error) {
    const latency = Date.now() - startTime;
    
    return {
      status: 'error',
      latency,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const isDatabaseLockError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  
  const message = error.message.toLowerCase();
  return (
    message.includes('locked') ||
    message.includes('busy') ||
    message.includes('database is locked') ||
    message.includes('sqlite_busy')
  );
};
