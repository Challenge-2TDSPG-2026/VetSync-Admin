import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppIcon } from '../AppIcon';
import { CORES } from '../../constants/theme';

interface EmptyStateProps {
  icon: React.ComponentProps<typeof AppIcon>['name'];
  title: string;
  subtitle?: string;
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({ icon, title, subtitle, accentColor = CORES.secundaria, style }: EmptyStateProps) {
  return (
    <View style={[s.container, style]}>
      <View style={[s.orb, { backgroundColor: `${accentColor}1f` }]}>
        <AppIcon name={icon} size={27} color={accentColor} />
      </View>
      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
    backgroundColor: CORES.fundoCard,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderStyle: 'dashed',
  },
  orb: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 14, fontWeight: '700', color: CORES.texto, marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 12, color: CORES.textoSecundario, textAlign: 'center', lineHeight: 17 },
});
