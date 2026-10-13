import { describe, expect, it } from 'vitest';
import { firstAuthError, isValidEmail, validateAuth } from './authValidation';

describe('isValidEmail', () => {
  it('accepts normal addresses and rejects malformed ones, including mobile numbers', () => {
    expect(isValidEmail('pooja@example.com')).toBe(true);
    expect(isValidEmail('a.b+c@shop.co.in')).toBe(true);
    ['', 'pooja', 'pooja@', '@example.com', 'pooja@example', 'po oja@example.com', '9876543210'].forEach((v) =>
      expect(isValidEmail(v)).toBe(false),
    );
  });
});

describe('validateAuth', () => {
  it('accepts a valid sign-up and trims name and email (never the password)', () => {
    const { errors, values } = validateAuth('signup', { name: '  Pooja ', email: ' pooja@example.com ', password: ' password1' });
    expect(errors).toEqual({});
    expect(values).toEqual({ name: 'Pooja', email: 'pooja@example.com', password: ' password1' });
  });

  it('requires a name, a valid email and a reasonable password when signing up', () => {
    expect(validateAuth('signup', { name: ' ', email: '', password: '' }).errors).toEqual({
      name: 'Enter your name.', email: 'Enter your email address.', password: 'Enter a password.',
    });
    expect(validateAuth('signup', { name: 'P', email: 'nope', password: 'password1' }).errors).toEqual({ email: 'Enter a valid email address.' });
    expect(validateAuth('signup', { name: 'P', email: 'a@x.com', password: 'abc12' }).errors.password).toBe('Password must be at least 8 characters.');
    expect(validateAuth('signup', { name: 'P', email: 'a@x.com', password: 'abcdefgh' }).errors.password).toBe('Password must include at least one letter and one number.');
    expect(validateAuth('signup', { name: 'P', email: 'a@x.com', password: '12345678' }).errors.password).toBe('Password must include at least one letter and one number.');
    expect(validateAuth('signup', { name: 'P', email: 'a@x.com', password: 'a1'.repeat(40) }).errors.password).toBe('Password is too long (max 72 bytes).');
  });

  it('only asks for email and password when logging in, and does not apply strength rules', () => {
    expect(validateAuth('login', { email: 'a@x.com', password: 'x' }).errors).toEqual({});
    expect(validateAuth('login', { email: '9876543210', password: '' }).errors).toEqual({
      email: 'Enter a valid email address.', password: 'Enter your password.',
    });
    expect(validateAuth('login', { email: 'a@x.com', password: 'x' }).values).not.toHaveProperty('name');
  });

  it('reports the first error in on-screen order', () => {
    expect(firstAuthError({ password: 'p', email: 'e' })).toBe('e');
    expect(firstAuthError({})).toBeNull();
  });
});
