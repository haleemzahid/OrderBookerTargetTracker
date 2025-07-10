import React, { useEffect } from 'react';
import { Form, Input, InputNumber, Select, Button, Row, Col, Space } from 'antd';
import type { ProductFormProps } from '../types';

const { Option } = Select;

export const ProductForm: React.FC<ProductFormProps> = ({ 
  initialValues, 
  onSubmit, 
  onCancel, 
  isLoading, 
  isEdit 
}) => {
  const [form] = Form.useForm();

  // Reset form when initialValues changes
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        companyId: initialValues.companyId,
        name: initialValues.name,
        costPrice: initialValues.costPrice,
        sellPrice: initialValues.sellPrice,
        unitPerCarton: initialValues.unitPerCarton,
      });
    } else {
      form.resetFields();
    }
  }, [form, initialValues]);

  const handleFinish = (values: any) => {
    onSubmit(values);
  };

  const priceFormatter = (value: number | undefined): string => {
    if (value === undefined) return '';
    return `Rs. ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const priceParser = (value: string | undefined): number => {
    if (value === undefined) return 0;
    return parseFloat(value.replace(/Rs\.\s?|(,*)/g, ''));
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ unitPerCarton: 1 }}>
      {!isEdit && (
        <Form.Item
          name="companyId"
          label="Company"
          rules={[{ required: true, message: 'Please select a company' }]}
        >
          <Select placeholder="Select company">
            {/* Ideally, these would come from a companies query */}
            <Option value="default-company">Default Company</Option>
          </Select>
        </Form.Item>
      )}

      <Form.Item
        name="name"
        label="Product Name"
        rules={[{ required: true, message: 'Please enter product name' }]}
      >
        <Input placeholder="Enter product name" />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="costPrice"
            label="Cost Price (Rs.)"
            rules={[
              { required: true, message: 'Please enter cost price' },
              { type: 'number', min: 0, message: 'Price must be positive' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              min={0}
              placeholder="0.00"
              formatter={priceFormatter}
              parser={priceParser}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="sellPrice"
            label="Sell Price (Rs.)"
            rules={[
              { required: true, message: 'Please enter sell price' },
              { type: 'number', min: 0, message: 'Price must be positive' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={2}
              min={0}
              placeholder="0.00"
              formatter={priceFormatter}
              parser={priceParser}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="unitPerCarton"
        label="Units Per Carton"
        rules={[
          { required: true, message: 'Please enter units per carton' },
          { type: 'number', min: 1, message: 'Must be at least 1' }
        ]}
        tooltip="Number of units in one carton"
      >
        <InputNumber style={{ width: '100%' }} min={1} placeholder="1" />
      </Form.Item>

      <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="primary" htmlType="submit" loading={isLoading}>
          {isEdit ? 'Update' : 'Create'} Product
        </Button>
      </Space>
    </Form>
  );
};
