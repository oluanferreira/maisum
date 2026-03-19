# Project Brief: +um (MAISUM)

> **Versao:** 1.0
> **Data:** 2026-03-18
> **Autor:** Morpheus (LMAS) + Luan Ferreira
> **Status:** Aprovado

---

## 1. Executive Summary

**+um** e um aplicativo mobile de beneficios gastronomicos que opera no modelo "pediu um, recebe +um". Usuarios assinam um plano (anual ou mensal) e recebem cupons para resgatar um item adicional gratuito em restaurantes parceiros — configurado pelo proprio estabelecimento (prato, drink, sobremesa ou combo).

**Problema principal:** O mercado brasileiro de beneficios gastronomicos e dominado por um unico player relevante (Duo Gourmet) que cobra caro, esconde precos, restringe a restaurantes fine dining e depende de parceria bancaria (Banco Inter). Os demais concorrentes sao amadores e de baixa qualidade.

**Mercado-alvo:** Consumidores de todas as classes que frequentam restaurantes, lancando em Jequie-BA com arquitetura multi-cidade desde o dia 1.

**Proposta de valor:** Transparencia radical, autonomia total do restaurante, comunicacao direta restaurante-cliente via chat, e independencia de instituicoes financeiras. Tudo com preco acessivel (a partir de R$14,90/mes).

---

## 2. Problem Statement

### Estado Atual

O mercado de "clube de beneficios gastronomicos" no Brasil tem:

- **Duo Gourmet** — Unico player relevante. Assinatura cara, foco em fine dining, forte acoplamento com Banco Inter, nao mostra restaurantes nem precos na homepage. UX razoavel mas proposta elitizada.
- **Compre & Ganhe** — Site precario, quase nenhuma informacao, sem app funcional aparente. Concorrencia nominal apenas.
- **Zero inovacao** — Nenhum player oferece chat direto, painel de autonomia para restaurantes, ou gamificacao social.

### Pain Points

**Para consumidores:**
- Falta de opcoes acessiveis de beneficios gastronomicos fora de capitais
- Plataformas existentes sao opacas (escondem precos e restaurantes disponiveis)
- Dependencia de cartao/banco especifico para obter beneficios
- Sem canal direto de comunicacao com restaurantes

**Para restaurantes:**
- Plataformas existentes impoe regras top-down sem autonomia
- Dificuldade de atrair novos clientes de forma previsivel
- Sem ferramenta de comunicacao direta com clientes que ja visitaram

### Urgencia

Cidades medias e pequenas no Brasil (como Jequie-BA) sao completamente desatendidas por beneficios gastronomicos. A oportunidade de ser first-mover nesse segmento e imediata.

---

## 3. Proposed Solution

### Conceito Central

App mobile (iOS + Android) onde o usuario assina, recebe cupons, e ao visitar um restaurante parceiro, apresenta um QR Code que o restaurante valida — liberando o item "+um" configurado pelo estabelecimento.

### Tres Paineis Integrados

1. **App do Cliente** (React Native/Expo) — Descobrir restaurantes, ver beneficios, usar cupons via QR Code, avaliar, chat com restaurante
2. **Painel Admin Restaurante** (Web) — Configurar beneficios, validar cupons, gerenciar chat, ver metricas
3. **Painel Admin +um** (Web) — Gerenciar restaurantes, usuarios, assinaturas, metricas gerais

### Diferenciais vs Duo Gourmet

| Diferencial | +um | Duo Gourmet |
|-------------|-----|-------------|
| Transparencia de precos | Tudo visivel | Esconde precos |
| Autonomia do restaurante | Painel proprio completo | Top-down |
| Chat restaurante-cliente | Sim, em tempo real | Nao |
| Dependencia bancaria | Nenhuma | Banco Inter |
| Tipo de restaurante | Todos | Foco fine dining |
| Cidades pequenas/medias | Desde o lancamento | Foco em capitais |
| Validacao de cupom | QR Code + 1 tap | Codigo manual |
| Gamificacao social | Indica, avalia, posta | Nao |

---

## 4. Target Users

### 4.1 Segmento Primario: Consumidores

**Perfil:** Pessoas de 18-55 anos que frequentam restaurantes pelo menos 2x/mes, em Jequie-BA e cidades similares. Todas as classes sociais.

