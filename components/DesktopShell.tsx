import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { CORES } from '../constants/theme';
import { AppIcon } from './AppIcon';
import { Aparecer } from './ui/Aparecer';
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

/** Barra superior com o título da página atual centralizado. */
export function Topbar() {
  const pathname = usePathname();
  const ativa = rotaAtual(pathname);
  const titulo = TODOS_OS_ITENS.find((i) => i.route === ativa)?.label ?? 'Agenda';

  return (
    <View style={s.topbar}>
      <Aparecer key={titulo} distancia={6} duracao={240}>
        <Text style={s.topbarTitle}>{titulo}</Text>
      </Aparecer>
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
    backgroundColor: CORES.fundoCard,
    borderBottomWidth: 1,
    borderBottomColor: CORES.borda,
  },
  topbarTitle: { fontSize: 15, fontWeight: '700', color: CORES.texto },
});