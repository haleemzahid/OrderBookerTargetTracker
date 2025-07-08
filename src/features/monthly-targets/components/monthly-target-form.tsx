import React from 'react';
import { Form, InputNumber, DatePicker, Select, Button, Card, Row, Col } from 'antd';
import { useCreateMonthlyTarget, useUpdateMonthlyTarget } from '../api/mutations';
import { useOrderBookers } from '../../order-bookers';
import dayjs from '../../../config/dayjs';
import type { MonthlyTarget, CreateMonthlyTargetRequest, UpdateMonthlyTargetRequest } from '../types';

const { Option } = Select;

interface MonthlyTargetFormProps {
  monthlyTarget?: MonthlyTarget;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const MonthlyTargetForm: React.FC<MonthlyTargetFormProps> = ({
  monthlyTarget,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const { data: orderBookers } = useOrderBookers();
  const createMutation = useCreateMonthlyTarget();
  const updateMutation = useUpdateMonthlyTarget();

  const isEditing = !!monthlyTarget;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (values: any) => {
    try {
      const formData = {
        ...values,
        year: values.monthYear.year(),
        month: values.monthYear.month() + 1,
      };

      if (isEditing) {
        const updateData: UpdateMonthlyTargetRequest = {
          targetAmount: formData.targetAmount,
        };
        await updateMutation.mutateAsync({ id: monthlyTarget.id, data: updateData });
      } else {
        const createData: CreateMonthlyTargetRequest = {
          orderBookerId: formData.orderBookerId,
          year: formData.year,
          month: formData.month,
          targetAmount: formData.targetAmount,
        };
        await createMutation.mutateAsync(createData);
      }
      
      form.resetFields();
      onSuccess?.();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const initialValues = monthlyTarget ? {
    ...monthlyTarget,
    monthYear: dayjs().year(monthlyTarget.year).month(monthlyTarget.month - 1),
  } : {
    monthYear: dayjs(),
    targetAmount: 0,
  };

  return (
    <Card title={isEditing ? 'Edit Monthly Target' : 'Create Monthly Target'}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={initialValues}
        disabled={isLoading}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="orderBookerId"
              label="Order Booker"
              rules={[{ required: true, message: 'Please select an order booker!' }]}
            >
              <Select
                placeholder="Select Order Booker"
                showSearch
                optionFilterProp="children"
                disabled={isEditing}
              >
                {orderBookers?.map(orderBooker => (
                  <Option key={orderBooker.id} value={orderBooker.id}>
                    {orderBooker.name} ({orderBooker.nameUrdu})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="monthYear"
              label="Month & Year"
              rules={[{ required: true, message: 'Please select month and year!' }]}
            >
              <DatePicker 
                picker="month" 
                style={{ width: '100%' }} 
                disabled={isEditing}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="targetAmount"
              label="Target Amount"
              rules={[
                { required: true, message: 'Please enter target amount!' },
                { type: 'number', min: 1, message: 'Target amount must be greater than 0!' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="0"
                min={0}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            {isEditing ? 'Update' : 'Create'} Monthly Target
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
