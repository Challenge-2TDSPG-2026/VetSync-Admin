import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import { CORES } from '../../constants/theme';
import { Screen } from '../../components/Screen';
import { Banner } from '../../components/ui/Card';
import { AppIcon } from '../../components/AppIcon';
import { AtendimentosDoDia } from '../../components/admin/AtendimentosDoDia';
import { useIsDesktop } from '../../hooks/useIsDesktop';

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
  relatorios: number | null;
  pontos: number | null;
  vets: number | null;
  esteticistas: number | null;
  medicamentos: number | null;
  recompensas: number | null;
}

const ITENS: Item[] = [
  { href: '/(admin)/prescricoes', icon: 'medkit-outline', label: 'Prescrições', desc: 'Fila de aprovação', countKey: 'prescricoes', accent: CORES.aviso },
  { href: '/(admin)/relatorios-estetica', icon: 'document-text-outline', label: 'Relatórios de estética', desc: 'Fila de aprovação', countKey: 'relatorios', accent: CORES.aviso },
  { href: '/(admin)/pontos', icon: 'sparkles-outline', label: 'Pontos', desc: 'Lançamentos pendentes', countKey: 'pontos', accent: CORES.aviso },
  { href: '/(admin)/veterinarios', icon: 'medical-outline', label: 'Veterinários', desc: 'Equipe clínica', countKey: 'vets' },
  { href: '/(admin)/estetica', icon: 'cut-outline', label: 'Estética', desc: 'Equipe de estética', countKey: 'esteticistas' },
  { href: '/(admin)/medicamentos', icon: 'flask-outline', label: 'Medicamentos', desc: 'Catálogo', countKey: 'medicamentos' },
  { href: '/(admin)/vinculo-clinica', icon: 'qr-code-outline', label: 'Vínculo da clínica', desc: 'Emitir código e QR code' },
  { href: '/(admin)/recompensas', icon: 'gift-outline', label: 'Recompensas', desc: 'Catálogo de resgates', countKey: 'recompensas' },
  { href: '/(admin)/tipos-evento', icon: 'list-outline', label: 'Tipos de evento', desc: 'Catálogo (leitura)' },
  { href: '/(admin)/tipos-vacina', icon: 'bandage-outline', label: 'Tipos de vacina', desc: 'Cadastrar catálogo' },
  { href: '/(admin)/buscar-pet', icon: 'search-outline', label: 'Buscar pet', desc: 'Consulta por número' },
  { href: '/(admin)/auditoria', icon: 'time-outline', label: 'Auditoria', desc: 'Histórico de alterações' },
  { href: '/(admin)/administradores', icon: 'shield-checkmark-outline', label: 'Administradores', desc: 'Cadastrar acesso' },
];

const CONTADORES_DE_FILA: (keyof Counts)[] = ['prescricoes', 'relatorios', 'pontos'];

export default function Dashboard() {
  const { sessao, semConexao } = useAuth();
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const [counts, setCounts] = useState<Counts>({ prescricoes: null, relatorios: null, pontos: null, vets: null, esteticistas: null, medicamentos: null, recompensas: null });
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const carregar = useCallback(async () => {
    // Falha vira null (contador "—"), para uma API fora do ar não parecer "0 pendências".
    const [prescricoes, relatorios, pontos, vets, esteticistas, medicamentos, recompensas] = await Promise.all([
      adminService.listarPrescricoesPendentes().catch(() => null),
      adminService.listarRelatoriosPendentes().catch(() => null),
      adminService.listarPontosPendentes().catch(() => null),
      adminService.listarVeterinarios().catch(() => null),
      adminService.listarProfissionaisEstetica().catch(() => null),
      adminService.listarMedicamentos().catch(() => null),
      adminService.listarRecompensas().catch(() => null),
    ]);
    setCounts({
      prescricoes: prescricoes?.length ?? null,
      relatorios: relatorios?.length ?? null,
      pontos: pontos?.length ?? null,
      vets: vets?.length ?? null,
      esteticistas: esteticistas?.length ?? null,
      medicamentos: medicamentos?.length ?? null,
      recompensas: recompensas?.length ?? null,
    });
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function onRefresh() {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    await carregar();
    setRefreshing(false);
  }

  return (
    <Screen
      eyebrow={isDesktop ? undefined : `Bem-vindo(a), ${sessao?.nome ?? ''}`}
      title={isDesktop ? undefined : 'Painel'}
      desc={isDesktop ? undefined : 'Filas que esperam decisão do admin e catálogos que você mantém.'}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {semConexao && (
        <Banner tone="info">Não foi possível validar sua sessão com a API (sem conexão). Você continua logado, mas os dados podem estar desatualizados. Se o problema persistir, saia e entre novamente.</Banner>
      )}

      {/* Desktop: a navegação já está na sidebar, então o painel mostra só a agenda do dia. */}
      {isDesktop ? (
        <AtendimentosDoDia refreshKey={refreshKey} />
      ) : (
        <>
          <View style={s.pendingRow}>
            <PendingPill label="Prescrições" value={counts.prescricoes} onPress={() => router.push('/(admin)/prescricoes')} />
            <PendingPill label="Relatórios" value={counts.relatorios} onPress={() => router.push('/(admin)/relatorios-estetica')} />
            <PendingPill label="Pontos" value={counts.pontos} onPress={() => router.push('/(admin)/pontos')} />
          </View>

          <AtendimentosDoDia refreshKey={refreshKey} />

          <Text style={s.sectionTitle}>Gerenciar</Text>
          {ITENS.map((item) => {
            const count = item.countKey ? counts[item.countKey] : null;
            return (
              <Pressable
                key={item.href}
                onPress={() => router.push(item.href as any)}
                style={({ pressed }) => [s.tile, pressed && s.tilePressed]}
              >
                <View style={[s.tileIcon, { backgroundColor: `${item.accent ?? CORES.secundaria}1f` }]}>
                  <AppIcon name={item.icon} size={22} color={item.accent ?? CORES.secundaria} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.tileLabel}>{item.label}</Text>
                  <Text style={s.tileDesc}>{item.desc}</Text>
                </View>
                {count !== null && count !== undefined && count > 0 && (
                  <View style={[s.badge, item.countKey && CONTADORES_DE_FILA.includes(item.countKey) ? s.badgeWarn : undefined]}>
                    <Text style={s.badgeText}>{count}</Text>
                  </View>
                )}
                <AppIcon name="chevron-forward" size={18} color={CORES.textoSecundario} />
              </Pressable>
            );
          })}
        </>
      )}
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


  pendingRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  pill: {
    flex: 1,
    backgroundColor: CORES.fundoCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderLeftWidth: 4,
    borderLeftColor: CORES.secundaria,
    padding: 12,
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