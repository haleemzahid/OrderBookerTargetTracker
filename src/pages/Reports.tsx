import React, { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Select,
  DatePicker,
  Space,
  Typography,
  Tag,
  Progress,
  List,
  Avatar,
  Alert,
  Tabs,
  Button,
  Tooltip,
  message,
} from 'antd';
import {
  TrophyOutlined,
  WarningOutlined,
  RiseOutlined,
  DollarOutlined,
  UserOutlined,
  ExportOutlined,
  ReloadOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { useOrderBookers } from '../hooks/useOrderBookers';
import { useDailyEntriesByDateRange } from '../hooks/useDailyEntries';
import { useMonthlyTargets } from '../hooks/useMonthlyTargets';
import LoadingSpinner from '../components/common/LoadingSpinner';
import dayjs, { Dayjs } from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { OrderBooker } from '../types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface PerformanceData {
  orderBooker: OrderBooker;
  totalSales: number;
  totalReturns: number;
  netSales: number;
  totalCarton: number;
  returnCarton: number;
  netCarton: number;
  targetAmount: number;
  achievementPercent: number;
  dailyAverage: number;
  returnRate: number;
  cartonReturnRate: number;
  entriesCount: number;
  status: 'ahead' | 'on-track' | 'behind' | 'achieved';
}

interface DailyPerformance {
  date: string;
  totalSales: number;
  totalReturns: number;
  netSales: number;
  totalCarton: number;
  returnCarton: number;
  netCarton: number;
  entriesCount: number;
  targetAmount: number;
  achievementPercent: number;
}

