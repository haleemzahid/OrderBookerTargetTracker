import React, { ReactNode } from 'react';
import { Space, Input, Button } from 'antd';
import { PlusOutlined, ExportOutlined } from '@ant-design/icons';

const { Search } = Input;

export interface ActionBarProps {
  onSearch?: (value: string) => void;
  searchValue?: string;
  searchPlaceholder?: string;
  onAdd?: () => void;
  addLabel?: string;
  onExport?: () => void;
  exportLabel?: string;
  showSearch?: boolean;
  showAdd?: boolean;
  showExport?: boolean;
  extraActions?: ReactNode;
}

/**
 * ActionBar - A reusable component for list page actions
 * Includes search, add, and export functionality
 */
export const ActionBar: React.FC<ActionBarProps> = ({
  onSearch,
  searchValue = '',
  searchPlaceholder = 'Search...',
  onAdd,
  addLabel = 'Add',
  onExport,
  exportLabel = 'Export',
  showSearch = true,
  showAdd = true,
  showExport = true,
  extraActions,
}) => {
  return (
    <Space size="small" wrap style={{ display: 'flex', justifyContent: 'flex-end' }}>
      {showSearch && (
        <Search
          placeholder={searchPlaceholder}
          allowClear
          value={searchValue}
          onChange={(e) => onSearch?.(e.target.value)}
          style={{ width: 200 }}
        />
      )}
      
      {extraActions}
      
      {showExport && (
        <Button 
          icon={<ExportOutlined />} 
          onClick={onExport}
        >
          {exportLabel}
        </Button>
      )}
      
      {showAdd && (
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={onAdd}
        >
          {addLabel}
        </Button>
      )}
    </Space>
  );
};
