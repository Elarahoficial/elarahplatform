# Documentação Técnica — Plataforma Elarah

> **Objetivo deste acervo:** preservar todo o conhecimento acumulado no desenvolvimento da Elarah e permitir que **qualquer desenvolvedor assuma o projeto sem depender do histórico de conversas**.
>
> Consolidado em **14/07/2026** a partir da leitura direta do código-fonte (repositório `Elarahoficial/elarahplatform`), das Edge Functions, dos scripts SQL, dos workflows de CI/CD e da documentação interna existente em `docs/`.

---

## O que é a Elarah

**Elarah** é uma plataforma de **experiências criativas presenciais em São Paulo** (cerâmica, pintura, coquetelaria, gastronomia, etc.) com marketplace de parceiros, checkout próprio (Pix + cartão), vale-presentes/gift cards, linha de kits com frete ("Elarah em Casa"), painel administrativo completo (CRM, financeiro, marketing, redes sociais, agentes de IA) e app nativo iOS/Android empacotado com Capacitor.

- **Site público:** [elarah.com.br](https://elarah.com.br)
- **Domínio do app:** `com.elarah.app`
- **Projeto Supabase (público):** `nwijxjmenbfyehvscogs`

---

## Índice da documentação

| # | Documento | Conteúdo |
|---|-----------|----------|
| 01 | [Arquitetura](./01-Arquitetura.md) | Tecnologias, estrutura de pastas, fluxo da aplicação, frontend/backend/banco, camadas |
| 02 | [Funcionalidades](./02-Funcionalidades.md) | Todas as funcionalidades públicas e administrativas implementadas |
| 03 | [Decisões Técnicas](./03-Decisoes-Tecnicas.md) | Principais decisões de engenharia e o porquê de cada uma |
| 04 | [Configurações](./04-Configuracoes.md) | GitHub, Supabase, Codemagic, Mercado Pago, Apple, variáveis, webhooks, build, deploy |
| 05 | [Prompts e Instruções](./05-Prompts-e-Instrucoes.md) | Prompts, agentes de IA e instruções operacionais consolidadas |
| 06 | [Pendências](./06-Pendencias.md) | O que ainda precisa ser desenvolvido, corrigido ou melhorado |
| 07 | [Histórico](./07-Historico.md) | Resumo cronológico das principais etapas do projeto |
| 08 | [Infraestrutura](./08-Infraestrutura.md) | Serviços externos utilizados e como se conectam |
| 09 | [Segurança](./09-Seguranca.md) | Credenciais necessárias (sem valores) e onde cada uma é usada |
| 10 | [Manual do Desenvolvedor](./10-Manual-do-Desenvolvedor.md) | Instalar, executar, publicar e manter a plataforma |
| 11 | [Integrações](./11-Integracoes.md) | Detalhe de cada integração externa e das Edge Functions |
| 12 | [Banco de Dados](./12-Banco-de-Dados.md) | Esquema Postgres/Supabase: tabelas, RLS, funções, cron, storage |
| 13 | [Deploy](./13-Deploy.md) | Como o site, as funções e o app são publicados |

---

## Mapa mental rápido (para quem chega agora)

```
┌───────────────────────────────────────────────────────────────────┐
│  FRONTEND (site estático, sem framework/build)                     │
│  HTML + CSS + JS puro na RAIZ do repositório                       │
│  Servido por GitHub Pages em elarah.com.br (CNAME + .nojekyll)     │
│  Painel admin: admin.html + admin.js (~1MB) + módulos admin-*.js   │
└───────────────┬───────────────────────────────────────────────────┘
                │ chama via SDK (publishable key + RLS) e Edge Functions
                ▼
┌───────────────────────────────────────────────────────────────────┐
│  BACKEND (Supabase)                                                 │
│  • Auth (email/senha, Google, Apple)                               │
│  • Postgres (~50 tabelas, RLS pervasiva, funções, triggers)        │
│  • 24 Edge Functions (Deno/TS) — pagamentos, e-mail, frete, social │
│  • pg_cron (8 jobs: insights, reviews, recorrência, social, etc.)  │
│  • Storage (experience-images, financial-attachments)              │
│  • Vault (service role key para os cron jobs)                      │
└───────────────┬───────────────────────────────────────────────────┘
                │ integra com
                ▼
┌───────────────────────────────────────────────────────────────────┐
│  SERVIÇOS EXTERNOS                                                  │
│  Mercado Pago (Pix + cartão) · Stripe (gift card/legado) ·         │
│  Melhor Envio (frete Correios) · Instagram/Meta (social) ·         │
│  Resend (e-mail) · Anthropic Claude (IA opcional) ·                │
│  Google Places (prospecção) · Apple/App Store Connect · Codemagic  │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│  APP NATIVO (app/)                                                  │
│  Capacitor 7 empacota o site como WebView iOS/Android              │
│  Build iOS na nuvem via Codemagic → TestFlight → App Store         │
└───────────────────────────────────────────────────────────────────┘
```

---

## Convenções e observações importantes

- **Idioma do código:** predominantemente **português** nos nomes de tabelas, campos e comentários (`fornecedor`=supplier, `reserva/booking`, `cupom`, `frete`, `repasse`=pagamento ao parceiro, `vagas`=slots).
- **Sem etapa de build no frontend:** o site é HTML/CSS/JS servido diretamente. Não há webpack/vite/react. Isso é intencional (ver [Decisões Técnicas](./03-Decisoes-Tecnicas.md)).
- **Segredos:** nenhum valor secreto está neste acervo nem versionado no repositório. Apenas a Supabase URL e a *publishable key* (anon, protegida por RLS) são públicas e ficam no frontend por design.
- **A documentação `docs/` pré-existente** (guias operacionais, auditorias, calendários) continua válida e é referenciada nos documentos deste acervo.