const Reports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'quarter'>('month');
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());
  const [selectedOrderBookers, setSelectedOrderBookers] = useState<string[]>([]);

  // Calculate date ranges based on selected period
  const dateRange = useMemo(() => {
    const now = dayjs();
    switch (selectedPeriod) {
      case 'today':
        return [now.startOf('day'), now.endOf('day')];
      case 'week':
        return [now.startOf('week'), now.endOf('week')];
      case 'month':
        return [selectedMonth.startOf('month'), selectedMonth.endOf('month')];
      case 'quarter':
        return [now.startOf('month').subtract(2, 'month'), now.endOf('month')];
      default:
        return [now.startOf('month'), now.endOf('month')];
    }
  }, [selectedPeriod, selectedMonth]);

  // Fetch data
  const { data: orderBookers, isLoading: isLoadingOrderBookers } = useOrderBookers();
  const { data: dailyEntries, isLoading: isLoadingEntries } = useDailyEntriesByDateRange(
    dateRange[0].format('YYYY-MM-DD'),
    dateRange[1].format('YYYY-MM-DD')
  );
  const { data: monthlyTargets, isLoading: isLoadingTargets } = useMonthlyTargets(
    selectedMonth.year(),
    selectedMonth.month() + 1
  );

  // Calculate performance data
  const performanceData = useMemo(() => {
    if (!orderBookers || !dailyEntries || !monthlyTargets) return [];

    return orderBookers
      .filter(ob => selectedOrderBookers.length === 0 || selectedOrderBookers.includes(ob.id))
      .map(orderBooker => {
        const obEntries = dailyEntries.filter(entry => entry.orderBookerId === orderBooker.id);
        const obTarget = monthlyTargets.find(target => target.orderBookerId === orderBooker.id);
        
        const totalSales = obEntries.reduce((sum, entry) => sum + entry.sales, 0);
        const totalReturns = obEntries.reduce((sum, entry) => sum + entry.returns, 0);
        const netSales = totalSales - totalReturns;
        const totalCarton = obEntries.reduce((sum, entry) => sum + entry.totalCarton, 0);
        const returnCarton = obEntries.reduce((sum, entry) => sum + entry.returnCarton, 0);
        const netCarton = totalCarton - returnCarton;
        const targetAmount = obTarget?.targetAmount || 0;
        const achievementPercent = targetAmount > 0 ? (netSales / targetAmount) * 100 : 0;
        const dailyAverage = obEntries.length > 0 ? netSales / obEntries.length : 0;
        const returnRate = totalSales > 0 ? (totalReturns / totalSales) * 100 : 0;
        const cartonReturnRate = totalCarton > 0 ? (returnCarton / totalCarton) * 100 : 0;
        
        let status: PerformanceData['status'] = 'behind';
        if (achievementPercent >= 100) status = 'achieved';
        else if (achievementPercent >= 90) status = 'on-track';
        else if (achievementPercent >= 75) status = 'ahead';

        return {
          orderBooker,
          totalSales,
          totalReturns,
          netSales,
          totalCarton,
          returnCarton,
          netCarton,
          targetAmount,
          achievementPercent,
          dailyAverage,
          returnRate,
          cartonReturnRate,
          entriesCount: obEntries.length,
          status,
        };
      });
  }, [orderBookers, dailyEntries, monthlyTargets, selectedOrderBookers]);

  // Calculate daily performance trends
  const dailyPerformance = useMemo(() => {
    if (!dailyEntries || !monthlyTargets) return [];

    const dailyMap = new Map<string, DailyPerformance>();
    const totalTarget = monthlyTargets.reduce((sum, target) => sum + target.targetAmount, 0);
    const daysInPeriod = dateRange[1].diff(dateRange[0], 'day') + 1;
    const dailyTargetAmount = totalTarget / daysInPeriod;

    dailyEntries.forEach(entry => {
      const date = typeof entry.date === 'string' ? entry.date : entry.date.toISOString().split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          totalSales: 0,
          totalReturns: 0,
          netSales: 0,
          totalCarton: 0,
          returnCarton: 0,
          netCarton: 0,
          entriesCount: 0,
          targetAmount: dailyTargetAmount,
          achievementPercent: 0,
        });
      }
      
      const dayData = dailyMap.get(date)!;
      dayData.totalSales += entry.sales;
      dayData.totalReturns += entry.returns;
      dayData.netSales += (entry.sales - entry.returns);
      dayData.totalCarton += entry.totalCarton;
      dayData.returnCarton += entry.returnCarton;
      dayData.netCarton += (entry.totalCarton - entry.returnCarton);
      dayData.entriesCount += 1;
      dayData.achievementPercent = dayData.targetAmount > 0 ? (dayData.netSales / dayData.targetAmount) * 100 : 0;
    });

    return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [dailyEntries, monthlyTargets, dateRange]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalSales = performanceData.reduce((sum, data) => sum + data.totalSales, 0);
    const totalReturns = performanceData.reduce((sum, data) => sum + data.totalReturns, 0);
    const totalCarton = performanceData.reduce((sum, data) => sum + data.totalCarton, 0);
    const totalReturnCarton = performanceData.reduce((sum, data) => sum + data.returnCarton, 0);
    const totalTargets = performanceData.reduce((sum, data) => sum + data.targetAmount, 0);
    const averageAchievement = performanceData.length > 0 
      ? performanceData.reduce((sum, data) => sum + data.achievementPercent, 0) / performanceData.length
      : 0;
    const activeOrderBookers = performanceData.filter(data => data.entriesCount > 0).length;
    const onTrackCount = performanceData.filter(data => data.status === 'on-track' || data.status === 'achieved').length;

    return {
      totalSales,
      totalReturns,
      netSales: totalSales - totalReturns,
      totalCarton,
      totalReturnCarton,
      netCarton: totalCarton - totalReturnCarton,
      totalTargets,
      averageAchievement,
      activeOrderBookers,
      onTrackCount,
      totalOrderBookers: performanceData.length,
    };
  }, [performanceData]);

  // Top performers
  const topPerformers = useMemo(() => {
    return [...performanceData]
      .sort((a, b) => b.netSales - a.netSales)
      .slice(0, 5);
  }, [performanceData]);

  // Underperformers (need attention)
  const underPerformers = useMemo(() => {
    return [...performanceData]
      .filter(data => data.status === 'behind' && data.targetAmount > 0)
      .sort((a, b) => a.achievementPercent - b.achievementPercent)
      .slice(0, 5);
  }, [performanceData]);

  // Performance table columns
  const performanceColumns: ColumnsType<PerformanceData> = [
    {
      title: 'Order Booker',
      dataIndex: ['orderBooker', 'name'],
      key: 'name',
      render: (name: string, record) => (
        <div>
          <div style={{ fontWeight: 'medium' }}>{name}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.orderBooker.name}
          </Text>
        </div>
      ),
      width: 150,
    },
    {
      title: 'Net Sales',
      dataIndex: 'netSales',
      key: 'netSales',
      render: (value: number) => `Rs.${value.toLocaleString()}`,
      sorter: (a, b) => a.netSales - b.netSales,
      width: 120,
    },
    {
      title: 'Target',
      dataIndex: 'targetAmount',
      key: 'targetAmount',
      render: (value: number) => `Rs.${value.toLocaleString()}`,
      sorter: (a, b) => a.targetAmount - b.targetAmount,
      width: 120,
    },
    {
      title: 'Achievement',
      dataIndex: 'achievementPercent',
      key: 'achievementPercent',
      render: (value: number) => (
        <Progress
          percent={Math.min(value, 100)}
          size="small"
          status={value >= 100 ? 'success' : value >= 75 ? 'normal' : 'exception'}
          format={() => `${value.toFixed(1)}%`}
        />
      ),
      sorter: (a, b) => a.achievementPercent - b.achievementPercent,
      width: 150,
    },
    {
      title: 'Daily Avg',
      dataIndex: 'dailyAverage',
      key: 'dailyAverage',
      render: (value: number) => `Rs.${value.toFixed(0)}`,
      sorter: (a, b) => a.dailyAverage - b.dailyAverage,
      width: 100,
    },
    {
      title: 'Total Cartons',
      dataIndex: 'totalCarton',
      key: 'totalCarton',
      render: (value: number) => value.toLocaleString(),
      sorter: (a, b) => a.totalCarton - b.totalCarton,
      width: 100,
    },
    {
      title: 'Net Cartons',
      dataIndex: 'netCarton',
      key: 'netCarton',
      render: (value: number) => value.toLocaleString(),
      sorter: (a, b) => a.netCarton - b.netCarton,
      width: 100,
    },
    {
      title: 'Carton Return Rate',
      dataIndex: 'cartonReturnRate',
      key: 'cartonReturnRate',
      render: (value: number) => (
        <Tag color={value > 20 ? 'red' : value > 10 ? 'orange' : 'green'}>
          {value.toFixed(1)}%
        </Tag>
      ),
      sorter: (a, b) => a.cartonReturnRate - b.cartonReturnRate,
      width: 130,
    },
    {
      title: 'Return Rate',
      dataIndex: 'returnRate',
      key: 'returnRate',
      render: (value: number) => (
        <Tag color={value > 20 ? 'red' : value > 10 ? 'orange' : 'green'}>
          {value.toFixed(1)}%
        </Tag>
      ),
      sorter: (a, b) => a.returnRate - b.returnRate,
      width: 100,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: PerformanceData['status']) => {
        const statusConfig = {
          achieved: { color: 'green', text: 'Achieved' },
          'on-track': { color: 'blue', text: 'On Track' },
          ahead: { color: 'orange', text: 'Ahead' },
          behind: { color: 'red', text: 'Behind' },
        };
        const config = statusConfig[status];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      filters: [
        { text: 'Achieved', value: 'achieved' },
        { text: 'On Track', value: 'on-track' },
        { text: 'Ahead', value: 'ahead' },
        { text: 'Behind', value: 'behind' },
      ],
      onFilter: (value, record) => record.status === value,
      width: 100,
    },
  ];

  const handleExport = () => {
    // TODO: Implement export functionality
    message.info('Export functionality coming soon');
  };

  const handleRefresh = () => {
    // TODO: Implement refresh functionality
    window.location.reload();
  };

  if (isLoadingOrderBookers || isLoadingEntries || isLoadingTargets) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Business Intelligence Reports</Title>
        <Paragraph type="secondary">
          Comprehensive analytics and insights for informed business decisions
        </Paragraph>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col>
            <Space>
              <Text strong>Period:</Text>
              <Select
                value={selectedPeriod}
                onChange={setSelectedPeriod}
                style={{ width: 120 }}
              >
                <Option value="today">Today</Option>
                <Option value="week">This Week</Option>
                <Option value="month">This Month</Option>
                <Option value="quarter">This Quarter</Option>
              </Select>
            </Space>
          </Col>
          {selectedPeriod === 'month' && (
            <Col>
              <Space>
                <Text strong>Month:</Text>
                <DatePicker
                  picker="month"
                  value={selectedMonth}
                  onChange={(date) => date && setSelectedMonth(date)}
                  format="MMMM YYYY"
                />
              </Space>
            </Col>
          )}
          <Col>
            <Select
              mode="multiple"
              placeholder="Filter Order Bookers"
              value={selectedOrderBookers}
              onChange={setSelectedOrderBookers}
              style={{ minWidth: 200 }}
            >
              {orderBookers?.map(ob => (
                <Option key={ob.id} value={ob.id}>
                  {ob.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                Refresh
              </Button>
              <Button icon={<ExportOutlined />} onClick={handleExport}>
                Export
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Summary Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={3}>
          <Card>
            <Statistic
              title="Total Sales"
              value={summaryStats.totalSales}
              prefix={<DollarOutlined />}
              precision={0}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={3}>
          <Card>
            <Statistic
              title="Net Sales"
              value={summaryStats.netSales}
              prefix={<DollarOutlined />}
              precision={0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={3}>
          <Card>
            <Statistic
              title="Total Cartons"
              value={summaryStats.totalCarton}
              prefix={<InboxOutlined />}
              precision={0}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={3}>
          <Card>
            <Statistic
              title="Net Cartons"
              value={summaryStats.netCarton}
              prefix={<InboxOutlined />}
              precision={0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={3}>
          <Card>
            <Statistic
              title="Avg Achievement"
              value={summaryStats.averageAchievement}
              precision={1}
              suffix="%"
              valueStyle={{ color: summaryStats.averageAchievement >= 75 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={3}>
          <Card>
            <Statistic
              title="Active OBs"
              value={summaryStats.activeOrderBookers}
              suffix={`/ ${summaryStats.totalOrderBookers}`}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={3}>
          <Card>
            <Statistic
              title="On Track"
              value={summaryStats.onTrackCount}
              suffix={`/ ${summaryStats.totalOrderBookers}`}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={3}>
          <Card>
            <Statistic
              title="Total Returns"
              value={summaryStats.totalReturns}
              prefix={<DollarOutlined />}
              precision={0}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Alerts */}
      {underPerformers.length > 0 && (
        <Alert
          message={`${underPerformers.length} order bookers are behind their targets`}
          description={
            <div>
              <Text>Order bookers needing attention: </Text>
              {underPerformers.slice(0, 3).map((performer) => (
                <Tag key={performer.orderBooker.id} color="red">
                  {performer.orderBooker.name} ({performer.achievementPercent.toFixed(0)}%)
                </Tag>
              ))}
              {underPerformers.length > 3 && <Text>... and {underPerformers.length - 3} more</Text>}
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Main Content Tabs */}
      <Tabs defaultActiveKey="performance" size="large">
        <TabPane
          tab={
            <span>
              <TrophyOutlined />
              Performance Overview
            </span>
          }
          key="performance"
        >
          <Row gutter={16}>
            <Col span={16}>
              <Card title="Detailed Performance Analysis">
                <Table
                  columns={performanceColumns}
                  dataSource={performanceData}
                  rowKey={(record) => record.orderBooker.id}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: false,
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} order bookers`,
                  }}
                  scroll={{ x: 800 }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card title="Top Performers" style={{ marginBottom: '16px' }}>
                <List
                  itemLayout="horizontal"
                  dataSource={topPerformers}
                  renderItem={(item, index) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar style={{ backgroundColor: '#52c41a' }}>
                            {index + 1}
                          </Avatar>
                        }
                        title={item.orderBooker.name}
                        description={
                          <div>
                            <Text strong>Rs.{item.netSales.toLocaleString()}</Text>
                            <br />
                            <Text type="secondary">
                              {item.achievementPercent.toFixed(0)}% of target
                            </Text>
                          </div>
                        }
                      />
                      <div>
                        <Tooltip title="Achievement Rate">
                          <Tag color="green">
                            {item.achievementPercent.toFixed(0)}%
                          </Tag>
                        </Tooltip>
                      </div>
                    </List.Item>
                  )}
                />
              </Card>

              {underPerformers.length > 0 && (
                <Card title="Needs Attention" style={{ marginBottom: '16px' }}>
                  <List
                    itemLayout="horizontal"
                    dataSource={underPerformers}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={
                            <Avatar style={{ backgroundColor: '#ff4d4f' }}>
                              <WarningOutlined />
                            </Avatar>
                          }
                          title={item.orderBooker.name}
                          description={
                            <div>
                              <Text strong>Rs.{item.netSales.toLocaleString()}</Text>
                              <br />
                              <Text type="secondary">
                                {item.achievementPercent.toFixed(0)}% of target
                              </Text>
                            </div>
                          }
                        />
                        <div>
                          <Tooltip title="Behind Target">
                            <Tag color="red">
                              {item.achievementPercent.toFixed(0)}%
                            </Tag>
                          </Tooltip>
                        </div>
                      </List.Item>
                    )}
                  />
                </Card>
              )}
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={
            <span>
              <RiseOutlined />
              Daily Trends
            </span>
          }
          key="trends"
        >
          <Row gutter={16}>
            <Col span={24}>
              <Card title="Daily Performance Trends">
                <Table
                  columns={[
                    {
                      title: 'Date',
                      dataIndex: 'date',
                      key: 'date',
                      render: (date: string) => dayjs(date).format('MMM DD'),
                    },
                    {
                      title: 'Sales',
                      dataIndex: 'totalSales',
                      key: 'totalSales',
                      render: (value: number) => `Rs.${value.toLocaleString()}`,
                    },
                    {
                      title: 'Net Sales',
                      dataIndex: 'netSales',
                      key: 'netSales',
                      render: (value: number) => `Rs.${value.toLocaleString()}`,
                    },
                    {
                      title: 'Total Cartons',
                      dataIndex: 'totalCarton',
                      key: 'totalCarton',
                      render: (value: number) => value.toLocaleString(),
                    },
                    {
                      title: 'Net Cartons',
                      dataIndex: 'netCarton',
                      key: 'netCarton',
                      render: (value: number) => value.toLocaleString(),
                    },
                    {
                      title: 'Target',
                      dataIndex: 'targetAmount',
                      key: 'targetAmount',
                      render: (value: number) => `Rs.${value.toLocaleString()}`,
                    },
                    {
                      title: 'Achievement',
                      dataIndex: 'achievementPercent',
                      key: 'achievementPercent',
                      render: (value: number) => (
                        <Progress
                          percent={Math.min(value, 100)}
                          size="small"
                          status={value >= 100 ? 'success' : value >= 75 ? 'normal' : 'exception'}
                          format={() => `${value.toFixed(0)}%`}
                        />
                      ),
                    },
                    {
                      title: 'Entries',
                      dataIndex: 'entriesCount',
                      key: 'entriesCount',
                    },
                  ]}
                  dataSource={dailyPerformance}
                  rowKey="date"
                  pagination={{ pageSize: 15 }}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Reports;
