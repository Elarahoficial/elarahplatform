# Orçamentos — Elarah

Histórico das propostas comerciais montadas para clientes.

## Experiência Hidratei — Lançamento de Produto

Proposta de ativação (colagem criativa / personalização com brilho) para
influenciadoras no lançamento da Hidratei.

Fotos usadas na proposta (em `/assets`):
- `hidrateicapa.jpg` — **capa** (mãos na caderneta + Instax, tons quentes)
- `hidrateicolagem.jpg` — foto grande da Opção 1 (colagem)
- `hidrateiadesivo.jpg` / `hidrateiadesivo1.jpg` — cartela de adesivos + washi tapes (Opção 1)
- `hidrateibedezzled.jpg` — caixa com escova "Hidratei" bedazzled + piranha (Opção 2 e 3)
- `hidrateimeninas.jpg` — meninas fazendo a colagem (Opção 3)
- `hidrateilogo.jpg` — logo Hidratei

### Versões
- `..._v6.pdf` — versão recebida (base de trabalho).
- `..._v7.pdf` — adesivos da Opção 1 ampliados ~22%.
- `..._v8.pdf` — adesivos da Opção 1 ampliados ~50%.
- `..._v9.pdf` — **atual**. Reúne:
  1. **Capa** trocada para `hidrateicapa.jpg` (recortada + leve escurecimento à
     esquerda pra legibilidade do título).
  2. **Opção 1** — adesivos ~50% maiores (moldura, cantos, sombra e inclinações
     preservados).
  3. **Opção 2** — foto trocada para `hidrateibedezzled.jpg` (caixa bedazzled).
  4. **Opção 3** — três fotos quadradas em cascata: meninas colando + caderno da
     colagem + caixa piranha/escova.
  5. **Última página** — emojis das 4 razões trocados por numerais 01–04 em
     laranja (harmoniza com o resto); removido o emoji do botão de WhatsApp.

`build.py` gera a v9 a partir da v6 aplicando todas as edições (requer o
PDF-fonte e as imagens em `/assets`).
