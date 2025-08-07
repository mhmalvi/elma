import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Proactively unregister any legacy service workers (from CRA setups)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(regs => regs.forEach(r => r.unregister().catch(() => {})))
    .catch(() => {})
}


createRoot(document.getElementById("root")!).render(<App />);
