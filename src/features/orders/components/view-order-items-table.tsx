import React from 'react';
import { Table } from 'antd';
import type { ViewOrderItemsTableProps } from '../types';
import type { ColumnsType } from 'antd/es/table';
import type { OrderItem } from '../types';
import { useOrderItems } from '../api/queries';
import { useProducts } from '../../products/api/queries';
import { FormatNumber } from '../../../shared/components';


export const ViewOrderItemsTable: React.FC<ViewOrderItemsTableProps> = ({
  orderId,
}) => {


  const { data: orderItems, isLoading } = useOrderItems(orderId);
  const { data: products } = useProducts();

  const getProductName = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    return product?.name || productId;
  };

  const columns: ColumnsType<OrderItem> = [
    {
      title: 'Product',
      dataIndex: 'productId',
      key: 'productId',
      render: (productId: string) => getProductName(productId),
    },
    {
      title: 'Cartons',
      dataIndex: 'cartons',
      key: 'cartons',
      render: (cartons: number) => {
        return cartons.toFixed(2);
      },
    },
    {
      title: 'Cost Price',
      dataIndex: 'costPrice',
      key: 'costPrice',
      render: (price: number) => (
        <FormatNumber value={price} prefix="Rs. " decimalPlaces={2} />
      ),
    },
    {
      title: 'Sell Price',
      dataIndex: 'sellPrice',
      key: 'sellPrice',
      render: (price: number) => {
        return <FormatNumber value={price} prefix="Rs. " decimalPlaces={2} />;
      },
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => (
        <FormatNumber value={amount} prefix="Rs. " decimalPlaces={2} />
      ),
    },
    {
      title: 'Profit',
      dataIndex: 'profit',
      key: 'profit',
      render: (profit: number) => (
        <FormatNumber value={profit} prefix="Rs. " decimalPlaces={2} />
      ),
    },
    {
      title: 'Return Cartons',
      dataIndex: 'returnCartons',
      key: 'returnCartons',
      render: (returnCartons: number) => {
        return returnCartons || 0;
      },
    },
  ];


  return (
    <div>
      <Table
        columns={columns}
        dataSource={orderItems || []}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        size="small"
      />
    </div>
  );
};
