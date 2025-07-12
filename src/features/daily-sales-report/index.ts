// API exports
export * from './api/queries';
export * from './api/service';
export * from './api/keys';

// Component exports
export * from './components';

// Page exports
export * from './pages';

// Type exports
export * from './types';

// Feature metadata for AI agents
export const dailySalesReportFeatureMetadata = {
  name: 'daily-sales-report',
  description: 'Daily Sales Report (DSR) - Aggregated sales data grouped by product and sale price',
  version: '1.0.0',
  dependencies: ['shared/hooks', 'shared/types', 'products', 'orders'],
  apis: [
    'useDailySalesReport',
    'useDailySalesReportSummary',
  ],
  components: ['DailySalesReportTable', 'DateFilter'],
  pages: ['DailySalesReportListPage'],
  routes: ['/daily-sales-report', '/dsr'],
  queryKeys: ['daily-sales-report'],
} as const;
