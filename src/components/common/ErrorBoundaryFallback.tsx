import React from 'react';
import { Result, Button } from 'antd';
import { useApp } from '../../contexts/AppContext';

interface ErrorBoundaryFallbackProps {
  error: Error;
  resetError?: () => void;
}

const ErrorBoundaryFallback: React.FC<ErrorBoundaryFallbackProps> = ({ error, resetError }) => {
  const { language } = useApp();

  return (
    <Result
      status="error"
      title={language === 'ur' ? 'کچھ غلط ہوا' : 'Something went wrong'}
      subTitle={language === 'ur' 
        ? 'ایک غیر متوقع خرابی ہوئی ہے۔ برائے کرم دوبارہ کوشش کریں۔'
        : 'An unexpected error occurred. Please try again.'
      }
      extra={
        resetError && (
          <Button type="primary" onClick={resetError}>
            {language === 'ur' ? 'دوبارہ کوشش کریں' : 'Try Again'}
          </Button>
        )
      }
    >
      {import.meta.env.DEV && (
        <div
          style={{
            padding: '16px',
            background: '#f5f5f5',
            borderRadius: '4px',
            marginTop: '16px',
            textAlign: 'left',
          }}
        >
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {error.message}
            {error.stack && `\n${error.stack}`}
          </pre>
        </div>
      )}
    </Result>
  );
};

export default ErrorBoundaryFallback;
