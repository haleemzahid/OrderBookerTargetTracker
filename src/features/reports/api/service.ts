import { invoke } from '@tauri-apps/api/core';
import type { 
  PerformanceData, 
  ReportFilters, 
  DailyReportData, 
  MonthlyReportData, 
  ComparisonReportData, 
  ReportAnalytics, 
  ReportDashboard,
  ReportExportOptions 
} from '../types';

export interface IReportsService {
  getPerformanceReport(filters?: ReportFilters): Promise<PerformanceData[]>;
  getDailyReport(filters?: ReportFilters): Promise<DailyReportData[]>;
  getMonthlyReport(filters?: ReportFilters): Promise<MonthlyReportData[]>;
  getComparisonReport(filters?: ReportFilters): Promise<ComparisonReportData>;
  getReportAnalytics(filters?: ReportFilters): Promise<ReportAnalytics>;
  getReportDashboard(filters?: ReportFilters): Promise<ReportDashboard>;
  exportReport(data: any[], options: ReportExportOptions): Promise<string>;
  getReportTemplate(type: 'performance' | 'target-achievement' | 'daily-summary' | 'monthly-overview'): Promise<any>;
}

export const reportsService: IReportsService = {
  getPerformanceReport: async (filters) => {
    return await invoke<PerformanceData[]>('get_performance_report', { filters });
  },

  getDailyReport: async (filters) => {
    return await invoke<DailyReportData[]>('get_daily_report', { filters });
  },

  getMonthlyReport: async (filters) => {
    return await invoke<MonthlyReportData[]>('get_monthly_report', { filters });
  },

  getComparisonReport: async (filters) => {
    return await invoke<ComparisonReportData>('get_comparison_report', { filters });
  },

  getReportAnalytics: async (filters) => {
    return await invoke<ReportAnalytics>('get_report_analytics', { filters });
  },

  getReportDashboard: async (filters) => {
    return await invoke<ReportDashboard>('get_report_dashboard', { filters });
  },

  exportReport: async (data, options) => {
    return await invoke<string>('export_report', { data, options });
  },

  getReportTemplate: async (type) => {
    return await invoke<any>('get_report_template', { type });
  },
};
