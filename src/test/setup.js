import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { API_CATALOG } from './fixtures';

// jsdom doesn't implement these; the app calls them on route changes.
window.scrollTo = vi.fn();
Element.prototype.scrollIntoView = vi.fn();

// The app has no bundled catalogue; every test starts from the same backend-shaped fixture.
// (imported lazily so a test file's own vi.mock('../config') still applies to the catalogue module)
beforeEach(async () => {
  const { setCatalog } = await import('../services/catalog');
  setCatalog(API_CATALOG);
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.body.style.overflow = '';
});
