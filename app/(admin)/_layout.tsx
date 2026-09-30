import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { CORES } from '../../constants/theme';
import { HeaderLogoutButton } from '../../components/HeaderLogoutButton';
import { Sidebar, Topbar } from '../../components/DesktopShell';
import { useIsDesktop } from '../../hooks/useIsDesktop';

export default function AdminLayout() {
  const isDesktop = useIsDesktop();

  return (
    <View style={s.root}>
      {isDesktop && <Sidebar />}
      <View style={s.main}>
        {isDesktop && <Topbar />}
        <Stack
          screenOptions={{
            // No desktop o título fica na Topbar; no mobile segue o header nativo.
            headerShown: !isDesktop,
            headerStyle: { backgroundColor: CORES.primaria },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '700' },
            headerShadowVisible: false,
            headerRight: () => <HeaderLogoutButton />,
            contentStyle: { backgroundColor: CORES.fundo },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'VetSync-Admin' }} />
          <Stack.Screen name="prescricoes" options={{ title: 'Prescrições' }} />
          <Stack.Screen name="relatorios-estetica" options={{ title: 'Relatórios de estética' }} />
          <Stack.Screen name="pontos" options={{ title: 'Pontos' }} />
          <Stack.Screen name="veterinarios" options={{ title: 'Veterinários' }} />
          <Stack.Screen name="estetica" options={{ title: 'Estética' }} />
          <Stack.Screen name="medicamentos" options={{ title: 'Medicamentos' }} />
          <Stack.Screen name="recompensas" options={{ title: 'Recompensas' }} />
          <Stack.Screen name="tipos-evento" options={{ title: 'Tipos de evento' }} />
          <Stack.Screen name="tipos-vacina" options={{ title: 'Tipos de vacina' }} />
          <Stack.Screen name="buscar-pet" options={{ title: 'Buscar pet' }} />
          <Stack.Screen name="auditoria" options={{ title: 'Auditoria' }} />
          <Stack.Screen name="administradores" options={{ title: 'Administradores' }} />
        </Stack>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: CORES.fundo },
  main: { flex: 1, minWidth: 0 },
});