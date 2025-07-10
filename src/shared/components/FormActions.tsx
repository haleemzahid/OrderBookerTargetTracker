import React from 'react';
import { Space, Button } from 'antd';

export interface FormActionsProps {
  onSubmit?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  isEditing?: boolean;
  submitButtonType?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  cancelButtonType?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  extraActions?: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

/**
 * FormActions - A reusable component for form action buttons
 * Includes submit and cancel buttons
 */
export const FormActions: React.FC<FormActionsProps> = ({
  onSubmit,
  onCancel,
  submitLabel,
  cancelLabel = 'Cancel',
  isLoading = false,
  isEditing = false,
  submitButtonType = 'primary',
  cancelButtonType = 'default',
  extraActions,
  align = 'left',
}) => {
  return (
    <Space style={{ display: 'flex', justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start' }}>
      <Button 
        type={submitButtonType} 
        htmlType="submit" 
        loading={isLoading}
        onClick={onSubmit}
      >
        {submitLabel || (isEditing ? 'Update' : 'Create')}
      </Button>
      
      {onCancel && (
        <Button 
          type={cancelButtonType}
          onClick={onCancel}
          disabled={isLoading}
        >
          {cancelLabel}
        </Button>
      )}
      
      {extraActions}
    </Space>
  );
};