**Comportamentos atuais:**
- Escolhem restaurantes por indicacao boca-a-boca e redes sociais
- Sensibilidade a preco media-alta (buscam "vale a pena")
- Usam Instagram/Facebook para descobrir novos lugares
- Nao conhecem plataformas como Duo Gourmet (que nao atuam em cidades medias)

**Necessidades:**
- Descobrir restaurantes com beneficios reais
- Economizar ao comer fora sem perder qualidade
- Confianca na proposta (ver antes de pagar)

**Objetivo:** Comer fora mais vezes, gastando menos por refeicao.

### 4.2 Segmento Secundario: Restaurantes Parceiros

**Perfil:** Donos de restaurantes, lanchonetes, pizzarias, acai, cafes — de todos os portes e estilos em Jequie-BA e regiao.

**Comportamentos atuais:**
- Marketing via Instagram/Facebook com alcance limitado
- Dependem de boca-a-boca e localizacao
- Pouca ou nenhuma ferramenta digital de fidelizacao

**Necessidades:**
- Atrair novos clientes de forma previsivel
- Comunicar-se diretamente com quem ja visitou
- Controlar suas proprias promocoes sem intermediarios impondo regras

**Objetivo:** Aumentar fluxo de clientes e fidelizacao com autonomia.

---

## 5. Goals & Success Metrics

### Business Objectives

- Atingir 500 usuarios assinantes nos primeiros 6 meses em Jequie-BA
- Onboardar 30+ restaurantes parceiros antes do lancamento
- Taxa de conversao visitante → assinante >= 15%
- Churn mensal <= 8%
- NPS >= 50

### User Success Metrics

- Tempo medio de primeiro uso de cupom: <= 7 dias apos assinatura
- Cupons utilizados por usuario/mes: >= 3
- Avaliacoes enviadas por usuario/mes: >= 1
- Taxa de indicacao: >= 20% dos usuarios indicam pelo menos 1 amigo

### KPIs

- **MRR (Monthly Recurring Revenue):** Meta R$7.500 em 6 meses
- **Cupons resgatados/mes:** Metrifica engajamento real
- **Restaurantes ativos:** Com pelo menos 1 cupom validado/semana
- **CAC (Customer Acquisition Cost):** Meta < R$15 por assinante
- **LTV (Lifetime Value):** Meta > R$80 (retencao media > 8 meses)

---

## 6. Product Scope (V1 — Lancamento Completo)

### Core Features (Must Have)

#### App do Cliente (Mobile)

- **Onboarding + Assinatura:** Cadastro, escolha de plano (mensal R$14,90 / anual R$89,90), pagamento via AbacatePay (PIX, cartao, boleto)
- **Home com mapa:** Restaurantes parceiros proximos com filtros (tipo, distancia, beneficio disponivel)
- **Detalhes do restaurante:** Fotos, descricao, cardapio do beneficio, horarios, avaliacoes, localizacao no mapa
- **Meus Cupons:** Cupons disponiveis, usados, expirados. 1 cupom por restaurante por vez
- **QR Code do Cupom:** Tela dedicada com QR Code para apresentar ao restaurante
- **Chat com restaurante:** Mensagens em tempo real (duvidas, disponibilidade, promocoes especiais)
- **Avaliacoes:** Avaliar experiencia apos uso do cupom (nota + comentario)
- **Indica e Ganha:** Compartilhar link de indicacao → ambos ganham 3 cupons extras
- **Post Social = Cupom:** Compartilhar no Instagram/Facebook marcando @maisumapp e @restaurante → submeter prova → ganhar 1 cupom extra
- **Perfil:** Dados pessoais, gerenciar assinatura, historico de uso
- **Push Notifications:** Novos restaurantes, cupons expirando, promocoes

#### Painel Admin Restaurante (Web)

- **Login/Senha proprio:** Acesso independente do admin geral
- **Dashboard:** Cupons validados, visitas, metricas do periodo
- **Configurar beneficios:** Adicionar/editar pratos/itens do "+um", definir horarios disponiveis, limites diarios
- **Validar cupom:** Scanner QR Code (camera do celular/tablet) ou digitar codigo manualmente
- **Chat com clientes:** Responder mensagens, enviar promocoes
- **Ver avaliacoes:** Feedback dos clientes que usaram cupons

#### Painel Admin +um (Web)

