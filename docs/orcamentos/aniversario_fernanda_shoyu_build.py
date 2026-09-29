# Proposta Elarah · Aniversario Fernanda · Ceramica + Pintura no SHOYU CRAFTS · 6 amigas · Pinheiros
# Racional/linguagem/passo a passo do deck aprovado da SEGATTA, adaptado p/ aniversario entre amigas.
# Sexta a tarde ou a noite (horario confirmado na reserva). Valor final: R$ 349/pp · R$ 2.094 (6 amigas).
# DINAMICA CORRETA: dois momentos criativos (1 modelagem da propria peca; 2 pintura de UMA peca de ceramica).
#   As pecas FICAM no atelie p/ finalizacao e queima; RETIRADA POSTERIOR no Shoyu quando prontas.
#   NUNCA dizer que saem levando a peca no mesmo dia; sem comida/foto/welcome drink/mimo/brinde/opcionais.
# ZERO Agora Intu. Fotos reais do Shoyu na capa (shoyu-grupo) e no slide do espaco (shoyu-atelie). Paleta terracota/vinho.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

# paleta terracota + vinho (feminina/elegante)
reps = {
    "--orange:#B08D4C;": "--orange:#B87351;",
    "--orange-dark:#8A6D34;": "--orange-dark:#8E5236;",
    "--navy:#12362B;": "--navy:#3C1F28;",
    "--navy-soft:#3A5A4E;": "--navy-soft:#6B4A52;",
    "--blue-accent:#B08D4C;": "--blue-accent:#B87351;",
    "#EFF3EE": "#FBF1EE", "#DCE8E1": "#F0DED6", "#CBB06E": "#CFA07E",
    "rgba(176,141,76,.24)": "rgba(184,115,81,.24)",
    "rgba(176,141,76,.26)": "rgba(184,115,81,.28)",
    "rgba(176,141,76,.10)": "rgba(184,115,81,.10)",
    "rgba(18,54,43,.16)": "rgba(60,31,40,.16)",
    "rgba(10,28,22,.86)": "rgba(32,16,22,.86)",
    "rgba(10,28,22,.85)": "rgba(32,16,22,.85)",
    "rgba(10,28,22,.82)": "rgba(32,16,22,.82)",
}
for a, b in reps.items():
    head = head.replace(a, b)

