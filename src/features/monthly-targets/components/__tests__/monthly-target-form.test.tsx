import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../../__tests__/utils/test-utils';
import { MonthlyTargetForm } from '../monthly-target-form';
import { useCreateMonthlyTarget, useUpdateMonthlyTarget } from '../../api/mutations';
import { useOrderBookers } from '../../../order-bookers';
import { createMockMonthlyTarget, createMockCreateMonthlyTargetRequest } from '../../../../__tests__/factories/monthly-targets';

// Mock the hooks
vi.mock('../../api/mutations');
vi.mock('../../../order-bookers');

// Mock dayjs
vi.mock('dayjs', () => ({
  default: vi.fn(() => ({
    year: vi.fn(() => 2024),
    month: vi.fn(() => 5), // June (0-indexed)
  })),
}));

describe('MonthlyTargetForm', () => {
  const mockCreateMutation = {
    mutateAsync: vi.fn(),
    isPending: false,
    error: null,
  };

  const mockUpdateMutation = {
    mutateAsync: vi.fn(),
    isPending: false,
    error: null,
  };

  const mockOrderBookers = [
    { id: 'ob1', name: 'Order Booker 1', nameUrdu: 'آرڈر بکر 1' },
    { id: 'ob2', name: 'Order Booker 2', nameUrdu: 'آرڈر بکر 2' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useCreateMonthlyTarget as any).mockReturnValue(mockCreateMutation);
    (useUpdateMonthlyTarget as any).mockReturnValue(mockUpdateMutation);
    (useOrderBookers as any).mockReturnValue({ data: mockOrderBookers });
  });

  describe('Create Mode', () => {
    it('should render form fields correctly', () => {
      // Act
      render(<MonthlyTargetForm />);

      // Assert
      expect(screen.getByLabelText(/Order Booker/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Month & Year/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Target Amount/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('should populate order booker options', () => {
      // Act
      render(<MonthlyTargetForm />);

      // Click on the select to open options
      fireEvent.click(screen.getByLabelText(/Order Booker/i));

      // Assert
      expect(screen.getByText('Order Booker 1')).toBeInTheDocument();
      expect(screen.getByText('Order Booker 2')).toBeInTheDocument();
    });

    it('should submit form with correct data', async () => {
      // Arrange
      const onSuccess = vi.fn();
      mockCreateMutation.mutateAsync.mockResolvedValue(createMockMonthlyTarget());

      // Act
      render(<MonthlyTargetForm onSuccess={onSuccess} />);

      // Fill form
      fireEvent.click(screen.getByLabelText(/Order Booker/i));
      fireEvent.click(screen.getByText('Order Booker 1'));
      
      fireEvent.change(screen.getByLabelText(/Target Amount/i), {
        target: { value: '50000' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      // Assert
      await waitFor(() => {
        expect(mockCreateMutation.mutateAsync).toHaveBeenCalledWith({
          orderBookerId: 'ob1',
          year: 2024,
          month: 6,
          targetAmount: 50000,
        });
      });

      expect(onSuccess).toHaveBeenCalled();
    });

    it('should show validation errors for required fields', async () => {
      // Act
      render(<MonthlyTargetForm />);

      // Submit without filling required fields
      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Please select an order booker/i)).toBeInTheDocument();
        expect(screen.getByText(/Please select month and year/i)).toBeInTheDocument();
        expect(screen.getByText(/Please enter target amount/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      // Arrange
      mockCreateMutation.isPending = true;

      // Act
      render(<MonthlyTargetForm />);

      // Assert
      expect(screen.getByRole('button', { name: /create/i })).toBeDisabled();
    });

    it('should handle submission errors', async () => {
      // Arrange
      const error = new Error('Target already exists for this month');
      mockCreateMutation.mutateAsync.mockRejectedValue(error);

      // Act
      render(<MonthlyTargetForm />);

      // Fill and submit form
      fireEvent.click(screen.getByLabelText(/Order Booker/i));
      fireEvent.click(screen.getByText('Order Booker 1'));
      
      fireEvent.change(screen.getByLabelText(/Target Amount/i), {
        target: { value: '50000' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Target already exists for this month/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode', () => {
    const mockMonthlyTarget = createMockMonthlyTarget({
      id: 'target-1',
      orderBookerId: 'ob1',
      year: 2024,
      month: 6,
      targetAmount: 75000,
    });

    it('should render form with existing data', () => {
      // Act
      render(<MonthlyTargetForm monthlyTarget={mockMonthlyTarget} />);

      // Assert
      expect(screen.getByDisplayValue('75000')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
    });

    it('should disable order booker and date fields in edit mode', () => {
      // Act
      render(<MonthlyTargetForm monthlyTarget={mockMonthlyTarget} />);

      // Assert
      expect(screen.getByLabelText(/Order Booker/i)).toBeDisabled();
      expect(screen.getByLabelText(/Month & Year/i)).toBeDisabled();
    });

    it('should submit update with correct data', async () => {
      // Arrange
      const onSuccess = vi.fn();
      mockUpdateMutation.mutateAsync.mockResolvedValue({
        ...mockMonthlyTarget,
        targetAmount: 80000,
      });

      // Act
      render(<MonthlyTargetForm monthlyTarget={mockMonthlyTarget} onSuccess={onSuccess} />);

      // Update target amount
      fireEvent.change(screen.getByLabelText(/Target Amount/i), {
        target: { value: '80000' },
      });

      fireEvent.click(screen.getByRole('button', { name: /update/i }));

      // Assert
      await waitFor(() => {
        expect(mockUpdateMutation.mutateAsync).toHaveBeenCalledWith({
          id: 'target-1',
          data: {
            targetAmount: 80000,
          },
        });
      });

      expect(onSuccess).toHaveBeenCalled();
    });

    it('should show update loading state', () => {
      // Arrange
      mockUpdateMutation.isPending = true;

      // Act
      render(<MonthlyTargetForm monthlyTarget={mockMonthlyTarget} />);

      // Assert
      expect(screen.getByRole('button', { name: /update/i })).toBeDisabled();
    });
  });

  describe('Form Interactions', () => {
    it('should call onCancel when cancel button is clicked', () => {
      // Arrange
      const onCancel = vi.fn();

      // Act
      render(<MonthlyTargetForm onCancel={onCancel} />);

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      // Assert
      expect(onCancel).toHaveBeenCalled();
    });

    it('should reset form after successful creation', async () => {
      // Arrange
      mockCreateMutation.mutateAsync.mockResolvedValue(createMockMonthlyTarget());

      // Act
      render(<MonthlyTargetForm />);

      // Fill form
      fireEvent.click(screen.getByLabelText(/Order Booker/i));
      fireEvent.click(screen.getByText('Order Booker 1'));
      
      fireEvent.change(screen.getByLabelText(/Target Amount/i), {
        target: { value: '50000' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      // Assert
      await waitFor(() => {
        expect(screen.getByLabelText(/Target Amount/i)).toHaveValue(null);
      });
    });

    it('should validate target amount is positive', async () => {
      // Act
      render(<MonthlyTargetForm />);

      // Enter negative amount
      fireEvent.change(screen.getByLabelText(/Target Amount/i), {
        target: { value: '-100' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Target amount must be positive/i)).toBeInTheDocument();
      });
    });

    it('should show order booker loading state', () => {
      // Arrange
      (useOrderBookers as any).mockReturnValue({ data: undefined, isLoading: true });

      // Act
      render(<MonthlyTargetForm />);

      // Assert
      expect(screen.getByText(/Loading order bookers/i)).toBeInTheDocument();
    });
  });
});
