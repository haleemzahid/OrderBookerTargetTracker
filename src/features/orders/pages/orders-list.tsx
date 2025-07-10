import React, { useState, useMemo } from 'react';
import { Modal, message, Space, Select, DatePicker, Tag } from 'antd';
import { useNavigate } from '@tanstack/react-router';
import { useOrders, useOrderSummary } from '../api/queries';
import { useDeleteOrder } from '../api/mutations';
import { useOrderBookers } from '../../order-bookers/api/queries';
import { ActionBar, ListPageLayout } from '../../../shared/components';
import { useExport } from '../../../shared/hooks';
import { ExportColumn } from '../../../shared/utils/export/exportService';
import type { Order, OrderFilters } from '../types';
import dayjs from 'dayjs';
import { OrderDetail, OrderTable } from '..';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface FilterState {
  orderBookerId?: string;
  status?: 'pending' | 'supplied' | 'completed';
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs];
}

export const OrdersListPage: React.FC = () => {
  const navigate = useNavigate();
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    orderBookerId: undefined,
    status: undefined,
    dateRange: undefined,
  });

  // Load order bookers data
  const { data: orderBookers, isLoading: isLoadingOrderBookers } = useOrderBookers();

  // Set up export functionality
  const exportFileName = 'orders';
  const exportTitle = 'Orders';

  const { exportData, isExporting } = useExport({
    fileName: exportFileName,
    title: exportTitle,
  });

  // Build query filters
  const queryFilters: OrderFilters = {
    searchTerm: searchText,
    orderBookerId: filters.orderBookerId,
    status: filters.status,
    dateFrom: filters.dateRange?.[0]?.toDate(),
    dateTo: filters.dateRange?.[1]?.toDate(),
  };

  const {
    data: orders,
    isLoading,
    error,
  } = useOrders(queryFilters);

  const { data: orderSummary } = useOrderSummary(queryFilters);
  const deleteMutation = useDeleteOrder();

  const handleAdd = () => {
    navigate({ to: '/orders/create' });
  };

  const handleEdit = (order: Order) => {
    navigate({ to: '/orders/$orderId/edit', params: { orderId: order.id } });
  };

  const handleView = (order: Order) => {
    setViewingOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (order: Order) => {
    try {
      await deleteMutation.mutateAsync(order.id);
      message.success('Order deleted successfully');
    } catch (error) {
      message.error('Failed to delete order');
    }
  };

  const handleDetailModalClose = () => {
    setIsDetailModalOpen(false);
    setViewingOrder(null);
  };

  // Filter data based on selected filters
  const filteredData = useMemo(() => {
    if (!orders) return [];
    return orders;
  }, [orders]);

  const handleOrderBookerFilter = (orderBookerId?: string) => {
    setFilters((prev) => ({ ...prev, orderBookerId }));
  };

  const handleStatusFilter = (status?: 'pending' | 'supplied' | 'completed') => {
    setFilters((prev) => ({ ...prev, status }));
  };

  const handleDateRangeFilter = (dates: any) => {
    setFilters((prev) => ({ ...prev, dateRange: dates }));
  };

  // Export functionality
  const getExportColumns = (): ExportColumn[] => [
    { title: 'Order Date', dataIndex: 'orderDate', render: (value) => dayjs(value).format('DD/MM/YYYY') },
    { 
      title: 'Order Booker', 
      dataIndex: 'orderBookerId',
      render: (value) => {
        const orderBooker = orderBookers?.find(ob => ob.id === value);
        return orderBooker?.name || value;
      }
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      render: (value) => `Rs. ${value.toLocaleString()}`,
    },
    {
      title: 'Total Cost',
      dataIndex: 'totalCost',
      render: (value) => `Rs. ${value.toLocaleString()}`,
    },
    {
      title: 'Total Profit',
      dataIndex: 'totalProfit',
      render: (value) => `Rs. ${value.toLocaleString()}`,
    },
    { title: 'Total Cartons', dataIndex: 'totalCartons' },
    { title: 'Status', dataIndex: 'status' },
    { title: 'Supply Date', dataIndex: 'supplyDate', render: (value) => value ? dayjs(value).format('DD/MM/YYYY') : '-' },
  ];

  const handleExport = async (format: string) => {
    await exportData(format, filteredData, getExportColumns());
  };

  if (error) {
    return <div>Error loading orders: {error?.toString()}</div>;
  }

  const renderSummaryCards = () => {
    if (!orderSummary) return null;

    return (
      <Space size="large" style={{ marginBottom: 16 }}>
        <div>
          <strong>Total Orders:</strong> {orderSummary.totalOrders}
        </div>
        <div>
          <strong>Total Amount:</strong> Rs. {orderSummary.totalAmount.toLocaleString()}
        </div>
        <div>
          <strong>Total Profit:</strong> Rs. {orderSummary.totalProfit.toLocaleString()}
        </div>
        <div>
          <strong>Total Cartons:</strong> {orderSummary.totalCartons}
        </div>
        <Space>
          <Tag color="orange">Pending: {orderSummary.pendingOrders}</Tag>
          <Tag color="blue">Supplied: {orderSummary.suppliedOrders}</Tag>
          <Tag color="green">Completed: {orderSummary.completedOrders}</Tag>
        </Space>
      </Space>
    );
  };

  const renderExtraActions = () => {
    return (
      <Space size="small">
        <Select
          placeholder="Filter by Order Booker"
          value={filters.orderBookerId}
          onChange={handleOrderBookerFilter}
          style={{ width: 200 }}
          allowClear
          loading={isLoadingOrderBookers}
        >
          <Option value={undefined}>All Order Bookers</Option>
          {orderBookers?.map(orderBooker => (
            <Option key={orderBooker.id} value={orderBooker.id}>{orderBooker.name}</Option>
          ))}
        </Select>
        <Select
          placeholder="Filter by Status"
          value={filters.status}
          onChange={handleStatusFilter}
          style={{ width: 150 }}
          allowClear
        >
          <Option value={undefined}>All Status</Option>
          <Option value="pending">Pending</Option>
          <Option value="supplied">Supplied</Option>
          <Option value="completed">Completed</Option>
        </Select>
        <RangePicker
          placeholder={['From Date', 'To Date']}
          value={filters.dateRange}
          onChange={handleDateRangeFilter}
          format="DD/MM/YYYY"
        />
      </Space>
    );
  };

  return (
    <ListPageLayout
      title="Orders"
      extraActions={
        <ActionBar
          onSearch={setSearchText}
          searchValue={searchText}
          searchPlaceholder="Search orders..."
          onAdd={handleAdd}
          addLabel="Add Order"
          onExport={handleExport}
          extraActions={renderExtraActions()}
        />
      }
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {renderSummaryCards()}
        <OrderTable
          data={filteredData}
          loading={isLoading || isExporting}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
        />
      </Space>

      <Modal
        title="Order Details"
        open={isDetailModalOpen}
        onCancel={handleDetailModalClose}
        footer={null}
        width={1500}
      >
        {viewingOrder && (
          <OrderDetail order={viewingOrder} />
        )}
      </Modal>
    </ListPageLayout>
  );
};
