import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CORES } from '../../constants/theme';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { AppIcon } from '../AppIcon';

/** Bom dia (05h–11h59), boa tarde (12h–17h59) e boa noite (18h–04h59). */
export function saudacaoPorHora(data: Date = new Date()): string {
  const h = data.getHours();
  if (h >= 5 && h < 12) return 'Bom dia';
  if (h >= 12 && h < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** Ex.: "1 de outubro de 2026, quinta-feira" */
function dataPorExtenso(data: Date): string {
  const dia = data.getDate();
  const mes = data.toLocaleDateString('pt-BR', { month: 'long' });
  const semana = data.toLocaleDateString('pt-BR', { weekday: 'long' });
  return `${dia} de ${mes} de ${data.getFullYear()}, ${semana}`;
}

// Cores amostradas da foto, para o fundo do banner emendar nela sem "quadrado".
const COR_CLARA = '#e6f9ef';
const COR_FOTO = '#b8ebd0';

export function SaudacaoPainel() {
  const isDesktop = useIsDesktop();
  const [agora, setAgora] = useState(() => new Date());

  // Atualiza a cada minuto para a saudação e a data virarem sozinhas durante o uso.
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const altura = isDesktop ? 130 : 96;
  const larguraFoto = isDesktop ? 330 : 150;

  return (
    <View style={[s.banner, { height: altura }]}>
      {/* Lado do texto: vai do claro até a cor da foto, onde ela começa */}
      <View style={[s.texto, !isDesktop && s.textoMobile]}>
        <LinearGradient
          colors={[COR_CLARA, COR_FOTO]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        {isDesktop && (
          <View style={s.iconCircle}>
            <AppIcon name="paw" size={26} color={CORES.mintDeep} />
          </View>
        )}
        <View style={s.textBox}>
          <Text style={[s.titulo, !isDesktop && s.tituloMobile]} numberOfLines={1}>
            {saudacaoPorHora(agora)}
          </Text>
          <Text style={[s.data, !isDesktop && s.dataMobile]}>{dataPorExtenso(agora)}</Text>
        </View>
      </View>

      {/* Foto colada na ponta direita; a borda esquerda esmaece na cor do fundo */}
      <View style={{ width: larguraFoto, height: '100%', overflow: 'hidden' }} pointerEvents="none">
        <Image
          source={require('../../assets/pets-banner.jpg')}
          style={s.foto}
          resizeMode="cover"
          accessibilityLabel="Cachorros, gatos e outros pets sorrindo"
        />
        <LinearGradient
          colors={[COR_FOTO, `${COR_FOTO}00`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.fade}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CORES.borda,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: COR_FOTO,
  },
  texto: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingLeft: 28,
  },
  textoMobile: { paddingLeft: 16 },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: CORES.mintPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBox: { flexShrink: 1 },
  titulo: { fontSize: 30, fontWeight: '800', color: CORES.primaria, letterSpacing: -0.4 },
  tituloMobile: { fontSize: 20 },
  data: { fontSize: 14, color: CORES.mintDeep, marginTop: 4 },
  dataMobile: { fontSize: 12 },
  foto: { width: '100%', height: '100%' },
  fade: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '40%' },
});