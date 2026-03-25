# +um — Product Requirements Document (PRD)

> **Versao:** 1.0
> **Data:** 2026-03-18
> **Autor:** Morgan (PM) + Luan Ferreira
> **Status:** Draft
> **Base:** `docs/project-brief.md` v1.0

---

## 1. Goals and Background Context

### Goals

- Entregar um app mobile (iOS + Android) de beneficios gastronomicos que permita usuarios resgatarem um item adicional gratuito em restaurantes parceiros
- Criar um painel admin para restaurantes com autonomia total sobre configuracao de beneficios, validacao de cupons e comunicacao com clientes
- Criar um painel admin central (+um) para gerenciamento completo da plataforma
- Implementar sistema de assinaturas recorrentes (mensal R$19,90 / anual R$89,90) via AbacatePay
- Lancar em Jequie-BA com arquitetura multi-cidade desde o dia 1
- Atingir 500 assinantes e 30+ restaurantes nos primeiros 6 meses

### Background Context

O mercado brasileiro de beneficios gastronomicos e dominado por um unico player relevante — Duo Gourmet — que cobra caro, foca em fine dining de capitais, e depende fortemente de parceria com Banco Inter. A concorrencia restante e amadora (Compre & Ganhe). Cidades medias e pequenas sao completamente desatendidas.

O +um resolve isso oferecendo um modelo acessivel ("pediu um, recebe +um"), com transparencia radical de precos e restaurantes, autonomia total para o estabelecimento configurar seus beneficios, chat direto restaurante-cliente, e independencia de instituicoes financeiras. O foco inicial em Jequie-BA permite validar o modelo antes de expandir regionalmente.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-18 | 1.0 | PRD inicial criado a partir do Project Brief | Morgan (PM) |

---

## 2. Requirements

### Functional Requirements

**Autenticacao & Usuarios**
- **FR1:** O sistema deve suportar 3 roles de usuario: `user` (cliente), `restaurant_admin` (dono do restaurante) e `super_admin` (admin +um)
- **FR2:** Clientes devem poder se cadastrar via email/senha ou login social (Google, Apple)
- **FR3:** Restaurantes devem poder se cadastrar via link de convite gerado pelo admin +um, criando login/senha proprio
- **FR4:** O sistema deve implementar recuperacao de senha para todos os roles

**Assinaturas & Pagamentos**
- **FR5:** O sistema deve oferecer 2 planos de assinatura: Mensal (R$19,90, 10 cupons) e Anual (R$89,90, 100 cupons)
- **FR6:** Pagamentos devem ser processados via AbacatePay suportando PIX, cartao de credito e boleto
- **FR7:** Assinaturas devem ser recorrentes com renovacao automatica
- **FR8:** O usuario deve poder cancelar sua assinatura a qualquer momento pelo app
- **FR9:** Cupons nao utilizados no mes NAO acumulam para o proximo

**Descoberta de Restaurantes**
- **FR10:** O app deve exibir um mapa com restaurantes parceiros proximos a localizacao do usuario
- **FR11:** O app deve permitir filtrar restaurantes por tipo de cozinha, distancia e beneficio disponivel
- **FR12:** O app deve exibir a pagina de detalhes do restaurante com: fotos, descricao, cardapio do beneficio, horarios de funcionamento, avaliacoes e localizacao no mapa
- **FR13:** O app deve suportar busca textual de restaurantes por nome ou tipo

**Sistema de Cupons**
- **FR14:** Ao assinar, o usuario recebe sua cota de cupons (10/mes ou 100/ano) alocados automaticamente
- **FR15:** O usuario pode usar 1 cupom por restaurante por vez (nao pode usar 2 cupons no mesmo restaurante no mesmo periodo)
- **FR16:** O cupom deve gerar um QR Code unico na tela do app para apresentacao no restaurante
- **FR17:** O QR Code deve conter UUID + assinatura HMAC para prevencao de fraude
- **FR18:** O QR Code deve ter expiracao curta (15 minutos apos geracao) e ser regeneravel
- **FR19:** O restaurante deve validar o cupom via scanner QR (camera) ou digitacao manual de codigo no painel admin
- **FR20:** Apos validacao, o cupom deve ser marcado como "usado" com timestamp e restaurante

**Configuracao do Restaurante**
- **FR21:** O restaurante deve poder configurar quais itens fazem parte do beneficio "+um" (pratos, drinks, sobremesas, combos)
- **FR22:** O restaurante deve poder definir horarios/dias em que o beneficio esta disponivel
- **FR23:** O restaurante deve poder definir limite diario de cupons aceitos
- **FR24:** O restaurante deve poder editar seu perfil (fotos, descricao, endereco, telefone)
- **FR25:** O restaurante deve poder ativar/desativar temporariamente sua participacao

**Chat**
- **FR26:** O app deve permitir chat em tempo real entre cliente e restaurante
- **FR27:** O restaurante deve poder enviar mensagens para clientes que ja interagiram (duvidas, promocoes especiais)
- **FR28:** Mensagens devem ter notificacao push para ambos os lados
- **FR29:** Historico de chat deve ser persistido e paginado

**Avaliacoes**
- **FR30:** Apos usar um cupom, o app deve solicitar avaliacao da experiencia (nota 1-5 + comentario opcional)
- **FR31:** Avaliacoes devem ser exibidas na pagina do restaurante
- **FR32:** O usuario ganha 1 cupom extra por avaliacao enviada (max 10 extras/mes total)

