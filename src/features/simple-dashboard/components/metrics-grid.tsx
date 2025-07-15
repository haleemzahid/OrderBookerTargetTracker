import React from 'react';
import { Row, Col } from 'antd';
import { 
  TeamOutlined, 
  DollarOutlined, 
  UndoOutlined, 
  AimOutlined, 
  InboxOutlined,
  RetweetOutlined,
  CalculatorOutlined,
  WalletOutlined
} from '@ant-design/icons';
import MetricCard from './metric-card';
import type { DashboardMetrics } from '../types';

export interface MetricsGridProps {
  metrics: DashboardMetrics;
  loading?: boolean;
}

const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics, loading = false }) => {
  const getTargetAchievementColor = (achievement: number) => {
    if (achievement >= 80) return 'success';
    if (achievement >= 50) return 'warning';
    return 'error';
  };

  const getSalesColor = (sales: number, returns: number) => {
    const netSales = sales - returns;
    if (netSales > sales * 0.8) return 'success'; // If net sales > 80% of gross
    if (netSales > sales * 0.6) return 'warning';
    return 'default';
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Top Row - 4 Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Total Order Bookers"
            value={metrics.totalOrderBookers}
            icon={<TeamOutlined />}
            color="default"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="This Month Sales"
            value={metrics.thisMonthSales}
            icon={<DollarOutlined />}
            color={getSalesColor(metrics.thisMonthSales, metrics.thisMonthReturns)}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="This Month Returns"
            value={metrics.thisMonthReturns}
            icon={<UndoOutlined />}
            color={metrics.thisMonthReturns > metrics.thisMonthSales * 0.1 ? 'warning' : 'default'}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Target Achievement"
            value={metrics.targetAchievement}
            icon={<AimOutlined />}
            color={getTargetAchievementColor(metrics.targetAchievement)}
            loading={loading}
          />
        </Col>
      </Row>

      {/* Bottom Row - 4 Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Total Cartons"
            value={metrics.totalCartons}
            icon={<InboxOutlined />}
            color="default"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Return Cartons"
            value={metrics.returnCartons}
            icon={<RetweetOutlined />}
            color={metrics.returnCartons > metrics.totalCartons * 0.1 ? 'warning' : 'default'}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Net Cartons"
            value={metrics.netCartons}
            icon={<CalculatorOutlined />}
            color={metrics.netCartons > metrics.totalCartons * 0.8 ? 'success' : 'default'}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Net Sales"
            value={metrics.netSales}
            icon={<WalletOutlined />}
            color={getSalesColor(metrics.thisMonthSales, metrics.thisMonthReturns)}
            loading={loading}
          />
        </Col>
      </Row>
    </div>
  );
};

export default MetricsGrid;
