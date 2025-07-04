import React, { useState } from 'react';
import { Layout, theme } from 'antd';
import Header from './Header';
import Sidebar from './Sidebar';
import Dashboard from '../../pages/Dashboard';
import OrderBookers from '../../pages/OrderBookers';
import { useApp } from '../../contexts/AppContext';

const { Content } = Layout;

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('dashboard');
  const { direction } = useApp();
  const { token } = theme.useToken();

  const handleToggle = () => {
    setCollapsed(!collapsed);
  };

  const handleMenuSelect = (key: string) => {
    setSelectedKey(key);
  };

  const renderContent = () => {
    if (children) {
      return children;
    }

    switch (selectedKey) {
      case 'dashboard':
        return <Dashboard />;
      case 'order-bookers':
        return <OrderBookers />;
      case 'daily-entries':
        return <div>Daily Entries (Coming Soon)</div>;
      case 'monthly-targets':
        return <div>Monthly Targets (Coming Soon)</div>;
      case 'reports':
        return <div>Reports (Coming Soon)</div>;
      case 'settings':
        return <div>Settings (Coming Soon)</div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar
        collapsed={collapsed}
        selectedKey={selectedKey}
        onMenuSelect={handleMenuSelect}
      />
      <Layout 
        style={{ 
          [direction === 'rtl' ? 'marginRight' : 'marginLeft']: collapsed ? 80 : 200 
        }}
      >
        <Header collapsed={collapsed} onToggle={handleToggle} />
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: token.colorBgContainer,
            borderRadius: 8,
          }}
        >
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
