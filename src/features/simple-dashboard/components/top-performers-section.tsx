import React from 'react';
import { Card, List, Typography, Badge, Empty } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import type { SimplePerformer } from '../types';

const { Title, Text } = Typography;

export interface TopPerformersSectionProps {
  performers: SimplePerformer[];
  loading?: boolean;
}

const TopPerformersSection: React.FC<TopPerformersSectionProps> = ({ 
  performers, 
  loading = false 
}) => {
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return '⭐';
    }
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 100) return '#52c41a'; // Green for 100%+
    if (percentage >= 90) return '#73d13d';  // Light green for 90%+
    if (percentage >= 80) return '#95de64';  // Lighter green for 80%+
    return '#faad14'; // Gold for others
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrophyOutlined style={{ color: '#faad14' }} />
          <Title level={4} style={{ margin: 0 }}>
            Top Performers
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
              No top performers data available
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
                  <span style={{ fontSize: '18px', minWidth: '24px' }}>
                    {getRankIcon(index)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: '14px' }}>
                      {performer.orderBookerName}
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

export default TopPerformersSection;
