# 05 — Prompts e Instruções

Consolidação dos prompts de IA, agentes e instruções operacionais usados no desenvolvimento e na operação da Elarah.

---

## 1. Agente de Diagnóstico IA (`analytics-insights`)

Agente autônomo que roda diariamente (pg_cron 08h BRT), lê métricas reais e produz um diagnóstico de crescimento. Modo **regras** (grátis, default) ou **IA/Claude** (`mode: "ai"`).

**System prompt (Claude), fonte de verdade em `supabase/functions/analytics-insights/index.ts`:**
> "Você é a analista de crescimento (growth / CRO) da Elarah, uma plataforma de curadoria de experiências e presentes em São Paulo. Recebe métricas reais do site e das vendas e produz um diagnóstico HONESTO e PRÁTICO de onde a empresa está pecando, o que funciona e o que fazer.
>
> Regras: responda em português do Brasil, tom direto e acolhedor (você fala com a fundadora). Foque nos gargalos do funil e dê recomendações acionáveis. Seja específico com os números recebidos; não invente dados. Se o volume for baixo demais, diga isso. Não sugira ações automáticas — você só recomenda."

**User prompt:** envia as métricas reais dos últimos N dias em JSON e pede o diagnóstico. Configuração da chamada: `model=ANTHROPIC_MODEL` (default `claude-opus-4-8`), `max_tokens=16000`, `thinking: adaptive`, saída estruturada via `json_schema` (`INSIGHTS_SCHEMA`).

**Invocação manual (teste):**
```json
{ "trigger": "manual", "send_email": true, "mode": "rules" }
```
(troque `"mode":"ai"` para usar o Claude.)

---

## 2. Agente CEO (`admin-ceo.js`)
Client-side, **custo zero** (regras, sem LLM). Agrega receita/vendas/tráfego/ocupação/parceiros vs. a semana anterior e produz o plano **"Se eu fosse o CEO, nas próximas 2 semanas eu faria:"** — lista de ações priorizadas (1 alta → 3 baixa). Renderiza em `#ceo-root`.

## 3. Agente de Eventos IA (`admin-eventos.js`)
Client-side (regras). Analisa best sellers, categorias mais desejadas, sazonalidade, ocupação das próximas turmas e sugere parceiros/ações. Renderiza em `#evtia-root` (dentro de Analytics).

## 4. Análise social estratégica (`admin-social-analysis.js`)
Gera um relatório de **10 seções** sobre o Instagram: posicionamento, bio, conteúdo, engajamento, funil, concorrência, oportunidades, plano de ação, calendário editorial e resumo executivo. Exportável.

## 5. Prospect finder (`prospect-finder` / `admin-prospect-finder.js`)
Busca leads via Google Places e alimenta o pipeline de `prospects`. Roda semanalmente (cron) ou sob demanda pelo botão "Buscar leads agora".

---

## 6. Instruções operacionais (guias em `docs/`)
Os documentos abaixo funcionam como **runbooks** e devem ser seguidos como instruções:

| Guia | Instrução que documenta |
|---|---|
| `docs/deploy-sem-terminal/COMO-SUBIR-SEM-TERMINAL.md` | Subir Edge Function pelo dashboard web (sem terminal). |
| `docs/frete-melhor-envio.md` | Conectar o Melhor Envio (OAuth, secrets, redirect, migração de tokens). |
| `docs/backup-e-restauracao.md` | Baixar e restaurar o backup criptografado. |
| `docs/windsor-import.md` | Exportar dados do Instagram no Windsor.ai e importar no admin (regra de ouro: coluna `date` real + só campos de mídia). |
| `docs/app-store-privacidade.md` | Checklist de privacidade para submeter o iOS. |
| `docs/app-store-auditoria-final.md` | Auditoria de aprovação na App Store. |
| `docs/auditoria-mercado-pago-2026-07.md` | Passos de modernização e deploy do Mercado Pago. |
| `docs/agente-diagnostico-ia.md` | Setup e operação do agente de diagnóstico. |
| `docs/calendario-editorial-junho-2026.md`, `docs/calendario-seo-longtail.md`, `docs/captacao-loops-ugc.md`, `docs/kit-backlinks-sp.md` | Instruções de marketing/conteúdo/SEO/UGC. |
| `supabase/functions/SOCIAL_INTEGRATION_SETUP.md` | Setup da integração social (OAuth, migrations, secrets, cron). |

---

## 7. Instruções de desenvolvimento (convenções do repositório)
- **Branches de trabalho:** o desenvolvimento acontece em branches `claude/*`; PRs são mergeados na branch principal. Para o deploy automático de funções, a branch precisa estar na lista `on.push.branches` de `deploy-edge-functions.yml`.
- **Idioma:** nomes de tabelas/campos/commits em português.
- **Commits:** padrão convencional em PT (`feat(...)`, `fix(...)`, `build(ios): ...`).
- **Frontend sem build:** editar HTML/CSS/JS diretamente; não há transpiler.
- **Nunca commitar segredos:** `.env*` está no `.gitignore`.
- **`verify_jwt`:** fonte de verdade em `supabase/config.toml` + flags no workflow de deploy.

---

## 8. Prompt sugerido para "assumir o projeto" (handoff)
> "Você vai assumir a manutenção da Elarah. Leia `docs/projeto/README.md` e os 13 documentos do acervo. A stack é site estático (HTML/CSS/JS) em GitHub Pages + Supabase (Auth, Postgres com RLS, 24 Edge Functions em Deno/TS, pg_cron) + app Capacitor iOS/Android via Codemagic. Pagamentos por Mercado Pago (Pix/cartão) e Stripe (gift/legado); frete via Melhor Envio; e-mail via Resend; social via Instagram Graph API. Segredos ficam nos Edge Function Secrets do Supabase, GitHub Secrets e Codemagic. Nunca coloque a lógica de preço/frete/rateio no cliente — ela vive nas Edge Functions com service role. Antes de mexer em pagamentos, entenda `_shared/booking_guard.ts`, `financial.ts` e os webhooks idempotentes."
