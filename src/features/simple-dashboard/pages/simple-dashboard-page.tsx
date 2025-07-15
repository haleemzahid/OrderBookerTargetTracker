import React, { useState } from 'react';
import { Layout, Typography, Button, DatePicker, Row, Col, Space, message } from 'antd';
import { ReloadOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import MetricsGrid from '../components/metrics-grid';
import TopPerformersSection from '../components/top-performers-section';
import NeedsAttentionSection from '../components/needs-attention-section';
import { useDashboardMetrics } from '../hooks/use-dashboard-metrics';
import type { DateRangeFilter } from '../types';

const { Content } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const SimpleDashboardPage: React.FC = () => {
  // State for date range filter
  const [dateRange, setDateRange] = useState<DateRangeFilter>(() => {
    // Default to current month
    const now = new Date();
    return {
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0)
    };
  });

  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch,
    isFetching
  } = useDashboardMetrics({ dateRange });

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange({
        startDate: dates[0].toDate(),
        endDate: dates[1].toDate()
      });
    }
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      message.success('Dashboard data refreshed successfully');
    } catch (err) {
      message.error('Failed to refresh dashboard data');
    }
  };

  const formatDateForDisplay = (date: Date) => {
    return dayjs(date).format('MMM DD, YYYY');
  };

  const defaultMetrics = {
    totalOrderBookers: 0,
    thisMonthSales: 0,
    thisMonthReturns: 0,
    targetAchievement: 0,
    totalCartons: 0,
    returnCartons: 0,
    netCartons: 0,
    netSales: 0
  };

  return (
    <Layout style={{ minHeight: 'calc(100vh - 64px)', background: '#f5f5f5' }}>
      <Content style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {/* Header Section */}
        <div style={{ 
          background: '#fff', 
          padding: '24px', 
          borderRadius: '8px', 
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Row justify="space-between" align="middle" wrap>
            <Col xs={24} sm={12} md={16}>
              <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                Dashboard
              </Title>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                {formatDateForDisplay(dateRange.startDate)} - {formatDateForDisplay(dateRange.endDate)}
                {dashboardData?.lastUpdated && (
                  <span style={{ marginLeft: 16 }}>
                    Last updated: {dayjs(dashboardData.lastUpdated).format('HH:mm:ss')}
                  </span>
                )}
              </Text>
            </Col>
            <Col xs={24} sm={12} md={8} style={{ textAlign: 'right' }}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <RangePicker
                  value={[dayjs(dateRange.startDate), dayjs(dateRange.endDate)]}
                  onChange={handleDateRangeChange}
                  format="MMM DD, YYYY"
                  style={{ width: '100%' }}
                  suffixIcon={<CalendarOutlined />}
                  allowClear={false}
                />
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  loading={isFetching}
                  style={{ width: '100%' }}
                >
                  Refresh
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{ 
            background: '#fff2f0', 
            border: '1px solid #ffccc7', 
            padding: '16px', 
            borderRadius: '8px', 
            marginBottom: '24px' 
          }}>
            <Text type="danger">
              Error loading dashboard data: {error.message}
            </Text>
            <Button 
              type="link" 
              onClick={handleRefresh}
              style={{ marginLeft: 8 }}
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Metrics Grid */}
        <div style={{ marginBottom: '24px' }}>
          <MetricsGrid 
            metrics={dashboardData?.metrics || defaultMetrics}
            loading={isLoading}
          />
        </div>

        {/* Performers Sections */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <TopPerformersSection
              performers={dashboardData?.topPerformers || []}
              loading={isLoading}
            />
          </Col>
          <Col xs={24} lg={12}>
            <NeedsAttentionSection
              performers={dashboardData?.needsAttention || []}
              loading={isLoading}
            />
          </Col>
        </Row>

        {/* Footer Info */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '32px', 
          padding: '16px',
          background: '#fff',
          borderRadius: '8px'
        }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Data automatically refreshes every 5 minutes. Manual refresh available above.
            <br />
            For advanced analytics and detailed reports, visit the{' '}
            <a href="/bi-dashboard" style={{ color: '#1890ff' }}>
              BI Dashboard
            </a>
          </Text>
        </div>
      </Content>
    </Layout>
  );
};

export default SimpleDashboardPage;
