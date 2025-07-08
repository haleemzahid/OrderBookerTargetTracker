import React, { useState, useEffect } from 'react';
import { 
  Form, 
  DatePicker, 
  Select, 
  Button, 
  Card, 
  Row, 
  Col, 
  Space, 
  InputNumber, 
  Typography, 
  message, 
  Divider,
  Tag,
  Alert,
  AutoComplete,
  Input,
  Tooltip,
  Badge
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  ShoppingCartOutlined, 
  DollarOutlined,
  InfoCircleOutlined,
  MinusCircleOutlined
} from '@ant-design/icons';
import { useCreateDailyEntry, useUpdateDailyEntry } from '../api/mutations';
import { useOrderBookers } from '../../order-bookers';
import { useProductsWithCompany } from '../../products/hooks/queries';
import { formatRupees } from '../../../shared/utils/currency';
import dayjs from 'dayjs';
import type { DailyEntry, CreateDailyEntryRequest, UpdateDailyEntryRequest, CreateDailyEntryItemRequest } from '../types';
import type { ProductWithCompany } from '../../products/types';
import { ProductItemCard } from './ProductItemCard';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

interface ProductItem {
  id?: string;
  productId: string;
  product?: ProductWithCompany;
  cartonsSold: number;
  unitsSold: number;
  cartonsReturned: number;
  unitsReturned: number;
  overrideCostPrice?: number;
  overrideSellPrice?: number;
}

