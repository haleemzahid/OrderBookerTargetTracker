# Copilot Instructions for Tauri + React + TypeScript Desktop App

## Project Overview
This is a modular desktop application built with Tauri (Rust backend), React (frontend), and TypeScript. The app uses SQLite for data persistence via Tauri's JavaScript/TypeScript plugins.

### Core Libraries Used
- **UI Framework**: Ant Design (antd) - Enterprise-grade UI components with RTL/LTR support
- **State Management**: TanStack React Query - Server state management with caching
- **Routing**: TanStack React Router - Type-safe routing with nested layouts
- **Date Handling**: Day.js - Lightweight date manipulation library
- **Database**: SQLite via @tauri-apps/plugin-sql
- **Icons**: Ant Design Icons
- **Internationalization**: Built-in Ant Design i18n support
- **Package Manager**: PNPM

## General Guidelines

### Code Quality
- **NO AI COMMENTS**: Never add comments like "// AI generated code" or "// This is an AI suggestion". Write clean, self-documenting code.
- Use meaningful variable and function names that describe their purpose
- Prefer explicit types over `any` or implicit types
- Use proper error handling with try-catch blocks or Result types
- Follow consistent naming conventions throughout the codebase

### Architecture Principles
- **Modular Design**: Organize code into logical modules with clear boundaries
- **Single Responsibility**: Each component/function should have one clear purpose
- **Dependency Injection**: Use dependency injection for better testability
- **Separation of Concerns**: Keep business logic separate from UI components

## TypeScript Best Practices

### Type Definitions
```typescript
// Use interfaces for object shapes
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

// Use type aliases for unions and primitives
type Status = 'pending' | 'approved' | 'rejected';
type UserId = number;

// Use enums for constants
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}
```

### Function Signatures
```typescript
// Use proper return types
const fetchUser = async (id: UserId): Promise<User | null> => {
  // Implementation
};

// Use generic types for reusable functions
const createApiCall = <T>(endpoint: string): Promise<T> => {
  // Implementation
};
```

### Error Handling
```typescript
// Use Result pattern for error handling
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Use proper error types
class DatabaseError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}
```

## React Best Practices

### Component Structure with Ant Design
```typescript
// Use Ant Design components with proper TypeScript
import { Button, Form, Input, Table, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

interface Props {
  title: string;
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;
}

const MyComponent: React.FC<Props> = ({ title, onSubmit, isLoading = false }) => {
  const [form] = Form.useForm();
  
  return (
    <Card title={title}>
      <Form form={form} onFinish={onSubmit} layout="vertical">
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: 'Please input name!' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};
```

### State Management with TanStack React Query
```typescript
// Use React Query for server state management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query keys should be consistent and hierarchical
const queryKeys = {
  users: ['users'] as const,
  user: (id: number) => ['users', id] as const,
  userOrders: (userId: number) => ['users', userId, 'orders'] as const,
};

// Custom hooks for data fetching
const useUsers = () => {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: () => userService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

const useUser = (id: number) => {
  return useQuery({
    queryKey: queryKeys.user(id),
    queryFn: () => userService.getById(id),
    enabled: !!id,
  });
};

// Mutations with optimistic updates
const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (user: CreateUserRequest) => userService.create(user),
    onSuccess: (newUser) => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      
      // Optionally add the new user to the cache
      queryClient.setQueryData(queryKeys.user(newUser.id), newUser);
    },
    onError: (error) => {
      // Handle error (toast notification, etc.)
      console.error('Failed to create user:', error);
    },
  });
};
```

### Routing with TanStack React Router
```typescript
// Define route structure with type safety
import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';

// Root route with layout
const rootRoute = createRootRoute({
  component: () => (
    <div>
      <Header />
      <Layout>
        <Sidebar />
        <Content>
          <Outlet />
        </Content>
      </Layout>
    </div>
  ),
});

// Dashboard route
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
});

// Users route with search params
const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  component: Users,
  validateSearch: (search) => ({
    page: Number(search.page) || 1,
    pageSize: Number(search.pageSize) || 10,
    search: search.search || '',
  }),
});

// User detail route with params
const userRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$userId',
  component: UserDetail,
  loader: ({ params, context }) => {
    // Prefetch user data
    return context.queryClient.ensureQueryData({
      queryKey: ['users', params.userId],
      queryFn: () => userService.getById(params.userId),
    });
  },
});

// Create router
const routeTree = rootRoute.addChildren([
  dashboardRoute,
  usersRoute,
  userRoute,
]);

export const router = createRouter({ routeTree });
```

