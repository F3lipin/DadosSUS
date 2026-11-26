import { useMemo, useState } from "react";
import Header from "./components/Header";
import DiseaseTabs from "./components/DiseaseTabs";
import Filters from "./components/Filters";
import Metrics from "./components/Metrics";
import BrazilStateGrid from "./components/BrazilStateGrid";
import EpidemiologyCharts from "./components/EpidemiologyCharts";
import Ranking from "./components/Ranking";
import InfoModal from "./components/InfoModal";
import { DEFAULT_FILTERS, DISEASES, PERIODS, rowsFor, STATES } from "./data";

export default function App() {
  const [disease,setDisease]=useState("chikungunya");
  const [filters,setFilters]=useState(DEFAULT_FILTERS);
  const [draft,setDraft]=useState(DEFAULT_FILTERS);
  const [infoOpen,setInfoOpen]=useState(false);
  const rows=useMemo(()=>rowsFor(disease,filters.year,filters.period,filters.uf,filters.city),[disease,filters]);
  const previous=useMemo(()=>rowsFor(disease,filters.year-1,filters.period,filters.uf,filters.city),[disease,filters]);
  const place=filters.city || STATES.find(state=>state[0]===filters.uf)?.[1] || "Brasil";

  function applyFilters() { setFilters({...draft}); }
  function clearFilters() { setDraft({...DEFAULT_FILTERS}); setFilters({...DEFAULT_FILTERS}); }
  function selectState(uf) {
    const next={...filters,uf,city:""};
    setFilters(next); setDraft(next);
  }

  return <>
    <Header onInfo={()=>setInfoOpen(true)}/>
    <main className="shell">
      <div className="intro"><div><h2>Visão geral da vigilância</h2>
        <p>Explore indicadores e tendências epidemiológicas no território brasileiro.</p></div>
        <span className="badge">BASE DEMONSTRATIVA</span>
      </div>
      <div className="notice"><strong>Transparência dos dados: </strong>todos os indicadores, gráficos e valores por UF são SIMULADOS. Não são estatísticas oficiais do Ministério da Saúde.</div>
      <div className="panel">
        <DiseaseTabs disease={disease} onChange={setDisease}/>
        <Filters draft={draft} setDraft={setDraft} onApply={applyFilters} onClear={clearFilters}/>
      </div>
      <div className="context"><h2>Indicadores · {DISEASES[disease].name}</h2>
        <span>{place} · {filters.year} · {PERIODS[filters.period][0]}</span></div>
      <Metrics rows={rows} previous={previous} year={filters.year}/>
      <section aria-labelledby="map-heading">
        <div className="section-heading"><h2 id="map-heading">Distribuição epidemiológica por UF</h2>
          <p>Mapa geográfico interativo · casos simulados no recorte selecionado</p></div>
        <BrazilStateGrid disease={disease} filters={filters} onSelect={selectState}/>
      </section>
      <section aria-labelledby="charts-heading">
        <div className="section-heading"><h2 id="charts-heading">Análise temporal e comparativa</h2>
          <p>Gráficos interativos com valores simulados</p></div>
        <EpidemiologyCharts rows={rows} previous={previous} filters={filters} disease={disease}/>
      </section>
      <section aria-labelledby="ranking-heading">
        <div className="section-heading"><h2 id="ranking-heading">Ranking epidemiológico</h2>
          <p>Clique nos títulos para ordenar as colunas</p></div>
        <Ranking rows={rows} previous={previous}/>
      </section>
    </main>
    <footer><div className="shell footer-inner">
      <span>Monitoramento Epidemiológico · Projeto acadêmico de visualização de dados em saúde</span>
      <span>Dados exclusivamente simulados. Estrutura preparada para futura integração com fontes oficiais do SUS.</span>
    </div></footer>
    <InfoModal open={infoOpen} onClose={()=>setInfoOpen(false)}/>
  </>;
}