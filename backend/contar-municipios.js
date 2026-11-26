import fs from 'fs';
import csv from 'csv-parser';

const caminhoArquivo = './dados/caso_full.csv';

let totalMunicipios = 0;
let totalEstados = 0;
let totalLinhas = 0;

fs.createReadStream(caminhoArquivo)
    .pipe(csv())
    .on('data', (linha) => {
        totalLinhas++;

        if (linha.place_type === 'city') {
            totalMunicipios++;
        }

        if (linha.place_type === 'state') {
            totalEstados++;
        }
    })
    .on('end', () => {
        console.log('================================');
        console.log('ANÁLISE DO CSV CONCLUÍDA');
        console.log('Total de linhas:', totalLinhas);
        console.log('Registros municipais:', totalMunicipios);
        console.log('Registros estaduais:', totalEstados);
        console.log('================================');
    })
    .on('error', (erro) => {
        console.error('Erro ao analisar CSV:', erro.message);
    });