import React from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  Space, 
  Spin, 
  Alert, 
  Button, 
  List, 
  Tag, 
  Progress 
} from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined, 
  ReloadOutlined, 
  CloseOutlined 
} from '@ant-design/icons';
import { useDashboardCards, useDashboardFilters, useQuickActions, useDashboardActions } from '../hooks';
import { useDashboardData } from '../api/queries';

const { Title, Text } = Typography;

export const DashboardPage: React.FC = () => {
  const { filters } = useDashboardFilters();
  const { cards, isLoading: cardsLoading } = useDashboardCards(filters);
  const { data: dashboardData, isLoading: dataLoading } = useDashboardData(filters);
  const quickActions = useQuickActions();
  const { refreshDashboard, dismissAlert, isRefreshing } = useDashboardActions();

  const isLoading = cardsLoading || dataLoading;

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p style={{ marginTop: '16px' }}>Loading dashboard data...</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <Alert
        message="Error loading dashboard data"
        description="Unable to load dashboard statistics. Please try again."
        type="error"
        showIcon
      />
    );
  }

  const renderStatisticCard = (card: any) => {
    const formatValue = (value: number, formatter?: string) => {
      switch (formatter) {
        case 'currency':
          return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        case 'percentage':
          return `${value.toFixed(1)}%`;
        default:
          return value.toLocaleString();
      }
    };

    return (
      <Col xs={24} sm={12} md={card.span || 6} key={card.id}>
        <Card>
          <Statistic
            title={card.title}
            value={formatValue(card.value, card.formatter)}
            prefix={card.prefix}
            suffix={card.suffix}
            valueStyle={{ color: card.color }}
          />
          {card.trend && (
            <div style={{ marginTop: '8px' }}>
              <Text type={card.trend.isPositive ? 'success' : 'danger'}>
                {card.trend.direction === 'up' ? (
                  <ArrowUpOutlined />
                ) : (
                  <ArrowDownOutlined />
                )}
                {' '}
                {Math.abs(card.trend.value).toFixed(1)}%
              </Text>
            </div>
          )}
          {card.description && (
            <div style={{ marginTop: '4px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {card.description}
              </Text>
            </div>
          )}
        </Card>
      </Col>
    );
  };

  const renderTopPerformers = () => {
    if (!dashboardData.topPerformers || dashboardData.topPerformers.length === 0) {
      return <Alert message="No performance data available" type="info" />;
    }

    return (
      <List
        itemLayout="horizontal"
        dataSource={dashboardData.topPerformers}
        renderItem={(performer, index) => (
          <List.Item
            actions={[
              <Tag color={index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze'}>
                #{index + 1}
              </Tag>,
            ]}
          >
            <List.Item.Meta
              title={performer.name}
              description={
                <Space>
                  <Text>Sales: {performer.sales.toLocaleString()}</Text>
                  <Text>Returns: {performer.returns.toLocaleString()}</Text>
                  <Text>Net: {performer.netSales.toLocaleString()}</Text>
                </Space>
              }
            />
            <Progress
              percent={performer.achievementPercentage}
              size="small"
              style={{ width: '100px' }}
            />
          </List.Item>
        )}
      />
    );
  };

  const renderRecentActivities = () => {
    if (!dashboardData.recentActivities || dashboardData.recentActivities.length === 0) {
      return <Alert message="No recent activities" type="info" />;
    }

    return (
      <List
        itemLayout="horizontal"
        dataSource={dashboardData.recentActivities}
        renderItem={(activity) => (
          <List.Item>
            <List.Item.Meta
              title={activity.description}
              description={
                <Space>
                  <Text type="secondary">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </Text>
                  {activity.orderBookerName && (
                    <Tag>{activity.orderBookerName}</Tag>
                  )}
                  {activity.amount && (
                    <Text strong>{activity.amount.toLocaleString()}</Text>
                  )}
                </Space>
              }
            />
          </List.Item>
        )}
      />
    );
  };

  const renderQuickActions = () => {
    return (
      <Row gutter={[8, 8]}>
        {quickActions.map((action) => (
          <Col xs={24} sm={12} md={8} key={action.id}>
            <Card
              size="small"
              hoverable
              style={{ textAlign: 'center' }}
              onClick={() => {
                if (action.href) {
                  window.location.href = action.href;
                } else if (action.onClick) {
                  action.onClick();
                }
              }}
            >
              <Space direction="vertical" size="small">
                <div style={{ fontSize: '24px', color: action.color }}>
                  {action.icon}
                </div>
                <Text strong>{action.title}</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {action.description}
                </Text>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  const renderAlerts = () => {
    if (!dashboardData.alerts || dashboardData.alerts.length === 0) {
      return null;
    }

    const activeAlerts = dashboardData.alerts.filter(alert => !alert.dismissed);
    if (activeAlerts.length === 0) {
      return null;
    }

    return (
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {activeAlerts.map((alert) => (
          <Col xs={24} key={alert.id}>
            <Alert
              message={alert.title}
              description={alert.message}
              type={alert.type}
              showIcon
              closable
              onClose={() => dismissAlert(alert.id)}
              action={
                <Button
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => dismissAlert(alert.id)}
                />
              }
            />
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2}>Dashboard</Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={refreshDashboard}
              loading={isRefreshing}
            >
              Refresh
            </Button>
          </Col>
        </Row>
      </div>

      {renderAlerts()}

      <Row gutter={[16, 16]}>
        {cards.map(renderStatisticCard)}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={8}>
          <Card title="Quick Actions" size="small">
            {renderQuickActions()}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Top Performers" size="small">
            {renderTopPerformers()}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Recent Activities" size="small">
            {renderRecentActivities()}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="Monthly Target Progress" size="small">
            <div style={{ textAlign: 'center' }}>
              <Progress
                type="circle"
                percent={dashboardData.monthlyTargets.achievementPercentage}
                format={(percent) => `${percent}%`}
                width={120}
              />
              <div style={{ marginTop: '16px' }}>
                <Row gutter={[8, 8]}>
                  <Col span={8}>
                    <Statistic
                      title="On Track"
                      value={dashboardData.monthlyTargets.onTrackCount}
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Behind"
                      value={dashboardData.monthlyTargets.behindCount}
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Exceeded"
                      value={dashboardData.monthlyTargets.exceededCount}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                </Row>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Sales Overview" size="small">
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <Statistic
                  title="Current Month"
                  value={dashboardData.currentMonthSales}
                  formatter={(value) => value?.toLocaleString()}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Previous Month"
                  value={dashboardData.previousMonthSales}
                  formatter={(value) => value?.toLocaleString()}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Growth Rate"
                  value={dashboardData.salesGrowth}
                  precision={1}
                  suffix="%"
                  valueStyle={{ 
                    color: dashboardData.salesGrowth >= 0 ? '#3f8600' : '#cf1322' 
                  }}
                  prefix={
                    dashboardData.salesGrowth >= 0 ? (
                      <ArrowUpOutlined />
                    ) : (
                      <ArrowDownOutlined />
                    )
                  }
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Return Rate"
                  value={((dashboardData.totalReturns / dashboardData.totalSales) * 100)}
                  precision={1}
                  suffix="%"
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
