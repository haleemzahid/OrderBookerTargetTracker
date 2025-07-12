import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Table, Select, Popconfirm, Button } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import { useProducts } from '../../products/api/queries';
import { FormatNumber } from '../../../shared/components';
import { CartonQuantityInput } from '../../../components/common/CartonQuantityInput';
import type { CartonQuantityValue } from '../../../components/common/CartonQuantityInput';
import { calculateOrderItemTotalsFromCartons } from '../utils/calculations';
import type { Product } from '../../products/types';

const { Option } = Select;

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
  isNew?: boolean;
}

interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string;
  title: any;
  inputType: 'number' | 'text' | 'select' | 'carton';
  record: OrderItemData;
  index: number;
  products?: Product[];
  onCellBlur?: (key: React.Key) => void;
  onValueChange?: (key: React.Key, dataIndex: string, value: any) => void;
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
  onValueChange,
  ...restProps
}) => {
  let inputNode: React.ReactNode;

  if (inputType === 'carton') {
    const product = products.find(p => p.id === record.productId);
    const unitPerCarton = product?.unitPerCarton || 1;
    
    inputNode = (
      <CartonQuantityInput
        unitPerCarton={unitPerCarton}
        value={{ cartons: record[dataIndex] || 0, units: (record[dataIndex] || 0) * unitPerCarton }}
        onChange={(value: CartonQuantityValue) => {
          onValueChange?.(record.key, dataIndex, value.cartons);
        }}
        allowDecimals={true}
      />
    );
  } else if (inputType === 'number') {
    inputNode = (
      <InputNumber 
        style={{ width: '100%' }} 
        min={0} 
        step={0.01}
        onChange={(value) => {
          onValueChange?.(record.key, dataIndex, value || 0);
        }}
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
        onChange={(value) => {
          onValueChange?.(record.key, dataIndex, value);
        }}
        onBlur={() => onCellBlur?.(record.key)}
        dropdownMatchSelectWidth={false}
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
        onChange={(e) => {
          onValueChange?.(record.key, dataIndex, e.target.value);
        }}
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
              required: dataIndex === 'productId' || dataIndex === 'cartons',
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

  // Real-time calculation function
  const updateCalculatedValues = (updatedData: OrderItemData[], targetKey: string, changedField: string, value: any) => {
    return updatedData.map(item => {
      if (item.key !== targetKey) return item;
      
      const updatedItem = { ...item, [changedField]: value };
      
      // Only calculate if we have the required fields
      if (updatedItem.productId && updatedItem.cartons) {
        const product = products.find(p => p.id === updatedItem.productId);
        if (product) {
          const calculatedValues = calculateValues(updatedItem, updatedItem.productId);
          return { ...updatedItem, ...calculatedValues };
        }
      }
      
      return updatedItem;
    });
  };

  // Handle real-time value changes
  const handleValueChange = (key: React.Key, dataIndex: string, value: any) => {
    const newData = updateCalculatedValues(data, key as string, dataIndex, value);
    setData(newData);
    
    // Update form field
    form.setFieldValue(dataIndex, value);
    
    // If this is a product selection, update the cost and sell prices
    if (dataIndex === 'productId') {
      handleProductChange(value);
    }
  };

  const save = async (key: React.Key) => {
    try {
      const row = await form.validateFields();
      const product = products.find(p => p.id === row.productId);
      
      if (!product) {
        return;
      }

      const newData = [...data];
      const index = newData.findIndex((item) => key === item.key);
      
      if (index > -1) {
        const item = newData[index];
        const calculatedRow = calculateValues(row, row.productId);
        const updatedItem = {
          ...item,
          ...calculatedRow,
          productName: product.name,
          isNew: false,
        };
        newData.splice(index, 1, updatedItem);
        
        // Only add a new row if this was a new row and has valid cartons
        if (item.isNew && row.cartons && row.cartons > 0) {
          const newEmptyRow: OrderItemData = {
            key: `new-${Date.now()}`,
            isNew: true,
          };
          newData.push(newEmptyRow);
          
          // Auto-edit the new empty row after a short delay
          setTimeout(() => {
            setEditingKey(newEmptyRow.key);
            form.setFieldsValue({
              productId: '',
              cartons: 1,
              costPrice: 0,
              sellPrice: 0,
              returnCartons: 0,
            });
          }, 100);
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
                               target.closest('.ant-table') ||
                               target.closest('.ant-select-dropdown');
      
      if (!isEditableElement && editingKey) {
        // Only save if we have both product and cartons
        const values = form.getFieldsValue();
        if (values.productId && values.cartons && values.cartons > 0) {
          save(editingKey);
        }
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [editingKey, form]);

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
          cartons: 1,
          costPrice: 0,
          sellPrice: 0,
          returnCartons: 0,
        });
      }, 0);
    }
  }, [data, form]);

  const isEditing = (record: OrderItemData) => record.key === editingKey;

  const edit = (record: Partial<OrderItemData> & { key: React.Key }) => {
    const product = products.find(p => p.id === record.productId);
    const defaultValues = {
      productId: record.productId || '',
      cartons: record.cartons || 1,
      costPrice: record.costPrice || 0,
      sellPrice: record.sellPrice || 0,
      returnCartons: record.returnCartons || 0,
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
    const cartons = values.cartons || 0;
    const costPrice = values.costPrice || (product?.costPrice || 0);
    const sellPrice = values.sellPrice || (product?.sellPrice || 0);
    const returnCartons = values.returnCartons || 0;
    const unitPerCarton = product?.unitPerCarton || 1;

    // Use the centralized calculation function
    const calculatedTotals = calculateOrderItemTotalsFromCartons(
      cartons,
      costPrice,
      sellPrice,
      unitPerCarton,
      returnCartons
    );

    return {
      ...values,
      costPrice,
      sellPrice,
      ...calculatedTotals,
    };
  };

  const handleBlur = async (key: React.Key) => {
    // Only save if we have complete data and it's not just a product selection
    try {
      const values = form.getFieldsValue();
      if (values.productId && values.cartons && values.cartons > 0) {
        // Check if this is a new row and if it has valid data
        const currentItem = data.find(item => item.key === key);
        if (currentItem?.isNew) {
          await save(key);
        }
      }
    } catch (error) {
      // If validation fails, don't exit editing mode
      console.log('Validation failed on blur:', error);
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
      
      // Update form fields for cost and sell price without triggering save
      form.setFieldValue('costPrice', product.costPrice);
      form.setFieldValue('sellPrice', product.sellPrice);
      
      // Update the data state with new product info
      const newData = data.map(item => {
        if (item.key === editingKey) {
          return {
            ...item,
            productId,
            productName: product.name,
            costPrice: product.costPrice,
            sellPrice: product.sellPrice,
          };
        }
        return item;
      });
      setData(newData);
    }
  };

  const columns = [
    {
      title: 'Product',
      dataIndex: 'productId',
      width: '30%',
      editable: true,
      render: (_: any, record: OrderItemData) => {
        return record.productName || (record.isNew ? '' : 'Select Product');
      },
    },
    {
      title: 'Cartons',
      dataIndex: 'cartons',
      width: '15%',
      editable: true,
      render: (value: number) => value || '',
    },
    {
      title: 'Prices',
      children: [
        {
          title: 'Cost',
          dataIndex: 'costPrice',
          width: '10%',
          editable: true,
          render: (value: number) => value ? <FormatNumber value={value} prefix="Rs. " /> : '',
        },
        {
          title: 'Sell',
          dataIndex: 'sellPrice',
          width: '10%',
          editable: true,
          render: (value: number) => value ? <FormatNumber value={value} prefix="Rs. " /> : '',
        },
      ],
    },
    {
      title: 'Totals',
      children: [
        {
          title: 'Cost',
          dataIndex: 'totalCost',
          width: '10%',
          render: (value: number) => value ? <FormatNumber value={value} prefix="Rs. " /> : '',
        },
        {
          title: 'Amount',
          dataIndex: 'totalAmount',
          width: '10%',
          render: (value: number) => value ? <FormatNumber value={value} prefix="Rs. " /> : '',
        },
        {
          title: 'Profit',
          dataIndex: 'profit',
          width: '8%',
          render: (value: number) => value ? <FormatNumber value={value} prefix="Rs. " /> : '',
        },
      ],
    },
    {
      title: 'Return Cartons',
      dataIndex: 'returnCartons',
      width: '15%',
      editable: true,
      render: (value: number) => value || 0,
    },
    {
      title: 'Actions',
      dataIndex: 'operation',
      width: '7%',
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
      ...col,        onCell: (record: OrderItemData) => ({
          record,
          inputType: col.dataIndex === 'productId' ? 'select' : 
                    (col.dataIndex === 'cartons' || col.dataIndex === 'returnCartons') ? 'carton' :
                    ['costPrice', 'sellPrice'].includes(col.dataIndex) ? 'number' : 'text',
          dataIndex: col.dataIndex,
          title: col.title,
          editing: isEditing(record),
          products,
          onCellBlur: handleBlur,
          onValueChange: handleValueChange,
        }),
    };
  });

  return (
    <Form 
      form={form} 
      component={false}
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
                <Table.Summary.Cell index={1}>{totalCartons}</Table.Summary.Cell>
                <Table.Summary.Cell index={2} colSpan={2}></Table.Summary.Cell>
                <Table.Summary.Cell index={4}>
                  <FormatNumber value={totalCost} prefix="Rs. " />
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5}>
                  <FormatNumber value={totalAmount} prefix="Rs. " />
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6}>
                  <FormatNumber value={totalProfit} prefix="Rs. " />
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7}></Table.Summary.Cell>
                <Table.Summary.Cell index={8}></Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          );
        }}
      />
      
     
    </Form>
  );
};
