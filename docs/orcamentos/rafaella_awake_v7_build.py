# v6 Awake / Rafaella — base v4 (cardapio + individuais + comparativo), refinada:
# 6 experiencias com valores finais; grupo = principal, por pessoa = referencia
# atmosfera com fotos maiores (nova sugestao 2x2); slide Elarah encurtado
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/proposta-rafaella-awake.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]
head = re.sub(r'<title>.*?</title>', '<title>Awake Health · Rafaella · Elarah</title>', head, count=1, flags=re.DOTALL)

extra = '''
<style>
  /* atmosfera 3x2 (mais fotos, grandes) */
  .mos2{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-top:16px}
  .mos2 figure{margin:0;border-radius:16px;overflow:hidden;position:relative;height:206px;border:1px solid var(--line);box-shadow:0 16px 38px -26px rgba(0,0,0,.36)}
  .mos2 img{width:100%;height:100%;object-fit:cover;display:block}
  .mos2 figcaption{position:absolute;left:0;right:0;bottom:0;padding:28px 16px 13px;color:#fff;font-size:12.5px;font-weight:600;letter-spacing:.04em;background:linear-gradient(to top,rgba(46,31,42,.86),transparent)}
  .menu-row .mprice .mpp{display:block;font-size:9.5px;color:var(--muted);margin-top:3px;font-weight:600;letter-spacing:.02em}
  /* aromas trio */
  .aroma{display:grid;grid-template-columns:.92fr 1.08fr;gap:30px;margin-top:18px;align-items:stretch}
  .aroma .aphoto{border-radius:18px;overflow:hidden;border:1px solid var(--line);box-shadow:0 18px 42px -26px rgba(0,0,0,.4);min-height:330px;position:relative}
  .aroma .aphoto img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .aroma .alist{display:flex;flex-direction:column;gap:13px;justify-content:center}
  .arow{display:grid;grid-template-columns:56px 1fr auto;gap:15px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:11px 17px 11px 11px;box-shadow:0 12px 28px -24px rgba(0,0,0,.3)}
  .arow .athumb{width:56px;height:56px;border-radius:10px;overflow:hidden;background:#eee}
  .arow .athumb img{width:100%;height:100%;object-fit:cover;display:block}
  .arow .aname{font-family:'DM Serif Display',serif;font-size:16.5px;color:var(--navy);line-height:1.08}
  .arow .arat{font-size:10px;color:var(--muted);margin-top:2px;letter-spacing:.02em}
  .arow .aprice{text-align:right;white-space:nowrap}
  .arow .aprice b{font-family:'DM Serif Display',serif;font-size:18px;color:var(--navy);display:block;line-height:1}
  .arow .aprice small{font-size:8.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
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


def menu_row(thumb, nome, rat, grupo, pp):
    return f'''      <div class="menu-row">
        <div class="mthumb"><img src="assets/{thumb}" alt="{nome}"></div>
        <div><div class="mname">{nome}</div><div class="mrat">{rat}</div></div>
        <div class="mdur">40 min</div>
        <div class="mprice"><b>R$ {pp}</b><small>por pessoa</small><span class="mpp">grupo até 15 · R$ {grupo}</span></div>
      </div>'''


def experiencia(racional, ta, tb, desc, films, porque, grupo, pp, badge, foot_r, two=False):
    figs = "\n".join(
        f'      <figure><img src="assets/{src}" alt="{cap}" style="object-position:{pos}"><figcaption>{cap}</figcaption></figure>'
        for src, pos, cap in films)
    cls = "filmstrip two" if two else "filmstrip"
    badge_html = f'\n        <div style="margin-bottom:11px"><span class="sugtag" style="margin-bottom:0">✦ {badge}</span></div>' if badge else ''
    return f'''
  <section class="slide">
{hsimple("A experiência")}
    <span class="eyebrow orange">◆ {racional}</span>
    <h2>{ta} <em>{tb}</em></h2>
    <p class="lead">{desc}</p>
    <div class="{cls}">
{figs}
    </div>
    <div class="expfoot">
      <div class="why">{badge_html}
        <b>Por que combina:</b> {porque}
        <div class="inc">Inclui experiência na Awake, materiais, condução, equipe e montagem.</div>
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


