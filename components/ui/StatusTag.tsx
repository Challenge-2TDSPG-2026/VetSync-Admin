import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CORES } from '../../constants/theme';

type Tom = 'pendente' | 'aprovado' | 'negado' | 'neutro';

const ESTILOS: Record<Tom, { bg: string; cor: string }> = {
  pendente: { bg: CORES.avisoBg, cor: CORES.aviso },
  aprovado: { bg: CORES.successBg, cor: CORES.success },
  negado: { bg: CORES.alertaBg, cor: CORES.alerta },
  neutro: { bg: CORES.infoBg, cor: CORES.info },
};

export function StatusTag({ tom, label }: { tom: Tom; label: string }) {
  const estilo = ESTILOS[tom];
  return (
    <View style={[s.tag, { backgroundColor: estilo.bg }]}>
      <Text style={[s.label, { color: estilo.cor }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  tag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  label: { fontSize: 10.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
});
