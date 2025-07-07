// API exports
export * from './api/queries';
export * from './api/mutations';
export * from './api/service';

// Component exports
export * from './components/monthly-target-form';
export * from './components/monthly-target-table';

// Page exports
export * from './pages/monthly-targets-list';

// Type exports
export * from './types';

// Feature metadata for AI agents
export const monthlyTargetsFeatureMetadata = {
  name: 'monthly-targets',
  description: 'Manages monthly sales targets and tracking',
  version: '1.0.0',
  dependencies: ['shared/hooks', 'shared/types', 'order-bookers'],
  apis: [
    'useMonthlyTargets',
    'useMonthlyTarget',
    'useMonthlyTargetsByMonth',
    'useMonthlyTargetsByOrderBooker',
    'useCreateMonthlyTarget',
    'useBatchCreateMonthlyTargets',
    'useBatchUpsertMonthlyTargets',
    'useUpdateMonthlyTarget',
    'useDeleteMonthlyTarget',
    'useCopyFromPreviousMonth',
  ],
  components: ['MonthlyTargetForm', 'MonthlyTargetTable'],
  pages: ['MonthlyTargetsListPage'],
  routes: ['/monthly-targets'],
  queryKeys: ['monthly-targets'],
} as const;