**Indica e Ganha**
- **FR33:** O usuario deve poder gerar link de indicacao unico
- **FR34:** Quando um indicado assina, ambos (indicador e indicado) recebem 3 cupons extras
- **FR35:** Cupons extras de indicacao contam no limite de 10 extras/mes

**Post Social = Cupom**
- **FR36:** Apos usar um cupom, o app deve oferecer opcao "Compartilhar e ganhar +1 cupom"
- **FR37:** O app deve abrir share sheet nativo com texto pre-preenchido mencionando @maisumapp e o @restaurante
- **FR38:** O usuario deve poder submeter prova do post (screenshot ou link) pelo app
- **FR39:** O restaurante ou admin +um deve validar a prova no painel, liberando o cupom extra
- **FR40:** Cupons extras de post social contam no limite de 10 extras/mes

**Painel Admin +um (Super Admin)**
- **FR41:** Dashboard com metricas gerais: usuarios ativos, assinaturas, receita, cupons resgatados
- **FR42:** CRUD completo de restaurantes (cadastrar, editar, ativar/desativar)
- **FR43:** Gerar link de auto-cadastro para restaurantes
- **FR44:** Visualizar e gerenciar usuarios/assinantes
- **FR45:** Visualizar e gerenciar assinaturas e pagamentos
- **FR46:** Validar provas de post social pendentes
- **FR47:** Enviar push notifications segmentadas para usuarios
- **FR48:** Gerenciar cidades/regioes disponíveis

**Painel Admin Restaurante**
- **FR49:** Dashboard com metricas do restaurante: cupons validados, visitas, periodo
- **FR50:** Configurar beneficios (FR21-FR25)
- **FR51:** Validar cupons via QR scanner ou codigo manual
- **FR52:** Chat com clientes (FR26-FR29)
- **FR53:** Visualizar avaliacoes recebidas
- **FR54:** Validar provas de post social dos clientes

**Push Notifications**
- **FR55:** Notificar usuario sobre: novo restaurante parceiro, cupons expirando, indicacao aceita, cupom extra liberado
- **FR56:** Notificar restaurante sobre: novo cupom para validar, nova mensagem no chat, nova avaliacao

**Multi-Cidade**
- **FR57:** O sistema deve suportar multiplas cidades com restaurantes segregados por localizacao
- **FR58:** O usuario deve poder trocar a cidade ativa ou usar geolocalizacao automatica

### Non-Functional Requirements

- **NFR1:** O app deve abrir em menos de 3 segundos em conexao 4G
- **NFR2:** O QR Code do cupom deve renderizar offline (pre-gerado e cacheado localmente)
- **NFR3:** O sistema deve estar em conformidade com a LGPD (consentimento, direito a exclusao, transparencia de dados)
- **NFR4:** Tokens de sessao devem usar refresh rotation para seguranca
- **NFR5:** Edge Functions devem ter rate limiting para prevenir abuso
- **NFR6:** O sistema deve suportar 1.000 usuarios simultaneos sem degradacao perceptivel
- **NFR7:** O chat deve ter latencia < 500ms para entrega de mensagens
- **NFR8:** As imagens de restaurantes devem ser otimizadas e servidas via CDN (Supabase Storage)
- **NFR9:** O app deve funcionar em iOS 15+ e Android 10+
- **NFR10:** Os paineis admin devem funcionar em Chrome, Firefox e Safari (ultimas 2 versoes)
- **NFR11:** O sistema deve ter backup diario automatico do banco de dados
- **NFR12:** Dados sensiveis (senhas, tokens de pagamento) devem ser criptografados at-rest e in-transit

---

## 3. User Interface Design Goals

### Overall UX Vision

Experiencia mobile-first limpa, rapida e intuitiva. O usuario deve conseguir descobrir um restaurante, ver o beneficio e gerar o QR Code em menos de 3 taps desde a home. O tom visual deve ser moderno, convidativo e "foodie" — sem ser elitizado como o Duo Gourmet. Deve transmitir acessibilidade e diversao.

### Key Interaction Paradigms

- **Map-first discovery:** Home com mapa interativo como elemento central, com lista scrollavel abaixo
- **Card-based browsing:** Restaurantes apresentados como cards com foto, nome, tipo, beneficio e distancia
- **Bottom sheet details:** Detalhes do restaurante abrem em bottom sheet (padrao mobile moderno)
- **One-tap coupon:** Gerar QR Code com um unico tap no restaurante selecionado
- **Pull-to-refresh:** Padrao em todas as listas
- **Tab navigation:** 4-5 tabs na bottom bar (Home/Mapa, Meus Cupons, Chat, Perfil)

### Core Screens and Views

**App Cliente (Mobile):**
1. Splash/Onboarding (3 telas de intro)
2. Login / Cadastro
3. Selecao de Plano / Paywall
4. Home (Mapa + Lista de Restaurantes)
5. Detalhes do Restaurante (bottom sheet ou tela cheia)
6. QR Code do Cupom (tela dedicada, alto contraste)
7. Meus Cupons (disponiveis, usados, extras)
8. Chat (lista de conversas + tela de conversa)
9. Avaliar Experiencia (pos-uso do cupom)
10. Compartilhar no Social (share sheet + envio de prova)
11. Indicar Amigos (link + historico)
12. Perfil & Configuracoes
13. Gerenciar Assinatura

