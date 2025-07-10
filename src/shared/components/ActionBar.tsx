import React, { ReactNode } from 'react';
import { Space, Input, Button, Dropdown } from 'antd';
import { PlusOutlined, ExportOutlined, FilePdfOutlined, FileWordOutlined, FileExcelOutlined, DownOutlined } from '@ant-design/icons';

const { Search } = Input;

export interface ExportFormat {
  key: string;
  label: string;
  icon?: ReactNode;
}

export interface ActionBarProps {
  onSearch?: (value: string) => void;
  searchValue?: string;
  searchPlaceholder?: string;
  onAdd?: () => void;
  addLabel?: string;
  onExport?: (format: string) => void;
  exportLabel?: string;
  exportFormats?: ExportFormat[];
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
  exportFormats,
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
        <Dropdown
          menu={{
            items: (exportFormats || [
              { key: 'excel', label: 'Excel', icon: <FileExcelOutlined /> },
              { key: 'pdf', label: 'PDF', icon: <FilePdfOutlined /> },
              { key: 'word', label: 'Word', icon: <FileWordOutlined /> },
            ]).map(format => ({
              key: format.key,
              label: format.label,
              icon: format.icon,
              onClick: () => onExport?.(format.key)
            }))
          }}
        >
          <Button>
            <Space>
              <ExportOutlined />
              {exportLabel}
              <DownOutlined />
            </Space>
          </Button>
        </Dropdown>
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
