import React from 'react';
import { Typography, Space, Spin, Alert, Badge, List, Tag, Button } from 'antd';
import { 
  BellOutlined, 
  ExclamationCircleOutlined, 
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { WidgetDataService } from '../../api/widget-data-service';
import { useDashboardFilters } from '../../stores/dashboard-store';
import type { AlertCenterData } from '../../types';

const { Text, Title } = Typography;

interface AlertCenterWidgetProps {
  refreshInterval?: number;
  maxAlerts?: number;
  showReadAlerts?: boolean;
}

export const AlertCenterWidget: React.FC<AlertCenterWidgetProps> = React.memo(({
  refreshInterval = 300000, // 5 minutes default
  maxAlerts = 10,
  showReadAlerts = false
}) => {
  const filters = useDashboardFilters();
  
  const { data: response, isLoading, error, isError } = useQuery({
    queryKey: ['alert-center', filters],
    queryFn: () => WidgetDataService.getAlerts(filters),
    refetchInterval: refreshInterval,
    staleTime: refreshInterval / 2,
    gcTime: refreshInterval * 2
  });
  
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" tip="Loading alerts..." />
      </div>
    );
  }
  
  if (isError || response?.status === 'error') {
    return (
      <Alert
        message="Error Loading Alerts"
        description={response?.error || error?.message || 'Failed to load alert center data'}
        type="error"
        showIcon
      />
    );
  }
  
  const alertData: AlertCenterData = response?.data || {
    alerts: [],
    unreadCount: 0,
    criticalCount: 0,
    summary: {
      highReturnRateAlerts: 0,
      targetMissRiskAlerts: 0,
      unusualPatternAlerts: 0,
      systemHealthAlerts: 0
    }
  };
  
  // Filter and sort alerts
  const filteredAlerts = alertData.alerts
    .filter(alert => showReadAlerts || !alert.isRead)
    .sort((a, b) => {
      // Sort by severity first, then by timestamp
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    })
    .slice(0, maxAlerts);
  
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'high': return <WarningOutlined style={{ color: '#ff7a45' }} />;
      case 'medium': return <InfoCircleOutlined style={{ color: '#faad14' }} />;
      case 'low': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      default: return <InfoCircleOutlined style={{ color: '#8c8c8c' }} />;
    }
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ff4d4f';
      case 'high': return '#ff7a45';
      case 'medium': return '#faad14';
      case 'low': return '#52c41a';
      default: return '#8c8c8c';
    }
  };
  
  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'high-return-rate': return 'High Returns';
      case 'target-miss-risk': return 'Target Risk';
      case 'unusual-pattern': return 'Unusual Pattern';
      case 'system-health': return 'System Health';
      default: return 'Other';
    }
  };
  
  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };
  
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space align="center">
            <Badge count={alertData.unreadCount} size="small">
              <BellOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
            </Badge>
            <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
              Alert Center
            </Title>
          </Space>
          
          {alertData.criticalCount > 0 && (
            <Tag color="red" style={{ fontSize: '10px' }}>
              {alertData.criticalCount} Critical
            </Tag>
          )}
        </Space>
        
        {/* Alert Summary */}
        {(alertData.summary.highReturnRateAlerts > 0 || 
          alertData.summary.targetMissRiskAlerts > 0 || 
          alertData.summary.unusualPatternAlerts > 0) && (
          <div style={{ marginTop: '8px' }}>
            <Space size={4} wrap>
              {alertData.summary.highReturnRateAlerts > 0 && (
                <Tag color="orange" style={{ fontSize: '10px' }}>
                  {alertData.summary.highReturnRateAlerts} Returns
                </Tag>
              )}
              {alertData.summary.targetMissRiskAlerts > 0 && (
                <Tag color="red" style={{ fontSize: '10px' }}>
                  {alertData.summary.targetMissRiskAlerts} Targets
                </Tag>
              )}
              {alertData.summary.unusualPatternAlerts > 0 && (
                <Tag color="purple" style={{ fontSize: '10px' }}>
                  {alertData.summary.unusualPatternAlerts} Patterns
                </Tag>
              )}
            </Space>
          </div>
        )}
      </div>
      
      {/* Empty State */}
      {filteredAlerts.length === 0 ? (
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center',
          color: '#8c8c8c'
        }}>
          <CheckCircleOutlined style={{ fontSize: '32px', marginBottom: '8px', color: '#52c41a' }} />
          <Text type="secondary">All clear! No active alerts</Text>
        </div>
      ) : (
        <>
          {/* Alerts List */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            <List
              size="small"
              dataSource={filteredAlerts}
              renderItem={(alert, index) => (
                <List.Item style={{ 
                  padding: '8px 0',
                  borderBottom: index < filteredAlerts.length - 1 ? '1px solid #f0f0f0' : 'none',
                  opacity: alert.isRead ? 0.7 : 1
                }}>
                  <div style={{ width: '100%' }}>
                    {/* Alert Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <div style={{ marginRight: '8px', marginTop: '2px' }}>
                        {getSeverityIcon(alert.severity)}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <Text strong style={{ 
                          fontSize: '12px',
                          color: getSeverityColor(alert.severity)
                        }}>
                          {alert.title}
                        </Text>
                        
                        <div style={{ marginTop: '2px' }}>
                          <Text style={{ fontSize: '11px', color: '#595959' }}>
                            {alert.description}
                          </Text>
                        </div>
                      </div>
                      
                      <Space direction="vertical" align="end" size={2}>
                        <Tag 
                          color={getSeverityColor(alert.severity)}
                          style={{ fontSize: '9px', padding: '0 4px', margin: 0 }}
                        >
                          {getAlertTypeLabel(alert.type)}
                        </Tag>
                        
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <ClockCircleOutlined style={{ fontSize: '10px', color: '#8c8c8c', marginRight: '2px' }} />
                          <Text style={{ fontSize: '10px', color: '#8c8c8c' }}>
                            {formatTimeAgo(alert.timestamp)}
                          </Text>
                        </div>
                      </Space>
                    </div>
                    
                    {/* Alert Details */}
                    {(alert.value !== undefined || alert.relatedEntity) && (
                      <div style={{ 
                        marginLeft: '24px',
                        fontSize: '11px',
                        color: '#8c8c8c'
                      }}>
                        <Space size={8}>
                          {alert.value !== undefined && alert.threshold !== undefined && (
                            <span>
                              Value: {alert.value.toFixed(1)}% (Threshold: {alert.threshold}%)
                            </span>
                          )}
                          {alert.relatedEntity && (
                            <span>
                              {alert.relatedEntity.type}: {alert.relatedEntity.name}
                            </span>
                          )}
                        </Space>
                      </div>
                    )}
                    
                    {/* Action Required */}
                    {alert.actionRequired && (
                      <div style={{ marginLeft: '24px', marginTop: '4px' }}>
                        <Button 
                          type="link" 
                          size="small"
                          style={{ 
                            padding: 0, 
                            fontSize: '11px',
                            height: 'auto',
                            color: getSeverityColor(alert.severity)
                          }}
                        >
                          Action Required →
                        </Button>
                      </div>
                    )}
                  </div>
                </List.Item>
              )}
            />
          </div>
          
          {/* Footer Actions */}
          {alertData.alerts.length > maxAlerts && (
            <div style={{ 
              marginTop: '8px',
              padding: '8px',
              backgroundColor: '#fafafa',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                Showing {filteredAlerts.length} of {alertData.alerts.length} alerts
              </Text>
              <Button 
                type="link" 
                size="small"
                style={{ fontSize: '11px', padding: '0 8px' }}
              >
                View All
              </Button>
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

AlertCenterWidget.displayName = 'AlertCenterWidget';

export default AlertCenterWidget;
