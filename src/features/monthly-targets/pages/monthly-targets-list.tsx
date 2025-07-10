import React, { useState, useMemo } from 'react';
import { DatePicker, Select, Space, Modal, message, Button } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useMonthlyTargetsByMonth } from '../api/queries';
import { useDeleteMonthlyTarget, useCopyFromPreviousMonth } from '../api/mutations';
import { useOrderBookers } from '../../order-bookers';
import { MonthlyTargetForm, MonthlyTargetTable } from '../components';
import { ActionBar, ListPageLayout } from '../../../shared/components';
import { useExport } from '../../../shared/hooks';
import { ExportColumn } from '../../../shared/utils/export/exportService';
import dayjs, { Dayjs } from 'dayjs';
import type { MonthlyTarget, MonthlyTargetWithOrderBooker } from '../types';

const { Option } = Select;

interface FilterState {
  year: number;
  month: number;
  orderBookerIds: string[];
}

export const MonthlyTargetsListPage: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>({
    year: dayjs().year(),
    month: dayjs().month() + 1,
    orderBookerIds: [],
  });
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<MonthlyTarget | null>(null);

  // Fetch data
  const { data: orderBookers } = useOrderBookers();
  const { data: monthlyTargets, isLoading } = useMonthlyTargetsByMonth(filters.year, filters.month);
  const deleteMutation = useDeleteMonthlyTarget();
  const copyMutation = useCopyFromPreviousMonth();
  
  // Set up export functionality
  const exportFileName = `monthly-targets-${filters.year}-${filters.month}`;
  const exportTitle = `Monthly Targets - ${dayjs().year(filters.year).month(filters.month - 1).format('MMMM YYYY')}`;
  
  const { exportData, isExporting } = useExport({
    fileName: exportFileName,
    title: exportTitle,
  });

  // Filter data based on search and order booker filter and prepare for export
  const filteredData = useMemo(() => {
    if (!monthlyTargets) return [];

    let filtered = monthlyTargets;

    // Filter by order booker
    if (filters.orderBookerIds.length > 0) {
      filtered = filtered.filter((target) => filters.orderBookerIds.includes(target.orderBookerId));
    }

    // Add order booker info to targets and prepare display fields for export
    const targetsWithOrderBooker: MonthlyTargetWithOrderBooker[] = filtered.map((target) => {
      // Find order booker
      const orderBooker = orderBookers?.find((ob) => ob.id === target.orderBookerId);
      
      // Determine status text
      let statusDisplay = 'Not Started';
      if (target.achievementPercentage >= 100) {
        statusDisplay = 'Achieved';
      } else if (target.achievementPercentage >= 80) {
        statusDisplay = 'On Track';
      } else if (target.achievementPercentage >= 50) {
        statusDisplay = 'Behind';
      } else if (target.achievementPercentage > 0) {
        statusDisplay = 'At Risk';
      }
      
      return {
        ...target,
        orderBooker,
        orderBookerName: orderBooker?.name || '',
        monthDisplay: dayjs().year(target.year).month(target.month - 1).format('MMM YYYY'),
        statusDisplay,
      };
    });

    // Filter by search text
    if (searchText) {
      const search = searchText.toLowerCase();
      return targetsWithOrderBooker.filter(
        (target) =>
          target.orderBooker?.name.toLowerCase().includes(search) ||
          target.orderBooker?.nameUrdu.includes(search)
      );
    }

    return targetsWithOrderBooker;
  }, [monthlyTargets, orderBookers, filters.orderBookerIds, searchText]);

  const handleMonthYearChange = (date: Dayjs | null) => {
    if (date) {
      setFilters((prev) => ({
        ...prev,
        year: date.year(),
        month: date.month() + 1,
      }));
    }
  };

  const handleOrderBookerFilter = (orderBookerIds: string[]) => {
    setFilters((prev) => ({ ...prev, orderBookerIds }));
  };

  const handleAdd = () => {
    setEditingTarget(null);
    setIsModalOpen(true);
  };

  const handleEdit = (target: MonthlyTarget) => {
    setEditingTarget(target);
    setIsModalOpen(true);
  };

  const handleDelete = async (target: MonthlyTarget) => {
    try {
      await deleteMutation.mutateAsync(target.id);
      message.success('Monthly target deleted successfully');
    } catch (error) {
      message.error('Failed to delete monthly target');
    }
  };

  const handleCopyFromPrevious = async () => {
    try {
      const fromMonth = filters.month === 1 ? 12 : filters.month - 1;
      const fromYear = filters.month === 1 ? filters.year - 1 : filters.year;

      await copyMutation.mutateAsync({
        fromYear,
        fromMonth,
        toYear: filters.year,
        toMonth: filters.month,
        orderBookerIds: filters.orderBookerIds.length > 0 ? filters.orderBookerIds : undefined,
      });

      message.success('Targets copied from previous month successfully');
    } catch (error) {
      message.error('Failed to copy targets from previous month');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTarget(null);
  };

  const handleFormSuccess = () => {
    handleModalClose();
    message.success(
      editingTarget ? 'Monthly target updated successfully' : 'Monthly target created successfully'
    );
  };

  // Export functionality
  const getExportColumns = (): ExportColumn[] => [
    { title: 'Month', dataIndex: 'monthDisplay' },
    { title: 'Order Booker', dataIndex: 'orderBookerName' },
    { title: 'Target Amount', dataIndex: 'targetAmount' },
    { title: 'Achieved Amount', dataIndex: 'achievedAmount' },
    { title: 'Remaining', dataIndex: 'remainingAmount' },
    { title: 'Achievement %', dataIndex: 'achievementPercentage' },
    { title: 'Daily Target', dataIndex: 'dailyTargetAmount' },
    { title: 'Status', dataIndex: 'statusDisplay' },
  ];

  const handleExport = async (format: string) => {
    await exportData(format, filteredData, getExportColumns());
  };

  const renderExtraActions = () => {
    return (
      <Space size="small">
        <Button
          icon={<CopyOutlined />}
          onClick={handleCopyFromPrevious}
          loading={copyMutation.isPending}
        >
          Copy From Previous
        </Button>
        <DatePicker
          picker="month"
          value={dayjs()
            .year(filters.year)
            .month(filters.month - 1)}
          onChange={handleMonthYearChange}
          style={{ width: 120 }}
        />
        <Select
          mode="multiple"
          id="filterByOrderBooker"
          placeholder="Filter by Order Booker"
          value={filters.orderBookerIds}
          onChange={handleOrderBookerFilter}
          style={{ width: 200 }}
          maxTagCount="responsive"
        >
          {orderBookers?.map((orderBooker) => (
            <Option key={orderBooker.id} value={orderBooker.id}>
              {orderBooker.name}
            </Option>
          ))}
        </Select>
      </Space>
    );
  };



  return (
    <ListPageLayout
      title="Monthly Targets"
      extraActions={
        <ActionBar
          onSearch={setSearchText}
          searchValue={searchText}
          searchPlaceholder="Search targets..."
          onAdd={handleAdd}
          addLabel="Add Target"
          onExport={handleExport}
          extraActions={renderExtraActions()}
        />
      }
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <MonthlyTargetTable
          data={filteredData}
          loading={isLoading || isExporting}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Space>

      {/* Form Modal */}
      <Modal
        title={editingTarget ? 'Edit Monthly Target' : 'Add Monthly Target'}
        open={isModalOpen}
        onCancel={handleModalClose}
        footer={null}
        width={600}
      >
        <MonthlyTargetForm
          monthlyTarget={editingTarget || undefined}
          onSuccess={handleFormSuccess}
          onCancel={handleModalClose}
        />
      </Modal>
    </ListPageLayout>
  );
};
