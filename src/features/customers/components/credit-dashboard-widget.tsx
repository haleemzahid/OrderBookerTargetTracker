// Customer Credit Dashboard Widget
// High-level credit status overview widget for main dashboard

import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Progress, 
  List, 
  Avatar, 
  Tag, 
  Space, 
  Button, 
  Typography, 
  Tabs,
  Tooltip,
  Empty
} from 'antd';
import { 
  ExclamationCircleOutlined, 
  UserOutlined, 
  DollarOutlined, 
  WarningOutlined
} from '@ant-design/icons';
import { useNavigate } from '@tanstack/react-router';
import { useDashboardStats, useOverdueCustomers, useRiskyCustomers } from '../api/queries';
import { formatCurrency, getStatusColor } from '../utils/formatters';
import { CustomerWithCredit } from '../types';

const { Text } = Typography;
const { TabPane } = Tabs;

interface CreditDashboardWidgetProps {
  compact?: boolean;
  onCustomerSelect?: (customer: CustomerWithCredit) => void;
}

export const CreditDashboardWidget: React.FC<CreditDashboardWidgetProps> = ({
  compact = false,
  onCustomerSelect
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overdue');
  
  // Queries
  const dashboardStats = useDashboardStats();
  const overdueCustomers = useOverdueCustomers();
  const riskyCustomers = useRiskyCustomers();

  const stats = dashboardStats.data;
  const isLoading = dashboardStats.isLoading || overdueCustomers.isLoading || riskyCustomers.isLoading;
  
  const showDetailPage = (customer: CustomerWithCredit) => {
    if (onCustomerSelect) {
      onCustomerSelect(customer);
    } else {
      navigate({ to: `/customers/${customer.id}` });
    }
  };

  const viewAllCustomers = () => {
    navigate({ to: '/customers' });
  };



  return (
    <Card
      title={
        <Space>
          <DollarOutlined />
          <span>Customer Credit Overview</span>
        </Space>
      }
      extra={
        <Button type="link" onClick={viewAllCustomers}>
          View All
        </Button>
      }
      loading={isLoading}
      style={{ height: '100%' }}
    >
      {stats && (
        <>
          {/* Credit Summary Stats */}
          <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
            <Col xs={12} sm={6}>
              <Statistic
                title="Total Collections This Month"
                value={stats.collectionAchievedForMonth}
                precision={0}
                formatter={(value) => formatCurrency(Number(value))}
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Total Outstanding"
                value={stats.totalOutstanding}
                precision={0}
                formatter={(value) => formatCurrency(Number(value))}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Overdue Customers"
                value={stats.overdueCustomers}
                valueStyle={{ color: '#f5222d' }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Collection Progress"
                value={stats.collectionAchievedForMonth / stats.collectionTargetForMonth * 100}
                precision={1}
                suffix="%"
                valueStyle={{ 
                  color: (stats.collectionAchievedForMonth / stats.collectionTargetForMonth * 100) > 70 ? '#52c41a' :
                         (stats.collectionAchievedForMonth / stats.collectionTargetForMonth * 100) > 50 ? '#fa8c16' : '#f5222d'
                }}
              />
              <Progress 
                percent={stats.collectionAchievedForMonth / stats.collectionTargetForMonth * 100} 
                status={
                  (stats.collectionAchievedForMonth / stats.collectionTargetForMonth * 100) > 70 ? 'success' :
                  (stats.collectionAchievedForMonth / stats.collectionTargetForMonth * 100) > 50 ? 'active' : 'exception'
                }
                size="small"
                showInfo={false}
              />
            </Col>
          </Row>

          {/* Customer Credit Lists */}
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            size={compact ? 'small' : 'middle'}
          >
            <TabPane 
              tab={
                <span>
                  <ExclamationCircleOutlined />
                  Overdue ({overdueCustomers.data?.length || 0})
                </span>
              } 
              key="overdue"
            >
              <List
                size={compact ? 'small' : 'default'}
                dataSource={overdueCustomers.data?.slice(0, 5) || []}
                renderItem={(customer: CustomerWithCredit) => (
                  <List.Item
                    key={customer.id}
                    actions={[
                      <Button 
                        type="link" 
                        size="small" 
                        onClick={() => showDetailPage(customer)}
                      >
                        View
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#f5222d' }} />}
                      title={
                        <Space>
                          <Text strong>{customer.name}</Text>
                          <Tag color="red">
                            {customer.daysSinceLastPayment} days overdue
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space>
                          <Text type="danger">Overdue: {formatCurrency(customer.overdueAmount)}</Text>
                          <Text type="secondary">•</Text>
                          <Text type="secondary">Total: {formatCurrency(customer.currentOutstanding)}</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
                locale={{
                  emptyText: <Empty description="No overdue customers" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                }}
              />
              {overdueCustomers.data && overdueCustomers.data.length > 5 && (
                <div style={{ textAlign: 'center', marginTop: '8px' }}>
                  <Button type="link" onClick={viewAllCustomers}>
                    View {overdueCustomers.data.length - 5} more overdue customers
                  </Button>
                </div>
              )}
            </TabPane>

            <TabPane 
              tab={
                <span>
                  <WarningOutlined />
                  High Risk ({riskyCustomers.data?.length || 0})
                </span>
              } 
              key="risky"
            >
              <List
                size={compact ? 'small' : 'default'}
                dataSource={(riskyCustomers.data?.slice(0, 5) || []) as unknown as CustomerWithCredit[]}
                renderItem={(customer: CustomerWithCredit) => (
                  <List.Item
                    key={customer.id}
                    actions={[
                      <Button 
                        type="link" 
                        size="small" 
                        onClick={() => showDetailPage(customer)}
                      >
                        View
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#fa8c16' }} />}
                      title={
                        <Space>
                          <Text strong>{customer.name}</Text>
                          <Tag color={getStatusColor(customer.creditStatus)}>
                            {customer.creditStatus.replace('_', ' ')}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space>
                          <Tooltip title="Credit Utilization">
                            <Text type="warning">
                              {customer.creditUtilization.toFixed(0)}% used
                            </Text>
                          </Tooltip>
                          <Text type="secondary">•</Text>
                          <Text type="secondary">
                            Available: {formatCurrency(Math.max(0, customer.availableCredit))}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
                locale={{
                  emptyText: <Empty description="No high risk customers" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                }}
              />
              {riskyCustomers.data && riskyCustomers.data.length > 5 && (
                <div style={{ textAlign: 'center', marginTop: '8px' }}>
                  <Button type="link" onClick={viewAllCustomers}>
                    View {riskyCustomers.data.length - 5} more high risk customers
                  </Button>
                </div>
              )}
            </TabPane>
          </Tabs>
        </>
      )}

      {!stats && !isLoading && (
        <Empty 
          description="No credit data available" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </Card>
  );
};
