import React from 'react';
import { Card, Row, Col, Statistic, Typography, Space, Spin, Alert } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, TeamOutlined, DollarOutlined, InboxOutlined } from '@ant-design/icons';
import { useI18n } from '../hooks/useI18n';
import { useDashboard } from '../hooks/useDashboard';

const { Title } = Typography;

const Dashboard: React.FC = () => {
  const { dashboard } = useI18n();
  const { data: dashboardData, isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p style={{ marginTop: '16px' }}>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error loading dashboard data"
        description="Unable to load dashboard statistics. Please try again."
        type="error"
        showIcon
      />
    );
  }

  return (
    <div>
      <Title level={2}>
        {dashboard('title')}
      </Title>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title={dashboard('totalOrderBookers')}
              value={dashboardData.totalOrderBookers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title={dashboard('thisMonthSales')}
              value={dashboardData.thisMonthSales}
              prefix={<DollarOutlined />}
              suffix={<ArrowUpOutlined style={{ color: '#3f8600' }} />}
              valueStyle={{ color: '#3f8600' }}
              precision={0}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title={dashboard('thisMonthReturns')}
              value={dashboardData.thisMonthReturns}
              prefix={<DollarOutlined />}
              suffix={<ArrowDownOutlined style={{ color: '#cf1322' }} />}
              valueStyle={{ color: '#cf1322' }}
              precision={0}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title={dashboard('targetAchievement')}
              value={dashboardData.targetAchievement}
              suffix="%"
              valueStyle={{ color: dashboardData.targetAchievement >= 80 ? '#3f8600' : '#cf1322' }}
              precision={1}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Total Cartons"
              value={dashboardData.thisMonthCarton}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Return Cartons"
              value={dashboardData.thisMonthReturnCarton}
              prefix={<InboxOutlined />}
              suffix={<ArrowDownOutlined style={{ color: '#cf1322' }} />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Net Cartons"
              value={dashboardData.thisMonthNetCarton}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Net Sales"
              value={dashboardData.thisMonthNetSales}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
              precision={0}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title={dashboard('topPerformers')}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {dashboardData.topPerformers.length > 0 ? (
                dashboardData.topPerformers.map((performer) => (
                  <div key={performer.orderBookerId} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{performer.name}</span>
                    <span style={{ color: '#3f8600' }}>{performer.achievementPercentage.toFixed(1)}%</span>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#8c8c8c' }}>
                  No top performers data available
                </div>
              )}
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title={dashboard('needsAttention')}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {dashboardData.needsAttention.length > 0 ? (
                dashboardData.needsAttention.map((performer) => (
                  <div key={performer.orderBookerId} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{performer.name}</span>
                    <span style={{ color: '#cf1322' }}>{performer.achievementPercentage.toFixed(1)}%</span>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#8c8c8c' }}>
                  No underperformers data available
                </div>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
