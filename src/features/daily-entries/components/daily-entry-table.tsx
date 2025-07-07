import React from 'react';
import { Table, Button, Space, Tag, Popconfirm, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, CalendarOutlined } from '@ant-design/icons';
import { useTable } from '../../../shared/hooks/use-table';
import dayjs from 'dayjs';
import type { DailyEntry, DailyEntryWithOrderBooker } from '../types';

const { Text } = Typography;

interface DailyEntryTableProps {
  data: DailyEntryWithOrderBooker[];
  loading?: boolean;
  onEdit: (dailyEntry: DailyEntry) => void;
  onDelete: (dailyEntry: DailyEntry) => void;
}

export const DailyEntryTable: React.FC<DailyEntryTableProps> = ({
  data,
  loading,
  onEdit,
  onDelete,
}) => {
  const { tableProps } = useTable({
    data,
    searchableFields: ['notes'],
  });

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: true,
      render: (date: Date) => (
        <Space>
          <CalendarOutlined />
          {dayjs(date).format('MMM DD, YYYY')}
        </Space>
      ),
    },
    {
      title: 'Order Booker',
      key: 'orderBooker',
      render: (record: DailyEntryWithOrderBooker) => (
        <div>
          <div>{record.orderBooker?.name}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.orderBooker?.nameUrdu}
          </Text>
        </div>
      ),
    },
    {
      title: 'Sales',
      dataIndex: 'sales',
      key: 'sales',
      sorter: true,
      render: (value: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          {value.toLocaleString()}
        </Text>
      ),
    },
    {
      title: 'Returns',
      dataIndex: 'returns',
      key: 'returns',
      sorter: true,
      render: (value: number) => (
        <Text style={{ color: '#ff4d4f' }}>
          {value.toLocaleString()}
        </Text>
      ),
    },
    {
      title: 'Net Sales',
      dataIndex: 'netSales',
      key: 'netSales',
      sorter: true,
      render: (value: number) => (
        <Text strong style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {value.toLocaleString()}
        </Text>
      ),
    },
    {
      title: 'Cartons',
      key: 'cartons',
      render: (record: DailyEntry) => (
        <div>
          <div>
            <Text>Total: {record.totalCarton}</Text>
          </div>
          <div>
            <Text type="secondary">Returns: {record.returnCarton}</Text>
          </div>
          <div>
            <Text strong>Net: {record.totalCarton - record.returnCarton}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Return Rate',
      key: 'returnRate',
      render: (record: DailyEntry) => {
        const salesReturnRate = record.sales > 0 ? (record.returns / record.sales) * 100 : 0;
        const cartonReturnRate = record.totalCarton > 0 ? (record.returnCarton / record.totalCarton) * 100 : 0;
        
        return (
          <div>
            <div>
              <Tag color={salesReturnRate > 20 ? 'red' : salesReturnRate > 10 ? 'orange' : 'green'}>
                Sales: {salesReturnRate.toFixed(1)}%
              </Tag>
            </div>
            <div style={{ marginTop: 4 }}>
              <Tag color={cartonReturnRate > 20 ? 'red' : cartonReturnRate > 10 ? 'orange' : 'green'}>
                Cartons: {cartonReturnRate.toFixed(1)}%
              </Tag>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes: string) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {notes || '-'}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (record: DailyEntry) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this daily entry?"
            onConfirm={() => onDelete(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      {...tableProps}
      columns={columns}
      loading={loading}
      rowKey="id"
      size="small"
      scroll={{ x: 1000 }}
    />
  );
};
