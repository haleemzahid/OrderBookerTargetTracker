import React from 'react';
import { Typography, Space, Spin, Alert, Progress, List, Avatar, Tag } from 'antd';
import { TrophyOutlined, ArrowUpOutlined, ArrowDownOutlined, UserOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { WidgetDataService } from '../../api/widget-data-service';
import { useDashboardFilters } from '../../stores/dashboard-store';
import type { TopPerformerData } from '../../types';

const { Text, Title } = Typography;

interface TopPerformersWidgetProps {
  refreshInterval?: number;
  maxResults?: number;
}

export const TopPerformersWidget: React.FC<TopPerformersWidgetProps> = React.memo(({
  refreshInterval = 900000, // 15 minutes default
  maxResults = 10
}) => {
  const filters = useDashboardFilters();
  
  const { data: response, isLoading, error, isError } = useQuery({
    queryKey: ['top-performers', filters, maxResults],
    queryFn: () => WidgetDataService.getTopPerformers(filters),
    refetchInterval: refreshInterval,
    staleTime: refreshInterval / 2,
    gcTime: refreshInterval * 2
  });
  
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" tip="Loading performers data..." />
      </div>
    );
  }
  
  if (isError || response?.status === 'error') {
    return (
      <Alert
        message="Error Loading Performers Data"
        description={response?.error || error?.message || 'Failed to load top performers metrics'}
        type="error"
        showIcon
      />
    );
  }
  
  const performers: TopPerformerData[] = response?.data || [];
  const topPerformers = performers.slice(0, maxResults);
  
  // Format currency for Pakistani context
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: amount > 1000000 ? 'compact' : 'standard'
    }).format(amount);
  };
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUpOutlined style={{ color: '#52c41a', fontSize: '12px' }} />;
      case 'down': return <ArrowDownOutlined style={{ color: '#ff4d4f', fontSize: '12px' }} />;
      default: return null;
    }
  };
  
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return '#f39c12'; // Gold
      case 2: return '#95a5a6'; // Silver
      case 3: return '#cd7f32'; // Bronze
      default: return '#8c8c8c';
    }
  };
  
  const getAchievementStatus = (percentage: number) => {
    if (percentage >= 100) return { color: '#52c41a', status: 'success' };
    if (percentage >= 80) return { color: '#faad14', status: 'warning' };
    return { color: '#ff4d4f', status: 'exception' };
  };
  
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <Space align="center">
          <TrophyOutlined style={{ fontSize: '20px', color: '#f39c12' }} />
          <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
            Top Performers
          </Title>
        </Space>
        
        <Text type="secondary" style={{ fontSize: '12px' }}>
          Ranked by target achievement percentage
        </Text>
      </div>
      
      {/* Empty State */}
      {topPerformers.length === 0 ? (
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center',
          color: '#8c8c8c'
        }}>
          <UserOutlined style={{ fontSize: '32px', marginBottom: '8px' }} />
          <Text type="secondary">No performance data available</Text>
        </div>
      ) : (
        <>
          {/* Performers List */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            <List
              size="small"
              dataSource={topPerformers}
              renderItem={(performer, index) => {
                const achievementStatus = getAchievementStatus(performer.achievementPercentage);
                const isTopThree = performer.rank <= 3;
                
                return (
                  <List.Item style={{ 
                    padding: '8px 0',
                    borderBottom: index < topPerformers.length - 1 ? '1px solid #f0f0f0' : 'none'
                  }}>
                    <div style={{ width: '100%' }}>
                      {/* Name and Rank Row */}
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                        <Avatar 
                          size="small" 
                          style={{ 
                            backgroundColor: getRankColor(performer.rank),
                            fontSize: '12px',
                            fontWeight: 'bold',
                            marginRight: '8px'
                          }}
                        >
                          {performer.rank}
                        </Avatar>
                        
                        <div style={{ flex: 1 }}>
                          <Text strong style={{ 
                            fontSize: '13px',
                            color: isTopThree ? getRankColor(performer.rank) : '#262626'
                          }}>
                            {performer.orderBookerName}
                          </Text>
                          {getTrendIcon(performer.trend) && (
                            <span style={{ marginLeft: '4px' }}>
                              {getTrendIcon(performer.trend)}
                            </span>
                          )}
                        </div>
                        
                        <Text strong style={{ 
                          fontSize: '12px',
                          color: achievementStatus.color
                        }}>
                          {performer.achievementPercentage.toFixed(1)}%
                        </Text>
                      </div>
                      
                      {/* Progress Bar */}
                      <div style={{ marginBottom: '4px' }}>
                        <Progress
                          percent={Math.min(performer.achievementPercentage, 100)}
                          size="small"
                          strokeColor={achievementStatus.color}
                          trailColor="#f0f0f0"
                          showInfo={false}
                          strokeWidth={4}
                        />
                      </div>
                      
                      {/* Achievement Details */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space size={4}>
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            {formatCurrency(performer.achievedAmount)} / {formatCurrency(performer.targetAmount)}
                          </Text>
                        </Space>
                        
                        <Space size={4}>
                          <Tag color="blue" style={{ fontSize: '10px', padding: '0 4px' }}>
                            {performer.ordersCount} orders
                          </Tag>
                        </Space>
                      </div>
                    </div>
                  </List.Item>
                );
              }}
            />
          </div>
          
          {/* Summary Footer */}
          <div style={{ 
            marginTop: '12px',
            padding: '8px',
            backgroundColor: '#fafafa',
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Showing top {topPerformers.length} of {performers.length} performers
            </Text>
          </div>
        </>
      )}
      
      {/* Status Indicator */}
      <div style={{ 
        marginTop: '8px',
        fontSize: '10px',
        color: '#8c8c8c',
        textAlign: 'center'
      }}>
        Last updated: {response?.lastUpdated ? new Date(response.lastUpdated).toLocaleTimeString() : 'Unknown'}
      </div>
    </div>
  );
});

TopPerformersWidget.displayName = 'TopPerformersWidget';

export default TopPerformersWidget;
