# PROJECT CHECKPOINT — +um (MAISUM)

> Ultima atualizacao: 2026-03-25

## Status Geral

| Item | Status |
|------|--------|
| **Workflow** | Greenfield Full-Stack |
| **Phase atual** | Phase 3 iniciando — infra conectada, pronto para dev |
| **Step atual** | 29 stories scaffolded (~65% code). Supabase Cloud conectado. Placeholders restantes. |

## Documentos do Projeto

| Documento | Status | Path |
|-----------|--------|------|
| Project Brief | Completo v1.0 | `docs/project-brief.md` |
| PRD | Completo v1.0 | `docs/prd.md` |
| Frontend Spec | Completo v1.0 | `docs/front-end-spec.md` |
| Architecture | Completo v1.0 | `docs/fullstack-architecture.md` |

## Workflow Progress

- [x] Phase 0: Environment Bootstrap (projeto ja tem git)
- [x] Phase 1: Discovery & Planning
  - [x] analyst: Project Brief (`docs/project-brief.md`)
  - [x] pm: PRD (`docs/prd.md`)
  - [x] ux-design-expert: Frontend Spec (`docs/front-end-spec.md`)
  - [x] architect: Fullstack Architecture (`docs/fullstack-architecture.md`)
  - [x] po: Validate all artifacts (GO — 58/58 FRs, 11/12 NFRs, 4 obs low)
- [x] Phase 2: Document Sharding (29 stories em 7 epics)
- [ ] Phase 3: Development Cycle

## Decisoes Tomadas

- Stack: Expo + Supabase + Next.js + AbacatePay + Turborepo
- Planos: R$89,90/ano (100 cupons) e R$19,90/mês (10 cupons)
- 3 painéis: App cliente (mobile) + Admin restaurante (web) + Admin +um (web)
- Gamificacao: Indica e Ganha + Avaliacao + Post social
- Cidade inicial: Jequie-BA (multi-cidade ready)
- Design: Sati cria do zero
- Paleta: Primary #FF6B35 (laranja quente), Secondary #1B998B (teal), Accent #FFCB47 (dourado)
- Fonts: Plus Jakarta Sans (headings) + Inter (body)
- Icons: Phosphor Icons (outline/filled)
- Styling: NativeWind (mobile) + Tailwind CSS 4 (web) + shadcn/ui (web components)
- DB: PostgreSQL 15 com RLS, 14 tabelas, ENUMs tipados, HMAC anti-fraude
- Deploy: Supabase Cloud (backend) + Vercel (webs) + Expo EAS (mobile)
- Realtime: Supabase Realtime channels por conversa
- Build APK: Conta Alex (alexaquino / alex.energreenerbr@gmail.com) para builds de teste
- Conta Luan Expo: oluanferreira / projectId b835eb99-de01-4ad3-97f7-bab7ecb3982e (restaurar apos build do Alex)

## Status das Stories