**Painel Restaurante (Web):**
1. Login
2. Dashboard (metricas)
3. Configurar Beneficios
4. Validar Cupom (scanner QR)
5. Chat com Clientes
6. Avaliacoes
7. Perfil do Restaurante
8. Validar Posts Sociais

**Painel Admin +um (Web):**
1. Login
2. Dashboard Geral
3. Gerenciar Restaurantes (CRUD + link de cadastro)
4. Gerenciar Usuarios
5. Gerenciar Assinaturas / Pagamentos
6. Push Notifications
7. Validar Posts Sociais
8. Gerenciar Cidades

### Accessibility

WCAG AA — contraste minimo, labels acessiveis, suporte a screen readers.

### Branding

Design sera criado do zero pela Sati (@ux-design-expert). Nenhuma referencia visual pre-existente. Tom: moderno, convidativo, acessivel, divertido. Deve transmitir gastronomia sem ser elitista.

### Target Devices and Platforms

- **App Cliente:** Mobile Only — iOS 15+ e Android 10+ (Expo/React Native)
- **Painel Restaurante:** Web Responsivo (prioridade tablet/mobile para uso no balcao)
- **Painel Admin +um:** Web Desktop (responsivo como bonus)

---

## 4. Technical Assumptions

### Repository Structure: Monorepo

Turborepo monorepo com a seguinte estrutura:

```
maisum/
  apps/
    mobile/          # Expo app (React Native) — app do cliente
    admin-web/       # Next.js — painel admin +um
    restaurant-web/  # Next.js — painel admin restaurante
  packages/
    shared/          # Types TypeScript, validacoes, utils compartilhados
    ui/              # Componentes UI compartilhados entre admin webs
  supabase/
    migrations/      # SQL migrations
    functions/       # Edge Functions (webhooks AbacatePay, validacoes)
    seed.sql         # Dados iniciais
```

### Service Architecture

Serverless-first com Supabase como BaaS (Backend as a Service):

- **Database:** PostgreSQL 15 via Supabase (managed)
- **Auth:** Supabase Auth com 3 roles (user, restaurant_admin, super_admin)
- **Realtime:** Supabase Realtime para chat (WebSocket channels)
- **Storage:** Supabase Storage para fotos de restaurantes e provas de post social
- **Edge Functions:** Supabase Edge Functions (Deno) para webhooks de pagamento, logica de negocios server-side
- **API:** Supabase auto-generated REST API + RPC functions para queries complexas
- **Mobile:** Expo SDK 52+ com Expo Router (file-based routing)
- **Admin Webs:** Next.js 14+ com App Router
- **Pagamentos:** AbacatePay SDK (JavaScript) para assinaturas, PIX, cartao, boleto
- **Maps:** React Native Maps com Google Maps API
- **QR Code:** react-native-qrcode-svg (geracao) + expo-camera (leitura)
- **Push:** Expo Notifications
- **Analytics:** PostHog (event tracking, funnels)

### Testing Requirements

Unit + Integration:
- **Unit:** Vitest para logica de negocios em packages/shared e Edge Functions
- **Integration:** Testes de integracao com Supabase local (supabase start)
- **E2E:** Manual na V1 (automatizacao com Detox planejada para V2)
- **Linting:** ESLint + Prettier em todo o monorepo

### Additional Technical Assumptions

- AbacatePay suporta webhooks para notificar eventos de pagamento (assinatura criada, paga, cancelada, falha)
- Supabase free tier comporta o lancamento inicial (ate 500 MAU, 500MB database, 1GB storage)
- RLS (Row Level Security) sera usado para isolamento de dados por restaurante e por usuario
- Multi-tenancy via RLS no mesmo schema (nao schemas separados por restaurante)
- QR Codes usam UUID v4 + HMAC-SHA256 para assinatura anti-fraude
- Cupons pre-gerados e cacheados localmente para funcionamento offline do QR Code
- Deep linking via Expo para links de indicacao e compartilhamento social
- OTA updates via Expo para patches sem precisar de app store review

---

## 5. Epic List

| Epic | Titulo | Objetivo |
|------|--------|----------|
| **1** | Foundation & Auth | Setup do monorepo, Supabase, auth com 3 roles, schema base, navegacao shell dos 3 apps |
| **2** | Restaurant Management | Painel admin +um para gerenciar restaurantes + painel do restaurante com login, perfil e configuracao de beneficios |
| **3** | Discovery & Client Experience | App do cliente com mapa, listagem, busca, detalhes do restaurante e navegacao completa |
| **4** | Subscriptions & Payments | Integracao AbacatePay, fluxo de assinatura (planos, pagamento, gerenciamento), alocacao de cupons |
| **5** | Coupon System | Geracao de QR Code, validacao pelo restaurante, tracking de uso, anti-fraude, regras de negocio |
| **6** | Chat & Notifications | Chat em tempo real (Supabase Realtime), push notifications para todos os eventos criticos |
| **7** | Reviews, Referrals & Social | Sistema de avaliacoes, Indica e Ganha, post social = cupom extra, dashboards de metricas |

---

## 6. Epic Details

### Epic 1: Foundation & Auth

**Objetivo:** Estabelecer a infraestrutura do monorepo Turborepo, configurar Supabase (auth, database, storage), implementar autenticacao com 3 roles, criar o schema base do banco de dados, e construir os shells de navegacao dos 3 aplicativos (mobile, admin web, restaurant web). Ao final deste epic, os 3 apps devem rodar localmente com auth funcional.

