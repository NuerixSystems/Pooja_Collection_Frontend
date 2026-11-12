import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp, seedCart } from '../test/utils';

vi.mock('../config', async (orig) => ({
  ...(await orig()),
  CRM: { tenantId: '8', apiUrl: 'http://api.test' },
}));

const json = (body, status = 200) =>
  Promise.resolve({
    ok: status < 400,
    status,
    json: () => Promise.resolve(body),
  });

const savedAddress = {
  id: 1,
  name: 'Asha Raman',
  phone: '9876543210',
  email: 'asha@example.com',
  pincode: '600004',
  addressLine: '12 Temple Road',
  city: 'Chennai',
  state: 'Tamil Nadu',
  isDefault: true,
};

beforeEach(() => {
  localStorage.setItem(
    'pooja-collection:auth:v1',
    JSON.stringify({
      token: 'jwt-existing',
      customer: { name: 'Asha Raman', email: 'asha@example.com' },
    })
  );
  seedCart([{ id: 'gold-tulip-rings-3-set', qty: 1 }]);
  vi.stubGlobal(
    'fetch',
    vi.fn((url) =>
      String(url).endsWith('/addresses')
        ? json([savedAddress])
        : json({ detail: 'Cart unavailable' }, 401)
    )
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.removeItem('pooja-collection:auth:v1');
});

describe('checkout from the cart', () => {
  it('shows the saved email and keeps it in the details form without affecting payment fields', async () => {
    const user = userEvent.setup();
    renderApp('/contact');

    expect(
      await screen.findByText('Email: asha@example.com')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Full name')).toHaveValue('Asha Raman');
    expect(screen.getByLabelText('Mobile number')).toHaveValue('9876543210');
    expect(screen.getByLabelText('Email address')).toHaveValue(
      'asha@example.com'
    );
    expect(screen.getByLabelText('Address')).toHaveValue('12 Temple Road');
    expect(screen.getByLabelText('City')).toHaveValue('Chennai');
    expect(screen.getByLabelText('State')).toHaveValue('Tamil Nadu');
    expect(screen.getByLabelText('PIN code')).toHaveValue('600004');
    expect(
      screen.getByRole('radio', { name: /UPI \/ QR/ })
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('UTR / Transaction ID')
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /change address/i }));

    await waitFor(() =>
      expect(screen.getByLabelText('Email address')).toHaveValue(
        'asha@example.com'
      )
    );
  });
});
