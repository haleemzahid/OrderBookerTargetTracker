import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import MainLayout from '../../components/layouts/MainLayout';
import { OrderBookersListPage } from '../../features/order-bookers';
import { MonthlyTargetsListPage } from '../../features/monthly-targets';
import { CompaniesListPage } from '../../features/companies/pages/CompaniesListPage';
import { ProductsListPage } from '../../features/products/pages/products-list';
import { OrdersListPage, OrderFormPage } from '../../features/orders';
import { DailySalesReportListPage } from '../../features/daily-sales-report';
import { DashboardPage } from '../../features/dashboard';
import { SimpleDashboardPage } from '../../features/simple-dashboard';
import { StockOverview, StockTransactions } from '../../features/stock';
import { CustomerListPage } from '../../features/customers/pages/customer-list-page';
import { CustomerDetailPage } from '../../features/customers/pages/customer-detail-page';

const rootRoute = createRootRoute({
  component: MainLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: SimpleDashboardPage,
});

const biDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bi-dashboard',
  component: DashboardPage,
});

const orderBookersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/order-bookers',
  component: OrderBookersListPage,
});

const monthlyTargetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/monthly-targets',
  component: MonthlyTargetsListPage,
});
const companiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/companies',
  component: CompaniesListPage,
});

const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products',
  component: ProductsListPage,
});

const ordersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders',
  component: OrdersListPage,
});

const orderCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders/create',
  component: OrderFormPage,
});

const orderEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders/$orderId/edit',
  component: OrderFormPage,
});

const dsrRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dsr',
  component: DailySalesReportListPage,
});

const stockOverviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/stock',
  component: StockOverview,
});

const stockTransactionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/stock/transactions',
  component: StockTransactions,
});

const customersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/customers',
  component: CustomerListPage,
});

const customerDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/customers/$customerId',
  component: CustomerDetailPage,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  biDashboardRoute,
  orderBookersRoute,
  monthlyTargetsRoute,
  companiesRoute,
  productsRoute,
  ordersRoute,
  orderCreateRoute,
  orderEditRoute,
  dsrRoute,
  stockOverviewRoute,
  stockTransactionsRoute,
  customersRoute,
  customerDetailRoute
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    routeInfo: {
      routePaths: 
        | '/' 
        | '/bi-dashboard' 
        | '/order-bookers' 
        | '/monthly-targets' 
        | '/companies' 
        | '/products' 
        | '/orders' 
        | '/orders/create' 
        | '/orders/$orderId/edit' 
        | '/dsr' 
        | '/stock' 
        | '/stock/transactions'
        | '/customers'
        | '/customers/$customerId';
    };
  }
}
