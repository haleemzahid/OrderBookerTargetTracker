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
  achievedAmount?: number;
  remainingAmount?: number;
  achievementPercentage?: number;
}

export interface MonthlyTargetFilters {
  year?: number;
  month?: number;
  orderBookerIds?: string[];
}

export interface MonthlyTargetWithOrderBooker extends MonthlyTarget {
  orderBooker?: {
    id: string;
    name: string;
    nameUrdu: string;
    phone: string;
    email?: string;
  };
}

export interface CopyTargetsRequest {
  fromYear: number;
  fromMonth: number;
  toYear: number;
  toMonth: number;
  orderBookerIds?: string[];
}
