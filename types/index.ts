export interface Veterinario {
  idVeterinario: number;
  nmVeterinario: string;
  nrCrmv: string;
  dsEmail: string;
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

export interface Prescricao {
  idPrescricao: number;
  nmMedicamento: string;
  dsPosologia: string;
  qtDosesDia?: number;
  nmPet: string;
  nmTutor: string;
  nmVeterinario: string;
  dtInicio: string;
  dtFim?: string;
}

export interface LancamentoPontos {
  idLancamento: number;
  origem: 'EVENTO' | 'PLANO';
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
}
