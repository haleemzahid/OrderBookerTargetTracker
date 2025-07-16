import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import dayjs from 'dayjs';

export interface OrderFilterState {
  orderBookerId?: string;
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs];
  searchText?: string;
}

interface OrderFilterStore {
  filters: OrderFilterState;
  setOrderBookerId: (orderBookerId?: string) => void;
  setDateRange: (dateRange?: [dayjs.Dayjs, dayjs.Dayjs]) => void;
  setSearchText: (searchText?: string) => void;
  setFilters: (filters: OrderFilterState) => void;
  resetFilters: () => void;
}

// Default filters with today's date range
const defaultFilters: OrderFilterState = {
  orderBookerId: undefined,
  dateRange: [dayjs().startOf('day'), dayjs().endOf('day')],
  searchText: '',
};

export const useOrderFilterStore = create<OrderFilterStore>()(
  persist(
    (set) => ({
      filters: { ...defaultFilters },
      
      setOrderBookerId: (orderBookerId?: string) => 
        set((state) => ({ 
          filters: { ...state.filters, orderBookerId } 
        })),
      
      setDateRange: (dateRange?: [dayjs.Dayjs, dayjs.Dayjs]) => 
        set((state) => ({ 
          filters: { ...state.filters, dateRange } 
        })),
      
      setSearchText: (searchText?: string) => 
        set((state) => ({ 
          filters: { ...state.filters, searchText } 
        })),
      
      setFilters: (filters: OrderFilterState) => 
        set({ filters }),
      
      resetFilters: () => 
        set({ filters: { ...defaultFilters } }),
    }),
    {
      name: 'order-filters-storage', // unique name for localStorage
      // Custom serialization to handle dayjs objects
      partialize: (state) => ({
        filters: {
          ...state.filters,
          dateRange: state.filters.dateRange 
            ? [
                state.filters.dateRange[0].format('YYYY-MM-DD'),
                state.filters.dateRange[1].format('YYYY-MM-DD'),
              ]
            : undefined,
        },
      }),
      // Custom hydration to convert string dates back to dayjs objects
      onRehydrateStorage: () => (state) => {
        if (state && state.filters && state.filters.dateRange) {
          state.filters.dateRange = [
            dayjs(state.filters.dateRange[0]),
            dayjs(state.filters.dateRange[1]),
          ];
        }
      },
    }
  )
);
