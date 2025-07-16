// Customer Card Component
// Individual customer display card for Pakistani wholesale business

import React from 'react';
import {
  Card,
  Space,
  Typography,
  Tag,
  Badge,
  Button,
  Progress,
  Avatar,
  Divider,
  Row,
  Col
} from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  WhatsAppOutlined,
  ShopOutlined,
  CalendarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { CustomerWithCredit } from '../types';
import { formatCurrency, getStatusColor, getPaymentBehaviorIcon, formatPhoneNumber } from '../utils/formatters';

const { Text, Title } = Typography;

interface CustomerCardProps {
  customer: CustomerWithCredit;
  onClick?: (customer: CustomerWithCredit) => void;
  onEdit?: (customer: CustomerWithCredit) => void;
  onPayment?: (customer: CustomerWithCredit) => void;
  showActions?: boolean;
  compact?: boolean;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  onClick,
  onEdit,
  onPayment,
  showActions = true,
  compact = false
}) => {
  const {
    name,
    businessName,
    phone,
    whatsappNumber,
    area,
    city,
    creditLimit,
    currentOutstanding,
    availableCredit,
    creditUtilization,
    creditStatus,
    paymentBehavior,
    isOverdue,
    daysSinceLastPayment,
    lastPaymentDate,
    totalOrdersCount,
    averageOrderValue,
    relationshipType,
    customerType,
    shopType
  } = customer;

  // Calculate risk indicators
  const isHighRisk = creditUtilization > 80 || paymentBehavior === 'problematic' || (isOverdue && daysSinceLastPayment != null && daysSinceLastPayment > 30);
  const isMediumRisk = creditUtilization > 60 || paymentBehavior === 'delayed' || (isOverdue && daysSinceLastPayment != null && daysSinceLastPayment > 7);

  // Get appropriate status color and icon
  const getRiskIndicator = () => {
    if (isHighRisk) {
      return { color: '#ff4d4f', icon: <WarningOutlined />, text: 'High Risk' };
    }
    if (isMediumRisk) {
      return { color: '#faad14', icon: <ExclamationCircleOutlined />, text: 'Medium Risk' };
    }
    return { color: '#52c41a', icon: <CheckCircleOutlined />, text: 'Low Risk' };
  };

  const riskIndicator = getRiskIndicator();

  const cardActions = showActions ? [
    <Button 
      key="view" 
      type="link" 
      size="small"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(customer);
      }}
    >
      View Details
    </Button>,
    <Button 
      key="edit" 
      type="link" 
      size="small"
      onClick={(e) => {
        e.stopPropagation();
        onEdit?.(customer);
      }}
    >
      Edit
    </Button>,
    currentOutstanding > 0 && (
      <Button 
        key="payment" 
        type="link" 
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onPayment?.(customer);
        }}
      >
        Record Payment
      </Button>
    )
  ].filter(Boolean) : undefined;

  return (
    <Card
      size="small"
      hoverable={!!onClick}
      onClick={() => onClick?.(customer)}
      actions={cardActions}
      style={{
        marginBottom: compact ? 8 : 16,
        borderLeft: `4px solid ${riskIndicator.color}`,
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      <Row gutter={[16, 8]}>
        {/* Customer Info Section */}
        <Col span={compact ? 24 : 16}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {/* Header with name and tags */}
            <Space wrap>
              <Avatar icon={<UserOutlined />} size="small" />
              <Title level={5} style={{ margin: 0 }}>
                {name}
              </Title>
              <Tag color={getStatusColor(creditStatus)}>
                {creditStatus.replace('_', ' ').toUpperCase()}
              </Tag>
              {relationshipType === 'family' && (
                <Tag color="blue">Family</Tag>
              )}
              {customerType === 'special' && (
                <Tag color="gold">Special</Tag>
              )}
            </Space>

            {/* Business name if available */}
            {businessName && (
              <Space>
                <ShopOutlined style={{ color: '#8c8c8c' }} />
                <Text type="secondary">{businessName}</Text>
                <Tag>{shopType?.replace('_', ' ')}</Tag>
              </Space>
            )}

            {/* Contact information */}
            <Space size="large" wrap>
              <Space size="small">
                <PhoneOutlined />
                <Text copyable={{ tooltips: false }}>
                  {formatPhoneNumber(phone)}
                </Text>
              </Space>
              {whatsappNumber && (
                <Space size="small">
                  <WhatsAppOutlined style={{ color: '#25D366' }} />
                  <Text copyable={{ tooltips: false }}>
                    {formatPhoneNumber(whatsappNumber)}
                  </Text>
                </Space>
              )}
              {(area || city) && (
                <Space size="small">
                  <EnvironmentOutlined />
                  <Text type="secondary">
                    {[area, city].filter(Boolean).join(', ')}
                  </Text>
                </Space>
              )}
            </Space>

            {/* Payment behavior and last payment */}
            <Space>
              {getPaymentBehaviorIcon(paymentBehavior)}
              <Text style={{ textTransform: 'capitalize' }}>
                {paymentBehavior.replace('_', ' ')} Payment Behavior
              </Text>
              {lastPaymentDate && (
                <>
                  <Divider type="vertical" />
                  <CalendarOutlined />
                  <Text type="secondary">
                    Last payment: {lastPaymentDate.toLocaleDateString()}
                  </Text>
                </>
              )}
            </Space>
          </Space>
        </Col>

        {/* Credit Information Section */}
        <Col span={compact ? 24 : 8}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {/* Risk indicator */}
            <Space>
              {riskIndicator.icon}
              <Text style={{ color: riskIndicator.color, fontWeight: 500 }}>
                {riskIndicator.text}
              </Text>
            </Space>

            {/* Credit utilization */}
            <Space direction="vertical" size={2} style={{ width: '100%' }}>
              <Row justify="space-between" style={{ width: '100%' }}>
                <Col><Text strong>Credit Usage</Text></Col>
                <Col><Text>{creditUtilization.toFixed(1)}%</Text></Col>
              </Row>
              <Progress
                percent={creditUtilization}
                size="small"
                status={creditUtilization > 90 ? 'exception' : creditUtilization > 70 ? 'active' : 'success'}
                showInfo={false}
              />
            </Space>

            {/* Outstanding and available credit */}
            <Row gutter={8}>
              <Col span={12}>
                <Space direction="vertical" size={0}>
                  <Text type="secondary" style={{ fontSize: '11px' }}>Outstanding</Text>
                  <Text strong style={{ color: currentOutstanding > 0 ? '#ff4d4f' : '#52c41a' }}>
                    {formatCurrency(currentOutstanding)}
                  </Text>
                </Space>
              </Col>
              <Col span={12}>
                <Space direction="vertical" size={0}>
                  <Text type="secondary" style={{ fontSize: '11px' }}>Available</Text>
                  <Text strong style={{ color: availableCredit > 0 ? '#52c41a' : '#ff4d4f' }}>
                    {formatCurrency(availableCredit)}
                  </Text>
                </Space>
              </Col>
            </Row>

            {/* Credit limit */}
            <Space direction="vertical" size={0}>
              <Text type="secondary" style={{ fontSize: '11px' }}>Credit Limit</Text>
              <Text strong>{formatCurrency(creditLimit)}</Text>
            </Space>

            {/* Orders summary */}
            <Space direction="vertical" size={0}>
              <Text type="secondary" style={{ fontSize: '11px' }}>Orders</Text>
              <Space>
                <Text strong>{totalOrdersCount}</Text>
                <Text type="secondary">•</Text>
                <Text>Avg: {formatCurrency(averageOrderValue)}</Text>
              </Space>
            </Space>

            {/* Overdue indicator */}
            {isOverdue && (
              <Badge 
                count={`${daysSinceLastPayment} days overdue`}
                style={{ backgroundColor: '#ff4d4f' }}
              />
            )}
          </Space>
        </Col>
      </Row>
    </Card>
  );
};
