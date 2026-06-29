import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import WorkflowBar from '@/components/processos/WorkflowBar'
import AnotacoesPanel from '@/components/processos/AnotacoesPanel'
import OcorrenciasPanel from '@/components/processos/OcorrenciasPanel'
import ArquivosPanel from '@/components/processos/ArquivosPanel'

const TIPO_LABEL: Record<string, string> = {
  contingencia_inicial: 'Contingencia Inicial',
  replica_demonstrativos_he: 'Replica / HE',
  impugnacao_sentenca_liquida: 'Impugnacao Sentenca Liquida',
  contingencia_decisoes: 'Contingencia Decisoes',
  apresentacao_calculos_art879: 'Apresentacao Art.879',
  impugnacao_calculos: 'Impugnacao aos Calculos',
  atualizacao_analise_recursal: 'Atualizacao / Recursal',
  parcelamento_art916: 'Parcelamento Art.916',
  discriminacao_verbas_acordo: 'Discriminacao Acordo',
  esocial_s2500: 'E-Social S2500',
  esocial_s2501: 'E-Social S2501',
  fgts_digital_s2500: 'FGTS Digital S2500',
}

const STATUS_COR: Record<string, string> = {
  novo: 'bg-slate-100 text-slate-700',
  triagem: 'bg-yellow-100 text-yellow-700',
  execucao: 'bg-blue-100 text-blue-700',
  revisao: 'bg-purple-100 text-purple-700',
  aprovacao: 'bg-orange-100 text-orange-700',
  entregue: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-700',
  pausa_triagem: 'bg-yellow-50 text-yellow-600',
  pausa_execucao: 'bg-blue-50 text-blue-600',
  pausa_revisao: 'bg-purple-50 text-purple-600',
}

const STATUS_LABEL: Record<string, string> = {
  novo: 'Novo',
  triagem: 'Triagem',
  execucao: 'Execucao',
  revisao: 'Revisao',
  aprovacao: 'Aprovacao',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
  pausa_triagem: 'Pausa Triagem',
  pausa_execucao: 'Pausa Execucao',
  pausa_revisao: 'Pausa Revisao',
}

function Campo({ label, valor }: { label: string; valor?: string | number | null }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm text-slate-800 mt-0.5">{valor ?? '--'}</p>
    </div>
  )
}

function formatDate(d: string | null) {
  if (!d) return '--'
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')
}

function formatDateTime(d: string | null) {
  if (!d) return '--'
  return new Date(d).toLocaleString('pt-BR')
}

