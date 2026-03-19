# AGENTS.md - LMAS (Codex CLI)

Este arquivo define as instrucoes do projeto para o Codex CLI.

<!-- LMAS-MANAGED-START: core -->
## Core Rules

1. Siga a Constitution em `.lmas-core/constitution.md`
2. Priorize `CLI First -> Observability Second -> UI Third`
3. Trabalhe por stories em `docs/stories/`
4. Nao invente requisitos fora dos artefatos existentes
<!-- LMAS-MANAGED-END: core -->

<!-- LMAS-MANAGED-START: quality -->
## Quality Gates

- Rode `npm run lint`
- Rode `npm run typecheck`
- Rode `npm test`
- Atualize checklist e file list da story antes de concluir
<!-- LMAS-MANAGED-END: quality -->

<!-- LMAS-MANAGED-START: codebase -->
## Project Map

- Core framework: `.lmas-core/`
- CLI entrypoints: `bin/`
- Shared packages: `packages/`
- Tests: `tests/`
- Docs: `docs/`
<!-- LMAS-MANAGED-END: codebase -->

<!-- LMAS-MANAGED-START: commands -->
## Common Commands

- `npm run sync:ide`
- `npm run sync:ide:check`
- `npm run sync:skills:codex`
- `npm run sync:skills:codex:global` (opcional; neste repo o padrao e local-first)
- `npm run validate:structure`
- `npm run validate:agents`
<!-- LMAS-MANAGED-END: commands -->

<!-- LMAS-MANAGED-START: shortcuts -->
## Agent Shortcuts

Preferencia de ativacao no Codex CLI:
1. Use `/skills` e selecione `lmas-<agent-id>` vindo de `.codex/skills` (ex.: `lmas-architect`)
2. Se preferir, use os atalhos abaixo (`@architect`, `/architect`, etc.)

Interprete os atalhos abaixo carregando o arquivo correspondente em `.lmas-core/development/agents/` (fallback: `.codex/agents/`), renderize o greeting via `generate-greeting.js` e assuma a persona ate `*exit`:

- `@architect`, `/architect`, `/architect.md` -> `.lmas-core/development/agents/architect.md`
- `@dev`, `/dev`, `/dev.md` -> `.lmas-core/development/agents/dev.md`
- `@qa`, `/qa`, `/qa.md` -> `.lmas-core/development/agents/qa.md`
- `@pm`, `/pm`, `/pm.md` -> `.lmas-core/development/agents/pm.md`
- `@po`, `/po`, `/po.md` -> `.lmas-core/development/agents/po.md`
- `@sm`, `/sm`, `/sm.md` -> `.lmas-core/development/agents/sm.md`
- `@analyst`, `/analyst`, `/analyst.md` -> `.lmas-core/development/agents/analyst.md`
- `@devops`, `/devops`, `/devops.md` -> `.lmas-core/development/agents/devops.md`
- `@data-engineer`, `/data-engineer`, `/data-engineer.md` -> `.lmas-core/development/agents/data-engineer.md`
- `@ux-design-expert`, `/ux-design-expert`, `/ux-design-expert.md` -> `.lmas-core/development/agents/ux-design-expert.md`
- `@squad-creator`, `/squad-creator`, `/squad-creator.md` -> `.lmas-core/development/agents/squad-creator.md`
- `@lmas-master`, `/lmas-master`, `/lmas-master.md` -> `.lmas-core/development/agents/lmas-master.md`
<!-- LMAS-MANAGED-END: shortcuts -->
