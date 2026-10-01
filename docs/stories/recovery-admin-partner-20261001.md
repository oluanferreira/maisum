# Recuperação do admin e aprovação de parceiros

## Critérios e validação

- [x] Consultas com papel admin recebem usuários e todos os estabelecimentos.
- [x] Novo cadastro gera restaurante pendente e inativo, com contatos normalizados.
- [x] Admin vê o novo cadastro na fila de pendentes.
- [x] Aprovação atualiza status, atividade e papel do responsável.
- [x] Estabelecimento aprovado fica visível no catálogo público.
- [x] Responsável aprovado acessa apenas o próprio perfil e restaurante.
- [x] Rejeição oculta restaurante e retira papel de parceiro.
- [x] Parceiro não consegue alterar aprovação/atividade/responsável nem promover a conta.
- [x] Edição normal do endereço permanece permitida.
- [x] Métricas usam pagamentos reais e vigência do acesso, sem preços antigos fixos.
- [x] Teste SQL executado no projeto novo dentro de BEGIN/ROLLBACK; nenhum fixture persistiu.
- [ ] Conferir listas e botões no navegador com login de super_admin (sessão solicitada).
- [x] Paginação de usuários e busca no banco substituem limite silencioso de 100 contas.
- [x] Liberação anual manual usa somente os campos atuais do banco; referência AbacatePay removida.
- [x] Fallback para Supabase antigo removido do admin; produção, prévia e desenvolvimento configurados no projeto novo.
- [x] Teste SQL de liberação anual, adição e expiração de cupom administrativo passou em rollback.
- [x] Lint e typecheck do monorepo passaram; verificações do admin repetidas após mudanças TS e passaram.
- [x] npm test executado: comando encerrou com sucesso, mas o monorepo não tem tarefas de teste configuradas. Teste funcional foi a regressão SQL descrita acima.
- [x] Build remoto passou e deployment dpl_DVKQzu5EWderAiBUggoPGQLNzvei foi promovido para admin.appmaisum.com.br. Login retornou HTTP 200; arquivos públicos usam o Supabase novo, sem referência ao antigo.

## Dados reais após rollback

408 perfis (357 consumidores, 50 parceiros, 1 super_admin), 41 estabelecimentos, 29 ativos,
17 assinantes com acesso vigente, 38 cupons usados. MRR calculado pelos pagamentos: R$38,33.
O snapshot de dados é de 22/09/2026; dados posteriores dependem da recuperação do projeto antigo.

## Arquivos

- supabase/migrations/20261001134421_repair_admin_metrics_and_approval.sql
- supabase/migrations/20261001135504_protect_partner_approval_fields.sql
- supabase/tests/admin_partner_approval.sql
- docs/stories/recovery-admin-partner-20261001.md
- apps/admin-web/src/app/(dashboard)/users/page.tsx
- .gitignore (exclusão do .env.local criado pela Vercel)
- apps/admin-web/src/lib/supabase/config.ts
