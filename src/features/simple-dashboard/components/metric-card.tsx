import React from 'react';
import { Card, Typography, Spin } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'default' | 'success' | 'warning' | 'error';
  trend?: {
    direction: 'up' | 'down' | 'stable';
    value?: string;
  };
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  color = 'default',
  trend,
  loading = false
}) => {
  const getCardBorderColor = () => {
    switch (color) {
      case 'success':
        return '#52c41a';
      case 'warning':
        return '#faad14';
      case 'error':
        return '#f5222d';
      default:
        return '#d9d9d9';
    }
  };

  const getValueColor = () => {
    switch (color) {
      case 'success':
        return '#52c41a';
      case 'warning':
        return '#faad14';
      case 'error':
        return '#f5222d';
      default:
        return '#262626';
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend.direction) {
      case 'up':
        return <ArrowUpOutlined style={{ color: '#52c41a' }} />;
      case 'down':
        return <ArrowDownOutlined style={{ color: '#f5222d' }} />;
      case 'stable':
        return <MinusOutlined style={{ color: '#8c8c8c' }} />;
      default:
        return null;
    }
  };

  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      // Format numbers with commas and handle currency
      if (title.toLowerCase().includes('sales') || title.toLowerCase().includes('amount')) {
        return `Rs. ${val.toLocaleString()}`;
      }
      if (title.toLowerCase().includes('achievement') || title.toLowerCase().includes('percentage')) {
        return `${val.toFixed(1)}%`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <Card
      bordered
      style={{
        borderColor: getCardBorderColor(),
        borderWidth: 2,
        height: '100%',
        minHeight: 140
      }}
      bodyStyle={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <Text 
          type="secondary" 
          style={{ 
            fontSize: '14px', 
            fontWeight: 500,
            lineHeight: 1.2,
            flex: 1,
            marginRight: 8
          }}
        >
          {title}
        </Text>
        <div style={{ fontSize: '20px', color: getValueColor(), opacity: 0.8 }}>
          {icon}
        </div>
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 40 }}>
            <Spin size="small" />
          </div>
        ) : (
          <Title 
            level={3} 
            style={{ 
              margin: 0, 
              color: getValueColor(),
              fontSize: '24px',
              fontWeight: 'bold',
              lineHeight: 1.2,
              textAlign: 'left'
            }}
          >
            {formatValue(value)}
          </Title>
        )}
      </div>
      
      {trend && !loading && (
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
          {getTrendIcon()}
          {trend.value && (
            <Text 
              style={{ 
                marginLeft: 4, 
                fontSize: '12px',
                color: trend.direction === 'up' ? '#52c41a' : trend.direction === 'down' ? '#f5222d' : '#8c8c8c'
              }}
            >
              {trend.value}
            </Text>
          )}
        </div>
      )}
    </Card>
  );
};

export default MetricCard;
