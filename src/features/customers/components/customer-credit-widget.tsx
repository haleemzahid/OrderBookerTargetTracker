// Customer Credit Status Widget
// Displays real-time credit status with Pakistani business context

import React from 'react';
import {
  Card,
  Badge,
  Space,
  Typography,
  Progress,
  Tag,
  Button,
  Divider,
  Row,
  Col,
  Tooltip,
  Alert
} from 'antd';
import {
  CreditCardOutlined,
  PhoneOutlined,
  WhatsAppOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  CalendarOutlined,
  DollarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { CustomerWithCredit } from '../types';
import { formatCurrency, getStatusColor, getPaymentBehaviorIcon } from '../utils/formatters';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

interface CustomerCreditWidgetProps {
  customer: CustomerWithCredit;
  orderAmount?: number;
  showActions?: boolean;
  compact?: boolean;
  onCall?: () => void;
  onWhatsApp?: () => void;
  onViewHistory?: () => void;
}

export const CustomerCreditWidget: React.FC<CustomerCreditWidgetProps> = ({
  customer,
  orderAmount = 0,
  showActions = true,
  compact = false,
  onCall,
  onWhatsApp,
  onViewHistory
}) => {
  // Calculate credit utilization percentage
  const creditUtilization = customer.creditLimit > 0 
    ? (customer.currentOutstanding / customer.creditLimit) * 100 
    : 0;

  // Calculate available credit after potential order
  const availableCreditAfterOrder = customer.availableCredit - orderAmount;
  const wouldExceedLimit = orderAmount > 0 && availableCreditAfterOrder < 0;

  // Determine overall status
  const getOverallStatus = () => {
    if (customer.creditStatus === 'blocked') return 'blocked';
    if (customer.isOverdue || customer.overdueAmount > 0) return 'overdue';
    if (wouldExceedLimit) return 'limit_exceeded';
    if (creditUtilization >= 90) return 'near_limit';
    if (creditUtilization >= 70) return 'warning';
    return 'good';
  };

  const overallStatus = getOverallStatus();

  // Status configuration
  const statusConfig = {
    good: {
      color: '#52c41a',
      bgColor: '#f6ffed',
      borderColor: '#b7eb8f',
      icon: <CheckCircleOutlined />,
      title: 'Good Credit Status',
      description: 'Customer is in good standing'
    },
    warning: {
      color: '#faad14',
      bgColor: '#fffbe6',
      borderColor: '#ffe58f',
      icon: <ExclamationCircleOutlined />,
      title: 'Credit Warning',
      description: 'High credit utilization'
    },
    near_limit: {
      color: '#fa8c16',
      bgColor: '#fff2e8',
      borderColor: '#ffbb96',
      icon: <ClockCircleOutlined />,
      title: 'Near Credit Limit',
      description: 'Approaching credit limit'
    },
    limit_exceeded: {
      color: '#f5222d',
      bgColor: '#fff2f0',
      borderColor: '#ffccc7',
      icon: <StopOutlined />,
      title: 'Credit Limit Exceeded',
      description: 'Order would exceed available credit'
    },
    overdue: {
      color: '#f5222d',
      bgColor: '#fff2f0',
      borderColor: '#ffccc7',
      icon: <ExclamationCircleOutlined />,
      title: 'Overdue Payments',
      description: 'Customer has overdue amounts'
    },
    blocked: {
      color: '#8c8c8c',
      bgColor: '#f5f5f5',
      borderColor: '#d9d9d9',
      icon: <StopOutlined />,
      title: 'Account Blocked',
      description: 'Customer is blocked from new credit'
    }
  };

  const status = statusConfig[overallStatus];

  return (
    <Card
      size={compact ? 'small' : 'default'}
      style={{
        borderColor: status.borderColor,
        backgroundColor: status.bgColor,
        borderWidth: 2
      }}
      bodyStyle={{ padding: compact ? 12 : 24 }}
    >
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space>
            <Badge 
              status={overallStatus === 'good' ? 'success' : overallStatus === 'warning' || overallStatus === 'near_limit' ? 'warning' : 'error'}
              text={
                <Title level={compact ? 5 : 4} style={{ margin: 0, color: status.color }}>
                  {status.icon} {status.title}
                </Title>
              }
            />
          </Space>
        </Col>
        <Col>
          <Space>
            {getPaymentBehaviorIcon(customer.paymentBehavior)}
            <Tag color={getStatusColor(customer.creditStatus)}>
              {customer.creditStatus.replace('_', ' ').toUpperCase()}
            </Tag>
          </Space>
        </Col>
      </Row>

      {/* Customer Info */}
      <Row style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text strong style={{ fontSize: compact ? 14 : 16 }}>
              <UserOutlined /> {customer.name}
            </Text>
            {customer.businessName && (
              <Text type="secondary">{customer.businessName}</Text>
            )}
            <Text type="secondary">
              <PhoneOutlined /> {customer.phone}
              {customer.whatsappNumber && (
                <Tooltip title="Has WhatsApp">
                  <WhatsAppOutlined style={{ color: '#25D366', marginLeft: 8 }} />
                </Tooltip>
              )}
            </Text>
          </Space>
        </Col>
      </Row>

      {/* Credit Information */}
      <Row gutter={[16, 8]} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card size="small" bodyStyle={{ padding: 8 }}>
            <Space direction="vertical" size="small" align="center" style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Outstanding</Text>
              <Text strong style={{ 
                color: customer.currentOutstanding > 0 ? '#f5222d' : '#52c41a',
                fontSize: compact ? 14 : 16 
              }}>
                {formatCurrency(customer.currentOutstanding)}
              </Text>
            </Space>
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" bodyStyle={{ padding: 8 }}>
            <Space direction="vertical" size="small" align="center" style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Available Credit</Text>
              <Text strong style={{ 
                color: customer.availableCredit > 0 ? '#52c41a' : '#f5222d',
                fontSize: compact ? 14 : 16 
              }}>
                {formatCurrency(Math.max(0, customer.availableCredit))}
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Credit Utilization Progress */}
      <Space direction="vertical" size="small" style={{ width: '100%', marginBottom: 16 }}>
        <Text strong>Credit Utilization</Text>
        <Progress
          percent={Math.min(creditUtilization, 100)}
          strokeColor={
            creditUtilization >= 90 ? '#f5222d' :
            creditUtilization >= 70 ? '#faad14' : '#52c41a'
          }
          size="small"
          format={(percent) => `${percent?.toFixed(0)}%`}
        />
        <Row justify="space-between">
          <Text type="secondary" style={{ fontSize: 12 }}>
            Used: {formatCurrency(customer.currentOutstanding)}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Limit: {formatCurrency(customer.creditLimit)}
          </Text>
        </Row>
      </Space>

      {/* Order Impact (if orderAmount provided) */}
      {orderAmount > 0 && (
        <Alert
          message={wouldExceedLimit ? "Order Exceeds Credit Limit" : "Order Impact"}
          description={
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Row justify="space-between">
                <Text>Order Amount:</Text>
                <Text strong>{formatCurrency(orderAmount)}</Text>
              </Row>
              <Row justify="space-between">
                <Text>Available After Order:</Text>
                <Text strong style={{ color: availableCreditAfterOrder >= 0 ? '#52c41a' : '#f5222d' }}>
                  {formatCurrency(Math.max(0, availableCreditAfterOrder))}
                </Text>
              </Row>
              {wouldExceedLimit && (
                <Row justify="space-between">
                  <Text strong style={{ color: '#f5222d' }}>Exceeds By:</Text>
                  <Text strong style={{ color: '#f5222d' }}>
                    {formatCurrency(Math.abs(availableCreditAfterOrder))}
                  </Text>
                </Row>
              )}
            </Space>
          }
          type={wouldExceedLimit ? 'error' : 'info'}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Overdue Information */}
      {customer.isOverdue && customer.overdueAmount > 0 && (
        <Alert
          message="Overdue Payment"
          description={
            <Space direction="vertical" size="small">
              <Row justify="space-between">
                <Text>Overdue Amount:</Text>
                <Text strong style={{ color: '#f5222d' }}>
                  {formatCurrency(customer.overdueAmount)}
                </Text>
              </Row>
              <Row justify="space-between">
                <Text>Days Since Payment:</Text>
                <Text strong style={{ color: '#f5222d' }}>
                  {customer.daysSinceLastPayment || 0} days
                </Text>
              </Row>
            </Space>
          }
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Payment History Info */}
      <Row style={{ marginBottom: showActions ? 16 : 0 }}>
        <Col span={24}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {customer.lastPaymentDate && (
              <Row justify="space-between">
                <Text type="secondary">
                  <CalendarOutlined /> Last Payment:
                </Text>
                <Text type="secondary">
                  {dayjs(customer.lastPaymentDate).fromNow()}
                </Text>
              </Row>
            )}
            <Row justify="space-between">
              <Text type="secondary">
                <DollarOutlined /> Total Orders:
              </Text>
              <Text type="secondary">
                {customer.totalOrdersCount} orders
              </Text>
            </Row>
            <Row justify="space-between">
              <Text type="secondary">Credit Days:</Text>
              <Text type="secondary">{customer.creditDays} days</Text>
            </Row>
          </Space>
        </Col>
      </Row>

      {/* Action Buttons */}
      {showActions && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <Row gutter={[8, 8]}>
            <Col span={compact ? 12 : 8}>
              <Button 
                size={compact ? 'small' : 'middle'}
                icon={<PhoneOutlined />}
                onClick={onCall}
                block
              >
                Call
              </Button>
            </Col>
            {customer.whatsappNumber && (
              <Col span={compact ? 12 : 8}>
                <Button 
                  size={compact ? 'small' : 'middle'}
                  icon={<WhatsAppOutlined />}
                  onClick={onWhatsApp}
                  style={{ color: '#25D366', borderColor: '#25D366' }}
                  block
                >
                  WhatsApp
                </Button>
              </Col>
            )}
            <Col span={compact ? 24 : 8}>
              <Button 
                size={compact ? 'small' : 'middle'}
                icon={<CreditCardOutlined />}
                onClick={onViewHistory}
                type="dashed"
                block
              >
                View History
              </Button>
            </Col>
          </Row>
        </>
      )}
    </Card>
  );
};
