import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowLeft, TrendingUp } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useState } from "react";
import { toast } from "sonner";

export default function Predictions() {
  const [tenantId, setTenantId] = useState("");
  const [creditType, setCreditType] = useState("");
  const [renda, setRenda] = useState("");
  const [idade, setIdade] = useState("");
  const [scoreBureau, setScoreBureau] = useState("");

  const { data: tenants } = trpc.tenants.list.useQuery();
  const createPrediction = trpc.predictions.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Predicao realizada! Classe de Risco: ${data.riskClass}`);
      setRenda("");
      setIdade("");
      setScoreBureau("");
    },
    onError: () => toast.error("Erro ao realizar predicao"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !creditType) {
      toast.error("Selecione tenant e tipo de credito");
      return;
    }
    createPrediction.mutate({
      creditType: creditType as any,
      data: { renda: parseFloat(renda), idade: parseInt(idade), score_bureau: parseInt(scoreBureau) },
    });
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
            <ThemeToggle />
            <h1 className="text-2xl font-bold">Predicoes</h1>
          </div>
        </div>
      </header>
      <main className="container py-8">
        <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Predi\u00e7\u00f5es" }]} />
        <div className="h-6" />
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Nova Predicao de Risco</CardTitle>
            <CardDescription>Preencha os dados para analise de credito</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tenant</Label>
                <Select value={tenantId} onValueChange={setTenantId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o tenant" /></SelectTrigger>
                  <SelectContent>{tenants?.map((t) => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Credito</Label>
                <Select value={creditType} onValueChange={setCreditType}>
                  <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CARTAO">Cartao de Credito</SelectItem>
                    <SelectItem value="EMPRESTIMO_PESSOAL">Emprestimo Pessoal</SelectItem>
                    <SelectItem value="CARNE">Carne</SelectItem>
                    <SelectItem value="FINANCIAMENTO">Financiamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Renda (R$)</Label>
                  <Input type="number" value={renda} onChange={(e) => setRenda(e.target.value)} placeholder="5000" />
                </div>
                <div className="space-y-2">
                  <Label>Idade</Label>
                  <Input type="number" value={idade} onChange={(e) => setIdade(e.target.value)} placeholder="35" />
                </div>
                <div className="space-y-2">
                  <Label>Score Bureau</Label>
                  <Input type="number" value={scoreBureau} onChange={(e) => setScoreBureau(e.target.value)} placeholder="750" />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createPrediction.isPending}>
                {createPrediction.isPending ? "Processando..." : "Realizar Predicao"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
