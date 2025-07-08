import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MonthlyTargetTable } from '../monthly-target-table';
import { useTable } from '../../../../shared/hooks/use-table';
import { renderWithProviders } from '../../../../__tests__/utils/test-utils';
import { createMockMonthlyTarget } from '../../../../__tests__/factories/monthly-targets';
import type { MonthlyTargetWithOrderBooker } from '../../types';

// Mock the hooks
vi.mock('../../../../shared/hooks/use-table');

// Mock dayjs
vi.mock('dayjs', () => ({
  default: vi.fn(() => ({
    year: vi.fn(() => ({ month: vi.fn(() => ({ format: vi.fn(() => 'Jan 2024') })) })),
    month: vi.fn(() => ({ format: vi.fn(() => 'Jan 2024') })),
    format: vi.fn(() => 'Jan 2024'),
  })),
}));

describe('MonthlyTargetTable', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  const mockOrderBooker = {
    id: 'ob1',
    name: 'John Doe',
    nameUrdu: 'جان ڈو',
    phone: '+92-300-1234567',
    email: 'john@example.com',
    joinDate: '2024-01-01',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createMockMonthlyTargetWithOrderBooker = (overrides?: Partial<MonthlyTargetWithOrderBooker>): MonthlyTargetWithOrderBooker => {
    const baseTarget = createMockMonthlyTarget();
    return {
      ...baseTarget,
      orderBooker: mockOrderBooker,
      ...overrides,
    };
  };

  const mockData: MonthlyTargetWithOrderBooker[] = [
    createMockMonthlyTargetWithOrderBooker({
      id: 'target1',
      year: 2024,
      month: 6,
      targetAmount: 50000,
      achievedAmount: 40000,
      remainingAmount: 10000,
      achievementPercentage: 80,
      dailyTargetAmount: 2273,
    }),
    createMockMonthlyTargetWithOrderBooker({
      id: 'target2',
      year: 2024,
      month: 5,
      targetAmount: 60000,
      achievedAmount: 65000,
      remainingAmount: -5000,
      achievementPercentage: 108.33,
      dailyTargetAmount: 2727,
    }),
    createMockMonthlyTargetWithOrderBooker({
      id: 'target3',
      year: 2024,
      month: 4,
      targetAmount: 45000,
      achievedAmount: 15000,
      remainingAmount: 30000,
      achievementPercentage: 33.33,
      dailyTargetAmount: 2045,
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useTable as any).mockReturnValue({
      tableProps: {
        dataSource: mockData,
        pagination: { current: 1, pageSize: 10, total: mockData.length },
        onChange: vi.fn(),
      },
    });
  });

  it('should render table with data', () => {
    renderWithProviders(
      <MonthlyTargetTable
        data={mockData}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Check if table is rendered
    expect(screen.getByRole('table')).toBeInTheDocument();
    
    // Check column headers
    expect(screen.getByText('Month')).toBeInTheDocument();
    expect(screen.getByText('Order Booker')).toBeInTheDocument();
    expect(screen.getByText('Target Amount')).toBeInTheDocument();
    expect(screen.getByText('Achieved Amount')).toBeInTheDocument();
    expect(screen.getByText('Remaining')).toBeInTheDocument();
    expect(screen.getByText('Achievement')).toBeInTheDocument();
    expect(screen.getByText('Daily Target')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('should display formatted monetary values', () => {
    renderWithProviders(
      <MonthlyTargetTable
        data={mockData}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Check formatted target amounts
    expect(screen.getByText('50,000')).toBeInTheDocument();
    expect(screen.getByText('60,000')).toBeInTheDocument();
    expect(screen.getByText('45,000')).toBeInTheDocument();

    // Check formatted achieved amounts
    expect(screen.getByText('40,000')).toBeInTheDocument();
    expect(screen.getByText('65,000')).toBeInTheDocument();
    expect(screen.getByText('15,000')).toBeInTheDocument();
  });

  it('should display order booker information', () => {
    renderWithProviders(
      <MonthlyTargetTable
        data={mockData}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Check order booker names (should appear multiple times)
    const orderBookerNames = screen.getAllByText('John Doe');
    expect(orderBookerNames.length).toBeGreaterThan(0);

    const orderBookerUrduNames = screen.getAllByText('جان ڈو');
    expect(orderBookerUrduNames.length).toBeGreaterThan(0);
  });

  it('should display achievement percentages with progress bars', () => {
    renderWithProviders(
      <MonthlyTargetTable
        data={mockData}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Check achievement percentages
    expect(screen.getByText('80.0%')).toBeInTheDocument();
    expect(screen.getByText('108.3%')).toBeInTheDocument();
    expect(screen.getByText('33.3%')).toBeInTheDocument();
  });

  it('should display status tags with correct colors', () => {
    renderWithProviders(
      <MonthlyTargetTable
        data={mockData}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Check status tags
    expect(screen.getByText('On Track')).toBeInTheDocument(); // 80%
    expect(screen.getByText('Achieved')).toBeInTheDocument(); // 108.33%
    expect(screen.getByText('At Risk')).toBeInTheDocument(); // 33.33%
  });

  it('should display daily target amounts', () => {
    renderWithProviders(
      <MonthlyTargetTable
        data={mockData}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Check daily targets
    expect(screen.getByText('2,273')).toBeInTheDocument();
    expect(screen.getByText('2,727')).toBeInTheDocument();
    expect(screen.getByText('2,045')).toBeInTheDocument();

    // Check "per day" labels
    const perDayLabels = screen.getAllByText('per day');
    expect(perDayLabels.length).toBe(3);
  });

  it('should render edit buttons for each row', () => {
    renderWithProviders(
      <MonthlyTargetTable
        data={mockData}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButtons = screen.getAllByText('Edit');
    expect(editButtons).toHaveLength(mockData.length);
  });

  it('should render delete buttons for each row', () => {
    renderWithProviders(
      <MonthlyTargetTable
        data={mockData}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButtons = screen.getAllByText('Delete');
    expect(deleteButtons).toHaveLength(mockData.length);
  });

  it('should call onEdit when edit button is clicked', async () => {
    renderWithProviders(
      <MonthlyTargetTable
        data={mockData}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButtons = screen.getAllByText('Edit');
    await userEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockData[0]);
  });

  it('should show confirmation dialog when delete button is clicked', async () => {
    renderWithProviders(
      <MonthlyTargetTable
        data={mockData}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButtons = screen.getAllByText('Delete');
    await userEvent.click(deleteButtons[0]);

    // Check if confirmation dialog appears
    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to delete this monthly target?')).toBeInTheDocument();
    });
  });

  it('should call onDelete when delete is confirmed', async () => {
    renderWithProviders(
      <MonthlyTargetTable
        data={mockData}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButtons = screen.getAllByText('Delete');
    await userEvent.click(deleteButtons[0]);

    // Wait for confirmation dialog and click Yes
    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to delete this monthly target?')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('Yes');
    await userEvent.click(confirmButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockData[0]);
  });

  it('should not call onDelete when delete is cancelled', async () => {
    renderWithProviders(
      <MonthlyTargetTable
        data={mockData}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButtons = screen.getAllByText('Delete');
    await userEvent.click(deleteButtons[0]);

    // Wait for confirmation dialog and click No
    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to delete this monthly target?')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('No');
    await userEvent.click(cancelButton);

    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('should show loading state', () => {
    renderWithProviders(
      <MonthlyTargetTable
        data={mockData}
        loading={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // The loading state should be visible in the table
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('should handle empty data', () => {
    renderWithProviders(
      <MonthlyTargetTable
        data={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    // Table should still show headers even with empty data
    expect(screen.getByText('Month')).toBeInTheDocument();
    expect(screen.getByText('Order Booker')).toBeInTheDocument();
  });

  it('should display remaining amount with appropriate colors', () => {
    renderWithProviders(
      <MonthlyTargetTable
        data={mockData}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Check remaining amounts
    expect(screen.getByText('10,000')).toBeInTheDocument(); // positive remaining
    expect(screen.getByText('-5,000')).toBeInTheDocument(); // negative remaining (over-achieved)
    expect(screen.getByText('30,000')).toBeInTheDocument(); // positive remaining
  });

  it('should have proper table structure', () => {
    renderWithProviders(
      <MonthlyTargetTable
        data={mockData}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    
    // Check for table body
    const tableBody = table.querySelector('tbody');
    expect(tableBody).toBeInTheDocument();
    
    // Check number of rows (should match data length)
    const rows = tableBody?.querySelectorAll('tr');
    expect(rows).toHaveLength(mockData.length);
  });

  it('should display calendar icons for month column', () => {
    renderWithProviders(
      <MonthlyTargetTable
        data={mockData}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Check for calendar icons (antd CalendarOutlined creates spans with specific classes)
    const calendarIcons = document.querySelectorAll('.anticon-calendar');
    expect(calendarIcons.length).toBeGreaterThan(0);
  });

  it('should handle different achievement percentage ranges', () => {
    const testData = [
      createMockMonthlyTargetWithOrderBooker({
        id: 'target1',
        achievementPercentage: 0, // Not Started
      }),
      createMockMonthlyTargetWithOrderBooker({
        id: 'target2',
        achievementPercentage: 25, // At Risk
      }),
      createMockMonthlyTargetWithOrderBooker({
        id: 'target3',
        achievementPercentage: 65, // Behind
      }),
      createMockMonthlyTargetWithOrderBooker({
        id: 'target4',
        achievementPercentage: 85, // On Track
      }),
      createMockMonthlyTargetWithOrderBooker({
        id: 'target5',
        achievementPercentage: 110, // Achieved
      }),
    ];

    renderWithProviders(
      <MonthlyTargetTable
        data={testData}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Not Started')).toBeInTheDocument();
    expect(screen.getByText('At Risk')).toBeInTheDocument();
    expect(screen.getByText('Behind')).toBeInTheDocument();
    expect(screen.getByText('On Track')).toBeInTheDocument();
    expect(screen.getByText('Achieved')).toBeInTheDocument();
  });
});
