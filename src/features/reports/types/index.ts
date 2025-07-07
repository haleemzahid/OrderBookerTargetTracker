export interface PerformanceData {
  orderBooker: {
    id: string;
    name: string;
    nameUrdu: string;
    phone: string;
    email?: string;
    joinDate: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    currentMonthTarget?: number;
    currentMonthAchieved?: number;
    currentMonthRemaining?: number;
    currentMonthAchievementPercentage?: number;
  };
  totalSales: number;
  totalReturns: number;
  netSales: number;
  totalCarton: number;
  returnCarton: number;
  netCarton: number;
  achievementPercentage: number;
  status: 'excellent' | 'good' | 'average' | 'below-average' | 'poor';
  rank: number;
  totalDaysWithSales: number;
  lastSaleDate?: Date;
  averageDailySales: number;
  daysWorked: number;
  daysInactive: number;
  performance: {
    salesGrowth: number;
    consistency: number;
    efficiency: number;
  };
}

export interface ReportFilters {
  dateRange?: [Date, Date];
  orderBookerIds?: string[];
  reportType?: 'performance' | 'target-achievement' | 'daily-summary' | 'monthly-overview';
  includeInactive?: boolean;
  groupBy?: 'daily' | 'weekly' | 'monthly';
}

export interface DailyReportData {
  date: Date;
  totalSales: number;
  totalReturns: number;
  netSales: number;
  totalCarton: number;
  returnCarton: number;
  netCarton: number;
  activeOrderBookers: number;
  avgSalesPerOrderBooker: number;
  topPerformer: {
    name: string;
    sales: number;
  };
  lowestPerformer: {
    name: string;
    sales: number;
  };
}

export interface MonthlyReportData {
  month: Date;
  totalSales: number;
  totalReturns: number;
  netSales: number;
  totalCarton: number;
  returnCarton: number;
  netCarton: number;
  totalTarget: number;
  targetAchievement: number;
  targetAchievementPercentage: number;
  activeOrderBookers: number;
  avgSalesPerOrderBooker: number;
  topPerformers: Array<{
    name: string;
    sales: number;
    achievement: number;
  }>;
  growthRate: number;
  consistencyScore: number;
}

export interface ReportExportOptions {
  format: 'xlsx' | 'csv' | 'pdf';
  includeCharts?: boolean;
  includeDetails?: boolean;
  template?: 'summary' | 'detailed' | 'comparison';
}

export interface ComparisonReportData {
  current: {
    period: string;
    sales: number;
    returns: number;
    netSales: number;
    carton: number;
    achievementPercentage: number;
  };
  previous: {
    period: string;
    sales: number;
    returns: number;
    netSales: number;
    carton: number;
    achievementPercentage: number;
  };
  growth: {
    sales: number;
    returns: number;
    netSales: number;
    carton: number;
    achievement: number;
  };
  trends: {
    direction: 'up' | 'down' | 'stable';
    confidence: number;
    insights: string[];
  };
}

export interface ReportAnalytics {
  totalRevenue: number;
  totalReturns: number;
  netRevenue: number;
  totalCartons: number;
  returnCartons: number;
  netCartons: number;
  orderBookerCount: number;
  activeOrderBookerCount: number;
  avgRevenuePerOrderBooker: number;
  avgCartonsPerOrderBooker: number;
  topPerformerRevenue: number;
  lowPerformerRevenue: number;
  consistencyScore: number;
  growthRate: number;
  returnRate: number;
  efficiency: number;
  marketPenetration: number;
  customerSatisfaction: number;
}

export interface ReportChart {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  title: string;
  data: Array<{
    x: string | number;
    y: number;
    label?: string;
    color?: string;
  }>;
  xAxis?: string;
  yAxis?: string;
  legend?: string[];
}

export interface ReportDashboard {
  title: string;
  subtitle?: string;
  period: string;
  lastUpdated: Date;
  analytics: ReportAnalytics;
  charts: ReportChart[];
  tables: Array<{
    title: string;
    data: any[];
    columns: any[];
  }>;
  alerts: Array<{
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
    description?: string;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    actionable: boolean;
  }>;
}
