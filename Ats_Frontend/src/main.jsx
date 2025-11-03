import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import "../src/index.css"; 

// Set favicon to project's prime(P).png at runtime so it works in dev and prod
(() => {
  try {
    const faviconHref = new URL('./assets/prime(P).png', import.meta.url).href;
    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/png';
    link.href = faviconHref;
  } catch (_) {
    // ignore if asset not found in certain environments
  }
})();


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
