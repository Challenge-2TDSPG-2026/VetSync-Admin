import { Platform } from 'react-native';
import { api, uploadNativo } from './api/httpClient';
import { anexarImagem } from '../utils/imagem';
import type {
  AdminCriado,
  AtendimentoDia,
  Clinica,
  CodigoVinculoClinica,
  EntidadeAuditoria,
  ExclusaoRecompensa,
  LancamentoPontos,
  Medicamento,
  NovoUsuarioResposta,
  Pet,
  Prescricao,
  ProfissionalEstetica,
  Recompensa,
  RecompensaPayload,
  RegistroAuditoria,
  RelatorioEstetica,
  TipoEvento,
  TipoVacina,
  Veterinario,
} from '../types';

async function montarFormRecompensa(p: RecompensaPayload): Promise<FormData> {
  const form = new FormData();
  form.append('nome', p.nome.trim());
  form.append('descricao', p.descricao.trim());
  form.append('custoPontos', String(p.custoPontos));
  form.append('tipo', p.tipo);
  if (p.ativo !== undefined) form.append('ativo', String(p.ativo));
  if (p.imagem) {
    await anexarImagem(form, 'imagem', p.imagem);
  } else if (p.removerImagem) {
    form.append('removerImagem', 'true');
  }
  return form;
}

async function enviarRecompensa(metodo: 'POST' | 'PUT', path: string, p: RecompensaPayload) {
  // No celular (Android/iOS), com imagem nova: usa o uploader nativo do Expo.
  if (Platform.OS !== 'web' && p.imagem) {
    const campos: Record<string, string> = {
      nome: p.nome.trim(),
      descricao: p.descricao.trim(),
      custoPontos: String(p.custoPontos),
      tipo: p.tipo,
    };
    if (p.ativo !== undefined) campos.ativo = String(p.ativo);
    return uploadNativo<Recompensa>({ method: metodo, path, campos, arquivo: p.imagem });
  }

  // Web, ou sem imagem nova: FormData normal.
  const form = await montarFormRecompensa(p);
  return metodo === 'POST'
    ? api.postForm<Recompensa>(path, form)
    : api.putForm<Recompensa>(path, form);
}

export const adminService = {
  // ---- Administradores ----
  criarAdmin(nome: string, email: string) {
    return api.post<AdminCriado>('/admins', { nome, email });
  },
  // ---- Vínculo de clínica ----
  listarClinicas() {
    return api.get<Clinica[]>('/vinculos-clinica/clinicas');
  },
  emitirCodigoVinculoClinica(idClinica: number) {
    // Sem corpo: o código é criado exclusivamente pela API para a clínica informada.
    return api.post<CodigoVinculoClinica>(`/vinculos-clinica/clinicas/${idClinica}/codigo`);
  },


  // ---- Veterinários ----
  listarVeterinarios() {
    return api.get<Veterinario[]>('/veterinarios');
  },
  criarVeterinario(nome: string, email: string, idClinica: number, especialidade?: string) {
    return api.post<NovoUsuarioResposta>('/veterinarios', {
      nome,
      email,
      idClinica,
      ...(especialidade?.trim() ? { especialidade: especialidade.trim() } : {}),
    });
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

  // ---- Relatórios de estética ----
  listarRelatoriosPendentes() {
    return api.get<RelatorioEstetica[]>('/relatorios-estetica');
  },
  liberarRelatorio(id: number, aprovado: boolean) {
    return api.patch(`/relatorios-estetica/${id}/liberar`, { aprovado });
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

  // ---- Recompensas (multipart) ----
  listarRecompensas() {
    return api.get<Recompensa[]>('/recompensas/todas');
  },
  criarRecompensa(payload: RecompensaPayload) {
    return enviarRecompensa('POST', '/recompensas', payload);
  },
  atualizarRecompensa(id: number, payload: RecompensaPayload) {
    return enviarRecompensa('PUT', `/recompensas/${id}`, payload);
  },
  removerRecompensa(id: number) {
    return api.delete<ExclusaoRecompensa>(`/recompensas/${id}`);
  },

  // ---- Pets ----
  buscarPetPorNumero(numero: string) {
    return api.get<Pet>(`/pets/buscar?numero=${encodeURIComponent(numero)}`);
  },

  // ---- Tipos de vacina (só criação: a API não tem GET) ----
  criarTipoVacina(nome: string, periodicidadeDias: number) {
    return api.post<TipoVacina>('/pets/tipos-vacina', { nome: nome.trim(), periodicidadeDias });
  },

  // ---- Tipos de evento (catálogo, somente leitura) ----
  listarTiposEvento() {
    return api.get<TipoEvento[]>('/tipos-evento');
  },

  // ---- Agenda do dia ----
  /** @param data ISO local "YYYY-MM-DD". */
  listarAtendimentosDoDia(data: string) {
    return api.get<AtendimentoDia[]>(`/agenda/dia?data=${encodeURIComponent(data)}`);
  },

  // ---- Auditoria ----
  listarAuditoria(entidade: EntidadeAuditoria, entidadeId: number) {
    return api.get<RegistroAuditoria[]>(
      `/auditoria?entidade=${encodeURIComponent(entidade)}&entidadeId=${encodeURIComponent(String(entidadeId))}`
    );
  },
};