import React from 'react';
import { Layout, Menu } from 'antd';
import { 
  DashboardOutlined, 
  TeamOutlined, 
  CalendarOutlined, 
  AimOutlined,
  BarChartOutlined,
  SettingOutlined 
} from '@ant-design/icons';
import { useApp } from '../../contexts/AppContext';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
  selectedKey: string;
  onMenuSelect: (key: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, selectedKey, onMenuSelect }) => {
  const { language } = useApp();

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: language === 'ur' ? 'ڈیش بورڈ' : 'Dashboard',
    },
    {
      key: 'order-bookers',
      icon: <TeamOutlined />,
      label: language === 'ur' ? 'آرڈر بکر' : 'Order Bookers',
    },
    {
      key: 'daily-entries',
      icon: <CalendarOutlined />,
      label: language === 'ur' ? 'روزانہ اندراجات' : 'Daily Entries',
    },
    {
      key: 'monthly-targets',
      icon: <AimOutlined />,
      label: language === 'ur' ? 'ماہانہ اہداف' : 'Monthly Targets',
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: language === 'ur' ? 'رپورٹس' : 'Reports',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: language === 'ur' ? 'سیٹنگز' : 'Settings',
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
        {!collapsed && (language === 'ur' ? 'او بی ٹی ٹی' : 'OBTT')}
        {collapsed && 'OB'}
      </div>
      
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={({ key }) => onMenuSelect(key)}
      />
    </Sider>
  );
};

export default Sidebar;
