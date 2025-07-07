import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider } from '@tanstack/react-router';
import { AppProvider } from './contexts/AppContext';
import { router } from './app/router';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';
import { initializeDatabase } from './services/database';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

function App() {
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        await initializeDatabase();
        setIsDbInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setDbError(error instanceof Error ? error.message : 'Unknown database error');
      }
    };

    setupDatabase();
  }, []);

  if (dbError) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Database Error</h2>
        <p>{dbError}</p>
      </div>
    );
  }

  if (!isDbInitialized) {
    return <LoadingSpinner tip="Initializing database..." />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <RouterProvider router={router} />
        </AppProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
