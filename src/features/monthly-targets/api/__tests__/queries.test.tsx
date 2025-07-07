import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  useMonthlyTargets, 
  useMonthlyTarget, 
  useMonthlyTargetsByMonth, 
  useMonthlyTargetsByOrderBooker 
} from '../queries';
import { monthlyTargetService } from '../service';
import { createMockMonthlyTarget, createMockMonthlyTargetList } from '../../../../__tests__/factories/monthly-targets';

// Mock the service
vi.mock('../service');

// Create a wrapper component with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Monthly Target Query Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useMonthlyTargets', () => {
    it('should fetch monthly targets successfully', async () => {
      // Arrange
      const mockTargets = createMockMonthlyTargetList(3);
      (monthlyTargetService.getAll as any).mockResolvedValue(mockTargets);

      // Act
      const { result } = renderHook(() => useMonthlyTargets(), {
        wrapper: createWrapper(),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockTargets);
      expect(monthlyTargetService.getAll).toHaveBeenCalledWith(undefined);
    });

    it('should pass filters to service', async () => {
      // Arrange
      const filters = { year: 2024, month: 6 };
      const mockTargets = createMockMonthlyTargetList(2);
      (monthlyTargetService.getAll as any).mockResolvedValue(mockTargets);

      // Act
      const { result } = renderHook(() => useMonthlyTargets(filters), {
        wrapper: createWrapper(),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(monthlyTargetService.getAll).toHaveBeenCalledWith(filters);
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const error = new Error('Service error');
      (monthlyTargetService.getAll as any).mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => useMonthlyTargets(), {
        wrapper: createWrapper(),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useMonthlyTarget', () => {
    it('should fetch single monthly target successfully', async () => {
      // Arrange
      const mockTarget = createMockMonthlyTarget();
      (monthlyTargetService.getById as any).mockResolvedValue(mockTarget);

      // Act
      const { result } = renderHook(() => useMonthlyTarget(mockTarget.id), {
        wrapper: createWrapper(),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockTarget);
      expect(monthlyTargetService.getById).toHaveBeenCalledWith(mockTarget.id);
    });

    it('should not fetch when id is empty', async () => {
      // Act
      const { result } = renderHook(() => useMonthlyTarget(''), {
        wrapper: createWrapper(),
      });

      // Assert
      // expect(result.current.d.isIdle).toBe(true);
      expect(monthlyTargetService.getById).not.toHaveBeenCalled();
    });

    it('should handle target not found', async () => {
      // Arrange
      (monthlyTargetService.getById as any).mockResolvedValue(null);

      // Act
      const { result } = renderHook(() => useMonthlyTarget('non-existent-id'), {
        wrapper: createWrapper(),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });
  });

  describe('useMonthlyTargetsByMonth', () => {
    it('should fetch monthly targets by month successfully', async () => {
      // Arrange
      const year = 2024;
      const month = 6;
      const mockTargets = createMockMonthlyTargetList(3);
      (monthlyTargetService.getByMonth as any).mockResolvedValue(mockTargets);

      // Act
      const { result } = renderHook(() => useMonthlyTargetsByMonth(year, month), {
        wrapper: createWrapper(),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockTargets);
      expect(monthlyTargetService.getByMonth).toHaveBeenCalledWith(year, month);
    });

    it('should handle empty results', async () => {
      // Arrange
      const year = 2024;
      const month = 6;
      (monthlyTargetService.getByMonth as any).mockResolvedValue([]);

      // Act
      const { result } = renderHook(() => useMonthlyTargetsByMonth(year, month), {
        wrapper: createWrapper(),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('useMonthlyTargetsByOrderBooker', () => {
    it('should fetch monthly targets by order booker successfully', async () => {
      // Arrange
      const orderBookerId = 'order-booker-id';
      const mockTargets = createMockMonthlyTargetList(3);
      (monthlyTargetService.getByOrderBooker as any).mockResolvedValue(mockTargets);

      // Act
      const { result } = renderHook(() => useMonthlyTargetsByOrderBooker(orderBookerId), {
        wrapper: createWrapper(),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockTargets);
      expect(monthlyTargetService.getByOrderBooker).toHaveBeenCalledWith(orderBookerId);
    });

    it('should not fetch when orderBookerId is empty', async () => {
      // Act
      const { result } = renderHook(() => useMonthlyTargetsByOrderBooker(''), {
        wrapper: createWrapper(),
      });

      // Assert
      // expect(result.current.isIdle).toBe(true);
      expect(monthlyTargetService.getByOrderBooker).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      // Arrange
      const orderBookerId = 'order-booker-id';
      const error = new Error('Database connection failed');
      (monthlyTargetService.getByOrderBooker as any).mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => useMonthlyTargetsByOrderBooker(orderBookerId), {
        wrapper: createWrapper(),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });
});
