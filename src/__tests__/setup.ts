import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '../config/dayjs'; // Import configured dayjs
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

// Mock matchMedia for Ant Design components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver for Ant Design components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock database
vi.mock('../services/database', () => ({
  initializeDatabase: vi.fn(),
  getDatabase: vi.fn(),
  closeDatabase: vi.fn(),
}));
