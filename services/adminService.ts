import { Platform } from 'react-native';
import { api, uploadNativo } from './api/httpClient';
import { anexarImagem } from '../utils/imagem';
import type {
  AdminCriado,
  AtendimentoDia,
  Clinica,
  ClinicaApi,
  CodigoVinculoClinica,
  ExclusaoRecompensa,
  FiltroAuditoria,
  FiltroPontos,
  IdClinicaFiltro,
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
  ResumoPainel,
  SaldoPontosClinica,
  TiposAuditoria,
  TipoEvento,
  TipoVacina,
  Veterinario,
} from '../types';

type ValorQuery = string | number | boolean | null | undefined;

/** Monta "?a=1&b=2" ignorando valores vazios. Devolve "" quando não sobra nenhum parâmetro. */
function montarQuery(params: Record<string, ValorQuery>): string {
  const partes = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return partes.length ? `?${partes.join('&')}` : '';
}

/**
 * Filtro LOCAL por clínica, só para endpoints que a API ainda não filtra no servidor
 * (prescrições, relatórios, veterinários e profissionais de estética). Serve para navegação:
 * a API continua devolvendo, e autorizando, tudo a que o admin tem direito.
 */
function filtrarPorClinicaLocal<T extends { idClinica?: number | null }>(lista: T[], idClinica: IdClinicaFiltro): T[] {
  return idClinica ? lista.filter((item) => item.idClinica === idClinica) : lista;
}

