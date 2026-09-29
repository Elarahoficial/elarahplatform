# Proposta Elarah · Team building Mari · 13 mulheres · 09/10 · Zona Oeste
# 3 opcoes (Tufting Lado B, Ceramica Agora Intu, Velas Agora Intu) + versao completa.
# Segue o padrao TB aprovado (base laranja/navy do deck Ginger/Agora). Valores a confirmar.
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/experiencia-team-building-ginger-agora.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]
head = re.sub(r'<title>.*?</title>', '<title>Team Building · Mari · Elarah</title>', head, count=1, flags=re.DOTALL)
head = re.sub(r'<meta name="description"[^>]*>',
              '<meta name="description" content="Proposta Elarah de team building para 13 mulheres — Tufting (Lado B) e Cerâmica ou Velas (Agora Intu).">',
              head, count=1)


def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'


def hsimple(kicker):
    return f'''    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">{kicker}</span></div>
    </div>'''


def opt3(foto, pos, local, nome, desc):
    return f'''      <div class="opt">
        <div class="oph"><img src="assets/{foto}" alt="{nome}" style="object-position:{pos}"></div>
        <div class="ob">
          <span class="ot">{local}</span>
          <h4>{nome}</h4>
          <p>{desc}</p>
          <div class="op" style="font-size:15px;font-style:italic;color:var(--orange-dark)">valor a confirmar</div>
        </div>
      </div>'''


PROOF = "Já realizado para times como <b>Compass</b>, <b>Natura</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)"

cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right">
        <span class="kicker">Proposta de experiência · Team building</span>
        <span class="compass">Team building <span>Mari</span><small>13 mulheres · Zona Oeste</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Team building · Turma privada</span>
        <h1>O time junto, <em>de mão na massa</em></h1>
        <p class="lead">Uma manhã (ou tarde) criativa só pro time: sem dinâmica forçada, sem slides — todas na mesma mesa, criando com as próprias mãos. O tipo de encontro que aproxima de verdade e deixa uma lembrança que fica.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>13</b> mulheres</span>
          <span class="chip"><b>09/10</b> · manhã ou tarde</span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip">Zona Oeste · SP</span>
          <span class="chip"><b>3</b> experiências à escolha</span>
        </div>
      </div>
      <div class="cover-photo"><img src="assets/agora-grupo.jpg" alt="Time de mulheres criando junto à mesa" style="object-position:center 45%"></div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Team building · Mari")}
  </section>'''

opcoes = f'''
  <section class="slide">
{hsimple("As experiências")}
    <span class="eyebrow orange">◆ Três experiências à escolha</span>
    <h2>Escolham a <em>cara do encontro</em></h2>
    <p class="lead">Todas privativas, conduzidas por profissional, com todos os materiais inclusos — e cada uma leva a própria criação pra casa.</p>
    <div class="opts" style="grid-template-columns:repeat(3,1fr)">
{opt3("lado-b-grupo-pecas.webp", "center 30%", "Lado B Studio · Faria Lima", "Tufting", "Cada uma cria seu próprio tapete ou quadro em tufting — colorido, autoral e cheio de personalidade.")}
{opt3("agora-ceramica.jpg", "center 40%", "Agora Intu · Pinheiros", "Cerâmica", "Modelagem à mão, à mesa posta — cada uma leva a própria peça, esmaltada e queimada.")}
{opt3("vela-grupo-oficina.jpg", "center 35%", "Agora Intu · Pinheiros", "Workshop de Velas", "Cada uma cria a própria vela aromática, escolhendo aromas — um mimo sensorial pra levar.")}
    </div>
    <p class="fineprint">✦ Turma privada de 13 · Zona Oeste · 09/10 (manhã ou tarde). Valores por pessoa a confirmar conforme a experiência, a data e o número final do grupo.</p>
    {foot("As experiências")}
  </section>'''

atmosfera = f'''
  <section class="slide">
{hsimple("A atmosfera · Agora Intu")}
    <span class="eyebrow orange">◆ O espaço faz parte da experiência</span>
    <h2>O clima que espera <em>o time</em></h2>
    <p class="lead">No Agora Intu (Pinheiros), o espaço é parte da experiência: mesa posta com velas e flores, comidinhas, luz baixa e o grupo criando junto. Um lugar especial pra desacelerar e se conectar.</p>
    <div class="egrid">
      <figure><img src="assets/agora-mesa.jpg" alt="Mesa posta no Agora Intu" style="object-position:center 50%"><figcaption>Mesa posta &amp; ambientação</figcaption></figure>
      <figure><img src="assets/agora-grupo.jpg" alt="Time reunido à mesa no Agora Intu" style="object-position:center 45%"><figcaption>O time à mesa</figcaption></figure>
      <figure><img src="assets/agora-selfie.jpg" alt="Grupo rindo durante a experiência" style="object-position:center 35%"><figcaption>Risada garantida</figcaption></figure>
      <figure><img src="assets/menu-coffee.jpg" alt="Comidinhas e coffee do Agora Intu" style="object-position:center 42%"><figcaption>Comidinhas &amp; coffee</figcaption></figure>
      <figure><img src="assets/agora-pintura.jpg" alt="Grupo criando junto no Agora Intu" style="object-position:center 40%"><figcaption>Mão na massa, juntas</figcaption></figure>
      <figure><img src="assets/agora-ceramica.jpg" alt="Modelagem de cerâmica no Agora Intu" style="object-position:center 40%"><figcaption>As peças que ficam</figcaption></figure>
    </div>
    {foot("A atmosfera do Agora Intu")}
  </section>'''

completa = f'''
  <section class="slide">
{hsimple("Versão completa")}
    <span class="eyebrow orange">◆ Pra deixar completo</span>
    <h2>A experiência <em>+ os mimos</em></h2>
    <p class="lead">Dá pra somar à experiência escolhida um pacote completo, pensado pro time levar o encontro pra além do dia:</p>
    <div class="egrid">
      <figure><img src="assets/menu-coffee.jpg" alt="Comidinhas e coffee" style="object-position:center 42%"><figcaption>Comidinhas</figcaption></figure>
      <figure><img src="assets/garrafa-tassia.jpg" alt="Garrafa personalizada" style="object-position:center 50%"><figcaption>Garrafa personalizada</figcaption></figure>
      <figure><img src="assets/eventocorporativo.jpg" alt="Registro fotográfico profissional" style="object-position:center 40%"><figcaption>Registro fotográfico</figcaption></figure>
    </div>
    <p class="subh">O que entra na versão completa</p>
    <ul class="checks">
      <li><span class="ck">✓</span>A <b>experiência</b> escolhida (Tufting, Cerâmica ou Velas)</li>
      <li><span class="ck">✓</span><b>Comidinhas</b> para o time</li>
      <li><span class="ck">✓</span><b>Garrafa personalizada</b> para cada uma</li>
      <li><span class="ck">✓</span><b>Registro fotográfico</b> do encontro</li>
    </ul>
    <div class="priceband">
      <div><span class="pl">Versão completa</span><div class="pv" style="font-size:30px">Valor a confirmar</div></div>
      <div class="side">Experiência + comidinhas + garrafa personalizada + fotos.<br><b>Preenchemos o valor conforme a experiência escolhida.</b></div>
    </div>
    {foot("Versão completa")}
  </section>'''

contato = f'''
  <section class="slide">
{hsimple("Como funciona & contato")}
    <span class="eyebrow orange">◆ Simples e sob medida</span>
    <h2>É só reunir o <em>time</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pro encontro ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="num">01</div><h3>Escolham a experiência</h3><p>Tufting, Cerâmica ou Velas — a gente reserva o espaço só pro time.</p></div>
      <div class="infocard"><div class="num">02</div><h3>A gente leva tudo</h3><p>Profissional, material e estrutura. Chegamos antes, montamos e desmontamos.</p></div>
      <div class="infocard"><div class="num">03</div><h3>Cada uma leva a peça</h3><p>Todas saem com a própria criação — e a lembrança do encontro.</p></div>
    </div>
    <div class="quote">
      Mari, me confirma a <strong>experiência</strong> e o período (manhã ou tarde) que fazem mais sentido, que eu reservo o espaço e organizo cada detalhe pro time. ✦<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Como funciona & contato")}
  </section>'''

deck = '<div class="deck">\n' + cover + opcoes + atmosfera + completa + contato + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/proposta-mari-team-building.html"
io.open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| sections:", html.count('<section class="slide'))
