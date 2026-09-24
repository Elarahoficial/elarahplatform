# Proposta Elarah · Aeventotheca (Marina Dias) · 02/10 · Shopping Iguatemi Campinas
# DUAS experiencias no mesmo dia, mesmo peso:
#   11h · LACES · Criacao de Sais de Banho · 12-15 pessoas
#   17h · Piselli · Chas, ervas & blends · 10 pessoas
# Fornecedores em cotacao: SEM nomes, SEM valores, SEM duracao, SEM ingredientes obrigatorios, SEM itens nao confirmados.
# Placeholders discretos e editaveis. Padrao visual corporativo Elarah (head.html). Paleta herbal + gold + marfim.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

reps = {
    "--orange:#B08D4C;": "--orange:#9C8A5E;",
    "--orange-dark:#8A6D34;": "--orange-dark:#786A3F;",
    "--navy:#12362B;": "--navy:#2C3A30;",
    "--navy-soft:#3A5A4E;": "--navy-soft:#586657;",
    "--blue-accent:#B08D4C;": "--blue-accent:#9C8A5E;",
    "#EFF3EE": "#F5F2EA", "#DCE8E1": "#E6E0D2", "#CBB06E": "#C3AE7C",
    "rgba(18,54,43,.16)": "rgba(44,58,48,.16)",
    "rgba(10,28,22,.86)": "rgba(28,36,30,.86)",
    "rgba(10,28,22,.85)": "rgba(28,36,30,.85)",
    "rgba(10,28,22,.82)": "rgba(28,36,30,.82)",
}
for a, b in reps.items():
    head = head.replace(a, b)

xcss = '''
  /* visao geral do dia */
  .daygrid{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:20px}
  .daycard{background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 16px 36px -24px rgba(0,0,0,.3);display:flex;flex-direction:column}
  .daycard .dph{height:210px;overflow:hidden;position:relative}
  .daycard .dph img{width:100%;height:100%;object-fit:cover;display:block}
  .daycard .dtime{position:absolute;top:13px;left:13px;background:var(--navy);color:#fff;font-family:'DM Serif Display',serif;font-size:19px;padding:5px 15px;border-radius:999px}
  .daycard .db{padding:20px 24px 24px;flex:1;display:flex;flex-direction:column}
  .daycard .dvenue{font-size:10px;letter-spacing:.15em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .daycard h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:23px;color:var(--navy);line-height:1.06;margin:5px 0 0}
  .daycard .dsub{font-size:12.5px;color:var(--navy-soft);line-height:1.45;margin-top:9px;font-style:italic}
  .daycard .dppl{font-size:11.5px;letter-spacing:.03em;color:var(--muted);border-top:1px solid var(--line);padding-top:12px;margin-top:14px}
  /* legenda de espaço (contexto do local) */
  .vcap{margin-top:12px;font-size:11px;letter-spacing:.02em;color:var(--muted);line-height:1.5}
  .vcap b{color:var(--orange-dark);letter-spacing:.06em;text-transform:uppercase;font-size:10px}
  /* 4 etapas */
  .steps.s4{grid-template-columns:repeat(4,1fr);gap:14px}
  .steps.s4 .step{padding:20px 18px}
  .steps.s4 .step .num{font-size:30px}
  /* tabela de investimento */
  .invt{width:100%;border-collapse:collapse;margin-top:20px;border-radius:16px;overflow:hidden;box-shadow:0 16px 34px -24px rgba(0,0,0,.3)}
  .invt td{padding:22px 26px;border-bottom:1px solid var(--line);background:var(--card);vertical-align:middle}
  .invt tr:last-child td{border-bottom:none}
  .invt .nm{font-family:'DM Serif Display',serif;font-size:21px;color:var(--navy);line-height:1.1}
  .invt .nm span{display:block;font-family:'DM Sans',sans-serif;font-size:10.5px;letter-spacing:.06em;color:var(--muted);text-transform:uppercase;margin-top:5px;font-weight:600}
  .invt .vl{text-align:right;font-family:'DM Serif Display',serif;font-size:25px;color:var(--orange-dark);white-space:nowrap}
  .invt .ph{color:var(--muted);letter-spacing:.14em}
  .invt tr.tot td{background:var(--navy)}
  .invt tr.tot .nm{color:#fff}
  .invt tr.tot .vl{color:#fff}
  .invt tr.tot .nm span{color:rgba(255,255,255,.7)}
  /* nota discreta / placeholder */
  .phnote{margin-top:14px;font-size:11.5px;color:var(--muted);line-height:1.5;border-left:2px solid var(--line);padding-left:14px}
  .phnote b{color:var(--navy-soft)}
</style>'''
head = head.replace("</style>", xcss, 1)


