import React from 'react';
import { Typography, Space, Spin, Alert, Select, Card } from 'antd';
import { LineChartOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import { Line } from '@ant-design/charts';
import { useQuery } from '@tanstack/react-query';
import { WidgetDataService } from '../../api/widget-data-service';
import { useDashboardFilters } from '../../stores/dashboard-store';
import type { SalesTrendData } from '../../types';

const { Text, Title } = Typography;
const { Option } = Select;

interface SalesTrendWidgetProps {
  refreshInterval?: number;
  showMovingAverage?: boolean;
}

export const SalesTrendWidget: React.FC<SalesTrendWidgetProps> = React.memo(({
  refreshInterval = 1800000, // 30 minutes default
  showMovingAverage = true
}) => {
  const filters = useDashboardFilters();
  const [selectedMetric, setSelectedMetric] = React.useState<'sales' | 'orders'>('sales');
  
  const { data: response, isLoading, error, isError } = useQuery({
    queryKey: ['sales-trends', filters],
    queryFn: () => WidgetDataService.getSalesTrends(filters),
    refetchInterval: refreshInterval,
    staleTime: refreshInterval / 2,
    gcTime: refreshInterval * 2
  });

  const trendData: SalesTrendData = response?.data || {
    dailySales: [],
    movingAverages: { sevenDay: 0, thirtyDay: 0 }
  };

  // Format currency for Pakistani context
  const formatCurrency = React.useCallback((amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: amount > 1000000 ? 'compact' : 'standard'
    }).format(amount);
  }, []);

  // Prepare chart data
  const chartData = React.useMemo(() => {
    if (!trendData.dailySales.length) return [];
    
    const data = trendData.dailySales.map(item => ({
      date: item.date,
      value: selectedMetric === 'sales' ? (item.sales ?? 0) : (item.orders ?? 0),
      type: selectedMetric === 'sales' ? 'Sales' : 'Orders'
    }));
    
    // Add moving averages if enabled
    if (showMovingAverage && selectedMetric === 'sales') {
      // Add 7-day moving average
      data.forEach((item, index) => {
        if (index >= 6) {
          const window = data.slice(index - 6, index + 1);
          const avg = window.reduce((sum, d) => sum + (d.value ?? 0), 0) / 7;
          data.push({
            date: item.date,
            value: avg,
            type: '7-Day Average'
          });
        }
      });
    }
    
    // Debug: Log the final chart data
    console.log('Chart data prepared:', data);
    console.log('Selected metric:', selectedMetric);
    console.log('Trend data daily sales:', trendData.dailySales);
    
    return data;
  }, [trendData.dailySales, selectedMetric, showMovingAverage]);

  // Calculate trend direction and percentage
  const getTrendAnalysis = React.useCallback(() => {
    if (trendData.dailySales.length < 2) return { direction: 'stable', percentage: 0 };
    
    const recent = trendData.dailySales.slice(-7);
    const previous = trendData.dailySales.slice(-14, -7);
    
    if (recent.length === 0 || previous.length === 0) return { direction: 'stable', percentage: 0 };
    
    const recentAvg = recent.reduce((sum, item) => sum + item.sales, 0) / recent.length;
    const previousAvg = previous.reduce((sum, item) => sum + item.sales, 0) / previous.length;
    
    const percentage = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;
    const direction = percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'stable';
    
    return { direction, percentage: Math.abs(percentage) };
  }, [trendData.dailySales]);

  const trendAnalysis = React.useMemo(() => getTrendAnalysis(), [getTrendAnalysis]);

  const getTrendIcon = React.useCallback((direction: string) => {
    switch (direction) {
      case 'up': return <RiseOutlined style={{ color: '#52c41a' }} />;
      case 'down': return <FallOutlined style={{ color: '#ff4d4f' }} />;
      default: return <LineChartOutlined style={{ color: '#1890ff' }} />;
    }
  }, []);

  const getTrendColor = React.useCallback((direction: string) => {
    switch (direction) {
      case 'up': return '#52c41a';
      case 'down': return '#ff4d4f';
      default: return '#1890ff';
    }
  }, []);

  // Chart configuration
  const chartConfig = React.useMemo(() => ({
    data: chartData,
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    color: ['#1890ff', '#52c41a', '#faad14'],
    xAxis: {
      type: 'timeCat',
      tickCount: 7,
      label: {
        formatter: (text: string) => {
          const date = new Date(text);
          return date.toLocaleDateString('en-GB', { 
            month: 'short', 
            day: 'numeric' 
          });
        },
      },
    },
    yAxis: {
      label: {
        formatter: (text: string) => {
          const value = parseFloat(text);
          return selectedMetric === 'sales' 
            ? formatCurrency(value).replace('PKR', 'Rs')
            : value.toString();
        },
      },
    },
    tooltip: {
      shared: true,
      showMarkers: true,
      customContent: (title: any, items: any[]) => {
        if (!items || items.length === 0) return null;
        console.log(items);
        // Debug log to see what we're getting
        console.log('Tooltip customContent - title:', title, 'items:', items);
        
        return `
          <div style="padding: 8px; background: white; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="font-weight: 500; margin-bottom: 4px;">${title}</div>
            ${items.map(item => {
              const value = item.value ?? item.data?.value ?? 0;
              const name = item.name ?? item.data?.type ?? 'Data';
              const formattedValue = selectedMetric === 'sales' 
                ? formatCurrency(Number(value))
                : `${Math.round(Number(value))} orders`;
              
              return `
                <div style="display: flex; align-items: center; margin: 2px 0;">
                  <span style="display: inline-block; width: 8px; height: 8px; background: ${item.color}; border-radius: 50%; margin-right: 6px;"></span>
                  <span style="color: #666;">${name}:</span>
                  <span style="font-weight: 500; margin-left: 4px;">${formattedValue}</span>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }
    },
    legend: {
      position: 'bottom' as const,
    },
    height: 200,
  }), [chartData, selectedMetric, formatCurrency]);

  // Early returns after all hooks are called
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" tip="Loading sales trends..." />
      </div>
    );
  }
  
  if (isError || response?.status === 'error') {
    return (
      <Alert
        message="Error Loading Sales Trends"
        description={response?.error || error?.message || 'Failed to load sales trend data'}
        type="error"
        showIcon
      />
    );
  }
  
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Space align="center">
            <LineChartOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
            <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
              Sales Trends
            </Title>
          </Space>
          
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Daily sales performance over time
          </Text>
        </div>
        
        <Select
          value={selectedMetric}
          onChange={setSelectedMetric}
          size="small"
          style={{ width: 80 }}
        >
          <Option value="sales">Sales</Option>
          <Option value="orders">Orders</Option>
        </Select>
      </div>
      
      {/* Trend Summary */}
      <div style={{ marginBottom: '12px' }}>
        <Card size="small" style={{ backgroundColor: '#fafafa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Space align="center">
                {getTrendIcon(trendAnalysis.direction)}
                <Text strong style={{ color: getTrendColor(trendAnalysis.direction) }}>
                  {trendAnalysis.direction === 'up' ? 'Trending Up' :
                   trendAnalysis.direction === 'down' ? 'Trending Down' : 'Stable'}
                </Text>
              </Space>
              {trendAnalysis.percentage > 0 && (
                <Text style={{ fontSize: '11px', color: '#8c8c8c', marginLeft: '8px' }}>
                  {trendAnalysis.percentage.toFixed(1)}% vs last week
                </Text>
              )}
            </div>
            
            {showMovingAverage && (
              <div style={{ textAlign: 'right' }}>
                <div>
                  <Text style={{ fontSize: '11px', color: '#8c8c8c' }}>7-day avg:</Text>
                  <Text strong style={{ fontSize: '11px', marginLeft: '4px' }}>
                    {selectedMetric === 'sales' 
                      ? formatCurrency(trendData.movingAverages.sevenDay).replace('PKR', 'Rs')
                      : Math.round(trendData.movingAverages.sevenDay).toString()
                    }
                  </Text>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
      
      {/* Chart */}
      <div style={{ flex: 1, minHeight: '200px' }}>
        {chartData.length > 0 ? (
          <Line {...chartConfig} />
        ) : (
          <div style={{ 
            height: '200px',
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            color: '#8c8c8c'
          }}>
            <div style={{ textAlign: 'center' }}>
              <LineChartOutlined style={{ fontSize: '32px', marginBottom: '8px' }} />
              <div>No trend data available</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Seasonal Pattern Indicator */}
      {trendData.seasonalPattern && (
        <div style={{ 
          marginTop: '8px',
          padding: '6px 8px',
          backgroundColor: '#e6f7ff',
          borderRadius: '4px',
          border: '1px solid #91d5ff'
        }}>
          <Text style={{ fontSize: '11px', color: '#1890ff' }}>
            Pattern: {trendData.seasonalPattern === 'weekend-low' ? 'Lower weekend sales' :
                     trendData.seasonalPattern === 'midweek-peak' ? 'Midweek sales peak' :
                     trendData.seasonalPattern === 'end-month-rush' ? 'End-of-month surge' :
                     'Normal pattern'}
          </Text>
        </div>
      )}
      
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

SalesTrendWidget.displayName = 'SalesTrendWidget';

export default SalesTrendWidget;
