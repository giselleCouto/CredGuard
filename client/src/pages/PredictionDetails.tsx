import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { ArrowLeft, Calendar, Building2, CreditCard, TrendingUp, DollarSign } from "lucide-react";

export default function PredictionDetails() {
  const params = useParams();
  const predictionId = params.id ? parseInt(params.id) : 0;
  
  const { data: prediction, isLoading, error } = trpc.predictions.getById.useQuery({ id: predictionId });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando detalhes...</p>
        </div>
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Erro</CardTitle>
            <CardDescription>Predição não encontrada</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/history">
              <Button>Voltar ao Histórico</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRiskColor = (risk: string) => {
    const riskNum = parseInt(risk.replace("R", ""));
    if (riskNum <= 3) return "bg-green-500";
    if (riskNum <= 6) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getRiskLabel = (risk: string) => {
    const riskNum = parseInt(risk.replace("R", ""));
    if (riskNum <= 3) return "Baixo Risco";
    if (riskNum <= 6) return "Risco Moderado";
    return "Alto Risco";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCreditType = (type: string) => {
    const types: Record<string, string> = {
      CARTAO: "Cartão de Crédito",
      EMPRESTIMO_PESSOAL: "Empréstimo Pessoal",
      CARNE: "Carnê",
      FINANCIAMENTO: "Financiamento",
    };
    return types[type] || type;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Link href="/history">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <Logo size={24} />
            <h1 className="text-2xl font-bold">Detalhes da Predição</h1>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Breadcrumbs 
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Histórico", href: "/history" },
            { label: `Predição #${prediction.id}` }
          ]} 
        />
        <div className="h-6" />

        {/* Resumo Principal */}
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classe de Risco</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${getRiskColor(prediction.riskClass)}`} />
                <div className="text-2xl font-bold">{prediction.riskClass}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {getRiskLabel(prediction.riskClass)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Probabilidade</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(prediction.probability / 100).toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Confiança do modelo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Limite Sugerido</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(prediction.recommendedLimit || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Baseado no perfil
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Informações Gerais */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
            <CardDescription>Dados da predição e contexto</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Data da Análise</p>
                <p className="text-sm text-muted-foreground">{formatDate(prediction.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Tenant</p>
                <p className="text-sm text-muted-foreground">ID: {prediction.tenantId}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Tipo de Crédito</p>
                <Badge variant="outline">{formatCreditType(prediction.creditType)}</Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Modelo Utilizado</p>
                <p className="text-sm text-muted-foreground">ID: {prediction.modelId}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados de Entrada */}
        <Card>
          <CardHeader>
            <CardTitle>Dados de Entrada</CardTitle>
            <CardDescription>Informações fornecidas para análise</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {Object.entries(JSON.parse(prediction.inputData as string) as Record<string, any>).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="font-medium text-sm capitalize">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {typeof value === "number" 
                      ? value.toLocaleString("pt-BR") 
                      : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex gap-3">
          <Link href="/history">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Histórico
            </Button>
          </Link>
          <Link href="/predictions">
            <Button>
              Nova Predição
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
