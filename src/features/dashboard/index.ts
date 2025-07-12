// Type exports
export * from './types/index';

// Store exports
export * from './stores/dashboard-store';

// API exports
export * from './api/widget-data-service';

// Component exports
export * from './components/dashboard-grid';
export * from './components/widgets/revenue-performance-widget';
export * from './components/widgets/profit-margin-widget';

// Page exports
export * from './pages/dashboard-page';

// Hook exports (will be added as we implement)
// export * from './hooks/use-dashboard-filters';

// Feature metadata for AI agents
export const dashboardFeatureMetadata = {
  name: 'dashboard',
  description: 'Business intelligence dashboard with configurable widgets for wholesale business analytics',
  version: '1.0.0',
  dependencies: ['order-bookers', 'orders', 'monthly-targets', 'products', 'companies'],
  widgets: [
    'revenue-performance',
    'profit-margin',
    'top-performers',
    'sales-trend',
    'product-performance',
    'return-rate',
    'target-progress',
    'cash-flow',
    'order-velocity',
    'alert-center'
  ],
  refreshIntervals: {
    alerts: 300000, // 5 minutes
    revenue: 1800000, // 30 minutes
    performance: 900000, // 15 minutes
    analytics: 3600000 // 60 minutes
  }
};
