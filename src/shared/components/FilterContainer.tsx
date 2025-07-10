import React, { ReactNode } from 'react';
import { Row, Col, Card } from 'antd';

export interface FilterContainerProps {
  children: ReactNode;
  title?: string;
  extra?: ReactNode;
  gutter?: number;
  compact?: boolean;
}

/**
 * FilterContainer - A reusable component for filter sections in list pages
 */
export const FilterContainer: React.FC<FilterContainerProps> = ({
  children,
  title,
  extra,
  gutter = 16,
  compact = true,
}) => {
  return (
    <Card 
      title={title}
      extra={extra}
      size={compact ? "small" : "default"}
      bodyStyle={{ padding: compact ? '12px' : '24px' }}
      style={{ marginBottom: compact ? 12 : 16 }}
    >
      <Row gutter={[gutter, gutter]}>
        {React.Children.map(children, (child, index) => (
          <Col key={index}>{child}</Col>
        ))}
      </Row>
    </Card>
  );
};

export interface FilterItemProps {
  children: ReactNode;
  span?: number;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

/**
 * FilterItem - A wrapper for individual filter controls
 */
export const FilterItem: React.FC<FilterItemProps> = ({
  children,
  span = 6,
  xs = 24,
  sm = 12,
  md = 8,
  lg = 6,
  xl = 6,
}) => {
  return (
    <Col xs={xs} sm={sm} md={md} lg={lg} xl={xl} span={span}>
      {children}
    </Col>
  );
};
