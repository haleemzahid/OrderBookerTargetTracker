import { getDatabase } from '../database';
import { v4 as uuidv4 } from 'uuid';
import type {
  MonthlyTarget,
  CreateMonthlyTargetRequest,
  UpdateMonthlyTargetRequest,
} from '../../types';

export interface IMonthlyTargetService {
  getByMonth(year: number, month: number): Promise<MonthlyTarget[]>;
  getByOrderBooker(orderBookerId: string): Promise<MonthlyTarget[]>;
  getById(id: string): Promise<MonthlyTarget | null>;
  create(target: CreateMonthlyTargetRequest): Promise<MonthlyTarget>;
  batchCreate(targets: CreateMonthlyTargetRequest[]): Promise<MonthlyTarget[]>;
  batchUpsert(targets: CreateMonthlyTargetRequest[]): Promise<MonthlyTarget[]>;
  update(id: string, target: UpdateMonthlyTargetRequest): Promise<MonthlyTarget>;
  delete(id: string): Promise<void>;
  copyFromPreviousMonth(params: { fromYear: number; fromMonth: number; toYear: number; toMonth: number }): Promise<MonthlyTarget[]>;
}

export const monthlyTargetService: IMonthlyTargetService = {
  getByMonth: async (year: number, month: number): Promise<MonthlyTarget[]> => {
    const db = getDatabase();
    const result = await db.select<any[]>(
      'SELECT * FROM monthly_targets WHERE year = ? AND month = ? ORDER BY target_amount DESC',
      [year, month]
    );
    return result.map(row => ({
      id: row.id,
      orderBookerId: row.order_booker_id,
      year: row.year,
      month: row.month,
      targetAmount: row.target_amount || 0,
      achievedAmount: row.achieved_amount || 0,
      remainingAmount: row.remaining_amount || 0,
      achievementPercentage: row.achievement_percentage || 0,
      daysInMonth: row.days_in_month || 0,
      workingDaysInMonth: row.working_days_in_month || 0,
      dailyTargetAmount: row.daily_target_amount || 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  },

  getByOrderBooker: async (orderBookerId: string): Promise<MonthlyTarget[]> => {
    const db = getDatabase();
    const result = await db.select<any[]>(
      'SELECT * FROM monthly_targets WHERE order_booker_id = ? ORDER BY year DESC, month DESC',
      [orderBookerId]
    );
    return result.map(row => ({
      id: row.id,
      orderBookerId: row.order_booker_id,
      year: row.year,
      month: row.month,
      targetAmount: row.target_amount || 0,
      achievedAmount: row.achieved_amount || 0,
      remainingAmount: row.remaining_amount || 0,
      achievementPercentage: row.achievement_percentage || 0,
      daysInMonth: row.days_in_month || 0,
      workingDaysInMonth: row.working_days_in_month || 0,
      dailyTargetAmount: row.daily_target_amount || 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  },

  create: async (target: CreateMonthlyTargetRequest): Promise<MonthlyTarget> => {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();
    
    // Calculate days in month
    const daysInMonth = new Date(target.year, target.month, 0).getDate();
    // Assuming 5 working days per week (rough calculation)
    const workingDaysInMonth = Math.floor(daysInMonth * 5 / 7);
    const dailyTargetAmount = target.targetAmount / workingDaysInMonth;

    await db.execute(
      `INSERT INTO monthly_targets (
        id, order_booker_id, year, month, target_amount, achieved_amount, 
        remaining_amount, achievement_percentage, days_in_month, 
        working_days_in_month, daily_target_amount, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        target.orderBookerId,
        target.year,
        target.month,
        target.targetAmount,
        0, // achieved_amount
        target.targetAmount, // remaining_amount
        0, // achievement_percentage
        daysInMonth,
        workingDaysInMonth,
        dailyTargetAmount,
        now,
        now,
      ]
    );

    const created = await monthlyTargetService.getById(id);
    if (!created) {
      throw new Error('Failed to create monthly target');
    }

    return created;
  },

  batchCreate: async (targets: CreateMonthlyTargetRequest[]): Promise<MonthlyTarget[]> => {
    const createdTargets: MonthlyTarget[] = [];

    for (const target of targets) {
      const created = await monthlyTargetService.create(target);
      createdTargets.push(created);
    }

    return createdTargets;
  },

  batchUpsert: async (targets: CreateMonthlyTargetRequest[]): Promise<MonthlyTarget[]> => {
    const db = getDatabase();
    const upsertedTargets: MonthlyTarget[] = [];

    for (const target of targets) {
      // Check if target already exists
      const existingTargets = await db.select<any[]>(
        'SELECT id FROM monthly_targets WHERE order_booker_id = ? AND year = ? AND month = ?',
        [target.orderBookerId, target.year, target.month]
      );

      if (existingTargets.length > 0) {
        // Update existing target
        const existingId = existingTargets[0].id;
        const updated = await monthlyTargetService.update(existingId, {
          targetAmount: target.targetAmount,
        });
        upsertedTargets.push(updated);
      } else {
        // Create new target
        const created = await monthlyTargetService.create(target);
        upsertedTargets.push(created);
      }
    }

    return upsertedTargets;
  },

  update: async (id: string, target: UpdateMonthlyTargetRequest): Promise<MonthlyTarget> => {
    const db = getDatabase();
    const now = new Date().toISOString();

    const setParts: string[] = [];
    const params: any[] = [];

    if (target.targetAmount !== undefined) {
      setParts.push('target_amount = ?');
      params.push(target.targetAmount);
      
      // Recalculate remaining amount and achievement percentage
      const current = await monthlyTargetService.getById(id);
      if (current) {
        const achievedAmount = current.achievedAmount;
        const remainingAmount = target.targetAmount - achievedAmount;
        const achievementPercentage = target.targetAmount > 0 ? (achievedAmount / target.targetAmount) * 100 : 0;
        const dailyTargetAmount = target.targetAmount / current.workingDaysInMonth;
        
        setParts.push('remaining_amount = ?', 'achievement_percentage = ?', 'daily_target_amount = ?');
        params.push(remainingAmount, achievementPercentage, dailyTargetAmount);
      }
    }

    if (setParts.length === 0) {
      throw new Error('No fields to update');
    }

    setParts.push('updated_at = ?');
    params.push(now);
    params.push(id);

    const query = `UPDATE monthly_targets SET ${setParts.join(', ')} WHERE id = ?`;
    await db.execute(query, params);

    const updated = await monthlyTargetService.getById(id);
    if (!updated) {
      throw new Error('Monthly target not found');
    }

    return updated;
  },

  delete: async (id: string): Promise<void> => {
    const db = getDatabase();
    await db.execute('DELETE FROM monthly_targets WHERE id = ?', [id]);
  },

  copyFromPreviousMonth: async (params: { fromYear: number; fromMonth: number; toYear: number; toMonth: number }): Promise<MonthlyTarget[]> => {
    // Get previous month targets
    const previousTargets = await monthlyTargetService.getByMonth(params.fromYear, params.fromMonth);
    
    // Create new targets for the current month
    const newTargets: CreateMonthlyTargetRequest[] = previousTargets.map(target => ({
      orderBookerId: target.orderBookerId,
      year: params.toYear,
      month: params.toMonth,
      targetAmount: target.targetAmount,
    }));

    return await monthlyTargetService.batchCreate(newTargets);
  },

  // Helper method to get by ID
  getById: async (id: string): Promise<MonthlyTarget | null> => {
    const db = getDatabase();
    const result = await db.select<any[]>('SELECT * FROM monthly_targets WHERE id = ?', [id]);
    
    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      id: row.id,
      orderBookerId: row.order_booker_id,
      year: row.year,
      month: row.month,
      targetAmount: row.target_amount || 0,
      achievedAmount: row.achieved_amount || 0,
      remainingAmount: row.remaining_amount || 0,
      achievementPercentage: row.achievement_percentage || 0,
      daysInMonth: row.days_in_month || 0,
      workingDaysInMonth: row.working_days_in_month || 0,
      dailyTargetAmount: row.daily_target_amount || 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  },
};
