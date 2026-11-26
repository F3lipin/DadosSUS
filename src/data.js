export const STATES = [
  ["AC","Acre",0.9,0.9],["AL","Alagoas",3.2,3.1],["AP","Amapá",0.8,0.8],["AM","Amazonas",4.2,3.9],
  ["BA","Bahia",14.1,12.7],["CE","Ceará",9.2,8.5],["DF","Distrito Federal",3.0,3.6],["ES","Espírito Santo",4.1,4.4],
  ["GO","Goiás",7.2,8.1],["MA","Maranhão",7.0,5.8],["MT","Mato Grosso",3.7,4.6],["MS","Mato Grosso do Sul",2.8,3.3],
  ["MG","Minas Gerais",21.4,24.2],["PA","Pará",8.7,8.3],["PB","Paraíba",4.0,3.8],["PR","Paraná",11.5,12.1],
  ["PE","Pernambuco",9.6,8.9],["PI","Piauí",3.3,3.4],["RJ","Rio de Janeiro",17.2,17.4],["RN","Rio Grande do Norte",3.5,3.6],
  ["RS","Rio Grande do Sul",11.3,10.1],["RO","Rondônia",1.8,1.9],["RR","Roraima",0.7,0.7],["SC","Santa Catarina",7.6,8.5],
  ["SP","São Paulo",46.6,49.5],["SE","Sergipe",2.3,2.2],["TO","Tocantins",1.6,1.7]
];
export const CITIES = {
  SP:["São Paulo","Campinas","Santos"], RJ:["Rio de Janeiro","Niterói","Duque de Caxias"],
  MG:["Belo Horizonte","Uberlândia","Contagem"], BA:["Salvador","Feira de Santana","Vitória da Conquista"],
  PR:["Curitiba","Londrina","Maringá"], RS:["Porto Alegre","Caxias do Sul","Pelotas"], DF:["Brasília"]
};
export const DISEASES = {
  chikungunya:{name:"Chikungunya",base:68000,confirmed:.72,fatality:.0018,trend:[.78,1,1.19],season:[1.25,1.35,1.45,1.55,1.55,1.42,1.2,1.02,.86,.78,.69,.62],color:"#1766a3",hot:["BA","PE","CE","MG","RJ"],boost:1.85,other:1},
  mpox:{name:"Mpox",base:3100,confirmed:.81,fatality:.003,trend:[1.28,.92,1.06],season:[.75,.8,.9,1.05,1.12,1.18,1.28,1.38,1.32,1.18,1,.84],color:"#18a7b3",hot:["SP","RJ","MG","DF"],boost:2.25,other:.75},
  covid:{name:"COVID-19",base:255000,confirmed:.89,fatality:.0048,trend:[1.35,1.04,.83],season:[1.08,1.13,1.05,.91,.86,.92,1.12,1.28,1.26,1.04,.91,.84],color:"#087f80",hot:["SP","RJ","MG","RS","PR"],boost:1.3,other:1}
};
export const PERIODS = {
  all:["Ano completo",0,52], q1:["1º trimestre",0,13], q2:["2º trimestre",13,26],
  q3:["3º trimestre",26,39], q4:["4º trimestre",39,52]
};
export const DEFAULT_FILTERS = {year:2025, uf:"", city:"", period:"all"};

function weight(disease, state) {
  return state[2] * (disease.hot.includes(state[0]) ? disease.boost : disease.other);
}
function cityFactor(city) {
  if (!city) return 1;
  if (city === "Demais municípios") return .48;
  if (city === "Brasília") return .72;
  if (city === "São Paulo" || city === "Rio de Janeiro") return .32;
  return .18;
}
export function rowsFor(key, year, period, uf="", city="") {
  const disease = DISEASES[key];
  const range = PERIODS[period];
  const totalWeight = STATES.reduce((sum, state) => sum + weight(disease,state), 0);
  const weeklyWeights = Array.from({length:52}, (_, week) =>
    disease.season[Math.min(11, Math.floor(week*12/52))] * (1 + .13*Math.sin(week*1.31) + .06*Math.cos(week*.64))
  );
  const weightSum = weeklyWeights.reduce((a,b)=>a+b,0);
  return STATES.filter(state => !uf || state[0] === uf).map(state => {
    const factor = cityFactor(city);
    const annual = Math.round(disease.base * (disease.trend[year-2023] || .8) * weight(disease,state) / totalWeight);
    let cumulative = 0;
    const weeks = weeklyWeights.map((value,index) => {
      const previous = cumulative;
      cumulative += value;
      return index >= range[1] && index < range[2]
        ? Math.round(annual*cumulative/weightSum*factor)-Math.round(annual*previous/weightSum*factor) : 0;
    });
    const cases = weeks.reduce((a,b)=>a+b,0);
    const population = state[3] * 1_000_000 * factor;
    return {
      uf:state[0], name:state[1], cases, confirmed:Math.round(cases*disease.confirmed),
      deaths:Math.round(cases*disease.fatality), incidence:cases/population*100000, weeks, population
    };
  });
}
export function sumRows(rows) {
  return rows.reduce((sum,row)=>({
    cases:sum.cases+row.cases, confirmed:sum.confirmed+row.confirmed,
    deaths:sum.deaths+row.deaths, population:sum.population+row.population
  }), {cases:0,confirmed:0,deaths:0,population:0});
}
