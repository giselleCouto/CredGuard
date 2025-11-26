/**
 * Validador de CSV para CredGuard
 * Valida formato e dados do CSV antes do upload
 */

class CSVValidator {
    constructor() {
        this.requiredColumns = [
            'cpf',
            'nome',
            'renda_mensal',
            'idade',
            'score_bureau',
            'historico_pagamentos',
            'divida_total',
            'tempo_emprego_meses'
        ];
        
        this.historicoValidos = ['excelente', 'bom', 'regular', 'ruim'];
        this.maxFileSize = 16 * 1024 * 1024; // 16 MB
        this.maxRows = 10000;
    }

    /**
     * Valida o arquivo CSV completo
     * @param {File} file - Arquivo CSV
     * @returns {Promise<Object>} Resultado da validação
     */
    async validateFile(file) {
        const result = {
            valid: true,
            errors: [],
            warnings: [],
            stats: {
                rows: 0,
                validRows: 0,
                invalidRows: 0
            }
        };

        // Validar tamanho do arquivo
        if (file.size > this.maxFileSize) {
            result.valid = false;
            result.errors.push(`Arquivo muito grande: ${this.formatFileSize(file.size)}. Máximo: 16 MB`);
            return result;
        }

        // Validar extensão
        if (!file.name.toLowerCase().endsWith('.csv')) {
            result.valid = false;
            result.errors.push('Arquivo deve ter extensão .csv');
            return result;
        }

        try {
            // Ler conteúdo do arquivo
            const content = await this.readFile(file);
            
            // Parsear CSV
            const rows = this.parseCSV(content);
            
            if (rows.length === 0) {
                result.valid = false;
                result.errors.push('Arquivo CSV está vazio');
                return result;
            }

            // Validar header
            const header = rows[0];
            const headerValidation = this.validateHeader(header);
            if (!headerValidation.valid) {
                result.valid = false;
                result.errors.push(...headerValidation.errors);
                return result;
            }

            // Validar número de linhas
            const dataRows = rows.slice(1);
            result.stats.rows = dataRows.length;

            if (dataRows.length === 0) {
                result.valid = false;
                result.errors.push('Arquivo não contém dados (apenas header)');
                return result;
            }

            if (dataRows.length > this.maxRows) {
                result.warnings.push(`Arquivo contém ${dataRows.length} linhas. Recomendado: máximo ${this.maxRows} linhas`);
            }

            // Validar cada linha de dados
            const rowErrors = [];
            dataRows.forEach((row, index) => {
                const lineNumber = index + 2; // +2 porque: +1 para index, +1 para header
                const rowValidation = this.validateRow(row, header, lineNumber);
                
                if (!rowValidation.valid) {
                    result.stats.invalidRows++;
                    rowErrors.push(...rowValidation.errors);
                } else {
                    result.stats.validRows++;
                }
            });

            // Limitar erros exibidos (mostrar no máximo 10)
            if (rowErrors.length > 0) {
                result.valid = false;
                if (rowErrors.length > 10) {
                    result.errors.push(...rowErrors.slice(0, 10));
                    result.errors.push(`... e mais ${rowErrors.length - 10} erros`);
                } else {
                    result.errors.push(...rowErrors);
                }
            }

        } catch (error) {
            result.valid = false;
            result.errors.push(`Erro ao processar arquivo: ${error.message}`);
        }

        return result;
    }

    /**
     * Lê o conteúdo do arquivo
     * @param {File} file - Arquivo
     * @returns {Promise<string>} Conteúdo do arquivo
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Erro ao ler arquivo'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    /**
     * Parseia CSV em array de arrays
     * @param {string} content - Conteúdo do CSV
     * @returns {Array<Array<string>>} Linhas do CSV
     */
    parseCSV(content) {
        const lines = content.split(/\r?\n/).filter(line => line.trim());
        return lines.map(line => {
            // Parser simples de CSV (não lida com aspas complexas)
            return line.split(',').map(cell => cell.trim());
        });
    }

