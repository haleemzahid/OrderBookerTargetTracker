import React from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { Spin, Button, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useOrder } from '../api/queries';
import { OrderForm } from '../components/order-form';
import { ListPageLayout } from '../../../shared/components';

export const OrderFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams({ strict: false });
  
  const isEditing = !!orderId;
  const { data: order, isLoading } = useOrder(orderId!);

  const handleSuccess = () => {
    navigate({ to: '/orders' });
  };

  const handleCancel = () => {
    navigate({ to: '/orders' });
  };

  if (isEditing && isLoading) {
    return (
      <ListPageLayout title="Loading Order...">
        <Spin size="large" style={{ display: 'block', textAlign: 'center', marginTop: 50 }} />
      </ListPageLayout>
    );
  }

  const titleWithBackButton = (
    <Space>
      <Button 
        type="text" 
        icon={<ArrowLeftOutlined />} 
        onClick={handleCancel}
      />
      {isEditing ? 'Edit Order' : 'Create New Order'}
    </Space>
  );

  return (
    <ListPageLayout title={titleWithBackButton}>
      <OrderForm
        order={order || undefined}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </ListPageLayout>
  );
};
