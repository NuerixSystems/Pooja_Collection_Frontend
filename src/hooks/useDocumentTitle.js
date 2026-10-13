import { useEffect } from 'react';
import { BRAND } from '../config';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — ${BRAND.name}` : `${BRAND.name} — ${BRAND.tagline.join(', ')}`;
  }, [title]);
}
