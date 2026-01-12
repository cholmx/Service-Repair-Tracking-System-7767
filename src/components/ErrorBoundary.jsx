import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-800 mb-4">
                Something went wrong
              </h1>
              <p className="text-slate-600 mb-6">
                The application encountered an error. Click below to reset and try again.
              </p>
              <button
                onClick={this.handleReset}
                className="w-full bg-slate-800 text-white py-3 px-4 rounded-lg font-medium hover:bg-slate-700 transition-all"
              >
                Reset Application
              </button>
              {this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="text-sm text-slate-500 cursor-pointer">
                    Technical Details
                  </summary>
                  <pre className="mt-2 text-xs text-red-600 overflow-auto">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
