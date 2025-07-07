import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
// import { server } from './mocks/server';

// Start server before all tests (uncomment when MSW is set up)
// beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => {
  cleanup();
  // server.resetHandlers();
});

// Close server after all tests (uncomment when MSW is set up)
// afterAll(() => server.close());

// Mock Tauri API
Object.defineProperty(window, '__TAURI_INTERNALS__', {
  value: {},
  writable: true,
});

// Mock database
vi.mock('../services/database', () => ({
  initializeDatabase: vi.fn(),
  getDatabase: vi.fn(),
  closeDatabase: vi.fn(),
}));
