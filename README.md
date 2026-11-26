# Monitoramento Epidemiológico — React

Projeto convertido para React + Vite. Os dados continuam sendo **simulados** e não representam números oficiais do Ministério da Saúde.

## Requisitos
- Node.js LTS instalado
- npm

## Como executar
1. Extraia a pasta do projeto.
2. Abra a pasta no VS Code.
3. Abra o terminal integrado.
4. Execute:

```bash
npm install
npm run dev
```

5. Abra no navegador o endereço local mostrado pelo Vite (normalmente `http://localhost:5173`).

## Estrutura

```text
monitoramento-epidemiologico-react/
├── index.html
├── package.json
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── data.js
    ├── utils.js
    ├── styles.css
    └── components/
        ├── Header.jsx
        ├── DiseaseTabs.jsx
        ├── Filters.jsx
        ├── Metrics.jsx
        ├── BrazilStateGrid.jsx
        ├── EpidemiologyCharts.jsx
        ├── Ranking.jsx
        └── InfoModal.jsx
```

## Observações
- A interface foi dividida em componentes React.
- Os dados simulados e a lógica de geração estão em `src/data.js`.
- Os gráficos usam Recharts.
- O quadro de UFs é uma visualização esquemática em blocos, não um mapa geográfico real.
- O projeto ainda não possui backend, API real ou banco MySQL.
