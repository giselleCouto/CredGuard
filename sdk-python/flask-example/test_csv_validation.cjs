/**
 * Testes automatizados para validação de CSV
 * Execute com: node test_csv_validation.js
 */

const fs = require('fs');

// Simular File API do navegador
class MockFile {
    constructor(content, name, size) {
        this.content = content;
        this.name = name;
        this.size = size || content.length;
    }
}

// Simular FileReader
global.FileReader = class {
    readAsText(file) {
        setTimeout(() => {
            this.result = file.content;
            if (this.onload) {
                this.onload({ target: { result: this.result } });
            }
        }, 0);
    }
};

// Carregar o validador
eval(fs.readFileSync('./static/csv-validator.js', 'utf8'));

// Testes
async function runTests() {
    const validator = new CSVValidator();
    let passed = 0;
    let failed = 0;

    console.log('🧪 Iniciando testes de validação de CSV\n');

    // Teste 1: CSV válido
    console.log('Teste 1: CSV válido (clientes_exemplo.csv)');
    try {
        const validCSV = fs.readFileSync('./clientes_exemplo.csv', 'utf8');
        const file1 = new MockFile(validCSV, 'clientes_exemplo.csv');
        const result1 = await validator.validateFile(file1);
        
        if (result1.valid) {
            console.log('✅ PASSOU - CSV válido reconhecido');
            console.log(`   Registros: ${result1.stats.rows}, Válidos: ${result1.stats.validRows}`);
            passed++;
        } else {
            console.log('❌ FALHOU - CSV válido marcado como inválido');
            console.log('   Erros:', result1.errors);
            failed++;
        }
    } catch (error) {
        console.log('❌ FALHOU - Erro:', error.message);
        failed++;
    }

    // Teste 2: CSV inválido (múltiplos erros)
    console.log('\nTeste 2: CSV inválido (test_invalid.csv)');
    try {
        const invalidCSV = fs.readFileSync('./test_invalid.csv', 'utf8');
        const file2 = new MockFile(invalidCSV, 'test_invalid.csv');
        const result2 = await validator.validateFile(file2);
        
        if (!result2.valid && result2.errors.length > 0) {
            console.log('✅ PASSOU - CSV inválido detectado');
            console.log(`   Erros encontrados: ${result2.errors.length}`);
            console.log('   Exemplos de erros:');
            result2.errors.slice(0, 3).forEach(err => console.log(`   - ${err}`));
            passed++;
        } else {
            console.log('❌ FALHOU - CSV inválido não detectado');
            failed++;
        }
    } catch (error) {
        console.log('❌ FALHOU - Erro:', error.message);
        failed++;
    }

    // Teste 3: Arquivo vazio
    console.log('\nTeste 3: Arquivo vazio');
    try {
        const emptyFile = new MockFile('', 'empty.csv');
        const result3 = await validator.validateFile(emptyFile);
        
        if (!result3.valid) {
            console.log('✅ PASSOU - Arquivo vazio detectado');
            passed++;
        } else {
            console.log('❌ FALHOU - Arquivo vazio não detectado');
            failed++;
        }
    } catch (error) {
        console.log('❌ FALHOU - Erro:', error.message);
        failed++;
    }

    // Teste 4: Arquivo muito grande
    console.log('\nTeste 4: Arquivo muito grande (>16MB)');
    try {
        const largeContent = 'a'.repeat(17 * 1024 * 1024);
        const largeFile = new MockFile(largeContent, 'large.csv', 17 * 1024 * 1024);
        const result4 = await validator.validateFile(largeFile);
        
        if (!result4.valid && result4.errors.some(e => e.includes('muito grande'))) {
            console.log('✅ PASSOU - Arquivo grande detectado');
            passed++;
        } else {
            console.log('❌ FALHOU - Arquivo grande não detectado');
            failed++;
        }
    } catch (error) {
        console.log('❌ FALHOU - Erro:', error.message);
        failed++;
    }

    // Teste 5: Extensão incorreta
    console.log('\nTeste 5: Extensão incorreta');
    try {
        const txtFile = new MockFile('dados', 'arquivo.txt');
        const result5 = await validator.validateFile(txtFile);
        
        if (!result5.valid && result5.errors.some(e => e.includes('extensão'))) {
            console.log('✅ PASSOU - Extensão incorreta detectada');
            passed++;
        } else {
            console.log('❌ FALHOU - Extensão incorreta não detectada');
            failed++;
        }
    } catch (error) {
        console.log('❌ FALHOU - Erro:', error.message);
        failed++;
    }

    // Teste 6: Header faltando colunas
    console.log('\nTeste 6: Header incompleto');
    try {
        const incompleteHeader = 'cpf,nome\n12345678901,João Silva';
        const file6 = new MockFile(incompleteHeader, 'incomplete.csv');
        const result6 = await validator.validateFile(file6);
        
        if (!result6.valid && result6.errors.some(e => e.includes('faltando'))) {
            console.log('✅ PASSOU - Header incompleto detectado');
            passed++;
        } else {
            console.log('❌ FALHOU - Header incompleto não detectado');
            failed++;
        }
    } catch (error) {
        console.log('❌ FALHOU - Erro:', error.message);
        failed++;
    }

    // Teste 7: CPF inválido
    console.log('\nTeste 7: Validação de CPF');
    try {
        const invalidCPF = `cpf,nome,renda_mensal,idade,score_bureau,historico_pagamentos,divida_total,tempo_emprego_meses
123,João Silva,5000.00,35,720,bom,15000.00,48`;
        const file7 = new MockFile(invalidCPF, 'invalid_cpf.csv');
        const result7 = await validator.validateFile(file7);
        
        if (!result7.valid && result7.errors.some(e => e.includes('CPF'))) {
            console.log('✅ PASSOU - CPF inválido detectado');
            passed++;
        } else {
            console.log('❌ FALHOU - CPF inválido não detectado');
            failed++;
        }
    } catch (error) {
        console.log('❌ FALHOU - Erro:', error.message);
        failed++;
    }

    // Teste 8: Score fora da faixa
    console.log('\nTeste 8: Score bureau fora da faixa');
    try {
        const invalidScore = `cpf,nome,renda_mensal,idade,score_bureau,historico_pagamentos,divida_total,tempo_emprego_meses
12345678901,João Silva,5000.00,35,900,bom,15000.00,48`;
        const file8 = new MockFile(invalidScore, 'invalid_score.csv');
        const result8 = await validator.validateFile(file8);
        
        if (!result8.valid && result8.errors.some(e => e.includes('Score bureau'))) {
            console.log('✅ PASSOU - Score inválido detectado');
            passed++;
        } else {
            console.log('❌ FALHOU - Score inválido não detectado');
            failed++;
        }
    } catch (error) {
        console.log('❌ FALHOU - Erro:', error.message);
        failed++;
    }

    // Resumo
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Resumo dos Testes`);
    console.log('='.repeat(50));
    console.log(`✅ Passou: ${passed}`);
    console.log(`❌ Falhou: ${failed}`);
    console.log(`📈 Taxa de sucesso: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(50));

    if (failed === 0) {
        console.log('\n🎉 Todos os testes passaram!');
        process.exit(0);
    } else {
        console.log('\n⚠️  Alguns testes falharam');
        process.exit(1);
    }
}

// Executar testes
runTests().catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
});