---

#### Story 1.1: Monorepo Setup & Tooling

**As a** developer,
**I want** a properly configured Turborepo monorepo with all 3 apps scaffolded,
**so that** we have a solid foundation for parallel development.

**Acceptance Criteria:**
1. Turborepo monorepo inicializado com `apps/mobile`, `apps/admin-web`, `apps/restaurant-web`, `packages/shared`, `packages/ui`
2. `apps/mobile` e um projeto Expo (SDK 52+) com Expo Router configurado
3. `apps/admin-web` e `apps/restaurant-web` sao projetos Next.js 14+ com App Router
4. `packages/shared` exporta types TypeScript compartilhados
5. `packages/ui` tem setup basico para componentes React compartilhados entre admin webs
6. Scripts `turbo dev`, `turbo build`, `turbo lint` funcionam corretamente
7. ESLint + Prettier configurados no root com configs compartilhadas
8. `.gitignore` configurado para todos os workspaces
9. `tsconfig.json` base com path aliases configurados

---

#### Story 1.2: Supabase Setup & Base Schema

**As a** developer,
**I want** Supabase configured with the foundational database schema,
**so that** all apps can connect and operate on shared data.

**Acceptance Criteria:**
1. Diretorio `supabase/` configurado com `supabase init`
2. Tabelas base criadas via migration: `profiles` (extends auth.users), `restaurants`, `cities`, `coupons`, `subscriptions`
3. Tabela `profiles` inclui: id (FK auth.users), full_name, role (user | restaurant_admin | super_admin), avatar_url, city_id, created_at
4. Tabela `restaurants` inclui: id, name, description, address, city_id, phone, latitude, longitude, photos (array), is_active, created_at
5. Tabela `cities` inclui: id, name, state, is_active
6. RLS policies basicas habilitadas em todas as tabelas
7. Seed com cidade "Jequie-BA" e 1 restaurante de teste
8. `supabase start` roda localmente sem erros
9. `packages/shared` exporta types gerados do Supabase (`supabase gen types`)

---

#### Story 1.3: Auth System with 3 Roles

**As a** user/restaurant/admin,
**I want** to authenticate with role-appropriate access,
**so that** each user type sees only what is relevant to them.

**Acceptance Criteria:**
1. Supabase Auth configurado com email/senha para todos os roles
2. Login social (Google, Apple) configurado para role `user`
3. Trigger `on_auth_user_created` cria registro em `profiles` com role default `user`
4. Endpoint/funcao para promover usuario a `restaurant_admin` (usado pelo admin +um)
5. RLS policies diferenciam acesso por role: user ve apenas seus dados, restaurant_admin ve dados do seu restaurante, super_admin ve tudo
6. `packages/shared` exporta funcoes utilitarias de auth: `getCurrentUser()`, `getUserRole()`, `isAuthenticated()`
7. Recuperacao de senha funcional via Supabase Auth
8. Tokens com refresh rotation configurado

---

#### Story 1.4: Mobile App Shell & Navigation

**As a** client user,
**I want** the mobile app to have a clear navigation structure,
**so that** I can navigate between core sections of the app.

**Acceptance Criteria:**
1. Expo Router configurado com file-based routing
2. Bottom tab navigation com 4 tabs: Home (mapa icon), Cupons (ticket icon), Chat (message icon), Perfil (user icon)
3. Stack navigation dentro de cada tab para sub-telas
4. Telas placeholder criadas para todas as core screens listadas no PRD
5. Splash screen configurada com logo placeholder
6. Safe area handling configurado para iOS e Android
7. Supabase client inicializado e conectado no app
8. Auth state listener configurado (redireciona para login se nao autenticado)
9. Tela de login/cadastro funcional com email/senha e botoes de login social

---

#### Story 1.5: Admin Web Shell & Navigation

**As a** super admin,
**I want** the admin web panel to have navigation and auth,
**so that** I can access the management dashboard.

**Acceptance Criteria:**
1. Next.js App Router com layout de sidebar navigation
2. Sidebar com links: Dashboard, Restaurantes, Usuarios, Assinaturas, Notificacoes, Cidades
3. Paginas placeholder para cada secao
4. Auth middleware que redireciona para login se nao autenticado ou role != super_admin
5. Tela de login funcional
6. Supabase client configurado (SSR + client-side)
7. Layout responsivo basico
8. `packages/ui` com componentes basicos: Button, Input, Card, Table (usados por ambos os admin webs)

---

#### Story 1.6: Restaurant Web Shell & Navigation

**As a** restaurant admin,
**I want** the restaurant panel to have navigation and auth,
**so that** I can access my restaurant's management tools.

**Acceptance Criteria:**
1. Next.js App Router com layout de sidebar navigation
2. Sidebar com links: Dashboard, Beneficios, Validar Cupom, Chat, Avaliacoes, Perfil
3. Paginas placeholder para cada secao
4. Auth middleware que redireciona para login se nao autenticado ou role != restaurant_admin
5. Tela de login funcional com email/senha
6. Supabase client configurado (SSR + client-side)
7. Layout responsivo (prioridade tablet para uso no balcao)
8. Reutiliza componentes de `packages/ui`

---

### Epic 2: Restaurant Management

