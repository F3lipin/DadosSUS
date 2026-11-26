import fs from 'fs';
import csv from 'csv-parser';
import { pool } from './db.js';

const caminhoArquivo = './dados/caso_full.csv';
const tamanhoLote = 500;

const registros = [];

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

async function inserirLote(lote) {
    if (lote.length === 0) return;

    const colunas = 18;
    const valores = [];
    const placeholders = [];

    lote.forEach((registro, i) => {
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
}

async function importar() {
    console.log('Iniciando leitura do CSV...');
    console.log('Filtro: Bahia (BA), registros municipais.');

    const stream = fs.createReadStream(caminhoArquivo)
        .pipe(csv());

    stream.on('data', (linha) => {
        if (linha.state !== 'BA' || linha.place_type !== 'city') {
            return;
        }

        registros.push([
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
    });

    stream.on('end', async () => {
        try {
            console.log(`Registros da Bahia encontrados: ${registros.length}`);
            console.log('Iniciando inserção no Supabase...');

            let inseridosEmLotes = 0;

            for (let i = 0; i < registros.length; i += tamanhoLote) {
                const lote = registros.slice(i, i + tamanhoLote);

                await inserirLote(lote);

                inseridosEmLotes++;

                if (inseridosEmLotes % 20 === 0) {
                    console.log(
                        `Lotes processados: ${inseridosEmLotes} | ` +
                        `Registros enviados: ${Math.min(
                            i + tamanhoLote,
                            registros.length
                        )}`
                    );
                }
            }

            console.log('================================');
            console.log('IMPORTAÇÃO CONCLUÍDA!');
            console.log(`Registros processados: ${registros.length}`);
            console.log(`Lotes: ${inseridosEmLotes}`);
            console.log('================================');

        } catch (erro) {
            console.error('Erro durante a inserção:', erro.message);
        } finally {
            await pool.end();
        }
    });

    stream.on('error', async (erro) => {
        console.error('Erro na leitura do CSV:', erro.message);
        await pool.end();
    });
}

importar();