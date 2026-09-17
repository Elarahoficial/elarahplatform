# Orcamento aniversario · Arranjos Florais · Sow Cafe · 28/09 · Zona Norte
# R$ 239 + consumo minimo R$ 50/pessoa (no cafe). 3 planos: Essencial / Com Foto (+450 fixo) / Completo (+99/pessoa lembrancinha).
# Paleta rose + verde botanico.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

reps = {
    "--orange:#B08D4C;": "--orange:#C0788A;",
    "--orange-dark:#8A6D34;": "--orange-dark:#9A5768;",
    "--navy:#12362B;": "--navy:#2F3A2C;",
    "--navy-soft:#3A5A4E;": "--navy-soft:#59654E;",
    "--blue-accent:#B08D4C;": "--blue-accent:#C0788A;",
    "#EFF3EE": "#FBF0F2", "#DCE8E1": "#F1DCE2", "#CBB06E": "#D79FAD",
    "rgba(176,141,76,.24)": "rgba(192,120,138,.24)",
    "rgba(176,141,76,.26)": "rgba(192,120,138,.28)",
    "rgba(176,141,76,.10)": "rgba(192,120,138,.10)",
    "rgba(18,54,43,.16)": "rgba(47,58,44,.16)",
    "rgba(10,28,22,.86)": "rgba(24,32,22,.86)",
    "rgba(10,28,22,.85)": "rgba(24,32,22,.85)",
    "rgba(10,28,22,.82)": "rgba(24,32,22,.82)",
}
for a, b in reps.items():
    head = head.replace(a, b)

