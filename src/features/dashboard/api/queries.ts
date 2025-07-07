import { useQuery } from '@tanstack/react-query';
import { dashboardService } from './service';
import { dashboardQueryKeys } from './keys';
import type { DashboardFilters } from '../types';

export const useDashboardData = (filters?: DashboardFilters) => {
  return useQuery({
    queryKey: dashboardQueryKeys.dashboard.dataFiltered(filters),
    queryFn: () => dashboardService.getDashboardData(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    refetchIntervalInBackground: true,
  });
};


