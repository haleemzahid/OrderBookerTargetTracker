import { invoke } from '@tauri-apps/api/core';
import type {
  DailyEntry,
  CreateDailyEntryRequest,
  UpdateDailyEntryRequest,
  DateRange,
  MonthlyAnalytics,
} from '../../types';

export interface IDailyEntryService {
  getByMonth(year: number, month: number): Promise<DailyEntry[]>;
  getByOrderBooker(orderBookerId: string, dateRange?: DateRange): Promise<DailyEntry[]>;
  getByDateRange(startDate: string, endDate: string): Promise<DailyEntry[]>;
  create(entry: CreateDailyEntryRequest): Promise<DailyEntry>;
  batchCreate(entries: CreateDailyEntryRequest[]): Promise<DailyEntry[]>;
  update(id: string, entry: UpdateDailyEntryRequest): Promise<DailyEntry>;
  delete(id: string): Promise<void>;
  getMonthlyAnalytics(year: number, month: number): Promise<MonthlyAnalytics>;
}

export const dailyEntryService: IDailyEntryService = {
  getByMonth: async (year: number, month: number): Promise<DailyEntry[]> => {
    return await invoke<DailyEntry[]>('get_daily_entries_by_month', { year, month });
  },

  getByOrderBooker: async (orderBookerId: string, dateRange?: DateRange): Promise<DailyEntry[]> => {
    return await invoke<DailyEntry[]>('get_daily_entries_by_order_booker', { 
      orderBookerId, 
      dateRange 
    });
  },

  getByDateRange: async (startDate: string, endDate: string): Promise<DailyEntry[]> => {
    return await invoke<DailyEntry[]>('get_daily_entries_by_date_range', { 
      startDate, 
      endDate 
    });
  },

  create: async (entry: CreateDailyEntryRequest): Promise<DailyEntry> => {
    return await invoke<DailyEntry>('create_daily_entry', { entry });
  },

  batchCreate: async (entries: CreateDailyEntryRequest[]): Promise<DailyEntry[]> => {
    return await invoke<DailyEntry[]>('batch_create_daily_entries', { entries });
  },

  update: async (id: string, entry: UpdateDailyEntryRequest): Promise<DailyEntry> => {
    return await invoke<DailyEntry>('update_daily_entry', { id, entry });
  },

  delete: async (id: string): Promise<void> => {
    await invoke<void>('delete_daily_entry', { id });
  },

  getMonthlyAnalytics: async (year: number, month: number): Promise<MonthlyAnalytics> => {
    return await invoke<MonthlyAnalytics>('get_monthly_analytics', { year, month });
  },
};
