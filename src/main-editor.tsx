import { createRoot } from 'react-dom/client';
import EditorApp from './EditorApp';
import './index.css';

const rootEl = document.getElementById('editor-root');
if (rootEl) {
  createRoot(rootEl).render(<EditorApp />);
}
