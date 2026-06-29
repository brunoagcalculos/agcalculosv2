'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const PAPEIS = [
  { value: 'admin', label: 'Admin' },
  { value: 'coordenador', label: 'Coordenador' },
  { value: 'executor', label: 'Executor' },
  { value: 'triador', label: 'Triador' },
  { value: 'terceiro', label: 'Terceiro' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'gestor', label: 'Gestor' },
]

export default function NovoUsuarioPage() {
  const router = useRouter()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    papel: 'executor',
    divisor: '',
    salario: '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSalvar() {
    if (!form.nome.trim() || !form.email.trim() || !form.senha.trim()) {
      setErro('Nome, email e senha sao obrigatorios.')
      return
    }
    if (form.senha.length < 6) {
      setErro('Senha deve ter pelo menos 6 caracteres.')
      return
    }

    setSalvando(true)
    setErro(null)

    const supabase = createClient()

    // Cria o usuario no Supabase Auth via Admin API
    // Como nao temos acesso admin no client, usamos signUp e depois inserimos o perfil
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.senha,
      options: {
        data: { nome: form.nome.trim() },
      },
    })

    if (authError) {
      setErro('Erro ao criar usuario: ' + authError.message)
      setSalvando(false)
      return
    }

    if (!authData.user) {
      setErro('Erro ao criar usuario.')
      setSalvando(false)
      return
    }

    // Insere o perfil
    const { error: perfilError } = await supabase.from('perfis_usuario').insert({
      id: authData.user.id,
      nome: form.nome.trim(),
      email: form.email.trim(),
      papel: form.papel,
      ativo: true,
      divisor: form.divisor ? parseFloat(form.divisor) : null,
      salario: form.salario ? parseFloat(form.salario.replace(',', '.')) : null,
    })

    if (perfilError) {
      setErro('Usuario criado no auth mas erro no perfil: ' + perfilError.message)
      setSalvando(false)
      return
    }

    router.push('/cadastro/usuarios')
  }

  const selectClass = 'w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400'

  return (
    <div className="p-6 max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/cadastro/usuarios">
          <button className="text-slate-400 hover:text-slate-600">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Novo usuario</h1>
          <p className="text-sm text-slate-500">Cria acesso ao sistema</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-5">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Dados de acesso
          </p>
          <div className="space-y-3">
            <div>
              <Label>Nome *</Label>
              <Input
                value={form.nome}
                onChange={(e) => set('nome', e.target.value)}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="email@agcalculos.com.br"
              />
            </div>
            <div>
              <Label>Senha inicial *</Label>
              <Input
                type="password"
                value={form.senha}
                onChange={(e) => set('senha', e.target.value)}
                placeholder="Minimo 6 caracteres"
              />
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Perfil
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

        <div className="flex justify-end gap-2 pt-2">
          <Link href="/cadastro/usuarios">
            <Button variant="outline" size="sm">Cancelar</Button>
          </Link>
          <Button size="sm" onClick={handleSalvar} disabled={salvando}>
            {salvando ? 'Criando...' : 'Criar usuario'}
          </Button>
        </div>
      </div>
    </div>
  )
}
