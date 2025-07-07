import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { dashboardService } from './service';
import { dashboardQueryKeys } from './keys';

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

