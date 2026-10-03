import React, { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, Switch, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { adminService } from '../../services/adminService';
import type { ImagemSelecionada, Recompensa, TipoRecompensa } from '../../types';
import { mensagemDeErro } from '../../utils/erro';
import { confirmar } from '../../utils/confirmar';
import { prepararImagem } from '../../utils/imagem';
import { CORES } from '../../constants/theme';
import { mostrarToast } from '../../components/ui/Toast';
import { RecompensaImagem } from '../../components/RecompensaImagem';
import { Screen, LoadingBlock } from '../../components/Screen';
import { Card, CardDesc, CardTitle, Field, Banner } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ClinicaSelect } from '../../components/ui/ClinicaSelect';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusTag } from '../../components/ui/StatusTag';
import { RecordActions, RecordHeader, RecordLine, RecordRow } from '../../components/ui/RecordRow';

const ROTULO_TIPO: Record<TipoRecompensa, string> = {
  PRODUTO: 'Produto',
  CUPOM_DESCONTO: 'Cupom de desconto',
};

const FORM_VAZIO = { nome: '', descricao: '', custoPontos: '', tipo: 'PRODUTO' as TipoRecompensa };

export default function RecompensasScreen() {
  const [lista, setLista] = useState<Recompensa[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  /** Muda a cada carga da lista para forçar o refetch das imagens autenticadas. */
  const [versao, setVersao] = useState(0);

  const [form, setForm] = useState(FORM_VAZIO);
  const [idClinica, setIdClinica] = useState<number | null>(null);
  const [editando, setEditando] = useState<Recompensa | null>(null);
  const [ativa, setAtiva] = useState(true);
  const [imagem, setImagem] = useState<ImagemSelecionada | null>(null);
  const [removerImagem, setRemoverImagem] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [removendo, setRemovendo] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setLista(await adminService.listarRecompensas());
      setVersao(Date.now());
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

  const custoNumero = /^\d+$/.test(form.custoPontos) ? Number(form.custoPontos) : 0;
  const formValido = form.nome.trim().length > 0 && custoNumero > 0 && idClinica !== null;

  function limparFormulario() {
    setEditando(null);
    setForm(FORM_VAZIO);
    setIdClinica(null);
    setAtiva(true);
    setImagem(null);
    setRemoverImagem(false);
  }

  function iniciarEdicao(r: Recompensa) {
    setEditando(r);
    setForm({ nome: r.nome, descricao: r.descricao || '', custoPontos: String(r.custoPontos), tipo: r.tipo });
    setIdClinica(r.idClinica ?? null);
    setAtiva(r.ativa);
    setImagem(null);
    setRemoverImagem(false);
  }

  async function escolherImagem() {
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });
      if (resultado.canceled || !resultado.assets?.[0]) return;
      const pronta = await prepararImagem(resultado.assets[0]);
      setImagem(pronta);
      setRemoverImagem(false);
    } catch (e) {
      mostrarToast('erro', e instanceof Error ? e.message : 'Não foi possível usar essa imagem.');
    }
  }

  function removerImagemDoForm() {
    if (imagem) {
      setImagem(null); // descarta a escolha recém-feita
    } else {
      setRemoverImagem(true); // pede ao backend para apagar a imagem atual
    }
  }

  async function handleSubmit() {
    if (!formValido || idClinica === null) return;
    setSalvando(true);
    try {
      if (editando) {
        await adminService.atualizarRecompensa(editando.idRecompensa, {
          ...form,
          custoPontos: custoNumero,
          idClinica,
          imagem,
          ativo: ativa,
          removerImagem: !imagem && removerImagem,
        });
        mostrarToast('sucesso', 'Recompensa atualizada');
      } else {
        await adminService.criarRecompensa({ ...form, custoPontos: custoNumero, idClinica, imagem });
        mostrarToast('sucesso', 'Recompensa cadastrada no catálogo');
      }
      limparFormulario();
      carregar();
    } catch (e) {
      mostrarToast('erro', mensagemDeErro(e));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(r: Recompensa) {
    const ok = await confirmar(`Excluir a recompensa "${r.nome}"?`, 'Excluir');
    if (!ok) return;
    setRemovendo(r.idRecompensa);
    try {
      const res = await adminService.removerRecompensa(r.idRecompensa);
      if (res?.excluidoDefinitivamente) {
        mostrarToast('sucesso', 'Recompensa excluída');
        setLista((prev) => prev?.filter((x) => x.idRecompensa !== r.idRecompensa) ?? null);
      } else {
        // Há resgates vinculados: o backend só inativou.
        mostrarToast('info', 'Recompensa inativada', res?.mensagem || 'Existem resgates vinculados, então ela foi apenas inativada.');
        setLista((prev) => prev?.map((x) => (x.idRecompensa === r.idRecompensa ? { ...x, ativa: false } : x)) ?? null);
      }
      if (editando?.idRecompensa === r.idRecompensa) limparFormulario();
    } catch (e) {
      mostrarToast('erro', mensagemDeErro(e));
    } finally {
      setRemovendo(null);
    }
  }

  const mostrandoAtual = !!editando?.imagemUrl && !imagem && !removerImagem;
  const temImagemParaRemover = !!imagem || mostrandoAtual;

  return (
    <Screen
      eyebrow="Catálogo"
      title="Programa Fidelidade"
      desc="Itens que o tutor resgata com pontos. Recompensas com resgates vinculados não são apagadas, apenas inativadas."
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <Card>
        <CardTitle>{editando ? `Editar recompensa #${editando.idRecompensa}` : 'Cadastrar recompensa'}</CardTitle>
        <CardDesc>Imagem opcional (JPEG, PNG ou WEBP, até 5 MB).</CardDesc>

        <ClinicaSelect value={idClinica} onChange={setIdClinica} />
        <Field label="Nome" value={form.nome} onChangeText={(v) => setForm({ ...form, nome: v })} placeholder="Ex.: Cupom de 10% no banho" />
        <Field label="Descrição (opcional)" value={form.descricao} onChangeText={(v) => setForm({ ...form, descricao: v })} placeholder="Detalhes da recompensa" multiline />
        <Field
          label="Custo em pontos"
          value={form.custoPontos}
          onChangeText={(v) => setForm({ ...form, custoPontos: v.replace(/\D/g, '') })}
          placeholder="100"
          keyboardType="numeric"
        />

        <Text style={s.rotulo}>Tipo</Text>
        <View style={s.linha}>
          {(Object.keys(ROTULO_TIPO) as TipoRecompensa[]).map((t) => (
            <Button
              key={t}
              label={ROTULO_TIPO[t]}
              size="sm"
              variant={form.tipo === t ? 'primary' : 'ghost'}
              onPress={() => setForm({ ...form, tipo: t })}
              style={{ flex: 1 }}
            />
          ))}
        </View>

        <Text style={[s.rotulo, { marginTop: 14 }]}>Imagem</Text>
        {imagem ? (
          <Image source={{ uri: imagem.uri }} style={s.preview} resizeMode="cover" />
        ) : mostrandoAtual ? (
          <RecompensaImagem imagemUrl={editando?.imagemUrl} versao={versao} tamanho={120} style={s.previewBox} />
        ) : (
          <Text style={s.semImagem}>{removerImagem ? 'A imagem atual será removida ao salvar.' : 'Nenhuma imagem selecionada.'}</Text>
        )}
        <View style={[s.linha, { marginTop: 10 }]}>
          <Button label={imagem || mostrandoAtual ? 'Trocar imagem' : 'Escolher imagem'} variant="ghost" size="sm" onPress={escolherImagem} />
          {editando && temImagemParaRemover && <Button label="Remover imagem" variant="dangerText" size="sm" onPress={removerImagemDoForm} />}
          {editando && removerImagem && !imagem && <Button label="Desfazer" variant="ghost" size="sm" onPress={() => setRemoverImagem(false)} />}
        </View>

        {editando && (
          <View style={s.switchLinha}>
            <View style={{ flex: 1 }}>
              <Text style={s.switchTitulo}>Ativa</Text>
              <Text style={s.switchDesc}>Recompensas inativas não aparecem para o tutor.</Text>
            </View>
            <Switch value={ativa} onValueChange={setAtiva} trackColor={{ true: CORES.secundaria, false: CORES.borda }} />
          </View>
        )}

        <View style={[s.linha, { marginTop: 16 }]}>
          <Button
            label={salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Cadastrar recompensa'}
            onPress={handleSubmit}
            loading={salvando}
            disabled={!formValido}
            style={{ flex: 1 }}
          />
          {editando && <Button label="Cancelar" variant="ghost" onPress={limparFormulario} />}
        </View>
      </Card>

      {erro && <Banner tone="error">{erro}</Banner>}
      {lista === null && !erro && <LoadingBlock />}
      {lista && lista.length === 0 && <EmptyState icon="gift-outline" title="Nenhuma recompensa cadastrada ainda" />}
      {lista?.map((r) => (
        <RecordRow key={r.idRecompensa}>
          <View style={s.linhaTopo}>
            <RecompensaImagem imagemUrl={r.imagemUrl} versao={versao} tamanho={64} />
            <View style={{ flex: 1, gap: 6 }}>
              <RecordHeader id={r.idRecompensa} title={r.nome} />
              <StatusTag tom={r.ativa ? 'aprovado' : 'negado'} label={r.ativa ? 'Ativa' : 'Inativa'} />
            </View>
          </View>
          {r.nmClinica || r.idClinica ? <RecordLine label="Clínica" value={r.nmClinica || `#${r.idClinica}`} /> : null}
          <RecordLine label="Tipo" value={ROTULO_TIPO[r.tipo] ?? r.tipo} />
          <RecordLine label="Custo" value={`${r.custoPontos} pts`} />
          {r.descricao ? <RecordLine label="Descrição" value={r.descricao} /> : null}
          <RecordActions>
            <Button label="Editar" variant="ghost" size="sm" onPress={() => iniciarEdicao(r)} />
            <Button label="Excluir" variant="dangerText" size="sm" onPress={() => excluir(r)} loading={removendo === r.idRecompensa} />
          </RecordActions>
        </RecordRow>
      ))}
    </Screen>
  );
}

const s = StyleSheet.create({
  rotulo: { fontSize: 12.5, fontWeight: '700', color: CORES.textoSecundario, marginBottom: 6 },
  linha: { flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  linhaTopo: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 4 },
  preview: { width: 120, height: 120, borderRadius: 12, backgroundColor: CORES.fundoSutil },
  previewBox: { borderRadius: 12 },
  semImagem: { fontSize: 12.5, color: CORES.textoSecundario },
  switchLinha: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: CORES.borda },
  switchTitulo: { fontSize: 14, fontWeight: '700', color: CORES.texto },
  switchDesc: { fontSize: 12, color: CORES.textoSecundario, marginTop: 1 },
});