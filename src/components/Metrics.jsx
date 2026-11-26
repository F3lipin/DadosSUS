import { sumRows } from "../data";
import { numberFormat, decimalFormat, formatVariation } from "../utils";
export default function Metrics({rows,previous,year}) {
  const current=sumRows(rows), prior=sumRows(previous);
  const change=prior.cases ? (current.cases-prior.cases)/prior.cases*100 : null;
  const cards=[
    ["Casos notificados",numberFormat.format(current.cases),"Registros no recorte selecionado"],
    ["Casos confirmados",numberFormat.format(current.confirmed),"Estimativa confirmada na simulação"],
    ["Óbitos registrados",numberFormat.format(current.deaths),"Óbitos no recorte selecionado"],
    ["Taxa de incidência",decimalFormat.format(current.population?current.cases/current.population*100000:0),"Casos por 100 mil habitantes"],
    ["Variação ante ano anterior",formatVariation(change),change===null?"Sem base comparativa disponível":`${change>0?"Aumento":change<0?"Redução":"Sem alteração"} frente a ${year-1}`]
  ];
  return <div className="metrics" aria-live="polite">{cards.map(([label,value,detail],i)=>
    <article className="card metric" key={label}>
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${i===4&&change!==null?(change>0?"positive":"negative"):""}`}>{value}</div>
      <div className="metric-detail">{detail}</div>
    </article>
  )}</div>;
}