### State Management
```typescript
// Use TanStack React Query for server state
// Use React's built-in state for local/UI state
const [localState, setLocalState] = useState<string>('');
const [filters, setFilters] = useState<FilterState>({
  search: '',
  status: 'all',
  dateRange: null,
});

// Combine server and local state
const MyComponent = () => {
  const { data: users, isLoading, error } = useUsers();
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  
  return (
    <div>
      {/* Component implementation */}
    </div>
  );
};
```

### Custom Hooks
```typescript
// Create reusable custom hooks combining React Query and local state
const useOrderBookers = (filters?: OrderBookerFilters) => {
  return useQuery({
    queryKey: ['orderBookers', filters],
    queryFn: () => orderBookerService.getAll(filters),
    staleTime: 5 * 60 * 1000,
  });
};

const useOrderBookerForm = (initialData?: OrderBooker) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  
  const createMutation = useMutation({
    mutationFn: orderBookerService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orderBookers'] });
      form.resetFields();
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderBookerRequest }) => 
      orderBookerService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orderBookers'] });
    },
  });
  
  const handleSubmit = (values: FormData) => {
    if (initialData) {
      updateMutation.mutate({ id: initialData.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };
  
  return {
    form,
    handleSubmit,
    isLoading: createMutation.isPending || updateMutation.isPending,
    error: createMutation.error || updateMutation.error,
  };
};
```

## Tauri Integration Best Practices

### Tauri Commands with React Query
```typescript
// Use proper types for Tauri commands
interface CreateOrderBookerRequest {
  name: string;
  nameUrdu: string;
  phone: string;
  email?: string;
  territory?: string;
}

interface CreateOrderBookerResponse {
  id: string;
  success: boolean;
  message?: string;
}

// Wrapper functions for Tauri commands
export const createOrderBooker = async (request: CreateOrderBookerRequest): Promise<CreateOrderBookerResponse> => {
  return await invoke<CreateOrderBookerResponse>('create_order_booker', { request });
};

// Service layer that uses Tauri commands
export const orderBookerService = {
  getAll: async (filters?: OrderBookerFilters): Promise<OrderBooker[]> => {
    return await invoke<OrderBooker[]>('get_order_bookers', { filters });
  },
  
  getById: async (id: string): Promise<OrderBooker | null> => {
    return await invoke<OrderBooker | null>('get_order_booker_by_id', { id });
  },
  
  create: async (data: CreateOrderBookerRequest): Promise<OrderBooker> => {
    return await invoke<OrderBooker>('create_order_booker', { data });
  },
  
  update: async (id: string, data: UpdateOrderBookerRequest): Promise<OrderBooker> => {
    return await invoke<OrderBooker>('update_order_booker', { id, data });
  },
  
  delete: async (id: string): Promise<void> => {
    await invoke<void>('delete_order_booker', { id });
  },
};
```

### SQLite Integration (Handled in Rust Backend)
```typescript
// Database operations are handled in Rust backend via Tauri commands
// Frontend uses service layer to interact with backend

// Service layer abstracts Tauri commands
export const dailyEntryService = {
  getByMonth: async (year: number, month: number): Promise<DailyEntry[]> => {
    return await invoke<DailyEntry[]>('get_daily_entries_by_month', { year, month });
  },
  
  getByOrderBooker: async (orderBookerId: string, dateRange?: DateRange): Promise<DailyEntry[]> => {
    return await invoke<DailyEntry[]>('get_daily_entries_by_order_booker', { 
      orderBookerId, 
      dateRange 
    });
  },
  
  create: async (entry: CreateDailyEntryRequest): Promise<DailyEntry> => {
    return await invoke<DailyEntry>('create_daily_entry', { entry });
  },
  
  batchCreate: async (entries: CreateDailyEntryRequest[]): Promise<DailyEntry[]> => {
    return await invoke<DailyEntry[]>('batch_create_daily_entries', { entries });
  },
  
  update: async (id: string, entry: UpdateDailyEntryRequest): Promise<DailyEntry> => {
    return await invoke<DailyEntry>('update_daily_entry', { id, entry });
  },
  
  delete: async (id: string): Promise<void> => {
    await invoke<void>('delete_daily_entry', { id });
  },
  
  // Analytics queries
  getMonthlyAnalytics: async (year: number, month: number): Promise<MonthlyAnalytics> => {
    return await invoke<MonthlyAnalytics>('get_monthly_analytics', { year, month });
  },
};
```

