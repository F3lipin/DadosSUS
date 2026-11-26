import { useMemo, useState } from "react";
import { numberFormat, decimalFormat, formatVariation } from "../utils";
const columns=[["position","Posição"],["name","Estado"],["cases","Casos registrados"],["deaths","Óbitos"],["incidence","Incidência / 100 mil"],["variation","Variação (%)"]];
export default function Ranking({rows,previous}) {
  const [sort,setSort]=useState({key:"cases",direction:-1});
  const enriched=useMemo(()=>{
    const old=Object.fromEntries(previous.map(row=>[row.uf,row.cases]));
    return rows.map(row=>({...row,variation:old[row.uf]?(row.cases-old[row.uf])/old[row.uf]*100:null}));
  },[rows,previous]);
  const sorted=[...enriched].sort((a,b)=>{
    if(sort.key==="position") return sort.direction*(b.cases-a.cases);
    const av=a[sort.key],bv=b[sort.key];
    return typeof av==="string"?sort.direction*av.localeCompare(bv,"pt-BR"):sort.direction*((av??-Infinity)-(bv??-Infinity));
  });
  return <div className="panel ranking"><div className="table-scroll"><table>
    <thead><tr>{columns.map(([key,label])=><th key={key} scope="col">
      <button type="button" onClick={()=>setSort(old=>({key,direction:old.key===key?-old.direction:(key==="name"?1:-1)}))}>
        {label}{sort.key===key?(sort.direction===1?" ↑":" ↓"):""}
      </button></th>)}</tr></thead>
    <tbody>{sorted.map((row,index)=><tr key={row.uf}>
      <td>{String(index+1).padStart(2,"0")}</td><td>{row.name} ({row.uf})</td>
      <td>{numberFormat.format(row.cases)}</td><td>{numberFormat.format(row.deaths)}</td>
      <td>{decimalFormat.format(row.incidence)}</td><td>{formatVariation(row.variation)}</td>
    </tr>)}</tbody>
  </table></div><div className="table-foot">{rows.length} unidades federativas no recorte · valores simulados</div></div>;
}