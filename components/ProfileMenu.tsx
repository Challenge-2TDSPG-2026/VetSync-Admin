import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth, type Perfil } from '../context/AuthContext';
import { CORES } from '../constants/theme';
import { AppIcon } from './AppIcon';
import { ehWeb, transicao } from '../utils/animacao';

const ROTULO_PERFIL: Record<Perfil, string> = {
  ADMIN: 'Administrador',
  VETERINARIO: 'Veterinário',
  PROFISSIONAL_ESTETICA: 'Profissional de estética',
  TUTOR: 'Tutor',
};

function iniciais(nome?: string, email?: string): string {
  const base = (nome ?? '').trim();
  if (base) {
    const partes = base.split(/\s+/);
    const primeira = partes[0][0] ?? '';
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
    return (primeira + ultima).toUpperCase();
  }
  return (email?.[0] ?? 'A').toUpperCase();
}

/** Bolinha de perfil (canto superior direito). Ao clicar mostra os dados do login e o botão Sair. */
export function ProfileMenu() {
  const { sessao, logout } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [saindo, setSaindo] = useState(false);

  // Fecha com a tecla Esc (web).
  useEffect(() => {
    if (!ehWeb || (!aberto && !confirmando) || typeof window === 'undefined') return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (confirmando) {
        if (!saindo) setConfirmando(false);
      } else {
        setAberto(false);
      }
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [aberto, confirmando, saindo]);

  const nome = sessao?.nome?.trim() || 'Administrador';
  const email = sessao?.email ?? '';
  const perfil = sessao?.perfil ? ROTULO_PERFIL[sessao.perfil] ?? sessao.perfil : 'Administrador';
  const sigla = iniciais(sessao?.nome, sessao?.email);

  function pedirConfirmacao() {
    setAberto(false);
    setConfirmando(true);
  }

  function cancelar() {
    if (!saindo) setConfirmando(false);
  }

  async function confirmarSaida() {
    if (saindo) return;
    setSaindo(true);
    try {
      await logout();
    } finally {
      setSaindo(false);
      setConfirmando(false);
    }
  }

  return (
    <View style={s.wrap}>
      {aberto ? (
        // Camada invisível: clicar fora do menu fecha.
        <Pressable
          onPress={() => setAberto(false)}
          style={[s.backdrop, ehWeb ? ({ position: 'fixed' } as any) : null]}
        />
      ) : null}

      <Pressable
        onPress={() => setAberto((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel="Abrir menu do perfil"
        accessibilityState={{ expanded: aberto }}
        style={(st: any) => [
          s.avatar,
          transicao(),
          aberto && s.avatarAberto,
          st.hovered && !aberto && s.avatarHover,
          st.pressed && { opacity: 0.85 },
        ]}
      >
        <Text style={s.avatarTexto}>{sigla}</Text>
      </Pressable>

      {aberto ? (
        <View style={s.menu}>
          <View style={s.dados}>
            <View style={[s.avatar, s.avatarGrande]}>
              <Text style={[s.avatarTexto, { fontSize: 16 }]}>{sigla}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.nome} numberOfLines={1}>{nome}</Text>
              {email ? <Text style={s.email} numberOfLines={1}>{email}</Text> : null}
              <Text style={s.perfil}>{perfil}</Text>
            </View>
          </View>

          <View style={s.divisor} />

          <Pressable
            onPress={pedirConfirmacao}
            accessibilityRole="button"
            style={(st: any) => [s.sair, transicao(), st.hovered && s.sairHover]}
          >
            <AppIcon name="log-out-outline" size={19} color={CORES.alerta} />
            <Text style={s.sairTexto}>Sair</Text>
          </Pressable>
        </View>
      ) : null}

      <Modal visible={confirmando} transparent animationType="fade" onRequestClose={cancelar} statusBarTranslucent>
        <View style={s.overlay}>
          {/* Clicar fora do card cancela. */}
          <Pressable style={StyleSheet.absoluteFill} onPress={cancelar} accessibilityLabel="Fechar" />
          <View style={s.card} accessibilityRole="alert">
            <View style={s.cardIcone}>
              <AppIcon name="log-out-outline" size={26} color={CORES.alerta} />
            </View>
            <Text style={s.cardTitulo}>Deseja sair?</Text>
            <Text style={s.cardTexto}>Tem certeza que deseja sair? Você voltará para a tela de login.</Text>
            <View style={s.cardAcoes}>
              <Pressable
                onPress={cancelar}
                disabled={saindo}
                accessibilityRole="button"
                style={(st: any) => [s.btn, s.btnCancelar, transicao(), st.hovered && s.btnCancelarHover, saindo && { opacity: 0.5 }]}
              >
                <Text style={s.btnCancelarTexto}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={confirmarSaida}
                disabled={saindo}
                accessibilityRole="button"
                style={(st: any) => [s.btn, s.btnSair, transicao(), st.hovered && s.btnSairHover, saindo && { opacity: 0.7 }]}
              >
                <Text style={s.btnSairTexto}>{saindo ? 'Saindo…' : 'Sair'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'relative', zIndex: 70 },
  backdrop: { top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 } as any,
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: CORES.primaria,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    zIndex: 2,
  },
  avatarHover: { backgroundColor: CORES.mintDeep },
  avatarAberto: { borderColor: CORES.destaque },
  avatarGrande: { width: 46, height: 46, borderRadius: 23 },
  avatarTexto: { color: '#fff', fontSize: 13.5, fontWeight: '800', letterSpacing: 0.3 },
  menu: {
    position: 'absolute',
    top: 46,
    right: 0,
    width: 280,
    backgroundColor: CORES.fundoCard,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 14,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    zIndex: 3,
  },
  dados: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 },
  nome: { fontSize: 14.5, fontWeight: '700', color: CORES.texto },
  email: { fontSize: 12.5, color: CORES.textoSecundario, marginTop: 1 },
  perfil: { fontSize: 11.5, fontWeight: '700', color: CORES.mintDeep, marginTop: 4 },
  divisor: { height: 1, backgroundColor: CORES.borda, marginVertical: 6 },
  sair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
  },
  sairHover: { backgroundColor: CORES.alertaBg },
  sairTexto: { fontSize: 14, fontWeight: '700', color: CORES.alerta },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(10,34,24,0.55)',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: CORES.fundoCard,
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
  },
  cardIcone: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: CORES.alertaBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  cardTitulo: { fontSize: 18, fontWeight: '800', color: CORES.texto },
  cardTexto: { fontSize: 14, color: CORES.textoSecundario, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  cardAcoes: { flexDirection: 'row', gap: 10, marginTop: 22, width: '100%' },
  btn: { flex: 1, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnCancelar: { backgroundColor: CORES.fundoCard, borderWidth: 1, borderColor: CORES.borda },
  btnCancelarHover: { backgroundColor: CORES.fundo },
  btnCancelarTexto: { fontSize: 14, fontWeight: '700', color: CORES.texto },
  btnSair: { backgroundColor: CORES.alerta },
  btnSairHover: { backgroundColor: '#c82333' },
  btnSairTexto: { fontSize: 14, fontWeight: '700', color: '#fff' },
});