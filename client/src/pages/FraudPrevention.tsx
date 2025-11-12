import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Eye, Lock, TrendingUp, Zap } from "lucide-react";
import { Link } from "wouter";

export default function FraudPrevention() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-colors">
                <Logo size={32} />
                <h1 className="text-2xl font-bold">CredGuard</h1>
              </div>
            </Link>
            <nav className="flex gap-6">
              <Link href="/dashboard"><a className="hover:text-primary transition-colors">Dashboard</a></Link>
              <Link href="/tenants"><a className="hover:text-primary transition-colors">Tenants</a></Link>
              <Link href="/models"><a className="hover:text-primary transition-colors">Modelos</a></Link>
              <Link href="/predictions"><a className="hover:text-primary transition-colors">Predições</a></Link>
              <Link href="/drift"><a className="hover:text-primary transition-colors">Drift</a></Link>
              <Link href="/history"><a className="hover:text-primary transition-colors">Histórico</a></Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Breadcrumbs 
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Prevenção de Fraudes" }
          ]} 
        />
        <div className="h-6" />

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-12 w-12 text-green-600" />
            <AlertTriangle className="h-10 w-10 text-yellow-500" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Prevenção de Fraudes com IA</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Detecção avançada de fraudes e anomalias em tempo real usando machine learning e análise comportamental
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid gap-6 md:grid-cols-4 mb-12">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Detecção</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">98.7%</div>
              <p className="text-xs text-muted-foreground">Fraudes identificadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Falsos Positivos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">0.3%</div>
              <p className="text-xs text-muted-foreground">Taxa muito baixa</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo de Resposta</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">&lt;50ms</div>
              <p className="text-xs text-muted-foreground">Análise em tempo real</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Economia Anual</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">R$ 2.5M</div>
              <p className="text-xs text-muted-foreground">Fraudes evitadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Funcionalidades */}
        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <Card>
            <CardHeader>
              <Eye className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Detecção de Anomalias</CardTitle>
              <CardDescription>
                Identificação automática de padrões suspeitos em transações e aplicações de crédito
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-primary mt-0.5" />
                  <span>Análise comportamental em tempo real</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-primary mt-0.5" />
                  <span>Detecção de padrões atípicos</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-primary mt-0.5" />
                  <span>Alertas automáticos para equipe</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-primary mt-0.5" />
                  <span>Machine learning adaptativo</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Lock className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Score de Fraude</CardTitle>
              <CardDescription>
                Pontuação de risco de fraude para cada transação e aplicação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-primary mt-0.5" />
                  <span>Score de 0-100 para cada operação</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-primary mt-0.5" />
                  <span>Classificação automática de risco</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-primary mt-0.5" />
                  <span>Regras customizáveis por tenant</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-primary mt-0.5" />
                  <span>Integração com sistemas legados</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Tipos de Fraude Detectados */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Tipos de Fraude Detectados</CardTitle>
            <CardDescription>Principais categorias identificadas pelo sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge variant="destructive">Alto Risco</Badge>
                  Identidade Falsa
                </h4>
                <p className="text-sm text-muted-foreground">
                  Documentos falsificados, CPF clonado, fotos manipuladas
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge variant="destructive">Alto Risco</Badge>
                  Aplicações Múltiplas
                </h4>
                <p className="text-sm text-muted-foreground">
                  Mesmo usuário com múltiplas solicitações simultâneas
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge className="bg-yellow-100 text-yellow-800">Médio Risco</Badge>
                  Dados Inconsistentes
                </h4>
                <p className="text-sm text-muted-foreground">
                  Informações contraditórias entre documentos
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge className="bg-yellow-100 text-yellow-800">Médio Risco</Badge>
                  Comportamento Atípico
                </h4>
                <p className="text-sm text-muted-foreground">
                  Padrões de uso fora do perfil histórico
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge variant="outline">Baixo Risco</Badge>
                  Geolocalização Suspeita
                </h4>
                <p className="text-sm text-muted-foreground">
                  Acesso de locais incomuns ou VPN
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge variant="outline">Baixo Risco</Badge>
                  Dispositivo Novo
                </h4>
                <p className="text-sm text-muted-foreground">
                  Primeiro acesso de dispositivo desconhecido
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard de Alertas */}
        <Card>
          <CardHeader>
            <CardTitle>Dashboard de Alertas</CardTitle>
            <CardDescription>Monitoramento em tempo real de fraudes detectadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-red-50 border-red-200">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  <div>
                    <p className="font-semibold">Fraude Crítica Detectada</p>
                    <p className="text-sm text-muted-foreground">Tentativa de aplicação com documento falso - Tenant ID: 1</p>
                  </div>
                </div>
                <Badge variant="destructive">CRÍTICO</Badge>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  <div>
                    <p className="font-semibold">Anomalia Detectada</p>
                    <p className="text-sm text-muted-foreground">Múltiplas aplicações do mesmo IP - Tenant ID: 2</p>
                  </div>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">MÉDIO</Badge>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Eye className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="font-semibold">Monitoramento Ativo</p>
                    <p className="text-sm text-muted-foreground">Comportamento atípico em análise - Tenant ID: 3</p>
                  </div>
                </div>
                <Badge variant="outline">BAIXO</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex gap-3">
          <Link href="/dashboard">
            <Button variant="outline">Voltar ao Dashboard</Button>
          </Link>
          <Link href="/predictions">
            <Button>Fazer Predição</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
