const BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

export type Invitation = {
  email: string;
  nomePet: string;
  relacao: string;
  permissao: string;
  expiraEm: string;
  contaExistente: boolean;
};

export type TutorSession = { token: string; perfil: string; email: string };
export type SocialPending = { status: string; email?: string };

export class InviteApiError extends Error {
  constructor(public status: number, message: string, public body: unknown) { super(message); }
}

export async function inviteRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'omit',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
  const raw = await response.text();
  let body: unknown;
  try { body = JSON.parse(raw); } catch { body = null; }
  if (!response.ok) {
    const data = body && typeof body === 'object' ? body as Record<string, unknown> : {};
    const message = [data.message, data.mensagem, data.detail].find(x => typeof x === 'string');
    throw new InviteApiError(response.status, typeof message === 'string' ? message : 'Não foi possível concluir a solicitação.', body);
  }
  return body as T;
}

export const invitationPath = (token: string) => `/auth/convites/${encodeURIComponent(token)}`;

export function jsonPost<T>(path: string, body: unknown, bearer?: string): Promise<T> {
  return inviteRequest<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: bearer ? { Authorization: `Bearer ${bearer}` } : {},
  });
}
