# Backup automático do banco — como funciona e como restaurar

O backup roda pelo GitHub Actions (workflow `.github/workflows/backup-database.yml`),
de graça, todo dia. Cada backup é **comprimido e criptografado** com a senha
guardada no segredo `BACKUP_PASSPHRASE`.

## Onde ficam os backups
GitHub → aba **Actions** → workflow **"Backup do Banco (Supabase)"** →
clique numa execução → seção **Artifacts** → baixe o arquivo
`elarah-backup-AAAA-MM-DD_HHMMUTC.sql.gz.gpg`.

Ficam disponíveis por **90 dias**.

## Segredos usados (Settings → Secrets and variables → Actions)
- `SUPABASE_DB_PASSWORD` — **só a senha** do banco (a *database password* do
  Supabase). Cole ela pura; o host/usuário/porta ficam fixos no workflow.
- `BACKUP_PASSPHRASE` — senha forte inventada por você. **Sem ela o backup
  não pode ser aberto.** Guarde num lugar seguro (gerenciador de senhas).

## Como restaurar um backup (só se precisar)

Precisa de um computador com `gpg`, `gzip` e `psql` instalados.

1. Baixe o artifact e descriptografe (vai pedir a `BACKUP_PASSPHRASE`):
   ```bash
   gpg --output backup.sql.gz --decrypt elarah-backup-XXXX.sql.gz.gpg
   gunzip backup.sql.gz          # gera backup.sql
   ```

2. Restaure no banco de destino (o mesmo projeto ou um projeto novo do
   Supabase). Use a connection string do Session Pooler:
   ```bash
   psql "postgresql://postgres.<REF>:<SENHA>@<HOST>.pooler.supabase.com:5432/postgres" \
     -f backup.sql
   ```

> **Dica:** se o objetivo for recriar a plataforma do zero num projeto novo,
> rode primeiro os arquivos de `sql/` (que criam as tabelas e as policies de
> segurança) e depois importe os **dados** do backup. Os arquivos de `sql/`
> são a "planta" da estrutura; o backup são os dados.

## Testar o backup manualmente
GitHub → aba **Actions** → **"Backup do Banco (Supabase)"** →
botão **Run workflow**. Em ~1 minuto o artifact aparece na execução.