xcss = '''
  .checks{display:grid;grid-template-columns:1fr 1fr;gap:9px 24px;margin-top:14px}
  .checks li{list-style:none;position:relative;padding-left:26px;font-size:12px;color:var(--ink);line-height:1.35}
  .checks li b{color:var(--navy);font-weight:700}
  .checks li .ck{position:absolute;left:0;top:1px;width:17px;height:17px;border-radius:999px;background:var(--orange);color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center}
  /* dois momentos (cards) */
  .moments{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:20px}
  .mcard{background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 36px -26px rgba(0,0,0,.3)}
  .mcard .mph{height:186px;overflow:hidden;background:#eee}
  .mcard .mph img{width:100%;height:100%;object-fit:cover;display:block}
  .mcard .mb{padding:16px 22px 20px}
  .mcard .mstep{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .mcard .mn{font-family:'DM Serif Display',serif;font-weight:400;font-size:20px;color:var(--navy);line-height:1.05;margin:3px 0 0}
  .mcard p{font-size:12px;color:var(--muted);line-height:1.5;margin:8px 0 0}
  /* passo a passo · 5 etapas verticais */
  .flow{margin-top:20px;display:flex;flex-direction:column;gap:0;border:1px solid var(--line);border-radius:18px;overflow:hidden;background:var(--card);box-shadow:0 16px 40px -30px rgba(0,0,0,.3)}
  .fstep{display:flex;gap:18px;align-items:flex-start;padding:15px 22px}
  .fstep + .fstep{border-top:1px solid var(--line)}
  .fstep .fn{flex:0 0 auto;width:34px;height:34px;border-radius:999px;background:var(--orange);color:#fff;font-family:'DM Serif Display',serif;font-size:16px;display:flex;align-items:center;justify-content:center;line-height:1}
  .fstep .fb{flex:1}
  .fstep .ft{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--navy);line-height:1.1}
  .fstep .fd{font-size:11.5px;color:var(--muted);line-height:1.45;margin-top:3px}
  .fstep.fhl{background:rgba(184,115,81,.08)}
  /* vibe · 3 cards conceito com foto */
  .vcards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:20px}
  .vc{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 14px 32px -24px rgba(0,0,0,.3)}
  .vc .vph{height:250px;overflow:hidden;background:#eee}
  .vc .vph img{width:100%;height:100%;object-fit:cover;display:block}
  .vc .vb{padding:15px 18px 18px}
  .vc .vn{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--navy);line-height:1.08}
  .vc p{font-size:11.5px;color:var(--muted);line-height:1.5;margin-top:7px}
  /* espaco · foto grande + texto */
  .spacewrap{display:grid;grid-template-columns:1.05fr .95fr;gap:34px;margin-top:20px;align-items:stretch}
  .spaceph{border-radius:18px;overflow:hidden;border:1px solid var(--line);box-shadow:0 18px 42px -26px rgba(0,0,0,.4);min-height:360px}
  .spaceph img{width:100%;height:100%;object-fit:cover;display:block}
  .spacetxt{display:flex;flex-direction:column;justify-content:center}
  .spacetxt p{font-size:12.5px;color:var(--muted);line-height:1.6;margin:0 0 12px}
  .spacetxt p b{color:var(--navy)}
  /* shoyu · 2 fotos reais protagonistas */
  .shoyu2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:22px}
  .shoyu2 figure{margin:0;border-radius:18px;overflow:hidden;height:400px;border:1px solid var(--line);box-shadow:0 18px 42px -26px rgba(0,0,0,.4)}
  .shoyu2 figure img{width:100%;height:100%;object-fit:cover;display:block}
  /* investimento · valor da experiencia */
  .phero{display:grid;grid-template-columns:.95fr 1.05fr;gap:38px;margin-top:20px;align-items:stretch}
  .pheroph{border-radius:18px;overflow:hidden;border:1px solid var(--line);box-shadow:0 18px 42px -26px rgba(0,0,0,.42);min-height:340px}
  .pheroph img{width:100%;height:100%;object-fit:cover;display:block}
  .pval{display:flex;flex-direction:column;justify-content:center}
  .pval .pct{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange-dark);font-weight:700}
  .pval .pbig{font-family:'DM Serif Display',serif;font-size:74px;color:var(--navy);line-height:.92;margin:8px 0 2px}
  .pval .pper{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--navy-soft);font-weight:700}
  .pval .pgrp{font-family:'DM Serif Display',serif;font-size:24px;color:var(--orange-dark);margin:14px 0 0;line-height:1.1}
  .pval .pgrp small{display:block;font-family:-apple-system,sans-serif;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-top:4px}
  .pval .pinc{list-style:none;margin:16px 0 0;padding:0;display:flex;flex-direction:column;gap:6px}
  .pval .pinc li{position:relative;padding-left:18px;font-size:11.5px;color:var(--ink);line-height:1.35}
  .pval .pinc li::before{content:"\\2713";position:absolute;left:0;top:1px;color:var(--orange);font-weight:800;font-size:10px}
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


# ============================ 1 · CAPA ============================
cover = f'''
  <section class="slide">
{head_block("Aniversário · entre amigas", "Fernanda", "", "Shoyu Crafts · Pinheiros")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Um aniversário para criar juntas</span>
        <h1>Um aniversário para <em>criar juntas</em></h1>
        <p class="lead">Uma experiência de <strong>cerâmica e pintura</strong> só de vocês, no <strong>Shoyu Crafts</strong>, em Pinheiros. Um encontro para colocar a mão na massa, experimentar, conversar e celebrar juntas.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>6</b> amigas</span>
          <span class="chip">Cerâmica + Pintura</span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip">Shoyu Crafts · Pinheiros</span>
          <span class="chip">Sexta · tarde ou noite</span>
        </div>
      </div>
      <div class="cover-photo">{img("shoyu-grupo.jpg", "Grupo sorrindo com suas peças de cerâmica no Shoyu Crafts", "center 35%")}</div>
    </div>
    {foot("Aniversário · Fernanda")}
  </section>'''

# ============================ 2 · A EXPERIÊNCIA ============================
experiencia = f'''
  <section class="slide">
{head_simple("A experiência")}
    <span class="eyebrow orange">◆ Cerâmica + Pintura</span>
    <h2>Criar com as <em>próprias mãos</em></h2>
    <p class="lead">Uma experiência leve de <b>cerâmica + pintura</b> para celebrar juntas, experimentar algo novo e criar com as próprias mãos.</p>
    <div class="moments">
      <div class="mcard">
        <div class="mph">{img("torno.jpg", "Mãos trabalhando a argila", "center 50%")}</div>
        <div class="mb">
          <span class="mstep">01</span>
          <div class="mn">Modelagem</div>
          <p>Cada uma cria sua própria peça em argila.</p>
        </div>
      </div>
      <div class="mcard">
        <div class="mph">{img("ceramica1.jpg", "Peça de cerâmica sendo pintada à mão", "center 50%")}</div>
        <div class="mb">
          <span class="mstep">02</span>
          <div class="mn">Pintura</div>
          <p>Cada participante personaliza uma peça em cerâmica.</p>
        </div>
      </div>
    </div>
    <div class="bnote" style="margin-top:16px">◆ Depois, as peças ficam no ateliê para <b>finalização e queima</b>. A retirada é posterior.</div>
    {foot("A experiência")}
  </section>'''

# ============================ 3 · COMO ACONTECE ============================
como = f'''
  <section class="slide">
{head_simple("Como acontece")}
    <span class="eyebrow orange">◆ Passo a passo</span>
    <h2>Do encontro à <em>peça pronta</em></h2>
    <div class="flow" style="margin-top:22px">
      <div class="fstep"><div class="fn">1</div><div class="fb"><div class="ft">Modelar</div><div class="fd">Criação da própria peça em argila.</div></div></div>
      <div class="fstep"><div class="fn">2</div><div class="fb"><div class="ft">Pintar</div><div class="fd">Personalização de uma peça em cerâmica.</div></div></div>
      <div class="fstep fhl"><div class="fn">3</div><div class="fb"><div class="ft">Finalizar</div><div class="fd">As peças ficam no ateliê para queima e são retiradas depois.</div></div></div>
    </div>
    {foot("Como acontece")}
  </section>'''

# ============================ 4 · A VIBE ============================
vibe = f'''
  <section class="slide">
{head_simple("A vibe")}
    <span class="eyebrow orange">◆ Entre amigas</span>
    <h2>Uma pausa para <em>criar juntas</em></h2>
    <p class="lead">Argila, pincéis e conversa boa. Um aniversário leve, criativo e feito no ritmo de vocês.</p>
    <div class="vcards">
      <div class="vc"><div class="vph">{img("casalmodelagemceramica.jpg", "Mãos trabalhando a argila", "center 50%")}</div><div class="vb"><div class="vn">Mão na massa</div></div></div>
      <div class="vc"><div class="vph">{img("ceramicacool.jpg", "Peças de cerâmica com desenhos autorais", "center 50%")}</div><div class="vb"><div class="vn">Cada uma do seu jeito</div></div></div>
      <div class="vc"><div class="vph">{img("ceramica2.jpg", "Peças de cerâmica finalizadas", "center 50%")}</div><div class="vb"><div class="vn">Uma memória feita à mão</div></div></div>
    </div>
    {foot("A vibe")}
  </section>'''

# ============================ 5 · O SHOYU CRAFTS ============================
espaco = f'''
  <section class="slide">
{head_simple("O Shoyu Crafts")}
    <span class="eyebrow orange">◆ Shoyu Crafts · Pinheiros</span>
    <h2>Um ateliê para colocar a <em>mão na argila</em></h2>
    <p class="lead">Um ateliê de cerâmica de alta temperatura em Pinheiros, feito para experimentar, aprender e criar sem precisar de experiência prévia.</p>
    <div class="shoyu2">
      <figure>{img("shoyu-atelie.jpg", "Interior do ateliê Shoyu Crafts em Pinheiros", "center 55%")}</figure>
      <figure>{img("shoyu-grupo.jpg", "Grupo com suas peças de cerâmica no Shoyu Crafts", "center 35%")}</figure>
    </div>
    {foot("O Shoyu Crafts · Pinheiros")}
  </section>'''

# ============================ 6 · INVESTIMENTO ============================
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Cerâmica <em>+ Pintura</em></h2>
    <div class="phero">
      <div class="pheroph">{img("ceramicamodelagem.jpg", "Mãos modelando uma peça de cerâmica", "center 50%")}</div>
      <div class="pval">
        <span class="pct">Shoyu Crafts · Pinheiros</span>
        <div class="pbig">R$ 349</div>
        <span class="pper">por pessoa</span>
        <div class="pgrp">R$ 2.094<small>grupo de 6 amigas</small></div>
        <ul class="pinc">
          <li>Experiência de modelagem em cerâmica</li>
          <li>Peça para pintura</li>
          <li>Condução da experiência</li>
          <li>Materiais necessários</li>
          <li>Processos de finalização e queima</li>
          <li>Retirada posterior das peças</li>
        </ul>
      </div>
    </div>
    <div class="bnote" style="margin-top:18px">◆ Valores para o grupo de 6 amigas, no Shoyu Crafts · Pinheiros. Sextas-feiras, à tarde ou à noite. 🤍</div>
    {foot("Investimento")}
  </section>'''

# ============================ 7 · PRÓXIMOS PASSOS ============================
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Simples e sob medida</span>
    <h2>É só <em>reunir as amigas</em></h2>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="num">01</div><h3>Escolham o horário</h3><p>Sexta à tarde ou à noite.</p></div>
      <div class="infocard"><div class="num">02</div><h3>Confirmamos a experiência</h3><p>Shoyu, profissional e materiais.</p></div>
      <div class="infocard"><div class="num">03</div><h3>Depois vocês retiram as peças</h3><p>Após finalização e queima.</p></div>
    </div>
    <div class="quote" style="margin-top:22px">
      Fernanda, me conta qual <strong>período</strong> funciona melhor para vocês que confirmamos a disponibilidade. 🤍<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n'
        + cover + experiencia + como + vibe + espaco + investimento + proximos + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/aniversario-fernanda-shoyu.html"
open(out, "w", encoding="utf-8").write(html)
# guardas
assert "agora" not in html.lower(), "ERRO: sobrou mencao/foto do Agora"
low = html.lower()
for termo in ["welcome drink", "fotógraf", "fotograf", "brinde", "mimo", "playlist", "luz baixa", "comida", "comidinha", "leva pra casa a peça", "leva a própria peça"]:
    assert termo not in low, f"ERRO: termo proibido presente -> {termo}"
print("wrote", out, "| slides:", html.count('<section class="slide">'), "| sem Agora/comida/foto/brinde/mimo OK")
