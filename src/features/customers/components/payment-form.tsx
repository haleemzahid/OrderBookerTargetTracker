// Payment Recording Component
// Quick payment recording interface with Pakistani business context

import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  InputNumber,
  Row,
  Col,
  Button,
  Card,
  Space,
  Alert,
  Divider,
  Typography,
  Switch,
  message,
  AutoComplete
} from 'antd';
import {
  DollarOutlined,
  WhatsAppOutlined,
  SaveOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { 
  CustomerWithCredit
} from '../types';
import { 
  useCustomerSearch, 
  useCustomerWithCredit,
  useRecordPayment
} from '../api/queries';
import { formatCurrency } from '../utils/formatters';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

interface PaymentFormProps {
  customer?: CustomerWithCredit;
  onSuccess?: (customerId: string, amount: number) => void;
  onCancel?: () => void;
  onCustomerSelect?: (customer: CustomerWithCredit) => void;
  compact?: boolean;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  customer: initialCustomer,
  onSuccess,
  onCancel,
  onCustomerSelect,
  compact = false
}) => {
  const [form] = Form.useForm();
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithCredit | null>(initialCustomer || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);

  // Queries
  const searchResults = useCustomerSearch(searchQuery, searchQuery.length >= 2);
  const customerQuery = useCustomerWithCredit(selectedCustomer?.id || '', !!selectedCustomer?.id);
  const recordPaymentMutation = useRecordPayment();

  // Current customer data with real-time credit info
  const currentCustomer = customerQuery.data || selectedCustomer;

  useEffect(() => {
    if (initialCustomer) {
      setSelectedCustomer(initialCustomer);
      form.setFieldValue('customerId', initialCustomer.id);
    }
  }, [initialCustomer, form]);

  // Handle customer selection
  const handleCustomerSelect = async (customerId: string) => {
    const customer = searchResults.data?.find(c => c.id === customerId);
    if (customer) {
      // First set the basic customer data
      form.setFieldValue('customerId', customerId);
      
      try {
        // Create a temporary customer object with credit defaults
        const tempCustomer: CustomerWithCredit = {
          ...customer,
          creditLimit: 0,
          currentOutstanding: 0,
          availableCredit: 0,
          creditUtilization: 0,
          isOverdue: false,
          overdueAmount: 0,
          daysSinceLastPayment: 0,
          lastPaymentDate: undefined,
          riskScore: 50,
          activeAlerts: 0,
          averageOrderValue: 0,
          collectionDifficulty: 'easy' as const
        };
        
        setSelectedCustomer(tempCustomer);
        
        if (onCustomerSelect) {
          onCustomerSelect(tempCustomer);
        }
      } catch (error) {
        message.error('Failed to load customer details');
      }
    }
  };

  // Calculate payment details
  const calculatePaymentDetails = (amount: number) => {
    if (!currentCustomer) return null;

    const remainingBalance = currentCustomer.currentOutstanding - amount;
    const isFullPayment = remainingBalance <= 0;
    
    return {
      remainingBalance: Math.max(0, remainingBalance),
      isFullPayment,
      overpayment: remainingBalance < 0 ? Math.abs(remainingBalance) : 0
    };
  };

  // Handle form submission
  const handleSubmit = async (values: any) => {
    if (!currentCustomer) {
      message.error('Please select a customer first');
      return;
    }

    try {
      await recordPaymentMutation.mutateAsync({
        customerId: currentCustomer.id,
        amount: values.amount,
        paymentMethod: values.paymentMethod,
        orderId: values.orderId,
        notes: values.notes
      });

      // Send WhatsApp confirmation if enabled
      if (sendWhatsApp && currentCustomer.whatsappNumber) {
        // This would integrate with WhatsApp API
        console.log('Sending WhatsApp confirmation...', {
          to: currentCustomer.whatsappNumber,
          amount: values.amount,
          customer: currentCustomer.name
        });
      }

      form.resetFields(['amount', 'paymentMethod', 'paymentReference', 'notes']);
      
      if (onSuccess) {
        onSuccess(currentCustomer.id, values.amount);
      }

      message.success(`Payment of ${formatCurrency(values.amount)} recorded successfully`);
    } catch (error) {
      console.error('Payment recording error:', error);
      message.error('Failed to record payment');
    }
  };

  // Auto-complete options for customer search
  const customerOptions = searchResults.data?.map(customer => ({
    value: customer.id,
    label: (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 'bold' }}>{customer.name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {customer.businessName} • {customer.phone}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: customer.currentOutstanding > 0 ? '#f5222d' : '#52c41a' }}>
            {formatCurrency(customer.currentOutstanding)}
          </div>
          <div style={{ fontSize: '10px', color: '#999' }}>Outstanding</div>
        </div>
      </div>
    )
  })) || [];

  const paymentAmount = Form.useWatch('amount', form);
  const paymentDetails = paymentAmount && currentCustomer ? calculatePaymentDetails(paymentAmount) : null;

  return (
    <Card 
      title={
        <Space>
          <DollarOutlined />
          Record Payment
        </Space>
      }
      size={compact ? 'small' : 'default'}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        scrollToFirstError
      >
        {/* Customer Selection */}
        {!initialCustomer && (
          <Form.Item
            label="Select Customer"
            name="customerId"
            rules={[{ required: true, message: 'Please select a customer' }]}
          >
            <AutoComplete
              options={customerOptions}
              onSearch={setSearchQuery}
              onSelect={handleCustomerSelect}
              placeholder="Search by name, phone, or business name"
              allowClear
              showSearch
              filterOption={false}
            >
              <Input 
                prefix={<SearchOutlined />}
                placeholder="Search customers..."
              />
            </AutoComplete>
          </Form.Item>
        )}

        {/* Customer Credit Summary */}
        {currentCustomer && (
          <Alert
            message={
              <Row justify="space-between" align="middle">
                <Col>
                  <Space direction="vertical" size="small">
                    <Text strong>{currentCustomer.name}</Text>
                    <Text type="secondary">{currentCustomer.businessName}</Text>
                  </Space>
                </Col>
                <Col>
                  <Space direction="vertical" size="small" align="end">
                    <Text strong style={{ color: currentCustomer.currentOutstanding > 0 ? '#f5222d' : '#52c41a' }}>
                      Outstanding: {formatCurrency(currentCustomer.currentOutstanding)}
                    </Text>
                    <Text type="secondary">
                      Limit: {formatCurrency(currentCustomer.creditLimit)}
                    </Text>
                  </Space>
                </Col>
              </Row>
            }
            type={currentCustomer.currentOutstanding > 0 ? 'warning' : 'success'}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Payment Details */}
        <Row gutter={[16, 0]}>
          <Col span={compact ? 24 : 12}>
            <Form.Item
              label="Payment Amount (PKR)"
              name="amount"
              rules={[
                { type:'number',required: true, message: 'Payment amount is required' },
                { type:'number', min: 1, message: 'Amount must be greater than 0' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                max={10000000}
                step={100}
                formatter={(value) => `Rs. ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value?.replace(/Rs\.\s?|(,*)/g, '') as any}
                placeholder="Enter payment amount"
                prefix={<DollarOutlined />}
              />
            </Form.Item>
          </Col>

          <Col span={compact ? 24 : 12}>
            <Form.Item
              label="Payment Method"
              name="paymentMethod"
              initialValue="cash"
              rules={[{ required: true, message: 'Payment method is required' }]}
            >
              <Select>
                <Option value="cash">Cash</Option>
                <Option value="bank_transfer">Bank Transfer</Option>
                <Option value="cheque">Cheque</Option>
                <Option value="mobile_banking">Mobile Banking</Option>
                <Option value="hundi">Hundi</Option>
                <Option value="advance">Advance Payment</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Payment Calculation Summary */}
        {paymentDetails && (
          <Alert
            message="Payment Summary"
            description={
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Row justify="space-between">
                  <Text>Current Outstanding:</Text>
                  <Text strong>{formatCurrency(currentCustomer?.currentOutstanding || 0)}</Text>
                </Row>
                <Row justify="space-between">
                  <Text>Payment Amount:</Text>
                  <Text strong style={{ color: '#52c41a' }}>-{formatCurrency(paymentAmount)}</Text>
                </Row>
                <Divider style={{ margin: '8px 0' }} />
                <Row justify="space-between">
                  <Text strong>Remaining Balance:</Text>
                  <Text strong style={{ color: paymentDetails.remainingBalance > 0 ? '#f5222d' : '#52c41a' }}>
                    {formatCurrency(paymentDetails.remainingBalance)}
                  </Text>
                </Row>
                {paymentDetails.overpayment > 0 && (
                  <Row justify="space-between">
                    <Text strong style={{ color: '#1890ff' }}>Advance Credit:</Text>
                    <Text strong style={{ color: '#1890ff' }}>
                      +{formatCurrency(paymentDetails.overpayment)}
                    </Text>
                  </Row>
                )}
                {paymentDetails.isFullPayment && (
                  <Alert
                    message="✅ This will clear the customer's outstanding balance"
                    type="success"
                    showIcon={false}
                    banner
                    style={{ marginTop: 8 }}
                  />
                )}
              </Space>
            }
            type="info"
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Advanced Options */}
        <Button 
          type="link" 
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{ padding: 0, marginBottom: 16 }}
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </Button>

        {showAdvanced && (
          <>
            <Row gutter={[16, 0]}>
              <Col span={compact ? 24 : 12}>
                <Form.Item
                  label="Payment Reference"
                  name="paymentReference"
                  tooltip="Bank reference, cheque number, receipt number, etc."
                >
                  <Input 
                    placeholder="Reference number or details"
                    maxLength={50}
                  />
                </Form.Item>
              </Col>

              <Col span={compact ? 24 : 12}>
                <Form.Item
                  label="Payment Location"
                  name="paymentLocation"
                  initialValue="office"
                >
                  <Select>
                    <Option value="office">Office</Option>
                    <Option value="shop">Customer Shop</Option>
                    <Option value="bank">Bank</Option>
                    <Option value="home">Home</Option>
                    <Option value="other">Other</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Notes"
              name="notes"
            >
              <TextArea 
                rows={3}
                placeholder="Additional notes about this payment..."
                maxLength={200}
              />
            </Form.Item>

            {/* Notification Options */}
            <Row>
              <Col span={12}>
                <Space align="center">
                  <Switch
                    checked={isPartialPayment}
                    onChange={setIsPartialPayment}
                    size="small"
                  />
                  <Text>Partial Payment</Text>
                </Space>
              </Col>
              {currentCustomer?.whatsappNumber && (
                <Col span={12}>
                  <Space align="center">
                    <Switch
                      checked={sendWhatsApp}
                      onChange={setSendWhatsApp}
                      size="small"
                    />
                    <WhatsAppOutlined style={{ color: '#25D366' }} />
                    <Text>Send WhatsApp Confirmation</Text>
                  </Space>
                </Col>
              )}
            </Row>
          </>
        )}

        {/* Action Buttons */}
        <Divider />
        <Row justify="end">
          <Space>
            {onCancel && (
              <Button onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button 
              type="primary"
              icon={<SaveOutlined />}
              htmlType="submit"
              loading={recordPaymentMutation.isPending}
              disabled={!currentCustomer}
            >
              Record Payment
            </Button>
          </Space>
        </Row>
      </Form>
    </Card>
  );
};
