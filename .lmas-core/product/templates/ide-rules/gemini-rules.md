# Gemini Rules - LMAS

Este arquivo define as instrucoes do projeto para Gemini CLI neste repositorio.

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

<!-- LMAS-MANAGED-START: gemini-integration -->
## Gemini Integration

Fonte de verdade de agentes:
- Canonico: `.lmas-core/development/agents/*.md`
- Espelhado para Gemini: `.gemini/rules/LMAS/agents/*.md`

Hooks e settings:
- Hooks locais: `.gemini/hooks/`
- Settings locais: `.gemini/settings.json`

Sempre que houver drift, execute:
- `npm run sync:ide:gemini`
- `npm run validate:gemini-sync`
- `npm run validate:gemini-integration`
<!-- LMAS-MANAGED-END: gemini-integration -->

<!-- LMAS-MANAGED-START: parity -->
## Multi-IDE Parity

Para garantir paridade entre Claude Code, Codex e Gemini:
- `npm run validate:parity`
- `npm run validate:paths`
<!-- LMAS-MANAGED-END: parity -->

<!-- LMAS-MANAGED-START: activation -->
## Agent Activation

Preferencia de ativacao:
1. Use agentes em `.gemini/rules/LMAS/agents/`
2. Se necessario, use fonte canonica em `.lmas-core/development/agents/`

Ao ativar agente:
- carregar definicao completa do agente
- renderizar greeting via `node .lmas-core/development/scripts/generate-greeting.js <agent-id>`
- manter persona ativa ate `*exit`

Atalhos recomendados no Gemini:
- `/lmas-menu` para listar agentes
- `/lmas-<agent-id>` (ex.: `/lmas-dev`, `/lmas-architect`)
- `/lmas-agent <agent-id>` para launcher generico
<!-- LMAS-MANAGED-END: activation -->

<!-- LMAS-MANAGED-START: commands -->
## Common Commands

- `npm run sync:ide`
- `npm run sync:ide:check`
- `npm run sync:ide:gemini`
- `npm run validate:gemini-sync`
- `npm run validate:gemini-integration`
- `npm run validate:parity`
- `npm run validate:structure`
- `npm run validate:agents`
<!-- LMAS-MANAGED-END: commands -->
