import React, { useEffect } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ToastHost } from '../components/ui/Toast';
import { CORES } from '../constants/theme';

function RootNavigator() {
  const { sessao, autenticado, carregando } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  const isAdmin = autenticado && sessao?.perfil === 'ADMIN';
  const isOutroPerfil = autenticado && sessao?.perfil !== 'ADMIN';

  useEffect(() => {
    if (carregando) return;

    const inLogin = segments.includes('login');
    const inAdmin = segments.includes('(admin)');
    const inRestrito = segments.includes('acesso-restrito');

    if (!autenticado) {
      if (!inLogin) router.replace('/login');
      return;
    }
    if (!isAdmin) {
      if (!inRestrito) router.replace('/acesso-restrito');
      return;
    }
    if (!inAdmin) router.replace('/(admin)');
  }, [autenticado, isAdmin, carregando, segments]);

  return (
    <>
      {/* Stack.Protected desmonta as rotas sem permissão: o (admin) NUNCA monta sem sessão ADMIN. */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!carregando && !autenticado}>
          <Stack.Screen name="login" />
        </Stack.Protected>
        <Stack.Protected guard={!carregando && isOutroPerfil}>
          <Stack.Screen name="acesso-restrito" />
        </Stack.Protected>
        <Stack.Protected guard={!carregando && isAdmin}>
          <Stack.Screen name="(admin)" />
        </Stack.Protected>
      </Stack>

      {/* Cobre a tela enquanto a sessão é restaurada (evita flash de qualquer rota). */}
      {carregando && (
        <View style={s.loading}>
          <ActivityIndicator size="large" color={CORES.primaria} />
        </View>
      )}
    </>
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

const s = StyleSheet.create({
  loading: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CORES.fundo,
  },
});