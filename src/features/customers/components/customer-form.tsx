// Customer Form Component
// Comprehensive customer creation and editing with Pakistani business context

import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  InputNumber,
  Row,
  Col,
  Button,
  Space,
  Alert,
  Divider,
  Tabs,
  Switch,
  message
} from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  HomeOutlined,
  CreditCardOutlined,
  IdcardOutlined,
  ShopOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '../types';
import { useCreateCustomer, useUpdateCustomer } from '../api/queries';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface CustomerFormProps {
  customer?: Customer;
  onSuccess?: (customer: Customer) => void;
  onCancel?: () => void;
  mode?: 'create' | 'edit' | 'view';
  compact?: boolean;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  customer,
  onSuccess,
  onCancel,
  mode = 'create',
  compact = false
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('basic');
  const [hasWhatsApp, setHasWhatsApp] = useState(false);

  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();

  const isEditing = mode === 'edit';
  const isViewing = mode === 'view';
  const isLoading = createCustomerMutation.isPending || updateCustomerMutation.isPending;

  // Initialize form with customer data
  useEffect(() => {
    if (customer) {
      form.setFieldsValue({
        name: customer.name,
        businessName: customer.businessName,
        cnic: customer.cnic,
        phone: customer.phone,
        alternatePhone: customer.alternatePhone,
        whatsappNumber: customer.whatsappNumber,
        address: customer.address,
        city: customer.city,
        area: customer.area,
        creditLimit: customer.creditLimit,
        creditDays: customer.creditDays,
        customerType: customer.customerType,
        shopType: customer.shopType,
        relationshipType: customer.relationshipType,
        preferredContactMethod: customer.preferredContactMethod,
        bestContactTime: customer.bestContactTime,
        businessRegistrationNumber: customer.businessRegistrationNumber,
        ntnNumber: customer.ntnNumber,
        specialInstructions: customer.specialInstructions
      });
      setHasWhatsApp(!!customer.whatsappNumber);
    }
  }, [customer, form]);

  // Handle form submission
  const handleSubmit = async (values: any) => {
    try {
      const customerData: CreateCustomerRequest | UpdateCustomerRequest = {
        ...values,
        whatsappNumber: hasWhatsApp ? values.whatsappNumber : undefined
      };

      let result: Customer;
      if (isEditing && customer) {
        result = await updateCustomerMutation.mutateAsync({
          id: customer.id,
          data: customerData as UpdateCustomerRequest
        });
        message.success('Customer updated successfully');
      } else {
        result = await createCustomerMutation.mutateAsync(customerData as CreateCustomerRequest);
        message.success('Customer created successfully');
      }

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error('Customer form error:', error);
      message.error(isEditing ? 'Failed to update customer' : 'Failed to create customer');
    }
  };

  // CNIC validation
  const validateCNIC = (_: any, value: string) => {
    if (!value) return Promise.resolve();
    
    const cnicPattern = /^\d{5}-\d{7}-\d{1}$/;
    if (!cnicPattern.test(value)) {
      return Promise.reject(new Error('CNIC must be in format: 12345-1234567-1'));
    }
    return Promise.resolve();
  };

  // Phone validation
  const validatePhone = (_: any, value: string) => {
    if (!value) return Promise.resolve();
    
    const phonePattern = /^(\+92|92|0)?3\d{9}$/;
    if (!phonePattern.test(value.replace(/[-\s]/g, ''))) {
      return Promise.reject(new Error('Please enter a valid Pakistani mobile number'));
    }
    return Promise.resolve();
  };

  const formLayout = compact ? { labelCol: { span: 8 }, wrapperCol: { span: 16 } } : {};

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      disabled={isViewing}
      scrollToFirstError
      {...formLayout}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} type={compact ? 'line' : 'card'}>
        
        {/* Basic Information Tab */}
        <TabPane
          tab={
            <span>
              <UserOutlined />
              Basic Information
            </span>
          }
          key="basic"
        >
          <Row gutter={[16, 0]}>
            <Col span={compact ? 24 : 12}>
              <Form.Item
                label="Customer Name"
                name="name"
                rules={[
                  { required: true, message: 'Customer name is required' },
                  { min: 2, message: 'Name must be at least 2 characters' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />}
                  placeholder="e.g., Ahmed Ali"
                  maxLength={100}
                />
              </Form.Item>
            </Col>

            <Col span={compact ? 24 : 12}>
              <Form.Item
                label="Business Name"
                name="businessName"
                rules={[
                  { min: 2, message: 'Business name must be at least 2 characters' }
                ]}
              >
                <Input 
                  prefix={<ShopOutlined />}
                  placeholder="e.g., Ahmed Traders"
                  maxLength={100}
                />
              </Form.Item>
            </Col>

            <Col span={compact ? 24 : 12}>
              <Form.Item
                label="CNIC Number"
                name="cnic"
                rules={[{ validator: validateCNIC }]}
              >
                <Input 
                  prefix={<IdcardOutlined />}
                  placeholder="12345-1234567-1"
                  maxLength={15}
                />
              </Form.Item>
            </Col>

            <Col span={compact ? 24 : 12}>
              <Form.Item
                label="Shop Type"
                name="shopType"
                initialValue="retail"
              >
                <Select placeholder="Select shop type">
                  <Option value="retail">Retail Shop</Option>
                  <Option value="distributor">Distributor</Option>
                  <Option value="sub_distributor">Sub Distributor</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </TabPane>

        {/* Contact Information Tab */}
        <TabPane
          tab={
            <span>
              <PhoneOutlined />
              Contact Information
            </span>
          }
          key="contact"
        >
          <Row gutter={[16, 0]}>
            <Col span={compact ? 24 : 12}>
              <Form.Item
                label="Primary Phone"
                name="phone"
                rules={[
                  { validator: validatePhone }
                ]}
              >
                <Input 
                  prefix={<PhoneOutlined />}
                  placeholder="03XX-XXXXXXX"
                  maxLength={15}
                />
              </Form.Item>
            </Col>

            <Col span={compact ? 24 : 12}>
              <Form.Item
                label="Alternate Phone"
                name="alternatePhone"
                rules={[{ validator: validatePhone }]}
              >
                <Input 
                  prefix={<PhoneOutlined />}
                  placeholder="03XX-XXXXXXX"
                  maxLength={15}
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Space align="baseline" style={{ width: '100%' }}>
                <Switch
                  checked={hasWhatsApp}
                  onChange={setHasWhatsApp}
                  size="small"
                />
                <span>Customer has WhatsApp</span>
              </Space>
            </Col>

            {hasWhatsApp && (
              <Col span={compact ? 24 : 12}>
                <Form.Item
                  label="WhatsApp Number"
                  name="whatsappNumber"
                  rules={[
                    { required: hasWhatsApp, message: 'WhatsApp number is required' },
                    { validator: validatePhone }
                  ]}
                >
                  <Input 
                    prefix={<PhoneOutlined />}
                    placeholder="03XX-XXXXXXX"
                    maxLength={15}
                  />
                </Form.Item>
              </Col>
            )}

            <Col span={compact ? 24 : 12}>
              <Form.Item
                label="Preferred Contact Method"
                name="preferredContactMethod"
                initialValue="call"
              >
                <Select>
                  <Option value="call">Phone Call</Option>
                  <Option value="whatsapp">WhatsApp</Option>
                  <Option value="visit">Shop Visit</Option>
                  <Option value="sms">SMS</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={compact ? 24 : 12}>
              <Form.Item
                label="Best Contact Time"
                name="bestContactTime"
              >
                <Select placeholder="Select best time to contact">
                  <Option value="morning">Morning (9 AM - 12 PM)</Option>
                  <Option value="afternoon">Afternoon (12 PM - 5 PM)</Option>
                  <Option value="evening">Evening (5 PM - 8 PM)</Option>
                  <Option value="anytime">Anytime</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </TabPane>

        {/* Location Tab */}
        <TabPane
          tab={
            <span>
              <HomeOutlined />
              Location
            </span>
          }
          key="location"
        >
          <Row gutter={[16, 0]}>
            <Col span={24}>
              <Form.Item
                label="Address"
                name="address"
                rules={[
                  { min: 10, message: 'Please provide a complete address' }
                ]}
              >
                <TextArea 
                  rows={3}
                  placeholder="Complete shop/business address"
                  maxLength={200}
                />
              </Form.Item>
            </Col>

            <Col span={compact ? 24 : 12}>
              <Form.Item
                label="City"
                name="city"
              >
                <Select 
                  placeholder="Select city"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  <Option value="karachi">Karachi</Option>
                  <Option value="lahore">Lahore</Option>
                  <Option value="islamabad">Islamabad</Option>
                  <Option value="rawalpindi">Rawalpindi</Option>
                  <Option value="faisalabad">Faisalabad</Option>
                  <Option value="multan">Multan</Option>
                  <Option value="peshawar">Peshawar</Option>
                  <Option value="quetta">Quetta</Option>
                  <Option value="sialkot">Sialkot</Option>
                  <Option value="gujranwala">Gujranwala</Option>
                  <Option value="hyderabad">Hyderabad</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={compact ? 24 : 12}>
              <Form.Item
                label="Area/Locality"
                name="area"
              >
                <Input 
                  placeholder="e.g., Saddar, DHA, Gulshan"
                  maxLength={50}
                />
              </Form.Item>
            </Col>
          </Row>
        </TabPane>

        {/* Credit Information Tab */}
        <TabPane
          tab={
            <span>
              <CreditCardOutlined />
              Credit Terms
            </span>
          }
          key="credit"
        >
          <Alert
            message="Credit Terms"
            description="Set credit limits and payment terms based on customer relationship and business volume."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Row gutter={[16, 0]}>
            <Col span={compact ? 24 : 12}>
              <Form.Item
                label="Customer Type"
                name="customerType"
                initialValue="credit"
                rules={[{ required: true, message: 'Customer type is required' }]}
              >
                <Select>
                  <Option value="cash">Cash Only</Option>
                  <Option value="credit">Credit Customer</Option>
                  <Option value="special">Special Customer</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={compact ? 24 : 12}>
              <Form.Item
                label="Relationship Type"
                name="relationshipType"
                initialValue="business"
              >
                <Select>
                  <Option value="business">Business</Option>
                  <Option value="family">Family</Option>
                  <Option value="friend">Friend</Option>
                  <Option value="reference">Reference</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={compact ? 24 : 12}>
              <Form.Item
                label="Credit Limit (PKR)"
                name="creditLimit"
                rules={[
                  { type: 'number', min: 0, message: 'Credit limit cannot be negative' }
                ]}
                tooltip="Maximum outstanding amount allowed for this customer"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={10000000}
                  step={1000}
                  formatter={(value) => `Rs. ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value?.replace(/Rs\.\s?|(,*)/g, '') as any}
                  placeholder="0"
                />
              </Form.Item>
            </Col>

            <Col span={compact ? 24 : 12}>
              <Form.Item
                label="Credit Days"
                name="creditDays"
                initialValue={30}
                rules={[
                  { type: 'number', min: 0, message: 'Credit days cannot be negative' },
                  { type: 'number', max: 365, message: 'Credit days cannot exceed 365' }
                ]}
                tooltip="Number of days allowed for payment after delivery"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  max={365}
                  placeholder="30"
                  addonAfter="days"
                />
              </Form.Item>
            </Col>
          </Row>
        </TabPane>

        {/* Business Details Tab */}
        <TabPane
          tab={
            <span>
              <ShopOutlined />
              Business Details
            </span>
          }
          key="business"
        >
          <Row gutter={[16, 0]}>
            <Col span={compact ? 24 : 12}>
              <Form.Item
                label="Business Registration Number"
                name="businessRegistrationNumber"
              >
                <Input 
                  placeholder="Business registration number"
                  maxLength={50}
                />
              </Form.Item>
            </Col>

            <Col span={compact ? 24 : 12}>
              <Form.Item
                label="NTN Number"
                name="ntnNumber"
                tooltip="National Tax Number (if applicable)"
              >
                <Input 
                  placeholder="NTN number"
                  maxLength={20}
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                label="Special Instructions"
                name="specialInstructions"
                tooltip="Any special notes about this customer (delivery preferences, payment habits, etc.)"
              >
                <TextArea 
                  rows={4}
                  placeholder="Add any special instructions or notes about this customer..."
                  maxLength={500}
                />
              </Form.Item>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* Action Buttons */}
      <Divider />
      <Row justify="end">
        <Space>
          {onCancel && (
            <Button 
              icon={<CloseOutlined />}
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          {!isViewing && (
            <Button 
              type="primary"
              icon={<SaveOutlined />}
              htmlType="submit"
              loading={isLoading}
            >
              {isEditing ? 'Update Customer' : 'Create Customer'}
            </Button>
          )}
        </Space>
      </Row>
    </Form>
  );
};
