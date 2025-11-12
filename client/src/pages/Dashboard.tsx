import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Upload, History as HistoryIcon, Settings, BarChart3, FileText, Shield } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import Logo from "@/components/Logo";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function Dashboard() {
  // Simular stats por enquanto (TODO: criar endpoint batch.stats)
  const batchStats = {
    totalJobs: 0,
    completedJobs: 0,
    totalCustomers: 0,
    totalScores: 0,
    excludedCustomers: 0,
  };
  const { data: bureauConfig } = trpc.bureau.getConfig.useQuery();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo size={32} />
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            </div>
            <nav className="flex gap-2">
              <Link href="/batch-upload"><Button variant="ghost">Upload em Lote</Button></Link>
              <Link href="/history"><Button variant="ghost">Histórico</Button></Link>
              <Link href="/bureau-config"><Button variant="ghost">Configurações</Button></Link>
              <Link href="/profile"><Button variant="ghost">Perfil</Button></Link>
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Breadcrumbs items={[{ label: "Dashboard" }]} />
        
        <div className="mt-8 mb-6">
          <h2 className="text-3xl font-bold">Bem-vindo ao CredGuard</h2>
          <p className="text-muted-foreground mt-2">
            Plataforma de análise de risco de crédito para sua empresa
          </p>
        </div>

        {/* Cards de Ações Rápidas */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Link href="/batch-upload">
            <Card className="cursor-pointer hover:border-primary transition-colors h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Upload em Lote</CardTitle>
                    <CardDescription>Enviar arquivo CSV/Excel</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Faça upload do histórico de seus clientes e gere scores de crédito para CARTÃO,
                  CARNÊ e EMPRÉSTIMO PESSOAL.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/history">
            <Card className="cursor-pointer hover:border-primary transition-colors h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <HistoryIcon className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle>Histórico de Scores</CardTitle>
                    <CardDescription>Consultar processamentos</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Visualize e baixe os resultados de todos os seus processamentos anteriores.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/bureau-config">
            <Card className="cursor-pointer hover:border-primary transition-colors h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <Shield className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <CardTitle>Configuração de Bureau</CardTitle>
                    <CardDescription>Enriquecimento de dados</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {bureauConfig?.bureauEnabled
                    ? "✓ Bureau ativado - Scores enriquecidos com Serasa/Boa Vista"
                    : "Bureau desativado - Usando apenas dados internos"}
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Estatísticas */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jobs Processados</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{batchStats?.totalJobs || 0}</div>
              <p className="text-xs text-muted-foreground">
                {batchStats?.completedJobs || 0} concluídos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Analisados</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{batchStats?.totalCustomers || 0}</div>
              <p className="text-xs text-muted-foreground">Total processado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scores Gerados</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{batchStats?.totalScores || 0}</div>
              <p className="text-xs text-muted-foreground">
                {batchStats?.excludedCustomers || 0} excluídos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bureau</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bureauConfig?.bureauEnabled ? "Ativo" : "Inativo"}
              </div>
              <p className="text-xs text-muted-foreground">
                {bureauConfig?.bureauEnabled ? (
                  <Link href="/bureau-metrics" className="text-primary hover:underline">
                    Ver métricas →
                  </Link>
                ) : (
                  <Link href="/bureau-config" className="text-primary hover:underline">
                    Ativar bureau →
                  </Link>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Informações Adicionais */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Como Funciona</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-medium mb-1">Faça Upload dos Dados</h4>
                  <p className="text-sm text-muted-foreground">
                    Envie um arquivo CSV/Excel com o histórico de compras e pagamentos dos seus
                    clientes.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-medium mb-1">Processamento Automático</h4>
                  <p className="text-sm text-muted-foreground">
                    O modelo ML analisa o histórico e gera scores de crédito para cada produto
                    (CARTÃO, CARNÊ, EMPRÉSTIMO PESSOAL).
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-medium mb-1">Baixe os Resultados</h4>
                  <p className="text-sm text-muted-foreground">
                    Receba um CSV com os scores de cada cliente, incluindo dados de bureau se
                    ativado.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Regras de Negócio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-medium mb-1 text-yellow-900 dark:text-yellow-100">
                  ⚠️ Clientes Excluídos
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Clientes com <strong>menos de 3 meses de histórico</strong> ou{" "}
                  <strong>inativos há mais de 8 meses</strong> são automaticamente excluídos do
                  processamento.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium mb-1 text-blue-900 dark:text-blue-100">
                  🔒 Segurança e Isolamento
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Seus dados estão <strong>totalmente isolados</strong> por tenant. Nenhuma outra
                  empresa tem acesso às suas informações.
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-medium mb-1 text-green-900 dark:text-green-100">
                  ✓ Scores por Produto
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  O sistema gera scores específicos para <strong>CARTÃO</strong>,{" "}
                  <strong>CARNÊ</strong> e <strong>EMPRÉSTIMO PESSOAL</strong>.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
