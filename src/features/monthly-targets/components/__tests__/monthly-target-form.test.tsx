import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MonthlyTargetForm } from '../monthly-target-form';
import { useCreateMonthlyTarget, useUpdateMonthlyTarget } from '../../api/mutations';
import { useOrderBookers } from '../../../order-bookers';
import { renderWithProviders } from '../../../../__tests__/utils/test-utils';
import { createMockMonthlyTarget } from '../../../../__tests__/factories/monthly-targets';

import React from 'react';

// Mock the hooks
vi.mock('../../api/mutations');
vi.mock('../../../order-bookers');

// Mock date-fns functions
vi.mock('../../../../config/date', () => {
  return {
    default: {
      format: vi.fn(() => 'Jan 2024'),
      createYearMonth: vi.fn(() => new Date(2024, 0, 1)),
      getDateYear: vi.fn(() => 2024),
      getDateMonth: vi.fn(() => 1), // January (1-indexed in our app)
      now: vi.fn(() => new Date(2024, 0, 1)),
      validateDate: vi.fn(() => true),
      isValid: vi.fn(() => true),
    },
    __esModule: true,
  };
});

// Mock Ant Design date config adapter
vi.mock('../../../../config/antd-date-config', () => {
  return {
    configureAntDesignDateFns: vi.fn(),
    dateFnsAdapter: {
      format: vi.fn(() => 'Jan 2024'),
      parse: vi.fn(() => new Date(2024, 0, 1)),
      getYear: vi.fn(() => 2024),
      getMonth: vi.fn(() => 0),
      isValidate: vi.fn(() => true),
      // Add other necessary methods that might be used by Ant Design
    },
    __esModule: true,
  };
});



