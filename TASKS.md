# Architecture Migration Tasks

## Overview
Migration from current monolithic structure to vertical slices architecture with proper testing infrastructure. Execute tasks in order, one phase at a time.

## Phase 1: Foundation Setup (Complete First)

### [x] Task 1.1: Add Development Dependencies
```bash
pnpm add -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-import prettier eslint-config-prettier eslint-plugin-prettier husky lint-staged commitizen cz-conventional-changelog @commitlint/cli @commitlint/config-conventional
```

### [x] Task 1.2: Add State Management Dependencies
```bash
pnpm add zustand @tanstack/react-router @tanstack/router-devtools
```

### [x] Task 1.3: Create ESLint Configuration
Create `.eslintrc.json`:
```json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "react", "react-hooks", "import"],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "import/order": ["error", { "groups": ["builtin", "external", "internal", "parent", "sibling", "index"] }]
  },
  "settings": {
    "react": { "version": "detect" },
    "import/resolver": { "typescript": {} }
  }
}
```

### [x] Task 1.4: Create Prettier Configuration
Create `.prettierrc`:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### [x] Task 1.5: Update package.json Scripts
Add these scripts to package.json:
```json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write src/**/*.{ts,tsx}",
    "type-check": "tsc --noEmit"
  }
}
```

## Phase 2: Setup Proper Routing

### [x] Task 2.1: Create Router Configuration
Create `src/app/router/index.ts`:
```typescript
import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import MainLayout from '../../components/layouts/MainLayout';
import Dashboard from '../../pages/Dashboard';
import OrderBookers from '../../pages/OrderBookers';
import DailyEntries from '../../pages/DailyEntries';
import MonthlyTargets from '../../pages/MonthlyTargets';
import Reports from '../../pages/Reports';

const rootRoute = createRootRoute({
  component: MainLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
});

const orderBookersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/order-bookers',
  component: OrderBookers,
});

const dailyEntriesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/daily-entries',
  component: DailyEntries,
});

const monthlyTargetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/monthly-targets',
  component: MonthlyTargets,
});

const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reports',
  component: Reports,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  orderBookersRoute,
  dailyEntriesRoute,
  monthlyTargetsRoute,
  reportsRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
```

### [x] Task 2.2: Update App.tsx for Router
Replace the MainLayout usage in App.tsx with RouterProvider:
```typescript
import { RouterProvider } from '@tanstack/react-router';
import { router } from './app/router';

// Replace the return statement with:
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
```

### [x] Task 2.3: Update MainLayout Component
Update `src/components/layouts/MainLayout.tsx` to use router navigation instead of state-based navigation. Replace the switch statement with `<Outlet />` from `@tanstack/react-router`.

## Phase 3: Create Shared Infrastructure

### [x] Task 3.1: Create Shared Types Structure
Create `src/shared/types/` directory with these files:

#### [ ] `src/shared/types/api.ts`:
```typescript
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
}
```

#### [ ] `src/shared/types/common.ts`:
```typescript
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export type Status = 'pending' | 'approved' | 'rejected';
export type Language = 'en' | 'ur';
export type Theme = 'light' | 'dark';
export type Direction = 'ltr' | 'rtl';
```

### [x] Task 3.2: Create Shared Validation
Create `src/shared/validation/schemas.ts`:
```typescript
import { z } from 'zod';

export const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
});

export const paginationSchema = z.object({
  page: z.number().min(1),
  pageSize: z.number().min(1).max(100),
});

export const phoneSchema = z.string().regex(/^\+92-\d{3}-\d{7}$/, 'Invalid phone format');
export const emailSchema = z.string().email().optional();
```

### [x] Task 3.3: Create Shared Hooks
Create `src/shared/hooks/use-table.ts`:
```typescript
import { useState, useMemo } from 'react';
import type { TableProps } from 'antd';

interface UseTableOptions<T> {
  data: T[];
  pageSize?: number;
  searchableFields?: (keyof T)[];
}

export function useTable<T extends Record<string, any>>({
  data,
  pageSize = 10,
  searchableFields = [],
}: UseTableOptions<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [sortField, setSortField] = useState<keyof T | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredData = useMemo(() => {
    if (!searchText) return data;
    
    return data.filter((item) =>
      searchableFields.some((field) =>
        String(item[field]).toLowerCase().includes(searchText.toLowerCase())
      )
    );
  }, [data, searchText, searchableFields]);

  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortOrder]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, pageSize]);

  const tableProps: TableProps<T> = {
    dataSource: paginatedData,
    pagination: {
      current: currentPage,
      pageSize,
      total: filteredData.length,
      onChange: setCurrentPage,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
    },
    onChange: (pagination, filters, sorter) => {
      if (Array.isArray(sorter)) return;
      setSortField(sorter.field as keyof T);
      setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
    },
  };

  return {
    tableProps,
    searchText,
    setSearchText,
    currentPage,
    setCurrentPage,
    filteredData,
    totalItems: filteredData.length,
  };
}
```

