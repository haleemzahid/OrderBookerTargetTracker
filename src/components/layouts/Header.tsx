import React from 'react';
import { Layout, Button, Space, Typography, Dropdown, Switch } from 'antd';
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  GlobalOutlined, 
  BulbOutlined,
  UserOutlined 
} from '@ant-design/icons';
import { useApp } from '../../contexts/AppContext';
import type { Language } from '../../types';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ collapsed, onToggle }) => {
  const { theme, language, toggleTheme, setLanguage } = useApp();

  const languageItems = [
    {
      key: 'en',
      label: 'English',
      onClick: () => setLanguage('en' as Language),
    },
    {
      key: 'ur',
      label: 'اردو',
      onClick: () => setLanguage('ur' as Language),
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
          {language === 'ur' ? 'آرڈر بکر ٹارگٹ ٹریکر' : 'Order Booker Target Tracker'}
        </Text>
      </Space>

      <Space>
        <Space>
          <BulbOutlined />
          <Switch
            checked={theme === 'dark'}
            onChange={toggleTheme}
            size="small"
          />
        </Space>
        
        <Dropdown menu={{ items: languageItems }} placement="bottomRight">
          <Button type="text" icon={<GlobalOutlined />}>
            {language === 'ur' ? 'اردو' : 'English'}
          </Button>
        </Dropdown>

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Button type="text" icon={<UserOutlined />}>
            {language === 'ur' ? 'صارف' : 'User'}
          </Button>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;