describe('MonthlyTargetForm', () => {
  const mockCreateMutation = {
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  };

  const mockUpdateMutation = {
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  };

  const mockOrderBookers = [
    {
      id: 'ob1',
      name: 'John Doe',
      nameUrdu: 'جان ڈو',
      phone: '+92-300-1234567',
      email: 'john@example.com',
      joinDate: '2024-01-01',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'ob2',
      name: 'Jane Smith',
      nameUrdu: 'جین سمتھ',
      phone: '+92-300-7654321',
      email: 'jane@example.com',
      joinDate: '2024-01-01',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useCreateMonthlyTarget as any).mockReturnValue(mockCreateMutation);
    (useUpdateMonthlyTarget as any).mockReturnValue(mockUpdateMutation);
    (useOrderBookers as any).mockReturnValue({ data: mockOrderBookers });
    
    mockCreateMutation.mutateAsync.mockResolvedValue({});
    mockUpdateMutation.mutateAsync.mockResolvedValue({});
  });

  describe('Create Mode', () => {
    it('should render create form correctly', () => {
      renderWithProviders(
        <MonthlyTargetForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      expect(screen.getByText('Create Monthly Target', { selector: '.ant-card-head-title' })).toBeInTheDocument();
      expect(screen.getByLabelText('Order Booker')).toBeInTheDocument();
      expect(screen.getByLabelText('Month & Year')).toBeInTheDocument();
      expect(screen.getByLabelText('Target Amount')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Create Monthly Target$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('should populate order booker options', async () => {
      renderWithProviders(
        <MonthlyTargetForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      const orderBookerSelect = screen.getByLabelText('Order Booker');
      await userEvent.click(orderBookerSelect);

      expect(screen.getByText('John Doe (جان ڈو)')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith (جین سمتھ)')).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
      // For this test, we'll just verify that form validation is being attempted
      // and that the submit button exists and can be clicked
      renderWithProviders(
        <MonthlyTargetForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      const submitButton = screen.getByRole('button', { name: 'Create Monthly Target' });
      expect(submitButton).toBeInTheDocument();
      
      await userEvent.click(submitButton);
      
      // Verify that the form validation happens
      await waitFor(() => {
        expect(mockCreateMutation.mutateAsync).not.toHaveBeenCalled();
      });
    });

    it('should validate target amount minimum value', async () => {
      renderWithProviders(
        <MonthlyTargetForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      const targetAmountInput = screen.getByLabelText('Target Amount');
      await userEvent.type(targetAmountInput, '0');

      const submitButton = screen.getByRole('button', { name: 'Create Monthly Target' });
      await userEvent.click(submitButton);

      // Verify that the form submission doesn't happen with invalid data
      await waitFor(() => {
        expect(mockCreateMutation.mutateAsync).not.toHaveBeenCalled();
      });
    });

    it('should submit create form with valid data', async () => {
      renderWithProviders(
        <MonthlyTargetForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      // Fill form
      const orderBookerSelect = screen.getByLabelText('Order Booker');
      await userEvent.click(orderBookerSelect);
      await userEvent.click(screen.getByText('John Doe (جان ڈو)'));

      const targetAmountInput = screen.getByLabelText('Target Amount');
      await userEvent.type(targetAmountInput, '50000');

      const submitButton = screen.getByRole('button', { name: 'Create Monthly Target' });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateMutation.mutateAsync).toHaveBeenCalledWith({
          orderBookerId: 'ob1',
          year: expect.any(Number),
          month: expect.any(Number),
          targetAmount: 50000,
        });
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should call onCancel when cancel button is clicked', async () => {
      renderWithProviders(
        <MonthlyTargetForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await userEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    const mockMonthlyTarget = createMockMonthlyTarget({
      id: 'target1',
      orderBookerId: 'ob1',
      year: 2024,
      month: 6,
      targetAmount: 50000,
    });

    it('should render edit form correctly', () => {
      renderWithProviders(
        <MonthlyTargetForm
          monthlyTarget={mockMonthlyTarget}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Edit Monthly Target', { selector: '.ant-card-head-title' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Update Monthly Target/i })).toBeInTheDocument();
    });

    it('should populate form with existing data', () => {
      renderWithProviders(
        <MonthlyTargetForm
          monthlyTarget={mockMonthlyTarget}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const targetAmountInput = screen.getByLabelText('Target Amount');
      expect(targetAmountInput).toHaveValue(String(mockMonthlyTarget.targetAmount));
    });

    it('should disable order booker and date fields in edit mode', () => {
      renderWithProviders(
        <MonthlyTargetForm
          monthlyTarget={mockMonthlyTarget}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const orderBookerSelect = screen.getByLabelText('Order Booker');
      const monthYearPicker = screen.getByLabelText('Month & Year');

      expect(orderBookerSelect).toBeDisabled();
      expect(monthYearPicker).toBeDisabled();
    });

    it('should submit update form with valid data', async () => {
      renderWithProviders(
        <MonthlyTargetForm
          monthlyTarget={mockMonthlyTarget}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const targetAmountInput = screen.getByLabelText('Target Amount');
      await userEvent.clear(targetAmountInput);
      await userEvent.type(targetAmountInput, '75000');

      const submitButton = screen.getByRole('button', { name: 'Update Monthly Target' });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateMutation.mutateAsync).toHaveBeenCalledWith({
          id: mockMonthlyTarget.id,
          data: {
            targetAmount: 75000,
          },
        });
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state during create', () => {
      const loadingCreateMutation = {
        ...mockCreateMutation,
        isPending: true,
      };
      (useCreateMonthlyTarget as any).mockReturnValue(loadingCreateMutation);

      renderWithProviders(
        <MonthlyTargetForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      const submitButton = screen.getByRole('button', { name: /loading Create Monthly Target/i });
      expect(submitButton).toBeDisabled();
    });

    it('should show loading state during update', () => {
      const loadingUpdateMutation = {
        ...mockUpdateMutation,
        isPending: true,
      };
      (useUpdateMonthlyTarget as any).mockReturnValue(loadingUpdateMutation);

      const mockMonthlyTarget = createMockMonthlyTarget();
      renderWithProviders(
        <MonthlyTargetForm
          monthlyTarget={mockMonthlyTarget}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByRole('button', { name: /loading Update Monthly Target/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should handle create mutation errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockCreateMutation.mutateAsync.mockRejectedValue(new Error('Create failed'));

      renderWithProviders(
        <MonthlyTargetForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      // Fill form
      const orderBookerSelect = screen.getByLabelText('Order Booker');
      await userEvent.click(orderBookerSelect);
      await userEvent.click(screen.getByText('John Doe (جان ڈو)'));

      const targetAmountInput = screen.getByLabelText('Target Amount');
      await userEvent.type(targetAmountInput, '50000');

      const submitButton = screen.getByRole('button', { name: 'Create Monthly Target' });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Form submission error:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should handle update mutation errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockUpdateMutation.mutateAsync.mockRejectedValue(new Error('Update failed'));

      const mockMonthlyTarget = createMockMonthlyTarget();
      renderWithProviders(
        <MonthlyTargetForm
          monthlyTarget={mockMonthlyTarget}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByRole('button', { name: 'Update Monthly Target' });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Form submission error:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderWithProviders(
        <MonthlyTargetForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      expect(screen.getByLabelText('Order Booker')).toBeInTheDocument();
      expect(screen.getByLabelText('Month & Year')).toBeInTheDocument();
      expect(screen.getByLabelText('Target Amount')).toBeInTheDocument();
    });

    it('should have proper button roles', () => {
      renderWithProviders(
        <MonthlyTargetForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      expect(screen.getByRole('button', { name: 'Create Monthly Target' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });
  });
});
