import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { mensagemDeErro } from '../utils/erro';
import { CORES } from '../constants/theme';
import { Banner, Field } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const logo = require('../assets/logo.png');

export default function LoginScreen() {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [autenticando, setAutenticando] = useState(false);

  async function handleSubmit() {
    setErro(null);
    setAutenticando(true);
    try {
      await login(email, senha);
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não foi possível entrar. Tente novamente.'));
    } finally {
      setAutenticando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.flex} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={[CORES.forest, CORES.night]} style={[s.hero, { paddingTop: insets.top + 40 }]}>
          <View style={[s.ring, { width: 260, height: 260, top: -80, left: -80 }]} />
          <View style={[s.ring, { width: 170, height: 170, bottom: -50, right: -40 }]} />
          <Image source={logo} style={s.logo} resizeMode="contain" />
          <Text style={s.marca}>VetSync-Admin</Text>
          <Text style={s.heroSub}>
            Aprovação de prescrições, liberação de pontos e cadastro da equipe clínica.
          </Text>
        </LinearGradient>

        <View style={s.formArea}>
          <Text style={s.formTitle}>Entrar</Text>
          <Text style={s.formSub}>Use as credenciais do seu acesso ADMIN.</Text>

          {erro && <Banner tone="error">{erro}</Banner>}

          <Field
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="admin@vetsync.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <Field
            label="Senha"
            value={senha}
            onChangeText={setSenha}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
          />

          <Button label={autenticando ? 'Entrando…' : 'Entrar'} onPress={handleSubmit} loading={autenticando} style={s.btn} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flexGrow: 1, backgroundColor: CORES.fundo },
  hero: {
    paddingHorizontal: 30,
    paddingBottom: 44,
    alignItems: 'center',
    overflow: 'hidden',
  },
  ring: { position: 'absolute', borderRadius: 999, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)' },
  logo: { width: 78, height: 78, marginBottom: 16 },
  marca: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  heroSub: { fontSize: 13.5, fontWeight: '500', color: CORES.mintPale, lineHeight: 20, maxWidth: 280, textAlign: 'center', marginTop: 8 },
  formArea: { flex: 1, paddingHorizontal: 26, paddingTop: 30, paddingBottom: 40 },
  formTitle: { fontSize: 21, fontWeight: '800', color: CORES.texto },
  formSub: { fontSize: 13, color: CORES.textoSecundario, marginTop: 4, marginBottom: 20 },
  btn: { marginTop: 6 },
});
