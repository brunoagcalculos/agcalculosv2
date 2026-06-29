'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Plus, RefreshCw } from 'lucide-react'
import ModalProximoPasso from '@/components/processos/ModalProximoPasso'
import MeuAndamento from '@/components/processos/MeuAndamento'
const STATUS_COR: Record<string, string> = {
  novo: 'bg-slate-100 text-slate-700',
  triagem: 'bg-yellow-100 text-yellow-700',
  elaboracao: 'bg-blue-100 text-blue-700',
  distribuido: 'bg-cyan-100 text-cyan-700',
  revisar: 'bg-orange-100 text-orange-700',
  revisando: 'bg-purple-100 text-purple-700',
  revisado: 'bg-indigo-100 text-indigo-700',
  aprovacao: 'bg-orange-100 text-orange-700',
  entregue: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-700',
  pausa_triagem: 'bg-yellow-50 text-yellow-600',
  pausa_execucao: 'bg-blue-50 text-blue-600',
  pausa_revisao: 'bg-purple-50 text-purple-600',
}

const STATUS_LABEL: Record<string, string> = {
  novo: 'Novo',
  triagem: 'Triagem',
  elaboracao: 'Elaboracao',
  revisar: 'Revisar',
  revisando: 'Revisando',
  revisado: 'Revisado',
  aprovacao: 'Aprovacao',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
  pausa_triagem: 'Pausa Triagem',
  pausa_execucao: 'Pausa Execucao',
  pausa_revisao: 'Pausa Revisao',
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

type Processo = {
  id: string
  cnj: string | null
  reclamante: string
  tipo_calculo: string
  status: string
  prazo: string | null
  prazo_fatal: boolean
  requer_revisao: boolean
  data_cadastro: string
  cliente: { id: string; razao_social: string } | null
  executor: { id: string; nome: string } | null
  triador: { id: string; nome: string } | null
}

type Filtros = {
  q: string
  status: string
  cliente_id: string
  prazo: string
  periodo: string
}

export default function ProcessosFila() {
  const [processos, setProcessos] = useState<Processo[]>([])
  const [clientes, setClientes] = useState<{ id: string; razao_social: string }[]>([])
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [carregando, setCarregando] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filtros, setFiltros] = useState<Filtros>({
    q: '',
    status: '',
    cliente_id: '',
    prazo: '',
    periodo: 'todos',
  })

  const hoje = new Date().toISOString().split('T')[0]

  const carregar = useCallback(async () => {
    setCarregando(true)
    const supabase = createClient()

    let query = supabase
      .from('processos')
      .select(
        'id, cnj, reclamante, tipo_calculo, status, prazo, prazo_fatal, requer_revisao, data_cadastro, cliente:clientes(id, razao_social), executor:perfis_usuario!processos_executor_id_fkey(id, nome), triador:perfis_usuario!processos_triador_id_fkey(id, nome)'
      )
      .not('status', 'in', '(entregue,cancelado)')
      .order('prazo', { ascending: true, nullsFirst: false })
      .limit(200)

    if (filtros.q) query = query.ilike('reclamante', `%${filtros.q}%`)
    if (filtros.status) query = query.eq('status', filtros.status)
    if (filtros.cliente_id) query = query.eq('cliente_id', filtros.cliente_id)

    if (filtros.prazo === 'hoje') {
      query = query.eq('prazo', hoje)
    } else if (filtros.prazo === 'semana') {
      const fim = new Date()
      fim.setDate(fim.getDate() + 7)
      query = query.gte('prazo', hoje).lte('prazo', fim.toISOString().split('T')[0])
    } else if (filtros.prazo === 'atrasado') {
      query = query.lt('prazo', hoje)
    }

    if (filtros.periodo === 'hoje') {
      query = query.gte('data_cadastro', hoje + 'T00:00:00')
    }

    const { data } = await query
    setProcessos((data as any) ?? [])
    setSelecionados([])
    setCarregando(false)
  }, [filtros, hoje])

  useEffect(() => {
    carregar()
  }, [carregar])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('clientes')
      .select('id, razao_social')
      .eq('status', 'ativo')
      .order('razao_social')
      .then(({ data }) => setClientes(data ?? []))
  }, [])

  function toggleSelecionado(id: string) {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function toggleTodos() {
    if (selecionados.length === processos.length) {
      setSelecionados([])
    } else {
      setSelecionados(processos.map((p) => p.id))
    }
  }

  function setFiltro(field: keyof Filtros, value: string) {
    setFiltros((prev) => ({ ...prev, [field]: value }))
  }

  const processosSelecionados = processos.filter((p) => selecionados.includes(p.id))

  const selectClass =
    'border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400'

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <MeuAndamento />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Fila de Processos</h1>
          <p className="text-sm text-slate-500">
            {processos.length} em aberto
            {selecionados.length > 0 && (
              <span className="ml-2 font-medium text-slate-700">
                &middot; {selecionados.length} selecionado{selecionados.length > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={carregar}
            className="p-1.5 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-md"
          >
            <RefreshCw size={15} className={carregando ? 'animate-spin' : ''} />
          </button>
          <Link href="/processos/novo">
            <button className="flex items-center gap-2 bg-slate-800 text-white px-3 py-1.5 rounded-md text-sm hover:bg-slate-700">
              <Plus size={14} />
              Novo processo
            </button>
          </Link>
        </div>
      </div>

      {/* Barra de acoes em lote */}
      {selecionados.length > 0 && (
        <div className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2.5 rounded-lg">
          <span className="text-sm font-medium">
            {selecionados.length} processo{selecionados.length > 1 ? 's' : ''} selecionado{selecionados.length > 1 ? 's' : ''}
          </span>
          <div className="flex-1" />
          <button
            onClick={() => setShowModal(true)}
            className="bg-white text-slate-800 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-slate-100"
          >
            Proximo passo
          </button>
          <button
            onClick={() => setSelecionados([])}
            className="text-slate-300 hover:text-white text-sm px-2"
          >
            Desmarcar
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex rounded-md border border-slate-200 overflow-hidden">
          <button
            onClick={() => setFiltro('periodo', 'hoje')}
            className={`px-3 py-1.5 text-sm ${filtros.periodo === 'hoje' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Hoje
          </button>
          <button
            onClick={() => setFiltro('periodo', 'todos')}
            className={`px-3 py-1.5 text-sm border-l border-slate-200 ${filtros.periodo === 'todos' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Todos
          </button>
        </div>

        <input
          value={filtros.q}
          onChange={(e) => setFiltro('q', e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && carregar()}
          placeholder="Buscar reclamante..."
          className={`${selectClass} w-48`}
        />

        <select
          value={filtros.status}
          onChange={(e) => setFiltro('status', e.target.value)}
          className={selectClass}
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABEL)
            .filter(([v]) => !['entregue', 'cancelado'].includes(v))
            .map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
        </select>

        <select
          value={filtros.cliente_id}
          onChange={(e) => setFiltro('cliente_id', e.target.value)}
          className={selectClass}
        >
          <option value="">Todos os clientes</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.razao_social}</option>
          ))}
        </select>

        <select
          value={filtros.prazo}
          onChange={(e) => setFiltro('prazo', e.target.value)}
          className={selectClass}
        >
          <option value="">Todos os prazos</option>
          <option value="atrasado">Atrasado</option>
          <option value="hoje">Vence hoje</option>
          <option value="semana">Proximos 7 dias</option>
        </select>

        <button
          onClick={() => setFiltros({ q: '', status: '', cliente_id: '', prazo: '', periodo: 'todos' })}
          className="text-sm text-slate-500 hover:text-slate-700 px-2"
        >
          Limpar
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-3 py-3 w-8">
                <input
                  type="checkbox"
                  checked={selecionados.length === processos.length && processos.length > 0}
                  onChange={toggleTodos}
                  className="rounded"
                />
              </th>
              <th className="px-3 py-3 text-left text-xs text-slate-500 font-medium">Status</th>
              <th className="px-3 py-3 text-left text-xs text-slate-500 font-medium">Tipo</th>
              <th className="px-3 py-3 text-left text-xs text-slate-500 font-medium">Reclamante</th>
              <th className="px-3 py-3 text-left text-xs text-slate-500 font-medium">Cliente</th>
              <th className="px-3 py-3 text-left text-xs text-slate-500 font-medium">Cadastro</th>
              <th className="px-3 py-3 text-left text-xs text-slate-500 font-medium">Prazo</th>
              <th className="px-3 py-3 text-left text-xs text-slate-500 font-medium">Triador</th>
              <th className="px-3 py-3 text-left text-xs text-slate-500 font-medium">Executor</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-slate-400">
                  Carregando...
                </td>
              </tr>
            ) : processos.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-slate-400">
                  Nenhum processo em aberto
                </td>
              </tr>
            ) : (
              processos.map((p) => {
                const atrasado = p.prazo && p.prazo < hoje
                const selecionado = selecionados.includes(p.id)
                return (
                  <tr
                    key={p.id}
                    className={`border-b border-slate-50 hover:bg-slate-50 ${selecionado ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={selecionado}
                        onChange={() => toggleSelecionado(p.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COR[p.status]}`}>
                        {STATUS_LABEL[p.status]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">
                      {TIPO_LABEL[p.tipo_calculo] ?? p.tipo_calculo}
                    </td>
                    <td className="px-3 py-2.5">
                      <Link href={`/processos/${p.id}`} className="hover:underline">
                        <p className="font-medium text-slate-800 text-sm">{p.reclamante}</p>
                        {p.cnj && (
                          <p className="text-xs text-slate-400 font-mono">{p.cnj}</p>
                        )}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">
                      {p.cliente?.razao_social ?? '--'}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">
                      {new Date(p.data_cadastro).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-3 py-2.5">
                      {p.prazo ? (
                        <span className={`text-xs font-medium ${atrasado ? 'text-red-600' : 'text-slate-600'}`}>
                          {p.prazo_fatal && <span className="mr-1">!</span>}
                          {new Date(p.prazo + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">--</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">
                      {p.triador?.nome ?? '--'}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">
                      {p.executor?.nome ?? '--'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal proximo passo */}
      {showModal && (
        <ModalProximoPasso
          processos={processosSelecionados}
          onClose={() => setShowModal(false)}
          onConcluido={() => {
            setShowModal(false)
            carregar()
          }}
        />
      )}
    </div>
  )
}
