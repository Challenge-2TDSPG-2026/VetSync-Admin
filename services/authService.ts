import { api } from './api/httpClient';
import type { Sessao } from '../context/AuthContext';

export const authService = {
  async login(email: string, senha: string): Promise<Sessao> {
    return api.post<Sessao>('/auth/login', { email: email.trim().toLowerCase(), senha }, false);
  },

  async me(): Promise<Sessao> {
    return api.get<Sessao>('/auth/me');
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },
};
