import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import QRCode from 'react-native-qrcode-svg';
import { AppIcon } from '../../components/AppIcon';
import { Screen, LoadingBlock } from '../../components/Screen';
import { EmptyState } from '../../components/ui/EmptyState';
import { Banner, Card, CardDesc, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusTag } from '../../components/ui/StatusTag';
import { mostrarToast } from '../../components/ui/Toast';
import { CORES } from '../../constants/theme';
import { adminService } from '../../services/adminService';
import { ApiError } from '../../services/api/httpClient';
import type { Clinica, CodigoVinculoClinica } from '../../types';
import { mensagemDeErro } from '../../utils/erro';
import { confirmar } from '../../utils/confirmar';

type QrCodeRef = {
  toDataURL: (callback: (base64: string) => void) => void;
};

function mensagemDaEmissao(erro: unknown): string {
  if (erro instanceof ApiError) {
    if (erro.status === 403) return 'Seu usuário não tem permissão de administrador para emitir o código desta clínica.';
    if (erro.status === 404) return 'A clínica selecionada não foi encontrada. Atualize a lista e escolha outra clínica.';
  }
  return mensagemDeErro(erro, 'Não foi possível emitir o código de vínculo. Tente novamente.');
}

function mensagemDoContrato(erro: unknown): string {
  if (erro instanceof ApiError) {
    if (erro.status === 403) return 'Seu usuário não tem permissão de administrador para alterar o contrato desta clínica.';
    if (erro.status === 404) return 'A clínica selecionada não foi encontrada. Atualize a lista e escolha outra clínica.';
  }
  return mensagemDeErro(erro, 'Não foi possível alterar o contrato da clínica. Tente novamente.');
}

function situacaoCodigo(clinica: Clinica): { tom: 'aprovado' | 'pendente' | 'neutro' | 'negado'; label: string } {
  if (!clinica.contratoAtivo) return clinica.codigoAtivo ? { tom: 'pendente', label: 'Código suspenso' } : { tom: 'neutro', label: 'Sem código' };
  return clinica.codigoAtivo ? { tom: 'neutro', label: 'Código ativo' } : { tom: 'pendente', label: 'Sem código' };
}

