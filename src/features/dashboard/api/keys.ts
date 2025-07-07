import type { DashboardFilters } from '../types';

export const dashboardQueryKeys = {
  dashboard: {
    all: ['dashboard'] as const,
    data: () => [...dashboardQueryKeys.dashboard.all, 'data'] as const,
    dataFiltered: (filters?: DashboardFilters) => [...dashboardQueryKeys.dashboard.data(), filters] as const,
    layout: () => [...dashboardQueryKeys.dashboard.all, 'layout'] as const,
    alerts: () => [...dashboardQueryKeys.dashboard.all, 'alerts'] as const,
  },
};
