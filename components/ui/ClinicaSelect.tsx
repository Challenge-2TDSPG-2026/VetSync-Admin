import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppIcon } from '../AppIcon';
import { CORES } from '../../constants/theme';
import { useClinicas } from '../../hooks/useclinicas';
import { transicao } from '../../utils/animacao';

interface ClinicaSelectProps {
  /** ID da clínica escolhida (null = nenhuma). */
  value: number | null;
  onChange: (idClinica: number) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Mostra só clínicas com contrato ativo. Por padrão mostra todas, sinalizando as inativas. */
  somenteAtivas?: boolean;
  /**
   * Modo filtro: com `rotuloTodas` aparece a opção "todas as clínicas" (value null), que chama `onLimpar`.
   * Sem essas props o componente se comporta como antes (seleção obrigatória de uma clínica).
   */
  rotuloTodas?: string;
  onLimpar?: () => void;
}

/** Acima desse total aparece o campo de busca dentro da lista. */
const LIMITE_BUSCA = 6;

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/**
 * Seleção de clínica pelo nome (as clínicas vêm da API). Evita digitar o ID à mão.
 *   <ClinicaSelect value={idClinica} onChange={setIdClinica} />
 */
export function ClinicaSelect({
  value,
  onChange,
  label = 'Clínica',
  placeholder = 'Selecione a clínica',
  disabled,
  somenteAtivas,
  rotuloTodas,
  onLimpar,
}: ClinicaSelectProps) {
  const { clinicas, carregando, erro, recarregar } = useClinicas();
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');

  const opcoes = useMemo(() => {
    const base = (clinicas ?? []).filter((c) => !somenteAtivas || c.contratoAtivo);
    const q = normalizar(busca);
    return q ? base.filter((c) => normalizar(c.nomeClinica).includes(q)) : base;
  }, [clinicas, somenteAtivas, busca]);

  const total = (clinicas ?? []).filter((c) => !somenteAtivas || c.contratoAtivo).length;
  const escolhida = clinicas?.find((c) => c.idClinica === value) ?? null;

  const modoFiltro = !!rotuloTodas && !!onLimpar;

  function escolher(id: number) {
    onChange(id);
    setAberto(false);
    setBusca('');
  }

  function escolherTodas() {
    onLimpar?.();
    setAberto(false);
    setBusca('');
  }

  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>

      <Pressable
        onPress={() => setAberto((v) => !v)}
        disabled={disabled || carregando}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${escolhida?.nomeClinica ?? (modoFiltro ? rotuloTodas : placeholder)}`}
        accessibilityState={{ expanded: aberto, disabled: !!disabled }}
        style={(st: any) => [
          s.campo,
          transicao(),
          aberto && s.campoAberto,
          st.hovered && !disabled && s.campoHover,
          (disabled || carregando) && s.campoDesabilitado,
        ]}
      >
        <Text style={[s.campoTexto, !escolhida && !modoFiltro && s.placeholder]} numberOfLines={1}>
          {carregando ? 'Carregando clínicas…' : escolhida?.nomeClinica ?? (modoFiltro ? rotuloTodas : placeholder)}
        </Text>
        <AppIcon name={aberto ? 'chevron-up' : 'chevron-down'} size={18} color={CORES.textoSecundario} />
      </Pressable>

      {erro ? (
        <View style={s.erroBox}>
          <Text style={s.erroTexto}>{erro}</Text>
          <Pressable onPress={recarregar} hitSlop={8}>
            <Text style={s.erroAcao}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : null}

      {aberto && !carregando ? (
        <View style={s.lista}>
          {total > LIMITE_BUSCA ? (
            <View style={s.busca}>
              <AppIcon name="search-outline" size={16} color={CORES.textoSecundario} />
              <TextInput
                value={busca}
                onChangeText={setBusca}
                placeholder="Buscar clínica pelo nome"
                placeholderTextColor={CORES.textoSecundario}
                style={[s.buscaInput, { outlineStyle: 'none' } as any]}
                autoFocus
              />
            </View>
          ) : null}

          {modoFiltro && !busca ? (
            <Pressable
              onPress={escolherTodas}
              accessibilityRole="radio"
              accessibilityState={{ selected: value === null }}
              style={(st: any) => [s.opcao, transicao(), value === null && s.opcaoAtiva, st.hovered && value !== null && s.opcaoHover]}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.opcaoNome} numberOfLines={1}>{rotuloTodas}</Text>
              </View>
              {value === null ? <AppIcon name="checkmark-circle" size={20} color={CORES.secundaria} /> : null}
            </Pressable>
          ) : null}

          {opcoes.length === 0 ? (
            <Text style={s.vazio}>
              {total === 0 ? 'Nenhuma clínica disponível. Cadastre uma clínica para que ela apareça aqui.' : 'Nenhuma clínica encontrada.'}
            </Text>
          ) : (
            opcoes.map((c) => {
              const ativa = c.idClinica === value;
              return (
                <Pressable
                  key={c.idClinica}
                  onPress={() => escolher(c.idClinica)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: ativa }}
                  style={(st: any) => [s.opcao, transicao(), ativa && s.opcaoAtiva, st.hovered && !ativa && s.opcaoHover]}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.opcaoNome} numberOfLines={1}>{c.nomeClinica}</Text>
                    {!c.contratoAtivo ? <Text style={s.opcaoAviso}>Contrato inativo</Text> : null}
                  </View>
                  {ativa ? <AppIcon name="checkmark-circle" size={20} color={CORES.secundaria} /> : null}
                </Pressable>
              );
            })
          )}
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  field: { marginBottom: 13 },
  label: { fontSize: 12.5, fontWeight: '700', color: CORES.textoSecundario, marginBottom: 6 },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  campoAberto: { borderColor: CORES.secundaria },
  campoHover: { borderColor: CORES.mintDeep },
  campoDesabilitado: { opacity: 0.55, backgroundColor: CORES.fundoSutil },
  campoTexto: { flex: 1, fontSize: 15, color: CORES.texto },
  placeholder: { color: CORES.textoSecundario },
  erroBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 8 },
  erroTexto: { flex: 1, fontSize: 12.5, color: CORES.alerta },
  erroAcao: { fontSize: 12.5, fontWeight: '700', color: CORES.mintDeep },
  lista: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 6,
    maxHeight: 280,
  },
  busca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 6,
    backgroundColor: CORES.fundo,
  },
  buscaInput: { flex: 1, fontSize: 14, color: CORES.texto, paddingVertical: 0 },
  opcao: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 8 },
  opcaoAtiva: { backgroundColor: CORES.mintPale },
  opcaoHover: { backgroundColor: CORES.fundo },
  opcaoNome: { fontSize: 14, fontWeight: '600', color: CORES.texto },
  opcaoAviso: { fontSize: 11.5, color: CORES.aviso, marginTop: 2 },
  vazio: { fontSize: 13, color: CORES.textoSecundario, padding: 10 },
});