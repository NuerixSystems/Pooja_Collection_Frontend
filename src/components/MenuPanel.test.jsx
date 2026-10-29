import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test/utils';
import { getSession, saveSession } from '../services/session';

const openMenu = async (user) => {
  await user.click(screen.getByRole('button', { name: 'Open menu' }));
};

describe('mobile menu account action', () => {
  it('opens login for a guest', async () => {
    const user = userEvent.setup();
    renderApp('/');
    await openMenu(user);

    await user.click(within(screen.getByRole('dialog', { name: 'Menu' }))
      .getByRole('button', { name: 'Log in or create account' }));

    expect(await screen.findByRole('dialog', { name: 'Log in' })).toBeInTheDocument();
  });

  it('logs out a signed-in customer and returns to the storefront', async () => {
    const user = userEvent.setup();
    saveSession({ token: 'customer-token', customer: { id: 42, name: 'Pooja' } });
    renderApp('/account');
    await openMenu(user);

    await user.click(within(screen.getByRole('dialog', { name: 'Menu' }))
      .getByRole('button', { name: 'Log out' }));

    expect(getSession()).toBeNull();
    expect(await screen.findByRole('button', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Menu' })).not.toBeInTheDocument();
  });
});
