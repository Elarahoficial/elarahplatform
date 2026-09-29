# Proposta Elarah · Team building Mari · 13 mulheres · 09/10 · Zona Oeste
# BASE = deck Ginger/Agora (aprovado): experiencia Agora Intu, atmosfera, comidinhas/planos,
# garrafa personalizada, registro fotografico, como funciona. NOVA opcao: Tufting (Lado B).
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/experiencia-team-building-ginger-agora.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]
head = re.sub(r'<title>.*?</title>', '<title>Team Building · Mari · Elarah</title>', head, count=1, flags=re.DOTALL)
head = re.sub(r'<meta name="description"[^>]*>',
              '<meta name="description" content="Proposta Elarah de team building para 13 mulheres — Cerâmica ou Velas no Agora Intu e Tufting no Lado B.">',
              head, count=1)


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


def opt3(foto, pos, local, nome, desc, formato, fcolor, preco_html):
    return f'''      <div class="opt">
        <div class="oph">{img(foto, nome, pos)}</div>
        <div class="ob">
          <span class="ot">{local}</span>
          <h4>{nome}</h4>
          <p>{desc}</p>
          <span style="align-self:flex-start;margin-top:9px;font-size:8.5px;letter-spacing:.09em;text-transform:uppercase;font-weight:700;color:#fff;background:{fcolor};padding:4px 11px;border-radius:999px">{formato}</span>
          {preco_html}
        </div>
      </div>'''


PROOF = "Já realizado para times como <b>Compass</b>, <b>Natura</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)"

cover = f'''
  <section class="slide">
{head_block("Proposta de experiência · Team building", "Team building", "Mari", "13 mulheres · Zona Oeste")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Team building · Turma privada</span>
        <h1>O time junto, <em>de mão na massa</em></h1>
        <p class="lead">Uma manhã (ou tarde) criativa só pro time: sem dinâmica forçada, sem slides — todas na mesma mesa, criando com as próprias mãos. É o tipo de encontro que aproxima de verdade e deixa uma lembrança que fica.</p>
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
      <div class="cover-photo">{img("lado-b-grupo-pecas.webp", "Grupo de mulheres sorrindo com suas peças de tufting", "center 25%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Team building · Mari")}
  </section>'''

opcoes = f'''
  <section class="slide">
{head_simple("As experiências")}
    <span class="eyebrow orange">◆ Três experiências à escolha</span>
    <h2>Escolham a <em>cara do encontro</em></h2>
    <p class="lead">Todas privativas, conduzidas por profissional, com todos os materiais inclusos — e cada uma leva a própria criação pra casa.</p>
    <div class="opts" style="grid-template-columns:repeat(3,1fr)">
{opt3("tufting6.jpg", "center 30%", "Lado B Studio · Faria Lima", "Tufting", "Aprendem a técnica de tufting e criam a própria peça autoral — fios, cores e composição.", "Lado B · só experiência", "var(--orange-dark)", '<div class="op" style="font-size:14px;font-style:italic;color:var(--orange-dark)">Somente experiência<br>valor a confirmar</div>')}
{opt3("agora-ceramica.jpg", "center 40%", "Agora Intu · Pinheiros", "Cerâmica", "Modelagem à mão, com o grupo à mesa e profissional conduzindo — cada uma leva a própria peça.", "Agora Intu · experiência completa", "var(--navy)", '<div class="op">R$ 279<small>a partir de · por pessoa</small></div>')}
{opt3("vela-grupo-oficina.jpg", "center 35%", "Agora Intu · Pinheiros", "Velas", "Experiência sensorial: cada uma cria a própria vela aromática, explorando fragrâncias.", "Agora Intu · experiência completa", "var(--navy)", '<div class="op">R$ 279<small>a partir de · por pessoa</small></div>')}
    </div>
    <p class="fineprint">✦ Turma privada de 13 · Zona Oeste · 09/10 (manhã ou tarde). <b>Tufting</b> no Lado B Studio (só a experiência). <b>Cerâmica e Velas</b> no Agora Intu, a partir de uma experiência completa (espaço exclusivo, ambientação e coffee) — com opções de comidinhas.</p>
    {foot("As experiências")}
  </section>'''

