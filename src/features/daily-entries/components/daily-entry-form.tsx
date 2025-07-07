import React from 'react';
import { Form, Input, InputNumber, DatePicker, Select, Button, Card, Row, Col } from 'antd';
import { useCreateDailyEntry, useUpdateDailyEntry } from '../api/mutations';
import { useOrderBookers } from '../../order-bookers';
import dayjs from 'dayjs';
import type { DailyEntry, CreateDailyEntryRequest, UpdateDailyEntryRequest } from '../types';

const { Option } = Select;
const { TextArea } = Input;

interface DailyEntryFormProps {
  dailyEntry?: DailyEntry;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const DailyEntryForm: React.FC<DailyEntryFormProps> = ({
  dailyEntry,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const { data: orderBookers } = useOrderBookers();
  const createMutation = useCreateDailyEntry();
  const updateMutation = useUpdateDailyEntry();

  const isEditing = !!dailyEntry;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (values: any) => {
    try {
      const formData = {
        ...values,
        date: values.date.toDate(),
      };

      if (isEditing) {
        const updateData: UpdateDailyEntryRequest = {
          sales: formData.sales,
          returns: formData.returns,
          totalCarton: formData.totalCarton,
          returnCarton: formData.returnCarton,
          notes: formData.notes,
        };
        await updateMutation.mutateAsync({ id: dailyEntry.id, data: updateData });
      } else {
        const createData: CreateDailyEntryRequest = {
          orderBookerId: formData.orderBookerId,
          date: formData.date,
          sales: formData.sales,
          returns: formData.returns,
          totalCarton: formData.totalCarton,
          returnCarton: formData.returnCarton,
          notes: formData.notes,
        };
        await createMutation.mutateAsync(createData);
      }
      
      form.resetFields();
      onSuccess?.();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const initialValues = dailyEntry ? {
    ...dailyEntry,
    date: dayjs(dailyEntry.date),
  } : {
    date: dayjs(),
    sales: 0,
    returns: 0,
    totalCarton: 0,
    returnCarton: 0,
  };

  return (
    <Card title={isEditing ? 'Edit Daily Entry' : 'Create Daily Entry'}>
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
              name="date"
              label="Date"
              rules={[{ required: true, message: 'Please select a date!' }]}
            >
              <DatePicker style={{ width: '100%' }} disabled={isEditing} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="sales"
              label="Sales Amount"
              rules={[{ required: true, message: 'Please enter sales amount!' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="0"
                min={0}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="returns"
              label="Returns Amount"
              rules={[{ required: true, message: 'Please enter returns amount!' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="0"
                min={0}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="totalCarton"
              label="Total Cartons"
              rules={[{ required: true, message: 'Please enter total cartons!' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="0"
                min={0}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="returnCarton"
              label="Return Cartons"
              rules={[{ required: true, message: 'Please enter return cartons!' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="0"
                min={0}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="notes"
          label="Notes"
        >
          <TextArea
            rows={3}
            placeholder="Enter any additional notes..."
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            {isEditing ? 'Update' : 'Create'} Daily Entry
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
