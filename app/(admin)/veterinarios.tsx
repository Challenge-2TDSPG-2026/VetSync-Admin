import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { adminService } from '../../services/adminService';
import type { NovoUsuarioResposta, Veterinario } from '../../types';
import { mensagemDeErro } from '../../utils/erro';
import { mostrarToast } from '../../components/ui/Toast';
import { Screen, LoadingBlock } from '../../components/Screen';
import { Card, CardTitle, CardDesc, Field, Banner } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ClinicaSelect } from '../../components/ui/ClinicaSelect';
import { EmptyState } from '../../components/ui/EmptyState';
import { RecordActions, RecordHeader, RecordLine, RecordRow } from '../../components/ui/RecordRow';

export default function VeterinariosScreen() {
  const [lista, setLista] = useState<Veterinario[] | null>(null);
  const [erroLista, setErroLista] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [idClinica, setIdClinica] = useState<number | null>(null);
  const [especialidade, setEspecialidade] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [criado, setCriado] = useState<NovoUsuarioResposta | null>(null);
  const [editando, setEditando] = useState<Veterinario | null>(null);

  const carregar = useCallback(async () => {
    setErroLista(null);
    try {
      const dados = await adminService.listarVeterinarios();
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
    setEspecialidade('');
  }

  function iniciarEdicao(v: Veterinario) {
    setCriado(null);
    setEditando(v);
    setNome(v.nmVeterinario);
    setIdClinica(v.idClinica ?? null);
    setEspecialidade(v.dsEspecialidade ?? '');
    mostrarToast('info', `Editando ${v.nmVeterinario}`, 'Altere os dados no formulário no topo da página.');
  }

  async function handleSubmit() {
    const nomeNormalizado = nome.trim();
    const emailNormalizado = email.trim().toLowerCase();

    if (!nomeNormalizado) {
      mostrarToast('erro', 'Informe o nome completo do veterinário.');
      return;
    }
    if (!editando && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
      mostrarToast('erro', 'Informe um e-mail válido para enviar o acesso.');
      return;
    }
    if (!idClinica) {
      mostrarToast('erro', 'Selecione uma clínica com contrato ativo.');
      return;
    }

    setSalvando(true);
    setCriado(null);
    try {
      if (editando) {
        await adminService.atualizarVeterinario(editando.idVeterinario, nomeNormalizado, idClinica, especialidade);
        mostrarToast('sucesso', 'Veterinário atualizado', nomeNormalizado);
        limparFormulario();
        await carregar();
        return;
      }
      const res = await adminService.criarVeterinario(nomeNormalizado, emailNormalizado, idClinica, especialidade);
      mostrarToast('sucesso', `Veterinário ${res.nome} cadastrado`, `CRM ${res.crm}`);
      setCriado(res);
      limparFormulario();
      await carregar();
    } catch (e) {
      mostrarToast('erro', mensagemDeErro(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Screen
      eyebrow="Equipe clínica"
      title="Veterinários"
      desc="O CRM interno e a senha temporária são gerados pela API e enviados por e-mail."
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <Card>
        <CardTitle>{editando ? `Editar veterinário #${editando.idVeterinario}` : 'Cadastrar veterinário'}</CardTitle>
        <CardDesc>{editando ? 'Altere o nome, a clínica ou a especialidade.' : 'Escolha a clínica pelo nome.'}</CardDesc>

        {editando && <Banner tone="info">{editando.dsEmail} · o e-mail e o CRM não podem ser alterados.</Banner>}

        {criado && (
          <Banner tone="info">
            Senha temporária de {criado.email}: {criado.senhaTemporaria}
          </Banner>
        )}

        <Field label="Nome" value={nome} onChangeText={setNome} placeholder="Nome completo" />
        {!editando && (
          <Field label="E-mail" value={email} onChangeText={setEmail} placeholder="email@clinica.com" autoCapitalize="none" keyboardType="email-address" />
        )}
        <ClinicaSelect value={idClinica} onChange={setIdClinica} somenteAtivas={!editando} />
        <Field label="Especialidade (opcional)" value={especialidade} onChangeText={setEspecialidade} placeholder="Ex.: Dermatologia" />

        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Button
            label={salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Cadastrar veterinário'}
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
        {lista && lista.length === 0 && <EmptyState icon="medical-outline" title="Nenhum veterinário cadastrado ainda" />}
        {lista?.map((v) => (
          <RecordRow key={v.idVeterinario}>
            <RecordHeader id={v.idVeterinario} title={v.nmVeterinario} />
            <RecordLine label="CRM" value={v.nrCrmv} />
            <RecordLine label="E-mail" value={v.dsEmail} />
            <RecordLine label="Especialidade" value={v.dsEspecialidade || '—'} />
            <RecordLine label="Clínica" value={v.nmClinica || `#${v.idClinica}`} />
            <RecordActions>
              <Button label="Editar" variant="ghost" size="sm" onPress={() => iniciarEdicao(v)} />
            </RecordActions>
          </RecordRow>
        ))}
      </View>
    </Screen>
  );
}