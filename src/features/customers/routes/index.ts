// Customer Routes Configuration
// Following React Router patterns and existing project structure

import React from 'react';
import { RouteObject } from 'react-router-dom';
import { CustomerListPage } from '../pages/customer-list-page';
import { CustomerDetailPage } from '../pages/customer-detail-page';

export const customerRoutes: RouteObject[] = [
  {
    path: '/customers',
    children: [
      {
        index: true,
        element: React.createElement(CustomerListPage)
      },
      {
        path: ':customerId',
        element: React.createElement(CustomerDetailPage)
      }
    ]
  }
];

// Export individual route configurations for external integration
export const CUSTOMER_ROUTES = {
  LIST: '/customers',
  DETAIL: '/customers/:customerId',
  CREATE: '/customers?action=create',
  EDIT: '/customers/:customerId?action=edit'
} as const;

// Helper functions for route generation
export const generateCustomerRoutes = {
  list: () => '/customers',
  detail: (customerId: string) => `/customers/${customerId}`,
  create: () => '/customers?action=create',
  edit: (customerId: string) => `/customers/${customerId}?action=edit`
};
