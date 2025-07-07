// API exports
export * from './api/queries';
export * from './api/mutations';
export * from './api/service';

// Component exports
export * from './components/daily-entry-form';
export * from './components/daily-entry-table';

// Page exports
export * from './pages/daily-entries-list';

// Type exports
export * from './types';

// Feature metadata for AI agents
export const dailyEntriesFeatureMetadata = {
  name: 'daily-entries',
  description: 'Manages daily sales entries and analytics',
  version: '1.0.0',
  dependencies: ['shared/hooks', 'shared/types', 'order-bookers'],
  apis: [
    'useDailyEntries',
    'useDailyEntry',
    'useDailyEntriesByMonth',
    'useDailyEntriesByOrderBooker',
    'useDailyEntriesByDateRange',
    'useMonthlyAnalytics',
    'useCreateDailyEntry',
    'useBatchCreateDailyEntries',
    'useUpdateDailyEntry',
    'useDeleteDailyEntry',
  ],
  components: ['DailyEntryForm', 'DailyEntryTable'],
  pages: ['DailyEntriesListPage'],
  routes: ['/daily-entries'],
  queryKeys: ['daily-entries'],
} as const;
