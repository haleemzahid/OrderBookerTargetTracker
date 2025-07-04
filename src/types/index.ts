export interface OrderBooker {
  id: string;
  name: string;
  nameUrdu: string;
  phone: string;
  email?: string;
  joinDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Current month's target data
  currentMonthTarget?: number;
  currentMonthAchieved?: number;
  currentMonthRemaining?: number;
  currentMonthAchievementPercentage?: number;
}

export interface CreateOrderBookerRequest {
  name: string;
  nameUrdu: string;
  phone: string;
  email?: string;
}

export interface UpdateOrderBookerRequest {
  name?: string;
  nameUrdu?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export interface OrderBookerFilters {
  search?: string;
  isActive?: boolean;
  joinDateFrom?: Date;
  joinDateTo?: Date;
}

export interface DailyEntry {
  id: string;
  orderBookerId: string;
  date: Date;
  sales: number;
  returns: number;
  netSales: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDailyEntryRequest {
  orderBookerId: string;
  date: Date;
  sales: number;
  returns: number;
  notes?: string;
}

export interface UpdateDailyEntryRequest {
  sales?: number;
  returns?: number;
  notes?: string;
}

export interface MonthlyTarget {
  id: string;
  orderBookerId: string;
  year: number;
  month: number;
  targetAmount: number;
  achievedAmount: number;
  remainingAmount: number;
  achievementPercentage: number;
  daysInMonth: number;
  workingDaysInMonth: number;
  dailyTargetAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMonthlyTargetRequest {
  orderBookerId: string;
  year: number;
  month: number;
  targetAmount: number;
}

export interface UpdateMonthlyTargetRequest {
  targetAmount?: number;
}

export interface MonthlyAnalytics {
  totalSales: number;
  totalReturns: number;
  totalNetSales: number;
  totalTargetAmount: number;
  totalAchievedAmount: number;
  averageAchievementPercentage: number;
  topPerformers: Array<{
    orderBookerId: string;
    name: string;
    sales: number;
    achievementPercentage: number;
  }>;
  underPerformers: Array<{
    orderBookerId: string;
    name: string;
    sales: number;
    achievementPercentage: number;
  }>;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export class DatabaseError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

export type Status = 'pending' | 'approved' | 'rejected';
export type Language = 'en' | 'ur';
export type Theme = 'light' | 'dark';
export type Direction = 'ltr' | 'rtl';