**Objetivo:** Implementar o gerenciamento completo de restaurantes: o admin +um pode cadastrar restaurantes e gerar links de convite, e o restaurante pode se auto-cadastrar, configurar seu perfil, definir os beneficios oferecidos (itens, horarios, limites) e gerenciar sua presenca na plataforma.

---

#### Story 2.1: Restaurant CRUD (Admin +um)

**As a** super admin,
**I want** to manage restaurants from the admin panel,
**so that** I can onboard and control partner restaurants.

**Acceptance Criteria:**
1. Pagina de listagem de restaurantes com tabela: nome, cidade, status (ativo/inativo), data de cadastro
2. Formulario de cadastro de restaurante: nome, descricao, endereco, cidade, telefone, coordenadas (lat/lng)
3. Upload de fotos do restaurante (ate 5 fotos, Supabase Storage)
4. Edicao de restaurante existente
5. Toggle ativar/desativar restaurante
6. Busca e filtro por cidade e status
7. Paginacao na listagem

---

#### Story 2.2: Restaurant Invite Link & Self-Registration

**As a** super admin,
**I want** to generate invite links for restaurants,
**so that** restaurant owners can self-register on the platform.

**Acceptance Criteria:**
1. Botao "Gerar Link de Cadastro" na pagina de restaurantes do admin
2. Link gerado contem token unico com expiracao de 7 dias
3. Tabela `restaurant_invites` armazena: token, restaurant_id (pre-criado), expires_at, used_at
4. Pagina publica de cadastro do restaurante (acessivel via link)
5. Restaurante preenche: nome do responsavel, email, senha
6. Ao submeter, cria usuario com role `restaurant_admin` e vincula ao restaurante pre-criado
7. Token marcado como usado apos registro
8. Link expirado ou ja usado mostra mensagem apropriada

---

#### Story 2.3: Restaurant Profile Management

**As a** restaurant admin,
**I want** to manage my restaurant's profile,
**so that** clients see accurate and attractive information.

**Acceptance Criteria:**
1. Pagina de perfil no painel do restaurante com todos os campos editaveis
2. Upload/reordenacao de fotos (ate 5, drag-and-drop)
3. Edicao de: nome, descricao, endereco, telefone, horario de funcionamento
4. Preview de como o perfil aparece no app do cliente
5. Salvamento automatico ou botao de salvar com feedback visual
6. Validacao de campos obrigatorios

---

#### Story 2.4: Benefit Configuration

**As a** restaurant admin,
**I want** to configure which items are part of the "+um" benefit,
**so that** I control exactly what clients receive.

**Acceptance Criteria:**
1. Tabela `benefits` criada: id, restaurant_id, name, description, category (prato | drink | sobremesa | combo), is_active
2. Tabela `benefit_rules` criada: id, restaurant_id, available_days (array), available_hours_start, available_hours_end, daily_limit, is_active
3. CRUD de itens do beneficio no painel do restaurante
4. Categorias selecionaveis: Prato, Drink, Sobremesa, Combo
5. Configuracao de regras: dias da semana disponiveis, horario de inicio/fim, limite diario de cupons
6. Toggle para ativar/desativar beneficio individualmente
7. Toggle geral para pausar todos os beneficios temporariamente
8. RLS garante que restaurante so ve/edita seus proprios beneficios

---

### Epic 3: Discovery & Client Experience

**Objetivo:** Construir a experiencia core do app do cliente: descoberta de restaurantes via mapa interativo e lista, pagina de detalhes do restaurante com informacoes completas, busca textual e filtros. O usuario deve encontrar e explorar restaurantes parceiros de forma rapida e intuitiva.

---

#### Story 3.1: Home Screen with Map

**As a** client user,
**I want** to see nearby partner restaurants on a map,
**so that** I can discover places to use my "+um" benefit.

**Acceptance Criteria:**
1. Home screen com mapa interativo ocupando ~50% da tela (React Native Maps + Google Maps)
2. Markers no mapa para cada restaurante ativo na cidade do usuario
3. Mapa centralizado na localizacao atual do usuario (com permissao de localizacao)
4. Se localizacao negada, centraliza na cidade selecionada
5. Tap no marker mostra preview card do restaurante (nome, foto, tipo, distancia)
6. Tap no preview card navega para detalhes do restaurante
7. Lista de restaurantes scrollavel abaixo do mapa (cards)
8. Pull-to-refresh atualiza dados

---

#### Story 3.2: Restaurant List & Filters

**As a** client user,
**I want** to filter and search restaurants,
**so that** I can find exactly what I'm looking for.

**Acceptance Criteria:**
1. Lista de restaurantes em cards: foto principal, nome, tipo de cozinha, beneficio principal, distancia, nota media
2. Barra de busca textual no topo (busca por nome e tipo)
3. Filtros: tipo de cozinha (multi-select), distancia (slider), beneficio disponivel agora (toggle)
4. Ordenacao: mais proximo, melhor avaliado, mais recente
5. Skeleton loading durante carregamento
6. Estado vazio quando nenhum restaurante encontrado ("Nenhum restaurante encontrado nesta area")
7. Paginacao infinita (scroll para carregar mais)

---

#### Story 3.3: Restaurant Detail Page

**As a** client user,
**I want** to see complete information about a restaurant,
**so that** I can decide whether to visit and use my coupon.

