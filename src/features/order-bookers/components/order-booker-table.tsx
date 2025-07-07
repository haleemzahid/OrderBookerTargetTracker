import React from 'react';
import { Table, Button, Space, Tag, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import { useTable } from '../../../shared/hooks/use-table';
import type { OrderBooker } from '../types';

interface OrderBookerTableProps {
  data: OrderBooker[];
  loading?: boolean;
  onEdit: (orderBooker: OrderBooker) => void;
  onDelete: (orderBooker: OrderBooker) => void;
}

export const OrderBookerTable: React.FC<OrderBookerTableProps> = ({
  data,
  loading,
  onEdit,
  onDelete,
}) => {
  const { tableProps } = useTable({
    data,
    searchableFields: ['name', 'nameUrdu', 'phone', 'email'],
  });

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'Name (Urdu)',
      dataIndex: 'nameUrdu',
      key: 'nameUrdu',
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (record: OrderBooker) => (
        <Space direction="vertical" size="small">
          <Space>
            <PhoneOutlined />
            {record.phone}
          </Space>
          {record.email && (
            <Space>
              <MailOutlined />
              {record.email}
            </Space>
          )}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: OrderBooker) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this order booker?"
            onConfirm={() => onDelete(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />}>
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
    />
  );
};
