import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { dashboardService } from './service';
import { dashboardQueryKeys } from './keys';
import type { DashboardLayout } from '../types';

export const useSaveDashboardLayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (layout: DashboardLayout) => dashboardService.saveDashboardLayout(layout),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.dashboard.layout() });
      message.success('Dashboard layout saved successfully');
    },
    onError: (error) => {
      message.error(`Failed to save dashboard layout: ${error}`);
    },
  });
};

export const useRefreshDashboard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dashboardService.refreshDashboard(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.dashboard.all });
      message.success('Dashboard refreshed successfully');
    },
    onError: (error) => {
      message.error(`Failed to refresh dashboard: ${error}`);
    },
  });
};

export const useDismissAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => dashboardService.dismissAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.dashboard.data() });
    },
    onError: (error) => {
      message.error(`Failed to dismiss alert: ${error}`);
    },
  });
};
