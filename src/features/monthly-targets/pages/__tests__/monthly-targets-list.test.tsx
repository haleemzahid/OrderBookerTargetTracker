import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MonthlyTargetsListPage } from '../monthly-targets-list';
import { useMonthlyTargetsByMonth } from '../../api/queries';
import { useDeleteMonthlyTarget, useCopyFromPreviousMonth } from '../../api/mutations';
import { useOrderBookers } from '../../../order-bookers';
import { renderWithProviders } from '../../../../__tests__/utils/test-utils';
import { createMockMonthlyTarget } from '../../../../__tests__/factories/monthly-targets';

// Mock the hooks
vi.mock('../../api/queries');
vi.mock('../../api/mutations');
vi.mock('../../../order-bookers');

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

// Mock dayjs
vi.mock('dayjs', () => ({
  default: vi.fn(() => ({
    year: vi.fn(() => 2024),
    month: vi.fn(() => 5), // 0-indexed, so June
    add: vi.fn(() => ({ year: vi.fn(() => 2024), month: vi.fn(() => 4) })),
    subtract: vi.fn(() => ({ year: vi.fn(() => 2024), month: vi.fn(() => 4) })),
    format: vi.fn(() => 'Jun 2024'),
  })),
}));

// Mock the components
vi.mock('../../components/monthly-target-table', () => ({
  MonthlyTargetTable: ({ data, onEdit, onDelete, loading }: any) => (
    <div data-testid="monthly-target-table">
      {loading && <div>Loading...</div>}
      {data.map((item: any) => (
        <div key={item.id}>
          <span>{item.orderBooker?.name}</span>
          <button onClick={() => onEdit(item)}>Edit {item.id}</button>
          <button onClick={() => onDelete(item)}>Delete {item.id}</button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../../components/monthly-target-form', () => ({
  MonthlyTargetForm: ({ monthlyTarget, onSuccess, onCancel }: any) => (
    <div data-testid="monthly-target-form">
      <span>{monthlyTarget ? 'Edit Form' : 'Create Form'}</span>
      <button onClick={onSuccess}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

describe('MonthlyTargetsListPage', () => {
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

  const mockMonthlyTargets = [
    createMockMonthlyTarget({
      id: 'target1',
      orderBookerId: 'ob1',
      year: 2024,
      month: 6,
      targetAmount: 50000,
      achievedAmount: 40000,
      achievementPercentage: 80,
    }),
    createMockMonthlyTarget({
      id: 'target2',
      orderBookerId: 'ob2',
      year: 2024,
      month: 6,
      targetAmount: 60000,
      achievedAmount: 30000,
      achievementPercentage: 50,
    }),
  ];

  const mockDeleteMutation = {
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  };

  const mockCopyMutation = {
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useOrderBookers as any).mockReturnValue({ data: mockOrderBookers });
    (useMonthlyTargetsByMonth as any).mockReturnValue({ 
      data: mockMonthlyTargets, 
      isLoading: false 
    });
    (useDeleteMonthlyTarget as any).mockReturnValue(mockDeleteMutation);
    (useCopyFromPreviousMonth as any).mockReturnValue(mockCopyMutation);
    
    mockDeleteMutation.mutateAsync.mockResolvedValue(undefined);
    mockCopyMutation.mutateAsync.mockResolvedValue([]);
  });

  it('should render the page with all main components', () => {
    renderWithProviders(<MonthlyTargetsListPage />);

    expect(screen.getByText('Monthly Targets')).toBeInTheDocument();
    expect(screen.getByTestId('monthly-target-table')).toBeInTheDocument();
    expect(screen.getByText('Add Target')).toBeInTheDocument();
    expect(screen.getByText('Copy From Previous Month')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('should display summary statistics', () => {
    renderWithProviders(<MonthlyTargetsListPage />);

    // Check for statistics cards
    expect(screen.getByText('Total Targets')).toBeInTheDocument();
    expect(screen.getByText('Total Target Amount')).toBeInTheDocument();
    expect(screen.getByText('Total Achieved')).toBeInTheDocument();
    expect(screen.getByText('Average Achievement')).toBeInTheDocument();
    expect(screen.getByText('On Track')).toBeInTheDocument();
    expect(screen.getByText('Behind')).toBeInTheDocument();
  });

  it('should calculate summary statistics correctly', () => {
    renderWithProviders(<MonthlyTargetsListPage />);

    // Total targets should be 2
    expect(screen.getByText('2')).toBeInTheDocument();
    
    // Total target amount should be 110,000 (50,000 + 60,000)
    expect(screen.getByText('110,000')).toBeInTheDocument();
    
    // Total achieved should be 70,000 (40,000 + 30,000)
    expect(screen.getByText('70,000')).toBeInTheDocument();
    
    // Average achievement should be 65% ((80 + 50) / 2)
    expect(screen.getByText('65%')).toBeInTheDocument();
    
    // On track count should be 1 (achievement >= 80%)
    expect(screen.getByText('1')).toBeInTheDocument();
    
    // Behind count should be 1 (achievement < 80%)
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should filter by search text', async () => {
    renderWithProviders(<MonthlyTargetsListPage />);

    const searchInput = screen.getByPlaceholderText('Search by order booker name...');
    await userEvent.type(searchInput, 'John');

    // Should filter to show only John Doe's targets
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('should filter by order booker selection', async () => {
    renderWithProviders(<MonthlyTargetsListPage />);

    const orderBookerSelect = screen.getByLabelText('Order Booker Filter');
    await userEvent.click(orderBookerSelect);
    await userEvent.click(screen.getByText('John Doe (جان ڈو)'));

    // Should show only John Doe's targets
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should open create modal when Add Target button is clicked', async () => {
    renderWithProviders(<MonthlyTargetsListPage />);

    const addButton = screen.getByText('Add Target');
    await userEvent.click(addButton);

    // Should open modal with create form
    expect(screen.getByTestId('monthly-target-form')).toBeInTheDocument();
    expect(screen.getByText('Create Form')).toBeInTheDocument();
  });

  it('should open edit modal when edit button is clicked', async () => {
    renderWithProviders(<MonthlyTargetsListPage />);

    const editButton = screen.getByText('Edit target1');
    await userEvent.click(editButton);

    // Should open modal with edit form
    expect(screen.getByTestId('monthly-target-form')).toBeInTheDocument();
    expect(screen.getByText('Edit Form')).toBeInTheDocument();
  });

  it('should close modal when form is saved', async () => {
    renderWithProviders(<MonthlyTargetsListPage />);

    // Open modal
    const addButton = screen.getByText('Add Target');
    await userEvent.click(addButton);

    // Save form
    const saveButton = screen.getByText('Save');
    await userEvent.click(saveButton);

    // Modal should close
    expect(screen.queryByTestId('monthly-target-form')).not.toBeInTheDocument();
  });

  it('should close modal when cancel button is clicked', async () => {
    renderWithProviders(<MonthlyTargetsListPage />);

    // Open modal
    const addButton = screen.getByText('Add Target');
    await userEvent.click(addButton);

    // Cancel form
    const cancelButton = screen.getByText('Cancel');
    await userEvent.click(cancelButton);

    // Modal should close
    expect(screen.queryByTestId('monthly-target-form')).not.toBeInTheDocument();
  });

  it('should handle delete operation', async () => {
    const { message } = await import('antd');
    renderWithProviders(<MonthlyTargetsListPage />);

    const deleteButton = screen.getByText('Delete target1');
    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockDeleteMutation.mutateAsync).toHaveBeenCalledWith('target1');
      expect(message.success).toHaveBeenCalledWith('Monthly target deleted successfully');
    });
  });

  it('should handle delete error', async () => {
    const { message } = await import('antd');
    mockDeleteMutation.mutateAsync.mockRejectedValue(new Error('Delete failed'));

    renderWithProviders(<MonthlyTargetsListPage />);

    const deleteButton = screen.getByText('Delete target1');
    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('Failed to delete monthly target');
    });
  });

  it('should handle copy from previous month', async () => {
    const { message } = await import('antd');
    renderWithProviders(<MonthlyTargetsListPage />);

    const copyButton = screen.getByText('Copy From Previous Month');
    await userEvent.click(copyButton);

    await waitFor(() => {
      expect(mockCopyMutation.mutateAsync).toHaveBeenCalledWith({
        fromYear: 2024,
        fromMonth: 5, // Previous month
        toYear: 2024,
        toMonth: 6, // Current month
        orderBookerIds: [], // All order bookers
      });
      expect(message.success).toHaveBeenCalledWith('Monthly targets copied successfully');
    });
  });

  it('should handle copy error', async () => {
    const { message } = await import('antd');
    mockCopyMutation.mutateAsync.mockRejectedValue(new Error('Copy failed'));

    renderWithProviders(<MonthlyTargetsListPage />);

    const copyButton = screen.getByText('Copy From Previous Month');
    await userEvent.click(copyButton);

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('Failed to copy monthly targets');
    });
  });

  it('should show loading state', () => {
    (useMonthlyTargetsByMonth as any).mockReturnValue({ 
      data: [], 
      isLoading: true 
    });

    renderWithProviders(<MonthlyTargetsListPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should handle empty data state', () => {
    (useMonthlyTargetsByMonth as any).mockReturnValue({ 
      data: [], 
      isLoading: false 
    });

    renderWithProviders(<MonthlyTargetsListPage />);

    // Should show zero stats
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should update filters when month/year changes', async () => {
    renderWithProviders(<MonthlyTargetsListPage />);

    // This would typically involve interacting with the date picker
    // For now, we'll just verify the component renders
    expect(screen.getByText('Monthly Targets')).toBeInTheDocument();
  });

  it('should display progress bars for achievement tracking', () => {
    renderWithProviders(<MonthlyTargetsListPage />);

    // Check for progress indicators in the summary
    const progressElements = document.querySelectorAll('[role="progressbar"]');
    expect(progressElements.length).toBeGreaterThan(0);
  });

  it('should handle export functionality', async () => {
    renderWithProviders(<MonthlyTargetsListPage />);

    const exportButton = screen.getByText('Export');
    expect(exportButton).toBeInTheDocument();
    
    // Export functionality would be tested here
    // For now, just verify the button exists
  });

  it('should display achievement percentage progress', () => {
    renderWithProviders(<MonthlyTargetsListPage />);

    // Check for progress bar in the summary statistics
    const progressBars = document.querySelectorAll('.ant-progress');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('should handle different achievement levels correctly', () => {
    const mixedAchievementTargets = [
      createMockMonthlyTarget({
        id: 'target1',
        orderBookerId: 'ob1',
        achievementPercentage: 120, // Over-achieved
      }),
      createMockMonthlyTarget({
        id: 'target2',
        orderBookerId: 'ob2',
        achievementPercentage: 45, // Under-achieved
      }),
    ];

    (useMonthlyTargetsByMonth as any).mockReturnValue({ 
      data: mixedAchievementTargets, 
      isLoading: false 
    });

    renderWithProviders(<MonthlyTargetsListPage />);

    // Should calculate mixed achievement properly
    expect(screen.getByText('2')).toBeInTheDocument(); // Total targets
    expect(screen.getByText('82.5%')).toBeInTheDocument(); // Average achievement
  });

  it('should filter targets by multiple criteria', async () => {
    renderWithProviders(<MonthlyTargetsListPage />);

    // Apply search filter
    const searchInput = screen.getByPlaceholderText('Search by order booker name...');
    await userEvent.type(searchInput, 'John');

    // Apply order booker filter
    const orderBookerSelect = screen.getByLabelText('Order Booker Filter');
    await userEvent.click(orderBookerSelect);
    await userEvent.click(screen.getByText('John Doe (جان ڈو)'));

    // Both filters should be applied
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });
});
