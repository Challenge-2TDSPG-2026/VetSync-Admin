import React, { useCallback, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AnimatedSplash } from './AnimatedSplash';

// Garante que a abertura aparece uma única vez por inicialização a frio,
// mesmo que o componente seja remontado (ex.: Fast Refresh).
let jaExibida = false;

/**
 * Monta a abertura animada por cima da navegação (que continua carregando por baixo).
 * Deve ficar DENTRO do AuthProvider. Espera a restauração da sessão terminar.
 */
export function AppSplashGate() {
  const { carregando } = useAuth();
  const [visivel, setVisivel] = useState(!jaExibida);

  const aoFinalizar = useCallback(() => {
    jaExibida = true;
    setVisivel(false);
  }, []);

  if (!visivel) return null;
  return <AnimatedSplash pronto={!carregando} onFinish={aoFinalizar} />;
}
