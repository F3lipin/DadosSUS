import fs from 'fs';
import csv from 'csv-parser';
import { pool } from './db.js';

const caminhoArquivo = './dados/caso_full.csv';
const TAMANHO_LOTE = 500;

function numeroOuNull(valor) {
    if (valor === undefined || valor === null || valor === '') {
        return null;
    }

    return Number(valor);
}

function booleanoOuNull(valor) {
    if (valor === undefined || valor === null || valor === '') {
        return null;
    }

    return valor.toLowerCase() === 'true';
}

function transformarLinha(linha) {
    return [
        linha.city_ibge_code,
        linha.city,
        linha.state,
        linha.date,
        numeroOuNull(linha.epidemiological_week),
        numeroOuNull(linha.estimated_population),
        numeroOuNull(linha.last_available_confirmed),
        numeroOuNull(linha.last_available_confirmed_per_100k_inhabitants),
        numeroOuNull(linha.last_available_deaths),
        null,
        linha.place_type,
        booleanoOuNull(linha.is_last),
        booleanoOuNull(linha.is_repeated),
        linha.last_available_date || null,
        numeroOuNull(linha.new_confirmed),
        numeroOuNull(linha.new_deaths),
        numeroOuNull(linha.last_available_death_rate),
        numeroOuNull(linha.estimated_population_2019),
        numeroOuNull(linha.order_for_place)
    ];
}

async function inserirLote(lote) {
    const colunas = [
        'codigo_ibge',
        'municipio',
        'uf',
        'data',
        'semana_epidemiologica',
        'populacao_estimada',
        'casos_confirmados',
        'casos_por_100mil',
        'obitos',
        'obitos_por_100mil',
        'tipo_local',
        'registro_mais_recente',
        'registro_repetido',
        'data_ultima_atualizacao',
        'novos_casos',
        'novos_obitos',
        'taxa_letalidade',
        'populacao_estimada_2019',
        'ordem_local'
    ];

    const valores = [];
    const grupos = lote.map((registro, indice) => {
        const placeholders = registro.map((valor) => {
            valores.push(valor);
            return `$${valores.length}`;
        });

        return `(${placeholders.join(', ')})`;
    });

    const sql = `
        INSERT INTO covid19 (${colunas.join(', ')})
        VALUES ${grupos.join(', ')}
        ON CONFLICT (codigo_ibge, data) DO NOTHING
    `;

    const resultado = await pool.query(sql, valores);

    return resultado.rowCount;
}

async function importar() {
    let lote = [];
    let totalMunicipais = 0;
    let totalInseridos = 0;
    let totalIgnorados = 0;
    let numeroLotes = 0;

    const arquivo = fs.createReadStream(caminhoArquivo);
    const parser = csv();

    try {
        arquivo.pipe(parser);

        for await (const linha of parser) {
            if (linha.place_type !== 'city') {
                continue;
            }

            lote.push(transformarLinha(linha));
            totalMunicipais++;

            if (lote.length >= TAMANHO_LOTE) {
                const inseridos = await inserirLote(lote);

                totalInseridos += inseridos;
                totalIgnorados += lote.length - inseridos;
                numeroLotes++;

                if (numeroLotes % 10 === 0) {
                    console.log(
                        `Lotes: ${numeroLotes} | ` +
                        `Municipais processados: ${totalMunicipais} | ` +
                        `Inseridos: ${totalInseridos} | ` +
                        `Ignorados: ${totalIgnorados}`
                    );
                }

                lote = [];
            }
        }

        // Inserir os registros restantes, caso existam
        if (lote.length > 0) {
            const inseridos = await inserirLote(lote);

            totalInseridos += inseridos;
            totalIgnorados += lote.length - inseridos;
            numeroLotes++;
        }

        console.log('================================');
        console.log('IMPORTAÇÃO CONCLUÍDA!');
        console.log('Lotes enviados:', numeroLotes);
        console.log('Registros municipais processados:', totalMunicipais);
        console.log('Registros inseridos:', totalInseridos);
        console.log('Registros ignorados:', totalIgnorados);
        console.log('================================');
    } catch (erro) {
        console.error('Erro durante a importação:', erro.message);
        throw erro;
    } finally {
        arquivo.destroy();
        parser.destroy();
        await pool.end();
    }
}

importar().catch((erro) => {
    console.error('Importação interrompida:', erro.message);
    process.exitCode = 1;
});