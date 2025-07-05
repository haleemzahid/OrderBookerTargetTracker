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
import { useI18n } from '../../hooks/useI18n';
import { UpdateChecker } from '../common/UpdateChecker';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ collapsed, onToggle }) => {
  const { theme, toggleTheme } = useApp();
  const { currentLanguage, changeLanguage, common } = useI18n();

  const languageItems = [
    {
      key: 'en',
      label: 'English',
      onClick: () => changeLanguage('en'),
    },
    {
      key: 'ur',
      label: 'اردو',
      onClick: () => changeLanguage('ur'),
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      label: common('profile'),
    },
    {
      key: 'settings',
      label: common('settings'),
    },
    {
      key: 'logout',
      label: common('logout'),
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
          {currentLanguage === 'ur' ? 'آرڈر بکر ٹارگٹ ٹریکر' : 'Order Booker Target Tracker'}
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
        
        <Dropdown menu={{ items: languageItems }} placement="bottomRight">
          <Button type="text" icon={<GlobalOutlined />}>
            {currentLanguage === 'ur' ? 'اردو' : 'English'}
          </Button>
        </Dropdown>

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Button type="text" icon={<UserOutlined />}>
            {currentLanguage === 'ur' ? 'صارف' : 'User'}
          </Button>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;
