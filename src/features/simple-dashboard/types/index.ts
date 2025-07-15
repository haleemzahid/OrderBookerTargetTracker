export interface DashboardMetrics {
  totalOrderBookers: number;
  thisMonthSales: number;
  thisMonthReturns: number;
  targetAchievement: number;
  totalCartons: number;
  returnCartons: number;
  netCartons: number;
  netSales: number;
}

export interface SimplePerformer {
  orderBookerId: string;
  orderBookerName: string;
  achievementPercentage: number;
  isTopPerformer: boolean;
}

export interface SimpleDashboardData {
  metrics: DashboardMetrics;
  topPerformers: SimplePerformer[];
  needsAttention: SimplePerformer[];
  lastUpdated: Date;
}

export interface DateRangeFilter {
  startDate: Date;
  endDate: Date;
}
