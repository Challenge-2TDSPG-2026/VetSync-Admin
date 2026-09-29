import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { adminService } from '../../services/adminService';
import type { NovoUsuarioResposta, ProfissionalEstetica } from '../../types';
import { mensagemDeErro } from '../../utils/erro';
import { mostrarToast } from '../../components/ui/Toast';
import { Screen, LoadingBlock } from '../../components/Screen';
import { Card, CardTitle, CardDesc, Field, Banner } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { RecordHeader, RecordLine, RecordRow } from '../../components/ui/RecordRow';

export default function EsteticaScreen() {
  const [lista, setLista] = useState<ProfissionalEstetica[] | null>(null);
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

  async function handleSubmit() {
    setSalvando(true);
    setCriado(null);
    try {
      const res = await adminService.criarProfissionalEstetica(nome, email, Number(idClinica));
      mostrarToast('sucesso', `Profissional ${res.nome} cadastrado(a)`, `Registro ${res.registro}`);
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
      eyebrow="Equipe de estética"
      title="Profissionais de estética"
      desc="Mesmo fluxo dos veterinários: a API gera registro e senha temporária."
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <Card>
        <CardTitle>Cadastrar profissional</CardTitle>
        <CardDesc>Informe o ID da clínica à qual pertence.</CardDesc>

        {criado && (
          <Banner tone="info">
            Senha temporária de {criado.email}: {criado.senhaTemporaria}
          </Banner>
        )}

        <Field label="Nome" value={nome} onChangeText={setNome} placeholder="Nome completo" />
        <Field label="E-mail" value={email} onChangeText={setEmail} placeholder="email@clinica.com" autoCapitalize="none" keyboardType="email-address" />
        <Field label="ID da clínica" value={idClinica} onChangeText={setIdClinica} placeholder="1" keyboardType="numeric" />

        <Button
          label={salvando ? 'Cadastrando…' : 'Cadastrar profissional'}
          onPress={handleSubmit}
          loading={salvando}
          disabled={!nome || !email || !idClinica}
        />
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
          </RecordRow>
        ))}
      </View>
    </Screen>
  );
}
