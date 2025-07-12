import React, { useState, useEffect } from 'react';
import { Table, Select, InputNumber, Button, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { OrderItemsTableProps, CreateOrderItemRequest } from '../types';
import type { ColumnsType } from 'antd/es/table';
import type { OrderItem } from '../types';
import { useOrderItems } from '../api/queries';
import { useCreateOrderItem, useUpdateOrderItem, useDeleteOrderItem } from '../api/mutations';
import { useProducts } from '../../products/api/queries';
import { FormatNumber } from '../../../shared/components';

const { Option } = Select;

interface EditableOrderItem extends OrderItem {
  isEditing?: boolean;
  isNew?: boolean;
}

export const OrderItemsTable: React.FC<OrderItemsTableProps> = ({
  orderId,
  onItemAdd,
  onItemUpdate,
  onItemDelete,
  editable = false, // Changed default to false since this is view-only
}) => {
  const [editingItems, setEditingItems] = useState<EditableOrderItem[]>([]);
  const [newItem, setNewItem] = useState<Partial<CreateOrderItemRequest>>({});

  const { data: orderItems, isLoading } = useOrderItems(orderId);
  const { data: products } = useProducts();
  const createItemMutation = useCreateOrderItem();
  const updateItemMutation = useUpdateOrderItem();
  const deleteItemMutation = useDeleteOrderItem();

  useEffect(() => {
    if (orderItems) {
      setEditingItems(orderItems.map(item => ({ ...item, isEditing: false })));
    }
  }, [orderItems]);

  const handleProductSelect = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (product) {
      setNewItem({
        productId,
        cartons: 1,
        costPrice: product.costPrice,
        sellPrice: product.sellPrice,
      });
    }
  };

  const handleAddItem = async () => {
    if (!newItem.productId || !newItem.cartons || !newItem.costPrice || !newItem.sellPrice) {
      message.error('Please fill all required fields');
      return;
    }

    try {
      await createItemMutation.mutateAsync({
        orderId,
        data: {
          productId: newItem.productId,
          cartons: newItem.cartons,
          costPrice: newItem.costPrice,
          sellPrice: newItem.sellPrice,
        }
      });
      setNewItem({});
      onItemAdd(newItem as CreateOrderItemRequest);
      message.success('Item added successfully');
    } catch (error) {
      message.error('Failed to add item');
    }
  };

  const handleEditItem = (itemId: string) => {
    setEditingItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, isEditing: true } : item
      )
    );
  };

  const handleSaveItem = async (itemId: string, item: EditableOrderItem) => {
    try {
      await updateItemMutation.mutateAsync({
        id: itemId,
        data: {
          cartons: item.cartons,
          sellPrice: item.sellPrice,
          returnCartons: item.returnCartons,
        }
      });
      setEditingItems(prev => 
        prev.map(i => 
          i.id === itemId ? { ...i, isEditing: false } : i
        )
      );
      onItemUpdate(itemId, {
        cartons: item.cartons,
        sellPrice: item.sellPrice,
        returnCartons: item.returnCartons,
      });
      message.success('Item updated successfully');
    } catch (error) {
      message.error('Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteItemMutation.mutateAsync({ id: itemId, orderId });
      onItemDelete(itemId);
      message.success('Item deleted successfully');
    } catch (error) {
      message.error('Failed to delete item');
    }
  };

  const getProductName = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    return product?.name || productId;
  };

  const columns: ColumnsType<EditableOrderItem> = [
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
        // For view-only mode, just display the cartons value
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
      render: (price: number, record: EditableOrderItem) => {
        if (record.isEditing && editable) {
          return (
            <InputNumber
              value={price}
              min={0}
              step={0.01}
              precision={2}
              formatter={(value) => `Rs. ${value}`}
              parser={(value) => parseFloat(value?.replace(/Rs\.\s?|(,*)/g, '') || '0')}
              onChange={(value) => {
                setEditingItems(prev => 
                  prev.map(item => 
                    item.id === record.id ? { ...item, sellPrice: value || 0 } : item
                  )
                );
              }}
            />
          );
        }
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
      render: (returnCartons: number, record: EditableOrderItem) => {
        if (record.isEditing && editable) {
          return (
            <InputNumber
              value={returnCartons}
              min={0}
              max={record.cartons}
              onChange={(value) => {
                setEditingItems(prev => 
                  prev.map(item => 
                    item.id === record.id ? { ...item, returnCartons: value || 0 } : item
                  )
                );
              }}
            />
          );
        }
        return returnCartons || 0;
      },
    },
    ...(editable ? [{
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: EditableOrderItem) => (
        <Space size="small">
          {record.isEditing ? (
            <Button
              type="link"
              size="small"
              onClick={() => handleSaveItem(record.id, record)}
              loading={updateItemMutation.isPending}
            >
              Save
            </Button>
          ) : (
            <Button
              type="link"
              size="small"
              onClick={() => handleEditItem(record.id)}
            >
              Edit
            </Button>
          )}
          <Popconfirm
            title="Are you sure you want to delete this item?"
            onConfirm={() => handleDeleteItem(record.id)}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deleteItemMutation.isPending}
            />
          </Popconfirm>
        </Space>
      ),
    }] : []),
  ];

  const newItemRow = editable ? (
    <div style={{ padding: '16px 0', borderTop: '1px solid #f0f0f0' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Add New Item</div>
        <Space wrap>
          <Select
            placeholder="Select Product"
            value={newItem.productId}
            onChange={handleProductSelect}
            style={{ width: 200 }}
            showSearch
            optionFilterProp="children"
          >
            {products?.map(product => (
              <Option key={product.id} value={product.id}>
                {product.name}
              </Option>
            ))}
          </Select>
          <InputNumber
            placeholder="Cartons"
            value={newItem.cartons}
            min={1}
            onChange={(value) => setNewItem(prev => ({ ...prev, cartons: value || 1 }))}
          />
          <InputNumber
            placeholder="Cost Price"
            value={newItem.costPrice}
            min={0}
            step={0.01}
            precision={2}
            formatter={(value) => `Rs. ${value}`}
            parser={(value) => parseFloat(value?.replace(/Rs\.\s?|(,*)/g, '') || '0')}
            onChange={(value) => setNewItem(prev => ({ ...prev, costPrice: value || 0 }))}
          />
          <InputNumber
            placeholder="Sell Price"
            value={newItem.sellPrice}
            min={0}
            step={0.01}
            precision={2}
            formatter={(value) => `Rs. ${value}`}
            parser={(value) => parseFloat(value?.replace(/Rs\.\s?|(,*)/g, '') || '0')}
            onChange={(value) => setNewItem(prev => ({ ...prev, sellPrice: value || 0 }))}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddItem}
            loading={createItemMutation.isPending}
          >
            Add Item
          </Button>
        </Space>
      </Space>
    </div>
  ) : null;

  return (
    <div>
      <Table
        columns={columns}
        dataSource={editingItems || []}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        size="small"
      />
      {newItemRow}
    </div>
  );
};
