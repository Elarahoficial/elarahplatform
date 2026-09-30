# Proposta Elarah · Aniversario Adriana · ate 20 pessoas (grupo misto) · 07/11 · SP
# v3: 100% MAO NA MASSA (curadoria criativa, nao catalogo). 11 slides.
# Sem gastronomia/vinho/drinks/passivo. Sem precos (orcamento final depois). Nao inventar.
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/orcamento-adriana.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]

extra = '''
<style>
  .conc{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:20px}
  .conc .cc{background:var(--card);border:1px solid var(--line);border-radius:15px;padding:22px 14px;text-align:center;box-shadow:0 10px 26px -22px rgba(0,0,0,.3)}
  .conc .cw{font-family:'DM Serif Display',serif;font-size:20px;color:var(--navy);line-height:1.08}
  .conc .ci{font-size:19px;margin-bottom:8px}
  .cmpg{display:flex;flex-wrap:wrap;justify-content:center;gap:16px;margin-top:20px}
  .cmp{width:calc(20% - 13px);min-width:150px;background:var(--card);border:1px solid var(--line);border-radius:15px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 12px 30px -24px rgba(0,0,0,.32)}
  .cmp .cmph{height:118px;overflow:hidden;background:#eee}
  .cmp .cmph img{width:100%;height:100%;object-fit:cover;display:block}
  .cmp .cmpb{padding:12px 13px 15px;text-align:center}
  .cmp .cmpn{font-family:'DM Serif Display',serif;font-size:15.5px;color:var(--navy);line-height:1.08}
  .cmp .cmpt{font-size:10px;color:var(--orange-dark);font-weight:700;letter-spacing:.03em;margin-top:6px;line-height:1.4}
</style>'''
head = head.replace("</head>", extra + "</head>", 1)


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


def experiencia(kicker, eyebrow, ta, tb, lead, foto, pos, btag, h3, bullets, foot_r, nota=""):
    lis = "\n".join(f'          <li><span class="st">✦</span>{b}</li>' for b in bullets)
    nota_html = f'\n    <div class="bnote" style="margin-top:16px">◆ {nota}</div>' if nota else ''
    return f'''
  <section class="slide">
{head_simple(kicker)}
    <span class="eyebrow orange">◆ {eyebrow}</span>
    <h2>{ta} <em>{tb}</em></h2>
    <p class="lead">{lead}</p>
    <div class="bfeat">
      <div class="bphoto">{img(foto, ta + " " + tb, pos)}</div>
      <div class="bbody">
        <span class="btag">{btag}</span>
        <h3>{h3}</h3>
        <ul class="feat">
{lis}
        </ul>
      </div>
    </div>{nota_html}
    {foot(foot_r)}
  </section>'''


def vc(src, alt, name, bairro, desc, pos="center 50%"):
    return (f'<div class="vc"><div class="vcph">{img(src, alt, pos)}</div>'
            f'<div class="vcb"><div class="vcn">{name}</div><div class="vcbairro">{bairro}</div>'
            f'<div class="vcd">{desc}</div></div></div>')


def cmp(src, pos, nome, tags):
    return (f'<div class="cmp"><div class="cmph">{img(src, nome, pos)}</div>'
            f'<div class="cmpb"><div class="cmpn">{nome}</div><div class="cmpt">{tags}</div></div></div>')


# ===== 1 · CAPA =====
cover = f'''
  <section class="slide">
{head_block("Aniversário · mão na massa", "Adriana", "", "São Paulo · 07/11")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Um aniversário criativo</span>
        <h1>Um aniversário para <em>colocar a mão na massa</em></h1>
        <p class="lead">Criar, conversar e comemorar juntos. Um encontro em que todo mundo participa — e leva um pouco do dia pra casa.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>07/11</b></span>
          <span class="chip"><b>Até 20</b> pessoas</span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip">São Paulo</span>
        </div>
      </div>
      <div class="cover-photo">{img("bfa-grupo1.webp", "Grupo misto criando junto numa experiência de mão na massa", "center 45%")}</div>
    </div>
    {foot("Aniversário · Adriana")}
  </section>'''

