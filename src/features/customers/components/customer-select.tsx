// Customer Selection Component
// Enhanced customer selection with real-time credit status for order forms

import React, { useState, useEffect } from 'react';
import {
  Select,
  Space,
  Typography,
  Button,
  Modal,
  Row,
  Col,
  Card,
  Tag,
  Empty,
  Alert
} from 'antd';
import {
  PlusOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { CustomerWithCredit, Customer } from '../types';
import { useCustomerSearch, useCustomersWithCredit } from '../api/queries';
import { formatCurrency, getStatusColor } from '../utils/formatters';
import { CustomerForm } from './customer-form';
import { CustomerCreditWidget } from './customer-credit-widget';

const { Option } = Select;
const { Text } = Typography;

interface CustomerSelectProps {
  value?: string;
  onChange?: (customerId: string, customer: CustomerWithCredit) => void;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  orderAmount?: number;
  showCreditStatus?: boolean;
  showCreateNew?: boolean;
  onCustomerCreated?: (customer: CustomerWithCredit) => void;
  size?: 'small' | 'middle' | 'large';
  style?: React.CSSProperties;
}

export const CustomerSelect: React.FC<CustomerSelectProps> = ({
  value,
  onChange,
  placeholder = "Select customer...",
  allowClear = true,
  disabled = false,
  orderAmount = 0,
  showCreditStatus = true,
  showCreateNew = true,
  onCustomerCreated,
  size = 'middle',
  style
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithCredit | null>(null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isCreditModalVisible, setIsCreditModalVisible] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // Queries
  const searchResults = useCustomerSearch(searchQuery, searchQuery.length >= 2);
  const recentCustomersQuery = useCustomersWithCredit();

  // Get customer list based on search or recent customers
  const customers: CustomerWithCredit[] = searchQuery.length >= 2 
    ? (searchResults.data || []).map(c => ({ ...c, availableCredit: 0, creditUtilization: 0, isOverdue: false, overdueAmount: 0, riskScore: 0, activeAlerts: 0, averageOrderValue: 0, collectionDifficulty: 'easy' as const }))
    : recentCustomersQuery.data?.slice(0, 10) || [];

  const isLoading = searchQuery.length >= 2 ? searchResults.isLoading : recentCustomersQuery.isLoading;

  // Find selected customer from data
  useEffect(() => {
    if (value && customers.length > 0) {
      const customer = customers.find(c => c.id === value);
      if (customer) {
        setSelectedCustomer(customer);
      }
    } else if (!value) {
      setSelectedCustomer(null);
    }
  }, [value, customers]);

  // Handle customer selection
  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer && onChange) {
      setSelectedCustomer(customer);
      onChange(customerId, customer);
    }
    setDropdownVisible(false);
  };

  // Handle customer creation
  const handleCustomerCreated = (newCustomer: Customer) => {
    // Convert Customer to CustomerWithCredit
    const customerWithCredit: CustomerWithCredit = {
      ...newCustomer,
      availableCredit: newCustomer.creditLimit - newCustomer.currentOutstanding,
      creditUtilization: newCustomer.creditLimit > 0 ? (newCustomer.currentOutstanding / newCustomer.creditLimit) * 100 : 0,
      isOverdue: false,
      overdueAmount: 0,
      riskScore: 0,
      activeAlerts: 0,
      averageOrderValue: 0,
      collectionDifficulty: 'easy' as const
    };
    
    setIsCreateModalVisible(false);
    if (onChange) {
      onChange(customerWithCredit.id, customerWithCredit);
    }
    if (onCustomerCreated) {
      onCustomerCreated(customerWithCredit);
    }
  };

  // Get validation status for customer with order amount
  const getCustomerValidation = (customer: CustomerWithCredit) => {
    if (orderAmount <= 0) return { status: 'info', message: '' };

    const availableAfterOrder = customer.availableCredit - orderAmount;
    
    if (customer.creditStatus === 'blocked') {
      return { status: 'error', message: 'Customer account is blocked' };
    }
    
    if (customer.isOverdue && customer.overdueAmount > 0) {
      return { status: 'error', message: `Overdue: ${formatCurrency(customer.overdueAmount)}` };
    }
    
    if (availableAfterOrder < 0) {
      return { status: 'error', message: `Exceeds limit by ${formatCurrency(Math.abs(availableAfterOrder))}` };
    }
    
    if (availableAfterOrder < customer.creditLimit * 0.1) {
      return { status: 'warning', message: 'Near credit limit' };
    }
    
    return { status: 'success', message: 'Credit available' };
  };

  // Render customer option
  const renderCustomerOption = (customer: CustomerWithCredit) => {
    const validation = getCustomerValidation(customer);
    
    return (
      <Option key={customer.id} value={customer.id}>
        <Row justify="space-between" align="middle">
          <Col flex="auto">
            <Space direction="vertical" size="small">
              <Space>
                <Text strong>{customer.name}</Text>
                <Tag color={getStatusColor(customer.creditStatus)}>
                  {customer.creditStatus.replace('_', ' ')}
                </Tag>
              </Space>
              <Space>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {customer.businessName} • {customer.phone}
                </Text>
              </Space>
              {showCreditStatus && (
                <Space>
                  <Text style={{ fontSize: '11px', color: '#666' }}>
                    Outstanding: {formatCurrency(customer.currentOutstanding)}
                  </Text>
                  <Text style={{ fontSize: '11px', color: '#666' }}>
                    Available: {formatCurrency(customer.availableCredit)}
                  </Text>
                </Space>
              )}
            </Space>
          </Col>
          <Col>
            <Space direction="vertical" align="end" size="small">
              {validation.status === 'success' && (
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
              )}
              {validation.status === 'warning' && (
                <ExclamationCircleOutlined style={{ color: '#faad14' }} />
              )}
              {validation.status === 'error' && (
                <ExclamationCircleOutlined style={{ color: '#f5222d' }} />
              )}
              {orderAmount > 0 && validation.message && (
                <Text style={{ 
                  fontSize: '10px', 
                  color: validation.status === 'error' ? '#f5222d' : 
                         validation.status === 'warning' ? '#faad14' : '#52c41a'
                }}>
                  {validation.message}
                </Text>
              )}
            </Space>
          </Col>
        </Row>
      </Option>
    );
  };

  // Custom dropdown render
  const dropdownRender = (menu: React.ReactElement) => (
    <div>
      {menu}
      {showCreateNew && (
        <>
          <div style={{ borderTop: '1px solid #f0f0f0', padding: '8px' }}>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalVisible(true)}
              block
              size="small"
            >
              Add New Customer
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <Space direction="vertical" style={{ width: '100%', ...style }}>
        <Select
          value={value}
          placeholder={placeholder}
          allowClear={allowClear}
          disabled={disabled}
          size={size}
          showSearch
          filterOption={false}
          onSearch={setSearchQuery}
          onSelect={handleCustomerSelect}
          onClear={() => {
            setSelectedCustomer(null);
            if (onChange) {
              onChange('', {} as CustomerWithCredit);
            }
          }}
          loading={isLoading}
          dropdownRender={dropdownRender}
          open={dropdownVisible}
          onDropdownVisibleChange={setDropdownVisible}
          style={{ width: '100%' }}
          notFoundContent={
            searchQuery.length >= 2 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No customers found"
              />
            ) : (
              <div style={{ padding: '8px 12px', color: '#999' }}>
                Type to search customers...
              </div>
            )
          }
        >
          {customers.map(renderCustomerOption)}
        </Select>

        {/* Selected Customer Credit Status */}
        {selectedCustomer && showCreditStatus && orderAmount > 0 && (
          <Card size="small" style={{ marginTop: 8 }}>
            <CustomerCreditWidget
              customer={selectedCustomer}
              orderAmount={orderAmount}
              compact
              showActions={false}
            />
          </Card>
        )}

        {/* Credit Warning for Selected Customer */}
        {selectedCustomer && orderAmount > 0 && (() => {
          const validation = getCustomerValidation(selectedCustomer);
          if (validation.status === 'error') {
            return (
              <Alert
                message="Credit Issue"
                description={validation.message}
                type="error"
                showIcon
                action={
                  <Button
                    size="small"
                    type="link"
                    onClick={() => setIsCreditModalVisible(true)}
                  >
                    View Details
                  </Button>
                }
              />
            );
          }
          if (validation.status === 'warning') {
            return (
              <Alert
                message="Credit Warning"
                description={validation.message}
                type="warning"
                showIcon
              />
            );
          }
          return null;
        })()}
      </Space>

      {/* Create Customer Modal */}
      <Modal
        title="Add New Customer"
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <CustomerForm
          mode="create"
          onSuccess={handleCustomerCreated}
          onCancel={() => setIsCreateModalVisible(false)}
          compact
        />
      </Modal>

      {/* Customer Credit Details Modal */}
      <Modal
        title="Customer Credit Details"
        open={isCreditModalVisible}
        onCancel={() => setIsCreditModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedCustomer && (
          <CustomerCreditWidget
            customer={selectedCustomer}
            orderAmount={orderAmount}
            showActions
          />
        )}
      </Modal>
    </>
  );
};
