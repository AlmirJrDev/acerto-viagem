import { useState, useRef } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import './App.css'

const emptyViagem = { orig: '', dest: '', peso: '', ton: '', frete: '' }
const emptyDiesel = { data: '', posto: '', litros: '', preco: '', total: '' }

export default function App() {
  const printRef = useRef()
  const [form, setForm] = useState({
    dataSaida: '', kmSaida: '', dataChegada: '', kmChegada: '',
    percurso: '', consumo: '', media: '',
    viagens: [{ ...emptyViagem }, { ...emptyViagem }, { ...emptyViagem }, { ...emptyViagem }],
    diesel: Array(10).fill(null).map(() => ({ ...emptyDiesel })),
    pedagio: '', outrasDespesas: '', comissao: '', observacoes: ''
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const setViagem = (i, key, val) => setForm(f => {
    const v = [...f.viagens]; v[i] = { ...v[i], [key]: val }; return { ...f, viagens: v }
  })
  const setDiesel = (i, key, val) => setForm(f => {
    const d = [...f.diesel]; 
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
  const saldo = totalFretes - totalAbast - (parseFloat(form.pedagio) || 0) - (parseFloat(form.outrasDespesas) || 0) - (parseFloat(form.comissao) || 0)

  const gerarPDF = async () => {
    const el = printRef.current
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#fff', useCORS: true })
    const img = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const w = pdf.internal.pageSize.getWidth()
    const h = (canvas.height * w) / canvas.width
    pdf.addImage(img, 'PNG', 0, 0, w, h)
    pdf.save(`acerto-viagem-${form.dataSaida || 'sem-data'}.pdf`)
  }

  const inp = "bg-transparent border-b border-gray-400 focus:border-blue-600 outline-none w-full text-sm px-1 py-0.5"

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Acerto de Viagem</h1>
          <button
            onClick={gerarPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow transition"
          >
            📄 Gerar PDF
          </button>
        </div>

        {/* PRINTABLE AREA */}
        <div ref={printRef} className="bg-white p-8 shadow-lg rounded-lg font-sans text-sm">
          
          {/* HEADER */}
          <div className="flex flex-wrap gap-6 mb-4">
            <label className="flex flex-col gap-1 flex-1 min-w-[120px]">
              <span className="font-bold text-xs uppercase">Data Saída</span>
              <input type="date" className={inp} value={form.dataSaida} onChange={e => set('dataSaida', e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 flex-1 min-w-[100px]">
              <span className="font-bold text-xs uppercase">KM Saída</span>
              <input className={inp} value={form.kmSaida} onChange={e => set('kmSaida', e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 flex-1 min-w-[120px]">
              <span className="font-bold text-xs uppercase">Data Chegada</span>
              <input type="date" className={inp} value={form.dataChegada} onChange={e => set('dataChegada', e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 flex-1 min-w-[100px]">
              <span className="font-bold text-xs uppercase">KM Chegada</span>
              <input className={inp} value={form.kmChegada} onChange={e => set('kmChegada', e.target.value)} />
            </label>
          </div>

          <div className="flex flex-wrap gap-6 mb-6">
            <label className="flex flex-col gap-1 flex-1">
              <span className="font-bold text-xs uppercase">Percurso (km)</span>
              <input className={inp} value={form.percurso} onChange={e => set('percurso', e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 flex-1">
              <span className="font-bold text-xs uppercase">Consumo (L)</span>
              <input className={inp} value={form.consumo} onChange={e => set('consumo', e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 flex-1">
              <span className="font-bold text-xs uppercase">Média (km/L)</span>
              <input className={inp} value={form.media} onChange={e => set('media', e.target.value)} />
            </label>
          </div>

          {/* VIAGENS */}
          <h2 className="text-center font-bold text-base uppercase mb-3 border-b-2 border-gray-800 pb-1">Viagens</h2>
          <div className="space-y-3 mb-6">
            {form.viagens.map((v, i) => (
              <div key={i} className="grid grid-cols-5 gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-500">Origem</span>
                  <input className={inp} value={v.orig} onChange={e => setViagem(i, 'orig', e.target.value)} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-500">Destino</span>
                  <input className={inp} value={v.dest} onChange={e => setViagem(i, 'dest', e.target.value)} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-500">Peso (t)</span>
                  <input className={inp} value={v.peso} onChange={e => setViagem(i, 'peso', e.target.value)} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-500">R$/Ton</span>
                  <input className={inp} value={v.ton} onChange={e => setViagem(i, 'ton', e.target.value)} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-500">T. Frete</span>
                  <input className={inp} value={v.frete} onChange={e => setViagem(i, 'frete', e.target.value)} />
                </label>
              </div>
            ))}
            <div className="text-right font-bold text-sm pt-1">
              TOTAL EM FRETES: R$ {totalFretes.toFixed(2)}
            </div>
          </div>

          {/* DIESEL */}
          <h2 className="text-center font-bold text-base uppercase mb-3 border-b-2 border-gray-800 pb-1">Despesas com Óleo Diesel</h2>
          <table className="w-full border-collapse mb-2">
            <thead>
              <tr className="bg-gray-800 text-white text-xs">
                <th className="border border-gray-600 p-1 text-left">DATA</th>
                <th className="border border-gray-600 p-1 text-left">POSTO</th>
                <th className="border border-gray-600 p-1 text-right">LITROS</th>
                <th className="border border-gray-600 p-1 text-right">R$/LITRO</th>
                <th className="border border-gray-600 p-1 text-right">TOTAL R$</th>
              </tr>
            </thead>
            <tbody>
              {form.diesel.map((d, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="border border-gray-200 p-0.5"><input type="date" className={inp} value={d.data} onChange={e => setDiesel(i, 'data', e.target.value)} /></td>
                  <td className="border border-gray-200 p-0.5"><input className={inp} value={d.posto} onChange={e => setDiesel(i, 'posto', e.target.value)} /></td>
                  <td className="border border-gray-200 p-0.5"><input className={inp + ' text-right'} value={d.litros} onChange={e => setDiesel(i, 'litros', e.target.value)} /></td>
                  <td className="border border-gray-200 p-0.5"><input className={inp + ' text-right'} value={d.preco} onChange={e => setDiesel(i, 'preco', e.target.value)} /></td>
                  <td className="border border-gray-200 p-0.5 text-right text-xs font-medium">{d.total ? `R$ ${d.total}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-right font-bold text-sm mb-6">
            TOTAL EM ABASTECIMENTOS: R$ {totalAbast.toFixed(2)}
          </div>

          {/* ACERTO + OBSERVAÇÕES */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h2 className="text-center font-bold text-base uppercase mb-3 border-b-2 border-gray-800 pb-1">Acerto</h2>
              <table className="w-full text-sm border-collapse">
                <tbody>
                  {[
                    ['Total em Fretes', `R$ ${totalFretes.toFixed(2)}`, null],
                    ['Total em Abastecimento', `R$ ${totalAbast.toFixed(2)}`, null],
                    ['Pedágio', null, 'pedagio'],
                    ['Outras Despesas', null, 'outrasDespesas'],
                    ['Comissão', null, 'comissao'],
                  ].map(([label, val, key]) => (
                    <tr key={label} className="border-b border-gray-200">
                      <td className="py-1 font-semibold pr-2">{label}</td>
                      <td className="py-1 text-right">
                        {val ? <span>{val}</span> : (
                          <input
                            className="border-b border-gray-400 focus:border-blue-600 outline-none text-right w-24 text-sm"
                            placeholder="0.00"
                            value={form[key]}
                            onChange={e => set(key, e.target.value)}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-800 text-white font-bold">
                    <td className="py-1.5 px-1 rounded-bl">Saldo da Viagem</td>
                    <td className="py-1.5 px-1 text-right rounded-br">R$ {saldo.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h2 className="text-center font-bold text-base uppercase mb-3 border-b-2 border-gray-800 pb-1">Observações</h2>
              <textarea
                className="w-full h-32 border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Anotações da viagem..."
                value={form.observacoes}
                onChange={e => set('observacoes', e.target.value)}
              />
            </div>
          </div>

        </div>

        <p className="text-center text-xs text-gray-400 mt-4">Clique em "Gerar PDF" para salvar o documento</p>
      </div>
    </div>
  )
}