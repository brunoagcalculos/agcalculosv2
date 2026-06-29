import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function ClienteDetalhePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const { data: cliente } = await supabase
    .from('clientes')
    .select('*, grupo:grupos(id, nome)')
    .eq('id', params.id)
    .single()

  if (!cliente) notFound()

  const { data: contatos } = await supabase
    .from('contatos')
    .select('*')
    .eq('cliente_id', params.id)
    .eq('ativo', true)
    .order('principal', { ascending: false })

  const { data: parametros } = await supabase
    .from('cliente_parametros')
    .select('*')
    .eq('cliente_id', params.id)
    .single()

  const { count: totalProcessos } = await supabase
    .from('processos')
    .select('*', { count: 'exact', head: true })
    .eq('cliente_id', params.id)

  const { count: emAberto } = await supabase
    .from('processos')
    .select('*', { count: 'exact', head: true })
    .eq('cliente_id', params.id)
    .not('status', 'in', '(entregue,cancelado)')

  const statusCor: Record<string, string> = {
    ativo: 'bg-green-100 text-green-700',
    inativo: 'bg-slate-100 text-slate-600',
    prospecto: 'bg-yellow-100 text-yellow-700',
  }

  function Campo({ label, valor }: { label: string; valor?: string | number | null }) {
    return (
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm text-slate-800 mt-0.5">{valor ?? '--'}</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/clientes">
            <button className="text-slate-400 hover:text-slate-600">
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-800">{cliente.razao_social}</h1>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCor[cliente.status]}`}
              >
                {cliente.status}
              </span>
            </div>
            {cliente.nome_fantasia && (
              <p className="text-sm text-slate-500">{cliente.nome_fantasia}</p>
            )}
          </div>
        </div>
        <Link href={`/clientes/${params.id}/editar`}>
          <Button size="sm" variant="outline" className="gap-2">
            <Pencil size={13} />
            Editar
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Total de processos</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{totalProcessos ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Em aberto</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{emAberto ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Dia de corte</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {cliente.dia_de_corte ? `Dia ${cliente.dia_de_corte}` : '--'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
              Dados gerais
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Campo label="CNPJ" valor={cliente.cnpj} />
              <Campo label="Grupo" valor={(cliente as any).grupo?.nome} />
              <Campo label="Cidade" valor={cliente.cidade} />
              <Campo label="UF" valor={cliente.uf} />
              <Campo label="CEP" valor={cliente.cep} />
              <Campo label="Email principal" valor={cliente.email_principal} />
              <Campo label="DDD" valor={cliente.ddd} />
              <Campo label="Telefone 1" valor={cliente.telefone1} />
              <Campo label="Telefone 2" valor={cliente.telefone2} />
            </div>
            {cliente.observacoes && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400">Observacoes</p>
                <p className="text-sm text-slate-700 mt-1">{cliente.observacoes}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Contatos
              </p>
              <Link href={`/clientes/${params.id}/contatos/novo`}>
                <button className="text-xs text-blue-600 hover:underline">+ Adicionar</button>
              </Link>
            </div>
            {!contatos || contatos.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhum contato cadastrado</p>
            ) : (
              <div className="space-y-3">
                {contatos.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start justify-between py-2 border-b border-slate-50 last:border-0"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-800">{c.nome}</p>
                        {c.principal && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                            Principal
                          </span>
                        )}
                      </div>
                      {c.cargo && <p className="text-xs text-slate-400">{c.cargo}</p>}
                      <div className="flex gap-3 mt-1">
                        {c.email && <p className="text-xs text-slate-500">{c.email}</p>}
                        {c.celular && <p className="text-xs text-slate-500">{c.celular}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Parametros INSS
              </p>
            </div>
            {!parametros ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-400">Nao configurado</p>
                <Link href={`/clientes/${params.id}/parametros`}>
                  <button className="text-xs text-blue-600 hover:underline">Configurar</button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <Campo
                  label="INSS Empresa"
                  valor={parametros.inss_empresa ? `${parametros.inss_empresa}%` : null}
                />
                <Campo
                  label="Grau de Risco (RAT/SAT)"
                  valor={parametros.inss_grau_risco ? `${parametros.inss_grau_risco}%` : null}
                />
                <Campo
                  label="Terceiros"
                  valor={parametros.inss_terceiros ? `${parametros.inss_terceiros}%` : null}
                />
                {parametros.aviso_calculos && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-400">Aviso nos calculos</p>
                    <p className="text-xs text-slate-600 mt-1">{parametros.aviso_calculos}</p>
                  </div>
                )}
                <Link href={`/clientes/${params.id}/parametros`}>
                  <button className="text-xs text-blue-600 hover:underline mt-1">
                    Editar parametros
                  </button>
                </Link>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Acoes
            </p>
            <div className="space-y-2">
              <Link
                href={`/processos?cliente=${params.id}`}
                className="block text-sm text-blue-600 hover:underline"
              >
                Ver processos deste cliente
              </Link>
              <Link
                href={`/financeiro?cliente=${params.id}`}
                className="block text-sm text-blue-600 hover:underline"
                >
                Ver historico financeiro
              </Link>
             <Link
  href={`/clientes/${params.id}/precos`}
  className="block text-sm text-blue-600 hover:underline"
>
  Tabela de precos →
</Link> 
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
