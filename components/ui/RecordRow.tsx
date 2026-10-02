import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CORES } from '../../constants/theme';
import { Hover } from './Hover';

export function RecordRow({ children }: { children: React.ReactNode }) {
  return <Hover style={s.row} hoverStyle={s.rowHover}>{children}</Hover>;
}

export function RecordHeader({ id, title, right }: { id?: string | number; title: string; right?: React.ReactNode }) {
  return (
    <View style={s.header}>
      <View style={{ flex: 1 }}>
        {id !== undefined && <Text style={s.id}>#{id}</Text>}
        <Text style={s.title}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

export function RecordLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View style={s.line}>
      <Text style={s.lineLabel}>{label}</Text>
      <Text style={s.lineValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

/** Texto longo em bloco (sem truncar), com o rótulo acima. */
export function RecordBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.block}>
      <Text style={s.lineLabel}>{label}</Text>
      <Text style={s.blockValue}>{value}</Text>
    </View>
  );
}

export function RecordActions({ children }: { children: React.ReactNode }) {
  return <View style={s.actions}>{children}</View>;
}

const s = StyleSheet.create({
  row: {
    backgroundColor: CORES.fundoCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: CORES.borda,
    padding: 16,
    marginBottom: 12,
  },
  rowHover: {
    borderColor: CORES.secundaria,
    transform: [{ translateY: -2 }],
    shadowColor: CORES.primaria,
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  id: { fontSize: 11, fontWeight: '700', color: CORES.textoSecundario, marginBottom: 2 },
  title: { fontSize: 15.5, fontWeight: '800', color: CORES.texto },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 6 },
  lineLabel: { fontSize: 11.5, fontWeight: '700', color: CORES.textoSecundario, textTransform: 'uppercase', letterSpacing: 0.3 },
  lineValue: { fontSize: 13, color: CORES.texto, flexShrink: 1, textAlign: 'right' },
  block: { marginTop: 10 },
  blockValue: { fontSize: 13.5, color: CORES.texto, lineHeight: 19, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
});