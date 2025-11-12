import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { getDb } from "./db";
import { users, predictions } from "../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
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

  // Models router
  models: router({
    list: publicProcedure.query(async () => {
      return await db.getAllModels();
    }),
    
    listByTenant: publicProcedure
      .input(z.object({ tenantId: z.number() }))
      .query(async ({ input }) => {
        return await db.getModelsByTenant(input.tenantId);
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getModelById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        tenantId: z.number(),
        name: z.string().min(1),
        creditType: z.enum(["CARTAO", "EMPRESTIMO_PESSOAL", "CARNE", "FINANCIAMENTO"]),
        version: z.string().min(1),
        status: z.enum(["development", "staging", "production", "deprecated"]).default("development"),
        accuracy: z.number().min(0).max(100),
      }))
      .mutation(async ({ input }) => {
        return await db.createModel({
          tenantId: input.tenantId,
          name: input.name,
          creditType: input.creditType,
          version: input.version,
          status: input.status,
          accuracy: Math.round(input.accuracy), // Armazenar como inteiro
        });
      }),
  }),

  // Predictions router
  predictions: router({
    list: publicProcedure.query(async () => {
      return await db.getAllPredictions();
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

  // Drift monitoring router
  drift: router({
    overview: publicProcedure.query(async () => {
      const metrics = await db.getAllDriftMetrics();
      const models = await db.getAllModels();
      
      // Agrupar métricas por modelo (pegar a mais recente)
      const latestMetrics = new Map<number, typeof metrics[0]>();
      metrics.forEach(metric => {
        const existing = latestMetrics.get(metric.modelId);
        if (!existing || new Date(metric.checkedAt) > new Date(existing.checkedAt)) {
          latestMetrics.set(metric.modelId, metric);
        }
      });
      
      // Combinar com informações dos modelos
      const overview = Array.from(latestMetrics.values()).map(metric => {
        const model = models.find((m) => m.id === metric.modelId);
        return {
          modelId: metric.modelId,
          modelName: model?.name || "Unknown Model",
          driftScore: metric.driftScore / 100, // Converter de inteiro para decimal
          status: metric.status,
          recommendation: metric.recommendation,
          lastCheck: metric.checkedAt,
        };
      });
      
      return overview;
    }),
    
    critical: publicProcedure.query(async () => {
      const criticalMetrics = await db.getCriticalDriftMetrics();
      const models = await db.getAllModels();
      
      return criticalMetrics.map(metric => {
        const model = models.find((m) => m.id === metric.modelId);
        return {
          modelId: metric.modelId,
          modelName: model?.name || "Unknown Model",
          driftScore: metric.driftScore / 100,
          status: metric.status,
          recommendation: metric.recommendation,
          lastCheck: metric.checkedAt,
        };
      });
    }),
    
    byModel: publicProcedure
      .input(z.object({ modelId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDriftMetricsByModel(input.modelId);
      }),
  }),

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
    
    scoreEvolution: protectedProcedure.query(async () => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      
      // Gerar dados simulados de evolução temporal (30 dias)
      const days = 30;
      const today = new Date();
      const evolution = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Simular score variando entre 3 e 8
        const score = 5 + Math.sin(i / 5) * 2 + (Math.random() - 0.5);
        
        evolution.push({
          date: date.toISOString().split('T')[0],
          score: Math.max(1, Math.min(10, parseFloat(score.toFixed(1)))),
        });
      }
      
      return evolution;
    }),
    
    riskDistribution: protectedProcedure.query(async () => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      
      // Simular distribuição de risco baseada em predições
      // Em produção, isso viria do banco filtrado por userId
      const distribution = [
        { risk: 'Baixo (R1-R3)', count: 18, color: '#10B981' },
        { risk: 'Médio (R4-R6)', count: 15, color: '#F59E0B' },
        { risk: 'Alto (R7-R10)', count: 9, color: '#DC2626' },
      ];
      
      return distribution;
    }),
  }),
});

export type AppRouter = typeof appRouter;
