import React from 'react';
import { Card, Spin, Alert, Typography, Select, Space, Button } from 'antd';
import { Scatter } from '@ant-design/charts';
import { useQuery } from '@tanstack/react-query';
import { widgetDataService } from '../../api/widget-data-service';
import { useDashboardFilters } from '../../stores/dashboard-store';
import type { ProductPerformanceData } from '../../types';

const { Title, Text } = Typography;

interface ProductPerformanceWidgetProps {
  refreshInterval?: number;
}

export const ProductPerformanceWidget: React.FC<ProductPerformanceWidgetProps> = ({
  refreshInterval = 60 * 60 * 1000 // 60 minutes default
}) => {
  const filters = useDashboardFilters();
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['dashboard', 'product-performance', filters],
    queryFn: () => widgetDataService.getProductPerformance(filters),
    refetchInterval: refreshInterval,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
  });

  if (isLoading) {
    return (
      <Card 
        title="Product Performance Matrix" 
        style={{ height: '100%' }}
        styles={{ body: { display: 'flex', justifyContent: 'center', alignItems: 'center' } }}
      >
        <Spin size="large" />
      </Card>
    );
  }

  if (error ) {
    return (
      <Card title="Product Performance Matrix" style={{ height: '100%' }}>
        <Alert
          message="Failed to load product performance data"
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

  const products = data!.data;
  
  // Configure scatter plot
  const scatterConfig = {
    data: products.map(product => ({
      ...product,
      // Add formatted labels for tooltips
      volumeLabel: `${product.salesVolume} cartons`,
      profitLabel: `${product.profitMargin}%`,
      revenueLabel: `Rs. ${product.totalRevenue.toLocaleString()}`
    })),
    xField: 'salesVolume',
    yField: 'profitMargin',
    sizeField: 'totalRevenue',
    colorField: 'category',
    size: [4, 20],
    shape: 'circle',
    pointStyle: {
      fillOpacity: 0.7,
      stroke: '#fff',
      lineWidth: 1,
    },
    xAxis: {
      title: {
        text: 'Sales Volume (Cartons)',
        style: {
          fontSize: 12,
          fontWeight: 'bold',
        },
      },
      grid: {
        line: {
          style: {
            stroke: '#d9d9d9',
            lineWidth: 1,
            lineDash: [3, 3],
          },
        },
      },
    },
    yAxis: {
      title: {
        text: 'Profit Margin (%)',
        style: {
          fontSize: 12,
          fontWeight: 'bold',
        },
      },
      grid: {
        line: {
          style: {
            stroke: '#d9d9d9',
            lineWidth: 1,
            lineDash: [3, 3],
          },
        },
      },
    },
    tooltip: {
      showTitle: false,
      formatter: (datum: any) => ({
        name: datum.productName,
        value: `Volume: ${datum.volumeLabel}\nProfit: ${datum.profitLabel}\nRevenue: ${datum.revenueLabel}\nCategory: ${datum.category}`,
      }),
    },
    legend: {
      position: 'bottom' as const,
      title: {
        text: 'Product Category',
        style: {
          fontSize: 12,
          fontWeight: 'bold',
        },
      },
    },
    height: 300,
    theme: 'light',
  };

  // Calculate summary statistics
  const totalProducts = products.length;
  const avgProfitMargin = totalProducts > 0 
    ? (products.reduce((sum, p) => sum + p.profitMargin, 0) / totalProducts).toFixed(1)
    : '0';
  const highProfitProducts = products.filter(p => p.profitMargin > 25).length;
  const highVolumeProducts = products.filter(p => p.salesVolume > 100).length;

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Title level={4} style={{ margin: 0 }}>Product Performance Matrix</Title>
        </div>
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
        {/* Summary Statistics */}
        <Space wrap style={{ width: '100%', justifyContent: 'space-around' }}>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>Total Products</Text>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
              {totalProducts}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>Avg Profit Margin</Text>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
              {avgProfitMargin}%
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>High Profit (&gt;25%)</Text>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#faad14' }}>
              {highProfitProducts}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>High Volume (&gt;100)</Text>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#722ed1' }}>
              {highVolumeProducts}
            </div>
          </div>
        </Space>

        {/* Scatter Plot */}
        <div style={{ height: '300px', width: '100%' }}>
          {products.length > 0 ? (
            <Scatter {...scatterConfig} />
          ) : (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              color: '#8c8c8c' 
            }}>
              No products found for selected category
            </div>
          )}
        </div>

        {/* Analysis Guide */}
        <div style={{ fontSize: '11px', color: '#8c8c8c', lineHeight: '1.4' }}>
          <strong>Analysis Guide:</strong><br />
          • <strong>Stars</strong> (High Volume + High Margin): Top-right quadrant - Focus and expand<br />
          • <strong>Cash Cows</strong> (High Volume + Low Margin): Bottom-right - Optimize pricing<br />
          • <strong>Question Marks</strong> (Low Volume + High Margin): Top-left - Investigate potential<br />
          • <strong>Dogs</strong> (Low Volume + Low Margin): Bottom-left - Consider discontinuing
        </div>
      </Space>
    </Card>
  );
};
