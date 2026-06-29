import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: { cliente?: string; status?: string }
}) {
  const supabase = createClient()

  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, razao_social')
    .eq('status', 'ativo')
    .order('razao_social')

  // Pendentes agrupados por cliente
  const { data: pendentes } = await supabase
    .from('faturamento_itens')
    .select('cliente_id, cliente:clientes(razao_social), valor')
    .eq('status', 'pendente')

  // Agrupa por cliente
  const porCliente: Record<string, { nome: string; total: number; qtd: number }> = {}
  pendentes?.forEach((item: any) => {
    const id = item.cliente_id
    if (!porCliente[id]) {
      porCliente[id] = { nome: item.cliente?.razao_social ?? '--', total: 0, qtd: 0 }
    }
    porCliente[id].total += item.valor ?? 0
    porCliente[id].qtd += 1
  })

  // NFs recentes
  let nfQuery = supabase
    .from('notas_fiscais')
    .select('*, cliente:clientes(razao_social)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (searchParams.status) {
    nfQuery = nfQuery.eq('status', searchParams.status)
  }
  if (searchParams.cliente) {
    nfQuery = nfQuery.eq('cliente_id', searchParams.cliente)
  }

  const { data: notas } = await nfQuery

  const STATUS_COR: Record<string, string> = {
    pendente: 'bg-yellow-100 text-yellow-700',
    faturado: 'bg-blue-100 text-blue-700',
    recebido: 'bg-green-100 text-green-700',
    cancelado: 'bg-red-100 text-red-700',
  }

  const STATUS_LABEL: Record<string, string> = {
    pendente: 'Pendente',
    faturado: 'Faturado',
    recebido: 'Recebido',
    cancelado: 'Cancelado',
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Financeiro</h1>
        <p className="text-sm text-slate-500">Faturamento e historico de notas fiscais</p>
      </div>

      {/* Pendentes por cliente */}
      {Object.keys(porCliente).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Pendentes de faturamento
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(porCliente).map(([clienteId, dados]) => (
              <Link key={clienteId} href={`/financeiro/${clienteId}`}>
                <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-sm transition-shadow cursor-pointer">
                  <p className="font-medium text-slate-800 text-sm truncate">{dados.nome}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-slate-500">{dados.qtd} processo{dados.qtd > 1 ? 's' : ''}</p>
                    <p className="text-sm font-bold text-slate-800">
                      R$ {dados.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Filtros NFs */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Notas fiscais
        </p>
        <form method="GET" className="flex gap-2 flex-wrap mb-4">
          <select
            name="cliente"
            defaultValue={searchParams.cliente}
            className="border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="">Todos os clientes</option>
            {clientes?.map((c) => (
              <option key={c.id} value={c.id}>{c.razao_social}</option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={searchParams.status}
            className="border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="">Todos os status</option>
            <option value="faturado">Faturado</option>
            <option value="recebido">Recebido</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <button
            type="submit"
            className="bg-slate-800 text-white px-3 py-1.5 rounded-md text-sm hover:bg-slate-700"
          >
            Filtrar
          </button>
          <Link
            href="/financeiro"
            className="px-3 py-1.5 rounded-md text-sm text-slate-600 hover:bg-slate-100 border border-slate-200"
          >
            Limpar
          </Link>
        </form>

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Cliente</th>
                <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Numero NF</th>
                <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Competencia</th>
                <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Emissao</th>
                <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Pagamento</th>
                <th className="px-4 py-3 text-right text-xs text-slate-500 font-medium">Total</th>
                <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Status</th>
                <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {!notas || notas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                    Nenhuma nota fiscal encontrada
                  </td>
                </tr>
              ) : (
                notas.map((nf: any) => (
                  <tr key={nf.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-800 font-medium text-xs">
                      {nf.cliente?.razao_social ?? '--'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{nf.numero_nf ?? '--'}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {nf.competencia_inicio && nf.competencia_fim
                        ? `${new Date(nf.competencia_inicio + 'T12:00:00').toLocaleDateString('pt-BR')} a ${new Date(nf.competencia_fim + 'T12:00:00').toLocaleDateString('pt-BR')}`
                        : '--'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {nf.data_emissao
                        ? new Date(nf.data_emissao + 'T12:00:00').toLocaleDateString('pt-BR')
                        : '--'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {nf.data_pagamento
                        ? new Date(nf.data_pagamento + 'T12:00:00').toLocaleDateString('pt-BR')
                        : '--'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">
                      R$ {Number(nf.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COR[nf.status]}`}>
                        {STATUS_LABEL[nf.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/financeiro/nf/${nf.id}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
