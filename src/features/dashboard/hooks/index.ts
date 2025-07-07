import React, { useState, useMemo } from 'react';
import { useDashboardData } from '../api/queries';
import { useRefreshDashboard, useDismissAlert } from '../api/mutations';
import type { DashboardFilters, DashboardCard, QuickAction } from '../types';
import { 
  TeamOutlined, 
  DollarOutlined, 
  InboxOutlined, 
  RiseOutlined, 
  FallOutlined,
  PlusOutlined,
  FileSearchOutlined,
  SettingOutlined,
  BarChartOutlined
} from '@ant-design/icons';

export const useDashboardFilters = (initialFilters?: DashboardFilters) => {
  const [filters, setFilters] = useState<DashboardFilters>(initialFilters || {});

  const updateFilters = (newFilters: Partial<DashboardFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({});
  };

  return {
    filters,
    updateFilters,
    resetFilters,
    setFilters,
  };
};

export const useDashboardCards = (filters?: DashboardFilters) => {
  const { data: dashboardData, isLoading, error } = useDashboardData(filters);

  const cards = useMemo((): DashboardCard[] => {
    if (!dashboardData) return [];

    return [
      {
        id: 'total-order-bookers',
        title: 'Total Order Bookers',
        value: dashboardData.totalOrderBookers,
        formatter: 'number',
        prefix: <TeamOutlined />,
        color: '#3f8600',
        description: `${dashboardData.activeOrderBookers} active, ${dashboardData.inactiveOrderBookers} inactive`,
        span: 6,
      },
      {
        id: 'total-sales',
        title: 'Total Sales',
        value: dashboardData.totalSales,
        formatter: 'currency',
        prefix: <DollarOutlined />,
        color: '#1890ff',
        trend: {
          value: dashboardData.salesGrowth,
          direction: dashboardData.salesGrowth >= 0 ? 'up' : 'down',
          isPositive: dashboardData.salesGrowth >= 0,
        },
        span: 6,
      },
      {
        id: 'net-sales',
        title: 'Net Sales',
        value: dashboardData.netSales,
        formatter: 'currency',
        prefix: dashboardData.netSalesGrowth >= 0 ? <RiseOutlined /> : <FallOutlined />,
        color: dashboardData.netSalesGrowth >= 0 ? '#3f8600' : '#cf1322',
        trend: {
          value: dashboardData.netSalesGrowth,
          direction: dashboardData.netSalesGrowth >= 0 ? 'up' : 'down',
          isPositive: dashboardData.netSalesGrowth >= 0,
        },
        span: 6,
      },
      {
        id: 'total-cartons',
        title: 'Total Cartons',
        value: dashboardData.totalCartons,
        formatter: 'number',
        prefix: <InboxOutlined />,
        color: '#722ed1',
        description: `${dashboardData.netCartons} net cartons`,
        span: 6,
      },
      {
        id: 'target-achievement',
        title: 'Target Achievement',
        value: dashboardData.monthlyTargets.achievementPercentage,
        formatter: 'percentage',
        suffix: '%',
        color: dashboardData.monthlyTargets.achievementPercentage >= 80 ? '#3f8600' : '#faad14',
        description: `${dashboardData.monthlyTargets.onTrackCount} on track, ${dashboardData.monthlyTargets.behindCount} behind`,
        span: 12,
      },
    ];
  }, [dashboardData]);

  return {
    cards,
    isLoading,
    error,
  };
};

export const useQuickActions = (): QuickAction[] => {
  return useMemo(() => [
    {
      id: 'add-order-booker',
      title: 'Add Order Booker',
      icon: <PlusOutlined />,
      description: 'Create a new order booker',
      href: '/order-bookers?action=create',
      color: '#1890ff',
    },
    {
      id: 'daily-entry',
      title: 'Daily Entry',
      icon: <FileSearchOutlined />,
      description: 'Record daily sales and returns',
      href: '/daily-entries?action=create',
      color: '#52c41a',
    },
    {
      id: 'monthly-targets',
      title: 'Set Targets',
      icon: <BarChartOutlined />,
      description: 'Set monthly targets for order bookers',
      href: '/monthly-targets?action=create',
      color: '#fa8c16',
    },
    {
      id: 'reports',
      title: 'View Reports',
      icon: <FileSearchOutlined />,
      description: 'Generate and view reports',
      href: '/reports',
      color: '#722ed1',
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: <SettingOutlined />,
      description: 'Configure application settings',
      href: '/settings',
      color: '#8c8c8c',
    },
  ], []);
};

export const useDashboardActions = () => {
  const refreshMutation = useRefreshDashboard();
  const dismissAlertMutation = useDismissAlert();

  const refreshDashboard = () => {
    refreshMutation.mutate();
  };

  const dismissAlert = (alertId: string) => {
    dismissAlertMutation.mutate(alertId);
  };

  return {
    refreshDashboard,
    dismissAlert,
    isRefreshing: refreshMutation.isPending,
    isDismissing: dismissAlertMutation.isPending,
    refreshError: refreshMutation.error,
    dismissError: dismissAlertMutation.error,
  };
};