# ===== 2 · CONCEITO =====
conceito = f'''
  <section class="slide">
{head_simple("O conceito")}
    <span class="eyebrow orange">◆ A ideia</span>
    <h2>Mais do que <em>sentar à mesa</em></h2>
    <p class="lead">Experiências em que todo mundo participa, cria e leva um pouco do encontro consigo. Atividades leves e criativas, gostosas de fazer em grupo — mesmo para quem nunca tentou antes.</p>
    <div class="conc">
      <div class="cc"><div class="ci">✍️</div><div class="cw">Criar</div></div>
      <div class="cc"><div class="ci">🖐️</div><div class="cw">Fazer</div></div>
      <div class="cc"><div class="ci">💬</div><div class="cw">Conversar</div></div>
      <div class="cc"><div class="ci">🎁</div><div class="cw">Levar pra casa</div></div>
    </div>
    <div class="gstrip" style="margin-top:16px">
      <figure>{img("ceramicamodelagem.jpg", "Mãos trabalhando a argila", "center 50%")}<figcaption>Mãos criando</figcaption></figure>
      <figure>{img("lado-b-vermelho.webp", "Materiais e texturas", "center 30%")}<figcaption>Materiais &amp; texturas</figcaption></figure>
      <figure>{img("agora-grupo.jpg", "Grupo criando junto à mesa", "center 45%")}<figcaption>Junto, à mesa</figcaption></figure>
    </div>
    {foot("O conceito")}
  </section>'''

# ===== 3-7 · EXPERIÊNCIAS =====
taca = experiencia(
    "Pintura em taças", "Leve & social", "Pintura em", "taças",
    "Cada convidado personaliza a própria taça enquanto o grupo conversa, cria e brinda. Leve, descontraída e ótima para aniversário.",
    "pinturataca.jpg", "center 45%", "Mão na massa", "Uma peça única, feita por cada um",
    ["Cada pessoa cria uma <b>peça única</b>", "Não exige <b>habilidade prévia</b>", "Funciona bem para <b>grupos mistos</b>", "A taça vai <b>pra casa</b>"],
    "Pintura em taças")

ceramica = experiencia(
    "Cerâmica", "Tátil & autoral", "Cerâmica à", "mão",
    "Modelagem à mão em que cada pessoa cria a própria peça do zero. Dependendo do formato, as peças podem ser finalizadas, queimadas e entregues prontas.",
    "ceramicamodelagem.jpg", "center 50%", "Mão na massa", "Da argila à peça de cada um",
    ["Muito <b>participativa</b> e tátil", "Cada pessoa faz <b>algo diferente</b>", "Criativa e <b>imersiva</b>", "Ótima pra <b>conversar enquanto cria</b>"],
    "Cerâmica")

tufting = experiencia(
    "Tufting", "Criativo & contemporâneo", "Tufting", "têxtil",
    "Uma experiência têxtil criativa em que cada participante desenvolve a própria peça com fios, texturas e diferentes composições. Pode seguir uma proposta mais experimental, combinando técnicas manuais.",
    "tufting1.jpg", "center 30%", "Mão na massa", "Fios, cor e composição",
    ["<b>Visual</b> e contemporânea", "Divertida e <b>diferente do óbvio</b>", "Ótima pra quem gosta de <b>design e criação</b>", "Cada um leva a <b>própria peça</b>"],
    "Tufting")

pintceramica = experiencia(
    "Pintura em cerâmica", "Livre & acessível", "Pintura em", "cerâmica",
    "Cada convidado escolhe uma peça e cria a própria composição com cores, desenhos e referências pessoais. Fácil, social e descontraída para um grupo grande.",
    "agora-pintando.jpg", "center 30%", "Mão na massa", "Cor e desenho, do jeito de cada um",
    ["Mais <b>simples</b> que a modelagem", "<b>Todo mundo consegue</b> participar", "Bastante <b>liberdade criativa</b>", "Cada pessoa <b>leva a sua peça</b>"],
    "Pintura em cerâmica")

velas = experiencia(
    "Velas aromáticas", "Manual & sensorial", "Crie sua", "vela",
    "Uma experiência manual e sensorial: cada pessoa escolhe fragrâncias, combina aromas e monta a própria vela. Além da atividade, cada convidado leva a criação pra casa.",
    "vela-grupo-oficina.jpg", "center 35%", "Mão na massa", "Aromas que viram lembrança",
    ["<b>Mão na massa</b> e sensorial", "<b>Personalizável</b> — aroma de cada um", "Funciona bem para <b>perfis diferentes</b>", "Gera uma <b>lembrança do encontro</b>"],
    "Velas aromáticas")

