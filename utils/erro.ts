import { ApiError } from '../services/api/httpClient';

export function mensagemDeErro(e: unknown, fallback = 'Ocorreu um erro inesperado.'): string {
  return e instanceof ApiError ? e.message : fallback;
}

/** 409: o registro já foi decidido/alterado por outra pessoa — a tela deve recarregar a lista. */
export function ehConflito(e: unknown): boolean {
  return e instanceof ApiError && e.status === 409;
}