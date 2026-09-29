# Proposta Elarah · Team building Mari · 13 mulheres · 09/10 · Zona Oeste
# v5: Velas -> Atelie Meu Outro Lado (Brooklin). Valores finais 319/369/799. Sem tags.
# Comidinhas +89/139/189 (upgrade Agora). Investimento + Sugestao Elarah. Sem R$279.
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/experiencia-team-building-ginger-agora.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]
head = re.sub(r'<title>.*?</title>', '<title>Team Building · Mari · Elarah</title>', head, count=1, flags=re.DOTALL)
head = re.sub(r'<meta name="description"[^>]*>',
              '<meta name="description" content="Proposta Elarah de team building para 13 mulheres — Vela Aromática (Meu Outro Lado), Cerâmica (Agora Intu) e Tufting (Lado B).">',
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


def opt3(foto, pos, local, nome, desc, preco_html):
    return f'''      <div class="opt">
        <div class="oph">{img(foto, nome, pos)}</div>
        <div class="ob">
          <span class="ot">{local}</span>
          <h4>{nome}</h4>
          <p>{desc}</p>
          {preco_html}
        </div>
      </div>'''


def bcard(foto, pos, titulo, desc):
    return f'''      <div class="opt">
        <div class="oph" style="aspect-ratio:4/3">{img(foto, titulo, pos)}</div>
        <div class="ob">
          <h4>{titulo}</h4>
          <p>{desc}</p>
        </div>
      </div>'''


def egrid3(items):
    figs = "\n".join(f'      <figure>{img(s, c, p)}<figcaption>{c}</figcaption></figure>' for s, p, c in items)
    return f'<div class="egrid">\n{figs}\n    </div>'


PROOF = "Já realizado para times como <b>Compass</b>, <b>Natura</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)"

cover = f'''
  <section class="slide">
{head_block("Proposta de experiência · Team building", "Team building", "Mari", "13 mulheres · São Paulo")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Team building · Turma privada</span>
        <h1>O time junto, <em>de mão na massa</em></h1>
        <p class="lead">Uma manhã (ou tarde) criativa <strong>só pro time</strong>: sem dinâmica forçada, sem slides — todas na mesma mesa, <strong>criando com as próprias mãos</strong>. É o tipo de encontro que aproxima de verdade e deixa uma <strong>lembrança que fica</strong>.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>13</b> mulheres</span>
          <span class="chip"><b>09/10</b> · manhã ou tarde</span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip">São Paulo</span>
          <span class="chip"><b>3</b> experiências à escolha</span>
        </div>
      </div>
      <div class="cover-photo">{img("lado-b-grupo-pecas.webp", "Grupo de mulheres sorrindo com suas peças", "center 25%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Team building · Mari")}
  </section>'''

levajunto = f'''
  <section class="slide">
{head_simple("O que o time leva junto")}
    <span class="eyebrow orange">◆ O que o time leva junto</span>
    <h2>Team building que <em>ninguém finge gostar</em></h2>
    <p class="lead">A gente não faz dinâmica de quebra-gelo. A conexão acontece sozinha quando o time senta na mesma mesa pra criar algo com as próprias mãos — <strong>sem hierarquia, sem quem sabe mais e quem sabe menos.</strong> 🧡</p>
    <div class="rule"></div>
    <div class="opts" style="grid-template-columns:repeat(3,1fr)">
{bcard("mol-experiencia.webp", "center 30%", "Conversa que não rola no escritório", "As horas lado a lado fazem o time falar de coisas que a reunião nunca puxa. <b>Áreas diferentes se misturam sozinhas.</b>")}
{bcard("tufting1.jpg", "center 30%", "Todo mundo no mesmo pé", "Ninguém precisa ter experiência. <b>Liderança e time começam do zero juntos</b> — e é justamente aí que a hierarquia cai.")}
{bcard("ceramica2.jpg", "center 50%", "Fica depois do dia", "O que foi criado continua depois do encontro — <b>seja como peça individual ou como memória coletiva</b> do time.")}
    </div>
    <div class="bnote" style="margin-top:16px">◆ A gente cuida de tudo: profissional que conduz, material, estrutura e montagem. O RH só precisa avisar a data e reunir o time — e, se quiserem, a gente reserva um momento de fala da liderança no meio do encontro. 🌿</div>
    {foot("O que o time leva junto")}
  </section>'''

opcoes = f'''
  <section class="slide">
{head_simple("As experiências")}
    <span class="eyebrow orange">◆ Três experiências à escolha</span>
    <h2>Escolham a <em>cara do encontro</em></h2>
    <p class="lead">Todas privativas, conduzidas por profissional, com todos os materiais inclusos — e cada uma leva a própria criação pra casa.</p>
    <div class="opts" style="grid-template-columns:repeat(3,1fr)">
{opt3("mol-experiencia.webp", "center 30%", "Ateliê Meu Outro Lado · Brooklin", "Vela Aromática", "Experiência manual e sensorial: cada uma cria a própria vela, escolhendo fragrâncias, do início ao fim.", '<div class="op">R$ 319<small>por pessoa</small></div>')}
{opt3("agora-ceramica.jpg", "center 40%", "Agora Intu · Pinheiros", "Cerâmica", "Modelagem à mão, com o grupo à mesa e profissional conduzindo — cada uma leva a própria peça.", '<div class="op">R$ 369<small>por pessoa</small></div>')}
{opt3("tufting6.jpg", "center 30%", "Lado B Studio · Faria Lima", "Tufting", "Aprendem a técnica de tufting e criam a própria peça autoral — fios, cores e composição.", '<div class="op">R$ 799<small>por pessoa</small></div>')}
    </div>
    <p class="fineprint">✦ Turma privada de 13 · 09/10 (manhã ou tarde). Vela Aromática — Ateliê Meu Outro Lado · Brooklin · Cerâmica — Agora Intu · Pinheiros · Tufting — Lado B Studio · Faria Lima / Jardim Paulistano. No Agora Intu, a experiência é completa e pode receber comidinhas.</p>
    {foot("As experiências")}
  </section>'''

vela = f'''
  <section class="slide">
{head_simple("Vela Aromática · Meu Outro Lado")}
    <span class="eyebrow orange">◆ Vela Aromática · Ateliê Meu Outro Lado · Brooklin</span>
    <h2>Aromas e <em>criação</em></h2>
    <p class="lead">No Ateliê Meu Outro Lado (Brooklin), cada uma cria a própria vela aromática — escolhendo fragrâncias e participando de todo o processo, acompanhada pela profissional. Manual, sensorial e cheia de aroma.</p>
    {egrid3([("mol-experiencia.webp", "center 30%", "A experiência"), ("mol-vela-pintada.jpg", "center 55%", "A vela que fica"), ("mol-estacao.jpg", "center 40%", "Aromas & materiais")])}
    <p class="subh">Como acontece</p>
    <ul class="checks">
      <li><span class="ck">1</span>Escolhem as <b>fragrâncias</b></li>
      <li><span class="ck">2</span>Aprendem o <b>processo</b> com a profissional</li>
      <li><span class="ck">3</span>Criam a <b>própria vela</b></li>
      <li><span class="ck">4</span>Cada uma <b>leva a sua</b> pra casa</li>
    </ul>
    <p class="fineprint">✦ Experiência privativa no Ateliê Meu Outro Lado (Brooklin), com todos os materiais e acompanhamento durante o processo.</p>
    {foot("Vela Aromática · Meu Outro Lado")}
  </section>'''

experiencia = f'''
  <section class="slide">
{head_simple("Cerâmica · Agora Intu")}
    <span class="eyebrow orange">◆ Cerâmica · Agora Intu · Pinheiros</span>
    <h2>Uma experiência <em>completa</em></h2>
    <p class="lead">No Agora Intu, os <strong>R$ 369 por pessoa</strong> já contemplam uma experiência completa: espaço exclusivo só pro time, à mesa posta, com a profissional conduzindo — e cada uma leva pra casa a própria peça.</p>
    <div class="bfeat">
      <div class="bphoto">{img("ceramicamodelagem.jpg", "Mãos modelando cerâmica no Agora Intu", "center 50%")}</div>
      <div class="bbody">
        <span class="btag">Como acontece</span>
        <h3>Da chegada à peça pronta</h3>
        <ul class="feat">
          <li><span class="st">1</span><b>Boas-vindas</b> — mesa posta, playlist e o clima acolhedor do espaço.</li>
          <li><span class="st">2</span><b>Mão na argila</b> — cada uma modela a própria peça, guiada pela profissional.</li>
          <li><span class="st">3</span><b>Fica pronta</b> — a gente finaliza, queima e devolve a peça de cada uma.</li>
        </ul>
      </div>
    </div>
    <p class="subh">Tudo incluso nos R$ 369, sem surpresa</p>
    <ul class="checks">
      <li><span class="ck">✓</span><b>Espaço exclusivo</b> no Agora Intu</li>
      <li><span class="ck">✓</span><b>Profissional</b> conduzindo</li>
      <li><span class="ck">✓</span><b>Todos os materiais</b> inclusos</li>
      <li><span class="ck">✓</span><b>Finalização e queima</b> das peças</li>
      <li><span class="ck">✓</span><b>Mesas e ambientação</b> montadas</li>
      <li><span class="ck">✓</span><b>Playlist</b> e o clima do espaço</li>
      <li><span class="ck">✓</span><b>Café, chá e água</b> à vontade</li>
      <li><span class="ck">✓</span>Cada uma <b>leva a própria peça</b></li>
    </ul>
    {foot("Cerâmica · Agora Intu")}
  </section>'''

atmosfera = f'''
  <section class="slide">
{head_simple("A atmosfera · Agora Intu")}
    <span class="eyebrow orange">◆ O espaço faz parte da experiência</span>
    <h2>O clima que espera <em>o time</em></h2>
    <p class="lead">Mesa posta com velas e flores, mãos na massa e o grupo criando junto — luz baixa, playlist boa e aquela sensação de estar num lugar especial. É essa a atmosfera do Agora Intu.</p>
    <div class="egrid">
      <figure>{img("agora-pintura.jpg", "Grupo criando junto no Agora Intu", "center 40%")}<figcaption>Mão na massa, juntas</figcaption></figure>
      <figure>{img("agora-selfie.jpg", "Time rindo durante a experiência", "center 35%")}<figcaption>Risada garantida</figcaption></figure>
      <figure>{img("agora-ceramica.jpg", "Modelagem à mão no Agora Intu", "center 40%")}<figcaption>Criação à mão</figcaption></figure>
      <figure>{img("agora-grupo.jpg", "Time reunido à mesa no Agora Intu", "center 45%")}<figcaption>O time à mesa</figcaption></figure>
      <figure>{img("menu-coffee.jpg", "Comidinhas e coffee do Agora Intu", "center 42%")}<figcaption>Comidinhas &amp; coffee</figcaption></figure>
      <figure>{img("agora-mesa.jpg", "Mesa posta e ambientação", "center 50%")}<figcaption>Mesa posta &amp; ambientação</figcaption></figure>
    </div>
    {foot("A atmosfera do Agora Intu")}
  </section>'''

tufting = f'''
  <section class="slide">
{head_simple("Tufting · Lado B Studio")}
    <span class="eyebrow orange">◆ Tufting · Lado B Studio · Faria Lima</span>
    <h2>Fios, cor e <em>criação</em></h2>
    <p class="lead">No Lado B, cada uma aprende a técnica de tufting e cria a própria peça autoral — com a pistola, fios e muita cor. Um ambiente vibrante, mão na massa do começo ao fim.</p>
    {egrid3([("lado-b-vermelho.webp", "center 30%", "Escolhem desenho & cores"), ("tufting1.jpg", "center 30%", "Criam com a pistola"), ("tufting6.jpg", "center 25%", "Cada uma leva a sua")])}
    <p class="subh">Como acontece</p>
    <ul class="checks">
      <li><span class="ck">1</span>Conhecem a <b>técnica</b> e a pistola de tufting</li>
      <li><span class="ck">2</span>Escolhem <b>desenho, fios e cores</b></li>
      <li><span class="ck">3</span>Criam a própria peça <b>com acompanhamento</b></li>
      <li><span class="ck">4</span>Cada uma <b>leva sua criação</b></li>
    </ul>
    <p class="fineprint">✦ Experiência privativa no Lado B Studio (Faria Lima / Jardim Paulistano), com todos os materiais e acompanhamento durante o processo.</p>
    {foot("Tufting · Lado B Studio")}
  </section>'''

comidinhas = f'''
  <section class="slide">
{head_simple("Comidinhas · Agora Intu")}
    <span class="eyebrow orange">◆ Agora Intu · o menu que completa</span>
    <h2>Complete com <em>comidinhas</em></h2>
    <div class="foodrow">
      <div class="foodsq">{img("menu-coffee.jpg", "Finger food e doces do menu", "center 42%")}</div>
      <p class="lead">A experiência de cerâmica no Agora Intu já vem completa — espaço exclusivo, ambientação e café, chá e água. Dá pra deixar ainda mais gostosa somando um menu ao encontro:</p>
    </div>
    <div class="tiers">
      <div class="tier">
        <span class="tname">Tábua de boas-vindas</span>
        <span class="tprice">+ R$ 89</span>
        <span class="tbase">por pessoa</span>
        <p>Queijos, embutidos, pães artesanais, conservas e frutas.</p>
      </div>
      <div class="tier hl">
        <span class="tag">Mais escolhido</span>
        <span class="tname">Finger food</span>
        <span class="tprice">+ R$ 139</span>
        <span class="tbase">por pessoa</span>
        <p>5 bites quentes e frios, servidos ao longo do encontro.</p>
      </div>
      <div class="tier">
        <span class="tname">Menu completo</span>
        <span class="tprice">+ R$ 189</span>
        <span class="tbase">por pessoa</span>
        <p>Finger food + doce da casa + café.</p>
      </div>
    </div>
    <p class="fineprint">Comidinhas exclusivas do Agora Intu (Cerâmica), somadas por pessoa: Cerâmica + Tábua R$ 458 · Cerâmica + Finger food R$ 508 · Cerâmica + Menu completo R$ 558 por pessoa. O menu é opcional.</p>
    {foot("Comidinhas · Agora Intu")}
  </section>'''

investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Quanto fica pro grupo</span>
    <h2>Escolha o <em>caminho do time</em></h2>
    <p class="lead">Cada experiência, com o valor por pessoa e o total para o grupo de 13:</p>
    <div class="tiers">
      <div class="tier">
        <span class="tname">Vela Aromática · Meu Outro Lado</span>
        <span class="tprice">R$ 4.147</span>
        <span class="tbase">R$ 319 / pessoa · grupo de 13</span>
        <p>Experiência sensorial + materiais + acompanhamento + vela individual.</p>
      </div>
      <div class="tier">
        <span class="tname">Cerâmica · Agora Intu</span>
        <span class="tprice">R$ 4.797</span>
        <span class="tbase">R$ 369 / pessoa · grupo de 13</span>
        <p>Espaço exclusivo + experiência + materiais + finalização + ambientação + café, chá e água.</p>
      </div>
      <div class="tier">
        <span class="tname">Tufting · Lado B</span>
        <span class="tprice">R$ 10.387</span>
        <span class="tbase">R$ 799 / pessoa · grupo de 13</span>
        <p>Experiência privativa de tufting + materiais + acompanhamento + peça individual.</p>
      </div>
    </div>
    <div class="priceband" style="margin-top:16px">
      <div><span class="pl">Sugestão Elarah ✦</span><div class="pv">R$ 558 <span style="font-size:16px;font-family:-apple-system,sans-serif">/ pessoa</span></div><div style="font-size:12px;color:rgba(255,255,255,.82);margin-top:4px">Cerâmica no Agora Intu + Menu completo</div></div>
      <div class="side"><b>R$ 7.254</b> para o grupo de 13<br>Experiência + espaço exclusivo + ambientação + comidinhas.</div>
    </div>
    <p class="fineprint">Valores por pessoa, turma privada de 13. Opcionais para qualquer experiência: garrafa personalizada R$ 139 por pessoa · registro fotográfico R$ 450 por evento. Reserva com sinal de 50%. A Elarah emite nota fiscal.</p>
    {foot("Investimento")}
  </section>'''

contato = f'''
  <section class="slide">
{head_simple("Como funciona & contato")}
    <span class="eyebrow orange">◆ Simples e sob medida</span>
    <h2>É só reunir o <em>time</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pro encontro ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="num">01</div><h3>Escolham a experiência</h3><p>Vela, Cerâmica ou Tufting — a gente reserva o espaço só pro time.</p></div>
      <div class="infocard"><div class="num">02</div><h3>A gente leva tudo</h3><p>Profissional, material e estrutura. Chegamos antes, montamos e desmontamos.</p></div>
      <div class="infocard"><div class="num">03</div><h3>Cada uma leva a peça</h3><p>Todas saem com a própria criação — e a lembrança do encontro.</p></div>
    </div>
    <div class="quote">
      Mari, me confirma a <strong>experiência</strong> e o período (manhã ou tarde) de <strong>09/10</strong>, que eu reservo o espaço e organizo cada detalhe pro time. ✦<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Como funciona & contato")}
  </section>'''

deck = '<div class="deck">\n' + cover + levajunto + opcoes + vela + experiencia + atmosfera + tufting + comidinhas + investimento + contato + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/proposta-mari-team-building.html"
io.open(out, "w", encoding="utf-8").write(html)
for bad in ["279", "Velas · Agora", "Velas no Agora", "Workshop de Velas"]:
    assert bad not in deck, f"PROIBIDO presente: {bad}"
print("wrote", out, "| sections:", html.count('<section class="slide'), "| ok")