**Acceptance Criteria:**
1. Tela de detalhes com: carrossel de fotos, nome, nota media, numero de avaliacoes, tipo de cozinha
2. Secao "Beneficio +um": lista dos itens disponiveis, horarios e dias em que o beneficio esta ativo
3. Secao "Sobre": descricao, endereco, telefone (tap-to-call), horario de funcionamento
4. Mini-mapa com localizacao e botao "Abrir no Maps" (deep link para Google Maps/Apple Maps)
5. Secao de avaliacoes: ultimas 5 avaliacoes com nota, comentario e data
6. Botao fixo no bottom: "Usar Cupom" (se tiver cupom disponivel) ou "Assinar para usar" (se nao assinante)
7. Botao de chat: "Conversar com o restaurante"
8. Indicador visual se beneficio esta disponivel agora (verde) ou fora do horario (cinza)

---

### Epic 4: Subscriptions & Payments

**Objetivo:** Integrar AbacatePay para gerenciar assinaturas recorrentes, implementar o fluxo completo de selecao de plano, pagamento e gerenciamento da assinatura. Ao final deste epic, o usuario pode assinar, pagar (PIX/cartao/boleto), e receber seus cupons automaticamente.

---

#### Story 4.1: AbacatePay Integration & Webhook Setup

**As a** developer,
**I want** AbacatePay configured with webhooks,
**so that** the system can process payments and subscription events.

**Acceptance Criteria:**
1. AbacatePay SDK instalado e configurado em `packages/shared`
2. Edge Function `handle-payment-webhook` criada para receber webhooks do AbacatePay
3. Webhook processa eventos: subscription.created, subscription.paid, subscription.cancelled, subscription.failed
4. Tabela `subscriptions` criada: id, user_id, plan_type (monthly | annual), status (active | cancelled | past_due | expired), abacatepay_subscription_id, current_period_start, current_period_end, created_at
5. Tabela `payments` criada: id, subscription_id, amount, status, payment_method, abacatepay_payment_id, paid_at
6. Webhook atualiza status da subscription e registra payment
7. Validacao de assinatura do webhook (anti-spoofing)
8. Logs de todos os eventos de pagamento para debugging

---

#### Story 4.2: Subscription Plans & Payment Flow

**As a** client user,
**I want** to choose a plan and pay easily,
**so that** I can start using my coupons.

**Acceptance Criteria:**
1. Tela de selecao de plano: card Mensal (R$19,90/mes, 10 cupons) e card Anual (R$89,90/ano, 100 cupons, badge "Melhor valor")
2. Ao selecionar plano, redireciona para checkout do AbacatePay (PIX, cartao, boleto)
3. Apos pagamento confirmado (webhook), app atualiza status automaticamente
4. Tela de sucesso com animacao e contagem de cupons recebidos
5. Se pagamento falhar, tela de erro com opcao de tentar novamente
6. Usuario sem assinatura ativa e redirecionado para tela de planos ao tentar usar funcionalidades premium

---

#### Story 4.3: Coupon Allocation & Subscription Management

**As a** subscribed user,
**I want** my coupons allocated automatically and to manage my subscription,
**so that** I can track my benefits and control my plan.

**Acceptance Criteria:**
1. Apos pagamento confirmado, coupons sao alocados: 10 (mensal) ou 100 (anual) na tabela `coupons`
2. Tabela `coupons`: id, user_id, status (available | used | expired), used_at, restaurant_id (null ate uso), expires_at
3. Para plano mensal: cupons expiram ao fim do periodo (nao acumulam)
4. Para plano anual: cupons disponíveis durante toda a vigencia
5. Tela "Gerenciar Assinatura" no perfil: plano atual, data de renovacao, metodo de pagamento, historico de pagamentos
6. Botao "Cancelar Assinatura" com confirmacao e explicacao do que acontece (acesso ate fim do periodo pago)
7. Ao cancelar, assinatura fica ativa ate o fim do periodo, depois status muda para expired

---

### Epic 5: Coupon System

**Objetivo:** Implementar o fluxo core do produto: geracao de QR Code pelo cliente, validacao pelo restaurante, tracking de uso, regras de negocio (1 por restaurante por vez) e seguranca anti-fraude (HMAC). Este e o coracao do +um.

---

#### Story 5.1: QR Code Generation & Display

**As a** client user,
**I want** to generate a QR code for my coupon,
**so that** the restaurant can validate my "+um" benefit.

**Acceptance Criteria:**
1. Na tela de detalhes do restaurante, botao "Usar Cupom" gera QR Code
2. QR Code contem payload: coupon_id (UUID) + user_id + restaurant_id + timestamp + HMAC-SHA256 signature
3. Tela dedicada de QR Code: alto contraste (fundo branco, QR preto), brilho da tela maximizado automaticamente
4. Timer visivel mostrando tempo restante (15 minutos de validade)
5. Botao "Regenerar" para criar novo QR Code se expirou
6. QR Code pre-gerado e cacheado localmente (funciona offline)
7. Verificacao: usuario tem cupom disponivel E nao tem cupom ativo neste restaurante
8. Se nao tem cupom disponivel, mostra mensagem explicativa

---

#### Story 5.2: QR Code Validation (Restaurant Side)

**As a** restaurant admin,
**I want** to validate customer coupons via QR scanner,
**so that** I can confirm the "+um" benefit.