function escaparHtml(valor: string): string {
  return valor.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function documentoParaImpressao(emissao: CodigoVinculoClinica, imagemQr: string): string {
  const nome = escaparHtml(emissao.nomeClinica);
  const codigo = escaparHtml(emissao.codigo);
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Vínculo da clínica</title>
<style>body{font-family:Arial,sans-serif;color:#1a1512;padding:48px;text-align:center}h1{font-size:25px;margin:0 0 8px}p{font-size:16px}.qr{width:260px;height:260px;margin:26px auto 18px}.codigo{font-family:monospace;font-size:20px;font-weight:700;letter-spacing:1px;word-break:break-all}.aviso{margin-top:30px;font-size:13px;color:#615d58}</style>
</head><body><h1>${nome}</h1><p>Código de vínculo da clínica</p><img class="qr" src="${imagemQr}" alt="QR code do código de vínculo"><p class="codigo">${codigo}</p><p class="aviso">Este código fica inválido quando uma nova emissão é feita ou o contrato da clínica deixa de estar ativo.</p></body></html>`;
}

export default function VinculoClinicaScreen() {
  const [clinicas, setClinicas] = useState<Clinica[] | null>(null);
  const [selecionada, setSelecionada] = useState<Clinica | null>(null);
  const [erroLista, setErroLista] = useState<string | null>(null);
  const [emissao, setEmissao] = useState<CodigoVinculoClinica | null>(null);
  const [erroEmissao, setErroEmissao] = useState<string | null>(null);
  const [emitindo, setEmitindo] = useState(false);
  const [alterandoContrato, setAlterandoContrato] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const qrRef = useRef<QrCodeRef | null>(null);

  const carregar = useCallback(async () => {
    setErroLista(null);
    try {
      const disponiveis = await adminService.listarClinicas();
      setClinicas(disponiveis);
      setSelecionada((atual) => disponiveis.find((clinica) => clinica.idClinica === atual?.idClinica) ?? null);
    } catch (erro) {
      setErroLista(mensagemDeErro(erro, 'Não foi possível carregar as clínicas disponíveis.'));
      setClinicas([]);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function atualizar() {
    setRefreshing(true);
    await carregar();
    setRefreshing(false);
  }

  function escolherClinica(clinica: Clinica) {
    setSelecionada(clinica);
    setEmissao(null);
    setErroEmissao(null);
  }

  async function alternarContrato() {
    if (!selecionada || alterandoContrato) return;
    const ativar = !selecionada.contratoAtivo;
    const ok = await confirmar(
      ativar
        ? `Confirmar o contrato de ${selecionada.nomeClinica}? Depois disso será possível emitir o código de vínculo da clínica.`
        : `Desativar o contrato de ${selecionada.nomeClinica}? O código de vínculo deixa de funcionar e novos tutores não conseguem se vincular à clínica.`,
      ativar ? 'Ativar contrato' : 'Desativar contrato',
      ativar ? 'Ativar contrato' : 'Desativar contrato'
    );
    if (!ok) return;

    setAlterandoContrato(true);
    try {
      await adminService.alterarContratoClinica(selecionada.idClinica, ativar);
      // Um QR exibido na tela deixa de valer quando o contrato é desativado.
      if (!ativar) {
        setEmissao(null);
        setErroEmissao(null);
      }
      mostrarToast(
        'sucesso',
        ativar ? 'Contrato ativado' : 'Contrato desativado',
        ativar ? 'Agora é possível emitir o código de vínculo.' : 'O código desta clínica não vincula mais tutores.'
      );
      await carregar();
    } catch (erro) {
      mostrarToast('erro', 'Não foi possível alterar o contrato', mensagemDoContrato(erro));
    } finally {
      setAlterandoContrato(false);
    }
  }

  async function emitirCodigo() {
    if (!selecionada || emitindo) return;
    if (!selecionada.contratoAtivo) {
      setErroEmissao('Ative o contrato da clínica antes de emitir um código de vínculo.');
      return;
    }
    const substituindo = selecionada.codigoAtivo;
    if (substituindo) {
      const ok = await confirmar(
        `Substituir o código de ${selecionada.nomeClinica}? O código atual deixa de funcionar na hora e não aceita mais novos vínculos. Tutores que já estão vinculados continuam vinculados.`,
        'Substituir código',
        'Substituir código'
      );
      if (!ok) return;
    }
    setEmitindo(true);
    setErroEmissao(null);
    // Não conserva um QR de emissão anterior enquanto uma nova requisição está em andamento.
    setEmissao(null);
    try {
      const resposta = await adminService.emitirCodigoVinculoClinica(selecionada.idClinica);
      setEmissao(resposta);
      mostrarToast(
        'sucesso',
        substituindo ? 'Código substituído' : 'Código de vínculo emitido',
        'Guarde ou compartilhe agora: ele não pode ser recuperado depois.'
      );
      await carregar();
    } catch (erro) {
      const mensagem = mensagemDaEmissao(erro);
      setErroEmissao(mensagem);
      mostrarToast('erro', 'Não foi possível emitir o código', mensagem);
    } finally {
      setEmitindo(false);
    }
  }

  async function obterImagemQr(): Promise<string> {
    if (!qrRef.current) throw new Error('O QR code ainda não está pronto. Tente novamente.');
    return new Promise((resolve, reject) => {
      try {
        qrRef.current?.toDataURL((base64) => resolve(`data:image/png;base64,${base64}`));
      } catch (erro) {
        reject(erro);
      }
    });
  }

  async function copiarCodigo() {
    if (!emissao) return;
    try {
      await Clipboard.setStringAsync(emissao.codigo);
      mostrarToast('sucesso', 'Código copiado', 'Cole-o somente onde for necessário para vincular a clínica.');
    } catch {
      mostrarToast('erro', 'Não foi possível copiar o código');
    }
  }

  async function compartilharQr() {
    if (!emissao) return;
    setExportando(true);
    try {
      const imagemQr = await obterImagemQr();
      if (Platform.OS === 'web') {
        const resposta = await fetch(imagemQr);
        const blob = await resposta.blob();
        const arquivo = new File([blob], `vinculo-clinica-${emissao.idClinica}.png`, { type: 'image/png' });
        const dadosParaCompartilhar = { files: [arquivo] };
        if (navigator.share && (!navigator.canShare || navigator.canShare(dadosParaCompartilhar))) {
          await navigator.share({ ...dadosParaCompartilhar, title: `QR code - ${emissao.nomeClinica}` });
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `vinculo-clinica-${emissao.idClinica}.png`;
        link.click();
        URL.revokeObjectURL(url);
        mostrarToast('sucesso', 'QR code baixado', 'Use o arquivo PNG para compartilhar ou imprimir.');
        return;
      }

      if (!FileSystem.cacheDirectory) throw new Error('Não foi possível preparar o arquivo para compartilhamento.');
      const arquivoQr = `${FileSystem.cacheDirectory}vinculo-clinica-${emissao.idClinica}.png`;
      const base64 = imagemQr.split(',')[1];
      if (!base64) throw new Error('Não foi possível preparar a imagem do QR code.');
      await FileSystem.writeAsStringAsync(arquivoQr, base64, { encoding: FileSystem.EncodingType.Base64 });
      try {
        if (!(await Sharing.isAvailableAsync())) throw new Error('Compartilhamento não disponível neste dispositivo.');
        await Sharing.shareAsync(arquivoQr, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: 'Compartilhar QR code da clínica' });
      } finally {
        await FileSystem.deleteAsync(arquivoQr, { idempotent: true }).catch(() => undefined);
      }
    } catch (erro) {
      mostrarToast('erro', 'Não foi possível compartilhar o QR code', erro instanceof Error ? erro.message : undefined);
    } finally {
      setExportando(false);
    }
  }

  async function imprimirQr() {
    if (!emissao) return;
    setExportando(true);
    try {
      const imagemQr = await obterImagemQr();
      if (Platform.OS === 'web') {
        const janela = window.open('', '_blank');
        if (janela) {
          janela.document.write(documentoParaImpressao(emissao, imagemQr));
          janela.document.close();
          janela.focus();
          janela.print();
          return;
        }
      }
      await Print.printAsync({ html: documentoParaImpressao(emissao, imagemQr) });
    } catch (erro) {
      mostrarToast('erro', 'Não foi possível preparar a impressão', erro instanceof Error ? erro.message : undefined);
    } finally {
      setExportando(false);
    }
  }

  return (
    <Screen
      eyebrow="Vínculo de clínica"
      title="Código e QR code"
      desc="Emita o código na API e entregue-o ao tutor para vincular a clínica pelo aplicativo."
      refreshing={refreshing}
      onRefresh={atualizar}
    >
      <Card>
        <CardTitle>Selecione a clínica</CardTitle>
        <CardDesc>As opções abaixo são carregadas diretamente das clínicas cadastradas na API.</CardDesc>

        {erroLista ? <Banner tone="error">{erroLista}</Banner> : null}
        {clinicas === null && !erroLista ? <LoadingBlock label="Carregando clínicas disponíveis…" /> : null}
        {clinicas?.length === 0 ? (
          <EmptyState icon="business-outline" title="Nenhuma clínica disponível" subtitle="Cadastre uma clínica para que ela apareça aqui." />
        ) : null}

        <View style={s.clinicas}>
          {clinicas?.map((clinica) => {
            const ativa = clinica.idClinica === selecionada?.idClinica;
            return (
              <Pressable
                key={clinica.idClinica}
                onPress={() => escolherClinica(clinica)}
                accessibilityRole="radio"
                accessibilityState={{ selected: ativa }}
                accessibilityLabel={`Selecionar ${clinica.nomeClinica}`}
                style={({ pressed }) => [s.clinica, ativa && s.clinicaAtiva, pressed && s.pressed]}
              >
                <View style={[s.clinicaIcone, ativa && s.clinicaIconeAtiva]}>
                  <AppIcon name="business-outline" size={20} color={ativa ? '#fff' : CORES.secundaria} />
                </View>
                <View style={s.clinicaTexto}>
                  <Text style={s.clinicaNome}>{clinica.nomeClinica}</Text>
                  <Text style={s.clinicaId}>Clínica #{clinica.idClinica}</Text>
                  <View style={s.tags}>
                    <StatusTag tom={clinica.contratoAtivo ? 'aprovado' : 'negado'} label={clinica.contratoAtivo ? 'Contrato ativo' : 'Contrato inativo'} />
                    <StatusTag {...situacaoCodigo(clinica)} />
                  </View>
                </View>
                {ativa ? <AppIcon name="checkmark-circle" size={22} color={CORES.secundaria} /> : null}
              </Pressable>
            );
          })}
        </View>

        {selecionada ? (
          <>
            <View style={s.painel}>
              <View style={s.painelCabecalho}>
                <View style={s.painelTexto}>
                  <Text style={s.painelTitulo}>Contrato</Text>
                  <StatusTag tom={selecionada.contratoAtivo ? 'aprovado' : 'negado'} label={selecionada.contratoAtivo ? 'Ativo' : 'Inativo'} />
                </View>
                <Button
                  label={selecionada.contratoAtivo ? 'Desativar contrato' : 'Ativar contrato'}
                  variant={selecionada.contratoAtivo ? 'deny' : 'primary'}
                  size="sm"
                  onPress={alternarContrato}
                  loading={alterandoContrato}
                />
              </View>
              <Text style={s.painelDesc}>
                {selecionada.contratoAtivo
                  ? 'Contrato confirmado: a clínica pode vincular tutores com o código.'
                  : 'Clínicas novas ficam inativas até o Admin confirmar o contrato. Enquanto estiver inativa, a clínica não emite código nem vincula tutores.'}
              </Text>
            </View>

            <View style={s.painel}>
              <View style={s.painelCabecalho}>
                <View style={s.painelTexto}>
                  <Text style={s.painelTitulo}>Código de vínculo</Text>
                  <StatusTag {...situacaoCodigo(selecionada)} />
                </View>
              </View>
              <Text style={s.painelDesc}>
                {!selecionada.contratoAtivo
                  ? selecionada.codigoAtivo
                    ? 'O código já emitido está suspenso porque o contrato está inativo. Ative o contrato para voltar a emitir.'
                    : 'Ative o contrato da clínica para poder emitir o código e o QR code.'
                  : selecionada.codigoAtivo
                    ? 'Existe um código ativo. Por segurança ele não pode ser exibido de novo. Se suspeitar que foi comprometido, substitua-o: o código atual deixa de funcionar na hora para novos vínculos. Quem já se vinculou continua vinculado. O código não expira por tempo.'
                    : 'Ainda não há código ativo. Emita um para entregar ao tutor. O código não expira por tempo.'}
              </Text>
              <Button
                label={emitindo ? 'Emitindo código…' : selecionada.codigoAtivo ? 'Substituir código' : 'Emitir código'}
                variant={selecionada.codigoAtivo ? 'deny' : 'primary'}
                onPress={emitirCodigo}
                loading={emitindo}
                disabled={!selecionada.contratoAtivo || alterandoContrato}
                style={s.painelBotao}
              />
            </View>
          </>
        ) : null}
        {erroEmissao ? <Banner tone="error">{erroEmissao}</Banner> : null}
      </Card>

      {emissao ? (
        <Card style={s.resultado}>
          <View style={s.resultadoCabecalho}>
            <View style={s.resultadoIcone}><AppIcon name="qr-code-outline" size={24} color={CORES.secundaria} /></View>
            <View style={{ flex: 1 }}>
              <CardTitle>{emissao.nomeClinica}</CardTitle>
              <CardDesc>Apresente este código ao tutor. O QR code abaixo contém somente o valor do código.</CardDesc>
            </View>
          </View>

          <View style={s.qrBox}>
            <QRCode
              value={emissao.codigo}
              size={220}
              color="#171412"
              backgroundColor="#fff"
              quietZone={12}
              ecl="M"
              getRef={(ref) => { qrRef.current = ref as QrCodeRef | null; }}
            />
          </View>

          <Text style={s.codigoLabel}>Código de vínculo</Text>
          <Text selectable style={s.codigo}>{emissao.codigo}</Text>

          <View style={s.acoes}>
            <Button label="Copiar código" onPress={copiarCodigo} variant="ghost" style={s.acao} />
            <Button label="Compartilhar QR" onPress={compartilharQr} variant="ghost" loading={exportando} style={s.acao} />
            <Button label="Imprimir QR" onPress={imprimirQr} variant="ghost" loading={exportando} style={s.acao} />
          </View>
          <Text style={s.aviso}>Por segurança, o código fica disponível apenas enquanto esta tela estiver aberta. Recarregar ou sair exige uma nova emissão.</Text>
        </Card>
      ) : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  clinicas: { marginTop: 14, gap: 9 },
  clinica: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: CORES.borda, backgroundColor: '#fff', borderRadius: 14, padding: 12 },
  clinicaAtiva: { borderColor: CORES.secundaria, backgroundColor: CORES.mintPale },
  clinicaIcone: { width: 38, height: 38, borderRadius: 12, backgroundColor: CORES.infoBg, alignItems: 'center', justifyContent: 'center' },
  clinicaIconeAtiva: { backgroundColor: CORES.secundaria },
  clinicaTexto: { flex: 1, minWidth: 0 },
  clinicaNome: { color: CORES.texto, fontSize: 14, fontWeight: '700' },
  clinicaId: { color: CORES.textoSecundario, fontSize: 12, marginTop: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  painel: { marginTop: 14, borderWidth: 1, borderColor: CORES.borda, borderRadius: 14, padding: 14, backgroundColor: CORES.fundo },
  painelCabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  painelTexto: { flex: 1, gap: 6 },
  painelTitulo: { color: CORES.texto, fontSize: 14, fontWeight: '800' },
  painelDesc: { color: CORES.textoSecundario, fontSize: 12.8, lineHeight: 18, marginTop: 10 },
  painelBotao: { marginTop: 14 },
  pressed: { opacity: 0.72 },
  resultado: { marginTop: 14 },
  resultadoCabecalho: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  resultadoIcone: { width: 44, height: 44, borderRadius: 14, backgroundColor: CORES.mintPale, alignItems: 'center', justifyContent: 'center' },
  qrBox: { alignSelf: 'center', marginTop: 20, backgroundColor: '#fff', padding: 12, borderWidth: 1, borderColor: CORES.borda, borderRadius: 16 },
  codigoLabel: { marginTop: 20, textAlign: 'center', color: CORES.textoSecundario, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  codigo: { marginTop: 6, textAlign: 'center', color: CORES.texto, fontSize: 17, fontWeight: '800', letterSpacing: 1.1, fontVariant: ['tabular-nums'], paddingHorizontal: 8 },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 },
  acao: { flexGrow: 1, flexBasis: 150 },
  aviso: { color: CORES.textoSecundario, fontSize: 12, lineHeight: 17, marginTop: 16, textAlign: 'center' },
});