## Project Structure

### Recommended Directory Structure
```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components (Loading, ErrorBoundary, etc.)
│   ├── forms/           # Form components with Ant Design
│   ├── tables/          # Table components with Ant Design
│   └── layouts/         # Layout components (Header, Sidebar, etc.)
├── pages/               # Page components (route components)
│   ├── dashboard/       # Dashboard page
│   ├── order-bookers/   # Order booker management pages
│   ├── daily-entries/   # Daily entry management pages
│   └── reports/         # Analytics and reports pages
├── hooks/               # Custom React hooks
│   ├── queries/         # React Query hooks
│   ├── mutations/       # React Query mutation hooks
│   └── ui/              # UI-related hooks
├── services/            # API and business logic
│   ├── api/             # Tauri command wrappers
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── routes/              # TanStack Router route definitions
├── constants/           # Application constants
├── contexts/            # React contexts (theme, i18n, etc.)
└── assets/              # Static assets (images, fonts, etc.)
```

### Module Organization
```typescript
// services/api/orderBookerService.ts
export interface IOrderBookerService {
  getAll(filters?: OrderBookerFilters): Promise<OrderBooker[]>;
  getById(id: string): Promise<OrderBooker | null>;
  create(data: CreateOrderBookerRequest): Promise<OrderBooker>;
  update(id: string, data: UpdateOrderBookerRequest): Promise<OrderBooker>;
  delete(id: string): Promise<void>;
}

export const orderBookerService: IOrderBookerService = {
  getAll: async (filters) => {
    return await invoke<OrderBooker[]>('get_order_bookers', { filters });
  },
  
  getById: async (id) => {
    return await invoke<OrderBooker | null>('get_order_booker_by_id', { id });
  },
  
  create: async (data) => {
    return await invoke<OrderBooker>('create_order_booker', { data });
  },
  
  update: async (id, data) => {
    return await invoke<OrderBooker>('update_order_booker', { id, data });
  },
  
  delete: async (id) => {
    await invoke<void>('delete_order_booker', { id });
  },
};

// hooks/queries/useOrderBookers.ts
export const useOrderBookers = (filters?: OrderBookerFilters) => {
  return useQuery({
    queryKey: ['orderBookers', filters],
    queryFn: () => orderBookerService.getAll(filters),
    staleTime: 5 * 60 * 1000,
  });
};

export const useOrderBooker = (id: string) => {
  return useQuery({
    queryKey: ['orderBookers', id],
    queryFn: () => orderBookerService.getById(id),
    enabled: !!id,
  });
};

// hooks/mutations/useOrderBookerMutations.ts
export const useCreateOrderBooker = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: orderBookerService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orderBookers'] });
    },
  });
};
```

## State Management Architecture

### React Query + Local State Pattern
```typescript
// Use React Query for server state, local state for UI state
const OrderBookerManagement = () => {
  // Server state via React Query
  const { data: orderBookers, isLoading } = useOrderBookers();
  const createMutation = useCreateOrderBooker();
  
  // Local UI state
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrderBooker, setEditingOrderBooker] = useState<OrderBooker | null>(null);
  
  // Derived state
  const filteredData = useMemo(() => {
    return orderBookers?.filter(ob => 
      ob.name.toLowerCase().includes(searchText.toLowerCase()) ||
      ob.nameUrdu.includes(searchText)
    ) || [];
  }, [orderBookers, searchText]);
  
  return (
    <div>
      {/* Component implementation */}
    </div>
  );
};
```

