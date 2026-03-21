import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { applySavedAppearance } from './lib/appearance';
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });
applySavedAppearance();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
