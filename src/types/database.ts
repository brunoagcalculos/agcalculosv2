export type StatusCliente = 'ativo' | 'inativo' | 'prospecto'

export type PapelUsuario =
  | 'admin'
  | 'triador'
  | 'digitador'
  | 'executor'
  | 'revisor'
  | 'financeiro'
  | 'gestor'

export type TipoCalculo =
  | 'contingencia_inicial'
  | 'replica_demonstrativos_he'
  | 'impugnacao_sentenca_liquida'
  | 'contingencia_decisoes'
  | 'apresentacao_calculos_art879'
  | 'impugnacao_calculos'
  | 'atualizacao_analise_recursal'
  | 'parcelamento_art916'
  | 'discriminacao_verbas_acordo'
  | 'esocial_s2500'
  | 'esocial_s2501'
  | 'fgts_digital_s2500'

export type FaseProcesso =
  | 'inicial'
  | 'sentenca'
  | 'acordao'
  | 'embargos_execucao'
  | 'agravo_peticao'
  | 'acordo'

export type LadoProcessual = 'reclamada' | 'reclamante'

export type StatusProcesso =
  | 'novo'
  | 'triagem'
  | 'execucao'
  | 'revisao'
  | 'aprovacao'
  | 'entregue'
  | 'cancelado'
  | 'pausa_triagem'
  | 'pausa_execucao'
  | 'pausa_revisao'

export type StatusFaturamento =
  | 'pendente'
  | 'faturado'
  | 'recebido'
  | 'cancelado'

// ── Entidades ──────────────────────────────────────────

