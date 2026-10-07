import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { adminService } from '../../services/adminService';
import type { LancamentoPontos, StatusLancamentoPontos } from '../../types';
import { ehConflito, mensagemDeErro } from '../../utils/erro';
import { useConsulta } from '../../hooks/useConsulta';
import { mostrarToast } from '../../components/ui/Toast';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ClinicaSelect } from '../../components/ui/ClinicaSelect';
import { EstadoConsulta } from '../../components/ui/EstadoConsulta';
import { StatusTag } from '../../components/ui/StatusTag';
import { RecordActions, RecordBlock, RecordHeader, RecordLine, RecordRow } from '../../components/ui/RecordRow';

type FiltroStatus = StatusLancamentoPontos | 'TODOS';

const FILTROS_STATUS: { valor: FiltroStatus; rotulo: string }[] = [
  { valor: 'PENDENTE', rotulo: 'Pendentes' },
  { valor: 'LIBERADO', rotulo: 'Liberados' },
  { valor: 'BLOQUEADO', rotulo: 'Bloqueados' },
  { valor: 'EXPIRADO', rotulo: 'Expirados' },
  { valor: 'TODOS', rotulo: 'Todos' },
];

const ROTULO_STATUS: Record<StatusLancamentoPontos, string> = {
  PENDENTE: 'Pendente',
  LIBERADO: 'Liberado',
  BLOQUEADO: 'Bloqueado',
  EXPIRADO: 'Expirado',
};

const TOM_STATUS: Record<StatusLancamentoPontos, 'pendente' | 'aprovado' | 'negado' | 'neutro'> = {
  PENDENTE: 'pendente',
  LIBERADO: 'aprovado',
  BLOQUEADO: 'negado',
  EXPIRADO: 'neutro',
};

/** "2026-10-07" -> "07/10/2026". Qualquer outro formato volta como veio. */
function formatarData(iso?: string | null): string {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso || '—';
}

export default function PontosScreen() {
  const [idClinica, setIdClinica] = useState<number | null>(null);
  const [status, setStatus] = useState<FiltroStatus>('PENDENTE');
  const [refreshing, setRefreshing] = useState(false);
  const [processando, setProcessando] = useState<number | null>(null);

  // Filtros enviados à API (?idClinica=, ?status=). A tela só navega: o servidor valida o acesso.
  const buscar = useCallback(
    () => adminService.listarPontos({ idClinica, status: status === 'TODOS' ? null : status }),
    [idClinica, status]
  );
  const { dados: lista, carregando, erro, recarregar } = useConsulta<LancamentoPontos[]>(buscar);

  async function onRefresh() {
    setRefreshing(true);
    await recarregar({ manterDados: true });
    setRefreshing(false);
  }

  async function liberar(l: LancamentoPontos) {
    if (l.idClinica == null) return;
    setProcessando(l.idLancamento);
    try {
      await adminService.liberarPontos(l.idLancamento, l.idClinica);
      mostrarToast('sucesso', 'Pontos liberados', 'Adicionados ao saldo do tutor nesta clínica.');
      await recarregar({ manterDados: true });
    } catch (e) {
      mostrarToast('erro', mensagemDeErro(e));
      // 409: já foi liberado/bloqueado por outra pessoa. 404: não pertence à clínica. Sincroniza a lista.
      if (ehConflito(e)) await recarregar({ manterDados: true });
    } finally {
      setProcessando(null);
    }
  }

  const filtrandoClinica = idClinica !== null;
  const rotuloStatus = FILTROS_STATUS.find((f) => f.valor === status)?.rotulo.toLowerCase() ?? '';
  const vazioTitulo =
    status === 'TODOS' ? 'Nenhum lançamento encontrado' : `Nenhum lançamento ${rotuloStatus.replace(/s$/, '')}`;

  return (
    <Screen
      eyebrow="Fila de aprovação"
      title="Pontos"
      desc="Lançamentos de eventos concluídos ou bônus de plano de tratamento. Os pontos valem só na clínica em que foram gerados; só os liberados e dentro da validade contam no saldo."
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <Card>
        <ClinicaSelect
          label="Clínica"
          value={idClinica}
          onChange={setIdClinica}
          rotuloTodas="Todas as clínicas"
          onLimpar={() => setIdClinica(null)}
        />
        <View style={s.chips}>
          {FILTROS_STATUS.map((f) => (
            <Button
              key={f.valor}
              label={f.rotulo}
              size="sm"
              variant={status === f.valor ? 'primary' : 'ghost'}
              onPress={() => setStatus(f.valor)}
            />
          ))}
        </View>
      </Card>

      <EstadoConsulta
        carregando={carregando}
        erro={erro}
        vazio={!!lista && lista.length === 0}
        onTentarNovamente={() => recarregar()}
        vazioIcone="checkmark-done-outline"
        vazioTitulo={vazioTitulo}
        vazioSubtitulo={filtrandoClinica ? 'Nenhum resultado para a clínica selecionada.' : 'Nenhum resultado em nenhuma clínica.'}
      />

      {lista?.map((l) => {
        const podeLiberar = l.status === 'PENDENTE' && l.idClinica != null;
        return (
          <RecordRow key={l.idLancamento}>
            <RecordHeader
              id={l.idLancamento}
              title={l.origem === 'EVENTO' ? l.nmTipoEvento || 'Evento' : 'Bônus de plano'}
              right={<StatusTag tom={TOM_STATUS[l.status] ?? 'neutro'} label={ROTULO_STATUS[l.status] ?? l.status} />}
            />
            {l.nmClinica || l.idClinica ? (
              <StatusTag tom="neutro" label={l.nmClinica || `Clínica #${l.idClinica}`} />
            ) : (
              <StatusTag tom="negado" label="Sem clínica" />
            )}
            <RecordLine label="Origem" value={l.origem === 'EVENTO' ? `Evento #${l.idEvento}` : `Plano #${l.idPlano}`} />
            <RecordLine label="Pet" value={l.nmPet || '—'} />
            <RecordLine label="Tutor" value={l.nmTutor || '—'} />
            <RecordLine label="Pontos" value={String(l.nrPontos)} />
            <RecordLine label="Lançado em" value={formatarData(l.dtLancamento)} />
            {l.dtLiberacao ? <RecordLine label="Liberado em" value={formatarData(l.dtLiberacao)} /> : null}
            {l.dtValidade ? (
              <RecordLine
                label={l.status === 'EXPIRADO' ? 'Venceu em' : 'Válido até'}
                value={formatarData(l.dtValidade)}
              />
            ) : null}
            {l.status === 'BLOQUEADO' && l.motivoBloqueio ? <RecordBlock label="Motivo do bloqueio" value={l.motivoBloqueio} /> : null}
            {l.status === 'PENDENTE' && l.idClinica == null ? (
              <RecordBlock label="Atenção" value="Lançamento sem clínica associada: não pode ser liberado." />
            ) : null}
            {podeLiberar ? (
              <RecordActions>
                <Button
                  label="Liberar"
                  variant="approve"
                  size="sm"
                  onPress={() => liberar(l)}
                  loading={processando === l.idLancamento}
                  disabled={processando !== null}
                />
              </RecordActions>
            ) : null}
          </RecordRow>
        );
      })}
    </Screen>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});