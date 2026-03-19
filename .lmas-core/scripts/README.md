# LMAS Scripts - Legacy Directory

> **Note**: This directory now contains only legacy/migration scripts and a few active utilities.
> Most scripts have been migrated to the modular structure (Story 6.16).

## Current Structure

Scripts are now organized by domain across three locations:

| Location | Purpose |
|----------|---------|
| `.lmas-core/core/` | Core framework modules (elicitation, session) |
| `.lmas-core/development/scripts/` | Development scripts (greeting, workflow, hooks) |
| `.lmas-core/infrastructure/scripts/` | Infrastructure scripts (git config, validators) |
| `.lmas-core/scripts/` (this directory) | Legacy utilities and migration scripts |

## Scripts in This Directory

### Active Scripts

| Script | Description |
|--------|-------------|
| `session-context-loader.js` | Loads session context for agents |
| `command-execution-hook.js` | Hook for command execution |
| `test-template-system.js` | Internal test utility for templates |

### Migration Scripts

| Script | Description |
|--------|-------------|
| `batch-migrate-*.ps1` | Batch migration utilities |
| `migrate-framework-docs.sh` | Documentation migration script |
| `validate-phase1.ps1` | Phase 1 validation script |

## Script Path Mapping

If you're looking for a script that was previously here, use this mapping:

```text
OLD PATH                                      NEW PATH
-----------------------------------------     ------------------------------------------
.lmas-core/scripts/context-detector.js      → .lmas-core/core/session/context-detector.js
.lmas-core/scripts/elicitation-engine.js    → .lmas-core/core/elicitation/elicitation-engine.js
.lmas-core/scripts/elicitation-session-manager.js → .lmas-core/core/elicitation/session-manager.js
.lmas-core/scripts/greeting-builder.js      → .lmas-core/development/scripts/greeting-builder.js
.lmas-core/scripts/workflow-navigator.js    → .lmas-core/development/scripts/workflow-navigator.js
.lmas-core/scripts/agent-exit-hooks.js      → .lmas-core/development/scripts/agent-exit-hooks.js
.lmas-core/scripts/git-config-detector.js   → .lmas-core/infrastructure/scripts/git-config-detector.js
.lmas-core/scripts/project-status-loader.js → .lmas-core/infrastructure/scripts/project-status-loader.js
.lmas-core/scripts/lmas-validator.js        → .lmas-core/infrastructure/scripts/lmas-validator.js
.lmas-core/scripts/tool-resolver.js         → .lmas-core/infrastructure/scripts/tool-resolver.js
.lmas-core/scripts/output-formatter.js      → .lmas-core/infrastructure/scripts/output-formatter.js
```

## Configuration

The `scriptsLocation` in `core-config.yaml` now uses a modular structure:

```yaml
scriptsLocation:
  core: .lmas-core/core
  development: .lmas-core/development/scripts
  infrastructure: .lmas-core/infrastructure/scripts
  legacy: .lmas-core/scripts  # This directory
```

## Usage Examples

### Loading Core Scripts

```javascript
// Elicitation Engine (from core)
const ElicitationEngine = require('./.lmas-core/core/elicitation/elicitation-engine');

// Context Detector (from core)
const ContextDetector = require('./.lmas-core/core/session/context-detector');
```

### Loading Development Scripts

```javascript
// Greeting Builder
const GreetingBuilder = require('./.lmas-core/development/scripts/greeting-builder');

// Workflow Navigator
const WorkflowNavigator = require('./.lmas-core/development/scripts/workflow-navigator');
```

### Loading Infrastructure Scripts

```javascript
// Project Status Loader
const { loadProjectStatus } = require('./.lmas-core/infrastructure/scripts/project-status-loader');

// Git Config Detector
const GitConfigDetector = require('./.lmas-core/infrastructure/scripts/git-config-detector');
```

### Loading Legacy Scripts (this directory)

```javascript
// Session Context Loader
const sessionLoader = require('./.lmas-core/scripts/session-context-loader');
```

## Related Documentation

- [Core Config](../core-config.yaml) - scriptsLocation configuration
- [Core Module](../core/README.md) - Core framework modules
- [Development Scripts](../development/scripts/README.md) - Development utilities
- [Infrastructure Scripts](../infrastructure/scripts/README.md) - Infrastructure utilities

## Migration History

| Date | Story | Change |
|------|-------|--------|
| 2025-12-18 | 6.16 | Deleted deprecated scripts, updated documentation |
| 2025-01-15 | 2.2 | Initial script reorganization to modular structure |

---

**Last updated:** 2025-12-18 - Story 6.16 Scripts Path Consolidation
