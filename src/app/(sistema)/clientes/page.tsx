import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; grupo?: string }
}) {
  const supabase = createClient()

  let query = supabase
    .from('clientes')
    .select('id, razao_social, nome_fantasia, cnpj, uf, cidade, status, dia_de_corte, grupo:grupos(id, nome)')
    .order('razao_social')

  if (searchParams.q) {
    query = query.ilike('razao_social', `%${searchParams.q}%`)
  }
  if (searchParams.status) {
    query = query.eq('status', searchParams.status)
  }
  if (searchParams.grupo) {
    query = query.eq('grupo_id', searchParams.grupo)
  }

  const { data: clientes } = await query

  const { data: grupos } = await supabase
    .from('grupos')
    .select('id, nome')
    .eq('ativo', true)
    .order('nome')

  const statusCor: Record<string, string> = {
    ativo: 'bg-green-100 text-green-700',
    inativo: 'bg-slate-100 text-slate-600',
    prospecto: 'bg-yellow-100 text-yellow-700',
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Clientes</h1>
          <p className="text-sm text-slate-500">{clientes?.length ?? 0} clientes encontrados</p>
        </div>
        <Link href="/clientes/novo">
          <Button size="sm" className="gap-2">
            <Plus size={14} />
            Novo cliente
          </Button>
        </Link>
      </div>

      <form method="GET" className="flex gap-2 flex-wrap">
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Buscar por razao social..."
          className="border border-slate-200 rounded-md px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-slate-400"
        />
        <select
          name="status"
          defaultValue={searchParams.status}
          className="border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
        >
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
          <option value="prospecto">Prospecto</option>
        </select>
        <select
          name="grupo"
          defaultValue={searchParams.grupo}
          className="border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
        >
          <option value="">Todos os grupos</option>
          {grupos?.map((g) => (
            <option key={g.id} value={g.id}>{g.nome}</option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-slate-800 text-white px-3 py-1.5 rounded-md text-sm hover:bg-slate-700"
        >
          Filtrar
        </button>
        <Link
          href="/clientes"
          className="px-3 py-1.5 rounded-md text-sm text-slate-600 hover:bg-slate-100 border border-slate-200"
        >
          Limpar
        </Link>
      </form>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Razao Social</th>
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">CNPJ</th>
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Cidade/UF</th>
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Grupo</th>
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Corte</th>
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {!clientes || clientes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  Nenhum cliente encontrado
                </td>
              </tr>
            ) : (
              clientes.map((c: any) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer">
                  <td className="px-4 py-3">
                    <Link href={`/clientes/${c.id}`} className="hover:underline">
                      <p className="font-medium text-slate-800">{c.razao_social}</p>
                      {c.nome_fantasia && (
                        <p className="text-xs text-slate-400">{c.nome_fantasia}</p>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.cnpj ?? '--'}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.cidade && c.uf ? `${c.cidade}/${c.uf}` : '--'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.grupo?.nome ?? '--'}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.dia_de_corte ? `Dia ${c.dia_de_corte}` : '--'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCor[c.status]}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
