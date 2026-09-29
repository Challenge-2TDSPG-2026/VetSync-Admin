import { Stack } from 'expo-router';
import { CORES } from '../../constants/theme';
import { HeaderLogoutButton } from '../../components/HeaderLogoutButton';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: CORES.primaria },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        headerRight: () => <HeaderLogoutButton />,
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
  );
}