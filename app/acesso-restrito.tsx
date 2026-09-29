import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { CORES } from '../constants/theme';
import { Button } from '../components/ui/Button';
import { AppIcon } from '../components/AppIcon';

export default function AcessoRestrito() {
  const { sessao, logout } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.container, { paddingTop: insets.top + 40 }]}>
      <View style={s.orb}>
        <AppIcon name="lock-closed" size={30} color={CORES.alerta} />
      </View>
      <Text style={s.title}>Acesso restrito</Text>
      <Text style={s.desc}>
        Este app é exclusivo para o perfil ADMIN. Você está autenticado como{' '}
        <Text style={{ fontWeight: '800' }}>{sessao?.perfil}</Text>.
      </Text>
      <Button label="Sair" variant="ghost" onPress={logout} style={{ marginTop: 24 }} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.fundo, alignItems: 'center', paddingHorizontal: 30 },
  orb: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: CORES.alertaBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: { fontSize: 20, fontWeight: '800', color: CORES.texto, marginBottom: 8 },
  desc: { fontSize: 13.5, color: CORES.textoSecundario, textAlign: 'center', lineHeight: 20 },
});
