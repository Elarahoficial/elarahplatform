# Proposta Elarah · Aniversario Adriana · ate 20 (grupo misto) · 07/11 · SP
# v4: ENXUTO (7 slides). Capa -> Conceito/Vibe -> Cardapio (6) -> Espacos (4) -> Elarah ate voce -> Investimento (tabela) -> Proximos passos.
# Valores SOMENTE confirmados. Folding Book = a confirmar (sinalizado). Sem "sob consulta" como destaque.
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/orcamento-adriana.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]

extra = '''
<style>
  .pil3{display:grid;grid-template-columns:repeat(3,1fr);gap:26px;margin-top:18px}
  .pil3 .p{border-left:2px solid var(--orange);padding-left:15px}
  .pil3 .pt{font-family:'DM Serif Display',serif;font-size:17px;color:var(--navy);line-height:1.1}
  .pil3 .pd{font-size:11.5px;color:var(--muted);margin-top:4px;line-height:1.45}
  /* cardapio: preco por card */
  .mm .mmb{display:flex;flex-direction:column}
  .mm .mmprice{margin-top:auto;padding-top:11px;font-size:10.5px;letter-spacing:.02em;color:var(--navy-soft);font-weight:600}
  .mm .mmprice b{font-family:'DM Serif Display',serif;font-weight:400;font-size:16px;color:var(--orange-dark);letter-spacing:0}
  /* investimento: resumo comercial */
  .pbig{display:flex;align-items:baseline;gap:16px;margin-top:14px}
  .pbig .n{font-family:'DM Serif Display',serif;font-size:54px;color:var(--navy);line-height:1}
  .pbig .lbl{font-size:12.5px;letter-spacing:.03em;color:var(--navy-soft);font-weight:600;max-width:18ch;line-height:1.35}
  .pbig .lbl b{color:var(--orange-dark);font-weight:700}
  .icards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:24px}
  .ic{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px 20px;box-shadow:0 14px 34px -26px rgba(0,0,0,.3);display:flex;flex-direction:column}
  .ic .k{font-size:10px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .ic .v{font-family:'DM Serif Display',serif;font-size:19px;color:var(--navy);margin:9px 0 6px;line-height:1.08}
  .ic p{font-size:11.5px;color:var(--muted);line-height:1.5;margin:0}
  .ic p b{color:var(--navy);font-weight:700}
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


def mm(src, alt, name, desc, price, pos="center 50%"):
    return (f'<div class="mm"><div class="mmph">{img(src, alt, pos)}</div>'
            f'<div class="mmb"><div class="mmn">{name}</div><div class="mmd">{desc}</div>'
            f'<div class="mmprice">A partir de <b>{price}</b>/pessoa</div></div></div>')


def vc(src, alt, name, bairro, desc, pos="center 50%"):
    return (f'<div class="vc"><div class="vcph">{img(src, alt, pos)}</div>'
            f'<div class="vcb"><div class="vcn">{name}</div><div class="vcbairro">{bairro}</div>'
            f'<div class="vcd">{desc}</div></div></div>')


# ===== 1 · CAPA =====
cover = f'''
  <section class="slide">
{head_block("Aniversário · mão na massa", "Adriana", "", "São Paulo · 07/11")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Um aniversário criativo</span>
        <h1>Um aniversário para <em>criar juntos</em></h1>
        <p class="lead">Reunir os amigos, <strong>colocar a mão na massa</strong>, brindar, rir e <strong>fazer algo diferente juntos</strong> — e ainda <strong>levar uma lembrança do dia</strong>. ✨</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>Até 20</b> pessoas</span>
          <span class="chip">Homens &amp; mulheres</span>
          <span class="chip"><b>07/11</b></span>
        </div>
      </div>
      <div class="cover-photo">{img("bfa-grupo1.webp", "Homens e mulheres criando juntos numa experiência de mão na massa", "center 45%")}</div>
    </div>
    {foot("Aniversário · Adriana")}
  </section>'''

# ===== 2 · CONCEITO / VIBE =====
conceito = f'''
  <section class="slide">
{head_simple("O conceito")}
    <span class="eyebrow orange">◆ A proposta</span>
    <h2>Criar, conversar e <em>comemorar</em></h2>
    <p class="lead">Trocar a comemoração tradicional por uma experiência <strong>leve, participativa e cheia de troca</strong> — daquelas em que <strong>todo mundo cria, conversa, ri e brinda junto</strong>.</p>
    <div class="pil3">
      <div class="p"><div class="pt">Mão na massa</div><div class="pd">Todo mundo participa e cria alguma coisa.</div></div>
      <div class="p"><div class="pt">Leve &amp; social</div><div class="pd">Pra conversar, brindar e curtir sem pressa.</div></div>
      <div class="p"><div class="pt">Com a cara do grupo</div><div class="pd">A atividade, o espaço e o formato que mais combinam com vocês.</div></div>
    </div>
    <div class="gstrip" style="margin-top:16px">
      <figure>{img("bfa-grupo2.webp", "Homens e mulheres criando juntos", "center 45%")}<figcaption>Todos juntos</figcaption></figure>
      <figure>{img("ceramicamodelagem.jpg", "Mãos trabalhando a argila", "center 50%")}<figcaption>Mãos na obra</figcaption></figure>
      <figure>{img("pinturataca.jpg", "Pintura em taça", "center 45%")}<figcaption>Criar &amp; brindar</figcaption></figure>
      <figure>{img("agora-selfie.jpg", "Grupo rindo durante a experiência", "center 35%")}<figcaption>Muita risada</figcaption></figure>
      <figure>{img("lado-b-vermelho.webp", "Materiais e texturas", "center 30%")}<figcaption>Materiais &amp; texturas</figcaption></figure>
      <figure>{img("agora-grupo.jpg", "Grupo reunido à mesa", "center 45%")}<figcaption>Em volta da mesa</figcaption></figure>
    </div>
    {foot("O conceito")}
  </section>'''

# ===== 3 · CARDÁPIO =====
cardapio = f'''
  <section class="slide">
{head_simple("O cardápio")}
    <span class="eyebrow orange">◆ Escolham a favorita</span>
    <h2>Qual tem <em>mais a cara de vocês?</em></h2>
    <p class="lead">Um cardápio de experiências para <strong>colocar a mão na massa</strong>.</p>
    <div class="mmg">
      {mm("pinturataca.jpg", "Pintura em taças", "Pintura em Taças", "Cada um personaliza a própria taça enquanto o grupo cria e brinda.", "R$ 269", "center 45%")}
      {mm("ceramicamodelagem.jpg", "Cerâmica à mão", "Cerâmica à Mão", "Argila na mão para modelar uma peça do zero.", "R$ 369", "center 50%")}
      {mm("tufting1.jpg", "Tufting & Punch", "Tufting &amp; Punch", "Fios, cores e texturas para criar uma peça autoral.", "R$ 799", "center 30%")}
      {mm("agora-pintando.jpg", "Pintura em cerâmica", "Pintura em Cerâmica", "Peças prontas ganham cores, desenhos e personalidade.", "R$ 349", "center 30%")}
      {mm("vela-grupo-oficina.jpg", "Crie sua vela aromática", "Crie sua Vela Aromática", "Escolha fragrâncias e crie sua própria vela.", "R$ 329", "center 35%")}
      {mm("perfumaria-oficina.jpg", "Perfume autoral", "Perfume Autoral", "Explore notas e combinações para criar uma fragrância com a sua identidade.", "R$ 459", "center 40%")}
    </div>
    {foot("O cardápio de experiências")}
  </section>'''

# ===== 4 · ESPAÇOS PARCEIROS =====
espacos = f'''
  <section class="slide">
{head_simple("Espaços parceiros")}
    <span class="eyebrow orange">◆ Onde pode acontecer</span>
    <h2>Quatro espaços, <em>quatro vibes</em></h2>
    <div class="vg" style="grid-template-columns:1fr 1fr">
      {vc("agora-grupo.jpg", "Agora Intu", "Agora Intu", "Pinheiros · Ateliê", "Ateliê criativo e acolhedor. Ótimo para cerâmica e pintura.", "center 50%")}
      {vc("lado-b-grupo-pecas.webp", "Lado B Studio", "Lado B Studio", "Perdizes · Ateliê", "Estúdio contemporâneo e colorido. Ideal para tufting & punch.", "center 25%")}
      {vc("yucafe-real.jpg", "Raüs Café", "Raüs Café", "Pinheiros · Café", "Intimista e descontraído. Ótimo para taças, velas e experiências sensoriais.", "center 50%")}
      {vc("casa-aquario-lounge.jpg", "Casa Aquário", "Casa Aquário", "Pinheiros · Privativo", "Espaço reservado e versátil, ideal para montar uma experiência exclusiva para o grupo.", "center 50%")}
    </div>
    {foot("Espaços parceiros")}
  </section>'''

# ===== 5 · ELARAH ATÉ VOCÊ =====
atevoce = f'''
  <section class="slide">
{head_simple("Elarah até você")}
    <span class="eyebrow orange">◆ No espaço de vocês</span>
    <h2>Elarah <em>até você</em></h2>
    <p class="lead">A experiência também pode acontecer <strong>em casa</strong>, no salão de festas, no condomínio ou em <strong>outro espaço escolhido pelo grupo</strong>.</p>
    <div class="bfeat">
      <div class="bphoto">{img("em-casa-hero-1.jpg", "Grupo criando junto em casa", "center 40%")}</div>
      <div class="bbody">
        <span class="btag">A gente leva até você</span>
        <h3>É só receber o grupo</h3>
        <ul class="feat">
          <li><span class="st">✦</span><b>A experiência</b> — vocês escolhem a favorita</li>
          <li><span class="st">✦</span><b>A estrutura</b> — materiais e profissionais por nossa conta</li>
          <li><span class="st">✦</span><b>O espaço</b> — a gente leva a experiência até vocês</li>
        </ul>
      </div>
    </div>
    <div class="bnote" style="margin-top:16px">◆ <b>Qual delas combina mais com o grupo?</b> Cerâmica, pintura, tufting, velas, taças ou <b>perfume</b> — vocês escolhem a experiência e nós montamos o formato. 🧡</div>
    {foot("Elarah até você")}
  </section>'''

# ===== 6 · INVESTIMENTO =====
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Simples de <em>fechar</em></h2>
    <div class="pbig"><div class="n">R$ 269</div><div class="lbl">experiências <b>a partir de</b><br>por pessoa</div></div>
    <div class="icards">
      <div class="ic"><div class="k">No espaço parceiro</div><div class="v">Sob o formato escolhido</div><p>Valores variam conforme a <b>experiência</b> e o <b>local</b> escolhido.</p></div>
      <div class="ic"><div class="k">Elarah até você</div><div class="v">A partir de R$ 269</div><p>Experiências no <b>espaço do grupo</b>, por pessoa.</p></div>
      <div class="ic"><div class="k">Adicional</div><div class="v">Registro fotográfico</div><p><b>R$ 450</b> — valor total.</p></div>
    </div>
    <p class="fineprint">Valores por pessoa, considerando experiência, formato e número final de convidados. Algumas experiências possuem capacidade específica. Data sujeita à disponibilidade.</p>
    {foot("Investimento")}
  </section>'''

# ===== 7 · PRÓXIMOS PASSOS =====
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Bora fechar?</span>
    <h2>Qual tem <em>mais a cara de vocês?</em></h2>
    <p class="lead">Adriana, conta pra gente qual <b>experiência + espaço</b> vocês mais gostaram. A partir daí, confirmamos a disponibilidade para <b>07/11</b> e seguimos com a reserva.</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="num">01</div><h3>Escolhem</h3><p><b>Experiência + espaço</b>.</p></div>
      <div class="infocard"><div class="num">02</div><h3>Confirmamos</h3><p>Agenda e número final de convidados.</p></div>
      <div class="infocard"><div class="num">03</div><h3>A Elarah cuida do resto</h3><p>Produção, materiais e organização.</p></div>
    </div>
    <div class="quote" style="margin-top:20px">
      Vocês escolhem a favorita. <b>A Elarah cuida do resto.</b> 🧡<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n' + cover + conceito + cardapio + espacos + atevoce
        + investimento + proximos + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/orcamento-adriana.html"
io.open(out, "w", encoding="utf-8").write(html)
for bad in ["Sob consulta", "sob consulta", "aniversário no ateliê"]:
    assert bad not in deck, f"PROIBIDO presente: {bad}"
print("wrote", out, "| slides:", html.count('<section class="slide">'), "| ok")
