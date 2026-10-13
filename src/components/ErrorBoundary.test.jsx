import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

function Bomb({ explode }) {
  if (explode) throw new Error('boom');
  return <p>all good</p>;
}

beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { vi.restoreAllMocks(); });

describe('ErrorBoundary', () => {
  it('renders children when nothing fails', () => {
    render(<ErrorBoundary><Bomb /></ErrorBoundary>);
    expect(screen.getByText('all good')).toBeInTheDocument();
  });

  it('shows a recovery screen with plain links instead of a blank page', () => {
    render(<ErrorBoundary><Bomb explode /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i);
    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/');
  });

  it('logs the error for later reporting', () => {
    render(<ErrorBoundary><Bomb explode /></ErrorBoundary>);
    expect(console.error).toHaveBeenCalledWith('Storefront error:', expect.any(Error), expect.anything());
  });

  it('recovers when resetKey changes (e.g. the user navigates away)', () => {
    const { rerender } = render(<ErrorBoundary resetKey="/a"><Bomb explode /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    rerender(<ErrorBoundary resetKey="/b"><Bomb /></ErrorBoundary>);
    expect(screen.getByText('all good')).toBeInTheDocument();
  });

  it('stays in the error state if resetKey is unchanged', () => {
    const { rerender } = render(<ErrorBoundary resetKey="/a"><Bomb explode /></ErrorBoundary>);
    rerender(<ErrorBoundary resetKey="/a"><Bomb /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
