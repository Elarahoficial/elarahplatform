# Revisao visual/comercial do deck Awake / Rafaella (v3)
# - Fotos SOMENTE das 3 experiencias (+ detalhes/maos/materiais) e opcionais neutros
# - Nova hierarquia de preco: INVESTIMENTO DO GRUPO em destaque, por pessoa discreto
# - Evento fechado para ate 15 convidadas; entrega Elarah (fornecedor secundario)
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/proposta-rafaella-awake.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]

head = re.sub(r'<title>.*?</title>', '<title>Awake Health · Rafaella · Elarah</title>', head, count=1, flags=re.DOTALL)

# CSS extra: badge "nossa sugestao" + bloco de investimento do grupo
extra = '''
<style>
  .sugtag{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;background:var(--navy);color:#fff;font-size:9px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;padding:6px 13px;border-radius:999px;margin-bottom:14px}
  .ginv .gl{font-size:10px;letter-spacing:.18em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .ginv .gbig{font-family:'DM Serif Display',serif;font-size:62px;color:var(--navy);line-height:.92;margin:7px 0 7px}
  .ginv .gsub{font-size:13.5px;color:var(--navy-soft);font-weight:600;line-height:1.35;max-width:30ch}
  .ginv .gpp{font-size:11px;color:var(--muted);margin-top:13px;letter-spacing:.02em}
  .ginv .ginc{font-size:11.5px;color:var(--ink);margin-top:15px;line-height:1.55;max-width:34ch}
  .ginv .ginc b{color:var(--navy)}
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


def experiencia(kicker, racional, titulo_a, titulo_b, lead, foto, pos, grupo, pp, badge, foot_r):
    badge_html = f'        <span class="sugtag">✦ {badge}</span>\n' if badge else ''
    return f'''
  <section class="slide">
{hsimple(kicker)}
    <span class="eyebrow orange">◆ {racional}</span>
    <h2>{titulo_a} <em>{titulo_b}</em></h2>
    <p class="lead">{lead}</p>
    <div class="phero">
      <div class="pheroph"><img src="assets/{foto}" alt="{titulo_a} {titulo_b}" style="object-position:{pos}"></div>
      <div style="display:flex;flex-direction:column;justify-content:center">
{badge_html}        <div class="ginv">
          <span class="gl">Investimento do grupo</span>
          <div class="gbig">{grupo}</div>
          <div class="gsub">Experiência completa para até 15 convidadas</div>
          <div class="gpp">equivale a aproximadamente <b>{pp}</b> por participante</div>
          <div class="ginc">Inclui a experiência na <b>Awake</b>, materiais, condução, equipe e montagem.</div>
        </div>
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
        <p class="lead">Uma experiência íntima e feminina para receber suas convidadas na <strong>Awake Health</strong>. Uma manhã de <strong>pausa, criação e beleza</strong> — cada uma coloca a mão na massa e leva uma lembrança feita por ela.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>até 15</b> convidadas</span>
          <span class="chip">Sábado · 03/10 · manhã</span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip">Awake Health · Jardim América</span>
        </div>
      </div>
      <div class="cover-photo"><img src="assets/pinturatacaaaa.jpg" alt="Detalhe editorial de uma taça pintada à mão" style="object-position:center 40%"></div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Experiências já realizadas para grupos como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)</div>
    {foot("Awake Health · Rafaella")}
  </section>'''

atmosfera = f'''
  <section class="slide">
{hsimple("A atmosfera")}
    <span class="eyebrow orange">◆ A atmosfera do encontro</span>
    <h2>Uma manhã <em>para os sentidos</em></h2>
    <p class="lead">Mãos que criam, materiais delicados e boas conversas. Uma manhã feminina, leve e sofisticada — do tipo que fica na memória.</p>
    <div class="vibe">
      <figure><img src="assets/pinturataca.jpg" alt="Mãos pintando uma taça de vidro" style="object-position:center 45%"><figcaption>Mãos que criam</figcaption></figure>
      <figure><img src="assets/piranha-cristais-materiais.jpg" alt="Mesa com pedras, cristais e materiais" style="object-position:center 40%"><figcaption>Materiais &amp; texturas</figcaption></figure>
      <figure><img src="assets/lipbalm1.jpg" alt="Ingredientes e cores de uma experiência beauty" style="object-position:center 50%"><figcaption>Detalhes beauty</figcaption></figure>
    </div>
    {foot("A atmosfera do encontro")}
  </section>'''

elarah = f'''
  <section class="slide statement">
{hsimple("A Elarah cuida de tudo")}
    <span class="eyebrow orange">◆ Sem preocupação com a operação</span>
    <h2>Vocês recebem as convidadas.<br>A Elarah cuida <em>do resto</em>.</h2>
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
    "A experiência", "Autocuidado · universo beauty · autoral",
    "Lip Balm", "Autoral",
    "Um ritual de autocuidado: cada convidada cria o próprio lip balm natural — aromas, cores e textura. Beleza autoral, no clima da Awake.",
    "lipbalm.jpg", "center 50%", "R$ 4.200", "R$ 280",
    "Nossa sugestão · maior aderência ao encontro", "Lip Balm Autoral")

