import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { API_BASE_URL } from '../../constants/api';
import { STORAGE_KEYS } from '../../constants/storage';
import { notificarExpiracaoSessao } from './sessionEvents';

export class ApiError extends Error {
  status: number;
  campos?: Record<string, string>;

  constructor(status: number, mensagem: string, campos?: Record<string, string>) {
    super(mensagem);
    this.name = 'ApiError';
    this.status = status;
    this.campos = campos;
  }
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method: Metodo;
  path: string;
  body?: unknown;
  /** Corpo multipart. Quando informado, o Content-Type NÃO é definido (o fetch gera o boundary). */
  formData?: FormData;
  autenticado?: boolean;
  timeoutMs?: number;
}

export async function obterToken(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.SESSAO);
  if (!raw) return null;
  try {
    const sessao = JSON.parse(raw);
    return sessao?.token ?? null;
  } catch {
    return null;
  }
}

function extrairErro(status: number, corpo: any): ApiError {
  if (corpo && typeof corpo === 'object') {
    if (corpo.campos && typeof corpo.campos === 'object') {
      const primeiraMsg = Object.values(corpo.campos)[0];
      return new ApiError(
        status,
        typeof primeiraMsg === 'string' ? primeiraMsg : 'Dados inválidos.',
        corpo.campos
      );
    }
    if (typeof corpo.mensagem === 'string') {
      return new ApiError(status, corpo.mensagem);
    }
    if (typeof corpo.erro === 'string') {
      return new ApiError(status, corpo.erro);
    }
  }
  return new ApiError(status, 'Não foi possível completar a solicitação. Tente novamente.');
}

export async function apiRequest<T = unknown>({
  method,
  path,
  body,
  formData,
  autenticado = true,
  timeoutMs = 30_000,
}: RequestOptions): Promise<T> {
  const headers: Record<string, string> = {};
  if (!formData) headers['Content-Type'] = 'application/json';

  if (autenticado) {
    const token = await obterToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let resposta: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    resposta = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal: controller.signal,
    });
  } catch (erro) {
    console.warn('Falha no fetch:', method, `${API_BASE_URL}${path}`, erro);
    if (erro instanceof Error && erro.name === 'AbortError') {
      throw new ApiError(0, 'A solicitação demorou mais que o esperado. Tente novamente.');
    }
    throw new ApiError(0, 'Não foi possível conectar à API. Verifique sua conexão e se o servidor está no ar.');
  } finally {
    clearTimeout(timeout);
  }

  if (resposta.status === 204) {
    return undefined as T;
  }

  const texto = await resposta.text();
  let corpo: unknown = null;
  try {
    corpo = texto ? JSON.parse(texto) : null;
  } catch {
    corpo = texto;
  }

  // 401 só significa "sessão expirada" em chamadas autenticadas.
  // No login, o 401 traz a mensagem real do backend (ex.: "E-mail ou senha inválidos").
  if (resposta.status === 401 && autenticado) {
    notificarExpiracaoSessao();
    throw new ApiError(401, 'Sua sessão expirou. Entre novamente.');
  }

  if (!resposta.ok) {
    throw extrairErro(resposta.status, corpo);
  }

  return corpo as T;
}

const TIMEOUT_UPLOAD_MS = 60_000;

export const api = {
  get: <T>(path: string, autenticado = true) => apiRequest<T>({ method: 'GET', path, autenticado }),
  post: <T>(path: string, body?: unknown, autenticado = true) =>
    apiRequest<T>({ method: 'POST', path, body, autenticado }),
  put: <T>(path: string, body?: unknown, autenticado = true) =>
    apiRequest<T>({ method: 'PUT', path, body, autenticado }),
  patch: <T>(path: string, body?: unknown, autenticado = true) =>
    apiRequest<T>({ method: 'PATCH', path, body, autenticado }),
  delete: <T = void>(path: string, autenticado = true) =>
    apiRequest<T>({ method: 'DELETE', path, autenticado }),
  postForm: <T>(path: string, formData: FormData) =>
    apiRequest<T>({ method: 'POST', path, formData, timeoutMs: TIMEOUT_UPLOAD_MS }),
  putForm: <T>(path: string, formData: FormData) =>
    apiRequest<T>({ method: 'PUT', path, formData, timeoutMs: TIMEOUT_UPLOAD_MS }),
};

/**
 * Upload multipart no app nativo (Android/iOS) usando o uploader nativo do Expo.
 * Evita o FormData do React Native com arquivo ({ uri, name, type }), que falha com
 * "Network request failed" em alguns aparelhos/versões. Na web continue usando api.postForm/putForm.
 */
export async function uploadNativo<T>({
  method,
  path,
  campos,
  arquivo,
  campoArquivo = 'imagem',
}: {
  method: 'POST' | 'PUT';
  path: string;
  campos: Record<string, string>;
  arquivo: { uri: string; type: string };
  campoArquivo?: string;
}): Promise<T> {
  const token = await obterToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `${API_BASE_URL}${path}`;
  const resposta = await FileSystem.uploadAsync(url, arquivo.uri, {
    httpMethod: method,
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: campoArquivo,
    mimeType: arquivo.type,
    parameters: campos,
    headers,
  }).catch((erro: unknown) => {
    console.warn('Falha no upload nativo:', method, url, erro);
    throw new ApiError(0, 'Não foi possível enviar a imagem. Verifique sua conexão e tente novamente.');
  });

  let corpo: unknown = null;
  try {
    corpo = resposta.body ? JSON.parse(resposta.body) : null;
  } catch {
    corpo = resposta.body;
  }

  if (resposta.status === 401) {
    notificarExpiracaoSessao();
    throw new ApiError(401, 'Sua sessão expirou. Entre novamente.');
  }
  if (resposta.status < 200 || resposta.status >= 300) {
    throw extrairErro(resposta.status, corpo);
  }
  return corpo as T;
}

/**
 * Baixa uma imagem protegida por JWT e devolve como data URI
 * (ex.: "data:image/png;base64,...") para uso em <Image source={{ uri }} />.
 * O `path` é o mesmo devolvido pela API em `imagemUrl` (ex.: /recompensas/3/imagem).
 */
export async function baixarImagemDataUri(path: string): Promise<string> {
  const token = await obterToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_UPLOAD_MS);

  let resposta: Response;
  try {
    resposta = await fetch(`${API_BASE_URL}${path}`, { headers, signal: controller.signal });
  } catch {
    throw new ApiError(0, 'Não foi possível baixar a imagem.');
  } finally {
    clearTimeout(timeout);
  }

  if (resposta.status === 401) {
    notificarExpiracaoSessao();
    throw new ApiError(401, 'Sua sessão expirou. Entre novamente.');
  }
  if (!resposta.ok) {
    throw new ApiError(resposta.status, 'Não foi possível baixar a imagem.');
  }

  const blob = await resposta.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    reader.readAsDataURL(blob);
  });
}