import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Campos de perfil
  phone: varchar("phone", { length: 20 }),
  company: varchar("company", { length: 255 }),
  position: varchar("position", { length: 100 }),
  avatar: text("avatar"),
  bio: text("bio"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tenants (organizações/clientes do SaaS)
 */
export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull(),
  plan: mysqlEnum("plan", ["basic", "professional", "enterprise"]).default("basic").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

/**
 * Modelos de ML por tenant e tipo de crédito
 */
export const models = mysqlTable("models", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  creditType: mysqlEnum("creditType", ["CARTAO", "EMPRESTIMO_PESSOAL", "CARNE", "FINANCIAMENTO"]).notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  status: mysqlEnum("status", ["development", "staging", "production", "deprecated"]).default("development").notNull(),
  accuracy: int("accuracy").notNull(), // Armazenar como inteiro (88 = 0.88)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Model = typeof models.$inferSelect;
export type InsertModel = typeof models.$inferInsert;

/**
 * Predições realizadas
 */
export const predictions = mysqlTable("predictions", {
  id: int("id").autoincrement().primaryKey(),
  predictionId: varchar("predictionId", { length: 100 }).notNull().unique(),
  tenantId: int("tenantId").notNull(),
  modelId: int("modelId").notNull(),
  creditType: varchar("creditType", { length: 50 }).notNull(),
  riskClass: varchar("riskClass", { length: 10 }).notNull(),
  probability: int("probability").notNull(), // Armazenar como inteiro (8756 = 0.8756)
  recommendedLimit: int("recommendedLimit"),
  inputData: text("inputData").notNull(), // JSON string
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = typeof predictions.$inferInsert;

/**
 * Métricas de drift dos modelos
 */
export const driftMetrics = mysqlTable("driftMetrics", {
  id: int("id").autoincrement().primaryKey(),
  modelId: int("modelId").notNull(),
  driftScore: int("driftScore").notNull(), // Armazenar como inteiro (68 = 0.68)
  status: mysqlEnum("status", ["NO_DRIFT", "MODERATE", "CRITICAL"]).notNull(),
  recommendation: text("recommendation").notNull(),
  checkedAt: timestamp("checkedAt").defaultNow().notNull(),
});

export type DriftMetric = typeof driftMetrics.$inferSelect;
export type InsertDriftMetric = typeof driftMetrics.$inferInsert;
