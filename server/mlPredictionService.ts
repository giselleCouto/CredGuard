/**
 * ML Prediction Service
 * Wrapper TypeScript para chamar o serviço Python de predição
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Caminho para o serviço Python
const ML_SERVICE_PATH = path.join(__dirname, '../ml_models/ml_service.py');

export interface CustomerData {
  cpf: string;
  nome: string;
  produto: 'CARTAO' | 'CARNE' | 'EMPRESTIMO_PESSOAL';
  data_primeira_compra: string | Date;
  data_ultima_compra: string | Date;
  total_compras: number;
  valor_total_compras: number;
  total_pagamentos_em_dia: number;
  total_atrasos: number;
  maior_atraso: number;
}

export interface PredictionResult {
  score_prob_inadimplencia: number;
  faixa_score: 'BAIXO' | 'MÉDIO' | 'ALTO' | 'CRÍTICO';
  modelo_utilizado: string;
  features_extraidas?: Record<string, any>;
  erro?: string;
  cpf?: string;
  nome?: string;
  produto?: string;
}

/**
 * Faz predição de score para um único cliente
 */
export async function predictScore(customerData: CustomerData): Promise<PredictionResult> {
  try {
    // Converter datas para string se necessário
    const data = {
      ...customerData,
      data_primeira_compra: customerData.data_primeira_compra instanceof Date
        ? customerData.data_primeira_compra.toISOString().split('T')[0]
        : customerData.data_primeira_compra,
      data_ultima_compra: customerData.data_ultima_compra instanceof Date
        ? customerData.data_ultima_compra.toISOString().split('T')[0]
        : customerData.data_ultima_compra,
    };

    // Escapar aspas no JSON
    const input = JSON.stringify(data).replace(/'/g, "\\'");
    
    // Executar serviço Python
    const command = `python3 ${ML_SERVICE_PATH} '${input}'`;
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      timeout: 30000, // 30s timeout
    });

    // Log de stderr (não é erro, apenas logs do Python)
    if (stderr) {
      console.log('[ML Service]', stderr);
    }

    // Parse resultado
    const result = JSON.parse(stdout);
    return result;

  } catch (error: any) {
    console.error('[ML Service] Erro na predição:', error.message);
    
    // Retornar score neutro em caso de erro
    return {
      score_prob_inadimplencia: 0.5,
      faixa_score: 'MÉDIO',
      modelo_utilizado: 'fallback',
      erro: error.message,
      cpf: customerData.cpf,
      nome: customerData.nome,
      produto: customerData.produto,
    };
  }
}

/**
 * Faz predição de scores para múltiplos clientes em lote
 */
export async function predictScoreBatch(customers: CustomerData[]): Promise<PredictionResult[]> {
  try {
    // Converter datas para string
    const data = customers.map(customer => ({
      ...customer,
      data_primeira_compra: customer.data_primeira_compra instanceof Date
        ? customer.data_primeira_compra.toISOString().split('T')[0]
        : customer.data_primeira_compra,
      data_ultima_compra: customer.data_ultima_compra instanceof Date
        ? customer.data_ultima_compra.toISOString().split('T')[0]
        : customer.data_ultima_compra,
    }));

    // Escapar aspas no JSON
    const input = JSON.stringify(data).replace(/'/g, "\\'");
    
    // Executar serviço Python
    const command = `python3 ${ML_SERVICE_PATH} '${input}'`;
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer para batch
      timeout: 120000, // 2min timeout para batch
    });

    // Log de stderr
    if (stderr) {
      console.log('[ML Service Batch]', stderr);
    }

    // Parse resultado
    const results = JSON.parse(stdout);
    return results;

  } catch (error: any) {
    console.error('[ML Service Batch] Erro na predição em lote:', error.message);
    
    // Retornar scores neutros para todos os clientes
    return customers.map(customer => ({
      score_prob_inadimplencia: 0.5,
      faixa_score: 'MÉDIO' as const,
      modelo_utilizado: 'fallback',
      erro: error.message,
      cpf: customer.cpf,
      nome: customer.nome,
      produto: customer.produto,
    }));
  }
}

/**
 * Testa se o serviço ML está funcionando
 */
export async function testMLService(): Promise<boolean> {
  try {
    const testData: CustomerData = {
      cpf: '123.456.789-00',
      nome: 'Teste',
      produto: 'CARTAO',
      data_primeira_compra: '2023-01-01',
      data_ultima_compra: '2024-01-01',
      total_compras: 10,
      valor_total_compras: 1000,
      total_pagamentos_em_dia: 8,
      total_atrasos: 2,
      maior_atraso: 15,
    };

    const result = await predictScore(testData);
    return !result.erro;

  } catch (error) {
    console.error('[ML Service] Teste falhou:', error);
    return false;
  }
}
