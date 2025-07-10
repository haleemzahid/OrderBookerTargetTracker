import React from 'react';
import { Table, Tag, Tooltip } from 'antd';
import type { ProductTableProps } from '../types';
import type { ColumnsType } from 'antd/es/table';
import type { Product } from '../types';
import { TableActions, FormatNumber } from '../../../shared/components';


export const ProductTable: React.FC<ProductTableProps> = ({
  data,
  loading,
  onEdit,
  onDelete,
  companyFilter = false,
}) => {
  const columns: ColumnsType<Product> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Cost Price',
      dataIndex: 'costPrice',
      key: 'costPrice',
      render: (price: number) => (
        <span style={{ color: '#8c8c8c' }}>
          <FormatNumber value={price} prefix="Rs. " decimalPlaces={2} />
        </span>
      ),
      sorter: (a, b) => a.costPrice - b.costPrice,
    },
    {
      title: 'Sell Price',
      dataIndex: 'sellPrice',
      key: 'sellPrice',
      render: (price: number) => (
        <Tag color="blue">
          <FormatNumber value={price} prefix="Rs. " decimalPlaces={2} />
        </Tag>
      ),
      sorter: (a, b) => a.sellPrice - b.sellPrice,
    },
    {
      title: 'Profit Margin',
      key: 'margin',
      render: (_, record) => {
        const margin = record.sellPrice - record.costPrice;
        const marginPercentage = (margin / record.costPrice) * 100;
        const color = marginPercentage < 10 ? 'red' : marginPercentage < 20 ? 'orange' : 'green';

        return (
          <Tooltip title={
            <>
              <FormatNumber value={margin} prefix="Rs. " decimalPlaces={2} /> 
              {` (${marginPercentage.toFixed(2)}%)`}
            </>
          }>
            <Tag color={color}>Rs.{margin} ({marginPercentage.toFixed(1)})%</Tag>
          </Tooltip>
        );
      },
      sorter: (a, b) => {
        const marginA = (a.sellPrice - a.costPrice) / a.costPrice;
        const marginB = (b.sellPrice - b.costPrice) / b.costPrice;
        return marginA - marginB;
      },
    },
    {
      title: 'Units/Carton',
      dataIndex: 'unitPerCarton',
      key: 'unitPerCarton',
      render: (units: number) => <span>{units}</span>,
      sorter: (a, b) => a.unitPerCarton - b.unitPerCarton,
    },
    ...(companyFilter
      ? [
          {
            title: 'Company',
            dataIndex: ['company', 'name'],
            key: 'company',
            render: (_: any, record: Product) => <span>{record.companyId}</span>,
          },
        ]
      : []),
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Product) => (
        <TableActions onEdit={() => onEdit(record)} onDelete={() => onDelete(record)} />
      ),
    },
  ];

  return (
    <Table
      columns={columns.filter((col) => !(companyFilter === false && col.key === 'company'))}
      dataSource={data || []}
      rowKey="id"
      loading={loading}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} products`,
      }}
    />
  );
};
