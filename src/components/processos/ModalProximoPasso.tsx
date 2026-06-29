'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X } from 'lucide-react'

type Processo = {
  id: string
  reclamante: string
  status: string
  requer_revisao: boolean
}

type Usuario = {
  id: string
  nome: string
  papel: string
}

type Props = {
  processos: Processo[]
  onClose: () => void
  onConcluido: () => void
}

const STATUS_LABEL: Record<string, string> = {
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

const ACOES_POR_STATUS: Record<string, { value: string; label: string }[]> = {
  novo: [
    { value: 'triagem', label: 'Iniciar triagem' },
    { value: 'cancelado', label: 'Cancelar' },
  ],
  triagem: [
    { value: 'distribuido', label: 'Distribuir' },
    { value: 'pausa_triagem', label: 'Pausar triagem' },
    { value: 'cancelado', label: 'Cancelar' },
  ],
  pausa_triagem: [
    { value: 'triagem', label: 'Retomar triagem' },
    { value: 'cancelado', label: 'Cancelar' },
  ],
  distribuido: [
    { value: 'elaboracao', label: 'Iniciar elaboracao' },
    { value: 'cancelado', label: 'Cancelar' },
  ],
  elaboracao: [
    { value: 'revisar', label: 'Enviar para revisao' },
    { value: 'revisado', label: 'Marcar como revisado (atalho coord.)' },
    { value: 'entregue', label: 'Entregar ao cliente (sem revisao)' },
    { value: 'pausa_execucao', label: 'Pausar elaboracao' },
    { value: 'cancelado', label: 'Cancelar' },
  ],
  pausa_execucao: [
    { value: 'elaboracao', label: 'Retomar elaboracao' },
    { value: 'cancelado', label: 'Cancelar' },
  ],
  revisar: [
    { value: 'revisando', label: 'Iniciar revisao' },
    { value: 'cancelado', label: 'Cancelar' },
  ],
  revisando: [
    { value: 'revisado', label: 'Marcar como revisado' },
    { value: 'elaboracao', label: 'Devolver para elaboracao' },
    { value: 'pausa_revisao', label: 'Pausar revisao' },
    { value: 'cancelado', label: 'Cancelar' },
  ],
  pausa_revisao: [
    { value: 'revisando', label: 'Retomar revisao' },
    { value: 'cancelado', label: 'Cancelar' },
  ],
  revisado: [
    { value: 'entregue', label: 'Entregar ao cliente' },
    { value: 'elaboracao', label: 'Devolver para elaboracao' },
    { value: 'cancelado', label: 'Cancelar' },
  ],
}

const ACOES_COM_RESPONSAVEL = ['triagem', 'distribuido', 'elaboracao', 'revisando']

function getAcoes(processos: Processo[]) {
  if (processos.length === 0) return []
  const statuses = [...new Set(processos.map((p) => p.status))]
  if (statuses.length === 1) {
    return ACOES_POR_STATUS[statuses[0]] ?? []
  }
  return [{ value: 'cancelado', label: 'Cancelar' }]
}

export default function ModalProximoPasso({ processos, onClose, onConcluido }: Props) {
  const [acao, setAcao] = useState('')
  const [usuarioId, setUsuarioId] = useState('')
  const [observacao, setObservacao] = useState('')
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [processando, setProcessando] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const [erro, setErro] = useState<string | null>(null)

  const acoes = getAcoes(processos)
  const precisaResponsavel = ACOES_COM_RESPONSAVEL.includes(acao)

  useEffect(() => {
    if (acoes.length > 0) setAcao(acoes[0].value)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('perfis_usuario')
      .select('id, nome, papel')
      .eq('ativo', true)
      .order('nome')
      .then(({ data }) => setUsuarios(data ?? []))
  }, [])

  async function handleConfirmar() {
    if (!acao) return
    if (precisaResponsavel && !usuarioId) {
      setErro('Selecione um responsavel.')
      return
    }

    setProcessando(true)
    setErro(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const erros: string[] = []

    for (let i = 0; i < processos.length; i++) {
      const p = processos[i]

      const { error } = await supabase.rpc('transicionar_status', {
        p_processo_id: p.id,
        p_status_novo: acao,
        p_usuario_id: user?.id,
        p_observacao: observacao || null,
      })

      if (error) {
        erros.push(`${p.reclamante}: ${error.message}`)
      } else if (precisaResponsavel && usuarioId) {
        const campo =
          acao === 'triagem' ? 'triador_id' :
          acao === 'elaboracao' ? 'executor_id' :
          acao === 'revisando' ? 'revisor_id' : null

        if (campo) {
          await supabase
            .from('processos')
            .update({ [campo]: usuarioId })
            .eq('id', p.id)
        }
      }

      setProgresso(i + 1)
    }

    setProcessando(false)

    if (erros.length > 0) {
      setErro(`Erros:\n${erros.join('\n')}`)
    } else {
      onConcluido()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Proximo passo</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {processos.length} processo{processos.length > 1 ? 's' : ''} selecionado{processos.length > 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {processos.length <= 5 && (
          <div className="mb-4 space-y-1">
            {processos.map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-sm">
                <span className="text-slate-400 text-xs">&bull;</span>
                <span className="text-slate-700 truncate">{p.reclamante}</span>
                <span className="text-xs text-slate-400 ml-auto">{STATUS_LABEL[p.status]}</span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Acao</label>
            <select
              value={acao}
              onChange={(e) => setAcao(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              {acoes.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          {precisaResponsavel && (
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Responsavel</label>
              <select
                value={usuarioId}
                onChange={(e) => setUsuarioId(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="">Selecione um usuario</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Observacao (opcional)
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={2}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 resize-none"
              placeholder="Observacao sobre esta transicao..."
            />
          </div>

          {erro && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-md whitespace-pre-line">{erro}</p>
          )}

          {processando && (
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Processando...</span>
                <span>{progresso}/{processos.length}</span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-800 rounded-full transition-all"
                  style={{ width: `${(progresso / processos.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            disabled={processando}
            className="px-4 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-100 border border-slate-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={processando || !acao}
            className="px-4 py-2 rounded-md text-sm bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {processando ? 'Processando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}
