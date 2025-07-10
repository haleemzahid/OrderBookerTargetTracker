import React from 'react';
import { Form, Input, InputNumber, Select, Card, Row, Col } from 'antd';
import { useCompanies } from '../../../features/companies/hooks/queries';
import { useCreateProduct, useUpdateProduct } from '../api/mutations';
import { FormActions } from '../../../shared/components';
import type { Product, CreateProductRequest } from '../types';

const { Option } = Select;

interface ProductFormProps {
  product?: Product;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ 
  product, 
  onSuccess, 
  onCancel
}) => {
  const [form] = Form.useForm();
  const { data: companies, isLoading: isLoadingCompanies } = useCompanies();
  
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  
  const isEditing = !!product;
  const isLoading = createMutation.isPending || updateMutation.isPending;
  
  const handleSubmit = async (values: CreateProductRequest) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: product.id, data: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      form.resetFields();
      onSuccess?.();
    } catch (error) {
      console.error('Form submission error:', error);
    }
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
    <Card>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={product || { unitPerCarton: 1 }}
      >
        {!isEditing && (
          <Form.Item
            name="companyId"
            label="Company"
            rules={[{ required: true, message: 'Please select a company' }]}
          >
            <Select placeholder="Select company" loading={isLoadingCompanies}>
              {companies?.map(company => (
                <Option key={company.id} value={company.id}>
                  {company.name}
                </Option>
              ))}
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

        <Form.Item>
          <FormActions 
            isLoading={isLoading}
            isEditing={isEditing}
            onCancel={onCancel}
            submitLabel={isEditing ? 'Update Product' : 'Create Product'}
            align="right"
          />
        </Form.Item>
      </Form>
    </Card>
  );
};
