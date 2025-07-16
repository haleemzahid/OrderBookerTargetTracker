// Customer List Component with Credit Management
// Following Ant Design patterns and Pakistani business context

import React, { useState, useMemo } from 'react';
import {
  Table,
  Card,
  Space,
  Button,
  Tag,
  Input,
  Row,
  Col,
  Typography,
  Badge,
  Dropdown,
  Modal,
  Spin
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  PlusOutlined,
  ExportOutlined,
  UserOutlined,
  PhoneOutlined,
  CreditCardOutlined,
  ExclamationCircleOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  BlockOutlined,
  CheckCircleOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { CustomerWithCredit } from '../types';
import { useCustomerList, useCustomerOperations } from '../hooks';
import { formatCurrency, getStatusColor, getPaymentBehaviorIcon } from '../utils/formatters';
import { CustomerListFilters } from '.';

const { Title, Text } = Typography;

interface CustomerListProps {
  onCustomerSelect?: (customer: CustomerWithCredit) => void;
  onCreateCustomer?: () => void;
  onEditCustomer?: (customer: CustomerWithCredit) => void;
  onRecordPayment?: (customer: CustomerWithCredit) => void;
  showFilters?: boolean;
  showActions?: boolean;
  selectionMode?: 'single' | 'multiple' | 'none';
  pageSize?: number;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  onCustomerSelect,
  onCreateCustomer,
  onEditCustomer,
  onRecordPayment,
  showFilters = true,
  showActions = true,
  selectionMode = 'none',
  pageSize = 20
}) => {
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  const {
    customers,
    isLoading,
    error,
    search,
    searchQuery,
    updateFilters,
    clearFilters,
    clearSearch,
    getOverdueCustomers,
    getHighRiskCustomers,
    getCustomersNearLimit
  } = useCustomerList();

  const { deleteCustomer, isDeleting } = useCustomerOperations();

  // Quick filter buttons
  const quickFilters = useMemo(() => [
    {
      key: 'all',
      label: 'All Customers',
      count: customers.length,
      onClick: () => clearFilters()
    },
    {
      key: 'overdue',
      label: 'Overdue',
      count: getOverdueCustomers().length,
      color: 'red',
      onClick: () => updateFilters({ search: undefined })
    },
    {
      key: 'high-risk',
      label: 'High Risk',
      count: getHighRiskCustomers().length,
      color: 'volcano',
      onClick: () => updateFilters({ 
        paymentBehavior: 'problematic'
      })
    },
    {
      key: 'near-limit',
      label: 'Near Limit',
      count: getCustomersNearLimit().length,
      color: 'orange',
      onClick: () => {}
    }
  ], [customers, getOverdueCustomers, getHighRiskCustomers, getCustomersNearLimit, clearFilters, updateFilters]);

  // Handle customer deletion
  const handleDelete = (customer: CustomerWithCredit) => {
    Modal.confirm({
      title: 'Delete Customer',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete "${customer.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteCustomer(customer.id, customer.name);
        } catch (error) {
          // Error message is handled in the hook
        }
      }
    });
  };

  // Action menu for each customer
  const getActionMenu = (customer: CustomerWithCredit): MenuProps => ({
    items: [
      {
        key: 'edit',
        label: 'Edit Customer',
        icon: <EditOutlined />,
        onClick: (info) => {
          info.domEvent.stopPropagation();
          onEditCustomer?.(customer);
        }
      },
      {
        key: 'view-transactions',
        label: 'View Transactions',
        icon: <CreditCardOutlined />,
        onClick: (info) => {
          info.domEvent.stopPropagation();
          onCustomerSelect?.(customer);
        }
      },
      {
        key: 'record-payment',
        label: 'Record Payment',
        icon: <DollarOutlined />,
        onClick: (info) => {
          info.domEvent.stopPropagation();
          if (onRecordPayment) {
            onRecordPayment(customer);
          } else {
            Modal.confirm({
              title: 'Record Payment',
              content: 'Do you want to record a payment for this customer?',
              onOk: () => {
                // Fallback if no handler is provided
              }
            });
          }
        }
      },
      {
        type: 'divider' as const
      },
      {
        key: customer.creditStatus === 'blocked' ? 'unblock' : 'block',
        label: customer.creditStatus === 'blocked' ? 'Unblock Customer' : 'Block Customer',
        icon: customer.creditStatus === 'blocked' ? <CheckCircleOutlined /> : <BlockOutlined />,
        disabled: customer.creditStatus === 'cash_only',
        onClick: (info) => {
          info.domEvent.stopPropagation();
          // Add logic for blocking/unblocking customer
        }
      },
      {
        type: 'divider' as const
      },
      {
        key: 'delete',
        label: 'Delete Customer',
        icon: <DeleteOutlined />,
        danger: true,
        disabled: customer.currentOutstanding > 0,
        onClick: (info) => {
          info.domEvent.stopPropagation();
          handleDelete(customer);
        }
      }
    ]
  });

  // Table columns definition
  const columns: ColumnsType<CustomerWithCredit> = [
    {
      title: 'Customer',
      key: 'customer',
      width: 250,
      render: (_, customer) => (
        <Space direction="vertical" size={0}>
          <Space>
            <UserOutlined />
            <Text strong>{customer.name}</Text>
            {customer.relationshipType === 'family' && (
              <Tag color="blue">Family</Tag>
            )}
          </Space>
          {customer.businessName && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {customer.businessName}
            </Text>
          )}
          <Space size={0} split="|">
            <Text type="secondary" style={{ fontSize: '11px' }}>
              <PhoneOutlined /> {customer.phone}
            </Text>
            {customer.area && (
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {customer.area}
              </Text>
            )}
          </Space>
        </Space>
      )
    },
    {
      title: 'Credit Status',
      key: 'creditStatus',
      width: 120,
      render: (_, customer) => (
        <Space direction="vertical" size={0}>
          <Tag color={getStatusColor(customer.creditStatus)}>
            {customer.creditStatus.replace('_', ' ').toUpperCase()}
          </Tag>
          <Space>
            {getPaymentBehaviorIcon(customer.paymentBehavior)}
            <Text style={{ fontSize: '11px', textTransform: 'capitalize' }}>
              {customer.paymentBehavior}
            </Text>
          </Space>
        </Space>
      )
    },
    {
      title: 'Credit Info',
      key: 'creditInfo',
      width: 180,
      render: (_, customer) => (
        <Space direction="vertical" size={0}>
          <Space>
            <Text strong>{formatCurrency(Math.max(0, customer.availableCredit))}</Text>
            <Text type="secondary">/ {formatCurrency(customer.creditLimit)}</Text>
          </Space>
          <div style={{ width: '100%', height: '4px', backgroundColor: '#f0f0f0', borderRadius: '2px' }}>
            <div
              style={{
                width: `${Math.min(customer.creditUtilization, 100)}%`,
                height: '100%',
                backgroundColor: customer.creditUtilization > 90 ? '#ff4d4f' : 
                                customer.creditUtilization > 70 ? '#faad14' : '#52c41a',
                borderRadius: '2px'
              }}
            />
          </div>
          <Text style={{ fontSize: '11px' }}>
            {customer.creditUtilization.toFixed(1)}% utilized
          </Text>
        </Space>
      )
    },
    {
      title: 'Outstanding',
      key: 'outstanding',
      width: 120,
      align: 'right',
      render: (_, customer) => (
        <Space direction="vertical" size={0} style={{ textAlign: 'right', width: '100%' }}>
          <Text strong={customer.currentOutstanding > 0}>
            {formatCurrency(customer.currentOutstanding)}
          </Text>
          {customer.isOverdue && (
            <Badge 
              count={customer.daysSinceLastPayment} 
              overflowCount={999}
              style={{ backgroundColor: '#ff4d4f' }}
              title={`${customer.daysSinceLastPayment} days overdue`}
            />
          )}
        </Space>
      )
    },
    {
      title: 'Last Payment',
      key: 'lastPayment',
      width: 120,
      render: (_, customer) => (
        <Space direction="vertical" size={0}>
          {customer.lastPaymentDate ? (
            <>
              <Text>{customer.lastPaymentDate.toLocaleDateString()}</Text>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {customer.daysSinceLastPayment} days ago
              </Text>
            </>
          ) : (
            <Text type="secondary">Never</Text>
          )}
        </Space>
      )
    },
    {
      title: 'Orders',
      key: 'orders',
      width: 100,
      align: 'center',
      render: (_, customer) => (
        <Space direction="vertical" size={0} style={{ textAlign: 'center', width: '100%' }}>
          <Text strong>{customer.totalOrdersCount}</Text>
          <Text style={{ fontSize: '11px' }}>
            Avg: {formatCurrency(customer.averageOrderValue)}
          </Text>
        </Space>
      )
    }
  ];

  // Add actions column if needed
  if (showActions) {
    columns.push({
      title: 'Actions',
      key: 'actions',
      width: 80,
      align: 'center',
      render: (_, customer) => (
        <Dropdown menu={getActionMenu(customer)} trigger={['click']}>
          <Button 
            type="text" 
            icon={<MoreOutlined />} 
            size="small"
            onClick={(e) => {
              e.stopPropagation();
            }} 
          />
        </Dropdown>
      )
    });
  }

  // Row selection configuration
  const rowSelection = selectionMode !== 'none' ? {
    type: selectionMode as 'radio' | 'checkbox',
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    onSelect: (record: CustomerWithCredit, selected: boolean) => {
      if (selectionMode === 'single' && selected) {
        onCustomerSelect?.(record);
      }
    }
  } : undefined;

  if (error) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Text type="danger">Failed to load customers: {error.message}</Text>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <Card size="small">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              Customers ({customers.length})
            </Title>
          </Col>
          <Col>
            <Space>
              {showFilters && (
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => setFiltersVisible(true)}
                >
                  Filters
                </Button>
              )}
              <Button icon={<ExportOutlined />}>
                Export
              </Button>
              {onCreateCustomer && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={onCreateCustomer}
                >
                  Add Customer
                </Button>
              )}
            </Space>
          </Col>
        </Row>

        {/* Search and Quick Filters */}
        <Row style={{ marginTop: '16px' }} gutter={[16, 8]}>
          <Col span={12}>
            <Input
              placeholder="Search customers by name, phone, or business..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => search(e.target.value)}
              allowClear
              onClear={clearSearch}
            />
          </Col>
          <Col span={12}>
            <Space wrap>
              {quickFilters.map(filter => (
                <Button
                  key={filter.key}
                  size="small"
                  onClick={filter.onClick}
                  style={{
                    color: filter.color ? `var(--ant-color-${filter.color})` : undefined
                  }}
                >
                  {filter.label} ({filter.count})
                </Button>
              ))}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Customer Table */}
      <Card>
        <Spin spinning={isLoading || isDeleting}>
          <Table
            columns={columns}
            dataSource={customers as CustomerWithCredit[]}
            rowKey="id"
            rowSelection={rowSelection}
            pagination={{
              pageSize,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} customers`
            }}
            scroll={{ x: 1000 }}
            size="small"
            onRow={(record) => ({
              onClick: () => onCustomerSelect?.(record),
              onDoubleClick: () => onCustomerSelect?.(record),
              style: {
                cursor: onCustomerSelect ? 'pointer' : 'default'
              }
            })}
          />
        </Spin>
      </Card>

      {/* Filters Modal */}
      {showFilters && (
        <CustomerListFilters
          visible={filtersVisible}
          onClose={() => setFiltersVisible(false)}
          onFiltersChange={updateFilters}
          onClearFilters={clearFilters}
        />
      )}
    </div>
  );
};
