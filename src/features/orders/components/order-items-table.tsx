import React, { useState } from 'react';
import { Table, Popconfirm, Button, Space, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { FormatNumber } from '../../../shared/components';
import { OrderItemDialog } from './order-item-dialog';

const { Text } = Typography;

export interface OrderItemData {
  key: string;
  productId?: string;
  productName?: string;
  cartons?: number;
  costPrice?: number;
  sellPrice?: number;
  totalCost?: number;
  totalAmount?: number;
  profit?: number;
  returnCartons?: number;
  returnAmount?: number;
}

interface OrderItemsTableProps {
  items: OrderItemData[];
  onItemsChange: (items: OrderItemData[]) => void;
  loading?: boolean;
}

export const OrderItemsTable: React.FC<OrderItemsTableProps> = ({
  items,
  onItemsChange,
  loading = false,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OrderItemData | null>(null);

  const handleAddItem = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  const handleEditItem = (item: OrderItemData) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleDeleteItem = (key: string) => {
    const newItems = items.filter(item => item.key !== key);
    onItemsChange(newItems);
  };

  const handleSaveItem = (item: OrderItemData) => {
    if (editingItem) {
      // Update existing item
      const newItems = items.map(existingItem => 
        existingItem.key === editingItem.key ? item : existingItem
      );
      onItemsChange(newItems);
    } else {
      // Add new item
      onItemsChange([...items, item]);
    }
    setDialogOpen(false);
    setEditingItem(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
  };

  const columns = [
    {
      title: 'Product',
      dataIndex: 'productName',
      width: '25%',
      render: (text: string) => text || 'Unknown Product',
    },
    {
      title: 'Cartons',
      dataIndex: 'cartons',
      width: '10%',
      align: 'center' as const,
      render: (value: number) => value || 0,
    },
    {
      title: 'Prices',
      children: [
        {
          title: 'Cost',
          dataIndex: 'costPrice',
          width: '10%',
          align: 'right' as const,
          render: (value: number) => value ? <FormatNumber value={value} prefix="Rs. " /> : 'Rs. 0',
        },
        {
          title: 'Sell',
          dataIndex: 'sellPrice',
          width: '10%',
          align: 'right' as const,
          render: (value: number) => value ? <FormatNumber value={value} prefix="Rs. " /> : 'Rs. 0',
        },
      ],
    },
    {
      title: 'Totals',
      children: [
        {
          title: 'Cost',
          dataIndex: 'totalCost',
          width: '12%',
          align: 'right' as const,
          render: (value: number) => value ? <FormatNumber value={value} prefix="Rs. " /> : 'Rs. 0',
        },
        {
          title: 'Amount',
          dataIndex: 'totalAmount',
          width: '12%',
          align: 'right' as const,
          render: (value: number) => value ? <FormatNumber value={value} prefix="Rs. " /> : 'Rs. 0',
        },
        {
          title: 'Profit',
          dataIndex: 'profit',
          width: '10%',
          align: 'right' as const,
          render: (value: number) => {
            const color = value >= 0 ? '#52c41a' : '#ff4d4f';
            return (
              <span style={{ color }}>
                {value ? <FormatNumber value={value} prefix="Rs. " /> : 'Rs. 0'}
              </span>
            );
          },
        },
      ],
    },
    {
      title: 'Return Cartons',
      dataIndex: 'returnCartons',
      width: '11%',
      align: 'center' as const,
      render: (value: number) => value || 0,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '10%',
      align: 'center' as const,
      render: (_: any, record: OrderItemData) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditItem(record)}
            size="small"
            title="Edit Item"
          />
          <Popconfirm
            title="Delete Item"
            description="Are you sure you want to delete this item?"
            onConfirm={() => handleDeleteItem(record.key)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              type="link" 
              danger
              size="small"
              icon={<DeleteOutlined />}
              title="Delete Item"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Calculate totals
  const totalCartons = items.reduce((sum, item) => sum + (item.cartons || 0), 0);
  const totalCost = items.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  const totalAmount = items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  const totalProfit = totalAmount - totalCost;
  const totalReturnCartons = items.reduce((sum, item) => sum + (item.returnCartons || 0), 0);

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddItem}
          size="large"
        >
          Add Order Item
        </Button>
      </div>

      <Table<OrderItemData>
        columns={columns}
        dataSource={items}
        rowKey="key"
        pagination={false}
        loading={loading}
        bordered
        scroll={{ x: 800 }}
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
              <Table.Summary.Cell index={0}>
                <Text strong>Total</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="center">
                <Text strong>{totalCartons}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right">
                {/* Cost Price column - empty for totals */}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} align="right">
                {/* Sell Price column - empty for totals */}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="right">
                <Text strong>
                  <FormatNumber value={totalCost} prefix="Rs. " />
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} align="right">
                <Text strong>
                  <FormatNumber value={totalAmount} prefix="Rs. " />
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6} align="right">
                <Text strong style={{ color: totalProfit >= 0 ? '#52c41a' : '#ff4d4f' }}>
                  <FormatNumber value={totalProfit} prefix="Rs. " />
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={7} align="center">
                <Text strong>{totalReturnCartons}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={8} align="center">
                {/* Actions column - empty for totals */}
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
        locale={{
          emptyText: (
            <div style={{ padding: '40px 0' }}>
              <Text type="secondary">No order items added yet</Text>
              <br />
              <Button 
                type="link" 
                icon={<PlusOutlined />} 
                onClick={handleAddItem}
                style={{ marginTop: 8 }}
              >
                Add your first item
              </Button>
            </div>
          ),
        }}
      />

      <OrderItemDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveItem}
        editingItem={editingItem}
        title={editingItem ? 'Edit Order Item' : 'Add Order Item'}
      />
    </>
  );
};
