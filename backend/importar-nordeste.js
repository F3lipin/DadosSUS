import fs from 'fs';
import csv from 'csv-parser';
import { pool } from './db.js';

const caminhoArquivo = './dados/caso_full.csv';
const tamanhoLote = 500;

const estadosNordeste = [
    'AL', 'CE', 'MA', 'PB',
    'PE', 'PI', 'RN', 'SE'
];

let lote = [];
let registrosProcessados = 0;
let lotesProcessados = 0;
let importacaoComErro = false;

function numeroOuNull(valor) {
    if (valor === undefined || valor === null || valor === '') {
        return null;
    }

    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
}

function booleanoOuNull(valor) {
    if (valor === undefined || valor === null || valor === '') {
        return null;
    }

    return String(valor).toLowerCase() === 'true';
}

async function inserirLote(loteAtual) {
    if (loteAtual.length === 0) return;

    const colunas = 18;
    const valores = [];
    const placeholders = [];

    loteAtual.forEach((registro, i) => {
        const inicio = i * colunas;

        placeholders.push(
            `(${Array.from(
                { length: colunas },
                (_, j) => `$${inicio + j + 1}`
            ).join(', ')})`
        );

        valores.push(...registro);
    });

    const sql = `
        INSERT INTO covid19 (
            codigo_ibge,
            municipio,
            uf,
            data,
            semana_epidemiologica,
            populacao_estimada,
            casos_confirmados,
            casos_por_100mil,
            obitos,
            taxa_letalidade,
            tipo_local,
            registro_mais_recente,
            registro_repetido,
            data_ultima_atualizacao,
            novos_casos,
            novos_obitos,
            populacao_estimada_2019,
            ordem_local
        )
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (codigo_ibge, data) DO NOTHING;
    `;

    await pool.query(sql, valores);

    registrosProcessados += loteAtual.length;
    lotesProcessados++;

    if (lotesProcessados % 20 === 0) {
        console.log(
            `Lotes processados: ${lotesProcessados} | ` +
            `Registros enviados: ${registrosProcessados}`
        );
    }
}

async function importar() {
    console.log('Iniciando leitura do CSV...');
    console.log('Filtro: restante do Nordeste, registros municipais.');

    const stream = fs.createReadStream(caminhoArquivo)
        .pipe(csv());

    stream.on('data', (linha) => {
        if (
            !estadosNordeste.includes(linha.state) ||
            linha.place_type !== 'city'
        ) {
            return;
        }

        lote.push([
            linha.city_ibge_code || null,
            linha.city || null,
            linha.state,
            linha.date || null,
            numeroOuNull(linha.epidemiological_week),
            numeroOuNull(linha.estimated_population),
            numeroOuNull(linha.last_available_confirmed),
            numeroOuNull(
                linha.last_available_confirmed_per_100k_inhabitants
            ),
            numeroOuNull(linha.last_available_deaths),
            numeroOuNull(linha.last_available_death_rate),
            linha.place_type || null,
            booleanoOuNull(linha.is_last),
            booleanoOuNull(linha.is_repeated),
            linha.last_available_date || null,
            numeroOuNull(linha.new_confirmed),
            numeroOuNull(linha.new_deaths),
            numeroOuNull(linha.estimated_population_2019),
            numeroOuNull(linha.order_for_place)
        ]);

        if (lote.length >= tamanhoLote) {
            stream.pause();

            const loteAtual = lote;
            lote = [];

            inserirLote(loteAtual)
                .then(() => {
                    stream.resume();
                })
                .catch((erro) => {
                    importacaoComErro = true;
                    console.error('Erro ao inserir lote:', erro.message);
                    stream.destroy(erro);
                });
        }
    });

    stream.on('end', async () => {
        try {
            if (importacaoComErro) return;

            if (lote.length > 0) {
                await inserirLote(lote);
                lote = [];
            }

            console.log('================================');
            console.log('IMPORTAÇÃO CONCLUÍDA!');
            console.log(`Registros enviados: ${registrosProcessados}`);
            console.log(`Lotes processados: ${lotesProcessados}`);
            console.log('================================');

        } catch (erro) {
            console.error('Erro ao finalizar importação:', erro.message);
        } finally {
            await pool.end();
        }
    });

    stream.on('error', async (erro) => {
        console.error('Erro durante a importação:', erro.message);

        try {
            await pool.end();
        } catch (erroBanco) {
            console.error('Erro ao fechar banco:', erroBanco.message);
        }
    });
}

importar();