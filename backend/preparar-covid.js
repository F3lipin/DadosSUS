import fs from 'fs';
import csv from 'csv-parser';

const caminhoArquivo = './dados/caso_full.csv';

let quantidade = 0;

fs.createReadStream(caminhoArquivo)
    .pipe(csv())
    .on('data', (linha) => {

        // Vamos trabalhar apenas com registros de municípios
        if (linha.place_type !== 'city') {
            return;
        }

        // Limitar o teste aos primeiros 10 registros municipais
        if (quantidade >= 10) {
            return;
        }

        quantidade++;

        const registro = {
            codigo_ibge: linha.city_ibge_code,
            municipio: linha.city,
            uf: linha.state,
            data: linha.date,
            semana_epidemiologica: linha.epidemiological_week,
            populacao_estimada: linha.estimated_population,
            casos_confirmados: linha.last_available_confirmed,
            casos_por_100mil: linha.last_available_confirmed_per_100k_inhabitants,
            obitos: linha.last_available_deaths,
            taxa_letalidade: linha.last_available_death_rate,
            tipo_local: linha.place_type,
            registro_mais_recente: linha.is_last,
            registro_repetido: linha.is_repeated,
            data_ultima_atualizacao: linha.last_available_date,
            novos_casos: linha.new_confirmed,
            novos_obitos: linha.new_deaths,
            populacao_estimada_2019: linha.estimated_population_2019,
            ordem_local: linha.order_for_place
        };

        console.log('Registro preparado:', registro);
    })
    .on('end', () => {
        console.log('---------------------------');
        console.log('Preparação concluída!');
        console.log('Registros preparados:', quantidade);
    })
    .on('error', (erro) => {
        console.error('Erro:', erro.message);
    });