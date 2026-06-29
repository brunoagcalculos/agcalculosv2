'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const PAPEIS = [
  { value: 'admin', label: 'Admin' },
  { value: 'coordenador', label: 'Coordenador' },
  { value: 'executor', label: 'Executor' },
  { value: 'triador', label: 'Triador' },
  { value: 'terceiro', label: 'Terceiro' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'gestor', label: 'Gestor' },
]

type Usuario = {
  id: string
  nome: string
  email: string
  papel: string
  ativo: boolean
  divisor: number | null
  salario: number | null
}

export default function EditarUsuarioForm({ usuario }: { usuario: Usuario }) {
  const router = useRouter()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  const [form, setForm] = useState({
    nome: usuario.nome,
    papel: usuario.papel,
    ativo: usuario.ativo ? 'true' : 'false',
    divisor: usuario.divisor?.toString() ?? '',
    salario: usuario.salario?.toString() ?? '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSalvar() {
    if (!form.nome.trim()) {
      setErro('Nome e obrigatorio.')
      return
    }

    setSalvando(true)
    setErro(null)
    setSucesso(false)

    const supabase = createClient()

    const { error } = await supabase
      .from('perfis_usuario')
      .update({
        nome: form.nome.trim(),
        papel: form.papel,
        ativo: form.ativo === 'true',
        divisor: form.divisor ? parseFloat(form.divisor) : null,
        salario: form.salario ? parseFloat(form.salario.replace(',', '.')) : null,
      })
      .eq('id', usuario.id)

    if (error) {
      setErro('Erro ao salvar: ' + error.message)
      setSalvando(false)
      return
    }

    setSucesso(true)
    setSalvando(false)
    router.refresh()
  }

  const selectClass = 'w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400'

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-5">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Dados do perfil
        </p>
        <div className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input
              value={form.nome}
              onChange={(e) => set('nome', e.target.value)}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={usuario.email} disabled className="bg-slate-50 text-slate-400" />
            <p className="text-xs text-slate-400 mt-1">Email nao pode ser alterado aqui</p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Perfil e acesso
        </p>
        <div className="space-y-3">
          <div>
            <Label>Papel</Label>
            <select
              value={form.papel}
              onChange={(e) => set('papel', e.target.value)}
              className={selectClass}
            >
              {PAPEIS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Status</Label>
            <select
              value={form.ativo}
              onChange={(e) => set('ativo', e.target.value)}
              className={selectClass}
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Divisor de horas</Label>
              <Input
                type="number"
                value={form.divisor}
                onChange={(e) => set('divisor', e.target.value)}
                placeholder="Ex: 220"
              />
            </div>
            <div>
              <Label>Salario (R$)</Label>
              <Input
                value={form.salario}
                onChange={(e) => set('salario', e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>
        </div>
      </div>

      {erro && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{erro}</p>
      )}
      {sucesso && (
        <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-md">
          Salvo com sucesso.
        </p>
      )}

      <div className="flex justify-end pt-2">
        <Button size="sm" onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar alteracoes'}
        </Button>
      </div>
    </div>
  )
}
