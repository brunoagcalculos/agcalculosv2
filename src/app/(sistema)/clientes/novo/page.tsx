'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Grupo = { id: string; nome: string }

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO',
  'MA','MT','MS','MG','PA','PB','PR','PE','PI',
  'RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

export default function NovoClientePage() {
  const router = useRouter()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [grupos, setGrupos] = useState<Grupo[]>([])

  const [form, setForm] = useState({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    uf: '',
    cidade: '',
    cep: '',
    ddd: '',
    telefone1: '',
    telefone2: '',
    email_principal: '',
    status: 'ativo',
    grupo_id: '',
    dia_de_corte: '',
    observacoes: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('grupos')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome')
      .then(({ data }) => setGrupos(data ?? []))
  }, [])

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSalvar() {
    if (!form.razao_social.trim()) {
      setErro('Razao social e obrigatoria.')
      return
    }
    setSalvando(true)
    setErro(null)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('clientes')
      .insert({
        razao_social: form.razao_social.trim(),
        nome_fantasia: form.nome_fantasia || null,
        cnpj: form.cnpj || null,
        uf: form.uf || null,
        cidade: form.cidade || null,
        cep: form.cep || null,
        ddd: form.ddd || null,
        telefone1: form.telefone1 || null,
        telefone2: form.telefone2 || null,
        email_principal: form.email_principal || null,
        status: form.status,
        grupo_id: form.grupo_id || null,
        dia_de_corte: form.dia_de_corte ? parseInt(form.dia_de_corte) : null,
        observacoes: form.observacoes || null,
      })
      .select('id')
      .single()

    if (error) {
      setErro('Erro ao salvar: ' + error.message)
      setSalvando(false)
      return
    }

    router.push(`/clientes/${data.id}`)
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/clientes">
          <button className="text-slate-400 hover:text-slate-600">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Novo cliente</h1>
          <p className="text-sm text-slate-500">Preencha os dados do cliente</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-5">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Identificacao
          </p>
          <div className="space-y-3">
            <div>
              <Label>Razao Social *</Label>
              <Input
                value={form.razao_social}
                onChange={(e) => set('razao_social', e.target.value)}
                placeholder="Razao social da empresa"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nome Fantasia</Label>
                <Input
                  value={form.nome_fantasia}
                  onChange={(e) => set('nome_fantasia', e.target.value)}
                  placeholder="Nome fantasia"
                />
              </div>
              <div>
                <Label>CNPJ</Label>
                <Input
                  value={form.cnpj}
                  onChange={(e) => set('cnpj', e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Localizacao
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label>Cidade</Label>
              <Input
                value={form.cidade}
                onChange={(e) => set('cidade', e.target.value)}
                placeholder="Cidade"
              />
            </div>
            <div>
              <Label>UF</Label>
              <select
                value={form.uf}
                onChange={(e) => set('uf', e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="">UF</option>
                {UFS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>CEP</Label>
              <Input
                value={form.cep}
                onChange={(e) => set('cep', e.target.value)}
                placeholder="00000-000"
              />
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Contato
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>DDD</Label>
              <Input
                value={form.ddd}
                onChange={(e) => set('ddd', e.target.value)}
                placeholder="11"
                maxLength={2}
              />
            </div>
            <div>
              <Label>Telefone 1</Label>
              <Input
                value={form.telefone1}
                onChange={(e) => set('telefone1', e.target.value)}
                placeholder="00000-0000"
              />
            </div>
            <div>
              <Label>Telefone 2</Label>
              <Input
                value={form.telefone2}
                onChange={(e) => set('telefone2', e.target.value)}
                placeholder="00000-0000"
              />
            </div>
            <div className="col-span-3">
              <Label>Email principal</Label>
              <Input
                type="email"
                value={form.email_principal}
                onChange={(e) => set('email_principal', e.target.value)}
                placeholder="contato@empresa.com.br"
              />
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Operacional
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Status</Label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="prospecto">Prospecto</option>
              </select>
            </div>
            <div>
              <Label>Grupo</Label>
              <select
                value={form.grupo_id}
                onChange={(e) => set('grupo_id', e.target.value)}
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="">Sem grupo</option>
                {grupos.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Dia de corte</Label>
              <Input
                type="number"
                min={1}
                max={31}
                value={form.dia_de_corte}
                onChange={(e) => set('dia_de_corte', e.target.value)}
                placeholder="Ex: 25"
              />
            </div>
          </div>
        </div>

        <div>
          <Label>Observacoes</Label>
          <textarea
            value={form.observacoes}
            onChange={(e) => set('observacoes', e.target.value)}
            placeholder="Observacoes internas sobre o cliente..."
            rows={3}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 resize-none"
          />
        </div>

        {erro && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{erro}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Link href="/clientes">
            <Button variant="outline" size="sm">
              Cancelar
            </Button>
          </Link>
          <Button size="sm" onClick={handleSalvar} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar cliente'}
          </Button>
        </div>
      </div>
    </div>
  )
}
