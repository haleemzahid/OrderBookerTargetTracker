import { invoke } from '@tauri-apps/api/core';
import type {
  MonthlyTarget,
  CreateMonthlyTargetRequest,
  UpdateMonthlyTargetRequest,
} from '../../types';

export interface IMonthlyTargetService {
  getByMonth(year: number, month: number): Promise<MonthlyTarget[]>;
  getByOrderBooker(orderBookerId: string): Promise<MonthlyTarget[]>;
  create(target: CreateMonthlyTargetRequest): Promise<MonthlyTarget>;
  batchCreate(targets: CreateMonthlyTargetRequest[]): Promise<MonthlyTarget[]>;
  update(id: string, target: UpdateMonthlyTargetRequest): Promise<MonthlyTarget>;
  delete(id: string): Promise<void>;
  copyFromPreviousMonth(params: { fromYear: number; fromMonth: number; toYear: number; toMonth: number }): Promise<MonthlyTarget[]>;
}

export const monthlyTargetService: IMonthlyTargetService = {
  getByMonth: async (year: number, month: number): Promise<MonthlyTarget[]> => {
    return await invoke<MonthlyTarget[]>('get_monthly_targets_by_month', { year, month });
  },

  getByOrderBooker: async (orderBookerId: string): Promise<MonthlyTarget[]> => {
    return await invoke<MonthlyTarget[]>('get_monthly_targets_by_order_booker', { orderBookerId });
  },

  create: async (target: CreateMonthlyTargetRequest): Promise<MonthlyTarget> => {
    return await invoke<MonthlyTarget>('create_monthly_target', { target });
  },

  batchCreate: async (targets: CreateMonthlyTargetRequest[]): Promise<MonthlyTarget[]> => {
    return await invoke<MonthlyTarget[]>('batch_create_monthly_targets', { targets });
  },

  update: async (id: string, target: UpdateMonthlyTargetRequest): Promise<MonthlyTarget> => {
    return await invoke<MonthlyTarget>('update_monthly_target', { id, target });
  },

  delete: async (id: string): Promise<void> => {
    await invoke<void>('delete_monthly_target', { id });
  },

  copyFromPreviousMonth: async (params: { fromYear: number; fromMonth: number; toYear: number; toMonth: number }): Promise<MonthlyTarget[]> => {
    return await invoke<MonthlyTarget[]>('copy_monthly_targets_from_previous_month', params);
  },
};
