import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Shield, Info, CheckCircle2, XCircle, Loader2, TrendingUp } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import ThemeToggle from "@/components/ThemeToggle";
import { Link } from "wouter";

export default function BureauConfig() {
  const { data: config, isLoading, refetch } = trpc.bureau.getConfig.useQuery();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateMutation = trpc.bureau.setConfig.useMutation({
    onSuccess: (data) => {
      toast.success(
        data.bureauEnabled
          ? "Bureau ativado com sucesso!"
          : "Bureau desativado com sucesso!"
      );
      setIsUpdating(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar configuração: ${error.message}`);
      setIsUpdating(false);
    },
  });

  const handleToggle = async (enabled: boolean) => {
    setIsUpdating(true);
    updateMutation.mutate({ bureauEnabled: enabled });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
            { label: "Configuração de Bureau" },
          ]}
        />

        <div className="mt-6 max-w-4xl mx-auto space-y-6">
          {/* Status Card */}
          <Card className={config?.bureauEnabled ? "border-green-500/50" : "border-border"}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-lg ${
                      config?.bureauEnabled ? "bg-green-500/10" : "bg-muted"
                    }`}
                  >
                    <Shield
                      className={`h-6 w-6 ${
                        config?.bureauEnabled ? "text-green-500" : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <div>
                    <CardTitle>Enriquecimento com Bureaus de Crédito</CardTitle>
                    <CardDescription>
                      Integração com {config?.provider || "API Brasil"}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {config?.bureauEnabled ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-muted-foreground" />
                  )}
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {config?.bureauEnabled ? "Ativado" : "Desativado"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cache: {config?.cacheHours || 24}h
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Label htmlFor="bureau-toggle" className="text-base font-medium cursor-pointer">
                    Ativar enriquecimento automático com bureaus
                  </Label>
                </div>
                <Switch
                  id="bureau-toggle"
                  checked={config?.bureauEnabled || false}
                  onCheckedChange={handleToggle}
                  disabled={isUpdating}
                />
              </div>

              {config?.bureauEnabled && (
                <Alert className="bg-green-500/10 border-green-500/50">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    <strong>Bureau ativado!</strong> Todos os uploads em lote serão enriquecidos
                    automaticamente com dados de Serasa e Boa Vista.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Informações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Como Funciona
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Consulta Automática</h4>
                    <p className="text-sm text-muted-foreground">
                      Durante o processamento em lote, o sistema consulta automaticamente o CPF de
                      cada cliente nos bureaus de crédito (Serasa e Boa Vista).
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Score Híbrido</h4>
                    <p className="text-sm text-muted-foreground">
                      O score final combina <strong>70% do score interno</strong> (baseado no
                      histórico do cliente) + <strong>30% do score do bureau</strong> (Serasa),
                      gerando uma análise mais precisa.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Cache Inteligente</h4>
                    <p className="text-sm text-muted-foreground">
                      As consultas são armazenadas em cache por {config?.cacheHours || 24} horas,
                      evitando consultas duplicadas e reduzindo custos.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Dados Adicionais</h4>
                    <p className="text-sm text-muted-foreground">
                      O CSV de resultados incluirá campos extras: <code>score_serasa</code>,{" "}
                      <code>pendencias</code>, <code>protestos</code> e{" "}
                      <code>bureau_source</code>.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custos e Considerações */}
          <Card>
            <CardHeader>
              <CardTitle>Custos e Considerações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">
                  💰 Modelo de Cobrança
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  A integração com API Brasil tem custo de <strong>R$ 99/mês</strong> para consultas
                  ilimitadas. Quando o bureau está <strong>desativado</strong>, não há custo
                  adicional.
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-medium mb-2 text-yellow-900 dark:text-yellow-100">
                  ⚠️ Importante
                </h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
                  <li>O token da API Brasil deve ser configurado nas variáveis de ambiente</li>
                  <li>Consultas com erro ou timeout não são cobradas</li>
                  <li>O cache reduz significativamente o número de consultas</li>
                  <li>
                    Você pode ativar/desativar a qualquer momento sem perder configurações
                  </li>
                </ul>
              </div>
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
