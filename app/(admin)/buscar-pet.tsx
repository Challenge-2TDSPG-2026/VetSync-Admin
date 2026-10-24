import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { adminService } from '../../services/adminService';
import type { Pet } from '../../types';
import { mensagemDeErro } from '../../utils/erro';
import { Screen } from '../../components/Screen';
import { Banner, Field } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CORES } from '../../constants/theme';
import { useIsDesktop } from '../../hooks/useIsDesktop';

function formatarData(iso?: string | null): string {
  if (!iso) return '—';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return a && m && d ? `${d}/${m}/${a}` : iso;
}

function Dado({ icon, label, value, destaque = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; destaque?: boolean }) {
  return (
    <View style={[s.dado, destaque && s.dadoDestaque]}>
      <View style={[s.iconeDado, destaque && s.iconeDadoDestaque]}>
        <Ionicons name={icon} size={17} color={destaque ? '#fff' : CORES.mintDeep} />
      </View>
      <View style={s.dadoTexto}>
        <Text style={s.dadoLabel}>{label}</Text>
        <Text style={s.dadoValor}>{value}</Text>
      </View>
    </View>
  );
}

export default function BuscarPetScreen() {
  const params = useLocalSearchParams<{ numero?: string }>();
  const isDesktop = useIsDesktop();
  const [numero, setNumero] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pet, setPet] = useState<Pet | null>(null);

  async function buscar(valor: string = numero) {
    setErro(null);
    setPet(null);
    setBuscando(true);
    try {
      setPet(await adminService.buscarPetPorNumero(valor));
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setBuscando(false);
    }
  }

  useEffect(() => {
    const vindo = typeof params.numero === 'string' ? params.numero.replace(/\D/g, '') : '';
    if (vindo) {
      setNumero(vindo);
      void buscar(vindo);
    }
  }, [params.numero]);

  return (
    <Screen>
      <View style={s.page}>
        <View style={s.topo}>
          <View style={s.topoOrb} />
          <View style={s.topoConteudo}>
            <View style={s.eyebrow}><Ionicons name="heart" size={13} color="#b8eed1" /><Text style={s.eyebrowText}>CUIDADO QUE ACOMPANHA</Text></View>
            <Text style={s.titulo}>Prontuário do pet</Text>
            <Text style={s.subtitulo}>Acesse os dados de identificação e acompanhe o histórico do paciente.</Text>
          </View>
          <View style={s.selo}><Ionicons name="paw" size={25} color="#c6f3d9" /></View>
        </View>

        <View style={[s.buscaCard, isDesktop && s.buscaCardDesktop]}>
          <View style={s.buscaIcone}><Ionicons name="search" size={20} color={CORES.mintDeep} /></View>
          <View style={s.buscaTexto}>
            <Text style={s.buscaTitulo}>Encontrar paciente</Text>
            <Text style={s.buscaAjuda}>Digite o número de identificação do pet</Text>
          </View>
          <View style={[s.buscaControles, isDesktop && s.buscaControlesDesktop]}>
            <View style={isDesktop && s.campoWrap}>
              <Field
                label="Número do pet"
                value={numero}
                onChangeText={(v) => setNumero(v.replace(/\D/g, ''))}
                placeholder="Ex.: 0042"
                keyboardType="numeric"
                maxLength={4}
                onSubmitEditing={() => numero && buscar()}
                style={s.campo}
              />
            </View>
            <Button label={buscando ? 'Buscando…' : 'Buscar pet'} onPress={() => buscar()} loading={buscando} disabled={!numero} style={s.botaoBusca} />
          </View>
        </View>

        {erro && <Banner tone="error">{erro}</Banner>}

        {pet && (
          <View style={s.prontuario}>
            <View style={s.prontuarioTopo}>
              <View style={s.avatar}><Ionicons name="paw" size={27} color={CORES.mintDeep} /></View>
              <View style={s.identidade}>
                <Text style={s.identidadeCaption}>PACIENTE · #{pet.idPet}</Text>
                <Text style={s.nomePet}>{pet.nmPet}</Text>
                <Text style={s.especiePet}>{[pet.especie, pet.raca].filter(Boolean).join('  ·  ') || 'Espécie não informada'}</Text>
              </View>
              <View style={s.status}><View style={s.statusPonto} /><Text style={s.statusTexto}>Cadastro localizado</Text></View>
            </View>

            <View style={s.divisor} />
            <View style={s.secaoTituloLinha}>
              <Text style={s.secaoTitulo}>Dados do paciente</Text>
              <Text style={s.secaoMeta}>IDENTIFICAÇÃO</Text>
            </View>
            <View style={s.grade}>
              <Dado icon="pricetag-outline" label="Número" value={String(pet.numero)} destaque />
              <Dado icon="male-female-outline" label="Sexo" value={pet.sexo || 'Não informado'} />
              <Dado icon="calendar-outline" label="Nascimento" value={formatarData(pet.dtNascimento)} />
              <Dado icon="time-outline" label="Idade" value={pet.idadeAnos != null ? `${pet.idadeAnos} ${pet.idadeAnos === 1 ? 'ano' : 'anos'}` : 'Não informada'} />
              <Dado icon="barbell-outline" label="Peso" value={pet.peso != null ? `${pet.peso} kg` : 'Não informado'} />
              <Dado icon="person-outline" label="Tutor" value={pet.idTutor != null ? `#${pet.idTutor}` : 'Não informado'} />
            </View>
            <View style={s.nota}><Ionicons name="information-circle-outline" size={17} color={CORES.mintDeep} /><Text style={s.notaTexto}>A foto do pet e o histórico clínico detalhado não estão disponíveis nesta consulta administrativa.</Text></View>
          </View>
        )}

        {!pet && !erro && !buscando && (
          <View style={s.vazio}>
            <View style={s.vazioIcone}><Ionicons name="document-text-outline" size={25} color={CORES.mintDeep} /></View>
            <Text style={s.vazioTitulo}>O prontuário começa por aqui</Text>
            <Text style={s.vazioTexto}>Pesquise pelo número do pet para visualizar os dados de identificação do paciente.</Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  page: { width: '100%', maxWidth: 1060, alignSelf: 'center' },
  topo: { minHeight: 194, backgroundColor: '#123d29', borderRadius: 26, paddingHorizontal: 30, paddingVertical: 28, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', marginBottom: 20, position: 'relative' },
  topoOrb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(61,184,126,0.13)', right: 88, top: -170 },
  topoConteudo: { flex: 1, zIndex: 1 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 13 },
  eyebrowText: { color: '#b8eed1', fontSize: 10, fontWeight: '800', letterSpacing: 1.45 },
  titulo: { color: '#fff', fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -0.8 },
  subtitulo: { color: '#d2e8da', fontSize: 14, lineHeight: 21, marginTop: 7, maxWidth: 540 },
  selo: { width: 64, height: 64, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', marginLeft: 20 },
  buscaCard: { backgroundColor: '#fff', borderRadius: 22, borderWidth: 1, borderColor: '#e8e2da', padding: 21, marginBottom: 20, shadowColor: '#123d29', shadowOpacity: 0.05, shadowRadius: 16, shadowOffset: { width: 0, height: 7 }, elevation: 2 },
  buscaCardDesktop: { paddingHorizontal: 26 },
  buscaIcone: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#e7f5ed', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  buscaTexto: { marginBottom: 14 },
  buscaTitulo: { color: CORES.texto, fontSize: 17, fontWeight: '800' },
  buscaAjuda: { color: CORES.textoSecundario, fontSize: 12.5, marginTop: 4 },
  buscaControles: { gap: 9 },
  buscaControlesDesktop: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  campoWrap: { flex: 1 },
  campo: { backgroundColor: '#fbfcfa', borderColor: '#dce6df', fontSize: 15, minHeight: 48 },
  botaoBusca: { minWidth: 150, marginBottom: 13 },
  prontuario: { backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#e8e2da', padding: 24, marginBottom: 18, shadowColor: '#123d29', shadowOpacity: 0.05, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
  prontuarioTopo: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  avatar: { width: 66, height: 66, borderRadius: 22, backgroundColor: '#e7f5ed', alignItems: 'center', justifyContent: 'center' },
  identidade: { flex: 1 },
  identidadeCaption: { color: CORES.mintDeep, fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginBottom: 4 },
  nomePet: { color: CORES.texto, fontSize: 24, fontWeight: '800', letterSpacing: -0.45 },
  especiePet: { color: CORES.textoSecundario, fontSize: 13, marginTop: 3 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#eff8f1', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 11 },
  statusPonto: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2c9a5e' },
  statusTexto: { color: '#287447', fontSize: 11, fontWeight: '700' },
  divisor: { height: 1, backgroundColor: '#eeeae4', marginVertical: 22 },
  secaoTituloLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 },
  secaoTitulo: { color: CORES.texto, fontSize: 16, fontWeight: '800' },
  secaoMeta: { color: '#9a8f84', fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dado: { flexGrow: 1, flexBasis: 145, minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderRadius: 16, backgroundColor: '#fafbf9', borderWidth: 1, borderColor: '#edf0eb' },
  dadoDestaque: { backgroundColor: '#123d29', borderColor: '#123d29' },
  iconeDado: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#e7f5ed', alignItems: 'center', justifyContent: 'center' },
  iconeDadoDestaque: { backgroundColor: 'rgba(255,255,255,0.14)' },
  dadoTexto: { flex: 1 },
  dadoLabel: { color: '#8b8178', fontSize: 10.5, fontWeight: '700', marginBottom: 4 },
  dadoValor: { color: CORES.texto, fontSize: 14, fontWeight: '800' },
  nota: { marginTop: 17, padding: 12, borderRadius: 13, backgroundColor: '#f1f8f3', flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  notaTexto: { flex: 1, color: '#53705d', fontSize: 11.5, lineHeight: 17 },
  vazio: { alignItems: 'center', paddingVertical: 31, paddingHorizontal: 22, backgroundColor: 'rgba(255,255,255,0.75)', borderWidth: 1, borderColor: '#ece8e1', borderRadius: 22 },
  vazioIcone: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#e7f5ed', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  vazioTitulo: { color: CORES.texto, fontSize: 15, fontWeight: '800' },
  vazioTexto: { color: CORES.textoSecundario, textAlign: 'center', fontSize: 12.5, lineHeight: 18, maxWidth: 420, marginTop: 5 },
});