    /**
     * Valida o header do CSV
     * @param {Array<string>} header - Header do CSV
     * @returns {Object} Resultado da validação
     */
    validateHeader(header) {
        const result = { valid: true, errors: [] };
        
        // Normalizar header (lowercase, sem espaços)
        const normalizedHeader = header.map(col => col.toLowerCase().trim());
        
        // Verificar colunas obrigatórias
        const missingColumns = this.requiredColumns.filter(
            col => !normalizedHeader.includes(col)
        );
        
        if (missingColumns.length > 0) {
            result.valid = false;
            result.errors.push(`Colunas obrigatórias faltando: ${missingColumns.join(', ')}`);
        }
        
        return result;
    }

    /**
     * Valida uma linha de dados
     * @param {Array<string>} row - Linha de dados
     * @param {Array<string>} header - Header do CSV
     * @param {number} lineNumber - Número da linha
     * @returns {Object} Resultado da validação
     */
    validateRow(row, header, lineNumber) {
        const result = { valid: true, errors: [] };
        
        // Criar objeto com dados da linha
        const data = {};
        header.forEach((col, index) => {
            data[col.toLowerCase().trim()] = row[index] || '';
        });
        
        // Validar cada campo
        const validations = [
            this.validateCPF(data.cpf, lineNumber),
            this.validateNome(data.nome, lineNumber),
            this.validateRendaMensal(data.renda_mensal, lineNumber),
            this.validateIdade(data.idade, lineNumber),
            this.validateScoreBureau(data.score_bureau, lineNumber),
            this.validateHistoricoPagamentos(data.historico_pagamentos, lineNumber),
            this.validateDividaTotal(data.divida_total, lineNumber),
            this.validateTempoEmprego(data.tempo_emprego_meses, lineNumber)
        ];
        
        validations.forEach(validation => {
            if (!validation.valid) {
                result.valid = false;
                result.errors.push(...validation.errors);
            }
        });
        
        return result;
    }

    /**
     * Valida CPF
     */
    validateCPF(cpf, lineNumber) {
        const result = { valid: true, errors: [] };
        
        if (!cpf || cpf.trim() === '') {
            result.valid = false;
            result.errors.push(`Linha ${lineNumber}: CPF não pode estar vazio`);
            return result;
        }
        
        // Remover caracteres não numéricos
        const cleanCPF = cpf.replace(/\D/g, '');
        
        if (cleanCPF.length !== 11) {
            result.valid = false;
            result.errors.push(`Linha ${lineNumber}: CPF deve ter 11 dígitos (encontrado: ${cleanCPF.length})`);
            return result;
        }
        
        // Verificar se não é sequência
        if (/^(\d)\1{10}$/.test(cleanCPF)) {
            result.valid = false;
            result.errors.push(`Linha ${lineNumber}: CPF inválido (sequência de números iguais)`);
            return result;
        }
        
        return result;
    }

    /**
     * Valida Nome
     */
    validateNome(nome, lineNumber) {
        const result = { valid: true, errors: [] };
        
        if (!nome || nome.trim() === '') {
            result.valid = false;
            result.errors.push(`Linha ${lineNumber}: Nome não pode estar vazio`);
        }
        
        return result;
    }

    /**
     * Valida Renda Mensal
     */
    validateRendaMensal(renda, lineNumber) {
        const result = { valid: true, errors: [] };
        
        if (!renda || renda.trim() === '') {
            result.valid = false;
            result.errors.push(`Linha ${lineNumber}: Renda mensal não pode estar vazia`);
            return result;
        }
        
        const rendaNum = parseFloat(renda);
        
        if (isNaN(rendaNum)) {
            result.valid = false;
            result.errors.push(`Linha ${lineNumber}: Renda mensal deve ser um número (ex: 5000.00)`);
            return result;
        }
        
        if (rendaNum <= 0) {
            result.valid = false;
            result.errors.push(`Linha ${lineNumber}: Renda mensal deve ser maior que zero`);
        }
        
        return result;
    }

