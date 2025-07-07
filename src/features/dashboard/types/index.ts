export interface DashboardData {
  totalOrderBookers: number;
  activeOrderBookers: number;
  inactiveOrderBookers: number;
  totalSales: number;
  totalReturns: number;
  netSales: number;
  totalCartons: number;
  returnCartons: number;
  netCartons: number;
  currentMonthSales: number;
  currentMonthReturns: number;
  currentMonthNetSales: number;
  previousMonthSales: number;
  previousMonthReturns: number;
  previousMonthNetSales: number;
  salesGrowth: number;
  returnsGrowth: number;
  netSalesGrowth: number;
  topPerformers: Array<{
    id: string;
    name: string;
    nameUrdu: string;
    sales: number;
    returns: number;
    netSales: number;
    cartons: number;
    achievementPercentage: number;
  }>;
  recentActivities: Array<{
    id: string;
    type: 'sale' | 'return' | 'target-set' | 'order-booker-added';
    description: string;
    timestamp: Date;
    orderBookerId?: string;
    orderBookerName?: string;
    amount?: number;
    cartons?: number;
  }>;
  monthlyTargets: {
    totalTarget: number;
    totalAchieved: number;
    totalRemaining: number;
    achievementPercentage: number;
    onTrackCount: number;
    behindCount: number;
    exceededCount: number;
  };
  salesTrends: Array<{
    date: Date;
    sales: number;
    returns: number;
    netSales: number;
    cartons: number;
    activeOrderBookers: number;
  }>;
  alerts: Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    timestamp: Date;
    priority: 'low' | 'medium' | 'high';
    dismissed: boolean;
  }>;
}

export interface DashboardFilters {
  dateRange?: [Date, Date];
  orderBookerIds?: string[];
  includeInactive?: boolean;
  metricsType?: 'sales' | 'cartons' | 'both';
}

export interface DashboardCard {
  id: string;
  title: string;
  value: number;
  formatter?: 'currency' | 'percentage' | 'number';
  prefix?: React.ReactNode;
  suffix?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
    isPositive: boolean;
  };
  color?: string;
  description?: string;
  span?: number;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'chart' | 'table' | 'list' | 'statistic' | 'progress';
  data: any;
  config: any;
  span?: number;
  height?: number;
  order?: number;
  visible?: boolean;
}

export interface DashboardLayout {
  cards: DashboardCard[];
  widgets: DashboardWidget[];
  refreshInterval?: number;
  lastUpdated?: Date;
}

export interface QuickAction {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  color?: string;
}
