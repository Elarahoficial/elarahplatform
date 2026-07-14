# 12 — Banco de Dados

Esquema PostgreSQL/Supabase definido como ~150 scripts SQL versionados em `sql/`. Os arquivos são aplicados em sequência; muitos seguem o padrão **tabela base + evolução** (ex.: `elarah_bookings.sql` cria a tabela; `elarah_bookings_*.sql` acrescentam colunas/triggers). Todas as tabelas em `public` salvo indicação.

> **Convenção de nomes:** `elarah_<domínio>[_<variante/versão>].sql`. Sufixos `_v2`, `_hotfix`, `_backfill`, `_diagnostico`, `_seed` são iterações — **não** novas tabelas. Termos PT: *fornecedor*=supplier, *reserva/booking*, *cupom*, *frete*, *repasse*=pagamento ao parceiro, *vagas*=slots.

---

## Domínios e tabelas

### 1. Setup, auth e fornecedores
`profiles` (perfis ligados a `auth.users`, papel/admin), `experiences` (catálogo central de experiências), `experience_suppliers` (N fornecedores por experiência com rateio), `fornecedores_metadata` (metadados/CRM do fornecedor).
Funções/segurança: `handle_new_user`, `is_admin`, `set_updated_at`, trigger `protect_profile_privileged_columns` (anti-escalonamento). Evolução de experiências: `_ordem`, `_visibility`, `_variants`, `_variant_items`, `_pacote_datas`, merges e limpezas (com logs `experiences_merge_log`, `experiences_name_cleanup_log`).

### 2. Reservas / Bookings
`bookings` (id, experience_id, dados do cliente, status, quantidade, refs de pagamento). Evoluções: feedback, followup, fornecedor (+autofill trigger), fornecedor_avisado, mp, quantidade (RPCs de decremento), repasse_feito_at, telefone.

### 3. Slots e recorrência
`experience_slots` (data/hora com `vagas`/`vagas_restantes`), `experience_recurrence_rules` (regras que materializam slots). Funções: `sync_slot_vagas_restantes`, `decrement/increment_slot_vagas`, `decrement/increment_experience_vagas`, `materialize_recurrence_slots`, `materialize_all_active_recurrences`, guards de delete/cleanup, normalizadores de horário.

### 4. Cupons e gift cards
`coupons` (código, tipo/valor, limites, ativo), `coupon_uses` (ledger de resgate), `gift_cards` (código, saldo, status). Funções: `preview/hold/refund/register_coupon_use`, `preview/hold/refund_gift_card`. Evoluções: bridge (unifica hold cupom+gift), categoria (escopo por categoria), contagem só quando pago.

### 5. Financeiro / Ledger
`v_financial_ledger` é uma **VIEW** (evolui v2→v8: fallback de fornecedor, gift cards, unificado, comissão). Tabelas: `financial_categories`, `financial_expenses`. Funções de relatório: `financial_summary`, `financial_by_supplier`, `financial_by_experience`, `financial_evolution`. Bucket privado `financial-attachments`.

### 6. Vendas manuais e inventário
`manual_sales` + funções `manual_sale_match_slot`, `manual_sale_adjust_vagas`, `manual_sale_sync_inventory`, `reconcile_all_vagas`. Variações: eventos/tipos, pagamentos, data da venda, fornecedor_avisado, confirmation_sent. RPC `get_my_manual_sales`.

### 7. CRM / Prospects (B2C + B2B)
`prospects`, `prospect_interactions`, `prospect_templates` (B2C); `b2b_prospects`, `b2b_prospect_interactions`, `b2b_prospect_templates` (B2B); `interesses`. Funções: `promote_prospect_to_fornecedor`, `log_prospect_interaction`, dedup (`_norm_*`, `find_matching_fornecedor`). Muitos seeds/enrich.

### 8. byElarah
`byelarah_items` (catálogo de originais), `byelarah_submissions` (submissões), `analytics_events` (stream de eventos do front). Variações: originals, purchasable, followup_tracking.

### 9. Conteúdo / operação / marketing
`content_calendar` (calendário editorial), `routine_templates`, `routine_tasks`, `content_pieces`, `routine_notes` (rotina operacional), `marketing_skills`. Funções `ensure_routine_week`, `_op_week_day`.

### 10. Growth / captação
`growth_areas`, `growth_tasks`, `growth_kpis`.