async function montarFormRecompensa(p: RecompensaPayload): Promise<FormData> {
  const form = new FormData();
  form.append('nome', p.nome.trim());
  form.append('descricao', p.descricao.trim());
  form.append('custoPontos', String(p.custoPontos));
  form.append('tipo', p.tipo);
  form.append('idClinica', String(p.idClinica));
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
      idClinica: String(p.idClinica),
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

/**
 * Adequa a clínica recebida da API. O contrato só é considerado ativo quando a API
 * confirma; qualquer ausência de informação conta como inativo (clínica nova).
 */
function normalizarClinica(c: ClinicaApi): Clinica {
  const contratoAtivo = c.contratanteAtiva === true || (c.contratanteAtiva === undefined && c.statusContrato === 'ATIVO');
  return {
    idClinica: c.idClinica,
    nomeClinica: c.nomeClinica,
    contratoAtivo,
    statusContrato: contratoAtivo ? 'ATIVO' : 'INATIVO',
    codigoAtivo: c.codigoAtivo === true,
    codigoEmitidoEm: c.codigoEmitidoEm ?? null,
  };
}

export const adminService = {
  // ---- Administradores ----
  criarAdmin(nome: string, email: string) {
    return api.post<AdminCriado>('/admins', { nome, email });
  },
  // ---- Vínculo de clínica ----
  async listarClinicas(): Promise<Clinica[]> {
    const lista = await api.get<ClinicaApi[]>('/vinculos-clinica/clinicas');
    return lista.map(normalizarClinica);
  },
  alterarContratoClinica(idClinica: number, ativo: boolean) {
    return api.patch<void>(`/vinculos-clinica/clinicas/${idClinica}/contrato`, { ativo });
  },
  emitirCodigoVinculoClinica(idClinica: number) {
    // Sem corpo: o código é criado exclusivamente pela API para a clínica informada.
    return api.post<CodigoVinculoClinica>(`/vinculos-clinica/clinicas/${idClinica}/codigo`);
  },
  /** Revoga o código vigente (DELETE). Tutores já vinculados continuam vinculados. */
  revogarCodigoVinculoClinica(idClinica: number) {
    return api.delete<void>(`/vinculos-clinica/clinicas/${idClinica}/codigo`);
  },


  // ---- Veterinários ----
  /** A API não filtra por clínica aqui: com idClinica o filtro é local. */
  async listarVeterinarios(idClinica?: IdClinicaFiltro) {
    return filtrarPorClinicaLocal(await api.get<Veterinario[]>('/veterinarios'), idClinica);
  },
  criarVeterinario(nome: string, email: string, idClinica: number, especialidade?: string) {
    return api.post<NovoUsuarioResposta>('/veterinarios', {
      nome,
      email,
      idClinica,
      ...(especialidade?.trim() ? { especialidade: especialidade.trim() } : {}),
    });
  },

  atualizarVeterinario(id: number, nome: string, idClinica: number, especialidade?: string) {
    return api.put<Veterinario>(`/veterinarios/${id}`, {
      nome,
      idClinica,
      ...(especialidade?.trim() ? { especialidade: especialidade.trim() } : {}),
    });
  },

  // ---- Profissionais de estética ----
  /** A API não filtra por clínica aqui: com idClinica o filtro é local. */
  async listarProfissionaisEstetica(idClinica?: IdClinicaFiltro) {
    return filtrarPorClinicaLocal(await api.get<ProfissionalEstetica[]>('/profissionais-estetica'), idClinica);
  },
  criarProfissionalEstetica(nome: string, email: string, idClinica: number) {
    return api.post<NovoUsuarioResposta>('/profissionais-estetica', { nome, email, idClinica });
  },

  atualizarProfissionalEstetica(id: number, nome: string, idClinica: number) {
    return api.put<ProfissionalEstetica>(`/profissionais-estetica/${id}`, { nome, idClinica });
  },

  // ---- Prescrições ----
  /** A API não filtra por clínica aqui: com idClinica o filtro é local. */
  async listarPrescricoesPendentes(idClinica?: IdClinicaFiltro) {
    return filtrarPorClinicaLocal(await api.get<Prescricao[]>('/prescricoes'), idClinica);
  },
  /** O corpo só tem `aprovado`: a API decide pela própria prescrição, não por uma clínica enviada pela tela. */
  liberarPrescricao(id: number, aprovado: boolean) {
    return api.patch(`/prescricoes/${id}/liberar`, { aprovado });
  },

  // ---- Relatórios de estética ----
  /** A API não filtra por clínica aqui: com idClinica o filtro é local. */
  async listarRelatoriosPendentes(idClinica?: IdClinicaFiltro) {
    return filtrarPorClinicaLocal(await api.get<RelatorioEstetica[]>('/relatorios-estetica'), idClinica);
  },
  /** O corpo só tem `aprovado`: a API decide pelo próprio relatório, não por uma clínica enviada pela tela. */
  liberarRelatorio(id: number, aprovado: boolean) {
    return api.patch(`/relatorios-estetica/${id}/liberar`, { aprovado });
  },

  // ---- Pontos ----
  /** Filtros aplicados no servidor (?idClinica=, ?status=, ?idTutor=). */
  listarPontos(filtro: FiltroPontos = {}) {
    return api.get<LancamentoPontos[]>(
      `/pontos${montarQuery({ idClinica: filtro.idClinica, status: filtro.status, idTutor: filtro.idTutor })}`
    );
  },
  /** Fila de liberação: só lançamentos PENDENTE (da clínica escolhida, se houver). */
  listarPontosPendentes(idClinica?: IdClinicaFiltro): Promise<LancamentoPontos[]> {
    return adminService.listarPontos({ status: 'PENDENTE', idClinica });
  },
  /** Um saldo por par tutor/clínica; pontos de clínicas diferentes nunca são somados. */
  listarSaldosPontos(filtro: { idClinica?: IdClinicaFiltro; idTutor?: number | null } = {}) {
    return api.get<SaldoPontosClinica[]>(
      `/pontos/saldos${montarQuery({ idClinica: filtro.idClinica, idTutor: filtro.idTutor })}`
    );
  },
  /** idClinica é obrigatório e precisa ser a clínica do lançamento: a API devolve 404 caso contrário. */
  liberarPontos(id: number, idClinica: number) {
    return api.patch<LancamentoPontos>(`/pontos/${id}/liberar${montarQuery({ idClinica })}`);
  },
  bloquearPontos(id: number, idClinica: number, motivo: string) {
    return api.patch<LancamentoPontos>(`/pontos/${id}/bloquear${montarQuery({ idClinica })}`, { motivo: motivo.trim() });
  },
  desbloquearPontos(id: number, idClinica: number) {
    return api.patch<LancamentoPontos>(`/pontos/${id}/desbloquear${montarQuery({ idClinica })}`);
  },

  // ---- Medicamentos ----
  listarMedicamentos(idClinica?: IdClinicaFiltro) {
    return api.get<Medicamento[]>(`/medicamentos${montarQuery({ idClinica })}`);
  },
  criarMedicamento(nmMedicamento: string, dsPrincipio: string, vlPrecoRef: string, idClinica: number) {
    return api.post<Medicamento>('/medicamentos', {
      idClinica,
      nmMedicamento,
      dsPrincipio: dsPrincipio || null,
      vlPrecoRef: vlPrecoRef === '' ? null : Number(vlPrecoRef),
    });
  },
  atualizarMedicamento(id: number, nmMedicamento: string, dsPrincipio: string, vlPrecoRef: string, idClinica: number) {
    return api.put<Medicamento>(`/medicamentos/${id}`, {
      idClinica,
      nmMedicamento,
      dsPrincipio: dsPrincipio || null,
      vlPrecoRef: vlPrecoRef === '' ? null : Number(vlPrecoRef),
    });
  },
  removerMedicamento(id: number, idClinica: number) {
    return api.delete(`/medicamentos/${id}${montarQuery({ idClinica })}`);
  },

  // ---- Recompensas (multipart) ----
  /**
   * Catálogo completo (inclui inativas), GET /recompensas/todas.
   * - `idClinica`: a API devolve só as recompensas daquela clínica.
   * - `semClinica`: só os itens legados sem clínica (têm de ser editados para receber uma).
   * Sem filtros, devolve todas. `semClinica` tem prioridade sobre `idClinica`.
   */
  listarRecompensas(idClinica?: IdClinicaFiltro, semClinica = false) {
    return api.get<Recompensa[]>(
      `/recompensas/todas${montarQuery(semClinica ? { semClinica: true } : { idClinica })}`
    );
  },
  criarRecompensa(payload: RecompensaPayload) {
    return enviarRecompensa('POST', '/recompensas', payload);
  },
  atualizarRecompensa(id: number, payload: RecompensaPayload) {
    return enviarRecompensa('PUT', `/recompensas/${id}`, payload);
  },
  /** idClinica é obrigatório e precisa ser a clínica da recompensa (a API recusa se não for). */
  removerRecompensa(id: number, idClinica: number) {
    return api.delete<ExclusaoRecompensa>(`/recompensas/${id}${montarQuery({ idClinica })}`);
  },

  // ---- Pets ----
  buscarPetPorNumero(numero: string) {
    return api.get<Pet>(`/pets/buscar?numero=${encodeURIComponent(numero)}`);
  },

  // ---- Tipos de vacina (só criação: a API não tem GET) ----
  criarTipoVacina(nome: string, periodicidadeDias: number, idClinica: number) {
    return api.post<TipoVacina>('/pets/tipos-vacina', { nome: nome.trim(), periodicidadeDias, idClinica });
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
  /** Filtros aplicados no servidor. Datas "YYYY-MM-DD". Só ADMIN usa todos os filtros. */
  listarAuditoria(filtro: FiltroAuditoria = {}) {
    return api.get<RegistroAuditoria[]>(
      `/auditoria${montarQuery({
        idClinica: filtro.idClinica,
        entidade: filtro.entidade,
        entidadeId: filtro.entidadeId,
        acao: filtro.acao,
        de: filtro.de,
        ate: filtro.ate,
        limite: filtro.limite,
      })}`
    );
  },
  /** Entidades e ações vigentes, para montar os filtros da tela. */
  listarTiposAuditoria() {
    return api.get<TiposAuditoria>('/auditoria/tipos');
  },

  // ---- Painel inicial ----
  /**
   * Indicadores de pontos e recompensas. Com idClinica: só daquela clínica (escopo CLINICA).
   * Sem: totais de todas as clínicas (escopo GLOBAL, com `rotuloEscopo` pronto para exibir).
   */
  obterResumoPainel(idClinica?: IdClinicaFiltro) {
    return api.get<ResumoPainel>(`/painel/resumo${montarQuery({ idClinica })}`);
  },
};