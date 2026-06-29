'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

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

export default function ClientePrecosPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [cliente, setCliente] = useState<{ razao_social: string } | null>(null)
  const [precos, setPrecos] = useState<Record<string, string>>({})

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('clientes')
      .select('razao_social')
      .eq('id', params.id)
      .single()
      .then(({ data }) => setCliente(data))

    supabase
      .from('cliente_precos')
      .select('tipo_calculo, valor')
      .eq('cliente_id', params.id)
      .eq('ativo', true)
      .then(({ data }) => {
        const inicial: Record<string, string> = {}
        TIPOS_CALCULO.forEach((t) => { inicial[t.value] = '' })
        data?.forEach((p) => {
          inicial[p.tipo_calculo] = p.valor?.toString() ?? ''
        })
        setPrecos(inicial)
        setCarregando(false)
      })
  }, [params.id])

  async function handleSalvar() {
    setSalvando(true)
    setSucesso(false)

    const supabase = createClient()

    for (const tipo of TIPOS_CALCULO) {
      const valor = precos[tipo.value]

      if (valor && parseFloat(valor) > 0) {
        await supabase
          .from('cliente_precos')
          .upsert(
            {
              cliente_id: params.id,
              tipo_calculo: tipo.value,
              valor: parseFloat(valor.replace(',', '.')),
              ativo: true,
            },
            { onConflict: 'cliente_id,tipo_calculo' }
          )
      } else {
        await supabase
          .from('cliente_precos')
          .update({ ativo: false })
          .eq('cliente_id', params.id)
          .eq('tipo_calculo', tipo.value)
      }
    }

    setSalvando(false)
    setSucesso(true)
    setTimeout(() => setSucesso(false), 3000)
  }

  if (carregando) {
    return <div className="p-6 text-slate-400 text-sm">Carregando...</div>
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/clientes/${params.id}`}>
          <button className="text-slate-400 hover:text-slate-600">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Tabela de precos</h1>
          <p className="text-sm text-slate-500">{cliente?.razao_social}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-2 gap-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Tipo de calculo
            </p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Valor (R$)
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {TIPOS_CALCULO.map((tipo) => (
            <div key={tipo.value} className="px-4 py-3 grid grid-cols-2 gap-4 items-center hover:bg-slate-50">
              <p className="text-sm text-slate-700">{tipo.label}</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">R$</span>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={precos[tipo.value] ?? ''}
                  onChange={(e) =>
                    setPrecos((prev) => ({ ...prev, [tipo.value]: e.target.value }))
                  }
                  placeholder="0,00"
                  className="w-32 text-right"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {sucesso && (
            <p className="text-sm text-green-600">Precos salvos com sucesso.</p>
          )}
          {!sucesso && <div />}
          <Button size="sm" onClick={handleSalvar} disabled={salvando} className="gap-2">
            <Save size={14} />
            {salvando ? 'Salvando...' : 'Salvar precos'}
          </Button>
        </div>
      </div>
    </div>
  )
}
