import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import DiseaseTabs from "./components/DiseaseTabs";
import Filters from "./components/Filters";
import Metrics from "./components/Metrics";
import BrazilStateGrid from "./components/BrazilStateGrid";
import EpidemiologyCharts from "./components/EpidemiologyCharts";
import Ranking from "./components/Ranking";
import InfoModal from "./components/InfoModal";
import { DEFAULT_FILTERS, DISEASES, PERIODS, rowsFor, STATES } from "./data";
import { buscarResumoCovid, buscarEstadosCovid } from "./api";
import { numberFormat } from "./utils";

export default function App() {
  const [disease, setDisease] = useState("chikungunya");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [draft, setDraft] = useState(DEFAULT_FILTERS);
  const [infoOpen, setInfoOpen] = useState(false);

  // Dados reais de COVID-19
  const [resumoCovid, setResumoCovid] = useState(null);
  const [estadosCovid, setEstadosCovid] = useState(null);
  const [loadingCovid, setLoadingCovid] = useState(false);
  const [erroCovid, setErroCovid] = useState("");

  // Dados simulados que ainda alimentam os componentes
  const rows = useMemo(
    () => rowsFor(disease, filters.year, filters.period, filters.uf, filters.city),
    [disease, filters]
  );

  const previous = useMemo(
    () => rowsFor(disease, filters.year - 1, filters.period, filters.uf, filters.city),
    [disease, filters]
  );

  const place =
    filters.city ||
    STATES.find(state => state[0] === filters.uf)?.[1] ||
    "Brasil";

  // Consulta o backend quando COVID-19 é selecionada
  useEffect(() => {
    if (disease !== "covid") return;

    async function carregarCovid() {
      setLoadingCovid(true);
      setErroCovid("");

      try {
        const [resumo, estados] = await Promise.all([
          buscarResumoCovid(),
          buscarEstadosCovid()
        ]);

        setResumoCovid(resumo);
        setEstadosCovid(estados);
      } catch (erro) {
        console.error("Erro ao carregar COVID-19:", erro);
        setErroCovid("Não foi possível carregar os dados reais de COVID-19.");
      } finally {
        setLoadingCovid(false);
      }
    }

    carregarCovid();
  }, [disease]);

  function applyFilters() {
    setFilters({ ...draft });
  }

  function clearFilters() {
    setDraft({ ...DEFAULT_FILTERS });
    setFilters({ ...DEFAULT_FILTERS });
  }

  function selectState(uf) {
    const next = { ...filters, uf, city: "" };
    setFilters(next);
    setDraft(next);
  }

  return <>
    <Header onInfo={() => setInfoOpen(true)} />

    <main className="shell">
      <div className="intro">
        <div>
          <h2>Visão geral da vigilância</h2>
          <p>Explore indicadores e tendências epidemiológicas no território brasileiro.</p>
        </div>
        <span className="badge">BASE EM INTEGRAÇÃO</span>
      </div>

      <div className="panel">
        <DiseaseTabs disease={disease} onChange={setDisease} />
        <Filters
          draft={draft}
          setDraft={setDraft}
          onApply={applyFilters}
          onClear={clearFilters}
        />
      </div>

      {disease === "covid" ? (
        <section className="notice" aria-live="polite">
          <strong>Integração com dados reais de COVID-19</strong>

          {loadingCovid && <p>Consultando o backend...</p>}

          {erroCovid && <p>{erroCovid}</p>}

          {resumoCovid && !loadingCovid && (
            <>
              <p>
                <strong>Casos:</strong>{" "}
                {numberFormat.format(Number(resumoCovid.total_casos || 0))}
              </p>

              <p>
                <strong>Óbitos:</strong>{" "}
                {numberFormat.format(Number(resumoCovid.total_obitos || 0))}
              </p>

              <p>
                <strong>Estados monitorados:</strong>{" "}
                {resumoCovid.estados_monitorados}
              </p>

              <p>
                <strong>Municípios monitorados:</strong>{" "}
                {resumoCovid.municipios_monitorados}
              </p>

              <p>
                <strong>Estados retornados pela consulta:</strong>{" "}
                {estadosCovid?.length ?? 0}
              </p>

              <small>
                Estes valores são retornados pelo backend. Os demais componentes
                do dashboard ainda utilizam dados simulados.
              </small>
            </>
          )}
        </section>
      ) : (
        <div className="notice">
          <strong>Transparência dos dados:</strong> os indicadores, gráficos e
          valores por UF desta doença ainda são simulados.
        </div>
      )}

      <div className="context">
        <h2>Indicadores · {DISEASES[disease].name}</h2>
        <span>
          {place} · {filters.year} · {PERIODS[filters.period][0]}
        </span>
      </div>

      <Metrics rows={rows} previous={previous} year={filters.year} />

      <section aria-labelledby="map-heading">
        <div className="section-heading">
          <h2 id="map-heading">Distribuição epidemiológica por UF</h2>
          <p>Mapa geográfico interativo · ainda utilizando dados simulados</p>
        </div>
        <BrazilStateGrid
          disease={disease}
          filters={filters}
          onSelect={selectState}
        />
      </section>

      <section aria-labelledby="charts-heading">
        <div className="section-heading">
          <h2 id="charts-heading">Análise temporal e comparativa</h2>
          <p>Gráficos interativos · ainda utilizando dados simulados</p>
        </div>
        <EpidemiologyCharts
          rows={rows}
          previous={previous}
          filters={filters}
          disease={disease}
        />
      </section>

      <section aria-labelledby="ranking-heading">
        <div className="section-heading">
          <h2 id="ranking-heading">Ranking epidemiológico</h2>
          <p>Clique nos títulos para ordenar as colunas</p>
        </div>
        <Ranking rows={rows} previous={previous} />
      </section>
    </main>

    <footer>
      <div className="shell footer-inner">
        <span>
          Monitoramento Epidemiológico · Projeto acadêmico de visualização de dados em saúde
        </span>
        <span>
          Integração progressiva com fontes de dados do SUS.
        </span>
      </div>
    </footer>

    <InfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
  </>;
}
