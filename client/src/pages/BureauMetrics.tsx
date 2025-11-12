import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, TrendingDown, DollarSign, Database, BarChart3, PieChart } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import ThemeToggle from "@/components/ThemeToggle";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function BureauMetrics() {
  const { data: metrics, isLoading: loadingMetrics } = trpc.bureau.getMetrics.useQuery();
  const { data: distribution, isLoading: loadingDist } = trpc.bureau.getScoreDistribution.useQuery();
  const { data: config } = trpc.bureau.getConfig.useQuery();

  if (loadingMetrics || loadingDist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const cacheHitRate = parseFloat(metrics?.cacheHitRate || "0");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <img src="/credguard-logo.png" alt="CredGuard" className="h-10" />
              <span className="text-xl font-bold">CredGuard</span>
            </div>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: "Início", href: "/" },
            { label: "Dashboard", href: "/dashboard" },
            { label: "Métricas de Bureau" },
          ]}
        />

        <div className="mt-6 space-y-6">
          {/* Header com Status */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Métricas de Bureau</h1>
              <p className="text-muted-foreground mt-1">
                Acompanhamento de uso e custos da integração com bureaus de crédito
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/bureau-config">
                <Button variant="outline">Configurações</Button>
              </Link>
            </div>
          </div>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total de Consultas */}
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Total de Consultas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics?.totalConsultas || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Últimos {metrics?.periodo || "30 dias"}
                </p>
              </CardContent>
            </Card>

            {/* Cache Hit Rate */}
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Taxa de Cache Hit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold flex items-center gap-2">
                  {metrics?.cacheHitRate || "0"}%
                  {cacheHitRate >= 50 ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics?.cacheHits || 0} hits / {metrics?.cacheMisses || 0} misses
                </p>
              </CardContent>
            </Card>

            {/* Custo Mensal */}
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Custo Mensal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  R$ {metrics?.custoMensal?.toFixed(2) || "0.00"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {config?.bureauEnabled ? "Bureau ativado" : "Bureau desativado"}
                </p>
              </CardContent>
            </Card>

            {/* Scores Processados */}
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Scores Processados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{distribution?.total || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {distribution?.comBureau || 0} com bureau / {distribution?.semBureau || 0} sem
                  bureau
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos de Distribuição */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cache Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Performance do Cache</CardTitle>
                <CardDescription>
                  Distribuição de consultas entre cache hits e misses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Cache Hits</span>
                      <span className="text-sm text-muted-foreground">
                        {metrics?.cacheHits || 0} ({cacheHitRate.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className="bg-green-500 h-3 rounded-full transition-all"
                        style={{ width: `${cacheHitRate}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Cache Misses</span>
                      <span className="text-sm text-muted-foreground">
                        {metrics?.cacheMisses || 0} ({(100 - cacheHitRate).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className="bg-red-500 h-3 rounded-full transition-all"
                        style={{ width: `${100 - cacheHitRate}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      {cacheHitRate >= 70 ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          ✓ Excelente! O cache está economizando consultas.
                        </span>
                      ) : cacheHitRate >= 40 ? (
                        <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                          ⚠ Moderado. Considere aumentar o tempo de cache.
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          ✗ Baixo. Muitas consultas duplicadas estão sendo feitas.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comparação de Scores */}
            <Card>
              <CardHeader>
                <CardTitle>Comparação de Scores</CardTitle>
                <CardDescription>Médias de scores interno vs híbrido</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Score Interno (sem bureau)</span>
                      <span className="text-sm font-mono">
                        {distribution?.avgScoreSemBureau || "0.0000"}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className="bg-blue-500 h-3 rounded-full transition-all"
                        style={{
                          width: `${parseFloat(distribution?.avgScoreSemBureau || "0") * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Score Interno (quando bureau ativo)
                      </span>
                      <span className="text-sm font-mono">
                        {distribution?.avgScoreInternoComBureau || "0.0000"}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className="bg-purple-500 h-3 rounded-full transition-all"
                        style={{
                          width: `${parseFloat(distribution?.avgScoreInternoComBureau || "0") * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Score Híbrido (70% + 30% bureau)</span>
                      <span className="text-sm font-mono">
                        {distribution?.avgScoreHibrido || "0.0000"}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className="bg-green-500 h-3 rounded-full transition-all"
                        style={{
                          width: `${parseFloat(distribution?.avgScoreHibrido || "0") * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Diferença média (híbrido - interno):</span>
                      <span
                        className={`font-mono font-medium ${
                          parseFloat(distribution?.diferencaMedia || "0") > 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {parseFloat(distribution?.diferencaMedia || "0") > 0 ? "+" : ""}
                        {distribution?.diferencaMedia || "0.0000"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {parseFloat(distribution?.diferencaMedia || "0") > 0
                        ? "O bureau está aumentando os scores (mais conservador)"
                        : "O bureau está reduzindo os scores (mais rigoroso)"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights e Recomendações */}
          <Card>
            <CardHeader>
              <CardTitle>Insights e Recomendações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">
                  💡 Economia com Cache
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Nos últimos 30 dias, o cache evitou{" "}
                  <strong>{metrics?.cacheHits || 0} consultas duplicadas</strong>. Com o custo de
                  R$ 99/mês para consultas ilimitadas, você está aproveitando bem o plano.
                </p>
              </div>

              {distribution && distribution.comBureau > 0 && (
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-medium mb-2 text-green-900 dark:text-green-100">
                    ✓ Bureau Ativo
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    <strong>{distribution.comBureau}</strong> scores foram enriquecidos com dados
                    de bureau nos últimos 30 dias. A diferença média entre score interno e híbrido
                    é de <strong>{distribution.diferencaMedia}</strong>.
                  </p>
                </div>
              )}

              {cacheHitRate < 40 && (
                <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-medium mb-2 text-yellow-900 dark:text-yellow-100">
                    ⚠️ Taxa de Cache Baixa
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Sua taxa de cache hit está em <strong>{cacheHitRate.toFixed(1)}%</strong>.
                    Considere aumentar o tempo de cache de 24h para 48h ou verificar se há muitos
                    CPFs diferentes sendo consultados.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex gap-3">
            <Link href="/dashboard">
              <Button variant="outline">Voltar ao Dashboard</Button>
            </Link>
            <Link href="/batch-upload">
              <Button>Fazer Upload em Lote</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
