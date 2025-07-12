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
      summary={(pageData) => {
        if (pageData.length === 0) return null;
        
        const totalAmount = pageData.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalCost = pageData.reduce((sum, order) => sum + order.totalCost, 0);
        const totalProfit = pageData.reduce((sum, order) => sum + order.totalProfit, 0);
        const totalCartons = pageData.reduce((sum, order) => sum + order.totalCartons, 0);
        const totalReturnAmount = pageData.reduce((sum, order) => sum + order.returnAmount, 0);

        return (
          <Table.Summary fixed>
            <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
              <Table.Summary.Cell index={0}>Totals</Table.Summary.Cell>
              <Table.Summary.Cell index={1}></Table.Summary.Cell>
              <Table.Summary.Cell index={2}>
                <Tag color="blue">
                  <FormatNumber value={totalAmount} prefix="Rs. " decimalPlaces={2} />
                </Tag>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3}>
                <FormatNumber value={totalCost} prefix="Rs. " decimalPlaces={2} />
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4}>
                <Tag color={totalProfit >= 0 ? 'green' : 'red'}>
                  <FormatNumber value={totalProfit} prefix="Rs. " decimalPlaces={2} />
                </Tag>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5}>{totalCartons.toFixed(1)}</Table.Summary.Cell>
              <Table.Summary.Cell index={6}>
                {totalReturnAmount > 0 && (
                  <Tag color="red">
                    <FormatNumber value={totalReturnAmount} prefix="Rs. " decimalPlaces={2} />
                  </Tag>
                )}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={7}></Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        );
      }}
    />
  );
};
