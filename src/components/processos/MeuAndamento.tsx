'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Processo = {
  id: string
  reclamante: string
  tipo_calculo: string
  status: string
  prazo: string | null
  prazo_fatal: boolean
  cliente: { razao_social: string } | null
}

const STATUS_COR: Record<string, string> = {
  triagem: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  distribuido: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  elaboracao: 'bg-blue-100 text-blue-700 border-blue-200',
  revisando: 'bg-purple-100 text-purple-700 border-purple-200',
}

const STATUS_LABEL: Record<string, string> = {
  triagem: 'Triagem',
  distribuido: 'Distribuido',
  elaboracao: 'Elaboracao',
  revisando: 'Revisando',
}

const TIPO_LABEL: Record<string, string> = {
  contingencia_inicial: 'Contingencia Inicial',
  replica_demonstrativos_he: 'Replica / HE',
  impugnacao_sentenca_liquida: 'Impug. Sentenca Liq.',
  contingencia_decisoes: 'Contingencia Decisoes',
  apresentacao_calculos_art879: 'Apresentacao Art.879',
  impugnacao_calculos: 'Impugnacao Calculos',
  atualizacao_analise_recursal: 'Atualizacao / Recursal',
  parcelamento_art916: 'Parcelamento Art.916',
  discriminacao_verbas_acordo: 'Discriminacao Acordo',
  esocial_s2500: 'E-Social S2500',
  esocial_s2501: 'E-Social S2501',
  fgts_digital_s2500: 'FGTS Digital S2500',
}

export default function MeuAndamento() {
  const [processos, setProcessos] = useState<Processo[]>([])
  const [carregando, setCarregando] = useState(true)
  const hoje = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function carregar() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Busca processos onde o usuario logado e triador, executor ou revisor
      // e o status e ativo (nao entregue/cancelado/pausado)
      const { data } = await supabase
        .from('processos')
        .select(
          'id, reclamante, tipo_calculo, status, prazo, prazo_fatal, cliente:clientes(razao_social)'
        )
        .in('status', ['triagem', 'elaboracao', 'revisando'])
        .or(`triador_id.eq.${user.id},executor_id.eq.${user.id},revisor_id.eq.${user.id}`)
        .order('prazo', { ascending: true, nullsFirst: false })
        .limit(3)

      setProcessos((data as any) ?? [])
      setCarregando(false)
    }

    carregar()
  }, [])

  if (carregando || processos.length === 0) return null

  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
        Meu andamento
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {processos.map((p) => {
          const atrasado = p.prazo && p.prazo < hoje
          const corStatus = STATUS_COR[p.status] ?? 'bg-slate-100 text-slate-700 border-slate-200'

          return (
            <Link key={p.id} href={`/processos/${p.id}`}>
              <div className={`border rounded-lg p-3 hover:shadow-sm transition-shadow cursor-pointer ${corStatus}`}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-xs font-semibold">
                    {STATUS_LABEL[p.status]}
                  </span>
                  {p.prazo && (
                    <span className={`text-xs font-medium whitespace-nowrap ${atrasado ? 'text-red-600' : 'text-slate-600'}`}>
                      {p.prazo_fatal && <span className="mr-0.5">!</span>}
                      {new Date(p.prazo + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {p.reclamante}
                </p>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {p.cliente?.razao_social ?? '--'}
                </p>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {TIPO_LABEL[p.tipo_calculo] ?? p.tipo_calculo}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
