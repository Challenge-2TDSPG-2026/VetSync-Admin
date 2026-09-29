import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { adminService } from '../../services/adminService';
import type { EntidadeAuditoria, RegistroAuditoria } from '../../types';
import { mensagemDeErro } from '../../utils/erro';
import { CORES } from '../../constants/theme';
import { Screen, LoadingBlock } from '../../components/Screen';
import { Banner, Card, CardDesc, CardTitle, Field } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { RecordBlock, RecordHeader, RecordLine, RecordRow } from '../../components/ui/RecordRow';

const ENTIDADES: { valor: EntidadeAuditoria; rotulo: string }[] = [
  { valor: 'EVENTO', rotulo: 'Evento' },
  { valor: 'ACESSO_PET', rotulo: 'Acesso a pet' },
];

function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('pt-BR');
}

export default function AuditoriaScreen() {
  const [entidade, setEntidade] = useState<EntidadeAuditoria>('EVENTO');
  const [entidadeId, setEntidadeId] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [registros, setRegistros] = useState<RegistroAuditoria[] | null>(null);

  async function buscar() {
    setErro(null);
    setRegistros(null);
    setBuscando(true);
    try {
      const dados = await adminService.listarAuditoria(entidade, Number(entidadeId));
      // Mais recentes primeiro.
      setRegistros([...dados].sort((a, b) => new Date(b.ocorridoEm).getTime() - new Date(a.ocorridoEm).getTime()));
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setBuscando(false);
    }
  }

  return (
    <Screen
      eyebrow="Consulta"
      title="Auditoria"
      desc="Histórico de alterações e acessos. Hoje só há registros para eventos e acessos a pets."
    >
      <Card>
        <CardTitle>Filtrar registros</CardTitle>
        <CardDesc>Escolha a entidade e informe o ID do registro que deseja auditar.</CardDesc>

        <View style={s.linha}>
          {ENTIDADES.map((e) => (
            <Button
              key={e.valor}
              label={e.rotulo}
              size="sm"
              variant={entidade === e.valor ? 'primary' : 'ghost'}
              onPress={() => setEntidade(e.valor)}
              style={{ flex: 1 }}
            />
          ))}
        </View>

        <View style={{ height: 14 }} />
        <Field
          label="ID da entidade"
          value={entidadeId}
          onChangeText={(v) => setEntidadeId(v.replace(/\D/g, ''))}
          placeholder="1"
          keyboardType="numeric"
          onSubmitEditing={() => entidadeId && buscar()}
        />
        <Button label={buscando ? 'Buscando…' : 'Buscar'} onPress={buscar} loading={buscando} disabled={!entidadeId} />
      </Card>

      {erro && <Banner tone="error">{erro}</Banner>}
      {buscando && <LoadingBlock />}
      {registros && registros.length === 0 && (
        <EmptyState icon="time-outline" title="Nenhum registro encontrado" subtitle="Não há auditoria para essa entidade e ID." />
      )}
      {registros?.map((r, i) => (
        <RecordRow key={`${r.ocorridoEm}-${i}`}>
          <RecordHeader title={r.acao} />
          <Text style={s.data}>{formatarDataHora(r.ocorridoEm)}</Text>
          <RecordLine label="Ator" value={r.ator || '—'} />
          <RecordLine label="Perfil" value={r.perfil || '—'} />
          <RecordLine label="IP" value={r.ip || '—'} />
          {r.valorAnterior ? <RecordBlock label="Valor anterior" value={r.valorAnterior} /> : null}
          {r.valorNovo ? <RecordBlock label="Valor novo" value={r.valorNovo} /> : null}
        </RecordRow>
      ))}
    </Screen>
  );
}

const s = StyleSheet.create({
  linha: { flexDirection: 'row', gap: 10 },
  data: { fontSize: 12, color: CORES.textoSecundario, marginBottom: 2 },
});