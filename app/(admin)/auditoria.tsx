import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { adminService } from '../../services/adminService';
import type { FiltroAuditoria, RegistroAuditoria } from '../../types';
import { useConsulta } from '../../hooks/useConsulta';
import { CORES } from '../../constants/theme';
import { Screen } from '../../components/Screen';
import { Banner, Card, CardDesc, CardTitle, Field } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ClinicaSelect } from '../../components/ui/ClinicaSelect';
import { EstadoConsulta } from '../../components/ui/EstadoConsulta';
import { StatusTag } from '../../components/ui/StatusTag';
import { RecordBlock, RecordHeader, RecordLine, RecordRow } from '../../components/ui/RecordRow';

/** Entidades conhecidas. A lista vigente vem de GET /auditoria/tipos; esta serve de rótulo e de reserva. */
const ROTULO_ENTIDADE: Record<string, string> = {
  EVENTO: 'Evento',
  ACESSO_PET: 'Acesso a pet',
  VINCULO: 'Vínculo',
  CONTRATO: 'Contrato',
  CODIGO_VINCULO: 'Código de vínculo',
  PONTOS: 'Pontos',
  CATALOGO: 'Catálogo',
  RESGATE: 'Resgate',
};

const LIMITE = 100;
const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('pt-BR');
}

export default function AuditoriaScreen() {
  // Campos do formulário; só viram consulta quando o admin toca em "Buscar".
  const [idClinica, setIdClinica] = useState<number | null>(null);
  const [entidade, setEntidade] = useState<string | null>(null);
  const [entidadeId, setEntidadeId] = useState('');
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [aplicado, setAplicado] = useState<FiltroAuditoria>({ limite: LIMITE });

  const [entidades, setEntidades] = useState<string[]>(Object.keys(ROTULO_ENTIDADE));
  useEffect(() => {
    // Falha aqui não atrapalha: a tela segue com a lista conhecida.
    adminService.listarTiposAuditoria().then((t) => t.entidades?.length && setEntidades(t.entidades)).catch(() => {});
  }, []);

  // Filtros aplicados no servidor (clínica, entidade, ID, período). A tela só navega.
  const buscar = useCallback(async () => {
    const dados = await adminService.listarAuditoria(aplicado);
    // Mais recentes primeiro.
    return [...dados].sort((a, b) => new Date(b.ocorridoEm).getTime() - new Date(a.ocorridoEm).getTime());
  }, [aplicado]);
  const { dados: registros, carregando, erro, recarregar } = useConsulta<RegistroAuditoria[]>(buscar);

  function aplicar() {
    setErroForm(null);
    if ((de && !DATA_ISO.test(de)) || (ate && !DATA_ISO.test(ate))) {
      setErroForm('Use datas no formato AAAA-MM-DD, por exemplo 2026-10-07.');
      return;
    }
    if (de && ate && de > ate) {
      setErroForm('A data inicial não pode ser depois da data final.');
      return;
    }
    setAplicado({
      idClinica,
      entidade,
      entidadeId: entidadeId ? Number(entidadeId) : null,
      de: de || null,
      ate: ate || null,
      limite: LIMITE,
    });
  }

  function limpar() {
    setIdClinica(null);
    setEntidade(null);
    setEntidadeId('');
    setDe('');
    setAte('');
    setErroForm(null);
    setAplicado({ limite: LIMITE });
  }

  const filtrando = useMemo(
    () => !!(aplicado.idClinica || aplicado.entidade || aplicado.entidadeId || aplicado.de || aplicado.ate),
    [aplicado]
  );

  return (
    <Screen
      eyebrow="Consulta"
      title="Auditoria"
      desc={`Histórico de alterações e acessos, dos mais recentes aos mais antigos (até ${LIMITE} registros).`}
    >
      <Card>
        <CardTitle>Filtrar registros</CardTitle>
        <CardDesc>Todos os filtros são opcionais. Sem nenhum, mostra os registros mais recentes de todas as clínicas.</CardDesc>

        <ClinicaSelect
          value={idClinica}
          onChange={setIdClinica}
          rotuloTodas="Todas as clínicas"
          onLimpar={() => setIdClinica(null)}
        />

        <Text style={s.rotulo}>Entidade</Text>
        <View style={s.linha}>
          <Button label="Todas" size="sm" variant={entidade === null ? 'primary' : 'ghost'} onPress={() => setEntidade(null)} />
          {entidades.map((e) => (
            <Button
              key={e}
              label={ROTULO_ENTIDADE[e] ?? e}
              size="sm"
              variant={entidade === e ? 'primary' : 'ghost'}
              onPress={() => setEntidade(e)}
            />
          ))}
        </View>

        <View style={{ height: 14 }} />
        <Field
          label="ID da entidade (opcional)"
          value={entidadeId}
          onChangeText={(v) => setEntidadeId(v.replace(/\D/g, ''))}
          placeholder="1"
          keyboardType="numeric"
        />
        <View style={s.linha}>
          <View style={{ flex: 1, minWidth: 140 }}>
            <Field label="De (AAAA-MM-DD)" value={de} onChangeText={setDe} placeholder="2026-10-01" autoCapitalize="none" />
          </View>
          <View style={{ flex: 1, minWidth: 140 }}>
            <Field label="Até (AAAA-MM-DD)" value={ate} onChangeText={setAte} placeholder="2026-10-31" autoCapitalize="none" />
          </View>
        </View>

        {erroForm ? <Banner tone="error">{erroForm}</Banner> : null}
        <View style={s.linha}>
          <Button label={carregando ? 'Buscando…' : 'Buscar'} onPress={aplicar} loading={carregando} style={{ flex: 1 }} />
          <Button label="Limpar" variant="ghost" onPress={limpar} disabled={carregando} />
        </View>
      </Card>

      <EstadoConsulta
        carregando={carregando}
        erro={erro}
        vazio={!!registros && registros.length === 0}
        onTentarNovamente={() => recarregar()}
        vazioIcone="time-outline"
        vazioTitulo="Nenhum registro encontrado"
        vazioSubtitulo={filtrando ? 'Não há auditoria para os filtros escolhidos.' : 'Ainda não há registros de auditoria.'}
      />

      {registros?.map((r) => (
        <RecordRow key={r.id}>
          <RecordHeader title={r.acao} />
          <Text style={s.data}>{formatarDataHora(r.ocorridoEm)}</Text>
          <StatusTag tom="neutro" label={`${ROTULO_ENTIDADE[r.entidade] ?? r.entidade} #${r.entidadeId}`} />
          {r.clinicaNome || r.clinicaId ? <RecordLine label="Clínica" value={r.clinicaNome || `#${r.clinicaId}`} /> : null}
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
  rotulo: { fontSize: 12.5, fontWeight: '700', color: CORES.textoSecundario, marginBottom: 6 },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 4 },
  data: { fontSize: 12, color: CORES.textoSecundario, marginBottom: 2 },
});