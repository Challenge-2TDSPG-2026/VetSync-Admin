import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';
import { ApiError } from '../services/api/httpClient';
import { authService } from '../services/authService';
import { assinarExpiracaoSessao } from '../services/api/sessionEvents';

export type Perfil = 'TUTOR' | 'VETERINARIO' | 'ADMIN' | 'PROFISSIONAL_ESTETICA';

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
  /** true quando a sessão foi restaurada do armazenamento sem conseguir revalidar (API fora do ar / sem rede). */
  semConexao: boolean;
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
  const [semConexao, setSemConexao] = useState(false);

  useEffect(() => {
    async function restaurarSessao() {
      const salva = await carregarSessaoSalva();
      if (!salva || !salva.token) {
        setCarregando(false);
        return;
      }
      // Revalida com a API e atualiza os dados do usuário, preservando o token salvo
      // (GET /auth/me não devolve token).
      try {
        const dados = await authService.me();
        const atual: Sessao = { ...salva, ...dados, token: salva.token };
        setSessao(atual);
        setSemConexao(false);
        await salvarSessao(atual);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          // Token realmente inválido/expirado.
          await AsyncStorage.removeItem(STORAGE_KEYS.SESSAO);
          setSessao(null);
        } else {
          // Falha de rede, timeout ou erro 5xx: mantém a sessão salva e avisa.
          setSessao(salva);
          setSemConexao(true);
        }
      } finally {
        setCarregando(false);
      }
    }
    restaurarSessao();
  }, []);

  const encerrarSessaoLocal = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSAO);
    setSessao(null);
    setSemConexao(false);
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
      setSemConexao(false);
    } catch (e) {
      const mensagem = e instanceof ApiError ? e.message : 'Não foi possível entrar. Tente novamente.';
      setErro(mensagem);
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    // 1) Revoga o token no servidor ENQUANTO ele ainda está no AsyncStorage
    //    (o httpClient lê o token de lá para montar o Authorization).
    try {
      await authService.logout();
    } catch {
      // Falha no logout remoto não pode impedir o logout local.
    }
    // 2) Só então apaga a sessão local.
    await encerrarSessaoLocal();
  }, [encerrarSessaoLocal]);

  const limparErro = useCallback(() => setErro(null), []);

  return (
    <AuthContext.Provider
      value={{
        sessao,
        autenticado: sessao !== null,
        carregando,
        erro,
        semConexao,
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