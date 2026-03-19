# PROJECT CHECKPOINT — +um (MAISUM)

> Ultima atualizacao: 2026-03-19

## Status Geral

| Item | Status |
|------|--------|
| **Workflow** | Greenfield Full-Stack |
| **Phase atual** | Phase 2 DONE — pronto para Phase 3 |
| **Step atual** | 29 stories Draft → proximo: Phase 3 Development (Epic 1) |

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
- Planos: R$89,90/ano (100 cupons) e R$14,90/mês (10 cupons)
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
| 4.1 | AbacatePay Integration & Webhook Setup | Draft | Epic 4 |
| 4.2 | Subscription Plans & Payment Flow | Draft | Epic 4 |
| 4.3 | Coupon Allocation & Subscription Management | Draft | Epic 4 |
| 5.1 | QR Code Generation & Display | Draft | Epic 5 |
| 5.2 | QR Code Validation (Restaurant Side) | Draft | Epic 5 |
| 5.3 | Coupon History & Status Tracking | Draft | Epic 5 |
| 6.1 | Real-time Chat Infrastructure | Draft | Epic 6 |
| 6.2 | Chat UI (Client App) | Draft | Epic 6 |
| 6.3 | Chat UI (Restaurant Panel) | Draft | Epic 6 |
| 6.4 | Push Notifications System | Draft | Epic 6 |
| 7.1 | Review System | Draft | Epic 7 |
| 7.2 | Refer-a-Friend (Indica e Ganha) | Draft | Epic 7 |
| 7.3 | Social Media Post Bonus | Draft | Epic 7 |
| 7.4 | Restaurant Dashboard & Metrics | Draft | Epic 7 |
| 7.5 | Admin Dashboard & Metrics | Draft | Epic 7 |
| 7.6 | City Management | Draft | Epic 7 |

**Totais:** 29 stories (26 Draft, 3 InProgress, 0 Done)

## Ultimo Trabalho Realizado

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

1. **PO Validation:** Validar stories dos Epics 1-7 (`@po *validate-story-draft`) — 29 stories Draft aguardando validacao
3. **Phase 3:** Development Cycle — comecar pelo Epic 1 (Foundation & Auth)
3. Solicitar ao usuario os sites/redes sociais dos restaurantes parceiros
4. Resolver 4 observacoes low durante implementacao dos epics correspondentes
