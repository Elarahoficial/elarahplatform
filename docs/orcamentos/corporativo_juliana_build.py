# Proposta Elarah · Team building Juliana · 8 pessoas · 22/10 · Brooklin · budget ate R$2.000 (nao citar)
# EVOLUCAO da proposta inicial (mesma identidade do deck de tufting/Lado B): mesma narrativa/tom/estetica (BFA verde/terracota).
# Curadoria atualizada em 3 blocos: Sabonete, Vela, Croche. Opcionais: Fotografia R$450 · Mimo R$139.
# Valores finais ao cliente. Destaque sutil (selo "dentro do orçamento") nas opcoes <= R$2.000 total. Fotos reais.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

# paleta editorial BFA: off-white · verde profundo · terracota · argila (mesma da proposta inicial)
reps = {
    "--orange:#B08D4C;": "--orange:#A9663F;",
    "--orange-dark:#8A6D34;": "--orange-dark:#8A4F30;",
    "--navy:#12362B;": "--navy:#26332A;",
    "--navy-soft:#3A5A4E;": "--navy-soft:#4A5A4E;",
    "--blue-accent:#B08D4C;": "--blue-accent:#A9663F;",
    "#EFF3EE": "#F1F3EB", "#DCE8E1": "#DEE6D6", "#CBB06E": "#C79A72",
    "rgba(176,141,76,.24)": "rgba(169,102,63,.24)",
    "rgba(176,141,76,.26)": "rgba(169,102,63,.28)",
    "rgba(176,141,76,.10)": "rgba(169,102,63,.10)",
    "rgba(18,54,43,.16)": "rgba(38,51,42,.16)",
    "rgba(10,28,22,.86)": "rgba(20,28,22,.86)",
    "rgba(10,28,22,.85)": "rgba(20,28,22,.85)",
    "rgba(10,28,22,.82)": "rgba(20,28,22,.82)",
}
for a, b in reps.items():
    head = head.replace(a, b)

xcss = '''
  .checks{display:grid;grid-template-columns:1fr 1fr;gap:9px 24px;margin-top:14px}
  .checks li{list-style:none;position:relative;padding-left:26px;font-size:12px;color:var(--ink);line-height:1.3}
  .checks li b{color:var(--navy);font-weight:700}
  .checks li .ck{position:absolute;left:0;top:0;width:17px;height:17px;border-radius:999px;background:var(--orange);color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center}
  .num{font-family:'DM Serif Display',serif;color:var(--orange);font-size:24px;line-height:1}
  /* cards de experiencia (2 col) */
  .egr{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}
  .ec{position:relative;background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 14px 32px -26px rgba(0,0,0,.32)}
  .ec .eph{height:158px;overflow:hidden;background:#eee}
  .ec .eph img{width:100%;height:100%;object-fit:cover;display:block}
  .ec .eb{padding:14px 18px 16px;display:flex;flex-direction:column;flex:1}
  .ec .en{font-family:'DM Serif Display',serif;font-weight:400;font-size:19px;color:var(--navy);line-height:1.05}
  .ec .edur{font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--orange-dark);font-weight:700;margin-top:4px}
  .ec .ed{font-size:11px;color:var(--muted);line-height:1.45;margin-top:8px}
  .ec .eleva{font-size:10.5px;color:var(--navy-soft);line-height:1.4;margin-top:7px}
  .ec .eleva b{color:var(--navy);font-weight:600}
  .ec .epr{margin-top:11px;padding-top:9px;border-top:1px solid var(--line);display:flex;align-items:baseline;justify-content:space-between;gap:8px}
  .ec .epr .pp{font-family:'DM Serif Display',serif;font-size:19px;color:var(--orange-dark);line-height:1}
  .ec .epr .pp small{font-family:-apple-system,sans-serif;font-size:8.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-left:4px}
  .ec .epr .tt{font-size:10.5px;color:var(--muted);white-space:nowrap}
  .ec .ebadge{position:absolute;top:11px;left:11px;background:var(--orange-dark);color:#fff;font-size:7.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:4px 10px;border-radius:999px;z-index:2;box-shadow:0 6px 16px -6px rgba(0,0,0,.5)}
  /* opcionais 2 col foto-topo */
  .opts{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:16px}
  .opt{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 12px 30px -22px rgba(0,0,0,.28)}
  .opt .oph{aspect-ratio:16/10;overflow:hidden;background:#eee;border-bottom:1px solid var(--line)}
  .opt .oph img{width:100%;height:100%;object-fit:cover;display:block}
  .opt .ob{padding:16px 22px 18px;flex:1;display:flex;flex-direction:column}
  .opt .ot{font-size:9px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .opt h4{font-family:'DM Serif Display',serif;font-weight:400;font-size:21px;color:var(--navy);line-height:1.05;margin-top:3px}
  .opt p{font-size:12px;color:var(--muted);line-height:1.5;margin-top:8px;flex:1}
  .opt .op{margin-top:12px;font-family:'DM Serif Display',serif;font-size:26px;color:var(--orange-dark);line-height:1}
  .opt .op small{font-family:-apple-system,sans-serif;font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-weight:700;margin-left:5px}
</style>'''
head = head.replace("</style>", xcss, 1)


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


