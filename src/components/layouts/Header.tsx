import React from 'react';
import { Layout, Button, Space, Typography, Dropdown, Switch } from 'antd';
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  BulbOutlined,
  UserOutlined 
} from '@ant-design/icons';
import { useApp } from '../../contexts/AppContext';
import { UpdateChecker } from '../common/UpdateChecker';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ collapsed, onToggle }) => {
  const { theme, toggleTheme } = useApp();

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
