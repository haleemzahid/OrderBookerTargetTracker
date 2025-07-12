import React from 'react';
import { Progress, Typography, Space, Spin, Alert, Tag } from 'antd';
import { DollarCircleOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { WidgetDataService } from '../../api/widget-data-service';
import { useDashboardFilters } from '../../stores/dashboard-store';
import type { ProfitMarginData } from '../../types';

const { Text, Title } = Typography;

interface ProfitMarginWidgetProps {
  refreshInterval?: number;
}

export const ProfitMarginWidget: React.FC<ProfitMarginWidgetProps> = React.memo(({
  refreshInterval = 1800000 // 30 minutes default
}) => {
  const filters = useDashboardFilters();
  
  const { data: response, isLoading, error, isError } = useQuery({
    queryKey: ['profit-margins', filters],
    queryFn: () => WidgetDataService.getProfitMargins(filters),
    refetchInterval: refreshInterval,
    staleTime: refreshInterval / 2,
    gcTime: refreshInterval * 2
  });
  
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" tip="Loading profit data..." />
      </div>
    );
  }
  
  if (isError || response?.status === 'error') {
    return (
      <Alert
        message="Error Loading Profit Data"
        description={response?.error || error?.message || 'Failed to load profit margin metrics'}
        type="error"
        showIcon
      />
    );
  }
  
  const data: ProfitMarginData = response?.data || {
    currentMarginPercentage: 0,
    targetMarginPercentage: 20,
    marginTrend: 'stable',
    totalRevenue: 0,
    totalProfit: 0,
    variance: 0,
    status: 'critical'
  };
  
  // Configure colors based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#52c41a';
      case 'warning': return '#faad14';
      case 'critical': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy': return 'Healthy';
      case 'warning': return 'Needs Attention';
      case 'critical': return 'Critical';
      default: return 'Unknown';
    }
  };
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUpOutlined style={{ color: '#52c41a' }} />;
      case 'down': return <ArrowDownOutlined style={{ color: '#ff4d4f' }} />;
      default: return null;
    }
  };
  
  const statusColor = getStatusColor(data.status);
  const progressColor = data.currentMarginPercentage >= data.targetMarginPercentage ? '#52c41a' : statusColor;
  
  // Format currency for Pakistani context
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: amount > 1000000 ? 'compact' : 'standard'
    }).format(amount);
  };
  
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px', textAlign: 'center', width: '100%' }}>
        <Space direction="vertical" size="small">
          <Space align="center">
            <DollarCircleOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
            <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
              Profit Margin
            </Title>
          </Space>
          
          <Tag color={data.status === 'healthy' ? 'success' : data.status === 'warning' ? 'warning' : 'error'}>
            {getStatusText(data.status)}
          </Tag>
        </Space>
      </div>
      
      {/* Circular Progress Gauge */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Progress
          type="circle"
          percent={Math.min(data.currentMarginPercentage, 100)}
          width={120}
          strokeColor={progressColor}
          trailColor="#f0f0f0"
          strokeWidth={8}
          format={() => (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: statusColor }}>
                {data.currentMarginPercentage.toFixed(1)}%
              </div>
              <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
                Margin
              </div>
            </div>
          )}
        />
        
        {/* Target indicator */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, 60px)',
          fontSize: '12px',
          color: '#8c8c8c',
          textAlign: 'center'
        }}>
          Target: {data.targetMarginPercentage}%
        </div>
      </div>
      
      {/* Variance and Trend */}
      <div style={{ marginTop: '10px', marginBottom: '16px', textAlign: 'center' }}>
        <Space direction="vertical" size="small">
          <Space>
            {getTrendIcon(data.marginTrend)}
            <Text strong style={{ 
              color: data.variance >= 0 ? '#52c41a' : '#ff4d4f'
            }}>
              {data.variance >= 0 ? '+' : ''}{data.variance.toFixed(1)}%
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              vs target
            </Text>
          </Space>
        </Space>
      </div>
      
      {/* Financial Summary */}
      <div style={{ 
        width: '100%', 
        backgroundColor: '#fafafa', 
        borderRadius: '6px', 
        padding: '12px',
        marginTop: 'auto'
      }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>Revenue:</Text>
            <Text strong style={{ fontSize: '12px' }}>
              {formatCurrency(data.totalRevenue)}
            </Text>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>Profit:</Text>
            <Text strong style={{ fontSize: '12px', color: statusColor }}>
              {formatCurrency(data.totalProfit)}
            </Text>
          </div>
          
          <div style={{ 
            height: '1px', 
            backgroundColor: '#e8e8e8', 
            margin: '4px 0' 
          }} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text strong style={{ fontSize: '12px' }}>Margin:</Text>
            <Text strong style={{ fontSize: '12px', color: statusColor }}>
              {data.currentMarginPercentage.toFixed(1)}%
            </Text>
          </div>
        </Space>
      </div>
      
      {/* Status Indicator */}
      <div style={{ 
        marginTop: '8px',
        fontSize: '10px',
        color: '#8c8c8c',
        textAlign: 'center'
      }}>
        Last updated: {response?.lastUpdated ? new Date(response.lastUpdated).toLocaleTimeString() : 'Unknown'}
      </div>
    </div>
  );
});

ProfitMarginWidget.displayName = 'ProfitMarginWidget';

export default ProfitMarginWidget;
