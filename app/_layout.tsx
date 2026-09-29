import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ToastHost } from '../components/ui/Toast';
import { CORES } from '../constants/theme';

function RootNavigator() {
  const { sessao, autenticado, carregando } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (carregando) return;

    const inLogin = segments.includes('login');
    const inAdmin = segments.includes('(admin)');
    const inRestrito = segments.includes('acesso-restrito');

    if (!autenticado) {
      if (!inLogin) router.replace('/login');
      return;
    }

    if (sessao?.perfil !== 'ADMIN') {
      if (!inRestrito) router.replace('/acesso-restrito');
      return;
    }

    if (!inAdmin) router.replace('/(admin)');
  }, [autenticado, sessao, carregando, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="acesso-restrito" />
      <Stack.Screen name="(admin)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={CORES.primaria} />
      <AuthProvider>
        <RootNavigator />
        <ToastHost />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
