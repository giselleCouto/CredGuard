import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { BarChart3, Shield, TrendingUp, Users, Zap, Brain } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header/Navigation */}
      <header className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Behavior KAB SaaS</h1>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link href="/tenants">
                <Button variant="ghost">Tenants</Button>
              </Link>
              <Link href="/models">
                <Button variant="ghost">Modelos</Button>
              </Link>
              <Link href="/predictions">
                <Button variant="ghost">Predições</Button>
              </Link>
              <Link href="/drift">
                <Button variant="ghost">Drift</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-5xl font-bold mb-6 text-foreground">
              Análise de Risco de Crédito com Machine Learning
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Sistema SaaS completo para análise de risco de crédito multitenant com detecção automática de drift e dashboards interativos.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8">
                  Acessar Dashboard
                </Button>
              </Link>
              <Link href="/predictions">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Fazer Predição
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container">
          <h3 className="text-3xl font-bold text-center mb-12 text-foreground">
            Funcionalidades Principais
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Multitenant</CardTitle>
                <CardDescription>
                  Isolamento completo por tenant com schemas dedicados no PostgreSQL
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Brain className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Modelos ML</CardTitle>
                <CardDescription>
                  Gestão completa de modelos de Machine Learning por tipo de crédito
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Análise de Risco</CardTitle>
                <CardDescription>
                  Predições precisas para CARTÃO, EMPRÉSTIMO PESSOAL, CARNÊ e FINANCIAMENTO
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Detecção de Drift</CardTitle>
                <CardDescription>
                  Monitoramento automático de drift com alertas em tempo real
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Dashboards</CardTitle>
                <CardDescription>
                  Visualizações interativas e estatísticas em tempo real
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Alta Performance</CardTitle>
                <CardDescription>
                  87 req/s de throughput com latência menor que 100ms
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">87</div>
              <div className="text-muted-foreground">Requisições/segundo</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">&lt;100ms</div>
              <div className="text-muted-foreground">Latência Média</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">100%</div>
              <div className="text-muted-foreground">Testes Aprovados</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">Monitoramento</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h3 className="text-3xl font-bold mb-4">
            Pronto para começar?
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Acesse o dashboard e explore todas as funcionalidades do sistema.
          </p>
          <Link href="/dashboard">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Ir para Dashboard
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-card">
        <div className="container text-center text-muted-foreground">
          <p>© 2025 Behavior KAB SaaS - Desenvolvido por Giselle Falcão</p>
        </div>
      </footer>
    </div>
  );
}