**Acceptance Criteria:**
1. Pagina "Validar Cupom" no painel do restaurante com camera ativa para scanner QR
2. Alternativa: campo de input para digitar codigo manualmente
3. Ao escanear/digitar, sistema verifica: assinatura HMAC valida, cupom nao expirado, cupom nao usado, restaurante correto
4. Se valido: tela verde com "Cupom Validado!" + nome do cliente + item do beneficio
5. Se invalido: tela vermelha com motivo especifico (expirado, ja usado, restaurante errado, assinatura invalida)
6. Apos validacao, cupom marcado como `used` com timestamp e restaurant_id
7. Historico de cupons validados hoje na mesma pagina
8. Funciona em tablet e smartphone (camera frontal ou traseira)

---

#### Story 5.3: Coupon History & Status Tracking

**As a** client user,
**I want** to see my coupon history,
**so that** I know how many I have and where I used them.

**Acceptance Criteria:**
1. Tab "Cupons" no app mostra 3 secoes: Disponiveis, Usados, Expirados
2. Cupons disponiveis mostram: quantidade restante, restaurantes ainda nao usados
3. Cupons usados mostram: restaurante, data de uso, item resgatado
4. Cupons expirados mostram: quantidade que expirou no ultimo periodo
5. Contador visual de cupons: "X de Y cupons restantes este mes/ano"
6. Indicador de cupons extras (indicacao, avaliacao, post social)
7. Barra de progresso visual do uso mensal

---

### Epic 6: Chat & Notifications

**Objetivo:** Implementar comunicacao em tempo real entre clientes e restaurantes usando Supabase Realtime, e push notifications para todos os eventos criticos da plataforma. O chat e um diferencial competitivo chave — nenhum concorrente oferece.

---

#### Story 6.1: Real-time Chat Infrastructure

**As a** developer,
**I want** the chat infrastructure set up with Supabase Realtime,
**so that** messages are delivered instantly between users and restaurants.

**Acceptance Criteria:**
1. Tabela `conversations` criada: id, user_id, restaurant_id, last_message_at, created_at
2. Tabela `messages` criada: id, conversation_id, sender_id, sender_role, content, is_read, created_at
3. RLS: usuario ve apenas suas conversas, restaurante ve apenas conversas do seu restaurante
4. Supabase Realtime channel configurado por conversa (`conversation:{id}`)
5. Edge Function para enviar push notification ao destinatario quando mensagem recebida
6. Indices otimizados para queries de listagem e paginacao de mensagens
7. Mensagens paginadas (20 por pagina, load more ao scrollar para cima)

---

#### Story 6.2: Chat UI (Client App)

**As a** client user,
**I want** to chat with restaurants directly,
**so that** I can ask questions or confirm availability.

**Acceptance Criteria:**
1. Tab "Chat" lista todas as conversas do usuario, ordenadas por ultima mensagem
2. Badge de mensagens nao lidas na tab e em cada conversa
3. Tela de conversa com: header (nome + foto do restaurante), mensagens (bolhas), input de texto + botao enviar
4. Mensagens aparecem em tempo real (sem refresh)
5. Indicador de "digitando..." (opcional, nice-to-have)
6. Scroll automatico para ultima mensagem ao abrir conversa
7. Iniciar nova conversa a partir da pagina de detalhes do restaurante

---

#### Story 6.3: Chat UI (Restaurant Panel)

**As a** restaurant admin,
**I want** to respond to customer messages,
**so that** I can provide good customer service.

**Acceptance Criteria:**
1. Pagina "Chat" no painel do restaurante lista todas as conversas, ordenadas por ultima mensagem
2. Badge de nao lidas no sidebar e em cada conversa
3. Tela de conversa com: header (nome do cliente), mensagens, input de texto
4. Mensagens em tempo real
5. Indicador de "nova mensagem" com som/notificacao no browser
6. Filtro: todas, nao respondidas, resolvidas

---

#### Story 6.4: Push Notifications System

**As a** user,
**I want** to receive push notifications for important events,
**so that** I don't miss anything relevant.

**Acceptance Criteria:**
1. Expo Notifications configurado para iOS e Android
2. Tabela `push_tokens` criada: id, user_id, token, platform, created_at
3. Token registrado ao fazer login no app, atualizado quando muda
4. Edge Function `send-push` envia notificacao via Expo Push API
5. Notificacoes para cliente: nova mensagem no chat, cupom extra liberado, cupom expirando (24h antes), novo restaurante parceiro
6. Notificacoes para restaurante: novo cupom para validar, nova mensagem no chat, nova avaliacao
7. Deep linking: tap na notificacao abre a tela relevante no app
8. Painel admin +um: tela para enviar push segmentado (todos usuarios, usuarios de uma cidade)

---

### Epic 7: Reviews, Referrals & Social

**Objetivo:** Implementar os 3 mecanismos de engajamento e growth: sistema de avaliacoes pos-uso, programa Indica e Ganha, e compartilhamento social com cupom bonus. Tambem incluir dashboards de metricas para restaurantes e admin +um.

---

#### Story 7.1: Review System

**As a** client user,
**I want** to rate my experience after using a coupon,
**so that** I help other users and earn an extra coupon.

