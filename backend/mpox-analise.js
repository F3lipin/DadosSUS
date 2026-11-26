import express from "express";

const router = express.Router();

const API_MPOX =
    "https://apidadosabertos.saude.gov.br/vigilancia-e-meio-ambiente/mpox";

// Configurações da coleta
const LIMITE = 100;
const MAXIMO_REGISTROS = 1000;
const TEMPO_CACHE = 5 * 60 * 1000; // 5 minutos

// Cache compartilhado
let cacheRegistros = null;
let cacheExpiraEm = 0;
let coletaEmAndamento = null;

// Coleta e reutiliza os registros
async function buscarTodosRegistros() {
    // 1. Verifica se o cache ainda é válido
    if (
        cacheRegistros !== null &&
        Date.now() < cacheExpiraEm
    ) {
        return cacheRegistros;
    }

    // 2. Evita várias coletas simultâneas
    if (coletaEmAndamento) {
        return coletaEmAndamento;
    }

    // 3. Inicia uma nova coleta
    coletaEmAndamento = (async () => {
        const requisicoes = [];

        // Cria as requisições de todas as páginas
        for (
            let offset = 0;
            offset < MAXIMO_REGISTROS;
            offset += LIMITE
        ) {
            const url = new URL(API_MPOX);

            url.searchParams.set("limit", LIMITE);
            url.searchParams.set("offset", offset);

            requisicoes.push(fetch(url));
        }

        // Busca as páginas simultaneamente
        const respostas = await Promise.all(requisicoes);

        // Verifica se houve erro
        for (const resposta of respostas) {
            if (!resposta.ok) {
                throw new Error(
                    `Erro na API de Mpox: ${resposta.status}`
                );
            }
        }

        // Converte as respostas
        const paginas = await Promise.all(
            respostas.map(resposta => resposta.json())
        );

        // Reúne os registros
        const registros = paginas.flatMap(
            pagina => pagina.mpox || []
        );

        // Atualiza o cache
        cacheRegistros = registros;
        cacheExpiraEm = Date.now() + TEMPO_CACHE;

        console.log(
            `Coleta de Mpox concluída: ${registros.length} registros.`
        );

        return registros;
    })();

    try {
        return await coletaEmAndamento;
    } finally {
        // Libera a coleta para futuras atualizações
        coletaEmAndamento = null;
    }
}

// Análise de registros por estado
router.get("/estados", async (req, res) => {
    try {
        const registros = await buscarTodosRegistros();

        const estados = {};

        for (const registro of registros) {
            const uf = registro.sg_uf;

            if (!uf || uf.trim() === "") {
                continue;
            }

            estados[uf] = (estados[uf] || 0) + 1;
        }

        const resultado = Object.entries(estados)
            .map(([uf, total]) => ({
                uf,
                total_registros: total
            }))
            .sort((a, b) => b.total_registros - a.total_registros);

        res.json({
            doenca: "Mpox",
            total_registros: registros.length,
            estados: resultado
        });

    } catch (erro) {
        console.error("Erro na análise de Mpox por estado:", erro);

        res.status(500).json({
            mensagem: "Erro ao analisar registros de Mpox por estado."
        });
    }
});

// Análise temporal de Mpox
router.get("/serie-temporal", async (req, res) => {
    try {
        const registros = await buscarTodosRegistros();

        const meses = {};

        for (const registro of registros) {
            const data = registro.dt_notific;

            if (!data) {
                continue;
            }

            const mes = String(data).substring(0, 7);

            if (!/^\d{4}-\d{2}$/.test(mes)) {
                continue;
            }

            meses[mes] = (meses[mes] || 0) + 1;
        }

        const serie = Object.entries(meses)
            .map(([mes, total]) => ({
                mes,
                total_registros: total
            }))
            .sort((a, b) => a.mes.localeCompare(b.mes));

        res.json({
            doenca: "Mpox",
            total_registros: registros.length,
            serie
        });

    } catch (erro) {
        console.error("Erro na análise temporal de Mpox:", erro);

        res.status(500).json({
            mensagem: "Erro ao gerar série temporal de Mpox."
        });
    }
});

// Análise por faixa etária
router.get("/faixas-etarias", async (req, res) => {
    try {
        const registros = await buscarTodosRegistros();

        const faixas = {
            "0-9": 0,
            "10-19": 0,
            "20-29": 0,
            "30-39": 0,
            "40-49": 0,
            "50-59": 0,
            "60-69": 0,
            "70-79": 0,
            "80+": 0
        };

        let totalIdadesValidas = 0;

        for (const registro of registros) {
            const idade = Number(registro.nu_idade_n);

            if (
                registro.nu_idade_n === null ||
                registro.nu_idade_n === undefined ||
                registro.nu_idade_n === "" ||
                !Number.isInteger(idade) ||
                idade < 0
            ) {
                continue;
            }

            if (idade <= 9) {
                faixas["0-9"]++;
            } else if (idade <= 19) {
                faixas["10-19"]++;
            } else if (idade <= 29) {
                faixas["20-29"]++;
            } else if (idade <= 39) {
                faixas["30-39"]++;
            } else if (idade <= 49) {
                faixas["40-49"]++;
            } else if (idade <= 59) {
                faixas["50-59"]++;
            } else if (idade <= 69) {
                faixas["60-69"]++;
            } else if (idade <= 79) {
                faixas["70-79"]++;
            } else {
                faixas["80+"]++;
            }

            totalIdadesValidas++;
        }

        const resultado = Object.entries(faixas)
            .map(([faixa, total]) => ({
                faixa_etaria: faixa,
                total_registros: total
            }));

        res.json({
            doenca: "Mpox",
            total_registros: registros.length,
            total_idades_validas: totalIdadesValidas,
            faixas_etarias: resultado
        });

    } catch (erro) {
        console.error("Erro na análise de Mpox por faixa etária:", erro);

        res.status(500).json({
            mensagem: "Erro ao analisar faixas etárias de Mpox."
        });
    }
});

// Análise individual de sintomas
router.get("/sintomas", async (req, res) => {
    try {
        const registros = await buscarTodosRegistros();

        const sintomas = {};
        let totalRegistrosComSintoma = 0;

        for (const registro of registros) {
            const sintomaOriginal = registro.sintoma;

            if (
                sintomaOriginal === null ||
                sintomaOriginal === undefined ||
                sintomaOriginal.trim() === ""
            ) {
                continue;
            }

            const listaSintomas = sintomaOriginal
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toUpperCase()
                .split(",")
                .map(sintoma => sintoma.trim())
                .filter(sintoma => sintoma !== "");

            const sintomasUnicos = new Set(listaSintomas);

            if (sintomasUnicos.size === 0) {
                continue;
            }

            totalRegistrosComSintoma++;

            for (const sintoma of sintomasUnicos) {
                sintomas[sintoma] = (sintomas[sintoma] || 0) + 1;
            }
        }

        const resultado = Object.entries(sintomas)
            .map(([sintoma, total]) => ({
                sintoma,
                total_registros: total
            }))
            .sort((a, b) => b.total_registros - a.total_registros);

        res.json({
            doenca: "Mpox",
            total_registros: registros.length,
            total_registros_com_sintoma: totalRegistrosComSintoma,
            total_sintomas_identificados: resultado.length,
            sintomas: resultado
        });

    } catch (erro) {
        console.error("Erro na análise de sintomas de Mpox:", erro);

        res.status(500).json({
            mensagem: "Erro ao analisar sintomas de Mpox."
        });
    }
});

export default router;
