import React from 'react';
import { Alert, Badge, Button, Card, Typography } from 'antd';
import { WarningOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import type { LowStockAlertProps } from '../types';

const { Text } = Typography;

export const LowStockAlert: React.FC<LowStockAlertProps> = ({
  productCount,
  onClick
}) => {
  if (productCount === 0) {
    return null;
  }

  const alertMessage = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <WarningOutlined />
        <Text strong>
          {productCount} product{productCount !== 1 ? 's' : ''} running low on stock
        </Text>
      </div>
      {onClick && (
        <Button 
          type="link" 
          size="small" 
          icon={<ShoppingCartOutlined />}
          onClick={onClick}
        >
          View Details
        </Button>
      )}
    </div>
  );

  return (
    <Alert
      message={alertMessage}
      type="warning"
      showIcon={false}
      style={{ marginBottom: 16 }}
      closable
    />
  );
};

// Widget version for dashboard
export const LowStockWidget: React.FC<LowStockAlertProps & { style?: React.CSSProperties }> = ({
  productCount,
  onClick,
  style
}) => {
  if (productCount === 0) {
    return (
      <Card style={style} size="small">
        <div style={{ textAlign: 'center', color: '#52c41a' }}>
          <Text>All products in stock</Text>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      style={style} 
      size="small"
      hoverable={!!onClick}
      onClick={onClick}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Badge count={productCount} overflowCount={99}>
            <WarningOutlined style={{ fontSize: '20px', color: '#faad14' }} />
          </Badge>
          <div style={{ marginTop: '8px' }}>
            <Text strong>Low Stock Alert</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {productCount} product{productCount !== 1 ? 's' : ''} need attention
            </Text>
          </div>
        </div>
      </div>
    </Card>
  );
};
