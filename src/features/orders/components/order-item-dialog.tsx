import React, { useState, useEffect, useRef } from 'react';
import { 
  Modal, 
  Form, 
  Select, 
  Row, 
  Col, 
  Card, 
  Button, 
  Typography, 
  InputNumber,
  message,
  Divider
} from 'antd';
import { PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { useProducts } from '../../products/api/queries';
import { FormatNumber } from '../../../shared/components';
import { CartonQuantityInput } from '../../../components/common/CartonQuantityInput';
import type { CartonQuantityValue } from '../../../components/common/CartonQuantityInput';
import { calculateOrderItemTotalsFromCartons } from '../utils/calculations';
import type { Product } from '../../products/types';
import type { OrderItemData } from './order-items-table';

const { Option } = Select;
const { Text } = Typography;

interface OrderItemFormData {
  productId: string;
  cartons: number;
  costPrice: number;
  sellPrice: number;
  returnCartons: number;
}

interface OrderItemDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (item: OrderItemData) => void;
  editingItem?: OrderItemData | null;
  title?: string;
}

export const OrderItemDialog: React.FC<OrderItemDialogProps> = ({
  open,
  onClose,
  onSave,
  editingItem,
  title = 'Add Order Item'
}) => {
  const [form] = Form.useForm();
  const [calculatedValues, setCalculatedValues] = useState({
    totalCost: 0,
    totalAmount: 0,
    profit: 0,
    returnAmount: 0
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const productSelectRef = useRef<any>(null);
  const { data: products = [], isLoading: isLoadingProducts } = useProducts();

  // Auto-focus product select when dialog opens
  useEffect(() => {
    if (open && !editingItem) {
      setTimeout(() => {
        productSelectRef.current?.focus();
      }, 100);
    }
  }, [open, editingItem]);

  // Set form values when editing
  useEffect(() => {
    if (editingItem && open) {
      const product = products.find(p => p.id === editingItem.productId);
      setSelectedProduct(product || null);
      
      form.setFieldsValue({
        productId: editingItem.productId,
        cartons: editingItem.cartons || 0,
        costPrice: editingItem.costPrice || 0,
        sellPrice: editingItem.sellPrice || 0,
        returnCartons: editingItem.returnCartons || 0,
      });
      
      // Calculate values for editing item
      if (product) {
        calculateAndSetValues({
          cartons: editingItem.cartons || 0,
          costPrice: editingItem.costPrice || 0,
          sellPrice: editingItem.sellPrice || 0,
          returnCartons: editingItem.returnCartons || 0,
        }, product);
      }
    } else if (open && !editingItem) {
      // Reset form to default values for new items
      form.setFieldsValue({
        productId: undefined,
        cartons: 0,
        costPrice: 0,
        sellPrice: 0,
        returnCartons: 0,
      });
      setCalculatedValues({ totalCost: 0, totalAmount: 0, profit: 0, returnAmount: 0 });
      setSelectedProduct(null);
    }
  }, [editingItem, open, products, form]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.resetFields();
      setCalculatedValues({ totalCost: 0, totalAmount: 0, profit: 0, returnAmount: 0 });
      setSelectedProduct(null);
    }
  }, [open, form]);

  // Add keyboard shortcut support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (open && e.ctrlKey && e.key === 'Enter' && !editingItem && selectedProduct) {
        e.preventDefault();
        handleSave(true);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, editingItem, selectedProduct]);

  const calculateAndSetValues = (values: Partial<OrderItemFormData>, product?: Product) => {
    const currentProduct = product || selectedProduct;
    if (!currentProduct) return;

    const cartons = values.cartons || 0;
    const costPrice = values.costPrice || currentProduct.costPrice;
    const sellPrice = values.sellPrice || currentProduct.sellPrice;
    const returnCartons = values.returnCartons || 0;

    const calculated = calculateOrderItemTotalsFromCartons(
      cartons,
      costPrice,
      sellPrice,
      currentProduct.unitPerCarton,
      returnCartons
    );

    setCalculatedValues(calculated);
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      
      // Auto-fill cost and sell prices
      form.setFieldsValue({
        costPrice: product.costPrice,
        sellPrice: product.sellPrice,
      });

      // Recalculate with new product
      const currentValues = form.getFieldsValue();
      calculateAndSetValues({
        ...currentValues,
        costPrice: product.costPrice,
        sellPrice: product.sellPrice,
      }, product);
    }
  };

  const handleValuesChange = (_changedValues: any, allValues: OrderItemFormData) => {
    if (selectedProduct) {
      calculateAndSetValues(allValues);
    }
  };

  const handleSave = async (addAnother = false) => {
    try {
      const values = await form.validateFields();
      const product = products.find(p => p.id === values.productId);
      
      if (!product) {
        message.error('Please select a valid product');
        return;
      }

      const orderItem: OrderItemData = {
        key: editingItem?.key || `item-${Date.now()}`,
        productId: values.productId,
        productName: product.name,
        cartons: values.cartons,
        costPrice: values.costPrice,
        sellPrice: values.sellPrice,
        returnCartons: values.returnCartons || 0,
        ...calculatedValues,
      };

      onSave(orderItem);
      
      if (addAnother && !editingItem) {
        // Reset form for next item but keep product if user wants
        form.resetFields(['cartons', 'returnCartons']);
        form.setFieldsValue({
          cartons: 0,
          returnCartons: 0,
        });
        setCalculatedValues({ totalCost: 0, totalAmount: 0, profit: 0, returnAmount: 0 });
        
        // Focus back to cartons input for quick entry
        setTimeout(() => {
          const cartonsInput = document.querySelector('[data-testid="cartons-input"]') as HTMLElement;
          cartonsInput?.focus();
        }, 100);
        
        message.success('Item added! Add another item.');
      } else {
        onClose();
        message.success(editingItem ? 'Item updated successfully' : 'Item added successfully');
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title={editingItem ? 'Edit Order Item' : title}
      open={open}
      onCancel={onClose}
      width={800}
      className="order-item-dialog"
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        !editingItem && (
          <Button
            key="save-and-add"
            icon={<PlusOutlined />}
            onClick={() => handleSave(true)}
            disabled={!selectedProduct}
          >
            Save & Add Another
          </Button>
        ),
        <Button
          key="save"
          type="primary"
          icon={<SaveOutlined />}
          onClick={() => handleSave()}
          disabled={!selectedProduct}
        >
          {editingItem ? 'Update Item' : 'Save Item'}
        </Button>,
      ].filter(Boolean)}
      destroyOnClose
      maskClosable={false}
    >
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        initialValues={{
          cartons: 0,
          returnCartons: 0,
          costPrice: 0,
          sellPrice: 0,
        }}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Product"
              name="productId"
              rules={[{ required: true, message: 'Please select a product' }]}
            >
              <Select
                ref={productSelectRef}
                placeholder="Search and select a product"
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
                onChange={handleProductChange}
                loading={isLoadingProducts}
                size="large"
                getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
                style={{ zIndex: 1000 }}
                dropdownStyle={{ paddingTop: 4, paddingBottom: 4 }}
              >
                {products.map(product => (
                  <Option key={product.id} value={product.id} title={product.name}>
                    <div style={{ padding: '4px 0', lineHeight: 1.2 }}>
                      <div style={{ 
                        fontWeight: 500, 
                        fontSize: '14px',
                        marginBottom: '2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {product.name}
                      </div>
                      <div style={{ 
                        fontSize: '11px', 
                        color: '#666',
                        lineHeight: 1.1
                      }}>
                        Cost: Rs. {product.costPrice} | Sell: Rs. {product.sellPrice} | 
                        Units/Carton: {product.unitPerCarton}
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {selectedProduct && (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={`Cartons (${selectedProduct.unitPerCarton} units each)`}
                  name="cartons"
                  rules={[
                    { required: true, message: 'Please enter number of cartons' },
                    { 
                      validator: (_, value) => {
                        if (value === undefined || value === null || value === '') {
                          return Promise.reject(new Error('Please enter number of cartons'));
                        }
                        const numValue = typeof value === 'object' ? value.cartons : value;
                        if (numValue < 0) {
                          return Promise.reject(new Error('Cartons must be positive'));
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <CartonQuantityInput
                    unitPerCarton={selectedProduct.unitPerCarton}
                    value={{
                      cartons: form.getFieldValue('cartons') || 0,
                      totalUnits: (form.getFieldValue('cartons') || 0) * selectedProduct.unitPerCarton
                    }}
                    onChange={(value: CartonQuantityValue) => {
                      form.setFieldValue('cartons', value.cartons);
                      handleValuesChange({ cartons: value.cartons }, form.getFieldsValue());
                    }}
                    allowDecimals={false}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Return Cartons"
                  name="returnCartons"
                  rules={[
                    { type: 'number', min: 0, message: 'Return cartons must be positive' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    precision={0}
                    placeholder="Enter return cartons"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Cost Price (per unit)"
                  name="costPrice"
                  rules={[
                    { required: true, message: 'Please enter cost price' },
                    { type: 'number', min: 0, message: 'Cost price must be positive' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={0.01}
                    precision={2}
                    prefix="Rs. "
                    placeholder="Enter cost price"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Sell Price (per unit)"
                  name="sellPrice"
                  rules={[
                    { required: true, message: 'Please enter sell price' },
                    { type: 'number', min: 0, message: 'Sell price must be positive' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={0.01}
                    precision={2}
                    prefix="Rs. "
                    placeholder="Enter sell price"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left">Calculated Totals</Divider>
            
            <Card size="small" style={{ backgroundColor: '#f8f9fa', marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Total Cost</Text>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#cf1322' }}>
                      <FormatNumber value={calculatedValues.totalCost} prefix="Rs. " />
                    </div>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Total Amount</Text>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#1890ff' }}>
                      <FormatNumber value={calculatedValues.totalAmount} prefix="Rs. " />
                    </div>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Profit</Text>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#52c41a' }}>
                      <FormatNumber value={calculatedValues.profit} prefix="Rs. " />
                    </div>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Return Amount</Text>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#fa8c16' }}>
                      <FormatNumber value={calculatedValues.returnAmount} prefix="Rs. " />
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>

            {!editingItem && (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  💡 Tip: Use <strong>Ctrl+Enter</strong> to quickly save and add another item
                </Text>
              </div>
            )}
          </>
        )}
      </Form>
    </Modal>
  );
};
