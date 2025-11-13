import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  tenantId: int("tenantId").notNull().default(1), // Cada usuário pertence a um tenant
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
  produto: mysqlEnum("produto", ["CARTAO", "CARNE", "EMPRESTIMO_PESSOAL"]).notNull(),
  scoreProbInadimplencia: varchar("score_prob_inadimplencia", { length: 10 }),
  faixaScore: mysqlEnum("faixa_score", ["A", "B", "C", "D", "E"]),
  motivoExclusao: varchar("motivo_exclusao", { length: 100 }),
  mesesHistorico: int("meses_historico"),
  ultimoMovimento: varchar("ultimo_movimento", { length: 50 }),
  // Campos de enriquecimento com bureau
  scoreInterno: varchar("score_interno", { length: 10 }),
  scoreSerasa: int("score_serasa"),
  pendencias: int("pendencias"),
  protestos: int("protestos"),
  bureauSource: varchar("bureau_source", { length: 50 }),
  dataProcessamento: timestamp("data_processamento").defaultNow().notNull(),
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

/**
 * Configuração de bureau de crédito por tenant
 */
export const tenantBureauConfig = mysqlTable("tenant_bureau_config", {
  tenantId: int("tenant_id").primaryKey().references(() => tenants.id),
  bureauEnabled: boolean("bureau_enabled").default(false).notNull(),
  bureauProvider: varchar("bureau_provider", { length: 50 }).default("apibrasil").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().onUpdateNow().notNull(),
});

export type TenantBureauConfig = typeof tenantBureauConfig.$inferSelect;
export type InsertTenantBureauConfig = typeof tenantBureauConfig.$inferInsert;

/**
 * Cache de consultas de bureau
 */
export const bureauCache = mysqlTable("bureau_cache", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  cpf: varchar("cpf", { length: 14 }).notNull(),
  scoreSerasa: int("score_serasa"),
  pendencias: int("pendencias").default(0),
  protestos: int("protestos").default(0),
  valorDivida: decimal("valor_divida", { precision: 15, scale: 2 }),
  cadastroPositivo: boolean("cadastro_positivo").default(false),
  source: varchar("source", { length: 50 }).notNull(),
  cachedAt: timestamp("cached_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export type BureauCache = typeof bureauCache.$inferSelect;
export type InsertBureauCache = typeof bureauCache.$inferInsert;

/**
 * Versões de modelos ML (MLflow integration)
 */
export const modelVersions = mysqlTable("model_versions", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  modelName: varchar("model_name", { length: 255 }).notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  product: mysqlEnum("product", ["CARTAO", "CARNE", "EMPRESTIMO_PESSOAL"]).notNull(),
  filePath: text("file_path").notNull(), // Caminho no S3 ou filesystem
  fileSize: int("file_size").notNull(), // Tamanho em bytes
  mlflowRunId: varchar("mlflow_run_id", { length: 255 }),
  metrics: text("metrics"), // JSON com métricas (accuracy, precision, recall, etc)
  status: mysqlEnum("status", ["uploaded", "validated", "production", "archived"]).default("uploaded").notNull(),
  uploadedBy: int("uploaded_by").notNull().references(() => users.id),
  promotedBy: int("promoted_by").references(() => users.id),
  promotedAt: timestamp("promoted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ModelVersion = typeof modelVersions.$inferSelect;
export type InsertModelVersion = typeof modelVersions.$inferInsert;

/**
 * Histórico de deploys de modelos
 */
export const modelDeployments = mysqlTable("model_deployments", {
  id: int("id").autoincrement().primaryKey(),
  modelVersionId: int("model_version_id").notNull().references(() => modelVersions.id),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  product: mysqlEnum("product", ["CARTAO", "CARNE", "EMPRESTIMO_PESSOAL"]).notNull(),
  reason: text("reason").notNull(), // Motivo do deploy (drift, performance, etc)
  deployedBy: int("deployed_by").notNull().references(() => users.id),
  deployedAt: timestamp("deployed_at").defaultNow().notNull(),
  rollbackedAt: timestamp("rollbacked_at"),
});

export type ModelDeployment = typeof modelDeployments.$inferSelect;
export type InsertModelDeployment = typeof modelDeployments.$inferInsert;

/**
 * Monitoramento de drift detalhado
 */
export const driftMonitoring = mysqlTable("drift_monitoring", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  product: mysqlEnum("product", ["CARTAO", "CARNE", "EMPRESTIMO_PESSOAL"]).notNull(),
  modelVersionId: int("model_version_id").notNull().references(() => modelVersions.id),
  psi: decimal("psi", { precision: 5, scale: 4 }).notNull(), // Population Stability Index
  featureDrift: text("feature_drift"), // JSON com drift por feature
  performanceDrift: text("performance_drift"), // JSON com métricas de performance
  status: mysqlEnum("status", ["stable", "warning", "critical"]).notNull(),
  alertSent: boolean("alert_sent").default(false).notNull(),
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
});

export type DriftMonitoring = typeof driftMonitoring.$inferSelect;
export type InsertDriftMonitoring = typeof driftMonitoring.$inferInsert;

/**
 * Planos de sustentação de modelos
 */
export const sustentationPlans = mysqlTable("sustentation_plans", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().unique().references(() => tenants.id),
  planType: mysqlEnum("plan_type", ["basic", "premium", "enterprise"]).notNull(),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["active", "suspended", "cancelled"]).default("active").notNull(),
  includedRetrainings: int("included_retrainings").notNull(), // Retreinamentos incluídos por mês
  responseTimeSLA: int("response_time_sla").notNull(), // SLA em horas
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  cancelledAt: timestamp("cancelled_at"),
});

export type SustentationPlan = typeof sustentationPlans.$inferSelect;
export type InsertSustentationPlan = typeof sustentationPlans.$inferInsert;

/**
 * Tickets de sustentação (solicitações de retreinamento)
 */
export const sustentationTickets = mysqlTable("sustentation_tickets", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull().references(() => tenants.id),
  planId: int("plan_id").notNull().references(() => sustentationPlans.id),
  product: mysqlEnum("product", ["CARTAO", "CARNE", "EMPRESTIMO_PESSOAL"]).notNull(),
  driftMonitoringId: int("drift_monitoring_id").references(() => driftMonitoring.id),
  type: mysqlEnum("type", ["drift_alert", "manual_request", "scheduled"]).notNull(),
  status: mysqlEnum("status", ["pending", "analyzing", "collecting_data", "retraining", "validating", "deploying", "completed", "cancelled"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  description: text("description").notNull(),
  assignedTo: int("assigned_to").references(() => users.id), // Analista da CredGuard
  resolution: text("resolution"),
  newModelVersionId: int("new_model_version_id").references(() => modelVersions.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export type SustentationTicket = typeof sustentationTickets.$inferSelect;
export type InsertSustentationTicket = typeof sustentationTickets.$inferInsert;