- **Dashboard geral:** Usuarios, assinaturas, receita, cupons, metricas
- **Gerenciar restaurantes:** Cadastrar, editar, ativar/desativar, enviar link de auto-cadastro
- **Gerenciar usuarios:** Visualizar assinantes, status, historico
- **Gerenciar assinaturas:** Planos, pagamentos, inadimplencia
- **Validar posts sociais:** Aprovar/rejeitar provas de compartilhamento social
- **Push notifications:** Enviar notificacoes segmentadas

### Out of Scope (V1)

- Delivery/pedidos online (app nao e iFood, e beneficio presencial)
- Programa de fidelidade com pontos complexos (badges, niveis)
- Marketplace de cupons entre usuarios
- Integracao com plataformas de reserva (iFood, Rappi)
- Versao web do app cliente (mobile-only na V1)
- Plano familia (futuro)
- Multi-idioma

---

## 7. Post-V1 Vision

### Phase 2 Features

- **Plano Familia:** R$149,90/ano, 2 perfis, 160 cupons
- **Explorador:** Badges por visitar X restaurantes diferentes
- **Programa de fidelidade do restaurante:** O restaurante cria seu proprio cartao fidelidade dentro do app
- **Eventos gastronomicos:** Festivais, jantares exclusivos para assinantes
- **Analytics avancado para restaurantes:** Heatmap de horarios, perfil de clientes, comparativo com mercado

### Long-term Vision (12-24 meses)

- Expansao para cidades da Bahia e Nordeste
- Parcerias com influenciadores gastronomicos regionais
- API publica para restaurantes integrarem com seus sistemas
- White-label para redes de restaurantes
- Expansao para outros segmentos: bares, cafeterias, food trucks

### Expansion Opportunities

- **Modelo B2B:** Empresas compram pacotes de cupons +um como beneficio para funcionarios
- **Eventos corporativos:** Parcerias para eventos gastro-culturais
- **Turismo:** Pacotes "+um turista" para visitantes da cidade

---

## 8. Technical Considerations

### Platform Requirements

- **Target Platforms:** iOS 15+ e Android 10+ (via Expo/React Native)
- **Performance:** App deve abrir em < 3s, QR Code deve renderizar offline
- **Offline:** QR Code do cupom deve funcionar sem internet (pre-gerado)

### Technology Stack

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Mobile | React Native + Expo (SDK 52+) | Cross-platform, OTA updates, Expo Router |
| Backend/DB | Supabase (PostgreSQL 15) | Auth, Realtime, RLS, Edge Functions, Storage |
| Admin Webs | Next.js 14+ (App Router) | SSR, performance, compartilha types com mobile |
| Chat | Supabase Realtime | Integrado, sem custo extra de infra |
| Pagamentos | AbacatePay | PIX R$0,80/tx, assinaturas recorrentes, BR-native |
| Push | Expo Notifications | Integrado ao Expo, iOS+Android |
| Maps | React Native Maps + Google Maps API | Localizacao de restaurantes |
| QR Code | react-native-qrcode-svg + expo-camera | Gerar (cliente) e escanear (restaurante) |
| Storage | Supabase Storage | Fotos de restaurantes, provas de post social |
| Analytics | PostHog | Open-source, event tracking, funnels |
| Monorepo | Turborepo | Compartilhar types/utils entre mobile e admin webs |

### Architecture Considerations

- **Repo:** Monorepo com Turborepo
  ```
  apps/
    mobile/        # Expo app (cliente)
    admin-web/     # Next.js (admin +um)
    restaurant-web/ # Next.js (admin restaurante)
  packages/
    shared/        # Types, utils, validacoes compartilhadas
    ui/            # Componentes UI compartilhados (admin webs)
  supabase/
    migrations/    # SQL migrations
    functions/     # Edge Functions
  ```
- **Auth:** Supabase Auth com roles (user, restaurant_admin, super_admin)
- **RLS:** Row Level Security no Supabase para isolamento de dados por restaurante
- **Multi-tenancy:** Restaurantes isolados via RLS, nao schemas separados
- **Realtime:** Supabase Realtime channels para chat (1 channel por par user-restaurant)

### Security & Compliance

- LGPD compliance (dados pessoais, consentimento, direito a exclusao)
- Cupons com UUID + assinatura HMAC (anti-fraude, anti-screenshot)
- Rate limiting em Edge Functions
- Tokens de sessao com refresh rotation

---

## 9. Constraints & Assumptions

### Constraints

