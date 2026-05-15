import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './shared/localization/i18n';
import App from './App';
import { registerServiceWorker, setupInstallPrompt } from './shared/utils/pwaUtils';

// Register service worker for offline support
registerServiceWorker();

// Set up PWA install prompt
setupInstallPrompt();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
