import React from 'react';
import { Card, Statistic, Progress, Space, Typography, Spin, Alert } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, TrophyOutlined, DollarOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { WidgetDataService } from '../../api/widget-data-service';
import { useDashboardFilters } from '../../stores/dashboard-store';
import type { RevenueMetricData } from '../../types';

const { Text, Title } = Typography;

interface RevenuePerformanceWidgetProps {
  refreshInterval?: number;
}

export const RevenuePerformanceWidget: React.FC<RevenuePerformanceWidgetProps> = React.memo(({
  refreshInterval = 1800000 // 30 minutes default
}) => {
  const filters = useDashboardFilters();
  
  const { data: response, isLoading, error, isError } = useQuery({
    queryKey: ['revenue-metrics', filters],
    queryFn: () => WidgetDataService.getRevenueMetrics(filters),
    refetchInterval: refreshInterval,
    staleTime: refreshInterval / 2, // Consider data stale after half the refresh interval
    gcTime: refreshInterval * 2 // Keep in cache for 2x refresh interval
  });
  
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" tip="Loading revenue data..." />
      </div>
    );
  }
  
  if (isError || response?.status === 'error') {
    return (
      <Alert
        message="Error Loading Revenue Data"
        description={response?.error || error?.message || 'Failed to load revenue metrics'}
        type="error"
        showIcon
      />
    );
  }
  
  const data: RevenueMetricData = response?.data || {
    currentMonthRevenue: 0,
    targetRevenue: 0,
    achievementPercentage: 0,
    growthPercentage: 0,
    lastMonthRevenue: 0,
    trendData: []
  };
  
  // Calculate colors and status
  const isPositiveGrowth = data.growthPercentage >= 0;
  const achievementColor = data.achievementPercentage >= 100 ? '#52c41a' : 
                          data.achievementPercentage >= 80 ? '#faad14' : '#ff4d4f';
  
  const growthIcon = isPositiveGrowth ? <ArrowUpOutlined /> : <ArrowDownOutlined />;
  const growthColor = isPositiveGrowth ? '#52c41a' : '#ff4d4f';
  
  // Format currency for Pakistani context
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };
  
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header Stats */}
      <div style={{ marginBottom: '16px' }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Space align="center">
            <DollarOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
              Revenue Performance
            </Title>
          </Space>
          
          <Space size="large" wrap>
            <Statistic
              title="Current Month"
              value={data.currentMonthRevenue}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ fontSize: '20px', fontWeight: 'bold' }}
            />
            
            <Statistic
              title="Growth"
              value={data.growthPercentage.toFixed(2)}
              suffix="%"
              prefix={growthIcon}
              valueStyle={{ 
                fontSize: '16px', 
                color: growthColor,
                fontWeight: 'bold'
              }}
            />
          </Space>
        </Space>
      </div>
      
      {/* Target Achievement Progress */}
      <div style={{ marginBottom: '16px' }}>
        <Text strong style={{ marginBottom: '8px', display: 'block' }}>
          Target Achievement
        </Text>
        <Progress
          percent={Math.min(data.achievementPercentage, 100)}
          strokeColor={achievementColor}
          trailColor="#f0f0f0"
          showInfo={false}
          strokeWidth={12}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '4px' }}>
          <Text type="secondary">
            {formatCurrency(data.currentMonthRevenue)} / {formatCurrency(data.targetRevenue)}
          </Text>
          <Text strong style={{ color: achievementColor }}>
            {formatPercentage(data.achievementPercentage)}
          </Text>
        </div>
      </div>
      
      {/* Key Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flex: 1 }}>
        <Card size="small" style={{ textAlign: 'center' }}>
          <Statistic
            title="Target"
            value={data.targetRevenue}
            formatter={(value) => formatCurrency(Number(value))}
            valueStyle={{ fontSize: '14px' }}
          />
        </Card>
        
        <Card size="small" style={{ textAlign: 'center' }}>
          <Statistic
            title="Last Month"
            value={data.lastMonthRevenue}
            formatter={(value) => formatCurrency(Number(value))}
            valueStyle={{ fontSize: '14px' }}
          />
        </Card>
      </div>
      
      {/* Achievement Badge */}
      {data.achievementPercentage >= 100 && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: '12px',
          padding: '8px',
          backgroundColor: '#f6ffed',
          borderRadius: '6px',
          border: '1px solid #b7eb8f'
        }}>
          <Space>
            <TrophyOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
            <Text strong style={{ color: '#52c41a' }}>
              Target Achieved!
            </Text>
          </Space>
        </div>
      )}
      
      {/* Status Indicator */}
      <div style={{ 
        marginTop: '8px',
        fontSize: '12px',
        color: '#8c8c8c',
        textAlign: 'center'
      }}>
        Last updated: {response?.lastUpdated ? new Date(response.lastUpdated).toLocaleTimeString() : 'Unknown'}
      </div>
    </div>
  );
});

RevenuePerformanceWidget.displayName = 'RevenuePerformanceWidget';

export default RevenuePerformanceWidget;
