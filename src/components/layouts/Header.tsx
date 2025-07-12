import React, { useState } from 'react';
import { Layout, Button, Space, Typography, Dropdown, Switch, message, Modal } from 'antd';
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  BulbOutlined,
  UserOutlined,
  DatabaseOutlined,
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import { useApp } from '../../contexts/AppContext';
import { UpdateChecker } from '../common/UpdateChecker';
import { seedDemoData, seedMinimalData, seedComprehensiveData } from '../../utils/seed-data';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ collapsed, onToggle }) => {
  const { theme, toggleTheme } = useApp();
  const [seedingData, setSeedingData] = useState(false);

  const handleSeedData = async (seedType: 'minimal' | 'demo' | 'comprehensive') => {
    try {
      setSeedingData(true);
      
      Modal.confirm({
        title: 'Seed Database',
        icon: <ExclamationCircleOutlined />,
        content: `Are you sure you want to seed the database with ${seedType} data? This will clear all existing data.`,
        okText: 'Yes, Seed Data',
        cancelText: 'Cancel',
        okType: 'danger',
        onOk: async () => {
          try {
            message.loading('Seeding database...', 0);
            
            switch (seedType) {
              case 'minimal':
                await seedMinimalData();
                break;
              case 'comprehensive':
                await seedComprehensiveData();
                break;
              default:
                await seedDemoData();
            }
            
            message.destroy();
            message.success(`${seedType} data seeded successfully!`);
          } catch (error) {
            message.destroy();
            message.error('Failed to seed data: ' + (error as Error).message);
          }
        },
      });
    } catch (error) {
      message.error('Error: ' + (error as Error).message);
    } finally {
      setSeedingData(false);
    }
  };

  const seedDataMenuItems = [
    {
      key: 'minimal',
      label: 'Minimal Data (2 months)',
      onClick: () => handleSeedData('minimal'),
    },
    {
      key: 'demo',
      label: 'Demo Data (6 months)',
      onClick: () => handleSeedData('demo'),
    },
    {
      key: 'comprehensive',
      label: 'Comprehensive Data (12 months)',
      onClick: () => handleSeedData('comprehensive'),
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Profile',
    },
    {
      key: 'settings',
      label: 'Settings',
    },
    {
      key: 'logout',
      label: 'Logout',
    },
  ];

  return (
    <AntHeader
      style={{
        padding: '0 24px',
        background: theme === 'dark' ? '#001529' : '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <Space>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggle}
          style={{
            fontSize: '16px',
            width: 64,
            height: 64,
          }}
        />
        <Text strong style={{ fontSize: '18px' }}>
          Order Booker Target Tracker
        </Text>
        {seedDataMenuItems.map(data=>
          (<Button  content={data.label} onClick={data.onClick}>{data.label}</Button>)
        )}
      </Space>

      <Space>
        <UpdateChecker />
        
        <Space>
          <BulbOutlined />
          <Switch
            checked={theme === 'dark'}
            onChange={toggleTheme}
            size="small"
          />
        </Space>

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Button type="text" icon={<UserOutlined />}>
            User
          </Button>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;
