import React from 'react';
import { Typography, Space, Spin, Alert, Progress, List, Tag, Tooltip } from 'antd';
import { 
  AimOutlined, 
  CalendarOutlined,
  RiseOutlined,
  FallOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { WidgetDataService } from '../../api/widget-data-service';
import { useDashboardFilters } from '../../stores/dashboard-store';
import type { TargetProgressData } from '../../types';

const { Text, Title } = Typography;

interface TargetProgressWidgetProps {
  refreshInterval?: number;
  maxEntries?: number;
}

export const TargetProgressWidget: React.FC<TargetProgressWidgetProps> = React.memo(({
  refreshInterval = 900000, // 15 minutes default
  maxEntries = 8
}) => {
  const filters = useDashboardFilters();
  
  const { data: response, isLoading, error, isError } = useQuery({
    queryKey: ['target-progress', filters],
    queryFn: () => WidgetDataService.getTargetProgress(filters),
    refetchInterval: refreshInterval,
    staleTime: refreshInterval / 2,
    gcTime: refreshInterval * 2
  });
  
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" tip="Loading target progress..." />
      </div>
    );
  }
  
  if (isError || response?.status === 'error') {
    return (
      <Alert
        message="Error Loading Target Progress"
        description={response?.error || error?.message || 'Failed to load target progress data'}
        type="error"
        showIcon
      />
    );
  }
  
  const progressData: TargetProgressData[] = response?.data || [];
  const displayData = progressData.slice(0, maxEntries);
  
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
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ahead': return '#52c41a';
      case 'on-track': return '#1890ff';
      case 'at-risk': return '#faad14';
      case 'behind': return '#ff4d4f';
      default: return '#8c8c8c';
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'ahead': return 'Ahead';
      case 'on-track': return 'On Track';
      case 'at-risk': return 'At Risk';
      case 'behind': return 'Behind';
      default: return 'Unknown';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ahead': return <RiseOutlined style={{ color: '#52c41a' }} />;
      case 'on-track': return <ArrowRightOutlined style={{ color: '#1890ff' }} />;
      case 'at-risk': return <FallOutlined style={{ color: '#faad14' }} />;
      case 'behind': return <FallOutlined style={{ color: '#ff4d4f' }} />;
      default: return null;
    }
  };
  
  const getTrendDirection = (current: number, required: number) => {
    if (current > required * 1.1) return 'positive';
    if (current < required * 0.9) return 'negative';
    return 'neutral';
  };
  
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <Space align="center">
          <AimOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
          <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
            Target Progress
          </Title>
        </Space>
        
        <Text type="secondary" style={{ fontSize: '12px' }}>
          Monthly target achievement status
        </Text>
      </div>
      
      {/* Empty State */}
      {displayData.length === 0 ? (
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center',
          color: '#8c8c8c'
        }}>
          <AimOutlined style={{ fontSize: '32px', marginBottom: '8px' }} />
          <Text type="secondary">No target data available</Text>
        </div>
      ) : (
        <>
          {/* Progress List */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            <List
              size="small"
              dataSource={displayData}
              renderItem={(item, index) => {
                const trendDirection = getTrendDirection(item.currentDailyAverage, item.requiredDailyAverage);
                const statusColor = getStatusColor(item.status);
                
                return (
                  <List.Item style={{ 
                    padding: '10px 0',
                    borderBottom: index < displayData.length - 1 ? '1px solid #f0f0f0' : 'none'
                  }}>
                    <div style={{ width: '100%' }}>
                      {/* Header Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ flex: 1 }}>
                          <Text strong style={{ fontSize: '13px' }}>
                            {item.orderBookerName}
                          </Text>
                        </div>
                        
                        <Space size={4}>
                          {getStatusIcon(item.status)}
                          <Tag color={statusColor} style={{ fontSize: '10px', margin: 0 }}>
                            {getStatusText(item.status)}
                          </Tag>
                        </Space>
                      </div>
                      
                      {/* Progress Bar */}
                      <div style={{ marginBottom: '6px' }}>
                        <Progress
                          percent={Math.min(item.achievementPercentage, 100)}
                          strokeColor={statusColor}
                          trailColor="#f0f0f0"
                          showInfo={false}
                          strokeWidth={6}
                        />
                      </div>
                      
                      {/* Achievement Details */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <Text style={{ fontSize: '11px', color: '#595959' }}>
                          {formatCurrency(item.achievedAmount)} / {formatCurrency(item.targetAmount)}
                        </Text>
                        
                        <Text strong style={{ fontSize: '11px', color: statusColor }}>
                          {item.achievementPercentage.toFixed(1)}%
                        </Text>
                      </div>
                      
                      {/* Time and Pace Information */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarOutlined style={{ fontSize: '10px', color: '#8c8c8c', marginRight: '4px' }} />
                          <Text style={{ fontSize: '10px', color: '#8c8c8c' }}>
                            {item.daysRemaining} days left
                          </Text>
                        </div>
                        
                        <div style={{ textAlign: 'right' }}>
                          <Tooltip title={`Current pace: ${formatCurrency(item.currentDailyAverage)}/day | Required: ${formatCurrency(item.requiredDailyAverage)}/day`}>
                            <Text style={{ 
                              fontSize: '10px',
                              color: trendDirection === 'positive' ? '#52c41a' : 
                                     trendDirection === 'negative' ? '#ff4d4f' : '#8c8c8c'
                            }}>
                              Pace: {trendDirection === 'positive' ? '↗' : trendDirection === 'negative' ? '↘' : '→'} 
                              {formatCurrency(item.currentDailyAverage)}/day
                            </Text>
                          </Tooltip>
                        </div>
                      </div>
                      
                      {/* Projected Achievement */}
                      {item.projectedAchievement !== item.achievementPercentage && (
                        <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed #e8e8e8' }}>
                          <Text style={{ fontSize: '10px', color: '#8c8c8c' }}>
                            Projected: {item.projectedAchievement.toFixed(1)}% 
                            ({formatCurrency(item.targetAmount * (item.projectedAchievement / 100))})
                          </Text>
                        </div>
                      )}
                    </div>
                  </List.Item>
                );
              }}
            />
          </div>
          
          {/* Summary Footer */}
          {progressData.length > maxEntries && (
            <div style={{ 
              marginTop: '8px',
              padding: '6px 8px',
              backgroundColor: '#fafafa',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                Showing {displayData.length} of {progressData.length} order bookers
              </Text>
            </div>
          )}
          
          {/* Quick Stats */}
          {progressData.length > 0 && (
            <div style={{ 
              marginTop: '8px',
              padding: '8px',
              backgroundColor: '#f6f8fa',
              borderRadius: '4px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <div style={{ textAlign: 'center' }}>
                  <Text style={{ fontSize: '11px', color: '#52c41a', fontWeight: 'bold' }}>
                    {progressData.filter(p => p.status === 'ahead' || p.status === 'on-track').length}
                  </Text>
                  <br />
                  <Text style={{ fontSize: '10px', color: '#8c8c8c' }}>On Track</Text>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <Text style={{ fontSize: '11px', color: '#faad14', fontWeight: 'bold' }}>
                    {progressData.filter(p => p.status === 'at-risk').length}
                  </Text>
                  <br />
                  <Text style={{ fontSize: '10px', color: '#8c8c8c' }}>At Risk</Text>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <Text style={{ fontSize: '11px', color: '#ff4d4f', fontWeight: 'bold' }}>
                    {progressData.filter(p => p.status === 'behind').length}
                  </Text>
                  <br />
                  <Text style={{ fontSize: '10px', color: '#8c8c8c' }}>Behind</Text>
                </div>
              </div>
            </div>
          )}
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

TargetProgressWidget.displayName = 'TargetProgressWidget';

export default TargetProgressWidget;
