import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import SchemaView from './views/SchemaView.tsx'
import RelationalTableView from './views/RelationalTableView.tsx'

const root = document.getElementById('root')!;
const path = window.location.pathname.replace(/\/+$/, '');

if (path === '/schema') {
  createRoot(root).render(<StrictMode><SchemaView /></StrictMode>);
} else if (path === '/table') {
  createRoot(root).render(<StrictMode><RelationalTableView /></StrictMode>);
} else {
  createRoot(root).render(<StrictMode><App /></StrictMode>);
}
