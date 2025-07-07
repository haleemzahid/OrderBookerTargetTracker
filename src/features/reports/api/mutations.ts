import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { reportsService } from './service';
import { reportQueryKeys } from './keys';
import type { ReportExportOptions } from '../types';

export const useExportReport = () => {
  return useMutation({
    mutationFn: ({ data, options }: { data: any[]; options: ReportExportOptions }) =>
      reportsService.exportReport(data, options),
    onSuccess: (filePath) => {
      message.success(`Report exported successfully to ${filePath}`);
    },
    onError: (error) => {
      message.error(`Failed to export report: ${error}`);
    },
  });
};

export const useRefreshReports = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Invalidate all report queries to force refresh
      await queryClient.invalidateQueries({ queryKey: reportQueryKeys.reports.all });
      return true;
    },
    onSuccess: () => {
      message.success('Reports refreshed successfully');
    },
    onError: (error) => {
      message.error(`Failed to refresh reports: ${error}`);
    },
  });
};
