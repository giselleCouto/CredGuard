/**
 * Serviço de Gerenciamento de Modelos ML
 * 
 * Responsável por upload, validação, promoção e deploy de modelos ML
 */

import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import { modelVersions, modelDeployments, driftMonitoring } from "../drizzle/schema";
import { storagePut, storageGet } from "./storage";
import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface UploadModelParams {
  tenantId: number;
  modelName: string;
  version: string;
  product: "CARTAO" | "CARNE" | "EMPRESTIMO_PESSOAL";
  filePath: string; // Caminho temporário do arquivo .pkl
  uploadedBy: number;
  metrics?: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1_score?: number;
    auc_roc?: number;
  };
  mlflowRunId?: string;
}

export interface PromoteModelParams {
  modelVersionId: number;
  tenantId: number;
  product: "CARTAO" | "CARNE" | "EMPRESTIMO_PESSOAL";
  promotedBy: number;
  reason: string;
}

/**
 * Valida arquivo .pkl de modelo ML
 */
export async function validateModelFile(filePath: string): Promise<{
  valid: boolean;
  error?: string;
  modelInfo?: {
    type: string;
    size: number;
  };
}> {
  try {
    // Verificar se arquivo existe
    const stats = await fs.stat(filePath);
    
    // Verificar tamanho (máximo 500MB)
    if (stats.size > 500 * 1024 * 1024) {
      return {
        valid: false,
        error: "Arquivo muito grande (máximo 500MB)"
      };
    }

    // Validar que é um arquivo pickle válido usando Python
    const pythonScript = `
import pickle
import sys

try:
    with open('${filePath}', 'rb') as f:
        model = pickle.load(f)
    
    # Verificar se tem método predict
    if not hasattr(model, 'predict'):
        print('ERROR: Model does not have predict method')
        sys.exit(1)
    
    print(f'OK:{type(model).__name__}')
    sys.exit(0)
except Exception as e:
    print(f'ERROR: {str(e)}')
    sys.exit(1)
`;

    const tempScriptPath = `/tmp/validate_model_${Date.now()}.py`;
    await fs.writeFile(tempScriptPath, pythonScript);

    const { stdout, stderr } = await execAsync(`python3 ${tempScriptPath}`);
    await fs.unlink(tempScriptPath);

    if (stdout.startsWith('OK:')) {
      const modelType = stdout.split(':')[1].trim();
      return {
        valid: true,
        modelInfo: {
          type: modelType,
          size: stats.size
        }
      };
    } else {
      return {
        valid: false,
        error: stdout.replace('ERROR:', '').trim()
      };
    }
  } catch (error: any) {
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Faz upload de novo modelo ML
 */
export async function uploadModel(params: UploadModelParams) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Validar arquivo
  const validation = await validateModelFile(params.filePath);
  if (!validation.valid) {
    throw new Error(`Modelo inválido: ${validation.error}`);
  }

  // Ler arquivo
  const fileBuffer = await fs.readFile(params.filePath);
  
  // Upload para S3
  const s3Key = `models/${params.tenantId}/${params.product}/${params.modelName}_${params.version}.pkl`;
  const { url: s3Url } = await storagePut(s3Key, fileBuffer, "application/octet-stream");

  // Salvar no banco de dados
  const [modelVersion] = await db.insert(modelVersions).values({
    tenantId: params.tenantId,
    modelName: params.modelName,
    version: params.version,
    product: params.product,
    filePath: s3Key,
    fileSize: validation.modelInfo!.size,
    mlflowRunId: params.mlflowRunId,
    metrics: params.metrics ? JSON.stringify(params.metrics) : null,
    status: "uploaded",
    uploadedBy: params.uploadedBy,
  });

  return {
    id: modelVersion.insertId,
    s3Url,
    validation: validation.modelInfo
  };
}

/**
 * Promove modelo para produção
 */
export async function promoteModel(params: PromoteModelParams) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar modelo
  const [model] = await db
    .select()
    .from(modelVersions)
    .where(
      and(
        eq(modelVersions.id, params.modelVersionId),
        eq(modelVersions.tenantId, params.tenantId),
        eq(modelVersions.product, params.product)
      )
    )
    .limit(1);

  if (!model) {
    throw new Error("Modelo não encontrado");
  }

  if (model.status === "production") {
    throw new Error("Modelo já está em produção");
  }

  // Baixar modelo do S3 para diretório de produção
  const productionPath = `/opt/credguard/ml_models/${getModelFileName(params.product)}`;
  
  // Fazer backup do modelo atual
  const backupPath = `/opt/credguard/ml_models/archive/${getModelFileName(params.product)}_${Date.now()}.pkl`;
  try {
    await fs.copyFile(productionPath, backupPath);
  } catch (error) {
    // Ignorar se arquivo não existe (primeiro deploy)
  }

  // Baixar novo modelo do S3
  const { url: s3Url } = await storageGet(model.filePath);
  const response = await fetch(s3Url);
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(productionPath, buffer);

  // Atualizar status do modelo anterior para archived
  await db
    .update(modelVersions)
    .set({ status: "archived" })
    .where(
      and(
        eq(modelVersions.tenantId, params.tenantId),
        eq(modelVersions.product, params.product),
        eq(modelVersions.status, "production")
      )
    );

  // Atualizar modelo atual para production
  await db
    .update(modelVersions)
    .set({
      status: "production",
      promotedBy: params.promotedBy,
      promotedAt: new Date(),
    })
    .where(eq(modelVersions.id, params.modelVersionId));

  // Registrar deployment
  await db.insert(modelDeployments).values({
    modelVersionId: params.modelVersionId,
    tenantId: params.tenantId,
    product: params.product,
    reason: params.reason,
    deployedBy: params.promotedBy,
  });

  return {
    success: true,
    productionPath,
    backupPath
  };
}

