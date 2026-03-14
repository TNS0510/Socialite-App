import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-red-100">
            <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 text-center mb-2">Something went wrong</h2>
            <p className="text-zinc-600 text-center mb-8">
              An unexpected error occurred. We've been notified and are looking into it.
            </p>
            
            {this.state.error && (
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 font-mono text-xs mb-8 overflow-auto max-h-32 text-zinc-500">
                {this.state.error.toString()}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={this.handleReload} className="gap-2">
                <RefreshCcw className="h-4 w-4" />
                Reload
              </Button>
              <Button onClick={this.handleReset} className="gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
