import React from 'react';
import { Card, List, Typography, Badge, Empty } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import type { SimplePerformer } from '../types';

const { Title, Text } = Typography;

export interface NeedsAttentionSectionProps {
  performers: SimplePerformer[];
  loading?: boolean;
}

const NeedsAttentionSection: React.FC<NeedsAttentionSectionProps> = ({ 
  performers, 
  loading = false 
}) => {
  const getUrgencyIcon = (percentage: number) => {
    if (percentage === 0) return '🚨'; // Critical - no progress
    if (percentage < 20) return '❗'; // Very urgent
    if (percentage < 40) return '⚠️'; // Urgent
    return '📉'; // Needs attention
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage === 0) return '#ff4d4f'; // Red for 0%
    if (percentage < 20) return '#ff7875'; // Light red for <20%
    if (percentage < 40) return '#ffa940'; // Orange for <40%
    return '#faad14'; // Gold for others
  };

  const getUrgencyLevel = (percentage: number) => {
    if (percentage === 0) return 'Critical';
    if (percentage < 20) return 'Very Urgent';
    if (percentage < 40) return 'Urgent';
    return 'Attention';
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
          <Title level={4} style={{ margin: 0 }}>
            Needs Attention
          </Title>
        </div>
      }
      style={{ height: '100%' }}
      bodyStyle={{ padding: '16px' }}
    >
      {performers.length === 0 && !loading ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Text type="secondary">
              All order bookers are performing well!
            </Text>
          }
        />
      ) : (
        <List
          loading={loading}
          dataSource={performers}
          renderItem={(performer, index) => (
            <List.Item
              style={{
                padding: '12px 0',
                borderBottom: index === performers.length - 1 ? 'none' : '1px solid #f0f0f0'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <span style={{ fontSize: '16px', minWidth: '24px' }}>
                    {getUrgencyIcon(performer.achievementPercentage)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: '14px' }}>
                      {performer.orderBookerName}
                    </Text>
                    <br />
                    <Text 
                      type="secondary" 
                      style={{ 
                        fontSize: '12px',
                        color: getPerformanceColor(performer.achievementPercentage)
                      }}
                    >
                      {getUrgencyLevel(performer.achievementPercentage)}
                    </Text>
                  </div>
                </div>
                <Badge
                  count={`${performer.achievementPercentage.toFixed(1)}%`}
                  style={{
                    backgroundColor: getPerformanceColor(performer.achievementPercentage),
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    minWidth: '50px',
                    height: '22px',
                    lineHeight: '22px',
                    borderRadius: '11px'
                  }}
                />
              </div>
            </List.Item>
          )}
          style={{ maxHeight: '300px', overflowY: 'auto' }}
        />
      )}
    </Card>
  );
};

export default NeedsAttentionSection;
