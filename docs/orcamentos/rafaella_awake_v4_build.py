# v4 Awake / Rafaella — reorganizacao comercial:
# capa humana -> atmosfera (mosaico) -> Elarah cuida de tudo -> CARDAPIO (5) ->
# paginas individuais (3 core, filmstrip) -> COMPARATIVO de investimento (5) -> proximos passos
# Sem opcionais. Precos so os confirmados (3 core); Vela/Aromatizador = a confirmar.
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/proposta-rafaella-awake.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]

head = re.sub(r'<title>.*?</title>', '<title>Awake Health · Rafaella · Elarah</title>', head, count=1, flags=re.DOTALL)

extra = '''
<style>
  /* cardapio (menu comparativo) */
  .menu{display:flex;flex-direction:column;gap:11px;margin-top:18px}
  .menu-row{display:grid;grid-template-columns:66px 1fr auto auto;gap:20px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:15px;padding:11px 20px 11px 11px;box-shadow:0 12px 30px -26px rgba(0,0,0,.32)}
  .menu-row .mthumb{width:66px;height:66px;border-radius:11px;overflow:hidden;background:#eee}
  .menu-row .mthumb img{width:100%;height:100%;object-fit:cover;display:block}
  .menu-row .mname{font-family:'DM Serif Display',serif;font-size:18px;color:var(--navy);line-height:1.08}
  .menu-row .mrat{font-size:11px;color:var(--muted);margin-top:3px;letter-spacing:.02em}
  .menu-row .mdur{font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--orange-dark);font-weight:700;white-space:nowrap}
  .menu-row .mprice{text-align:right;white-space:nowrap;min-width:96px}
  .menu-row .mprice b{font-family:'DM Serif Display',serif;font-size:19px;color:var(--navy);display:block;line-height:1}
  .menu-row .mprice small{font-size:8.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted)}
  .menu-row .mprice .todo{font-family:'DM Sans',sans-serif;font-size:12px;font-style:italic;color:var(--orange-dark);font-weight:600}
  /* filmstrip (paginas individuais) */
  .filmstrip{display:grid;grid-template-columns:repeat(3,1fr);gap:13px;margin-top:16px}
  .filmstrip.two{grid-template-columns:1fr 1fr}
  .filmstrip figure{margin:0;border-radius:15px;overflow:hidden;position:relative;height:240px;border:1px solid var(--line);box-shadow:0 14px 32px -26px rgba(0,0,0,.34)}
  .filmstrip img{width:100%;height:100%;object-fit:cover;display:block}
  .filmstrip figcaption{position:absolute;left:0;right:0;bottom:0;padding:24px 13px 10px;color:#fff;font-size:10.5px;font-weight:600;letter-spacing:.05em;background:linear-gradient(to top,rgba(46,31,42,.86),transparent)}
  .expfoot{display:grid;grid-template-columns:1.1fr .9fr;gap:34px;margin-top:20px;align-items:center}
  .expfoot .why{font-size:13px;color:var(--navy-soft);line-height:1.5}
  .expfoot .why b{color:var(--navy)}
  .expfoot .inc{font-size:11px;color:var(--muted);margin-top:9px;line-height:1.5}
  .ginv.r{text-align:right}
  /* comparativo */
  .ctable{width:100%;border-collapse:collapse;margin-top:18px;border-radius:16px;overflow:hidden;box-shadow:0 16px 40px -30px rgba(0,0,0,.32)}
  .ctable th{background:var(--navy);color:#fff;text-align:left;padding:13px 22px;font-size:9.5px;letter-spacing:.11em;text-transform:uppercase;font-weight:700}
  .ctable th.r{text-align:right}
  .ctable td{padding:15px 22px;border-bottom:1px solid var(--line);background:var(--card);vertical-align:middle}
  .ctable tr:last-child td{border-bottom:none}
  .ctable tr:nth-child(even) td{background:#FBF6EF}
  .ctable td.exp{font-weight:700;color:var(--navy);font-size:14.5px}
  .ctable td.exp small{display:block;font-weight:600;color:var(--muted);font-size:10.5px;letter-spacing:.02em;margin-top:2px}
  .ctable td.grp{text-align:right;font-family:'DM Serif Display',serif;font-size:23px;color:var(--navy);white-space:nowrap}
  .ctable td.pp{text-align:right;color:var(--muted);font-size:12.5px;font-weight:600;white-space:nowrap}
  .ctable td .todo{font-family:'DM Sans',sans-serif;font-size:12.5px;font-style:italic;color:var(--orange-dark);font-weight:600}
  .statement h2{font-size:44px;line-height:1.08}
</style>
'''
head = head.replace("</head>", extra + "</head>", 1)


