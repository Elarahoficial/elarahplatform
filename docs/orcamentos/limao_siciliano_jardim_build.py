# Aniversario · Oficina de pintura (taca/aquarela) tema Limao Siciliano · O Jardim + brunch · 07/11 · 10-15 pax
# Cliente traz decor+material da oficina; Elarah = espaco + brunch (4 cardapios 229/279/329/379) + adicionais (prof 3h R$900 ~R$90pp, foto R$450)
# Paleta limao-siciliano: verde + amarelo-limao.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

reps = {
    "--orange:#B08D4C;": "--orange:#B79A2F;",
    "--orange-dark:#8A6D34;": "--orange-dark:#8C7420;",
    "--navy:#12362B;": "--navy:#33402C;",
    "--navy-soft:#3A5A4E;": "--navy-soft:#5A6650;",
    "--blue-accent:#B08D4C;": "--blue-accent:#B79A2F;",
    "#EFF3EE": "#F5F3E4", "#DCE8E1": "#E7E7C9", "#CBB06E": "#D8C069",
    "rgba(176,141,76,.24)": "rgba(183,154,47,.24)",
    "rgba(176,141,76,.26)": "rgba(183,154,47,.28)",
    "rgba(176,141,76,.10)": "rgba(183,154,47,.12)",
    "rgba(18,54,43,.16)": "rgba(51,64,44,.16)",
    "rgba(10,28,22,.86)": "rgba(24,32,18,.86)",
    "rgba(10,28,22,.85)": "rgba(24,32,18,.85)",
    "rgba(10,28,22,.82)": "rgba(24,32,18,.82)",
}
for a, b in reps.items():
    head = head.replace(a, b)

xcss = '''
  .ptable{width:100%;border-collapse:collapse;margin-top:14px;font-size:12px;border-radius:14px;overflow:hidden;box-shadow:0 12px 30px -22px rgba(0,0,0,.3)}
  .ptable th{background:var(--navy);color:#fff;text-align:left;padding:10px 15px;font-size:9.5px;letter-spacing:.07em;text-transform:uppercase;font-weight:700}
  .ptable th.r{text-align:right}
  .ptable td{padding:10px 15px;border-bottom:1px solid var(--line);color:var(--ink);vertical-align:middle}
  .ptable tr:last-child td{border-bottom:none}
  .ptable tr:nth-child(even) td{background:#F5F3E4}
  .ptable td.pl{font-family:'DM Serif Display',serif;font-size:15.5px;color:var(--navy);white-space:nowrap}
  .ptable td.inc{font-size:11px;color:var(--muted);line-height:1.4}
  .ptable td.pr{text-align:right;font-family:'DM Serif Display',serif;font-size:17px;color:var(--orange-dark);white-space:nowrap}
  .subh{font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin:20px 0 0}
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
{head_block("Proposta de experiência · Aniversário", "Limão", "Siciliano", "O Jardim · 07/11")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Aniversário · Oficina de pintura</span>
        <h1>Uma tarde de <em>Limão Siciliano</em></h1>
        <p class="lead">Uma oficina de pintura entre amigas — em taças ou aquarela — com o tema mais charmoso do momento. Vocês trazem a decoração e o material; a Elarah cuida do <strong>espaço no O Jardim</strong> e de um <strong>brunch</strong> delicioso pra completar o dia. 🍋</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>07/11</b></span>
          <span class="chip"><b>10 a 15</b> pessoas</span>
          <span class="chip">O Jardim <b>+ brunch</b></span>
        </div>
      </div>
      <div class="cover-photo">{img("tacalimao1.jpg", "Taça pintada à mão com tema limão siciliano", "center 50%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Limão Siciliano · O Jardim")}
  </section>'''

oficina = f'''
  <section class="slide">
{head_simple("A oficina")}
    <span class="eyebrow orange">◆ Pintura em taça ou aquarela</span>
    <h2>A arte fica por conta <em>de vocês</em></h2>
    <p class="lead">A oficina é do jeitinho que vocês imaginaram: <strong>vocês trazem a decoração e todo o material</strong> (taças ou aquarela, tinta, tema limão siciliano) e a Elarah entra com o <strong>espaço e o brunch</strong> — deixando tudo lindo e gostoso pra celebrar. 🍋</p>
    <div class="bfeat">
      <div class="bphoto">{img("atelieleroy-2.jpg", "Amigas criando juntas numa oficina de pintura", "center 50%")}</div>
      <div class="bbody">
        <span class="btag">Como funciona</span>
        <h3>Vocês criam, a gente cuida do resto</h3>
        <ul class="feat">
          <li><span class="st">✦</span><b>Vocês trazem</b> — decoração, taças/aquarela e todo o material da oficina.</li>
          <li><span class="st">✦</span><b>A Elarah entra</b> — com o espaço no O Jardim e o brunch escolhido.</li>
          <li><span class="st">✦</span><b>Opcional</b> — dá pra contratar o professor da oficina e foto profissional.</li>
        </ul>
      </div>
    </div>
    {foot("A oficina")}
  </section>'''

