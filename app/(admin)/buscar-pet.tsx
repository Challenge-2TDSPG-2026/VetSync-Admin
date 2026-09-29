import React, { useState } from 'react';
import { adminService } from '../../services/adminService';
import type { Pet } from '../../types';
import { mensagemDeErro } from '../../utils/erro';
import { Screen } from '../../components/Screen';
import { Banner, Card, CardDesc, CardTitle, Field } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { RecordHeader, RecordLine, RecordRow } from '../../components/ui/RecordRow';

function formatarData(iso?: string | null): string {
  if (!iso) return '—';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return a && m && d ? `${d}/${m}/${a}` : iso;
}

export default function BuscarPetScreen() {
  const [numero, setNumero] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pet, setPet] = useState<Pet | null>(null);

  async function buscar() {
    setErro(null);
    setPet(null);
    setBuscando(true);
    try {
      setPet(await adminService.buscarPetPorNumero(numero));
    } catch (e) {
      // 400 (número inválido) e 404 (não encontrado) chegam com a mensagem do backend.
      setErro(mensagemDeErro(e));
    } finally {
      setBuscando(false);
    }
  }

  return (
    <Screen
      eyebrow="Consulta"
      title="Buscar pet"
      desc="Encontre um pet pelo número de identificação (1 a 4 dígitos, com ou sem zeros à esquerda)."
    >
      <Card>
        <CardTitle>Número do pet</CardTitle>
        <CardDesc>A foto do pet não é exibida: a API não libera esse arquivo para administradores.</CardDesc>
        <Field
          label="Número"
          value={numero}
          onChangeText={(v) => setNumero(v.replace(/\D/g, ''))}
          placeholder="0042"
          keyboardType="numeric"
          maxLength={4}
          onSubmitEditing={() => numero && buscar()}
        />
        <Button label={buscando ? 'Buscando…' : 'Buscar'} onPress={buscar} loading={buscando} disabled={!numero} />
      </Card>

      {erro && <Banner tone="error">{erro}</Banner>}

      {pet && (
        <RecordRow>
          <RecordHeader id={pet.idPet} title={pet.nmPet} />
          <RecordLine label="Número" value={String(pet.numero)} />
          <RecordLine label="Espécie" value={pet.especie || '—'} />
          <RecordLine label="Raça" value={pet.raca || '—'} />
          <RecordLine label="Sexo" value={pet.sexo || '—'} />
          <RecordLine label="Nascimento" value={formatarData(pet.dtNascimento)} />
          <RecordLine label="Idade" value={pet.idadeAnos != null ? `${pet.idadeAnos} ano(s)` : '—'} />
          <RecordLine label="Peso" value={pet.peso != null ? `${pet.peso} kg` : '—'} />
          <RecordLine label="Tutor" value={pet.idTutor != null ? `#${pet.idTutor}` : '—'} />
        </RecordRow>
      )}
    </Screen>
  );
}