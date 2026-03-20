# Guia: Gerar APK do +um para Testes

> **Ultima atualizacao:** 2026-03-20
> **Autor:** Luan + Claude
> **Status:** Pronto para execucao

---

## Pre-requisitos

- Node.js 18+ instalado
- Conta Expo (https://expo.dev/signup)
- Projeto em `C:\Dev\maisum` (fora do OneDrive — OBRIGATORIO)

---

## Passo a Passo Completo

### 1. Criar conta Expo (Alex faz isso)

1. Acessar https://expo.dev/signup
2. Criar conta com email e senha
3. Enviar credenciais (email + senha) para o Luan

### 2. Login na conta do Alex

Abrir terminal (PowerShell) e rodar:

```bash
npx eas-cli logout
npx eas-cli login
```

Digitar email e senha do Alex quando pedir.

### 3. Navegar ate o projeto

```bash
cd C:\Dev\maisum\apps\mobile
```

> **IMPORTANTE:** O projeto DEVE estar em `C:\Dev\maisum`, NAO no OneDrive.
> O OneDrive adiciona permissoes especiais que quebram o build.

### 4. Inicializar projeto na conta do Alex

```bash
npx eas-cli init
```

Vai perguntar:
- "Would you like to create a project for @alexUsername/maisum?" → **Y**

Isso gera um novo `projectId` no `app.json`. E normal.

### 5. Gerar o APK

```bash
npx eas-cli build --platform android --profile preview
```

Vai perguntar:
- "Generate a new Android Keystore?" → **Y**

Depois disso:
- Upload do projeto (~5 MB, demora ~5 segundos)
- Build no cloud da Expo (~10-15 minutos)
- Aguardar ate aparecer "Build successful" com o link

### 6. Baixar o APK

Quando o build terminar com sucesso, aparece algo como:

```
✔ Build finished
🤖 Build artifact:
  https://expo.dev/artifacts/eas/xxxxx.apk
```

**Copiar esse link e enviar para o Alex.**

O Alex abre o link no celular Android → baixa o APK → instala → testa.

> **Nota:** O Android pode pedir para "Permitir instalacao de fontes desconhecidas" na primeira vez.

### 7. Voltar para conta do Luan (apos build)

```bash
npx eas-cli logout
npx eas-cli login
```

Logar com: `luanferreira.emp@gmail.com`

---

## Troubleshooting

### Erro: "This account has used its Android builds"
- Limite free: ~15 builds/mes por conta
- Solucao: usar outra conta Expo ou esperar reset (dia 1 do mes)

### Erro: "requireCommit" ou "working tree dirty"
- Verificar que `eas.json` NAO tem `"requireCommit": true`
- Se tiver, remover a linha

### Erro: "Cannot resolve entry file"
- Verificar que `package.json` do mobile tem `"main": "expo-router/entry"`
- NAO pode ser `"main": "index.ts"`

### Erro: "Permission denied" no tar/extract
- Projeto DEVE estar fora do OneDrive (ex: `C:\Dev\maisum`)
- OneDrive adiciona DENY ACLs que quebram o build do EAS

### Erro: "Could not find org.asyncstorage"
- `@react-native-async-storage/async-storage` deve ser versao `~2.1.0`
- Versao 3.x nao funciona ainda com EAS

### Erro: "expo-clipboard not found" ou modulo nao encontrado
- Instalar o modulo faltante: `npm install --workspace=apps/mobile expo-clipboard`
- Commitar e pushar antes de buildar

---

## Configuracao Atual do Projeto

### eas.json (`apps/mobile/eas.json`)

```json
{
  "cli": {
    "version": ">= 18.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "base": {
      "node": "20.19.4",
      "env": {
        "EXPO_USE_METRO_WORKSPACE_ROOT": "1"
      }
    },
    "preview": {
      "extends": "base",
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "extends": "base",
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### app.json (campos relevantes)

```json
{
  "expo": {
    "name": "+um",
    "slug": "maisum",
    "scheme": "maisum",
    "android": {
      "package": "com.maisum.app"
    },
    "plugins": ["expo-router"],
    "extra": {
      "eas": {
        "projectId": "sera-gerado-pelo-eas-init"
      }
    }
  }
}
```

### .easignore (na raiz do monorepo)

Exclui do upload: `.lmas-core/`, `.claude/`, `docs/`, `apps/admin-web/`, `apps/restaurant-web/`, `supabase/`, `node_modules/`, `.git/`, ferramentas AI externas.

### package.json do mobile (campo main)

```json
{
  "main": "expo-router/entry"
}
```

**NUNCA mudar para `"index.ts"` — causa "Cannot resolve entry file".**

---

## Repo e Links

- **GitHub:** https://github.com/oluanferreira/maisum (private)
- **Expo Project (conta Luan):** https://expo.dev/accounts/oluanferreira/projects/maisum
- **Expo Project (conta Alex):** Sera criado no passo 4

---

## Checklist Pre-Build

Antes de rodar `eas build`, verificar:

- [ ] Estou logado na conta certa (`npx eas-cli whoami`)
- [ ] Estou na pasta `C:\Dev\maisum\apps\mobile`
- [ ] `package.json` tem `"main": "expo-router/entry"`
- [ ] `eas.json` NAO tem `requireCommit`
- [ ] `async-storage` e versao `~2.1.0` (nao 3.x)
- [ ] Todos os imports tem seus pacotes instalados
- [ ] Ultimo `git pull origin main` foi feito
- [ ] `npm install` foi rodado apos o pull
