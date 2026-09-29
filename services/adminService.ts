import { api } from './api/httpClient';
import type {
  AdminCriado,
  LancamentoPontos,
  Medicamento,
  NovoUsuarioResposta,
  Prescricao,
  ProfissionalEstetica,
  TipoEvento,
  Veterinario,
} from '../types';

export const adminService = {
  // ---- Administradores ----
  criarAdmin(nome: string, email: string) {
    return api.post<AdminCriado>('/admins', { nome, email });
  },

  // ---- Veterinários ----
  listarVeterinarios() {
    return api.get<Veterinario[]>('/veterinarios');
  },
  criarVeterinario(nome: string, email: string, idClinica: number) {
    return api.post<NovoUsuarioResposta>('/veterinarios', { nome, email, idClinica });
  },

  // ---- Profissionais de estética ----
  listarProfissionaisEstetica() {
    return api.get<ProfissionalEstetica[]>('/profissionais-estetica');
  },
  criarProfissionalEstetica(nome: string, email: string, idClinica: number) {
    return api.post<NovoUsuarioResposta>('/profissionais-estetica', { nome, email, idClinica });
  },

  // ---- Prescrições ----
  listarPrescricoesPendentes() {
    return api.get<Prescricao[]>('/prescricoes');
  },
  liberarPrescricao(id: number, aprovado: boolean) {
    return api.patch(`/prescricoes/${id}/liberar`, { aprovado });
  },

  // ---- Pontos ----
  listarPontosPendentes() {
    return api.get<LancamentoPontos[]>('/pontos');
  },
  liberarPontos(id: number) {
    return api.patch(`/pontos/${id}/liberar`);
  },

  // ---- Medicamentos ----
  listarMedicamentos() {
    return api.get<Medicamento[]>('/medicamentos');
  },
  criarMedicamento(nmMedicamento: string, dsPrincipio: string, vlPrecoRef: string) {
    return api.post<Medicamento>('/medicamentos', {
      nmMedicamento,
      dsPrincipio: dsPrincipio || null,
      vlPrecoRef: vlPrecoRef === '' ? null : Number(vlPrecoRef),
    });
  },
  atualizarMedicamento(id: number, nmMedicamento: string, dsPrincipio: string, vlPrecoRef: string) {
    return api.put<Medicamento>(`/medicamentos/${id}`, {
      nmMedicamento,
      dsPrincipio: dsPrincipio || null,
      vlPrecoRef: vlPrecoRef === '' ? null : Number(vlPrecoRef),
    });
  },
  removerMedicamento(id: number) {
    return api.delete(`/medicamentos/${id}`);
  },

  // ---- Tipos de evento (catálogo, somente leitura) ----
  listarTiposEvento() {
    return api.get<TipoEvento[]>('/tipos-evento');
  },
};
