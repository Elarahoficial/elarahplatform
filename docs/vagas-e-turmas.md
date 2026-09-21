# Vagas e turmas — como funciona de verdade

Escrito depois do caso "Pintura em Taça, 10/10, **-34 / 8**".

## A regra que explica tudo

**Você não digita as vagas restantes. Elas são calculadas.**

De 10 em 10 minutos o banco refaz a conta de cada turma, do zero:

```
vagas restantes = vagas totais
                − reservas do site (pagas e pendentes) daquela turma
                − vendas manuais (pagas e pendentes) daquela turma
```

Isso significa que:

- Editar "vagas livres" na mão **não gruda** — a varredura seguinte
  sobrescreve com a conta real.
- **Apagar o horário e digitar de novo não zera as vagas.** A conta é
  refeita a partir de quem comprou, não a partir da linha do formulário.

Se a conta está errada, o problema é o **vínculo** de alguma venda com a
turma — não o número.

## Turma = data + horário

Uma turma (`experience_slots`) é identificada por **data + horário**. É o
que a cliente compra. Cada reserva e cada venda manual aponta pra uma
turma específica.

O que o cadastro faz hoje, ao salvar:

| Você faz | O que acontece |
|---|---|
| Deixa data e horário como estão | Mesma turma, mesmas reservas |
| Apaga a linha do horário e digita **o mesmo** | Mesma turma — nada é recriado |
| Muda a **data** de uma turma **sem reserva** | A turma passa pra data nova |
| Muda a **data** de uma turma **com reserva** | A antiga vira **histórico** (some do site, guarda as reservas) e a data nova nasce **com as vagas cheias** |
| Tira um horário **sem reserva** | Apagado |
| Tira um horário **com reserva** | Vira histórico, não é apagado |

Ou seja: **pra reabrir uma experiência com vagas cheias, é só trocar a
data e salvar.** Não precisa apagar horário nenhum.

## O que causou o "-34 / 8"

1. A turma foi apagada e recriada com id novo.
2. `bookings.slot_id` e `manual_sales.slot_id` são `ON DELETE SET NULL` —
   apagar a turma não apaga as vendas, só **arranca o vínculo** delas.
3. Na varredura seguinte, cada venda manual solta era readivinhada por
   `manual_sale_match_slot()`, que tinha um atalho: *"se a experiência só
   tem UMA turma ativa, é essa"*. Como tinha sobrado uma turma só, **todas
   as vendas manuais do ano inteiro** caíram em cima da turma nova.
4. 8 vagas − 42 pessoas = **-34**. E o site passa a tratar a turma como
   esgotada: o checkout recusa a compra.

Corrigido em duas frentes:

- **Cadastro** (`experiences-data.js` → `saveSlots`): a turma é
  reaproveitada por data+horário, e turma com reserva nunca é apagada —
  vira histórico.
- **Banco** (`sql/elarah_fix_vagas_turma_recriada.sql`): venda com data só
  casa com turma da mesma data; a varredura para de readivinhar e passa a
  usar o vínculo gravado na hora da venda.

## Quando a conta parecer errada

Rode no SQL Editor do Supabase:

```sql
select public.reconcile_all_vagas();
```

E depois, pra ver o que ficou solto, as três consultas do fim de
`sql/elarah_fix_vagas_turma_recriada.sql`:

- turmas com vaga negativa;
- vendas manuais sem turma;
- reservas do site sem turma.

Venda manual **sem data preenchida** é a fonte mais comum de conta torta:
sem data, o banco não tem como saber de que turma ela é. Preencher a data
da venda no painel de Vendas manuais resolve.

## Fechar lugares sem venda (cortesia, grupo, reserva por fora)

Não mexa em "vagas livres" — registre uma **venda manual** com a data e o
horário da turma. Aí a vaga sai da conta e continua saindo depois de
qualquer varredura.
