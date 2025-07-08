import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  Space,
  Typography,
  Button,
  Tabs,
  Alert,
  Spin,
} from 'antd';
import {
  TrophyOutlined,
  DollarOutlined,
  RiseOutlined,
  ExportOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useReportFilters, usePerformanceAnalysis, useDailyTrends, useMonthlyComparison, useReportExport } from '../hooks';
import { DatePicker } from '../../../components/date';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('performance');
  const { filters, updateFilters, resetFilters } = useReportFilters();
  const { exportReport, refreshReports, isExporting, isRefreshing } = useReportExport();

  const { performanceData, analysis, isLoading: performanceLoading } = usePerformanceAnalysis(filters);
  const { trends, isLoading: dailyLoading } = useDailyTrends(filters);
  const { comparison, isLoading: monthlyLoading } = useMonthlyComparison(filters);

  const handleDateRangeChange = (dates: any, dateStrings: string[]) => {
    if (dates) {
      updateFilters({
        dateRange: [new Date(dateStrings[0]), new Date(dateStrings[1])],
      });
    } else {
      updateFilters({ dateRange: undefined });
    }
  };

  const handleExport = () => {
    const data = performanceData || [];
    exportReport(data, { format: 'xlsx', includeCharts: true });
  };

  const handleRefresh = () => {
    refreshReports();
  };

  const renderOverviewCards = () => {
    if (!analysis) return null;

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Sales"
              value={analysis.totalSales}
              precision={0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Net Sales"
              value={analysis.totalNetSales}
              precision={0}
              valueStyle={{ color: '#cf1322' }}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Return Rate"
              value={analysis.returnRate}
              precision={1}
              valueStyle={{ color: '#faad14' }}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Top Performer"
              value={analysis.topPerformer?.orderBooker.name || 'N/A'}
              valueStyle={{ color: '#722ed1' }}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  const renderPerformanceTab = () => {
    if (performanceLoading) {
      return <Spin size="large" />;
    }

    return (
      <div>
        {renderOverviewCards()}
        <Card title="Performance Analysis" style={{ marginTop: 16 }}>
          {analysis ? (
            <div>
              <p>Total Order Bookers: {analysis.performerCount}</p>
              <p>Average Sales: {analysis.avgSales.toFixed(0)}</p>
              <p>Average Net Sales: {analysis.avgNetSales.toFixed(0)}</p>
              <p>Return Rate: {analysis.returnRate.toFixed(1)}%</p>
              <p>Net Carton Rate: {analysis.netCartonRate.toFixed(1)}%</p>
            </div>
          ) : (
            <Alert message="No performance data available" type="info" />
          )}
        </Card>
      </div>
    );
  };

  const renderDailyTrendsTab = () => {
    if (dailyLoading) {
      return <Spin size="large" />;
    }

    return (
      <div>
        <Card title="Daily Trends" style={{ marginTop: 16 }}>
          {trends ? (
            <div>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title="Average Daily Sales"
                    value={trends.avgDailySales}
                    precision={0}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title="Growth Rate"
                    value={trends.growthRate}
                    precision={1}
                    suffix="%"
                    valueStyle={{ color: trends.growthRate >= 0 ? '#3f8600' : '#cf1322' }}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title="Best Day Sales"
                    value={trends.bestDay?.totalSales || 0}
                    precision={0}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title="Total Days"
                    value={trends.totalDays}
                  />
                </Col>
              </Row>
            </div>
          ) : (
            <Alert message="No daily trend data available" type="info" />
          )}
        </Card>
      </div>
    );
  };

  const renderMonthlyComparisonTab = () => {
    if (monthlyLoading) {
      return <Spin size="large" />;
    }

    return (
      <div>
        <Card title="Monthly Comparison" style={{ marginTop: 16 }}>
          {comparison ? (
            <div>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Card title="Current Month" size="small">
                    <p>Sales: {comparison.currentMonth.totalSales}</p>
                    <p>Returns: {comparison.currentMonth.totalReturns}</p>
                    <p>Net Sales: {comparison.currentMonth.netSales}</p>
                    <p>Target Achievement: {comparison.currentMonth.targetAchievementPercentage.toFixed(1)}%</p>
                  </Card>
                </Col>
                <Col xs={24} sm={12}>
                  <Card title="Previous Month" size="small">
                    <p>Sales: {comparison.previousMonth.totalSales}</p>
                    <p>Returns: {comparison.previousMonth.totalReturns}</p>
                    <p>Net Sales: {comparison.previousMonth.netSales}</p>
                    <p>Target Achievement: {comparison.previousMonth.targetAchievementPercentage.toFixed(1)}%</p>
                  </Card>
                </Col>
              </Row>
              <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title="Sales Growth"
                    value={comparison.growth.sales}
                    precision={1}
                    suffix="%"
                    valueStyle={{ color: comparison.growth.sales >= 0 ? '#3f8600' : '#cf1322' }}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title="Returns Growth"
                    value={comparison.growth.returns}
                    precision={1}
                    suffix="%"
                    valueStyle={{ color: comparison.growth.returns <= 0 ? '#3f8600' : '#cf1322' }}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title="Carton Growth"
                    value={comparison.growth.cartons}
                    precision={1}
                    suffix="%"
                    valueStyle={{ color: comparison.growth.cartons >= 0 ? '#3f8600' : '#cf1322' }}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title="Target Achievement Change"
                    value={comparison.growth.targetAchievement}
                    precision={1}
                    suffix="%"
                    valueStyle={{ color: comparison.growth.targetAchievement >= 0 ? '#3f8600' : '#cf1322' }}
                  />
                </Col>
              </Row>
            </div>
          ) : (
            <Alert message="No monthly comparison data available" type="info" />
          )}
        </Card>
      </div>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Reports & Analytics</Title>
        <Space wrap>
          <RangePicker
            value={filters.dateRange ? [new Date(filters.dateRange[0]), new Date(filters.dateRange[1])] : null}
            onChange={handleDateRangeChange}
            placeholder={['Start Date', 'End Date']}
          />
          <Select
            placeholder="Report Type"
            style={{ width: 200 }}
            value={filters.reportType}
            onChange={(value) => updateFilters({ reportType: value })}
            allowClear
          >
            <Select.Option value="performance">Performance</Select.Option>
            <Select.Option value="target-achievement">Target Achievement</Select.Option>
            <Select.Option value="daily-summary">Daily Summary</Select.Option>
            <Select.Option value="monthly-overview">Monthly Overview</Select.Option>
          </Select>
          <Button onClick={resetFilters}>Reset Filters</Button>
          <Button 
            type="primary" 
            icon={<ExportOutlined />} 
            onClick={handleExport}
            loading={isExporting}
          >
            Export
          </Button>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={handleRefresh}
            loading={isRefreshing}
          >
            Refresh
          </Button>
        </Space>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Performance" key="performance">
          {renderPerformanceTab()}
        </TabPane>
        <TabPane tab="Daily Trends" key="daily">
          {renderDailyTrendsTab()}
        </TabPane>
        <TabPane tab="Monthly Comparison" key="monthly">
          {renderMonthlyComparisonTab()}
        </TabPane>
      </Tabs>
    </div>
  );
};
