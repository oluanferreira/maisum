# +um — Frontend Specification

> **Versao:** 1.0
> **Data:** 2026-03-19
> **Autor:** Sati (@ux-design-expert)
> **Status:** Draft
> **Base:** `docs/prd.md` v1.0, `docs/project-brief.md` v1.0

---

## 1. Overview

### Description

Especificacao visual e de interacao completa para o ecossistema +um: app mobile do cliente (iOS/Android), painel web do restaurante e painel web do admin +um. O design prioriza acessibilidade, rapidez e um tom convidativo — gastronomia democratica, nao elitista.

### User Goal

Permitir que usuarios descubram restaurantes parceiros, resgatem beneficios "+um" via QR Code em ate 3 taps, e se engajem com avaliacoes, indicacoes e compartilhamento social — tudo com uma experiencia fluida e prazerosa.

### Scope

**Includes:**
- Design System completo (tokens, componentes, layouts)
- Especificacao de todas as telas dos 3 apps (mobile + 2 admin webs)
- Padroes de interacao e micro-interacoes
- Comportamento responsivo
- Acessibilidade (WCAG AA)

**Excludes:**
- Implementacao de codigo (fase posterior com @dev)
- Testes E2E (fase posterior com @qa)
- Arquitetura backend (responsabilidade do @architect)

---

## 2. Design System — "+um Design Language"

### 2.1 Brand Personality

| Atributo | Valor | Anti-padrao |
|----------|-------|-------------|
| Tom | Convidativo, caloroso | Elitista, frio |
| Energia | Vibrante, otimista | Agressivo, barulhento |
| Acessibilidade | Popular, democratico | Exclusivo, premium |
| Gastronomia | Foodie casual, prazeroso | Fine dining, formal |
| Linguagem visual | Moderno, limpo, arredondado | Rebuscado, ornamental |

**Metafora central:** "+um" e generosidade — o design deve transmitir abundancia, compartilhamento e alegria de comer bem sem pesar no bolso.

### 2.2 Color Palette

#### Primary Colors

| Token | Hex | Uso | Contraste (branco) |
|-------|-----|-----|---------------------|
| `--color-primary` | `#FF6B35` | CTAs principais, botoes, destaques | 3.1:1 (usar texto escuro) |
| `--color-primary-dark` | `#E05A2B` | Hover/pressed states | 3.8:1 |
| `--color-primary-light` | `#FFF1EB` | Backgrounds suaves, cards highlight | N/A (fundo) |
| `--color-primary-50` | `#FFF8F5` | Background ultra-sutil | N/A (fundo) |

