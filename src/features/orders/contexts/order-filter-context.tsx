import React, { createContext, useState, useContext, ReactNode } from 'react';
import dayjs from 'dayjs';

export interface OrderFilterState {
  orderBookerId?: string;
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs];
  searchText?: string;
}

interface OrderFilterContextType {
  filters: OrderFilterState;
  setFilters: (filters: OrderFilterState) => void;
}

const OrderFilterContext = createContext<OrderFilterContextType | undefined>(undefined);

export const OrderFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default to today's date range
  const [filters, setFilters] = useState<OrderFilterState>({
    orderBookerId: undefined,
    dateRange: [dayjs().startOf('day'), dayjs().endOf('day')],
    searchText: '',
  });

  return (
    <OrderFilterContext.Provider value={{ filters, setFilters }}>
      {children}
    </OrderFilterContext.Provider>
  );
};

export const useOrderFilters = (): OrderFilterContextType => {
  const context = useContext(OrderFilterContext);
  if (context === undefined) {
    throw new Error('useOrderFilters must be used within an OrderFilterProvider');
  }
  return context;
};
