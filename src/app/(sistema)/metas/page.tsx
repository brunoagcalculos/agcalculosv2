import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function MetasPage() {
  const supabase = createClient()

  const { data: grupos } = await supabase
    .from('meta_grupos')
    .select('*')
    .order('data_inicio', { ascending: false })

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Metas</h1>
          <p className="text-sm text-slate-500">Acompanhamento de metas por periodo</p>
        </div>
        <Link href="/metas/novo">
          <button className="flex items-center gap-2 bg-slate-800 text-white px-3 py-1.5 rounded-md text-sm hover:bg-slate-700">
            <Plus size={14} />
            Novo periodo
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {!grupos || grupos.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-10 text-center text-slate-400">
            Nenhum periodo de metas cadastrado
          </div>
        ) : (
          grupos.map((g) => (
            <Link key={g.id} href={`/metas/${g.id}`}>
              <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-sm transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{g.nome}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(g.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR')} ate{' '}
                      {new Date(g.data_fim + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${g.ativo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {g.ativo ? 'Ativo' : 'Encerrado'}
                    </span>
                    <span className="text-slate-300 text-sm">›</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