def ecard(name, dur, desc, leva, pp, total, src, alt, pos="center 50%", budget=False):
    badge = '<span class="ebadge">✦ dentro do orçamento</span>' if budget else ''
    return (f'<div class="ec">{badge}<div class="eph">{img(src, alt, pos)}</div>'
            f'<div class="eb"><div class="en">{name}</div><div class="edur">{dur}</div>'
            f'<div class="ed">{desc}</div><div class="eleva">Leva pra casa: <b>{leva}</b></div>'
            f'<div class="epr"><span class="pp">R$ {pp}<small>por pessoa</small></span>'
            f'<span class="tt">R$ {total} · 8 pessoas</span></div></div></div>')


PROOF = "Já realizado para times como <b>Compass</b>, <b>Natura</b> e <b>Hidratei</b>"

# ============================ 1 · CAPA ============================
cover = f'''
  <section class="slide">
{head_block("Team building · turma privada", "Criar", "junto", "8 pessoas · 22/10")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência corporativa privada</span>
        <h1>O time junto, <em>de mão na massa</em></h1>
        <p class="lead">Uma pausa criativa só pro time — todo mundo na mesma mesa, criando com as próprias mãos, conversando e saindo da rotina. É o tipo de encontro que aproxima de verdade e deixa uma lembrança que fica.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>8</b> pessoas</span>
          <span class="chip"><b>22/10</b></span>
          <span class="chip">Brooklin</span>
        </div>
      </div>
      <div class="cover-photo">{img("capa-croche-cafe.jpg", "Grupo reunido em uma mesa criativa, com fios e materiais", "center 45%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Team building · Juliana")}
  </section>'''

# ============================ 2 · CONCEITO ============================
conceito = f'''
  <section class="slide">
{head_simple("Por que funciona")}
    <span class="eyebrow orange">◆ O que o time leva junto</span>
    <h2>Criar junto <em>aproxima o time</em></h2>
    <p class="lead">Sem dinâmica forçada: a conexão acontece quando o time senta na mesma mesa pra criar algo com as próprias mãos. A gente cuida da curadoria e da produção — vocês só chegam e aproveitam.</p>
    <div class="bfeat">
      <div class="bphoto">{img("corp-criativo.jpg", "Grupo criando junto, de mão na massa", "center 45%")}</div>
      <div class="bbody">
        <span class="btag">Como acontece</span>
        <h3>Do começo ao fim, com a gente</h3>
        <ul class="feat">
          <li><span class="st">1</span><b>Boas-vindas</b> — a mesa montada com todos os materiais.</li>
          <li><span class="st">2</span><b>Mão na massa</b> — cada um cria a própria peça, guiado por um profissional.</li>
          <li><span class="st">3</span><b>Pra levar</b> — cada um sai com a própria criação de recordação.</li>
        </ul>
      </div>
    </div>
    <div class="bnote" style="margin-top:16px">◆ <b>Tudo incluso:</b> profissional conduzindo · todos os materiais · montagem e estrutura · produção Elarah — em um espaço parceiro na região do Brooklin ou no espaço de vocês.</div>
    {foot("Por que funciona")}
  </section>'''

# ============================ 3 · SABONETE ============================
sabonete = f'''
  <section class="slide">
{head_simple("Experiências · Sabonete")}
    <span class="eyebrow orange">◆ Bloco 01 · Sabonete</span>
    <h2>Aromas, cores <em>e botânicos</em></h2>
    <p class="lead">Um processo sensorial e relaxante: cada um escolhe aromas, cores e botânicos e cria os próprios sabonetes, do começo ao fim.</p>
    <div class="egr">
      {ecard("Sabonete Artesanal", "2 horas", "Cada um cria os próprios sabonetes escolhendo aromas, cores e botânicos.", "os próprios sabonetes", "219", "1.752", "saboneteroxo.jpg", "Sabonetes artesanais com lavanda e botânicos", "center 50%", budget=True)}
      {ecard("Sabonete + Home Spray + Álcool em Gel", "2h30", "Além dos sabonetes, cada um leva um home spray e um álcool em gel autorais.", "sabonetes + home spray + álcool em gel", "319", "2.552", "sabonete2.jpg", "Sabonetes e frasco em composição natural", "center 50%")}
    </div>
    {foot("Experiências · Sabonete")}
  </section>'''