def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'


def img(src, alt, pos="center 50%"):
    return f'<img src="assets/{src}" alt="{alt}" style="object-position:{pos}">'


def head_block(kicker, main, accent, small):
    return f'''    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right">
        <span class="kicker">{kicker}</span>
        <span class="compass">{main} <span>{accent}</span><small>{small}</small></span>
      </div>
    </div>'''


def head_simple(kicker):
    return f'''    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">{kicker}</span></div>
    </div>'''


def daycard(time, venue, name, sub, ppl, src, alt, pos="center 50%"):
    return (f'<div class="daycard"><div class="dph"><span class="dtime">{time}</span>{img(src, alt, pos)}</div>'
            f'<div class="db"><span class="dvenue">{venue}</span><h3>{name}</h3>'
            f'<p class="dsub">{sub}</p><div class="dppl">{ppl}</div></div></div>')


def bfeat(tag, title, feats, src, alt, pos="center 50%"):
    lis = "".join(f'<li><span class="st">✦</span>{f}</li>' for f in feats)
    return (f'<div class="bfeat"><div class="bphoto">{img(src, alt, pos)}</div>'
            f'<div class="bbody"><span class="btag">{tag}</span><h3>{title}</h3>'
            f'<ul class="feat">{lis}</ul></div></div>')


def steps4(items):
    st = "".join(f'<div class="step"><div class="num">{i+1}</div><h3>{t}</h3><p>{d}</p></div>'
                 for i, (t, d) in enumerate(items))
    return f'<div class="steps s4">{st}</div>'


def incl(src, alt, title, items, pos="center 50%"):
    lis = "".join(f'<li><span>✦</span>{i}</li>' for i in items)
    return (f'<div class="invbox">'
            f'<div style="flex:0 0 40%;min-width:250px;border-radius:18px;overflow:hidden;position:relative;min-height:280px;border:1px solid var(--line)">'
            f'<img src="assets/{src}" alt="{alt}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:{pos}"></div>'
            f'<div class="incl" style="flex:1;min-width:290px;display:flex;flex-direction:column;justify-content:center">'
            f'<span class="vt" style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)">{title}</span>'
            f'<ul>{lis}</ul></div></div>')


PROOF = "Experiências corporativas já realizadas para times como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)"

# ============================ 1 · CAPA ============================
cover = f'''
  <section class="slide">
{head_block("Proposta para Aeventotheca", "Iguatemi", "Campinas", "02.10")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Duas experiências · um dia</span>
        <h1>Dois momentos, <em>uma curadoria</em></h1>
        <p class="lead">Duas formas de criar presença. Entre aromas, texturas, ervas e sabores, desenhamos experiências que transformam a pausa em descoberta — e deixam algo para levar. ✨</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip">🗓️ <b>02.10</b></span>
          <span class="chip">📍 Iguatemi Campinas</span>
          <span class="chip"><b>Duas</b> experiências</span>
        </div>
      </div>
      <div class="cover-photo">{img("florseca.jpg", "Ervas e flores secas dispostas com cuidado editorial", "center 50%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Proposta · Aeventotheca")}
  </section>'''

# ============================ 2 · VISÃO GERAL DO DIA ============================
visao = f'''
  <section class="slide">
{head_simple("Visão geral do dia")}
    <span class="eyebrow orange">◆ 02.10 · Iguatemi Campinas</span>
    <h2>O dia em <em>dois momentos</em></h2>
    <p class="lead">Um dia que começa com as mãos na criação e termina em torno da mesa.</p>
    <div class="daygrid">
      {daycard("11h", "LACES · Iguatemi Campinas", "Criação de Sais de Banho", "De manhã, criar com as mãos.", "12–15 pessoas", "sais-grupo.jpg", "Grupo criando os próprios sais de banho, com sais e ervas", "center 60%")}
      {daycard("17h", "Piselli · Iguatemi Campinas", "Chás, ervas &amp; blends", "No fim da tarde, descobrir aromas e sabores.", "10 pessoas", "cha-blend-funil.jpg", "Mãos compondo um blend de ervas em torno da mesa", "center 45%")}
    </div>
    {foot("Visão geral do dia")}
  </section>'''

