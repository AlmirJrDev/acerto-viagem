import { useState, useRef } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import './App.css'

interface Viagem {
  orig: string
  dest: string
  peso: string
  ton: string
  frete: string
}

interface Diesel {
  data: string
  posto: string
  litros: string
  preco: string
  total: string
}

interface FormState {
  dataSaida: string
  kmSaida: string
  dataChegada: string
  kmChegada: string
  percurso: string
  consumo: string
  media: string
  viagens: Viagem[]
  diesel: Diesel[]
  pedagio: string
  outrasDespesas: string
  comissao: string
  observacoes: string
}

type AcertoRow =
  | [string, string, null]
  | [string, null, keyof FormState]

const emptyViagem: Viagem = { orig: '', dest: '', peso: '', ton: '', frete: '' }
const emptyDiesel: Diesel = { data: '', posto: '', litros: '', preco: '', total: '' }

const tdStyle: React.CSSProperties = {
  padding: '5px 8px',
  borderBottom: '1px solid #e5e7eb',
  fontSize: '12px',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</span>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      textAlign: 'center', fontWeight: 900, fontSize: '13px',
      textTransform: 'uppercase', letterSpacing: '2px',
      borderBottom: '2.5px solid #111', paddingBottom: '6px', marginBottom: '12px'
    }}>
      {children}
    </div>
  )
}

