import { getDb } from "./db";
import { tenantBureauConfig, bureauCache } from "../drizzle/schema";
import { eq, and, gt } from "drizzle-orm";

interface BureauData {
  source: string;
  scoreSerasa?: number;
  pendencias?: number;
  protestos?: number;
  valorDivida?: number;
  cadastroPositivo?: boolean;
}

const BUREAU_CACHE_HOURS = 24;
const API_BRASIL_URL = "https://api.apibrasil.io/v1/serasa/completo";

/**
 * Verifica se o bureau está habilitado para o tenant
 */
export async function isBureauEnabled(tenantId: number): Promise<boolean> {
  const database = await getDb();
  if (!database) return false;

  const [config] = await database
    .select()
    .from(tenantBureauConfig)
    .where(eq(tenantBureauConfig.tenantId, tenantId))
    .limit(1);

  return config?.bureauEnabled ?? false;
}

/**
 * Ativa ou desativa o bureau para um tenant
 */
export async function setBureauEnabled(tenantId: number, enabled: boolean): Promise<void> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const [existing] = await database
    .select()
    .from(tenantBureauConfig)
    .where(eq(tenantBureauConfig.tenantId, tenantId))
    .limit(1);

  if (existing) {
    await database
      .update(tenantBureauConfig)
      .set({ bureauEnabled: enabled, lastUpdated: new Date() })
      .where(eq(tenantBureauConfig.tenantId, tenantId));
  } else {
    await database.insert(tenantBureauConfig).values({
      tenantId,
      bureauEnabled: enabled,
      bureauProvider: "apibrasil",
      lastUpdated: new Date(),
    });
  }
}

/**
 * Busca dados do bureau no cache
 */
async function getCachedBureauData(tenantId: number, cpf: string): Promise<BureauData | null> {
  const database = await getDb();
  if (!database) return null;

  const now = new Date();
  const [cached] = await database
    .select()
    .from(bureauCache)
    .where(
      and(
        eq(bureauCache.tenantId, tenantId),
        eq(bureauCache.cpf, cpf),
        gt(bureauCache.expiresAt, now)
      )
    )
    .limit(1);

  if (!cached) return null;

  return {
    source: cached.source,
    scoreSerasa: cached.scoreSerasa ?? undefined,
    pendencias: cached.pendencias ?? undefined,
    protestos: cached.protestos ?? undefined,
    valorDivida: cached.valorDivida ? parseFloat(cached.valorDivida) : undefined,
    cadastroPositivo: cached.cadastroPositivo ?? undefined,
  };
}

/**
 * Salva dados do bureau no cache
 */
async function cacheBureauData(tenantId: number, cpf: string, data: BureauData): Promise<void> {
  const database = await getDb();
  if (!database) return;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + BUREAU_CACHE_HOURS * 60 * 60 * 1000);

  await database.insert(bureauCache).values({
    tenantId,
    cpf,
    scoreSerasa: data.scoreSerasa ?? null,
    pendencias: data.pendencias ?? 0,
    protestos: data.protestos ?? 0,
    valorDivida: data.valorDivida?.toString() ?? null,
    cadastroPositivo: data.cadastroPositivo ?? false,
    source: data.source,
    cachedAt: now,
    expiresAt,
  });
}

/**
 * Consulta dados do bureau via API Brasil
 */
async function fetchBureauData(cpf: string, apiToken?: string): Promise<BureauData> {
  if (!apiToken) {
    return { source: "disabled" };
  }

  const cleanCpf = cpf.replace(/\D/g, "");

  try {
    const response = await fetch(API_BRASIL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({ cpf: cleanCpf }),
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (!response.ok) {
      console.error(`API Brasil error: ${response.status} ${response.statusText}`);
      return { source: "error" };
    }

    const data = await response.json();

    return {
      source: "serasa_apibrasil",
      scoreSerasa: data.score ?? undefined,
      pendencias: data.pendencias_financeiras ?? 0,
      protestos: data.protestos ?? 0,
      valorDivida: data.valor_total_divida ?? 0,
      cadastroPositivo: data.cadastro_positivo ?? false,
    };
  } catch (error) {
    console.error("Bureau API error:", error);
    return { source: "timeout" };
  }
}

/**
 * Enriquece dados do cliente com informações de bureau
 * Usa cache quando disponível
 */
export async function enrichWithBureau(
  tenantId: number,
  cpf: string,
  apiToken?: string
): Promise<BureauData> {
  // Verifica se bureau está habilitado
  const enabled = await isBureauEnabled(tenantId);
  if (!enabled) {
    return { source: "disabled" };
  }

  // Tenta buscar do cache
  const cached = await getCachedBureauData(tenantId, cpf);
  if (cached) {
    return cached;
  }

  // Consulta API
  const data = await fetchBureauData(cpf, apiToken);

  // Salva no cache se sucesso
  if (data.source === "serasa_apibrasil") {
    await cacheBureauData(tenantId, cpf, data);
  }

  return data;
}

/**
 * Calcula score híbrido combinando score interno e bureau
 * 70% score interno + 30% score bureau (normalizado)
 */
export function calculateHybridScore(scoreInterno: number, bureauData: BureauData): number {
  if (bureauData.source !== "serasa_apibrasil" || !bureauData.scoreSerasa) {
    return scoreInterno;
  }

  // Normalizar score Serasa (0-1000) para escala 0-1
  const scoreSerasaNormalizado = bureauData.scoreSerasa / 1000;

  // Score híbrido: 70% interno + 30% bureau
  const scoreHibrido = 0.7 * scoreInterno + 0.3 * scoreSerasaNormalizado;

  return Math.max(0, Math.min(1, scoreHibrido));
}