vibe = f'''
  <section class="slide">
{head_simple("A vibe")}
    <span class="eyebrow orange">◆ O clima da tarde</span>
    <h2>Risadas e <em>limão siciliano</em></h2>
    <p class="lead">Amigas reunidas, taças (ou aquarelas) autorais e muita risada — uma tarde leve, cítrica e cheia de abraço e foto boa. Do tipo que fica na memória. 🍋</p>
    <div class="vibe">
      <figure>{img("capa-croche-cafe.jpg", "Amigas rindo juntas numa experiência", "center 28%")}<figcaption>Risada garantida</figcaption></figure>
      <figure>{img("aquarela-limao.jpg", "Aquarela de limão siciliano", "center 50%")}<figcaption>Tema limão siciliano</figcaption></figure>
      <figure>{img("aniversario-mesa-real.jpg", "Amigas reunidas criando juntas", "center 50%")}<figcaption>Entre amigas</figcaption></figure>
    </div>
    {foot("A vibe da experiência")}
  </section>'''

jardim = f'''
  <section class="slide">
{head_simple("O espaço")}
    <span class="eyebrow orange">◆ O espaço</span>
    <h2>O Jardim <em>Café &amp; Brunch</em></h2>
    <p class="lead">Um café charmoso com jardim, cheio de verde e cantinhos lindos — o cenário perfeito pra sua oficina de pintura. O espaço fica reservado pra vocês, com o brunch servido à mesa. 🌿</p>
    <div class="vibe">
      <figure>{img("ojardim2.jpg", "Jardim de O Jardim Café e Brunch", "center 50%")}<figcaption>Jardim &amp; deck</figcaption></figure>
      <figure>{img("ojardim4.jpg", "Brunch servido em O Jardim", "center 50%")}<figcaption>Brunch servido</figcaption></figure>
      <figure>{img("ojardim1.jpg", "Ambiente de O Jardim", "center 50%")}<figcaption>Cercadas de verde</figcaption></figure>
    </div>
    {foot("O espaço · O Jardim")}
  </section>'''

cardapios = f'''
  <section class="slide">
{head_simple("Cardápios & valores")}
    <span class="eyebrow orange">◆ Escolham o cardápio</span>
    <h2>Espaço + <em>brunch</em></h2>
    <p class="lead">O valor já inclui a <strong>alocação do espaço</strong> no O Jardim + o cardápio escolhido, servido à mesa. Todos por convidado: 🍋</p>
    <table class="ptable">
      <thead>
        <tr><th>Cardápio</th><th>O que inclui</th><th class="r">Valor</th></tr>
      </thead>
      <tbody>
        <tr><td class="pl">Coffee Break</td><td class="inc">Até 6 opções (matinais, bolos da casa, mini sanduíches, mini toasts, frutas c/ granola) · água e café coado</td><td class="pr">R$ 229</td></tr>
        <tr><td class="pl">Coffee Executivo</td><td class="inc">Até 8 opções (+ adicionais e antepastos) · + chá e leite</td><td class="pr">R$ 279</td></tr>
        <tr><td class="pl">Coffee &amp; Brunch da Casa</td><td class="inc">Até 12 opções (+ mini panquecas e tostadas francesas) · + suco</td><td class="pr">R$ 329</td></tr>
        <tr><td class="pl">Coffee &amp; Brunch Completo</td><td class="inc">Até 14 opções (+ mini tortinhas e mini doces) · + 2 sucos</td><td class="pr">R$ 379</td></tr>
      </tbody>
    </table>
    <p class="subh">Pacotes adicionais (opcionais)</p>
    <table class="ptable">
      <tbody>
        <tr><td class="pl" style="font-size:14px">Professor(a) da oficina · 3h</td><td class="inc">Conduz a pintura do começo ao fim · ≈ R$ 90 por pessoa (em 10)</td><td class="pr">R$ 900</td></tr>
        <tr><td class="pl" style="font-size:14px">Foto profissional</td><td class="inc">Registro fotográfico da celebração</td><td class="pr">R$ 450</td></tr>
      </tbody>
    </table>
    <p class="fineprint">Valores por convidado, incluindo espaço e cardápio no O Jardim Café &amp; Brunch. Mínimo de 10 convidados e 5 dias úteis de antecedência para o menu fechado. Decoração e material da oficina por conta de vocês. Professor(a): R$ 900 por 3h (≈ R$ 90/pessoa em 10, diluindo com mais participantes). Foto profissional: R$ 450. Aniversário em 07/11. Data e detalhes sujeitos à disponibilidade de agenda.</p>
    {foot("Cardápios & valores")}
  </section>'''

proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Bora celebrar? 🍋</span>
    <h2>É só <em>escolher</em></h2>
    <p class="lead">Me confirma o cardápio e o número de pessoas que a gente reserva o O Jardim e organiza tudo pra receber vocês. Qualquer dúvida, é só chamar. 🌿</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">1️⃣</div><h3>Escolham</h3><p>O cardápio, o número de pessoas e os adicionais.</p></div>
      <div class="infocard"><div class="ico">2️⃣</div><h3>Reservamos</h3><p>A gente segura o O Jardim e organiza o brunch.</p></div>
      <div class="infocard"><div class="ico">3️⃣</div><h3>É só pintar</h3><p>No dia, vocês montam a oficina e a gente cuida do resto.</p></div>
    </div>
    <div class="quote">
      <i>Elarah · Experiências criativas</i><br>
      contato@elarah.com.br &nbsp;·&nbsp; <strong>elarah.com.br</strong> &nbsp;·&nbsp; @elarah
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = '<div class="deck">\n' + cover + oficina + vibe + jardim + cardapios + proximos + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/experiencia-limao-siciliano-jardim.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
