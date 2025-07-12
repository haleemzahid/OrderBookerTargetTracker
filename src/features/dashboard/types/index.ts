/**
 * Core TypeScript interfaces for the dashboard feature
 * Following the comprehensive business intelligence requirements
 */

// Widget system types
export interface DashboardWidget {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'table' | 'alert' | 'progress' | 'gauge';
  size: 'small' | 'medium' | 'large' | 'xlarge';
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  isVisible: boolean;
  refreshInterval?: number; // in milliseconds
  config?: Record<string, any>;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

// Global dashboard filters
export interface GlobalDashboardFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  orderBookerIds?: string[];
  productIds?: string[];
  companyIds?: string[];
}

// Dashboard layout configuration
export interface DashboardLayout {
  layouts: {
    lg: DashboardWidget['position'][];
    md: DashboardWidget['position'][];
    sm: DashboardWidget['position'][];
  };
  widgets: DashboardWidget[];
  lastModified: Date;
}

// Widget data types for business metrics

export interface RevenueMetricData {
  currentMonthRevenue: number;
  targetRevenue: number;
  achievementPercentage: number;
  growthPercentage: number;
  lastMonthRevenue: number;
  trendData: Array<{
    date: string;
    revenue: number;
  }>;
}

export interface ProfitMarginData {
  currentMarginPercentage: number;
  targetMarginPercentage: number;
  marginTrend: 'up' | 'down' | 'stable';
  totalRevenue: number;
  totalProfit: number;
  variance: number;
  status: 'healthy' | 'warning' | 'critical';
}

export interface TopPerformerData {
  orderBookerId: string;
  orderBookerName: string;
  targetAmount: number;
  achievedAmount: number;
  achievementPercentage: number;
  trend: 'up' | 'down' | 'stable';
  rank: number;
  ordersCount: number;
}

export interface SalesTrendData {
  dailySales: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
  movingAverages: {
    sevenDay: number;
    thirtyDay: number;
  };
  seasonalPattern?: 'weekend-low' | 'midweek-peak' | 'end-month-rush';
}

export interface ProductPerformanceData {
  productId: string;
  productName: string;
  salesVolume: number; // in cartons
  profitMargin: number; // percentage
  totalRevenue: number;
  returnRate: number;
  category: string;
  companyName: string;
  performance: 'star' | 'problem' | 'question-mark' | 'cash-cow';
}

export interface ReturnRateData {
  overallReturnRate: number;
  threshold: number;
  status: 'normal' | 'warning' | 'critical';
  trend: 'improving' | 'worsening' | 'stable';
  byProduct: Array<{
    productId: string;
    productName: string;
    returnRate: number;
    returnCartons: number;
    totalCartons: number;
  }>;
  byOrderBooker: Array<{
    orderBookerId: string;
    orderBookerName: string;
    returnRate: number;
    returnCartons: number;
    totalCartons: number;
  }>;
}

export interface TargetProgressData {
  orderBookerId: string;
  orderBookerName: string;
  targetAmount: number;
  achievedAmount: number;
  achievementPercentage: number;
  daysRemaining: number;
  requiredDailyAverage: number;
  currentDailyAverage: number;
  status: 'on-track' | 'at-risk' | 'behind' | 'ahead';
  projectedAchievement: number;
}

export interface CashFlowData {
  netSalesVsReturns: {
    netSales: number;
    returns: number;
    ratio: number;
  };
  outstandingAmount: number;
  averageCollectionDays: number;
  cashFlowTrend: Array<{
    date: string;
    inflow: number;
    outflow: number;
    net: number;
  }>;
}

export interface OrderVelocityData {
  averageOrdersPerDay: number;
  averageProcessingTime: number; // in days
  pendingOrdersCount: number;
  agingBreakdown: {
    lessThan7Days: number;
    between7And14Days: number;
    between14And30Days: number;
    moreThan30Days: number;
  };
  velocityTrend: Array<{
    date: string;
    ordersCount: number;
    averageProcessingTime: number;
  }>;
}

export interface DashboardAlert {
  id: string;
  type: 'high-return-rate' | 'target-miss-risk' | 'unusual-pattern' | 'system-health';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  value?: number;
  threshold?: number;
  timestamp: Date;
  relatedEntity?: {
    type: 'order-booker' | 'product' | 'company';
    id: string;
    name: string;
  };
  actionRequired: boolean;
  isRead: boolean;
}

export interface AlertCenterData {
  alerts: DashboardAlert[];
  unreadCount: number;
  criticalCount: number;
  summary: {
    highReturnRateAlerts: number;
    targetMissRiskAlerts: number;
    unusualPatternAlerts: number;
    systemHealthAlerts: number;
  };
}

// Dashboard templates
export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  isDefault: boolean;
  category: 'overview' | 'sales' | 'financial' | 'operations';
}

// Widget configuration types
export interface WidgetConfigOptions {
  refreshInterval: number;
  colorTheme: 'default' | 'success' | 'warning' | 'error';
  showTrends: boolean;
  showComparisons: boolean;
  alertThresholds?: Record<string, number>;
  chartType?: 'line' | 'bar' | 'area' | 'pie';
  displayFormat?: 'percentage' | 'currency' | 'number';
}

// API response types
export interface DashboardApiResponse<T> {
  data: T;
  lastUpdated: Date;
  status: 'success' | 'error' | 'loading';
  error?: string;
}

// Store state types
export interface DashboardStore {
  // Filters
  filters: GlobalDashboardFilters;
  setFilters: (filters: Partial<GlobalDashboardFilters>) => void;
  
  // Widgets
  widgets: DashboardWidget[];
  setWidgetVisibility: (widgetId: string, isVisible: boolean) => void;
  updateWidgetPosition: (widgetId: string, position: DashboardWidget['position']) => void;
  updateWidgetConfig: (widgetId: string, config: Record<string, any>) => void;
  
  // Layout
  layout: DashboardLayout;
  saveLayout: (layout: DashboardLayout) => void;
  loadTemplate: (template: DashboardTemplate) => void;
  resetToDefault: () => void;
  
  // State
  isLoading: boolean;
  lastRefresh: Date | null;
  refreshAll: () => void;
}

// Business intelligence insights
export interface BusinessInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'achievement' | 'recommendation';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: 'revenue' | 'cost' | 'efficiency' | 'quality';
  estimatedValue?: number;
  actionItems: string[];
  relatedMetrics: string[];
  generatedAt: Date;
}

// Types are already exported above with interface declarations
// No need for additional export type statement
