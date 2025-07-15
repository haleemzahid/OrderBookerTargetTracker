import React from 'react';
import { Card, Typography, Alert, List, Tag, Button, Space, Skeleton } from 'antd';
import { WarningOutlined, ShoppingCartOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from '@tanstack/react-router';
import { useStockOverview } from '../../stock/api/queries';
import { StockLevelIndicator } from '../../stock/components/stock-level-indicator';
import type { ProductStock } from '../../stock/types';

const { Title, Text } = Typography;

interface StockAlertSectionProps {
  maxItems?: number;
}

const StockAlertSection: React.FC<StockAlertSectionProps> = ({ maxItems = 5 }) => {
  const navigate = useNavigate();
  const { data: stockOverview, isLoading } = useStockOverview();

  const lowStockItems = stockOverview?.filter(item => item.isLowStock && item.currentStock > 0) || [];
  const outOfStockItems = stockOverview?.filter(item => item.currentStock <= 0) || [];
  const alertItems = [...outOfStockItems, ...lowStockItems].slice(0, maxItems);

  const handleViewStock = () => {
    navigate({ to: '/stock' });
  };

  if (isLoading) {
    return (
      <Card
        title={
          <Space>
            <WarningOutlined style={{ color: '#faad14' }} />
            <Title level={4} style={{ margin: 0 }}>Stock Alerts</Title>
          </Space>
        }
        style={{ height: '100%' }}
        bodyStyle={{ padding: '16px' }}
      >
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    );
  }

  const hasAlerts = alertItems.length > 0;

  return (
    <Card
      title={
        <Space>
          <WarningOutlined style={{ color: hasAlerts ? '#faad14' : '#52c41a' }} />
          <Title level={4} style={{ margin: 0 }}>
            Stock Alerts
            {hasAlerts && (
              <Tag color="warning" style={{ marginLeft: 8 }}>
                {alertItems.length}
              </Tag>
            )}
          </Title>
        </Space>
      }
      extra={
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={handleViewStock}
          size="small"
        >
          View All
        </Button>
      }
      style={{ height: '100%' }}
      bodyStyle={{ padding: '16px' }}
    >
      {!hasAlerts ? (
        <Alert
          message="All Good!"
          description="No stock alerts at this time. All products are adequately stocked."
          type="success"
          showIcon
        />
      ) : (
        <div>
          {outOfStockItems.length > 0 && (
            <Alert
              message={`${outOfStockItems.length} Product${outOfStockItems.length > 1 ? 's' : ''} Out of Stock`}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          
          {lowStockItems.length > 0 && (
            <Alert
              message={`${lowStockItems.length} Product${lowStockItems.length > 1 ? 's' : ''} Running Low`}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <List
            itemLayout="horizontal"
            dataSource={alertItems}
            renderItem={(item: ProductStock) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{item.productName}</Text>
                      <StockLevelIndicator
                        currentStock={item.currentStock}
                        lowStockThreshold={item.lowStockThreshold}
                        size="small"
                      />
                    </Space>
                  }
                  description={
                    <Space>
                      <Text type="secondary">
                        Current: {item.currentStock} units
                      </Text>
                      <Text type="secondary">
                        Threshold: {item.lowStockThreshold} units
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
          
          {alertItems.length < (outOfStockItems.length + lowStockItems.length) && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Button
                type="link"
                onClick={handleViewStock}
                icon={<ShoppingCartOutlined />}
              >
                View {(outOfStockItems.length + lowStockItems.length) - alertItems.length} More
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default StockAlertSection;
