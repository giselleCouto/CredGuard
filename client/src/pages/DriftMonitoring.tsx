import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export default function DriftMonitoring() {
  const { data: driftData, isLoading } = trpc.drift.overview.useQuery();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CRITICAL": return "destructive";
      case "MODERATE": return "default";
      default: return "secondary";
    }
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
            <h1 className="text-2xl font-bold">Monitoramento de Drift</h1>
          </div>
        </div>
      </header>
      <main className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Status de Drift dos Modelos</CardTitle>
            <CardDescription>Monitoramento automatico de degradacao de performance</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Drift Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recomendacao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {driftData?.map((item) => (
                    <TableRow key={item.modelId}>
                      <TableCell className="font-medium">{item.modelName}</TableCell>
                      <TableCell>{(item.driftScore * 100).toFixed(2)}%</TableCell>
                      <TableCell><Badge variant={getStatusColor(item.status) as any}>{item.status}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.recommendation}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
