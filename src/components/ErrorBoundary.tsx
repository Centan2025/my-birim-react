import {Component, ErrorInfo, ReactNode} from 'react'
import {errorReporter} from '../lib/errorReporting'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // Log to error reporting service
    errorReporter.captureException(error, {
      tags: {
        component: 'ErrorBoundary',
      },
      extra: {
        componentStack: errorInfo.componentStack,
      },
    })

    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
          <div className="max-w-2xl w-full text-center">
            <h1 className="text-4xl font-bold mb-4">Bir Hata Oluştu</h1>
            <p className="text-gray-300 mb-6">
              Üzgünüz, beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin veya ana sayfaya dönün.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="mt-6 p-4 bg-gray-800 rounded text-left text-sm overflow-auto max-h-64">
                <p className="text-red-400 font-mono mb-2">{this.state.error.toString()}</p>
                {this.state.errorInfo && (
                  <pre className="text-gray-400 text-xs overflow-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="mt-8 flex gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-2 bg-white text-gray-900 rounded hover:bg-gray-200 transition-colors"
              >
                Tekrar Dene
              </button>
              <a
                href="/"
                className="px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Ana Sayfaya Dön
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
