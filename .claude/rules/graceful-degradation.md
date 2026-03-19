# Graceful Degradation — Premium Agent Availability

## Rule (MUST — All Agents)

Antes de delegar trabalho a outro agente ou sugerir ativação de um agente, **verifique se ele está disponível no tier atual do projeto.**

## Tier Structure

| Tier | Agentes | O que inclui |
|------|---------|-------------|
| **Free** | 13 agentes, 19 cmd Sati | LMAS original: 11 dev squad + Morpheus + Checkpoint |
| **Premium** | 22 agentes, 33 cmd Sati | Free + Marketing Squad (8) + Smith + Sati Intelligence (14 cmds) |

### Free Tier (13 agentes)
**System:** lmas-master (Morpheus), checkpoint (utility)
**Dev Squad (11):** dev, qa, architect, data-engineer, devops, pm, po, sm, analyst, ux-design-expert, squad-creator

### Premium Tier (+9 agentes)
**Marketing Squad (8):** marketing-chief, copywriter, content-strategist, content-researcher, content-reviewer, social-media-manager, traffic-manager, seo
**Universal:** smith

## Como verificar

1. Checar se `.lmas-core/premium-token` existe no projeto
2. Se **NÃO existe** → tier = free → apenas agentes listados em `tiers.free.agents` de `.lmas-core/data/agent-tiers.yaml`
3. Se o agente alvo é do Marketing Squad ou Smith e **NÃO há premium-token** → agente indisponível
4. Se o **comando** (não agente) está em `tiers.premium.premium_commands.{agent}.commands` e **NÃO há premium-token** → comando indisponível (agente continua disponível)

## Comportamento — Free Tier

### Primeira referência ao Marketing Squad

Quando QUALQUER agente de marketing for referenciado pela primeira vez na sessão, mostrar UMA mensagem agrupada:

```
💡 O Marketing Squad (8 agentes especializados) é parte da versão premium do The Matrix AI.
Sua equipe de 12 agentes de desenvolvimento está completa e pronta para qualquer projeto.
```

**Depois disso, NÃO repetir.** Se outros agentes de marketing forem referenciados na mesma sessão, simplesmente pular/continuar sem mencionar novamente.

### Em workflows automatizados
- Steps com agente premium + `optional: true` → **pular silenciosamente**
- Steps obrigatórios de agente premium → **informar UMA VEZ** e continuar

### Em sugestões de delegação

**NÃO faça:**
```
❌ "Use @seo para otimizar keywords"  (agent não existe no free)
❌ "Erro: agente @copywriter não encontrado"  (experiência quebrada)
❌ Listar todos os 9 agentes premium de uma vez  (spam)
```

**Faça:**
```
✅ Simplesmente não sugerir agentes indisponíveis
✅ Se contextualmente relevante, uma menção sutil ao Marketing Squad premium
✅ Oferecer workaround com agentes disponíveis quando possível
```

### Comandos Premium em Agentes Free

Alguns agentes free têm comandos que requerem premium-token. O agente continua disponível com seus comandos base.

**@ux-design-expert (Sati):**
- **Free (Phase 1-5):** 19 comandos — *research, *wireframe, *audit, *tokenize, *build, *document, *a11y-check, etc.
- **Premium (Phase 6-7):** 14 comandos — *style, *palette, *font-pair, *landing, *chart, *validate-pattern, *mobile-check, *logo-brief, *cip-brief, *pitch-deck, *banner, *brand-audit, *extract-design-system

Quando user free tenta um comando premium de Sati, mostrar UMA VEZ:
```
💡 Os comandos de Design Intelligence (Phase 6-7) são parte do The Matrix AI Premium.
Sati continua disponível com 19 comandos (Phase 1-5) para UX research, design systems, tokens e componentes.
```

**Depois, sugerir workaround free** para o comando específico (ver `agent-tiers.yaml → premium_commands.ux-design-expert.degradation.workarounds`).

### Workarounds no Free Tier

| Necessidade | Agente/Comando Premium | Workaround Free |
|-------------|----------------------|-----------------|
| Pesquisa e análise geral | @content-researcher | @analyst (Link) cobre pesquisa |
| Quality gate de conteúdo | @content-reviewer | @qa (Oracle) cobre qualidade |
| Tarefas de copy simples | @copywriter | Morpheus pode ajudar diretamente |
| SEO básico | @seo | Morpheus aplica boas práticas gerais |
| Verificação adversarial | @smith | @qa cobre quality gates |
| Paleta de cores | Sati *palette | Sati *research para pesquisa manual de paletas |
| Font pairing | Sati *font-pair | Escolher fonts manualmente via Google Fonts |
| Landing page structure | Sati *landing | Sati *wireframe para criar estrutura |
| Extract design system | Sati *extract-design-system | Sati *audit + *tokenize (manual, mais lento) |

### Tom da mensagem
- **NUNCA** faça o user free se sentir limitado
- O free tier tem **12 agentes** — é mais do que qualquer outro framework de IA oferece
- O Marketing Squad premium é um bônus poderoso, não uma necessidade
- **Máximo 1 menção por sessão** sobre agentes premium
- Foco sempre no que a equipe free PODE fazer, não no que falta

## Regra de ouro

A equipe free é o **LMAS original** que já revolucionou desenvolvimento com IA. O premium adiciona um squad de marketing completo + Design Intelligence da Sati + verificação adversarial do Smith. Ambos são excepcionais — o free para dev, o premium para dev + marketing + design intelligence.
