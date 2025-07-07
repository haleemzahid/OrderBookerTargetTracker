import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { 
  DashboardOutlined, 
  TeamOutlined, 
  CalendarOutlined, 
  AimOutlined,
  BarChartOutlined,
  SettingOutlined 
} from '@ant-design/icons';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
  selectedKey?: string;
  onMenuSelect?: (key: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get current path to determine selected key
  const getCurrentKey = () => {
    const path = location.pathname;
    if (path === '/') return 'dashboard';
    if (path.startsWith('/order-bookers')) return 'order-bookers';
    if (path.startsWith('/daily-entries')) return 'daily-entries';
    if (path.startsWith('/monthly-targets')) return 'monthly-targets';
    if (path.startsWith('/reports')) return 'reports';
    return 'dashboard';
  };

  const handleMenuClick = (key: string) => {
    switch (key) {
      case 'dashboard':
        navigate({ to: '/' });
        break;
      case 'order-bookers':
        navigate({ to: '/order-bookers' });
        break;
      case 'daily-entries':
        navigate({ to: '/daily-entries' });
        break;
      case 'monthly-targets':
        navigate({ to: '/monthly-targets' });
        break;
      case 'reports':
        navigate({ to: '/reports' });
        break;
      default:
        navigate({ to: '/' });
    }
  };

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'order-bookers',
      icon: <TeamOutlined />,
      label: 'Order Bookers',
    },
    {
      key: 'daily-entries',
      icon: <CalendarOutlined />,
      label: 'Daily Entries',
    },
    {
      key: 'monthly-targets',
      icon: <AimOutlined />,
      label: 'Monthly Targets',
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
      }}
    >
      <div
        style={{
          height: 64,
          margin: 16,
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 'bold',
        }}
      >
        {!collapsed && 'OBTT'}
        {collapsed && 'OB'}
      </div>
      
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getCurrentKey()]}
        items={menuItems}
        onClick={({ key }) => handleMenuClick(key)}
      />
    </Sider>
  );
};

export default Sidebar;
