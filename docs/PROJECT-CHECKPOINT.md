# PROJECT CHECKPOINT — +um (MAISUM)

> Ultima atualizacao: 2026-03-26

## Status Geral

| Item | Status |
|------|--------|
| **Workflow** | Greenfield Full-Stack |
| **Phase atual** | Phase 3 DONE — Integration + Deploy LIVE. Pre-launch. |
| **Step atual** | 16 commits. Admin + Restaurant webs deployed. Cardapio +um com regras por prato + Dashboards Recharts implementados e live. Falta: seed restaurantes reais + build APK + teste e2e. |

## Documentos do Projeto

| Documento | Status | Path |
|-----------|--------|------|
| Project Brief | Completo v1.0 | `docs/project-brief.md` |
| PRD | Completo v1.0 | `docs/prd.md` |
| Frontend Spec | Completo v1.0 | `docs/front-end-spec.md` |
| Architecture | Completo v1.0 | `docs/fullstack-architecture.md` |
| Brand Positioning | Completo v1.0 | `docs/brand/01-positioning-strategy.md` |
| Brand Identity | Completo v1.0 | `docs/brand/02-brand-identity-system.md` |
| Brand Narrative | Completo v1.0 | `docs/brand/03-brand-narrative-manifesto.md` |
| Movement Strategy | Completo v1.0 | `docs/brand/04-movement-strategy.md` |
| Logo Brief | Completo v1.0 | `docs/brand/05-logo-brief.md` |
| Apresentacao Clientes | Completo v1.0 | `docs/brand/06-apresentacao-clientes.md` |
| Apresentacao Restaurantes | Completo v1.0 | `docs/brand/07-apresentacao-restaurantes.md` |
| Build APK Guide | Completo v1.0 | `docs/guides/BUILD-APK-GUIDE.md` |

## Workflow Progress

- [x] Phase 0: Environment Bootstrap (projeto ja tem git)
- [x] Phase 1: Discovery & Planning
  - [x] analyst: Project Brief (`docs/project-brief.md`)
  - [x] pm: PRD (`docs/prd.md`)
  - [x] ux-design-expert: Frontend Spec (`docs/front-end-spec.md`)
  - [x] architect: Fullstack Architecture (`docs/fullstack-architecture.md`)
  - [x] po: Validate all artifacts (GO — 58/58 FRs, 11/12 NFRs, 4 obs low)
- [x] Phase 2: Document Sharding (29 stories em 7 epics)
- [x] Phase 3: Development Cycle (implementacao completa + deploy VPS)

## Decisoes Tomadas

- Stack: Expo + Supabase + Next.js + AbacatePay + Turborepo
- Planos: R$89,90/ano (100 cupons) e R$19,90/mes (10 cupons)
- 3 paineis: App cliente (mobile) + Admin restaurante (web) + Admin +um (web)
- Gamificacao: Indica e Ganha + Avaliacao + Post social
- Cidade inicial: Jequie-BA (multi-cidade ready)
- Paleta: Primary #FF6B35, Secondary #1B998B, Accent #FFCB47
- Fonts: Plus Jakarta Sans (headings) + Inter (body)
- Icons: Phosphor Icons (outline/filled)
- DB: PostgreSQL 15 com RLS, 16 tabelas (+webhook_logs), ENUMs tipados, HMAC anti-fraude
- Pagamento: AbacatePay (sandbox mode), API key server-side via Edge Function
- Deploy: VPS Hostinger (187.77.227.95), Caddy SSL, PM2
- Dominios: admin.appmaisum.com.br (admin), restaurante.appmaisum.com.br (restaurant)
- Auth: Email/senha + Google OAuth (Supabase), redirect URL configurada
- Super admin: luanferreira.emp@gmail.com (role super_admin)
- Edge Functions: create-checkout, handle-payment-webhook, expire-coupons, send-push (4 deployed)
- Benefits: regras per-benefit (benefit_id FK), foto, preco, promo_description (migration 010)
- Dashboards: Recharts (BarChart, AreaChart, PieChart) — admin + restaurant
- Build APK: Conta Luan (oluanferreira / projectId b835eb99-de01-4ad3-97f7-bab7ecb3982e)

