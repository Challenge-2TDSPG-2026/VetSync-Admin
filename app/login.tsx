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
import { useIsDesktop } from '../hooks/useIsDesktop';

const logo = require('../assets/logo.png');

export default function LoginScreen() {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const isDesktop = useIsDesktop();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [autenticando, setAutenticando] = useState(false);

  async function handleSubmit() {
    // Evita envio duplicado (clique no botão + Enter) enquanto a API responde.
    if (autenticando) return;
    setErro(null);
    setAutenticando(true);
    try {
      await login(email, senha);
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não foi possível entrar. Tente novamente.'));
      setSenha('');
    } finally {
      setAutenticando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[s.flex, isDesktop && s.row]} keyboardShouldPersistTaps="handled">
        <LinearGradient
          colors={[CORES.forest, CORES.night]}
          style={[s.hero, isDesktop ? s.heroDesktop : { paddingTop: insets.top + 40 }]}
        >
          <View style={[s.ring, { width: 260, height: 260, top: -80, left: -80 }]} />
          <View style={[s.ring, { width: 170, height: 170, bottom: -50, right: -40 }]} />
          <Image source={logo} style={[s.logo, isDesktop && s.logoDesktop]} resizeMode="contain" />
          <Text style={[s.marca, isDesktop && s.marcaDesktop]}>VetSync-Admin</Text>
          <Text style={[s.heroSub, isDesktop && s.heroSubDesktop]}>
            Aprovação de prescrições, liberação de pontos e cadastro da equipe clínica.
          </Text>
        </LinearGradient>

        <View style={[s.formArea, isDesktop && s.formAreaDesktop]}>
          <View style={s.formInner}>
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
              editable={!autenticando}
              style={autenticando && s.inputTravado}
            />
            <Field
              label="Senha"
              value={senha}
              onChangeText={setSenha}
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
              onSubmitEditing={handleSubmit}
              editable={!autenticando}
              style={autenticando && s.inputTravado}
            />

            <Button label={autenticando ? 'Entrando…' : 'Entrar'} onPress={handleSubmit} loading={autenticando} style={s.btn} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flexGrow: 1, backgroundColor: CORES.fundo },
  row: { flexDirection: 'row' },
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
  // Campo travado enquanto a API responde.
  inputTravado: { opacity: 0.55, backgroundColor: CORES.fundoSutil },

  // Desktop: hero à esquerda, formulário centralizado à direita.
  heroDesktop: { flex: 1, justifyContent: 'center', paddingHorizontal: 64, paddingVertical: 48 },
  logoDesktop: { width: 120, height: 120, marginBottom: 24 },
  marcaDesktop: { fontSize: 38 },
  heroSubDesktop: { fontSize: 16, lineHeight: 24, maxWidth: 400, marginTop: 12 },
  formAreaDesktop: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 48, paddingTop: 48, paddingBottom: 48 },
  // Limita a largura do formulário em telas largas (desktop e tablet).
  formInner: { width: '100%', maxWidth: 420, alignSelf: 'center' },
});