import { ThemeConfig } from 'antd';

// Light theme configuration
export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff', // A blue that's commonly associated with business/professional apps
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#f5222d',
    colorInfo: '#1890ff',
    borderRadius: 4,
    fontFamily: "'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', sans-serif",
  },
  components: {
    Table: {
      colorBgContainer: '#ffffff',
      headerBg: '#fafafa',
    },
    Button: {
      borderRadius: 4,
    },
    Card: {
      borderRadius: 6,
    },
    // Add more component-specific overrides as needed
  },
};

// Dark theme configuration
export const darkTheme: ThemeConfig = {
  token: {
    colorPrimary: '#177ddc', // Slightly different blue that works better in dark mode
    colorSuccess: '#49aa19',
    colorWarning: '#d89614',
    colorError: '#a61d24',
    colorInfo: '#177ddc',
    borderRadius: 4,
    fontFamily: "'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', sans-serif",
  },
  components: {
    Table: {
      colorBgContainer: '#141414',
      headerBg: '#1f1f1f',
    },
    Button: {
      borderRadius: 4,
    },
    Card: {
      borderRadius: 6,
    },
    // Add more component-specific overrides as needed
  },
};

// Default sizes for components - generally larger/more accessible
export const componentSizes = {
  default: 'middle', // Ant Design's middle size is a good balance
  form: 'middle',
  input: 'middle',
  button: 'middle',
  // You can override specific component sizes as needed
};
