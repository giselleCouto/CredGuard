import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, MessageSquare, Target, Zap, Shield } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { Link } from "wouter";

export default function AIGenerative() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
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
            { label: "IA Generativa" }
          ]} 
        />
        <div className="h-6" />

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="h-12 w-12 text-primary" />
            <Sparkles className="h-10 w-10 text-yellow-500" />
          </div>
          <h1 className="text-4xl font-bold mb-4">IA Generativa para Crédito</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Scoring inteligente com Large Language Models, chatbots para consultas e hiperpersonalização de ofertas de crédito
          </p>
        </div>

        {/* Funcionalidades Principais */}
        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <Card>
            <CardHeader>
              <Brain className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Scoring com LLMs</CardTitle>
              <CardDescription>
                Análise de crédito usando modelos de linguagem avançados para decisões mais precisas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-primary mt-0.5" />
                  <span>Análise de histórico textual</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-primary mt-0.5" />
                  <span>Extração de padrões complexos</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-primary mt-0.5" />
                  <span>Explicabilidade das decisões</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MessageSquare className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Chatbot Inteligente</CardTitle>
              <CardDescription>
                Assistente virtual para consultas de crédito e suporte aos usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-primary mt-0.5" />
                  <span>Consulta de scores em linguagem natural</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-primary mt-0.5" />
                  <span>Recomendações personalizadas</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-primary mt-0.5" />
                  <span>Disponível 24/7</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Target className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Hiperpersonalização</CardTitle>
              <CardDescription>
                Ofertas de crédito customizadas para cada perfil de usuário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-primary mt-0.5" />
                  <span>Análise comportamental avançada</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-primary mt-0.5" />
                  <span>Limites dinâmicos por produto</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-primary mt-0.5" />
                  <span>Taxas personalizadas</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Conformidade */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-8 w-8 text-green-600" />
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                Marco Regulatório IA 2025
              </Badge>
            </div>
            <CardTitle>Conformidade e Transparência</CardTitle>
            <CardDescription>
              Sistema desenvolvido seguindo as diretrizes do marco regulatório da IA no Brasil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">Transparência Algorítmica</h4>
                <p className="text-sm text-muted-foreground">
                  Todas as decisões de crédito são explicáveis e auditáveis, com justificativas claras para cada score gerado.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Privacidade e LGPD</h4>
                <p className="text-sm text-muted-foreground">
                  Proteção total dos dados pessoais com criptografia end-to-end e anonimização quando necessário.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Auditoria de Decisões</h4>
                <p className="text-sm text-muted-foreground">
                  Registro completo de todas as predições com rastreabilidade para auditorias regulatórias.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Não-Discriminação</h4>
                <p className="text-sm text-muted-foreground">
                  Modelos treinados para evitar vieses discriminatórios com monitoramento contínuo de fairness.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Casos de Uso */}
        <Card>
          <CardHeader>
            <CardTitle>Casos de Uso</CardTitle>
            <CardDescription>Aplicações práticas da IA Generativa em crédito</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-semibold mb-1">Análise de Documentos</h4>
                <p className="text-sm text-muted-foreground">
                  Extração automática de informações de contracheques, declarações de imposto de renda e comprovantes de residência usando OCR + LLM.
                </p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-semibold mb-1">Geração de Relatórios</h4>
                <p className="text-sm text-muted-foreground">
                  Criação automática de relatórios de análise de crédito em linguagem natural para equipes de aprovação.
                </p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-semibold mb-1">Detecção de Fraude Semântica</h4>
                <p className="text-sm text-muted-foreground">
                  Identificação de inconsistências narrativas em aplicações de crédito usando análise de linguagem natural.
                </p>
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
