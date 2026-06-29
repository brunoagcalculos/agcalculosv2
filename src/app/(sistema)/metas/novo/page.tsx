'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Usuario = { id: string; nome: string; papel: string }

export default function NovoMetaPage() {
  const router = useRouter()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])

  const [form, setForm] = useState({
    nome: '',
    data_inicio: '',
    data_fim: '',
  })

  const [metas, setMetas] = useState<Record<string, string>>({})

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('perfis_usuario')
      .select('id, nome, papel')
      .eq('ativo', true)
      .order('nome')
      .then(({ data }) => {
        setUsuarios(data ?? [])
        const inicial: Record<string, string> = {}
        data?.forEach((u) => { inicial[u.id] = '' })
        setMetas(inicial)
      })
  }, [])

  function setForm_(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSalvar() {
    if (!form.nome.trim() || !form.data_inicio || !form.data_fim) {
      setErro('Nome, data inicio e data fim sao obrigatorios.')
      return
    }

    const temAlgumaMeta = Object.values(metas).some((v) => v && parseInt(v) > 0)
    if (!temAlgumaMeta) {
      setErro('Defina a meta de pelo menos um usuario.')
      return
    }

    setSalvando(true)
    setErro(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Cria o grupo de metas
    const { data: grupo, error: grupoError } = await supabase
      .from('meta_grupos')
      .insert({
        nome: form.nome.trim(),
        data_inicio: form.data_inicio,
        data_fim: form.data_fim,
        ativo: true,
        criado_por: user?.id,
      })
      .select('id')
      .single()

    if (grupoError || !grupo) {
      setErro('Erro ao criar periodo: ' + grupoError?.message)
      setSalvando(false)
      return
    }

    // Insere metas por usuario
    const itens = Object.entries(metas)
      .filter(([, v]) => v && parseInt(v) > 0)
      .map(([usuario_id, quantidade]) => ({
        meta_grupo_id: grupo.id,
        usuario_id,
        papel: 'executor',
        quantidade_meta: parseInt(quantidade),
      }))

    const { error: metasError } = await supabase.from('metas').insert(itens)

    if (metasError) {
      setErro('Erro ao salvar metas: ' + metasError.message)
      setSalvando(false)
      return
    }

    router.push(`/metas/${grupo.id}`)
  }

  // Sugestao de nome baseada nas datas
  useEffect(() => {
    if (form.data_inicio && !form.nome) {
      const d = new Date(form.data_inicio + 'T12:00:00')
      const mes = d.toLocaleString('pt-BR', { month: 'long' })
      const ano = d.getFullYear()
      setForm_('nome', `${mes.charAt(0).toUpperCase() + mes.slice(1)} ${ano}`)
    }
  }, [form.data_inicio])

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/metas">
          <button className="text-slate-400 hover:text-slate-600">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Novo periodo de metas</h1>
          <p className="text-sm text-slate-500">Define as metas de entrega por usuario</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-5">
        {/* Periodo */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Periodo
          </p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data inicio *</Label>
                <Input
                  type="date"
                  value={form.data_inicio}
                  onChange={(e) => setForm_('data_inicio', e.target.value)}
                />
              </div>
              <div>
                <Label>Data fim *</Label>
                <Input
                  type="date"
                  value={form.data_fim}
                  onChange={(e) => setForm_('data_fim', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Nome do periodo *</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm_('nome', e.target.value)}
                placeholder="Ex: Junho 2026"
              />
            </div>
          </div>
        </div>

        {/* Metas por usuario */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Meta de entregas por usuario
          </p>
          <div className="space-y-2">
            {usuarios.map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm text-slate-800">{u.nome}</p>
                  <p className="text-xs text-slate-400">{u.papel}</p>
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    min={0}
                    value={metas[u.id] ?? ''}
                    onChange={(e) =>
                      setMetas((prev) => ({ ...prev, [u.id]: e.target.value }))
                    }
                    placeholder="0"
                    className="text-center"
                  />
                </div>
                <span className="text-xs text-slate-400 w-16">processos</span>
              </div>
            ))}
          </div>
        </div>

        {erro && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{erro}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Link href="/metas">
            <Button variant="outline" size="sm">Cancelar</Button>
          </Link>
          <Button size="sm" onClick={handleSalvar} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Criar metas'}
          </Button>
        </div>
      </div>
    </div>
  )
}
