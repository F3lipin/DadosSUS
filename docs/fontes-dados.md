
# Plataforma Inteligente de Monitoramento Epidemiológico

## 1. Objetivo do projeto

Desenvolver uma plataforma de monitoramento epidemiológico utilizando dados abertos de fontes oficiais de saúde, permitindo visualizar, analisar e comparar informações sobre diferentes doenças no Brasil.

Doenças contempladas:
- Chikungunya
- Mpox
- COVID-19

## 2. Fontes de dados

### 2.1 Chikungunya

- Fonte: API Dados Abertos do Ministério da Saúde.
- Endpoint:
  https://apidadosabertos.saude.gov.br/arboviroses/chikungunya?limit=100&offset=0
- Status: Fonte candidata identificada.
- Formato: JSON.
- Pendências:
  - Validar os campos.
  - Consultar o dicionário de dados.
  - Verificar cobertura temporal e geográfica.
  - Verificar paginação.

### 2.2 Mpox

- Fonte: API Dados Abertos do Ministério da Saúde.
- Endpoint:
  https://apidadosabertos.saude.gov.br/vigilancia-e-meio-ambiente/mpox?limit=100&offset=0
- Status: Fonte candidata identificada.
- Formato: JSON.
- Campos identificados na amostra:
  - dt_notific
  - dt_sin_pri
  - sg_uf
  - id_mn_resi
  - id_municip
  - nu_idade_n
  - cs_sexo
  - sintoma
  - clado
  - caract_genomica
  - vacina
  - hospital
  - uti
  - classi_fin
  - evolucao
  - dt_conclusao
- Pendências:
  - Consultar o dicionário de dados.
  - Interpretar os campos codificados.
  - Verificar cobertura temporal e geográfica.
  - Verificar paginação.

### 2.3 COVID-19 - Fonte principal

- Fonte: Arquivo CSV caso_full.csv.
- Status: Fonte escolhida, origem a confirmar.
- Formato: CSV.
- Campos identificados visualmente na amostra:
  - city
  - city_ibge_code
  - date
  - epidemiological_week
  - estimated_population
  - estimated_population_2019
  - is_last
  - is_repeated
  - last_available_confirmed
  - last_available_confirmed_per_100k_inhabitants
  - last_available_date
  - last_available_deaths
  - last_available_deaths_per_100k
  - place_type
  - state
- Observações:
  - O arquivo é grande.
  - Não será carregado diretamente pelo frontend.
  - O processamento será realizado pelo backend.
  - Os dados serão importados e tratados para armazenamento no banco.
- Pendências:
  - Confirmar a origem oficial ou institucional do arquivo.
  - Validar a estrutura completa.
  - Verificar cobertura temporal.
  - Definir processamento em lotes.
  - Avaliar tratamento e agregação dos registros.

### 2.4 COVID-19 - Fonte complementar

- Fonte: API Dados Abertos do Ministério da Saúde.
- Endpoint:
  https://apidadosabertos.saude.gov.br/assistencia-a-saude/registro-de-ocupacao-hospitalar-covid-19?limit=100&offset=0
- Status: Fonte complementar identificada.
- Formato: JSON.
- Dados identificados:
  - Estado.
  - Município.
  - CNES.
  - Data da notificação.
  - Ocupação hospitalar.
  - Ocupação de UTI.
  - Saídas por alta.
  - Saídas por óbito.
- Observações:
  - Não representa uma base geral de casos de COVID-19.
  - Possui registros com valores nulos.
  - A validação dos registros deverá ser considerada.
- Pendências:
  - Consultar o dicionário de dados.
  - Definir critérios de tratamento.
  - Verificar cobertura temporal e geográfica.
  - Verificar paginação.

## 3. Arquitetura planejada

- Frontend: React.
- Ferramenta de desenvolvimento frontend: Vite.
- Backend: Node.js.
- Banco de dados: MySQL.
- Integração: Backend responsável por consultar APIs, processar CSV, tratar dados e fornecer dados ao frontend.

## 4. Fluxo planejado

Fontes de dados -> Backend Node.js -> Processamento e tratamento -> MySQL -> API própria -> Frontend React.

## 5. Pendências gerais

- Validar todas as fontes de dados.
- Consultar os dicionários oficiais.
- Definir indicadores epidemiológicos.
- Definir estrutura do banco de dados.
- Implementar backend.
- Implementar importação e processamento do CSV.
- Integrar APIs oficiais.
- Conectar frontend ao backend.
- Substituir dados fictícios do frontend por dados reais.

## 6. Observação

As fontes e os campos descritos neste documento ainda estão sujeitos a validação técnica. Os dados deverão ser interpretados conforme seus dicionários oficiais e critérios epidemiológicos antes de serem utilizados nos indicadores da plataforma.
