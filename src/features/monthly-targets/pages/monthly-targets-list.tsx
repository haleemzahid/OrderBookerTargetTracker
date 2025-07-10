import React, { useState, useMemo } from 'react';
import { Form, DatePicker, Select, Space, Modal, message, Button } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useMonthlyTargetsByMonth } from '../api/queries';
import { useDeleteMonthlyTarget, useCopyFromPreviousMonth } from '../api/mutations';
import { useOrderBookers } from '../../order-bookers';
import { MonthlyTargetTable } from '../components/monthly-target-table';
import { MonthlyTargetForm } from '../components/monthly-target-form';
import { ActionBar, FilterContainer, FilterItem, ListPageLayout } from '../../../shared/components';
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

  // Filter data based on search and order booker filter
  const filteredData = useMemo(() => {
    if (!monthlyTargets) return [];

    let filtered = monthlyTargets;

    // Filter by order booker
    if (filters.orderBookerIds.length > 0) {
      filtered = filtered.filter((target) => filters.orderBookerIds.includes(target.orderBookerId));
    }

    // Add order booker info to targets
    const targetsWithOrderBooker: MonthlyTargetWithOrderBooker[] = filtered.map((target) => ({
      ...target,
      orderBooker: orderBookers?.find((ob) => ob.id === target.orderBookerId),
    }));

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

  const renderFilters = () => (
    <FilterContainer gutter={12}>
      <FilterItem span={6} md={6} lg={4}>
        <Form.Item label="Month & Year" style={{ marginBottom: 0 }}>
          <DatePicker
            picker="month"
            value={dayjs()
              .year(filters.year)
              .month(filters.month - 1)}
            onChange={handleMonthYearChange}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </FilterItem>
      <FilterItem span={8} md={8} lg={6}>
        <Form.Item label="Order Booker" style={{ marginBottom: 0 }}>
          <Select
            mode="multiple"
            id="filterByOrderBooker"
            placeholder="Filter by Order Booker"
            value={filters.orderBookerIds}
            onChange={handleOrderBookerFilter}
            style={{ width: '100%' }}
            maxTagCount="responsive"
          >
            {orderBookers?.map((orderBooker) => (
              <Option key={orderBooker.id} value={orderBooker.id}>
                {orderBooker.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </FilterItem>
    </FilterContainer>
  );

  const renderExtraActions = () => (
    <Button
      icon={<CopyOutlined />}
      onClick={handleCopyFromPrevious}
      loading={copyMutation.isPending}
      size="small"
    >
      Copy From Previous
    </Button>
  );

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
          onExport={() => {}}
          extraActions={renderExtraActions()}
        />
      }
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {renderFilters()}

        <MonthlyTargetTable
          data={filteredData}
          loading={isLoading}
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
