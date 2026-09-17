# Acessos da equipe — dois logins com painel enxuto

Até agora o painel tinha dois estados: ou a pessoa era `admin` e via **tudo**
(contabilidade, compras, analytics, base de clientes), ou não entrava. Não dava
pra contratar alguém pro comercial sem entregar o caixa junto.

Agora cada conta pode ver só as abas da área dela.

---

## 1. Criar as duas contas (5 minutos, no Supabase)

Painel do Supabase → **Authentication** → **Users** → botão **Add user** →
*Create new user*.

Faça isso duas vezes, marcando **Auto Confirm User** nas duas (senão a conta
nasce esperando confirmação de email):

| | Login (email) | Senha sugerida |
|---|---|---|
| Orçamentos & Eventos | `eventos@elarah.com.br` | `Sereno-Aurora-24` |
| Comercial | `comercial@elarah.com.br` | `Vinhedo-Lavanda-37` |

Sobre as senhas: são sugestões geradas agora, fáceis de ditar no WhatsApp e
difíceis de adivinhar. Troque se quiser — o que não vale é repetir a mesma nas
duas.

**Como se troca a senha depois.** O site ainda não tem "alterar senha" dentro de
Minha conta: o caminho é o **Esqueci minha senha** da tela de login, que manda um
link por email. Só que esse link vai pro endereço da conta — e
`eventos@elarah.com.br` / `comercial@elarah.com.br` só recebem email se essas
caixas existirem de verdade no seu provedor.

Se as caixas não existirem, quem troca a senha é você, pelo Supabase:
**Authentication → Users → clique nos três pontinhos da linha →
*Reset password* / *Update password*.** Vale marcar isso: no dia em que uma
delas sair, trocar a senha ali é o que corta o acesso na hora.

**Por que email de função e não o email pessoal delas:** quando uma sair, você
passa o login pra próxima e não precisa mexer em mais nada. O histórico do que
foi feito continua amarrado à área, não à pessoa.

## 2. Ligar cada conta às abas

Abra o **SQL Editor** do Supabase e rode o arquivo
[`sql/elarah_equipe_acessos.sql`](../sql/elarah_equipe_acessos.sql) inteiro.

Ele cria a coluna que guarda o acesso, atualiza as travas de segurança e já
liga os dois emails aos conjuntos de abas. Se você usou outros emails, troque
nas duas linhas marcadas **TROQUE AQUI** no meio do arquivo.

Se aparecer `NÃO ACHEI a conta …`, é porque o passo 1 ainda não foi feito pra
aquele email — crie a conta e rode o arquivo de novo.

## 3. Conferir

Elas entram pelo mesmo endereço de sempre: **elarah.com.br/admin.html**, com
email e senha. O menu já vai aparecer cortado.

---

## O que cada uma vê

| Aba | Orçamentos & Eventos | Comercial |
|---|:---:|:---:|
| Visão geral | ✅ *extra* | ✅ *extra* |
| O que fazer hoje | ✅ | ✅ |
| Feedbacks | ✅ | ✅ |
| Eventos | ✅ | — |
| Eventos privados | ✅ | — |
| Experiências | ✅ | ✅ |
| By Elarah | ✅ | ✅ |
| Cotação | ✅ | — |
| Locais p/ eventos | ✅ | — |
| Parceiros | ✅ | ✅ |
| Prospecção | — | ✅ |
| Interesses | ✅ *extra* | ✅ *extra* |

As duas marcadas como *extra* não estavam na sua tabela; eu incluí porque
ajudam e não mostram dinheiro nenhum:

- **Visão geral** é a tela de entrada do painel — só contadores (quantas
  usuárias, parceiras, experiências). Sem ela, a pessoa cai numa aba qualquer
  ao logar.
- **Interesses** é a lista de quem levantou a mão pedindo experiência. É lead
  na mão pra quem trabalha com venda.

Tirar qualquer uma das duas é um clique (veja abaixo).

**Ficou de fora das duas, de propósito:** Compras, Gift Cards, Cupons,
Contabilidade, Analytics, Usuários e Novidades — é onde moram faturamento,
dados de pagamento e o disparo pra base inteira.

---

## Mudar o acesso depois, sem SQL

Entre no painel com a sua conta → aba **Usuários** → procure a pessoa pelo nome
→ botão **Editar acesso** na última coluna.

Abre uma janela com todas as abas. Dá pra marcar uma a uma ou usar um dos dois
atalhos de perfil pronto. Desmarcar tudo e salvar tira a pessoa do painel (ela
volta a ser cliente comum do site, sem perder a conta).

Esse botão só aparece pra quem tem **acesso total** — ou seja, pra você. A
comercial não consegue se dar contabilidade, nem promover ninguém: a trava está
no banco, não só na tela.

---

## O que isto é, e o que não é

Isto organiza o **trabalho**: cada uma entra e vê a área dela, sem se perder em
aba que não é sua e sem esbarrar no caixa sem querer.

Não é um cofre. No banco, as duas continuam com `role = 'admin'`, então as
permissões do Supabase seguem liberando os dados pra elas — quem souber mexer no
console do navegador alcança o que o menu escondeu. Para o uso normal (pessoa
contratada trabalhando no painel) resolve; para guardar segredo de quem quer
burlar, não. Se um dia isso virar necessidade, o caminho é reescrever as
permissões tabela por tabela no banco — dá trabalho, e é melhor fazer quando a
equipe crescer.

Enquanto isso, o que protege de verdade é o básico: senha diferente pra cada
uma, e tirar o acesso no mesmo dia em que alguém sai.
