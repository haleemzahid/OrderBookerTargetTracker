import { describe, it, expect, vi, beforeEach } from 'vitest';
import { monthlyTargetService } from '../service';
import { getDatabase } from '../../../../services/database';
import { createMockMonthlyTarget, createMockCreateMonthlyTargetRequest } from '../../../../__tests__/factories/monthly-targets';

// Mock the database
vi.mock('../../../../services/database');

describe('monthlyTargetService', () => {
  const mockDb = {
    select: vi.fn(),
    execute: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getDatabase as any).mockReturnValue(mockDb);
  });

  describe('getAll', () => {
    it('should return all monthly targets without filters', async () => {
      // Arrange
      const mockTargets = [
        createMockMonthlyTarget(),
        createMockMonthlyTarget(),
      ];
      const mockDbRows = mockTargets.map(target => ({
        id: target.id,
        order_booker_id: target.orderBookerId,
        year: target.year,
        month: target.month,
        target_amount: target.targetAmount,
        achieved_amount: target.achievedAmount,
        remaining_amount: target.remainingAmount,
        achievement_percentage: target.achievementPercentage,
        days_in_month: target.daysInMonth,
        working_days_in_month: target.workingDaysInMonth,
        daily_target_amount: target.dailyTargetAmount,
        created_at: target.createdAt.toISOString(),
        updated_at: target.updatedAt.toISOString(),
      }));

      mockDb.select.mockResolvedValue(mockDbRows);

      // Act
      const result = await monthlyTargetService.getAll();

      // Assert
      expect(mockDb.select).toHaveBeenCalledWith(
        'SELECT * FROM monthly_targets WHERE 1=1 ORDER BY year DESC, month DESC, target_amount DESC',
        []
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({
        id: mockTargets[0].id,
        orderBookerId: mockTargets[0].orderBookerId,
        year: mockTargets[0].year,
        month: mockTargets[0].month,
      }));
    });

    it('should filter by year when provided', async () => {
      // Arrange
      const year = 2024;
      mockDb.select.mockResolvedValue([]);

      // Act
      await monthlyTargetService.getAll({ year });

      // Assert
      expect(mockDb.select).toHaveBeenCalledWith(
        'SELECT * FROM monthly_targets WHERE 1=1 AND year = ? ORDER BY year DESC, month DESC, target_amount DESC',
        [year]
      );
    });

    it('should filter by month when provided', async () => {
      // Arrange
      const month = 6;
      mockDb.select.mockResolvedValue([]);

      // Act
      await monthlyTargetService.getAll({ month });

      // Assert
      expect(mockDb.select).toHaveBeenCalledWith(
        'SELECT * FROM monthly_targets WHERE 1=1 AND month = ? ORDER BY year DESC, month DESC, target_amount DESC',
        [month]
      );
    });

    it('should filter by order booker IDs when provided', async () => {
      // Arrange
      const orderBookerIds = ['id1', 'id2'];
      mockDb.select.mockResolvedValue([]);

      // Act
      await monthlyTargetService.getAll({ orderBookerIds });

      // Assert
      expect(mockDb.select).toHaveBeenCalledWith(
        'SELECT * FROM monthly_targets WHERE 1=1 AND order_booker_id IN (?, ?) ORDER BY year DESC, month DESC, target_amount DESC',
        orderBookerIds
      );
    });

    it('should combine multiple filters', async () => {
      // Arrange
      const filters = {
        year: 2024,
        month: 6,
        orderBookerIds: ['id1', 'id2'],
      };
      mockDb.select.mockResolvedValue([]);

      // Act
      await monthlyTargetService.getAll(filters);

      // Assert
      expect(mockDb.select).toHaveBeenCalledWith(
        'SELECT * FROM monthly_targets WHERE 1=1 AND year = ? AND month = ? AND order_booker_id IN (?, ?) ORDER BY year DESC, month DESC, target_amount DESC',
        [2024, 6, 'id1', 'id2']
      );
    });
  });

  describe('getById', () => {
    it('should return monthly target when found', async () => {
      // Arrange
      const mockTarget = createMockMonthlyTarget();
      const mockDbRow = {
        id: mockTarget.id,
        order_booker_id: mockTarget.orderBookerId,
        year: mockTarget.year,
        month: mockTarget.month,
        target_amount: mockTarget.targetAmount,
        achieved_amount: mockTarget.achievedAmount,
        remaining_amount: mockTarget.remainingAmount,
        achievement_percentage: mockTarget.achievementPercentage,
        days_in_month: mockTarget.daysInMonth,
        working_days_in_month: mockTarget.workingDaysInMonth,
        daily_target_amount: mockTarget.dailyTargetAmount,
        created_at: mockTarget.createdAt.toISOString(),
        updated_at: mockTarget.updatedAt.toISOString(),
      };

      mockDb.select.mockResolvedValue([mockDbRow]);

      // Act
      const result = await monthlyTargetService.getById(mockTarget.id);

      // Assert
      expect(mockDb.select).toHaveBeenCalledWith(
        'SELECT * FROM monthly_targets WHERE id = ?',
        [mockTarget.id]
      );
      expect(result).toEqual(expect.objectContaining({
        id: mockTarget.id,
        orderBookerId: mockTarget.orderBookerId,
      }));
    });

    it('should return null when not found', async () => {
      // Arrange
      mockDb.select.mockResolvedValue([]);

      // Act
      const result = await monthlyTargetService.getById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new monthly target', async () => {
      // Arrange
      const createRequest = createMockCreateMonthlyTargetRequest();
      const mockCreatedTarget = createMockMonthlyTarget({
        orderBookerId: createRequest.orderBookerId,
        year: createRequest.year,
        month: createRequest.month,
        targetAmount: createRequest.targetAmount,
      });

      mockDb.execute.mockResolvedValue({ lastInsertId: 1 });
      mockDb.select.mockResolvedValue([{
        id: mockCreatedTarget.id,
        order_booker_id: mockCreatedTarget.orderBookerId,
        year: mockCreatedTarget.year,
        month: mockCreatedTarget.month,
        target_amount: mockCreatedTarget.targetAmount,
        achieved_amount: 0,
        remaining_amount: mockCreatedTarget.targetAmount,
        achievement_percentage: 0,
        days_in_month: mockCreatedTarget.daysInMonth,
        working_days_in_month: mockCreatedTarget.workingDaysInMonth,
        daily_target_amount: mockCreatedTarget.dailyTargetAmount,
        created_at: mockCreatedTarget.createdAt.toISOString(),
        updated_at: mockCreatedTarget.updatedAt.toISOString(),
      }]);

      // Act
      const result = await monthlyTargetService.create(createRequest);

      // Assert
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO monthly_targets'),
        expect.arrayContaining([
          expect.any(String), // id
          createRequest.orderBookerId,
          createRequest.year,
          createRequest.month,
          createRequest.targetAmount,
        ])
      );
      expect(result).toEqual(expect.objectContaining({
        orderBookerId: createRequest.orderBookerId,
        year: createRequest.year,
        month: createRequest.month,
        targetAmount: createRequest.targetAmount,
      }));
    });
  });

  describe('update', () => {
    it('should update an existing monthly target', async () => {
      // Arrange
      const targetId = 'existing-id';
      const updateRequest = { targetAmount: 50000 };
      const mockUpdatedTarget = createMockMonthlyTarget({
        id: targetId,
        targetAmount: updateRequest.targetAmount,
      });

      mockDb.execute.mockResolvedValue({ rowsAffected: 1 });
      mockDb.select.mockResolvedValue([{
        id: mockUpdatedTarget.id,
        order_booker_id: mockUpdatedTarget.orderBookerId,
        year: mockUpdatedTarget.year,
        month: mockUpdatedTarget.month,
        target_amount: mockUpdatedTarget.targetAmount,
        achieved_amount: mockUpdatedTarget.achievedAmount,
        remaining_amount: mockUpdatedTarget.remainingAmount,
        achievement_percentage: mockUpdatedTarget.achievementPercentage,
        days_in_month: mockUpdatedTarget.daysInMonth,
        working_days_in_month: mockUpdatedTarget.workingDaysInMonth,
        daily_target_amount: mockUpdatedTarget.dailyTargetAmount,
        created_at: mockUpdatedTarget.createdAt.toISOString(),
        updated_at: mockUpdatedTarget.updatedAt.toISOString(),
      }]);

      // Act
      const result = await monthlyTargetService.update(targetId, updateRequest);

      // Assert
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE monthly_targets'),
        expect.arrayContaining([
          updateRequest.targetAmount,
          expect.any(String), // updated_at
          targetId,
        ])
      );
      expect(result.targetAmount).toBe(updateRequest.targetAmount);
    });

    it('should throw error when target not found', async () => {
      // Arrange
      const targetId = 'non-existent-id';
      const updateRequest = { targetAmount: 50000 };

      mockDb.execute.mockResolvedValue({ rowsAffected: 0 });

      // Act & Assert
      await expect(monthlyTargetService.update(targetId, updateRequest))
        .rejects.toThrow('Monthly target not found');
    });
  });

  describe('delete', () => {
    it('should delete an existing monthly target', async () => {
      // Arrange
      const targetId = 'existing-id';
      mockDb.execute.mockResolvedValue({ rowsAffected: 1 });

      // Act
      await monthlyTargetService.delete(targetId);

      // Assert
      expect(mockDb.execute).toHaveBeenCalledWith(
        'DELETE FROM monthly_targets WHERE id = ?',
        [targetId]
      );
    });

    it('should throw error when target not found', async () => {
      // Arrange
      const targetId = 'non-existent-id';
      mockDb.execute.mockResolvedValue({ rowsAffected: 0 });

      // Act & Assert
      await expect(monthlyTargetService.delete(targetId))
        .rejects.toThrow('Monthly target not found');
    });
  });

  describe('getByMonth', () => {
    it('should return monthly targets for specific month', async () => {
      // Arrange
      const year = 2024;
      const month = 6;
      const mockTargets = [
        createMockMonthlyTarget({ year, month }),
        createMockMonthlyTarget({ year, month }),
      ];
      const mockDbRows = mockTargets.map(target => ({
        id: target.id,
        order_booker_id: target.orderBookerId,
        year: target.year,
        month: target.month,
        target_amount: target.targetAmount,
        achieved_amount: target.achievedAmount,
        remaining_amount: target.remainingAmount,
        achievement_percentage: target.achievementPercentage,
        days_in_month: target.daysInMonth,
        working_days_in_month: target.workingDaysInMonth,
        daily_target_amount: target.dailyTargetAmount,
        created_at: target.createdAt.toISOString(),
        updated_at: target.updatedAt.toISOString(),
      }));

      mockDb.select.mockResolvedValue(mockDbRows);

      // Act
      const result = await monthlyTargetService.getByMonth(year, month);

      // Assert
      expect(mockDb.select).toHaveBeenCalledWith(
        'SELECT * FROM monthly_targets WHERE year = ? AND month = ? ORDER BY target_amount DESC',
        [year, month]
      );
      expect(result).toHaveLength(2);
      expect(result.every(target => target.year === year && target.month === month)).toBe(true);
    });
  });

  describe('getByOrderBooker', () => {
    it('should return monthly targets for specific order booker', async () => {
      // Arrange
      const orderBookerId = 'order-booker-id';
      const mockTargets = [
        createMockMonthlyTarget({ orderBookerId }),
        createMockMonthlyTarget({ orderBookerId }),
      ];
      const mockDbRows = mockTargets.map(target => ({
        id: target.id,
        order_booker_id: target.orderBookerId,
        year: target.year,
        month: target.month,
        target_amount: target.targetAmount,
        achieved_amount: target.achievedAmount,
        remaining_amount: target.remainingAmount,
        achievement_percentage: target.achievementPercentage,
        days_in_month: target.daysInMonth,
        working_days_in_month: target.workingDaysInMonth,
        daily_target_amount: target.dailyTargetAmount,
        created_at: target.createdAt.toISOString(),
        updated_at: target.updatedAt.toISOString(),
      }));

      mockDb.select.mockResolvedValue(mockDbRows);

      // Act
      const result = await monthlyTargetService.getByOrderBooker(orderBookerId);

      // Assert
      expect(mockDb.select).toHaveBeenCalledWith(
        'SELECT * FROM monthly_targets WHERE order_booker_id = ? ORDER BY year DESC, month DESC',
        [orderBookerId]
      );
      expect(result).toHaveLength(2);
      expect(result.every(target => target.orderBookerId === orderBookerId)).toBe(true);
    });
  });
});