# ============================ 3 · EXPERIÊNCIA 1 — SAIS ============================
exp1 = f'''
  <section class="slide">
{head_simple("Experiência 1 · Sais de banho")}
    <span class="eyebrow orange">◆ 11h · LACES · 12–15 pessoas</span>
    <h2>Criação de <em>sais de banho</em></h2>
    <p class="lead">Entre sais, ervas, aromas e texturas, cada convidada constrói uma composição própria — escolhida, misturada e finalizada por ela. Um pequeno ritual de criação que continua em casa.</p>
    {bfeat("11h · LACES", "Sais de banho autorais",
           ["O aroma e a textura guiam cada escolha",
            "Uma composição única, misturada à mão",
            "O produto final segue para casa com cada uma"],
           "sais-composicao.jpg", "Mãos compondo sais de banho com ervas e flores secas", "center 50%")}
    <p class="vcap"><b>LACES · Iguatemi Campinas</b> &nbsp;·&nbsp; uma ativação criativa montada dentro da loja, só para o grupo.</p>
    {foot("Experiência 1 · Sais de banho")}
  </section>'''

# ============================ 4 · COMO ACONTECE — SAIS ============================
como1 = f'''
  <section class="slide">
{head_simple("Como acontece · Sais")}
    <span class="eyebrow orange">◆ Como a experiência acontece</span>
    <h2>Explorar, criar &amp; <em>levar</em></h2>
    <p class="lead">Do primeiro aroma à composição pronta para levar, o grupo é conduzido por quatro momentos.</p>
    {steps4([
        ("Explorar", "O primeiro contato acontece pelo aroma, pela textura e pela descoberta dos elementos disponíveis."),
        ("Escolher", "Cada convidada encontra as combinações que mais conversam com as suas preferências."),
        ("Criar", "As escolhas ganham forma em uma composição única, feita à mão."),
        ("Levar", "A criação é finalizada para seguir com cada participante para casa."),
    ])}
    <p class="phnote">A curadoria final de aromas e elementos é desenhada com cuidado para o grupo e para o dia.</p>
    {foot("Como acontece · Sais")}
  </section>'''

# ============================ 5 · O QUE ESTÁ CONTEMPLADO — SAIS ============================
cont1 = f'''
  <section class="slide">
{head_simple("O que está contemplado · Sais")}
    <span class="eyebrow orange">◆ O que está contemplado</span>
    <h2>Cuidamos do cenário. <em>Elas cuidam da criação.</em></h2>
    <p class="lead">Desenhamos a experiência para que cada detalhe — da chegada ao produto final — aconteça com fluidez.</p>
    {incl("sais-grupo.jpg", "Grupo reunido criando os próprios sais de banho", "No cuidado da Elarah",
          ["Curadoria e condução da experiência",
           "Materiais e insumos da criação",
           "Embalagem do produto final",
           "Montagem, desmontagem e operação",
           "Deslocamento e produção do dia"],
          "center 55%")}
    <p class="phnote">Na LACES, montamos uma <b>ativação dentro da loja</b> — e podemos prever a estrutura complementar necessária para a dinâmica.</p>
    {foot("O que está contemplado · Sais")}
  </section>'''

# ============================ 6 · EXPERIÊNCIA 2 — CHÁS ============================
exp2 = f'''
  <section class="slide">
{head_simple("Experiência 2 · Chás & blends")}
    <span class="eyebrow orange">◆ 17h · Piselli · 10 pessoas</span>
    <h2>Chás, ervas &amp; <em>blends</em></h2>
    <p class="lead">Folhas, aromas e diferentes combinações entram em cena para uma pausa guiada pela curiosidade. O grupo explora ingredientes, descobre afinidades e transforma a experiência em sabor.</p>
    {bfeat("17h · Piselli", "Uma mesa de aromas &amp; sabores",
           ["Ervas e combinações para descobrir e sentir",
            "Preparo e degustação em torno da mesa",
            "Uma composição própria para provar e levar"],
           "cha-blend-funil.jpg", "Mãos compondo um blend de ervas, com xícaras servidas", "center 45%")}
    <p class="vcap"><b>Piselli · Iguatemi Campinas</b> &nbsp;·&nbsp; um encontro em torno da mesa, no clima acolhedor do restaurante.</p>
    {foot("Experiência 2 · Chás & blends")}
  </section>'''

