import { Platform } from 'react-native';
import type { ImagePickerAsset } from 'expo-image-picker';
import type { ImagemSelecionada } from '../types';

export const TIPOS_IMAGEM_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
export const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024; // 5 MB

const EXT_POR_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function mimePorExtensao(nome: string): string | null {
  const ext = nome.split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return null;
}

/**
 * Valida (tipo e tamanho) o asset escolhido no image picker e o normaliza.
 * Lança Error com mensagem em português se a imagem não for aceita pelo backend.
 */
export async function prepararImagem(asset: ImagePickerAsset): Promise<ImagemSelecionada> {
  const uriSemNome = asset.uri.startsWith('data:') || asset.uri.startsWith('blob:');
  const nomeOrigem =
    asset.fileName ?? (uriSemNome ? 'imagem' : asset.uri.split('/').pop()?.split('?')[0] ?? 'imagem');

  let tipo = (asset.mimeType ?? mimePorExtensao(nomeOrigem) ?? '').toLowerCase();
  if (tipo === 'image/jpg') tipo = 'image/jpeg';
  if (!TIPOS_IMAGEM_PERMITIDOS.includes(tipo)) {
    throw new Error('Formato de imagem inválido. Use JPEG, PNG ou WEBP.');
  }

  let tamanho = asset.fileSize;
  if (tamanho == null && Platform.OS === 'web') {
    tamanho = (await (await fetch(asset.uri)).blob()).size;
  }
  if (tamanho != null && tamanho > TAMANHO_MAXIMO_IMAGEM) {
    throw new Error('A imagem deve ter no máximo 5 MB.');
  }

  const base = nomeOrigem.replace(/\.[a-z0-9]+$/i, '') || 'imagem';
  return { uri: asset.uri, name: `${base}.${EXT_POR_MIME[tipo]}`, type: tipo, size: tamanho ?? undefined };
}

/**
 * Anexa a imagem ao FormData.
 * - Nativo: objeto { uri, name, type } (o React Native lê o arquivo).
 * - Web: precisa de um Blob de verdade, obtido a partir do uri.
 */
export async function anexarImagem(form: FormData, campo: string, img: ImagemSelecionada): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(img.uri)).blob();
    form.append(campo, new Blob([blob], { type: img.type }), img.name);
  } else {
    form.append(campo, { uri: img.uri, name: img.name, type: img.type } as any);
  }
}