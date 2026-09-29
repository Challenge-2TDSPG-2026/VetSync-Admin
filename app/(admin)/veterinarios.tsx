import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { adminService } from '../../services/adminService';
import type { NovoUsuarioResposta, Veterinario } from '../../types';
import { mensagemDeErro } from '../../utils/erro';
import { mostrarToast } from '../../components/ui/Toast';
import { Screen, LoadingBlock } from '../../components/Screen';
import { Card, CardTitle, CardDesc, Field, Banner } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { RecordHeader, RecordLine, RecordRow } from '../../components/ui/RecordRow';

export default function VeterinariosScreen() {
  const [lista, setLista] = useState<Veterinario[] | null>(null);
  const [erroLista, setErroLista] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [idClinica, setIdClinica] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [criado, setCriado] = useState<NovoUsuarioResposta | null>(null);

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

  async function handleSubmit() {
    setSalvando(true);
    setCriado(null);
    try {
      const res = await adminService.criarVeterinario(nome, email, Number(idClinica));
      mostrarToast('sucesso', `Veterinário ${res.nome} cadastrado`, `CRM ${res.crm}`);
      setCriado(res);
      setNome('');
      setEmail('');
      setIdClinica('');
      carregar();
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
        <CardTitle>Cadastrar veterinário</CardTitle>
        <CardDesc>Informe o ID da clínica — a API não expõe uma listagem de clínicas.</CardDesc>

        {criado && (
          <Banner tone="info">
            Senha temporária de {criado.email}: {criado.senhaTemporaria}
          </Banner>
        )}

        <Field label="Nome" value={nome} onChangeText={setNome} placeholder="Nome completo" />
        <Field label="E-mail" value={email} onChangeText={setEmail} placeholder="email@clinica.com" autoCapitalize="none" keyboardType="email-address" />
        <Field label="ID da clínica" value={idClinica} onChangeText={setIdClinica} placeholder="1" keyboardType="numeric" />

        <Button
          label={salvando ? 'Cadastrando…' : 'Cadastrar veterinário'}
          onPress={handleSubmit}
          loading={salvando}
          disabled={!nome || !email || !idClinica}
        />
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
            <RecordLine label="Clínica" value={v.nmClinica || `#${v.idClinica}`} />
          </RecordRow>
        ))}
      </View>
    </Screen>
  );
}