tufting = f'''
  <section class="slide">
{head_simple("Tufting · Lado B Studio")}
    <span class="eyebrow orange">◆ Tufting · Lado B Studio · Faria Lima</span>
    <h2>Fios, cor e <em>criação</em></h2>
    <p class="lead">No Lado B, cada uma aprende a técnica de tufting e cria a própria peça autoral — com a pistola, fios e muita cor. Um ambiente vibrante, mão na massa do começo ao fim.</p>
    <div class="egrid">
      <figure>{img("lado-b-vermelho.webp", "Escolhendo desenho, fios e cores no Lado B", "center 30%")}<figcaption>Escolhem desenho &amp; cores</figcaption></figure>
      <figure>{img("tufting1.jpg", "Mulheres criando com a pistola de tufting", "center 30%")}<figcaption>Criam com a pistola</figcaption></figure>
      <figure>{img("tufting6.jpg", "Grupo mostrando as peças de tufting prontas", "center 25%")}<figcaption>Cada uma leva a sua</figcaption></figure>
    </div>
    <p class="subh">Como acontece</p>
    <ul class="checks">
      <li><span class="ck">1</span>Conhecem a <b>técnica</b> e a pistola de tufting</li>
      <li><span class="ck">2</span>Escolhem <b>desenho, fios e cores</b></li>
      <li><span class="ck">3</span>Criam a própria peça <b>com acompanhamento</b></li>
      <li><span class="ck">4</span>Cada uma <b>leva sua criação</b></li>
    </ul>
    <p class="fineprint">✦ Lado B Studio · Faria Lima / Jardim Paulistano. Formato somente experiência (sem comidinhas). Valor a confirmar.</p>
    {foot("Tufting · Lado B Studio")}
  </section>'''

experiencia = f'''
  <section class="slide">
{head_simple("A experiência · Agora Intu")}
    <span class="eyebrow orange">◆ Cerâmica ou Velas · Agora Intu</span>
    <h2>Uma experiência <em>completa</em></h2>
    <p class="lead">Espaço exclusivo só pro time, à mesa posta, com a profissional conduzindo. A experiência desacelera o grupo e aproxima as conversas — e cada uma leva pra casa algo feito com as próprias mãos.</p>
    <div class="bfeat">
      <div class="bphoto">{img("ceramicamodelagem.jpg", "Mãos criando no Agora Intu", "center 50%")}</div>
      <div class="bbody">
        <span class="btag">Como acontece</span>
        <h3>Da chegada à criação</h3>
        <ul class="feat">
          <li><span class="st">1</span><b>Boas-vindas</b> — mesa posta, playlist e o clima acolhedor do espaço.</li>
          <li><span class="st">2</span><b>Mão na massa</b> — cerâmica ou velas, guiada pela profissional.</li>
          <li><span class="st">3</span><b>Leva pra casa</b> — cada uma sai com a própria criação.</li>
        </ul>
      </div>
    </div>
    <p class="subh">Tudo incluso, sem surpresa</p>
    <ul class="checks">
      <li><span class="ck">✓</span><b>Espaço exclusivo</b> no Agora Intu</li>
      <li><span class="ck">✓</span><b>Profissional</b> conduzindo</li>
      <li><span class="ck">✓</span><b>Todos os materiais</b> inclusos</li>
      <li><span class="ck">✓</span><b>Finalização</b> das peças</li>
      <li><span class="ck">✓</span><b>Mesas e ambientação</b> montadas</li>
      <li><span class="ck">✓</span><b>Playlist, velas</b> e o clima</li>
      <li><span class="ck">✓</span><b>Café, chá e água</b> à vontade</li>
      <li><span class="ck">✓</span>Cada uma <b>leva a própria peça</b></li>
    </ul>
    {foot("A experiência · Agora Intu")}
  </section>'''

atmosfera = f'''
  <section class="slide">
{head_simple("A atmosfera")}
    <span class="eyebrow orange">◆ O espaço faz parte da experiência</span>
    <h2>O clima que espera <em>o time</em></h2>
    <p class="lead">Mesa posta com velas e flores, mãos na massa e o grupo criando junto — luz baixa, playlist boa e aquela sensação de estar num lugar especial. É essa a atmosfera do Agora Intu.</p>
    <div class="egrid">
      <figure>{img("agora-pintura.jpg", "Grupo criando junto no Agora Intu", "center 40%")}<figcaption>Mão na massa, juntas</figcaption></figure>
      <figure>{img("agora-ceramica.jpg", "Modelagem à mão no Agora Intu", "center 40%")}<figcaption>Criação à mão</figcaption></figure>
      <figure>{img("agora-selfie.jpg", "Time rindo durante a experiência", "center 35%")}<figcaption>Risada garantida</figcaption></figure>
      <figure>{img("agora-mesa.jpg", "Mesa posta e ambientação", "center 50%")}<figcaption>Mesa posta &amp; ambientação</figcaption></figure>
      <figure>{img("menu-coffee.jpg", "Comidinhas e coffee do Agora Intu", "center 42%")}<figcaption>Comidinhas &amp; coffee</figcaption></figure>
      <figure>{img("agora-grupo.jpg", "Time reunido à mesa no Agora Intu", "center 45%")}<figcaption>O time à mesa</figcaption></figure>
    </div>
    <div class="bnote" style="margin-top:16px">◆ <b>Tudo incluso:</b> espaço exclusivo · profissional conduzindo · todos os materiais · finalização das peças · mesas e ambientação · playlist e velas · café, chá e água — e cada uma leva a própria peça.</div>
    {foot("A atmosfera do Agora Intu")}
  </section>'''

