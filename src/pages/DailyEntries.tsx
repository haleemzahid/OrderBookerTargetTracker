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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { useOrderBookers } from '../hooks/useOrderBookers';
import { 
  useDailyEntriesByDateRange, 
  useCreateDailyEntry, 
  useUpdateDailyEntry, 
  useDeleteDailyEntry 
} from '../hooks/useDailyEntries';
import LoadingSpinner from '../components/common/LoadingSpinner';
import dayjs, { Dayjs } from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { DailyEntry, OrderBooker } from '../types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface DailyEntryWithOrderBooker extends DailyEntry {
  orderBooker?: OrderBooker;
}

interface FilterState {
  dateRange: [Dayjs, Dayjs] | null;
  orderBookerIds: string[];
  quickFilter: 'current' | 'previous' | 'last3months' | 'custom';
}

const DailyEntries: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: [dayjs().startOf('month'), dayjs().endOf('month')],
    orderBookerIds: [],
    quickFilter: 'current',
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DailyEntry | null>(null);
  const [form] = Form.useForm();

  // Fetch data
  const { data: orderBookers, isLoading: isLoadingOrderBookers } = useOrderBookers();
  const { 
    data: dailyEntries, 
    isLoading: isLoadingEntries,
  } = useDailyEntriesByDateRange(
    filters.dateRange?.[0]?.format('YYYY-MM-DD'),
    filters.dateRange?.[1]?.format('YYYY-MM-DD')
  );

  // Mutations
  const createEntry = useCreateDailyEntry();
  const updateEntry = useUpdateDailyEntry();
  const deleteEntry = useDeleteDailyEntry();

  // Quick filter handlers
  const handleQuickFilter = (type: FilterState['quickFilter']) => {
    let dateRange: [Dayjs, Dayjs];
    
    switch (type) {
      case 'current':
        dateRange = [dayjs().startOf('month'), dayjs().endOf('month')];
        break;
      case 'previous':
        dateRange = [
          dayjs().subtract(1, 'month').startOf('month'),
          dayjs().subtract(1, 'month').endOf('month')
        ];
        break;
      case 'last3months':
        dateRange = [
          dayjs().subtract(3, 'month').startOf('month'),
          dayjs().endOf('month')
        ];
        break;
      default:
        return;
    }
    
    setFilters(prev => ({
      ...prev,
      dateRange,
      quickFilter: type,
    }));
  };

  const handleCustomDateRange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setFilters(prev => ({
        ...prev,
        dateRange: [dates[0]!, dates[1]!],
        quickFilter: 'custom',
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        dateRange: null,
        quickFilter: 'custom',
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
    if (!dailyEntries || !orderBookers) return [];

    return dailyEntries
      .filter((entry: DailyEntry) => {
        if (filters.orderBookerIds.length > 0) {
          return filters.orderBookerIds.includes(entry.orderBookerId);
        }
        return true;
      })
      .map((entry: DailyEntry) => ({
        ...entry,
        orderBooker: orderBookers.find(ob => ob.id === entry.orderBookerId),
      }));
  }, [dailyEntries, orderBookers, filters.orderBookerIds]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!tableData.length) return { totalSales: 0, totalReturns: 0, netSales: 0, entriesCount: 0 };

    const totalSales = tableData.reduce((sum: number, entry: DailyEntryWithOrderBooker) => sum + entry.sales, 0);
    const totalReturns = tableData.reduce((sum: number, entry: DailyEntryWithOrderBooker) => sum + entry.returns, 0);
    const netSales = totalSales - totalReturns;
    const entriesCount = tableData.length;

    return { totalSales, totalReturns, netSales, entriesCount };
  }, [tableData]);

  // Table columns
  const columns: ColumnsType<DailyEntryWithOrderBooker> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      width: 120,
    },
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
      width: 180,
    },
    {
      title: 'Sales',
      dataIndex: 'sales',
      key: 'sales',
      render: (sales: number) => (
        <Tag color="green" style={{ minWidth: '80px', textAlign: 'center' }}>
          ${sales.toLocaleString()}
        </Tag>
      ),
      sorter: (a, b) => a.sales - b.sales,
      width: 120,
    },
    {
      title: 'Returns',
      dataIndex: 'returns',
      key: 'returns',
      render: (returns: number) => (
        <Tag color="red" style={{ minWidth: '80px', textAlign: 'center' }}>
          ${returns.toLocaleString()}
        </Tag>
      ),
      sorter: (a, b) => a.returns - b.returns,
      width: 120,
    },
    {
      title: 'Net Sales',
      key: 'netSales',
      render: (_, record) => {
        const netSales = record.sales - record.returns;
        return (
          <Tag color={netSales >= 0 ? 'blue' : 'red'} style={{ minWidth: '80px', textAlign: 'center' }}>
            ${netSales.toLocaleString()}
          </Tag>
        );
      },
      sorter: (a, b) => (a.sales - a.returns) - (b.sales - b.returns),
      width: 120,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit Entry">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Delete Entry">
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
    setEditingEntry(null);
    setIsModalOpen(true);
    form.resetFields();
  };

  const handleEdit = (entry: DailyEntry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
    form.setFieldsValue({
      orderBookerId: entry.orderBookerId,
      date: dayjs(entry.date),
      sales: entry.sales,
      returns: entry.returns,
    });
  };

  const handleDelete = (entry: DailyEntry) => {
    Modal.confirm({
      title: 'Delete Daily Entry',
      content: 'Are you sure you want to delete this entry?',
      onOk: () => {
        deleteEntry.mutate(entry.id, {
          onSuccess: () => {
            message.success('Entry deleted successfully');
          },
          onError: (error: unknown) => {
            message.error('Failed to delete entry');
            console.error('Delete error:', error);
          },
        });
      },
    });
  };

  const handleModalOk = () => {
    form.validateFields().then(values => {
      const entryData = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
      };

      if (editingEntry) {
        updateEntry.mutate(
          { id: editingEntry.id, ...entryData },
          {
            onSuccess: () => {
              message.success('Entry updated successfully');
              setIsModalOpen(false);
              form.resetFields();
            },
            onError: (error: unknown) => {
              message.error('Failed to update entry');
              console.error('Update error:', error);
            },
          }
        );
      } else {
        createEntry.mutate(entryData, {
          onSuccess: () => {
            message.success('Entry created successfully');
            setIsModalOpen(false);
            form.resetFields();
          },
          onError: (error: unknown) => {
            message.error('Failed to create entry');
            console.error('Create error:', error);
          },
        });
      }
    });
  };

  const handleBatchAdd = () => {
    setIsModalOpen(true);
    form.resetFields();
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    message.info('Export functionality coming soon');
  };

  if (isLoadingOrderBookers || isLoadingEntries) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Daily Entries Management</Title>
        <Text type="secondary">
          Track daily sales and returns for each order booker
        </Text>
      </div>

      {/* Summary Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Sales"
              value={summaryStats.totalSales}
              prefix="$"
              precision={0}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Returns"
              value={summaryStats.totalReturns}
              prefix="$"
              precision={0}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Net Sales"
              value={summaryStats.netSales}
              prefix="$"
              precision={0}
              valueStyle={{ color: summaryStats.netSales >= 0 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Entries"
              value={summaryStats.entriesCount}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col>
            <Space>
              <Button
                type={filters.quickFilter === 'current' ? 'primary' : 'default'}
                onClick={() => handleQuickFilter('current')}
              >
                Current Month
              </Button>
              <Button
                type={filters.quickFilter === 'previous' ? 'primary' : 'default'}
                onClick={() => handleQuickFilter('previous')}
              >
                Previous Month
              </Button>
              <Button
                type={filters.quickFilter === 'last3months' ? 'primary' : 'default'}
                onClick={() => handleQuickFilter('last3months')}
              >
                Last 3 Months
              </Button>
            </Space>
          </Col>
          <Col>
            <RangePicker
              value={filters.dateRange}
              onChange={handleCustomDateRange}
              format="MMM DD, YYYY"
              placeholder={['Start Date', 'End Date']}
            />
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
            Add Entry
          </Button>
          <Button icon={<CopyOutlined />} onClick={handleBatchAdd}>
            Batch Add
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
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} entries`,
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          loading={isLoadingEntries}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingEntry ? 'Edit Daily Entry' : 'Add Daily Entry'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        confirmLoading={createEntry.isPending || updateEntry.isPending}
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
                label="Date"
                name="date"
                rules={[{ required: true, message: 'Please select a date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Sales Amount"
                name="sales"
                rules={[
                  { required: true, message: 'Please enter sales amount' },
                  { type: 'number', min: 0, message: 'Sales amount must be positive' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Enter sales amount"
                  prefix="$"
                  precision={2}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Returns Amount"
                name="returns"
                rules={[
                  { required: true, message: 'Please enter returns amount' },
                  { type: 'number', min: 0, message: 'Returns amount must be positive' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Enter returns amount"
                  prefix="$"
                  precision={2}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default DailyEntries;
