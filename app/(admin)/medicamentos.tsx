import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { adminService } from '../../services/adminService';
import type { Medicamento } from '../../types';
import { mensagemDeErro } from '../../utils/erro';
import { confirmar } from '../../utils/confirmar';
import { mostrarToast } from '../../components/ui/Toast';
import { Screen, LoadingBlock } from '../../components/Screen';
import { Card, CardTitle, Field, Banner } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { RecordActions, RecordHeader, RecordLine, RecordRow } from '../../components/ui/RecordRow';

const FORM_VAZIO = { nmMedicamento: '', dsPrincipio: '', vlPrecoRef: '' };

export default function MedicamentosScreen() {
  const [lista, setLista] = useState<Medicamento[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [form, setForm] = useState(FORM_VAZIO);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [removendo, setRemovendo] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setLista(await adminService.listarMedicamentos());
    } catch (e) {
      setErro(mensagemDeErro(e));
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

  function editar(m: Medicamento) {
    setEditingId(m.idMedicamento);
    setForm({
      nmMedicamento: m.nmMedicamento,
      dsPrincipio: m.dsPrincipio || '',
      vlPrecoRef: m.vlPrecoRef != null ? String(m.vlPrecoRef) : '',
    });
  }

  function cancelarEdicao() {
    setEditingId(null);
    setForm(FORM_VAZIO);
  }

  async function handleSubmit() {
    setSalvando(true);
    try {
      if (editingId) {
        await adminService.atualizarMedicamento(editingId, form.nmMedicamento, form.dsPrincipio, form.vlPrecoRef);
        mostrarToast('sucesso', 'Medicamento atualizado');
      } else {
        await adminService.criarMedicamento(form.nmMedicamento, form.dsPrincipio, form.vlPrecoRef);
        mostrarToast('sucesso', 'Medicamento cadastrado no catálogo');
      }
      cancelarEdicao();
      carregar();
    } catch (e) {
      mostrarToast('erro', mensagemDeErro(e));
    } finally {
      setSalvando(false);
    }
  }

  async function remover(id: number) {
    const ok = await confirmar('Remover este medicamento do catálogo?');
    if (!ok) return;
    setRemovendo(id);
    try {
      await adminService.removerMedicamento(id);
      mostrarToast('sucesso', 'Medicamento removido');
      setLista((prev) => prev?.filter((m) => m.idMedicamento !== id) ?? null);
    } catch (e) {
      mostrarToast('erro', mensagemDeErro(e));
    } finally {
      setRemovendo(null);
    }
  }

  return (
    <Screen
      eyebrow="Catálogo"
      title="Medicamentos"
      desc="Veterinários usam este catálogo para solicitar prescrições. Remover é exclusivo do admin."
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <Card>
        <CardTitle>{editingId ? `Editar medicamento #${editingId}` : 'Cadastrar medicamento'}</CardTitle>

        <Field label="Nome" value={form.nmMedicamento} onChangeText={(v) => setForm({ ...form, nmMedicamento: v })} placeholder="Nome do medicamento" />
        <Field label="Princípio ativo (opcional)" value={form.dsPrincipio} onChangeText={(v) => setForm({ ...form, dsPrincipio: v })} placeholder="Ex.: Amoxicilina" />
        <Field label="Preço de referência (opcional)" value={form.vlPrecoRef} onChangeText={(v) => setForm({ ...form, vlPrecoRef: v })} placeholder="0.00" keyboardType="decimal-pad" />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            label={salvando ? 'Salvando…' : editingId ? 'Salvar alterações' : 'Cadastrar medicamento'}
            onPress={handleSubmit}
            loading={salvando}
            disabled={!form.nmMedicamento}
            style={{ flex: 1 }}
          />
          {editingId && <Button label="Cancelar" variant="ghost" onPress={cancelarEdicao} />}
        </View>
      </Card>

      {erro && <Banner tone="error">{erro}</Banner>}
      {lista === null && !erro && <LoadingBlock />}
      {lista && lista.length === 0 && <EmptyState icon="flask-outline" title="Nenhum medicamento cadastrado ainda" />}
      {lista?.map((m) => (
        <RecordRow key={m.idMedicamento}>
          <RecordHeader id={m.idMedicamento} title={m.nmMedicamento} />
          <RecordLine label="Princípio ativo" value={m.dsPrincipio || '—'} />
          <RecordLine label="Preço ref." value={m.vlPrecoRef != null ? `R$ ${Number(m.vlPrecoRef).toFixed(2)}` : '—'} />
          <RecordActions>
            <Button label="Editar" variant="ghost" size="sm" onPress={() => editar(m)} />
            <Button label="Remover" variant="dangerText" size="sm" onPress={() => remover(m.idMedicamento)} loading={removendo === m.idMedicamento} />
          </RecordActions>
        </RecordRow>
      ))}
    </Screen>
  );
}