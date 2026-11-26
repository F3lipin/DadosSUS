const API_URL = "http://localhost:3001";

// Função central para realizar requisições ao backend
async function requisicao(endpoint) {
  const resposta = await fetch(`${API_URL}${endpoint}`);

  if (!resposta.ok) {
    throw new Error(`Erro na requisição: ${resposta.status}`);
  }

  return resposta.json();
}

// Resumo geral de COVID-19
export function buscarResumoCovid() {
  return requisicao("/api/covid/resumo");
}

// Dados de COVID-19 agrupados por estado
export function buscarEstadosCovid() {
  return requisicao("/api/covid/estados");
}

// Dados de COVID-19 dos municípios
export function buscarMunicipiosCovid(uf = "") {
  const endpoint = uf
    ? `/api/covid/municipios?uf=${encodeURIComponent(uf)}`
    : "/api/covid/municipios";

  return requisicao(endpoint);
}

// Série temporal de COVID-19
export function buscarSerieCovid(uf = "") {
  const endpoint = uf
    ? `/api/covid/serie-temporal?uf=${encodeURIComponent(uf)}`
    : "/api/covid/serie-temporal";

  return requisicao(endpoint);
}
