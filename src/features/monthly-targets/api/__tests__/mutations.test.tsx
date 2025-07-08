import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  useCreateMonthlyTarget, 
  useUpdateMonthlyTarget, 
  useDeleteMonthlyTarget,
  useBatchCreateMonthlyTargets,
  useBatchUpsertMonthlyTargets,
  useCopyFromPreviousMonth
} from '../mutations';
import { monthlyTargetService } from '../service';
import { 
  createMockMonthlyTarget, 
  createMockCreateMonthlyTargetRequest,
  createMockUpdateMonthlyTargetRequest,
  createMockMonthlyTargetList 
} from '../../../../__tests__/factories/monthly-targets';

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
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Monthly Target Mutation Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useCreateMonthlyTarget', () => {
    it('should create monthly target successfully', async () => {
      // Arrange
      const createRequest = createMockCreateMonthlyTargetRequest();
      const mockCreatedTarget = createMockMonthlyTarget({
        orderBookerId: createRequest.orderBookerId,
        year: createRequest.year,
        month: createRequest.month,
        targetAmount: createRequest.targetAmount,
      });
      
      (monthlyTargetService.create as any).mockResolvedValue(mockCreatedTarget);

      // Act
      const { result } = renderHook(() => useCreateMonthlyTarget(), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current.isIdle).toBe(true);

      result.current.mutate(createRequest);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockCreatedTarget);
      expect(monthlyTargetService.create).toHaveBeenCalledWith(createRequest);
    });

    it('should handle creation errors', async () => {
      // Arrange
      const createRequest = createMockCreateMonthlyTargetRequest();
      const error = new Error('Duplicate target for this month');
      (monthlyTargetService.create as any).mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => useCreateMonthlyTarget(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(createRequest);

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });

    it('should call onSuccess callback', async () => {
      // Arrange
      const createRequest = createMockCreateMonthlyTargetRequest();
      const mockCreatedTarget = createMockMonthlyTarget();
      const onSuccess = vi.fn();
      
      (monthlyTargetService.create as any).mockResolvedValue(mockCreatedTarget);

      // Act
      const { result } = renderHook(() => useCreateMonthlyTarget(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(createRequest, { onSuccess });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(onSuccess).toHaveBeenCalledWith(mockCreatedTarget, createRequest, undefined);
    });
  });

  describe('useUpdateMonthlyTarget', () => {
    it('should update monthly target successfully', async () => {
      // Arrange
      const targetId = 'existing-id';
      const updateRequest = createMockUpdateMonthlyTargetRequest();
      const mockUpdatedTarget = createMockMonthlyTarget({
        id: targetId,
        targetAmount: updateRequest.targetAmount,
      });
      
      (monthlyTargetService.update as any).mockResolvedValue(mockUpdatedTarget);

      // Act
      const { result } = renderHook(() => useUpdateMonthlyTarget(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: targetId, data: updateRequest });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUpdatedTarget);
      expect(monthlyTargetService.update).toHaveBeenCalledWith(targetId, updateRequest);
    });

    it('should handle update errors', async () => {
      // Arrange
      const targetId = 'non-existent-id';
      const updateRequest = createMockUpdateMonthlyTargetRequest();
      const error = new Error('Monthly target not found');
      (monthlyTargetService.update as any).mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => useUpdateMonthlyTarget(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: targetId, data: updateRequest });

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useDeleteMonthlyTarget', () => {
    it('should delete monthly target successfully', async () => {
      // Arrange
      const targetId = 'existing-id';
      (monthlyTargetService.delete as any).mockResolvedValue(undefined);

      // Act
      const { result } = renderHook(() => useDeleteMonthlyTarget(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(targetId);

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(monthlyTargetService.delete).toHaveBeenCalledWith(targetId);
    });

    it('should handle deletion errors', async () => {
      // Arrange
      const targetId = 'non-existent-id';
      const error = new Error('Monthly target not found');
      (monthlyTargetService.delete as any).mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => useDeleteMonthlyTarget(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(targetId);

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useBatchCreateMonthlyTargets', () => {
    it('should batch create monthly targets successfully', async () => {
      // Arrange
      const createRequests = [
        createMockCreateMonthlyTargetRequest(),
        createMockCreateMonthlyTargetRequest(),
      ];
      const mockCreatedTargets = createMockMonthlyTargetList(2);
      
      (monthlyTargetService.batchCreate as any).mockResolvedValue(mockCreatedTargets);

      // Act
      const { result } = renderHook(() => useBatchCreateMonthlyTargets(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(createRequests);

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockCreatedTargets);
      expect(monthlyTargetService.batchCreate).toHaveBeenCalledWith(createRequests);
    });

    it('should handle batch creation errors', async () => {
      // Arrange
      const createRequests = [createMockCreateMonthlyTargetRequest()];
      const error = new Error('Batch creation failed');
      (monthlyTargetService.batchCreate as any).mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => useBatchCreateMonthlyTargets(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(createRequests);

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useBatchUpsertMonthlyTargets', () => {
    it('should batch upsert monthly targets successfully', async () => {
      // Arrange
      const upsertRequests = [
        createMockCreateMonthlyTargetRequest(),
        createMockCreateMonthlyTargetRequest(),
      ];
      const mockUpsertedTargets = createMockMonthlyTargetList(2);
      
      (monthlyTargetService.batchUpsert as any).mockResolvedValue(mockUpsertedTargets);

      // Act
      const { result } = renderHook(() => useBatchUpsertMonthlyTargets(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(upsertRequests);

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUpsertedTargets);
      expect(monthlyTargetService.batchUpsert).toHaveBeenCalledWith(upsertRequests);
    });
  });

  describe('useCopyFromPreviousMonth', () => {
    it('should copy targets from previous month successfully', async () => {
      // Arrange
      const copyRequest = {
        fromYear: 2024,
        fromMonth: 5,
        toYear: 2024,
        toMonth: 6,
        orderBookerIds: ['id1', 'id2'],
      };
      const mockCopiedTargets = createMockMonthlyTargetList(2);
      
      (monthlyTargetService.copyFromPreviousMonth as any).mockResolvedValue(mockCopiedTargets);

      // Act
      const { result } = renderHook(() => useCopyFromPreviousMonth(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(copyRequest);

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockCopiedTargets);
      expect(monthlyTargetService.copyFromPreviousMonth).toHaveBeenCalledWith(copyRequest);
    });

    it('should handle copy errors', async () => {
      // Arrange
      const copyRequest = {
        fromYear: 2024,
        fromMonth: 5,
        toYear: 2024,
        toMonth: 6,
        orderBookerIds: ['id1'],
      };
      const error = new Error('No targets found to copy');
      (monthlyTargetService.copyFromPreviousMonth as any).mockRejectedValue(error);

      // Act
      const { result } = renderHook(() => useCopyFromPreviousMonth(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(copyRequest);

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });
});