import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { ehWeb, transicao } from '../../utils/animacao';

interface Props {
  children: React.ReactNode | ((hovered: boolean) => React.ReactNode);
  style?: StyleProp<ViewStyle>;
  /** Estilo aplicado enquanto o mouse está em cima (só na web). */
  hoverStyle?: StyleProp<ViewStyle>;
}

/** Container que reage ao mouse com transição suave. No celular não muda nada. */
export function Hover({ children, style, hoverStyle }: Props) {
  // No celular não existe hover: usa uma View comum (não interfere na rolagem).
  if (!ehWeb) {
    return <View style={style}>{typeof children === 'function' ? children(false) : children}</View>;
  }
  return (
    <Pressable
      focusable={false}
      accessible={false}
      style={(st: any) => [style, transicao(), st.hovered && hoverStyle]}
    >
      {(st: any) => (typeof children === 'function' ? children(!!st.hovered) : children)}
    </Pressable>
  );
}