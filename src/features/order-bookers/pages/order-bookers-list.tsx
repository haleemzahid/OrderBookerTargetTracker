import React, { useState, useMemo } from 'react';
import { Modal, message, Space, Select } from 'antd';
import { useOrderBookers } from '../api/queries';
import { useDeleteOrderBooker } from '../api/mutations';
import { OrderBookerTable } from '../components/order-booker-table';
import { OrderBookerForm } from '../components/order-booker-form';
import { ActionBar, ListPageLayout } from '../../../shared/components';
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

  const { data: orderBookers, isLoading, error } = useOrderBookers({
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
      editingOrderBooker
        ? 'Order booker updated successfully'
        : 'Order booker created successfully'
    );
  };

  // Filter data based on selected filters
  const filteredData = useMemo(() => {
    if (!orderBookers) return [];
    
    let filtered = orderBookers;
    
    // Filter by activity status
    if (filters.status !== 'all') {
      const isActive = filters.status === 'active';
      filtered = filtered.filter(orderBooker => orderBooker.isActive === isActive);
    }
    
    // We don't have territory in the current model, so just returning the filtered data
    return filtered;
  }, [orderBookers, filters.status]);
  
  const handleTerritoryFilter = (territory: string) => {
    setFilters(prev => ({ ...prev, territory }));
  };
  
  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ ...prev, status }));
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
          onExport={() => {}}
          extraActions={renderExtraActions()}
        />
      }
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <OrderBookerTable
          data={filteredData}
          loading={isLoading}
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
