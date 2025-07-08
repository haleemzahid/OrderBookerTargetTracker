import React from 'react';
import { Form, Input, InputNumber, Button, Space, message, Select } from 'antd';
import { useCreateProduct, useUpdateProduct } from '../api/mutations';
import { useCompanies } from '../../companies/hooks/queries';
import { formatRupees, parseRupees } from '../../../shared/utils/currency';
import type { Product, CreateProductRequest, UpdateProductRequest } from '../types';

const { Option } = Select;

interface ProductFormProps {
  initialData?: Product | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const { data: companies } = useCompanies();

  const isEditing = !!initialData;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (values: any) => {
    try {
      const requestData: CreateProductRequest = {
        companyId: values.companyId,
        name: values.name,
        costPrice: values.costPrice,
        sellPrice: values.sellPrice,
        unitPerCarton: values.unitPerCarton,
      };

      if (isEditing && initialData) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          data: requestData as UpdateProductRequest,
        });
        message.success('Product updated successfully');
      } else {
        await createMutation.mutateAsync(requestData);
        message.success('Product created successfully');
      }
      
      form.resetFields();
      onSuccess?.();
    } catch (error) {
      message.error(`Failed to ${isEditing ? 'update' : 'create'} product`);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel?.();
  };

  const calculateMargin = () => {
    const costPrice = form.getFieldValue('costPrice') || 0;
    const sellPrice = form.getFieldValue('sellPrice') || 0;
    const margin = sellPrice - costPrice;
    const marginPercent = costPrice > 0 ? (margin / costPrice) * 100 : 0;
    
    return {
      margin,
      marginPercent,
      isProfit: margin >= 0,
    };
  };

  const [marginInfo, setMarginInfo] = React.useState(calculateMargin());

  const handlePriceChange = () => {
    setMarginInfo(calculateMargin());
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={initialData ? {
        companyId: initialData.companyId,
        name: initialData.name,
        costPrice: initialData.costPrice,
        sellPrice: initialData.sellPrice,
        unitPerCarton: initialData.unitPerCarton,
      } : {
        unitPerCarton: 1,
      }}
      onValuesChange={handlePriceChange}
    >
      <Form.Item
        label="Company"
        name="companyId"
        rules={[
          { required: true, message: 'Please select a company!' },
        ]}
      >
        <Select placeholder="Select company" loading={!companies}>
          {companies?.map(company => (
            <Option key={company.id} value={company.id}>
              {company.name}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label="Product Name"
        name="name"
        rules={[
          { required: true, message: 'Please enter product name!' },
          { min: 2, message: 'Product name must be at least 2 characters' },
        ]}
      >
        <Input placeholder="Enter product name" />
      </Form.Item>

      <div style={{ display: 'flex', gap: '16px' }}>
        <Form.Item
          label="Cost Price (Rs.)"
          name="costPrice"
          rules={[
            { required: true, message: 'Please enter cost price!' },
            { type: 'number', min: 0, message: 'Cost price must be positive!' },
          ]}
          style={{ flex: 1 }}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="0.00"
            min={0}
            step={0.01}
            formatter={(value) => value ? formatRupees(Number(value)).replace('Rs. ', '') : ''}
            parser={(value) => parseRupees(value || '') as any}
          />
        </Form.Item>

        <Form.Item
          label="Sell Price (Rs.)"
          name="sellPrice"
          rules={[
            { required: true, message: 'Please enter sell price!' },
            { type: 'number', min: 0, message: 'Sell price must be positive!' },
          ]}
          style={{ flex: 1 }}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="0.00"
            min={0}
            step={0.01}
            formatter={(value) => value ? formatRupees(Number(value)).replace('Rs. ', '') : ''}
            parser={(value) => parseRupees(value || '') as any}
          />
        </Form.Item>
      </div>

      {/* Margin Information */}
      <div style={{ 
        padding: '12px', 
        backgroundColor: marginInfo.isProfit ? '#f6ffed' : '#fff2e8',
        border: `1px solid ${marginInfo.isProfit ? '#b7eb8f' : '#ffbb96'}`,
        borderRadius: '6px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Margin per unit:</span>
          <span style={{ fontWeight: 'bold', color: marginInfo.isProfit ? '#52c41a' : '#fa8c16' }}>
            {formatRupees(marginInfo.margin)} ({marginInfo.marginPercent.toFixed(1)}%)
          </span>
        </div>
      </div>

      <Form.Item
        label="Units per Carton"
        name="unitPerCarton"
        rules={[
          { required: true, message: 'Please enter units per carton!' },
          { type: 'number', min: 1, message: 'Units per carton must be at least 1!' },
        ]}
      >
        <InputNumber
          style={{ width: '100%' }}
          placeholder="1"
          min={1}
          step={1}
        />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
          >
            {isEditing ? 'Update Product' : 'Create Product'}
          </Button>
          <Button onClick={handleCancel}>
            Cancel
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};
