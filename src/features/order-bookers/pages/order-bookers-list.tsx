import React, { useState, useMemo } from 'react';
import { Modal, message, Space, Select } from 'antd';
import { useOrderBookers } from '../api/queries';
import { useDeleteOrderBooker } from '../api/mutations';
import { OrderBookerTable } from '../components/order-booker-table';
import { OrderBookerForm } from '../components/order-booker-form';
import { ActionBar, ListPageLayout } from '../../../shared/components';
import { useExport } from '../../../shared/hooks';
import { ExportColumn } from '../../../shared/utils/export/exportService';
import type { OrderBooker } from '../types';

const { Option } = Select;

interface FilterState {
  status: string;
  territory: string; // Keeping for future use
}

export const OrderBookersListPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrderBooker, setEditingOrderBooker] = useState<OrderBooker | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    territory: 'all',
  });

  // Set up export functionality
  const exportFileName = 'order-bookers';
  const exportTitle = 'Order Bookers';

  const { exportData, isExporting } = useExport({
    fileName: exportFileName,
    title: exportTitle,
  });

  const {
    data: orderBookers,
    isLoading,
    error,
  } = useOrderBookers({
    search: searchText,
  });
  const deleteMutation = useDeleteOrderBooker();

  const handleAdd = () => {
    setEditingOrderBooker(null);
    setIsModalOpen(true);
  };

  const handleEdit = (orderBooker: OrderBooker) => {
    setEditingOrderBooker(orderBooker);
    setIsModalOpen(true);
  };

  const handleDelete = async (orderBooker: OrderBooker) => {
    try {
      await deleteMutation.mutateAsync(orderBooker.id);
      message.success('Order booker deleted successfully');
    } catch (error) {
      message.error('Failed to delete order booker');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingOrderBooker(null);
  };

  const handleFormSuccess = () => {
    handleModalClose();
    message.success(
      editingOrderBooker ? 'Order booker updated successfully' : 'Order booker created successfully'
    );
  };

  // Filter data based on selected filters
  const filteredData = useMemo(() => {
    if (!orderBookers) return [];

    let filtered = orderBookers;

    // Filter by activity status
    if (filters.status !== 'all') {
      const isActive = filters.status === 'active';
      filtered = filtered.filter((orderBooker) => orderBooker.isActive === isActive);
    }

    return filtered;
  }, [orderBookers, filters.status]);



  const handleStatusFilter = (status: string) => {
    setFilters((prev) => ({ ...prev, status }));
  };

  // Export functionality
  const getExportColumns = (): ExportColumn[] => [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Name (Urdu)', dataIndex: 'nameUrdu' },
    { title: 'Phone', dataIndex: 'phone' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Status', dataIndex: 'isActive', render: (value) => (value ? 'Active' : 'Inactive') },
  ];

  const handleExport = async (format: string) => {
    await exportData(format, filteredData, getExportColumns());
  };

  if (error) {
    return <div>Error loading order bookers</div>;
  }

  const renderExtraActions = () => {
    return (
      <Space size="small">
        <Select
          placeholder="Filter by Status"
          value={filters.status}
          onChange={handleStatusFilter}
          style={{ width: 150 }}
          allowClear
        >
          <Option value="all">All Statuses</Option>
          <Option value="active">Active</Option>
          <Option value="inactive">Inactive</Option>
        </Select>
      </Space>
    );
  };

  return (
    <ListPageLayout
      title="Order Bookers"
      extraActions={
        <ActionBar
          onSearch={setSearchText}
          searchValue={searchText}
          searchPlaceholder="Search order bookers..."
          onAdd={handleAdd}
          addLabel="Add Order Booker"
          onExport={handleExport}
          extraActions={renderExtraActions()}
        />
      }
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {' '}
        <OrderBookerTable
          data={filteredData}
          loading={isLoading || isExporting}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Space>

      <Modal
        title={editingOrderBooker ? 'Edit Order Booker' : 'Add Order Booker'}
        open={isModalOpen}
        onCancel={handleModalClose}
        footer={null}
        width={600}
      >
        <OrderBookerForm
          orderBooker={editingOrderBooker || undefined}
          onSuccess={handleFormSuccess}
          onCancel={handleModalClose}
        />
      </Modal>
    </ListPageLayout>
  );
};
