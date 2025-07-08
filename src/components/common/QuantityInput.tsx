import React, { useState, useEffect } from 'react';
import { Input, Radio, Space, Typography, Card } from 'antd';
import type { QuantityInput } from '../../features/products/types';

const { Text } = Typography;

interface QuantityInputComponentProps {
  value?: QuantityInput;
  onChange?: (value: QuantityInput) => void;
  unitPerCarton: number;
  disabled?: boolean;
  placeholder?: string;
}

export const QuantityInputComponent: React.FC<QuantityInputComponentProps> = ({
  value = { cartons: 0, units: 0, totalUnits: 0 },
  onChange,
  unitPerCarton,
  disabled = false,
  placeholder = "Enter quantity",
}) => {
  const [mode, setMode] = useState<'cartons' | 'units'>('cartons');
  const [cartons, setCartons] = useState(value.cartons);
  const [units, setUnits] = useState(value.units);

  // Calculate total units whenever cartons or units change
  const calculateTotal = (cartonValue: number, unitValue: number) => {
    return (cartonValue * unitPerCarton) + unitValue;
  };

  // Update parent when values change
  useEffect(() => {
    const totalUnits = calculateTotal(cartons, units);
    const newValue: QuantityInput = {
      cartons,
      units,
      totalUnits,
    };
    
    if (onChange && (
      newValue.cartons !== value.cartons ||
      newValue.units !== value.units ||
      newValue.totalUnits !== value.totalUnits
    )) {
      onChange(newValue);
    }
  }, [cartons, units, unitPerCarton, onChange, value]);

  // Update local state when external value changes
  useEffect(() => {
    if (value.cartons !== cartons) setCartons(value.cartons);
    if (value.units !== units) setUnits(value.units);
  }, [value.cartons, value.units]);

  const handleCartonsChange = (cartonsValue: number) => {
    setCartons(cartonsValue);
    
    // If we're in cartons mode and adding cartons, reset individual units
    if (mode === 'cartons' && cartonsValue > 0) {
      setUnits(0);
    }
  };

  const handleUnitsChange = (unitsValue: number) => {
    // If entering more units than a carton, convert to cartons + remainder
    if (unitsValue >= unitPerCarton) {
      const additionalCartons = Math.floor(unitsValue / unitPerCarton);
      const remainingUnits = unitsValue % unitPerCarton;
      setCartons(cartons + additionalCartons);
      setUnits(remainingUnits);
    } else {
      setUnits(unitsValue);
    }
  };

  const handleDirectUnitsChange = (totalUnitsValue: number) => {
    const newCartons = Math.floor(totalUnitsValue / unitPerCarton);
    const newUnits = totalUnitsValue % unitPerCarton;
    setCartons(newCartons);
    setUnits(newUnits);
  };

  const totalUnits = calculateTotal(cartons, units);

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Radio.Group
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          disabled={disabled}
        >
          <Radio value="cartons">Cartons + Units</Radio>
          <Radio value="units">Total Units</Radio>
        </Radio.Group>

        {mode === 'cartons' ? (
          <Space direction="horizontal" style={{ width: '100%' }}>
            <div>
              <Text strong>Cartons:</Text>
              <Input
                type="number"
                min={0}
                value={cartons}
                onChange={(e) => handleCartonsChange(parseInt(e.target.value) || 0)}
                disabled={disabled}
                placeholder="0"
                style={{ width: 100 }}
              />
            </div>
            <Text>+</Text>
            <div>
              <Text strong>Units:</Text>
              <Input
                type="number"
                min={0}
                max={unitPerCarton - 1}
                value={units}
                onChange={(e) => handleUnitsChange(parseInt(e.target.value) || 0)}
                disabled={disabled}
                placeholder="0"
                style={{ width: 100 }}
              />
            </div>
          </Space>
        ) : (
          <div>
            <Text strong>Total Units:</Text>
            <Input
              type="number"
              min={0}
              value={totalUnits}
              onChange={(e) => handleDirectUnitsChange(parseInt(e.target.value) || 0)}
              disabled={disabled}
              placeholder={placeholder}
              style={{ width: 150 }}
            />
          </div>
        )}

        <div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {mode === 'cartons' ? (
              <>Total: {totalUnits} units ({unitPerCarton} units per carton)</>
            ) : (
              <>Equivalent: {cartons} cartons + {units} units ({unitPerCarton} units per carton)</>
            )}
          </Text>
        </div>
      </Space>
    </Card>
  );
};
