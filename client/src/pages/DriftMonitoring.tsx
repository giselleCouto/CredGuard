import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AlertTriangle, TrendingUp, Activity, RefreshCw } from "lucide-react";

export default function DriftMonitoring() {
  const [selectedProduct, setSelectedProduct] = useState<"CARTAO" | "CARNE" | "EMPRESTIMO_PESSOAL">("CARTAO");

  // Queries
  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = trpc.drift.history.useQuery({
    product: selectedProduct,
    limit: 50,
  });

  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = trpc.drift.activeAlerts.useQuery();

  // Mutation
  const detectMutation = trpc.drift.detect.useMutation({
    onSuccess: (result) => {
      if (result.driftDetected) {
        toast.warning(`Drift detectado! PSI: ${result.psi.toFixed(4)}`);
      } else {
        toast.success(`Nenhum drift detectado. PSI: ${result.psi.toFixed(4)}`);
      }
      refetchHistory();
      refetchAlerts();
    },
    onError: (error) => {
      toast.error(`Erro ao detectar drift: ${error.message}`);
    },
  });

  const handleDetectDrift = () => {
    detectMutation.mutate({ product: selectedProduct });
  };

  // Preparar dados para o gráfico
  const chartData = historyData?.map((item: any) => ({
    date: new Date(item.detectedAt).toLocaleDateString("pt-BR", { month: "short", day: "numeric" }),
    psi: item.psi,
    threshold: 0.1, // Linha de threshold
  })) || [];

  // Filtrar alertas do produto selecionado
  const productAlerts = alerts?.filter((alert: any) => alert.product === selectedProduct) || [];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Monitoramento de Drift</h1>
          <p className="text-muted-foreground">
            Acompanhe a estabilidade dos modelos de ML
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <Select value={selectedProduct} onValueChange={(v: any) => setSelectedProduct(v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CARTAO">Cartão</SelectItem>
              <SelectItem value="CARNE">Carnê</SelectItem>
              <SelectItem value="EMPRESTIMO_PESSOAL">Empréstimo Pessoal</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleDetectDrift} disabled={detectMutation.isPending}>
            <RefreshCw className={`h-4 w-4 mr-2 ${detectMutation.isPending ? "animate-spin" : ""}`} />
            Detectar Drift Agora
          </Button>
        </div>
      </div>

      {/* Alertas Ativos */}
      {productAlerts.length > 0 && (
        <Card className="border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Alertas Ativos
            </CardTitle>
            <CardDescription>
              {productAlerts.length} alerta(s) detectado(s) para {selectedProduct}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productAlerts.map((alert: any) => (
                <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Badge variant={alert.severity === "critical" ? "destructive" : "default"}>
                      {alert.severity}
                    </Badge>
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-muted-foreground">
                        PSI: {alert.psi.toFixed(4)} | Detectado em {new Date(alert.detectedAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{alert.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de PSI ao Longo do Tempo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            PSI (Population Stability Index) ao Longo do Tempo
          </CardTitle>
          <CardDescription>
            Valores acima de 0.1 indicam drift significativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <p className="text-center text-muted-foreground py-12">Carregando...</p>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="psi"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="PSI"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="threshold"
                  stroke="#ff7300"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  name="Threshold (0.1)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum dado de drift disponível</p>
              <p className="text-sm text-muted-foreground mt-2">
                Clique em "Detectar Drift Agora" para iniciar o monitoramento
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Drift */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Detecções</CardTitle>
          <CardDescription>
            Últimas 50 detecções de drift para {selectedProduct}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : historyData && historyData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>PSI</TableHead>
                  <TableHead>Drift Detectado</TableHead>
                  <TableHead>Features com Drift</TableHead>
                  <TableHead>Modelo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyData.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {new Date(item.detectedAt).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <span className={item.psi > 0.1 ? "text-orange-500 font-semibold" : ""}>
                        {item.psi.toFixed(4)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.driftDetected ? "destructive" : "secondary"}>
                        {item.driftDetected ? "Sim" : "Não"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.driftedFeatures ? (
                        <div className="flex flex-wrap gap-1">
                          {JSON.parse(item.driftedFeatures).map((feature: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Nenhuma</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.modelVersionId || "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum histórico disponível</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
