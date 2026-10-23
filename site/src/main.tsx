import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';

const InvitePage = lazy(() => import('./InvitePage'));
const isInvite = window.location.pathname.replace(/\/+$/, '') === '/convite';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<div>Carregando…</div>}>
      {isInvite ? <InvitePage /> : <main>Acesse pelo link de convite recebido.</main>}
    </Suspense>
  </React.StrictMode>,
);