export interface Grupo {
  id: string
  nome: string
  descricao: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Cliente {
  id: string
  razao_social: string
  nome_fantasia: string | null
  cnpj: string | null
  uf: string | null
  cidade: string | null
  cep: string | null
  logradouro: string | null
  complemento: string | null
  bairro: string | null
  ddd: string | null
  telefone1: string | null
  telefone2: string | null
  email_principal: string | null
  site: string | null
  status: StatusCliente
  grupo_id: string | null
  dia_de_corte: number | null
  observacoes: string | null
  created_at: string
  updated_at: string
  // joins opcionais
  grupo?: Grupo
}

export interface Contato {
  id: string
  cliente_id: string
  nome: string
  cargo: string | null
  email: string | null
  telefone: string | null
  ramal: string | null
  celular: string | null
  principal: boolean
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface ClienteParametros {
  id: string
  cliente_id: string
  inss_empresa: number | null
  inss_grau_risco: number | null
  inss_terceiros: number | null
  params_elaboracao_revisao: string | null
  params_triagem: string | null
  aviso_calculos: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

export interface PerfilUsuario {
  id: string
  nome: string
  email: string
  papel: PapelUsuario
  ativo: boolean
  divisor: number | null
  salario: number | null
  created_at: string
  updated_at: string
}

export interface TipoCalculoConfig {
  tipo: TipoCalculo
  label: string
  requer_revisao: boolean
  ativo: boolean
  peso_ranking: number
}

export interface TRT {
  codigo: number
  nome: string
  uf: string
  sede: string
}

export interface Processo {
  id: string
  cnj: string | null
  processo_secundario: string | null
  trt_codigo: number | null
  origem: string | null
  fase: FaseProcesso | null
  lado_processual: LadoProcessual
  reclamante: string
  reclamada: string | null
  data_admissao: string | null
  data_demissao: string | null
  data_distribuicao: string | null
  data_citacao: string | null
  data_prescricao: string | null
  tipo_calculo: TipoCalculo
  requer_revisao: boolean
  preencher_fgts_digital: boolean
  emitir_darf: boolean
  cliente_id: string
  grupo_id: string | null
  is_projeto: boolean
  solicitante_nome: string | null
  solicitante_email: string | null
  solicitante_area: string | null
  codigo_interno: string | null
  matricula_colaborador: string | null
  valor_reclamante: number | null
  valor_liquido: number | null
  status: StatusProcesso
  disponibilizado_em: string | null
  prazo: string | null
  prazo_hora: string | null
  prazo_fatal: boolean
  triador_id: string | null
  executor_id: string | null
  revisor_id: string | null
  data_cadastro: string
  data_triagem: string | null
  data_inicio_exec: string | null
  data_inicio_rev: string | null
  data_entrega: string | null
  data_aprovacao: string | null
  data_cancelamento: string | null
  anotacoes_geral: string | null
  anotacoes_cartao_ponto: string | null
  anotacoes_hollerith: string | null
  anotacoes_outros: string | null
  anotacoes_equiparacao: string | null
  anotacoes_comissao: string | null
  indice_correcao: string | null
  created_at: string
  updated_at: string
  // joins opcionais
  cliente?: Cliente
  grupo?: Grupo
  triador?: PerfilUsuario
  executor?: PerfilUsuario
  revisor?: PerfilUsuario
  trt?: TRT
}

export interface ProcessoHistorico {
  id: string
  processo_id: string
  status_anterior: StatusProcesso | null
  status_novo: StatusProcesso
  usuario_id: string | null
  tempo_minutos: number | null
  observacao: string | null
  created_at: string
  usuario?: PerfilUsuario
}

export interface ProcessoArquivo {
  id: string
  processo_id: string
  tipo: 'arquivo_cliente' | 'relatorio'
  nome: string
  url: string
  descricao: string | null
  enviado_por: string | null
  created_at: string
}

export interface NotaFiscal {
  id: string
  cliente_id: string
  numero_nf: string | null
  modalidade: 'mensal' | 'avulso'
  competencia_inicio: string
  competencia_fim: string
  data_emissao: string | null
  data_vencimento: string | null
  data_pagamento: string | null
  valor_total: number
  valor_pago: number | null
  status: StatusFaturamento
  observacoes: string | null
  criado_por: string | null
  created_at: string
  updated_at: string
  cliente?: Cliente
}

export interface FaturamentoItem {
  id: string
  nota_fiscal_id: string | null
  processo_id: string
  cliente_id: string
  tipo_calculo: TipoCalculo
  reclamante: string | null
  data_entrega: string | null
  valor: number
  status: StatusFaturamento
  observacoes: string | null
  created_at: string
  updated_at: string
  processo?: Processo
  cliente?: Cliente
}

// ── Labels legíveis ────────────────────────────────────

export const TIPO_CALCULO_LABEL: Record<TipoCalculo, string> = {
  contingencia_inicial:         'Contingência Inicial',
  replica_demonstrativos_he:    'Réplica / Demonstrativos HE',
  impugnacao_sentenca_liquida:  'Impugnação Sentença Líquida',
  contingencia_decisoes:        'Contingência Decisões',
  apresentacao_calculos_art879: 'Apresentação dos Cálculos (Art. 879)',
  impugnacao_calculos:          'Impugnação aos Cálculos',
  atualizacao_analise_recursal: 'Atualização / Análise Recursal',
  parcelamento_art916:          'Parcelamento (Art. 916)',
  discriminacao_verbas_acordo:  'Discriminação de Verbas de Acordo',
  esocial_s2500:                'E-Social S2500',
  esocial_s2501:                'E-Social S2501',
  fgts_digital_s2500:           'FGTS Digital (S2500)',
}

export const STATUS_PROCESSO_LABEL: Record<StatusProcesso, string> = {
  novo:           'Novo',
  triagem:        'Triagem',
  execucao:       'Execução',
  revisao:        'Revisão',
  aprovacao:      'Aprovação',
  entregue:       'Entregue',
  cancelado:      'Cancelado',
  pausa_triagem:  'Pausa Triagem',
  pausa_execucao: 'Pausa Execução',
  pausa_revisao:  'Pausa Revisão',
}

export const STATUS_PROCESSO_COR: Record<StatusProcesso, string> = {
  novo:           'bg-slate-100 text-slate-700',
  triagem:        'bg-yellow-100 text-yellow-700',
  execucao:       'bg-blue-100 text-blue-700',
  revisao:        'bg-purple-100 text-purple-700',
  aprovacao:      'bg-orange-100 text-orange-700',
  entregue:       'bg-green-100 text-green-700',
  cancelado:      'bg-red-100 text-red-700',
  pausa_triagem:  'bg-yellow-50 text-yellow-600',
  pausa_execucao: 'bg-blue-50 text-blue-600',
  pausa_revisao:  'bg-purple-50 text-purple-600',
}