# ===== 8 · ONDE PODE ACONTECER =====
espacos = f'''
  <section class="slide">
{head_simple("Onde pode acontecer")}
    <span class="eyebrow orange">◆ Os espaços parceiros</span>
    <h2>Escolhemos o espaço conforme <em>a experiência</em></h2>
    <div class="vg" style="grid-template-columns:1fr 1fr">
      {vc("yucafe-real.jpg", "Raüs Café", "Raüs Café", "Pinheiros", "Ambiente intimista e descontraído, ótimo para experiências criativas e sensoriais.", "center 50%")}
      {vc("betchavas.jpg", "Sala Bar", "Sala Bar", "Pinheiros", "Mais social e descontraído — recebe bem atividades criativas acompanhadas de bebidas.", "center 50%")}
      {vc("betchavas2.jpg", "Espaço Cardeal", "Espaço Cardeal", "Pinheiros", "Mais reservado e estruturado, com liberdade para montar diferentes formatos.", "center 50%")}
      {vc("sterna-painel.webp", "Sterna Faria Lima", "Sterna Faria Lima", "Itaim Bibi", "Alternativa próxima ao eixo pedido, para experiências mais leves e workshops.", "center 50%")}
    </div>
    {foot("Onde pode acontecer")}
  </section>'''

# ===== 9 · TAMBÉM PODEMOS IR ATÉ VOCÊS =====
atevoces = f'''
  <section class="slide">
{head_simple("Elarah até vocês")}
    <span class="eyebrow orange">◆ No espaço de vocês</span>
    <h2>Já têm um <em>espaço em mente?</em></h2>
    <p class="lead">Se preferirem comemorar em casa, no salão de festas, no espaço do condomínio ou em outro local escolhido pelo grupo, a gente também leva a experiência até vocês.</p>
    <div class="bfeat">
      <div class="bphoto">{img("em-casa-hero-1.jpg", "Grupo criando junto em casa", "center 40%")}</div>
      <div class="bbody">
        <span class="btag">Elarah vai até você</span>
        <h3>A experiência no seu espaço</h3>
        <p style="font-size:13px;color:var(--muted);line-height:1.6;margin-top:12px">A Elarah coordena a atividade, os materiais e a estrutura necessária de acordo com o formato escolhido. Vocês só recebem o grupo e aproveitam.</p>
      </div>
    </div>
    {foot("Elarah até vocês")}
  </section>'''

# ===== 10 · COMO ESCOLHER =====
comoescolher = f'''
  <section class="slide">
{head_simple("Como escolher")}
    <span class="eyebrow orange">◆ Comparação rápida</span>
    <h2>Qual delas combina com <em>o grupo?</em></h2>
    <div class="cmpg">
      {cmp("pintura-taca-brinde.jpg", "center 40%", "Pintura em taça", "leve · social · fácil")}
      {cmp("agora-hero.jpg", "center 45%", "Cerâmica", "tátil · autoral · imersiva")}
      {cmp("tufting6.jpg", "center 25%", "Tufting", "criativo · contemporâneo · diferente")}
      {cmp("pinturapratoceramica.jpg", "center 50%", "Pintura em cerâmica", "livre · descontraída · acessível")}
      {cmp("vela-aromatica-real.jpg", "center 45%", "Velas", "manual · sensorial · personalizada")}
    </div>
    <p class="fineprint" style="text-align:center">✦ Todas mão na massa, para grupos mistos de até 20 pessoas — cada uma com uma vibe. É só escolher a que mais tem a cara de vocês.</p>
    {foot("Como escolher")}
  </section>'''

# ===== 11 · PRÓXIMOS PASSOS =====
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Bora montar?</span>
    <h2>A partir da favorita, <em>montamos tudo</em></h2>
    <p class="lead">Depois que vocês escolherem as experiências que mais gostaram, seguimos com a disponibilidade para <b>07/11</b>, o local e o orçamento final.</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="num">01</div><h3>Escolhem</h3><p>As experiências que mais têm a cara do grupo.</p></div>
      <div class="infocard"><div class="num">02</div><h3>Confirmamos</h3><p>Disponibilidade para 07/11 e o espaço (ou o local de vocês).</p></div>
      <div class="infocard"><div class="num">03</div><h3>Montamos tudo</h3><p>Local, materiais, condução e o orçamento final.</p></div>
    </div>
    <div class="quote" style="margin-top:20px">
      Adriana, conta pra gente quais opções mais têm a cara de vocês. 🧡<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n' + cover + conceito + taca + ceramica + tufting + pintceramica
        + velas + espacos + atevoces + comoescolher + proximos + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/orcamento-adriana.html"
io.open(out, "w", encoding="utf-8").write(html)
for bad in ["Sob consulta", "sob consulta", "gastronomia", "degustação", "R$"]:
    assert bad not in deck, f"PROIBIDO presente: {bad}"
print("wrote", out, "| slides:", html.count('<section class="slide">'), "| ok")
