import { useQuery } from '@tanstack/react-query';
import { dailySalesReportService } from './service';
import { queryKeys } from './keys';
import type { DailySalesReportFilters } from '../types';

export const useDailySalesReport = (filters?: DailySalesReportFilters) => {
  return useQuery({
    queryKey: queryKeys.dailySalesReport.list(filters),
    queryFn: () => dailySalesReportService.getDailySalesReport(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useDailySalesReportSummary = (filters?: DailySalesReportFilters) => {
  return useQuery({
    queryKey: queryKeys.dailySalesReport.summary(filters),
    queryFn: () => dailySalesReportService.getDailySalesReportSummary(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
