import { useCallback, useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import type { Clinica } from '../types';
import { mensagemDeErro } from '../utils/erro';

/**
 * Carrega as clínicas cadastradas na API (GET /vinculos-clinica/clinicas).
 * Use em qualquer tela que precise escolher uma clínica pelo nome.
 */
export function useClinicas() {
  const [clinicas, setClinicas] = useState<Clinica[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setErro(null);
    try {
      setClinicas(await adminService.listarClinicas());
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não foi possível carregar as clínicas.'));
      setClinicas((atual) => atual ?? []);
    }
  }, []);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  return { clinicas, carregando: clinicas === null, erro, recarregar };
}