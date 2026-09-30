# Proposta Elarah · Aniversario Natalia Conti · 6 pessoas · 28/11/2026 · Morumbi
# Formato Elarah Ate Voce. Segue o modelo do Portfolio Aniversario (base terracota/navy).
# Clima intimista entre amigas, sofisticado e acolhedor. Valores exatos do briefing.
import io, re

ROOT = "/home/user/elarahplatform"
# base: reaproveita o head/tail do deck de aniversario ja aprovado (todos os componentes + CSS)
ref = io.open(ROOT + "/orcamento-adriana.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]

head = re.sub(r'<title>.*?</title>', '<title>Natália Conti · Aniversário · Elarah</title>', head, count=1, flags=re.DOTALL)
head = re.sub(r'<meta name="description"[^>]*>',
              '<meta name="description" content="Proposta Elarah para o aniversário da Natália Conti: uma comemoração intimista entre amigas, no formato Elarah Até Você.">',
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


def mm(src, alt, name, desc, price, pos="center 50%"):
    return (f'<div class="mm"><div class="mmph">{img(src, alt, pos)}</div>'
            f'<div class="mmb"><div class="mmn">{name}</div><div class="mmd">{desc}</div>'
            f'<div class="mmprice">A partir de <b>{price}</b>/pessoa</div></div></div>')


# ===== 1 · CAPA =====
cover = f'''
  <section class="slide">
{head_block("Aniversário · mão na massa", "Natália", "Conti", "Morumbi · 28/11")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Um aniversário criativo</span>
        <h1>Um aniversário para <em>criar &amp; celebrar</em></h1>
        <p class="lead">Uma comemoração diferente para viver entre amigas: <strong>mão na massa</strong>, boas conversas, taças, flores e uma <strong>criação para levar pra casa</strong>. 🤍</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>6</b> pessoas</span>
          <span class="chip"><b>28/11</b> · sábado</span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip">Morumbi</span>
          <span class="chip">Elarah até você</span>
        </div>
      </div>
      <div class="cover-photo">{img("aniversario-mesa-real.jpg", "Amigas criando juntas em uma mesa bonita e cheia de flores", "center 35%")}</div>
    </div>
    {foot("Aniversário · Natália")}
  </section>'''

# ===== 2 · CONCEITO =====
conceito = f'''
  <section class="slide">
{head_simple("O conceito")}
    <span class="eyebrow orange">◆ A proposta</span>
    <h2>Criar, conversar e <em>comemorar</em></h2>
    <p class="lead">Trocar a comemoração tradicional por uma experiência <strong>leve e cheia de afeto</strong> — daquelas em que todo mundo <strong>cria, conversa, ri</strong> e ainda leva uma lembrança feita à mão.</p>
    <div class="pil3">
      <div class="p"><div class="pt">Criar</div><div class="pd">Uma experiência de mão na massa: cada uma cria a própria peça, no seu ritmo.</div></div>
      <div class="p"><div class="pt">Celebrar</div><div class="pd">Tempo para conversar, brindar e aproveitar o momento entre amigas.</div></div>
      <div class="p"><div class="pt">Levar uma lembrança</div><div class="pd">No final, cada pessoa leva pra casa a criação feita por ela.</div></div>
    </div>
    <div class="gstrip" style="margin-top:16px">
      <figure>{img("ceramica-meninas.jpg", "Amigas rindo durante a experiência", "center 30%")}<figcaption>Entre amigas</figcaption></figure>
      <figure>{img("agora-selfie.jpg", "Mulheres rindo à mesa", "center 35%")}<figcaption>Muita risada</figcaption></figure>
      <figure>{img("agora-pintura.jpg", "Mãos criando e pintando", "center 40%")}<figcaption>Mãos criando</figcaption></figure>
      <figure>{img("agora-mesa.jpg", "Mesa posta com flores e velas", "center 50%")}<figcaption>Mesa posta</figcaption></figure>
      <figure>{img("aniv-decor.jpg", "Flores, velas e clima de comemoração", "center 40%")}<figcaption>Flores &amp; clima</figcaption></figure>
      <figure>{img("pintura-taca-brinde.jpg", "Brinde com as taças", "center 40%")}<figcaption>Um brinde</figcaption></figure>
    </div>
    {foot("O conceito")}
  </section>'''

# ===== 3 · CARDÁPIO =====
cardapio = f'''
  <section class="slide">
{head_simple("O cardápio")}
    <span class="eyebrow orange">◆ Escolham a favorita</span>
    <h2>Qual tem <em>mais a cara de vocês?</em></h2>
    <p class="lead">Um cardápio de experiências para <strong>criar entre amigas</strong> — todas cabem no budget do grupo.</p>
    <div class="mmg">
      {mm("pinturataca.jpg", "Pintura em taça", "Pintura em Taça", "Cada uma personaliza a própria taça enquanto o grupo cria e brinda.", "R$ 249", "center 45%")}
      {mm("colagem.jpg", "Scrapbook", "Scrapbook", "Recortes, texturas e memórias viram uma composição autoral.", "R$ 259", "center 55%")}
      {mm("charm-making-mesa.jpg", "Berloque de bolsa", "Berloque de Bolsa", "Correntes, pingentes e charms para montar um acessório único.", "R$ 279", "center 45%")}
      {mm("perfumaria-oficina.jpg", "Perfume autoral", "Perfume Autoral", "Explore notas e combinações e crie uma fragrância com a sua identidade.", "R$ 279", "center 40%")}
      {mm("buque.jpg", "Buquê de flores", "Buquê de Flores", "Cada uma monta o próprio arranjo com uma curadoria de flores.", "R$ 289", "center 45%")}
      {mm("ceramicamodelagem.jpg", "Acessório em cerâmica", "Acessório em Cerâmica", "Modele à mão uma peça de cerâmica para chamar de sua.", "R$ 289", "center 50%")}
    </div>
    <p class="fineprint">Valores por pessoa, referentes à <b>experiência</b>. No formato <b>Elarah até você</b>, levamos tudo até o espaço escolhido.</p>
    {foot("O cardápio de experiências")}
  </section>'''

# ===== 4 · ELARAH ATÉ VOCÊ =====
atevoce = f'''
  <section class="slide">
{head_simple("Elarah até você")}
    <span class="eyebrow orange">◆ No espaço de vocês</span>
    <h2>A gente leva <em>até você</em></h2>
    <p class="lead">A experiência acontece onde for mais gostoso pra vocês — <strong>em casa</strong>, no condomínio ou num <strong>café da região</strong>. É só receber as amigas. 🤍</p>
    <div class="bfeat">
      <div class="bphoto">{img("em-casa-hero-1.jpg", "Amigas criando juntas no espaço escolhido", "center 40%")}</div>
      <div class="bbody">
        <span class="btag">A gente leva até você</span>
        <h3>É só receber as amigas</h3>
        <ul class="feat">
          <li><span class="st">✦</span><b>Profissionais</b> — condução da experiência por nossa conta</li>
          <li><span class="st">✦</span><b>Materiais</b> — tudo o que precisa para criar</li>
          <li><span class="st">✦</span><b>Estrutura</b> — montagem e organização no seu espaço</li>
        </ul>
      </div>
    </div>
    <div class="bnote" style="margin-top:16px">◆ Vocês escolhem a experiência favorita e a <b>Elarah cuida do resto</b> — da montagem à mesa posta. 🤍</div>
    {foot("Elarah até você")}
  </section>'''

# ===== 5 · INVESTIMENTO =====
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Tudo dentro do <em>seu budget</em></h2>
    <div class="pbig"><div class="n">R$ 249</div><div class="lbl">experiências <b>a partir de</b><br>por pessoa</div></div>
    <div class="icards">
      <div class="ic"><div class="k">Elarah até você</div><div class="v">No espaço de vocês</div><p>Levamos materiais, profissionais e estrutura até <b>residência, condomínio ou café</b>.</p></div>
      <div class="ic"><div class="k">Dentro do budget</div><div class="v">R$ 249 a R$ 289</div><p>Todas as experiências por pessoa, para o <b>grupo de 6</b>.</p></div>
      <div class="ic"><div class="k">Tudo incluso</div><div class="v">Da preparação à peça</div><p>Materiais, condução e a <b>criação</b> que cada uma leva pra casa.</p></div>
    </div>
    <p class="fineprint">Valores por pessoa, referentes à experiência escolhida, para o grupo de 6. Em café da região pode haver consumo mínimo, conforme o local. Aniversário em <b>28/11/2026</b>, sujeito à disponibilidade.</p>
    {foot("Investimento")}
  </section>'''

# ===== 6 · PRÓXIMOS PASSOS =====
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Bora escolher? ✨</span>
    <h2>É só <em>apontar</em> a favorita</h2>
    <p class="lead">Natália, conta pra gente qual experiência (ou quais!) mais combina com a comemoração — a partir disso, confirmamos a data <b>28/11</b> e organizamos tudo. 🤍</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="num">1</div><h3>Escolham</h3><p>A(s) experiência(s) favorita(s) do grupo.</p></div>
      <div class="infocard"><div class="num">2</div><h3>Organizamos</h3><p>Espaço, materiais e toda a estrutura por nossa conta.</p></div>
      <div class="infocard"><div class="num">3</div><h3>É só curtir</h3><p>No dia, chega tudo pronto — vocês só aproveitam.</p></div>
    </div>
    <div class="quote" style="margin-top:20px">
      Um aniversário para criar, celebrar e guardar na memória. 🤍<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n' + cover + conceito + cardapio + atevoce
        + investimento + proximos + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/natalia-conti.html"
io.open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