| Story | Titulo | Status | Epic |
|-------|--------|--------|------|
| 1.1 | Monorepo Setup & Tooling | Draft | Epic 1 |
| 1.2 | Supabase Setup & Base Schema | Draft | Epic 1 |
| 1.3 | Auth System with 3 Roles | Draft | Epic 1 |
| 1.4 | Mobile App Shell & Navigation | Draft | Epic 1 |
| 1.5 | Admin Web Shell & Navigation | Draft | Epic 1 |
| 1.6 | Restaurant Web Shell & Navigation | Draft | Epic 1 |
| 2.1 | Restaurant CRUD (Admin +um) | Draft | Epic 2 |
| 2.2 | Restaurant Invite Link & Self-Registration | Draft | Epic 2 |
| 2.3 | Restaurant Profile Management | Draft | Epic 2 |
| 2.4 | Benefit Configuration | Draft | Epic 2 |
| 3.1 | Home Screen with Map | InProgress | Epic 3 |
| 3.2 | Restaurant List & Filters | InProgress | Epic 3 |
| 3.3 | Restaurant Detail Page | InProgress | Epic 3 |
| 4.1 | AbacatePay Integration & Webhook Setup | InProgress | Epic 4 |
| 4.2 | Subscription Plans & Payment Flow | InProgress | Epic 4 |
| 4.3 | Coupon Allocation & Subscription Management | InProgress | Epic 4 |
| 5.1 | QR Code Generation & Display | InProgress | Epic 5 |
| 5.2 | QR Code Validation (Restaurant Side) | InProgress | Epic 5 |
| 5.3 | Coupon History & Status Tracking | InProgress | Epic 5 |
| 6.1 | Real-time Chat Infrastructure | InProgress | Epic 6 |
| 6.2 | Chat UI (Client App) | InProgress | Epic 6 |
| 6.3 | Chat UI (Restaurant Panel) | InProgress | Epic 6 |
| 6.4 | Push Notifications System | InProgress | Epic 6 |
| 7.1 | Review System | InProgress | Epic 7 |
| 7.2 | Refer-a-Friend (Indica e Ganha) | InProgress | Epic 7 |
| 7.3 | Social Media Post Bonus | InProgress | Epic 7 |
| 7.4 | Restaurant Dashboard & Metrics | InProgress | Epic 7 |
| 7.5 | Admin Dashboard & Metrics | InProgress | Epic 7 |
| 7.6 | City Management | InProgress | Epic 7 |

**Totais:** 29 stories (10 Draft, 19 InProgress, 0 Done)

## Ultimo Trabalho Realizado

### Sessao 2026-03-25 — Infrastructure Fixes & Audit

**Auditoria completa do projeto** (Morpheus):
- Verificacao de todos os arquivos, codigo, migrations, .env, git status
- Projeto Supabase Cloud JA existia (pjewtzlrqtomilpivjai) com migrations 001-007 aplicadas
- Mobile .env JA tinha keys reais configuradas

**Fixes criticos aplicados** (@dev):
- Migration 008 `webhook_logs` criada e aplicada no Cloud (tabela faltava para Edge Function)
- `.env.local` criado para admin-web e restaurant-web (NEXT_PUBLIC_SUPABASE_URL + ANON_KEY)
- `app.json` owner corrigido: alexaquino → oluanferreira
- Types gerados do Supabase remoto (924 linhas, 16 tabelas completas)
- `packages/shared/src/types/index.ts` atualizado com re-exports e enum aliases
- Commit: `fix: infrastructure fixes — webhook_logs, Supabase Cloud compat, types gen`
- Push para GitHub (@devops)

**Problemas identificados (pendentes):**
- Mapa placeholder (sem react-native-maps)
- QR Code placeholder (sem react-native-qrcode-svg)
- Social login nao funcional (Google/Apple)
- Push notifications placeholder (sem expo-notifications)
- Realtime chat comentado
- NativeWind nao instalado (usa StyleSheet)
- Zero testes
- Phosphor Icons nao importados (usa emojis)

### Sessao 2026-03-20 — APK Build Setup

**Build APK para teste** (SUCESSO):
- APK gerado com sucesso na conta do Alex (alexaquino)
- Link: https://expo.dev/accounts/alexaquino/projects/maisum/builds/afd29d90-f869-4dc2-a8d1-e56bfba47c1c
- 5 tentativas de build ate sucesso — erros resolvidos:
  1. `main` → `expo-router/entry` (19/03)
  2. `expo-clipboard` faltando (19/03)
  3. `async-storage` v3 → `~2.1.0` (19/03)
  4. `requireCommit` removido do eas.json (19/03)
  5. `.easignore` movido para raiz do monorepo (19/03)
  6. `newArchEnabled` removido do app.json (20/03)
  7. `react-native-screens` 4.11 → ~4.23.0 (20/03 — erro C++ Shared deprecated)
  8. `expo-constants` ~18.0 → ~55.0.9, `expo-linking` ~7.0 → ~55.0.8, `expo-router` ~5.0 → ~55.0.7 (20/03 — Kotlin overrides nothing)
- Dados da conta Luan salvos em memoria para restauracao pos-build

### Sessao 2026-03-19 — Stories 7.1-7.6 Implementation

