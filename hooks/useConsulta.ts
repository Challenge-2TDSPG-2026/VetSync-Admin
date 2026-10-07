import { useCallback, useEffect, useRef, useState } from 'react';
import { mensagemDeErro } from '../utils/erro';

/**
 * Consulta à API com estados explícitos de carregamento e erro, própria para listas que mudam com filtros
 * (por exemplo, a clínica escolhida).
 *
 * - Ao trocar o filtro (muda a identidade de `buscar`), a lista anterior é descartada e `carregando` volta a true,
 *   para a tela nunca mostrar dados de uma clínica sob o filtro de outra.
 * - Respostas fora de ordem são ignoradas: só vale a da consulta mais recente.
 * - Em erro, `dados` fica null e `erro` traz a mensagem; `recarregar` tenta de novo.
 *
 * `buscar` precisa ser estável (useCallback) e incluir o filtro nas dependências.
 */
export function useConsulta<T>(buscar: () => Promise<T>, mensagemPadrao?: string) {
  const [dados, setDados] = useState<T | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const ultima = useRef(0);

  const recarregar = useCallback(
    async (opcoes?: { manterDados?: boolean }) => {
      const id = ++ultima.current;
      setErro(null);
      if (!opcoes?.manterDados) {
        setDados(null);
        setCarregando(true);
      }
      try {
        const resultado = await buscar();
        if (id === ultima.current) setDados(resultado);
      } catch (e) {
        if (id === ultima.current) {
          setDados(null);
          setErro(mensagemDeErro(e, mensagemPadrao));
        }
      } finally {
        if (id === ultima.current) setCarregando(false);
      }
    },
    [buscar, mensagemPadrao]
  );

  useEffect(() => {
    void recarregar();
    return () => {
      // Invalida a consulta em andamento ao trocar de filtro ou sair da tela.
      ultima.current++;
    };
  }, [recarregar]);

  return { dados, setDados, carregando, erro, recarregar };
}