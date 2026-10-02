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

/** Dados mínimos de uma clínica disponíveis para administração. */
export interface Clinica {
  idClinica: number;
  nomeClinica: string;
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
}

export interface RelatorioEstetica {
  idRelatorio: number;
  status: StatusDecisao;
  idEvento?: number;
  dsProblema: string;
  nmPet: string;
  nmTutor: string;
  nmProfissionalEstetica: string;
}

export interface LancamentoPontos {
  idLancamento: number;
  origem: 'EVENTO' | 'BONUS_PLANO';
  status: 'PENDENTE' | 'LIBERADO';
  idEvento?: number;
  idPlano?: number;
  nmTipoEvento?: string;
  nmPet: string;
  nmTutor: string;
  nrPontos: number;
  dtLancamento: string;
}

export interface Medicamento {
  idMedicamento: number;
  nmMedicamento: string;
  dsPrincipio?: string | null;
  vlPrecoRef?: number | null;
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
}

// ---- Auditoria ----
export type EntidadeAuditoria = 'EVENTO' | 'ACESSO_PET';

export interface RegistroAuditoria {
  acao: string;
  ator?: string | null;
  perfil?: string | null;
  valorAnterior?: string | null;
  valorNovo?: string | null;
  ip?: string | null;
  ocorridoEm: string;
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
 