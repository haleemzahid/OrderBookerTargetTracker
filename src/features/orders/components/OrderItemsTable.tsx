import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Table, Select, Popconfirm, Button } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import { useProducts } from '../../products/api/queries';
import { FormatNumber } from '../../../shared/components';
import type { Product } from '../../products/types';

const { Option } = Select;

export interface OrderItemData {
  key: string;
  productId?: string;
  productName?: string;
  quantity?: number;
  costPrice?: number;
  sellPrice?: number;
  totalCost?: number;
  totalAmount?: number;
  profit?: number;
  cartons?: number;
  returnQuantity?: number;
  returnAmount?: number;
  returnCartons?: number;
  isNew?: boolean;
}

interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string;
  title: any;
  inputType: 'number' | 'text' | 'select';
  record: OrderItemData;
  index: number;
  products?: Product[];
  onCellBlur?: (key: React.Key) => void;
}

const EditableCell: React.FC<React.PropsWithChildren<EditableCellProps>> = ({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  index,
  children,
  products = [],
  onCellBlur,
  ...restProps
}) => {
  let inputNode: React.ReactNode;

  if (inputType === 'number') {
    inputNode = (
      <InputNumber 
        style={{ width: '100%' }} 
        min={0} 
        step={0.01}
        onBlur={() => onCellBlur?.(record.key)}
      />
    );
  } else if (inputType === 'select') {
    inputNode = (
      <Select
        placeholder="Select Product"
        style={{ width: '100%' }}
        showSearch
        optionFilterProp="children"
        filterOption={(input, option) =>
          (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
        }
        onBlur={() => onCellBlur?.(record.key)}
      >
        {products.map(product => (
          <Option key={product.id} value={product.id}>
            {product.name}
          </Option>
        ))}
      </Select>
    );
  } else {
    inputNode = (
      <Input 
        onBlur={() => onCellBlur?.(record.key)}
      />
    );
  }

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[
            {
              required: dataIndex === 'productId' || dataIndex === 'quantity',
              message: `Please Input ${title}!`,
            },
          ]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

interface OrderItemsTableProps {
  items: OrderItemData[];
  onItemsChange: (items: OrderItemData[]) => void;
  loading?: boolean;
  allowReturns?: boolean;
}

export const OrderItemsTable: React.FC<OrderItemsTableProps> = ({
  items,
  onItemsChange,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [data, setData] = useState<OrderItemData[]>(items);
  const [editingKey, setEditingKey] = useState('');
  
  const { data: products = [], isLoading: isLoadingProducts } = useProducts();

  const save = async (key: React.Key) => {
    try {
      const row = await form.validateFields();
      const product = products.find(p => p.id === row.productId);
      
      if (!product) {
        return;
      }

      const calculatedRow = calculateValues(row, row.productId);
      const newData = [...data];
      const index = newData.findIndex((item) => key === item.key);
      
      if (index > -1) {
        const item = newData[index];
        const updatedItem = {
          ...item,
          ...calculatedRow,
          productName: product.name,
          isNew: false,
        };
        newData.splice(index, 1, updatedItem);
        
        // If this was a new row, add another empty row and auto-edit it
        if (item.isNew) {
          const newEmptyRow: OrderItemData = {
            key: `new-${Date.now()}`,
            isNew: true,
          };
          newData.push(newEmptyRow);
          
          // Auto-edit the new empty row
          setTimeout(() => {
            setEditingKey(newEmptyRow.key);
            form.setFieldsValue({
              productId: '',
              quantity: 1,
              costPrice: 0,
              sellPrice: 0,
              returnQuantity: 0,
            });
          }, 0);
        } else {
          setEditingKey('');
        }
        
        setData(newData);
        onItemsChange(newData.filter(item => !item.isNew && item.productId));
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
    }
  };

  // Handle clicks outside the table to save editing row
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isEditableElement = target.closest('.ant-form-item') || 
                               target.closest('input') || 
                               target.closest('.ant-select') ||
                               target.closest('.ant-table');
      
      if (!isEditableElement && editingKey) {
        save(editingKey);
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [editingKey]);

  useEffect(() => {
    setData(items);
  }, [items]);

  useEffect(() => {
    // Always ensure there's an empty row for adding new items
    if (data.length === 0 || !data[data.length - 1].isNew) {
      const newEmptyRow: OrderItemData = {
        key: `new-${Date.now()}`,
        isNew: true,
      };
      const newData = [...data, newEmptyRow];
      setData(newData);
      
      // Auto-edit the new empty row
      setTimeout(() => {
        setEditingKey(newEmptyRow.key);
        form.setFieldsValue({
          productId: '',
          quantity: 1,
          costPrice: 0,
          sellPrice: 0,
          returnQuantity: 0,
        });
      }, 0);
    }
  }, [data, form]);

  const isEditing = (record: OrderItemData) => record.key === editingKey;

  const edit = (record: Partial<OrderItemData> & { key: React.Key }) => {
    const product = products.find(p => p.id === record.productId);
    const defaultValues = {
      productId: record.productId || '',
      quantity: record.quantity || 1,
      costPrice: record.costPrice || 0,
      sellPrice: record.sellPrice || 0,
      returnQuantity: record.returnQuantity || 0,
    };
    
    // If product exists, use its cost and sell prices as defaults
    if (product) {
      defaultValues.costPrice = product.costPrice;
      defaultValues.sellPrice = product.sellPrice;
    }
    
    form.setFieldsValue(defaultValues);
    setEditingKey(record.key);
  };

  const calculateValues = (values: any, productId?: string) => {
    const product = products.find(p => p.id === productId);
    const quantity = values.quantity || 0;
    const costPrice = values.costPrice || (product?.costPrice || 0);
    const sellPrice = values.sellPrice || (product?.sellPrice || 0);
    const returnQuantity = values.returnQuantity || 0;
    const unitPerCarton = product?.unitPerCarton || 1;

    const totalCost = quantity * costPrice;
    const totalAmount = quantity * sellPrice;
    const profit = totalAmount - totalCost;
    const cartons = Math.ceil(quantity / unitPerCarton);
    const returnAmount = returnQuantity * sellPrice;
    const returnCartons = Math.ceil(returnQuantity / unitPerCarton);

    return {
      ...values,
      costPrice,
      sellPrice,
      totalCost,
      totalAmount,
      profit,
      cartons,
      returnAmount,
      returnCartons,
    };
  };

  const handleBlur = async (key: React.Key) => {
    // Auto-save on blur if the row has valid data
    try {
      const values = form.getFieldsValue();
      if (values.productId && values.quantity) {
        await save(key);
      }
    } catch (error) {
      // If validation fails, just exit editing mode
      setEditingKey('');
    }
  };

  const deleteItem = (key: React.Key) => {
    const newData = data.filter(item => item.key !== key);
    setData(newData);
    onItemsChange(newData.filter(item => !item.isNew && item.productId));
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const currentValues = form.getFieldsValue();
      const updatedValues = {
        ...currentValues,
        productId,
        costPrice: product.costPrice,
        sellPrice: product.sellPrice,
      };
      form.setFieldsValue(updatedValues);
    }
  };

  const columns = [
    {
      title: 'Product',
      dataIndex: 'productId',
      width: '25%',
      editable: true,
      render: (_: any, record: OrderItemData) => {
        return record.productName || (record.isNew ? '' : 'Select Product');
      },
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      width: '10%',
      editable: true,
      render: (value: number) => value || '',
    },
    {
      title: 'Cost Price',
      dataIndex: 'costPrice',
      width: '12%',
      editable: true,
      render: (value: number) => value ? <FormatNumber value={value} prefix="Rs. " /> : '',
    },
    {
      title: 'Sell Price',
      dataIndex: 'sellPrice',
      width: '12%',
      editable: true,
      render: (value: number) => value ? <FormatNumber value={value} prefix="Rs. " /> : '',
    },
    {
      title: 'Total Cost',
      dataIndex: 'totalCost',
      width: '12%',
      render: (value: number) => value ? <FormatNumber value={value} prefix="Rs. " /> : '',
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      width: '12%',
      render: (value: number) => value ? <FormatNumber value={value} prefix="Rs. " /> : '',
    },
    {
      title: 'Profit',
      dataIndex: 'profit',
      width: '10%',
      render: (value: number) => value ? <FormatNumber value={value} prefix="Rs. " /> : '',
    },
    {
      title: 'Cartons',
      dataIndex: 'cartons',
      width: '8%',
      render: (value: number) => value || '',
    },
    {
      title: 'Return Qty',
      dataIndex: 'returnQuantity',
      width: '10%',
      editable: true,
      render: (value: number) => value || 0,
    },
    {
      title: 'Actions',
      dataIndex: 'operation',
      width: '10%',
      render: (_: any, record: OrderItemData) => {
       return (
          <span>
            {!record.isNew && (
              <Popconfirm
                title="Sure to delete?"
                onConfirm={() => deleteItem(record.key)}
              >
                <Button 
                  type="link" 
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            )}
          </span>
        );
      },
    },
  ];

  const mergedColumns: TableProps<OrderItemData>['columns'] = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: OrderItemData) => ({
        record,
        inputType: col.dataIndex === 'productId' ? 'select' : 
                  ['quantity', 'costPrice', 'sellPrice', 'returnQuantity'].includes(col.dataIndex) ? 'number' : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
        products,
        onCellBlur: handleBlur,
      }),
    };
  });

  return (
    <Form 
      form={form} 
      component={false}
      onValuesChange={(changedValues) => {
        if (changedValues.productId) {
          handleProductChange(changedValues.productId);
        }
      }}
    >
      <Table<OrderItemData>
        components={{
          body: { cell: EditableCell },
        }}
        bordered
        dataSource={data}
        columns={mergedColumns}
        rowClassName="editable-row"
        pagination={false}
        loading={loading || isLoadingProducts}
        onRow={(record) => ({
          onDoubleClick: () => {
            if (!isEditing(record)) {
              edit(record);
            }
          },
        })}
        summary={(pageData) => {
          const validItems = pageData.filter(item => !item.isNew && item.productId);
          const totalCartons = validItems.reduce((sum, item) => sum + (item.cartons || 0), 0);
          const totalCost = validItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);
          const totalAmount = validItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
          const totalProfit = totalAmount - totalCost;

          return (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
                <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
                <Table.Summary.Cell index={1}></Table.Summary.Cell>
                <Table.Summary.Cell index={2}></Table.Summary.Cell>
                <Table.Summary.Cell index={3}></Table.Summary.Cell>
                <Table.Summary.Cell index={4}>
                  <FormatNumber value={totalCost} prefix="Rs. " />
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5}>
                  <FormatNumber value={totalAmount} prefix="Rs. " />
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6}>
                  <FormatNumber value={totalProfit} prefix="Rs. " />
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7}>{totalCartons}</Table.Summary.Cell>
                <Table.Summary.Cell index={8}></Table.Summary.Cell>
                <Table.Summary.Cell index={9}></Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          );
        }}
      />
      
     
    </Form>
  );
};
