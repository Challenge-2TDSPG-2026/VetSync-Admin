import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { reduzirMovimento } from '../../utils/animacao';

interface Props {
  children: React.ReactNode;
  /** Atraso em ms (use índice * 40 para entrada em sequência). */
  delay?: number;
  /** Quantos px o conteúdo sobe ao aparecer. */
  distancia?: number;
  duracao?: number;
  style?: StyleProp<ViewStyle>;
}

/** Entrada suave: surge (fade) e sobe um pouco. Roda quando o componente é montado. */
export function Aparecer({ children, delay = 0, distancia = 12, duracao = 340, style }: Props) {
  const semMovimento = reduzirMovimento();
  const v = useRef(new Animated.Value(semMovimento ? 1 : 0)).current;

  useEffect(() => {
    if (semMovimento) return;
    Animated.timing(v, {
      toValue: 1,
      duration: duracao,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [v, delay, duracao, semMovimento]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distancia, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}