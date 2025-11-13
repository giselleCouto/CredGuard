import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import Logo from "@/components/Logo";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function Models() {
  const { data: models, isLoading } = trpc.models.list.useQuery();

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
            <h1 className="text-2xl font-bold">Modelos ML</h1>
          </div>
        </div>
      </header>
      <main className="container py-8">
        <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Modelos ML" }]} />
        <div className="h-6" />
        <Card>
          <CardHeader>
            <CardTitle>Modelos de Machine Learning</CardTitle>
            <CardDescription>Modelos cadastrados por tenant e tipo de crédito</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo de Crédito</TableHead>
                    <TableHead>Versão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Acurácia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {models?.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell className="font-medium">{model.modelName}</TableCell>
                      <TableCell><Badge variant="outline">{model.product}</Badge></TableCell>
                      <TableCell>{model.version}</TableCell>
                      <TableCell><Badge variant={model.status === "production" ? "default" : "secondary"}>{model.status}</Badge></TableCell>
                      <TableCell>{JSON.parse(model.metrics || '{}').accuracy || 'N/A'}%</TableCell>
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
