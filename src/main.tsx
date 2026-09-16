import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/react/app.tsx';
import '@/react/styles/base.css';
import '@/react/styles/layout.css';

const root = document.getElementById('root');
if (!root) throw new Error('A página não tem o elemento onde a aplicação monta.');

createRoot(root).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
