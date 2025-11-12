import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, ShoppingCart, Car, Code, Rocket, DollarSign } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { Link } from "wouter";

export default function BankingAsService() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-colors">
                <Logo size={32} />
                <ThemeToggle />
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
            { label: "Banking as a Service" }
          ]} 
        />
        <div className="h-6" />

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Rocket className="h-12 w-12 text-primary" />
            <DollarSign className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Banking as a Service (BaaS)</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Integre serviços financeiros de crédito em apps não-financeiros de varejo, mobilidade e marketplace com APIs escaláveis
          </p>
        </div>

        {/* Casos de Uso */}
        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <Card>
            <CardHeader>
              <ShoppingCart className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Varejo e E-commerce</CardTitle>
              <CardDescription>
                Crédito instantâneo no checkout para aumentar conversão e ticket médio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Crédito no Checkout</p>
                    <p className="text-muted-foreground">Aprovação em menos de 3 segundos durante a compra</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Parcelamento Inteligente</p>
                    <p className="text-muted-foreground">Ofertas personalizadas baseadas no perfil do cliente</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Marketplace Integration</p>
                    <p className="text-muted-foreground">Crédito para vendedores e compradores</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Car className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Mobilidade e Delivery</CardTitle>
              <CardDescription>
                Soluções de crédito para apps de transporte, delivery e logística
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Crédito para Motoristas</p>
                    <p className="text-muted-foreground">Antecipação de recebíveis e capital de giro</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Financiamento de Veículos</p>
                    <p className="text-muted-foreground">Análise de crédito para compra de carros e motos</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Pay Later para Corridas</p>
                    <p className="text-muted-foreground">Passageiros podem pagar depois com crédito pré-aprovado</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* APIs Disponíveis */}
        <Card className="mb-8">
          <CardHeader>
            <Code className="h-8 w-8 text-primary mb-2" />
            <CardTitle>APIs REST Disponíveis</CardTitle>
            <CardDescription>Endpoints prontos para integração em minutos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <code className="text-sm font-mono">POST /api/v1/credit/check</code>
                  <Badge>Scoring</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Consulta de score de crédito em tempo real com análise de risco
                </p>
              </div>

              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <code className="text-sm font-mono">POST /api/v1/credit/approve</code>
                  <Badge>Aprovação</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Aprovação automática de crédito com limite e condições personalizadas
                </p>
              </div>

              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <code className="text-sm font-mono">GET /api/v1/users/:id/score</code>
                  <Badge>Consulta</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Busca de score histórico de um usuário específico
                </p>
              </div>

              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <code className="text-sm font-mono">POST /api/v1/fraud/detect</code>
                  <Badge variant="destructive">Fraude</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Detecção de fraude em tempo real com score de risco
                </p>
              </div>

              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <code className="text-sm font-mono">GET /api/v1/users/list</code>
                  <Badge>Lista</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Lista completa de usuários com scores por tipo de produto
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Escalabilidade */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Arquitetura Escalável</CardTitle>
            <CardDescription>Pronto para milhões de requisições por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <h4 className="font-semibold mb-2">Infraestrutura Cloud</h4>
                <p className="text-sm text-muted-foreground">
                  Deploy em AWS, GCP ou Azure com auto-scaling automático baseado em demanda
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Cache Distribuído</h4>
                <p className="text-sm text-muted-foreground">
                  Redis para cache de scores e respostas frequentes, reduzindo latência para &lt;10ms
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Processamento Assíncrono</h4>
                <p className="text-sm text-muted-foreground">
                  Filas para operações pesadas, garantindo resposta rápida ao usuário final
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Load Balancing</h4>
                <p className="text-sm text-muted-foreground">
                  Distribuição inteligente de carga entre múltiplas instâncias do serviço
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Monitoramento 24/7</h4>
                <p className="text-sm text-muted-foreground">
                  Alertas automáticos para degradação de performance ou indisponibilidade
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">SLA de 99.9%</h4>
                <p className="text-sm text-muted-foreground">
                  Garantia de disponibilidade com redundância geográfica e failover automático
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exemplo de Integração */}
        <Card>
          <CardHeader>
            <CardTitle>Exemplo de Integração</CardTitle>
            <CardDescription>Código pronto para usar em seu app</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`// Exemplo em JavaScript/TypeScript
import axios from 'axios';

const credGuardAPI = axios.create({
  baseURL: 'https://api.credguard.com',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

// Consultar score de crédito
async function checkCreditScore(userId, productType) {
  const response = await credGuardAPI.post('/api/v1/credit/check', {
    user_id: userId,
    product_type: productType, // 'CARTAO', 'EMPRESTIMO_PESSOAL', etc.
    amount: 5000
  });
  
  return response.data;
  // { score: 'R7', probability: 0.85, limit: 3500 }
}

// Aprovar crédito
async function approveCredit(userId, amount) {
  const response = await credGuardAPI.post('/api/v1/credit/approve', {
    user_id: userId,
    amount: amount,
    installments: 12
  });
  
  return response.data;
  // { approved: true, limit: 5000, rate: 2.5 }
}`}
            </pre>
          </CardContent>
        </Card>

        <div className="mt-8 flex gap-3">
          <Link href="/dashboard">
            <Button variant="outline">Voltar ao Dashboard</Button>
          </Link>
          <Link href="/predictions">
            <Button>Testar API</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
