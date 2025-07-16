import React from 'react';
import { Card, Typography, List, Tag, Button, Space, Skeleton, Empty } from 'antd';
import { HistoryOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from '@tanstack/react-router';
import { useStockTransactions } from '../../stock/api/queries';
import { useProducts } from '../../products/api/queries';
import type { StockTransaction } from '../../stock/types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface RecentStockTransactionsSectionProps {
  maxItems?: number;
}

const RecentStockTransactionsSection: React.FC<RecentStockTransactionsSectionProps> = ({ 
  maxItems = 5 
}) => {
  const navigate = useNavigate();
  const { data: transactions, isLoading } = useStockTransactions();
  const { data: products } = useProducts();

  const getProductName = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    return product?.name || 'Unknown Product';
  };

  const handleViewTransactions = () => {
    navigate({ to: '/stock/transactions' });
  };

  if (isLoading) {
    return (
      <Card
        title={
          <Space>
            <HistoryOutlined style={{ color: '#722ed1' }} />
            <Title level={4} style={{ margin: 0 }}>Recent Stock Movements</Title>
          </Space>
        }
        extra={
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={handleViewTransactions}
            size="small"
          >
            View All
          </Button>
        }
        style={{ height: '100%' }}
        bodyStyle={{ padding: '16px' }}
      >
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    );
  }

  const recentTransactions = transactions?.slice(0, maxItems) || [];

  const getTransactionTypeColor = (type: StockTransaction['transactionType']) => {
    switch (type) {
      case 'IN':
        return 'green';
      case 'OUT':
        return 'red';
      case 'ADJUSTMENT':
        return 'orange';
      default:
        return 'default';
    }
  };

  const getTransactionIcon = (type: StockTransaction['transactionType']) => {
    switch (type) {
      case 'IN':
        return '+';
      case 'OUT':
        return '-';
      case 'ADJUSTMENT':
        return '±';
      default:
        return '';
    }
  };

  return (
    <Card
      title={
        <Space>
          <HistoryOutlined style={{ color: '#722ed1' }} />
          <Title level={4} style={{ margin: 0 }}>Recent Stock Movements</Title>
        </Space>
      }
      extra={
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={handleViewTransactions}
          size="small"
        >
          View All
        </Button>
      }
      style={{ height: '100%' }}
      bodyStyle={{ padding: '16px' }}
    >
      {recentTransactions.length === 0 ? (
        <Empty
          description="No recent stock movements"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={recentTransactions}
          renderItem={(transaction: StockTransaction) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>{getProductName(transaction.productId)}</Text>
                    <Tag color={getTransactionTypeColor(transaction.transactionType)}>
                      {getTransactionIcon(transaction.transactionType)}{transaction.quantity}
                    </Tag>
                  </Space>
                }
                description={
                  <Space direction="vertical" size="small">
                    <Space>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {transaction.reason}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {dayjs(transaction.createdAt).format('MMM DD, HH:mm')}
                      </Text>
                    </Space>
                    {transaction.comments && (
                      <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>
                        {transaction.comments}
                      </Text>
                    )}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
      
      {transactions && transactions.length > maxItems && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button
            type="link"
            onClick={handleViewTransactions}
            icon={<HistoryOutlined />}
          >
            View {transactions.length - maxItems} More Transactions
          </Button>
        </div>
      )}
    </Card>
  );
};

export default RecentStockTransactionsSection;
