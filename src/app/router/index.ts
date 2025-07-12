import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import MainLayout from '../../components/layouts/MainLayout';
import { OrderBookersListPage } from '../../features/order-bookers';
import { MonthlyTargetsListPage } from '../../features/monthly-targets';
import { CompaniesListPage } from '../../features/companies/pages/CompaniesListPage';
import { ProductsListPage } from '../../features/products/pages/products-list';
import { OrdersListPage, OrderFormPage } from '../../features/orders';
import { DailySalesReportListPage } from '../../features/daily-sales-report';
import { DashboardPage } from '../../features/dashboard';

const rootRoute = createRootRoute({
  component: MainLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
});

const orderBookersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/order-bookers',
  component: OrderBookersListPage,
});

const dailyEntriesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/daily-entries',
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

const dailySalesReportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/daily-sales-report',
  component: DailySalesReportListPage,
});

const dsrRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dsr',
  component: DailySalesReportListPage,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  orderBookersRoute,
  dailyEntriesRoute,
  monthlyTargetsRoute,
  companiesRoute,
  productsRoute,
  ordersRoute,
  orderCreateRoute,
  orderEditRoute,
  dailySalesReportRoute,
  dsrRoute
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
