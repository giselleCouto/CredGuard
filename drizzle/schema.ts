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
// Tabela de jobs de processamento em lote
export const batchJobs = mysqlTable("batch_jobs", {
  id: int("id").autoincrement().primaryKey(),
  jobId: varchar("job_id", { length: 100 }).notNull().unique(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: int("file_size").notNull(),
  totalRows: int("total_rows"),
  processedRows: int("processed_rows").default(0),
  status: mysqlEnum("status", ["queued", "processing", "completed", "failed"]).default("queued").notNull(),
  errorMessage: text("error_message"),
  resultCsvPath: varchar("result_csv_path", { length: 500 }),
  queuedAt: timestamp("queued_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tabela de dados raw dos clientes (histórico de compras e pagamentos)
export const customerData = mysqlTable("customer_data", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  batchJobId: int("batch_job_id").notNull().references(() => batchJobs.id),
  cpf: varchar("cpf", { length: 14 }).notNull(),
  nome: varchar("nome", { length: 255 }),
  email: varchar("email", { length: 320 }),
  telefone: varchar("telefone", { length: 20 }),
  dataNascimento: varchar("data_nascimento", { length: 10 }),
  renda: varchar("renda", { length: 20 }),
  produto: mysqlEnum("produto", ["CARTAO", "EMPRESTIMO_PESSOAL", "CARNE"]).notNull(),
  dataCompra: varchar("data_compra", { length: 10 }),
  valorCompra: varchar("valor_compra", { length: 20 }),
  dataPagamento: varchar("data_pagamento", { length: 10 }),
  statusPagamento: varchar("status_pagamento", { length: 50 }),
  diasAtraso: int("dias_atraso"),
  rawData: text("raw_data"), // JSON com todos os campos originais
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tabela de scores gerados
export const customerScores = mysqlTable("customer_scores", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  batchJobId: int("batch_job_id").notNull().references(() => batchJobs.id),
  cpf: varchar("cpf", { length: 14 }).notNull(),
  nome: varchar("nome", { length: 255 }),
  produto: mysqlEnum("produto", ["CARTAO", "EMPRESTIMO_PESSOAL", "CARNE"]).notNull(),
  scoreProbInadimplencia: varchar("score_prob_inadimplencia", { length: 10 }), // 0.00 a 1.00
  faixaScore: mysqlEnum("faixa_score", ["A", "B", "C", "D", "E"]),
  motivoExclusao: varchar("motivo_exclusao", { length: 100 }), // menos_3_meses, inativo_8_meses
  mesesHistorico: int("meses_historico"),
  ultimoMovimento: varchar("ultimo_movimento", { length: 10 }),
  dataProcessamento: timestamp("data_processamento").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
