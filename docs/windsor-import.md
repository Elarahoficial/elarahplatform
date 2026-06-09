# 📥 Como importar dados do Windsor AI na aba Redes Sociais

Guia passo a passo pra configurar a exportação do **Windsor AI** e importar
no painel **Redes Sociais** do admin da Elarah, sem ajustes manuais.

> **Regra de ouro:** o que faz a importação funcionar é ter uma **coluna de
> DATA real** (`date`) e os dados em nível de post. "Dia da semana"
> (`week_day_iso`) **não** é uma data e não funciona.

---

## ✅ Passo a passo (Windsor AI)

### 1. Abrir a configuração
- Entre em **windsor.ai** com a conta `contato.elarah@gmail.com`.
- Aba **"1. Adicionar dados"** → confirme que o **Instagram da Elarah** está conectado.

### 2. Definir a fonte de dados (IMPORTANTE)
- No painel **Filtros** → **Fonte de dados**.
- Selecione **Instagram** (a conta da Elarah diretamente).
- ❌ **NÃO use "Blended Data"** — ele espalha cada métrica numa linha
  diferente e gera aquele monte de `nulo`.

### 3. Definir o período
- **Intervalo de datas** → use **Last 90 days** (ou mais).
- 7 dias é pouco: o painel precisa de pelo menos ~2 posts por categoria
  pra achar padrões.

### 4. Selecionar os campos (seção "Campos")
Marque **exatamente** estes — são os que a plataforma reconhece sozinha:

**Obrigatórios:**
| Campo no Windsor | Vira na plataforma |
|---|---|
| `date` (data de publicação) | data ← **o que mais importa** |
| `media_type` | tipo (Reel/Feed/Carrossel/Story) |
| `caption` (legenda) | usado pra classificar a ocasião automaticamente |
| `reach` | alcance |
| `likes` | curtidas |
| `comments` | comentários |
| `saves` | salvamentos |
| `shares` | compartilhamentos |
| `permalink` | link do post |

**Recomendados (crescimento/conversão):**
| Campo no Windsor | Vira na plataforma |
|---|---|
| `follows` / `follower_count` | novos seguidores |
| `website_clicks` / `link_clicks` | cliques no link |
| `impressions` ou `video_views` | visualizações |
| `total_interactions` | engajamento total (reserva) |

**DESMARQUE** (não usamos e poluem o arquivo):
- `week_day_iso` (dia da semana — não é data!)
- `story_swipe_forward`, `story_taps_back`, `story_taps_forward`

### 5. Conferir a pré-visualização
- Na aba **Dados**, olhe a tabela.
- ✅ Deve ter uma coluna de **data** com datas reais (ex: `2026-06-08`).
- ✅ As células de métrica **não** devem estar cheias de `nulo`.
- Se estiver tudo `nulo` → volte ao passo 2 (provavelmente ainda está em
  "Blended Data" ou a conta não está selecionada).

### 6. Baixar o CSV
- Na barra da URL (`https://connectors.windsor.ai/all?...`), clique no
  ícone **⌄ (círculo com seta pra baixo)** ou nos **⋮ (três pontinhos)**.
- Escolha **"Download CSV" / "Baixar CSV"**.
- Alternativa: aba **"2. Pré-visualização e Destino"** → seção **Destino**
  → **CSV** (ou Google Sheets → `Arquivo > Baixar > CSV`).

---

## ✅ Passo a passo (plataforma Elarah)

### 7. Importar
- Admin → aba **Redes Sociais**.
- Botão **↑ Importar CSV** → selecione o arquivo baixado.
- Deve aparecer: *"Importação concluída: X novos, Y atualizados."*

### 8. Gerar a análise
- Botão **🎯 Análise estratégica** → relatório completo é gerado
  (métricas-chave, desempenho por formato/ocasião, plano de ação,
  calendário e resumo executivo).

### 9. Rotina contínua (recomendado)
- Repita a exportação **toda semana** (ou configure o destino automático
  do Windsor pra Google Sheets e exporte de lá).
- A importação **atualiza** posts já existentes (dedupe por data + link),
  então pode reimportar sem medo de duplicar.

---

## 🩺 Se der erro "Nenhum post válido encontrado"

A própria plataforma agora diz a causa. As mais comuns:

| Mensagem | O que fazer |
|---|---|
| *"não tem coluna de DATA real"* | Marque o campo `date` no Windsor (passo 4). |
| *"nenhuma métrica reconhecida"* | Marque reach/likes/comments/etc. (passo 4). |
| *"sintoma de Blended Data"* | Troque a fonte pra Instagram (passo 2). |

> Se aparecer uma coluna com nome diferente que não foi reconhecida,
> mande o **cabeçalho** (primeira linha do CSV) pro time de dev adicionar
> ao mapeamento em `admin-social.js` (constante `FIELD_ALIASES`).

---

## 📌 Formato nativo (referência)

A plataforma também aceita um CSV manual neste formato:

```
platform,type,date,link,views,reach,likes,comments,saves,shares,followers,linkClicks,conversions,caption,tags
instagram,reel,2026-06-08,https://...,12600,10500,860,64,150,290,11,130,9,"Legenda do post","tag1, tag2"
```

- **date**: aceita `2026-06-08`, `08/06/2026` ou `2026-06`.
- **caption**: usada pra detectar a ocasião automaticamente.
- **conversions**: reservas reais (só fica preciso com UTM nos links).