## Ambiente Configurado

- Supabase Cloud: pjewtzlrqtomilpivjai (maisum-app, South America Sao Paulo)
- 10 migrations aplicadas (001-008 + webhook_logs_index + enhance_benefits)
- VPS: 187.77.227.95 (PM2: maisum-admin porta 3000, maisum-restaurant porta 3001)
- Caddy SSL: admin.appmaisum.com.br → :3000, restaurante.appmaisum.com.br → :3001
- GitHub: oluanferreira/maisum (main branch)
- Supabase secrets: ABACATEPAY_WEBHOOK_SECRET, ABACATEPAY_API_KEY
- Storage buckets: restaurant-photos (public), social-proofs (authenticated)
- Seed data: Jequie-BA + restaurante teste "Cantina do Sertao"

## Status das Stories

| Story | Titulo | Status | Epic |
|-------|--------|--------|------|
| 1.1 | Monorepo Setup & Tooling | Done | Epic 1 |
| 1.2 | Supabase Setup & Base Schema | Done | Epic 1 |
| 1.3 | Auth System with 3 Roles | Done | Epic 1 |
| 1.4 | Mobile App Shell & Navigation | Done | Epic 1 |
| 1.5 | Admin Web Shell & Navigation | Done | Epic 1 |
| 1.6 | Restaurant Web Shell & Navigation | Done | Epic 1 |
| 2.1 | Restaurant CRUD (Admin +um) | Done | Epic 2 |
| 2.2 | Restaurant Invite Link & Self-Registration | Done | Epic 2 |
| 2.3 | Restaurant Profile Management | Done | Epic 2 |
| 2.4 | Benefit Configuration | Done | Epic 2 |
| 3.1 | Home Screen with Map | Done | Epic 3 |
| 3.2 | Restaurant List & Filters | Done | Epic 3 |
| 3.3 | Restaurant Detail Page | Done | Epic 3 |
| 4.1 | AbacatePay Integration & Webhook Setup | Done | Epic 4 |
| 4.2 | Subscription Plans & Payment Flow | Done | Epic 4 |
| 4.3 | Coupon Allocation & Subscription Management | Done | Epic 4 |
| 5.1 | QR Code Generation & Display | Done | Epic 5 |
| 5.2 | QR Code Validation (Restaurant Side) | Done | Epic 5 |
| 5.3 | Coupon History & Status Tracking | Done | Epic 5 |
| 6.1 | Real-time Chat Infrastructure | Done | Epic 6 |
| 6.2 | Chat UI (Client App) | Done | Epic 6 |
| 6.3 | Chat UI (Restaurant Panel) | Done | Epic 6 |
| 6.4 | Push Notifications System | Done | Epic 6 |
| 7.1 | Review System | Done | Epic 7 |
| 7.2 | Refer-a-Friend (Indica e Ganha) | Done | Epic 7 |
| 7.3 | Social Media Post Bonus | Done | Epic 7 |
| 7.4 | Restaurant Dashboard & Metrics | Done | Epic 7 |
| 7.5 | Admin Dashboard & Metrics | Done | Epic 7 |
| 7.6 | City Management | Done | Epic 7 |

**Totais:** 29 stories (0 Draft, 0 InProgress, 29 Done)

## Ultimo Trabalho Realizado

### Sessao 2026-03-26 — Cardapio +um + Dashboards Recharts + Deploy

**Feature: Cadastro de pratos com promocoes e regras por prato** (Implementado + Smith reviewed + Deployed):
- Migration 010: novos campos (photo_url, original_price, promo_description) em benefits + benefit_id FK em benefit_rules + migracao de dados globais → per-benefit + RPC atualizada
- Restaurant-web: reescrita completa da pagina Benefits → "Cardapio +um" com upload de foto, preco, promocao, regras inline por prato, feedback de erros, cleanup de fotos orfas no Storage
- Mobile: tela de restaurante com cards horizontais (foto/emoji + nome + preco + promo + regras + badge disponibilidade), fallback de imagem quebrada, fix bug comparacao horario
- Smith review: 13 findings (2 CRITICAL, 4 HIGH, 4 MEDIUM, 3 LOW) → 8 corrigidos
- Arquivos: `supabase/migrations/20260326000001_enhance_benefits.sql`, `apps/restaurant-web/src/app/(dashboard)/benefits/page.tsx`, `apps/mobile/app/restaurant/[id].tsx`

