import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '../test/utils';
import { getSession } from '../services/session';

vi.mock('../config', async (orig) => ({ ...(await orig()), CRM: { tenantId: '8', apiUrl: 'http://api.test' } }));

const json = (body, status = 200) => Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });
const sentBody = () => JSON.parse(fetch.mock.calls.at(-1)[1].body);
const form = () => within(document.querySelector('form.auth-form'));

async function openPanel(user) {
  renderApp('/');
  await user.click(screen.getByRole('button', { name: 'Log in' }));
}
const submit = (user, name) => user.click(form().getByRole('button', { name }));

beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
afterEach(() => vi.unstubAllGlobals());

describe('login panel (email + password only)', () => {
  it('asks for email and password only: no mobile, OTP or SMS anywhere', async () => {
    const user = userEvent.setup();
    await openPanel(user);
    expect(form().getByLabelText('Email')).toHaveAttribute('type', 'email');
    expect(form().getByLabelText('Password')).toHaveAttribute('type', 'password');
    expect(form().queryByLabelText(/full name/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Sign up' }));
    expect(form().getByLabelText('Full name')).toBeInTheDocument();
    expect(document.querySelectorAll('form.auth-form input')).toHaveLength(3);
    expect(document.querySelector('form.auth-form').textContent).not.toMatch(/otp|sms|mobile|one-time|verification/i);
  });

  it('signs up with name, email and password and shows the logged-in state', async () => {
    fetch.mockImplementationOnce(() => json({ token: 'jwt-1', customer: { id: 1, name: 'Pooja', email: 'pooja@example.com' } }, 201));
    const user = userEvent.setup();
    await openPanel(user);
    await user.click(screen.getByRole('tab', { name: 'Sign up' }));
    await user.type(form().getByLabelText('Full name'), 'Pooja');
    await user.type(form().getByLabelText('Email'), 'pooja@example.com');
    await user.type(form().getByLabelText('Password'), 'password1');
    await submit(user, 'Create account');

    expect(await screen.findByRole('heading', { name: /hi, pooja/i })).toBeInTheDocument();
    expect(fetch.mock.calls[0][0]).toBe('http://api.test/api/auth/signup');
    expect(sentBody()).toEqual({ name: 'Pooja', email: 'pooja@example.com', password: 'password1' });
    expect(getSession()).toMatchObject({ token: 'jwt-1' });
  });

  it('logs in with email and password', async () => {
    fetch.mockImplementationOnce(() => json({ token: 'jwt-2', customer: { id: 1, name: 'Pooja', email: 'pooja@example.com' } }));
    const user = userEvent.setup();
    await openPanel(user);
    await user.type(form().getByLabelText('Email'), 'pooja@example.com');
    await user.type(form().getByLabelText('Password'), 'password1');
    await submit(user, 'Log in');

    expect(await screen.findByRole('heading', { name: /hi, pooja/i })).toBeInTheDocument();
    expect(fetch.mock.calls[0][0]).toBe('http://api.test/api/auth/login');
    expect(sentBody()).toEqual({ email: 'pooja@example.com', password: 'password1' });
    expect(getSession()).toMatchObject({ token: 'jwt-2' });
  });

  it('shows a clear message for invalid credentials and stays logged out', async () => {
    fetch.mockImplementationOnce(() => json({ detail: 'Incorrect email or password.' }, 401));
    const user = userEvent.setup();
    await openPanel(user);
    await user.type(form().getByLabelText('Email'), 'pooja@example.com');
    await user.type(form().getByLabelText('Password'), 'wrong-pass1');
    await submit(user, 'Log in');

    expect(await form().findByRole('status')).toHaveTextContent('Incorrect email or password.');
    expect(getSession()).toBeNull();
  });

  it('shows the duplicate-email message from the server on sign-up', async () => {
    fetch.mockImplementationOnce(() => json({ detail: 'An account with this email already exists. Try logging in.' }, 409));
    const user = userEvent.setup();
    await openPanel(user);
    await user.click(screen.getByRole('tab', { name: 'Sign up' }));
    await user.type(form().getByLabelText('Full name'), 'Pooja');
    await user.type(form().getByLabelText('Email'), 'pooja@example.com');
    await user.type(form().getByLabelText('Password'), 'password1');
    await submit(user, 'Create account');

    expect(await form().findByText(/already exists/i)).toBeInTheDocument();
    expect(getSession()).toBeNull();
  });

  it('validates in the browser first: bad email and weak password never reach the server', async () => {
    const user = userEvent.setup();
    await openPanel(user);
    await user.click(screen.getByRole('tab', { name: 'Sign up' }));
    await user.type(form().getByLabelText('Full name'), 'Pooja');
    await user.type(form().getByLabelText('Email'), 'not-an-email');
    await user.type(form().getByLabelText('Password'), 'password1');
    await submit(user, 'Create account');
    expect(await form().findByText('Enter a valid email address.')).toBeInTheDocument();

    await user.clear(form().getByLabelText('Email'));
    await user.type(form().getByLabelText('Email'), 'pooja@example.com');
    await user.clear(form().getByLabelText('Password'));
    await user.type(form().getByLabelText('Password'), 'abc');
    await submit(user, 'Create account');
    expect(await form().findByText('Password must be at least 8 characters.')).toBeInTheDocument();
    await waitFor(() => expect(fetch).not.toHaveBeenCalled());
  });
});
