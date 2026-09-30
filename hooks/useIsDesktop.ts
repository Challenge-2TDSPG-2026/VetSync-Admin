import { Platform, useWindowDimensions } from 'react-native';

/** Largura mínima (px) para exibir o layout de desktop com sidebar. */
export const BREAKPOINT_DESKTOP = 1024;

/** true somente na web com janela larga. No celular/tablet nativo segue o layout em pilha. */
export function useIsDesktop(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= BREAKPOINT_DESKTOP;
}