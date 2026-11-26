import fs from 'fs';
import csv from 'csv-parser';

const caminhoArquivo = './dados/caso_full.csv';

const registrosPorUF = {};
const registrosPorUFano = {};

fs.createReadStream(caminhoArquivo)
    .pipe(csv())
    .on('data', (linha) => {
        if (linha.place_type !== 'city') {
            return;
        }

        const uf = linha.state;
        const ano = linha.date.substring(0, 4);

        registrosPorUF[uf] = (registrosPorUF[uf] || 0) + 1;

        const chave = `${uf}-${ano}`;

        registrosPorUFano[chave] =
            (registrosPorUFano[chave] || 0) + 1;
    })
    .on('end', () => {
        console.log('REGISTROS POR ESTADO');
        console.log('==============================');

        Object.entries(registrosPorUF)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .forEach(([uf, quantidade]) => {
                console.log(`${uf}: ${quantidade}`);
            });

        console.log('\nREGISTROS POR ESTADO E ANO');
        console.log('==============================');

        Object.entries(registrosPorUFano)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .forEach(([chave, quantidade]) => {
                console.log(`${chave}: ${quantidade}`);
            });

        console.log('\nAnálise concluída!');
    })
    .on('error', (erro) => {
        console.error('Erro:', erro.message);
    });