export default function App() {
  const printRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormState>({
    dataSaida: '', kmSaida: '', dataChegada: '', kmChegada: '',
    percurso: '', consumo: '', media: '',
    viagens: Array(4).fill(null).map(() => ({ ...emptyViagem })),
    diesel: Array(10).fill(null).map(() => ({ ...emptyDiesel })),
    pedagio: '', outrasDespesas: '', comissao: '', observacoes: ''
  })

  const set = (key: keyof FormState, val: string) =>
    setForm(f => ({ ...f, [key]: val }))

  const setViagem = (i: number, key: keyof Viagem, val: string) =>
    setForm(f => {
      const v = [...f.viagens]
      const updated = { ...v[i], [key]: val }
      if (key === 'peso' || key === 'ton') {
        const peso = parseFloat(key === 'peso' ? val : updated.peso) || 0
        const ton = parseFloat(key === 'ton' ? val : updated.ton) || 0
        updated.frete = (peso * ton).toFixed(2)
      }
      v[i] = updated
      return { ...f, viagens: v }
    })

  const setDiesel = (i: number, key: keyof Diesel, val: string) =>
    setForm(f => {
      const d = [...f.diesel]
      d[i] = { ...d[i], [key]: val }
      if (key === 'litros' || key === 'preco') {
        const litros = parseFloat(key === 'litros' ? val : d[i].litros) || 0
        const preco = parseFloat(key === 'preco' ? val : d[i].preco) || 0
        d[i].total = (litros * preco).toFixed(2)
      }
      return { ...f, diesel: d }
    })

  const totalFretes = form.viagens.reduce((s, v) => s + (parseFloat(v.frete) || 0), 0)
  const totalAbast = form.diesel.reduce((s, d) => s + (parseFloat(d.total) || 0), 0)
  const saldo =
    totalFretes -
    totalAbast -
    (parseFloat(form.pedagio) || 0) -
    (parseFloat(form.outrasDespesas) || 0) -
    (parseFloat(form.comissao) || 0)

  const acertoRows: AcertoRow[] = [
    ['Total em Fretes', `R$ ${totalFretes.toFixed(2)}`, null],
    ['Total em Abastecimento', `R$ ${totalAbast.toFixed(2)}`, null],
    ['Pedágio', null, 'pedagio'],
    ['Outras Despesas', null, 'outrasDespesas'],
    ['Comissão', null, 'comissao'],
  ]

  const gerarPDF = async () => {
    if (!printRef.current) return
    setLoading(true)
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        backgroundColor: '#fff',
        useCORS: true,
        windowWidth: 900,
      })
      const img = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const w = pdf.internal.pageSize.getWidth()
      const h = (canvas.height * w) / canvas.width
      const pageH = pdf.internal.pageSize.getHeight()

      if (h <= pageH) {
        pdf.addImage(img, 'PNG', 0, 0, w, h)
      } else {
        let posY = 0
        while (posY < h) {
          if (posY > 0) pdf.addPage()
          pdf.addImage(img, 'PNG', 0, -posY, w, h)
          posY += pageH
        }
      }
      pdf.save(`acerto-viagem-${form.dataSaida || 'sem-data'}.pdf`)
    } finally {
      setLoading(false)
    }
  }

  const inp = "bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none w-full text-sm px-1 py-1.5 transition-colors"

  return (
    <div className="min-h-screen bg-gray-100">

      {/* HEADER FIXO */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-black text-gray-900 leading-tight">Acerto de Viagem</h1>
            <p className="text-xs text-gray-400">Preencha e gere o PDF</p>
          </div>
          <button
            onClick={gerarPDF}
            disabled={loading}
            className="bg-blue-600 active:bg-blue-800 disabled:bg-blue-300 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-md transition-all flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Gerando...
              </>
            ) : '📄 Gerar PDF'}
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-3 py-4 space-y-4">

        {/* DADOS DA VIAGEM */}
        <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gray-800 px-4 py-2.5">
            <h2 className="text-white font-bold text-xs uppercase tracking-widest">Dados da Viagem</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Data Saída">
                <input type="date" className={inp} value={form.dataSaida} onChange={e => set('dataSaida', e.target.value)} />
              </Field>
              <Field label="KM Saída">
                <input type="number" inputMode="numeric" className={inp} value={form.kmSaida} onChange={e => set('kmSaida', e.target.value)} placeholder="0" />
              </Field>
              <Field label="Data Chegada">
                <input type="date" className={inp} value={form.dataChegada} onChange={e => set('dataChegada', e.target.value)} />
              </Field>
              <Field label="KM Chegada">
                <input type="number" inputMode="numeric" className={inp} value={form.kmChegada} onChange={e => set('kmChegada', e.target.value)} placeholder="0" />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Percurso km">
                <input type="number" inputMode="decimal" className={inp} value={form.percurso} onChange={e => set('percurso', e.target.value)} placeholder="0" />
              </Field>
              <Field label="Consumo L">
                <input type="number" inputMode="decimal" className={inp} value={form.consumo} onChange={e => set('consumo', e.target.value)} placeholder="0" />
              </Field>
              <Field label="Média km/L">
                <input type="number" inputMode="decimal" className={inp} value={form.media} onChange={e => set('media', e.target.value)} placeholder="0" />
              </Field>
            </div>
          </div>
        </section>

        {/* VIAGENS */}
        <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gray-800 px-4 py-2.5">
            <h2 className="text-white font-bold text-xs uppercase tracking-widest">Viagens</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {form.viagens.map((v, i) => (
              <div key={i} className="p-4 space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Viagem {i + 1}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Origem">
                    <input className={inp} value={v.orig} onChange={e => setViagem(i, 'orig', e.target.value)} placeholder="Cidade" />
                  </Field>
                  <Field label="Destino">
                    <input className={inp} value={v.dest} onChange={e => setViagem(i, 'dest', e.target.value)} placeholder="Cidade" />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Peso t">
                    <input type="number" inputMode="decimal" className={inp} value={v.peso} onChange={e => setViagem(i, 'peso', e.target.value)} placeholder="0" />
                  </Field>
                  <Field label="R$ / Ton">
                    <input type="number" inputMode="decimal" className={inp} value={v.ton} onChange={e => setViagem(i, 'ton', e.target.value)} placeholder="0" />
                  </Field>
                  <Field label="T. Frete">
                    <input type="number" inputMode="decimal" className={inp + ' font-semibold text-blue-700'} value={v.frete} onChange={e => setViagem(i, 'frete', e.target.value)} placeholder="0" />
                  </Field>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-t border-gray-200">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total em Fretes</span>
            <span className="text-base font-black text-gray-900">R$ {totalFretes.toFixed(2)}</span>
          </div>
        </section>

        {/* DIESEL */}
        <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gray-800 px-4 py-2.5">
            <h2 className="text-white font-bold text-xs uppercase tracking-widest">Despesas com Óleo Diesel</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {form.diesel.map((d, i) => (
              <div key={i} className={`p-4 space-y-3 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Abastecimento {i + 1}</p>
                  {d.total ? (
                    <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                      R$ {d.total}
                    </span>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Data">
                    <input type="date" className={inp} value={d.data} onChange={e => setDiesel(i, 'data', e.target.value)} />
                  </Field>
                  <Field label="Posto">
                    <input className={inp} value={d.posto} onChange={e => setDiesel(i, 'posto', e.target.value)} placeholder="Nome do posto" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Litros">
                    <input type="number" inputMode="decimal" className={inp} value={d.litros} onChange={e => setDiesel(i, 'litros', e.target.value)} placeholder="0" />
                  </Field>
                  <Field label="R$ / Litro">
                    <input type="number" inputMode="decimal" className={inp} value={d.preco} onChange={e => setDiesel(i, 'preco', e.target.value)} placeholder="0,00" />
                  </Field>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-t border-gray-200">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Abastecimentos</span>
            <span className="text-base font-black text-gray-900">R$ {totalAbast.toFixed(2)}</span>
          </div>
        </section>

        {/* ACERTO */}
        <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gray-800 px-4 py-2.5">
            <h2 className="text-white font-bold text-xs uppercase tracking-widest">Acerto</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {acertoRows.map(([label, val, key]) => (
              <div key={label} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-semibold text-gray-700">{label}</span>
                {val !== null ? (
                  <span className="text-sm font-bold text-gray-900">{val}</span>
                ) : (
                  <input
                    type="number"
                    inputMode="decimal"
                    className="border-b border-gray-300 focus:border-blue-500 outline-none text-right w-32 text-sm py-1 bg-transparent"
                    placeholder="0,00"
                    value={form[key as keyof FormState] as string}
                    onChange={e => set(key as keyof FormState, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
          <div className={`px-4 py-4 flex justify-between items-center transition-colors ${saldo >= 0 ? 'bg-green-600' : 'bg-red-600'}`}>
            <span className="text-white font-bold text-sm uppercase tracking-wide">Saldo da Viagem</span>
            <span className="text-white font-black text-xl">R$ {saldo.toFixed(2)}</span>
          </div>
        </section>

        {/* OBSERVAÇÕES */}
        <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gray-800 px-4 py-2.5">
            <h2 className="text-white font-bold text-xs uppercase tracking-widest">Observações</h2>
          </div>
          <div className="p-4">
            <textarea
              className="w-full h-28 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-400 resize-none bg-gray-50"
              placeholder="Anotações, pendências, informações extras..."
              value={form.observacoes}
              onChange={e => set('observacoes', e.target.value)}
            />
          </div>
        </section>

        {/* BOTÃO FINAL */}
        <button
          onClick={gerarPDF}
          disabled={loading}
          className="w-full bg-blue-600 active:bg-blue-800 disabled:bg-blue-300 text-white font-black py-4 rounded-2xl text-base shadow-lg transition-all flex items-center justify-center gap-2"
        >
          {loading ? 'Gerando PDF...' : '📄 Gerar PDF'}
        </button>

        <div className="h-6" />
      </div>

      {/* ÁREA OCULTA PARA CAPTURA DO PDF — layout desktop fixo em 900px */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '900px' }}>
        <div ref={printRef} style={{ background: 'white', padding: '32px', fontFamily: 'Arial, sans-serif', fontSize: '13px' }}>

          {/* Cabeçalho PDF */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {([
              ['Data Saída', form.dataSaida],
              ['KM Saída', form.kmSaida],
              ['Data Chegada', form.dataChegada],
              ['KM Chegada', form.kmChegada],
              ['Percurso (km)', form.percurso],
              ['Consumo (L)', form.consumo],
              ['Média (km/L)', form.media],
            ] as [string, string][]).map(([label, val]) => (
              <div key={label} style={{ flex: 1, minWidth: '90px' }}>
                <div style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: '#666', marginBottom: '2px' }}>{label}</div>
                <div style={{ borderBottom: '1.5px solid #999', paddingBottom: '2px', minHeight: '18px', fontSize: '12px' }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Viagens PDF */}
          <SectionTitle>Viagens</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
            <thead>
              <tr style={{ background: '#1f2937', color: 'white', fontSize: '11px' }}>
                {['Origem', 'Destino', 'Peso (t)', 'R$/Ton', 'T. Frete'].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {form.viagens.map((v, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#f9fafb' : 'white' }}>
                  <td style={tdStyle}>{v.orig}</td>
                  <td style={tdStyle}>{v.dest}</td>
                  <td style={tdStyle}>{v.peso}</td>
                  <td style={tdStyle}>{v.ton}</td>
                  <td style={tdStyle}>{v.frete ? `R$ ${parseFloat(v.frete).toFixed(2)}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ textAlign: 'right', fontWeight: 800, marginBottom: '20px', fontSize: '13px' }}>
            TOTAL EM FRETES: R$ {totalFretes.toFixed(2)}
          </div>

          {/* Diesel PDF */}
          <SectionTitle>Despesas com Óleo Diesel</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
            <thead>
              <tr style={{ background: '#1f2937', color: 'white', fontSize: '11px' }}>
                {['Data', 'Posto', 'Litros', 'R$/Litro', 'Total R$'].map((h, idx) => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: idx >= 2 ? 'right' : 'left', fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {form.diesel.map((d, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#f9fafb' : 'white' }}>
                  <td style={tdStyle}>{d.data}</td>
                  <td style={tdStyle}>{d.posto}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{d.litros}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{d.preco}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{d.total ? `R$ ${d.total}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ textAlign: 'right', fontWeight: 800, marginBottom: '20px', fontSize: '13px' }}>
            TOTAL EM ABASTECIMENTOS: R$ {totalAbast.toFixed(2)}
          </div>

          {/* Acerto + Obs PDF */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            <div>
              <SectionTitle>Acerto</SectionTitle>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {acertoRows.map(([label, val, key]) => (
                    <tr key={label} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '6px 4px', fontWeight: 700, fontSize: '12px' }}>{label}</td>
                      <td style={{ padding: '6px 4px', textAlign: 'right', fontSize: '12px' }}>
                        {val !== null ? val : `R$ ${(form[key as keyof FormState] as string) || '0,00'}`}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: saldo >= 0 ? '#16a34a' : '#dc2626', color: 'white', fontWeight: 900 }}>
                    <td style={{ padding: '8px 6px' }}>Saldo da Viagem</td>
                    <td style={{ padding: '8px 6px', textAlign: 'right' }}>R$ {saldo.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <SectionTitle>Observações</SectionTitle>
              <div style={{
                border: '1px solid #d1d5db', borderRadius: '6px', padding: '10px',
                minHeight: '100px', fontSize: '12px', whiteSpace: 'pre-wrap'
              }}>
                {form.observacoes}
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}