/**
 * Lista versões de modelos
 */
export async function listModelVersions(tenantId: number, product?: "CARTAO" | "CARNE" | "EMPRESTIMO_PESSOAL") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Construir condição baseada em product
  const whereCondition = product
    ? and(
        eq(modelVersions.tenantId, tenantId),
        eq(modelVersions.product, product)
      )
    : eq(modelVersions.tenantId, tenantId);

  const versions = await db
    .select()
    .from(modelVersions)
    .where(whereCondition)
    .orderBy(desc(modelVersions.createdAt));

  return versions;
}

/**
 * Busca modelo em produção
 */
export async function getProductionModel(tenantId: number, product: "CARTAO" | "CARNE" | "EMPRESTIMO_PESSOAL") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [model] = await db
    .select()
    .from(modelVersions)
    .where(
      and(
        eq(modelVersions.tenantId, tenantId),
        eq(modelVersions.product, product),
        eq(modelVersions.status, "production")
      )
    )
    .limit(1);

  return model || null;
}

/**
 * Calcula PSI (Population Stability Index) para drift monitoring
 */
export async function calculatePSI(
  tenantId: number,
  product: "CARTAO" | "CARNE" | "EMPRESTIMO_PESSOAL",
  baselineScores: number[],
  currentScores: number[]
): Promise<number> {
  // Implementação simplificada do PSI
  // PSI = Σ (atual% - baseline%) * ln(atual% / baseline%)
  
  const bins = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
  let psi = 0;

  for (let i = 0; i < bins.length - 1; i++) {
    const baselineCount = baselineScores.filter(s => s >= bins[i] && s < bins[i + 1]).length;
    const currentCount = currentScores.filter(s => s >= bins[i] && s < bins[i + 1]).length;

    const baselinePct = baselineCount / baselineScores.length || 0.0001;
    const currentPct = currentCount / currentScores.length || 0.0001;

    psi += (currentPct - baselinePct) * Math.log(currentPct / baselinePct);
  }

  return psi;
}

/**
 * Detecta drift e cria alerta
 */
export async function detectDrift(
  tenantId: number,
  product: "CARTAO" | "CARNE" | "EMPRESTIMO_PESSOAL"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar modelo em produção
  const productionModel = await getProductionModel(tenantId, product);
  if (!productionModel) {
    return { driftDetected: false, psi: 0, status: "stable" as const, message: "Nenhum modelo em produção", recommendation: "Configure um modelo em produção primeiro" };
  }

  // Buscar scores dos últimos 30 dias (baseline)
  // Buscar scores usando query builder ao invés de raw SQL
  const { customerScores } = await import("../drizzle/schema");
  const { and, eq, gt, lt, isNull } = await import("drizzle-orm");
  
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const baselineScores = await db
    .select({ score: customerScores.scoreProbInadimplencia })
    .from(customerScores)
    .where(and(
      eq(customerScores.tenantId, tenantId),
      eq(customerScores.produto, product),
      gt(customerScores.dataProcessamento, sixtyDaysAgo),
      lt(customerScores.dataProcessamento, thirtyDaysAgo),
      isNull(customerScores.motivoExclusao)
    ))
    .limit(1000);

  const currentScores = await db
    .select({ score: customerScores.scoreProbInadimplencia })
    .from(customerScores)
    .where(and(
      eq(customerScores.tenantId, tenantId),
      eq(customerScores.produto, product),
      gt(customerScores.dataProcessamento, sevenDaysAgo),
      isNull(customerScores.motivoExclusao)
    ))
    .limit(1000);

  if (baselineScores.length < 100 || currentScores.length < 100) {
    return { driftDetected: false, psi: 0, status: "stable" as const, message: "Dados insuficientes para calcular drift", recommendation: "Aguarde mais dados serem processados" };
  }

  const baselineValues = baselineScores.map((r) => parseFloat(r.score || '0'));
  const currentValues = currentScores.map((r) => parseFloat(r.score || '0'));

  const psi = await calculatePSI(tenantId, product, baselineValues, currentValues);

  let status: "stable" | "warning" | "critical";
  if (psi < 0.1) {
    status = "stable";
  } else if (psi < 0.25) {
    status = "warning";
  } else {
    status = "critical";
  }

  // Salvar resultado do monitoramento
  await db.insert(driftMonitoring).values({
    tenantId,
    product,
    modelVersionId: productionModel.id,
    psi: psi.toString(),
    featureDrift: null,
    performanceDrift: null,
    status,
    alertSent: false,
  });

  return {
    driftDetected: status !== "stable",
    psi,
    status,
    message: status === "critical"
      ? "Drift crítico detectado!"
      : status === "warning"
      ? "Drift moderado detectado"
      : "Modelo estável",
    recommendation: status === "critical" 
      ? "Retreinamento urgente recomendado" 
      : status === "warning"
      ? "Monitorar de perto, retreinamento pode ser necessário em breve"
      : "Modelo estável"
  };
}

/**
 * Mapeia produto para nome do arquivo do modelo
 */
function getModelFileName(product: "CARTAO" | "CARNE" | "EMPRESTIMO_PESSOAL"): string {
  const mapping = {
    "CARTAO": "fa_12.pkl",
    "CARNE": "fa_11.pkl",
    "EMPRESTIMO_PESSOAL": "fa_15.pkl"
  };
  return mapping[product];
}
