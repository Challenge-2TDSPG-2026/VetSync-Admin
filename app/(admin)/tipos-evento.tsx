import React, { useCallback, useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import type { TipoEvento } from '../../types';
import { mensagemDeErro } from '../../utils/erro';
import { Screen, LoadingBlock } from '../../components/Screen';
import { Banner } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { RecordHeader, RecordLine, RecordRow } from '../../components/ui/RecordRow';

export default function TiposEventoScreen() {
  const [lista, setLista] = useState<TipoEvento[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setLista(await adminService.listarTiposEvento());
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

  return (
    <Screen
      eyebrow="Catálogo · somente leitura"
      title="Tipos de evento"
      desc="Vacinas, consultas, banhos e outros eventos que o tutor pode agendar, com os pontos que cada um gera. A API não expõe endpoint de escrita para este catálogo."
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {erro && <Banner tone="error">{erro}</Banner>}
      {lista === null && !erro && <LoadingBlock />}
      {lista && lista.length === 0 && <EmptyState icon="list-outline" title="Nenhum tipo de evento cadastrado" />}
      {lista?.map((t) => (
        <RecordRow key={t.idTipoEvento}>
          <RecordHeader id={t.idTipoEvento} title={t.nmTipoEvento} />
          <RecordLine label="Categoria" value={t.dsCategoria} />
          <RecordLine label="Pontos" value={`${t.nrPontos} pts`} />
        </RecordRow>
      ))}
    </Screen>
  );
}
