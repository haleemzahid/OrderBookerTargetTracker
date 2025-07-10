// API exports
export * from './api/queries';
export * from './api/mutations';
export * from './api/service';

// Component exports
export * from './components/product-form';
export * from './components/product-table';

// Page exports
export * from './pages/products-list';

// Type exports
export * from './types';

// Hook exports
export * from './hooks/use-products-management';

// Feature metadata for AI agents
export const productsFeatureMetadata = {
  name: 'products',
  description: 'Manages product inventory and pricing',
  version: '1.0.0',
  dependencies: ['shared/hooks', 'shared/types', 'companies'],
  apis: [
    'useProducts',
    'useProduct',
    'useProductsByCompany',
    'useCreateProduct',
    'useUpdateProduct',
    'useDeleteProduct',
  ]
};
