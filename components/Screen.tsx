import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CORES } from '../constants/theme';
import { useIsDesktop } from '../hooks/useIsDesktop';

interface ScreenProps {
  eyebrow?: string;
  title?: string;
  desc?: string;
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function Screen({ eyebrow, title, desc, children, refreshing, onRefresh }: ScreenProps) {
  const isDesktop = useIsDesktop();
  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={[s.content, isDesktop && s.contentDesktop]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={CORES.secundaria} /> : undefined
      }
    >
      <View style={isDesktop ? s.inner : undefined}>
        {(eyebrow || title || desc) && (
          <View style={s.header}>
            {eyebrow ? <Text style={s.eyebrow}>{eyebrow}</Text> : null}
            {title ? <Text style={s.title}>{title}</Text> : null}
            {desc ? <Text style={s.desc}>{desc}</Text> : null}
          </View>
        )}
        {children}
      </View>
    </ScrollView>
  );
}

export function LoadingBlock({ label = 'Carregando…' }: { label?: string }) {
  return (
    <View style={s.loading}>
      <ActivityIndicator color={CORES.secundaria} />
      <Text style={s.loadingText}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: CORES.fundo },
  content: { padding: 18, paddingBottom: 48 },
  contentDesktop: { paddingHorizontal: 40, paddingTop: 32, paddingBottom: 64, alignItems: 'center' },
  inner: { width: '100%', maxWidth: 1100 },
  header: { marginBottom: 18 },
  eyebrow: { fontSize: 11.5, fontWeight: '800', color: CORES.mintDeep, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  title: { fontSize: 23, fontWeight: '800', color: CORES.texto, letterSpacing: -0.3 },
  desc: { fontSize: 13.5, color: CORES.textoSecundario, marginTop: 6, lineHeight: 19 },
  loading: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  loadingText: { fontSize: 12.5, color: CORES.textoSecundario },
});