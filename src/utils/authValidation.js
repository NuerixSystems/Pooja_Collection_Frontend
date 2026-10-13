// Email + password validation for customer sign-up / log-in. Mirrors backend/app/schemas.py
// (messages included), so the server and the form say the same thing. Pure, so it is unit-tested.

export const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 255;

function checkEmail(email) {
  if (!email) return 'Enter your email address.';
  if (!isValidEmail(email)) return 'Enter a valid email address.';
  return null;
}

function checkNewPassword(password) {
  if (!password) return 'Enter a password.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (new TextEncoder().encode(password).length > 72) return 'Password is too long (max 72 bytes).';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Password must include at least one letter and one number.';
  return null;
}

/** @returns {{ errors: Record<string,string>, values: {name?: string, email: string, password: string} }} */
export function validateAuth(mode, raw) {
  const email = String(raw.email ?? '').trim();
  const password = String(raw.password ?? '');
  const errors = {};
  const values = { email, password };

  if (mode === 'signup') {
    values.name = String(raw.name ?? '').trim();
    if (!values.name) errors.name = 'Enter your name.';
  }
  const emailError = checkEmail(email);
  if (emailError) errors.email = emailError;
  // Strength rules apply when creating a password; at log-in a wrong password is simply "incorrect".
  const passwordError = mode === 'signup' ? checkNewPassword(password) : password ? null : 'Enter your password.';
  if (passwordError) errors.password = passwordError;
  return { errors, values };
}

/** First error in on-screen order (name, email, password), or null. */
export const firstAuthError = (errors) => errors.name || errors.email || errors.password || null;
