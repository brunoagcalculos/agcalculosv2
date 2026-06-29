'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Ocorrencia = {
  id: string
  texto: string
  resolvida: boolean
  created_at: string
  usuario: { nome: string } | null
}

type Props = {
  processoId: string
  ocorrencias: Ocorrencia[]
}

export default function OcorrenciasPanel({ processoId, ocorrencias }: Props) {
  const router = useRouter()
  const [texto, setTexto] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [showForm, setShowForm] = useState(false)

  async function handleSalvar() {
    if (!texto.trim()) return
    setSalvando(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('processo_ocorrencias').insert({
      processo_id: processoId,
      usuario_id: user?.id,
      texto: texto.trim(),
    })

    setTexto('')
    setShowForm(false)
    setSalvando(false)
    router.refresh()
  }

  async function handleResolver(id: string, resolvida: boolean) {
    const supabase = createClient()
    await supabase
      .from('processo_ocorrencias')
      .update({ resolvida: !resolvida })
      .eq('id', id)
    router.refresh()
  }

  function formatDateTime(d: string) {
    return new Date(d).toLocaleString('pt-BR')
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          Ocorrencias ({ocorrencias.length})
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs text-blue-600 hover:underline"
        >
          + Nova ocorrencia
        </button>
      </div>

      {showForm && (
        <div className="space-y-2 mb-4">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Descreva a ocorrencia..."
            rows={3}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSalvar}
              disabled={salvando}
              className="bg-slate-800 text-white px-3 py-1.5 rounded-md text-xs hover:bg-slate-700 disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 rounded-md text-xs text-slate-600 hover:bg-slate-100 border border-slate-200"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {ocorrencias.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhuma ocorrencia registrada</p>
      ) : (
        <div className="space-y-3">
          {ocorrencias.map((o) => (
            <div
              key={o.id}
              className={`p-3 rounded-md border text-sm ${
                o.resolvida
                  ? 'border-slate-100 bg-slate-50 text-slate-400'
                  : 'border-yellow-100 bg-yellow-50 text-slate-700'
              }`}
            >
              <p className={o.resolvida ? 'line-through' : ''}>{o.texto}</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-slate-400">
                  {o.usuario?.nome ?? 'Sistema'} &middot; {formatDateTime(o.created_at)}
                </p>
                <button
                  onClick={() => handleResolver(o.id, o.resolvida)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {o.resolvida ? 'Reabrir' : 'Resolver'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