> **Racional:** Laranja quente (#FF6B35) evoca apetite, energia e acessibilidade. E a cor mais associada a comida no design — sem ser o vermelho agressivo de fast food. Transmite "venha, isso e pra voce".

#### Secondary Colors

| Token | Hex | Uso | Contraste (branco) |
|-------|-----|-----|---------------------|
| `--color-secondary` | `#1B998B` | Elementos de confianca, badges, sucesso, links | 4.6:1 AA |
| `--color-secondary-dark` | `#158276` | Hover/pressed | 5.5:1 AA |
| `--color-secondary-light` | `#E6F7F5` | Backgrounds, tags | N/A (fundo) |

> **Racional:** Teal (#1B998B) complementa o laranja com frescor e confianca. Transmite "pode confiar, ta tudo certo". Usado para estados de sucesso, confirmacoes e elementos informativos.

#### Accent Color

| Token | Hex | Uso |
|-------|-----|-----|
| `--color-accent` | `#FFCB47` | Badges de destaque, estrelas de avaliacao, cupom extra, gamificacao |
| `--color-accent-dark` | `#E5B53E` | Contraste para textos sobre accent |

> **Racional:** Dourado quente (#FFCB47) para elementos de recompensa e gamificacao — estrelas, badges "Melhor valor", indicadores de cupom extra. Transmite "voce ganhou algo especial".

#### Semantic Colors

| Token | Hex | Uso |
|-------|-----|-----|
| `--color-success` | `#22C55E` | Cupom validado, acao concluida |
| `--color-error` | `#EF4444` | Erros, cupom invalido, falha de pagamento |
| `--color-warning` | `#F59E0B` | Cupom expirando, atencao necessaria |
| `--color-info` | `#3B82F6` | Dicas, informacoes contextuais |

#### Neutral Colors

| Token | Hex | Uso |
|-------|-----|-----|
| `--color-neutral-900` | `#1A1A2E` | Texto principal (headings) |
| `--color-neutral-800` | `#2D2D44` | Texto secundario (body) |
| `--color-neutral-600` | `#6B7280` | Texto terciario (captions, placeholders) |
| `--color-neutral-400` | `#9CA3AF` | Borders, dividers |
| `--color-neutral-200` | `#E5E7EB` | Borders suaves, separadores |
| `--color-neutral-100` | `#F3F4F6` | Background cards, inputs |
| `--color-neutral-50` | `#F9FAFB` | Background da pagina |
| `--color-white` | `#FFFFFF` | Superficie de cards, modais |

#### Dark Mode (V2)

Dark mode nao esta no escopo da V1. O design system esta preparado com tokens semanticos para facilitar a implementacao futura.

### 2.3 Typography

#### Font Stack

| Uso | Font | Fallback | Peso |
|-----|------|----------|------|
| **Headings** | Plus Jakarta Sans | system-ui, sans-serif | 600, 700 |
| **Body** | Inter | system-ui, sans-serif | 400, 500, 600 |
| **Mono** | JetBrains Mono | monospace | 400 |

> **Racional:**
> - **Plus Jakarta Sans** — geometrica, moderna, com personalidade calorosa. Arredondamentos sutis que combinam com o tom "foodie acessivel". Mais amigavel que Montserrat, mais moderna que Nunito.
> - **Inter** — a body font mais legivel em telas pequenas. Otimizada para UI, excelente em todos os tamanhos. Referencia: foi projetada especificamente para telas de computador.

#### Type Scale

| Token | Size | Weight | Line Height | Uso |
|-------|------|--------|-------------|-----|
| `--font-display` | 32px / 2rem | 700 | 1.2 | Titulos de pagina, hero |
| `--font-h1` | 28px / 1.75rem | 700 | 1.2 | Headers de secao |
| `--font-h2` | 24px / 1.5rem | 600 | 1.3 | Subtitulos |
| `--font-h3` | 20px / 1.25rem | 600 | 1.3 | Card titles, section headers |
| `--font-h4` | 18px / 1.125rem | 600 | 1.4 | Subtitulos menores |
| `--font-body-lg` | 16px / 1rem | 400 | 1.5 | Body principal mobile |
| `--font-body` | 14px / 0.875rem | 400 | 1.5 | Body padrao web |
| `--font-caption` | 12px / 0.75rem | 400 | 1.4 | Captions, labels, metadata |
| `--font-overline` | 11px / 0.6875rem | 600 | 1.4 | Overlines, badges, tags (uppercase) |

> **Nota mobile:** No app mobile, o body padrao e 16px (`--font-body-lg`) para garantir legibilidade. Nos admin webs, 14px (`--font-body`) e suficiente.

### 2.4 Spacing Scale

Base unit: **4px**

| Token | Value | Uso tipico |
|-------|-------|-----------|
| `--space-0` | 0px | Reset |
| `--space-1` | 4px | Inline gaps minimos |
| `--space-2` | 8px | Gap entre icone e texto, padding interno compacto |
| `--space-3` | 12px | Padding interno de chips, badges |
| `--space-4` | 16px | Padding padrao de cards e inputs |
| `--space-5` | 20px | Gap entre elementos relacionados |
| `--space-6` | 24px | Margin entre secoes menores |
| `--space-8` | 32px | Margin entre secoes |
| `--space-10` | 40px | Padding de containers |
| `--space-12` | 48px | Margin entre blocos grandes |
| `--space-16` | 64px | Header heights, espacamento hero |
| `--space-20` | 80px | Section padding vertical |

### 2.5 Border Radius

| Token | Value | Uso |
|-------|-------|-----|
| `--radius-sm` | 6px | Inputs, chips, tags |
| `--radius-md` | 10px | Cards, botoes, dropdowns |
| `--radius-lg` | 16px | Modais, bottom sheets, cards grandes |
| `--radius-xl` | 24px | Cards hero, containers de destaque |
| `--radius-full` | 9999px | Avatares, badges, pills |

> **Racional:** Raios generosos (10-16px padrao) transmitem suavidade e acessibilidade — o oposto de cantos vivos que parecem corporativos.

### 2.6 Shadows & Elevation

| Token | Value | Uso |
|-------|-------|-----|
| `--shadow-sm` | `0 1px 2px rgba(26,26,46,0.06)` | Cards em repouso, inputs |
| `--shadow-md` | `0 4px 12px rgba(26,26,46,0.08)` | Cards hover, dropdowns |
| `--shadow-lg` | `0 8px 24px rgba(26,26,46,0.12)` | Modais, bottom sheets, FABs |
| `--shadow-xl` | `0 16px 48px rgba(26,26,46,0.16)` | Overlays criticos (QR Code full screen) |

### 2.7 Motion & Animation

| Token | Duration | Easing | Uso |
|-------|----------|--------|-----|
| `--duration-fast` | 150ms | ease-out | Hover states, toggles |
| `--duration-normal` | 250ms | ease-in-out | Transicoes de tela, expansoes |
| `--duration-slow` | 400ms | ease-in-out | Bottom sheets, modais |
| `--duration-enter` | 300ms | cubic-bezier(0.4, 0, 0.2, 1) | Entrada de elementos |
| `--duration-exit` | 200ms | cubic-bezier(0.4, 0, 1, 1) | Saida de elementos |

**Principios de animacao:**
- Micro-interacoes em todos os botoes (scale 0.97 no press)
- Bottom sheets entram de baixo com spring animation
- Listas usam staggered fade-in
- QR Code aparece com scale + fade (momento de "ta-da!")
- Skeleton loading em todas as listas (nunca tela vazia)
- Pull-to-refresh com animacao custom (icone do +um girando)

### 2.8 Iconography

| Propriedade | Valor |
|-------------|-------|
| **Estilo** | Outline (padrao), Filled (ativo/selecionado) |
| **Library** | Phosphor Icons (React Native + Web) |
| **Sizes** | 20px (inline), 24px (padrao), 32px (destaque), 48px (empty states) |
| **Stroke** | 1.5px |
| **Color** | Herda do contexto (`currentColor`) |

> **Racional:** Phosphor Icons — library unificada que funciona em React Native e Web, com variantes outline/filled, cobrindo todos os casos do +um. Estilo arredondado combina com o tom do brand.

### 2.9 Illustrations & Empty States

| Contexto | Estilo | Exemplo |
|----------|--------|---------|
| Empty states | Ilustracao flat, tons pasteis do brand | "Nenhum cupom ainda — assine e comece!" |
| Onboarding | Ilustracoes full-color, personagens | 3 telas: descobrir, resgatar, compartilhar |
| Sucesso | Animacao Lottie | Confetti ao validar cupom |
| Erro | Ilustracao simples + texto claro | "Ops, algo deu errado" |

---

## 3. Atomic Design — Component Library

### 3.1 Atoms

#### Button

| Variant | Uso | Background | Text | Border |
|---------|-----|-----------|------|--------|
| `primary` | CTAs principais | `--color-primary` | white | none |
| `secondary` | Acoes secundarias | transparent | `--color-primary` | `--color-primary` |
| `ghost` | Acoes terciarias | transparent | `--color-neutral-800` | none |
| `danger` | Acoes destrutivas | `--color-error` | white | none |
| `success` | Confirmacoes | `--color-success` | white | none |

| Size | Height | Padding H | Font Size | Radius |
|------|--------|-----------|-----------|--------|
| `sm` | 32px | 12px | 12px | `--radius-sm` |
| `md` | 44px | 16px | 14px | `--radius-md` |
| `lg` | 52px | 24px | 16px | `--radius-md` |

**States:** default → hover (opacity 0.9) → pressed (scale 0.97, opacity 0.8) → disabled (opacity 0.5) → loading (spinner inline)

**Accessibility:**
- `role="button"`
- Minimum touch target: 44x44px (mobile)
- Focus ring: 2px `--color-primary` offset 2px
- `aria-disabled` quando desabilitado
- `aria-busy` quando loading

#### Input

| Variant | Uso |
|---------|-----|
| `text` | Campos de texto padrao |
| `password` | Senha com toggle visibilidade |
| `search` | Busca com icone de lupa |
| `textarea` | Comentarios, descricoes |

| State | Border | Background | Label Color |
|-------|--------|-----------|-------------|
| Default | `--color-neutral-300` | `--color-white` | `--color-neutral-600` |
| Focus | `--color-primary` | `--color-white` | `--color-primary` |
| Error | `--color-error` | `--color-white` | `--color-error` |
| Disabled | `--color-neutral-200` | `--color-neutral-100` | `--color-neutral-400` |

**Specs:** Height 48px, padding 16px, radius `--radius-sm`, floating label pattern, helper text abaixo (12px, `--color-neutral-600`)

**Accessibility:**
- `<label>` associado via `htmlFor`/`accessibilityLabel`
- `aria-describedby` para helper/error text
- `aria-invalid` em estado de erro

#### Badge

| Variant | Background | Text |
|---------|-----------|------|
| `default` | `--color-neutral-100` | `--color-neutral-800` |
| `primary` | `--color-primary-light` | `--color-primary-dark` |
| `success` | `--color-secondary-light` | `--color-secondary-dark` |
| `warning` | `#FEF3C7` | `#92400E` |
| `accent` | `#FEF9E7` | `#92640E` |

**Specs:** Height 24px, padding 4px 8px, radius `--radius-full`, font `--font-overline`

#### Avatar

| Size | Dimensions | Font Size |
|------|-----------|-----------|
| `sm` | 32x32 | 12px |
| `md` | 40x40 | 14px |
| `lg` | 56x56 | 20px |
| `xl` | 80x80 | 28px |

**Fallback:** Iniciais do nome sobre `--color-primary-light` com texto `--color-primary`

#### Star Rating

- 5 estrelas, cor `--color-accent` (filled) / `--color-neutral-300` (empty)
- Size: 20px (inline), 32px (input de avaliacao)
- Suporta meia estrela na exibicao
- Touch target 44px no modo input

#### Chip / Tag

| Variant | Uso |
|---------|-----|
| `filter` | Filtros de busca (toggle on/off) |
| `info` | Tags de categoria, tipo de cozinha |
| `removable` | Filtros ativos com botao X |

**Specs:** Height 32px, padding 4px 12px, radius `--radius-full`, gap 8px entre chips

#### Divider

- Horizontal: 1px `--color-neutral-200`, margin vertical `--space-4`
- Com label: texto centralizado, linhas nos lados

#### Skeleton

- Background: `--color-neutral-100`
- Animacao: shimmer left-to-right, `--duration-slow`, loop infinito
- Variantes: text (linhas), card (retangulo), circle (avatar), image (aspect ratio)

### 3.2 Molecules

#### Card — Restaurant Card

```
┌────────────────────────────────────┐
│ [Foto 16:9]                        │
│                                    │
├────────────────────────────────────┤
│ Nome do Restaurante          ★ 4.5 │
│ Italiana · 1.2 km                  │
│ ┌──────────────────────┐           │
│ │ 🎁 Pizza gratis      │           │
│ └──────────────────────┘           │
│         [Disponivel agora] 🟢      │
└────────────────────────────────────┘
```

**Specs:**
- Width: 100% (lista) ou 280px (horizontal scroll)
- Foto: aspect ratio 16:9, radius top `--radius-lg`
- Padding interno: `--space-4`
- Shadow: `--shadow-sm`, hover: `--shadow-md`
- Radius: `--radius-lg`
- Badge de disponibilidade: verde (agora) ou cinza (fora do horario)
- Tag de beneficio: `--color-primary-light` bg, `--color-primary-dark` text

#### Card — Coupon Card

```
┌─────────────────────────────────────┐
│  🎫  Cupom #42                      │
│  Restaurante Tal                    │
│  Disponivel · Expira em 15 dias     │
│                        [Usar →]     │
└─────────────────────────────────────┘
```

**Specs:**
- Border-left: 4px `--color-primary` (disponivel), `--color-neutral-400` (usado), `--color-error` (expirado)
- Height: auto (content-driven)
- Padding: `--space-4`
- Radius: `--radius-md`

#### Form Field

Composicao: Label (top) + Input + Helper Text / Error Message (bottom)

**Specs:**
- Gap entre label e input: `--space-1`
- Gap entre input e helper: `--space-1`
- Label: `--font-caption`, `--color-neutral-600`, uppercase quando overline
- Error: `--font-caption`, `--color-error`, icone alert inline

#### Search Bar

```
┌──────────────────────────────────────┐
│ 🔍  Buscar restaurante...      [✕]  │
└──────────────────────────────────────┘
```

**Specs:**
- Height: 48px
- Background: `--color-neutral-100`
- Radius: `--radius-full`
- Padding: 0 16px
- Icone lupa: 20px, `--color-neutral-400`
- Botao limpar (X): aparece quando tem texto

#### Chat Bubble

| Sender | Alignment | Background | Text |
|--------|-----------|-----------|------|
| User (eu) | Right | `--color-primary` | white |
| Other | Left | `--color-neutral-100` | `--color-neutral-800` |

**Specs:**
- Max width: 75% do container
- Padding: 10px 14px
- Radius: 16px (com canto achatado no lado do remetente)
- Timestamp: `--font-caption`, `--color-neutral-400`, abaixo da bolha
- Read receipt: check duplo azul (similar ao WhatsApp — padrao familiar)

#### Notification Item

```
┌──────────────────────────────────────┐
│ 🔔  Novo restaurante parceiro!       │
│     Pizzaria do Joao agora aceita    │
│     cupons +um.                      │
│                          Há 2 horas  │
└──────────────────────────────────────┘
```

**Specs:**
- Padding: `--space-4`
- Unread: background `--color-primary-50`, dot azul 8px
- Read: background transparent
- Icone: 32px, cor semantica baseada no tipo

#### Map Marker

- Pin custom com icone do tipo de cozinha
- Selecionado: scale 1.3x + shadow + card preview acima
- Cluster: circulo com contagem, cor `--color-primary`

### 3.3 Organisms

#### Bottom Tab Bar (Mobile)

```
┌─────────────────────────────────────────┐
│  🏠 Home    🎫 Cupons   💬 Chat   👤 Perfil │
└─────────────────────────────────────────┘
```

**Specs:**
- Height: 56px + safe area bottom
- Background: `--color-white`
- Shadow: `--shadow-md` (top)
- Icone: 24px, label 10px
- Ativo: `--color-primary` (filled icon + text)
- Inativo: `--color-neutral-400` (outline icon + text)
- Badge de unread: circulo vermelho 8px no icone do Chat

#### Sidebar Navigation (Admin Webs)

```
┌──────────────────┐
│  +um             │
│  ─────────────   │
│  📊 Dashboard    │
│  🍽️ Restaurantes │
│  👥 Usuarios     │
│  💳 Assinaturas  │
│  🔔 Notificacoes │
│  🏙️ Cidades      │
│                  │
│                  │
│  ⚙️ Config       │
│  🚪 Sair         │
└──────────────────┘
```

**Specs:**
- Width: 256px (expanded), 64px (collapsed, icon-only)
- Background: `--color-neutral-900` (dark sidebar)
- Text: `--color-white` opacity 0.7
- Active item: `--color-primary` bg opacity 0.15, text `--color-primary`, border-left 3px
- Hover: bg opacity 0.08
- Collapse toggle: hamburguer no topo
- Mobile: drawer overlay com backdrop

#### Restaurant Detail Header (Mobile)

```
┌──────────────────────────────────────┐
│ [← Back]              [♡] [Share]    │
│                                      │
│ [  Foto Carrossel — swipe  ]         │
│ [  · · ● · ·                ]        │
│                                      │
│ Pizzaria do Joao              ★ 4.5  │
│ Italiana · Jequie, BA · 1.2 km      │
│ 🟢 Aberto agora · Fecha as 22h      │
└──────────────────────────────────────┘
```

**Specs:**
- Carrossel: full width, aspect ratio 4:3
- Dots indicator: 8px, active `--color-primary`
- Botoes back/favorito/share: 40px, bg blur branco translucido
- Header info: padding `--space-4`

#### QR Code Display (Full Screen)

```
┌──────────────────────────────────────┐
│                                      │
│         Seu cupom +um                │
│     Pizzaria do Joao                 │
│                                      │
│       ┌──────────────┐               │
│       │              │               │
│       │   QR CODE    │               │
│       │              │               │
│       └──────────────┘               │
│                                      │
│       ⏱️ 14:32 restantes             │
│                                      │
│       [Regenerar]                    │
│                                      │
│   Apresente ao restaurante           │
└──────────────────────────────────────┘
```

**Specs:**
- Background: `--color-white` puro (maximiza contraste do QR)
- QR Code: 250x250px, centralizado
- Brilho da tela: maximizado automaticamente (API nativa)
- Timer: `--font-h3`, `--color-warning` quando < 5min
- Animacao de entrada: scale 0→1 + fade, `--duration-normal`
- Botao regenerar: `secondary` variant, aparece quando expira
- Screen brightness restaurada ao sair

#### Table (Admin Webs)

| Specs | Valor |
|-------|-------|
| Header bg | `--color-neutral-50` |
| Header text | `--font-caption`, uppercase, `--color-neutral-600` |
| Row height | 52px |
| Row hover | `--color-neutral-50` |
| Border | 1px bottom `--color-neutral-200` |
| Actions column | icones ghost (edit, toggle, delete) |
| Pagination | bottom, 10/25/50 por pagina |

#### Dashboard Card (Admin Webs)

```
┌───────────────────┐
│ Assinantes Ativos  │
│                    │
│    1,247           │
│    ↑ 12.5%         │
│                    │
│ [Mini sparkline]   │
└───────────────────┘
```

**Specs:**
- Padding: `--space-6`
- Radius: `--radius-lg`
- Shadow: `--shadow-sm`
- Valor principal: `--font-display`, `--color-neutral-900`
- Variacao: verde (positivo), vermelho (negativo), `--font-caption`
- Sparkline: 48px height, cor `--color-primary` opacity 0.5

---

## 4. Screen Specifications

### 4.1 App Cliente (Mobile)

#### 4.1.1 Splash & Onboarding

**Splash Screen:**
- Logo "+um" centralizado com animacao fade-in
- Background: gradient sutil `--color-primary` → `--color-primary-dark`
- Duracao: 2s max (enquanto carrega auth state)

**Onboarding (3 telas):**

| Tela | Titulo | Ilustracao | Descricao |
|------|--------|-----------|-----------|
| 1 | "Descubra restaurantes incriveis" | Mapa com pins animados | "Encontre parceiros pertinho de voce com beneficios exclusivos" |
| 2 | "Pediu um, recebe +um" | Prato duplicando com animacao | "Use seus cupons e ganhe um item adicional gratis" |
| 3 | "Compartilhe e ganhe mais" | Grupo de amigos | "Indique amigos, avalie e poste nas redes para ganhar cupons extras" |

**Specs:**
- Page indicator: dots, `--color-primary` ativo
- Skip button: top-right, ghost
- Next button: `primary lg`, bottom
- Ultima tela: botao "Comecar" em vez de "Proximo"

#### 4.1.2 Login & Cadastro

**Layout:**
```
┌──────────────────────────────────┐
│         Logo +um                  │
│    "Bem-vindo de volta"          │
│                                   │
│  [Email                    ]      │
│  [Senha                 👁️ ]      │
│                                   │
│  [     Entrar (primary lg)   ]    │
│                                   │
│  Esqueceu a senha?               │
│                                   │
│  ─── ou continue com ───         │
│                                   │
│  [G Google]    [🍎 Apple]         │
│                                   │
│  Nao tem conta? Cadastre-se      │
└──────────────────────────────────┘
```

**Specs:**
- Logo: 80px, margin-top `--space-16`
- Social login buttons: `secondary` variant, icone + texto
- Link "Cadastre-se": texto `--color-primary`, bold
- Keyboard avoiding view ativo

**Cadastro:**
- Campos: nome completo, email, senha, confirmar senha
- Validacao inline (check verde quando valido)
- Forca da senha: barra colorida (fraca/media/forte)

#### 4.1.3 Selecao de Plano

```
┌──────────────────────────────────┐
│     Escolha seu plano            │
│                                   │
│  ┌─────────────────────────────┐ │
│  │  ⭐ MELHOR VALOR             │ │
│  │  Anual                      │ │
│  │  R$ 89,90/ano               │ │
│  │  100 cupons · R$0,90/cupom  │ │
│  │  ✓ Economize 45%            │ │
│  │        [Assinar]            │ │
│  └─────────────────────────────┘ │
│                                   │
│  ┌─────────────────────────────┐ │
│  │  Mensal                     │ │
│  │  R$ 19,90/mes               │ │
│  │  10 cupons/mes              │ │
│  │        [Assinar]            │ │
│  └─────────────────────────────┘ │
│                                   │
│  Cancele quando quiser.          │
│  Cupons nao acumulam entre meses.│
└──────────────────────────────────┘
```

**Specs:**
- Card anual: border `--color-accent`, badge "Melhor Valor" com bg `--color-accent`
- Card mensal: border `--color-neutral-200`
- Destaque no plano anual (ligeiramente maior, sombra maior)
- Texto de economia: `--color-success`, bold
- Fine print: `--font-caption`, `--color-neutral-600`

#### 4.1.4 Home (Mapa + Lista)

```
┌──────────────────────────────────┐
│ Jequie, BA ▼     [🔍]    [🔔]   │
├──────────────────────────────────┤
│                                   │
│   [        MAPA ~50%           ] │
│   [    markers + localizacao   ] │
│                                   │
├──── ≡ Arraste para expandir ─────┤
│                                   │
│ [🔍 Buscar restaurante...]       │
│ [Italiana] [Japonesa] [Todos ▼]  │
│                                   │
│ ┌────────────────────────────┐   │
│ │ [Foto] Nome         ★ 4.5 │   │
│ │        Italiana · 1.2km    │   │
│ │        🎁 Pizza gratis     │   │
│ └────────────────────────────┘   │
│                                   │
│ ┌────────────────────────────┐   │
│ │ [Foto] Nome 2       ★ 4.2 │   │
│ │        Japonesa · 2.1km    │   │
│ └────────────────────────────┘   │
│                                   │
└──────────────────────────────────┘
│  🏠    🎫    💬    👤            │
└──────────────────────────────────┘
```

**Specs:**
- Mapa: 50% da tela (draggable handle para expandir/colapsar)
- Chips de filtro: horizontal scroll, `--radius-full`
- Cards de restaurante: horizontal na lista, tap navega para detalhes
- Pull-to-refresh: custom (icone +um rotaciona)
- Seletor de cidade: top-left, dropdown
- Badge de notificacoes: ponto vermelho no sino

#### 4.1.5 Detalhes do Restaurante

Abre como **bottom sheet** do mapa (arrasta para full screen) ou **push navigation** da lista.

**Secoes (scroll vertical):**
1. **Header:** Carrossel de fotos + info basica (ver organism)
2. **Beneficio +um:** Card destacado com lista de itens, horarios, status de disponibilidade
3. **Sobre:** Descricao, endereco (tap para Maps), telefone (tap to call), horarios
4. **Mini mapa:** Mapa estatico 150px com pin, botao "Abrir no Maps"
5. **Avaliacoes:** Rating medio + ultimas 5 avaliacoes como cards
6. **CTA fixo:** Botao sticky no bottom

**CTA Bottom Bar (sticky):**
- Assinante com cupom: `[🎫 Usar Cupom]` (primary lg, full width)
- Assinante sem cupom: `[Sem cupons disponiveis]` (disabled)
- Nao assinante: `[Assinar para usar]` (primary lg)
- Botao chat: icone 💬 ao lado direito do CTA

#### 4.1.6 Meus Cupons

```
┌──────────────────────────────────┐
│  Meus Cupons                     │
│                                   │
│  ┌──────────────────────────┐    │
│  │ 7 de 10 cupons restantes │    │
│  │ [████████░░] 70%          │    │
│  │ +2 extras disponiveis     │    │
│  └──────────────────────────┘    │
│                                   │
│  [Disponiveis] [Usados] [Expirados]│
│                                   │
│  ┌──────────────────────────┐    │
│  │ 🎫 Pizzaria do Joao      │    │
│  │    Disponivel             │    │
│  │              [Usar →]     │    │
│  └──────────────────────────┘    │
│  ...                              │
└──────────────────────────────────┘
```

**Specs:**
- Header card: progresso visual, cor `--color-primary` gradient
- Tabs: `Disponiveis` | `Usados` | `Expirados` (segmented control)
- Cards de cupom: ver molecule Coupon Card
- Extras: badge `--color-accent` indicando origem (indicacao, avaliacao, post)

#### 4.1.7 Chat

**Lista de conversas:**
- Avatar restaurante (40px) + nome + ultima mensagem (truncada) + timestamp
- Unread: dot `--color-primary`, nome bold
- Swipe left: arquivar

**Tela de conversa:**
- Header: avatar + nome restaurante + status online (verde)
- Mensagens: chat bubbles (ver molecule)
- Input: campo de texto + botao enviar (icone, `--color-primary`)
- Keyboard avoiding: auto-scroll para ultima mensagem

#### 4.1.8 Perfil & Configuracoes

```
┌──────────────────────────────────┐
│  ┌────┐                          │
│  │ 🧑 │  Luan Ferreira          │
│  └────┘  luan@email.com          │
│          Plano Anual · Ativo     │
│                                   │
│  ─────────────────────────────   │
│  📋 Gerenciar Assinatura         │
│  👥 Indicar Amigos               │
│  🌃 Trocar Cidade                │
│  🔔 Preferencias de Notificacao  │
│  ❓ Ajuda & FAQ                  │
│  📜 Termos e Privacidade         │
│  🚪 Sair                         │
└──────────────────────────────────┘
```

#### 4.1.9 Avaliar Experiencia

Aparece como **modal bottom sheet** apos uso do cupom:

```
┌──────────────────────────────────┐
│  Como foi sua experiencia?       │
│  Pizzaria do Joao                │
│                                   │
│     ☆ ☆ ☆ ☆ ☆                   │
│     Toque para avaliar           │
│                                   │
│  [Comentario (opcional)     ]    │
│                                   │
│  [  Enviar e ganhar +1 cupom  ]  │
│  [  Avaliar depois             ] │
└──────────────────────────────────┘
```

**Specs:**
- Stars: 40px, tap area 48px, animacao de pulse ao selecionar
- CTA: destaca cupom extra como incentivo
- Pode ser adiado (mostra novamente ao abrir app)

#### 4.1.10 Compartilhar no Social

Apos usar cupom (ou via tela de sucesso):

```
┌──────────────────────────────────┐
│  Compartilhe e ganhe +1 cupom!   │
│                                   │
│  📱 Poste no Instagram ou        │
│  TikTok marcando @maisumapp      │
│  e @restaurante                  │
│                                   │
│  [  Compartilhar agora  ]        │
│                                   │
│  Ja postou? Envie a prova:       │
│  [  📸 Upload screenshot  ]      │
│  [  🔗 Colar link do post  ]     │
│                                   │
│  [  Pular  ]                     │
└──────────────────────────────────┘
```

#### 4.1.11 Indicar Amigos

```
┌──────────────────────────────────┐
│  Indica e Ganha!                 │
│                                   │
│  Indique amigos e ambos ganham   │
│  3 cupons extras!                │
│                                   │
│  ┌──────────────────────────┐    │
│  │ maisumapp.com/ref/abc123 │    │
│  │          [📋 Copiar]      │    │
│  └──────────────────────────┘    │
│                                   │
│  [  Compartilhar via WhatsApp ]  │
│  [  Compartilhar...           ]  │
│                                   │
│  ─── Historico ───               │
│  João — Pendente                 │
│  Maria — Convertido (+3 cupons)  │
└──────────────────────────────────┘
```

### 4.2 Painel Restaurante (Web)

#### 4.2.1 Layout Base

```
┌─────────┬──────────────────────────────┐
│ SIDEBAR │  Header: Nome Restaurante    │
│         ├──────────────────────────────┤
│ 📊 Dash │                              │
│ 🎁 Benef│  [Conteudo da pagina]        │
│ 🎫 Valid│                              │
│ 💬 Chat │                              │
│ ⭐ Aval │                              │
│ 📱 Posts│                              │
│ 👤 Perfil│                             │
│         │                              │
│ ⚙️ Config│                             │
│ 🚪 Sair │                              │
└─────────┴──────────────────────────────┘
```

**Specs:**
- Sidebar: dark theme (`--color-neutral-900`), 256px, colapsavel
- Content area: max-width 1200px, padding `--space-8`
- Header: 64px, branco, shadow `--shadow-sm`, mostra nome do restaurante + avatar
- Responsive: sidebar vira drawer em < 1024px
- **Prioridade tablet:** touch-friendly, botoes 48px+

#### 4.2.2 Dashboard Restaurante

- 4 metric cards no topo: cupons validados, clientes unicos, nota media, total avaliacoes
- Grafico de linha: cupons por dia (ultimos 30d)
- Lista: top beneficios resgatados
- Periodo selecionavel: 7d | 30d | 90d

#### 4.2.3 Validar Cupom (Scanner QR)

```
┌──────────────────────────────────┐
│  Validar Cupom                   │
│                                   │
│  ┌──────────────────────────┐    │
│  │                          │    │
│  │     📷 CAMERA VIEW       │    │
│  │     Aponte para o QR     │    │
│  │                          │    │
│  └──────────────────────────┘    │
│                                   │
│  Ou digite o codigo:             │
│  [____________] [Validar]        │
│                                   │
│  ─── Validados Hoje (3) ───     │
│  ✅ Joao · 14:32 · Pizza         │
│  ✅ Maria · 13:15 · Drink        │
│  ✅ Carlos · 12:01 · Sobremesa   │
└──────────────────────────────────┘
```

**Resultado sucesso (overlay verde):**
- Background: `--color-success` com opacity
- Icone: check grande animado (Lottie)
- Texto: "Cupom Validado!" + nome do cliente + beneficio

**Resultado erro (overlay vermelho):**
- Background: `--color-error` com opacity
- Icone: X animado
- Texto: motivo especifico

### 4.3 Painel Admin +um (Web)

#### 4.3.1 Layout Base

Mesmo padrao do painel restaurante, mas com sidebar diferente:

**Sidebar items:**
- 📊 Dashboard
- 🍽️ Restaurantes
- 👥 Usuarios
- 💳 Assinaturas
- 🔔 Notificacoes
- 📱 Posts Sociais
- 🏙️ Cidades
- ⚙️ Configuracoes

#### 4.3.2 Dashboard Admin

- 6 metric cards: usuarios totais, assinantes ativos, MRR, cupons resgatados, restaurantes ativos, churn rate
- Grafico: crescimento de assinantes (30/90d)
- Grafico: cupons resgatados por dia
- Top 5 restaurantes por cupons
- Filtro por cidade

#### 4.3.3 Gerenciar Restaurantes

- Tabela com colunas: nome, cidade, status, cupons validados, data cadastro, acoes
- Filtros: cidade, status
- Botao "Adicionar Restaurante" + "Gerar Link de Convite"
- Acoes por linha: editar, ativar/desativar, ver detalhes

#### 4.3.4 Push Notifications

```
┌──────────────────────────────────┐
│  Enviar Notificacao              │
│                                   │
│  Titulo: [___________________]   │
│  Mensagem: [_________________]   │
│                                   │
│  Segmentacao:                    │
│  ○ Todos os usuarios             │
│  ○ Usuarios de: [Cidade ▼]      │
│  ○ Assinantes ativos             │
│                                   │
│  Alcance estimado: 847 usuarios  │
│                                   │
│  [  Enviar Agora  ]             │
└──────────────────────────────────┘
```

---

## 5. Interaction Patterns

### 5.1 Navigation

| App | Pattern | Detalhes |
|-----|---------|----------|
| Mobile | Bottom tabs + Stack | 4 tabs, stack navigation dentro de cada tab |
| Restaurant Web | Sidebar + Content | Sidebar persistente, paginas trocam no content area |
| Admin Web | Sidebar + Content | Mesmo padrao, mais itens no sidebar |

### 5.2 Fluxos Criticos

#### Fluxo: Usar Cupom (3 taps)

```
Home → Tap restaurante → Tap "Usar Cupom" → QR Code exibido
```

1. **Home:** Usuario ve mapa/lista
2. **Tap no restaurante:** Bottom sheet ou pagina de detalhes
3. **Tap "Usar Cupom":** Verifica cupom disponivel → Gera QR Code → Tela fullscreen
4. **Pos-uso:** Restaurante valida → Tela de sucesso → Prompt avaliar + compartilhar

**Tempo alvo:** < 5 segundos do tap "Usar Cupom" ate QR Code visivel

#### Fluxo: Validar Cupom (Restaurante)

```
Sidebar "Validar" → Camera ativa → Aponta QR → Resultado instantaneo
```

**Tempo alvo:** < 2 segundos da leitura do QR ate o resultado

#### Fluxo: Assinar

```
Planos → Seleciona → AbacatePay checkout → Webhook confirma → Cupons alocados → Home
```

### 5.3 Feedback & States

| Estado | Tratamento |
|--------|-----------|
| **Loading** | Skeleton shimmer (nunca spinner fullscreen) |
| **Empty** | Ilustracao + texto + CTA quando possivel |
| **Error** | Toast ou inline error, sempre com acao de retry |
| **Success** | Toast verde ou animacao Lottie (acoes importantes) |
| **Offline** | Banner topo "Sem conexao", funcionalidades offline disponiveis |
| **Pull refresh** | Animacao custom com icone +um |

### 5.4 Gestos (Mobile)

| Gesto | Acao |
|-------|------|
| Swipe left (conversa) | Arquivar conversa |
| Swipe down (listas) | Pull to refresh |
| Pinch (mapa) | Zoom in/out |
| Long press (cupom) | Copiar codigo |
| Drag (bottom sheet) | Expandir/colapsar detalhes |

---

## 6. Responsive Behavior

### Breakpoints

| Token | Value | Target |
|-------|-------|--------|
| `--bp-mobile` | < 640px | Smartphones |
| `--bp-tablet` | 640px — 1023px | Tablets, paineis no balcao |
| `--bp-desktop` | >= 1024px | Desktop admin |
| `--bp-wide` | >= 1440px | Monitores grandes |

### Adaptacoes por Plataforma

#### App Mobile (Expo)
- Design **mobile-only** — nao precisa ser responsivo para desktop
- Safe areas: iOS notch, Android status bar, bottom gesture bar
- Orientacao: portrait locked
- Fontes: usa Dynamic Type (iOS) e fontScale (Android) como base

#### Restaurant Web (Next.js)
- **Prioridade tablet** (uso no balcao): botoes 48px+, areas de toque generosas
- Mobile (< 640px): sidebar colapsa para drawer, tabela vira cards empilhados
- Tablet (640-1023px): sidebar como overlay, layout single column
- Desktop (1024px+): sidebar persistente, layout completo

#### Admin Web (Next.js)
- **Prioridade desktop** (uso no escritorio)
- Mobile: sidebar drawer, tabelas com scroll horizontal
- Tablet: sidebar colapsada por padrao
- Desktop: layout completo com sidebar aberta

---

## 7. Accessibility (WCAG AA)

### Requisitos Obrigatorios

| Categoria | Requisito | Criterio |
|-----------|----------|----------|
| **Contraste** | Texto normal | 4.5:1 minimo |
| **Contraste** | Texto grande (>=18px bold) | 3:1 minimo |
| **Contraste** | Elementos de UI (borders, icons) | 3:1 minimo |
| **Touch target** | Todos os interativos (mobile) | 44x44px minimo |
| **Keyboard** | Todos os interativos (web) | Focusable + operavel |
| **Focus** | Indicador visual | Ring 2px, cor contrastante |
| **Screen reader** | Todas as imagens | alt text descritivo |
| **Screen reader** | Conteudo dinamico | aria-live regions |
| **Screen reader** | Formularios | Labels associados |
| **Motion** | Animacoes | Respeitar prefers-reduced-motion |
| **Text resize** | Ate 200% | Layout nao quebra |

### Notas de Contraste da Paleta

| Combinacao | Ratio | Status |
|-----------|-------|--------|
| `--color-primary` (#FF6B35) sobre branco | 3.1:1 | Passa para texto grande / UI. Para texto normal, usar sobre `--color-primary-dark` ou texto escuro sobre primary |
| `--color-secondary` (#1B998B) sobre branco | 4.6:1 | AA |
| `--color-neutral-900` (#1A1A2E) sobre branco | 16.2:1 | AAA |
| `--color-neutral-800` (#2D2D44) sobre branco | 12.1:1 | AAA |
| `--color-neutral-600` (#6B7280) sobre branco | 5.0:1 | AA |
| Branco sobre `--color-primary` (#FF6B35) | 3.1:1 | AA Large + UI only |

> **Nota:** Para texto de corpo sobre fundo branco, usar `--color-neutral-800` ou mais escuro. `--color-primary` deve ser usado para botoes (texto branco grande) e elementos graficos, nunca para texto small.

### Teste

- axe-core integrado no CI (web)
- react-native-a11y para auditorias no mobile
- Testes manuais com VoiceOver (iOS) e TalkBack (Android)
- Navegacao keyboard-only nos admin webs

---

## 8. Tech Stack

| Layer | Technology | Justificativa |
|-------|-----------|---------------|
| **Mobile** | React Native + Expo SDK 52+ | Cross-platform, OTA updates, Expo Router |
| **Mobile routing** | Expo Router (file-based) | Consistencia com Next.js, deep linking nativo |
| **Admin Webs** | Next.js 14+ (App Router) | SSR, file-based routing, React Server Components |
| **Styling (mobile)** | NativeWind (Tailwind for RN) | Tokens via Tailwind config, DX unificada |
| **Styling (web)** | Tailwind CSS 4 | Utility-first, design tokens via CSS vars |
| **Component lib (web)** | shadcn/ui + Radix | Acessibilidade built-in, customizavel |
| **Component lib (mobile)** | Custom atoms + React Native Reanimated | Performance nativa, animacoes fluidas |
| **Icons** | Phosphor Icons | Unificada RN + Web, outline/filled |
| **Charts** | Recharts (web) | Leve, composable, boa DX |
| **Maps** | React Native Maps + Google Maps | Standard, boa performance |
| **QR Code** | react-native-qrcode-svg | SVG-based, renderiza offline |
| **QR Scanner** | expo-camera | Acesso a camera nativo |
| **Animations** | React Native Reanimated + Lottie | 60fps, animacoes complexas |
| **State** | Zustand | Leve, sem boilerplate, funciona em RN e web |
| **Forms** | React Hook Form + Zod | Validacao type-safe, performatico |
| **Testing** | Vitest + Testing Library | Fast, boa DX |

### Shared Packages (Monorepo)

| Package | Conteudo |
|---------|---------|
| `packages/shared` | Types TS, validacoes Zod, constantes, utils |
| `packages/ui` | Componentes React compartilhados entre admin webs (Button, Input, Table, Card, etc.) |

> **Nota:** `packages/ui` serve APENAS os admin webs (Next.js). O app mobile tem seus proprios componentes nativos (React Native). Tokens de design sao compartilhados via Tailwind config.

---

## 9. Dependencies

### Internal

| Package | Uso |
|---------|-----|
| `packages/shared` | Types, validacoes, constantes |
| `packages/ui` | Componentes UI admin webs |

### External (Principais)

| Library | Version | Purpose |
|---------|---------|---------|
| `expo` | ~52.x | Mobile framework |
| `expo-router` | ~4.x | File-based routing mobile |
| `next` | ^14.x | Web framework admin panels |
| `@supabase/supabase-js` | ^2.x | Supabase client |
| `nativewind` | ^4.x | Tailwind for React Native |
| `tailwindcss` | ^4.x | Utility CSS web |
| `zustand` | ^5.x | State management |
| `react-hook-form` | ^7.x | Form management |
| `zod` | ^3.x | Schema validation |
| `react-native-maps` | ^1.x | Maps mobile |
| `react-native-qrcode-svg` | ^6.x | QR code generation |
| `expo-camera` | ~16.x | Camera/QR scanner |
| `react-native-reanimated` | ~3.x | Animations |
| `lottie-react-native` | ^7.x | Lottie animations |
| `phosphor-react-native` | ^2.x | Icons mobile |
| `@phosphor-icons/react` | ^2.x | Icons web |
| `recharts` | ^2.x | Charts admin webs |
| `@radix-ui/*` | latest | Accessible primitives web |
| `posthog-react-native` | ^3.x | Analytics mobile |
| `posthog-js` | ^1.x | Analytics web |

---

## 10. Design Tokens Export

### Tailwind Config (compartilhado)

```javascript
// packages/shared/tailwind-preset.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B35',
          dark: '#E05A2B',
          light: '#FFF1EB',
          50: '#FFF8F5',
        },
        secondary: {
          DEFAULT: '#1B998B',
          dark: '#158276',
          light: '#E6F7F5',
        },
        accent: {
          DEFAULT: '#FFCB47',
          dark: '#E5B53E',
        },
        success: '#22C55E',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          400: '#9CA3AF',
          600: '#6B7280',
          800: '#2D2D44',
          900: '#1A1A2E',
        },
      },
      fontFamily: {
        heading: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(26,26,46,0.06)',
        md: '0 4px 12px rgba(26,26,46,0.08)',
        lg: '0 8px 24px rgba(26,26,46,0.12)',
        xl: '0 16px 48px rgba(26,26,46,0.16)',
      },
    },
  },
}
```

---

## 11. Next Steps

### Para @architect

> Revise esta frontend spec e crie a `fullstack-architecture.md` com: schema PostgreSQL completo (tabelas, RLS, indices), Edge Functions spec, integracao AbacatePay (webhooks), Realtime channels para chat, estrategia anti-fraude de cupons (HMAC), e estrutura detalhada do monorepo Turborepo.

### Para @dev

> Use esta spec como referencia visual durante a implementacao. Tokens de design devem ser configurados via `packages/shared/tailwind-preset.js`. Componentes atomicos devem seguir a hierarquia Atoms → Molecules → Organisms definida aqui. Priorize mobile-first.

### Para @po

> Valide se esta spec cobre todos os 58 FRs do PRD e se os fluxos de interacao atendem aos criterios de aceitacao das 21 stories.

---

*Frontend Specification v1.0 — Sati (@ux-design-expert) — 2026-03-19*
