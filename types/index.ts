export interface Veterinario {
  idVeterinario: number;
  nmVeterinario: string;
  nrCrmv: string;
  dsEmail: string;
  dsEspecialidade?: string | null;
  idClinica: number;
  nmClinica?: string;
}

export interface NovoUsuarioResposta {
  nome: string;
  email: string;
  crm?: string;
  registro?: string;
  senhaTemporaria: string;
}

export interface ProfissionalEstetica {
  idProfissionalEstetica: number;
  nmProfissionalEstetica: string;
  nrRegistro: string;
  dsEmail: string;
  idClinica: number;
  nmClinica?: string;
}

export interface AdminCriado {
  idAdmin: number;
  nome: string;
  email: string;
  senhaTemporaria: string;
}

export type StatusDecisao = 'SOLICITADO' | 'LIBERADO' | 'NEGADO';
/** Código legível apenas no momento da emissão; não é recuperável depois pela API. */
export interface CodigoVinculoClinica {
  idClinica: number;
  nomeClinica: string;
  codigo: string;
}

export type StatusContrato = 'ATIVO' | 'INATIVO';

/**
 * Clínica usada como filtro de uma consulta. null/undefined = todas as clínicas.
 * O filtro só serve para navegação na tela: quem decide o que o admin pode ver ou alterar é a API.
 */
export type IdClinicaFiltro = number | null | undefined;

/** Formato bruto devolvido por GET /vinculos-clinica/clinicas. */
export interface ClinicaApi {
  idClinica: number;
  nomeClinica: string;
  contratanteAtiva?: boolean;
  statusContrato?: string;
  codigoAtivo?: boolean;
}

/** Clínica disponível para administração, já com a situação do contrato e do código. */
export interface Clinica {
  idClinica: number;
  nomeClinica: string;
  /** true somente com contrato confirmado. Clínica nova/sem informação é tratada como inativa. */
  contratoAtivo: boolean;
  statusContrato: StatusContrato;
  /** Existe um código de vínculo vigente (o valor em si nunca é devolvido pela API). */
  codigoAtivo: boolean;
}


export interface Prescricao {
  idPrescricao: number;
  status: StatusDecisao;
  idEvento?: number;
  nmMedicamento: string;
  dsPosologia: string;
  qtDosesDia?: number;
  nmPet: string;
  nmTutor: string;
  nmVeterinario: string;
  dtInicio: string;
  dtFim?: string;
  idClinica?: number | null;
  nmClinica?: string | null;
}

export interface RelatorioEstetica {
  idRelatorio: number;
  status: StatusDecisao;
  idEvento?: number;
  dsProblema: string;
  nmPet: string;
  nmTutor: string;
  nmProfissionalEstetica: string;
  idClinica?: number | null;
  nmClinica?: string | null;
}

/**
 * Estado de um lançamento de pontos (GET /pontos):
 * PENDENTE aguarda liberação; LIBERADO está dentro da validade; BLOQUEADO foi retido pelo admin;
 * EXPIRADO estava liberado mas a validade venceu. Só LIBERADO conta como saldo disponível.
 */
export type StatusLancamentoPontos = 'PENDENTE' | 'LIBERADO' | 'BLOQUEADO' | 'EXPIRADO';

/** Origem dos pontos: atendimento concluído ou bônus de plano de tratamento. */
export type OrigemPontos = 'EVENTO' | 'BONUS_PLANO';

export interface LancamentoPontos {
  idLancamento: number;
  status: StatusLancamentoPontos;
  origem: OrigemPontos;
  nrPontos: number;
  dtLancamento: string;
  /** Dia em que o admin liberou. Nulo enquanto nunca foi liberado. */
  dtLiberacao?: string | null;
  /** Último dia em que os pontos valem (inclusive). Nulo enquanto não liberado. */
  dtValidade?: string | null;
  dtBloqueio?: string | null;
  motivoBloqueio?: string | null;
  /** true só se LIBERADO, dentro da validade e com clínica. */
  resgatavel: boolean;
  idEvento?: number | null;
  nmTipoEvento?: string | null;
  dsAtendimento?: string | null;
  dtAtendimento?: string | null;
  idPlano?: number | null;
  idPet?: number | null;
  nmPet?: string | null;
  idTutor?: number | null;
  nmTutor?: string | null;
  /** Clínica em que os pontos foram gerados e valem. Pontos de clínicas diferentes nunca se somam. */
  idClinica?: number | null;
  nmClinica?: string | null;
}

/** Filtros de GET /pontos. Todos opcionais; a API aplica o escopo de acesso de qualquer forma. */
export interface FiltroPontos {
  idClinica?: IdClinicaFiltro;
  status?: StatusLancamentoPontos | null;
  idTutor?: number | null;
}

/** Saldo de UM tutor em UMA clínica (GET /pontos/saldos). */
export interface SaldoPontosClinica {
  idTutor: number;
  nmTutor: string;
  idClinica: number;
  nmClinica: string;
  pontosPendentes: number;
  pontosLiberados: number;
  pontosBloqueados: number;
  pontosExpirados: number;
  pontosResgatados: number;
  pontosReservados: number;
  /** O que o tutor pode resgatar agora: nunca inclui pendente, bloqueado, expirado ou reservado. */
  saldoDisponivel: number;
}

// ---- Painel inicial (GET /painel/resumo) ----

/** CLINICA = números de uma clínica; GLOBAL = soma de todas as clínicas. */
export type EscopoPainel = 'CLINICA' | 'GLOBAL';

