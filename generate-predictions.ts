import { drizzle } from "drizzle-orm/mysql2";
import { predictions } from "./drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function generatePredictions() {
  console.log("🔮 Gerando predições de exemplo...");

  const creditTypes = ["CARTAO", "EMPRESTIMO_PESSOAL", "CARNE", "FINANCIAMENTO"] as const;
  const riskClasses = ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9", "R10"];
  const tenantIds = [1, 2, 3];
  const modelIds = [1, 2, 3, 4];

  const now = new Date();
  const predictions_data = [];

  // Gerar 50 predições nos últimos 30 dias
  for (let i = 0; i < 50; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - daysAgo);
    createdAt.setHours(Math.floor(Math.random() * 24));
    createdAt.setMinutes(Math.floor(Math.random() * 60));

    const tenantId = tenantIds[Math.floor(Math.random() * tenantIds.length)];
    const creditType = creditTypes[Math.floor(Math.random() * creditTypes.length)];
    const modelId = modelIds[Math.floor(Math.random() * modelIds.length)];
    const riskClass = riskClasses[Math.floor(Math.random() * riskClasses.length)];
    const probability = Math.floor(Math.random() * 10000);
    const recommendedLimit = Math.floor(Math.random() * 50000) + 1000;

    predictions_data.push({
      predictionId: `pred_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      modelId,
      creditType,
      riskClass,
      probability,
      recommendedLimit,
      inputData: JSON.stringify({
        renda: Math.floor(Math.random() * 15000) + 2000,
        idade: Math.floor(Math.random() * 50) + 18,
        score_bureau: Math.floor(Math.random() * 400) + 400,
      }),
      createdAt,
    });
  }

  for (const pred of predictions_data) {
    await db.insert(predictions).values(pred);
  }

  console.log(`✅ ${predictions_data.length} predições criadas com sucesso!`);
  process.exit(0);
}

generatePredictions().catch((error) => {
  console.error("❌ Erro ao gerar predições:", error);
  process.exit(1);
});
