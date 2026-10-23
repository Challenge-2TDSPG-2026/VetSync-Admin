# VetSync · Convites

Página pública para aceitar convites de responsáveis. Ela usa um cliente HTTP próprio e não acessa nem restaura a sessão do app Admin.

## Desenvolvimento

1. Copie `.env.example` para `.env` e ajuste `VITE_API_BASE_URL` para a API Java.
2. Execute `npm install` e `npm run dev`.

## Publicação

Configure `site/` como diretório raiz do projeto Vercel, com `npm run build` e saída em `dist/`. Configure `VITE_API_BASE_URL` para a API Java. O arquivo `vercel.json` atende `/convite` diretamente e define `Referrer-Policy: no-referrer` e `noindex`.

Para login Google de contas existentes, configure `VITE_GOOGLE_CLIENT_ID` com o ID público de um cliente OAuth Web e autorize a origem do site no Google Cloud. Nunca coloque client secret em variável `VITE_`.

Na API, configure `WEB_INVITE_URL` com o endereço público completo desta página e inclua a origem do site em `APP_CORS_WEB_ORIGIN`.
