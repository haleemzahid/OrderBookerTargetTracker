import React, { useEffect } from 'react';
import { Form, Select, DatePicker, Input, Card, Row, Col, Divider } from 'antd';
import { useOrderBookers } from '../../order-bookers/api/queries';
import { useCreateOrder, useUpdateOrder } from '../api/mutations';
import { FormActions } from '../../../shared/components';
import type { Order, CreateOrderRequest } from '../types';
import dayjs from 'dayjs';
import { OrderItemsTable } from '.';

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
        supplyDate: order.supplyDate ? dayjs(order.supplyDate) : null,
        notes: order.notes,
      });
    } else {
      form.setFieldsValue({
        orderDate: dayjs(),
      });
    }
  }, [order, form]);
  
  const handleSubmit = async (values: any) => {
    try {
      const requestData: CreateOrderRequest = {
        orderBookerId: values.orderBookerId,
        orderDate: values.orderDate.toDate(),
        supplyDate: values.supplyDate?.toDate() || null,
        notes: values.notes,
        items: [], // Items will be handled separately in the items table
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ 
          id: order.id, 
          data: {
            orderBookerId: requestData.orderBookerId,
            orderDate: requestData.orderDate,
            supplyDate: requestData.supplyDate,
            notes: requestData.notes,
          }
        });
      } else {
        await createMutation.mutateAsync(requestData);
      }
      
      form.resetFields();
      onSuccess?.();
    } catch (error) {
      console.error('Form submission error:', error);
    }
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
          <Col span={12}>
            <Form.Item
              name="supplyDate"
              label="Supply Date (Optional)"
            >
              <DatePicker 
                style={{ width: '100%' }} 
                format="DD/MM/YYYY"
                placeholder="Select supply date"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
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

      {isEditing && (
        <>
          <Divider />
          <Card title="Order Items" size="small">
            <OrderItemsTable
              orderId={order.id}
              items={[]} // Will be loaded by the component
              products={[]} // Will be loaded by the component
              onItemAdd={() => {}}
              onItemUpdate={() => {}}
              onItemDelete={() => {}}
              editable={true}
            />
          </Card>
        </>
      )}

      <FormActions
        isLoading={isLoading}
        onCancel={onCancel}
        submitLabel={isEditing ? 'Update Order' : 'Create Order'}
      />
    </Form>
  );
};