def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'


def hsimple(kicker):
    return f'''    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">{kicker}</span></div>
    </div>'''


def menu_row(thumb, nome, rat, preco_html):
    return f'''      <div class="menu-row">
        <div class="mthumb"><img src="assets/{thumb}" alt="{nome}"></div>
        <div><div class="mname">{nome}</div><div class="mrat">{rat}</div></div>
        <div class="mdur">40 min</div>
        <div class="mprice">{preco_html}</div>
      </div>'''


def price_pp(v):
    return f'<b>~ R$ {v}</b><small>por pessoa</small>'


def experiencia(racional, titulo_a, titulo_b, desc, films, porque, inclui, grupo, pp, badge, foot_r, two=False):
    figs = "\n".join(
        f'      <figure><img src="assets/{src}" alt="{cap}" style="object-position:{pos}"><figcaption>{cap}</figcaption></figure>'
        for src, pos, cap in films)
    cls = "filmstrip two" if two else "filmstrip"
    badge_html = f'\n        <div style="margin-bottom:11px"><span class="sugtag" style="margin-bottom:0">✦ {badge}</span></div>' if badge else ''
    return f'''
  <section class="slide">
{hsimple("A experiência")}
    <span class="eyebrow orange">◆ {racional}</span>
    <h2>{titulo_a} <em>{titulo_b}</em></h2>
    <p class="lead">{desc}</p>
    <div class="{cls}">
{figs}
    </div>
    <div class="expfoot">
      <div class="why">{badge_html}
        <b>Por que combina:</b> {porque}
        <div class="inc">{inclui}</div>
      </div>
      <div class="ginv r">
        <span class="gl">Investimento do grupo</span>
        <div class="gbig">R$ {grupo}</div>
        <div class="gsub">Experiência completa para até 15 participantes</div>
        <div class="gpp">equivale a aproximadamente <b>R$ {pp}</b> por pessoa</div>
      </div>
    </div>
    {foot(foot_r)}
  </section>'''


cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right">
        <span class="kicker">Experiência · manhã na Awake Health</span>
        <span class="compass">Rafaella <span></span><small>Awake Health · Jardim América</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Um encontro sensorial &amp; autoral</span>
        <h1>Uma manhã para <em>criar juntas</em></h1>
        <p class="lead">Uma experiência íntima e feminina para a Rafaella receber suas <strong>pacientes e convidadas</strong> na Awake Health. Uma manhã de <strong>pausa, criação e beleza</strong> — cada uma coloca a mão na massa e leva uma lembrança feita por ela.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>até 15</b> convidadas</span>
          <span class="chip">Sábado · 03/10 · manhã</span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip">Awake Health · Jardim América</span>
        </div>
      </div>
      <div class="cover-photo"><img src="assets/pinturatacameninas.jpg" alt="Mulheres sorrindo enquanto pintam taças" style="object-position:center 28%"></div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Experiências já realizadas para grupos como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)</div>
    {foot("Awake Health · Rafaella")}
  </section>'''

atmosfera = f'''
  <section class="slide">
{hsimple("A atmosfera")}
    <span class="eyebrow orange">◆ A atmosfera do encontro</span>
    <h2>Uma manhã <em>para os sentidos</em></h2>
    <p class="lead">Mãos que criam, materiais delicados e boas conversas. Cuidado, criatividade e conexão — uma manhã feminina, leve e sofisticada.</p>
    <div class="gstrip">
      <figure><img src="assets/pinturataca.jpg" alt="Mãos pintando uma taça" style="object-position:center 45%"><figcaption>Mãos que criam</figcaption></figure>
      <figure><img src="assets/vela-grupo-oficina.jpg" alt="Mulheres criando juntas" style="object-position:center 35%"><figcaption>Criar junto</figcaption></figure>
      <figure><img src="assets/lipbalm1.jpg" alt="Ingredientes e cores beauty" style="object-position:center 50%"><figcaption>Detalhes beauty</figcaption></figure>
      <figure><img src="assets/piranha-cristais-materiais.jpg" alt="Materiais e pedras delicadas" style="object-position:center 40%"><figcaption>Materiais delicados</figcaption></figure>
      <figure><img src="assets/vela-aromatica-real.jpg" alt="Aromas e texturas" style="object-position:center 45%"><figcaption>Aromas &amp; bem-estar</figcaption></figure>
      <figure><img src="assets/charm-bolsa.jpg" alt="Peça finalizada" style="object-position:center 50%"><figcaption>O que fica</figcaption></figure>
    </div>
    {foot("A atmosfera do encontro")}
  </section>'''

elarah = f'''
  <section class="slide statement">
{hsimple("A Elarah cuida de tudo")}
    <span class="eyebrow orange">◆ Sem preocupação com a operação</span>
    <h2>Vocês recebem as pacientes e convidadas.<br>A Elarah cuida <em>do resto</em>.</h2>
    <p class="lead">A experiência acontece na própria Awake — a produção inteira é nossa.</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">🤍</div><h3>No próprio espaço</h3><p>Levamos tudo até a Awake — sem deslocamento nem logística para vocês.</p></div>
      <div class="infocard"><div class="ico">✨</div><h3>Produção completa</h3><p>Fornecedor, materiais, equipe e montagem por nossa conta.</p></div>
      <div class="infocard"><div class="ico">🌿</div><h3>Do começo ao fim</h3><p>Condução e organização — vocês só recebem e aproveitam.</p></div>
    </div>
    {foot("A Elarah cuida de tudo")}
  </section>'''

cardapio = f'''
  <section class="slide">
{hsimple("Cardápio de experiências")}
    <span class="eyebrow orange">◆ Escolham a cara da manhã</span>
    <h2>O <em>cardápio</em> de experiências</h2>
    <p class="lead">Uma curadoria para comparar rapidamente — cada uma vira a atividade e a lembrança da manhã. Todas com cerca de 40 min.</p>
    <div class="menu">
{menu_row("lipbalm.jpg", "Lip Balm Autoral", "autocuidado · beauty · personalização", price_pp("280"))}
{menu_row("pinturatacaaaa.jpg", "Pintura em Taça", "criatividade · leveza · interação", price_pp("180"))}
{menu_row("charm-bolsa.jpg", "Charm de Bolsa", "personalização · moda · lembrança afetiva", price_pp("179"))}
{menu_row("vela-aromatica-real.jpg", "Vela Aromática", "aroma · ritual · bem-estar", '<span class="todo">a confirmar</span>')}
{menu_row("aromatizador-corp.jpg", "Aromatizador de Ambiente", "aroma · casa · wellness", '<span class="todo">a confirmar</span>')}
    </div>
    <p class="fineprint">✦ Valores por pessoa (aproximados) · experiência para até 15 convidadas, na Awake. Vela Aromática e Aromatizador de Ambiente com valores a confirmar.</p>
    {foot("Cardápio de experiências")}
  </section>'''

lip = experiencia(
    "Autocuidado · universo beauty · autoral", "Lip Balm", "Autoral",
    "Cada convidada cria o próprio lip balm natural — aromas, cores e textura.",
    [("lipbalm.jpg", "center 50%", "A criação"), ("lipbalm1.jpg", "center 50%", "Aromas &amp; cores")],
    "autocuidado que conversa direto com o universo beauty da Awake — e cada uma leva o seu.",
    "Inclui experiência na Awake, materiais, condução, equipe e montagem.",
    "4.200", "280", "Nossa sugestão · maior aderência ao encontro", "Lip Balm Autoral", two=True)

taca = experiencia(
    "Criatividade · leveza · interação", "Pintura de", "Taça",
    "Cada uma personaliza a própria taça de vidro, no seu tempo e no seu traço.",
    [("pinturataca.jpg", "center 45%", "A experiência"), ("pinturatacaaaa.jpg", "center 40%", "Os detalhes"), ("pintura-taca.jpg", "center 50%", "O que fica")],
    "leve e descontraída, solta o grupo e rende conversa e boas risadas.",
    "Inclui experiência na Awake, materiais, condução, equipe e montagem.",
    "2.700", "180", None, "Pintura de Taça")

charm = experiencia(
    "Personalização · moda · lembrança afetiva", "Charm de", "Bolsa",
    "Cada convidada compõe um charm exclusivo — pedras, letras e detalhes.",
    [("piranha-cristais-materiais.jpg", "center 40%", "A curadoria"), ("charmbar.jpg", "center 50%", "Os charms"), ("charm-bolsa.jpg", "center 50%", "O que fica")],
    "personalização afetiva: uma lembrança que continua com ela no dia a dia.",
    "Inclui experiência na Awake, materiais, condução, equipe e montagem.",
    "2.685", "179", None, "Charm de Bolsa")

comparativo = f'''
  <section class="slide">
{hsimple("Comparativo de investimento")}
    <span class="eyebrow orange">◆ Fácil de comparar</span>
    <h2>Investimento <em>por experiência</em></h2>
    <p class="lead">O valor principal é o do grupo fechado, para até 15 participantes. A média por pessoa é só uma referência.</p>
    <table class="ctable">
      <thead>
        <tr><th>Experiência</th><th class="r">Investimento do grupo</th><th class="r">Média por pessoa</th></tr>
      </thead>
      <tbody>
        <tr><td class="exp">Lip Balm Autoral<small>Nossa sugestão</small></td><td class="grp">R$ 4.200</td><td class="pp">R$ 280</td></tr>
        <tr><td class="exp">Pintura em Taça</td><td class="grp">R$ 2.700</td><td class="pp">R$ 180</td></tr>
        <tr><td class="exp">Charm de Bolsa</td><td class="grp">R$ 2.685</td><td class="pp">R$ 179</td></tr>
        <tr><td class="exp">Vela Aromática</td><td class="grp"><span class="todo">a confirmar</span></td><td class="pp"><span class="todo">a confirmar</span></td></tr>
        <tr><td class="exp">Aromatizador de Ambiente</td><td class="grp"><span class="todo">a confirmar</span></td><td class="pp"><span class="todo">a confirmar</span></td></tr>
      </tbody>
    </table>
    <p class="fineprint">✦ Investimento do grupo para até 15 participantes · média por pessoa aproximada. Inclui experiência na Awake, materiais, condução, equipe e montagem. Vela Aromática e Aromatizador de Ambiente com valores a confirmar.</p>
    {foot("Comparativo de investimento")}
  </section>'''

proximos = f'''
  <section class="slide">
{hsimple("Próximos passos")}
    <span class="eyebrow orange">◆ Próximos passos</span>
    <h2>Vamos <em>desenhar juntas</em></h2>
    <p class="lead">Me conta qual experiência mais combina com a manhã de vocês que eu confirmo a disponibilidade, alinho os detalhes e cuido de toda a produção. 🤍</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">1️⃣</div><h3>Escolham</h3><p>A experiência que mais combina com a manhã e com as convidadas.</p></div>
      <div class="infocard"><div class="ico">2️⃣</div><h3>Confirmamos &amp; alinhamos</h3><p>Disponibilidade, data e todos os detalhes com você.</p></div>
      <div class="infocard"><div class="ico">3️⃣</div><h3>Cuidamos de tudo</h3><p>No dia, é só receber as convidadas e viver o momento.</p></div>
    </div>
    <div class="quote">
      Rafaella, é só me dar o sinal que eu deixo tudo pronto para a Awake. 🤍<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = '<div class="deck">\n' + cover + atmosfera + elarah + cardapio + lip + taca + charm + comparativo + proximos + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/proposta-rafaella-awake.html"
io.open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| sections:", html.count('<section class="slide'))
