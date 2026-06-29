'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Props = {
  processoId: string
  statusAtual: string
  requerRevisao: boolean
  papelUsuario?: string
}

const FLUXO_PADRAO = ['novo', 'triagem', 'distribuido', 'elaboracao', 'revisar', 'revisando', 'revisado', 'entregue']
const FLUXO_SEM_REVISAO = ['novo', 'triagem', 'distribuido', 'elaboracao', 'entregue']

const LABEL: Record<string, string> = {
  novo: 'Novo',
  triagem: 'Triagem',
  distribuido: 'Distribuido',
  elaboracao: 'Elaboracao',
  revisar: 'Revisar',
  revisando: 'Revisando',
  revisado: 'Revisado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
  pausa_triagem: 'Pausa Triagem',
  pausa_execucao: 'Pausa Elaboracao',
  pausa_revisao: 'Pausa Revisao',
}

// Acoes possiveis por status — inclui atalho de coordenador
function getAcoes(status: string, requerRevisao: boolean, isCoord: boolean) {
  switch (status) {
    case 'novo':
      return [{ value: 'triagem', label: 'Iniciar triagem' }]
    case 'triagem':
      return [
        { value: 'distribuido', label: 'Distribuir' },
        { value: 'pausa_triagem', label: 'Pausar triagem' },
      ]
    case 'pausa_triagem':
      return [{ value: 'triagem', label: 'Retomar triagem' }]
    case 'distribuido':
      return [{ value: 'elaboracao', label: 'Iniciar elaboracao' }]
    case 'elaboracao': {
      const acoes = [{ value: 'pausa_execucao', label: 'Pausar elaboracao' }]
      if (requerRevisao) {
        acoes.unshift({ value: 'revisar', label: 'Enviar para revisao' })
        if (isCoord) {
          acoes.splice(1, 0, { value: 'revisado', label: 'Marcar como revisado (atalho coord.)' })
        }
      } else {
        acoes.unshift({ value: 'entregue', label: 'Entregar ao cliente' })
      }
      return acoes
    }
    case 'pausa_execucao':
      return [{ value: 'elaboracao', label: 'Retomar elaboracao' }]
    case 'revisar':
      return [{ value: 'revisando', label: 'Iniciar revisao' }]
    case 'revisando':
      return [
        { value: 'revisado', label: 'Marcar como revisado' },
        { value: 'elaboracao', label: 'Devolver para elaboracao' },
        { value: 'pausa_revisao', label: 'Pausar revisao' },
      ]
    case 'pausa_revisao':
      return [{ value: 'revisando', label: 'Retomar revisao' }]
    case 'revisado':
      return [
        { value: 'entregue', label: 'Entregar ao cliente' },
        { value: 'elaboracao', label: 'Devolver para elaboracao' },
      ]
    default:
      return []
  }
}

export default function WorkflowBar({ processoId, statusAtual, requerRevisao, papelUsuario }: Props) {
  const router = useRouter()
  const [avancando, setAvancando] = useState(false)
  const [observacao, setObservacao] = useState('')
  const [showObs, setShowObs] = useState(false)
  const [acaoSelecionada, setAcaoSelecionada] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  const finalizado = ['entregue', 'cancelado'].includes(statusAtual)
  const isCoord = papelUsuario === 'coordenador' || papelUsuario === 'admin'
  const acoes = getAcoes(statusAtual, requerRevisao, isCoord)

  const fluxo = requerRevisao ? FLUXO_PADRAO : FLUXO_SEM_REVISAO
  const idxAtual = fluxo.indexOf(statusAtual)

  async function handleAvancar() {
    const acao = acaoSelecionada || acoes[0]?.value
    if (!acao) return

    setAvancando(true)
    setErro(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.rpc('transicionar_status', {
      p_processo_id: processoId,
      p_status_novo: acao,
      p_usuario_id: user?.id,
      p_observacao: observacao || null,
    })

    if (error) {
      setErro('Erro: ' + error.message)
      setAvancando(false)
      return
    }

    setObservacao('')
    setShowObs(false)
    setAcaoSelecionada('')
    router.refresh()
    setAvancando(false)
  }

  async function handleCancelar() {
    if (!confirm('Confirma o cancelamento deste processo?')) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.rpc('transicionar_status', {
      p_processo_id: processoId,
      p_status_novo: 'cancelado',
      p_usuario_id: user?.id,
      p_observacao: 'Cancelado manualmente',
    })
    router.refresh()
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
      {/* Barra de progresso */}
      <div className="flex items-center gap-0.5">
        {fluxo.map((s, i) => {
          const passado = i < idxAtual
          const atual = i === idxAtual
          return (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-1.5 w-full rounded-full ${passado || atual ? 'bg-slate-800' : 'bg-slate-200'}`} />
              <span className={`text-xs truncate max-w-full px-0.5 ${atual ? 'font-semibold text-slate-800' : passado ? 'text-slate-400' : 'text-slate-400'}`}>
                {LABEL[s]}
              </span>
            </div>
          )
        })}
      </div>

      {/* Acoes */}
      {!finalizado && acoes.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-1">
          {acoes.length > 1 ? (
            <select
              value={acaoSelecionada || acoes[0].value}
              onChange={(e) => setAcaoSelecionada(e.target.value)}
              className="border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              {acoes.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          ) : (
            <span className="text-sm text-slate-600">{acoes[0].label}</span>
          )}

          <button
            onClick={() => setShowObs(!showObs)}
            disabled={avancando}
            className="bg-slate-800 text-white px-4 py-1.5 rounded-md text-sm hover:bg-slate-700 disabled:opacity-50"
          >
            {avancando ? 'Processando...' : 'Confirmar'}
          </button>

          <button
            onClick={handleCancelar}
            className="text-red-600 border border-red-200 px-3 py-1.5 rounded-md text-sm hover:bg-red-50"
          >
            Cancelar processo
          </button>
        </div>
      )}

      {showObs && (
        <div className="space-y-2">
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Observacao (opcional)..."
            rows={2}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAvancar}
              disabled={avancando}
              className="bg-slate-800 text-white px-4 py-1.5 rounded-md text-sm hover:bg-slate-700 disabled:opacity-50"
            >
              {avancando ? 'Salvando...' : 'Confirmar'}
            </button>
            <button
              onClick={() => setShowObs(false)}
              className="px-3 py-1.5 rounded-md text-sm text-slate-600 hover:bg-slate-100 border border-slate-200"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {erro && <p className="text-xs text-red-600">{erro}</p>}
    </div>
  )
}
