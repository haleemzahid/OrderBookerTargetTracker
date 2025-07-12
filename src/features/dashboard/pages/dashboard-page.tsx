import React, { useState } from 'react';
import { Layout, Typography, Button, Space, Drawer } from 'antd';
import { SettingOutlined, ReloadOutlined } from '@ant-design/icons';
import { DashboardGrid } from '../components/dashboard-grid';
import { useRefreshAll, useResetToDefault } from '../stores/dashboard-store';
import { RevenuePerformanceWidget } from '../components/widgets/revenue-performance-widget';
import { ProfitMarginWidget } from '../components/widgets/profit-margin-widget';
import type { DashboardWidget } from '../types';

const { Content, Header } = Layout;
const { Title } = Typography;

export const DashboardPage: React.FC = () => {
  const [configDrawerVisible, setConfigDrawerVisible] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<DashboardWidget | null>(null);
  const refreshAll = useRefreshAll();
  const resetToDefault = useResetToDefault();

  // Memoized widget renderer function to prevent unnecessary re-renders
  const renderWidget = React.useCallback((widget: DashboardWidget): React.ReactNode => {
    switch (widget.id) {
      case 'revenue-performance':
        return <RevenuePerformanceWidget refreshInterval={widget.refreshInterval} />;
      case 'profit-margin':
        return <ProfitMarginWidget refreshInterval={widget.refreshInterval} />;
      default:
        return (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            color: '#8c8c8c' 
          }}>
            Widget "{widget.title}" not implemented yet
          </div>
        );
    }
  }, []);

  // Handle widget configuration
  const handleWidgetConfig = React.useCallback((widget: DashboardWidget) => {
    setSelectedWidget(widget);
    setConfigDrawerVisible(true);
  }, []);

  // Handle global refresh
  const handleRefreshAll = React.useCallback(() => {
    refreshAll();
  }, [refreshAll]);

  // Handle reset to default layout
  const handleResetLayout = React.useCallback(() => {
    resetToDefault();
  }, [resetToDefault]);

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Header style={{ 
        backgroundColor: '#fff', 
        padding: '0 24px',
        borderBottom: '1px solid #e8e8e8',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
          Business Intelligence Dashboard
        </Title>
        
        <Space>
          <Button
            type="default"
            icon={<ReloadOutlined />}
            onClick={handleRefreshAll}
          >
            Refresh All
          </Button>
          <Button
            type="default"
            onClick={handleResetLayout}
          >
            Reset Layout
          </Button>
          <Button
            type="primary"
            icon={<SettingOutlined />}
            onClick={() => setConfigDrawerVisible(true)}
          >
            Configure
          </Button>
        </Space>
      </Header>
      
      <Content style={{ padding: '0' }}>
        <DashboardGrid
          onWidgetConfig={handleWidgetConfig}
          renderWidget={renderWidget}
        />
      </Content>
      
      {/* Configuration Drawer */}
      <Drawer
        title="Dashboard Configuration"
        placement="right"
        onClose={() => setConfigDrawerVisible(false)}
        open={configDrawerVisible}
        width={400}
      >
        {selectedWidget ? (
          <div>
            <Typography.Title level={4}>{selectedWidget.title}</Typography.Title>
            <Typography.Text type="secondary">
              Widget configuration panel will be implemented here.
            </Typography.Text>
            {/* TODO: Implement widget configuration form */}
          </div>
        ) : (
          <div>
            <Typography.Title level={4}>Global Settings</Typography.Title>
            <Typography.Text type="secondary">
              Global dashboard configuration will be implemented here.
            </Typography.Text>
            {/* TODO: Implement global configuration */}
          </div>
        )}
      </Drawer>
    </Layout>
  );
};

export default DashboardPage;
