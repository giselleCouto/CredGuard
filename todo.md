# CredGuard - Plataforma SaaS de Auxílio à Decisão de Crédito

## Rebranding CredGuard
- [x] Renomear "Behavior SaaS" para "CredGuard" em todas as páginas
- [x] Adicionar logo CredGuard fornecido pelo usuário
- [x] Atualizar descrições: plataforma de auxílio à decisão (não um banco)
- [x] Atualizar tagline: "Intelligent Credit MLOPs"

## Funcionalidades Principais (Já Implementadas)
- [x] Sistema multitenant
- [x] Gestão de modelos ML
- [x] Predições de risco
- [x] Monitoramento de drift
- [x] Histórico de predições
- [x] Página de detalhes de predição
- [x] Breadcrumbs e navegação

## Novas Funcionalidades - IA Generativa
- [x] Página "IA Generativa" - Scoring com LLMs
- [x] Chatbot inteligente para consultas de crédito
- [x] Sistema de hiperpersonalização de ofertas
- [x] Geração automática de relatórios de risco

## Prevenção de Fraudes
- [x] Página "Prevenção de Fraudes" com IA
- [x] Detecção de anomalias em tempo real
- [x] Score de fraude por transação
- [x] Dashboard de alertas de fraude

## Lista de Usuários e Scores
- [ ] Página "Usuários" com lista completa
- [ ] Score de crédito por tipo de produto
- [ ] Filtros avançados (score, produto, status)
- [ ] Exportação de listas

## Banking as a Service (BaaS)
- [x] Página "BaaS" - Integração para apps não-financeiros
- [x] Casos de uso: Varejo (e-commerce, marketplace)
- [x] Casos de uso: Mobilidade (ride-sharing, delivery)
- [x] APIs REST documentadas
- [x] SDKs para integração

## Conformidade e Regulação
- [x] Página "Conformidade" - Marco Regulatório IA 2025
- [x] Transparência algorítmica
- [x] Auditoria de decisões
- [x] Privacidade e LGPD

## Escalabilidade
- [x] Arquitetura para milhões de requisições
- [x] Cache distribuído
- [x] Processamento assíncrono
- [x] Documentação de infraestrutura

## Componente de Score de Risco
- [x] Criar componente RiskScore reutilizável
- [x] Implementar cores de status (Verde R1-R3, Amarelo R4-R6, Vermelho R7-R10)
- [x] Integrar na tabela de histórico
- [x] Adicionar em outras páginas (Dashboard, Predictions)

## Tooltip de Recomendações
- [x] Substituir RiskScore por RiskScoreWithTooltip na página de histórico
- [x] Substituir RiskScore por RiskScoreWithTooltip na página de detalhes

## Identidade Visual Profissional
- [x] Implementar paleta de cores (Azul Profundo, Verde Tecnológico, cores de status)
- [x] Adicionar fontes Inter e IBM Plex Sans via Google Fonts
- [x] Atualizar variáveis CSS no index.css
- [x] Aplicar hierarquia tipográfica

## Dark Mode
- [x] Habilitar tema switchável no App.tsx
- [x] Criar componente ThemeToggle
- [x] Adicionar toggle no cabeçalho de todas as páginas
- [x] Testar persistência do tema

## Página de Perfil do Usuário
- [x] Criar schema de usuários no banco de dados
- [x] Criar endpoint backend para dados do perfil
- [x] Criar endpoint para histórico de predições do usuário
- [x] Criar página Profile.tsx com dados pessoais
- [x] Adicionar seção de estatísticas (total de predições, scores médios)
- [x] Adicionar tabela de histórico de predições
- [x] Adicionar rota /profile no App.tsx
- [x] Adicionar link para perfil no cabeçalho

## Gráficos na Página de Perfil
- [x] Instalar biblioteca Recharts
- [x] Criar endpoint backend para evolução temporal de scores
- [x] Criar endpoint backend para distribuição de risco
- [x] Implementar gráfico de linha (evolução temporal)
- [x] Implementar gráfico de pizza (distribuição de risco)
- [x] Adicionar cards de gráficos na página Profile

## Filtros nos Gráficos de Perfil
- [x] Atualizar endpoint scoreEvolution para aceitar parâmetro de período
- [x] Atualizar endpoint riskDistribution para aceitar tipo de crédito
- [x] Adicionar seletores de período (7/30/90 dias) na interface
- [x] Adicionar filtro de tipo de crédito (Todos/Cartão/Empréstimo/Carnê)
- [x] Implementar estado local para controlar filtros
- [x] Atualizar queries com parâmetros dinâmicos
