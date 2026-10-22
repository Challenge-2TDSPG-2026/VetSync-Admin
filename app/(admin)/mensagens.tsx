import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '../../components/Screen';
import { CORES } from '../../constants/theme';
import { adminService } from '../../services/adminService';
import { mensagemDeErro } from '../../utils/erro';
import { mostrarToast } from '../../components/ui/Toast';

type Conversa = Awaited<ReturnType<typeof adminService.listarConversasClinica>>[number];
type Mensagem = Awaited<ReturnType<typeof adminService.listarMensagensClinica>>[number];

export default function Mensagens() {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [ativa, setAtiva] = useState<Conversa | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState('');
  const [tutorId, setTutorId] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const carregar = useCallback(async () => {
    try { setConversas(await adminService.listarConversasClinica()); }
    catch (e) { mostrarToast('erro', 'Não foi possível carregar as conversas', mensagemDeErro(e)); }
    finally { setCarregando(false); }
  }, []);
  useFocusEffect(useCallback(() => { void carregar(); }, [carregar]));
  useEffect(() => {
    if (!ativa) return;
    let vivo = true;
    const buscar = () => adminService.listarMensagensClinica(ativa.idConversa).then(m => { if (vivo) setMensagens(m); }).catch(e => { if (vivo) mostrarToast('erro', 'Falha ao atualizar mensagens', mensagemDeErro(e)); });
    void buscar(); const timer = setInterval(buscar, 10000);
    return () => { vivo = false; clearInterval(timer); };
  }, [ativa?.idConversa]);
  async function iniciar() {
    const id = Number(tutorId);
    if (!Number.isInteger(id) || id <= 0) { mostrarToast('erro', 'Informe um ID de tutor válido'); return; }
    try { const c = await adminService.iniciarConversaClinica(id); setConversas(cs => [c, ...cs.filter(x => x.idConversa !== c.idConversa)]); setAtiva(c); setTutorId(''); }
    catch (e) { mostrarToast('erro', 'Não foi possível iniciar a conversa', mensagemDeErro(e)); }
  }
  async function enviar() {
    const conteudo = texto.trim(); if (!ativa || !conteudo || enviando) return;
    setEnviando(true);
    try { await adminService.enviarMensagemClinica(ativa.idConversa, conteudo); setTexto(''); setMensagens(await adminService.listarMensagensClinica(ativa.idConversa)); }
    catch (e) { mostrarToast('erro', 'Não foi possível enviar', mensagemDeErro(e)); }
    finally { setEnviando(false); }
  }
  return <Screen>
    <View style={s.wrap}>
      {ativa ? <>
        <Pressable onPress={() => setAtiva(null)}><Text style={s.back}>‹  Conversas</Text></Pressable>
        <Text style={s.title}>{ativa.nomeTutor}</Text>
        <FlatList style={s.feed} data={mensagens} keyExtractor={m => String(m.idMensagem)} contentContainerStyle={s.feedContent}
          renderItem={({ item }) => <View style={[s.bubble, item.remetente === 'CLINICA' ? s.mine : s.theirs]}><Text style={s.message}>{item.texto}</Text><Text style={s.time}>{new Date(item.enviadaEm).toLocaleString('pt-BR')}</Text></View>} />
        <View style={s.composer}><TextInput value={texto} onChangeText={setTexto} placeholder="Escreva uma mensagem…" maxLength={2000} style={s.input} onSubmitEditing={enviar} /><Pressable disabled={enviando || !texto.trim()} onPress={enviar} style={s.send}><Text style={s.sendText}>{enviando ? '…' : 'Enviar'}</Text></Pressable></View>
      </> : <>
        <Text style={s.title}>Mensagens dos tutores</Text><Text style={s.subtitle}>Responda e acompanhe as conversas da sua clínica.</Text>
        <View style={s.start}><TextInput value={tutorId} onChangeText={setTutorId} keyboardType="number-pad" placeholder="ID do tutor vinculado" style={s.input} /><Pressable onPress={iniciar} style={s.send}><Text style={s.sendText}>Nova conversa</Text></Pressable></View>
        {carregando ? <ActivityIndicator color={CORES.primaria} /> : conversas.length === 0 ? <Text style={s.empty}>Nenhuma conversa ainda.</Text> : <ScrollView>{conversas.map(c => <Pressable key={c.idConversa} style={s.row} onPress={() => { setMensagens([]); setAtiva(c); }}><View style={s.avatar}><Text style={s.avatarText}>{c.nomeTutor.slice(0,1).toUpperCase()}</Text></View><View style={s.rowCopy}><Text style={s.rowTitle}>{c.nomeTutor}</Text><Text style={s.rowMeta}>Conversa iniciada em {new Date(c.criadaEm).toLocaleDateString('pt-BR')}</Text></View><Text style={s.chevron}>›</Text></Pressable>)}</ScrollView>}
      </>}
    </View>
  </Screen>;
}

const s = StyleSheet.create({ wrap: { flex: 1, padding: 18, gap: 12 }, title: { color: CORES.texto, fontSize: 22, fontWeight: '800' }, subtitle: { color: CORES.textoSecundario }, back: { color: CORES.primaria, fontWeight: '700', fontSize: 16 }, start: { flexDirection: 'row', gap: 8, marginVertical: 8 }, input: { flex: 1, minHeight: 46, borderWidth: 1, borderColor: CORES.borda, borderRadius: 12, paddingHorizontal: 12, color: CORES.texto, backgroundColor: '#fff' }, send: { backgroundColor: CORES.primaria, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' }, sendText: { color: '#fff', fontWeight: '700' }, row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: '#fff', borderRadius: 14, marginBottom: 9 }, avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: CORES.primaria, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#fff', fontWeight: '800' }, rowCopy: { flex: 1 }, rowTitle: { color: CORES.texto, fontWeight: '800', fontSize: 15 }, rowMeta: { color: CORES.textoSecundario, fontSize: 12, marginTop: 4 }, chevron: { color: CORES.primaria, fontSize: 24 }, empty: { textAlign: 'center', color: CORES.textoSecundario, marginTop: 40 }, feed: { flex: 1 }, feedContent: { gap: 8, paddingVertical: 8 }, bubble: { maxWidth: '85%', borderRadius: 14, padding: 11 }, mine: { alignSelf: 'flex-end', backgroundColor: CORES.primaria }, theirs: { alignSelf: 'flex-start', backgroundColor: '#fff' }, message: { color: CORES.texto }, time: { color: CORES.textoSecundario, fontSize: 10, marginTop: 5 }, composer: { flexDirection: 'row', gap: 8 }, });
