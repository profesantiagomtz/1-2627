import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Home from './app/page';
import './app/globals.css';
import './app/learning.css';
import './app/windows-desktop.css';

createRoot(document.getElementById('root')!).render(<StrictMode><Home /></StrictMode>);
