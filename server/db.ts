import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users,
  tenants, Tenant, InsertTenant,
  models, Model, InsertModel,
  predictions, Prediction, InsertPrediction,
  driftMetrics, DriftMetric, InsertDriftMetric
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// User functions
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// Tenant functions
// ============================================================================

export async function getAllTenants(): Promise<Tenant[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(tenants).orderBy(desc(tenants.createdAt));
}

export async function getTenantById(id: number): Promise<Tenant | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createTenant(tenant: InsertTenant): Promise<Tenant> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(tenants).values(tenant);
  const insertedId = Number(result[0].insertId);
  
  const created = await getTenantById(insertedId);
  if (!created) throw new Error("Failed to retrieve created tenant");
  
  return created;
}

// ============================================================================
// Model functions
// ============================================================================

export async function getAllModels(): Promise<Model[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(models).orderBy(desc(models.createdAt));
}

export async function getModelsByTenant(tenantId: number): Promise<Model[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(models)
    .where(eq(models.tenantId, tenantId))
    .orderBy(desc(models.createdAt));
}

export async function getModelById(id: number): Promise<Model | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(models).where(eq(models.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createModel(model: InsertModel): Promise<Model> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(models).values(model);
  const insertedId = Number(result[0].insertId);
  
  const created = await getModelById(insertedId);
  if (!created) throw new Error("Failed to retrieve created model");
  
  return created;
}

// ============================================================================
// Prediction functions
// ============================================================================

export async function getAllPredictions(): Promise<Prediction[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(predictions).orderBy(desc(predictions.createdAt)).limit(100);
}

export async function getPredictionsByTenant(tenantId: number): Promise<Prediction[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(predictions)
    .where(eq(predictions.tenantId, tenantId))
    .orderBy(desc(predictions.createdAt))
    .limit(100);
}

export async function createPrediction(prediction: InsertPrediction): Promise<Prediction> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(predictions).values(prediction);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(predictions)
    .where(eq(predictions.id, insertedId))
    .limit(1);
    
  if (!created || created.length === 0) throw new Error("Failed to retrieve created prediction");
  
  return created[0];
}

// ============================================================================
// Drift Metrics functions
// ============================================================================

export async function getAllDriftMetrics(): Promise<DriftMetric[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(driftMetrics).orderBy(desc(driftMetrics.checkedAt));
}

export async function getDriftMetricsByModel(modelId: number): Promise<DriftMetric[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(driftMetrics)
    .where(eq(driftMetrics.modelId, modelId))
    .orderBy(desc(driftMetrics.checkedAt));
}

export async function getCriticalDriftMetrics(): Promise<DriftMetric[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(driftMetrics)
    .where(eq(driftMetrics.status, "CRITICAL"))
    .orderBy(desc(driftMetrics.checkedAt));
}

export async function createDriftMetric(metric: InsertDriftMetric): Promise<DriftMetric> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(driftMetrics).values(metric);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(driftMetrics)
    .where(eq(driftMetrics.id, insertedId))
    .limit(1);
    
  if (!created || created.length === 0) throw new Error("Failed to retrieve created drift metric");
  
  return created[0];
}
