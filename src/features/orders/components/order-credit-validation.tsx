import React, { useEffect, useMemo } from 'react';
import {
  Card,
  Alert,
  Space,
  Typography,
  Progress,
  Tag,
  Button,
  Descriptions,
  Divider,
  Spin
} from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  DollarOutlined,
  UserOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import { useCreditValidation, useCustomerWithCredit } from '../../customers/api/queries';
import { formatCurrency } from '../../customers/utils/formatters';
import { CreditValidationResult } from '../../customers/types';

const { Text } = Typography;

interface OrderCreditValidationProps {
  customerId: string;
  orderAmount: number;
  onValidationChange?: (result: CreditValidationResult | null) => void;
  onRequestApproval?: () => void;
  onSuggestAlternative?: () => void;
  compact?: boolean;
}

export const OrderCreditValidation: React.FC<OrderCreditValidationProps> = ({
  customerId,
  orderAmount,
  onValidationChange,
  onRequestApproval,
  onSuggestAlternative,
  compact = false
}) => {
  // Queries
  const customerQuery = useCustomerWithCredit(customerId, !!customerId);
  const validationQuery = useCreditValidation(
    customerId, 
    orderAmount, 
    !!customerId && orderAmount > 0
  );

  const customer = customerQuery.data;
  const validation = validationQuery.data;
  const isLoading = customerQuery.isLoading || validationQuery.isLoading;

  // Notify parent of validation changes
  useEffect(() => {
    onValidationChange?.(validation || null);
  }, [validation, onValidationChange]);

  // Status determination
  const validationStatus = useMemo(() => {
    if (!validation) return 'loading';
    if (validation.canProceed) return 'success';
    if (validation.errors.length > 0) return 'blocked';
    if (validation.warnings.length > 0) return 'warning';
    return 'info';
  }, [validation]);

  // Alert message generation
  const alertMessage = useMemo(() => {
    if (!validation) return 'Validating credit...';
    
    if (validation.canProceed) {
      return 'Order can proceed with current credit terms';
    }
    
    if (validation.errors.length > 0) {
      return `Cannot process order: ${validation.errors[0]}`;
    }
    
    if (validation.warnings.length > 0) {
      return `Proceed with caution: ${validation.warnings[0]}`;
    }
    
    return 'Credit validation complete';
  }, [validation]);

  // Risk level color mapping
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return '#52c41a';
      case 'medium': return '#faad14';
      case 'high': return '#fa8c16';
      case 'critical': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  // Status icon mapping
  const getStatusIcon = () => {
    switch (validationStatus) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'warning':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'blocked':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <CreditCardOutlined style={{ color: '#1890ff' }} />;
    }
  };

  if (isLoading) {
    return (
      <Card size={compact ? 'small' : 'default'}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text type="secondary">Validating credit...</Text>
          </div>
        </div>
      </Card>
    );
  }

  if (!customer) {
    return (
      <Card size={compact ? 'small' : 'default'}>
        <Alert
          message="Customer Not Found"
          description="Please select a valid customer to proceed with credit validation."
          type="error"
          showIcon
        />
      </Card>
    );
  }

  return (
    <Card 
      size={compact ? 'small' : 'default'}
      title={
        <Space>
          {getStatusIcon()}
          <Text strong>Credit Validation</Text>
          {validation && (
            <Tag color={getRiskColor(validation.riskLevel)}>
              {validation.riskLevel.toUpperCase()} RISK
            </Tag>
          )}
        </Space>
      }
    >
      {/* Main Alert */}
      <Alert
        message={alertMessage}
        type={validationStatus === 'success' ? 'success' : 
              validationStatus === 'warning' ? 'warning' : 
              validationStatus === 'blocked' ? 'error' : 'info'}
        showIcon
        style={{ marginBottom: '16px' }}
      />

      {/* Customer Credit Summary */}
      <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#fafafa' }}>
        <Descriptions column={compact ? 1 : 2} size="small">
          <Descriptions.Item label="Customer">
            <Space>
              <UserOutlined />
              <Text strong>{customer.name}</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Phone">
            <Space>
              <PhoneOutlined />
              <Text>{customer.phone}</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Credit Limit">
            <Text strong>{formatCurrency(customer.creditLimit)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Available Credit">
            <Text strong style={{ color: customer.availableCredit > 0 ? '#52c41a' : '#ff4d4f' }}>
              {formatCurrency(customer.availableCredit)}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Current Outstanding">
            <Text>{formatCurrency(customer.currentOutstanding)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Payment Behavior">
            <Tag color={
              customer.paymentBehavior === 'excellent' ? 'green' :
              customer.paymentBehavior === 'good' ? 'blue' :
              customer.paymentBehavior === 'delayed' ? 'orange' : 'red'
            }>
              {customer.paymentBehavior.toUpperCase()}
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        {/* Credit Utilization Progress */}
        <div style={{ marginTop: '12px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Credit Utilization: {customer.creditUtilization.toFixed(1)}%
          </Text>
          <Progress
            percent={Math.min(customer.creditUtilization, 100)}
            status={customer.creditUtilization > 90 ? 'exception' : 
                   customer.creditUtilization > 70 ? 'active' : 'normal'}
            size="small"
            style={{ marginTop: '4px' }}
          />
        </div>
      </Card>

      {/* Order Impact */}
      <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#f0f9ff' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text type="secondary">Order Amount:</Text>
            <Text strong style={{ marginLeft: '8px', fontSize: '16px' }}>
              {formatCurrency(orderAmount)}
            </Text>
          </div>
          
          {validation && (
            <div>
              <Text type="secondary">After Order Available Credit:</Text>
              <Text 
                strong 
                style={{ 
                  marginLeft: '8px', 
                  fontSize: '16px',
                  color: validation.availableCredit >= 0 ? '#52c41a' : '#ff4d4f'
                }}
              >
                {formatCurrency(validation.availableCredit)}
              </Text>
            </div>
          )}
        </Space>
      </Card>

      {/* Warnings */}
      {validation?.warnings && validation.warnings.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <Text strong style={{ color: '#fa8c16' }}>Warnings:</Text>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            {validation.warnings.map((warning: string, index: number) => (
              <li key={index}>
                <Text type="secondary">{warning}</Text>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Errors/Blockers */}
      {validation?.errors && validation.errors.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <Text strong style={{ color: '#ff4d4f' }}>Issues:</Text>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            {validation.errors.map((error: string, index: number) => (
              <li key={index}>
                <Text type="danger">{error}</Text>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Action */}
      {validation?.recommendedAction && (
        <div style={{ marginBottom: '16px' }}>
          <Divider style={{ margin: '12px 0' }} />
          <Text strong>Recommended Action: </Text>
          <Tag color="blue" style={{ marginLeft: '8px' }}>
            {validation.recommendedAction.replace('_', ' ').toUpperCase()}
          </Tag>
        </div>
      )}

      {/* Action Buttons */}
      {!compact && (
        <Space style={{ marginTop: '16px', width: '100%', justifyContent: 'flex-end' }}>
          {validation?.recommendedAction === 'require_approval' && onRequestApproval && (
            <Button 
              type="primary" 
              icon={<ExclamationCircleOutlined />}
              onClick={onRequestApproval}
            >
              Request Approval
            </Button>
          )}
          
          {(validation?.recommendedAction === 'require_advance' || 
            validation?.recommendedAction === 'deny') && onSuggestAlternative && (
            <Button 
              icon={<DollarOutlined />}
              onClick={onSuggestAlternative}
            >
              Suggest Alternative
            </Button>
          )}
          
          {customer.whatsappNumber && (
            <Button 
              size="small"
              onClick={() => {
                const message = `Assalam o Alaikum ${customer.name}, we're processing your order. Please confirm the payment terms.`;
                const whatsappUrl = `https://wa.me/${customer.whatsappNumber?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
              }}
            >
              Contact Customer
            </Button>
          )}
        </Space>
      )}
    </Card>
  );
};

export default OrderCreditValidation;
