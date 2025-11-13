import { drizzle } from "drizzle-orm/mysql2";
import { 
  batchJobs, 
  customerData, 
  customerScores,
  modelVersions,
  modelDeployments,
  driftMonitoring,
  bureauCache,
  tenantBureauConfig,
  sustentationPlans,
  sustentationTickets
} from "./drizzle/schema.ts";
import { randomUUID } from "crypto";

const db = drizzle(process.env.DATABASE_URL);

// Função auxiliar para gerar CPF válido
function generateCPF() {
  const n = () => Math.floor(Math.random() * 9);
  const cpf = [n(),n(),n(),n(),n(),n(),n(),n(),n()];
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += cpf[i] * (10 - i);
  }
  cpf[9] = (sum * 10) % 11;
  if (cpf[9] === 10) cpf[9] = 0;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += cpf[i] * (11 - i);
  }
  cpf[10] = (sum * 10) % 11;
  if (cpf[10] === 10) cpf[10] = 0;
  
  return cpf.join('');
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateName() {
  const firstNames = ['João', 'Maria', 'José', 'Ana', 'Pedro', 'Carla', 'Lucas', 'Juliana', 'Rafael', 'Fernanda', 'Carlos', 'Beatriz', 'Felipe', 'Camila', 'Bruno'];
  const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Costa', 'Ferreira', 'Rodrigues', 'Almeida', 'Nascimento', 'Pereira', 'Carvalho', 'Ribeiro', 'Martins', 'Araújo'];
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

async function seed() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  try {
    // 1. BATCH JOBS
    console.log('📦 Criando batch jobs...');
    const jobIds = [];
    const statuses = ['completed', 'completed', 'completed', 'completed', 'processing', 'failed', 'completed', 'completed'];
    
    for (let i = 0; i < 8; i++) {
      const createdAt = randomDate(new Date(2024, 9, 1), new Date());
      const totalRows = Math.floor(Math.random() * 500) + 100;
      const processedRows = statuses[i] === 'completed' ? Math.floor(totalRows * 0.9) : 0;
      
      const result = await db.insert(batchJobs).values({
        jobId: randomUUID(),
        tenantId: 1,
        fileName: `upload_${i + 1}_${createdAt.toISOString().split('T')[0]}.csv`,
        fileSize: Math.floor(Math.random() * 5000000) + 100000,
        totalRows,
        processedRows,
        status: statuses[i],
        errorMessage: statuses[i] === 'failed' ? 'Erro ao processar arquivo: formato inválido' : null,
        queuedAt: createdAt,
        startedAt: statuses[i] !== 'queued' ? randomDate(createdAt, new Date()) : null,
        completedAt: statuses[i] === 'completed' ? randomDate(createdAt, new Date()) : null,
        createdAt,
      });
      jobIds.push(result[0].insertId);
    }
    console.log(`✅ ${jobIds.length} batch jobs criados\n`);

    // 2. CUSTOMER DATA & SCORES
    console.log('👥 Criando customer data e scores...');
    const products = ['CARTAO', 'CARNE', 'EMPRESTIMO_PESSOAL'];
    let totalCustomers = 0;

    for (const jobId of jobIds.slice(0, 6)) {
      const numCustomers = Math.floor(Math.random() * 40) + 20;
      
      for (let i = 0; i < numCustomers; i++) {
        const cpf = generateCPF();
        const nome = generateName();
        const produto = products[Math.floor(Math.random() * products.length)];
        const createdAt = randomDate(new Date(2024, 0, 1), new Date());
        
        // Customer Data
        await db.insert(customerData).values({
          tenantId: 1,
          batchJobId: Number(jobId),
          cpf,
          nome,
          email: `${nome.toLowerCase().replace(' ', '.')}@email.com`,
          telefone: `11${Math.floor(Math.random() * 900000000) + 100000000}`,
          dataNascimento: randomDate(new Date(1960, 0, 1), new Date(2000, 0, 1)).toISOString().split('T')[0],
          renda: String(Math.floor(Math.random() * 10000) + 2000),
          produto,
          dataCompra: randomDate(new Date(2023, 0, 1), new Date()).toISOString().split('T')[0],
          valorCompra: String(Math.floor(Math.random() * 5000) + 500),
          dataPagamento: Math.random() > 0.2 ? randomDate(new Date(2023, 0, 1), new Date()).toISOString().split('T')[0] : null,
          statusPagamento: Math.random() > 0.2 ? 'pago' : 'pendente',
          diasAtraso: Math.random() > 0.8 ? Math.floor(Math.random() * 60) : 0,
          rawData: JSON.stringify({ source: 'seed', version: '1.0' }),
          createdAt,
        });

        // Customer Score
        const scoreInterno = (Math.random() * 0.9 + 0.1).toFixed(4);
        const scoreSerasa = Math.random() > 0.3 ? Math.floor(Math.random() * 1000) : null;
        const faixas = ['A', 'B', 'C', 'D', 'E'];
        const faixaScore = faixas[Math.floor(Math.random() * faixas.length)];

        await db.insert(customerScores).values({
          tenantId: 1,
          batchJobId: Number(jobId),
          cpf,
          nome,
          produto,
          scoreProbInadimplencia: scoreInterno,
          faixaScore,
          motivoExclusao: Math.random() > 0.9 ? 'Histórico insuficiente' : null,
          mesesHistorico: Math.floor(Math.random() * 24) + 3,
          ultimoMovimento: `${Math.floor(Math.random() * 12)} meses`,
          scoreInterno,
          scoreSerasa,
          pendencias: scoreSerasa && Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0,
          protestos: scoreSerasa && Math.random() > 0.9 ? Math.floor(Math.random() * 2) : 0,
          bureauSource: scoreSerasa ? (Math.random() > 0.5 ? 'serasa' : 'boavista') : null,
          dataProcessamento: createdAt,
        });

        totalCustomers++;
      }
    }
    console.log(`✅ ${totalCustomers} clientes e scores criados\n`);

    // 3. MODEL VERSIONS
    console.log('🤖 Criando versões de modelos ML...');
    const modelNames = ['fa_8', 'fa_11', 'fa_12', 'fa_15'];
    const modelVersionIds = [];

    for (let i = 0; i < 6; i++) {
      const modelName = modelNames[i % 4];
      const version = `v1.${i}`;
      const createdAt = randomDate(new Date(2024, 6, 1), new Date());
      
      const result = await db.insert(modelVersions).values({
        tenantId: 1,
        modelName,
        version,
        product: products[i % 3],
        filePath: `/models/${modelName}_${version}.pkl`,
        fileSize: Math.floor(Math.random() * 50000000) + 10000000,
        metrics: JSON.stringify({
          accuracy: (0.85 + Math.random() * 0.1).toFixed(4),
          precision: (0.82 + Math.random() * 0.12).toFixed(4),
          recall: (0.80 + Math.random() * 0.15).toFixed(4),
          f1Score: (0.83 + Math.random() * 0.1).toFixed(4),
          auc: (0.88 + Math.random() * 0.1).toFixed(4)
        }),
        status: i < 3 ? 'production' : 'validated',
        uploadedBy: 1,
        promotedBy: i < 3 ? 1 : null,
        promotedAt: i < 3 ? createdAt : null,
        createdAt,
      });
      modelVersionIds.push(result[0].insertId);
    }
    console.log(`✅ ${modelVersionIds.length} versões de modelos criadas\n`);

    // 4. MODEL DEPLOYMENTS
    console.log('🚀 Criando histórico de deployments...');
    for (let i = 0; i < 3; i++) {
      await db.insert(modelDeployments).values({
        modelVersionId: modelVersionIds[i],
        tenantId: 1,
        product: products[i],
        reason: 'Deploy inicial de modelo em produção',
        deployedBy: 1,
        deployedAt: randomDate(new Date(2024, 7, 1), new Date()),
      });
    }
    console.log(`✅ 3 deployments registrados\n`);

    // 5. DRIFT MONITORING
    console.log('📊 Criando histórico de drift monitoring...');
    for (let i = 0; i < 10; i++) {
      const psi = (Math.random() * 0.25).toFixed(4);
      const status = parseFloat(psi) < 0.1 ? 'stable' : parseFloat(psi) < 0.2 ? 'warning' : 'critical';
      
      await db.insert(driftMonitoring).values({
        tenantId: 1,
        product: products[i % 3],
        modelVersionId: modelVersionIds[i % 3],
        psi,
        featureDrift: JSON.stringify({ feature_1: 0.05, feature_3: 0.12, feature_7: 0.08 }),
        performanceDrift: JSON.stringify({ accuracy: -0.02, precision: -0.01 }),
        status,
        alertSent: status !== 'stable',
        checkedAt: randomDate(new Date(2024, 8, 1), new Date()),
      });
    }
    console.log(`✅ 10 detecções de drift criadas\n`);

    // 6. BUREAU CONFIG & CACHE
    console.log('🏦 Configurando bureau de crédito...');
    await db.insert(tenantBureauConfig).values({
      tenantId: 1,
      bureauEnabled: true,
      bureauProvider: 'apibrasil',
      lastUpdated: new Date(),
    });

    for (let i = 0; i < 30; i++) {
      await db.insert(bureauCache).values({
        tenantId: 1,
        cpf: generateCPF(),
        scoreSerasa: Math.floor(Math.random() * 1000),
        pendencias: Math.floor(Math.random() * 3),
        protestos: Math.floor(Math.random() * 2),
        valorDivida: String((Math.random() * 50000).toFixed(2)),
        cadastroPositivo: Math.random() > 0.5,
        source: Math.random() > 0.5 ? 'serasa' : 'boavista',
        cachedAt: randomDate(new Date(2024, 10, 1), new Date()),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    }
    console.log(`✅ Bureau configurado e 30 consultas em cache\n`);

    // 7. SUSTENTATION PLANS & TICKETS
    console.log('🎫 Criando planos de sustentação e tickets...');
    const planResult = await db.insert(sustentationPlans).values({
      tenantId: 1,
      planType: 'premium',
      monthlyPrice: '7500.00',
      includedRetrainings: 3,
      responseTimeSLA: 24,
      status: 'active',
      subscribedAt: new Date(2024, 0, 1),
    });

    const ticketStatuses = ['pending', 'analyzing', 'retraining', 'completed', 'completed'];
    const ticketTypes = ['drift_alert', 'manual_request', 'scheduled'];
    
    for (let i = 0; i < 5; i++) {
      await db.insert(sustentationTickets).values({
        tenantId: 1,
        planId: planResult[0].insertId,
        product: products[i % 3],
        driftMonitoringId: i < 3 ? i + 1 : null,
        type: ticketTypes[i % 3],
        status: ticketStatuses[i],
        priority: i === 0 ? 'critical' : (i < 3 ? 'high' : 'medium'),
        description: `Ticket de sustentação #${i + 1}: ${ticketTypes[i % 3]}`,
        assignedTo: i > 0 ? 1 : null,
        resolution: i > 2 ? 'Modelo retreinado e deployado com sucesso' : null,
        newModelVersionId: i > 2 ? modelVersionIds[i % 3] : null,
        createdAt: randomDate(new Date(2024, 9, 1), new Date()),
        completedAt: i > 2 ? new Date() : null,
      });
    }
    console.log(`✅ 1 plano ativo e 5 tickets criados\n`);

    console.log('✨ Seed concluído com sucesso!\n');
    console.log('📊 Resumo:');
    console.log(`   - ${jobIds.length} batch jobs`);
    console.log(`   - ${totalCustomers} clientes e scores`);
    console.log(`   - ${modelVersionIds.length} versões de modelos`);
    console.log(`   - 3 deployments`);
    console.log(`   - 10 detecções de drift`);
    console.log(`   - 30 consultas de bureau em cache`);
    console.log(`   - 1 plano de sustentação ativo`);
    console.log(`   - 5 tickets de suporte`);
    console.log('\n🎉 Aplicação pronta para testes!\n');

  } catch (error) {
    console.error('❌ Erro ao executar seed:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }

  process.exit(0);
}

seed();
