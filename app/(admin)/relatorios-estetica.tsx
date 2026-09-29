import React, { useCallback, useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import type { RelatorioEstetica } from '../../types';
import { ehConflito, mensagemDeErro } from '../../utils/erro';
import { confirmar } from '../../utils/confirmar';
import { mostrarToast } from '../../components/ui/Toast';
import { Screen, LoadingBlock } from '../../components/Screen';
import { Banner } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { RecordActions, RecordBlock, RecordHeader, RecordLine, RecordRow } from '../../components/ui/RecordRow';

export default function RelatoriosEsteticaScreen() {
  const [lista, setLista] = useState<RelatorioEstetica[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [processando, setProcessando] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setLista(await adminService.listarRelatoriosPendentes());
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

  async function decidir(id: number, aprovado: boolean) {
    if (!aprovado) {
      const ok = await confirmar('Negar este relatório? A decisão é definitiva e não poderá ser desfeita.', 'Negar');
      if (!ok) return;
    }
    setProcessando(id);
    try {
      await adminService.liberarRelatorio(id, aprovado);
      mostrarToast(
        'sucesso',
        aprovado ? 'Relatório liberado' : 'Relatório negado',
        aprovado ? 'O tutor receberá o link de agendamento por e-mail.' : undefined
      );
      setLista((prev) => prev?.filter((r) => r.idRelatorio !== id) ?? null);
    } catch (e) {
      mostrarToast('erro', mensagemDeErro(e));
      // 409: já foi decidido por outro admin — sincroniza a fila.
      if (ehConflito(e)) carregar();
    } finally {
      setProcessando(null);
    }
  }

  return (
    <Screen
      eyebrow="Fila de aprovação"
      title="Relatórios de estética"
      desc="Relatórios enviados pela equipe de estética. Ao liberar, o tutor recebe por e-mail o link para agendar."
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {erro && <Banner tone="error">{erro}</Banner>}
      {lista === null && !erro && <LoadingBlock />}
      {lista && lista.length === 0 && (
        <EmptyState icon="checkmark-done-outline" title="Nenhum relatório pendente" subtitle="Relatórios da equipe de estética aparecem aqui." />
      )}
      {lista?.map((r) => (
        <RecordRow key={r.idRelatorio}>
          <RecordHeader id={r.idRelatorio} title={r.nmPet} />
          <RecordLine label="Tutor" value={r.nmTutor} />
          <RecordLine label="Profissional" value={r.nmProfissionalEstetica} />
          {r.idEvento ? <RecordLine label="Evento" value={`#${r.idEvento}`} /> : null}
          <RecordBlock label="Problema relatado" value={r.dsProblema} />
          <RecordActions>
            <Button label="Liberar" variant="approve" size="sm" onPress={() => decidir(r.idRelatorio, true)} loading={processando === r.idRelatorio} disabled={processando !== null} />
            <Button label="Negar" variant="deny" size="sm" onPress={() => decidir(r.idRelatorio, false)} disabled={processando !== null} />
          </RecordActions>
        </RecordRow>
      ))}
    </Screen>
  );
}