import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CORES } from '../../constants/theme';

export function RecordRow({ children }: { children: React.ReactNode }) {
  return <View style={s.row}>{children}</View>;
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
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  id: { fontSize: 11, fontWeight: '700', color: CORES.textoSecundario, marginBottom: 2 },
  title: { fontSize: 15.5, fontWeight: '800', color: CORES.texto },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 6 },
  lineLabel: { fontSize: 11.5, fontWeight: '700', color: CORES.textoSecundario, textTransform: 'uppercase', letterSpacing: 0.3 },
  lineValue: { fontSize: 13, color: CORES.texto, flexShrink: 1, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
});