**Acceptance Criteria:**
1. Tabela `reviews` criada: id, user_id, restaurant_id, coupon_id, rating (1-5), comment, created_at
2. Apos validacao de cupom, app mostra prompt "Avaliar experiencia" (pode ser adiado)
3. Tela de avaliacao: 5 estrelas selecionaveis + campo de comentario opcional
4. Ao submeter, usuario ganha 1 cupom extra (respeitando limite de 10 extras/mes)
5. Feedback visual: "Voce ganhou +1 cupom!"
6. Avaliacoes aparecem na pagina do restaurante (nota media + lista)
7. Restaurante ve avaliacoes no painel com nota, comentario e data
8. RLS: usuario pode criar avaliacao, nao pode editar/deletar. Restaurante pode ler, nao pode deletar

---

#### Story 7.2: Refer-a-Friend (Indica e Ganha)

**As a** client user,
**I want** to invite friends and earn extra coupons,
**so that** I get rewarded for spreading the word.

**Acceptance Criteria:**
1. Tabela `referrals` criada: id, referrer_id, referred_id, status (pending | completed), bonus_granted, created_at
2. Tela "Indicar Amigos" no perfil com link de indicacao unico
3. Link usa deep linking (Expo) para abrir app ou app store
4. Quando indicado se cadastra e assina, ambos recebem 3 cupons extras
5. Status muda de pending para completed apos assinatura do indicado
6. Cupons extras respeitam limite de 10 extras/mes
7. Historico de indicacoes: quantos indicados, quantos convertidos, cupons ganhos
8. Share sheet nativo para compartilhar link via WhatsApp, Instagram, etc.

---

#### Story 7.3: Social Media Post Bonus

**As a** client user,
**I want** to earn an extra coupon by sharing on social media,
**so that** I'm rewarded for promoting the restaurant and +um.

**Acceptance Criteria:**
1. Tabela `social_proofs` criada: id, user_id, restaurant_id, coupon_id (cupom usado), proof_type (screenshot | link), proof_url, status (pending | approved | rejected), reviewed_by, created_at
2. Apos usar cupom, botao "Compartilhar e ganhar +1" na tela de sucesso
3. Tap abre share sheet com texto pre-preenchido: "Pedi um, recebi +um! @maisumapp @nomerestaurante"
4. Apos compartilhar, tela para submeter prova (upload de screenshot ou colar link do post)
5. Prova enviada fica com status "pending"
6. Restaurante e admin +um podem ver provas pendentes e aprovar/rejeitar
7. Ao aprovar, usuario recebe 1 cupom extra (respeitando limite de 10 extras/mes)
8. Notificacao push ao usuario quando prova aprovada/rejeitada

---

#### Story 7.4: Restaurant Dashboard & Metrics

**As a** restaurant admin,
**I want** to see metrics about my performance on the platform,
**so that** I understand the value +um brings to my business.

**Acceptance Criteria:**
1. Dashboard no painel do restaurante com metricas do periodo selecionavel (7d, 30d, 90d)
2. Metricas: cupons validados, clientes unicos, nota media, total de avaliacoes
3. Grafico de cupons validados por dia (ultimo periodo)
4. Lista de beneficios mais resgatados (ranking)
5. Dados carregados via queries otimizadas (views ou RPC no Supabase)

---

#### Story 7.5: Admin Dashboard & Metrics

**As a** super admin,
**I want** to see platform-wide metrics,
**so that** I can track the business health of +um.

**Acceptance Criteria:**
1. Dashboard no painel admin +um com metricas globais
2. Metricas: total usuarios, assinantes ativos, MRR, cupons resgatados, restaurantes ativos
3. Grafico de crescimento de assinantes (ultimos 30/90 dias)
4. Grafico de cupons resgatados por dia
5. Top restaurantes por cupons validados
6. Taxa de churn mensal
7. Metricas de indicacao: total de referrals, taxa de conversao
8. Filtro por cidade

---

#### Story 7.6: City Management

**As a** super admin,
**I want** to manage available cities,
**so that** the platform can expand to new regions.

**Acceptance Criteria:**
1. Pagina de gerenciamento de cidades no admin +um
2. CRUD de cidades: nome, estado, status (ativa/inativa)
3. Toggle para ativar/desativar cidade
4. Restaurantes vinculados a cidade inativa nao aparecem no app
5. Dropdown de selecao de cidade no cadastro de restaurante
6. Listagem mostra: nome, estado, quantidade de restaurantes, status

---

## 7. Checklist Results Report

*A ser preenchido apos execucao do pm-checklist.*

---

## 8. Next Steps

### UX Expert Prompt

> @ux-design-expert (Sati): Revise o PRD em `docs/prd.md` e o Project Brief em `docs/project-brief.md`. Crie a especificacao visual completa (front-end-spec) e o Design System do +um (paleta de cores, tipografia, componentes, iconografia). O app e mobile-first (iOS/Android), com 2 paineis web admin. Tom: moderno, convidativo, acessivel, gastronomico sem ser elitista. Target: todas as classes sociais em cidades medias brasileiras.

### Architect Prompt

> @architect: Revise o PRD em `docs/prd.md`, o Project Brief em `docs/project-brief.md` e a frontend spec (quando disponivel). Crie a arquitetura tecnica detalhada (fullstack-architecture) para o +um. Stack definida: Expo/React Native + Supabase + Next.js + AbacatePay + Turborepo monorepo. Foco em: schema PostgreSQL completo com RLS, Edge Functions, integracao AbacatePay (webhooks), Realtime channels para chat, anti-fraude de cupons (HMAC), e estrutura do monorepo.
