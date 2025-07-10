import React from 'react';
import { Space, Button, Popconfirm, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

export interface TableActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  deleteConfirmTitle?: string;
  hideEdit?: boolean;
  hideDelete?: boolean;
  extraActions?: React.ReactNode;
  size?: 'small' | 'middle' | 'large';
}

/**
 * TableActions - A reusable component for table row actions
 * Includes edit and delete functionality with confirmation
 */
export const TableActions: React.FC<TableActionsProps> = ({
  onEdit,
  onDelete,
  deleteConfirmTitle = 'Are you sure you want to delete this item?',
  hideEdit = false,
  hideDelete = false,
  extraActions,
  size = 'small',
}) => {
  return (
    <Space size={size}>
      {extraActions}
      
      {!hideEdit && onEdit && (
        <Tooltip title="Edit">
          <Button 
            icon={<EditOutlined />} 
            size={size} 
            type="text"
            onClick={onEdit}
          />
        </Tooltip>
      )}
      
      {!hideDelete && onDelete && (
        <Tooltip title="Delete">
          <Popconfirm
            title={deleteConfirmTitle}
            onConfirm={onDelete}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              icon={<DeleteOutlined />} 
              size={size} 
              type="text"
              danger
            />
          </Popconfirm>
        </Tooltip>
      )}
    </Space>
  );
};
