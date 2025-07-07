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