    /**
     * Valida Idade
     */
    validateIdade(idade, lineNumber) {
        const result = { valid: true, errors: [] };
        
        if (!idade || idade.trim() === '') {
            result.valid = false;
            result.errors.push(`Linha ${lineNumber}: Idade não pode estar vazia`);
            return result;
        }
        
        const idadeNum = parseInt(idade);
        
        if (isNaN(idadeNum)) {
            result.valid = false;
            result.errors.push(`Linha ${lineNumber}: Idade deve ser um número inteiro`);
            return result;
        }
        
        if (idadeNum < 18 || idadeNum > 100) {
            result.valid = false;
            result.errors.push(`Linha ${lineNumber}: Idade deve estar entre 18 e 100 anos (encontrado: ${idadeNum})`);
        }
        
        return result;
    }

    /**
     * Valida Score Bureau
     */
    validateScoreBureau(score, lineNumber) {
        const result = { valid: true, errors: [] };
        
        if (!score || score.trim() === '') {
            result.valid = false;
            result.errors.push(`Linha ${lineNumber}: Score bureau não pode estar vazio`);
            return result;
        }
        
        const scoreNum = parseInt(score);
        
        if (isNaN(scoreNum)) {
            result.valid = false;
            result.errors.push(`Linha ${lineNumber}: Score bureau deve ser um número inteiro`);
            return result;
        }
        
        if (scoreNum < 300 || scoreNum > 850) {
            result.valid = false;
            result.errors.push(`Linha ${lineNumber}: Score bureau deve estar entre 300 e 850 (encontrado: ${scoreNum})`);
        }
        
        return result;
    }

    /**
     * Valida Histórico de Pagamentos
     */
    validateHistoricoPagamentos(historico, lineNumber) {
        const result = { valid: true, errors: [] };
        
        if (!historico || historico.trim() === '') {
            result.valid = false;
            result.errors.push(`Linha ${lineNumber}: Histórico de pagamentos não pode estar vazio`);
            return result;
        }
        
        const historicoLower = historico.toLowerCase().trim();
        
        if (!this.historicoValidos.includes(historicoLower)) {
            result.valid = false;
            result.errors.push(`Linha ${lineNumber}: Histórico de pagamentos inválido. Valores permitidos: ${this.historicoValidos.join(', ')}`);
        }
        
        return result;
    }

    /**
     * Valida Dívida Total
     */
    validateDividaTotal(divida, lineNumber) {
        const result = { valid: true, errors: [] };
        
        if (!divida || divida.trim() === '') {
            result.valid = false;
            result.errors.push(`Linha ${lineNumber}: Dívida total não pode estar vazia`);
            return result;
        }
        
        const dividaNum = parseFloat(divida);
        
        if (isNaN(dividaNum)) {
            result.valid = false;
            result.errors.push(`Linha ${lineNumber}: Dívida total deve ser um número (ex: 15000.00)`);
            return result;
        }
        
        if (dividaNum < 0) {
            result.valid = false;
            result.errors.push(`Linha ${lineNumber}: Dívida total não pode ser negativa`);
        }
        
        return result;
    }

    /**
     * Valida Tempo de Emprego
     */
    validateTempoEmprego(tempo, lineNumber) {
        const result = { valid: true, errors: [] };
        
        if (!tempo || tempo.trim() === '') {
            result.valid = false;
            result.errors.push(`Linha ${lineNumber}: Tempo de emprego não pode estar vazio`);
            return result;
        }
        
        const tempoNum = parseInt(tempo);
        
        if (isNaN(tempoNum)) {
            result.valid = false;
            result.errors.push(`Linha ${lineNumber}: Tempo de emprego deve ser um número inteiro (meses)`);
            return result;
        }
        
        if (tempoNum < 0) {
            result.valid = false;
            result.errors.push(`Linha ${lineNumber}: Tempo de emprego não pode ser negativo`);
        }
        
        return result;
    }

    /**
     * Formata tamanho de arquivo
     */
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
}

// Exportar para uso global
window.CSVValidator = CSVValidator;
