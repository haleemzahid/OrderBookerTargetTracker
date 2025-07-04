import React, { Component, ReactNode } from 'react';
import ErrorBoundaryFallback from './ErrorBoundaryFallback';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || ErrorBoundaryFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
