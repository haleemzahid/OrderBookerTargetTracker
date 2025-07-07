import React, { useState, useMemo } from 'react';
import {
  Card,
  Button,
  DatePicker,
  Select,
  Space,
  Row,
  Col,
  Statistic,
  Modal,
  message,
  Input,
  Progress,
} from 'antd';
import {
  PlusOutlined,
  CopyOutlined,
  ExportOutlined,
  DollarOutlined,
  AimOutlined,
} from '@ant-design/icons';
import { useMonthlyTargetsByMonth } from '../api/queries';
import { useDeleteMonthlyTarget, useCopyFromPreviousMonth } from '../api/mutations';
import { useOrderBookers } from '../../order-bookers';
import { MonthlyTargetTable } from '../components/monthly-target-table';
import { MonthlyTargetForm } from '../components/monthly-target-form';
import dayjs, { Dayjs } from 'dayjs';
import type { MonthlyTarget, MonthlyTargetWithOrderBooker } from '../types';

const { Option } = Select;
const { Search } = Input;

interface FilterState {
  year: number;
  month: number;
  orderBookerIds: string[];
}

export const MonthlyTargetsListPage: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>({
    year: dayjs().year(),
    month: dayjs().month() + 1,
    orderBookerIds: [],
  });
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<MonthlyTarget | null>(null);

  // Fetch data
  const { data: orderBookers } = useOrderBookers();
  const { data: monthlyTargets, isLoading } = useMonthlyTargetsByMonth(filters.year, filters.month);
  const deleteMutation = useDeleteMonthlyTarget();
  const copyMutation = useCopyFromPreviousMonth();

  // Filter data based on search and order booker filter
  const filteredData = useMemo(() => {
    if (!monthlyTargets) return [];

    let filtered = monthlyTargets;

    // Filter by order booker
    if (filters.orderBookerIds.length > 0) {
      filtered = filtered.filter(target => 
        filters.orderBookerIds.includes(target.orderBookerId)
      );
    }

    // Add order booker info to targets
    const targetsWithOrderBooker: MonthlyTargetWithOrderBooker[] = filtered.map(target => ({
      ...target,
      orderBooker: orderBookers?.find(ob => ob.id === target.orderBookerId),
    }));

    // Filter by search text
    if (searchText) {
      const search = searchText.toLowerCase();
      return targetsWithOrderBooker.filter(target => 
        target.orderBooker?.name.toLowerCase().includes(search) ||
        target.orderBooker?.nameUrdu.includes(search)
      );
    }

    return targetsWithOrderBooker;
  }, [monthlyTargets, orderBookers, filters.orderBookerIds, searchText]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!filteredData.length) {
      return {
        totalTargets: 0,
        totalTargetAmount: 0,
        totalAchievedAmount: 0,
        averageAchievement: 0,
        onTrackCount: 0,
        behindCount: 0,
      };
    }

    const stats = filteredData.reduce((acc, target) => ({
      totalTargets: acc.totalTargets + 1,
      totalTargetAmount: acc.totalTargetAmount + target.targetAmount,
      totalAchievedAmount: acc.totalAchievedAmount + target.achievedAmount,
      achievementSum: acc.achievementSum + target.achievementPercentage,
      onTrackCount: acc.onTrackCount + (target.achievementPercentage >= 80 ? 1 : 0),
      behindCount: acc.behindCount + (target.achievementPercentage < 80 ? 1 : 0),
    }), {
      totalTargets: 0,
      totalTargetAmount: 0,
      totalAchievedAmount: 0,
      achievementSum: 0,
      onTrackCount: 0,
      behindCount: 0,
    });

    return {
      ...stats,
      averageAchievement: stats.totalTargets > 0 ? stats.achievementSum / stats.totalTargets : 0,
    };
  }, [filteredData]);

  const handleMonthYearChange = (date: Dayjs | null) => {
    if (date) {
      setFilters(prev => ({
        ...prev,
        year: date.year(),
        month: date.month() + 1,
      }));
    }
  };

  const handleOrderBookerFilter = (orderBookerIds: string[]) => {
    setFilters(prev => ({ ...prev, orderBookerIds }));
  };

  const handleAdd = () => {
    setEditingTarget(null);
    setIsModalOpen(true);
  };

  const handleEdit = (target: MonthlyTarget) => {
    setEditingTarget(target);
    setIsModalOpen(true);
  };

  const handleDelete = async (target: MonthlyTarget) => {
    try {
      await deleteMutation.mutateAsync(target.id);
      message.success('Monthly target deleted successfully');
    } catch (error) {
      message.error('Failed to delete monthly target');
    }
  };

  const handleCopyFromPrevious = async () => {
    try {
      const fromMonth = filters.month === 1 ? 12 : filters.month - 1;
      const fromYear = filters.month === 1 ? filters.year - 1 : filters.year;
      
      await copyMutation.mutateAsync({
        fromYear,
        fromMonth,
        toYear: filters.year,
        toMonth: filters.month,
        orderBookerIds: filters.orderBookerIds.length > 0 ? filters.orderBookerIds : undefined,
      });
      
      message.success('Targets copied from previous month successfully');
    } catch (error) {
      message.error('Failed to copy targets from previous month');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTarget(null);
  };

  const handleFormSuccess = () => {
    handleModalClose();
    message.success(
      editingTarget
        ? 'Monthly target updated successfully'
        : 'Monthly target created successfully'
    );
  };

  return (
    <div>
      {/* Summary Statistics */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Targets"
              value={summaryStats.totalTargets}
              prefix={<AimOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Target Amount"
              value={summaryStats.totalTargetAmount}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Achieved Amount"
              value={summaryStats.totalAchievedAmount}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#faad14' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Average Achievement"
              value={summaryStats.averageAchievement}
              suffix="%"
              valueStyle={{ color: summaryStats.averageAchievement >= 80 ? '#52c41a' : '#ff4d4f' }}
              precision={1}
            />
          </Card>
        </Col>
      </Row>

      {/* Progress Overview */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card title="Achievement Overview">
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: 8 }}>
                  <span>Overall Achievement: </span>
                  <Progress
                    percent={summaryStats.totalTargetAmount > 0 ? 
                      (summaryStats.totalAchievedAmount / summaryStats.totalTargetAmount) * 100 : 0}
                    strokeColor="#52c41a"
                  />
                </div>
              </Col>
              <Col span={6}>
                <Statistic
                  title="On Track"
                  value={summaryStats.onTrackCount}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Behind"
                  value={summaryStats.behindCount}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card
        title="Monthly Targets"
        extra={
          <Space>
            <Search
              placeholder="Search targets..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
            />
            <Button 
              icon={<CopyOutlined />} 
              onClick={handleCopyFromPrevious}
              loading={copyMutation.isPending}
            >
              Copy Previous
            </Button>
            <Button icon={<ExportOutlined />}>Export</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Add Target
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* Filter Controls */}
          <Row gutter={16}>
            <Col span={6}>
              <DatePicker
                picker="month"
                value={dayjs().year(filters.year).month(filters.month - 1)}
                onChange={handleMonthYearChange}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={8}>
              <Select
                mode="multiple"
                placeholder="Filter by Order Booker"
                value={filters.orderBookerIds}
                onChange={handleOrderBookerFilter}
                style={{ width: '100%' }}
              >
                {orderBookers?.map(orderBooker => (
                  <Option key={orderBooker.id} value={orderBooker.id}>
                    {orderBooker.name} ({orderBooker.nameUrdu})
                  </Option>
                ))}
              </Select>
            </Col>
          </Row>

          {/* Table */}
          <MonthlyTargetTable
            data={filteredData}
            loading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </Space>
      </Card>

      {/* Form Modal */}
      <Modal
        title={editingTarget ? 'Edit Monthly Target' : 'Add Monthly Target'}
        open={isModalOpen}
        onCancel={handleModalClose}
        footer={null}
        width={600}
      >
        <MonthlyTargetForm
          monthlyTarget={editingTarget || undefined}
          onSuccess={handleFormSuccess}
          onCancel={handleModalClose}
        />
      </Modal>
    </div>
  );
};