**Story 7.1 — Review System** (InProgress):
- Tela de avaliacao completa: 5 estrelas 40px (#FFCB47 filled / #E5E7EB empty), campo comentario opcional multiline, CTA "Enviar e ganhar +1 cupom" (#FF6B35), link "Avaliar depois", insert reviews + RPC grant_extra_coupons, tela sucesso com check animation
- Arquivos: `apps/mobile/app/review/[restaurantId].tsx`

**Story 7.2 — Refer-a-Friend** (InProgress):
- Tela Indica e Ganha completa: carrega referral_code do perfil, card com link maisumapp.com/ref/{code} + botao copiar, compartilhar via WhatsApp (Linking.openURL) e Share.share generico, historico de indicacoes (FlatList com nome/status badge Pendente amarelo + Convertido verde/data/+3 cupons badge), stats cards (convidados/convertidos/cupons ganhos)
- Arquivos: `apps/mobile/app/(tabs)/profile/referral.tsx`

**Story 7.3 — Social Media Post Bonus** (InProgress):
- Componente SocialSharePrompt: header "Compartilhe e ganhe +1 cupom!", share text pre-preenchido com @maisumapp, botao compartilhar via Share.share, input link de prova + submit para social_proofs, botao Pular
- Admin social-proofs page: tabela com filtro tabs (Pendentes/Aprovadas/Rejeitadas/Todas), colunas cliente/restaurante/tipo/prova/data/status, botoes aprovar/rejeitar
- Restaurant social-proofs page: mesma funcionalidade filtrada por restaurante
- Arquivos: `apps/mobile/components/organisms/social-share-prompt.tsx`, `apps/admin-web/src/app/(dashboard)/social-proofs/page.tsx`, `apps/restaurant-web/src/app/(dashboard)/social-proofs/page.tsx`

**Story 7.4 — Restaurant Dashboard** (InProgress):
- Dashboard completo: seletor periodo (7d/30d/90d), 4 metric cards coloridos (Cupons Validados orange, Clientes Unicos teal, Nota Media yellow, Total Avaliacoes blue), chart cupons por dia (barras horizontais CSS), ranking top 10 beneficios resgatados, query via supabase.rpc get_restaurant_metrics
- Arquivos: `apps/restaurant-web/src/app/(dashboard)/page.tsx`

**Story 7.5 — Admin Dashboard** (InProgress):
- Dashboard completo: 6 metric cards (Total Usuarios blue, Assinantes green, MRR emerald formato R$, Cupons Resgatados orange, Restaurantes purple, Churn Rate red formato %), chart placeholders para Recharts, secao indicacoes (total + taxa conversao), tabela top 5 restaurantes, filtro por cidade dropdown
- Arquivos: `apps/admin-web/src/app/(dashboard)/page.tsx`

**Story 7.6 — City Management** (InProgress):
- Pagina CRUD cidades completa: tabela com nome/estado/restaurantes count/status badge (Ativa verde / Inativa cinza)/acoes, formulario inline nova cidade (nome + select UF com 27 estados brasileiros), toggle ativar/desativar com confirmacao antes de desativar, contagem de restaurantes por cidade
- Arquivos: `apps/admin-web/src/app/(dashboard)/cities/page.tsx`

### Sessao 2026-03-19 — Stories 6.1-6.4 Implementation

**Story 6.1 — Chat Infrastructure** (InProgress):
- Edge Function `send-push` criada: recebe user_id/title/body/data, busca push_tokens, envia via Expo Push API em batches de 100, remove tokens invalidos (DeviceNotRegistered), retorna success/failure count
- Tabelas conversations/messages ja existem da migration 1.2
- Arquivos: `supabase/functions/send-push/index.ts`

**Story 6.2 — Chat UI (Client App)** (InProgress):
- Lista de conversas: avatar restaurante (foto ou placeholder letra), nome, preview 50 chars, time ago, badge nao lidas, pull-to-refresh, empty state
- Tela conversa individual: header com nome restaurante + back, FlatList de mensagens, bolhas sent (#FF6B35 branco, borderRadius flat bottom-right) e received (#F3F4F6 escuro, flat bottom-left), timestamp, input bar + botao enviar, optimistic update, mark as read, realtime subscription placeholder comentado
- Arquivos: `apps/mobile/app/(tabs)/chat/index.tsx`, `apps/mobile/app/(tabs)/chat/[id].tsx`

**Story 6.3 — Chat UI (Restaurant Panel)** (InProgress):
- Split layout: sidebar 320px com lista conversas + area mensagens flex-1
- Filtros: Todas | Nao respondidas (sender_role=user na ultima msg)
- Cards: avatar cliente, nome, preview, time ago, unread badge, destaque conversa ativa
- Mensagens: bolhas restaurante (direita, orange-500) e cliente (esquerda, white border), timestamps, auto-scroll
- Input: textarea com Enter para enviar (Shift+Enter nova linha), optimistic update, sender_role=restaurant_admin
- Arquivos: `apps/restaurant-web/src/app/(dashboard)/chat/page.tsx`

**Story 6.4 — Push Notifications** (InProgress):
- Tela admin push: formulario titulo (50 chars) + mensagem (200 chars), segmentacao radio (todos usuarios / usuarios cidade / assinantes ativos), dropdown cidade condicional, alcance estimado (query count), botao Enviar com confirmacao, historico placeholder
- Arquivos: `apps/admin-web/src/app/(dashboard)/notifications/page.tsx`

### Sessao 2026-03-19 — Stories 5.1, 5.2, 5.3 Implementation

**Story 5.1 — QR Code Generation & Display** (InProgress):
- Tela QR Code completa: verifica elegibilidade (cupom disponivel + nao usado neste restaurante), timer 15min com countdown MM:SS, cores warning/error, placeholder QR 250x250 com coupon ID truncado, botao Regenerar quando expira, estados: loading, ja usado, sem cupom, QR ativo
- Arquivos: `apps/mobile/app/coupon/[id].tsx`

**Story 5.2 — QR Code Validation (Restaurant Side)** (InProgress):
- Pagina validacao completa: placeholder camera QR, input manual UUID, chamada RPC validate_coupon, overlay sucesso (verde, check) e erro (vermelho, motivo), auto-dismiss 3s, lista "Validados Hoje" com nome do cliente e hora, carrega restaurant_id do admin logado
- Arquivos: `apps/restaurant-web/src/app/(dashboard)/validate/page.tsx`

**Story 5.3 — Coupon History & Status Tracking** (InProgress):
- Tela Meus Cupons completa: header card com progresso (X de Y restantes, barra #FF6B35, extras em #FFCB47), segmented control 3 tabs (Disponiveis/Usados/Expirados), coupon cards com border-left colorido por status, source badges (Indicacao azul, Avaliacao verde, Post roxo), FlatList com RefreshControl, empty states por tab
- Arquivos: `apps/mobile/app/(tabs)/coupons.tsx`



**Story 4.1 — AbacatePay Integration & Webhook Setup** (InProgress):
- Edge Function `handle-payment-webhook` criada com verificacao HMAC, handlers para subscription.paid/cancelled/failed, logging de eventos, allocate_coupons RPC call, push placeholder
- Arquivos: `supabase/functions/handle-payment-webhook/index.ts`

**Story 4.2 — Subscription Plans & Payment Flow** (InProgress):
- Tela de selecao de planos completa: card Anual (R$89,90, 100 cupons, badge "Melhor Valor", "Economize 45%") e card Mensal (R$19,90, 10 cupons)
- Design tokens aplicados: Primary #FF6B35, Accent #FFCB47, Success #22C55E
- Placeholder para checkout AbacatePay (Alert informativo enquanto API key nao esta configurada)
- Arquivos: `apps/mobile/app/plans.tsx`

**Story 4.3 — Coupon Allocation & Subscription Management** (InProgress):
- Tela de gerenciamento de assinatura completa: plan badge, info card (renovacao + cupons disponiveis), historico de pagamentos (ultimos 5), botao cancelar com confirmacao via Alert
- Edge Function `expire-coupons` criada: expira cupons vencidos + subscriptions canceladas apos periodo, combina ambas operacoes no mesmo cron
- Estados: loading, error, sem assinatura (redirect para /plans), assinatura ativa, assinatura cancelada
- Arquivos: `apps/mobile/app/(tabs)/profile/subscription.tsx`, `supabase/functions/expire-coupons/index.ts`

### Sessao 2026-03-19 — Stories 3.1, 3.2, 3.3 Implementation

**Story 3.1 — Home Screen with Map** (InProgress):
- Home screen com top bar (cidade + icones), map placeholder, lista de restaurantes do Supabase
- Cards com nome, cuisine_type, cidade, rating placeholder, badge disponibilidade
- Pull-to-refresh, navegacao para /restaurant/[id]
- Arquivos: `apps/mobile/app/(tabs)/index.tsx`

**Story 3.2 — Restaurant List & Filters** (InProgress):
- SearchBar molecule (pill shape, TextInput) e FilterChips molecule (horizontal scroll, toggle chips)
- Busca por nome, filtro por cuisine_type, sort labels, skeleton loading, empty state
- Arquivos: `apps/mobile/components/molecules/search-bar.tsx`, `apps/mobile/components/molecules/filter-chips.tsx`, `apps/mobile/app/(tabs)/index.tsx`

**Story 3.3 — Restaurant Detail Page** (InProgress):
- Tela completa: header com foto placeholder, nome, rating calculado, availability badge
- Secao beneficio +um com card FFF1EB, regras de horario, calculo isBenefitAvailableNow
- Secao sobre (descricao, endereco, telefone tap-to-call, mini mapa placeholder)
- Secao avaliacoes (ultimas 5, estrelas, comentario, data)
- Bottom CTA fixo: "Usar Cupom" (FF6B35) + botao chat
- Arquivos: `apps/mobile/app/restaurant/[id].tsx`

### Sessao 2026-03-19 — Phase 2 Sharding Completo

**Epic 7 — Reviews, Referrals & Social stories** (Draft):
- Criadas 6 stories para Epic 7: 7.1 (Review System), 7.2 (Referral System), 7.3 (Social Proof), 7.4 (Restaurant Dashboard), 7.5 (Admin Dashboard), 7.6 (City Management)
- 7.1: reviews DDL com UNIQUE(user_id, coupon_id), grant_extra_coupons RPC, StarRating atom, modal bottom sheet, restaurant reviews panel
- 7.2: referrals DDL, referral_code em profiles, deep linking Expo, fluxo webhook subscription.paid → bonus 3 cupons, share sheet nativo
- 7.3: social_proofs DDL com enums, Supabase Storage bucket, share screen, paineis restaurante+admin para aprovar/rejeitar, push notifications
- 7.4: get_restaurant_metrics RPC, DashboardCard organism (packages/ui), Recharts LineChart, top beneficios ranking, periodo 7d/30d/90d
- 7.5: get_admin_metrics RPC, churn rate, 6 metric cards, subscriber growth chart, coupons/day chart, top 5 restaurants, city filter
- 7.6: cities CRUD, toggle ativar/desativar, impacto em restaurantes (cidade inativa oculta), dropdown de cidade no cadastro
- Arquivos: `docs/stories/7.1.review-system.md`, `docs/stories/7.2.referral-system.md`, `docs/stories/7.3.social-proof.md`, `docs/stories/7.4.restaurant-dashboard.md`, `docs/stories/7.5.admin-dashboard.md`, `docs/stories/7.6.city-management.md`
- **Todos os 7 Epics agora possuem stories (29 total)**

### Sessao 2026-03-19 (g)

**Epic 1 — Foundation & Auth stories** (Draft):
- Criadas 5 stories restantes para Epic 1: 1.2 (Supabase Setup), 1.3 (Auth System), 1.4 (Mobile Shell), 1.5 (Admin Web Shell), 1.6 (Restaurant Web Shell)
- 1.2: Schema completo (15 tabelas, 11 ENUMs, indexes, RLS, triggers, RPC functions), seed Jequie-BA, gen types
- 1.3: Auth providers (email, Google, Apple), trigger handle_new_user, RPC promote_to_restaurant_admin, auth utils (packages/shared), refresh token rotation
- 1.4: Expo Router, 4 tabs, placeholder screens, Zustand auth store, Supabase client AsyncStorage, NativeWind, Phosphor Icons
- 1.5: Next.js App Router, dark sidebar (neutral-900, 256px), 6 links admin, middleware super_admin, packages/ui (Button/Input/Card/Table)
- 1.6: Mesmo pattern, middleware restaurant_admin, 7 links sidebar, tablet-first responsive (48px+ touch targets)
- Arquivos: `docs/stories/1.2.supabase-setup.md`, `docs/stories/1.3.auth-system.md`, `docs/stories/1.4.mobile-shell.md`, `docs/stories/1.5.admin-web-shell.md`, `docs/stories/1.6.restaurant-web-shell.md`

### Sessao 2026-03-19 (f)

**Epic 6 — Chat & Notifications stories** (Draft):
- Criadas 4 stories para Epic 6: 6.1 (Chat Infrastructure), 6.2 (Chat UI Mobile), 6.3 (Chat UI Restaurant), 6.4 (Push Notifications)
- 6.1: conversations + messages DDL, RLS, Realtime channel, trigger update_conversation_timestamp, indexes, Edge Function send-push
- 6.2: Chat tab + conversa individual, ChatBubble molecule, Zustand chat store, useChat hook, Realtime subscription, paginacao, auto-scroll
- 6.3: Split-view layout, Browser Notification API + som, filtros (todas/nao respondidas/resolvidas)
- 6.4: push_tokens DDL, Expo Notifications config, Edge Function send-push (Expo Push API), deep linking, admin push screen
- Arquivos: `docs/stories/6.1.chat-infrastructure.md`, `docs/stories/6.2.chat-ui-mobile.md`, `docs/stories/6.3.chat-ui-restaurant.md`, `docs/stories/6.4.push-notifications.md`

### Sessao 2026-03-19 — Phase 1 + Phase 2

**Phase 1 — Discovery & Planning** (Completa):
- Frontend Spec: Design System, Atomic Design, telas 3 apps, acessibilidade WCAG AA
- Architecture: 14 tabelas PostgreSQL, RLS, 6 RPC functions, 5 Edge Functions, HMAC anti-fraude
- PO Validation: GO (58/58 FRs, 11/12 NFRs, 4 obs low)
- Arquivos: `docs/front-end-spec.md`, `docs/fullstack-architecture.md`

**Phase 2 — Document Sharding** (Completa):
- 29 stories criadas em 7 epics (6 agents paralelos)
- Cada story com: ACs do PRD, tasks/subtasks, Dev Notes com DDL/RPC/code da architecture
- Epic 1 (6): Foundation & Auth
- Epic 2 (4): Restaurant Management
- Epic 3 (3): Discovery & Client Experience
- Epic 4 (3): Subscriptions & Payments
- Epic 5 (3): Coupon System
- Epic 6 (4): Chat & Notifications
- Epic 7 (6): Reviews, Referrals & Social
- Arquivos: `docs/stories/*.md` (29 files)

### Sessao 2026-03-18

**Phase 1 — Project Brief + PRD** (Completos):
- PRD completo: 58 FRs, 12 NFRs, 7 epics, 21 stories com ACs
- Arquivos: `docs/project-brief.md`, `docs/prd.md`

## Proximos Passos

1. [ ] **Substituir placeholders criticos:** QR Code (react-native-qrcode-svg), Mapa (react-native-maps), Push (expo-notifications)
2. [ ] **Conectar Realtime no chat** — descomentar subscriptions Supabase Realtime
3. [ ] **Social login funcional** — configurar Google OAuth + Apple Sign-In no Supabase
4. [ ] **Testes** — ao menos smoke tests para auth, coupon validation, webhook
5. [ ] Solicitar ao usuario os sites/redes sociais dos restaurantes parceiros
6. [ ] Resolver 4 observacoes low da PO Validation durante implementacao