## Phase 4: Migrate Order Bookers Feature (First Module)

### [x] Task 4.1: Create Order Bookers Feature Structure
Create directories:
- [ ] `src/features/order-bookers/`
- [ ] `src/features/order-bookers/api/`
- [ ] `src/features/order-bookers/components/`
- [ ] `src/features/order-bookers/hooks/`
- [ ] `src/features/order-bookers/pages/`
- [ ] `src/features/order-bookers/stores/`
- [ ] `src/features/order-bookers/types/`
- [ ] `src/features/order-bookers/utils/`

### [x] Task 4.2: Create Order Bookers Types
Create `src/features/order-bookers/types/index.ts`:
```typescript
export interface OrderBooker {
  id: string;
  name: string;
  nameUrdu: string;
  phone: string;
  email?: string;
  joinDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Current month's target data
  currentMonthTarget?: number;
  currentMonthAchieved?: number;
  currentMonthRemaining?: number;
  currentMonthAchievementPercentage?: number;
}

export interface CreateOrderBookerRequest {
  name: string;
  nameUrdu: string;
  phone: string;
  email?: string;
}

export interface UpdateOrderBookerRequest {
  name?: string;
  nameUrdu?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export interface OrderBookerFilters {
  search?: string;
  isActive?: boolean;
  joinDateFrom?: Date;
  joinDateTo?: Date;
}
```

### [x] Task 4.3: Create Order Bookers API Layer
Create `src/features/order-bookers/api/queries.ts`:
```typescript
import { useQuery } from '@tanstack/react-query';
import { orderBookerService } from './service';
import { queryKeys } from './keys';
import type { OrderBookerFilters } from '../types';

export const useOrderBookers = (filters?: OrderBookerFilters) => {
  return useQuery({
    queryKey: queryKeys.orderBookers.list(filters),
    queryFn: () => orderBookerService.getAll(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useOrderBooker = (id: string) => {
  return useQuery({
    queryKey: queryKeys.orderBookers.detail(id),
    queryFn: () => orderBookerService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};
```

### [x] Task 4.4: Create Order Bookers Query Keys
Create `src/features/order-bookers/api/keys.ts`:
```typescript
import type { OrderBookerFilters } from '../types';

export const queryKeys = {
  orderBookers: {
    all: ['order-bookers'] as const,
    lists: () => [...queryKeys.orderBookers.all, 'list'] as const,
    list: (filters?: OrderBookerFilters) => [...queryKeys.orderBookers.lists(), filters] as const,
    details: () => [...queryKeys.orderBookers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orderBookers.details(), id] as const,
  },
};
```

### [x] Task 4.5: Create Order Bookers Service
Create `src/features/order-bookers/api/service.ts`:
```typescript
import { getDatabase } from '../../../services/database';
import { v4 as uuidv4 } from 'uuid';
import type {
  OrderBooker,
  CreateOrderBookerRequest,
  UpdateOrderBookerRequest,
  OrderBookerFilters,
} from '../types';
import type { Result } from '../../../shared/types/common';

export interface IOrderBookerService {
  getAll(filters?: OrderBookerFilters): Promise<OrderBooker[]>;
  getById(id: string): Promise<OrderBooker | null>;
  create(data: CreateOrderBookerRequest): Promise<OrderBooker>;
  update(id: string, data: UpdateOrderBookerRequest): Promise<OrderBooker>;
  delete(id: string): Promise<void>;
}

// Move the existing orderBookerService implementation here
export const orderBookerService: IOrderBookerService = {
  // Copy implementation from src/services/api/orderBookerService.ts
};
```

### [x] Task 4.6: Create Order Bookers Mutations
Create `src/features/order-bookers/api/mutations.ts`:
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderBookerService } from './service';
import { queryKeys } from './keys';
import type { CreateOrderBookerRequest, UpdateOrderBookerRequest } from '../types';

export const useCreateOrderBooker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderBookerRequest) => orderBookerService.create(data),
    onSuccess: (newOrderBooker) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orderBookers.lists() });
      queryClient.setQueryData(queryKeys.orderBookers.detail(newOrderBooker.id), newOrderBooker);
    },
  });
};

