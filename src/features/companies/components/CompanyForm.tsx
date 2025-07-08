import React from 'react';
import { Form, Input, Button, Space, message } from 'antd';
import { useCreateCompany, useUpdateCompany } from '../api/mutations';
import type { Company, CreateCompanyRequest, UpdateCompanyRequest } from '../types';

interface CompanyFormProps {
  initialData?: Company | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CompanyForm: React.FC<CompanyFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();

  const isEditing = !!initialData;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (values: CreateCompanyRequest) => {
    try {
      if (isEditing && initialData) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          data: values as UpdateCompanyRequest,
        });
        message.success('Company updated successfully');
      } else {
        await createMutation.mutateAsync(values);
        message.success('Company created successfully');
      }
      
      form.resetFields();
      onSuccess?.();
    } catch (error) {
      message.error(`Failed to ${isEditing ? 'update' : 'create'} company`);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel?.();
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={initialData ? {
        name: initialData.name,
        address: initialData.address,
        email: initialData.email,
        phone: initialData.phone,
      } : undefined}
    >
      <Form.Item
        label="Company Name"
        name="name"
        rules={[
          { required: true, message: 'Please enter company name!' },
          { min: 2, message: 'Company name must be at least 2 characters' },
        ]}
      >
        <Input placeholder="Enter company name" />
      </Form.Item>

      <Form.Item
        label="Address"
        name="address"
      >
        <Input.TextArea 
          rows={3}
          placeholder="Enter company address (optional)"
        />
      </Form.Item>

      <Form.Item
        label="Email"
        name="email"
        rules={[
          { type: 'email', message: 'Please enter a valid email address!' },
        ]}
      >
        <Input placeholder="Enter email address (optional)" />
      </Form.Item>

      <Form.Item
        label="Phone"
        name="phone"
      >
        <Input placeholder="Enter phone number (optional)" />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
          >
            {isEditing ? 'Update Company' : 'Create Company'}
          </Button>
          <Button onClick={handleCancel}>
            Cancel
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};
