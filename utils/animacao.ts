import { Platform } from 'react-native';

export const ehWeb = Platform.OS === 'web';

/** true se a pessoa pediu menos movimento no sistema (acessibilidade). */
export function reduzirMovimento(): boolean {
  if (!ehWeb || typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Transição CSS suave para hover/press. Só vale na web (no celular não há mouse)
 * e some se a pessoa preferir menos movimento.
 */
export function transicao(propriedades: string = 'all', ms: number = 180): any {
  if (!ehWeb || reduzirMovimento()) return {};
  return {
    transitionProperty: propriedades,
    transitionDuration: `${ms}ms`,
    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
  };
}