planos = f'''
  <section class="slide">
{head_simple("Os planos")}
    <span class="eyebrow orange">◆ A experiência + o menu</span>
    <h2>Escolham o <em>plano</em></h2>
    <div class="foodrow">
      <div class="foodsq">{img("menu-coffee.jpg", "Finger food e doces do menu", "center 42%")}</div>
      <p class="lead">A experiência no Agora Intu — <strong>espaço exclusivo só do time</strong>, o momento de criar e o coffee — por <strong>R$ 279 por pessoa</strong>. É só escolher o menu que completa o encontro:</p>
    </div>
    <div class="tiers">
      <div class="tier">
        <span class="tname">Tábua de boas-vindas</span>
        <span class="tprice">R$ 378</span>
        <span class="tbase">base R$ 279 + R$ 99</span>
        <p>Queijos, embutidos, pães artesanais, conservas e frutas.</p>
      </div>
      <div class="tier hl">
        <span class="tag">Mais escolhido</span>
        <span class="tname">Finger food</span>
        <span class="tprice">R$ 418</span>
        <span class="tbase">base R$ 279 + R$ 139</span>
        <p>5 bites quentes e frios, servidos ao longo do encontro.</p>
      </div>
      <div class="tier">
        <span class="tname">Menu completo</span>
        <span class="tprice">R$ 468</span>
        <span class="tbase">base R$ 279 + R$ 189</span>
        <p>Finger food + doce da casa + café.</p>
      </div>
    </div>
    <p class="fineprint">Valores por pessoa, turma privada de 13, no Agora Intu (Pinheiros). Base R$ 279 (espaço exclusivo só do time, o momento da experiência de cerâmica ou velas e o coffee) + menu à escolha: Tábua R$ 99, Finger food R$ 139 ou Menu completo R$ 189 por pessoa. Data: 09/10 (manhã ou tarde). Reserva com sinal de 50%. A Elarah emite nota fiscal.</p>
    {foot("Os planos")}
  </section>'''

bonus = f'''
  <section class="slide">
{head_simple("Bônus")}
    <span class="eyebrow orange">◆ Pra levar de lembrança</span>
    <h2>Bônus pra deixar <em>completo</em></h2>
    <p class="lead">Além da peça que cada uma cria, dá pra somar dois mimos que ficam com o time depois do encontro:</p>
    <div class="opts">
      <div class="opt">
        <div class="ophduo"><div class="sq">{img("garrafa-rosa-personalizada.jpg", "Garrafa personalizada", "center 50%")}</div><div class="sq">{img("garrafa-tassia.jpg", "Garrafa gravada com o nome de cada participante", "center 50%")}</div></div>
        <div class="ob">
          <span class="ot">Lembrancinha</span>
          <h4>Garrafa personalizada</h4>
          <p>Gravada com o <b>nome de cada participante</b> ou a <b>marca da empresa</b> — um mimo que fica na mesa de trabalho e lembra o encontro todo dia.</p>
          <p>E tem mais: a gente também trabalha com <b>outras opções de brinde</b> (necessaire, kit aroma, caneca e mais). É só dizer a vibe do time que a gente monta a lembrança sob medida. 🤍</p>
          <div class="op">R$ 139<small>por pessoa</small></div>
        </div>
      </div>
      <div class="opt">
        <div class="oph">{img("eventocorporativo.jpg", "Registro fotográfico profissional de evento corporativo", "center 40%")}</div>
        <div class="ob">
          <span class="ot">Registro</span>
          <h4>Foto profissional</h4>
          <ul>
            <li>Um fotógrafo cobre o encontro inteiro</li>
            <li>Cada conversa e cada criação registradas</li>
            <li>Álbum digital pronto pro RH e a comunicação interna</li>
            <li>Conteúdo pronto pra usar no LinkedIn</li>
          </ul>
          <div class="op">R$ 450<small>valor total</small></div>
        </div>
      </div>
    </div>
    <p class="fineprint">Bônus opcionais, somados ao plano escolhido. Lembrancinha (garrafa personalizada): R$ 139 por pessoa. Registro fotográfico profissional: R$ 450 (valor total). O modelo da garrafa e a personalização são combinados antes do encontro.</p>
    {foot("Bônus")}
  </section>'''

contato = f'''
  <section class="slide">
{head_simple("Como funciona & contato")}
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
      Mari, me confirma a <strong>experiência</strong> e o período (manhã ou tarde) de <strong>09/10</strong>, que eu reservo o espaço e organizo cada detalhe pro time. ✦<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Como funciona & contato")}
  </section>'''

deck = '<div class="deck">\n' + cover + opcoes + tufting + experiencia + atmosfera + planos + bonus + contato + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/proposta-mari-team-building.html"
io.open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| sections:", html.count('<section class="slide'))
