import { useCallback, useEffect, useState } from 'react';
import { CRM } from '../config';
import { hydrateCatalog } from '../services/catalog';

// Loads the catalogue from the backend before anything that needs it renders.
// There is no bundled fallback: if the backend can't be reached the shopper gets a retry screen.
// Plain markup (no router/store) because it renders above them.
export default function CatalogGate({ children }) {
  const [status, setStatus] = useState('loading'); // loading | ready | error

  const load = useCallback(async () => {
    setStatus('loading');
    setStatus((await hydrateCatalog()) ? 'ready' : 'error');
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (status === 'ready') return children;
  return (
    <div className="container">
      <div className="empty" role={status === 'error' ? 'alert' : 'status'}>
        {status === 'loading' ? (
          <p>Loading the collection…</p>
        ) : (
          <>
            <h1 style={{ fontSize: '2rem' }}>We couldn’t load the shop</h1>
            <p>
              {CRM.apiUrl
                ? 'The shop’s server isn’t responding. Check your connection and try again.'
                : 'The backend address isn’t configured (set VITE_CRM_API_URL).'}
            </p>
            <button type="button" className="btn" onClick={load}>Try again</button>
          </>
        )}
      </div>
    </div>
  );
}
