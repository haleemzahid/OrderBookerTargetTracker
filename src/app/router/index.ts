import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import MainLayout from '../../components/layouts/MainLayout';
import Dashboard from '../../pages/Dashboard';
import { OrderBookersListPage } from '../../features/order-bookers';
import { DailyEntriesListPage } from '../../features/daily-entries';
import { MonthlyTargetsListPage } from '../../features/monthly-targets';
import Reports from '../../pages/Reports';

const rootRoute = createRootRoute({
  component: MainLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: OrderBookersListPage,
});

const orderBookersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/order-bookers',
  component: OrderBookersListPage,
});

const dailyEntriesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/daily-entries',
  component: DailyEntriesListPage,
});

const monthlyTargetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/monthly-targets',
  component: MonthlyTargetsListPage,
});

const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reports',
  component: OrderBookersListPage,
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
