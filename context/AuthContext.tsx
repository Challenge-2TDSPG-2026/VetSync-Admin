import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';
import { ApiError } from '../services/api/httpClient';
import { authService } from '../services/authService';
import { assinarExpiracaoSessao } from '../services/api/sessionEvents';

export type Perfil = 'TUTOR' | 'VETERINARIO' | 'ADMIN';

export interface Sessao {
  token: string;
  idUsuario: number;
  email: string;
  nome: string;
  perfil: Perfil;
}

type AuthContextValue = {
  sessao: Sessao | null;
  autenticado: boolean;
  carregando: boolean;
  erro: string | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  limparErro: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function salvarSessao(sessao: Sessao): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SESSAO, JSON.stringify(sessao));
}

async function carregarSessaoSalva(): Promise<Sessao | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.SESSAO);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Sessao;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function restaurarSessao() {
      const salva = await carregarSessaoSalva();
      if (!salva) {
        setCarregando(false);
        return;
      }
      // Revalida com a API: garante que o token ainda é válido e atualiza os dados do usuário.
      try {
        const atual = await authService.me();
        setSessao(atual);
        await salvarSessao(atual);
      } catch {
        await AsyncStorage.removeItem(STORAGE_KEYS.SESSAO);
        setSessao(null);
      } finally {
        setCarregando(false);
      }
    }
    restaurarSessao();
  }, []);

  const encerrarSessaoLocal = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSAO);
    setSessao(null);
  }, []);

  useEffect(() => {
    return assinarExpiracaoSessao(() => {
      void encerrarSessaoLocal();
    });
  }, [encerrarSessaoLocal]);

  const login = useCallback(async (email: string, senha: string) => {
    setErro(null);
    try {
      const resposta = await authService.login(email, senha);
      await salvarSessao(resposta);
      setSessao(resposta);
    } catch (e) {
      const mensagem = e instanceof ApiError ? e.message : 'Não foi possível entrar. Tente novamente.';
      setErro(mensagem);
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    await encerrarSessaoLocal();
    authService.logout().catch(() => {});
  }, [encerrarSessaoLocal]);

  const limparErro = useCallback(() => setErro(null), []);

  return (
    <AuthContext.Provider
      value={{
        sessao,
        autenticado: sessao !== null,
        carregando,
        erro,
        login,
        logout,
        limparErro,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() deve ser usado dentro de <AuthProvider>');
  return ctx;
}
