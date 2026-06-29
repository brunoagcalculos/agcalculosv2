'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Cliente = { id: string; razao_social: string }
type TRT = { codigo: number; nome: string; uf: string }

const TIPOS_CALCULO = [
  { value: 'contingencia_inicial', label: 'Contingencia Inicial / Provisao Inicial' },
  { value: 'replica_demonstrativos_he', label: 'Replica / Demonstrativos HE' },
  { value: 'impugnacao_sentenca_liquida', label: 'Impugnacao Sentenca Liquida' },
  { value: 'contingencia_decisoes', label: 'Contingencia Decisoes' },
  { value: 'apresentacao_calculos_art879', label: 'Apresentacao dos Calculos (Art. 879)' },
  { value: 'impugnacao_calculos', label: 'Impugnacao aos Calculos' },
  { value: 'atualizacao_analise_recursal', label: 'Atualizacao / Analise Recursal' },
  { value: 'parcelamento_art916', label: 'Parcelamento (Art. 916)' },
  { value: 'discriminacao_verbas_acordo', label: 'Discriminacao de Verbas de Acordo' },
  { value: 'esocial_s2500', label: 'E-Social S2500 - Sem Recolhimento' },
  { value: 'esocial_s2501', label: 'E-Social S2501 - Incidencia INSS/IRPF/FGTS' },
  { value: 'fgts_digital_s2500', label: 'FGTS Digital (Lancar S2500)' },
]

const FASES = [
  { value: 'inicial', label: 'Inicial' },
  { value: 'sentenca', label: 'Sentenca' },
  { value: 'acordao', label: 'Acordao' },
  { value: 'embargos_execucao', label: 'Embargos a Execucao' },
  { value: 'agravo_peticao', label: 'Agravo de Peticao' },
  { value: 'acordo', label: 'Acordo' },
]