def arow(thumb, nome, rat, grupo, pp):
    return f'''        <div class="arow">
          <div class="athumb"><img src="assets/{thumb}" alt="{nome}"></div>
          <div><div class="aname">{nome}</div><div class="arat">{rat}</div></div>
          <div class="aprice"><b>R$ {grupo}</b><small>grupo · ~ R$ {pp}/pessoa</small></div>
        </div>'''


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
        <span class="eyebrow">✦ Um encontro criativo &amp; feminino</span>
        <h1>Uma manhã para <em>criar juntas</em></h1>
        <p class="lead">Uma experiência íntima para a Rafaella receber suas <strong>pacientes e convidadas</strong> na Awake Health. Uma manhã de <strong>pausa, criação e beleza</strong> — cada uma coloca a mão na massa e leva uma lembrança feita por ela.</p>
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
    <span class="eyebrow orange">◆ O clima do encontro</span>
    <h2>Uma manhã <em>para os sentidos</em></h2>
    <p class="lead">Mãos que criam, materiais delicados e boas conversas. Cuidado, criatividade e conexão — uma manhã feminina, leve e sofisticada. 🤍</p>
    <div class="mos2">
      <figure><img src="assets/nbc-aromas-criacao.jpg" alt="Mulheres criando juntas" style="object-position:center 35%"><figcaption>Criar junto</figcaption></figure>
      <figure><img src="assets/lipbalm-making.jpg" alt="Mãos preparando o lip balm" style="object-position:center 40%"><figcaption>Mão na massa</figcaption></figure>
      <figure><img src="assets/pinturataca.jpg" alt="Mãos pintando uma taça" style="object-position:center 45%"><figcaption>Mãos que criam</figcaption></figure>
      <figure><img src="assets/lipbalm1.jpg" alt="Ingredientes e cores beauty" style="object-position:center 50%"><figcaption>Detalhes beauty</figcaption></figure>
      <figure><img src="assets/aroma-experiencia-mesa.jpg" alt="Mesa de aromas autorais" style="object-position:center 55%"><figcaption>Aromas autorais</figcaption></figure>
      <figure><img src="assets/charm-bolsa.jpg" alt="Peça finalizada" style="object-position:center 50%"><figcaption>O que fica</figcaption></figure>
    </div>
    {foot("A atmosfera do encontro")}
  </section>'''

elarah = f'''
  <section class="slide statement">
{hsimple("A Elarah cuida de tudo")}
    <span class="eyebrow orange">◆ Sem preocupação com a operação</span>
    <h2>Vocês recebem.<br>A Elarah cuida <em>do resto</em>.</h2>
    <p class="lead">A experiência acontece na própria Awake — a produção inteira é nossa. Fornecedor, materiais, equipe, montagem, condução e organização por nossa conta.</p>
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
    <p class="lead">Seis experiências para comparar rapidamente. O valor principal é o do <strong>grupo fechado</strong> (até 15); o por pessoa é só referência. Todas com cerca de 40 min.</p>
    <div class="menu">
{menu_row("lipbalm.jpg", "Lip Balm Autoral", "autocuidado · beauty · personalização", "3.435", "229")}
{menu_row("pinturatacaaaa.jpg", "Pintura em Taça", "criatividade · leveza · interação", "2.985", "199")}
{menu_row("charm-bolsa.jpg", "Charm Bag Express", "personalização · moda · lembrança", "2.385", "159")}
{menu_row("velaaromaticaaaa2.jpg", "Vela Aromática", "aroma · ritual · aconchego", "2.835", "189")}
{menu_row("HOMESPRAY.jpg", "Aromatizador de Ambiente", "aroma · casa · bem-estar", "2.535", "169")}
{menu_row("aromatizador-corp.jpg", "Difusor de Ambiente", "aroma · casa · elegância", "2.835", "189")}
    </div>
    <p class="fineprint">✦ Investimento do grupo para até 15 participantes · valor por pessoa aproximado. Inclui experiência na Awake, materiais, condução, equipe e montagem.</p>
    {foot("Cardápio de experiências")}
  </section>'''

lip = experiencia(
    "Autocuidado · universo beauty · autoral", "Lip Balm", "Autoral",
    "Cada convidada cria o próprio lip balm natural — aromas, cores e textura.",
    [("lipbalm-making.jpg", "center 40%", "A experiência"), ("lipbalm-kit.jpg", "center 50%", "Os materiais"), ("lipbalm.jpg", "center 50%", "O que fica")],
    "autocuidado que conversa direto com o universo beauty da Awake — e cada uma leva o seu.",
    "3.435", "229", "Nossa sugestão · maior aderência ao encontro", "Lip Balm Autoral")

taca = experiencia(
    "Criatividade · leveza · interação", "Pintura de", "Taça",
    "Cada uma personaliza a própria taça de vidro, no seu tempo e no seu traço.",
    [("pinturataca.jpg", "center 45%", "A experiência"), ("pinturatacaaaa.jpg", "center 40%", "Os detalhes"), ("pintura-taca.jpg", "center 50%", "O que fica")],
    "leve e descontraída, solta o grupo e rende conversa e boas risadas.",
    "2.985", "199", None, "Pintura de Taça")

charm = experiencia(
    "Personalização · moda · lembrança afetiva", "Charm Bag", "Express",
    "Cada convidada compõe um charm exclusivo para a bolsa — pedras, letras e detalhes.",
    [("charmbar.jpg", "center 50%", "Os charms"), ("charm-bolsa.jpg", "center 50%", "O que fica")],
    "personalização afetiva: uma lembrança que continua com ela no dia a dia.",
    "2.385", "159", None, "Charm Bag Express", two=True)

aromas = f'''
  <section class="slide">
{hsimple("Aromas & bem-estar")}
    <span class="eyebrow orange">◆ Criar o próprio aroma</span>
    <h2>Aromas &amp; <em>bem-estar</em></h2>
    <p class="lead">Uma linha sensorial: cada convidada cria o próprio aroma e escolhe como levá-lo pra casa — vela, home spray ou difusor. 🌿</p>
    <div class="aroma">
      <div class="aphoto"><img src="assets/nbc-aromas-criacao.jpg" alt="Mulheres criando os próprios aromas" style="object-position:center 30%"></div>
      <div class="alist">
{arow("velaaromaticaaaa2.jpg", "Vela Aromática", "aroma · ritual · aconchego", "2.835", "189")}
{arow("HOMESPRAY.jpg", "Aromatizador de Ambiente", "aroma · casa · bem-estar", "2.535", "169")}
{arow("aromatizador-corp.jpg", "Difusor de Ambiente", "aroma · casa · elegância", "2.835", "189")}
      </div>
    </div>
    <p class="fineprint">✦ Investimento do grupo para até 15 participantes · valor por pessoa aproximado. Inclui experiência na Awake, materiais, condução, equipe e montagem.</p>
    {foot("Aromas & bem-estar")}
  </section>'''

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
        <tr><td class="exp">Lip Balm Autoral<small>Nossa sugestão</small></td><td class="grp">R$ 3.435</td><td class="pp">R$ 229</td></tr>
        <tr><td class="exp">Pintura em Taça</td><td class="grp">R$ 2.985</td><td class="pp">R$ 199</td></tr>
        <tr><td class="exp">Vela Aromática</td><td class="grp">R$ 2.835</td><td class="pp">R$ 189</td></tr>
        <tr><td class="exp">Difusor de Ambiente</td><td class="grp">R$ 2.835</td><td class="pp">R$ 189</td></tr>
        <tr><td class="exp">Aromatizador de Ambiente</td><td class="grp">R$ 2.535</td><td class="pp">R$ 169</td></tr>
        <tr><td class="exp">Charm Bag Express</td><td class="grp">R$ 2.385</td><td class="pp">R$ 159</td></tr>
      </tbody>
    </table>
    <p class="fineprint">✦ Investimento do grupo para até 15 participantes · média por pessoa aproximada. Inclui experiência na Awake, materiais, condução, equipe e montagem.</p>
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

deck = '<div class="deck">\n' + cover + atmosfera + elarah + cardapio + lip + taca + charm + aromas + comparativo + proximos + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/proposta-rafaella-awake.html"
io.open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| sections:", html.count('<section class="slide'))
