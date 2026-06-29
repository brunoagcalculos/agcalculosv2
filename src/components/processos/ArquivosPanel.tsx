'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ExternalLink, Paperclip, Upload, Trash2, X } from 'lucide-react'

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
  const [aba, setAba] = useState<'arquivo_cliente' | 'relatorio'>('arquivo_cliente')
  const [uploading, setUploading] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const [erro, setErro] = useState<string | null>(null)
  const [descricao, setDescricao] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const bucket = aba === 'arquivo_cliente' ? 'arquivos-processos' : 'relatorios-processos'
  const arquivosFiltrados = arquivos.filter((a) => a.tipo === aba)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 20 * 1024 * 1024) {
      setErro('Arquivo muito grande. Maximo 20MB.')
      return
    }

    if (file.type !== 'application/pdf') {
      setErro('Apenas arquivos PDF sao aceitos.')
      return
    }

    setUploading(true)
    setErro(null)
    setProgresso(10)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Caminho: processoId/timestamp_nomeoriginal.pdf
    const timestamp = Date.now()
    const nomeArquivo = `${processoId}/${timestamp}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

    setProgresso(30)

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(nomeArquivo, file, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      setErro('Erro no upload: ' + uploadError.message)
      setUploading(false)
      setProgresso(0)
      return
    }

    setProgresso(70)

    // Gera URL publica assinada (valida por 1 ano)
    const { data: urlData } = await supabase.storage
      .from(bucket)
      .createSignedUrl(nomeArquivo, 60 * 60 * 24 * 365)

    setProgresso(90)

    // Salva referencia no banco
    const { error: dbError } = await supabase.from('processo_arquivos').insert({
      processo_id: processoId,
      tipo: aba,
      nome: descricao.trim() || file.name,
      url: urlData?.signedUrl ?? '',
      descricao: descricao.trim() || null,
      enviado_por: user?.id,
    })

    if (dbError) {
      setErro('Upload feito mas erro ao salvar referencia: ' + dbError.message)
      setUploading(false)
      setProgresso(0)
      return
    }

    setProgresso(100)
    setDescricao('')
    setUploading(false)
    setProgresso(0)

    if (inputRef.current) inputRef.current.value = ''
    router.refresh()
  }

  async function handleExcluir(arquivo: Arquivo) {
    if (!confirm('Confirma a exclusao deste arquivo?')) return

    const supabase = createClient()

    // Extrai o path do arquivo da URL assinada
    // A URL tem formato: .../storage/v1/object/sign/bucket/path?token=...
    const urlObj = new URL(arquivo.url)
    const pathParts = urlObj.pathname.split(`/${bucket}/`)
    const filePath = pathParts[1]?.split('?')[0]

    if (filePath) {
      await supabase.storage.from(bucket).remove([filePath])
    }

    await supabase.from('processo_arquivos').delete().eq('id', arquivo.id)
    router.refresh()
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('pt-BR')
  }

  function formatSize(url: string) {
    return 'PDF'
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
        Arquivos
      </p>

      {/* Abas */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setAba('arquivo_cliente')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            aba === 'arquivo_cliente'
              ? 'bg-slate-800 text-white'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          Arq. Cliente ({arquivos.filter((a) => a.tipo === 'arquivo_cliente').length})
        </button>
        <button
          onClick={() => setAba('relatorio')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            aba === 'relatorio'
              ? 'bg-slate-800 text-white'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          Relatorios AG ({arquivos.filter((a) => a.tipo === 'relatorio').length})
        </button>
      </div>

      {/* Upload */}
      <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-dashed border-slate-300">
        <div className="space-y-2">
          <div>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descricao do arquivo (opcional)"
              className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer bg-slate-800 text-white px-3 py-1.5 rounded-md text-xs hover:bg-slate-700 disabled:opacity-50">
              <Upload size={12} />
              {uploading ? 'Enviando...' : 'Selecionar PDF'}
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <span className="text-xs text-slate-400">Apenas PDF, maximo 20MB</span>
          </div>
        </div>

        {/* Barra de progresso */}
        {uploading && (
          <div className="mt-2">
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-800 rounded-full transition-all duration-300"
                style={{ width: `${progresso}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Enviando arquivo... {progresso}%</p>
          </div>
        )}

        {erro && (
          <div className="mt-2 flex items-center gap-2 text-xs text-red-600 bg-red-50 px-2 py-1.5 rounded">
            <X size={12} />
            {erro}
          </div>
        )}
      </div>

      {/* Lista de arquivos */}
      {arquivosFiltrados.length === 0 ? (
        <p className="text-sm text-slate-400">
          Nenhum {aba === 'arquivo_cliente' ? 'arquivo do cliente' : 'relatorio'} enviado
        </p>
      ) : (
        <div className="space-y-2">
          {arquivosFiltrados.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 group"
            >
              <div className="w-8 h-8 bg-red-50 rounded flex items-center justify-center flex-shrink-0">
                <Paperclip size={14} className="text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{a.nome}</p>
                <p className="text-xs text-slate-400">
                  {a.enviado?.nome ?? 'Sistema'} &middot; {formatDate(a.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="Abrir arquivo"
                >
                  <ExternalLink size={14} />
                </a>
                <button
                  onClick={() => handleExcluir(a)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Excluir arquivo"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
