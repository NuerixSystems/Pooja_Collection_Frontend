import { useEffect } from 'react';
import { BRAND } from '../config';

export function useDocumentTitle(title) {
  useEffect(() => {
    const pageTitle = title ? `${title} — ${BRAND.name}` : `${BRAND.name} — ${BRAND.tagline.join(', ')}`;
    document.title = pageTitle;
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', pageTitle);
  }, [title]);
}
