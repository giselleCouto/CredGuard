import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Brain, Users, TrendingUp, AlertTriangle, ArrowLeft, Upload } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import Logo from "@/components/Logo";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function Dashboard() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <Logo size={28} />
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            </div>
            <nav className="flex gap-2">
              <Link href="/batch-upload"><Button variant="ghost">Upload em Lote</Button></Link>
              <Link href="/history"><Button variant="ghost">Histórico</Button></Link>
              <Link href="/profile"><Button variant="ghost">Perfil</Button></Link>
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Breadcrumbs items={[{ label: "Dashboard" }]} />
        <div className="h-6" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Tenants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalTenants || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.activeTenants || 0} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Modelos ML</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalModels || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.productionModels || 0} em produção
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Predições</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalPredictions || 0}</div>
              <p className="text-xs text-muted-foreground">
                Acurácia média: {((stats?.averageAccuracy || 0) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drift Crítico</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {stats?.criticalDriftModels || 0}
              </div>
              <p className="text-xs text-muted-foreground">Modelos com alerta</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>Acesse as principais funcionalidades</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/batch-upload">
                <Button className="w-full" variant="default">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload em Lote de Clientes
                </Button>
              </Link>
              <Link href="/history">
                <Button className="w-full" variant="outline">Ver Histórico de Scores</Button>
              </Link>
              <Link href="/profile">
                <Button className="w-full" variant="outline">Meu Perfil</Button>
              </Link>
              <Link href="/ai-generative">
                <Button className="w-full" variant="outline">IA Generativa</Button>
              </Link>
              <Link href="/fraud-prevention">
                <Button className="w-full" variant="outline">Prevenção de Fraudes</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status do Sistema</CardTitle>
              <CardDescription>Informações de saúde e performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">API</span>
                <span className="text-sm font-medium text-green-600">● Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Banco de Dados</span>
                <span className="text-sm font-medium text-green-600">● Conectado</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Throughput</span>
                <span className="text-sm font-medium">87 req/s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Latência Média</span>
                <span className="text-sm font-medium">&lt; 100ms</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
