import React from 'react';
import { Card, Row, Col, Statistic, Typography, Button, Space, Skeleton } from 'antd';
import { ShoppingCartOutlined, DollarOutlined, WarningOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from '@tanstack/react-router';
import { useStockSummary } from '../../stock/api/queries';
import { FormatNumber } from '../../../shared/components';

const { Title } = Typography;

const StockSummarySection: React.FC = () => {
  const navigate = useNavigate();
  const { data: stockSummary, isLoading } = useStockSummary();

  const handleViewStock = () => {
    navigate({ to: '/stock' });
  };

  if (isLoading) {
    return (
      <Card
        title={
          <Space>
            <ShoppingCartOutlined style={{ color: '#1890ff' }} />
            <Title level={4} style={{ margin: 0 }}>Stock Summary</Title>
          </Space>
        }
        extra={
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={handleViewStock}
            size="small"
          >
            Manage Stock
          </Button>
        }
        style={{ height: '100%' }}
        bodyStyle={{ padding: '16px' }}
      >
        <Skeleton active paragraph={{ rows: 2 }} />
      </Card>
    );
  }

  const summary = stockSummary || {
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    inStockCount: 0
  };

  return (
    <Card
      title={
        <Space>
          <ShoppingCartOutlined style={{ color: '#1890ff' }} />
          <Title level={4} style={{ margin: 0 }}>Stock Summary</Title>
        </Space>
      }
      extra={
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={handleViewStock}
          size="small"
        >
          Manage Stock
        </Button>
      }
      style={{ height: '100%' }}
      bodyStyle={{ padding: '16px' }}
    >
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Statistic
            title="Total Products"
            value={summary.totalProducts}
            prefix={<ShoppingCartOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="Stock Value"
            value={summary.inStockCount}
            prefix={<DollarOutlined />}
            formatter={(value) => (
              <FormatNumber value={Number(value)} prefix="Rs. " decimalPlaces={0} />
            )}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="Low Stock"
            value={summary.lowStockCount}
            prefix={<WarningOutlined />}
            valueStyle={{ color: summary.lowStockCount > 0 ? '#faad14' : '#52c41a' }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="Out of Stock"
            value={summary.outOfStockCount}
            prefix={<WarningOutlined />}
            valueStyle={{ color: summary.outOfStockCount > 0 ? '#ff4d4f' : '#52c41a' }}
          />
        </Col>
      </Row>
    </Card>
  );
};

export default StockSummarySection;
