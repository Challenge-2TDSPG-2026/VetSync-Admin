import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { adminService } from '../../services/adminService';
import type { NovoUsuarioResposta, ProfissionalEstetica } from '../../types';
import { mensagemDeErro } from '../../utils/erro';
import { mostrarToast } from '../../components/ui/Toast';
import { Screen, LoadingBlock } from '../../components/Screen';
import { Card, CardTitle, CardDesc, Field, Banner } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ClinicaSelect } from '../../components/ui/ClinicaSelect';
import { EmptyState } from '../../components/ui/EmptyState';
import { RecordActions, RecordHeader, RecordLine, RecordRow } from '../../components/ui/RecordRow';

export default function EsteticaScreen() {
  const [lista, setLista] = useState<ProfissionalEstetica[] | null>(null);
  const [erroLista, setErroLista] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [idClinica, setIdClinica] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [criado, setCriado] = useState<NovoUsuarioResposta | null>(null);
  const [editando, setEditando] = useState<ProfissionalEstetica | null>(null);

  const carregar = useCallback(async () => {
    setErroLista(null);
    try {
      const dados = await adminService.listarProfissionaisEstetica();
      setLista(dados);
    } catch (e) {
      setErroLista(mensagemDeErro(e));
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

  function limparFormulario() {
    setEditando(null);
    setNome('');
    setEmail('');
    setIdClinica(null);
  }

  function iniciarEdicao(p: ProfissionalEstetica) {
    setCriado(null);
    setEditando(p);
    setNome(p.nmProfissionalEstetica);
    setIdClinica(p.idClinica ?? null);
    mostrarToast('info', `Editando ${p.nmProfissionalEstetica}`, 'Altere os dados no formulário no topo da página.');
  }

  async function handleSubmit() {
    setSalvando(true);
    setCriado(null);
    try {
      if (editando) {
        await adminService.atualizarProfissionalEstetica(editando.idProfissionalEstetica, nome.trim(), idClinica as number);
        mostrarToast('sucesso', 'Profissional atualizado(a)', nome.trim());
        limparFormulario();
        carregar();
        return;
      }
      const res = await adminService.criarProfissionalEstetica(nome, email, idClinica as number);
      mostrarToast('sucesso', `Profissional ${res.nome} cadastrado(a)`, `Registro ${res.registro}`);
      setCriado(res);
      limparFormulario();
      carregar();
    } catch (e) {
      mostrarToast('erro', mensagemDeErro(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Screen
      eyebrow="Equipe de estética"
      title="Profissionais de estética"
      desc="Mesmo fluxo dos veterinários: a API gera registro e senha temporária."
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <Card>
        <CardTitle>{editando ? `Editar profissional #${editando.idProfissionalEstetica}` : 'Cadastrar profissional'}</CardTitle>
        <CardDesc>{editando ? 'Altere o nome ou a clínica.' : 'Escolha a clínica à qual pertence, pelo nome.'}</CardDesc>

        {editando && <Banner tone="info">{editando.dsEmail} · o e-mail e o registro não podem ser alterados.</Banner>}

        {criado && (
          <Banner tone="info">
            Senha temporária de {criado.email}: {criado.senhaTemporaria}
          </Banner>
        )}

        <Field label="Nome" value={nome} onChangeText={setNome} placeholder="Nome completo" />
        {!editando && (
          <Field label="E-mail" value={email} onChangeText={setEmail} placeholder="email@clinica.com" autoCapitalize="none" keyboardType="email-address" />
        )}
        <ClinicaSelect value={idClinica} onChange={setIdClinica} />

        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Button
            label={salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Cadastrar profissional'}
            onPress={handleSubmit}
            loading={salvando}
            disabled={!nome.trim() || !idClinica || (!editando && !email)}
            style={{ flex: 1 }}
          />
          {editando && <Button label="Cancelar" variant="ghost" onPress={limparFormulario} />}
        </View>
      </Card>

      <View style={{ marginTop: 6 }}>
        {erroLista && <Banner tone="error">{erroLista}</Banner>}
        {lista === null && !erroLista && <LoadingBlock />}
        {lista && lista.length === 0 && <EmptyState icon="cut-outline" title="Nenhum profissional cadastrado ainda" />}
        {lista?.map((p) => (
          <RecordRow key={p.idProfissionalEstetica}>
            <RecordHeader id={p.idProfissionalEstetica} title={p.nmProfissionalEstetica} />
            <RecordLine label="Registro" value={p.nrRegistro} />
            <RecordLine label="E-mail" value={p.dsEmail} />
            <RecordLine label="Clínica" value={p.nmClinica || `#${p.idClinica}`} />
            <RecordActions>
              <Button label="Editar" variant="ghost" size="sm" onPress={() => iniciarEdicao(p)} />
            </RecordActions>
          </RecordRow>
        ))}
      </View>
    </Screen>
  );
}