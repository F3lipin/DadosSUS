import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db.js";
import mpoxAnaliseRouter from "./mpox-analise.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use("/api/mpox", mpoxAnaliseRouter);

// Rota inicial
app.get("/", (req, res) => {
    res.json({
        mensagem: "Backend da Plataforma Epidemiológica funcionando!"
    });
});

// Rota de status
app.get("/api/status", (req, res) => {
    res.json({
        status: "online",
        projeto: "Plataforma Inteligente de Monitoramento Epidemiológico"
    });
});

// Rota de teste do banco
app.get("/api/teste-banco", async (req, res) => {
    try {
        const resultado = await pool.query("SELECT NOW()");

        res.json({
            mensagem: "Conexão com Supabase funcionando!",
            horario: resultado.rows[0].now
        });
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            mensagem: "Erro ao conectar ao banco de dados."
        });
    }
});

// Resumo geral da COVID-19
app.get("/api/covid/resumo", async (req, res) => {
    try {
        const consulta = `
            WITH registros_recentes AS (
                SELECT DISTINCT ON (codigo_ibge)
                    codigo_ibge,
                    uf,
                    casos_confirmados,
                    obitos
                FROM covid19
                WHERE codigo_ibge IS NOT NULL
                  AND tipo_local = 'city'
                ORDER BY codigo_ibge, data DESC
            )
            SELECT
                COALESCE(SUM(casos_confirmados), 0) AS total_casos,
                COALESCE(SUM(obitos), 0) AS total_obitos,
                COUNT(DISTINCT uf) AS estados_monitorados,
                COUNT(DISTINCT codigo_ibge) AS municipios_monitorados
            FROM registros_recentes;
        `;

        const resultado = await pool.query(consulta);

        res.json({
            doenca: "COVID-19",
            ...resultado.rows[0]
        });

    } catch (erro) {
        console.error("Erro ao consultar resumo da COVID-19:", erro);

        res.status(500).json({
            mensagem: "Erro ao buscar resumo da COVID-19."
        });
    }
});

// Dados da COVID-19 agrupados por estado
app.get("/api/covid/estados", async (req, res) => {
    try {
        const consulta = `
            WITH registros_recentes AS (
                SELECT DISTINCT ON (codigo_ibge)
                    codigo_ibge,
                    municipio,
                    uf,
                    casos_confirmados,
                    obitos
                FROM covid19
                WHERE codigo_ibge IS NOT NULL
                  AND tipo_local = 'city'
                ORDER BY codigo_ibge, data DESC
            )
            SELECT
                uf,
                COUNT(DISTINCT codigo_ibge) AS municipios_monitorados,
                COALESCE(SUM(casos_confirmados), 0) AS total_casos,
                COALESCE(SUM(obitos), 0) AS total_obitos
            FROM registros_recentes
            GROUP BY uf
            ORDER BY uf;
        `;

        const resultado = await pool.query(consulta);

        res.json({
            doenca: "COVID-19",
            estados: resultado.rows
        });

    } catch (erro) {
        console.error("Erro ao consultar dados por estado:", erro);

        res.status(500).json({
            mensagem: "Erro ao buscar dados por estado."
        });
    }
});

// Dados da COVID-19 por município
app.get("/api/covid/municipios", async (req, res) => {
    try {
        const uf = req.query.uf
            ? req.query.uf.trim().toUpperCase()
            : null;

        if (uf && !/^[A-Z]{2}$/.test(uf)) {
            return res.status(400).json({
                mensagem: "UF inválida. Utilize duas letras, como BA ou PE."
            });
        }

        const consulta = `
            WITH registros_recentes AS (
                SELECT DISTINCT ON (codigo_ibge)
                    codigo_ibge,
                    municipio,
                    uf,
                    data,
                    casos_confirmados,
                    obitos
                FROM covid19
                WHERE codigo_ibge IS NOT NULL
                  AND tipo_local = 'city'
                  AND ($1::text IS NULL OR uf::text = $1::text)
                ORDER BY codigo_ibge, data DESC
            )
            SELECT
                codigo_ibge,
                municipio,
                uf,
                data AS data_referencia,
                casos_confirmados,
                obitos
            FROM registros_recentes
            ORDER BY uf, municipio;
        `;

        const resultado = await pool.query(consulta, [uf]);

        res.json({
            doenca: "COVID-19",
            filtro_uf: uf,
            total_municipios: resultado.rows.length,
            municipios: resultado.rows
        });

    } catch (erro) {
        console.error("Erro ao consultar municípios:", erro);

        res.status(500).json({
            mensagem: "Erro ao buscar dados dos municípios."
        });
    }
});

// Série temporal da COVID-19
app.get("/api/covid/serie-temporal", async (req, res) => {
    try {
        const uf = req.query.uf
            ? req.query.uf.trim().toUpperCase()
            : null;

        if (uf && !/^[A-Z]{2}$/.test(uf)) {
            return res.status(400).json({
                mensagem: "UF inválida. Utilize duas letras, como BA ou PE."
            });
        }

        const consulta = `
            SELECT
                data,
                COALESCE(SUM(casos_confirmados), 0) AS total_casos,
                COALESCE(SUM(obitos), 0) AS total_obitos
            FROM covid19
            WHERE codigo_ibge IS NOT NULL
              AND tipo_local = 'city'
              AND ($1::text IS NULL OR uf::text = $1::text)
            GROUP BY data
            ORDER BY data;
        `;

        const resultado = await pool.query(consulta, [uf]);

        res.json({
            doenca: "COVID-19",
            filtro_uf: uf,
            total_registros: resultado.rows.length,
            serie: resultado.rows
        });

    } catch (erro) {
        console.error("Erro ao consultar série temporal:", erro);

        res.status(500).json({
            mensagem: "Erro ao buscar série temporal da COVID-19."
        });
    }
});

// API de dados abertos de Mpox
app.get("/api/mpox", async (req, res) => {
    try {
        const limit = req.query.limit === undefined
            ? 100
            : Number(req.query.limit);

        const offset = req.query.offset === undefined
            ? 0
            : Number(req.query.offset);

        // Validação dos parâmetros
        if (
            !Number.isInteger(limit) ||
            limit < 1 ||
            limit > 100
        ) {
            return res.status(400).json({
                mensagem: "O limit deve ser um inteiro entre 1 e 100."
            });
        }

        if (
            !Number.isInteger(offset) ||
            offset < 0
        ) {
            return res.status(400).json({
                mensagem: "O offset deve ser um inteiro igual ou maior que zero."
            });
        }

        const url = new URL(
            "https://apidadosabertos.saude.gov.br/vigilancia-e-meio-ambiente/mpox"
        );

        url.searchParams.set("limit", limit);
        url.searchParams.set("offset", offset);

        const resposta = await fetch(url);

        if (!resposta.ok) {
            throw new Error(
                `API externa retornou status ${resposta.status}`
            );
        }

        const dados = await resposta.json();

        res.json(dados);

    } catch (erro) {
        console.error("Erro ao consultar API de Mpox:", erro);

        res.status(500).json({
            mensagem: "Erro ao buscar dados de Mpox na API externa."
        });
    }
});

// Inicialização do servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
