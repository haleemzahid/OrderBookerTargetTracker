// API exports
export * from './api/queries';
export * from './api/mutations';
export * from './api/service';

// Component exports
export * from './components/order-booker-form';
export * from './components/order-booker-table';

// Page exports
export * from './pages/order-bookers-list';

// Type exports
export * from './types';

// Feature metadata for AI agents
export const orderBookerFeatureMetadata = {
  name: 'order-bookers',
  description: 'Manages order booker entities and their operations',
  version: '1.0.0',
  dependencies: ['shared/hooks', 'shared/types'],
  apis: ['useOrderBookers', 'useOrderBooker', 'useCreateOrderBooker', 'useUpdateOrderBooker', 'useDeleteOrderBooker'],
  components: ['OrderBookerForm', 'OrderBookerTable'],
  pages: ['OrderBookersListPage'],
  routes: ['/order-bookers'],
  queryKeys: ['order-bookers'],
} as const;
