import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import EditarUsuarioForm from './EditarUsuarioForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function EditarUsuarioPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const { data: usuario } = await supabase
    .from('perfis_usuario')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!usuario) notFound()

  return (
    <div className="p-6 max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/cadastro/usuarios">
          <button className="text-slate-400 hover:text-slate-600">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-slate-800">{usuario.nome}</h1>
          <p className="text-sm text-slate-500">{usuario.email}</p>
        </div>
      </div>
      <EditarUsuarioForm usuario={usuario} />
    </div>
  )
}
