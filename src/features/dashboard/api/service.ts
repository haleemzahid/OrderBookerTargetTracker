import { invoke } from '@tauri-apps/api/core';
import type { DashboardData, DashboardFilters, DashboardLayout } from '../types';

export interface IDashboardService {
  getDashboardData(filters?: DashboardFilters): Promise<DashboardData>;
  getDashboardLayout(): Promise<DashboardLayout>;
  saveDashboardLayout(layout: DashboardLayout): Promise<void>;
  refreshDashboard(): Promise<void>;
  dismissAlert(alertId: string): Promise<void>;
}

export const dashboardService: IDashboardService = {
  getDashboardData: async (filters) => {
    return await invoke<DashboardData>('get_dashboard_data', { filters });
  },

  getDashboardLayout: async () => {
    return await invoke<DashboardLayout>('get_dashboard_layout');
  },

  saveDashboardLayout: async (layout) => {
    await invoke<void>('save_dashboard_layout', { layout });
  },

  refreshDashboard: async () => {
    await invoke<void>('refresh_dashboard');
  },

  dismissAlert: async (alertId) => {
    await invoke<void>('dismiss_alert', { alertId });
  },
};