- **Budget:** Bootstrapped — infraestrutura deve ser cost-efficient (Supabase free tier inicialmente)
- **Timeline:** A definir com usuario (sem deadline rigido)
- **Resources:** Desenvolvimento via LMAS (AI-driven), design via Sati
- **Technical:** AbacatePay deve suportar assinaturas recorrentes (confirmado via analise)

### Key Assumptions

- Restaurantes de Jequie-BA terao interesse em participar (usuario confirma que ja tem parceiros alinhados)
- Publico-alvo usa smartphone e tem familiaridade com apps
- PIX e o metodo de pagamento preferido do publico-alvo
- O modelo "pediu um, recebe +um" e intuitivo e nao requer educacao extensiva
- Restaurantes parceiros possuem tablet ou smartphone para validar QR Codes
- AbacatePay mantem taxas competitivas e suporte a subscriptions

---

## 10. Risks & Open Questions

### Key Risks

- **Adesao de restaurantes:** Se poucos restaurantes aderirem, o app perde valor. Mitigacao: Comecar com parceiros ja alinhados e expandir via link de auto-cadastro
- **Fraude de cupons:** Screenshots de QR Code compartilhados. Mitigacao: QR Code dinamico com HMAC + expiracao curta
- **Churn alto:** Usuario assina, usa poucos cupons, cancela. Mitigacao: Gamificacao (indica, avalia, posta) + push notifications de lembrete
- **Validacao do post social:** Dificil automatizar verificacao de post no Instagram. Mitigacao: Validacao manual (restaurante ou admin) — simples e eficaz
- **Escalabilidade do chat:** Muitas conversas simultaneas podem sobrecarregar Realtime. Mitigacao: Rate limiting + historico paginado
- **Concorrencia:** Duo Gourmet pode expandir para cidades medias. Mitigacao: Ser first-mover, construir rede de restaurantes locais e brand loyalty

### Open Questions

- Qual a politica de reembolso para assinantes insatisfeitos? **A definir (nao ha politica ainda)**
- O restaurante paga algo para participar ou e 100% gratuito para ele? **100% gratuito para o restaurante**
- Limite de cupons extras via indicacao/post social (anti-abuse)? **Maximo 10 cupons extras/mes**
- Processo de onboarding presencial vs. 100% digital para restaurantes?

### Areas Needing Further Research

- Taxa real de adocao de apps de beneficios em cidades medias brasileiras
- Benchmark de churn em apps de assinatura gastronomica
- Custos reais do Supabase em escala (estimativa de MAU e storage)
- Viabilidade tecnica de deep linking para compartilhamento social pre-preenchido

---

## Appendices

### A. Competitive Analysis Summary

| Criterio | +um | Duo Gourmet | Compre & Ganhe |
|----------|-----|-------------|----------------|
| Modelo | Assinatura + cupons | Assinatura ilimitada | Indefinido |
| Preco | R$89,90/ano ou R$14,90/mes | ~R$35-50/mes | N/A |
| Restaurantes | Todos os tipos | Fine dining | N/A |
| Cidades | Jequie-BA + expansao | 80+ (capitais) | Desconhecido |
| Autonomia restaurante | Total (painel proprio) | Baixa | N/A |
| Chat | Sim | Nao | Nao |
| QR Code | Sim | Codigo manual | N/A |
| Parceria bancaria | Nenhuma | Banco Inter | Nenhuma |
| Qualidade tecnica | Alta (meta) | Media-alta | Muito baixa |
| Gamificacao | Indica + Avalia + Post | Indicacao basica | Nenhuma |

### B. Competitor URLs

- Duo Gourmet: https://www.duogourmet.com.br/
- Compre & Ganhe: https://www.compreeganheapp.com.br/

### C. References

- AbacatePay: https://abacatepay.com (gateway de pagamento escolhido)
- Supabase: https://supabase.com (backend/database)
- Expo: https://expo.dev (framework mobile)

---

## Next Steps

1. **PRD:** Criar Product Requirements Document detalhado com epics e stories baseado neste brief
2. **Frontend Spec:** @ux-design-expert (Sati) criar especificacao visual e design system
3. **Architecture:** @architect definir arquitetura tecnica detalhada
4. **Restaurantes:** Solicitar ao usuario os sites/redes sociais dos parceiros ja alinhados
5. **Design:** Sati criar identidade visual, paleta de cores, tipografia, logo brief

---

*Este Project Brief fornece o contexto completo do +um. O proximo passo e criar o PRD com @pm (Trinity), revisando este brief e estruturando epics e user stories.*
