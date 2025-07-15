import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Form, 
  Select, 
  InputNumber, 
  Input, 
  Radio, 
  DatePicker, 
  Button, 
  Alert, 
  Space,
  Typography,
  Divider
} from 'antd';
import { PlusOutlined, MinusOutlined, DollarOutlined } from '@ant-design/icons';
import { useProducts } from '../../products/api/queries';
import { useAdjustStock, useAddStock } from '../api/mutations';
import { useProductStock } from '../api/queries';
import { StockLevelIndicator } from './stock-level-indicator';
import { validateStockAdjustment } from '../utils/stock-validation';
import type { StockAdjustmentFormProps } from '../types';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

interface FormValues {
  productId: string;
  operationType: 'ADD' | 'REMOVE';
  quantity: number;
  reason: 'PURCHASE' | 'EXPIRED' | 'DAMAGED' | 'LOST' | 'OTHER';
  purchaseCost?: number;
  expiryDate?: any;
  comments?: string;
}

export const StockAdjustmentForm: React.FC<StockAdjustmentFormProps> = ({
  visible,
  onClose,
  onSuccess,
  initialProductId
}) => {
  const [form] = Form.useForm<FormValues>();
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(initialProductId);
  const [operationType, setOperationType] = useState<'ADD' | 'REMOVE'>('ADD');
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: currentStock } = useProductStock(selectedProductId || '');
  const adjustStockMutation = useAdjustStock();
  const addStockMutation = useAddStock();

  useEffect(() => {
    if (initialProductId) {
      setSelectedProductId(initialProductId);
      form.setFieldValue('productId', initialProductId);
    }
  }, [initialProductId, form]);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      setValidationWarnings([]);
      if (initialProductId) {
        form.setFieldValue('productId', initialProductId);
        setSelectedProductId(initialProductId);
      }
      setOperationType('ADD');
    }
  }, [visible, form, initialProductId]);

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
  };

  const handleOperationTypeChange = (type: 'ADD' | 'REMOVE') => {
    setOperationType(type);
    // Reset reason when changing operation type
    form.setFieldValue('reason', undefined);
  };

  const handleQuantityChange = (quantity: number | null) => {
    if (!quantity || !selectedProductId || currentStock === undefined) {
      setValidationWarnings([]);
      return;
    }

    if (operationType === 'REMOVE') {
      const validation = validateStockAdjustment(
        {
          productId: selectedProductId,
          quantity,
          adjustmentType: 'REMOVE',
          reason: form.getFieldValue('reason') || 'OTHER',
        },
        currentStock
      );
      setValidationWarnings(validation.warnings);
    } else {
      setValidationWarnings([]);
    }
  };

  const handleFinish = async (values: FormValues) => {
    try {
      if (values.operationType === 'ADD' && values.reason === 'PURCHASE') {
        // Use addStock for purchases
        await addStockMutation.mutateAsync({
          productId: values.productId,
          quantity: values.quantity,
          purchaseCost: values.purchaseCost || 0,
          expiryDate: values.expiryDate?.toDate(),
          comments: values.comments,
        });
      } else {
        // Use adjustStock for other operations
        await adjustStockMutation.mutateAsync({
          productId: values.productId,
          quantity: values.quantity,
          adjustmentType: values.operationType,
          reason: values.reason as any,
          comments: values.comments,
        });
      }
      
      onSuccess();
      onClose();
      form.resetFields();
      setValidationWarnings([]);
    } catch (error) {
      console.error('Stock adjustment failed:', error);
    }
  };

  const selectedProduct = products?.find(p => p.id === selectedProductId);
  const isLoading = adjustStockMutation.isPending || addStockMutation.isPending;

  const getReasonOptions = () => {
    if (operationType === 'ADD') {
      return [
        { value: 'PURCHASE', label: 'Purchase' },
        { value: 'OTHER', label: 'Other' },
      ];
    } else {
      return [
        { value: 'EXPIRED', label: 'Expired' },
        { value: 'DAMAGED', label: 'Damaged' },
        { value: 'LOST', label: 'Lost' },
        { value: 'OTHER', label: 'Other' },
      ];
    }
  };

  const showPurchaseFields = operationType === 'ADD' && form.getFieldValue('reason') === 'PURCHASE';

  return (
    <Modal
      title="Stock Adjustment"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ operationType: 'ADD' }}
      >
        <Form.Item
          name="productId"
          label="Product"
          rules={[{ required: true, message: 'Please select a product' }]}
        >
          <Select
            placeholder="Select a product"
            loading={productsLoading}
            onChange={handleProductChange}
            showSearch
            filterOption={(input, option) =>
              option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
            }
          >
            {products?.map(product => (
              <Option key={product.id} value={product.id}>
                {product.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {selectedProduct && currentStock !== undefined && (
          <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>Current Stock:</Text>
                <StockLevelIndicator 
                  currentStock={currentStock}
                  lowStockThreshold={selectedProduct.lowStockThreshold}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Low Stock Threshold:</Text>
                <Text>{selectedProduct.lowStockThreshold}</Text>
              </div>
            </Space>
          </div>
        )}

        <Form.Item
          name="operationType"
          label="Operation Type"
          rules={[{ required: true, message: 'Please select operation type' }]}
        >
          <Radio.Group 
            value={operationType} 
            onChange={(e) => handleOperationTypeChange(e.target.value)}
          >
            <Radio.Button value="ADD">
              <PlusOutlined /> Add Stock
            </Radio.Button>
            <Radio.Button value="REMOVE">
              <MinusOutlined /> Remove Stock
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="quantity"
          label="Quantity"
          rules={[
            { required: true, message: 'Please enter quantity' },
            { type: 'number', min: 1, message: 'Quantity must be greater than 0' }
          ]}
        >
          <InputNumber
            placeholder="Enter quantity"
            style={{ width: '100%' }}
            min={1}
            onChange={handleQuantityChange}
          />
        </Form.Item>

        <Form.Item
          name="reason"
          label="Reason"
          rules={[{ required: true, message: 'Please select a reason' }]}
        >
          <Select placeholder="Select reason">
            {getReasonOptions().map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {showPurchaseFields && (
          <>
            <Divider orientation="left" orientationMargin="0">
              <Text type="secondary">Purchase Details</Text>
            </Divider>
            
            <Form.Item
              name="purchaseCost"
              label="Purchase Cost (per unit)"
              rules={[
                { required: true, message: 'Please enter purchase cost' },
                { type: 'number', min: 0, message: 'Purchase cost cannot be negative' }
              ]}
            >
              <InputNumber
                placeholder="Enter cost per unit"
                style={{ width: '100%' }}
                min={0}
                step={0.01}
                prefix={<DollarOutlined />}
              />
            </Form.Item>

            <Form.Item
              name="expiryDate"
              label="Expiry Date (Optional)"
            >
              <DatePicker 
                style={{ width: '100%' }}
                placeholder="Select expiry date"
                disabledDate={(current) => current && current.isBefore(new Date(), 'day')}
              />
            </Form.Item>
          </>
        )}

        <Form.Item
          name="comments"
          label="Comments (Optional)"
        >
          <TextArea
            placeholder="Enter any additional comments"
            rows={3}
          />
        </Form.Item>

        {validationWarnings.length > 0 && (
          <Alert
            message="Warning"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {validationWarnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isLoading}
              disabled={!selectedProductId}
            >
              {operationType === 'ADD' ? 'Add Stock' : 'Remove Stock'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};
