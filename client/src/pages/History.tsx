import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowLeft, History as HistoryIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

export default function History() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [tenantId, setTenantId] = useState<string>("");
  const [creditType, setCreditType] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: tenants } = trpc.tenants.list.useQuery();

  const filters = useMemo(() => ({
    page,
    pageSize,
    ...(tenantId && { tenantId: parseInt(tenantId) }),
    ...(creditType && { creditType: creditType as any }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  }), [page, pageSize, tenantId, creditType, startDate, endDate]);

  const { data, isLoading } = trpc.predictions.history.useQuery(filters);

  const handleClearFilters = () => {
    setTenantId("");
    setCreditType("");
    setStartDate("");
    setEndDate("");
    setPage(1);
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

  const formatCurrency = (value: number | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <Logo size={24} />
            <h1 className="text-2xl font-bold">Histórico de Predições</h1>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Hist\u00f3rico de Predi\u00e7\u00f5es" }]} />
        <div className="h-6" />
        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Refine sua busca por período, tenant ou tipo de crédito</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Tenant</Label>
                <Select value={tenantId} onValueChange={(value) => { setTenantId(value); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tenants" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {tenants?.map((t) => (
                      <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Crédito</Label>
                <Select value={creditType} onValueChange={(value) => { setCreditType(value); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="CARTAO">Cartão de Crédito</SelectItem>
                    <SelectItem value="EMPRESTIMO_PESSOAL">Empréstimo Pessoal</SelectItem>
                    <SelectItem value="CARNE">Carnê</SelectItem>
                    <SelectItem value="FINANCIAMENTO">Financiamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                />
              </div>

              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                />
              </div>
            </div>

            <div className="mt-4">
              <Button variant="outline" onClick={handleClearFilters}>
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Resultados */}
        <Card>
          <CardHeader>
            <CardTitle>Resultados</CardTitle>
            <CardDescription>
              {data ? `${data.pagination.total} predições encontradas` : "Carregando..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : data && data.predictions.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Tipo de Crédito</TableHead>
                        <TableHead>Classe de Risco</TableHead>
                        <TableHead>Probabilidade</TableHead>
                        <TableHead>Limite Recomendado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.predictions.map((prediction) => {
                        const tenant = tenants?.find((t) => t.id === prediction.tenantId);
                        return (
                          <TableRow key={prediction.id}>
                            <TableCell className="font-mono text-xs">
                              {prediction.predictionId.substring(0, 12)}...
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(prediction.createdAt)}
                            </TableCell>
                            <TableCell>{tenant?.name || `ID: ${prediction.tenantId}`}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{prediction.creditType}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="default">{prediction.riskClass}</Badge>
                            </TableCell>
                            <TableCell>
                              {(prediction.probability / 100).toFixed(2)}%
                            </TableCell>
                            <TableCell>
                              {formatCurrency(prediction.recommendedLimit)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginação */}
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Página {data.pagination.page} de {data.pagination.totalPages} 
                    {" "}({data.pagination.total} registros)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= data.pagination.totalPages}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <HistoryIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma predição encontrada com os filtros selecionados.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
