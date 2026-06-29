'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Props = {
  processoId: string
  anotacoes: {
    geral: string | null
    cartao_ponto: string | null
    hollerith: string | null
    outros: string | null
    equiparacao: string | null
    comissao: string | null
  }
}

const TABS = [
  { key: 'geral', label: 'Geral' },
  { key: 'cartao_ponto', label: 'Cartao Ponto' },
  { key: 'hollerith', label: 'Hollerith' },
  { key: 'outros', label: 'Outros' },
  { key: 'equiparacao', label: 'Equiparacao' },
  { key: 'comissao', label: 'Comissao' },
]

export default function AnotacoesPanel({ processoId, anotacoes }: Props) {
  const router = useRouter()
  const [aba, setAba] = useState('geral')
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [valores, setValores] = useState(anotacoes)

  const chave = `anotacoes_${aba}` as keyof typeof valores
  const valor = valores[chave as keyof typeof anotacoes]

  async function handleSalvar() {
    setSalvando(true)
    const supabase = createClient()
    await supabase
      .from('processos')
      .update({ [`anotacoes_${aba}`]: valor })
      .eq('id', processoId)
    setSalvando(false)
    setEditando(false)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
        Anotacoes
      </p>
      <div className="flex gap-1 mb-3 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setAba(t.key); setEditando(false) }}
            className={`px-3 py-1 rounded-md text-xs transition-colors ${
              aba === t.key
                ? 'bg-slate-800 text-white'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {editando ? (
        <div className="space-y-2">
          <textarea
            value={valor ?? ''}
            onChange={(e) =>
              setValores((prev) => ({ ...prev, [chave]: e.target.value }))
            }
            rows={5}
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
              onClick={() => setEditando(false)}
              className="px-3 py-1.5 rounded-md text-xs text-slate-600 hover:bg-slate-100 border border-slate-200"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div>
          {valor ? (
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{valor}</p>
          ) : (
            <p className="text-sm text-slate-400">Sem anotacoes</p>
          )}
          <button
            onClick={() => setEditando(true)}
            className="mt-2 text-xs text-blue-600 hover:underline"
          >
            {valor ? 'Editar' : '+ Adicionar anotacao'}
          </button>
        </div>
      )}
    </div>
  )
}
