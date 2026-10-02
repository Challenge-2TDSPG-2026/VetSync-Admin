import React, { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { CORES } from '../constants/theme';
import { AppIcon } from './AppIcon';
import { transicao } from '../utils/animacao';

const logo = require('../assets/logo.png');

type IconName = React.ComponentProps<typeof AppIcon>['name'];

export interface NavItem {
  href: string;
  /** Segmento da rota, usado para marcar o item ativo e achar o título. */
  route: string;
  icon: IconName;
  label: string;
}

export interface NavGroup {
  titulo?: string;
  itens: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    itens: [{ href: '/(admin)', route: '', icon: 'grid-outline', label: 'Agenda' }],
  },
  {
    titulo: 'Filas de aprovação',
    itens: [
      { href: '/(admin)/prescricoes', route: 'prescricoes', icon: 'medkit-outline', label: 'Prescrições' },
      { href: '/(admin)/relatorios-estetica', route: 'relatorios-estetica', icon: 'document-text-outline', label: 'Relatórios de estética' },
      { href: '/(admin)/pontos', route: 'pontos', icon: 'sparkles-outline', label: 'Pontos' },
    ],
  },
  {
    titulo: 'Equipe',
    itens: [
      { href: '/(admin)/veterinarios', route: 'veterinarios', icon: 'medical-outline', label: 'Veterinários' },
      { href: '/(admin)/estetica', route: 'estetica', icon: 'cut-outline', label: 'Estética' },
      { href: '/(admin)/vinculo-clinica', route: 'vinculo-clinica', icon: 'qr-code-outline', label: 'Vínculo da clínica' },
      { href: '/(admin)/administradores', route: 'administradores', icon: 'shield-checkmark-outline', label: 'Administradores' },
    ],
  },
  {
    titulo: 'Catálogos',
    itens: [
      { href: '/(admin)/medicamentos', route: 'medicamentos', icon: 'flask-outline', label: 'Medicamentos' },
      { href: '/(admin)/recompensas', route: 'recompensas', icon: 'gift-outline', label: 'Programa Fidelidade' },
      // Temporariamente oculto: { href: '/(admin)/tipos-evento', route: 'tipos-evento', icon: 'list-outline', label: 'Tipos de evento' },
      { href: '/(admin)/tipos-vacina', route: 'tipos-vacina', icon: 'bandage-outline', label: 'Tipos de vacina' },
    ],
  },
  {
    titulo: 'Buscar',
    itens: [
      { href: '/(admin)/buscar-pet', route: 'buscar-pet', icon: 'search-outline', label: 'Buscar pet' },
      // Temporariamente oculto: { href: '/(admin)/auditoria', route: 'auditoria', icon: 'time-outline', label: 'Auditoria' },
    ],
  },
];

const TODOS_OS_ITENS = NAV_GROUPS.flatMap((g) => g.itens);

function rotaAtual(pathname: string): string {
  return pathname.replace(/^\/+/, '').split('/')[0] ?? '';
}

