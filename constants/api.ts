function normalizarBaseUrl(url: string | undefined, padrao: string): string {
  const valor = url?.trim();
  return valor ? valor.replace(/\/+$/, '') : padrao;
}

const DEFAULT_API_BASE_URL = 'https://vetsync-java.onrender.com';

// EXPO_PUBLIC_* é incorporada no bundle durante o build.
// Nunca use esta variável para segredos: seu conteúdo fica público no app.
export const API_BASE_URL = normalizarBaseUrl(
  process.env.EXPO_PUBLIC_API_BASE_URL,
  DEFAULT_API_BASE_URL
);
