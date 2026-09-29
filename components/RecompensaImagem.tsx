import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppIcon } from './AppIcon';
import { CORES } from '../constants/theme';
import { baixarImagemDataUri } from '../services/api/httpClient';

interface RecompensaImagemProps {
  /** Caminho devolvido pela API (ex.: /recompensas/3/imagem). Vazio = sem foto. */
  imagemUrl?: string | null;
  /** Mude este valor para forçar o recarregamento (ex.: após trocar a foto). */
  versao?: number;
  tamanho?: number;
  style?: StyleProp<ViewStyle>;
}

export function RecompensaImagem({ imagemUrl, versao = 0, tamanho = 64, style }: RecompensaImagemProps) {
  const [uri, setUri] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(!!imagemUrl);

  useEffect(() => {
    if (!imagemUrl) {
      setUri(null);
      setCarregando(false);
      return;
    }

    let cancelado = false;
    setCarregando(true);
    baixarImagemDataUri(imagemUrl)
      .then((dados: string) => {
        if (!cancelado) setUri(dados);
      })
      .catch(() => {
        if (!cancelado) setUri(null);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [imagemUrl, versao]);

  return (
    <View style={[s.caixa, { width: tamanho, height: tamanho }, style]}>
      {carregando ? (
        <ActivityIndicator size="small" color={CORES.secundaria} />
      ) : uri ? (
        <Image source={{ uri }} style={s.imagem} resizeMode="cover" />
      ) : (
        <AppIcon name="image-outline" size={Math.round(tamanho * 0.4)} color={CORES.textoSecundario} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  caixa: {
    borderRadius: 14,
    backgroundColor: CORES.fundoSutil,
    borderWidth: 1,
    borderColor: CORES.borda,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imagem: { width: '100%', height: '100%' },
});