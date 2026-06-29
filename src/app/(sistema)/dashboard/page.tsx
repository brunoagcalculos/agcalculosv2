import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = createClient()

  const { count: totalProcessos } = await supabase
    .from('processos')
    .select('*', { count: 'exact', head: true })

  const { count: emAberto } = await supabase
    .from('processos')
    .select('*', { count: 'exact', head: true })
    .not('status', 'in', '(entregue,cancelado)')

  const { count: entregueHoje } = await supabase
    .from('processos')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'entregue')
    .gte('data_entrega', new Date().toISOString().split('T')[0])

  const { data: vencendoHoje } = await supabase
    .from('processos')
    .select('id, reclamante, tipo_calculo, prazo, status, cliente:clientes(razao_social)')
    .not('status', 'in', '(entregue,cancelado)')
    .eq('prazo', new Date().toISOString().split('T')[0])
    .order('prazo')
    .limit(10)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500">Visão geral da operação</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Total de processos</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{totalProcessos ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Em aberto</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{emAberto ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Entregues hoje</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{entregueHoje ?? 0}</p>
        </div>
      </div>

      {/* Vencendo hoje */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Prazo vencendo hoje</h2>
        </div>
        {!vencendoHoje || vencendoHoje.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-400">
            Nenhum processo com prazo para hoje
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-4 py-2 text-left text-xs text-slate-500 font-medium">Reclamante</th>
                <th className="px-4 py-2 text-left text-xs text-slate-500 font-medium">Cliente</th>
                <th className="px-4 py-2 text-left text-xs text-slate-500 font-medium">Tipo</th>
                <th className="px-4 py-2 text-left text-xs text-slate-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {vencendoHoje.map((p: any) => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-800">{p.reclamante}</td>
                  <td className="px-4 py-2 text-slate-600">{p.cliente?.razao_social ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-600">{p.tipo_calculo}</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}