import React from 'react';
import { Form, Input, Button, Card } from 'antd';
import { useCreateOrderBooker, useUpdateOrderBooker } from '../api/mutations';
import type { OrderBooker, CreateOrderBookerRequest } from '../types';

interface OrderBookerFormProps {
  orderBooker?: OrderBooker;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const OrderBookerForm: React.FC<OrderBookerFormProps> = ({
  orderBooker,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const createMutation = useCreateOrderBooker();
  const updateMutation = useUpdateOrderBooker();

  const isEditing = !!orderBooker;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (values: CreateOrderBookerRequest) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: orderBooker.id, data: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      form.resetFields();
      onSuccess?.();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Card title={isEditing ? 'Edit Order Booker' : 'Create Order Booker'}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={orderBooker}
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please input name!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="nameUrdu"
          label="Name (Urdu)"
          rules={[{ required: true, message: 'Please input Urdu name!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Phone"
          rules={[{ required: true, message: 'Please input phone!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[{ type: 'email', message: 'Please input valid email!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            {isEditing ? 'Update' : 'Create'}
          </Button>
          {onCancel && (
            <Button style={{ marginLeft: 8 }} onClick={onCancel}>
              Cancel
            </Button>
          )}
        </Form.Item>
      </Form>
    </Card>
  );
};