taca = experiencia(
    "A experiência", "Criatividade · leveza · interação",
    "Pintura de", "Taça",
    "Cada uma personaliza a própria taça de vidro, no seu tempo e traço. Leve e descontraída — a experiência que solta o grupo.",
    "pinturataca.jpg", "center 45%", "R$ 2.700", "R$ 180",
    None, "Pintura de Taça")

charm = experiencia(
    "A experiência", "Personalização · moda · lembrança afetiva",
    "Charm de", "Bolsa",
    "Cada convidada compõe um charm exclusivo — pedras, letras e detalhes. Uma lembrança que continua com ela no dia a dia.",
    "charm-bolsa.jpg", "center 50%", "R$ 2.685", "R$ 179",
    None, "Charm de Bolsa")

opcionais = f'''
  <section class="slide">
{hsimple("Opcionais")}
    <span class="eyebrow orange">◆ Para deixar ainda mais especial</span>
    <h2>Camadas <em>sob medida</em></h2>
    <p class="lead">Toques extras para elevar o encontro, se fizer sentido para vocês.</p>
    <div class="vgrid">
      <div class="vcard">
        <div class="vph"><img src="assets/kit2esa.jpg" alt="Um presente delicado para as convidadas" style="object-position:center 50%"></div>
        <div class="vb">
          <span class="vt">Opcional</span>
          <h3>Um mimo a mais</h3>
          <p>Um presente pensado para as convidadas, alinhado ao universo da Awake e ao clima da manhã.</p>
          <span style="margin-top:auto;padding-top:12px;font-family:'DM Serif Display',serif;font-size:19px;color:var(--orange-dark)">Sob consulta</span>
        </div>
      </div>
      <div class="vcard">
        <div class="vph"><img src="assets/abraco-elegante.jpg" alt="Registro intimista do encontro" style="object-position:center 25%"></div>
        <div class="vb">
          <span class="vt">Opcional</span>
          <h3>Registro fotográfico</h3>
          <p>Cobertura intimista da experiência — processo, mãos, detalhes e interação, prontos para as redes da Rafaella e da Awake.</p>
          <span style="margin-top:auto;padding-top:12px;font-family:'DM Serif Display',serif;font-size:19px;color:var(--orange-dark)">Sob consulta</span>
        </div>
      </div>
    </div>
    {foot("Opcionais")}
  </section>'''

proximos = f'''
  <section class="slide">
{hsimple("Próximos passos")}
    <span class="eyebrow orange">◆ Próximos passos</span>
    <h2>Vamos <em>desenhar juntas</em></h2>
    <p class="lead">Me conta qual experiência mais combina com a manhã de vocês que eu cuido de toda a produção e confirmo a disponibilidade para a data. 🤍</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">1️⃣</div><h3>Escolham a experiência</h3><p>A que mais combina com a manhã e com as convidadas.</p></div>
      <div class="infocard"><div class="ico">2️⃣</div><h3>Cuidamos de tudo</h3><p>Fornecedor, materiais, equipe e montagem por nossa conta.</p></div>
      <div class="infocard"><div class="ico">3️⃣</div><h3>Vocês só recebem</h3><p>No dia, é só receber as convidadas e viver o momento.</p></div>
    </div>
    <div class="quote">
      Rafaella, é só me dar o sinal que eu deixo tudo pronto para a Awake. 🤍<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = '<div class="deck">\n' + cover + atmosfera + elarah + lip + taca + charm + opcionais + proximos + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/proposta-rafaella-awake.html"
io.open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
