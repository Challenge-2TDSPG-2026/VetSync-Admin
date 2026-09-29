import { api, apiRequest } from './api/httpClient';
import type { Sessao } from '../context/AuthContext';

export const authService = {
  async login(email: string, senha: string): Promise<Sessao> {
    return api.post<Sessao>('/auth/login', { email: email.trim().toLowerCase(), senha }, false);
  },

  /** O backend NÃO devolve o token em /auth/me. */
  async me(): Promise<Omit<Sessao, 'token'>> {
    return api.get<Omit<Sessao, 'token'>>('/auth/me');
  },

  /** Timeout curto: o logout remoto não pode travar o logout local. */
  async logout(): Promise<void> {
    await apiRequest({ method: 'POST', path: '/auth/logout', timeoutMs: 5_000 });
  },
};