export default function NovoProcessoPage() {
  const router = useRouter()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [trts, setTrts] = useState<TRT[]>([])

  const [form, setForm] = useState({
    cnj: '',
    processo_secundario: '',
    trt_codigo: '',
    origem: '',
    fase: '',
    lado_processual: 'reclamada',
    reclamante: '',
    reclamada: '',
    tipo_calculo: '',
    cliente_id: '',
    is_projeto: 'false',
    solicitante_nome: '',
    solicitante_email: '',
    solicitante_area: '',
    codigo_interno: '',
    matricula_colaborador: '',
    valor_reclamante: '',
    prazo: '',
    prazo_fatal: 'false',
    prazo_hora: '',
    preencher_fgts_digital: 'false',
    emitir_darf: 'false',
    data_admissao: '',
    data_demissao: '',
    data_distribuicao: '',
    data_citacao: '',
    data_prescricao: '',
    anotacoes_geral: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('clientes')
      .select('id, razao_social')
      .eq('status', 'ativo')
      .order('razao_social')
      .then(({ data }) => setClientes(data ?? []))

    supabase
      .from('trts')
      .select('codigo, nome, uf')
      .order('codigo')
      .then(({ data }) => setTrts(data ?? []))
  }, [])

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSalvar() {
    if (!form.reclamante.trim()) {
      setErro('Reclamante e obrigatorio.')
      return
    }
    if (!form.tipo_calculo) {
      setErro('Tipo de calculo e obrigatorio.')
      return
    }
    if (!form.cliente_id) {
      setErro('Cliente e obrigatorio.')
      return
    }

    setSalvando(true)
    setErro(null)

    const supabase = createClient()

    const { data: clienteData } = await supabase
      .from('clientes')
      .select('grupo_id')
      .eq('id', form.cliente_id)
      .single()

    const { data, error } = await supabase
      .from('processos')
      .insert({
        cnj: form.cnj || null,
        processo_secundario: form.processo_secundario || null,
        trt_codigo: form.trt_codigo ? parseInt(form.trt_codigo) : null,
        origem: form.origem || null,
        fase: form.fase || null,
        lado_processual: form.lado_processual,
        reclamante: form.reclamante.trim(),
        reclamada: form.reclamada || null,
        tipo_calculo: form.tipo_calculo,
        cliente_id: form.cliente_id,
        grupo_id: clienteData?.grupo_id ?? null,
        is_projeto: form.is_projeto === 'true',
        solicitante_nome: form.solicitante_nome || null,
        solicitante_email: form.solicitante_email || null,
        solicitante_area: form.solicitante_area || null,
        codigo_interno: form.codigo_interno || null,
        matricula_colaborador: form.matricula_colaborador || null,
        valor_reclamante: form.valor_reclamante ? parseFloat(form.valor_reclamante.replace(',', '.')) : null,
        prazo: form.prazo || null,
        prazo_fatal: form.prazo_fatal === 'true',
        prazo_hora: form.prazo_hora || null,
        preencher_fgts_digital: form.preencher_fgts_digital === 'true',
        emitir_darf: form.emitir_darf === 'true',
        data_admissao: form.data_admissao || null,
        data_demissao: form.data_demissao || null,
        data_distribuicao: form.data_distribuicao || null,
        data_citacao: form.data_citacao || null,
        data_prescricao: form.data_prescricao || null,
        anotacoes_geral: form.anotacoes_geral || null,
        status: 'novo',
      })
      .select('id')
      .single()

    if (error) {
      setErro('Erro ao salvar: ' + error.message)
      setSalvando(false)
      return
    }

    router.push(`/processos/${data.id}`)
  }

  const selectClass =
    'w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400'

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/processos">
          <button className="text-slate-400 hover:text-slate-600">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Novo processo</h1>
          <p className="text-sm text-slate-500">Preencha os dados do calculo</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">

        {/* Identificacao judicial */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Identificacao judicial
          </p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Numero CNJ</Label>
                <Input
                  value={form.cnj}
                  onChange={(e) => set('cnj', e.target.value)}
                  placeholder="0000000-00.0000.0.00.0000"
                  className="font-mono text-xs"
                />
              </div>
              <div>
                <Label>Processo secundario</Label>
                <Input
                  value={form.processo_secundario}
                  onChange={(e) => set('processo_secundario', e.target.value)}
                  placeholder="Numero vinculado"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>TRT</Label>
                <select
                  value={form.trt_codigo}
                  onChange={(e) => set('trt_codigo', e.target.value)}
                  className={selectClass}
                >
                  <option value="">Selecione</option>
                  {trts.map((t) => (
                    <option key={t.codigo} value={t.codigo}>
                      {t.codigo}a Regiao - {t.uf}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Fase</Label>
                <select
                  value={form.fase}
                  onChange={(e) => set('fase', e.target.value)}
                  className={selectClass}
                >
                  <option value="">Selecione</option>
                  {FASES.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Lado processual</Label>
                <select
                  value={form.lado_processual}
                  onChange={(e) => set('lado_processual', e.target.value)}
                  className={selectClass}
                >
                  <option value="reclamada">Reclamada</option>
                  <option value="reclamante">Reclamante</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Origem (Vara)</Label>
              <Input
                value={form.origem}
                onChange={(e) => set('origem', e.target.value)}
                placeholder="Ex: VARA DO TRABALHO DE CURITIBA"
              />
            </div>
          </div>
        </div>

        {/* Partes */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Partes
          </p>
          <div className="space-y-3">
            <div>
              <Label>Reclamante *</Label>
              <Input
                value={form.reclamante}
                onChange={(e) => set('reclamante', e.target.value)}
                placeholder="Nome do reclamante"
              />
            </div>
            <div>
              <Label>Reclamada</Label>
              <Input
                value={form.reclamada}
                onChange={(e) => set('reclamada', e.target.value)}
                placeholder="Nome da empresa reclamada"
              />
            </div>
          </div>
        </div>

        {/* Calculo */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Calculo
          </p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo de calculo *</Label>
                <select
                  value={form.tipo_calculo}
                  onChange={(e) => set('tipo_calculo', e.target.value)}
                  className={selectClass}
                >
                  <option value="">Selecione</option>
                  {TIPOS_CALCULO.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Cliente *</Label>
                <select
                  value={form.cliente_id}
                  onChange={(e) => set('cliente_id', e.target.value)}
                  className={selectClass}
                >
                  <option value="">Selecione</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.razao_social}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Codigo interno</Label>
                <Input
                  value={form.codigo_interno}
                  onChange={(e) => set('codigo_interno', e.target.value)}
                  placeholder="Codigo do cliente"
                />
              </div>
              <div>
                <Label>Matricula colaborador</Label>
                <Input
                  value={form.matricula_colaborador}
                  onChange={(e) => set('matricula_colaborador', e.target.value)}
                  placeholder="Matricula"
                />
              </div>
              <div>
                <Label>Valor reclamante (R$)</Label>
                <Input
                  value={form.valor_reclamante}
                  onChange={(e) => set('valor_reclamante', e.target.value)}
                  placeholder="0,00"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Projeto?</Label>
                <select
                  value={form.is_projeto}
                  onChange={(e) => set('is_projeto', e.target.value)}
                  className={selectClass}
                >
                  <option value="false">Nao</option>
                  <option value="true">Sim</option>
                </select>
              </div>
              <div>
                <Label>Preencher FGTS Digital?</Label>
                <select
                  value={form.preencher_fgts_digital}
                  onChange={(e) => set('preencher_fgts_digital', e.target.value)}
                  className={selectClass}
                >
                  <option value="false">Nao</option>
                  <option value="true">Sim</option>
                </select>
              </div>
              <div>
                <Label>Emitir DARF?</Label>
                <select
                  value={form.emitir_darf}
                  onChange={(e) => set('emitir_darf', e.target.value)}
                  className={selectClass}
                >
                  <option value="false">Nao</option>
                  <option value="true">Sim</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Solicitante */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Solicitante
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Nome</Label>
              <Input
                value={form.solicitante_nome}
                onChange={(e) => set('solicitante_nome', e.target.value)}
                placeholder="Nome do solicitante"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.solicitante_email}
                onChange={(e) => set('solicitante_email', e.target.value)}
                placeholder="email@empresa.com.br"
              />
            </div>
            <div>
              <Label>Area</Label>
              <Input
                value={form.solicitante_area}
                onChange={(e) => set('solicitante_area', e.target.value)}
                placeholder="Ex: Juridico"
              />
            </div>
          </div>
        </div>

        {/* Prazos */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Prazo
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Data do prazo</Label>
              <Input
                type="date"
                value={form.prazo}
                onChange={(e) => set('prazo', e.target.value)}
              />
            </div>
            <div>
              <Label>Hora do prazo</Label>
              <Input
                type="time"
                value={form.prazo_hora}
                onChange={(e) => set('prazo_hora', e.target.value)}
              />
            </div>
            <div>
              <Label>Prazo fatal?</Label>
              <select
                value={form.prazo_fatal}
                onChange={(e) => set('prazo_fatal', e.target.value)}
                className={selectClass}
              >
                <option value="false">Nao</option>
                <option value="true">Sim</option>
              </select>
            </div>
          </div>
        </div>

        {/* Datas processuais */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Datas processuais
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Admissao</Label>
              <Input
                type="date"
                value={form.data_admissao}
                onChange={(e) => set('data_admissao', e.target.value)}
              />
            </div>
            <div>
              <Label>Demissao</Label>
              <Input
                type="date"
                value={form.data_demissao}
                onChange={(e) => set('data_demissao', e.target.value)}
              />
            </div>
            <div>
              <Label>Distribuicao</Label>
              <Input
                type="date"
                value={form.data_distribuicao}
                onChange={(e) => set('data_distribuicao', e.target.value)}
              />
            </div>
            <div>
              <Label>Citacao</Label>
              <Input
                type="date"
                value={form.data_citacao}
                onChange={(e) => set('data_citacao', e.target.value)}
              />
            </div>
            <div>
              <Label>Prescricao</Label>
              <Input
                type="date"
                value={form.data_prescricao}
                onChange={(e) => set('data_prescricao', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Anotacoes */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Anotacoes
          </p>
          <div>
            <Label>Anotacoes gerais</Label>
            <textarea
              value={form.anotacoes_geral}
              onChange={(e) => set('anotacoes_geral', e.target.value)}
              placeholder="Observacoes gerais sobre o processo..."
              rows={3}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 resize-none"
            />
          </div>
        </div>

        {erro && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{erro}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Link href="/processos">
            <Button variant="outline" size="sm">Cancelar</Button>
          </Link>
          <Button size="sm" onClick={handleSalvar} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar processo'}
          </Button>
        </div>
      </div>
    </div>
  )
}
