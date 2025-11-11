import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

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
});

export type AppRouter = typeof appRouter;
