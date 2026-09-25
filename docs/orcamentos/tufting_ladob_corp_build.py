# Proposta Elarah · Team building · Tufting no Lado B · 8 pessoas · 22/10 · 3h · peca ~20x20cm
# R$450/pessoa · R$3.600 total. Padrao editorial Elarah (base Ginger/BFA). Muita vibe/ambiente/processo/pecas.
# Opcionais: Fotografia R$450 · Mimo R$139. Fotos reais do Lado B. NAO mencionar budget de R$2.000.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

# paleta editorial BFA: off-white · verde profundo · terracota · argila
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
  .subh{font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin:20px 0 0}
  .egrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:16px}
  .egrid figure{margin:0;border-radius:14px;overflow:hidden;position:relative;height:205px;border:1px solid rgba(38,51,42,.10);box-shadow:0 12px 30px -20px rgba(0,0,0,.4)}
  .egrid img{width:100%;height:100%;object-fit:cover;display:block}
  .egrid figcaption{position:absolute;left:0;right:0;bottom:0;padding:24px 12px 10px;color:#fff;font-size:11.5px;font-weight:600;background:linear-gradient(to top,rgba(20,28,22,.86),transparent)}
  .opts{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:14px;align-items:stretch}
  .opt{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 12px 30px -22px rgba(0,0,0,.28)}
  .opt .oph{aspect-ratio:16/10;overflow:hidden;background:#eee;border-bottom:1px solid var(--line)}
  .opt .oph img{width:100%;height:100%;object-fit:cover;display:block}
  .opt .ob{padding:16px 22px 18px;flex:1;display:flex;flex-direction:column}
  .opt .ot{font-size:9px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .opt h4{font-family:'DM Serif Display',serif;font-weight:400;font-size:21px;color:var(--navy);line-height:1.05;margin-top:3px}
  .opt p{font-size:12px;color:var(--muted);line-height:1.5;margin-top:8px;flex:1}
  .opt .op{margin-top:12px;font-family:'DM Serif Display',serif;font-size:26px;color:var(--orange-dark);line-height:1}
  .opt .op small{font-family:-apple-system,sans-serif;font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-weight:700;margin-left:5px}
  /* investimento · valor da experiencia */
  .phero{display:grid;grid-template-columns:1fr 1fr;gap:38px;margin-top:20px;align-items:stretch}
  .pheroph{border-radius:18px;overflow:hidden;border:1px solid var(--line);box-shadow:0 18px 42px -26px rgba(0,0,0,.42);height:420px}
  .pheroph img{width:100%;height:100%;object-fit:cover;display:block}
  .pval{display:flex;flex-direction:column;justify-content:center}
  .pval .pct{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange-dark);font-weight:700}
  .pval .pname{font-family:'DM Serif Display',serif;font-size:34px;color:var(--navy);line-height:1.02;margin:6px 0 10px}
  .pval .pspec{font-size:12.5px;color:var(--navy-soft);line-height:1.6;padding-bottom:14px;border-bottom:1px solid var(--line)}
  .pval .pbig{font-family:'DM Serif Display',serif;font-size:64px;color:var(--navy);line-height:.92;margin:14px 0 2px}
  .pval .pper{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--navy-soft);font-weight:700}
  .pval .ptot{font-family:'DM Serif Display',serif;font-size:24px;color:var(--orange-dark);margin-top:14px}
  .pval .ptot small{font-family:-apple-system,sans-serif;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-left:6px}
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


PROOF = "Já realizado para times como <b>Compass</b>, <b>Natura</b> e <b>Hidratei</b>"

# ============================ 1 · CAPA ============================
cover = f'''
  <section class="slide">
{head_block("Team building · Tufting", "Tufting", "no Lado B", "8 pessoas · 22/10")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Team building · turma privada</span>
        <h1>O time junto, <em>de mão na massa</em></h1>
        <p class="lead">Uma experiência de <strong>tufting</strong> só pro time, no <strong>Lado B</strong>. Cada um cria a própria peça em fios e cores, do zero — três horas de processo criativo, num ateliê cheio de vibe, que rende conversa e uma lembrança que fica.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>8</b> pessoas</span>
          <span class="chip">Tufting · <b>3h</b></span>
          <span class="chip"><b>22/10</b></span>
        </div>
      </div>
      <div class="cover-photo">{img("lado-b-grupo-pecas.webp", "Time reunido com as próprias peças de tufting no Lado B", "center 30%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Tufting no Lado B")}
  </section>'''

# ============================ 2 · A EXPERIÊNCIA ============================
experiencia = f'''
  <section class="slide">
{head_simple("A experiência")}
    <span class="eyebrow orange">◆ Tufting · peça autoral</span>
    <h2>Cada um cria a <em>própria peça</em></h2>
    <p class="lead">Com a pistola de tufting, o time aprende a técnica do zero e desenvolve a própria peça em fios, cores e composição — guiado o tempo todo. É criativo, absorvente e cheio de troca.</p>
    <div class="bfeat">
      <div class="bphoto">{img("lado-b-vermelho.webp", "Participante criando a própria peça no ateliê Lado B", "center 42%")}</div>
      <div class="bbody">
        <span class="btag">Como acontece · 3 horas</span>
        <h3>Do fio à peça pronta</h3>
        <ul class="feat">
          <li><span class="st">1</span><b>Introdução</b> — a pistola de tufting e a técnica, do zero.</li>
          <li><span class="st">2</span><b>Desenho &amp; cores</b> — cada um escolhe o próprio desenho e a paleta.</li>
          <li><span class="st">3</span><b>Mão na obra</b> — a criação acontece com acompanhamento o tempo todo.</li>
          <li><span class="st">4</span><b>Finalização</b> — uma peça autoral de ~20×20 cm pra levar.</li>
        </ul>
      </div>
    </div>
    <p class="subh">Tudo incluso, sem surpresa</p>
    <ul class="checks">
      <li><span class="ck">✓</span><b>Ateliê Lado B</b> · espaço da experiência</li>
      <li><span class="ck">✓</span><b>Profissional</b> conduzindo o tempo todo</li>
      <li><span class="ck">✓</span><b>Pistola de tufting</b> e todos os materiais</li>
      <li><span class="ck">✓</span><b>Fios e cores</b> à disposição</li>
      <li><span class="ck">✓</span><b>Peça ~20×20 cm</b> pra cada um levar</li>
      <li><span class="ck">✓</span><b>Montagem e estrutura</b> da Elarah</li>
    </ul>
    {foot("A experiência")}
  </section>'''

# ============================ 3 · A ATMOSFERA ============================
atmosfera = f'''
  <section class="slide">
{head_simple("A atmosfera")}
    <span class="eyebrow orange">◆ A vibe do Lado B</span>
    <h2>Um ateliê que <em>inspira</em></h2>
    <p class="lead">Parede de fios do chão ao teto, cores por todo lado e a pistola de tufting em ação — um espaço criativo de verdade, feito pra sair da rotina e criar junto.</p>
    <div class="egrid">
      <figure>{img("lado-b-tuftgun.webp", "Pistola de tufting em ação sobre o bastidor", "center 50%")}<figcaption>A pistola de tufting</figcaption></figure>
      <figure>{img("tufting13.jpg", "Parede de fios e cones de lã coloridos", "center 50%")}<figcaption>Fios, cores e texturas</figcaption></figure>
      <figure>{img("tufting1.jpg", "Participantes criando peças de tufting", "center 45%")}<figcaption>Mãos na obra</figcaption></figure>
      <figure>{img("tufting17.jpg", "Participante diante da parede de peças", "center 45%")}<figcaption>No ateliê</figcaption></figure>
      <figure>{img("tufting-cereja.jpg", "Peça de tufting finalizada", "center 50%")}<figcaption>As peças que ficam</figcaption></figure>
      <figure>{img("tufting6.jpg", "Grupo criando junto no Lado B", "center 40%")}<figcaption>O time, junto</figcaption></figure>
    </div>
    <div class="bnote" style="margin-top:16px">◆ <b>Tudo incluso:</b> ateliê Lado B · profissional conduzindo · pistola de tufting e materiais · fios e cores · peça ~20×20 cm pra levar · montagem e estrutura da Elarah.</div>
    {foot("A atmosfera do Lado B")}
  </section>'''

# ============================ 4 · OPCIONAIS ============================
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
          <p>Um fotógrafo cobre o encontro — o processo, os detalhes, as peças e os melhores momentos do time. Álbum digital pronto pra compartilhar.</p>
          <div class="op">R$ 450<small>valor total</small></div>
        </div>
      </div>
      <div class="opt">
        <div class="oph">{img("brinde-corp.jpg", "Mimo personalizado para o time", "center 50%")}</div>
        <div class="ob">
          <span class="ot">Mimo para o time</span>
          <h4>Um detalhe especial</h4>
          <p>Um mimo personalizado pra cada participante levar — um detalhe que complementa a experiência e lembra o encontro depois.</p>
          <div class="op">R$ 139<small>por pessoa</small></div>
        </div>
      </div>
    </div>
    <p class="fineprint">Opcionais somados à experiência. Fotografia: R$ 450 (valor total). Mimo personalizado: R$ 139 por pessoa. O modelo do mimo é combinado antes do encontro.</p>
    {foot("Opcionais")}
  </section>'''

# ============================ 5 · INVESTIMENTO ============================
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ A experiência</span>
    <h2>Tufting <em>Experience</em></h2>
    <div class="phero">
      <div class="pheroph">{img("lado-b-grupo-pecas.webp", "Time com as próprias peças de tufting", "center 35%")}</div>
      <div class="pval">
        <span class="pct">Tufting no Lado B</span>
        <div class="pname">Tufting Experience</div>
        <div class="pspec">3 horas de experiência<br>8 participantes<br>Peça individual de ~20×20 cm</div>
        <div class="pbig">R$ 450</div>
        <span class="pper">por pessoa</span>
        <div class="ptot">R$ 3.600<small>total · 8 pessoas</small></div>
      </div>
    </div>
    <div class="quote" style="margin-top:18px">
      É só confirmar a data que a gente reserva o Lado B e organiza cada detalhe pro time. ✦<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Investimento")}
  </section>'''

deck = '<div class="deck">\n' + cover + experiencia + atmosfera + opcionais + investimento + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/tufting-ladob-corporativo.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
