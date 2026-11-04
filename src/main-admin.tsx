import { createRoot } from 'react-dom/client';
import AdminApp from './AdminApp';
import './index.css';

const rootEl = document.getElementById('admin-root');
if (rootEl) {
  createRoot(rootEl).render(<AdminApp />);
}
