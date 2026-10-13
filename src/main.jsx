import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import CatalogGate from './components/CatalogGate';
import ErrorBoundary from './components/ErrorBoundary';
import { StoreProvider } from './context/StoreContext';
import { UIProvider } from './context/UIContext';
import './styles/global.css';
import './styles/pages.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <CatalogGate>
        <BrowserRouter>
          <StoreProvider>
            <UIProvider>
              <App />
            </UIProvider>
          </StoreProvider>
        </BrowserRouter>
      </CatalogGate>
    </ErrorBoundary>
  </StrictMode>,
);
