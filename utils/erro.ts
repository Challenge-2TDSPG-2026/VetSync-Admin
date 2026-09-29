import { ApiError } from '../services/api/httpClient';

export function mensagemDeErro(e: unknown, fallback = 'Ocorreu um erro inesperado.'): string {
  return e instanceof ApiError ? e.message : fallback;
}
