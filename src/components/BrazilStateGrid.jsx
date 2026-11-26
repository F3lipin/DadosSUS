import { useMemo, useState } from "react";
import { rowsFor } from "../data";
import { numberFormat, decimalFormat } from "../utils";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

const geoUrl = "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson";
const stateNames = {
  acre: "AC", alagoas: "AL", amapá: "AP", amazonas: "AM", bahia: "BA", ceará: "CE",
  "distrito federal": "DF", "espírito santo": "ES", goiás: "GO", maranhão: "MA",
  "mato grosso": "MT", "mato grosso do sul": "MS", "minas gerais": "MG", pará: "PA",
  paraíba: "PB", paraná: "PR", pernambuco: "PE", piauí: "PI", "rio de janeiro": "RJ",
  "rio grande do norte": "RN", "rio grande do sul": "RS", rondônia: "RO", roraima: "RR",
  "santa catarina": "SC", "são paulo": "SP", sergipe: "SE", tocantins: "TO"
};
const colors = ["#e7f1f8", "#c4dced", "#8bbbd9", "#4f91bf", "#1766a3"];
const normalize = (value = "") => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();

export default function BrazilStateGrid({ disease, filters, onSelect }) {
  const [hovered, setHovered] = useState(null);
  const allRows = useMemo(() => rowsFor(disease, filters.year, filters.period), [disease, filters.year, filters.period]);
  const byUF = useMemo(() => Object.fromEntries(allRows.map(row => [row.uf, row])), [allRows]);
  const selected = filters.uf ? rowsFor(disease, filters.year, filters.period, filters.uf, filters.city)[0] : null;
  const values = allRows.map(row => row.cases);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const colorFor = value => {
    if (max === min) return colors[2];
    const bucket = Math.min(colors.length - 1, Math.floor(((value - min) / (max - min)) * colors.length));
    return colors[bucket];
  };

  return <div className="map-layout">
    <div className="panel map-panel">
      <p className="map-caption">Selecione um estado no mapa para filtrar. Passe o cursor ou foque uma UF para consultar seus indicadores. Valores simulados.</p>
      <div className="brazil-map-container">
        <ComposableMap
          aria-label="Mapa interativo do Brasil por intensidade de casos simulados"
          projection="geoMercator"
          projectionConfig={{ scale: 690, center: [-54, -15] }}
          width={800}
          height={500}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) => geographies.map(geo => {
              const rawName = geo.properties.name || geo.properties.nome || geo.properties.NAME_1 || "";
              const normalizedName = normalize(rawName);
              const uf = Object.entries(stateNames).find(([name]) => normalize(name) === normalizedName)?.[1] || geo.properties.sigla || geo.properties.uf;
              const row = byUF[uf];
              if (!uf || !row) return null;
              const isSelected = filters.uf === uf;
              const showTip = () => setHovered(row);
              return <Geography
                key={geo.rsmKey}
                geography={geo}
                role="button"
                tabIndex={0}
                aria-label={`${row.name} (${uf}), ${numberFormat.format(row.cases)} casos simulados`}
                onMouseEnter={showTip}
                onMouseLeave={() => setHovered(null)}
                onFocus={showTip}
                onBlur={() => setHovered(null)}
                onClick={() => onSelect(isSelected ? "" : uf)}
                onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(isSelected ? "" : uf); } }}
                fill={isSelected ? "#1766a3" : colorFor(row.cases)}
                stroke={isSelected ? "#083b66" : "#fff"}
                strokeWidth={isSelected ? 2.2 : 1.05}
                style={{ outline: "none" }}
              />;
            })}
          </Geographies>
        </ComposableMap>
        {hovered && <div className="map-tooltip" role="status">
          <strong>{hovered.name} <span>({hovered.uf})</span></strong>
          <div><span>Casos notificados</span><b>{numberFormat.format(hovered.cases)}</b></div>
          <div><span>Óbitos registrados</span><b>{numberFormat.format(hovered.deaths)}</b></div>
          <div><span>Incidência / 100 mil</span><b>{decimalFormat.format(hovered.incidence)}</b></div>
          <small>Dados simulados</small>
        </div>}
      </div>
      <div className="legend" aria-label={`Escala de casos simulados, de ${numberFormat.format(min)} a ${numberFormat.format(max)}`}>
        <span>Menor</span><div className="legend-swatches">{colors.map(color => <i key={color} style={{ backgroundColor: color }} />)}</div><span>Maior intensidade</span>
        <small>{numberFormat.format(min)}–{numberFormat.format(max)} casos</small>
      </div>
    </div>
    <aside className="panel details" aria-live="polite">
      <span className="small">Detalhes da unidade federativa</span>
      <h3>{selected ? `${selected.name} (${selected.uf})` : "Nenhuma UF selecionada"}</h3>
      {selected ? <>
        {[["Casos notificados", numberFormat.format(selected.cases)], ["Óbitos registrados", numberFormat.format(selected.deaths)], ["Incidência / 100 mil", decimalFormat.format(selected.incidence)]].map(([label, value]) => <div className="detail-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}
        <p>Indicadores simulados para {filters.year}, {filters.period === "all" ? "ano completo" : filters.period.toUpperCase()}. Município: {filters.city || "todos"}.</p>
        <button className="text-button" type="button" onClick={() => onSelect("")}>Limpar seleção da UF</button>
      </> : <p className="empty-detail">Escolha uma UF no mapa para ver os casos, óbitos e a incidência no recorte selecionado.</p>}
      <span className="data-note">Dados demonstrativos; não representam estatísticas oficiais.</span>
    </aside>
  </div>;
}