export const useUpdateOrderBooker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderBookerRequest }) =>
      orderBookerService.update(id, data),
    onSuccess: (updatedOrderBooker) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orderBookers.lists() });
      queryClient.setQueryData(queryKeys.orderBookers.detail(updatedOrderBooker.id), updatedOrderBooker);
    },
  });
};

export const useDeleteOrderBooker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => orderBookerService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orderBookers.lists() });
      queryClient.removeQueries({ queryKey: queryKeys.orderBookers.detail(id) });
    },
  });
};
```

### [x] Task 4.7: Create Order Bookers Components
Create `src/features/order-bookers/components/order-booker-form.tsx`:
```typescript
import React from 'react';
import { Form, Input, Button, Card } from 'antd';
import { useCreateOrderBooker, useUpdateOrderBooker } from '../api/mutations';
import type { OrderBooker, CreateOrderBookerRequest, UpdateOrderBookerRequest } from '../types';

interface OrderBookerFormProps {
  orderBooker?: OrderBooker;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const OrderBookerForm: React.FC<OrderBookerFormProps> = ({
  orderBooker,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const createMutation = useCreateOrderBooker();
  const updateMutation = useUpdateOrderBooker();

  const isEditing = !!orderBooker;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (values: CreateOrderBookerRequest) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: orderBooker.id, data: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      form.resetFields();
      onSuccess?.();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Card title={isEditing ? 'Edit Order Booker' : 'Create Order Booker'}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={orderBooker}
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please input name!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="nameUrdu"
          label="Name (Urdu)"
          rules={[{ required: true, message: 'Please input Urdu name!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Phone"
          rules={[{ required: true, message: 'Please input phone!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[{ type: 'email', message: 'Please input valid email!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            {isEditing ? 'Update' : 'Create'}
          </Button>
          {onCancel && (
            <Button style={{ marginLeft: 8 }} onClick={onCancel}>
              Cancel
            </Button>
          )}
        </Form.Item>
      </Form>
    </Card>
  );
};
```

### [x] Task 4.8: Create Order Bookers Table Component
Create `src/features/order-bookers/components/order-booker-table.tsx`:
```typescript
import React from 'react';
import { Table, Button, Space, Tag, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import { useTable } from '../../../shared/hooks/use-table';
import type { OrderBooker } from '../types';

interface OrderBookerTableProps {
  data: OrderBooker[];
  loading?: boolean;
  onEdit: (orderBooker: OrderBooker) => void;
  onDelete: (orderBooker: OrderBooker) => void;
}

export const OrderBookerTable: React.FC<OrderBookerTableProps> = ({
  data,
  loading,
  onEdit,
  onDelete,
}) => {
  const { tableProps, searchText, setSearchText } = useTable({
    data,
    searchableFields: ['name', 'nameUrdu', 'phone', 'email'],
  });

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'Name (Urdu)',
      dataIndex: 'nameUrdu',
      key: 'nameUrdu',
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (record: OrderBooker) => (
        <Space direction="vertical" size="small">
          <Space>
            <PhoneOutlined />
            {record.phone}
          </Space>
          {record.email && (
            <Space>
              <MailOutlined />
              {record.email}
            </Space>
          )}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: OrderBooker) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this order booker?"
            onConfirm={() => onDelete(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      {...tableProps}
      columns={columns}
      loading={loading}
      rowKey="id"
    />
  );
};
```

### [x] Task 4.9: Create Order Bookers Page
Create `src/features/order-bookers/pages/order-bookers-list.tsx`:
```typescript
import React, { useState } from 'react';
import { Card, Button, Modal, message, Input, Space } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useOrderBookers } from '../api/queries';
import { useDeleteOrderBooker } from '../api/mutations';
import { OrderBookerTable } from '../components/order-booker-table';
import { OrderBookerForm } from '../components/order-booker-form';
import type { OrderBooker } from '../types';

const { Search } = Input;

export const OrderBookersListPage: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingOrderBooker, setEditingOrderBooker] = useState<OrderBooker | null>(null);
  const [searchText, setSearchText] = useState('');

  const { data: orderBookers, isLoading, error } = useOrderBookers({
    search: searchText,
  });
  const deleteMutation = useDeleteOrderBooker();

  const handleAdd = () => {
    setEditingOrderBooker(null);
    setIsModalVisible(true);
  };

  const handleEdit = (orderBooker: OrderBooker) => {
    setEditingOrderBooker(orderBooker);
    setIsModalVisible(true);
  };

  const handleDelete = async (orderBooker: OrderBooker) => {
    try {
      await deleteMutation.mutateAsync(orderBooker.id);
      message.success('Order booker deleted successfully');
    } catch (error) {
      message.error('Failed to delete order booker');
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setEditingOrderBooker(null);
  };

  const handleFormSuccess = () => {
    handleModalClose();
    message.success(
      editingOrderBooker
        ? 'Order booker updated successfully'
        : 'Order booker created successfully'
    );
  };

  if (error) {
    return <div>Error loading order bookers</div>;
  }

  return (
    <div>
      <Card
        title="Order Bookers"
        extra={
          <Space>
            <Search
              placeholder="Search order bookers..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Add Order Booker
            </Button>
          </Space>
        }
      >
        <OrderBookerTable
          data={orderBookers || []}
          loading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Card>

      <Modal
        title={editingOrderBooker ? 'Edit Order Booker' : 'Add Order Booker'}
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={600}
      >
        <OrderBookerForm
          orderBooker={editingOrderBooker}
          onSuccess={handleFormSuccess}
          onCancel={handleModalClose}
        />
      </Modal>
    </div>
  );
};
```

### [x] Task 4.10: Create Order Bookers Feature Index
Create `src/features/order-bookers/index.ts`:
```typescript
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
```

### [x] Task 4.11: Update Router to Use New Order Bookers Page
Update `src/app/router/index.ts` to import and use `OrderBookersListPage` instead of the old `OrderBookers` component.

### [x] Task 4.12: Clean Up Old Order Bookers Files
After verifying the new implementation works:
- [x] Delete `src/pages/OrderBookers.tsx`
- [x] Delete `src/hooks/useOrderBookers.ts`
- [x] Delete `src/services/api/orderBookerService.ts`
- [x] Remove order booker types from `src/types/index.ts`

## Phase 5: Migrate Remaining Features

### [x] Task 5.1: Migrate Daily Entries Feature
Apply the same pattern as Order Bookers:
- [x] Create `src/features/daily-entries/` structure
- [x] Create daily entry types, API layer (queries, mutations, service)
- [x] Create daily entry components (form, table)
- [x] Create daily entries list page
- [x] Create feature index with exports
- [x] Update router to use new daily entries page
- [ ] Clean up old files

**Completed Components:**
- `DailyEntryForm` - Form for creating/editing daily entries
- `DailyEntryTable` - Table component with search and actions
- `DailyEntriesListPage` - Main page with filters, stats, and CRUD operations
- Complete API layer with queries, mutations, and service
- Proper TypeScript types and query key management

### [x] Task 5.2: Migrate Monthly Targets Feature
Apply the same pattern as Order Bookers:
- [x] Create `src/features/monthly-targets/` structure
- [x] Create monthly target types, API layer (queries, mutations, service)
- [x] Create monthly target components (form, table)
- [x] Create monthly targets list page with advanced features
- [x] Create feature index with exports
- [x] Update router to use new monthly targets page
- [ ] Clean up old files

**Completed Components:**
- `MonthlyTargetForm` - Form for creating/editing monthly targets
- `MonthlyTargetTable` - Table with progress indicators and status tags
- `MonthlyTargetsListPage` - Advanced page with statistics, progress overview, and copy functionality
- Complete API layer including batch operations and copy from previous month
- Achievement tracking and performance indicators

### [ ] Task 5.3: Migrate Reports Feature
Apply the same pattern as Order Bookers:
- [ ] Create `src/features/reports/` structure
- [ ] Move report types, services, hooks, and components
- [ ] Update router
- [ ] Clean up old files

### [ ] Task 5.4: Migrate Dashboard Feature
Apply the same pattern as Order Bookers:
- [ ] Create `src/features/dashboard/` structure
- [ ] Move dashboard types, services, hooks, and components
- [ ] Update router
- [ ] Clean up old files

## Phase 6: Testing Infrastructure (Final Phase)

### [ ] Task 6.1: Add Testing Dependencies
```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/ui msw @faker-js/faker factory-ts
```

### [ ] Task 6.2: Create Vitest Configuration
Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    globals: true,
  },
});
```

### [ ] Task 6.3: Create Test Setup
Create `src/__tests__/setup.ts`:
```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Tauri APIs
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### [ ] Task 6.4: Create Test Utilities
Create `src/__tests__/utils/test-utils.tsx`:
```typescript
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider>
        {children}
      </ConfigProvider>
    </QueryClientProvider>
  );
};

const customRender = (ui: React.ReactElement, options?: RenderOptions) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### [ ] Task 6.5: Create Mock Data Factories
Create `src/__tests__/factories/order-booker.factory.ts`:
```typescript
import { faker } from '@faker-js/faker';
import { Factory } from 'factory-ts';
import type { OrderBooker } from '../../features/order-bookers/types';

export const orderBookerFactory = Factory.define<OrderBooker>(() => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  nameUrdu: faker.person.fullName(),
  phone: `+92-${faker.string.numeric(3)}-${faker.string.numeric(7)}`,
  email: faker.internet.email(),
  joinDate: faker.date.past(),
  isActive: faker.datatype.boolean(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  currentMonthTarget: faker.number.int({ min: 10000, max: 100000 }),
  currentMonthAchieved: faker.number.int({ min: 0, max: 50000 }),
  currentMonthRemaining: faker.number.int({ min: 0, max: 50000 }),
  currentMonthAchievementPercentage: faker.number.float({ min: 0, max: 100 }),
}));
```

### [ ] Task 6.6: Create MSW Handlers
Create `src/__tests__/mocks/handlers.ts`:
```typescript
import { http, HttpResponse } from 'msw';
import { orderBookerFactory } from '../factories/order-booker.factory';

export const handlers = [
  http.get('/api/order-bookers', () => {
    return HttpResponse.json(orderBookerFactory.buildList(5));
  }),
  
  http.post('/api/order-bookers', async ({ request }) => {
    const newOrderBooker = await request.json();
    return HttpResponse.json(orderBookerFactory.build(newOrderBooker));
  }),
  
  http.put('/api/order-bookers/:id', async ({ request, params }) => {
    const updates = await request.json();
    const { id } = params;
    return HttpResponse.json(orderBookerFactory.build({ id, ...updates }));
  }),
  
  http.delete('/api/order-bookers/:id', () => {
    return HttpResponse.json({ success: true });
  }),
];
```

### [ ] Task 6.7: Add Test Scripts to package.json
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

### [ ] Task 6.8: Create Sample Tests
Create `src/features/order-bookers/__tests__/order-booker-form.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../__tests__/utils/test-utils';
import { OrderBookerForm } from '../components/order-booker-form';
import { orderBookerFactory } from '../../../__tests__/factories/order-booker.factory';

describe('OrderBookerForm', () => {
  it('should render form fields', () => {
    render(<OrderBookerForm />);
    
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Name (Urdu)')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    const mockOnSuccess = vi.fn();
    render(<OrderBookerForm onSuccess={mockOnSuccess} />);
    
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText('Name (Urdu)'), {
      target: { value: 'جان ڈو' }
    });
    fireEvent.change(screen.getByLabelText('Phone'), {
      target: { value: '+92-300-1234567' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should populate form when editing', () => {
    const orderBooker = orderBookerFactory.build();
    render(<OrderBookerForm orderBooker={orderBooker} />);
    
    expect(screen.getByDisplayValue(orderBooker.name)).toBeInTheDocument();
    expect(screen.getByDisplayValue(orderBooker.nameUrdu)).toBeInTheDocument();
    expect(screen.getByDisplayValue(orderBooker.phone)).toBeInTheDocument();
  });
});
```

## Execution Notes for AI Agents

### Important Guidelines:
1. **Execute phases in order** - Don't skip to later phases
2. **Complete all tasks in a phase** before moving to the next
3. **Test each migration step** - Ensure the app still works after each task
4. **Follow TypeScript best practices** - Use proper typing throughout
5. **Maintain existing functionality** - Don't break current features
6. **Use consistent patterns** - Follow the established patterns for each feature migration

### Validation Steps:
After completing each phase:
- [ ] Run `pnpm lint` to ensure code quality
- [ ] Run `pnpm type-check` to ensure TypeScript compliance
- [ ] Run `pnpm dev` to ensure app starts correctly
- [ ] Test the migrated features manually
- [ ] Run tests (once testing infrastructure is complete)

### Migration Success Criteria:
- [ ] All features work exactly as before
- [ ] Code is properly organized in vertical slices
- [ ] TypeScript types are properly defined
- [ ] Tests pass (after Phase 6)
- [ ] No console errors
- [ ] Performance is maintained or improved

This migration will result in a well-structured, maintainable, and testable codebase that supports rapid feature development and AI agent collaboration.