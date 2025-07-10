import React from 'react';
import { Table, Space} from 'antd';
import { PhoneOutlined, MailOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useTable } from '../../../shared/hooks/use-table';
import type { Company } from '../types';
import { TableActions } from '../../../shared/components';

interface CompanyTableProps {
  data: Company[];
  loading?: boolean;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
}

export const CompanyTable: React.FC<CompanyTableProps> = ({
  data,
  loading,
  onEdit,
  onDelete,
}) => {
  const { tableProps } = useTable({
    data,
    searchableFields: ['name', 'email', 'phone', 'address'],
  });

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (record: Company) => (
        <Space direction="vertical" size="small">
          {record.phone && (
            <Space>
              <PhoneOutlined />
              {record.phone}
            </Space>
          )}
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
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      render: (address: string) => 
        address ? (
          <Space>
            <EnvironmentOutlined />
            {address}
          </Space>
        ) : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Company) => (
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
