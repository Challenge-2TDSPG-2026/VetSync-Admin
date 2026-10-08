import React, { useState } from 'react';
import type { AdminCriado } from '../../types';
import { mensagemDeErro } from '../../utils/erro';
import { mostrarToast } from '../../components/ui/Toast';
import { Screen } from '../../components/Screen';
import { Card, CardTitle, CardDesc, Field } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { adminService } from '../../services/adminService';
import { RecordHeader, RecordLine, RecordRow } from '../../components/ui/RecordRow';
import { ClinicaSelect } from '../../components/ui/ClinicaSelect';

export default function AdministradoresScreen() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [criados, setCriados] = useState<AdminCriado[]>([]);
  const [idClinica, setIdClinica] = useState<number | null>(null);
  const [nomeDono, setNomeDono] = useState('');
  const [emailDono, setEmailDono] = useState('');
  const [convidandoDono, setConvidandoDono] = useState(false);
  const [donosConvidados, setDonosConvidados] = useState<Array<{ idAdmin: number; nome: string; email: string; cargo: string; idClinica: number }>>([]);
  const [nomeClinica, setNomeClinica] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [criandoClinica, setCriandoClinica] = useState(false);
  const [clinicasVersao, setClinicasVersao] = useState(0);

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

  async function convidarDono() {
    if (!idClinica) return;
    setConvidandoDono(true);
    try {
      const dono = await adminService.convidarDonoClinica(idClinica, nomeDono, emailDono);
      setDonosConvidados(prev => [{ ...dono, idClinica }, ...prev]);
      mostrarToast('sucesso', `Convite enviado para ${dono.email}`);
      setNomeDono(''); setEmailDono('');
    } catch (e) {
      mostrarToast('erro', mensagemDeErro(e));
    } finally {
      setConvidandoDono(false);
    }
  }

  async function criarClinica() {
    setCriandoClinica(true);
    try {
      const nova = await adminService.criarClinica(nomeClinica, cnpj.replace(/\D/g, ''), cidade, uf.trim().toUpperCase());
      setIdClinica(nova.idClinica);
      setClinicasVersao(v => v + 1);
      setNomeClinica(''); setCnpj(''); setCidade(''); setUf('');
      mostrarToast('sucesso', `Clínica ${nova.nomeClinica} cadastrada. Convide o Dono abaixo.`);
    } catch (e) {
      mostrarToast('erro', mensagemDeErro(e));
    } finally {
      setCriandoClinica(false);
    }
  }

  return (
    <Screen
      eyebrow="Acesso administrativo"
      title="Acessos globais e donos"
      desc="Admins globais usam este site. O Dono convidado gerencia sua clínica no site separado da equipe."
    >
      <Card>
        <CardTitle>Cadastrar clínica</CardTitle>
        <CardDesc>A clínica começa com contrato inativo. Depois do cadastro, convide seu Dono e confirme o contrato na área de vínculo.</CardDesc>
        <Field label="Nome da clínica" value={nomeClinica} onChangeText={setNomeClinica} placeholder="Nome comercial" />
        <Field label="CNPJ (14 dígitos)" value={cnpj} onChangeText={setCnpj} placeholder="Somente números" keyboardType="numeric" />
        <Field label="Cidade" value={cidade} onChangeText={setCidade} />
        <Field label="UF" value={uf} onChangeText={setUf} autoCapitalize="characters" maxLength={2} />
        <Button label={criandoClinica ? 'Cadastrando…' : 'Cadastrar clínica'} onPress={criarClinica}
          loading={criandoClinica} disabled={!nomeClinica || cnpj.replace(/\D/g, '').length !== 14 || !cidade || uf.length !== 2} />
      </Card>

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

      <Card>
        <CardTitle>Convidar Dono da clínica</CardTitle>
        <CardDesc>Selecione a clínica cadastrada. A API envia a senha temporária ao e-mail do Dono, que deverá trocá-la no primeiro acesso.</CardDesc>
        <ClinicaSelect key={clinicasVersao} value={idClinica} onChange={setIdClinica} label="Clínica" />
        <Field label="Nome do Dono" value={nomeDono} onChangeText={setNomeDono} placeholder="Nome completo" />
        <Field label="E-mail do Dono" value={emailDono} onChangeText={setEmailDono} placeholder="dono@clinica.com" autoCapitalize="none" keyboardType="email-address" />
        <Button label={convidandoDono ? 'Enviando…' : 'Enviar convite de Dono'} onPress={convidarDono}
          loading={convidandoDono} disabled={!idClinica || !nomeDono || !emailDono} />
      </Card>

      {donosConvidados.map(dono => <RecordRow key={`dono-${dono.idAdmin}`}>
        <RecordHeader id={dono.idAdmin} title={dono.nome} />
        <RecordLine label="Clínica (ID)" value={String(dono.idClinica)} />
        <RecordLine label="E-mail" value={dono.email} />
        <RecordLine label="Acesso" value="Dono da clínica · convite enviado" />
      </RecordRow>)}

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