# ============================ 7 · COMO ACONTECE — CHÁS ============================
como2 = f'''
  <section class="slide">
{head_simple("Como acontece · Chás")}
    <span class="eyebrow orange">◆ Como a experiência acontece</span>
    <h2>Descobrir, criar &amp; <em>degustar</em></h2>
    <p class="lead">Dos primeiros aromas à combinação servida, o grupo é conduzido por quatro momentos — sempre em torno da mesa.</p>
    {steps4([
        ("Descobrir", "Conhecer diferentes ervas, aromas e notas, uma a uma."),
        ("Explorar", "Experimentar combinações e perceber como cada ingrediente transforma o resultado."),
        ("Criar", "Construir uma composição própria, conforme o formato final escolhido."),
        ("Degustar", "Finalizar em torno da mesa, com preparo, prova e troca."),
    ])}
    <p class="phnote">A etapa de criação de blend é desenhada conforme o formato final da experiência.</p>
    {foot("Como acontece · Chás")}
  </section>'''

# ============================ 8 · O QUE ESTÁ CONTEMPLADO — CHÁS ============================
cont2 = f'''
  <section class="slide">
{head_simple("O que está contemplado · Chás")}
    <span class="eyebrow orange">◆ O que está contemplado</span>
    <h2>Da curadoria <em>à mesa</em></h2>
    <p class="lead">Desenhamos cada etapa para o grupo apenas sentar, descobrir e provar.</p>
    {incl("cha-ervas-selecao.jpg", "Ervas soltas em potes e a seleção de um blend sobre a mesa", "No cuidado da Elarah",
          ["Curadoria e condução da experiência",
           "Ervas, insumos e utensílios",
           "Preparo e degustação",
           "Operação e produção do dia"],
          "center 45%")}
    <p class="phnote">No <b>Piselli</b>, o encontro acontece em torno da mesa — a estrutura do restaurante já acomoda o grupo.</p>
    {foot("O que está contemplado · Chás")}
  </section>'''

# ============================ 9 · INVESTIMENTO ============================
PH = '<span class="ph">R$ ______</span>'
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>As duas <em>experiências</em></h2>
    <p class="lead">Cada experiência com o seu valor, e o total do dia.</p>
    <table class="invt">
      <tbody>
        <tr><td class="nm">Sais de Banho<span>11h · LACES · 12–15 pessoas</span></td><td class="vl">{PH}</td></tr>
        <tr><td class="nm">Chás &amp; Blends<span>17h · Piselli · 10 pessoas</span></td><td class="vl">{PH}</td></tr>
        <tr class="tot"><td class="nm">Investimento total<span>as duas experiências · 02.10</span></td><td class="vl">{PH}</td></tr>
      </tbody>
    </table>
    <p class="phnote">Investimentos finais apresentados após a definição do formato escolhido.</p>
    {foot("Investimento")}
  </section>'''

# ============================ 10 · PRÓXIMOS PASSOS ============================
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Próximos passos</span>
    <h2>Como <em>seguimos</em></h2>
    <p class="lead">Um caminho simples até a reserva da data — cuidamos de cada etapa com vocês.</p>
    {steps4([
        ("Formato", "Alinhamos o formato das duas experiências."),
        ("Aprovação", "Com a proposta aprovada, seguimos com os detalhes."),
        ("Data", "Confirmamos a data — 02.10, no Iguatemi Campinas."),
        ("Produção", "Ajustes finais e produção de cada momento."),
    ])}
    <div class="cta">
      <h2>Seguimos <em>juntos?</em> ✦</h2>
      <p>Aprovado o formato, alinhamos cada detalhe e reservamos o dia 02.10 no Iguatemi Campinas.</p>
      <div class="cta-actions">
        <a class="btn-wa" href="https://wa.me/5511914455930?text=Oi%2C%20Elarah!%20Sobre%20a%20proposta%20das%20experi%C3%AAncias%20no%20Iguatemi%20Campinas." target="_blank" rel="noopener">💬 Falar no WhatsApp</a>
        <div class="contact-links">
          <span>+55 (11) 91445-5930</span>
          <a href="https://instagram.com/elarah.oficial" target="_blank" rel="noopener">@elarah.oficial</a>
          <a href="https://elarah.com.br" target="_blank" rel="noopener">elarah.com.br</a>
        </div>
      </div>
    </div>
    <p class="fineprint">Proposta de experiências da Elarah para a Aeventotheca (a/c Marina Dias) — dois momentos no dia 02.10, no Shopping Iguatemi Campinas: Criação de Sais de Banho às 11h na LACES (12–15 pessoas) e Chás, ervas &amp; blends às 17h no Piselli (10 pessoas). Formato e estrutura de cada experiência desenhados conforme o dia; investimentos finais apresentados após a definição do formato escolhido. Proposta válida mediante confirmação de data e disponibilidade de agenda.</p>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n'
        + cover + visao + exp1 + como1 + cont1 + exp2 + como2 + cont2 + investimento + proximos
        + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/experiencia-aeventotheca-iguatemi.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
