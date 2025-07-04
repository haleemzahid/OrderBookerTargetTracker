import React from 'react';
import { Switch, Space, Typography } from 'antd';
import { useI18n } from '../../hooks/useI18n';

const { Text } = Typography;

const LanguageSwitcher: React.FC = () => {
  const { currentLanguage, changeLanguage } = useI18n();

  const handleLanguageToggle = (checked: boolean) => {
    changeLanguage(checked ? 'ur' : 'en');
  };

  return (
    <Space align="center">
      <Text>English</Text>
      <Switch
        checked={currentLanguage === 'ur'}
        onChange={handleLanguageToggle}
        style={{ background: currentLanguage === 'ur' ? '#1890ff' : '#d9d9d9' }}
      />
      <Text>اردو</Text>
    </Space>
  );
};

export default LanguageSwitcher;