**Feature: Dashboards com graficos Recharts** (Implementado + Deployed):
- Restaurant dashboard: BarChart cupons/dia + PieChart beneficios resgatados (cores por categoria)
- Admin dashboard: AreaChart crescimento assinantes (30 dias, acumulado, gradient teal) + BarChart cupons/dia
- Cores do design system: #FF6B35 (laranja), #1B998B (teal), #FFCB47 (gold)
- Arquivos: `apps/restaurant-web/src/app/(dashboard)/page.tsx`, `apps/admin-web/src/app/(dashboard)/page.tsx`

**Deploy VPS (live):**
- 3 commits: feat + 2 type fixes (PieChart label, Tooltip formatter)
- Migration aplicada no Supabase Cloud
- Shared types regenerados
- turbo build + PM2 restart — admin.appmaisum.com.br + restaurante.appmaisum.com.br online

### Sessao 2026-03-25 (mega) — 13 commits, Integration + Deploy + Smith reviews

**13 commits pushed nesta sessao:**
1. fix: infrastructure (webhook_logs, types, .env, app.json owner)
2. feat: replace placeholders (QR code real, home screen hero, realtime chat)
3. feat: AbacatePay integration (checkout server-side via Edge Function)
4. fix: Smith round 1 — 14 findings (API key server-side, idempotencia, etc)
5. feat: push notifications (expo-notifications + token registration)
6. feat: social login Google/Apple OAuth + chat throttle
7. fix: Smith round 2 — OAuth redirect, push dedup, deep link validation
8. fix: styled-jsx hoisting for monorepo
9. chore: Vercel removed — deployed on VPS instead
10. fix: admin root redirect to dashboard
11. feat: admin panel (signout, users page, subscriptions page, sidebar)
12. fix: restaurant panel (owner_id bug CRITICAL, reviews page, signout)
13. Various deploy fixes

### Sessao 2026-03-25 — Brand Sprint completo (5 fases + apresentacoes)

**Brand Sprint completo** (6 entregas):
- Fase 1: Posicionamento (Al Ries) — create-category, owned word "acessivel"
- Fase 2: Identidade (Wheeler + Kapferer) — 5 traits, arquetipo O Vizinho, paleta, tipografia
- Fase 3: Narrativa (StoryBrand + Public Narrative) — manifesto, rallying cry
- Fase 3.5: Movimento — growth flywheel, vitality index
- Fase 4: Logo Brief — wordmark tipografico, 4 variacoes
- Fase 5A: Apresentacao Clientes (12 slides) + 5B: Restaurantes (10 slides)

## Proximos Passos

- [ ] **Seed restaurantes reais de Jequie** (aguardando lista do Alex)
- [ ] **Build APK na conta do Luan** (eas build)
- [ ] **Testar fluxo completo end-to-end** (cadastro → assinatura → cupom → QR → validar)
- [ ] AbacatePay sair do sandbox → producao
- [ ] Apple Sign-In (precisa Apple Developer Account)
- [ ] CI/CD (GitHub Actions → VPS auto-deploy)
- [ ] Landing page em appmaisum.com.br
- [ ] Brand Sprint — Imagens pendentes: regenerar slide07 + slide08

## Git Recente

```
b18296f fix: Recharts Tooltip formatter type compatibility
66932c1 fix: PieChart label type error for strict TS build
cd6da3b feat: cardapio +um com regras por prato + dashboards Recharts
eaf56af docs: checkpoint — session complete, 13 commits, deploy live, pre-launch
aefc6cb fix: restaurant panel — owner_id bug, reviews page, signout
```
