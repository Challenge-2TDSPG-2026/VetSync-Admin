import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import { CORES } from '../../constants/theme';
import { Screen } from '../../components/Screen';
import { Banner } from '../../components/ui/Card';
import { AppIcon } from '../../components/AppIcon';
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

function saudacao(d: Date): string {
  const h = d.getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function dataPorExtenso(d: Date): string {
  const dia = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  const semana = d.toLocaleDateString('pt-BR', { weekday: 'long' });
  return `${dia}, ${semana}`;
}

export default function Dashboard() {
  const { sessao, semConexao } = useAuth();
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const [counts, setCounts] = useState<Counts>({ prescricoes: null, relatorios: null, pontos: null, vets: null, esteticistas: null, medicamentos: null, recompensas: null });
  const [refreshing, setRefreshing] = useState(false);

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
    await carregar();
    setRefreshing(false);
  }

  const agora = new Date();
  const primeiroNome = (sessao?.nome ?? '').split(' ')[0];

  return (
    <Screen
      eyebrow={isDesktop ? undefined : `Bem-vindo(a), ${sessao?.nome ?? ''}`}
      title={isDesktop ? undefined : 'Painel'}
      desc={isDesktop ? undefined : 'Filas que esperam decisão do admin e catálogos que você mantém.'}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {isDesktop && (
        <View style={s.greeting}>
          <Text style={s.greetingTitle}>{saudacao(agora)}{primeiroNome ? `, ${primeiroNome}` : ''}</Text>
          <Text style={s.greetingDate}>{dataPorExtenso(agora)}</Text>
        </View>
      )}

      {semConexao && (
        <Banner tone="info">Não foi possível validar sua sessão com a API (sem conexão). Você continua logado, mas os dados podem estar desatualizados. Se o problema persistir, saia e entre novamente.</Banner>
      )}

      {isDesktop ? (
        <View style={s.statRow}>
          <StatCard icon="medkit-outline" tone="aviso" label="Prescrições pendentes" value={counts.prescricoes} onPress={() => router.push('/(admin)/prescricoes')} />
          <StatCard icon="document-text-outline" tone="aviso" label="Relatórios pendentes" value={counts.relatorios} onPress={() => router.push('/(admin)/relatorios-estetica')} />
          <StatCard icon="sparkles-outline" tone="aviso" label="Pontos pendentes" value={counts.pontos} onPress={() => router.push('/(admin)/pontos')} />
          <StatCard icon="medical-outline" tone="ok" label="Veterinários" value={counts.vets} onPress={() => router.push('/(admin)/veterinarios')} />
        </View>
      ) : (
        <View style={s.pendingRow}>
          <PendingPill label="Prescrições" value={counts.prescricoes} onPress={() => router.push('/(admin)/prescricoes')} />
          <PendingPill label="Relatórios" value={counts.relatorios} onPress={() => router.push('/(admin)/relatorios-estetica')} />
          <PendingPill label="Pontos" value={counts.pontos} onPress={() => router.push('/(admin)/pontos')} />
        </View>
      )}

      <Text style={s.sectionTitle}>Gerenciar</Text>
      <View style={isDesktop ? s.tileGrid : undefined}>
        {ITENS.map((item) => {
          const count = item.countKey ? counts[item.countKey] : null;
          return (
            <Pressable
              key={item.href}
              onPress={() => router.push(item.href as any)}
              style={({ pressed }) => [s.tile, isDesktop && s.tileDesktop, pressed && s.tilePressed]}
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
      </View>
    </Screen>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
  onPress,
}: {
  icon: React.ComponentProps<typeof AppIcon>['name'];
  label: string;
  value: number | null;
  tone: 'aviso' | 'ok';
  onPress: () => void;
}) {
  const warn = tone === 'aviso' && !!value;
  const cor = warn ? CORES.aviso : CORES.mintDeep;
  const bg = warn ? CORES.avisoBg : CORES.mintPale;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.statCard, pressed && s.tilePressed]}>
      <View style={[s.statIcon, { backgroundColor: bg }]}>
        <AppIcon name={icon} size={20} color={cor} />
      </View>
      <Text style={[s.statValue, warn && { color: CORES.aviso }]}>{value ?? '—'}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </Pressable>
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
  greeting: { marginBottom: 22 },
  greetingTitle: { fontSize: 28, fontWeight: '800', color: CORES.texto, letterSpacing: -0.4 },
  greetingDate: { fontSize: 12.5, color: CORES.textoSecundario, marginTop: 4 },

  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  statCard: {
    flexBasis: 200,
    flexGrow: 1,
    backgroundColor: CORES.fundoCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CORES.borda,
    padding: 18,
  },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  statValue: { fontSize: 30, fontWeight: '800', color: CORES.texto, letterSpacing: -0.5 },
  statLabel: { fontSize: 12, color: CORES.textoSecundario, marginTop: 2 },

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
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
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
  tileDesktop: { flexBasis: 280, flexGrow: 1, marginBottom: 0 },
  tilePressed: { opacity: 0.7 },
  tileIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontSize: 14.5, fontWeight: '700', color: CORES.texto },
  tileDesc: { fontSize: 12, color: CORES.textoSecundario, marginTop: 1 },
  badge: { backgroundColor: CORES.infoBg, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginRight: 2 },
  badgeWarn: { backgroundColor: CORES.avisoBg },
  badgeText: { fontSize: 11.5, fontWeight: '800', color: CORES.texto },
});