import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { adminService } from '../../services/adminService';
import type { AtendimentoDia } from '../../types';
import { mensagemDeErro } from '../../utils/erro';
import { CORES } from '../../constants/theme';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { AppIcon } from '../AppIcon';
import { Banner } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';

const POR_PAGINA = 6;

const STATUS: Record<string, { rotulo: string; cor: string; bg: string }> = {
  AGENDADO: { rotulo: 'Agendado', cor: CORES.info, bg: CORES.infoBg },
  CONCLUIDO: { rotulo: 'Concluído', cor: CORES.success, bg: CORES.successBg },
  CANCELADO: { rotulo: 'Cancelado', cor: CORES.alerta, bg: CORES.alertaBg },
};

// ---- Datas: tudo em horário LOCAL (toISOString() usa UTC e viraria o dia à noite no Brasil) ----
function paraIso(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function deIso(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}

function somarDias(iso: string, dias: number): string {
  const d = deIso(iso);
  d.setDate(d.getDate() + dias);
  return paraIso(d);
}

function dataPorExtenso(iso: string): string {
  return deIso(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function ordenarPorHorario(lista: AtendimentoDia[]): AtendimentoDia[] {
  // "HH:mm" ordena corretamente como texto; sem horário vai para o fim.
  return [...lista].sort((a, b) => {
    const ha = a.hrEvento || '99:99';
    const hb = b.hrEvento || '99:99';
    return ha === hb ? a.idEvento - b.idEvento : ha < hb ? -1 : 1;
  });
}

interface Props {
  /** Mude este valor para recarregar a lista (ex.: pull-to-refresh do painel). */
  refreshKey?: number;
}

export function AtendimentosDoDia({ refreshKey = 0 }: Props) {
  const isDesktop = useIsDesktop();
  const hoje = paraIso(new Date());
  const [data, setData] = useState(hoje);
  const [itens, setItens] = useState<AtendimentoDia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [expandido, setExpandido] = useState(false);
  // Descarta respostas antigas quando o admin troca de dia rapidamente.
  const requisicao = useRef(0);

  const carregar = useCallback(async () => {
    const id = ++requisicao.current;
    setCarregando(true);
    setErro(null);
    try {
      const dados = await adminService.listarAtendimentosDoDia(data);
      if (id !== requisicao.current) return;
      setItens(ordenarPorHorario(dados));
    } catch (e) {
      if (id !== requisicao.current) return;
      setItens([]);
      setErro(mensagemDeErro(e, 'Não foi possível carregar os atendimentos.'));
    } finally {
      if (id === requisicao.current) setCarregando(false);
    }
  }, [data]);

  useEffect(() => {
    carregar();
  }, [carregar, refreshKey]);

  useEffect(() => {
    setExpandido(false);
  }, [data]);

  const ehHoje = data === hoje;
  const visiveis = expandido ? itens : itens.slice(0, POR_PAGINA);
  const restantes = itens.length - visiveis.length;

  return (
    <View style={s.card}>
      <View style={[s.header, !isDesktop && s.headerMobile]}>
        <View style={s.headerTexto}>
          <View style={s.orb}>
            <AppIcon name="calendar-outline" size={26} color={CORES.mintDeep} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.titulo}>Atendimentos do dia</Text>
            <Text style={s.subtitulo}>
              {ehHoje ? 'Confira os agendamentos de hoje' : `Agendamentos de ${dataPorExtenso(data)}`}
            </Text>
          </View>
        </View>

        <View style={s.seletor}>
          <Pressable
            onPress={() => setData(somarDias(data, -1))}
            accessibilityLabel="Dia anterior"
            hitSlop={8}
            style={({ pressed }) => [s.seta, pressed && s.pressed]}
          >
            <AppIcon name="chevron-back" size={18} color={CORES.texto} />
          </Pressable>
          <Text style={s.dataTexto}>{dataPorExtenso(data)}</Text>
          <Pressable
            onPress={() => setData(somarDias(data, 1))}
            accessibilityLabel="Próximo dia"
            hitSlop={8}
            style={({ pressed }) => [s.seta, pressed && s.pressed]}
          >
            <AppIcon name="chevron-forward" size={18} color={CORES.texto} />
          </Pressable>
          {!ehHoje && (
            <Pressable onPress={() => setData(hoje)} style={({ pressed }) => [s.btnHoje, pressed && s.pressed]}>
              <Text style={s.btnHojeTexto}>Hoje</Text>
            </Pressable>
          )}
        </View>
      </View>

      {erro && (
        <View style={s.bloco}>
          <Banner tone="error">{erro}</Banner>
          <Pressable onPress={carregar} style={({ pressed }) => [s.btnTentar, pressed && s.pressed]}>
            <Text style={s.btnTentarTexto}>Tentar novamente</Text>
          </Pressable>
        </View>
      )}

      {carregando && itens.length === 0 && !erro ? (
        <View style={s.carregando}>
          <ActivityIndicator color={CORES.secundaria} />
          <Text style={s.carregandoTexto}>Carregando atendimentos…</Text>
        </View>
      ) : !erro && itens.length === 0 ? (
        <View style={s.bloco}>
          <EmptyState
            icon="calendar-clear-outline"
            title="Nenhum atendimento neste dia"
            subtitle={ehHoje ? 'Não há agendamentos para hoje.' : 'Não há agendamentos para a data selecionada.'}
          />
        </View>
      ) : itens.length > 0 ? (
        <View style={carregando ? s.recarregando : undefined}>
          {isDesktop && (
            <View style={s.thead}>
              <Text style={[s.th, s.colHora]}>Horário</Text>
              <Text style={[s.th, s.colPet]}>Pet</Text>
              <Text style={[s.th, s.colTutor]}>Tutor</Text>
              <Text style={[s.th, s.colServico]}>Serviço</Text>
              <Text style={[s.th, s.colStatus]}>Status</Text>
            </View>
          )}

          {visiveis.map((a) => (isDesktop ? <LinhaDesktop key={a.idEvento} a={a} /> : <LinhaMobile key={a.idEvento} a={a} />))}

          {(restantes > 0 || (expandido && itens.length > POR_PAGINA)) && (
            <View style={s.verMaisBox}>
              <Pressable onPress={() => setExpandido((v) => !v)} style={({ pressed }) => [s.verMais, pressed && s.pressed]}>
                <Text style={s.verMaisTexto}>{expandido ? 'Ver menos' : `Ver mais (${restantes})`}</Text>
                <AppIcon name={expandido ? 'chevron-up' : 'chevron-down'} size={16} color={CORES.mintDeep} />
              </Pressable>
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

function Avatar({ nome }: { nome: string }) {
  // A API não libera a foto do pet para ADMIN, então usamos um avatar neutro.
  return (
    <View style={s.avatar} accessibilityLabel={`Pet ${nome}`}>
      <AppIcon name="paw" size={20} color={CORES.mintDeep} />
    </View>
  );
}

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS[status] ?? { rotulo: status, cor: CORES.textoSecundario, bg: CORES.fundoSutil };
  return (
    <View style={[s.pill, { backgroundColor: cfg.bg }]}>
      <View style={[s.pillDot, { backgroundColor: cfg.cor }]} />
      <Text style={[s.pillTexto, { color: cfg.cor }]}>{cfg.rotulo}</Text>
    </View>
  );
}

function LinhaDesktop({ a }: { a: AtendimentoDia }) {
  const cancelado = a.status === 'CANCELADO';
  return (
    <View style={s.tr}>
      <Text style={[s.td, s.colHora, cancelado && s.riscado]}>{a.hrEvento || '—'}</Text>
      <View style={[s.colPet, s.petCelula]}>
        <Avatar nome={a.nmPet} />
        <View style={{ flexShrink: 1 }}>
          <Text style={s.petNome} numberOfLines={1}>{a.nmPet}</Text>
          {!!a.raca && <Text style={s.petRaca} numberOfLines={1}>{a.raca}</Text>}
        </View>
      </View>
      <Text style={[s.td, s.colTutor]} numberOfLines={1}>{a.nmTutor || '—'}</Text>
      <Text style={[s.td, s.colServico]} numberOfLines={1}>{a.nmTipoEvento}</Text>
      <View style={s.colStatus}>
        <StatusPill status={a.status} />
      </View>
    </View>
  );
}

function LinhaMobile({ a }: { a: AtendimentoDia }) {
  return (
    <View style={s.itemMobile}>
      <Text style={s.horaMobile}>{a.hrEvento || '—'}</Text>
      <Avatar nome={a.nmPet} />
      <View style={{ flex: 1 }}>
        <Text style={s.petNome} numberOfLines={1}>
          {a.nmPet}
          {a.raca ? <Text style={s.petRaca}>{`  ${a.raca}`}</Text> : null}
        </Text>
        <Text style={s.mobileLinha} numberOfLines={1}>{a.nmTutor || '—'} · {a.nmTipoEvento}</Text>
        <View style={{ marginTop: 6 }}>
          <StatusPill status={a.status} />
        </View>
      </View>
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
    marginBottom: 28,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 },
  headerMobile: { flexDirection: 'column', alignItems: 'flex-start' },
  headerTexto: { flexDirection: 'row', alignItems: 'center', gap: 14, flexShrink: 1 },
  orb: { width: 52, height: 52, borderRadius: 26, backgroundColor: CORES.mintPale, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontSize: 20, fontWeight: '800', color: CORES.texto, letterSpacing: -0.3 },
  subtitulo: { fontSize: 13, color: CORES.textoSecundario, marginTop: 2 },

  seletor: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  seta: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: CORES.fundoSutil },
  dataTexto: { fontSize: 13.5, fontWeight: '600', color: CORES.texto, paddingHorizontal: 6, minWidth: 130, textAlign: 'center' },
  btnHoje: { marginLeft: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: CORES.mintDeep },
  btnHojeTexto: { fontSize: 12.5, fontWeight: '700', color: CORES.mintDeep },
  pressed: { opacity: 0.7 },

  bloco: { marginTop: 4 },
  btnTentar: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: CORES.mintDeep },
  btnTentarTexto: { fontSize: 12.5, fontWeight: '700', color: CORES.mintDeep },
  carregando: { alignItems: 'center', paddingVertical: 36, gap: 10 },
  carregandoTexto: { fontSize: 12.5, color: CORES.textoSecundario },
  recarregando: { opacity: 0.5 },

  thead: { flexDirection: 'row', alignItems: 'center', backgroundColor: CORES.fundo, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },
  th: { fontSize: 13, fontWeight: '700', color: CORES.textoSecundario },
  tr: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: CORES.borda },
  td: { fontSize: 13.5, color: CORES.textoSecundario },
  riscado: { textDecorationLine: 'line-through' },
  colHora: { width: 90 },
  colPet: { flex: 2.2, paddingRight: 12 },
  colTutor: { flex: 2, paddingRight: 12 },
  colServico: { flex: 2, paddingRight: 12 },
  colStatus: { flex: 1.4 },

  petCelula: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: CORES.mintPale, alignItems: 'center', justifyContent: 'center' },
  petNome: { fontSize: 14, fontWeight: '700', color: CORES.texto },
  petRaca: { fontSize: 12, fontWeight: '400', color: CORES.textoSecundario, marginTop: 1 },

  pill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillTexto: { fontSize: 12, fontWeight: '600' },

  itemMobile: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: CORES.borda },
  horaMobile: { width: 44, fontSize: 13.5, fontWeight: '700', color: CORES.texto },
  mobileLinha: { fontSize: 12.5, color: CORES.textoSecundario, marginTop: 2 },

  verMaisBox: { alignItems: 'center', paddingTop: 18, paddingBottom: 4 },
  verMais: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 28, paddingVertical: 10, borderRadius: 24, borderWidth: 1.5, borderColor: CORES.secundaria },
  verMaisTexto: { fontSize: 14, fontWeight: '700', color: CORES.mintDeep },
});