import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

window.addEventListener('error', (e) => {
  if (e.message === 'ResizeObserver loop limit exceeded' || e.message === 'ResizeObserver loop completed with undelivered notifications.') {
    e.preventDefault();
    return;
  }
  document.body.innerHTML = `<div style="color:red; padding:20px; font-family:monospace; direction:ltr;"><h2>GLOBAL ERROR:</h2><pre>${e.error?.stack || e.message}</pre></div>`;
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
