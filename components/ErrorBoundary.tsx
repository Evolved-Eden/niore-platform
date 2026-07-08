'use client'

import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="max-w-6xl mx-auto p-8">
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '4px',
              padding: '40px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>&#9888;&#65039;</div>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: '8px',
                color: 'white',
                fontFamily: 'var(--font-display, sans-serif)',
              }}
            >
              Something went wrong
            </h2>
            <p
              style={{
                fontSize: '13px',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '24px',
                maxWidth: '400px',
                margin: '0 auto 24px',
              }}
            >
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                background: '#c8ff00',
                color: 'black',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
