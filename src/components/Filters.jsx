import { CITIES, STATES, PERIODS } from "../data";

export default function Filters({draft,setDraft,onApply,onClear}) {
  const cities = draft.uf ? (CITIES[draft.uf] || [STATES.find(s=>s[0]===draft.uf)?.[1]]) : [];
  return <section className="panel">
    <div className="disease-tabs" aria-label="Selecionar doença">
      {/* As opções de doença são renderizadas pelo componente pai. */}
    </div>
    <div className="filters">
      <p className="section-label">Filtros de consulta</p>
      <div className="filter-grid">
        <div className="field"><label htmlFor="year">Ano de referência</label>
          <select id="year" value={draft.year} onChange={e=>setDraft({...draft,year:Number(e.target.value)})}>
            {[2023,2024,2025].map(year=><option key={year}>{year}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="state">Estado (UF)</label>
          <select id="state" value={draft.uf} onChange={e=>setDraft({...draft,uf:e.target.value,city:""})}>
            <option value="">Brasil — todas as UFs</option>
            {STATES.map(s=><option key={s[0]} value={s[0]}>{s[1]} ({s[0]})</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="city">Município</label>
          <select id="city" value={draft.city} disabled={!draft.uf} onChange={e=>setDraft({...draft,city:e.target.value})}>
            <option value="">Todos os municípios</option>
            {cities.filter(Boolean).map(city=><option key={city}>{city}</option>)}
            {draft.uf && <option value="Demais municípios">Demais municípios</option>}
          </select>
        </div>
        <div className="field"><label htmlFor="period">Período de consulta</label>
          <select id="period" value={draft.period} onChange={e=>setDraft({...draft,period:e.target.value})}>
            {Object.entries(PERIODS).map(([key,value])=><option key={key} value={key}>{value[0]}</option>)}
          </select>
        </div>
        <div className="filter-actions">
          <button className="primary" type="button" onClick={onApply}>Aplicar filtros</button>
          <button className="secondary" type="button" onClick={onClear}>Limpar filtros</button>
        </div>
      </div>
    </div>
  </section>;
}