### Global State with Context (for app-wide state)
```typescript
// contexts/AppContext.tsx
interface AppContextType {
  theme: 'light' | 'dark';
  language: 'en' | 'ur';
  direction: 'ltr' | 'rtl';
  toggleTheme: () => void;
  setLanguage: (lang: 'en' | 'ur') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<'en' | 'ur'>('en');
  
  const direction = language === 'ur' ? 'rtl' : 'ltr';
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  const value = useMemo(() => ({
    theme,
    language,
    direction,
    toggleTheme,
    setLanguage,
  }), [theme, language, direction]);

  return (
    <AppContext.Provider value={value}>
      <ConfigProvider
        theme={{
          algorithm: theme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        }}
        direction={direction}
        locale={language === 'ur' ? urPK : enUS}
      >
        {children}
      </ConfigProvider>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
```

## Error Handling Strategy

### Global Error Boundary
```typescript
// components/ErrorBoundary.tsx
interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}
```

## Performance Optimization

### React Performance
```typescript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo<Props>(({ data }) => {
  return <div>{/* Complex rendering */}</div>;
});

// Use useMemo for expensive calculations
const processedData = useMemo(() => {
  return data.map(item => expensiveProcess(item));
}, [data]);

// Use useCallback for event handlers
const handleClick = useCallback((id: number) => {
  onItemClick(id);
}, [onItemClick]);
```

### Code Splitting
```typescript
// Lazy load components
const UserDashboard = React.lazy(() => import('./pages/UserDashboard'));
const Settings = React.lazy(() => import('./pages/Settings'));

// Use Suspense for loading states
<Suspense fallback={<LoadingSpinner />}>
  <UserDashboard />
</Suspense>
```

## Testing Guidelines

### Component Testing
```typescript
// Use React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { UserForm } from './UserForm';

describe('UserForm', () => {
  it('should submit form with valid data', async () => {
    const mockOnSubmit = jest.fn();
    render(<UserForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'John Doe' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'John Doe'
    });
  });
});
```

## Security Considerations

### Input Validation
```typescript
// Validate all user inputs
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Sanitize data before database operations
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};
```

### Database Security
```typescript
// Always use parameterized queries
const getUserByEmail = async (email: string): Promise<User | null> => {
  const result = await db.select<User[]>(
    'SELECT * FROM users WHERE email = ?',
    [email] // Parameterized query prevents SQL injection
  );
  return result[0] || null;
};
```

## Documentation Standards

### Component Documentation
```typescript
/**
 * UserCard component displays user information in a card layout
 * 
 * @param user - User object containing id, name, and email
 * @param onEdit - Callback function called when edit button is clicked
 * @param onDelete - Callback function called when delete button is clicked
 */
interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (userId: number) => void;
}
```

### API Documentation
```typescript
/**
 * Creates a new user in the database
 * 
 * @param request - User creation request object
 * @returns Promise resolving to the created user
 * @throws DatabaseError when user creation fails
 */
export const createUser = async (request: CreateUserRequest): Promise<User> => {
  // Implementation
};
```

## Development Workflow

### Git Workflow
- Use conventional commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`
- Create feature branches for new functionality
- Use descriptive commit messages
- Squash commits before merging

### Code Review Guidelines
- Review for TypeScript best practices
- Check for proper error handling
- Ensure components are properly typed
- Verify database operations use parameterized queries
- Look for performance optimization opportunities

## Required Dependencies

### Essential Packages
```json
{
  "dependencies": {
    "@tauri-apps/api": "^2",
    "@tauri-apps/plugin-sql": "^2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6",
    "react-hook-form": "^7",
    "zod": "^3",
    "@hookform/resolvers": "^3"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "~5.6.2",
    "vite": "^6.0.3",
    "@tauri-apps/cli": "^2",
    "@testing-library/react": "^14",
    "@testing-library/jest-dom": "^6",
    "jest": "^29",
    "eslint": "^8",
    "@typescript-eslint/eslint-plugin": "^6",
    "@typescript-eslint/parser": "^6"
  }
}
```

Remember: Focus on clean, maintainable, and type-safe code. Always prefer explicit types over implicit ones, and structure your code in a modular way that promotes reusability and testability.
