import React, { useEffect, useState } from 'react';
import { Form, Select, DatePicker, Input, Card, Row, Col, Divider, message } from 'antd';
import { useOrderBookers } from '../../order-bookers/api/queries';
import { useCreateOrder, useUpdateOrder } from '../api/mutations';
import { FormActions } from '../../../shared/components';
import type { Order, CreateOrderRequest } from '../types';
import dayjs from 'dayjs';
import { OrderItemsTable, type OrderItemData } from './OrderItemsTable';

const { Option } = Select;
const { TextArea } = Input;

interface OrderFormProps {
  order?: Order;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({ 
  order, 
  onSuccess, 
  onCancel
}) => {
  const [form] = Form.useForm();
  const [orderItems, setOrderItems] = useState<OrderItemData[]>([]);
  const { data: orderBookers, isLoading: isLoadingOrderBookers } = useOrderBookers();
  
  const createMutation = useCreateOrder();
  const updateMutation = useUpdateOrder();
  
  const isEditing = !!order;
  const isLoading = createMutation.isPending || updateMutation.isPending;
  
  useEffect(() => {
    if (order) {
      form.setFieldsValue({
        orderBookerId: order.orderBookerId,
        orderDate: dayjs(order.orderDate),
        notes: order.notes,
      });
      // TODO: Load existing order items when editing
      // This would require a query to get order items by order ID
    } else {
      form.setFieldsValue({
        orderDate: dayjs(),
      });
      setOrderItems([]);
    }
  }, [order, form]);
  
  const handleSubmit = async (values: any) => {
    try {
      // Validate that we have at least one item when creating a new order
      if (!isEditing && orderItems.length === 0) {
        message.error('Please add at least one product to the order');
        return;
      }

      const requestData: CreateOrderRequest = {
        orderBookerId: values.orderBookerId,
        orderDate: values.orderDate.toDate(),
        notes: values.notes,
        items: orderItems.map(item => ({
          productId: item.productId!,
          cartons: item.cartons!,
          costPrice: item.costPrice!,
          sellPrice: item.sellPrice!,
          returnCartons: item.returnCartons
        })),
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ 
          id: order.id, 
          data: {
            orderBookerId: requestData.orderBookerId,
            orderDate: requestData.orderDate,
            notes: requestData.notes,
          }
        });
        message.success('Order updated successfully');
      } else {
        await createMutation.mutateAsync(requestData);
        message.success('Order created successfully');
      }
      
      form.resetFields();
      setOrderItems([]);
      onSuccess?.();
    } catch (error) {
      console.error('Form submission error:', error);
      message.error(isEditing ? 'Failed to update order' : 'Failed to create order');
    }
  };

  const handleItemsChange = (items: OrderItemData[]) => {
    setOrderItems(items);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        orderDate: dayjs(),
      }}
    >
      <Card title="Order Information" size="small">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="orderBookerId"
              label="Order Booker"
              rules={[
                { required: true, message: 'Please select an order booker' },
              ]}
            >
              <Select
                placeholder="Select Order Booker"
                loading={isLoadingOrderBookers}
                showSearch
                optionFilterProp="children"
              >
                {orderBookers?.map(orderBooker => (
                  <Option key={orderBooker.id} value={orderBooker.id}>
                    {orderBooker.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="orderDate"
              label="Order Date"
              rules={[
                { required: true, message: 'Please select order date' },
              ]}
            >
              <DatePicker 
                style={{ width: '100%' }} 
                format="DD/MM/YYYY"
              />
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="notes"
              label="Notes (Optional)"
            >
              <TextArea 
                rows={2}
                placeholder="Enter any additional notes..."
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Divider />
      
      <Card title="Order Items" size="small">
        <OrderItemsTable
          items={orderItems}
          onItemsChange={handleItemsChange}
          loading={isLoading}
        />
      </Card>

      <FormActions
        isLoading={isLoading}
        onCancel={onCancel}
        submitLabel={isEditing ? 'Update Order' : 'Create Order'}
      />
    </Form>
  );
};
