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
  /* investimento visual (foto + valores) */
  .invsplit{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:18px;align-items:stretch}
  .invphoto{margin:0;border-radius:20px;overflow:hidden;position:relative;min-height:400px;border:1px solid var(--line);box-shadow:0 20px 46px -28px rgba(0,0,0,.42)}
  .invphoto img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .invphoto figcaption{position:absolute;left:0;right:0;bottom:0;padding:30px 18px 15px;color:#fff;font-family:'DM Serif Display',serif;font-size:15px;background:linear-gradient(to top,rgba(46,31,42,.86),transparent)}
  .invbd{display:flex;flex-direction:column;justify-content:center}
  .invbig{font-family:'DM Serif Display',serif;font-size:66px;color:var(--navy);line-height:1}
  .invper{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--navy-soft);font-weight:700;margin-top:5px}
  .invrows{display:grid;gap:16px;margin-top:24px}
  .invrow{border-left:3px solid var(--orange);padding-left:15px}
  .invrow .k{font-size:11px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .invrow .t{font-size:12.5px;color:var(--muted);line-height:1.5;margin-top:3px}
  .invrow .t b{color:var(--navy);font-weight:700}
  /* proximos passos visual (foto + passos) */
  .nxsplit{display:grid;grid-template-columns:1fr 1.05fr;gap:30px;margin-top:16px;align-items:stretch}
  .nxphoto{margin:0;border-radius:20px;overflow:hidden;position:relative;min-height:430px;border:1px solid var(--line);box-shadow:0 20px 46px -28px rgba(0,0,0,.42)}
  .nxphoto img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .nxphoto figcaption{position:absolute;left:0;right:0;bottom:0;padding:34px 18px 16px;color:#fff;font-family:'DM Serif Display',serif;font-size:15px;background:linear-gradient(to top,rgba(46,31,42,.9),transparent)}
  .nxbd{display:flex;flex-direction:column;justify-content:center}
  .nxsteps{display:grid;gap:15px;margin-top:20px}
  .nxstep{display:flex;gap:14px;align-items:flex-start}
  .nxstep .num{flex:none;width:36px;height:36px;border-radius:999px;background:var(--navy);color:#fff;font-family:'DM Serif Display',serif;font-size:18px;display:flex;align-items:center;justify-content:center}
  .nxstep h3{font-size:14.5px;font-weight:700;color:var(--navy);margin:3px 0 3px}
  .nxstep p{font-size:11.5px;color:var(--muted);line-height:1.45}
  .nxcontact{margin-top:22px;padding-top:14px;border-top:1px solid var(--line);font-size:11px;color:var(--navy-soft)}
  .nxcontact b{color:var(--navy)}
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
        <p class="lead">Um aniversário para <strong>reunir os amigos</strong>, <strong>colocar a mão na massa</strong>, brindar, rir e <strong>criar algo juntos</strong> — uma comemoração diferente para guardar na memória. ✨</p>
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
    <p class="lead">Trocar a comemoração tradicional por uma experiência leve e cheia de troca — daquelas em que todo mundo <strong>cria</strong>, <strong>conversa</strong>, <strong>ri</strong>, <strong>brinda</strong> e ainda <strong>leva uma lembrança feita por vocês</strong>.</p>
    <div class="pil3">
      <div class="p"><div class="pt">Criar juntos</div><div class="pd">Experiências feitas para colocar a mão na massa. Da argila aos aromas, cada convidado participa e cria algo único.</div></div>
      <div class="p"><div class="pt">Celebrar juntos</div><div class="pd">Uma comemoração leve, com tempo para conversar, brindar e aproveitar o momento.</div></div>
      <div class="p"><div class="pt">Levar uma lembrança</div><div class="pd">No final, cada pessoa leva uma criação feita por ela.</div></div>
    </div>
    <div class="gstrip" style="margin-top:16px">
      <figure>{img("bfa-grupo2.webp", "Homens e mulheres criando e rindo juntos", "center 40%")}<figcaption>Todos juntos</figcaption></figure>
      <figure>{img("agora-hero.jpg", "Grupo modelando argila na bancada do Agora Intu", "center 55%")}<figcaption>Mãos na argila</figcaption></figure>
      <figure>{img("agora-pintura.jpg", "Grupo pintando cerâmica no Agora Intu", "center 40%")}<figcaption>Cerâmica &amp; cor</figcaption></figure>
      <figure>{img("agora-selfie.jpg", "Grupo rindo durante a experiência", "center 35%")}<figcaption>Muita risada</figcaption></figure>
      <figure>{img("agora-grupo.jpg", "Grupo criando junto à mesa do Agora Intu", "center 50%")}<figcaption>Criar junto</figcaption></figure>
      <figure>{img("agora-aquarela.jpg", "Peça sendo feita no ateliê", "center 40%")}<figcaption>Peças sendo feitas</figcaption></figure>
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
      {mm("pinturataca.jpg", "Pintura em taças", "Pintura em Taças", "Cada um personaliza a própria taça enquanto o grupo cria e brinda.", "R$ 249", "center 45%")}
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
      {vc("agora-grupo.jpg", "Agora Intu", "Agora Intu", "Pinheiros · Ateliê criativo", "Nossa recomendação: ateliê criativo e acolhedor, ótimo para cerâmica, pintura e velas.", "center 50%")}
      {vc("yucafe-real.jpg", "Café & Eventos", "Café &amp; Eventos", "Café · Eventos", "Espaço acolhedor para reunir o grupo e comemorar com conforto. <b>Até 20 · ~3h · R$ 100/pessoa</b> — inclui bolo, água, café e pão de queijo.", "center 50%")}
      {vc("shoyu-atelie.jpg", "Shoyu Crafts", "Shoyu Crafts", "Pinheiros · Ateliê de cerâmica", "Ateliê de cerâmica cheio de charme. Perfeito para modelar e pintar peças.", "center 55%")}
      {vc("em-casa-hero-2.jpg", "Elarah até você", "Elarah até você", "No espaço do grupo", "Levamos a experiência até casa, salão, condomínio ou outro espaço — <b>mesma experiência, mesmo valor</b>.", "center 40%")}
    </div>
    <p class="fineprint">Também trabalhamos com o <b>Espaço Cardeal</b> (Pinheiros · privativo), disponível <b>sob locação</b>. Disponibilidade, alimentação e eventuais valores de locação estão sujeitos a confirmação.</p>
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
          <li><span class="st">✦</span><b>Profissionais</b> — condução da experiência por nossa conta</li>
          <li><span class="st">✦</span><b>Materiais</b> — tudo o que precisa para criar</li>
          <li><span class="st">✦</span><b>Estrutura</b> — montagem e organização no seu espaço</li>
        </ul>
      </div>
    </div>
    <div class="bnote" style="margin-top:16px">◆ <b>Qual delas combina mais com o grupo?</b> Cerâmica, pintura, tufting, velas, taças ou <b>perfume</b> — vocês escolhem a experiência e nós montamos o formato. 🧡</div>
    {foot("Elarah até você")}
  </section>'''

# ===== 6 · COMO FICA NA PRÁTICA (A MESA POSTA) =====
mesaposta = f'''
  <section class="slide">
{head_simple("Como fica na prática")}
    <span class="eyebrow orange">◆ Como fica na prática</span>
    <h2>A mesa posta, do <em>jeito Elarah</em></h2>
    <p class="lead">Não é só a atividade: é a <strong>mesa montada com carinho</strong>, a decoração no clima e cada <strong>estação pronta</strong> esperando a turma. A gente chega antes, deixa tudo lindo e <strong>desmonta no fim</strong> — vocês só curtem. 🎀</p>
    <div class="gstrip" style="margin-top:16px">
      <figure>{img("aniversario-mesa-real.jpg", "Mesa de aniversário montada", "center 45%")}<figcaption>Mesa de aniversário</figcaption></figure>
      <figure>{img("aniv-decor.jpg", "Decoração e clima", "center 40%")}<figcaption>Decoração &amp; clima</figcaption></figure>
      <figure>{img("agora-mesa.jpg", "Mesa posta para a turma", "center 55%")}<figcaption>Mesa posta pra turma</figcaption></figure>
      <figure>{img("vela-aromatica-real.jpg", "Lembrancinha que fica", "center 50%")}<figcaption>Lembrancinha que fica</figcaption></figure>
      <figure>{img("mol-estacao.jpg", "Estações prontas", "center 45%")}<figcaption>Estações prontas</figcaption></figure>
      <figure>{img("pintura-taca-brinde.jpg", "Peças que elas levam", "center 45%")}<figcaption>Peças que elas levam</figcaption></figure>
    </div>
    {foot("Como fica na prática")}
  </section>'''

# ===== 6 · INVESTIMENTO =====
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Simples de <em>fechar</em></h2>
    <div class="invsplit">
      <figure class="invphoto">{img("bfa-grupo2.webp", "Grupo comemorando e criando junto", "center 40%")}<figcaption>Uma comemoração para viver junto 🧡</figcaption></figure>
      <div class="invbd">
        <div class="invbig">R$ 249</div>
        <div class="invper">experiências a partir de · por pessoa</div>
        <div class="invrows">
          <div class="invrow"><div class="k">No espaço parceiro</div><div class="t">Valores variam conforme <b>experiência</b>, <b>espaço</b> e número final de convidados.</div></div>
          <div class="invrow"><div class="k">Elarah até você</div><div class="t">Mesma experiência, a partir de <b>R$ 249</b> por pessoa.</div></div>
          <div class="invrow"><div class="k">Opcionais</div><div class="t">Comidinhas, bebidas, brindes e registro fotográfico (a partir de <b>R$ 450</b>).</div></div>
        </div>
      </div>
    </div>
    <p class="fineprint">Valores por pessoa, conforme experiência, espaço e número final de convidados. Algumas experiências possuem capacidade específica. Opcionais e data <b>sujeitos a confirmação</b>.</p>
    {foot("Investimento")}
  </section>'''

# ===== 7 · PRÓXIMOS PASSOS =====
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Bora escolher? ✨</span>
    <h2>É só <em>apontar</em> a favorita</h2>
    <div class="nxsplit">
      <figure class="nxphoto">{img("aniversario-mesa-real.jpg", "Grupo comemorando à mesa de aniversário", "center 45%")}<figcaption>Um aniversário para criar, celebrar e lembrar 🧡</figcaption></figure>
      <div class="nxbd">
        <p class="lead">Adriana, conta pra gente qual <b>experiência e formato</b> vocês mais gostaram — a partir disso, confirmamos <b>disponibilidade</b> e seguimos com a reserva.</p>
        <div class="nxsteps">
          <div class="nxstep"><div class="num">1</div><div><h3>Escolham</h3><p>A(s) experiência(s) que mais combinam com a festa.</p></div></div>
          <div class="nxstep"><div class="num">2</div><div><h3>Montamos o orçamento</h3><p>Espaço, materiais e organização sob medida.</p></div></div>
          <div class="nxstep"><div class="num">3</div><div><h3>É só curtir</h3><p>No dia, chega tudo pronto — vocês só aproveitam.</p></div></div>
        </div>
        <div class="nxcontact"><i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <b>+55 (11) 91445-5930</b> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br</div>
      </div>
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n' + cover + conceito + cardapio + espacos + atevoce
        + mesaposta + investimento + proximos + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/orcamento-adriana.html"
io.open(out, "w", encoding="utf-8").write(html)
for bad in ["Sob consulta", "sob consulta", "aniversário no ateliê",
            "lado-b", "Lado B", "casa-aquario", "Casa Aquário", "greta", "Greta",
            "foldingbook", "Folding Book"]:
    assert bad not in deck, f"PROIBIDO presente: {bad}"
print("wrote", out, "| slides:", html.count('<section class="slide">'), "| ok")
