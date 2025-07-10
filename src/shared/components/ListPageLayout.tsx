import React, { ReactNode } from 'react';
import { Card } from 'antd';

export interface ListPageLayoutProps {
  children: ReactNode;
  title?: string | ReactNode;
  extraActions?: ReactNode;
  headerStyle?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
  loading?: boolean;
}

/**
 * ListPageLayout - A reusable component for list pages
 * Provides consistent layout structure for all list pages
 */
export const ListPageLayout: React.FC<ListPageLayoutProps> = ({
  children,
  title,
  extraActions,
  headerStyle,
  bodyStyle,
  loading = false,
}) => {
  return (
    <Card
      title={title}
      extra={extraActions}
      bordered={true}
      loading={loading}
      style={{ height: '100%' }}
      bodyStyle={{ 
        padding: '16px',
        ...bodyStyle 
      }}
      headStyle={{
        padding: '0 16px',
        ...headerStyle
      }}
    >
      {children}
    </Card>
  );
};
