import { Component } from 'react';

// Catches render-time errors below it and shows a recovery screen instead of a blank page.
// Uses plain <a>/<button> (not router Links) so the fallback also works when it wraps the router.
// `resetKey` (e.g. the pathname) clears the error when it changes.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Hook for error reporting (e.g. a monitoring service) in a later phase.
    console.error('Storefront error:', error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="container">
        <div className="empty" role="alert">
          <h1 style={{ fontSize: '2rem' }}>Something went wrong</h1>
          <p>This page couldn’t load. Try reloading, or go back to the shop.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 18 }}>
            <button type="button" className="btn" onClick={() => window.location.reload()}>Reload page</button>
            <a href="/" className="btn btn--ghost">Back to home</a>
          </div>
        </div>
      </div>
    );
  }
}
