import React, { useState } from 'react';
import { adminService } from '../../services/adminService';
import type { TipoVacina } from '../../types';
import { mensagemDeErro } from '../../utils/erro';
import { mostrarToast } from '../../components/ui/Toast';
import { Screen } from '../../components/Screen';
import { Card, CardDesc, CardTitle, Field } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ClinicaSelect } from '../../components/ui/ClinicaSelect';
import { RecordHeader, RecordLine, RecordRow } from '../../components/ui/RecordRow';

export default function TiposVacinaScreen() {
  const [nome, setNome] = useState('');
  const [dias, setDias] = useState('');
  const [idClinica, setIdClinica] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [criados, setCriados] = useState<TipoVacina[]>([]);

  const diasNumero = /^\d+$/.test(dias) ? Number(dias) : 0;

  async function handleSubmit() {
    if (idClinica === null) return;
    setSalvando(true);
    try {
      const res = await adminService.criarTipoVacina(nome, diasNumero, idClinica);
      mostrarToast('sucesso', `Tipo de vacina "${res.nome}" cadastrado`);
      setCriados((prev) => [res, ...prev]);
      setNome('');
      setDias('');
      setIdClinica(null);
    } catch (e) {
      mostrarToast('erro', mensagemDeErro(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Screen
      eyebrow="Catálogo · somente criação"
      title="Tipos de vacina"
      desc="A API não tem endpoint para listar tipos de vacina — esta tela mostra só os criados na sessão atual."
    >
      <Card>
        <CardTitle>Cadastrar tipo de vacina</CardTitle>
        <CardDesc>A periodicidade define de quantos em quantos dias a vacina deve ser repetida.</CardDesc>

        <ClinicaSelect value={idClinica} onChange={setIdClinica} />
        <Field label="Nome" value={nome} onChangeText={setNome} placeholder="Ex.: Antirrábica" />
        <Field
          label="Periodicidade (dias)"
          value={dias}
          onChangeText={(v) => setDias(v.replace(/\D/g, ''))}
          placeholder="365"
          keyboardType="numeric"
        />

        <Button
          label={salvando ? 'Cadastrando…' : 'Cadastrar tipo de vacina'}
          onPress={handleSubmit}
          loading={salvando}
          disabled={!nome.trim() || diasNumero <= 0 || idClinica === null}
        />
      </Card>

      {criados.map((t) => (
        <RecordRow key={t.id}>
          <RecordHeader id={t.id} title={t.nome} />
          <RecordLine label="Periodicidade" value={`${t.periodicidadeDias} dias`} />
        </RecordRow>
      ))}
    </Screen>
  );
}