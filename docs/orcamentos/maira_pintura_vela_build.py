# Proposta Maira — Pintura na Taca de Vinho & Vela Aromatica
# Elarah Vai Ate Voce · 4 pessoas · 17/10 10h · casa da cliente (Santa Cecilia/Higienopolis)
# Padrao Elarah aprovado (base terracota/navy). Fotos humanas, grupo de amigas.
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/proposta-rafaella-awake.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]
head = re.sub(r'<title>.*?</title>', '<title>Maíra · Pintura & Vela · Elarah</title>', head, count=1, flags=re.DOTALL)
head = re.sub(r'<meta name="description"[^>]*>',
              '<meta name="description" content="Proposta Elarah para uma manhã de Pintura na Taça e Vela Aromática, no formato Elarah Vai Até Você, na casa da Maíra.">',
              head, count=1)


def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'


def hsimple(kicker):
    return f'''    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">{kicker}</span></div>
    </div>'''


cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right">
        <span class="kicker">Experiência privada · em casa</span>
        <span class="compass">Maíra <span></span><small>Santa Cecília · Higienópolis</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Elarah Vai Até Você</span>
        <h1>Uma manhã para <em>criar juntas</em></h1>
        <p class="lead">Uma experiência <strong>privada e especial</strong> no conforto da sua casa: <strong>pintura na taça de vinho</strong> e <strong>criação de vela aromática</strong>, entre amigas. A gente leva tudo até você — é só receber e aproveitar. 🤍</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>4</b> amigas</span>
          <span class="chip"><b>17/10</b> · 10h</span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip">Santa Cecília · Higienópolis</span>
          <span class="chip">Na sua casa</span>
        </div>
      </div>
      <div class="cover-photo"><img src="assets/pintura-taca-experiencia.jpg" alt="Amigas pintando taças e rindo juntas" style="object-position:center 25%"></div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Experiências já realizadas para grupos como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)</div>
    {foot("Experiência privada · Maíra")}
  </section>'''

experiencia = f'''
  <section class="slide">
{hsimple("A experiência")}
    <span class="eyebrow orange">◆ Duas criações, uma manhã</span>
    <h2>Pintura na Taça <em>& Vela</em></h2>
    <p class="lead">Cada uma personaliza a própria taça de vinho e ainda cria a sua vela aromática — mão na massa, no ritmo de vocês, com uma profissional conduzindo tudo.</p>
    <div class="moments">
      <div class="mcard">
        <div class="mph"><img src="assets/pinturataca.jpg" alt="Mão pintando uma taça de vinho" style="object-position:center 45%"></div>
        <div class="mb">
          <span class="mstep">01</span>
          <div class="mn">Pintura na Taça</div>
          <p>Cada participante pinta e personaliza a própria taça de vinho para levar pra casa.</p>
        </div>
      </div>
      <div class="mcard">
        <div class="mph"><img src="assets/vela-aromatica-real.jpg" alt="Criação de vela aromática com flores secas" style="object-position:center 45%"></div>
        <div class="mb">
          <span class="mstep">02</span>
          <div class="mn">Vela Aromática</div>
          <p>Escolha aromas e crie a sua própria vela — um mimo sensorial pra fechar a manhã.</p>
        </div>
      </div>
    </div>
    <div class="bnote" style="margin-top:16px">◆ Tudo incluso: materiais, condução da profissional e as peças que cada uma leva pra casa. 🤍</div>
    {foot("A experiência")}
  </section>'''

vibe = f'''
  <section class="slide">
{hsimple("A vibe")}
    <span class="eyebrow orange">◆ Uma manhã entre amigas</span>
    <h2>Rir, criar e <em>brindar</em></h2>
    <p class="lead">Clima leve, espontâneo e acolhedor — mulheres juntas, mão na massa e boas conversas. Um encontro íntimo, divertido e sofisticado.</p>
    <div class="vibe">
      <figure><img src="assets/pinturatacameninas.jpg" alt="Amigas pintando taças juntas" style="object-position:center 30%"><figcaption>Pintando juntas</figcaption></figure>
      <figure><img src="assets/vela-grupo-oficina.jpg" alt="Mulheres criando velas aromáticas" style="object-position:center 35%"><figcaption>Mão na massa</figcaption></figure>
      <figure><img src="assets/pintura-taca-brinde.jpg" alt="Amigas brindando com as taças pintadas" style="object-position:center 40%"><figcaption>Brinde final</figcaption></figure>
    </div>
    {foot("A vibe da experiência")}
  </section>'''

vaivoce = f'''
  <section class="slide statement">
{hsimple("Elarah Vai Até Você")}
    <span class="eyebrow orange">◆ No conforto da sua casa</span>
    <h2>A gente leva a experiência <em>até você</em></h2>
    <p class="lead">Você recebe as amigas; a Elarah cuida do resto. Levamos materiais, a profissional e toda a estrutura até a sua casa.</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">🤍</div><h3>Na sua casa</h3><p>Deslocamento incluso — a experiência acontece no seu espaço, com privacidade.</p></div>
      <div class="infocard"><div class="ico">✨</div><h3>Tudo incluso</h3><p>Materiais, condução da profissional e as peças que cada uma leva.</p></div>
      <div class="infocard"><div class="ico">🥂</div><h3>Só aproveitar</h3><p>Montamos, conduzimos e organizamos. Vocês só recebem e curtem.</p></div>
    </div>
    {foot("Elarah Vai Até Você")}
  </section>'''

invest = f'''
  <section class="slide">
{hsimple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Pintura na Taça <em>& Vela</em></h2>
    <div class="phero">
      <div class="pheroph"><img src="assets/pintura-taca-brinde.jpg" alt="Amigas brindando com as taças pintadas" style="object-position:center 40%"></div>
      <div class="pval">
        <span class="pct">Elarah Vai Até Você</span>
        <div class="pbig">R$ 299</div>
        <span class="pper">por pessoa</span>
        <div class="pgrp">R$ 1.196<small>grupo de 4 pessoas</small></div>
        <ul class="pinc">
          <li>Pintura na Taça de Vinho</li>
          <li>Criação de Vela Aromática</li>
          <li>Todos os materiais necessários</li>
          <li>Condução da profissional</li>
          <li>Deslocamento até a sua casa</li>
          <li>Experiência privada para o grupo</li>
        </ul>
      </div>
    </div>
    <div class="bnote" style="margin-top:18px">◆ Manhã de <b>17/10, às 10h</b>, na sua casa em Santa Cecília / Higienópolis. Cada uma leva a taça e a vela feitas por ela. 🤍</div>
    {foot("Investimento")}
  </section>'''

proximos = f'''
  <section class="slide">
{hsimple("Próximos passos")}
    <span class="eyebrow orange">◆ Próximos passos</span>
    <h2>Vamos <em>combinar tudo</em></h2>
    <p class="lead">Me confirma a data e o endereço que eu organizo os materiais, a profissional e toda a estrutura. No dia, é só receber as amigas. 🤍</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">1️⃣</div><h3>Confirmem</h3><p>Data, horário e endereço da experiência.</p></div>
      <div class="infocard"><div class="ico">2️⃣</div><h3>Organizamos tudo</h3><p>Materiais, profissional e estrutura por nossa conta.</p></div>
      <div class="infocard"><div class="ico">3️⃣</div><h3>É só receber</h3><p>No dia, vocês só criam, brindam e aproveitam.</p></div>
    </div>
    <div class="quote">
      Maíra, é só me dar o sinal que eu deixo tudo pronto pra manhã de vocês. 🤍<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = '<div class="deck">\n' + cover + experiencia + vibe + vaivoce + invest + proximos + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/proposta-maira-pintura-vela.html"
io.open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| sections:", html.count('<section class="slide'))
