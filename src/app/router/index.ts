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