export interface PontosPainel {
  pontosPendentes: number;
  pontosBloqueados: number;
  pontosExpirados: number;
  /** Liberados e dentro da validade, antes de descontar resgates. */
  pontosLiberados: number;
  pontosResgatados: number;
  pontosReservados: number;
  /** Saldo resgatável somado dos tutores: não inclui pendentes, bloqueados, vencidos nem reservados. */
  pontosDisponiveis: number;
  lancamentosPendentes: number;
  lancamentosBloqueados: number;
}

export interface RecompensasPainel {
  recompensasAtivas: number;
  recompensasInativas: number;
  recompensasTotal: number;
  resgatesPendentes: number;
  resgatesValidados: number;
  resgatesNegados: number;
}

export interface PontosPorClinica {
  idClinica: number;
  nmClinica: string;
  pontos: PontosPainel;
}

export interface ResumoPainel {
  escopo: EscopoPainel;
  /** true quando os números somam todas as clínicas. */
  totaisGlobais: boolean;
  idClinica?: number | null;
  nmClinica?: string | null;
  /** Texto pronto para exibir junto aos indicadores (nome da clínica ou "Totais de todas as clínicas"). */
  rotuloEscopo: string;
  pontos: PontosPainel;
  recompensas: RecompensasPainel;
  /** Detalhamento por clínica; só vem preenchido no escopo GLOBAL. */
  porClinica: PontosPorClinica[];
}

export interface Medicamento {
  idMedicamento: number;
  nmMedicamento: string;
  dsPrincipio?: string | null;
  vlPrecoRef?: number | null;
  idClinica?: number | null;
  nmClinica?: string | null;
}

export interface TipoEvento {
  idTipoEvento: number;
  nmTipoEvento: string;
  dsCategoria: string;
  nrPontos: number;
  dsModalidadeAgendamento?: string | null;
  nrDuracaoMinutos?: number | null;
}

// ---- Recompensas ----
export type TipoRecompensa = 'PRODUTO' | 'CUPOM_DESCONTO';

export interface Recompensa {
  idRecompensa: number;
  nome: string;
  descricao?: string | null;
  custoPontos: number;
  tipo: TipoRecompensa;
  ativa: boolean;
  /** Caminho relativo, ex.: /recompensas/3/imagem (exige Authorization). */
  imagemUrl?: string | null;
  idClinica?: number | null;
  nmClinica?: string | null;
}

export interface ExclusaoRecompensa {
  excluidoDefinitivamente: boolean;
  mensagem: string;
}

/** Imagem já validada e pronta para virar parte do multipart. */
export interface ImagemSelecionada {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export interface RecompensaPayload {
  nome: string;
  descricao: string;
  custoPontos: number;
  tipo: TipoRecompensa;
  /** Clínica dona da recompensa, escolhida pelo nome no ClinicaSelect. */
  idClinica: number;
  imagem?: ImagemSelecionada | null;
  /** Só na edição. */
  ativo?: boolean;
  /** Só na edição; só vale se nenhuma imagem nova for enviada. */
  removerImagem?: boolean;
}

// ---- Pets ----
export interface Pet {
  idPet: number;
  numero: string | number;
  nmPet: string;
  especie?: string | null;
  raca?: string | null;
  dtNascimento?: string | null;
  idadeAnos?: number | null;
  peso?: number | null;
  sexo?: string | null;
  idTutor?: number | null;
  fotoUrl?: string | null;
}

export interface TipoVacina {
  id: number;
  nome: string;
  periodicidadeDias: number;
  idClinica?: number | null;
  nmClinica?: string | null;
}

// ---- Auditoria ----
/** Entidades auditáveis (GET /auditoria/tipos devolve a lista vigente). */
export type EntidadeAuditoria =
  | 'EVENTO'
  | 'ACESSO_PET'
  | 'VINCULO'
  | 'CONTRATO'
  | 'CODIGO_VINCULO'
  | 'PONTOS'
  | 'CATALOGO'
  | 'RESGATE';

export interface RegistroAuditoria {
  id: number;
  /** Aceita string para não quebrar se a API ganhar uma entidade nova. */
  entidade: EntidadeAuditoria | string;
  entidadeId: number;
  acao: string;
  ator?: string | null;
  perfil?: string | null;
  clinicaId?: number | null;
  clinicaNome?: string | null;
  valorAnterior?: string | null;
  valorNovo?: string | null;
  ip?: string | null;
  ocorridoEm: string;
}

/** Filtros de GET /auditoria para ADMIN. Todos opcionais; datas em "YYYY-MM-DD". */
export interface FiltroAuditoria {
  idClinica?: IdClinicaFiltro;
  entidade?: EntidadeAuditoria | string | null;
  entidadeId?: number | null;
  acao?: string | null;
  de?: string | null;
  ate?: string | null;
  limite?: number | null;
}

export interface TiposAuditoria {
  entidades: string[];
  acoes: string[];
}

// ---- Agenda do dia ----
export type StatusAtendimento = 'AGENDADO' | 'CONCLUIDO' | 'CANCELADO';

/** Um evento de saúde/estética da agenda do dia (GET /agenda/dia). */
export interface AtendimentoDia {
  idEvento: number;
  /** "HH:mm"; pode vir nulo em eventos antigos. */
  hrEvento?: string | null;
  status: StatusAtendimento | string;
  idPet: number;
  nmPet: string;
  raca?: string | null;
  nmTutor?: string | null;
  nmTipoEvento: string;
  dsCategoria?: string | null;
  /** Veterinário ou profissional de estética responsável. */
  nmProfissional?: string | null;
  nmClinica?: string | null;
}