import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ResumoPainel } from '../../types';
import { CORES } from '../../constants/theme';
import { Card } from '../ui/Card';
import { ClinicaSelect } from '../ui/ClinicaSelect';
import { EstadoConsulta } from '../ui/EstadoConsulta';

interface IndicadoresPainelProps {
  resumo: ResumoPainel | null;
  carregando: boolean;
  erro: string | null;
  onTentarNovamente: () => void;
  /** Clínica do filtro (null = todas). */
  idClinica: number | null;
  onChangeClinica: (idClinica: number | null) => void;
}

/**
 * Indicadores de pontos e recompensas do painel inicial. Mostra sempre a que escopo os números se referem:
 * o nome da clínica filtrada ou "Totais de todas as clínicas". Pontos disponíveis = saldo resgatável
 * (a API já exclui pendentes, bloqueados, vencidos e reservados).
 */
export function IndicadoresPainel({ resumo, carregando, erro, onTentarNovamente, idClinica, onChangeClinica }: IndicadoresPainelProps) {
  const itens = resumo
    ? [
        { rotulo: 'Pontos pendentes', valor: resumo.pontos.pontosPendentes, detalhe: `${resumo.pontos.lancamentosPendentes} lançamento(s) aguardando liberação`, aviso: resumo.pontos.lancamentosPendentes > 0 },
        { rotulo: 'Pontos disponíveis', valor: resumo.pontos.pontosDisponiveis, detalhe: 'Saldo resgatável pelos tutores' },
        { rotulo: 'Pontos bloqueados', valor: resumo.pontos.pontosBloqueados, detalhe: 'Não entram no saldo' },
        { rotulo: 'Pontos vencidos', valor: resumo.pontos.pontosExpirados, detalhe: 'Validade expirada' },
        { rotulo: 'Recompensas ativas', valor: resumo.recompensas.recompensasAtivas, detalhe: `${resumo.recompensas.recompensasInativas} inativa(s)` },
        { rotulo: 'Resgates pendentes', valor: resumo.recompensas.resgatesPendentes, detalhe: 'Aguardando validação da clínica', aviso: resumo.recompensas.resgatesPendentes > 0 },
      ]
    : [];

  return (
    <Card>
      <ClinicaSelect
        label="Indicadores de"
        value={idClinica}
        onChange={onChangeClinica}
        rotuloTodas="Todas as clínicas"
        onLimpar={() => onChangeClinica(null)}
      />

      {resumo ? (
        <>
          <View style={[s.escopo, resumo.totaisGlobais ? s.escopoGlobal : s.escopoClinica]}>
            <Text style={[s.escopoTexto, { color: resumo.totaisGlobais ? CORES.aviso : CORES.mintDeep }]}>
              {resumo.totaisGlobais ? `${resumo.rotuloEscopo} — não é de uma clínica só` : resumo.rotuloEscopo}
            </Text>
          </View>
          <View style={s.grade}>
            {itens.map((i) => (
              <View key={i.rotulo} style={[s.item, i.aviso && s.itemAviso]}>
                <Text style={[s.valor, i.aviso && { color: CORES.aviso }]}>{i.valor}</Text>
                <Text style={s.rotulo}>{i.rotulo}</Text>
                <Text style={s.detalhe}>{i.detalhe}</Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <EstadoConsulta
          carregando={carregando}
          erro={erro}
          vazio={false}
          onTentarNovamente={onTentarNovamente}
          vazioIcone="sparkles-outline"
          vazioTitulo="Sem indicadores"
          carregandoRotulo="Carregando indicadores…"
        />
      )}
    </Card>
  );
}

const s = StyleSheet.create({
  escopo: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 12 },
  escopoGlobal: { backgroundColor: CORES.avisoBg },
  escopoClinica: { backgroundColor: CORES.mintPale },
  escopoTexto: { fontSize: 11.5, fontWeight: '800' },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  item: {
    flexGrow: 1,
    flexBasis: 150,
    backgroundColor: CORES.fundo,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderLeftWidth: 4,
    borderLeftColor: CORES.secundaria,
    padding: 12,
  },
  itemAviso: { borderLeftColor: CORES.aviso },
  valor: { fontSize: 24, fontWeight: '800', color: CORES.texto },
  rotulo: { fontSize: 12, fontWeight: '700', color: CORES.texto, marginTop: 2 },
  detalhe: { fontSize: 11, color: CORES.textoSecundario, marginTop: 2 },
});