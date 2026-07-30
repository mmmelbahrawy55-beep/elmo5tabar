import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Platform } from 'react-native';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    if (__DEV__) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
            backgroundColor: '#F5F7FA',
          }}
        >
          <Text
            style={{
              fontSize: 48,
              marginBottom: 16,
            }}
          >
            ⚠️
          </Text>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#1A1A2E',
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            Something went wrong
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: '#6C757D',
              textAlign: 'center',
              marginBottom: 24,
              lineHeight: 20,
            }}
          >
            An unexpected error occurred. Please try again.
          </Text>
          {__DEV__ && this.state.error && (
            <Text
              style={{
                fontSize: 12,
                color: '#DC3545',
                marginBottom: 16,
                textAlign: 'center',
                fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
              }}
            >
              {this.state.error.toString()}
            </Text>
          )}
          <Button title="Try Again" onPress={this.handleRetry} variant="primary" />
        </View>
      );
    }

    return this.props.children;
  }
}
