# Proposta Elarah · Team building Juliana · 8 pessoas · 22/10 · Brooklin · budget ate R$2.000 (nao citar)
# EVOLUCAO da proposta inicial (mesma identidade do deck de tufting/Lado B): mesma narrativa/tom/estetica (BFA verde/terracota).
# Somente Ateliê Meu Outro Lado. Curadoria: Vela e Sabonete (versoes base R$269/2.152 e premium/vinho R$309/2.472 p/8).
# Vela com diferencial sazonal de Halloween (2 modalidades). Slide final de investimento (4 possibilidades). Sem opcionais. Fotos reais.
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
  /* faixa sazonal (Halloween) */
  .season{display:flex;gap:16px;align-items:center;margin-top:16px;background:rgba(169,102,63,.10);border:1px solid rgba(169,102,63,.30);border-radius:16px;padding:14px 18px}
  .season .sph{flex:0 0 120px;height:92px;border-radius:12px;overflow:hidden;border:1px solid var(--line)}
  .season .sph img{width:100%;height:100%;object-fit:cover;display:block}
  .season .sb{flex:1}
  .season .stag{font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--orange-dark);font-weight:800}
  .season .sb p{font-size:11.5px;color:var(--navy-soft);line-height:1.5;margin:5px 0 0}
  .season .sb p b{color:var(--navy)}
  /* halloween · duas modalidades */
  .hwhead{display:flex;align-items:baseline;gap:12px;margin-top:16px;flex-wrap:wrap}
  .hwhead .stag{font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--orange-dark);font-weight:800}
  .hwhead p{font-size:10.5px;color:var(--navy-soft);margin:0;line-height:1.4}
  .hw2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:10px}
  .hwc{display:flex;gap:12px;align-items:center;background:rgba(169,102,63,.10);border:1px solid rgba(169,102,63,.30);border-radius:14px;padding:10px 12px}
  .hwc .hwph{flex:0 0 84px;height:84px;border-radius:11px;overflow:hidden;border:1px solid var(--line)}
  .hwc .hwph img{width:100%;height:100%;object-fit:cover;display:block}
  .hwc .hwb{flex:1}
  .hwc .hwt{font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:var(--orange-dark);font-weight:800}
  .hwc h4{font-family:'DM Serif Display',serif;font-weight:400;font-size:14.5px;color:var(--navy);line-height:1.05;margin:2px 0 0}
  .hwc p{font-size:9.5px;color:var(--navy-soft);line-height:1.35;margin:4px 0 0}
  /* investimento · matriz 4 possibilidades */
  .inv2{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}
  .invc{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:0 14px 32px -26px rgba(0,0,0,.32)}
  .invc .invhd{background:var(--navy);color:#fff;padding:13px 20px}
  .invc .invhd .ik{font-size:8.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:rgba(255,255,255,.75)}
  .invc .invhd h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:21px;line-height:1.05;margin:2px 0 0;color:#fff}
  .invc .invrow{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 20px}
  .invc .invrow + .invrow{border-top:1px solid var(--line)}
  .invc .invrow .il{font-size:11px;color:var(--navy-soft);font-weight:600;line-height:1.25}
  .invc .invrow .il small{display:block;font-size:9px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-top:2px}
  .invc .invrow .ir{text-align:right;white-space:nowrap}
  .invc .invrow .ir .pp{font-family:'DM Serif Display',serif;font-size:22px;color:var(--orange-dark);line-height:1}
  .invc .invrow .ir .pp small{font-family:-apple-system,sans-serif;font-size:8px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-left:3px}
  .invc .invrow .ir .tt{display:block;font-size:10px;color:var(--muted);margin-top:3px}
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
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip">Ateliê Meu Outro Lado · Brooklin</span>
        </div>
      </div>
      <div class="cover-photo">{img("porque-mesa-workshop.jpg", "Time reunido criando velas na mesa do ateliê, mãos no processo", "center 42%")}</div>
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
    <span class="eyebrow orange">◆ Experiências de Sabonete</span>
    <h2>Aromas, cores <em>e botânicos</em></h2>
    <p class="lead">Um processo sensorial e relaxante: cada um escolhe aromas, cores e botânicos e cria os próprios sabonetes, do começo ao fim — tudo no Ateliê Meu Outro Lado.</p>
    <div class="egr">
      {ecard("Sabonete Artesanal", "Todo material incluso", "Cada um cria os próprios sabonetes, escolhendo aromas, cores e botânicos.", "os próprios sabonetes", "269", "2.152", "saboneteroxo.jpg", "Sabonetes artesanais com lavanda e botânicos", "center 50%")}
      {ecard("Sabonete Artesanal + vinho", "Todo material incluso · com vinho", "A mesma experiência, com uma seleção de vinhos para acompanhar e brindar.", "os próprios sabonetes", "309", "2.472", "vinhotintos.jpg", "Vinhos e taças para brindar durante a experiência", "center 50%")}
    </div>
    {foot("Experiências · Sabonete")}
  </section>'''

# ============================ 4 · VELA ============================
vela = f'''
  <section class="slide">
{head_simple("Experiências · Vela")}
    <span class="eyebrow orange">◆ Experiências de Vela</span>
    <h2>Cera, aromas <em>e aconchego</em></h2>
    <p class="lead">Cada um monta a própria vela — escolhendo aromas e detalhes — num ritual leve e cheio de charme, no Ateliê Meu Outro Lado.</p>
    <div class="egr">
      {ecard("Vela Personalizada", "Todo material incluso", "Cada um escolhe aromas e detalhes e cria a própria vela, do começo ao fim.", "a própria vela", "269", "2.152", "vela-aromatica-real.jpg", "Preparo de vela aromática com flores secas", "center 50%")}
      {ecard("Vela Personalizada + vinho", "Todo material incluso · com vinho", "A mesma experiência, com uma seleção de vinhos para brindar enquanto cria.", "a própria vela", "309", "2.472", "tacalimao2.jpg", "Brinde com taças de vinho durante a experiência", "center 22%")}
    </div>
    <div class="hwhead">
      <span class="stag">🎃 Edição especial de Halloween</span>
      <p>Duas modalidades sazonais — é só escolher a que combina com o time.</p>
    </div>
    <div class="hw2">
      <div class="hwc">
        <div class="hwph">{img("vela-halloween-laranja.webp", "Vela laranja temática, decorada com elementos de Halloween", "center 50%")}</div>
        <div class="hwb"><span class="hwt">Opção 1</span><h4>Workshop Vela Halloween</h4><p>Cada um cria a própria vela aromática com aromas e detalhes decorativos temáticos de Halloween.</p></div>
      </div>
      <div class="hwc">
        <div class="hwph">{img("abobora-pintada.webp", "Abóbora de cerâmica pintada à mão, com flores", "center 50%")}</div>
        <div class="hwb"><span class="hwt">Opção 2</span><h4>Pinte sua Abóbora &amp; Faça sua Vela Aromática</h4><p>Pinte uma abóbora em resina e crie a própria vela aromática — duas lembranças pra levar.</p></div>
      </div>
    </div>
    {foot("Experiências · Vela")}
  </section>'''

# ============================ 5 · O ATELIÊ MEU OUTRO LADO ============================
atelie = f'''
  <section class="slide">
{head_simple("O espaço")}
    <span class="eyebrow orange">◆ Ateliê Meu Outro Lado · Brooklin</span>
    <h2>Tudo acontece <em>no próprio ateliê</em></h2>
    <p class="lead">A experiência é realizada no Ateliê Meu Outro Lado — um espaço acolhedor, criativo e cheio de personalidade, sem necessidade de contratar outro local. O time só chega e aproveita.</p>
    <div class="vibe">
      <figure>{img("meu-outro-lado.jpg", "Ateliê Meu Outro Lado, acolhedor e criativo", "center 50%")}<figcaption>O ateliê</figcaption></figure>
      <figure>{img("teoriavela.jpg", "Mãos preparando uma vela com botânicos", "center 50%")}<figcaption>Mãos na obra</figcaption></figure>
      <figure>{img("sabonete.jpg", "Materiais, aromas e botânicos", "center 50%")}<figcaption>Materiais &amp; aromas</figcaption></figure>
      <figure>{img("grupo-oficina-atelie.webp", "Grupo participando da oficina no ateliê, cada um criando a própria peça", "center 40%")}<figcaption>Mãos à obra em grupo</figcaption></figure>
      <figure>{img("velas.jpg", "Velas finalizadas", "center 50%")}<figcaption>O resultado</figcaption></figure>
      <figure>{img("curadoria-vinhos.jpg", "Taças de vinho para brindar", "center 50%")}<figcaption>Pra brindar</figcaption></figure>
    </div>
    <div class="bnote" style="margin-top:16px">◆ <b>Sem locação adicional:</b> o espaço já faz parte da experiência — acolhedor, leve e ideal para um encontro de team building.</div>
    {foot("O espaço · Meu Outro Lado")}
  </section>'''

# ============================ 6 · INVESTIMENTO ============================
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Quatro possibilidades</span>
    <h2>Escolham o que combina <em>com o time</em></h2>
    <p class="lead">Duas experiências — Vela ou Sabonete — cada uma nas versões sem vinho e com vinho. Valores por pessoa e para o grupo fechado de 8 pessoas.</p>
    <div class="inv2">
      <div class="invc">
        <div class="invhd"><span class="ik">Experiência</span><h3>Vela Personalizada</h3></div>
        <div class="invrow"><div class="il">Sem vinho<small>Todo material incluso</small></div><div class="ir"><span class="pp">R$ 269<small>por pessoa</small></span><span class="tt">R$ 2.152 · 8 pessoas</span></div></div>
        <div class="invrow"><div class="il">Com vinho<small>Seleção de vinhos para brindar</small></div><div class="ir"><span class="pp">R$ 309<small>por pessoa</small></span><span class="tt">R$ 2.472 · 8 pessoas</span></div></div>
      </div>
      <div class="invc">
        <div class="invhd"><span class="ik">Experiência</span><h3>Sabonete Artesanal</h3></div>
        <div class="invrow"><div class="il">Sem vinho<small>Todo material incluso</small></div><div class="ir"><span class="pp">R$ 269<small>por pessoa</small></span><span class="tt">R$ 2.152 · 8 pessoas</span></div></div>
        <div class="invrow"><div class="il">Com vinho<small>Seleção de vinhos para brindar</small></div><div class="ir"><span class="pp">R$ 309<small>por pessoa</small></span><span class="tt">R$ 2.472 · 8 pessoas</span></div></div>
      </div>
    </div>
    <div class="bnote" style="margin-top:16px">◆ <b>Tudo incluso em todas as versões:</b> profissional conduzindo · todos os materiais · montagem e estrutura · produção Elarah, no Ateliê Meu Outro Lado · Brooklin.</div>
    {foot("Investimento")}
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
      <div class="infocard"><div class="num">01</div><h3>Escolham a experiência</h3><p>Vela ou sabonete — base ou com vinho, a que mais combina com o time.</p></div>
      <div class="infocard"><div class="num">02</div><h3>Confirmamos a data</h3><p>Reservamos a agenda do Ateliê Meu Outro Lado para o dia 22/10.</p></div>
      <div class="infocard"><div class="num">03</div><h3>A gente cuida de tudo</h3><p>Profissional, materiais e estrutura — o time só chega e cria.</p></div>
    </div>
    <div class="quote" style="margin-top:22px">
      Juliana, me confirma a <strong>experiência</strong> que faz mais sentido que a gente reserva tudo e organiza cada detalhe pro time. ✦<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n'
        + cover + vela + sabonete + atelie + investimento + proximos + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/corporativo-juliana.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
