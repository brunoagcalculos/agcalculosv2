'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ExternalLink, Paperclip } from 'lucide-react'

type Arquivo = {
  id: string
  tipo: string
  nome: string
  url: string
  descricao: string | null
  created_at: string
  enviado: { nome: string } | null
}

type Props = {
  processoId: string
  arquivos: Arquivo[]
}

export default function ArquivosPanel({ processoId, arquivos }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ tipo: 'arquivo_cliente', nome: '', url: '', descricao: '' })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSalvar() {
    if (!form.nome.trim() || !form.url.trim()) return
    setSalvando(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('processo_arquivos').insert({
      processo_id: processoId,
      tipo: form.tipo,
      nome: form.nome.trim(),
      url: form.url.trim(),
      descricao: form.descricao || null,
      enviado_por: user?.id,
    })

    setForm({ tipo: 'arquivo_cliente', nome: '', url: '', descricao: '' })
    setShowForm(false)
    setSalvando(false)
    router.refresh()
  }

  const clienteArqs = arquivos.filter((a) => a.tipo === 'arquivo_cliente')
  const relatorios = arquivos.filter((a) => a.tipo === 'relatorio')

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('pt-BR')
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          Arquivos
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs text-blue-600 hover:underline"
        >
          + Adicionar link
        </button>
      </div>

      {showForm && (
        <div className="space-y-2 mb-4 p-3 bg-slate-50 rounded-md">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500">Tipo</label>
              <select
                value={form.tipo}
                onChange={(e) => set('tipo', e.target.value)}
                className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:outline-none"
              >
                <option value="arquivo_cliente">Arquivo do Cliente</option>
                <option value="relatorio">Relatorio AG</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Nome</label>
              <input
                value={form.nome}
                onChange={(e) => set('nome', e.target.value)}
                placeholder="Nome do arquivo"
                className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500">URL / Link</label>
            <input
              value={form.url}
              onChange={(e) => set('url', e.target.value)}
              placeholder="https://drive.google.com/..."
              className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Descricao (opcional)</label>
            <input
              value={form.descricao}
              onChange={(e) => set('descricao', e.target.value)}
              placeholder="Descricao do arquivo"
              className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:outline-none"
            />
          </div>
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

      <div className="space-y-3">
        {clienteArqs.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Arquivos do cliente</p>
            {clienteArqs.map((a) => (
              <a
                key={a.id}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-blue-600 hover:underline py-1"
              >
                <Paperclip size={12} />
                {a.nome}
                <ExternalLink size={10} className="text-slate-400" />
              </a>
            ))}
          </div>
        )}

        {relatorios.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Relatorios AG</p>
            {relatorios.map((a) => (
              <a
                key={a.id}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-blue-600 hover:underline py-1"
              >
                <Paperclip size={12} />
                {a.nome}
                <ExternalLink size={10} className="text-slate-400" />
              </a>
            ))}
          </div>
        )}

        {arquivos.length === 0 && (
          <p className="text-sm text-slate-400">Nenhum arquivo vinculado</p>
        )}
      </div>
    </div>
  )
}
