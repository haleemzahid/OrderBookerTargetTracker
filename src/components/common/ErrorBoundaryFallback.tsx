import React from 'react';
import { Result, Button } from 'antd';

interface ErrorBoundaryFallbackProps {
  error: Error;
  resetError?: () => void;
}

const ErrorBoundaryFallback: React.FC<ErrorBoundaryFallbackProps> = ({ error, resetError }) => {
  return (
    <Result
      status="error"
      title="Something went wrong"
      subTitle="An unexpected error occurred. Please try again."
      extra={
        resetError && (
          <Button type="primary" onClick={resetError}>
            Try Again
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
