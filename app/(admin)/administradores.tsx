import React, { useState } from 'react';
import type { AdminCriado } from '../../types';
import { mensagemDeErro } from '../../utils/erro';
import { mostrarToast } from '../../components/ui/Toast';
import { Screen } from '../../components/Screen';
import { Card, CardTitle, CardDesc, Field } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { adminService } from '../../services/adminService';
import { RecordHeader, RecordLine, RecordRow } from '../../components/ui/RecordRow';

export default function AdministradoresScreen() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [criados, setCriados] = useState<AdminCriado[]>([]);

  async function handleSubmit() {
    setSalvando(true);
    try {
      const res = await adminService.criarAdmin(nome, email);
      mostrarToast('sucesso', `Admin ${res.nome} cadastrado`);
      setCriados((prev) => [res, ...prev]);
      setNome('');
      setEmail('');
    } catch (e) {
      mostrarToast('erro', mensagemDeErro(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Screen
      eyebrow="Acesso administrativo"
      title="Administradores"
      desc="A API não tem endpoint para listar admins existentes — esta tela mostra só os criados na sessão atual."
    >
      <Card>
        <CardTitle>Cadastrar administrador</CardTitle>
        <CardDesc>Senha temporária enviada por e-mail.</CardDesc>

        <Field label="Nome" value={nome} onChangeText={setNome} placeholder="Nome completo" />
        <Field label="E-mail" value={email} onChangeText={setEmail} placeholder="admin@vetsync.com" autoCapitalize="none" keyboardType="email-address" />

        <Button
          label={salvando ? 'Cadastrando…' : 'Cadastrar administrador'}
          onPress={handleSubmit}
          loading={salvando}
          disabled={!nome || !email}
        />
      </Card>

      {criados.map((a) => (
        <RecordRow key={a.idAdmin}>
          <RecordHeader id={a.idAdmin} title={a.nome} />
          <RecordLine label="E-mail" value={a.email} />
          <RecordLine label="Senha temporária" value={a.senhaTemporaria} />
        </RecordRow>
      ))}
    </Screen>
  );
}
