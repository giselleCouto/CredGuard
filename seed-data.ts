import { drizzle } from "drizzle-orm/mysql2";
import { tenants, models, driftMetrics } from "./drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function seed() {
  console.log("🌱 Seeding database...");

  // Criar tenants
  const tenantsData = [
    { name: "Banco ABC", slug: "banco-abc", email: "admin@bancoabc.com", plan: "enterprise" as const, isActive: true },
    { name: "Fintech XYZ", slug: "fintech-xyz", email: "admin@fintechxyz.com", plan: "professional" as const, isActive: true },
    { name: "Cooperativa 123", slug: "cooperativa-123", email: "admin@coop123.com", plan: "basic" as const, isActive: true },
  ];

  for (const tenant of tenantsData) {
    await db.insert(tenants).values(tenant);
  }
  console.log("✅ Tenants criados");

  // Criar modelos
  const modelsData = [
    { tenantId: 1, name: "Modelo Cartão v1.0 (Banco ABC)", creditType: "CARTAO" as const, version: "1.0", status: "production" as const, accuracy: 88 },
    { tenantId: 1, name: "Modelo Empréstimo v1.0 (Banco ABC)", creditType: "EMPRESTIMO_PESSOAL" as const, version: "1.0", status: "production" as const, accuracy: 85 },
    { tenantId: 2, name: "Modelo Cartão v1.0 (Fintech XYZ)", creditType: "CARTAO" as const, version: "1.0", status: "production" as const, accuracy: 90 },
    { tenantId: 3, name: "Modelo Carnê v1.0 (Cooperativa 123)", creditType: "CARNE" as const, version: "1.0", status: "production" as const, accuracy: 87 },
  ];

  for (const model of modelsData) {
    await db.insert(models).values(model);
  }
  console.log("✅ Modelos criados");

  // Criar métricas de drift
  const driftData = [
    { modelId: 1, driftScore: 68, status: "CRITICAL" as const, recommendation: "ALERTA CRÍTICO: Retreinamento URGENTE recomendado" },
    { modelId: 2, driftScore: 42, status: "MODERATE" as const, recommendation: "ATENÇÃO: Monitorar de perto, retreinamento em breve" },
    { modelId: 3, driftScore: 18, status: "NO_DRIFT" as const, recommendation: "OK: Modelo estável, continuar monitorando" },
    { modelId: 4, driftScore: 25, status: "NO_DRIFT" as const, recommendation: "OK: Modelo estável, continuar monitorando" },
  ];

  for (const drift of driftData) {
    await db.insert(driftMetrics).values(drift);
  }
  console.log("✅ Métricas de drift criadas");

  console.log("🎉 Seed concluído com sucesso!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Erro ao fazer seed:", error);
  process.exit(1);
});
