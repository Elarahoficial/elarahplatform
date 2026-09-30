# Proposta Elarah · Aniversario Adriana · ate 20 pessoas · 07/11 · SP
# v2: slides 1 e 2 mantidos (slide 2: Flores -> Tufting). A partir do slide 3, vira COTACAO:
# slide 3 = experiencias + local + valor (6 cards) + outros espacos; slide 4 = como funciona;
# slide 5 = adicionais; slide 6 = fechamento. Sem "sob consulta". Sem House Cafe.
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/orcamento-adriana.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]

extra = '''
<style>
  /* cotacao — cards experiencia+local+valor */
  .exg{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:14px}
  .exc{background:var(--card);border:1px solid var(--line);border-radius:15px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 12px 30px -24px rgba(0,0,0,.3);position:relative}
  .exc.prem{border:1.6px solid var(--orange)}
  .exph{height:116px;overflow:hidden;background:#eee;position:relative}
  .exph img{width:100%;height:100%;object-fit:cover;display:block}
  .excap{position:absolute;top:8px;right:8px;background:var(--navy);color:#fff;font-size:8px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:4px 9px;border-radius:999px}
  .excap.big{background:var(--orange-dark);font-size:9px;padding:5px 11px}
  .expremtag{position:absolute;top:8px;left:8px;background:var(--orange);color:#fff;font-size:8px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:4px 10px;border-radius:999px}
  .exb{padding:11px 15px 14px;display:flex;flex-direction:column;flex:1}
  .exn{font-family:'DM Serif Display',serif;font-size:16px;color:var(--navy);line-height:1.06}
  .exloc{font-size:8.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--orange-dark);font-weight:700;margin-top:5px;line-height:1.4}
  .exval{font-size:11px;color:var(--navy-soft);font-weight:600;margin-top:7px}
  .exval b{font-family:'DM Serif Display',serif;font-weight:400;font-size:16px;color:var(--navy)}
  .exd{font-size:10.5px;color:var(--muted);line-height:1.4;margin-top:7px}
  .exinc{font-size:9.5px;color:var(--ink);margin-top:6px;line-height:1.4}
  .exinc b{color:var(--navy)}
  .outros{margin-top:15px;background:#FBF1EE;border:1px solid var(--line);border-radius:14px;padding:13px 20px}
  .outros .ott{font-size:9px;letter-spacing:.13em;text-transform:uppercase;color:var(--orange-dark);font-weight:700}
  .outros .oll{display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:8px}
  .outros .oll span{font-size:12px;color:var(--navy);font-weight:600}
  .outros .oll span small{color:var(--muted);font-weight:500;text-transform:uppercase;font-size:8px;letter-spacing:.06em;margin-left:4px}
  .outros p{font-size:10px;color:var(--muted);line-height:1.45;margin:8px 0 0}
  .somar{display:flex;flex-wrap:wrap;gap:9px;margin-top:14px}
  .somar span{background:#fff;border:1px solid var(--line);border-radius:999px;padding:8px 16px;font-size:12.5px;color:var(--ink);font-weight:600;box-shadow:0 4px 14px -8px rgba(0,0,0,.2)}
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


def mm(src, alt, name, desc, pos="center 50%"):
    return (f'<div class="mm"><div class="mmph">{img(src, alt, pos)}</div>'
            f'<div class="mmb"><div class="mmn">{name}</div><div class="mmd">{desc}</div></div></div>')


def exc(src, pos, nome, local, valor, texto, cap="", capbig=False, inc="", prem=False):
    cls = "exc prem" if prem else "exc"
    badges = ""
    if prem:
        badges += '<span class="expremtag">Opção premium</span>'
    if cap:
        badges += f'<span class="excap{" big" if capbig else ""}">{cap}</span>'
    inc_html = f'<div class="exinc">{inc}</div>' if inc else ''
    return (f'<div class="{cls}"><div class="exph">{img(src, nome, pos)}{badges}</div>'
            f'<div class="exb"><div class="exn">{nome}</div><div class="exloc">{local}</div>'
            f'<div class="exval">a partir de <b>{valor}</b> / pessoa</div>'
            f'<div class="exd">{texto}</div>{inc_html}</div></div>')


# ===== 1 · CAPA (mantida) =====
cover = f'''
  <section class="slide">
{head_block("Aniversário · mão na massa", "Adriana", "", "São Paulo · 07/11")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Um aniversário no ateliê</span>
        <h1>Um aniversário para <em>criar juntos</em></h1>
        <p class="lead">Uma comemoração para sair do óbvio: colocar a mão na massa, criar alguma coisa juntos, conversar, brindar — e ainda levar pra casa uma lembrança feita por vocês.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>Até 20</b> pessoas</span>
          <span class="chip"><b>07/11</b></span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip">São Paulo</span>
        </div>
      </div>
      <div class="cover-photo">{img("agora-mesa.jpg", "Mesa criativa montada no ateliê, com velas e flores", "center 50%")}</div>
    </div>
    {foot("Aniversário · Adriana")}
  </section>'''

# ===== 2 · AS EXPERIÊNCIAS (mantida; Flores -> Tufting) =====
experiencias = f'''
  <section class="slide">
{head_simple("Mão na massa")}
    <span class="eyebrow orange">◆ Cinco caminhos</span>
    <h2>Qual tem <em>mais a cara de vocês?</em></h2>
    <div class="mmg">
      {mm("pinturatacavinho.jpg", "Pintura em taças", "Pintura em taças", "Cada um cria e personaliza a própria taça.", "center 50%")}
      {mm("ceramicamodelagem.jpg", "Modelagem em cerâmica", "Cerâmica", "Argila na mão para modelar uma peça do zero.", "center 50%")}
      {mm("lado-b-grupo-pecas.webp", "Tufting", "Tufting", "Fios, texturas e criatividade para desenvolver uma peça autoral.", "center 25%")}
      {mm("pinturapratoceramica.jpg", "Pintura em cerâmica", "Pintura em cerâmica", "Peças prontas ganham cor e personalidade.", "center 50%")}
      {mm("vela-aromatica-real.jpg", "Velas aromáticas", "Velas aromáticas", "Cada um escolhe os aromas e cria a própria vela.", "center 50%")}
    </div>
    {foot("Cinco experiências")}
  </section>'''

# ===== 3 · EXPERIÊNCIAS + LOCAL + VALOR (cotação) =====
cards = "\n      ".join([
    exc("pinturataca.jpg", "center 45%", "Pintura em taças",
        "Elarah até você · casa, salão ou espaço do grupo", "R$ 249",
        "Cada pessoa personaliza a própria taça enquanto o grupo cria, conversa e brinda.", "Até 20 pessoas"),
    exc("agora-hero.jpg", "center 45%", "Cerâmica",
        "Agora Intu · Pinheiros", "R$ 281,25",
        "Modelagem à mão para cada participante criar uma peça do zero.",
        "Até 16 pessoas", capbig=True, inc="Inclui <b>materiais</b>, <b>condução</b> e <b>queima</b> da peça."),
    exc("agora-pintando.jpg", "center 30%", "Pintura em cerâmica",
        "Agora Intu · Pinheiros", "R$ 281,25",
        "Cada participante escolhe e personaliza uma peça com cores e desenhos próprios.",
        "Até 16 pessoas", capbig=True, inc="Inclui <b>peça</b>, <b>materiais</b>, <b>condução</b> e <b>queima</b>."),
    exc("vela-grupo-oficina.jpg", "center 35%", "Velas aromáticas",
        "Espaço parceiro ou Elarah até você", "R$ 309",
        "Cada participante escolhe aromas e cria sua própria vela para levar para casa.", "Até 20 pessoas"),
    exc("tufting-cereja.jpg", "center 45%", "Tufting",
        "Lado B Studio · Perdizes", "R$ 799",
        "Experiência criativa com fios e texturas para desenvolver uma peça têxtil autoral.", prem=True),
    exc("em-casa-hero-1.jpg", "center 40%", "No espaço de vocês",
        "Casa · salão · condomínio · espaço do grupo", "R$ 249",
        "Se já têm um lugar em mente, a Elarah leva a experiência até lá — profissional, materiais e estrutura conforme a atividade.", "Até 20 pessoas"),
])

cotacao = f'''
  <section class="slide">
{head_simple("Experiências · local · valor")}
    <span class="eyebrow orange">◆ A cotação</span>
    <h2>Onde vocês querem <em>criar?</em></h2>
    <p class="lead">Experiências em ateliês parceiros ou levadas até o espaço de vocês.</p>
    <div class="exg">
      {cards}
    </div>
    <div class="outros">
      <div class="ott">Outros espaços parceiros</div>
      <div class="oll">
        <span>Raüs Café <small>Pinheiros</small></span>
        <span>Sala Bar <small>Pinheiros</small></span>
        <span>Espaço Cardeal <small>Pinheiros</small></span>
        <span>Sterna Faria Lima <small>Itaim Bibi</small></span>
      </div>
      <p>Também podemos montar a experiência em outros espaços parceiros próximos à região escolhida. Valores e condições variam conforme atividade, número de convidados e disponibilidade.</p>
    </div>
    {foot("Experiências · local · valor")}
  </section>'''

# ===== 4 · COMO FUNCIONA =====
comofunciona = f'''
  <section class="slide">
{head_simple("Como funciona")}
    <span class="eyebrow orange">◆ Simples do começo ao fim</span>
    <h2>Vocês escolhem. <em>A gente monta.</em></h2>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="num">01</div><h3>Escolham</h3><p>A experiência e o espaço que mais combinam com o grupo.</p></div>
      <div class="infocard"><div class="num">02</div><h3>Confirmamos</h3><p>Validamos a disponibilidade para 07/11 e o número final de convidados.</p></div>
      <div class="infocard"><div class="num">03</div><h3>A Elarah cuida do resto</h3><p>Profissional, materiais, produção e organização da experiência.</p></div>
    </div>
    <div class="datecall">
      <span class="di">✦</span>
      <p>Se preferirem, <b>levamos tudo até o espaço de vocês</b>. Experiências <b>a partir de R$ 249 por pessoa</b>.</p>
    </div>
    {foot("Como funciona")}
  </section>'''

# ===== 5 · ADICIONAIS =====
adicionais = f'''
  <section class="slide">
{head_simple("Adicionais")}
    <span class="eyebrow orange">◆ Pra deixar completo</span>
    <h2>Adicionais <em>opcionais</em></h2>
    <div class="bfeat">
      <div class="bphoto">{img("bfa-grupo2.webp", "Grupo comemorando junto, registro espontâneo", "center 45%")}</div>
      <div class="bbody">
        <span class="btag">Registro fotográfico</span>
        <h3>As memórias do dia</h3>
        <p style="font-size:13px;color:var(--muted);line-height:1.6;margin-top:12px">Um fotógrafo acompanha a experiência e registra o grupo, as criações e a comemoração. Vocês recebem um álbum digital pronto pra compartilhar.</p>
        <div class="avalpill">R$ 450 <small>valor total</small></div>
      </div>
    </div>
    <p class="subh" style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin:20px 0 0">Podemos somar</p>
    <div class="somar">
      <span>Vinho</span><span>Drinks</span><span>Bolo</span><span>Comidinhas</span>
      <span>Flores</span><span>Fotografia</span><span>Pequenos mimos</span><span>Ambientação</span>
    </div>
    {foot("Adicionais")}
  </section>'''

# ===== 6 · FECHAMENTO =====
fechamento = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Bora reservar?</span>
    <h2>Qual tem <em>mais a cara de vocês?</em></h2>
    <p class="lead">Adriana, conta pra gente qual opção vocês mais gostaram. A partir dela, confirmamos a disponibilidade para <b>07/11</b> e seguimos com a reserva.</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="num">01</div><h3>Escolhem</h3><p>Experiência + espaço.</p></div>
      <div class="infocard"><div class="num">02</div><h3>Confirmamos</h3><p>Agenda e número final de convidados.</p></div>
      <div class="infocard"><div class="num">03</div><h3>A gente cuida do resto</h3><p>Produção, materiais e organização.</p></div>
    </div>
    <div class="quote" style="margin-top:18px">
      Vocês escolhem a favorita. A Elarah cuida do resto. 🧡<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n'
        + cover + experiencias + cotacao + comofunciona + adicionais + fechamento + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/orcamento-adriana.html"
io.open(out, "w", encoding="utf-8").write(html)
for bad in ["Sob consulta", "sob consulta", "a confirmar", "House Café", "House Cafe", "Flores &amp; arranjos", "Flores & arranjos"]:
    assert bad not in deck, f"PROIBIDO presente: {bad}"
print("wrote", out, "| slides:", html.count('<section class="slide">'), "| ok")
