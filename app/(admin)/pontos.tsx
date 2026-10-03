import React, { useCallback, useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import type { LancamentoPontos } from '../../types';
import { ehConflito, mensagemDeErro } from '../../utils/erro';
import { mostrarToast } from '../../components/ui/Toast';
import { Screen, LoadingBlock } from '../../components/Screen';
import { Banner } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusTag } from '../../components/ui/StatusTag';
import { EmptyState } from '../../components/ui/EmptyState';
import { RecordActions, RecordHeader, RecordLine, RecordRow } from '../../components/ui/RecordRow';

export default function PontosScreen() {
  const [lista, setLista] = useState<LancamentoPontos[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [processando, setProcessando] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setLista(await adminService.listarPontosPendentes());
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function onRefresh() {
    setRefreshing(true);
    await carregar();
    setRefreshing(false);
  }

  async function liberar(id: number, idClinica?: number | null) {
    setProcessando(id);
    try {
      await adminService.liberarPontos(id, idClinica);
      mostrarToast('sucesso', 'Pontos liberados', 'Adicionados ao saldo do tutor nesta clínica.');
      setLista((prev) => prev?.filter((l) => l.idLancamento !== id) ?? null);
    } catch (e) {
      mostrarToast('erro', mensagemDeErro(e));
      if (ehConflito(e)) carregar();
    } finally {
      setProcessando(null);
    }
  }

  return (
    <Screen
      eyebrow="Fila de aprovação"
      title="Pontos"
      desc="Lançamentos de eventos concluídos ou bônus de plano de tratamento. Os pontos valem só na clínica em que foram gerados."
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {erro && <Banner tone="error">{erro}</Banner>}
      {lista === null && !erro && <LoadingBlock />}
      {lista && lista.length === 0 && (
        <EmptyState icon="checkmark-done-outline" title="Nenhum lançamento pendente" />
      )}
      {lista?.map((l) => (
        <RecordRow key={l.idLancamento}>
          <RecordHeader
            id={l.idLancamento}
            title={l.origem === 'EVENTO' ? l.nmTipoEvento || 'Evento' : 'Bônus de plano'}
          />
          {l.nmClinica || l.idClinica ? <StatusTag tom="neutro" label={l.nmClinica || `Clínica #${l.idClinica}`} /> : null}
          <RecordLine label="Origem" value={l.origem === 'EVENTO' ? `Evento #${l.idEvento}` : `Plano #${l.idPlano}`} />
          <RecordLine label="Pet" value={l.nmPet} />
          <RecordLine label="Tutor" value={l.nmTutor} />
          <RecordLine label="Pontos" value={String(l.nrPontos)} />
          <RecordLine label="Data" value={l.dtLancamento} />
          <RecordActions>
            <Button label="Liberar" variant="approve" size="sm" onPress={() => liberar(l.idLancamento, l.idClinica)} loading={processando === l.idLancamento} disabled={processando !== null} />
          </RecordActions>
        </RecordRow>
      ))}
    </Screen>
  );
}