import React, { useState } from 'react';
import { Table, Tag, Tooltip, Button, Space, Modal, message, Alert } from 'antd';
import { EyeOutlined, SendOutlined } from '@ant-design/icons';
import type { OrderTableProps } from '../types';
import type { ColumnsType } from 'antd/es/table';
import type { Order } from '../types';
import { TableActions, FormatNumber } from '../../../shared/components';
import { useOrderBookers } from '../../order-bookers/api/queries';
import { useConfirmAndShipOrder } from '../api/mutations';
import dayjs from 'dayjs';

export const OrderTable: React.FC<OrderTableProps> = ({
  data,
  loading,
  onEdit,
  onDelete,
  onView,
  onShip,
}) => {
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [shippingOrder, setShippingOrder] = useState<Order | null>(null);
  const { data: orderBookers } = useOrderBookers();
  const confirmAndShipMutation = useConfirmAndShipOrder();

  const getOrderBookerName = (orderBookerId: string) => {
    const orderBooker = orderBookers?.find(ob => ob.id === orderBookerId);
    return orderBooker?.name || orderBookerId;
  };

  const handleConfirmAndShip = async () => {
    if (!shippingOrder) return;

    try {
      await confirmAndShipMutation.mutateAsync(shippingOrder.id);
      setConfirmModalVisible(false);
      setShippingOrder(null);
      message.success('Order confirmed and shipped successfully!');
      onShip?.(shippingOrder);
    } catch (error) {
      message.error('Failed to confirm and ship order. Please try again.');
      console.error('Error confirming and shipping order:', error);
    }
  };

  const handleShipClick = (order: Order) => {
    setShippingOrder(order);
    setConfirmModalVisible(true);
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const getStatusConfig = (status: string) => {
          switch (status) {
            case 'pending':
              return { color: 'orange', text: 'Pending' };
            case 'shipped':
              return { color: 'blue', text: 'Shipped' };
            case 'completed':
              return { color: 'green', text: 'Completed' };
            default:
              return { color: 'default', text: status };
          }
        };
        
        const config = getStatusConfig(status);
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      sorter: (a, b) => a.status.localeCompare(b.status),
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Shipped', value: 'shipped' },
        { text: 'Completed', value: 'completed' },
      ],
      onFilter: (value, record) => record.status === value,
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
          {record.status === 'pending' && (
            <Button
              type="text"
              icon={<SendOutlined />}
              onClick={() => handleShipClick(record)}
              title="Confirm & Ship"
              style={{ color: '#1890ff' }}
            />
          )}
          <TableActions 
            onEdit={() => onEdit(record)} 
            onDelete={() => onDelete(record)} 
          />
        </Space>
      ),
    },
  ];

  return (
    <>
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
                <Table.Summary.Cell index={2}></Table.Summary.Cell>
                <Table.Summary.Cell index={3}>
                  <Tag color="blue">
                    <FormatNumber value={totalAmount} prefix="Rs. " decimalPlaces={2} />
                  </Tag>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4}>
                  <FormatNumber value={totalCost} prefix="Rs. " decimalPlaces={2} />
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5}>
                  <Tag color={totalProfit >= 0 ? 'green' : 'red'}>
                    <FormatNumber value={totalProfit} prefix="Rs. " decimalPlaces={2} />
                  </Tag>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6}>{totalCartons.toFixed(1)}</Table.Summary.Cell>
                <Table.Summary.Cell index={7}>
                  {totalReturnAmount > 0 && (
                    <Tag color="red">
                      <FormatNumber value={totalReturnAmount} prefix="Rs. " decimalPlaces={2} />
                    </Tag>
                  )}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8}></Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          );
        }}
      />

      <OrderShipConfirmModal
        visible={confirmModalVisible}
        order={shippingOrder}
        loading={confirmAndShipMutation.isPending}
        onConfirm={handleConfirmAndShip}
        onCancel={() => {
          setConfirmModalVisible(false);
          setShippingOrder(null);
        }}
      />
    </>
  );
};

const OrderShipConfirmModal: React.FC<{
  visible: boolean;
  order: Order | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ visible, order, loading, onConfirm, onCancel }) => (
  <Modal
    title="Confirm Order Shipment"
    open={visible}
    onOk={onConfirm}
    onCancel={onCancel}
    okText="Confirm & Ship"
    okButtonProps={{ 
      loading,
      icon: <SendOutlined />
    }}
    cancelText="Cancel"
    width={500}
  >
    <Space direction="vertical" style={{ width: '100%' }}>
      <Alert
        message="Important"
        description="This action will:"
        type="warning"
        showIcon
      />
      <ul style={{ marginLeft: 20, marginBottom: 16 }}>
        <li>Mark the order as <strong>shipped</strong></li>
        <li>Automatically deduct stock for all order items</li>
        <li>Create stock transaction records for audit trail</li>
        <li>This action <strong>cannot be undone</strong></li>
      </ul>
      {order && (
        <Alert
          message={`Order for ${order.totalCartons.toFixed(1)} cartons worth Rs. ${order.totalAmount.toLocaleString()}`}
          type="info"
          showIcon
        />
      )}
    </Space>
  </Modal>
);
