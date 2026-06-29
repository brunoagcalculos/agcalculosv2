'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, FileText } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Item = {
  id: string
  processo_id: string
  reclamante: string
  tipo_calculo: string
  data_entrega: string
  valor: number
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

export default function FinanceiroClientePage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [carregando, setCarregando] = useState(true)
  const [fechando, setFechando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [cliente, setCliente] = useState<{ razao_social: string; dia_de_corte: number | null } | null>(null)
  const [itens, setItens] = useState<Item[]>([])
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)

  const [nfForm, setNfForm] = useState({
    numero_nf: '',
    data_emissao: new Date().toISOString().split('T')[0],
    data_vencimento: '',
    modalidade: 'mensal',
  })

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('clientes')
      .select('razao_social, dia_de_corte')
      .eq('id', params.id)
      .single()
      .then(({ data }) => setCliente(data))

    supabase
      .from('faturamento_itens')
      .select('*')
      .eq('cliente_id', params.id)
      .eq('status', 'pendente')
      .order('data_entrega', { ascending: true })
      .then(({ data }) => {
        setItens(data ?? [])
        setSelecionados((data ?? []).map((i: Item) => i.id))
        setCarregando(false)
      })
  }, [params.id])

  function toggleItem(id: string) {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function toggleTodos() {
    if (selecionados.length === itens.length) {
      setSelecionados([])
    } else {
      setSelecionados(itens.map((i) => i.id))
    }
  }

  const itensSelecionados = itens.filter((i) => selecionados.includes(i.id))
  const totalSelecionado = itensSelecionados.reduce((acc, i) => acc + i.valor, 0)

  async function handleFecharNF() {
    if (selecionados.length === 0) {
      setErro('Selecione pelo menos um processo.')
      return
    }

    setFechando(true)
    setErro(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Datas de competencia baseadas nos itens selecionados
    const datas = itensSelecionados
      .map((i) => i.data_entrega)
      .filter(Boolean)
      .sort()

    const competencia_inicio = datas[0] ?? nfForm.data_emissao
    const competencia_fim = datas[datas.length - 1] ?? nfForm.data_emissao

    // Cria a NF
    const { data: nf, error: nfError } = await supabase
      .from('notas_fiscais')
      .insert({
        cliente_id: params.id,
        numero_nf: nfForm.numero_nf || null,
        modalidade: nfForm.modalidade,
        competencia_inicio,
        competencia_fim,
        data_emissao: nfForm.data_emissao,
        data_vencimento: nfForm.data_vencimento || null,
        valor_total: totalSelecionado,
        status: 'faturado',
        criado_por: user?.id,
      })
      .select('id')
      .single()

    if (nfError || !nf) {
      setErro('Erro ao criar NF: ' + nfError?.message)
      setFechando(false)
      return
    }

    // Vincula os itens a NF
    const { error: itensError } = await supabase
      .from('faturamento_itens')
      .update({ nota_fiscal_id: nf.id, status: 'faturado' })
      .in('id', selecionados)

    if (itensError) {
      setErro('NF criada mas erro ao vincular itens: ' + itensError.message)
      setFechando(false)
      return
    }

    setShowModal(false)
    router.push('/financeiro')
  }

  if (carregando) {
    return <div className="p-6 text-slate-400 text-sm">Carregando...</div>
  }

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/financeiro">
          <button className="text-slate-400 hover:text-slate-600">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-slate-800">{cliente?.razao_social}</h1>
          <p className="text-sm text-slate-500">
            {itens.length} processo{itens.length !== 1 ? 's' : ''} pendentes de faturamento
          </p>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Processos pendentes</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{itens.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Selecionados</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{selecionados.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Total selecionado</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            R$ {totalSelecionado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Tabela de itens */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">Processos entregues</p>
          {selecionados.length > 0 && (
            <Button
              size="sm"
              onClick={() => setShowModal(true)}
              className="gap-2"
            >
              <FileText size={14} />
              Fechar NF ({selecionados.length} processos)
            </Button>
          )}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 w-8">
                <input
                  type="checkbox"
                  checked={selecionados.length === itens.length && itens.length > 0}
                  onChange={toggleTodos}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Reclamante</th>
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Tipo</th>
              <th className="px-4 py-3 text-left text-xs text-slate-500 font-medium">Entrega</th>
              <th className="px-4 py-3 text-right text-xs text-slate-500 font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            {itens.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Nenhum processo pendente de faturamento
                </td>
              </tr>
            ) : (
              itens.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b border-slate-50 hover:bg-slate-50 ${selecionados.includes(item.id) ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selecionados.includes(item.id)}
                      onChange={() => toggleItem(item.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{item.reclamante}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">
                    {TIPO_LABEL[item.tipo_calculo] ?? item.tipo_calculo}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">
                    {item.data_entrega
                      ? new Date(item.data_entrega + 'T12:00:00').toLocaleDateString('pt-BR')
                      : '--'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium text-slate-800">
                    {item.valor > 0
                      ? `R$ ${item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : <span className="text-slate-400 text-xs">sem valor</span>
                    }
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {itens.length > 0 && (
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50">
                <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-slate-700">
                  Total ({selecionados.length} selecionados)
                </td>
                <td className="px-4 py-3 text-right font-bold text-slate-800">
                  R$ {totalSelecionado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Modal fechar NF */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Fechar nota fiscal</h2>

            <div className="space-y-3">
              <div>
                <Label>Numero da NF</Label>
                <Input
                  value={nfForm.numero_nf}
                  onChange={(e) => setNfForm((prev) => ({ ...prev, numero_nf: e.target.value }))}
                  placeholder="Ex: 1234"
                />
                <p className="text-xs text-slate-400 mt-1">Deixe em branco para preencher depois</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Data de emissao</Label>
                  <Input
                    type="date"
                    value={nfForm.data_emissao}
                    onChange={(e) => setNfForm((prev) => ({ ...prev, data_emissao: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Data de vencimento</Label>
                  <Input
                    type="date"
                    value={nfForm.data_vencimento}
                    onChange={(e) => setNfForm((prev) => ({ ...prev, data_vencimento: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label>Modalidade</Label>
                <select
                  value={nfForm.modalidade}
                  onChange={(e) => setNfForm((prev) => ({ ...prev, modalidade: e.target.value }))}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
                >
                  <option value="mensal">Mensal</option>
                  <option value="avulso">Avulso</option>
                </select>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 mt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Processos incluidos</span>
                  <span className="font-medium">{selecionados.length}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-slate-600">Valor total</span>
                  <span className="font-bold text-slate-800">
                    R$ {totalSelecionado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {erro && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-md mt-3">{erro}</p>
            )}

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-100 border border-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleFecharNF}
                disabled={fechando}
                className="px-4 py-2 rounded-md text-sm bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {fechando ? 'Fechando...' : 'Confirmar NF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
