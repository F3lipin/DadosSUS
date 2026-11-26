import { useMemo } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from "recharts";
import { DISEASES, PERIODS } from "../data";
import { numberFormat } from "../utils";

function ChartPanel({title,subtitle,children}) {
  return <article className="panel chart-card"><h3>{title}</h3><p>{subtitle}</p><div className="chart-box">{children}</div></article>;
}
const Tip = ({active,payload,label}) => active&&payload?.length ? <div className="recharts-default-tooltip" style={{background:"#fff",padding:10}}>
  <strong>{label}</strong>{payload.map(item=><div key={item.dataKey}>{item.name}: {numberFormat.format(item.value)}</div>)}
</div>:null;

export default function EpidemiologyCharts({rows,previous,filters,disease}) {
  const chartData=useMemo(()=>{
    const range=PERIODS[filters.period];
    const current=Array.from({length:range[2]-range[1]},(_,i)=>{
      const week=range[1]+i;
      return {week:`SE ${String(week+1).padStart(2,"0")}`,
        current:rows.reduce((sum,row)=>sum+row.weeks[week],0),
        previous:previous.reduce((sum,row)=>sum+row.weeks[week],0)};
    });
    const ranking=[...rows].sort((a,b)=>b.cases-a.cases).slice(0,8)
      .map(row=>({uf:row.uf,cases:row.cases}));
    const fatality=DISEASES[disease].fatality;
    return {current,ranking,deaths:current.map(row=>({...row,deaths:Math.round(row.current*fatality)}))};
  },[rows,previous,filters.period,disease]);
  const color=DISEASES[disease].color;
  return <div className="charts">
    <ChartPanel title="Evolução dos casos" subtitle="Casos notificados por semana epidemiológica">
      <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData.current}>
        <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="week"/><YAxis tickFormatter={v=>numberFormat.format(v)}/>
        <Tooltip content={<Tip/>}/><Line type="monotone" dataKey="current" name={`Casos em ${filters.year}`} stroke={color} strokeWidth={2.5} dot={false}/>
      </LineChart></ResponsiveContainer>
    </ChartPanel>
    <ChartPanel title="Comparativo anual" subtitle={`Mesmo período: ${filters.year} × ${filters.year-1}`}>
      <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData.current}>
        <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="week"/><YAxis tickFormatter={v=>numberFormat.format(v)}/>
        <Tooltip content={<Tip/>}/><Legend/><Line type="monotone" dataKey="current" name={String(filters.year)} stroke={color} strokeWidth={2.5} dot={false}/>
        <Line type="monotone" dataKey="previous" name={String(filters.year-1)} stroke="#84b9c8" strokeWidth={2.5} dot={false}/>
      </LineChart></ResponsiveContainer></ChartPanel>
    <ChartPanel title="Estados com mais casos" subtitle="Ranking de casos notificados no recorte">
      <ResponsiveContainer width="100%" height="100%"><BarChart data={chartData.ranking} layout="vertical" margin={{left:8,right:15}}>
        <CartesianGrid strokeDasharray="3 3"/><XAxis type="number" tickFormatter={v=>numberFormat.format(v)}/><YAxis type="category" dataKey="uf" width={38}/>
        <Tooltip content={<Tip/>}/><Bar dataKey="cases" name="Casos" fill="#23a1b4" radius={[0,4,4,0]}/>
      </BarChart></ResponsiveContainer>
    </ChartPanel>
    <ChartPanel title="Evolução dos óbitos" subtitle="Estimativa simulada de óbitos por semana epidemiológica">
      <ResponsiveContainer width="100%" height="100%"><BarChart data={chartData.deaths}>
        <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="week"/><YAxis tickFormatter={v=>numberFormat.format(v)}/>
        <Tooltip content={<Tip/>}/><Bar dataKey="deaths" name="Óbitos" fill="#6b9cba" radius={[3,3,0,0]}/>
      </BarChart></ResponsiveContainer>
    </ChartPanel>
  </div>;
}