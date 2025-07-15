import React from 'react';
import { Tag, Badge, Tooltip } from 'antd';
import { CheckCircleOutlined, WarningOutlined, StopOutlined } from '@ant-design/icons';
import type { StockLevelIndicatorProps } from '../types';
import { getStockStatus } from '../utils/stock-calculations';

export const StockLevelIndicator: React.FC<StockLevelIndicatorProps> = ({
  currentStock,
  lowStockThreshold,
  size = 'default',
  showText = true
}) => {
  const stockStatus = getStockStatus(currentStock, lowStockThreshold);
  
  const getStatusConfig = () => {
    switch (stockStatus) {
      case 'IN_STOCK':
        return {
          color: 'success',
          icon: <CheckCircleOutlined />,
          text: 'In Stock',
          badgeStatus: 'success' as const,
        };
      case 'LOW_STOCK':
        return {
          color: 'warning',
          icon: <WarningOutlined />,
          text: 'Low Stock',
          badgeStatus: 'warning' as const,
        };
      case 'OUT_OF_STOCK':
        return {
          color: 'error',
          icon: <StopOutlined />,
          text: 'Out of Stock',
          badgeStatus: 'error' as const,
        };
      default:
        return {
          color: 'default',
          icon: null,
          text: 'Unknown',
          badgeStatus: 'default' as const,
        };
    }
  };

  const config = getStatusConfig();
  
  const stockText = showText 
    ? `${currentStock} ${config.text}`
    : currentStock.toString();

  const tooltipTitle = (
    <div>
      <div>Current Stock: {currentStock}</div>
      <div>Low Stock Threshold: {lowStockThreshold}</div>
      <div>Status: {config.text}</div>
    </div>
  );

  if (size === 'small') {
    return (
      <Tooltip title={tooltipTitle}>
        <Badge 
          status={config.badgeStatus} 
          text={showText ? stockText : undefined}
        />
      </Tooltip>
    );
  }

  return (
    <Tooltip title={tooltipTitle}>
      <Tag 
        color={config.color} 
        icon={config.icon}
        style={{ 
          margin: 0,
          fontSize: size === 'large' ? '14px' : '12px',
          padding: size === 'large' ? '4px 8px' : '2px 6px'
        }}
      >
        {stockText}
      </Tag>
    </Tooltip>
  );
};
