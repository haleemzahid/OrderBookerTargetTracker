import React, { useState } from 'react';
import { Card, Button, Modal, message, Input, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useOrderBookers } from '../api/queries';
import { useDeleteOrderBooker } from '../api/mutations';
import { OrderBookerTable } from '../components/order-booker-table';
import { OrderBookerForm } from '../components/order-booker-form';
import type { OrderBooker } from '../types';

const { Search } = Input;

export const OrderBookersListPage: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingOrderBooker, setEditingOrderBooker] = useState<OrderBooker | null>(null);
  const [searchText, setSearchText] = useState('');

  const { data: orderBookers, isLoading, error } = useOrderBookers({
    search: searchText,
  });
  const deleteMutation = useDeleteOrderBooker();

  const handleAdd = () => {
    setEditingOrderBooker(null);
    setIsModalVisible(true);
  };

  const handleEdit = (orderBooker: OrderBooker) => {
    setEditingOrderBooker(orderBooker);
    setIsModalVisible(true);
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
    setIsModalVisible(false);
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

  if (error) {
    return <div>Error loading order bookers</div>;
  }

  return (
    <div>
      <Card
        title="Order Bookers"
        extra={
          <Space>
            <Search
              placeholder="Search order bookers..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Add Order Booker
            </Button>
          </Space>
        }
      >
        <OrderBookerTable
          data={orderBookers || []}
          loading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Card>

      <Modal
        title={editingOrderBooker ? 'Edit Order Booker' : 'Add Order Booker'}
        open={isModalVisible}
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
    </div>
  );
};