interface DailyEntryFormProps {
  dailyEntry?: DailyEntry;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const DailyEntryForm: React.FC<DailyEntryFormProps> = ({
  dailyEntry,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const { data: orderBookers } = useOrderBookers();
  const { data: products } = useProductsWithCompany();
  const createMutation = useCreateDailyEntry();
  const updateMutation = useUpdateDailyEntry();

  const [productItems, setProductItems] = useState<ProductItem[]>([]);

  const isEditing = !!dailyEntry;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Calculate totals
  const calculateTotals = () => {
    let totalAmount = 0;
    let totalReturnAmount = 0;
    let totalQuantitySold = 0;
    let totalQuantityReturned = 0;

    productItems.forEach(item => {
      const product = products?.find(p => p.id === item.productId);
      if (product) {
        const sellPrice = item.overrideSellPrice || product.sellPrice;
        const totalSoldUnits = (item.cartonsSold * product.unitPerCarton) + item.unitsSold;
        const totalReturnedUnits = (item.cartonsReturned * product.unitPerCarton) + item.unitsReturned;
        
        totalAmount += totalSoldUnits * sellPrice;
        totalReturnAmount += totalReturnedUnits * sellPrice;
        totalQuantitySold += totalSoldUnits;
        totalQuantityReturned += totalReturnedUnits;
      }
    });

    return {
      totalAmount,
      totalReturnAmount,
      netAmount: totalAmount - totalReturnAmount,
      totalQuantitySold,
      totalQuantityReturned,
      netQuantity: totalQuantitySold - totalQuantityReturned,
    };
  };

  const totals = calculateTotals();

  // Add a new product item
  const addProductItem = () => {
    setProductItems([...productItems, {
      productId: '',
      cartonsSold: 0,
      unitsSold: 0,
      cartonsReturned: 0,
      unitsReturned: 0,
    }]);
  };

  // Remove a product item
  const removeProductItem = (index: number) => {
    const newItems = productItems.filter((_, i) => i !== index);
    setProductItems(newItems);
  };

  // Update a specific product item
  const updateProductItem = (index: number, updates: Partial<ProductItem>) => {
    const newItems = [...productItems];
    newItems[index] = { ...newItems[index], ...updates };
    setProductItems(newItems);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (productItems.length === 0) {
        message.error('Please add at least one product!');
        return;
      }

      // Validate all items have products selected
      const invalidItems = productItems.filter(item => !item.productId);
      if (invalidItems.length > 0) {
        message.error('Please select products for all items!');
        return;
      }

      // Convert product items to API format
      const items: CreateDailyEntryItemRequest[] = productItems.map(item => {
        const product = products?.find(p => p.id === item.productId);
        const totalSoldUnits = product ? (item.cartonsSold * product.unitPerCarton) + item.unitsSold : 0;
        const totalReturnedUnits = product ? (item.cartonsReturned * product.unitPerCarton) + item.unitsReturned : 0;

        return {
          productId: item.productId,
          quantitySold: totalSoldUnits,
          quantityReturned: totalReturnedUnits,
          costPriceOverride: item.overrideCostPrice,
          sellPriceOverride: item.overrideSellPrice,
        };
      });

      const formData: CreateDailyEntryRequest = {
        orderBookerId: values.orderBookerId,
        date: values.date.toDate(),
        notes: values.notes,
        items,
      };

      if (isEditing && dailyEntry) {
        const updateData: UpdateDailyEntryRequest = {
          notes: formData.notes,
          items: items.map(item => ({
            productId: item.productId,
            quantitySold: item.quantitySold,
            quantityReturned: item.quantityReturned,
            costPriceOverride: item.costPriceOverride,
            sellPriceOverride: item.sellPriceOverride,
          })),
        };
        await updateMutation.mutateAsync({ id: dailyEntry.id, data: updateData });
        message.success('Daily entry updated successfully!');
      } else {
        await createMutation.mutateAsync(formData);
        message.success('Daily entry created successfully!');
      }
      
      form.resetFields();
      setProductItems([]);
      onSuccess?.();
    } catch (error) {
      console.error('Form submission error:', error);
      message.error('Failed to save daily entry. Please try again.');
    }
  };

  const initialValues = dailyEntry ? {
    orderBookerId: dailyEntry.orderBookerId,
    date: dayjs(dailyEntry.date),
    notes: dailyEntry.notes,
  } : {
    date: dayjs(),
  };

  // Initialize product items for editing
  useEffect(() => {
    if (isEditing && dailyEntry?.items && productItems.length === 0) {
      const items: ProductItem[] = dailyEntry.items.map(item => {
        const product = products?.find(p => p.id === item.productId);
        const cartonsSold = product ? Math.floor(item.quantitySold / product.unitPerCarton) : 0;
        const unitsSold = product ? item.quantitySold % product.unitPerCarton : item.quantitySold;
        const cartonsReturned = product ? Math.floor(item.quantityReturned / product.unitPerCarton) : 0;
        const unitsReturned = product ? item.quantityReturned % product.unitPerCarton : item.quantityReturned;

        return {
          id: item.id,
          productId: item.productId,
          product,
          cartonsSold,
          unitsSold,
          cartonsReturned,
          unitsReturned,
          overrideCostPrice: item.costPriceOverride,
          overrideSellPrice: item.sellPriceOverride,
        };
      });
      setProductItems(items);
    }
  }, [isEditing, dailyEntry, products, productItems.length]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <Card style={{ marginBottom: '20px' }}>
        <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
          <ShoppingCartOutlined style={{ marginRight: '8px' }} />
          {isEditing ? 'Update Daily Sales' : 'Add Daily Sales'}
        </Title>
        <Text type="secondary">Record daily sales and returns for an order booker</Text>
      </Card>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={initialValues}
        disabled={isLoading}
      >
        {/* Basic Information */}
        <Card title="📝 Basic Information" style={{ marginBottom: '20px' }}>
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                name="orderBookerId"
                label={<span style={{ fontWeight: 'bold', fontSize: '16px' }}>👤 Order Booker</span>}
                rules={[{ required: true, message: 'Please select an order booker!' }]}
              >
                <Select
                  placeholder="Choose an order booker..."
                  showSearch
                  size="large"
                  optionFilterProp="children"
                  disabled={isEditing}
                  style={{ borderRadius: '8px' }}
                >
                  {orderBookers?.map(orderBooker => (
                    <Option key={orderBooker.id} value={orderBooker.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{orderBooker.name}</span>
                        <span style={{ color: '#666' }}>({orderBooker.nameUrdu})</span>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="date"
                label={<span style={{ fontWeight: 'bold', fontSize: '16px' }}>📅 Date</span>}
                rules={[{ required: true, message: 'Please select a date!' }]}
              >
                <DatePicker 
                  style={{ width: '100%', borderRadius: '8px' }} 
                  size="large"
                  disabled={isEditing} 
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Products Section */}
        <Card 
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🛍️ Products Sold</span>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={addProductItem}
                style={{ borderRadius: '6px' }}
              >
                Add Product
              </Button>
            </div>
          }
          style={{ marginBottom: '20px' }}
        >
          {productItems.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#999',
              background: '#fafafa',
              borderRadius: '8px',
              border: '2px dashed #d9d9d9'
            }}>
              <ShoppingCartOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
              <div style={{ fontSize: '16px', marginBottom: '8px' }}>No products added yet</div>
              <div>Click "Add Product" to start recording sales</div>
            </div>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {productItems.map((item, index) => (
                <ProductItemCard
                  key={index}
                  item={item}
                  index={index}
                  products={products || []}
                  onUpdate={(updates) => updateProductItem(index, updates)}
                  onRemove={() => removeProductItem(index)}
                />
              ))}
            </Space>
          )}
        </Card>

        {/* Summary */}
        {productItems.length > 0 && (
          <Card title="💰 Summary" style={{ marginBottom: '20px' }}>
            <Row gutter={16}>
              <Col xs={12} md={6}>
                <div style={{ textAlign: 'center', padding: '16px', background: '#e6f7ff', borderRadius: '8px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                    {formatRupees(totals.totalAmount)}
                  </div>
                  <div style={{ color: '#666' }}>Total Sales</div>
                </div>
              </Col>
              <Col xs={12} md={6}>
                <div style={{ textAlign: 'center', padding: '16px', background: '#fff1f0', borderRadius: '8px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>
                    {formatRupees(totals.totalReturnAmount)}
                  </div>
                  <div style={{ color: '#666' }}>Total Returns</div>
                </div>
              </Col>
              <Col xs={12} md={6}>
                <div style={{ textAlign: 'center', padding: '16px', background: '#f6ffed', borderRadius: '8px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                    {formatRupees(totals.netAmount)}
                  </div>
                  <div style={{ color: '#666' }}>Net Amount</div>
                </div>
              </Col>
              <Col xs={12} md={6}>
                <div style={{ textAlign: 'center', padding: '16px', background: '#f0f5ff', borderRadius: '8px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
                    {totals.netQuantity}
                  </div>
                  <div style={{ color: '#666' }}>Net Units</div>
                </div>
              </Col>
            </Row>
          </Card>
        )}

        {/* Notes */}
        <Card title="📝 Notes (Optional)" style={{ marginBottom: '20px' }}>
          <Form.Item name="notes">
            <TextArea
              rows={3}
              placeholder="Add any notes about today's sales (optional)..."
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>
        </Card>

        {/* Action Buttons */}
        <Card>
          <div style={{ textAlign: 'center' }}>
            <Space size="large">
              <Button 
                size="large" 
                onClick={onCancel}
                style={{ minWidth: '120px', borderRadius: '8px' }}
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={isLoading}
                size="large"
                style={{ minWidth: '120px', borderRadius: '8px' }}
              >
                {isEditing ? '✅ Update Entry' : '💾 Save Entry'}
              </Button>
            </Space>
          </div>
        </Card>
      </Form>
    </div>
  );
};
