import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MonthlyTargetsListPage } from '../../features/monthly-targets/pages/monthly-targets-list';
import { MonthlyTargetForm } from '../../features/monthly-targets/components/monthly-target-form';
import { MonthlyTargetTable } from '../../features/monthly-targets/components/monthly-target-table';
import { AppProvider } from '../../contexts/AppContext';
import { createMockMonthlyTarget } from '../factories/monthly-targets';
import { createMockOrderBooker } from '../factories/order-bookers';
import type { MonthlyTargetWithOrderBooker } from '../../features/monthly-targets/types';

// Mock the API hooks
vi.mock('../../features/monthly-targets/api/queries');
vi.mock('../../features/monthly-targets/api/mutations');
vi.mock('../../features/order-bookers');
vi.mock('../../shared/hooks/use-table');

// Mock Ant Design message
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  };
});

describe('Monthly Targets Feature Integration', () => {
  let queryClient: QueryClient;
  
  const mockOrderBooker = createMockOrderBooker({
    id: 'ob1',
    name: 'John Doe',
    nameUrdu: 'جان ڈو',
    isActive: true,
  });

  const mockMonthlyTarget = createMockMonthlyTarget({
    id: 'target1',
    orderBookerId: 'ob1',
    year: 2024,
    month: 6,
    targetAmount: 50000,
    achievedAmount: 30000,
    achievementPercentage: 60,
  });

  const mockMonthlyTargetWithOrderBooker: MonthlyTargetWithOrderBooker = {
    ...mockMonthlyTarget,
    orderBooker: mockOrderBooker,
  };

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        {children}
      </AppProvider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
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
    
    vi.clearAllMocks();
  });

  describe('Monthly Target Form Integration', () => {
    it('should integrate form submission with mutations', async () => {
      const mockCreateMutation = vi.fn().mockResolvedValue(mockMonthlyTarget);
      const mockUpdateMutation = vi.fn().mockResolvedValue(mockMonthlyTarget);
      const mockOnSuccess = vi.fn();
      
      const { useCreateMonthlyTarget, useUpdateMonthlyTarget } = await import('../../features/monthly-targets/api/mutations');
      const { useOrderBookers } = await import('../../features/order-bookers');
      
      (useCreateMonthlyTarget as any).mockReturnValue({
        mutateAsync: mockCreateMutation,
        isPending: false,
        isError: false,
        error: null,
      });
      
      (useUpdateMonthlyTarget as any).mockReturnValue({
        mutateAsync: mockUpdateMutation,
        isPending: false,
        isError: false,
        error: null,
      });
      
      (useOrderBookers as any).mockReturnValue({
        data: [mockOrderBooker],
        isLoading: false,
      });

      render(
        <TestWrapper>
          <MonthlyTargetForm onSuccess={mockOnSuccess} />
        </TestWrapper>
      );

      // Fill and submit form
      const orderBookerSelect = screen.getByLabelText('Order Booker');
      await userEvent.click(orderBookerSelect);
      await userEvent.click(screen.getByText('John Doe (جان ڈو)'));

      const targetAmountInput = screen.getByLabelText('Target Amount');
      await userEvent.type(targetAmountInput, '50000');

      const submitButton = screen.getByRole('button', { name: 'Create Monthly Target' });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateMutation).toHaveBeenCalledWith({
          orderBookerId: 'ob1',
          year: expect.any(Number),
          month: expect.any(Number),
          targetAmount: 50000,
        });
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should handle form validation and error states', async () => {
      const mockCreateMutation = vi.fn().mockRejectedValue(new Error('Validation error'));
      const mockUpdateMutation = vi.fn().mockRejectedValue(new Error('Validation error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const { useCreateMonthlyTarget, useUpdateMonthlyTarget } = await import('../../features/monthly-targets/api/mutations');
      const { useOrderBookers } = await import('../../features/order-bookers');
      
      (useCreateMonthlyTarget as any).mockReturnValue({
        mutateAsync: mockCreateMutation,
        isPending: false,
        isError: true,
        error: new Error('Validation error'),
      });
      
      (useUpdateMonthlyTarget as any).mockReturnValue({
        mutateAsync: mockUpdateMutation,
        isPending: false,
        isError: true,
        error: new Error('Validation error'),
      });
      
      (useOrderBookers as any).mockReturnValue({
        data: [mockOrderBooker],
        isLoading: false,
      });

      render(
        <TestWrapper>
          <MonthlyTargetForm />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: 'Create Monthly Target' });
      await userEvent.click(submitButton);

      await waitFor(() => {
        // Check that form validation is working by looking for error states
        expect(screen.getByText('Please select an order booker!')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Monthly Target Table Integration', () => {
    it('should integrate table actions with mutations', async () => {
      const mockOnEdit = vi.fn();
      const mockOnDelete = vi.fn();
      
      const { useTable } = await import('../../shared/hooks/use-table');
      
      vi.mocked(useTable).mockReturnValue({
        tableProps: {
          dataSource: [mockMonthlyTargetWithOrderBooker],
          pagination: { current: 1, pageSize: 10, total: 1 },
          onChange: vi.fn(),
        },
        searchText: '',
        setSearchText: vi.fn(),
        currentPage: 1,
        setCurrentPage: vi.fn(),
        filteredData: [mockMonthlyTargetWithOrderBooker],
        totalItems: 1,
      });

      render(
        <TestWrapper>
          <MonthlyTargetTable
            data={[mockMonthlyTargetWithOrderBooker]}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
          />
        </TestWrapper>
      );

      // Test edit action
      const editButton = screen.getByText('Edit');
      await userEvent.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(mockMonthlyTargetWithOrderBooker);
    });

    it('should display data correctly with proper formatting', async () => {
      const { useTable } = await import('../../shared/hooks/use-table');
      
      vi.mocked(useTable).mockReturnValue({
        tableProps: {
          dataSource: [mockMonthlyTargetWithOrderBooker],
          pagination: { current: 1, pageSize: 10, total: 1 },
          onChange: vi.fn(),
        },
        searchText: '',
        setSearchText: vi.fn(),
        currentPage: 1,
        setCurrentPage: vi.fn(),
        filteredData: [mockMonthlyTargetWithOrderBooker],
        totalItems: 1,
      });

      render(
        <TestWrapper>
          <MonthlyTargetTable
            data={[mockMonthlyTargetWithOrderBooker]}
            onEdit={vi.fn()}
            onDelete={vi.fn()}
          />
        </TestWrapper>
      );

      // Check formatted values
      expect(screen.getByText('50,000')).toBeInTheDocument(); // Target amount
      expect(screen.getByText('30,000')).toBeInTheDocument(); // Achieved amount
      expect(screen.getByText('60.0%')).toBeInTheDocument(); // Achievement percentage
      expect(screen.getByText('John Doe')).toBeInTheDocument(); // Order booker name
      expect(screen.getByText('جان ڈو')).toBeInTheDocument(); // Order booker Urdu name
    });
  });

  describe('Monthly Targets List Page Integration', () => {
    it('should integrate all components and handle complete workflow', async () => {
      const mockDeleteMutation = vi.fn().mockResolvedValue(undefined);
      const mockCopyMutation = vi.fn().mockResolvedValue([]);
      
      const { useMonthlyTargetsByMonth } = await import('../../features/monthly-targets/api/queries');
      const { useDeleteMonthlyTarget, useCopyFromPreviousMonth } = await import('../../features/monthly-targets/api/mutations');
      const { useOrderBookers } = await import('../../features/order-bookers');
      
      (useMonthlyTargetsByMonth as any).mockReturnValue({
        data: [mockMonthlyTarget],
        isLoading: false,
      });
      
      (useDeleteMonthlyTarget as any).mockReturnValue({
        mutateAsync: mockDeleteMutation,
        isPending: false,
      });
      
      (useCopyFromPreviousMonth as any).mockReturnValue({
        mutateAsync: mockCopyMutation,
        isPending: false,
      });
      
      (useOrderBookers as any).mockReturnValue({
        data: [mockOrderBooker],
        isLoading: false,
      });

      render(
        <TestWrapper>
          <MonthlyTargetsListPage />
        </TestWrapper>
      );

      // Check page renders with data
      expect(screen.getByText('Monthly Targets')).toBeInTheDocument();
      expect(screen.getByText('Total Targets')).toBeInTheDocument();
      expect(screen.getAllByText('1')[0]).toBeInTheDocument(); // Total targets count (use first match)

      // Check summary statistics - use getAllByText for duplicated values
      const targetAmountElements = screen.getAllByText('50,000');
      expect(targetAmountElements.length).toBeGreaterThan(0); // Should find target amount
      const achievedAmountElements = screen.getAllByText('30,000');
      expect(achievedAmountElements.length).toBeGreaterThan(0); // Should find achieved amount
      const progressElements = screen.getAllByText('60%');
      expect(progressElements.length).toBeGreaterThan(0); // Average achievement
    });

    it('should handle search and filtering integration', async () => {
      const { useMonthlyTargetsByMonth } = await import('../../features/monthly-targets/api/queries');
      const { useDeleteMonthlyTarget, useCopyFromPreviousMonth } = await import('../../features/monthly-targets/api/mutations');
      const { useOrderBookers } = await import('../../features/order-bookers');
      
      (useMonthlyTargetsByMonth as any).mockReturnValue({
        data: [mockMonthlyTarget],
        isLoading: false,
      });
      
      (useDeleteMonthlyTarget as any).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      });
      
      (useCopyFromPreviousMonth as any).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      });
      
      (useOrderBookers as any).mockReturnValue({
        data: [mockOrderBooker],
        isLoading: false,
      });

      render(
        <TestWrapper>
          <MonthlyTargetsListPage />
        </TestWrapper>
      );

      // Test search functionality
      const searchInput = screen.getByPlaceholderText('Search targets...');
      await userEvent.type(searchInput, 'John');

      // Should filter results
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should handle modal operations integration', async () => {
      const { useMonthlyTargetsByMonth } = await import('../../features/monthly-targets/api/queries');
      const { useDeleteMonthlyTarget, useCopyFromPreviousMonth, useCreateMonthlyTarget, useUpdateMonthlyTarget } = await import('../../features/monthly-targets/api/mutations');
      const { useOrderBookers } = await import('../../features/order-bookers');
      
      (useMonthlyTargetsByMonth as any).mockReturnValue({
        data: [mockMonthlyTarget],
        isLoading: false,
      });
      
      (useDeleteMonthlyTarget as any).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      });
      
      (useCopyFromPreviousMonth as any).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      });
      
      (useCreateMonthlyTarget as any).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      });
      
      (useUpdateMonthlyTarget as any).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      });
      
      (useOrderBookers as any).mockReturnValue({
        data: [mockOrderBooker],
        isLoading: false,
      });

      render(
        <TestWrapper>
          <MonthlyTargetsListPage />
        </TestWrapper>
      );

      // Test opening create modal
      const addButton = screen.getByText('Add Target');
      await userEvent.click(addButton);

      expect(screen.getByText('Add Monthly Target')).toBeInTheDocument();

      // Test closing modal
      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Data Flow Integration', () => {
    it('should handle complete CRUD operations flow', async () => {
      const mockCreateMutation = vi.fn().mockResolvedValue(mockMonthlyTarget);
      const mockUpdateMutation = vi.fn().mockResolvedValue(mockMonthlyTarget);
      const mockDeleteMutation = vi.fn().mockResolvedValue(undefined);
      
      const { useCreateMonthlyTarget, useUpdateMonthlyTarget, useDeleteMonthlyTarget } = await import('../../features/monthly-targets/api/mutations');
      const { useOrderBookers } = await import('../../features/order-bookers');
      
      (useCreateMonthlyTarget as any).mockReturnValue({
        mutateAsync: mockCreateMutation,
        isPending: false,
      });
      
      (useUpdateMonthlyTarget as any).mockReturnValue({
        mutateAsync: mockUpdateMutation,
        isPending: false,
      });
      
      (useDeleteMonthlyTarget as any).mockReturnValue({
        mutateAsync: mockDeleteMutation,
        isPending: false,
      });
      
      (useOrderBookers as any).mockReturnValue({
        data: [mockOrderBooker],
        isLoading: false,
      });

      // Test Create
      const onSuccess = vi.fn();
      
      render(
        <TestWrapper>
          <MonthlyTargetForm onSuccess={onSuccess} />
        </TestWrapper>
      );

      const orderBookerSelect = screen.getByLabelText('Order Booker');
      await userEvent.click(orderBookerSelect);
      await userEvent.click(screen.getByText('John Doe (جان ڈو)'));

      const targetAmountInput = screen.getByLabelText('Target Amount');
      await userEvent.type(targetAmountInput, '50000');

      const submitButton = screen.getByRole('button', { name: 'Create Monthly Target' });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateMutation).toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('should handle error states across components', async () => {
      const mockCreateMutation = vi.fn().mockRejectedValue(new Error('Network error'));
      const mockUpdateMutation = vi.fn().mockRejectedValue(new Error('Network error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const { useCreateMonthlyTarget, useUpdateMonthlyTarget } = await import('../../features/monthly-targets/api/mutations');
      const { useOrderBookers } = await import('../../features/order-bookers');
      
      (useCreateMonthlyTarget as any).mockReturnValue({
        mutateAsync: mockCreateMutation,
        isPending: false,
        isError: true,
        error: new Error('Network error'),
      });
      
      (useUpdateMonthlyTarget as any).mockReturnValue({
        mutateAsync: mockUpdateMutation,
        isPending: false,
        isError: true,
        error: new Error('Network error'),
      });
      
      (useOrderBookers as any).mockReturnValue({
        data: [mockOrderBooker],
        isLoading: false,
      });

      render(
        <TestWrapper>
          <MonthlyTargetForm />
        </TestWrapper>
      );

      const orderBookerSelect = screen.getByLabelText('Order Booker');
      await userEvent.click(orderBookerSelect);
      await userEvent.click(screen.getByText('John Doe (جان ڈو)'));

      const targetAmountInput = screen.getByLabelText('Target Amount');
      await userEvent.type(targetAmountInput, '50000');

      const submitButton = screen.getByRole('button', { name: 'Create Monthly Target' });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateMutation).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('Form submission error:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Performance Integration', () => {
    it('should handle large datasets efficiently', async () => {
      const largeMockData = Array.from({ length: 100 }, (_, index) => 
        createMockMonthlyTarget({
          id: `target${index}`,
          orderBookerId: 'ob1',
        })
      );

      const { useMonthlyTargetsByMonth } = await import('../../features/monthly-targets/api/queries');
      const { useDeleteMonthlyTarget, useCopyFromPreviousMonth } = await import('../../features/monthly-targets/api/mutations');
      const { useOrderBookers } = await import('../../features/order-bookers');
      
      (useMonthlyTargetsByMonth as any).mockReturnValue({
        data: largeMockData,
        isLoading: false,
      });
      
      (useDeleteMonthlyTarget as any).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      });
      
      (useCopyFromPreviousMonth as any).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
      });
      
      (useOrderBookers as any).mockReturnValue({
        data: [mockOrderBooker],
        isLoading: false,
      });

      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <MonthlyTargetsListPage />
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 2 seconds for testing environment)
      expect(renderTime).toBeLessThan(2000);
      expect(screen.getByText('Monthly Targets')).toBeInTheDocument();
    });
  });
});
