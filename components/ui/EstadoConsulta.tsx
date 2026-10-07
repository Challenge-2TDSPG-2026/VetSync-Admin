import React from 'react';
import { LoadingBlock } from '../Screen';
import { Banner } from './Card';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import type { AppIcon } from '../AppIcon';

interface EstadoConsultaProps {
  carregando: boolean;
  erro: string | null;
  /** true quando a consulta terminou com sucesso e não trouxe nenhum item. */
  vazio: boolean;
  onTentarNovamente: () => void;
  vazioIcone: React.ComponentProps<typeof AppIcon>['name'];
  vazioTitulo: string;
  vazioSubtitulo?: string;
  carregandoRotulo?: string;
}

/**
 * Os três estados de uma lista consultada na API: carregando, erro (com "Tentar novamente") e vazia.
 * Não renderiza nada quando há itens para mostrar.
 */
export function EstadoConsulta({
  carregando,
  erro,
  vazio,
  onTentarNovamente,
  vazioIcone,
  vazioTitulo,
  vazioSubtitulo,
  carregandoRotulo,
}: EstadoConsultaProps) {
  if (carregando) return <LoadingBlock label={carregandoRotulo} />;
  if (erro) {
    return (
      <>
        <Banner tone="error">{erro}</Banner>
        <Button label="Tentar novamente" variant="ghost" size="sm" onPress={onTentarNovamente} />
      </>
    );
  }
  if (vazio) return <EmptyState icon={vazioIcone} title={vazioTitulo} subtitle={vazioSubtitulo} />;
  return null;
}