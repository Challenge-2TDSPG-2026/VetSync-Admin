# VetSync-Admin

App Expo (React Native + Expo Router + TypeScript) para o perfil **ADMIN** do backend [vetSync-Java](https://github.com/Challenge-2TDSPG-2026/vetSync-Java). Mesma stack, padrões e paleta do [vetSync-Mobile](https://github.com/Challenge-2TDSPG-2026/vetSync-Mobile) — roda em Android, iOS e web a partir do mesmo código.

## O que cobre

| Área | Endpoints usados | Tela |
| --- | --- | --- |
| Login / sessão | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` | `app/login.tsx` |
| Painel | agrega as filas e catálogos abaixo | `app/(admin)/index.tsx` |
| Veterinários | `GET/POST /veterinarios` | `veterinarios.tsx` |
| Profissionais de estética | `GET/POST /profissionais-estetica` | `estetica.tsx` |
| Administradores | `POST /admins` | `administradores.tsx` |
| Prescrições | `GET /prescricoes`, `PATCH /prescricoes/{id}/liberar` | `prescricoes.tsx` |
| Pontos | `GET /pontos`, `PATCH /pontos/{id}/liberar` | `pontos.tsx` |
| Medicamentos | `GET/POST/PUT/DELETE /medicamentos` | `medicamentos.tsx` |
| Tipos de evento | `GET /tipos-evento` (somente leitura) | `tipos-evento.tsx` |

Duas limitações vêm da própria API, não do app:
- **Sem endpoint para listar clínicas** — o ID da clínica é digitado à mão ao cadastrar vet/esteticista.
- **Sem endpoint para listar admins existentes** — a tela de Administradores mostra só os criados na sessão atual.

## Como rodar

Pré-requisitos: Node 18+, o app [Expo Go](https://expo.dev/go) no celular (ou um emulador Android/iOS), e o backend `vetSync-Java` no ar.

```bash
npm install
cp .env.example .env   # ajuste EXPO_PUBLIC_API_BASE_URL se a API não estiver em localhost:8080
npm start
```

O Expo abre um QR code no terminal/navegador. Escaneie com o Expo Go (Android) ou a câmera (iOS) para rodar no celular, ou pressione `w` para abrir no navegador.

**Importante sobre o celular físico:** `localhost` no `.env` só funciona em emulador. Testando num celular real, troque `EXPO_PUBLIC_API_BASE_URL` pelo IP da sua máquina na rede local (ex.: `http://192.168.0.10:8080`) — e garanta que o backend aceita conexões de fora do `localhost`.

## Login

Use um admin existente ou crie o primeiro via bootstrap direto na API:

```bash
curl -X POST http://localhost:8080/admins/bootstrap \
  -H "Content-Type: application/json" \
  -d '{"nome":"Admin Geral","email":"admin@vetsync.com","chave":"boot-secret-dev-12345"}'
```

A senha temporária vem na resposta — use-a para logar no app.

## Estrutura

```
app/
  _layout.tsx        redireciona por perfil (login → admin → acesso restrito)
  login.tsx
  acesso-restrito.tsx
  (admin)/
    _layout.tsx      Stack com header verde-escuro + botão de sair
    index.tsx        painel/hub, com contadores das filas
    veterinarios.tsx, estetica.tsx, prescricoes.tsx, pontos.tsx,
    medicamentos.tsx, tipos-evento.tsx, administradores.tsx
components/          Screen, Card/Field/Banner, Button, RecordRow, Toast, EmptyState…
context/             AuthContext (sessão via AsyncStorage)
services/            httpClient.ts (fetch + tratamento de erro), authService, adminService
constants/theme.ts   paleta idêntica ao vetSync-Mobile (CORES)
types/                DTOs compartilhados
```

Se o backend mudar um DTO, o ponto único de ajuste é `services/adminService.ts` + `types/index.ts`.

## Validado neste ambiente

- `npx tsc --noEmit` — sem erros de tipo.
- `npx expo export -p web` — bundle Metro completo (899 módulos) sem erros de import/asset.

Não foi possível testar em emulador/dispositivo real neste ambiente — vale um teste rápido com `npm start` antes de considerar pronto para entrega.
