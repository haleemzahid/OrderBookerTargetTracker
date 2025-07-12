import React from 'react';
import { Card, Spin, Alert, Typography, Progress, List, Space, Button, Badge, Statistic } from 'antd';
import { WarningOutlined, ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { widgetDataService } from '../../api/widget-data-service';
import { useDashboardFilters } from '../../stores/dashboard-store';
import type { ReturnRateData } from '../../types';

const { Title, Text } = Typography;

interface ReturnRateMonitorWidgetProps {
  refreshInterval?: number;
}

export const ReturnRateMonitorWidget: React.FC<ReturnRateMonitorWidgetProps> = ({
  refreshInterval = 15 * 60 * 1000 // 15 minutes default
}) => {
  const filters = useDashboardFilters();

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['dashboard', 'return-rates', filters],
    queryFn: () => widgetDataService.getReturnRates(filters),
    refetchInterval: refreshInterval,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  if (isLoading) {
    return (
      <Card 
        title="Return Rate Monitor" 
        style={{ height: '100%' }}
        styles={{ body: { display: 'flex', justifyContent: 'center', alignItems: 'center' } }}
      >
        <Spin size="large" />
      </Card>
    );
  }

  if (error ) {
    return (
      <Card title="Return Rate Monitor" style={{ height: '100%' }}>
        <Alert
          message="Failed to load return rate data"
          description={error?.message || data?.error || 'Unknown error occurred'}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      </Card>
    );
  }

  const returnRateData = data!.data as ReturnRateData;
  
  // Determine status color and icon
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'normal':
        return { color: '#52c41a', icon: <CheckCircleOutlined />, text: 'Normal' };
      case 'warning':
        return { color: '#faad14', icon: <WarningOutlined />, text: 'Warning' };
      case 'critical':
        return { color: '#ff4d4f', icon: <ExclamationCircleOutlined />, text: 'Critical' };
      default:
        return { color: '#8c8c8c', icon: <CheckCircleOutlined />, text: 'Unknown' };
    }
  };

  const statusConfig = getStatusConfig(returnRateData.status);

  // Determine trend color and icon
  const getTrendConfig = (trend: string) => {
    switch (trend) {
      case 'improving':
        return { color: '#52c41a', text: '↓ Improving' };
      case 'worsening':
        return { color: '#ff4d4f', text: '↑ Worsening' };
      case 'stable':
        return { color: '#1890ff', text: '→ Stable' };
      default:
        return { color: '#8c8c8c', text: '- Unknown' };
    }
  };

  const trendConfig = getTrendConfig(returnRateData.trend);

  return (
    <Card
      title={
        <Space>
          <Title level={4} style={{ margin: 0 }}>Return Rate Monitor</Title>
          <Badge 
            color={statusConfig.color} 
            text={statusConfig.text}
          />
        </Space>
      }
      style={{ height: '100%' }}
      styles={{ 
        body: { 
          padding: '16px',
          height: 'calc(100% - 57px)',
          overflow: 'auto'
        } 
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* Overall Return Rate */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <Progress
            type="circle"
            percent={returnRateData.overallReturnRate}
            format={() => `${returnRateData.overallReturnRate.toFixed(1)}%`}
            strokeColor={statusConfig.color}
            size={120}
          />
          <div style={{ marginTop: '8px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Overall Return Rate
            </Text>
            <br />
            <Text style={{ color: trendConfig.color, fontSize: '12px', fontWeight: 'bold' }}>
              {trendConfig.text}
            </Text>
          </div>
        </div>

        {/* Threshold Information */}
        <div style={{ 
          background: returnRateData.overallReturnRate > returnRateData.threshold ? '#fff2f0' : '#f6ffed',
          border: `1px solid ${returnRateData.overallReturnRate > returnRateData.threshold ? '#ffccc7' : '#d9f7be'}`,
          borderRadius: '6px',
          padding: '8px 12px',
          textAlign: 'center'
        }}>
          <Text style={{ fontSize: '12px' }}>
            Threshold: <strong>{returnRateData.threshold}%</strong>
            {returnRateData.overallReturnRate > returnRateData.threshold && (
              <span style={{ color: '#ff4d4f', marginLeft: '8px' }}>
                {statusConfig.icon} Above threshold
              </span>
            )}
          </Text>
        </div>

        {/* Summary Statistics */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '12px',
          marginBottom: '16px'
        }}>
          <Statistic
            title="By Products"
            value={returnRateData.byProduct?.length || 0}
            valueStyle={{ fontSize: '18px' }}
            suffix="items"
          />
          <Statistic
            title="By Order Bookers"
            value={returnRateData.byOrderBooker?.length || 0}
            valueStyle={{ fontSize: '18px' }}
            suffix="bookers"
          />
        </div>

        {/* Top Return Rate by Product */}
        {returnRateData.byProduct && returnRateData.byProduct.length > 0 && (
          <div>
            <Title level={5} style={{ marginBottom: '8px', fontSize: '14px' }}>
              Top Return Rates by Product
            </Title>
            <List
              size="small"
              dataSource={returnRateData.byProduct.slice(0, 5)}
              renderItem={(item) => (
                <List.Item style={{ padding: '4px 0' }}>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text ellipsis style={{ fontSize: '12px' }}>
                        {item.productName}
                      </Text>
                    </div>
                    <div style={{ marginLeft: '8px' }}>
                      <Text 
                        strong 
                        style={{ 
                          color: item.returnRate > returnRateData.threshold ? '#ff4d4f' : '#52c41a',
                          fontSize: '12px'
                        }}
                      >
                        {item.returnRate.toFixed(1)}%
                      </Text>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </div>
        )}

        {/* Top Return Rate by Order Booker */}
        {returnRateData.byOrderBooker && returnRateData.byOrderBooker.length > 0 && (
          <div>
            <Title level={5} style={{ marginBottom: '8px', fontSize: '14px' }}>
              Return Rates by Order Booker
            </Title>
            <List
              size="small"
              dataSource={returnRateData.byOrderBooker.slice(0, 5)}
              renderItem={(item) => (
                <List.Item style={{ padding: '4px 0' }}>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text ellipsis style={{ fontSize: '12px' }}>
                        {item.orderBookerName}
                      </Text>
                    </div>
                    <div style={{ marginLeft: '8px' }}>
                      <Text 
                        strong 
                        style={{ 
                          color: item.returnRate > returnRateData.threshold ? '#ff4d4f' : '#52c41a',
                          fontSize: '12px'
                        }}
                      >
                        {item.returnRate.toFixed(1)}%
                      </Text>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </div>
        )}

        {/* Alert Information */}
        {returnRateData.overallReturnRate > returnRateData.threshold && (
          <Alert
            message="High Return Rate Alert"
            description={`Current return rate (${returnRateData.overallReturnRate.toFixed(1)}%) exceeds the threshold of ${returnRateData.threshold}%. Review products and order bookers with high return rates.`}
            type="warning"
            showIcon
            style={{ fontSize: '11px' }}
          />
        )}
      </Space>
    </Card>
  );
};
