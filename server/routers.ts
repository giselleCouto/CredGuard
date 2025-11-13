import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { getDb } from "./db";
import { users, predictions, batchJobs, customerData, customerScores, bureauCache } from "../drizzle/schema";
import { eq, desc, sql, and, gt } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Tenants router
  tenants: router({
    list: publicProcedure.query(async () => {
      return await db.getAllTenants();
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getTenantById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        email: z.string().email(),
        plan: z.enum(["basic", "professional", "enterprise"]).default("basic"),
      }))
      .mutation(async ({ input }) => {
        return await db.createTenant({
          name: input.name,
          slug: input.slug,
          email: input.email,
          plan: input.plan,
          isActive: true,
        });
      }),
  }),

  // Routers antigos removidos (models, predictions, drift) - agora usamos os novos
  
  // Predictions router (manter temporariamente para compatibilidade)
  predictions: router({
    list: publicProcedure.query(async () => {
      return [];
    }),
    
    history: publicProcedure
      .input(z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        tenantId: z.number().optional(),
        creditType: z.enum(["CARTAO", "EMPRESTIMO_PESSOAL", "CARNE", "FINANCIAMENTO"]).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const { page, pageSize, tenantId, creditType, startDate, endDate } = input;
        const offset = (page - 1) * pageSize;
        
        // Buscar todas as predições e aplicar filtros
        let allPredictions = await db.getAllPredictions();
        
        // Filtrar por tenant
        if (tenantId) {
          allPredictions = allPredictions.filter((p) => p.tenantId === tenantId);
        }
        
        // Filtrar por tipo de crédito
        if (creditType) {
          allPredictions = allPredictions.filter((p) => p.creditType === creditType);
        }
        
        // Filtrar por data
        if (startDate) {
          const start = new Date(startDate);
          allPredictions = allPredictions.filter((p) => new Date(p.createdAt) >= start);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          allPredictions = allPredictions.filter((p) => new Date(p.createdAt) <= end);
        }
        
        const total = allPredictions.length;
        const totalPages = Math.ceil(total / pageSize);
        const predictions = allPredictions.slice(offset, offset + pageSize);
        
        return {
          predictions,
          pagination: {
            page,
            pageSize,
            total,
            totalPages,
          },
        };
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const predictions = await db.getAllPredictions();
        const prediction = predictions.find((p) => p.id === input.id);
        if (!prediction) {
          throw new Error("Predi\u00e7\u00e3o n\u00e3o encontrada");
        }
        return prediction;
      }),
    
    listByTenant: publicProcedure
      .input(z.object({ tenantId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPredictionsByTenant(input.tenantId);
      }),
    
    create: publicProcedure
      .input(z.object({
        tenantId: z.number(),
        creditType: z.enum(["CARTAO", "EMPRESTIMO_PESSOAL", "CARNE", "FINANCIAMENTO"]),
        data: z.record(z.string(), z.any()),
      }))
      .mutation(async ({ input }) => {
        // Simular predição (em produção, aqui seria chamado o modelo ML)
        const riskClasses = ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9", "R10"];
        const randomRisk = riskClasses[Math.floor(Math.random() * riskClasses.length)];
        const randomProb = Math.floor(Math.random() * 10000); // 0-10000 (0.0000-1.0000)
        const randomLimit = Math.floor(Math.random() * 50000) + 5000;
        
        // Buscar modelo de produção para este tenant e tipo de crédito
        const models = await db.getModelsByTenant(input.tenantId);
        const productionModel = models.find(
          (m) => m.creditType === input.creditType && m.status === "production"
        );
        
        const predictionId = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return await db.createPrediction({
          predictionId,
          tenantId: input.tenantId,
          modelId: productionModel?.id || 0,
          creditType: input.creditType,
          riskClass: randomRisk,
          probability: randomProb,
          recommendedLimit: randomLimit,
          inputData: JSON.stringify(input.data),
        });
      }),
  }),

  // Drift router antigo removido - usar novo abaixo

  // Dashboard statistics
  dashboard: router({
    stats: publicProcedure.query(async () => {
      const tenants = await db.getAllTenants();
      const models = await db.getAllModels();
      const predictions = await db.getAllPredictions();
      const driftMetrics = await db.getAllDriftMetrics();
      
      const activeTenants = tenants.filter((t) => t.isActive).length;
      const productionModels = models.filter((m) => m.status === "production").length;
      
      // Calcular acurácia média
      const avgAccuracy = models.length > 0
        ? models.reduce((sum, m) => sum + m.accuracy, 0) / models.length / 100
        : 0;
      
      // Contar modelos com drift crítico
      const latestMetrics = new Map<number, typeof driftMetrics[0]>();
      driftMetrics.forEach(metric => {
        const existing = latestMetrics.get(metric.modelId);
        if (!existing || new Date(metric.checkedAt) > new Date(existing.checkedAt)) {
          latestMetrics.set(metric.modelId, metric);
        }
      });
      
      const criticalDriftCount = Array.from(latestMetrics.values())
        .filter((m) => m.status === "CRITICAL").length;
      
      return {
        totalTenants: tenants.length,
        activeTenants,
        totalModels: models.length,
        productionModels,
        totalPredictions: predictions.length,
        averageAccuracy: avgAccuracy,
        criticalDriftModels: criticalDriftCount,
      };
    }),
  }),
  
  // Profile router
  batch: router({
    // Upload de arquivo CSV/Excel
    upload: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileSize: z.number(),
        fileData: z.string(), // Base64 encoded CSV content
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        
        // Gerar job_id único
        const now = new Date();
        const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
        const randomId = Math.random().toString(36).substring(2, 8);
        const jobId = `batch_${timestamp}_${randomId}`;
        
        // Criar job no banco
        await database.insert(batchJobs).values({
          jobId,
          tenantId: ctx.user.tenantId,
          fileName: input.fileName,
          fileSize: input.fileSize,
          status: 'queued',
        });
        
        // Processar CSV (simulação síncrona - em produção usar Celery)
        try {
          // Decodificar base64 e parsear CSV
          const csvContent = Buffer.from(input.fileData, 'base64').toString('utf-8');
          const lines = csvContent.split('\n').filter(l => l.trim());
          const headers = lines[0].split(',').map(h => h.trim());
          
          const totalRows = lines.length - 1;
          await database.update(batchJobs)
            .set({ totalRows, status: 'processing', startedAt: new Date() })
            .where(eq(batchJobs.jobId, jobId));
          
          const jobRecord = await database.select().from(batchJobs).where(eq(batchJobs.jobId, jobId)).limit(1);
          const batchJobId = jobRecord[0].id;
          
          // Processar cada linha
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const row: any = {};
            headers.forEach((h, idx) => { row[h] = values[idx]; });
            
            // Salvar dados raw
            await database.insert(customerData).values({
              tenantId: ctx.user.tenantId,
              batchJobId,
              cpf: row.cpf || '',
              nome: row.nome || '',
              email: row.email,
              telefone: row.telefone,
              dataNascimento: row.data_nascimento,
              renda: row.renda,
              produto: row.produto as any,
              dataCompra: row.data_compra,
              valorCompra: row.valor_compra,
              dataPagamento: row.data_pagamento,
              statusPagamento: row.status_pagamento,
              diasAtraso: row.dias_atraso ? parseInt(row.dias_atraso) : null,
              rawData: JSON.stringify(row),
            });
            
            // Aplicar regras de negócio
            let motivoExclusao = null;
            let scoreProbInadimplencia = null;
            let faixaScore = null;
            let scoreInternoStr = null;
            let scoreSerasa = null;
            let pendencias = null;
            let protestos = null;
            let bureauSource = 'disabled';
            
            // Calcular meses de histórico
            const dataCompra = new Date(row.data_compra);
            const hoje = new Date();
            const mesesHistorico = Math.floor((hoje.getTime() - dataCompra.getTime()) / (1000 * 60 * 60 * 24 * 30));
            
            // Calcular último movimento
            const ultimoMovimento = row.data_pagamento ? new Date(row.data_pagamento) : dataCompra;
            const mesesSemMovimento = Math.floor((hoje.getTime() - ultimoMovimento.getTime()) / (1000 * 60 * 60 * 24 * 30));
            
            // Regra 1: Menos de 3 meses de histórico
            if (mesesHistorico < 3) {
              motivoExclusao = 'menos_3_meses';
            }
            // Regra 2: Inativo há mais de 8 meses
            else if (mesesSemMovimento > 8) {
              motivoExclusao = 'inativo_8_meses';
            }
            // Gerar score usando modelo ML real
            else {
              // Importar serviço ML
              const { predictScore } = await import("./mlPredictionService");
              
              // Preparar dados do cliente para predição
              const customerMLData = {
                cpf: row.cpf || '',
                nome: row.nome || '',
                produto: row.produto as any,
                data_primeira_compra: row.data_compra,
                data_ultima_compra: row.data_pagamento || row.data_compra,
                total_compras: 1, // Simplificação - em produção, agregar dados históricos
                valor_total_compras: parseFloat(row.valor_compra || '0'),
                total_pagamentos_em_dia: row.status_pagamento === 'pago' ? 1 : 0,
                total_atrasos: parseInt(row.dias_atraso || '0') > 0 ? 1 : 0,
                maior_atraso: parseInt(row.dias_atraso || '0'),
              };
              
              // Fazer predição com modelo ML real
              const mlResult = await predictScore(customerMLData);
              const scoreInterno = mlResult.score_prob_inadimplencia;
              
              // Enriquecimento com bureau (se habilitado)
              const { enrichWithBureau, calculateHybridScore, isBureauEnabled } = await import("./bureauService");
              const bureauEnabled = await isBureauEnabled(1); // TODO: usar ctx.user.tenantId
              
              let bureauData: any = { source: 'disabled' };
              let scoreFinal = scoreInterno;
              
              if (bureauEnabled && row.cpf) {
                const apiToken = process.env.APIBRASIL_TOKEN;
                bureauData = await enrichWithBureau(1, row.cpf, apiToken);
                scoreFinal = calculateHybridScore(scoreInterno, bureauData);
              }
              
              scoreProbInadimplencia = scoreFinal.toFixed(4);
              
              // Mapear para faixa
              const score = scoreFinal;
              if (score <= 0.2) faixaScore = 'A';
              else if (score <= 0.4) faixaScore = 'B';
              else if (score <= 0.6) faixaScore = 'C';
              else if (score <= 0.8) faixaScore = 'D';
              else faixaScore = 'E';
              
              // Preparar dados de bureau para salvar
              scoreInternoStr = scoreInterno.toFixed(4);
              scoreSerasa = bureauData.scoreSerasa || null;
              pendencias = bureauData.pendencias || null;
              protestos = bureauData.protestos || null;
              bureauSource = bureauData.source || 'disabled';
            }
            
            // Salvar score
            await database.insert(customerScores).values({
              tenantId: ctx.user.tenantId,
              batchJobId,
              cpf: row.cpf || '',
              nome: row.nome || '',
              produto: row.produto as any,
              scoreProbInadimplencia,
              faixaScore: faixaScore as any,
              motivoExclusao,
              mesesHistorico,
              ultimoMovimento: ultimoMovimento.toISOString().split('T')[0],
              // Campos de bureau
              scoreInterno: motivoExclusao ? null : scoreInternoStr,
              scoreSerasa: motivoExclusao ? null : scoreSerasa,
              pendencias: motivoExclusao ? null : pendencias,
              protestos: motivoExclusao ? null : protestos,
              bureauSource: motivoExclusao ? null : bureauSource,
            });
          }
          
          // Marcar como concluído
          await database.update(batchJobs)
            .set({ 
              status: 'completed', 
              processedRows: totalRows,
              completedAt: new Date() 
            })
            .where(eq(batchJobs.jobId, jobId));
          
          return {
            jobId,
            status: 'completed',
            queuedAt: now.toISOString(),
            totalRows,
          };
        } catch (error: any) {
          // Marcar como falho
          await database.update(batchJobs)
            .set({ 
              status: 'failed', 
              errorMessage: error.message,
              completedAt: new Date() 
            })
            .where(eq(batchJobs.jobId, jobId));
          
          throw new TRPCError({ 
            code: 'INTERNAL_SERVER_ERROR', 
            message: `Processing failed: ${error.message}` 
          });
        }
      }),
    
    // Consultar status do job
    getJob: protectedProcedure
      .input(z.object({ jobId: z.string() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        
        const jobs = await database.select().from(batchJobs).where(eq(batchJobs.jobId, input.jobId)).limit(1);
        
        if (jobs.length === 0) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
        }
        
        return jobs[0];
      }),
    
    // Listar jobs do tenant
    listJobs: protectedProcedure
      .input(z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        
        const jobs = await database
          .select()
          .from(batchJobs)
          .where(eq(batchJobs.tenantId, ctx.user.tenantId))
          .orderBy(desc(batchJobs.createdAt))
          .limit(input.limit)
          .offset(input.offset);
        
        return jobs;
      }),
    
    // Baixar CSV de resultados
    downloadCsv: protectedProcedure
      .input(z.object({ jobId: z.string() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        
        // Buscar scores do job
        const job = await database.select().from(batchJobs).where(eq(batchJobs.jobId, input.jobId)).limit(1);
        
        if (job.length === 0 || job[0].status !== 'completed') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Job not completed yet' });
        }
        
        const scores = await database
          .select()
          .from(customerScores)
          .where(eq(customerScores.batchJobId, job[0].id));
        
        // Gerar CSV com campos de bureau
        const csvHeader = 'cpf,nome,produto,score_prob_inadimplencia,faixa_score,motivo_exclusao,score_interno,score_serasa,pendencias,protestos,bureau_source,data_processamento\n';
        const csvRows = scores.map(s => 
          `${s.cpf},${s.nome || ''},${s.produto},${s.scoreProbInadimplencia || ''},${s.faixaScore || ''},${s.motivoExclusao || ''},${s.scoreInterno || ''},${s.scoreSerasa || ''},${s.pendencias || ''},${s.protestos || ''},${s.bureauSource || ''},${s.dataProcessamento?.toISOString().split('T')[0] || ''}`
        ).join('\n');
        
        return {
          csv: csvHeader + csvRows,
          fileName: `scores_${input.jobId}.csv`,
        };
      }),

    // Estatísticas do tenant
    stats: protectedProcedure
      .query(async ({ ctx }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        
        const tenantId = ctx.user.tenantId;
        
        // Total de jobs
        const [totalJobsResult] = await database
          .select({ count: sql<number>`count(*)` })
          .from(batchJobs)
          .where(eq(batchJobs.tenantId, tenantId));
        
        // Jobs completados
        const [completedJobsResult] = await database
          .select({ count: sql<number>`count(*)` })
          .from(batchJobs)
          .where(and(
            eq(batchJobs.tenantId, tenantId),
            eq(batchJobs.status, 'completed')
          ));
        
        // Total de clientes analisados
        const [totalCustomersResult] = await database
          .select({ count: sql<number>`count(*)` })
          .from(customerScores)
          .where(eq(customerScores.tenantId, tenantId));
        
        // Total de scores gerados (sem exclusão)
        const [totalScoresResult] = await database
          .select({ count: sql<number>`count(*)` })
          .from(customerScores)
          .where(and(
            eq(customerScores.tenantId, tenantId),
            sql`${customerScores.motivoExclusao} IS NULL`
          ));
        
        // Clientes excluídos
        const [excludedCustomersResult] = await database
          .select({ count: sql<number>`count(*)` })
          .from(customerScores)
          .where(and(
            eq(customerScores.tenantId, tenantId),
            sql`${customerScores.motivoExclusao} IS NOT NULL`
          ));
        
        return {
          totalJobs: Number(totalJobsResult.count) || 0,
          completedJobs: Number(completedJobsResult.count) || 0,
          totalCustomers: Number(totalCustomersResult.count) || 0,
          totalScores: Number(totalScoresResult.count) || 0,
          excludedCustomers: Number(excludedCustomersResult.count) || 0,
        };
      }),
  }),

  profile: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      
      const user = await database.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (!user[0]) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      
      return user[0];
    }),
    
    update: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        position: z.string().optional(),
        bio: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        
        await database.update(users).set(input).where(eq(users.id, ctx.user.id));
        return { success: true };
      }),
    
    stats: protectedProcedure.query(async () => {
      // Estatísticas simuladas (ajustar quando houver userId em predictions)
      const totalPredictions = 42;
      const avgScore = 5.8;
      const lastPredictionDate = new Date().toISOString();
      
      return {
        totalPredictions,
        avgScore,
        lastPredictionDate,
      };
    }),
    
    myPredictions: protectedProcedure
      .input(z.object({
        limit: z.number().default(10),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        
        // Por enquanto retorna predições gerais (ajustar quando houver userId)
        const items = await database.select().from(predictions)
          .orderBy(desc(predictions.createdAt))
          .limit(input.limit)
          .offset(input.offset);
        
        const total = await database.select({ count: sql<number>`count(*)` }).from(predictions);
        
        return {
          items,
          total: total[0]?.count || 0,
          limit: input.limit,
          offset: input.offset,
        };
      }),
    
    scoreEvolution: protectedProcedure
      .input(z.object({
        days: z.number().default(30),
        creditType: z.enum(['ALL', 'CARTAO', 'EMPRESTIMO_PESSOAL', 'CARNE']).default('ALL'),
      }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        
        // Gerar dados simulados de evolução temporal
        const { days, creditType } = input;
        const today = new Date();
        const evolution = [];
        
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          
          // Simular score variando entre 3 e 8 (ajustado por tipo)
          let baseScore = 5;
          if (creditType === 'CARTAO') baseScore = 6;
          if (creditType === 'EMPRESTIMO_PESSOAL') baseScore = 5.5;
          if (creditType === 'CARNE') baseScore = 4.5;
          
          const score = baseScore + Math.sin(i / 5) * 2 + (Math.random() - 0.5);
          
          evolution.push({
            date: date.toISOString().split('T')[0],
            score: Math.max(1, Math.min(10, parseFloat(score.toFixed(1)))),
          });
        }
        
        return evolution;
      }),
    
    riskDistribution: protectedProcedure
      .input(z.object({
        creditType: z.enum(['ALL', 'CARTAO', 'EMPRESTIMO_PESSOAL', 'CARNE']).default('ALL'),
      }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        
        // Simular distribuição de risco baseada em predições
        const { creditType } = input;
        
        // Ajustar distribuição baseado no tipo de crédito
        let distribution;
        if (creditType === 'CARTAO') {
          distribution = [
            { risk: 'Baixo (R1-R3)', count: 22, color: '#10B981' },
            { risk: 'Médio (R4-R6)', count: 12, color: '#F59E0B' },
            { risk: 'Alto (R7-R10)', count: 8, color: '#DC2626' },
          ];
        } else if (creditType === 'EMPRESTIMO_PESSOAL') {
          distribution = [
            { risk: 'Baixo (R1-R3)', count: 15, color: '#10B981' },
            { risk: 'Médio (R4-R6)', count: 18, color: '#F59E0B' },
            { risk: 'Alto (R7-R10)', count: 9, color: '#DC2626' },
          ];
        } else if (creditType === 'CARNE') {
          distribution = [
            { risk: 'Baixo (R1-R3)', count: 12, color: '#10B981' },
            { risk: 'Médio (R4-R6)', count: 14, color: '#F59E0B' },
            { risk: 'Alto (R7-R10)', count: 16, color: '#DC2626' },
          ];
        } else {
          distribution = [
            { risk: 'Baixo (R1-R3)', count: 18, color: '#10B981' },
            { risk: 'Médio (R4-R6)', count: 15, color: '#F59E0B' },
            { risk: 'Alto (R7-R10)', count: 9, color: '#DC2626' },
          ];
        }
        
        return distribution;
      }),
  }),

  // Bureau configuration router
  bureau: router({
    getConfig: protectedProcedure
      .query(async ({ ctx }) => {
        const { isBureauEnabled } = await import("./bureauService");
        const tenantId = ctx.user.tenantId;
        const enabled = await isBureauEnabled(tenantId);
        return {
          bureauEnabled: enabled,
          provider: "API Brasil (Serasa/Boa Vista)",
          cacheHours: 24,
        };
      }),

    setConfig: protectedProcedure
      .input(z.object({
        bureauEnabled: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { setBureauEnabled } = await import("./bureauService");
        const tenantId = ctx.user.tenantId;
        await setBureauEnabled(tenantId, input.bureauEnabled);
        return {
          success: true,
          bureauEnabled: input.bureauEnabled,
        };
      }),

    // Métricas de uso de bureau
    getMetrics: protectedProcedure
      .query(async ({ ctx }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        
        const tenantId = ctx.user.tenantId;
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        // Total de consultas (cache entries criados nos últimos 30 dias)
        const totalConsultas = await database
          .select({ count: sql<number>`count(*)` })
          .from(bureauCache)
          .where(and(
            eq(bureauCache.tenantId, tenantId),
            gt(bureauCache.cachedAt, thirtyDaysAgo)
          ));
        
        // Cache hits (consultas que usaram cache)
        const cacheHits = await database
          .select({ count: sql<number>`count(*)` })
          .from(bureauCache)
          .where(and(
            eq(bureauCache.tenantId, tenantId),
            gt(bureauCache.cachedAt, thirtyDaysAgo),
            eq(bureauCache.source, 'serasa_apibrasil')
          ));
        
        const total = Number(totalConsultas[0]?.count || 0);
        const hits = Number(cacheHits[0]?.count || 0);
        const cacheHitRate = total > 0 ? (hits / total) * 100 : 0;
        
        // Custo estimado (R$ 99/mês se bureau ativado)
        const { isBureauEnabled } = await import("./bureauService");
        const bureauEnabled = await isBureauEnabled(tenantId);
        const custoMensal = bureauEnabled ? 99 : 0;
        
        return {
          totalConsultas: total,
          cacheHits: hits,
          cacheMisses: total - hits,
          cacheHitRate: cacheHitRate.toFixed(1),
          custoMensal,
          periodo: '30 dias',
        };
      }),

    // Distribuição de scores (interno vs híbrido)
    getScoreDistribution: protectedProcedure
      .query(async ({ ctx }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        
        const tenantId = ctx.user.tenantId;
        
        // Buscar scores dos últimos 30 dias
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const scores = await database
          .select({
            scoreInterno: customerScores.scoreInterno,
            scoreFinal: customerScores.scoreProbInadimplencia,
            bureauSource: customerScores.bureauSource,
          })
          .from(customerScores)
          .where(and(
            eq(customerScores.tenantId, tenantId),
            gt(customerScores.dataProcessamento, thirtyDaysAgo)
          ));
        
        // Calcular médias
        const scoresComBureau = scores.filter(s => s.bureauSource === 'serasa_apibrasil');
        const scoresSemBureau = scores.filter(s => s.bureauSource === 'disabled');
        
        const avgInternoComBureau = scoresComBureau.length > 0
          ? scoresComBureau.reduce((sum, s) => sum + parseFloat(s.scoreInterno || '0'), 0) / scoresComBureau.length
          : 0;
        
        const avgFinalComBureau = scoresComBureau.length > 0
          ? scoresComBureau.reduce((sum, s) => sum + parseFloat(s.scoreFinal || '0'), 0) / scoresComBureau.length
          : 0;
        
        const avgSemBureau = scoresSemBureau.length > 0
          ? scoresSemBureau.reduce((sum, s) => sum + parseFloat(s.scoreFinal || '0'), 0) / scoresSemBureau.length
          : 0;
        
        return {
          total: scores.length,
          comBureau: scoresComBureau.length,
          semBureau: scoresSemBureau.length,
          avgScoreInternoComBureau: avgInternoComBureau.toFixed(4),
          avgScoreHibrido: avgFinalComBureau.toFixed(4),
          avgScoreSemBureau: avgSemBureau.toFixed(4),
          diferencaMedia: (avgFinalComBureau - avgInternoComBureau).toFixed(4),
        };
      }),
  }),

  // Gerenciamento de Modelos ML
  models: router({
    // Upload de novo modelo
    upload: protectedProcedure
      .input(z.object({
        modelName: z.string(),
        version: z.string(),
        product: z.enum(["CARTAO", "CARNE", "EMPRESTIMO_PESSOAL"]),
        fileBase64: z.string(), // Arquivo .pkl em base64
        metrics: z.object({
          accuracy: z.number().optional(),
          precision: z.number().optional(),
          recall: z.number().optional(),
          f1_score: z.number().optional(),
          auc_roc: z.number().optional(),
        }).optional(),
        mlflowRunId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { uploadModel } = await import("./modelManagementService");
        
        // Decodificar base64 e salvar temporariamente
        const buffer = Buffer.from(input.fileBase64, 'base64');
        const tempPath = `/tmp/model_${Date.now()}.pkl`;
        await import('fs/promises').then(fs => fs.writeFile(tempPath, buffer));
        
        try {
          const result = await uploadModel({
            tenantId: ctx.user.tenantId,
            modelName: input.modelName,
            version: input.version,
            product: input.product,
            filePath: tempPath,
            uploadedBy: ctx.user.id,
            metrics: input.metrics,
            mlflowRunId: input.mlflowRunId,
          });
          
          // Limpar arquivo temporário
          await import('fs/promises').then(fs => fs.unlink(tempPath));
          
          return result;
        } catch (error: any) {
          // Limpar arquivo temporário em caso de erro
          await import('fs/promises').then(fs => fs.unlink(tempPath).catch(() => {}));
          throw new TRPCError({ code: 'BAD_REQUEST', message: error.message });
        }
      }),

    // Promover modelo para produção
    promote: protectedProcedure
      .input(z.object({
        modelVersionId: z.number(),
        product: z.enum(["CARTAO", "CARNE", "EMPRESTIMO_PESSOAL"]),
        reason: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { promoteModel } = await import("./modelManagementService");
        
        const result = await promoteModel({
          modelVersionId: input.modelVersionId,
          tenantId: ctx.user.tenantId,
          product: input.product,
          promotedBy: ctx.user.id,
          reason: input.reason,
        });
        
        return result;
      }),

    // Listar versões de modelos
    list: protectedProcedure
      .input(z.object({
        product: z.enum(["CARTAO", "CARNE", "EMPRESTIMO_PESSOAL"]).optional(),
      }))
      .query(async ({ ctx, input }) => {
        const { listModelVersions } = await import("./modelManagementService");
        
        const models = await listModelVersions(1, input.product); // TODO: ctx.user.tenantId
        
        return models;
      }),

    // Buscar modelo em produção
    getProduction: protectedProcedure
      .input(z.object({
        product: z.enum(["CARTAO", "CARNE", "EMPRESTIMO_PESSOAL"]),
      }))
      .query(async ({ ctx, input }) => {
        const { getProductionModel } = await import("./modelManagementService");
        
        const model = await getProductionModel(1, input.product); // TODO: ctx.user.tenantId
        
        return model;
      }),
  }),

  // Monitoramento de Drift
  drift: router({
    // Detectar drift para um produto
    detect: protectedProcedure
      .input(z.object({
        product: z.enum(["CARTAO", "CARNE", "EMPRESTIMO_PESSOAL"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const { detectDrift } = await import("./modelManagementService");
        
        const result = await detectDrift(1, input.product); // TODO: ctx.user.tenantId
        
        return result;
      }),

    // Listar histórico de drift
    history: protectedProcedure
      .input(z.object({
        product: z.enum(["CARTAO", "CARNE", "EMPRESTIMO_PESSOAL"]).optional(),
        limit: z.number().default(50),
      }))
      .query(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        
        const { driftMonitoring } = await import("../drizzle/schema");
        
        let query = database
          .select()
          .from(driftMonitoring)
          .where(eq(driftMonitoring.tenantId, 1)) // TODO: ctx.user.tenantId
          .orderBy(desc(driftMonitoring.checkedAt))
          .limit(input.limit);
        
        if (input.product) {
          query = database
            .select()
            .from(driftMonitoring)
            .where(and(
              eq(driftMonitoring.tenantId, 1),
              eq(driftMonitoring.product, input.product)
            ))
            .orderBy(desc(driftMonitoring.checkedAt))
            .limit(input.limit);
        }
        
        const history = await query;
        
        return history;
      }),

    // Buscar alertas ativos
    activeAlerts: protectedProcedure
      .query(async ({ ctx }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        
        const { driftMonitoring } = await import("../drizzle/schema");
        
        const alerts = await database
          .select()
          .from(driftMonitoring)
          .where(and(
            eq(driftMonitoring.tenantId, 1), // TODO: ctx.user.tenantId
            eq(driftMonitoring.alertSent, false),
            sql`${driftMonitoring.status} IN ('warning', 'critical')`
          ))
          .orderBy(desc(driftMonitoring.checkedAt));
        
        return alerts;
      }),
  }),

  // Plano de Sustentação
  sustentation: router({
    // Contratar plano
    subscribe: protectedProcedure
      .input(z.object({
        planType: z.enum(["basic", "premium", "enterprise"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        
        const { sustentationPlans } = await import("../drizzle/schema");
        
        // Definir preços
        const prices = {
          basic: 2500,
          premium: 7500,
          enterprise: 15000,
        };
        
        const retrainings = {
          basic: 1,
          premium: 3,
          enterprise: 999, // Ilimitado
        };
        
        const sla = {
          basic: 48,
          premium: 24,
          enterprise: 4,
        };
        
        // Verificar se já existe plano ativo
        const existing = await database
          .select()
          .from(sustentationPlans)
          .where(and(
            eq(sustentationPlans.tenantId, 1), // TODO: ctx.user.tenantId
            eq(sustentationPlans.status, 'active')
          ))
          .limit(1);
        
        if (existing.length > 0) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Já existe um plano ativo' });
        }
        
        // Criar plano
        await database.insert(sustentationPlans).values({
          tenantId: ctx.user.tenantId,
          planType: input.planType,
          monthlyPrice: prices[input.planType].toString(),
          status: 'active',
          includedRetrainings: retrainings[input.planType],
          responseTimeSLA: sla[input.planType],
        });
        
        return { success: true, planType: input.planType };
      }),

    // Solicitar suporte
    requestSupport: protectedProcedure
      .input(z.object({
        product: z.enum(["CARTAO", "CARNE", "EMPRESTIMO_PESSOAL"]),
        description: z.string(),
        priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        
        const { sustentationPlans, sustentationTickets } = await import("../drizzle/schema");
        
        // Verificar se tem plano ativo
        const plan = await database
          .select()
          .from(sustentationPlans)
          .where(and(
            eq(sustentationPlans.tenantId, 1), // TODO: ctx.user.tenantId
            eq(sustentationPlans.status, 'active')
          ))
          .limit(1);
        
        if (plan.length === 0) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nenhum plano de sustentação ativo' });
        }
        
        // Criar ticket
        await database.insert(sustentationTickets).values({
          tenantId: ctx.user.tenantId,
          planId: plan[0].id,
          product: input.product,
          type: 'manual_request',
          status: 'pending',
          priority: input.priority,
          description: input.description,
        });
        
        return { success: true, message: 'Ticket criado com sucesso' };
      }),

    // Listar tickets
    listTickets: protectedProcedure
      .input(z.object({
        status: z.enum(["pending", "analyzing", "collecting_data", "retraining", "validating", "deploying", "completed", "cancelled"]).optional(),
      }))
      .query(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        
        const { sustentationTickets } = await import("../drizzle/schema");
        
        let query = database
          .select()
          .from(sustentationTickets)
          .where(eq(sustentationTickets.tenantId, 1)) // TODO: ctx.user.tenantId
          .orderBy(desc(sustentationTickets.createdAt));
        
        if (input.status) {
          query = database
            .select()
            .from(sustentationTickets)
            .where(and(
              eq(sustentationTickets.tenantId, 1),
              eq(sustentationTickets.status, input.status)
            ))
            .orderBy(desc(sustentationTickets.createdAt));
        }
        
        const tickets = await query;
        
        return tickets;
      }),

    // Buscar plano ativo
    getActivePlan: protectedProcedure
      .query(async ({ ctx }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        
        const { sustentationPlans } = await import("../drizzle/schema");
        
        const plan = await database
          .select()
          .from(sustentationPlans)
          .where(and(
            eq(sustentationPlans.tenantId, 1), // TODO: ctx.user.tenantId
            eq(sustentationPlans.status, 'active')
          ))
          .limit(1);
        
        return plan.length > 0 ? plan[0] : null;
      }),
  }),
});

export type AppRouter = typeof appRouter;
