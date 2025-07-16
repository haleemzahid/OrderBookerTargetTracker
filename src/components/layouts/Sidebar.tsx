import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { 
  DashboardOutlined, 
  TeamOutlined, 
  AimOutlined,
  BarChartOutlined,
  SettingOutlined,
  ShopOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  FundOutlined,
  AppstoreOutlined,
  HistoryOutlined
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

  // Get current path to determine selected key and open submenus
  const getCurrentKey = () => {
    const path = location.pathname;
    if (path === '/' || path === '/') return 'dashboard';
    if (path === '/bi-dashboard') return 'bi-dashboard';
    if (path.startsWith('/order-bookers')) return 'order-bookers';
    if (path.startsWith('/monthly-targets')) return 'monthly-targets';
    if (path.startsWith('/orders')) return 'orders';
    if (path.startsWith('/dsr')) return 'daily-sales-report';
    if (path.startsWith('/reports')) return 'reports';
    if (path.startsWith('/companies')) return 'companies';
    if (path.startsWith('/products')) return 'products';
    if (path.startsWith('/stock/transactions')) return 'stock-transactions';
    if (path.startsWith('/stock')) return 'stock-overview';
    if (path.startsWith('/settings')) return 'settings';
    return 'dashboard';
  };

  // Determine which submenus should be open based on current route
  const getOpenKeys = () => {
    const path = location.pathname;
    const openKeys: string[] = ['operations-submenu']; // Operations always expanded by default
    
    // Dashboards submenu
    if (path === '/' || path === '/bi-dashboard') {
      openKeys.push('dashboards-submenu');
    }
    
    // Master Data submenu
    if (path.startsWith('/companies') || path.startsWith('/products') || path.startsWith('/order-bookers')) {
      openKeys.push('master-data-submenu');
    }
    
    // Stock Management submenu
    if (path.startsWith('/stock')) {
      openKeys.push('stock-submenu');
    }
    
    // Reports submenu
    if (path.startsWith('/dsr') || path.startsWith('/reports')) {
      openKeys.push('reports-submenu');
    }
    
    return openKeys;
  };

  const handleMenuClick = (key: string) => {
    switch (key) {
      case '/':
      case 'dashboard':
        navigate({ to: '/' });
        break;
      case 'bi-dashboard':
        navigate({ to: '/bi-dashboard' });
        break;
      case 'order-bookers':
        navigate({ to: '/order-bookers' });
        break;
      case 'monthly-targets':
        navigate({ to: '/monthly-targets' });
        break;
      case 'orders':
        navigate({ to: '/orders' });
        break;
      case 'daily-sales-report':
        navigate({ to: '/dsr' });
        break;
      case 'products':
        navigate({ to: '/products' });
        break;
      case 'reports':
        // Navigate to dsr for now since reports route doesn't exist
        navigate({ to: '/dsr' });
        break;
      case 'companies':
        navigate({ to: '/companies' });
        break;
      case 'stock-overview':
        navigate({ to: '/stock' });
        break;
      case 'stock-transactions':
        navigate({ to: '/stock/transactions' });
        break;
      case 'settings':
        // Navigate to dashboard for now since settings route doesn't exist
        navigate({ to: '/' });
        break;
      default:
        navigate({ to: '/' });
    }
  };

  const menuItems = [
    // Dashboards - collapsible group
    {
      key: 'dashboards-submenu',
      icon: <FundOutlined />,
      label: 'Dashboards',
      children: [
        {
          key: 'dashboard',
          icon: <DashboardOutlined />,
          label: 'Dashboard',
        },
        {
          key: 'bi-dashboard',
          icon: <BarChartOutlined />,
          label: 'BI Dashboard',
        },
      ],
    },
    // Daily Operations - collapsible group
    {
      key: 'operations-submenu',
      icon: <ThunderboltOutlined />,
      label: 'Operations',
      children: [
        {
          key: 'orders',
          icon: <FileTextOutlined />,
          label: 'Orders',
        },
        {
          key: 'monthly-targets',
          icon: <AimOutlined />,
          label: 'Monthly Targets',
        },
      ],
    },
    
    // Reports & Analytics - collapsible group
    {
      key: 'reports-submenu',
      icon: <FileTextOutlined />,
      label: 'Reports & Analytics',
      children: [
        {
          key: 'daily-sales-report',
          icon: <BarChartOutlined />,
          label: 'DSR',
        },
      ],
    },
       // Master Data Management - collapsible group
    {
      key: 'master-data-submenu',
      icon: <DatabaseOutlined />,
      label: 'Master Data',
      children: [
        {
          key: 'companies',
          icon: <ShopOutlined />,
          label: 'Companies',
        },
        {
          key: 'products',
          icon: <ShoppingOutlined />,
          label: 'Products',
        },
        {
          key: 'order-bookers',
          icon: <TeamOutlined />,
          label: 'Order Bookers',
        },
      ],
    },
    // Stock Management - collapsible group
    {
      key: 'stock-submenu',
      icon: <AppstoreOutlined />,
      label: 'Stock Management',
      children: [
        {
          key: 'stock-overview',
          icon: <AppstoreOutlined />,
          label: 'Stock Overview',
        },
        {
          key: 'stock-transactions',
          icon: <HistoryOutlined />,
          label: 'Transactions',
        },
      ],
    },
    // Settings - standalone
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
      width={220}
      collapsedWidth={60}
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
        defaultOpenKeys={getOpenKeys()}
        items={menuItems}
        onClick={({ key }) => handleMenuClick(key)}
      />
    </Sider>
  );
};

export default Sidebar;
