import { useQuery } from '@tanstack/react-query';
import { SimpleDashboardService } from '../api/simple-dashboard-service';
import type { SimpleDashboardData, DateRangeFilter } from '../types';

export interface UseDashboardMetricsOptions {
  dateRange?: DateRangeFilter;
  enabled?: boolean;
  refetchInterval?: number;
}

export const useDashboardMetrics = (options: UseDashboardMetricsOptions = {}) => {
  const {
    dateRange,
    enabled = true,
    refetchInterval = 5 * 60 * 1000 // 5 minutes by default
  } = options;

  return useQuery<SimpleDashboardData, Error>({
    queryKey: ['dashboard-metrics', dateRange],
    queryFn: () => SimpleDashboardService.getDashboardMetrics(dateRange),
    enabled,
    refetchInterval,
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors
      if (failureCount >= 3) return false;
      
      // Don't retry for certain errors
      if (error.message.includes('Database not initialized')) return false;
      
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};