### 11. Social
`social_accounts` (contas/tokens OAuth criptografados), `social_posts`, `social_post_metrics`, `social_sync_runs`, `social_oauth_states` (CSRF). Função `purge_expired_oauth_states`.

### 12. Reviews, newsletter, broadcast
`reviews`, `newsletter_campaigns`/`newsletter_sends`, `email_broadcasts`/`email_opt_outs` (lista de supressão).

### 13. Campanhas (Dia dos Namorados)
`campaign_overrides`, `campaign_waitlist`, `campaign_upcoming_experiences`. Scripts extensos de curadoria `elarah_ddn_*` são operações de dados, não tabelas.

### 14–17. Diversos
`event_venues` (locais de evento); `analytics_insights_runs` (diagnóstico IA); loyalty via RPC `sync_loyalty_card()` (sem tabela); `melhor_envio_tokens` (frete OAuth). `elarah_extensions.sql` habilita extensões + `gift_cards` + funções de sync de vagas.

---

## Tabelas canônicas (~50)
`profiles`, `experiences`, `experience_suppliers`, `fornecedores_metadata`, `bookings`, `experience_slots`, `experience_recurrence_rules`, `coupons`, `coupon_uses`, `gift_cards`, `financial_categories`, `financial_expenses`, `manual_sales`, `prospects`, `prospect_interactions`, `prospect_templates`, `b2b_prospects`, `b2b_prospect_interactions`, `b2b_prospect_templates`, `interesses`, `byelarah_items`, `byelarah_submissions`, `analytics_events`, `content_calendar`, `routine_templates`, `routine_tasks`, `content_pieces`, `routine_notes`, `marketing_skills`, `growth_areas`, `growth_tasks`, `growth_kpis`, `social_accounts`, `social_posts`, `social_post_metrics`, `social_sync_runs`, `social_oauth_states`, `reviews`, `newsletter_campaigns`, `newsletter_sends`, `email_broadcasts`, `email_opt_outs`, `campaign_overrides`, `campaign_waitlist`, `campaign_upcoming_experiences`, `event_venues`, `analytics_insights_runs`, `melhor_envio_tokens`, `experiences_merge_log`, `experiences_name_cleanup_log`.

---

## Row Level Security (RLS)
Usado de forma pervasiva — **130+ políticas** em ~38 arquivos. Padrão comum: **escrita só admin** (via `public.is_admin()`), **leitura pública/autenticada**. Maiores concentrações: social (13), setup (12), byelarah analytics (10), DDN (8), growth/rotina (6 cada), CRM (5 cada), buckets de storage (4 cada).

## Cron jobs (pg_cron) — 8 agendamentos
| Job | Agendamento | Arquivo |
|---|---|---|
| `elarah-analytics-insights-daily` | `0 11 * * *` (08h BRT) | `elarah_analytics_insights_cron.sql` |
| `elarah-prospect-finder-weekly` | `0 11 * * 1` (segundas) | `elarah_prospect_finder_cron.sql` |
| `elarah-reviews-request-daily` | `0 12 * * *` | `elarah_reviews_cron.sql` |
| `elarah-recurrence-materialize-daily` | `0 6 * * *` | `elarah_recurrence_materialize_cron.sql` |
| `elarah-newsletter-daily` | `0 11 * * *` | `elarah_newsletter_cron.sql` |
| `elarah-sync-instagram` | `0 3,9,15,21 * * *` (4×/dia) | `elarah_social_cron.sql` |
| `elarah-refresh-social-tokens` | `0 4 1 * *` (mensal) | `elarah_social_cron.sql` |
| `elarah-purge-oauth-states` | `0 5 * * *` | `elarah_social_cron.sql` |

Os jobs leem a service role key do **Vault** (`elarah_service_role_key`).

## Storage buckets
- **`experience-images`** — leitura pública, escrita admin (`elarah_experience_images_storage.sql`).
- **`financial-attachments`** — privado, só admin (`elarah_financial_storage.sql`).

## Como aplicar / backup
- **Aplicar SQL:** Supabase → SQL Editor → cole e rode o script desejado (ordem lógica: setup → domínio → evoluções → seeds). Muitos arquivos são idempotentes ou operações one-off (backfills/merges/diagnósticos).
- **Backup/restore:** `backup-database.yml` (diário, criptografado). Procedimento de restore em `docs/backup-e-restauracao.md`.
