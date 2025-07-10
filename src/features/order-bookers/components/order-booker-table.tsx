import React from 'react';
import { Table, Space, Tag} from 'antd';
import { PhoneOutlined, MailOutlined } from '@ant-design/icons';
import { useTable } from '../../../shared/hooks/use-table';
import type { OrderBooker } from '../types';
import { TableActions } from '../../../shared/components';

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
      render: (_: any, record: OrderBooker) => (
             <TableActions onEdit={() => onEdit(record)} onDelete={() => onDelete(record)} />
           ),
    },
  ];

  return (
    <Table
       {...tableProps}
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        size="small"
        scroll={{ x: 1000 }}
    />
  );
};
