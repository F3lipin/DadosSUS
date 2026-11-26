const campos = [
    "dt_notific",
    "dt_sin_pri",
    "sg_uf",
    "nu_idade_n",
    "cs_sexo",
    "sintoma",
    "classi_fin",
    "evolucao",
    "hospital",
    "uti",
    "vacina",
    "clado"
];

async function analisarMpox() {
    const registros = [];

    for (let offset = 0; offset < 500; offset += 100) {
        const url = `http://localhost:3001/api/mpox?limit=100&offset=${offset}`;

        const resposta = await fetch(url);

        if (!resposta.ok) {
            throw new Error(`Erro na consulta: ${resposta.status}`);
        }

        const dados = await resposta.json();

        registros.push(...dados.mpox);

        console.log(`Página ${offset / 100 + 1} carregada.`);
    }

    console.log("\nTotal de registros analisados:", registros.length);

    for (const campo of campos) {
        const preenchidos = registros.filter(
            registro =>
                registro[campo] !== null &&
                registro[campo] !== undefined &&
                registro[campo] !== ""
        );

        const valores = {};

        for (const registro of preenchidos) {
            const valor = String(registro[campo]);

            valores[valor] = (valores[valor] || 0) + 1;
        }

        console.log(`\nCampo: ${campo}`);
        console.log(`Preenchidos: ${preenchidos.length}/${registros.length}`);
        console.log("Valores encontrados:");

        console.log(
            Object.entries(valores)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 20)
        );
    }
}

analisarMpox().catch(erro => {
    console.error("Erro na análise:", erro.message);
});
