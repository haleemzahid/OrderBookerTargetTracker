import React, { useState } from 'react';
import { 
  Card, 
  Select, 
  Row, 
  Col, 
  Button, 
  Typography, 
  Space, 
  Divider,
  Tag,
  Tooltip,
  Alert,
  InputNumber,
  Switch,
  Collapse
} from 'antd';
import { 
  DeleteOutlined, 
  InfoCircleOutlined,
  DollarOutlined,
  ShoppingOutlined,
  UndoOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { QuantityInput } from '../../../components/common/QuantityInput';
import { formatRupees } from '../../../shared/utils/currency';
import type { ProductWithCompany } from '../../products/types';

const { Option } = Select;
const { Text, Title } = Typography;
const { Panel } = Collapse;

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

interface ProductItemCardProps {
  item: ProductItem;
  index: number;
  products: ProductWithCompany[];
  onUpdate: (updates: Partial<ProductItem>) => void;
  onRemove: () => void;
}

export const ProductItemCard: React.FC<ProductItemCardProps> = ({
  item,
  index,
  products,
  onUpdate,
  onRemove,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const product = products.find(p => p.id === item.productId);
  
  // Calculate totals for this item
  const calculateItemTotals = () => {
    if (!product) return { salesAmount: 0, returnAmount: 0, netAmount: 0, totalSoldUnits: 0, totalReturnedUnits: 0 };
    
    const sellPrice = item.overrideSellPrice || product.sellPrice;
    const totalSoldUnits = (item.cartonsSold * product.unitPerCarton) + item.unitsSold;
    const totalReturnedUnits = (item.cartonsReturned * product.unitPerCarton) + item.unitsReturned;
    
    const salesAmount = totalSoldUnits * sellPrice;
    const returnAmount = totalReturnedUnits * sellPrice;
    const netAmount = salesAmount - returnAmount;
    
    return {
      salesAmount,
      returnAmount,
      netAmount,
      totalSoldUnits,
      totalReturnedUnits,
    };
  };

  const totals = calculateItemTotals();

  const handleProductChange = (productId: string) => {
    const selectedProduct = products.find(p => p.id === productId);
    onUpdate({ 
      productId, 
      product: selectedProduct,
      // Reset quantities when product changes
      cartonsSold: 0,
      unitsSold: 0,
      cartonsReturned: 0,
      unitsReturned: 0,
      // Reset overrides when product changes
      overrideCostPrice: undefined,
      overrideSellPrice: undefined,
    });
  };

  const handleQuantityChange = (type: 'sold' | 'returned', cartons: number, units: number) => {
    if (type === 'sold') {
      onUpdate({ cartonsSold: cartons, unitsSold: units });
    } else {
      onUpdate({ cartonsReturned: cartons, unitsReturned: units });
    }
  };

  return (
    <Card 
      style={{ 
        border: product ? '1px solid #d9d9d9' : '1px solid #ff7875',
        borderRadius: '12px',
        background: product ? '#fff' : '#fff2f0'
      }}
      bodyStyle={{ padding: '20px' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
          📦 Product #{index + 1}
        </Title>
        <Button 
          type="text" 
          danger 
          icon={<DeleteOutlined />} 
          onClick={onRemove}
          style={{ borderRadius: '6px' }}
        >
          Remove
        </Button>
      </div>

      {/* Product Selection */}
      <div style={{ marginBottom: '20px' }}>
        <Text strong style={{ fontSize: '16px', marginBottom: '8px', display: 'block' }}>
          🛍️ Select Product
        </Text>
        <Select
          value={item.productId || undefined}
          placeholder="Choose a product to sell..."
          style={{ width: '100%', borderRadius: '8px' }}
          size="large"
          showSearch
          optionFilterProp="children"
          onChange={handleProductChange}
          filterOption={(input, option) => {
            const product = products.find(p => p.id === option?.value);
            if (!product) return false;
            return (
              product.name.toLowerCase().includes(input.toLowerCase()) ||
              product.nameUrdu.includes(input) ||
              product.company.name.toLowerCase().includes(input.toLowerCase())
            );
          }}
        >
          {products.map(product => (
            <Option key={product.id} value={product.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{product.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {product.company.name} • {formatRupees(product.sellPrice)}/unit • {product.unitPerCarton} units/carton
                  </div>
                </div>
                <Tag color="blue">{product.nameUrdu}</Tag>
              </div>
            </Option>
          ))}
        </Select>
      </div>

      {/* Product Not Selected Warning */}
      {!product && (
        <Alert
          message="Please select a product first"
          type="warning"
          showIcon
          style={{ marginBottom: '20px', borderRadius: '8px' }}
        />
      )}

      {/* Product Details and Quantities */}
      {product && (
        <>
          {/* Product Info */}
          <div style={{ 
            background: '#f0f5ff', 
            padding: '16px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            border: '1px solid #b7dcfa'
          }}>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <div>
                  <Text strong style={{ color: '#1890ff' }}>{product.name}</Text>
                  <Text style={{ marginLeft: '8px', color: '#666' }}>({product.nameUrdu})</Text>
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {product.company.name}
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ textAlign: 'right' }}>
                  <div>
                    <Text strong>Price: </Text>
                    <Text style={{ color: '#52c41a', fontSize: '16px', fontWeight: 'bold' }}>
                      {formatRupees(item.overrideSellPrice || product.sellPrice)}
                    </Text>
                    <Text style={{ color: '#666' }}>/unit</Text>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    {product.unitPerCarton} units per carton
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          {/* Sales Quantity */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <ShoppingOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
              <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>Units Sold</Text>
              <Tooltip title="Enter the number of cartons and individual units sold">
                <InfoCircleOutlined style={{ marginLeft: '8px', color: '#666' }} />
              </Tooltip>
            </div>
            <QuantityInput
              cartons={item.cartonsSold}
              units={item.unitsSold}
              unitsPerCarton={product.unitPerCarton}
              onChange={(cartons, units) => handleQuantityChange('sold', cartons, units)}
              placeholder="Enter quantity sold"
              style={{ borderRadius: '8px' }}
            />
          </div>

          {/* Returns Quantity */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <UndoOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
              <Text strong style={{ fontSize: '16px', color: '#ff4d4f' }}>Units Returned</Text>
              <Tooltip title="Enter the number of cartons and individual units returned by customers">
                <InfoCircleOutlined style={{ marginLeft: '8px', color: '#666' }} />
              </Tooltip>
            </div>
            <QuantityInput
              cartons={item.cartonsReturned}
              units={item.unitsReturned}
              unitsPerCarton={product.unitPerCarton}
              onChange={(cartons, units) => handleQuantityChange('returned', cartons, units)}
              placeholder="Enter quantity returned (if any)"
              style={{ borderRadius: '8px' }}
            />
          </div>

          {/* Item Summary */}
          <div style={{ 
            background: '#f6ffed', 
            padding: '16px', 
            borderRadius: '8px', 
            marginBottom: '16px',
            border: '1px solid #b7eb8f'
          }}>
            <Row gutter={16}>
              <Col xs={12} sm={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                    {formatRupees(totals.salesAmount)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Sales</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff4d4f' }}>
                    {formatRupees(totals.returnAmount)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Returns</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                    {formatRupees(totals.netAmount)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Net</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#722ed1' }}>
                    {totals.totalSoldUnits - totals.totalReturnedUnits}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Net Units</div>
                </div>
              </Col>
            </Row>
          </div>

          {/* Advanced Settings */}
          <Collapse 
            ghost 
            expandIcon={({ isActive }) => (
              <SettingOutlined style={{ color: '#666' }} rotate={isActive ? 90 : 0} />
            )}
          >
            <Panel 
              header={
                <Text style={{ color: '#666', fontSize: '14px' }}>
                  🔧 Advanced Settings (Optional)
                </Text>
              } 
              key="advanced"
            >
              <Alert
                message="Price Override"
                description="Only change these prices if they're different from the standard prices for this specific sale."
                type="info"
                showIcon
                style={{ marginBottom: '16px', borderRadius: '8px' }}
              />
              
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: '16px' }}>
                    <Text strong style={{ marginBottom: '8px', display: 'block' }}>
                      💰 Override Sell Price
                    </Text>
                    <InputNumber
                      value={item.overrideSellPrice}
                      onChange={(value) => onUpdate({ overrideSellPrice: value || undefined })}
                      placeholder={`Default: ${formatRupees(product.sellPrice)}`}
                      style={{ width: '100%', borderRadius: '6px' }}
                      min={0}
                      step={0.1}
                      formatter={(value) => `₨ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value!.replace(/\₨\s?|(,*)/g, '')}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: '16px' }}>
                    <Text strong style={{ marginBottom: '8px', display: 'block' }}>
                      🏷️ Override Cost Price
                    </Text>
                    <InputNumber
                      value={item.overrideCostPrice}
                      onChange={(value) => onUpdate({ overrideCostPrice: value || undefined })}
                      placeholder={`Default: ${formatRupees(product.costPrice)}`}
                      style={{ width: '100%', borderRadius: '6px' }}
                      min={0}
                      step={0.1}
                      formatter={(value) => `₨ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value!.replace(/\₨\s?|(,*)/g, '')}
                    />
                  </div>
                </Col>
              </Row>
            </Panel>
          </Collapse>
        </>
      )}
    </Card>
  );
};
