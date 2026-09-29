import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import { CORES } from '../../constants/theme';
import { Screen } from '../../components/Screen';
import { AppIcon } from '../../components/AppIcon';

interface Item {
  href: string;
  icon: React.ComponentProps<typeof AppIcon>['name'];
  label: string;
  desc: string;
  countKey?: keyof Counts;
  accent?: string;
}

interface Counts {
  prescricoes: number | null;
  pontos: number | null;
  vets: number | null;
  esteticistas: number | null;
  medicamentos: number | null;
}

const ITENS: Item[] = [
  { href: '/(admin)/prescricoes', icon: 'medkit-outline', label: 'Prescrições', desc: 'Fila de aprovação', countKey: 'prescricoes', accent: CORES.aviso },
  { href: '/(admin)/pontos', icon: 'sparkles-outline', label: 'Pontos', desc: 'Lançamentos pendentes', countKey: 'pontos', accent: CORES.aviso },
  { href: '/(admin)/veterinarios', icon: 'medical-outline', label: 'Veterinários', desc: 'Equipe clínica', countKey: 'vets' },
  { href: '/(admin)/estetica', icon: 'cut-outline', label: 'Estética', desc: 'Equipe de estética', countKey: 'esteticistas' },
  { href: '/(admin)/medicamentos', icon: 'flask-outline', label: 'Medicamentos', desc: 'Catálogo', countKey: 'medicamentos' },
  { href: '/(admin)/tipos-evento', icon: 'list-outline', label: 'Tipos de evento', desc: 'Catálogo (leitura)' },
  { href: '/(admin)/administradores', icon: 'shield-checkmark-outline', label: 'Administradores', desc: 'Cadastrar acesso' },
];

export default function Dashboard() {
  const { sessao } = useAuth();
  const router = useRouter();
  const [counts, setCounts] = useState<Counts>({ prescricoes: null, pontos: null, vets: null, esteticistas: null, medicamentos: null });
  const [refreshing, setRefreshing] = useState(false);

  const carregar = useCallback(async () => {
    const [prescricoes, pontos, vets, esteticistas, medicamentos] = await Promise.all([
      adminService.listarPrescricoesPendentes().catch(() => []),
      adminService.listarPontosPendentes().catch(() => []),
      adminService.listarVeterinarios().catch(() => []),
      adminService.listarProfissionaisEstetica().catch(() => []),
      adminService.listarMedicamentos().catch(() => []),
    ]);
    setCounts({
      prescricoes: prescricoes.length,
      pontos: pontos.length,
      vets: vets.length,
      esteticistas: esteticistas.length,
      medicamentos: medicamentos.length,
    });
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function onRefresh() {
    setRefreshing(true);
    await carregar();
    setRefreshing(false);
  }

  return (
    <Screen
      eyebrow={`Bem-vindo(a), ${sessao?.nome ?? ''}`}
      title="Painel"
      desc="Filas que esperam decisão do admin e catálogos que você mantém."
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <View style={s.pendingRow}>
        <PendingPill label="Prescrições pendentes" value={counts.prescricoes} onPress={() => router.push('/(admin)/prescricoes')} />
        <PendingPill label="Pontos pendentes" value={counts.pontos} onPress={() => router.push('/(admin)/pontos')} />
      </View>

      <Text style={s.sectionTitle}>Gerenciar</Text>
      {ITENS.map((item) => {
        const count = item.countKey ? counts[item.countKey] : null;
        return (
          <Pressable key={item.href} onPress={() => router.push(item.href as any)} style={({ pressed }) => [s.tile, pressed && s.tilePressed]}>
            <View style={[s.tileIcon, { backgroundColor: `${item.accent ?? CORES.secundaria}1f` }]}>
              <AppIcon name={item.icon} size={22} color={item.accent ?? CORES.secundaria} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.tileLabel}>{item.label}</Text>
              <Text style={s.tileDesc}>{item.desc}</Text>
            </View>
            {count !== null && count !== undefined && count > 0 && (
              <View style={[s.badge, item.countKey === 'prescricoes' || item.countKey === 'pontos' ? s.badgeWarn : undefined]}>
                <Text style={s.badgeText}>{count}</Text>
              </View>
            )}
            <AppIcon name="chevron-forward" size={18} color={CORES.textoSecundario} />
          </Pressable>
        );
      })}
    </Screen>
  );
}

function PendingPill({ label, value, onPress }: { label: string; value: number | null; onPress: () => void }) {
  const warn = !!value;
  return (
    <Pressable onPress={onPress} style={[s.pill, warn && s.pillWarn]}>
      <Text style={[s.pillValue, warn && s.pillValueWarn]}>{value ?? '—'}</Text>
      <Text style={s.pillLabel}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  pendingRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  pill: {
    flex: 1,
    backgroundColor: CORES.fundoCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderLeftWidth: 4,
    borderLeftColor: CORES.secundaria,
    padding: 16,
  },
  pillWarn: { borderLeftColor: CORES.aviso },
  pillValue: { fontSize: 26, fontWeight: '800', color: CORES.texto },
  pillValueWarn: { color: CORES.aviso },
  pillLabel: { fontSize: 11.5, color: CORES.textoSecundario, marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: CORES.textoSecundario, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: CORES.fundoCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CORES.borda,
    padding: 14,
    marginBottom: 10,
  },
  tilePressed: { opacity: 0.7 },
  tileIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontSize: 14.5, fontWeight: '700', color: CORES.texto },
  tileDesc: { fontSize: 12, color: CORES.textoSecundario, marginTop: 1 },
  badge: { backgroundColor: CORES.infoBg, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginRight: 2 },
  badgeWarn: { backgroundColor: CORES.avisoBg },
  badgeText: { fontSize: 11.5, fontWeight: '800', color: CORES.texto },
});