export default async function ProcessoDetalhePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const { data: processo } = await supabase
    .from('processos')
    .select(
      '*, cliente:clientes(id, razao_social, nome_fantasia), executor:perfis_usuario!processos_executor_id_fkey(id, nome), triador:perfis_usuario!processos_triador_id_fkey(id, nome), revisor:perfis_usuario!processos_revisor_id_fkey(id, nome), trt:trts(codigo, nome, uf)'
    )
    .eq('id', params.id)
    .single()

  if (!processo) notFound()

  const { data: historico } = await supabase
    .from('processo_historico')
    .select('*, usuario:perfis_usuario(nome)')
    .eq('processo_id', params.id)
    .order('created_at', { ascending: false })

  const { data: ocorrencias } = await supabase
    .from('processo_ocorrencias')
    .select('*, usuario:perfis_usuario(nome)')
    .eq('processo_id', params.id)
    .order('created_at', { ascending: false })

  const { data: arquivos } = await supabase
    .from('processo_arquivos')
    .select('*, enviado:perfis_usuario(nome)')
    .eq('processo_id', params.id)
    .order('created_at', { ascending: false })

  const atrasado =
    processo.prazo &&
    processo.prazo < new Date().toISOString().split('T')[0] &&
    !['entregue', 'cancelado'].includes(processo.status)

  return (
    <div className="p-6 space-y-5 max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/processos">
            <button className="text-slate-400 hover:text-slate-600">
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold text-slate-800">{processo.reclamante}</h1>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COR[processo.status]}`}>
                {STATUS_LABEL[processo.status]}
              </span>
              {processo.prazo_fatal && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  Prazo Fatal
                </span>
              )}
              {atrasado && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  Atrasado
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {(processo as any).cliente?.razao_social} &middot; {TIPO_LABEL[processo.tipo_calculo]}
            </p>
            {processo.cnj && (
              <p className="text-xs text-slate-400 font-mono mt-0.5">{processo.cnj}</p>
            )}
          </div>
        </div>
        <Link
          href={`/processos/${params.id}/editar`}
          className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-md hover:bg-slate-50"
        >
          Editar
        </Link>
      </div>

      {/* Workflow */}
      <WorkflowBar
        processoId={params.id}
        statusAtual={processo.status}
        requerRevisao={processo.requer_revisao}
      />

      <div className="grid grid-cols-3 gap-4">

        {/* Coluna principal */}
        <div className="col-span-2 space-y-4">

          {/* Dados do processo */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
              Dados do processo
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Campo label="Cliente" valor={(processo as any).cliente?.razao_social} />
              <Campo label="Tipo de calculo" valor={TIPO_LABEL[processo.tipo_calculo]} />
              <Campo label="Fase" valor={processo.fase} />
              <Campo label="Lado processual" valor={processo.lado_processual} />
              <Campo label="Reclamada" valor={processo.reclamada} />
              <Campo label="TRT" valor={(processo as any).trt ? `${(processo as any).trt.codigo}a Regiao - ${(processo as any).trt.uf}` : null} />
              <Campo label="Origem" valor={processo.origem} />
              <Campo label="Codigo interno" valor={processo.codigo_interno} />
              <Campo label="Matricula" valor={processo.matricula_colaborador} />
              <Campo label="Valor reclamante" valor={processo.valor_reclamante ? `R$ ${Number(processo.valor_reclamante).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null} />
              <Campo label="Valor liquido AG" valor={processo.valor_liquido ? `R$ ${Number(processo.valor_liquido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null} />
              <Campo label="FGTS Digital" valor={processo.preencher_fgts_digital ? 'Sim' : 'Nao'} />
              <Campo label="Emitir DARF" valor={processo.emitir_darf ? 'Sim' : 'Nao'} />
            </div>
          </div>

          {/* Datas */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
              Datas
            </p>
            <div className="grid grid-cols-3 gap-4">
              <Campo label="Admissao" valor={formatDate(processo.data_admissao)} />
              <Campo label="Demissao" valor={formatDate(processo.data_demissao)} />
              <Campo label="Distribuicao" valor={formatDate(processo.data_distribuicao)} />
              <Campo label="Citacao" valor={formatDate(processo.data_citacao)} />
              <Campo label="Prescricao" valor={formatDate(processo.data_prescricao)} />
              <Campo label="Cadastro" valor={formatDateTime(processo.data_cadastro)} />
              <Campo label="Triagem" valor={formatDateTime(processo.data_triagem)} />
              <Campo label="Inicio execucao" valor={formatDateTime(processo.data_inicio_exec)} />
              <Campo label="Entrega" valor={formatDateTime(processo.data_entrega)} />
            </div>
          </div>

          {/* Solicitante */}
          {(processo.solicitante_nome || processo.solicitante_email) && (
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
                Solicitante
              </p>
              <div className="grid grid-cols-3 gap-4">
                <Campo label="Nome" valor={processo.solicitante_nome} />
                <Campo label="Email" valor={processo.solicitante_email} />
                <Campo label="Area" valor={processo.solicitante_area} />
              </div>
            </div>
          )}

          {/* Anotacoes */}
          <AnotacoesPanel
            processoId={params.id}
            anotacoes={{
              geral: processo.anotacoes_geral,
              cartao_ponto: processo.anotacoes_cartao_ponto,
              hollerith: processo.anotacoes_hollerith,
              outros: processo.anotacoes_outros,
              equiparacao: processo.anotacoes_equiparacao,
              comissao: processo.anotacoes_comissao,
            }}
          />

          {/* Arquivos */}
          <ArquivosPanel processoId={params.id} arquivos={arquivos ?? []} />

          {/* Ocorrencias */}
          <OcorrenciasPanel processoId={params.id} ocorrencias={ocorrencias ?? []} />
        </div>

        {/* Coluna lateral */}
        <div className="space-y-4">

          {/* Prazo */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Prazo
            </p>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-slate-400">Data</p>
                <p className={`text-lg font-bold mt-0.5 ${atrasado ? 'text-red-600' : 'text-slate-800'}`}>
                  {formatDate(processo.prazo)}
                </p>
              </div>
              {processo.prazo_hora && (
                <Campo label="Hora" valor={processo.prazo_hora} />
              )}
            </div>
          </div>

          {/* Equipe */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Equipe
            </p>
            <div className="space-y-3">
              <Campo label="Triador" valor={(processo as any).triador?.nome} />
              <Campo label="Executor" valor={(processo as any).executor?.nome} />
              {processo.requer_revisao && (
                <Campo label="Revisor" valor={(processo as any).revisor?.nome} />
              )}
            </div>
          </div>

          {/* Historico */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Historico
            </p>
            {!historico || historico.length === 0 ? (
              <p className="text-sm text-slate-400">Sem historico</p>
            ) : (
              <div className="space-y-3">
                {historico.map((h: any) => (
                  <div key={h.id} className="text-xs border-l-2 border-slate-200 pl-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      {h.status_anterior && (
                        <>
                          <span className="text-slate-500">{STATUS_LABEL[h.status_anterior]}</span>
                          <span className="text-slate-300">-&gt;</span>
                        </>
                      )}
                      <span className="font-medium text-slate-700">{STATUS_LABEL[h.status_novo]}</span>
                    </div>
                    <p className="text-slate-400 mt-0.5">
                      {h.usuario?.nome ?? 'Sistema'} &middot; {formatDateTime(h.created_at)}
                    </p>
                    {h.tempo_minutos && (
                      <p className="text-slate-400">{h.tempo_minutos} min</p>
                    )}
                    {h.observacao && (
                      <p className="text-slate-600 mt-0.5">{h.observacao}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
