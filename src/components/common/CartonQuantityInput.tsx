import React, { useState } from 'react';
import { InputNumber, Button, Modal, Space, Typography, Card, Tooltip } from 'antd';
import { CalculatorOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface CartonQuantityValue {
  cartons: number;
  totalUnits: number;
}

interface CartonQuantityInputProps {
  value?: CartonQuantityValue;
  onChange?: (value: CartonQuantityValue) => void;
  unitPerCarton: number;
  disabled?: boolean;
  placeholder?: string;
  min?: number;
  allowDecimals?: boolean;
}

export const CartonQuantityInput: React.FC<CartonQuantityInputProps> = ({
  value = { cartons: 0, totalUnits: 0 },
  onChange,
  unitPerCarton,
  disabled = false,
  placeholder = "Enter cartons",
  min = 0,
  allowDecimals = true,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempCartons, setTempCartons] = useState(0);
  const [tempUnits, setTempUnits] = useState(0);

  // Calculate total units from cartons
  const calculateUnitsFromCartons = (cartons: number) => {
    return cartons * unitPerCarton;
  };

  // Handle direct carton input change
  const handleCartonChange = (cartons: number | null) => {
    const newCartons = cartons || 0;
    const newTotalUnits = calculateUnitsFromCartons(newCartons);
    
    const newValue: CartonQuantityValue = {
      cartons: newCartons,
      totalUnits: newTotalUnits,
    };
    
    onChange?.(newValue);
  };

  // Open detailed calculator modal
  const openCalculator = () => {
    // Initialize temp values based on current value
    if (allowDecimals && value.cartons % 1 !== 0) {
      // If we have decimal cartons, convert to whole cartons + units
      const wholeCartons = Math.floor(value.cartons);
      const remainingUnits = Math.round((value.cartons - wholeCartons) * unitPerCarton);
      setTempCartons(wholeCartons);
      setTempUnits(remainingUnits);
    } else {
      setTempCartons(Math.floor(value.cartons));
      setTempUnits(value.totalUnits % unitPerCarton);
    }
    setIsModalOpen(true);
  };

  // Apply calculator values
  const applyCalculatorValues = () => {
    const totalUnits = (tempCartons * unitPerCarton) + tempUnits;
    const cartons = allowDecimals ? totalUnits / unitPerCarton : tempCartons;
    
    const newValue: CartonQuantityValue = {
      cartons,
      totalUnits,
    };
    
    onChange?.(newValue);
    setIsModalOpen(false);
  };

  // Handle temp cartons change in modal
  const handleTempCartonsChange = (cartons: number | null) => {
    setTempCartons(cartons || 0);
  };

  // Handle temp units change in modal
  const handleTempUnitsChange = (units: number | null) => {
    const newUnits = units || 0;
    
    // If units exceed unitPerCarton, convert to additional cartons
    if (newUnits >= unitPerCarton) {
      const additionalCartons = Math.floor(newUnits / unitPerCarton);
      const remainingUnits = newUnits % unitPerCarton;
      setTempCartons(tempCartons + additionalCartons);
      setTempUnits(remainingUnits);
    } else {
      setTempUnits(newUnits);
    }
  };

  return (
    <Space.Compact style={{ width: '100%' }}>
      <InputNumber
        value={value.cartons}
        onChange={handleCartonChange}
        disabled={disabled}
        placeholder={placeholder}
        min={min}
        precision={allowDecimals ? 2 : 0}
        style={{ flex: 1 }}
        addonAfter="cartons"
      />
      <Tooltip title="Open carton calculator">
        <Button
          icon={<CalculatorOutlined />}
          onClick={openCalculator}
          disabled={disabled}
        />
      </Tooltip>

      <Modal
        title="Carton Calculator"
        open={isModalOpen}
        onOk={applyCalculatorValues}
        onCancel={() => setIsModalOpen(false)}
        okText="Apply"
        cancelText="Cancel"
        width={500}
      >
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>Enter quantity as cartons + individual units:</Text>
            
            <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space align="center">
                <Text>Cartons:</Text>
                <InputNumber
                  value={tempCartons}
                  onChange={handleTempCartonsChange}
                  min={0}
                  precision={0}
                  style={{ width: 100 }}
                />
              </Space>
              
              <Text>+</Text>
              
              <Space align="center">
                <Text>Units:</Text>
                <InputNumber
                  value={tempUnits}
                  onChange={handleTempUnitsChange}
                  min={0}
                  max={unitPerCarton - 1}
                  precision={0}
                  style={{ width: 100 }}
                />
              </Space>
            </Space>

            <div style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 6 }}>
              <Space direction="vertical" size="small">
                <Text strong>Calculation:</Text>
                <Text>
                  {tempCartons} cartons × {unitPerCarton} units/carton = {tempCartons * unitPerCarton} units
                </Text>
                {tempUnits > 0 && (
                  <Text>+ {tempUnits} individual units</Text>
                )}
                <Text strong>
                  Total: {(tempCartons * unitPerCarton) + tempUnits} units
                  {allowDecimals && (
                    <> = {((tempCartons * unitPerCarton) + tempUnits) / unitPerCarton} cartons</>
                  )}
                </Text>
              </Space>
            </div>

            <Text type="secondary" style={{ fontSize: '12px' }}>
              Note: Units per carton for this product is {unitPerCarton}
            </Text>
          </Space>
        </Card>
      </Modal>
    </Space.Compact>
  );
};

export default CartonQuantityInput;