xcss = '''
  .tiers{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:20px}
  .tier{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:22px 18px 20px;display:flex;flex-direction:column;box-shadow:0 14px 32px -22px rgba(0,0,0,.32);position:relative}
  .tier.hl{border:2px solid var(--navy)}
  .tier .tname{font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .tier .tprice{font-family:'DM Serif Display',serif;font-size:31px;color:var(--navy);margin:8px 0 1px;line-height:1}
  .tier .tunit{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;font-weight:600;margin-bottom:14px;line-height:1.3}
  .tier ul{list-style:none;display:flex;flex-direction:column;gap:8px;margin-top:2px}
  .tier ul li{position:relative;padding-left:18px;font-size:11.5px;color:var(--ink);line-height:1.35}
  .tier ul li b{color:var(--navy);font-weight:700}
  .tier ul li::before{content:"\\2726";position:absolute;left:0;top:1px;color:var(--orange);font-size:10px}
  .tier .tag{position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:var(--navy);color:#fff;font-size:8.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:4px 13px;border-radius:999px;white-space:nowrap}
  .lembra{display:flex;gap:16px;align-items:center;margin-top:18px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px 18px}
  .lembra .lph{flex:0 0 92px;height:92px;border-radius:12px;overflow:hidden;position:relative;border:1px solid var(--line)}
  .lembra .lph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .lembra .lt{font-family:'DM Serif Display',serif;font-size:18px;color:var(--navy);line-height:1.1}
  .lembra .ld{font-size:11.5px;color:var(--muted);line-height:1.45;margin-top:4px}
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


PROOF = "Experiências já realizadas para grupos como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)"

cover = f'''
  <section class="slide">
{head_block("Proposta de experiência · Aniversário", "Arranjos", "florais", "Sow Café · 28/09")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Aniversário · Arranjos florais</span>
        <h1>Um aniversário que <em>floresce</em></h1>
        <p class="lead">Uma tarde delicada pra comemorar: guiadas por uma florista, cada uma monta o próprio arranjo autoral no aconchego do <strong>Sow Café</strong> — e leva pra casa um pedacinho de beleza feito à mão. 🌸</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>28/09</b></span>
          <span class="chip"><b>Sow Café</b> · Zona Norte</span>
          <span class="chip">Arranjo <b>autoral</b></span>
        </div>
      </div>
      <div class="cover-photo">{img("aniversario-mesa-real.jpg", "Grupo montando arranjos florais numa mesa posta", "center 50%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Aniversário · Arranjos florais")}
  </section>'''

experiencia = f'''
  <section class="slide">
{head_simple("A experiência")}
    <span class="eyebrow orange">◆ Mão nas flores 🌸</span>
    <h2>Cada arranjo, uma <em>assinatura</em></h2>
    <p class="lead">Com a florista ao lado, a turma aprende a escolher, combinar e montar as flores — cores, texturas e aquele toque pessoal. Tudo com calma, papo bom e um café delicioso do lado. No fim, cada uma leva o próprio arranjo pra casa. 🌷</p>
    <div class="bfeat">
      <div class="bphoto">{img("buque.jpg", "Buquê floral autoral", "center 40%")}</div>
      <div class="bbody">
        <span class="btag">Como acontece</span>
        <h3>Do buquê à mesa</h3>
        <ul class="feat">
          <li><span class="st">1</span><b>Boas-vindas</b> — um café especial e a bancada de flores montada.</li>
          <li><span class="st">2</span><b>Mão nas flores</b> — a florista ensina a escolher e compor o arranjo.</li>
          <li><span class="st">3</span><b>Leva pra casa</b> — cada uma finaliza e leva o seu arranjo autoral. 🌸</li>
        </ul>
      </div>
    </div>
    {foot("A experiência")}
  </section>'''

vibe = f'''
  <section class="slide">
{head_simple("A vibe")}
    <span class="eyebrow orange">◆ O que vocês vão sentir</span>
    <h2>Delicadeza em cada <em>detalhe</em></h2>
    <p class="lead">Um encontro leve, perfumado e cheio de fotos lindas — cores, flores e a alegria de criar algo com as próprias mãos, entre amigas. 🌿</p>
    <div class="vibe">
      <figure>{img("buqueflor.jpg", "Buquê de flores do campo", "center 50%")}<figcaption>Flores selecionadas</figcaption></figure>
      <figure>{img("aniversario-mesa-real.jpg", "Turma montando arranjos juntas", "center 50%")}<figcaption>Juntas, sem pressa</figcaption></figure>
      <figure>{img("florseca.jpg", "Mini arranjos autorais", "center 50%")}<figcaption>Leva pra casa</figcaption></figure>
    </div>
    {foot("A vibe da experiência")}
  </section>'''

espaco = f'''
  <section class="slide">
{head_simple("O espaço")}
    <span class="eyebrow orange">◆ O espaço</span>
    <h2>Sow <em>Café</em></h2>
    <p class="lead">Um café charmoso e aconchegante na <strong>Zona Norte</strong>, cheio de verde e cantinhos lindos — o cenário perfeito pra uma comemoração delicada, com as flores de um lado e um cafezinho do outro. ☕🌿</p>
    <div class="bfeat">
      <div class="bphoto">{img("sowcafe.jpg", "Ambiente aconchegante do Sow Café", "center 50%")}</div>
      <div class="bbody">
        <span class="btag">Sow Café · Zona Norte</span>
        <h3>Aconchego que combina</h3>
        <ul class="feat">
          <li><span class="st">✦</span>Ambiente charmoso, cheio de verde e luz natural.</li>
          <li><span class="st">✦</span>Cafés e quitutes deliciosos pra acompanhar a tarde.</li>
          <li><span class="st">✦</span>Pertinho da Zona Norte, fácil pra todo mundo chegar.</li>
        </ul>
        <div class="bnote">◆ No Sow Café há um <b>consumo mínimo de R$ 50 por pessoa</b>, gasto no próprio café (não incluso nos valores da experiência). ☕</div>
      </div>
    </div>
    {foot("O espaço · Sow Café")}
  </section>'''

planos = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Escolham o plano</span>
    <h2>É só <em>escolher</em></h2>
    <p class="lead">A experiência de arranjo floral por <strong>R$ 239 por pessoa</strong>, com flores, material e condução inclusos. Dá pra deixar ainda mais especial com foto profissional e lembrancinha. 🌸</p>
    <div class="tiers">
      <div class="tier">
        <span class="tname">Essencial</span>
        <span class="tprice">R$ 239</span>
        <span class="tunit">por pessoa</span>
        <ul>
          <li>Arranjo floral autoral</li>
          <li>Todas as flores e material</li>
          <li>Condução por florista</li>
        </ul>
      </div>
      <div class="tier hl">
        <span class="tag">Mais escolhido</span>
        <span class="tname">Com Foto</span>
        <span class="tprice">R$ 239</span>
        <span class="tunit">por pessoa + R$ 450 (foto)</span>
        <ul>
          <li>Tudo do <b>Essencial</b></li>
          <li><b>Registro fotográfico</b> profissional</li>
          <li>Foto: R$ 450 (valor fixo)</li>
        </ul>
      </div>
      <div class="tier">
        <span class="tname">Completo</span>
        <span class="tprice">R$ 338</span>
        <span class="tunit">por pessoa + R$ 450 (foto)</span>
        <ul>
          <li>Tudo do plano <b>Com Foto</b></li>
          <li><b>Lembrancinha</b> personalizada</li>
          <li>+ R$ 99 por pessoa (lembrancinha)</li>
        </ul>
      </div>
    </div>
    <div class="lembra">
      <div class="lph">{img("lembrancinha-escova.jpg", "Lembrancinha personalizada — escova e piranha", "center 50%")}</div>
      <div>
        <div class="lt">Lembrancinha personalizada</div>
        <div class="ld">Escova e piranha de cabelo personalizadas com o nome de cada convidada, numa caixinha linda pra levar pra casa. <b>+ R$ 99 por pessoa.</b></div>
      </div>
    </div>
    <p class="fineprint">Valores por pessoa para a experiência de arranjo floral, em 28/09, no Sow Café (Zona Norte). Inclui flores, material e condução. Consumo mínimo de R$ 50/pessoa no café, não incluso. Foto profissional: R$ 450 (valor fixo). Lembrancinha personalizada: R$ 99/pessoa. Número de pessoas e horário a confirmar.</p>
    {foot("Investimento")}
  </section>'''

proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Bora comemorar? 🌸</span>
    <h2>É só <em>escolher</em></h2>
    <p class="lead">Me confirma o plano, o número de pessoas e o horário que a gente reserva o Sow Café e organiza as flores e a bancada pra vocês. Qualquer dúvida, é só chamar. 🌿</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">1️⃣</div><h3>Escolham</h3><p>O plano, o número de pessoas e o horário.</p></div>
      <div class="infocard"><div class="ico">2️⃣</div><h3>Reservamos</h3><p>A gente segura o Sow Café e separa as flores pra vocês.</p></div>
      <div class="infocard"><div class="ico">3️⃣</div><h3>É só criar</h3><p>No dia, chega tudo pronto. Vocês só põem a mão nas flores.</p></div>
    </div>
    <div class="quote">
      <i>Elarah · Experiências criativas</i><br>
      contato@elarah.com.br &nbsp;·&nbsp; <strong>elarah.com.br</strong> &nbsp;·&nbsp; @elarah
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = '<div class="deck">\n' + cover + experiencia + vibe + espaco + planos + proximos + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/experiencia-aniversario-arranjos-sowcafe.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
