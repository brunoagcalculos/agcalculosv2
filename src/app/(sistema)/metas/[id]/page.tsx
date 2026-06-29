import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function MetaDetalhePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const { data: grupo } = await supabase
    .from('meta_grupos')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!grupo) notFound()

  const { data: realizado } = await supabase
    .from('vw_meta_realizado')
    .select('*')
    .eq('meta_grupo_id', params.id)
    .order('usuario')

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/metas">
          <button className="text-slate-400 hover:text-slate-600">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-800">{grupo.nome}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${grupo.ativo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
              {grupo.ativo ? 'Ativo' : 'Encerrado'}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {new Date(grupo.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR')} ate{' '}
            {new Date(grupo.data_fim + 'T12:00:00').toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Resumo geral */}
      {realizado && realizado.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500">Total meta</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              {realizado.reduce((acc, r) => acc + (r.quantidade_meta ?? 0), 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500">Total realizado</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {realizado.reduce((acc, r) => acc + (r.realizado ?? 0), 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500">Media atingimento</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              {realizado.length > 0
                ? Math.round(
                    realizado.reduce((acc, r) => acc + (r.pct_atingimento ?? 0), 0) /
                      realizado.length
                  )
                : 0}%
            </p>
          </div>
        </div>
      )}

      {/* Tabela por usuario */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Usuario</th>
              <th className="px-4 py-3 text-right text-xs text-slate-500 font-medium">Meta</th>
              <th className="px-4 py-3 text-right text-xs text-slate-500 font-medium">Realizado</th>
              <th className="px-4 py-3 text-right text-xs text-slate-500 font-medium">Atingimento</th>
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Progresso</th>
            </tr>
          </thead>
          <tbody>
            {!realizado || realizado.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Nenhuma meta cadastrada para este periodo
                </td>
              </tr>
            ) : (
              realizado.map((r: any) => {
                const pct = Math.min(r.pct_atingimento ?? 0, 100)
                const cor =
                  pct >= 100 ? 'bg-green-500' :
                  pct >= 70 ? 'bg-blue-500' :
                  pct >= 40 ? 'bg-yellow-500' : 'bg-red-400'

                return (
                  <tr key={`${r.usuario_id}-${r.papel}`} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{r.usuario}</p>
                      <p className="text-xs text-slate-400">{r.papel}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                      {r.quantidade_meta}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                      {r.realizado ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${pct >= 100 ? 'text-green-600' : pct >= 70 ? 'text-blue-600' : pct >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
                        {r.pct_atingimento ?? 0}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${cor}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
