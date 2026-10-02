import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { CORES } from '../../constants/theme';
import { transicao } from '../../utils/animacao';

type Variant = 'primary' | 'ghost' | 'approve' | 'deny' | 'dangerText';
type Size = 'md' | 'sm';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, variant = 'primary', size = 'md', loading, disabled, style }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={(st: any) => [
        s.base,
        transicao(),
        size === 'sm' && s.sm,
        VARIANT_STYLE[variant],
        isDisabled && s.disabled,
        st.hovered && !isDisabled && s.hover,
        st.pressed && !isDisabled && s.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? '#fff' : CORES.primaria} />
      ) : (
        <Text style={[s.label, size === 'sm' && s.labelSm, VARIANT_LABEL[variant]]}>{label}</Text>
      )}
    </Pressable>
  );
}

const VARIANT_STYLE: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: CORES.secundaria, shadowColor: CORES.secundaria, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  ghost: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: CORES.borda },
  approve: { backgroundColor: CORES.successBg },
  deny: { backgroundColor: CORES.alertaBg },
  dangerText: { backgroundColor: 'transparent', paddingHorizontal: 8 },
};

const VARIANT_LABEL: Record<Variant, { color: string }> = {
  primary: { color: '#fff' },
  ghost: { color: CORES.texto },
  approve: { color: CORES.success },
  deny: { color: CORES.alerta },
  dangerText: { color: CORES.alerta },
};

const s = StyleSheet.create({
  base: {
    borderRadius: 999,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm: { paddingVertical: 9, paddingHorizontal: 14 },
  disabled: { opacity: 0.5 },
  hover: { transform: [{ translateY: -2 }], opacity: 0.94 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  label: { fontSize: 14.5, fontWeight: '700' },
  labelSm: { fontSize: 12.8 },
});