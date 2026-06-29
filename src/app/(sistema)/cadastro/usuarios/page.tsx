import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'

const PAPEL_COR: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  coordenador: 'bg-purple-100 text-purple-700',
  executor: 'bg-blue-100 text-blue-700',
  triador: 'bg-yellow-100 text-yellow-700',
  terceiro: 'bg-slate-100 text-slate-600',
  financeiro: 'bg-green-100 text-green-700',
  gestor: 'bg-orange-100 text-orange-700',
}

const PAPEL_LABEL: Record<string, string> = {
  admin: 'Admin',
  coordenador: 'Coordenador',
  executor: 'Executor',
  triador: 'Triador',
  terceiro: 'Terceiro',
  financeiro: 'Financeiro',
  gestor: 'Gestor',
}

export default async function UsuariosPage() {
  const supabase = createClient()

  const { data: usuarios } = await supabase
    .from('perfis_usuario')
    .select('*')
    .order('nome')

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Usuarios</h1>
          <p className="text-sm text-slate-500">{usuarios?.length ?? 0} usuarios cadastrados</p>
        </div>
        <Link href="/cadastro/usuarios/novo">
          <button className="flex items-center gap-2 bg-slate-800 text-white px-3 py-1.5 rounded-md text-sm hover:bg-slate-700">
            <Plus size={14} />
            Novo usuario
          </button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Nome</th>
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Email</th>
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Papel</th>
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Status</th>
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Divisor</th>
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {!usuarios || usuarios.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  Nenhum usuario cadastrado
                </td>
              </tr>
            ) : (
              usuarios.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{u.nome}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PAPEL_COR[u.papel] ?? 'bg-slate-100 text-slate-600'}`}>
                      {PAPEL_LABEL[u.papel] ?? u.papel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.divisor ?? '--'}</td>
                  <td className="px-4 py-3">
                    <Link href={`/cadastro/usuarios/${u.id}`} className="text-xs text-blue-600 hover:underline">
                      Editar
                    </Link>
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
