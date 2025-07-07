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
} from 'antd';
import {
  PlusOutlined,
  ExportOutlined,
  CalendarOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useDailyEntriesByDateRange } from '../api/queries';
import { useDeleteDailyEntry } from '../api/mutations';
import { useOrderBookers } from '../../order-bookers';
import { DailyEntryTable } from '../components/daily-entry-table';
import { DailyEntryForm } from '../components/daily-entry-form';
import dayjs, { Dayjs } from 'dayjs';
import type { DailyEntry, DailyEntryWithOrderBooker } from '../types';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

interface FilterState {
  dateRange: [Dayjs, Dayjs] | null;
  orderBookerIds: string[];
}

export const DailyEntriesListPage: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: [dayjs().startOf('month'), dayjs().endOf('month')],
    orderBookerIds: [],
  });
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DailyEntry | null>(null);

  // Fetch data
  const { data: orderBookers } = useOrderBookers();
  const { data: dailyEntries, isLoading } = useDailyEntriesByDateRange(
    filters.dateRange?.[0]?.format('YYYY-MM-DD'),
    filters.dateRange?.[1]?.format('YYYY-MM-DD')
  );
  const deleteMutation = useDeleteDailyEntry();

  // Filter data based on search and order booker filter
  const filteredData = useMemo(() => {
    if (!dailyEntries) return [];

    let filtered = dailyEntries;

    // Filter by order booker
    if (filters.orderBookerIds.length > 0) {
      filtered = filtered.filter(entry => 
        filters.orderBookerIds.includes(entry.orderBookerId)
      );
    }

    // Add order booker info to entries
    const entriesWithOrderBooker: DailyEntryWithOrderBooker[] = filtered.map(entry => ({
      ...entry,
      orderBooker: orderBookers?.find(ob => ob.id === entry.orderBookerId),
    }));

    // Filter by search text
    if (searchText) {
      const search = searchText.toLowerCase();
      return entriesWithOrderBooker.filter(entry => 
        entry.orderBooker?.name.toLowerCase().includes(search) ||
        entry.orderBooker?.nameUrdu.includes(search) ||
        entry.notes?.toLowerCase().includes(search)
      );
    }

    return entriesWithOrderBooker;
  }, [dailyEntries, orderBookers, filters.orderBookerIds, searchText]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!filteredData.length) {
      return {
        totalSales: 0,
        totalReturns: 0,
        netSales: 0,
        totalCartons: 0,
        returnCartons: 0,
        netCartons: 0,
        entriesCount: 0,
      };
    }

    const stats = filteredData.reduce((acc, entry) => ({
      totalSales: acc.totalSales + entry.sales,
      totalReturns: acc.totalReturns + entry.returns,
      netSales: acc.netSales + entry.netSales,
      totalCartons: acc.totalCartons + entry.totalCarton,
      returnCartons: acc.returnCartons + entry.returnCarton,
      netCartons: acc.netCartons + (entry.totalCarton - entry.returnCarton),
      entriesCount: acc.entriesCount + 1,
    }), {
      totalSales: 0,
      totalReturns: 0,
      netSales: 0,
      totalCartons: 0,
      returnCartons: 0,
      netCartons: 0,
      entriesCount: 0,
    });

    return stats;
  }, [filteredData]);

  const handleDateRangeChange = (dates: any) => {
    setFilters(prev => ({ ...prev, dateRange: dates }));
  };

  const handleOrderBookerFilter = (orderBookerIds: string[]) => {
    setFilters(prev => ({ ...prev, orderBookerIds }));
  };

  const handleAdd = () => {
    setEditingEntry(null);
    setIsModalOpen(true);
  };

  const handleEdit = (entry: DailyEntry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const handleDelete = async (entry: DailyEntry) => {
    try {
      await deleteMutation.mutateAsync(entry.id);
      message.success('Daily entry deleted successfully');
    } catch (error) {
      message.error('Failed to delete daily entry');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
  };

  const handleFormSuccess = () => {
    handleModalClose();
    message.success(
      editingEntry
        ? 'Daily entry updated successfully'
        : 'Daily entry created successfully'
    );
  };

  return (
    <div>
      {/* Summary Statistics */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Sales"
              value={summaryStats.totalSales}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Returns"
              value={summaryStats.totalReturns}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Net Sales"
              value={summaryStats.netSales}
              prefix={<DollarOutlined />}
              valueStyle={{ color: summaryStats.netSales >= 0 ? '#52c41a' : '#ff4d4f' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Entries"
              value={summaryStats.entriesCount}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card
        title="Daily Entries"
        extra={
          <Space>
            <Search
              placeholder="Search entries..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
            />
            <Button icon={<ExportOutlined />}>Export</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Add Entry
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* Filter Controls */}
          <Row gutter={16}>
            <Col span={8}>
              <RangePicker
                value={filters.dateRange}
                onChange={handleDateRangeChange}
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
          <DailyEntryTable
            data={filteredData}
            loading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </Space>
      </Card>

      {/* Form Modal */}
      <Modal
        title={editingEntry ? 'Edit Daily Entry' : 'Add Daily Entry'}
        open={isModalOpen}
        onCancel={handleModalClose}
        footer={null}
        width={800}
      >
        <DailyEntryForm
          dailyEntry={editingEntry || undefined}
          onSuccess={handleFormSuccess}
          onCancel={handleModalClose}
        />
      </Modal>
    </div>
  );
};
