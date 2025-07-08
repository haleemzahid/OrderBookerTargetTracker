import React from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Select, 
  InputNumber, 
  Button, 
  Typography, 
  Badge, 
  Tooltip,
  Divider,
} from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { ProductWithCompany } from '../../products/types';
import { formatRupees } from '../../../shared/utils/currency';

const { Text, Title } = Typography;
const { Option } = Select;

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
  disableEditing?: boolean;
}

export const ProductItemCard: React.FC<ProductItemCardProps> = ({
  item,
  index,
  products,
  onUpdate,
  onRemove,
  disableEditing = false,
}) => {
  const selectedProduct = item.product || 
    products.find(p => p.id === item.productId) || 
    null;

  // Calculate totals
  const unitPerCarton = selectedProduct?.unitPerCarton || 1;
  const sellPrice = item.overrideSellPrice || selectedProduct?.sellPrice || 0;
  
  // Calculate total units
  const totalUnitsSold = (item.cartonsSold * unitPerCarton) + item.unitsSold;
  const totalUnitsReturned = (item.cartonsReturned * unitPerCarton) + item.unitsReturned;
  const netUnits = totalUnitsSold - totalUnitsReturned;
  
  // Calculate amounts
  const totalAmount = totalUnitsSold * sellPrice;
  const totalReturnAmount = totalUnitsReturned * sellPrice;
  const netAmount = totalAmount - totalReturnAmount;

  const handleProductChange = (productId: string) => {
    const newProduct = products.find(p => p.id === productId);
    onUpdate({ 
      productId, 
      product: newProduct,
    });
  };

  return (
    <Card
    id={"item__" + index.toString()}
      style={{ 
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderLeft: selectedProduct?.company ? `4px solid #1890ff` : undefined
      }}
    >
      <Row gutter={[16, 16]} align="middle">
        {/* Product Selection */}
        <Col xs={24} md={8}>
          <div style={{ marginBottom: '8px' }}>
            <Text strong>Product</Text>
          </div>
          <Select
            showSearch
            style={{ width: '100%' }}
            placeholder="Select product"
            optionFilterProp="children"
            value={item.productId || undefined}
            onChange={handleProductChange}
            disabled={disableEditing}
          >
            {products.map(product => (
              <Option key={product.id} value={product.id}>
                <div>
                  <Badge color={product.company?.name ? '#1890ff' : '#999'} text={product.company?.name} /> 
                  <div><strong>{product.name}</strong></div>
                </div>
              </Option>
            ))}
          </Select>

          {selectedProduct && (
            <div style={{ marginTop: '8px' }}>
              <Text type="secondary">
                <Tooltip title="Units per carton">
                  <Badge
                    count={`${selectedProduct.unitPerCarton} units/carton`}
                    style={{ backgroundColor: '#faad14' }}
                  />
                </Tooltip>
                <span style={{ marginLeft: '8px' }}>
                  <Tooltip title="Regular price">
                    {formatRupees(selectedProduct.sellPrice)}/unit
                  </Tooltip>
                </span>
              </Text>
            </div>
          )}
        </Col>

        {/* Sales Input */}
        <Col xs={24} md={7}>
          <div style={{ marginBottom: '8px' }}>
            <Text strong>Sales</Text>
          </div>
          <Row gutter={8}>
            <Col span={12}>
              <div style={{ marginBottom: '4px' }}>
                <Text type="secondary">Cartons</Text>
              </div>
              <InputNumber
                min={0}
                value={item.cartonsSold}
                onChange={value => onUpdate({ cartonsSold: value || 0 })}
                style={{ width: '100%' }}
                disabled={!selectedProduct || disableEditing}
              />
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: '4px' }}>
                <Text type="secondary">Units</Text>
              </div>
              <InputNumber
                min={0}
                max={unitPerCarton - 1}
                value={item.unitsSold}
                onChange={value => onUpdate({ unitsSold: value || 0 })}
                style={{ width: '100%' }}
                disabled={!selectedProduct || disableEditing}
              />
            </Col>
          </Row>
          <div style={{ marginTop: '4px' }}>
            <Text type="secondary">Total: {totalUnitsSold} units</Text>
          </div>
        </Col>

        {/* Returns Input */}
        <Col xs={24} md={7}>
          <div style={{ marginBottom: '8px' }}>
            <Text strong>Returns</Text>
          </div>
          <Row gutter={8}>
            <Col span={12}>
              <div style={{ marginBottom: '4px' }}>
                <Text type="secondary">Cartons</Text>
              </div>
              <InputNumber
                min={0}
                max={item.cartonsSold}
                value={item.cartonsReturned}
                onChange={value => onUpdate({ cartonsReturned: value || 0 })}
                style={{ width: '100%' }}
                disabled={!selectedProduct}
              />
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: '4px' }}>
                <Text type="secondary">Units</Text>
              </div>
              <InputNumber
                min={0}
                max={
                  item.cartonsReturned < item.cartonsSold 
                    ? unitPerCarton - 1 
                    : item.unitsSold
                }
                value={item.unitsReturned}
                onChange={value => onUpdate({ unitsReturned: value || 0 })}
                style={{ width: '100%' }}
                disabled={!selectedProduct}
              />
            </Col>
          </Row>
          <div style={{ marginTop: '4px' }}>
            <Text type="secondary">Total: {totalUnitsReturned} units</Text>
          </div>
        </Col>

        {/* Actions */}
        <Col xs={24} md={2} style={{ textAlign: 'center' }}>
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={onRemove}
            disabled={disableEditing}
          />
        </Col>
      </Row>

      {/* Summary Section */}
      {selectedProduct && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <Row gutter={16} style={{ textAlign: 'center' }}>
            <Col xs={8}>
              <Text type="secondary">Total Amount</Text>
              <div>
                <Title level={5} style={{ color: '#1890ff', margin: '4px 0' }}>
                  {formatRupees(totalAmount)}
                </Title>
              </div>
            </Col>
            <Col xs={8}>
              <Text type="secondary">Return Amount</Text>
              <div>
                <Title level={5} style={{ color: '#ff4d4f', margin: '4px 0' }}>
                  {formatRupees(totalReturnAmount)}
                </Title>
              </div>
            </Col>
            <Col xs={8}>
              <Text type="secondary">Net Amount</Text>
              <div>
                <Title level={5} style={{ color: '#52c41a', margin: '4px 0' }}>
                  {formatRupees(netAmount)}
                </Title>
              </div>
            </Col>
          </Row>
          <Row gutter={16} style={{ textAlign: 'center', marginTop: '8px' }}>
            <Col xs={8}>
              <Badge status="processing" text={`${totalUnitsSold} units sold`} />
            </Col>
            <Col xs={8}>
              <Badge status="error" text={`${totalUnitsReturned} units returned`} />
            </Col>
            <Col xs={8}>
              <Badge status="success" text={`${netUnits} net units`} />
            </Col>
          </Row>

          <div style={{ marginTop: '8px' }}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Button
                  size="small"
                  type="dashed"
                  icon={<EditOutlined />}
                  onClick={() => {
                    const price = prompt('Enter override sell price per unit:', sellPrice.toString());
                    if (price && !isNaN(Number(price))) {
                      onUpdate({ overrideSellPrice: Number(price) });
                    }
                  }}
                  style={{ width: '100%' }}
                  disabled={disableEditing}
                >
                  {item.overrideSellPrice 
                    ? `Override Price: ${formatRupees(item.overrideSellPrice)}/unit` 
                    : 'Override Price'}
                </Button>
              </Col>
            </Row>
          </div>
        </>
      )}
    </Card>
  );
};
