// Collection Dashboard Component
// Overview of collection activities and alerts for Pakistani wholesale business

import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Progress,
  List,
  Avatar,
  Select,
  DatePicker,
  Alert,
  Tabs
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DollarOutlined,
  ExclamationCircleOutlined,
  PhoneOutlined,
  MessageOutlined,
  UserOutlined,
  CalendarOutlined,
  RiseOutlined,
  WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useCollectionDashboard } from '../hooks';
import { CustomerWithCredit, CollectionAlert } from '../types';
import { formatCurrency, getPaymentBehaviorIcon } from '../utils/formatters';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface CollectionDashboardProps {
  onCustomerSelect?: (customer: CustomerWithCredit) => void;
  onAlertAction?: (alert: CollectionAlert, action: string) => void;
  compact?: boolean;
}

export const CollectionDashboard: React.FC<CollectionDashboardProps> = ({
  onCustomerSelect,
  // onAlertAction is currently unused but kept for future implementation
  compact = false
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [agingFilter, setAgingFilter] = useState<'all' | '30' | '60' | '90'>('all');

  const {
    overdueCustomers,
    approachingDueCustomers,
    riskyCustomers,
    summary,
    dashboardStats,
    collectionPriorities,
    collectionEfficiency,
    isLoading,
    error
  } = useCollectionDashboard();

  if (error) {
    return (
      <Alert
        message="Failed to load collection data"
        description={error instanceof Error ? error.message : 'Unknown error'}
        type="error"
        showIcon
      />
    );
  }

  // Overdue customers table columns
  const overdueColumns: ColumnsType<CustomerWithCredit> = [
    {
      title: 'Customer',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space direction="vertical" size="small">
          <Text strong>{text}</Text>
          {record.businessName && (
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.businessName}</Text>
          )}
        </Space>
      ),
      width: 200
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<PhoneOutlined />}
            onClick={() => window.open(`tel:${record.phone}`)}
          />
          {record.whatsappNumber && (
            <Button
              type="text"
              size="small"
              icon={<MessageOutlined />}
              style={{ color: '#25D366' }}
              onClick={() => {
                if (record.whatsappNumber) {
                  const message = `Assalam o Alaikum ${record.name}, this is regarding your overdue payment.`;
                  window.open(`https://wa.me/${record.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`);
                }
              }}
            />
          )}
        </Space>
      ),
      width: 100
    },
    {
      title: 'Amount Due',
      dataIndex: 'overdueAmount',
      key: 'overdueAmount',
      render: (amount) => (
        <Text strong style={{ color: '#cf1322' }}>
          {formatCurrency(amount)}
        </Text>
      ),
      width: 120,
      sorter: (a, b) => a.overdueAmount - b.overdueAmount
    },
    {
      title: 'Days Overdue',
      key: 'daysOverdue',
      render: (_, record) => {
        const days = record.daysSinceLastPayment || 0;
        return (
          <Tag color={days > 60 ? 'red' : days > 30 ? 'orange' : 'yellow'}>
            {days} days
          </Tag>
        );
      },
      width: 100,
      sorter: (a, b) => (a.daysSinceLastPayment || 0) - (b.daysSinceLastPayment || 0)
    },
    {
      title: 'Payment Behavior',
      dataIndex: 'paymentBehavior',
      key: 'paymentBehavior',
      render: (behavior) => (
        <Space>
          {getPaymentBehaviorIcon(behavior)}
          <Text>{behavior}</Text>
        </Space>
      ),
      width: 140
    },
    {
      title: 'Area',
      dataIndex: 'area',
      key: 'area',
      width: 100
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            type="primary"
            onClick={() => onCustomerSelect?.(record)}
          >
            Collect
          </Button>
          <Button
            size="small"
            onClick={() => onCustomerSelect?.(record)}
          >
            View
          </Button>
        </Space>
      ),
      width: 120
    }
  ];

  // Collection priorities for today - combine urgent and high priority customers
  const priorityActions = [
    ...collectionPriorities.urgent,
    ...collectionPriorities.high
  ].slice(0, 5); // Top 5 priorities

  return (
    <div>
      {/* Header with filters */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={compact ? 4 : 3} style={{ margin: 0 }}>
            <DollarOutlined style={{ marginRight: '8px' }} />
            Collection Dashboard
          </Title>
        </Col>
        <Col>
          <Space>
            <Select
              value={selectedPeriod}
              onChange={setSelectedPeriod}
              style={{ width: 120 }}
            >
              <Option value="today">Today</Option>
              <Option value="week">This Week</Option>
              <Option value="month">This Month</Option>
            </Select>
            <Select
              value={agingFilter}
              onChange={setAgingFilter}
              style={{ width: 140 }}
              placeholder="Filter by aging"
            >
              <Option value="all">All Overdue</Option>
              <Option value="30">30+ Days</Option>
              <Option value="60">60+ Days</Option>
              <Option value="90">90+ Days</Option>
            </Select>
          </Space>
        </Col>
      </Row>

      {/* Collection Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Overdue"
              value={summary?.totalOutstanding || 0}
              precision={0}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ExclamationCircleOutlined />}
            />
            <Progress
              percent={Math.min(100, ((summary?.totalOutstanding || 0) / 1000000) * 100)}
              status="exception"
              size="small"
              showInfo={false}
              style={{ marginTop: '8px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Overdue Customers"
              value={overdueCustomers.length}
              valueStyle={{ color: '#cf1322' }}
              prefix={<UserOutlined />}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {approachingDueCustomers.length} approaching due
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Collection Efficiency"
              value={collectionEfficiency}
              precision={1}
              suffix="%"
              valueStyle={{ 
                color: collectionEfficiency >= 80 ? '#3f8600' : 
                       collectionEfficiency >= 60 ? '#fa8c16' : '#cf1322' 
              }}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Today's Target"
              value={dashboardStats?.collectionTargetForMonth || 0}
              precision={0}
              formatter={(value) => formatCurrency(Number(value) / 30)}
              valueStyle={{ color: '#1890ff' }}
              prefix={<CalendarOutlined />}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Achieved: {formatCurrency(dashboardStats?.todayCollections || 0)}
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Tabs defaultActiveKey="overdue" size="large">
        <TabPane tab={`Overdue (${overdueCustomers.length})`} key="overdue">
          <Card>
            <Table
              columns={overdueColumns}
              dataSource={overdueCustomers}
              rowKey="id"
              loading={isLoading}
              pagination={{
                pageSize: compact ? 5 : 10,
                showSizeChanger: !compact,
                showQuickJumper: !compact,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} overdue customers`
              }}
              scroll={{ x: 800 }}
            />
          </Card>
        </TabPane>

        <TabPane tab={`Priority Actions (${priorityActions.length})`} key="priority">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Today's Collection Priorities" size="small">
                <List
                  dataSource={priorityActions}
                  renderItem={(customer: CustomerWithCredit) => (
                    <List.Item
                      actions={[
                        <Button size="small" type="primary">Call</Button>,
                        <Button size="small">WhatsApp</Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            icon={<UserOutlined />}
                            style={{ 
                              backgroundColor: customer.paymentBehavior === 'problematic' ? '#ff4d4f' : '#1890ff' 
                            }}
                          />
                        }
                        title={customer.name}
                        description={
                          <Space direction="vertical" size="small">
                            <Text>Due: {formatCurrency(customer.overdueAmount || 0)}</Text>
                            <Text type="secondary">{customer.area}</Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Collection Tips" size="small">
                <List
                  size="small"
                  dataSource={[
                    {
                      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                      title: 'Best calling time',
                      description: 'Between 10 AM - 12 PM and 2 PM - 5 PM'
                    },
                    {
                      icon: <MessageOutlined style={{ color: '#25D366' }} />,
                      title: 'WhatsApp follow-up',
                      description: 'Send payment reminder if no response to calls'
                    },
                    {
                      icon: <WarningOutlined style={{ color: '#fa8c16' }} />,
                      title: 'Escalation',
                      description: 'For 60+ days overdue, consider field visit'
                    }
                  ]}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={item.icon}
                        title={item.title}
                        description={item.description}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab={`Approaching Due (${approachingDueCustomers.length})`} key="approaching">
          <Card>
            <List
              dataSource={approachingDueCustomers}
              renderItem={(customer) => (
                <List.Item
                  actions={[
                    <Button size="small">Remind</Button>,
                    <Button size="small" type="link">View</Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<CalendarOutlined />} />}
                    title={customer.name}
                    description={
                      <Space>
                        <Text>Amount: {formatCurrency(customer.currentOutstanding)}</Text>
                        <Text type="secondary">•</Text>
                        <Text type="secondary">{customer.area}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
              pagination={{ pageSize: compact ? 5 : 8, size: 'small' }}
            />
          </Card>
        </TabPane>

        <TabPane tab={`High Risk (${riskyCustomers.length})`} key="risk">
          <Card>
            <List
              dataSource={riskyCustomers}
              renderItem={(customer) => (
                <List.Item
                  actions={[
                    <Button size="small" danger>Review</Button>,
                    <Button size="small" type="link">History</Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={<WarningOutlined />} 
                        style={{ backgroundColor: '#ff4d4f' }}
                      />
                    }
                    title={
                      <Space>
                        <Text>{customer.name}</Text>
                        <Tag color="red">{customer.paymentBehavior}</Tag>
                      </Space>
                    }
                    description={
                      <Space>
                        <Text>Outstanding: {formatCurrency(customer.currentOutstanding)}</Text>
                        <Text type="secondary">•</Text>
                        <Text type="secondary">Risk Score: {(customer as CustomerWithCredit).riskScore || 0}/100</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
              pagination={{ pageSize: compact ? 5 : 8, size: 'small' }}
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};
