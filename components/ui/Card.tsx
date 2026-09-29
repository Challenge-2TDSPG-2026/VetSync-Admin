import React from 'react';
import { StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { CORES } from '../../constants/theme';

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <Text style={s.cardTitle}>{children}</Text>;
}

export function CardDesc({ children }: { children: React.ReactNode }) {
  return <Text style={s.cardDesc}>{children}</Text>;
}

interface FieldProps extends TextInputProps {
  label: string;
}

export function Field({ label, style, ...rest }: FieldProps) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={CORES.textoSecundario}
        style={[s.input, style]}
        {...rest}
      />
    </View>
  );
}

export function Banner({ tone = 'error', children }: { tone?: 'error' | 'info'; children: React.ReactNode }) {
  return (
    <View style={[s.banner, tone === 'error' ? s.bannerError : s.bannerInfo]}>
      <Text style={[s.bannerText, { color: tone === 'error' ? CORES.alerta : CORES.mintDeep }]}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: CORES.fundoCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CORES.borda,
    padding: 18,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 15.5, fontWeight: '800', color: CORES.texto, marginBottom: 3 },
  cardDesc: { fontSize: 12.8, color: CORES.textoSecundario, marginBottom: 14, lineHeight: 18 },
  field: { marginBottom: 13 },
  fieldLabel: { fontSize: 12.5, fontWeight: '700', color: CORES.textoSecundario, marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: CORES.borda,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: CORES.texto,
    backgroundColor: '#fff',
  },
  banner: { borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1 },
  bannerError: { backgroundColor: CORES.alertaBg, borderColor: '#f3b7bd' },
  bannerInfo: { backgroundColor: CORES.mintPale, borderColor: '#9bd8ba' },
  bannerText: { fontSize: 12.8, lineHeight: 18 },
});
