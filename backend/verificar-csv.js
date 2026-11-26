import fs from 'fs';
import csv from 'csv-parser';

const caminhoArquivo = './dados/caso_full.csv';

let quantidade = 0;

fs.createReadStream(caminhoArquivo)
    .pipe(csv())
    .on('data', (linha) => {
        quantidade++;

        if (quantidade <= 5) {
            console.log(linha);
        }
    })
    .on('end', () => {
        console.log('Leitura concluída!');
        console.log('Linhas lidas:', quantidade);
    })
    .on('error', (erro) => {
        console.error('Erro ao ler o CSV:', erro.message);
    });