/** Barra lateral fixa (estilo dashboard), exibida só no desktop web. */
export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { sessao, logout } = useAuth();
  const ativa = rotaAtual(pathname);

  return (
    <View style={s.sidebar}>
      <View style={s.brand}>
        <Image source={logo} style={s.brandLogo} resizeMode="contain" />
        <Text style={s.brandName}>VetSync Admin</Text>
      </View>

      <ScrollView style={s.navScroll} contentContainerStyle={s.navContent} showsVerticalScrollIndicator={false}>
        {NAV_GROUPS.map((grupo, i) => (
          <View key={grupo.titulo ?? `g${i}`} style={s.group}>
            {grupo.titulo ? <Text style={s.groupTitle}>{grupo.titulo}</Text> : null}
            {grupo.itens.map((item) => {
              const isAtivo = item.route === ativa;
              return (
                <Pressable
                  key={item.href}
                  onPress={() => router.push(item.href as any)}
                  style={(st: any) => [
                    s.navItem,
                    transicao(),
                    isAtivo && s.navItemActive,
                    st.hovered && !isAtivo && s.navItemHover,
                    st.pressed && !isAtivo && s.navItemPressed,
                  ]}
                >
                  <AppIcon name={item.icon} size={19} color={isAtivo ? '#fff' : CORES.mintPale} />
                  <Text style={[s.navLabel, isAtivo && s.navLabelActive]} numberOfLines={1}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={s.userBox}>
        <View style={{ flex: 1 }}>
          <Text style={s.userName} numberOfLines={1}>{sessao?.nome ?? 'Administrador'}</Text>
          <Text style={s.userRole} numberOfLines={1}>{sessao?.email ?? 'ADMIN'}</Text>
        </View>
        <Pressable onPress={logout} hitSlop={10} style={(st: any) => [s.logoutBtn, transicao(), st.hovered && s.logoutHover, st.pressed && { opacity: 0.6 }]}>
          <AppIcon name="log-out-outline" size={20} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/** Barra superior com busca: digite o nome de uma página ou o número de um pet (1 a 4 dígitos). */
export function Topbar() {
  const router = useRouter();
  const [termo, setTermo] = useState('');
  const [aberto, setAberto] = useState(false);
  const fecharTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const q = normalizar(termo);
  const apenasNumero = /^\d{1,4}$/.test(q);
  const paginas = q && !apenasNumero ? TODOS_OS_ITENS.filter((i) => normalizar(i.label).includes(q)) : [];
  const temResultados = apenasNumero || paginas.length > 0;

  function limpar() {
    setTermo('');
    setAberto(false);
  }

  function irParaPagina(href: string) {
    router.push(href as any);
    limpar();
  }

  function buscarPet(numero: string) {
    router.push({ pathname: '/(admin)/buscar-pet', params: { numero } } as any);
    limpar();
  }

  function enviar() {
    if (apenasNumero) buscarPet(q);
    else if (paginas.length > 0) irParaPagina(paginas[0].href);
  }

  return (
    <View style={s.topbar}>
      <View style={s.searchWrap}>
        <View style={[s.searchBox, aberto && s.searchBoxFocus]}>
          <AppIcon name="search-outline" size={18} color={CORES.textoSecundario} />
          <TextInput
            value={termo}
            onChangeText={(v) => {
              setTermo(v);
              setAberto(true);
            }}
            onFocus={() => {
              if (fecharTimer.current) clearTimeout(fecharTimer.current);
              setAberto(true);
            }}
            // Pequeno atraso para o clique em um resultado acontecer antes de fechar a lista.
            onBlur={() => {
              fecharTimer.current = setTimeout(() => setAberto(false), 150);
            }}
            onSubmitEditing={enviar}
            placeholder="Buscar páginas ou pet pelo número…"
            placeholderTextColor={CORES.textoSecundario}
            returnKeyType="search"
            style={[s.searchInput, { outlineStyle: 'none' } as any]}
          />
          {termo ? (
            <Pressable onPress={limpar} hitSlop={8}>
              <AppIcon name="close" size={16} color={CORES.textoSecundario} />
            </Pressable>
          ) : null}
        </View>

        {aberto && q ? (
          <View style={s.results}>
            {apenasNumero && (
              <Pressable
                onPress={() => buscarPet(q)}
                style={(st: any) => [s.resultItem, st.hovered && s.resultItemHover]}
              >
                <AppIcon name="search-outline" size={17} color={CORES.primaria} />
                <Text style={s.resultText}>Buscar pet nº {q}</Text>
              </Pressable>
            )}
            {paginas.map((item) => (
              <Pressable
                key={item.href}
                onPress={() => irParaPagina(item.href)}
                style={(st: any) => [s.resultItem, st.hovered && s.resultItemHover]}
              >
                <AppIcon name={item.icon} size={17} color={CORES.primaria} />
                <Text style={s.resultText}>{item.label}</Text>
              </Pressable>
            ))}
            {!temResultados && <Text style={s.resultEmpty}>Nenhum resultado para “{termo}”.</Text>}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  sidebar: {
    width: 260,
    backgroundColor: CORES.primaria,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.06)',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 22,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  brandLogo: { width: 38, height: 38 },
  brandName: { fontSize: 19, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  navScroll: { flex: 1 },
  navContent: { paddingHorizontal: 12, paddingVertical: 14 },
  group: { marginBottom: 14 },
  groupTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: CORES.destaque,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 2,
  },
  navItemActive: { backgroundColor: CORES.mintDeep },
  navItemHover: { backgroundColor: 'rgba(255,255,255,0.1)', transform: [{ translateX: 3 }] },
  navItemPressed: { backgroundColor: 'rgba(255,255,255,0.16)' },
  navLabel: { fontSize: 14, fontWeight: '600', color: CORES.mintPale, flexShrink: 1 },
  navLabelActive: { color: '#fff', fontWeight: '700' },
  userBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  userName: { fontSize: 13.5, fontWeight: '700', color: '#fff' },
  userRole: { fontSize: 11.5, color: CORES.mintPale, marginTop: 1 },
  logoutBtn: { padding: 6, borderRadius: 8 },
  logoutHover: { backgroundColor: 'rgba(255,255,255,0.12)', transform: [{ scale: 1.1 }] },
  topbar: {
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: CORES.fundoCard,
    borderBottomWidth: 1,
    borderBottomColor: CORES.borda,
    // Mantém a lista de resultados por cima do conteúdo da página.
    zIndex: 50,
  },
  searchWrap: { width: '100%', maxWidth: 520, position: 'relative' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: CORES.borda,
    backgroundColor: CORES.fundo,
  },
  searchBoxFocus: { borderColor: CORES.primaria, backgroundColor: CORES.fundoCard },
  searchInput: { flex: 1, fontSize: 14, color: CORES.texto, paddingVertical: 0 },
  results: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    backgroundColor: CORES.fundoCard,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderRadius: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 60,
  },
  resultItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  resultItemHover: { backgroundColor: CORES.fundo },
  resultText: { fontSize: 14, color: CORES.texto, fontWeight: '600' },
  resultEmpty: { fontSize: 13, color: CORES.textoSecundario, paddingHorizontal: 14, paddingVertical: 10 },
});