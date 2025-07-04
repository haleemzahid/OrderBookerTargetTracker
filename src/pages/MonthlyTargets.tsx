import React, { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  DatePicker,
  Select,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  InputNumber,
  Tag,
  message,
  Modal,
  Form,
  Tooltip,
  Progress,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  CopyOutlined,
  CalendarOutlined,
  AimOutlined,
} from '@ant-design/icons';
import { useOrderBookers } from '../hooks/useOrderBookers';
import { useMonthlyTargets } from '../hooks/useMonthlyTargets';
import LoadingSpinner from '../components/common/LoadingSpinner';
import dayjs, { Dayjs } from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { MonthlyTarget, OrderBooker, CreateMonthlyTargetRequest } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

interface MonthlyTargetWithOrderBooker extends MonthlyTarget {
  orderBooker?: OrderBooker;
}

interface FilterState {
  year: number;
  month: number;
  orderBookerIds: string[];
}

const MonthlyTargets: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>({
    year: dayjs().year(),
    month: dayjs().month() + 1,
    orderBookerIds: [],
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<MonthlyTarget | null>(null);
  const [form] = Form.useForm();

  // Fetch data
  const { data: orderBookers, isLoading: isLoadingOrderBookers } = useOrderBookers();
  const { 
    data: monthlyTargets, 
    isLoading: isLoadingTargets,
    createTarget,
    updateTarget,
    deleteTarget,
    copyFromPreviousMonth,
  } = useMonthlyTargets(filters.year, filters.month);

  // Month/Year selector handlers
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
    setFilters(prev => ({
      ...prev,
      orderBookerIds,
    }));
  };

  // Prepare data for table
  const tableData = useMemo(() => {
    if (!monthlyTargets || !orderBookers) return [];

    return monthlyTargets
      .filter((target: MonthlyTarget) => {
        if (filters.orderBookerIds.length > 0) {
          return filters.orderBookerIds.includes(target.orderBookerId);
        }
        return true;
      })
      .map((target: MonthlyTarget) => ({
        ...target,
        orderBooker: orderBookers.find(ob => ob.id === target.orderBookerId),
      }));
  }, [monthlyTargets, orderBookers, filters.orderBookerIds]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!tableData.length) return { 
      totalTargets: 0, 
      totalAchieved: 0, 
      averageAchievement: 0, 
      targetsCount: 0 
    };

    const totalTargets = tableData.reduce((sum: number, target: MonthlyTargetWithOrderBooker) => sum + target.targetAmount, 0);
    const totalAchieved = tableData.reduce((sum: number, target: MonthlyTargetWithOrderBooker) => sum + target.achievedAmount, 0);
    const averageAchievement = totalTargets > 0 ? (totalAchieved / totalTargets) * 100 : 0;
    const targetsCount = tableData.length;

    return { totalTargets, totalAchieved, averageAchievement, targetsCount };
  }, [tableData]);

  // Table columns
  const columns: ColumnsType<MonthlyTargetWithOrderBooker> = [
    {
      title: 'Order Booker',
      dataIndex: ['orderBooker', 'name'],
      key: 'orderBooker',
      render: (name: string, record) => (
        <div>
          <div style={{ fontWeight: 'medium' }}>{name}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.orderBooker?.territory || 'No territory'}
          </Text>
        </div>
      ),
      sorter: (a, b) => (a.orderBooker?.name || '').localeCompare(b.orderBooker?.name || ''),
      width: 200,
    },
    {
      title: 'Target Amount',
      dataIndex: 'targetAmount',
      key: 'targetAmount',
      render: (amount: number) => (
        <Tag color="blue" style={{ minWidth: '100px', textAlign: 'center' }}>
          Rs.{amount}
        </Tag>
      ),
      sorter: (a, b) => a.targetAmount - b.targetAmount,
      width: 150,
    },
    {
      title: 'Achieved Amount',
      dataIndex: 'achievedAmount',
      key: 'achievedAmount',
      render: (amount: number) => (
        <Tag color="green" style={{ minWidth: '100px', textAlign: 'center' }}>
          Rs.{amount}
        </Tag>
      ),
      sorter: (a, b) => a.achievedAmount - b.achievedAmount,
      width: 150,
    },
    {
      title: 'Achievement %',
      key: 'achievementPercent',
      render: (_, record) => {
        const percentage = record.targetAmount > 0 ? (record.achievedAmount / record.targetAmount) * 100 : 0;
        return (
          <Progress 
            percent={Math.round(percentage)} 
            size="small" 
            status={percentage >= 100 ? 'success' : percentage >= 75 ? 'normal' : 'exception'}
            style={{ width: '120px' }}
          />
        );
      },
      sorter: (a, b) => {
        const aPercent = a.targetAmount > 0 ? (a.achievedAmount / a.targetAmount) * 100 : 0;
        const bPercent = b.targetAmount > 0 ? (b.achievedAmount / b.targetAmount) * 100 : 0;
        return aPercent - bPercent;
      },
      width: 150,
    },
    {
      title: 'Daily Target',
      key: 'dailyTarget',
      render: (_, record) => {
        const daysInMonth = dayjs(`${filters.year}-${filters.month}`).daysInMonth();
        const dailyTarget = record.targetAmount / daysInMonth;
        return (
          <Text type="secondary">
            Rs.{dailyTarget.toFixed(0)}/day
          </Text>
        );
      },
      width: 120,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const percentage = record.targetAmount > 0 ? (record.achievedAmount / record.targetAmount) * 100 : 0;
        let color = 'orange';
        let text = 'In Progress';
        
        if (percentage >= 100) {
          color = 'green';
          text = 'Achieved';
        } else if (percentage >= 75) {
          color = 'blue';
          text = 'On Track';
        } else if (percentage < 50) {
          color = 'red';
          text = 'Behind';
        }
        
        return <Tag color={color}>{text}</Tag>;
      },
      width: 100,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit Target">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Delete Target">
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
      width: 100,
    },
  ];

  // Modal and form handlers
  const handleAdd = () => {
    setEditingTarget(null);
    setIsModalOpen(true);
    form.resetFields();
  };

  const handleEdit = (target: MonthlyTarget) => {
    setEditingTarget(target);
    setIsModalOpen(true);
    form.setFieldsValue({
      orderBookerId: target.orderBookerId,
      targetAmount: target.targetAmount,
    });
  };

  const handleDelete = (target: MonthlyTarget) => {
    Modal.confirm({
      title: 'Delete Monthly Target',
      content: 'Are you sure you want to delete this target?',
      onOk: () => {
        deleteTarget.mutate(target.id, {
          onSuccess: () => {
            message.success('Target deleted successfully');
          },
          onError: (error: unknown) => {
            message.error('Failed to delete target');
            console.error('Delete error:', error);
          },
        });
      },
    });
  };

  const handleModalOk = () => {
    form.validateFields().then(values => {
      const targetData: CreateMonthlyTargetRequest = {
        ...values,
        year: filters.year,
        month: filters.month,
      };

      if (editingTarget) {
        updateTarget.mutate(
          { id: editingTarget.id, ...targetData },
          {
            onSuccess: () => {
              message.success('Target updated successfully');
              setIsModalOpen(false);
              form.resetFields();
            },
            onError: (error: unknown) => {
              message.error('Failed to update target');
              console.error('Update error:', error);
            },
          }
        );
      } else {
        createTarget.mutate(targetData, {
          onSuccess: () => {
            message.success('Target created successfully');
            setIsModalOpen(false);
            form.resetFields();
          },
          onError: (error: unknown) => {
            message.error('Failed to create target');
            console.error('Create error:', error);
          },
        });
      }
    });
  };

  const handleCopyFromPrevious = () => {
    const previousMonth = dayjs(`${filters.year}-${filters.month}`).subtract(1, 'month');
    
    Modal.confirm({
      title: 'Copy Targets from Previous Month',
      content: `Copy all targets from ${previousMonth.format('MMMM YYYY')}?`,
      onOk: () => {
        copyFromPreviousMonth.mutate(
          { 
            fromYear: previousMonth.year(),
            fromMonth: previousMonth.month() + 1,
            toYear: filters.year,
            toMonth: filters.month,
          },
          {
            onSuccess: () => {
              message.success('Targets copied successfully');
            },
            onError: (error: unknown) => {
              message.error('Failed to copy targets');
              console.error('Copy error:', error);
            },
          }
        );
      },
    });
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    message.info('Export functionality coming soon');
  };

  if (isLoadingOrderBookers || isLoadingTargets) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Monthly Targets Management</Title>
        <Text type="secondary">
          Set and track monthly sales targets for each order booker
        </Text>
      </div>

      {/* Summary Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Targets"
              value={summaryStats.totalTargets}
              prefix="Rs."
              precision={0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Achieved"
              value={summaryStats.totalAchieved}
              prefix="Rs."
              precision={0}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Average Achievement"
              value={summaryStats.averageAchievement}
              suffix="%"
              precision={1}
              valueStyle={{ color: summaryStats.averageAchievement >= 75 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Targets"
              value={summaryStats.targetsCount}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col>
            <Space>
              <CalendarOutlined />
              <Text strong>Month/Year:</Text>
              <DatePicker
                picker="month"
                value={dayjs(`${filters.year}-${filters.month}`)}
                onChange={handleMonthYearChange}
                format="MMMM YYYY"
                allowClear={false}
              />
            </Space>
          </Col>
          <Col>
            <Select
              mode="multiple"
              placeholder="Filter by Order Booker"
              value={filters.orderBookerIds}
              onChange={handleOrderBookerFilter}
              style={{ minWidth: 200 }}
              maxTagCount="responsive"
            >
              {orderBookers?.map(ob => (
                <Option key={ob.id} value={ob.id}>
                  {ob.name}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Action Buttons */}
      <Card style={{ marginBottom: '24px' }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Set Target
          </Button>
          <Button icon={<CopyOutlined />} onClick={handleCopyFromPrevious}>
            Copy from Previous Month
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            Export
          </Button>
          {selectedRowKeys.length > 0 && (
            <Button danger icon={<DeleteOutlined />}>
              Delete Selected ({selectedRowKeys.length})
            </Button>
          )}
        </Space>
      </Card>

      {/* Data Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={tableData}
          rowKey="id"
          pagination={{
            total: tableData.length,
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} targets`,
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          loading={isLoadingTargets}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingTarget ? 'Edit Monthly Target' : 'Set Monthly Target'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        confirmLoading={createTarget.isPending || updateTarget.isPending}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Order Booker"
                name="orderBookerId"
                rules={[{ required: true, message: 'Please select an order booker' }]}
              >
                <Select placeholder="Select order booker" showSearch>
                  {orderBookers?.map(ob => (
                    <Option key={ob.id} value={ob.id}>
                      {ob.name} - {ob.territory}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label={`Target Amount for ${dayjs(`${filters.year}-${filters.month}`).format('MMMM YYYY')}`}
                name="targetAmount"
                rules={[
                  { required: true, message: 'Please enter target amount' },
                  { type: 'number', min: 0, message: 'Target amount must be positive' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Enter target amount"
                  prefix="Rs."
                  precision={2}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Card size="small" style={{ backgroundColor: '#f6f8fa' }}>
                <Text type="secondary">
                  <AimOutlined /> Daily Target: Rs.
                  {form.getFieldValue('targetAmount') 
                    ? (form.getFieldValue('targetAmount') / dayjs(`${filters.year}-${filters.month}`).daysInMonth()).toFixed(0)
                    : '0'
                  } per day
                </Text>
              </Card>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default MonthlyTargets;
