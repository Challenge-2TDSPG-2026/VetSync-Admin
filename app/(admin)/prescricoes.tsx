import React, { useCallback, useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import type { Prescricao } from '../../types';
import { ehConflito, mensagemDeErro } from '../../utils/erro';
import { confirmar } from '../../utils/confirmar';
import { mostrarToast } from '../../components/ui/Toast';
import { Screen, LoadingBlock } from '../../components/Screen';
import { Banner } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { RecordActions, RecordHeader, RecordLine, RecordRow } from '../../components/ui/RecordRow';

export default function PrescricoesScreen() {
  const [lista, setLista] = useState<Prescricao[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [processando, setProcessando] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setLista(await adminService.listarPrescricoesPendentes());
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

  async function decidir(id: number, aprovado: boolean, idClinica?: number | null) {
    if (!aprovado) {
      const ok = await confirmar('Negar esta prescrição? A decisão é definitiva e não poderá ser desfeita.', 'Negar');
      if (!ok) return;
    }
    setProcessando(id);
    try {
      await adminService.liberarPrescricao(id, aprovado, idClinica);
      mostrarToast('sucesso', aprovado ? 'Prescrição liberada' : 'Prescrição negada', aprovado ? 'O tutor será avisado por e-mail.' : undefined);
      setLista((prev) => prev?.filter((p) => p.idPrescricao !== id) ?? null);
    } catch (e) {
      mostrarToast('erro', mensagemDeErro(e));
      // 409: já foi decidida — sincroniza a fila.
      if (ehConflito(e)) carregar();
    } finally {
      setProcessando(null);
    }
  }

  return (
    <Screen
      eyebrow="Fila de aprovação"
      title="Prescrições"
      desc="Solicitações de medicamento feitas por veterinários."
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {erro && <Banner tone="error">{erro}</Banner>}
      {lista === null && !erro && <LoadingBlock />}
      {lista && lista.length === 0 && (
        <EmptyState icon="checkmark-done-outline" title="Nenhuma prescrição pendente" subtitle="Solicitações de veterinários aparecem aqui." />
      )}
      {lista?.map((p) => (
        <RecordRow key={p.idPrescricao}>
          <RecordHeader id={p.idPrescricao} title={p.nmMedicamento} />
          <RecordLine label="Posologia" value={p.dsPosologia} />
          {p.qtDosesDia ? <RecordLine label="Doses" value={`${p.qtDosesDia}x ao dia`} /> : null}
          {p.nmClinica || p.idClinica ? <RecordLine label="Clínica" value={p.nmClinica || `#${p.idClinica}`} /> : null}
          <RecordLine label="Pet" value={p.nmPet} />
          <RecordLine label="Tutor" value={p.nmTutor} />
          <RecordLine label="Veterinário" value={`Dr(a). ${p.nmVeterinario}`} />
          <RecordLine label="Período" value={p.dtFim ? `${p.dtInicio} → ${p.dtFim}` : p.dtInicio} />
          <RecordActions>
            <Button label="Liberar" variant="approve" size="sm" onPress={() => decidir(p.idPrescricao, true, p.idClinica)} loading={processando === p.idPrescricao} disabled={processando !== null} />
            <Button label="Negar" variant="deny" size="sm" onPress={() => decidir(p.idPrescricao, false, p.idClinica)} disabled={processando !== null} />
          </RecordActions>
        </RecordRow>
      ))}
    </Screen>
  );
}