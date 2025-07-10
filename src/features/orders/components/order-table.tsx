import React from 'react';
import { Table, Tag, Tooltip, Button, Space } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import type { OrderTableProps } from '../types';
import type { ColumnsType } from 'antd/es/table';
import type { Order } from '../types';
import { TableActions, FormatNumber } from '../../../shared/components';
import { useOrderBookers } from '../../order-bookers/api/queries';
import dayjs from 'dayjs';

export const OrderTable: React.FC<OrderTableProps> = ({
  data,
  loading,
  onEdit,
  onDelete,
  onView,
}) => {
  const { data: orderBookers } = useOrderBookers();

  const getOrderBookerName = (orderBookerId: string) => {
    const orderBooker = orderBookers?.find(ob => ob.id === orderBookerId);
    return orderBooker?.name || orderBookerId;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'supplied': return 'blue';
      case 'completed': return 'green';
      default: return 'default';
    }
  };

  const columns: ColumnsType<Order> = [
    {
      title: 'Order Date',
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: (date: Date) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.orderDate).unix() - dayjs(b.orderDate).unix(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Order Booker',
      dataIndex: 'orderBookerId',
      key: 'orderBookerId',
      render: (orderBookerId: string) => getOrderBookerName(orderBookerId),
      sorter: (a, b) => getOrderBookerName(a.orderBookerId).localeCompare(getOrderBookerName(b.orderBookerId)),
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => (
        <Tag color="blue">
          <FormatNumber value={amount} prefix="Rs. " decimalPlaces={2} />
        </Tag>
      ),
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: 'Total Cost',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (cost: number) => (
        <span style={{ color: '#8c8c8c' }}>
          <FormatNumber value={cost} prefix="Rs. " decimalPlaces={2} />
        </span>
      ),
      sorter: (a, b) => a.totalCost - b.totalCost,
    },
    {
      title: 'Profit',
      dataIndex: 'totalProfit',
      key: 'totalProfit',
      render: (profit: number, record: Order) => {
        const marginPercentage = record.totalCost > 0 ? (profit / record.totalCost) * 100 : 0;
        const color = marginPercentage < 10 ? 'red' : marginPercentage < 20 ? 'orange' : 'green';

        return (
          <Tooltip title={`Margin: ${marginPercentage.toFixed(2)}%`}>
            <Tag color={color}>
              <FormatNumber value={profit} prefix="Rs. " decimalPlaces={2} />
            </Tag>
          </Tooltip>
        );
      },
      sorter: (a, b) => a.totalProfit - b.totalProfit,
    },
    {
      title: 'Cartons',
      dataIndex: 'totalCartons',
      key: 'totalCartons',
      render: (cartons: number) => cartons.toFixed(1),
      sorter: (a, b) => a.totalCartons - b.totalCartons,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      ),
      sorter: (a, b) => a.status.localeCompare(b.status),
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Supplied', value: 'supplied' },
        { text: 'Completed', value: 'completed' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Supply Date',
      dataIndex: 'supplyDate',
      key: 'supplyDate',
      render: (date: Date | null) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
      sorter: (a, b) => {
        if (!a.supplyDate && !b.supplyDate) return 0;
        if (!a.supplyDate) return 1;
        if (!b.supplyDate) return -1;
        return dayjs(a.supplyDate).unix() - dayjs(b.supplyDate).unix();
      },
    },
    {
      title: 'Returns',
      key: 'returns',
      render: (_, record: Order) => {
        if (record.returnAmount > 0) {
          return (
            <Tooltip title={`${record.returnCartons.toFixed(1)} cartons`}>
              <Tag color="red">
                <FormatNumber value={record.returnAmount} prefix="Rs. " decimalPlaces={2} />
              </Tag>
            </Tooltip>
          );
        }
        return '-';
      },
      sorter: (a, b) => a.returnAmount - b.returnAmount,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Order) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => onView(record)}
            title="View Details"
          />
          <TableActions 
            onEdit={() => onEdit(record)} 
            onDelete={() => onDelete(record)} 
          />
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data || []}
      rowKey="id"
      loading={loading}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} orders`,
      }}
      scroll={{ x: 1200 }}
    />
  );
};
