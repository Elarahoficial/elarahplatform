# v5 Awake / Rafaella — de volta ao PADRAO ELARAH dos aprovados (estilo Fernanda/Shoyu):
# capa -> atmosfera (vibe) -> A Elarah cuida de tudo -> 1 pagina por experiencia (phero) -> proximos passos
# Sem menu/filmstrip/tabela (o que deixou a v4 conceitual). Investimento do grupo em destaque.
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/proposta-rafaella-awake.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]
head = re.sub(r'<title>.*?</title>', '<title>Awake Health · Rafaella · Elarah</title>', head, count=1, flags=re.DOTALL)


def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'


def hsimple(kicker):
    return f'''    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">{kicker}</span></div>
    </div>'''


def experiencia(racional, ta, tb, desc, foto, pos, porque, grupo, pp, badge, foot_r, nota=""):
    badge_html = f'\n        <div style="margin-bottom:12px"><span class="sugtag" style="margin-bottom:0">✦ {badge}</span></div>' if badge else ''
    nota_html = f'\n    <div class="bnote" style="margin-top:16px">◆ {nota}</div>' if nota else ''
    return f'''
  <section class="slide">
{hsimple("A experiência")}
    <span class="eyebrow orange">◆ {racional}</span>
    <h2>{ta} <em>{tb}</em></h2>
    <p class="lead">{desc}</p>
    <div class="phero">
      <div class="pheroph"><img src="assets/{foto}" alt="{ta} {tb}" style="object-position:{pos}"></div>
      <div style="display:flex;flex-direction:column;justify-content:center">{badge_html}
        <div class="ginv">
          <span class="gl">Investimento do grupo</span>
          <div class="gbig">R$ {grupo}</div>
          <div class="gsub">Experiência completa para até 15 participantes</div>
          <div class="gpp">equivale a aproximadamente <b>R$ {pp}</b> por pessoa</div>
          <div class="ginc"><b>Por que combina:</b> {porque}</div>
          <div class="ginc" style="margin-top:8px">Inclui experiência na <b>Awake</b>, materiais, condução, equipe e montagem.</div>
        </div>
      </div>
    </div>{nota_html}
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
    <div class="vibe">
      <figure><img src="assets/pinturatacaaaa.jpg" alt="Detalhe de uma taça pintada à mão" style="object-position:center 40%"><figcaption>Mãos que criam</figcaption></figure>
      <figure><img src="assets/lipbalm1.jpg" alt="Ingredientes e cores de uma experiência beauty" style="object-position:center 50%"><figcaption>Detalhes beauty</figcaption></figure>
      <figure><img src="assets/piranha-cristais-materiais.jpg" alt="Materiais e pedras delicadas" style="object-position:center 40%"><figcaption>Materiais delicados</figcaption></figure>
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

lip = experiencia(
    "Autocuidado · universo beauty · autoral", "Lip Balm", "Autoral",
    "Cada convidada cria o próprio lip balm natural — aromas, cores e textura.",
    "lipbalm.jpg", "center 50%",
    "autocuidado que conversa direto com o universo beauty da Awake — e cada uma leva o seu.",
    "4.200", "280", "Nossa sugestão · maior aderência ao encontro", "Lip Balm Autoral")

taca = experiencia(
    "Criatividade · leveza · interação", "Pintura de", "Taça",
    "Cada uma personaliza a própria taça de vidro, no seu tempo e no seu traço.",
    "pinturataca.jpg", "center 45%",
    "leve e descontraída, solta o grupo e rende conversa e boas risadas.",
    "2.700", "180", None, "Pintura de Taça")

charm = experiencia(
    "Personalização · moda · lembrança afetiva", "Charm de", "Bolsa",
    "Cada convidada compõe um charm exclusivo — pedras, letras e detalhes.",
    "charm-bolsa.jpg", "center 50%",
    "personalização afetiva: uma lembrança que continua com ela no dia a dia.",
    "2.685", "179", None, "Charm de Bolsa",
    nota="Também temos <b>Vela Aromática</b> e <b>Aromatizador de Ambiente</b> na mesma pegada — valores sob consulta. 🤍")

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

deck = '<div class="deck">\n' + cover + atmosfera + elarah + lip + taca + charm + proximos + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/proposta-rafaella-awake.html"
io.open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| sections:", html.count('<section class="slide'))