# ============================ 4 · VELA ============================
vela = f'''
  <section class="slide">
{head_simple("Experiências · Vela")}
    <span class="eyebrow orange">◆ Bloco 02 · Vela</span>
    <h2>Cera, aromas <em>e aconchego</em></h2>
    <p class="lead">Cada um monta a própria vela — escolhendo aromas e detalhes — num ritual leve e cheio de charme.</p>
    <div class="egr">
      {ecard("Vela Aromática", "2 horas", "Cada um escolhe os aromas e cria a própria vela aromática.", "a própria vela", "229", "1.832", "vela-aromatica-real.jpg", "Preparo de vela aromática com flores secas", "center 50%", budget=True)}
      {ecard("Vela Aromática Nordic Smells", "2h30", "Aromas de inspiração nórdica e clima cozy para uma vela mais sofisticada.", "a própria vela nórdica", "239", "1.912", "velaaromaticaaaa.jpg", "Velas aromáticas em tons neutros", "center 50%", budget=True)}
      {ecard("Vela Café Gelado", "2 horas", "Uma vela decorativa inspirada no café gelado, cheia de personalidade.", "a vela café gelado", "319", "2.552", "velacafe.jpg", "Vela decorativa inspirada em café", "center 50%")}
      {ecard("Vela Drinks", "2 horas", "Velas em formato de drinks — divertidas e cheias de estilo.", "as próprias velas-drink", "319", "2.552", "veladrink.jpg", "Velas em formato de coquetéis", "center 50%")}
    </div>
    {foot("Experiências · Vela")}
  </section>'''

# ============================ 5 · CROCHÊ ============================
croche = f'''
  <section class="slide">
{head_simple("Experiências · Crochê")}
    <span class="eyebrow orange">◆ Bloco 03 · Crochê</span>
    <h2>Fios, texturas <em>e mãos à obra</em></h2>
    <p class="lead">Uma experiência criativa e absorvente: ponto a ponto, cada um desenvolve a própria peça de crochê pra levar pra casa.</p>
    <div class="egr">
      {ecard("Oficina de Bolsa de Crochê", "3h30", "Ponto a ponto, cada um desenvolve a própria bolsa de crochê, guiado do início ao fim.", "a própria bolsa de crochê", "279", "2.232", "croche-bolsa.jpg", "Bolsa de crochê colorida", "center 45%")}
      {ecard("Oficina de Guirlanda em Crochê", "2 horas", "Uma peça decorativa em crochê, delicada e autoral, pra chamar de sua.", "a própria guirlanda de crochê", "149", "1.192", "capa-croche-cafe.jpg", "Fios e materiais de crochê sobre a mesa", "center 50%", budget=True)}
    </div>
    {foot("Experiências · Crochê")}
  </section>'''

# ============================ 6 · OPCIONAIS ============================
opcionais = f'''
  <section class="slide">
{head_simple("Opcionais")}
    <span class="eyebrow orange">◆ Pra deixar ainda mais completo</span>
    <h2>Dois toques que fazem <em>diferença</em></h2>
    <div class="opts">
      <div class="opt">
        <div class="oph">{img("mimos-registro-itau.jpg", "Registro fotográfico espontâneo do time", "center 40%")}</div>
        <div class="ob">
          <span class="ot">Fotografia</span>
          <h4>Registro da experiência</h4>
          <p>Um fotógrafo cobre o encontro — o processo, os detalhes e os melhores momentos do time. Álbum digital pronto pra compartilhar.</p>
          <div class="op">R$ 450<small>valor total</small></div>
        </div>
      </div>
      <div class="opt">
        <div class="oph">{img("brinde-corp.jpg", "Mimo personalizado para o time", "center 50%")}</div>
        <div class="ob">
          <span class="ot">Mimo para o time</span>
          <h4>Um detalhe especial</h4>
          <p>Um mimo personalizado pra cada participante levar — um detalhe que complementa o encontro e lembra o dia depois.</p>
          <div class="op">R$ 139<small>por pessoa</small></div>
        </div>
      </div>
    </div>
    <p class="fineprint">Opcionais somados à experiência escolhida. Fotografia: R$ 450 (valor total). Mimo personalizado: R$ 139 por pessoa. O modelo do mimo é combinado antes do encontro.</p>
    {foot("Opcionais")}
  </section>'''

# ============================ 7 · PRÓXIMOS PASSOS ============================
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ É só escolher</span>
    <h2>Bora reunir <em>o time?</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pro encontro ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="num">01</div><h3>Escolham a experiência</h3><p>Sabonete, vela ou crochê — a que mais combina com o time.</p></div>
      <div class="infocard"><div class="num">02</div><h3>Confirmamos a data</h3><p>Reservamos a agenda e o espaço para o dia 22/10, no Brooklin ou no espaço de vocês.</p></div>
      <div class="infocard"><div class="num">03</div><h3>A gente leva tudo</h3><p>Profissional, materiais e estrutura — o time só chega e cria.</p></div>
    </div>
    <div class="quote" style="margin-top:22px">
      Juliana, me confirma a <strong>experiência</strong> que faz mais sentido que a gente reserva tudo e organiza cada detalhe pro time. ✦<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n'
        + cover + conceito + sabonete + vela + croche + opcionais + proximos + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/corporativo-juliana.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
