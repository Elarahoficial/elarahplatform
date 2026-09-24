# Despedida de solteira · turma privada · ~20 mulheres · 11/10 · SP
# Deck completo: capa, vibe, experiencias (2 slides), onde acontece (todos os locais), valores por espaco/nivel, proximos passos.
# Locais considerados (documentados no historico Elarah): Jules (Campo Belo), Sow Cake Lounge (Vila Mariana),
# Aretha Soul Kitchen, Betc Havas Cafe (+voucher R$50), Bake Studio (exclusivo) e "vai ate voces".
# Valores por pessoa documentados: cafe parceiro 199/299/399; Betc Havas 249/349/449; Bake Studio 289/389/539; Bartenderia a partir de R$459.
# Paleta champagne dourado + vinho (romantica). Nada inventado.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

reps = {
    "--orange:#B08D4C;": "--orange:#BE904E;",
    "--orange-dark:#8A6D34;": "--orange-dark:#93602F;",
    "--navy:#12362B;": "--navy:#3A1E2A;",
    "--navy-soft:#3A5A4E;": "--navy-soft:#6B4A57;",
    "--blue-accent:#B08D4C;": "--blue-accent:#BE904E;",
    "#EFF3EE": "#FBF1F2", "#DCE8E1": "#F0DCE0", "#CBB06E": "#D9B57E",
    "rgba(18,54,43,.16)": "rgba(58,30,42,.16)",
    "rgba(10,28,22,.86)": "rgba(34,16,24,.86)",
    "rgba(10,28,22,.85)": "rgba(34,16,24,.85)",
    "rgba(10,28,22,.82)": "rgba(34,16,24,.82)",
}
for a, b in reps.items():
    head = head.replace(a, b)

xcss = '''
  /* vitrine experiencias */
  .xgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
  .xcard{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 14px 32px -22px rgba(0,0,0,.34)}
  .xph{height:150px;overflow:hidden;position:relative;background:#eee;border-bottom:1px solid rgba(58,30,42,.10)}
  .xph img{width:100%;height:100%;object-fit:cover;display:block}
  .xnum{position:absolute;top:9px;left:9px;background:var(--navy);color:#fff;font-family:'DM Serif Display',serif;font-size:14px;width:28px;height:28px;border-radius:999px;display:flex;align-items:center;justify-content:center}
  .xb{padding:12px 15px 15px;flex:1;display:flex;flex-direction:column}
  .xcat{font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin-bottom:3px}
  .xb h4{font-family:'DM Serif Display',serif;font-weight:400;font-size:16px;color:var(--navy);line-height:1.08}
  .xb p{font-size:10px;color:var(--muted);line-height:1.4;margin-top:5px}
  .xpr{position:absolute;top:9px;right:9px;background:var(--navy);color:#fff;border-radius:12px;padding:5px 11px 6px;text-align:center;line-height:1}
  .xpr small{font-size:6.5px;letter-spacing:.06em;text-transform:uppercase;opacity:.85;display:block;margin-bottom:2px}
  .xpr b{font-family:'DM Serif Display',serif;font-size:15px;font-weight:400}
  /* grid de locais */
  .locgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
  .loc{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 14px 32px -24px rgba(0,0,0,.32)}
  .loc.hl{border:2px solid var(--navy)}
  .lph{height:132px;overflow:hidden;position:relative}
  .lph img{width:100%;height:100%;object-fit:cover;display:block}
  .lpr{position:absolute;bottom:9px;right:9px;background:var(--navy);color:#fff;border-radius:11px;padding:5px 11px;font-size:10.5px;font-weight:700}
  .lb{padding:12px 16px 15px;flex:1;display:flex;flex-direction:column}
  .lsub{font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin-bottom:3px}
  .lb h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--navy);line-height:1.06}
  .lb p{font-size:10px;color:var(--muted);line-height:1.42;margin-top:6px}
  /* tabela de valores */
  .ptable{width:100%;border-collapse:collapse;margin-top:16px;font-size:12.5px;border-radius:14px;overflow:hidden;box-shadow:0 12px 30px -22px rgba(0,0,0,.3)}
  .ptable th{background:var(--navy);color:#fff;text-align:left;padding:12px 16px;font-size:9.5px;letter-spacing:.07em;text-transform:uppercase;font-weight:700}
  .ptable th.r{text-align:right}
  .ptable th small{display:block;font-size:8px;opacity:.8;font-weight:600;letter-spacing:.04em;text-transform:none;margin-top:2px}
  .ptable td{padding:12px 16px;border-bottom:1px solid var(--line);color:var(--ink);vertical-align:middle}
  .ptable tr:last-child td{border-bottom:none}
  .ptable tr:nth-child(even) td{background:#FBF1F2}
  .ptable td.pl{font-family:'DM Serif Display',serif;font-size:16px;color:var(--navy);line-height:1.1}
  .ptable td.pl span{display:block;font-family:'DM Sans',sans-serif;font-size:9.5px;color:var(--muted);letter-spacing:.02em;margin-top:2px}
  .ptable td.r{text-align:right;color:var(--muted);font-weight:600;white-space:nowrap}
  .ptable td.hl{text-align:right;font-family:'DM Serif Display',serif;font-size:16px;color:var(--orange-dark);white-space:nowrap}
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


def xcard(num, cat, name, desc, photo, price="199"):
    return f'''      <div class="xcard">
        <div class="xph"><span class="xnum">{num}</span><div class="xpr"><small>a partir de</small><b>R$ {price}</b></div>{photo}</div>
        <div class="xb">
          <span class="xcat">{cat}</span>
          <h4>{name}</h4>
          <p>{desc}</p>
        </div>
      </div>'''


def loc(src, alt, sub, name, desc, price, pos="center 50%", hl=False):
    cls = "loc hl" if hl else "loc"
    return f'''      <div class="{cls}">
        <div class="lph">{img(src, alt, pos)}<div class="lpr">{price}</div></div>
        <div class="lb"><span class="lsub">{sub}</span><h3>{name}</h3><p>{desc}</p></div>
      </div>'''


PROOF = "Experiências já realizadas para grupos como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)"

# ============================ 1 · CAPA ============================
cover = f'''
  <section class="slide">
{head_block("Despedida de solteira · Turma privada", "Uma despedida", "inesquecível", "20 mulheres · 11/10")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Despedida de solteira</span>
        <h1>A última festa de <em>solteira</em></h1>
        <p class="lead">Uma despedida do jeito que ela merece: as amigas reunidas, mão na massa numa experiência criativa e muita risada — daquelas que viram memória pra vida toda. A gente cuida de tudo, vocês só curtem. 🥂</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip">👰 <b>20</b> mulheres</span>
          <span class="chip">🗓️ <b>11/10</b></span>
          <span class="chip">Turma <b>privada</b></span>
        </div>
      </div>
      <div class="cover-photo">{img("desp-hero3.jpg", "Amigas celebrando a despedida de solteira", "center 30%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Despedida de solteira")}
  </section>'''

# ============================ 2 · A VIBE ============================
emo = f'''
  <section class="slide">
{head_simple("A vibe")}
    <span class="eyebrow orange">◆ O que fica pra sempre</span>
    <h2>Rir, brindar e <em>emocionar</em></h2>
    <p class="lead">Mais que uma festa: é a turma toda junta, o abraço apertado, o brinde à próxima fase. Uma tarde (ou noite) só de vocês, cheia de amor e das melhores fotos. 💛</p>
    <div class="vibe">
      <figure>{img("desp-hero3.jpg", "Amigas celebrando juntas", "center 20%")}<figcaption>A turma toda junta</figcaption></figure>
      <figure>{img("desp-hero2.jpg", "Abraço emocionado na despedida", "center 20%")}<figcaption>Abraço que aperta</figcaption></figure>
      <figure>{img("desp-hero1.jpg", "Decoração de despedida da noiva", "center 50%")}<figcaption>Tudo pra noiva</figcaption></figure>
    </div>
    {foot("A vibe da experiência")}
  </section>'''

# ============================ 3 · EXPERIÊNCIAS (1) ============================
vitrine_a = f'''
  <section class="slide">
{head_simple("As experiências")}
    <span class="eyebrow orange">◆ Escolham a cara da despedida</span>
    <h2>As <em>experiências</em></h2>
    <div class="xgrid">
{xcard("01", "Cerâmica", "Modelagem em cerâmica", "Mão na argila: cada uma modela a própria peça, rindo do começo ao fim.", img("ceramica-meninas.jpg", "Amigas modelando cerâmica juntas", "center 50%"))}
{xcard("02", "Aromas", "Vela aromática", "Criam a própria vela — aroma, cor e aquele aconchego pra levar pra casa.", img("vela-aromatica-real.jpg", "Oficina de vela aromática", "center 50%"))}
{xcard("03", "Pintura", "Pintura em taça", "Cada uma pinta a própria taça pra brindar a noite — pura diversão.", img("pinturatacameninas.jpg", "Meninas pintando taças", "center 35%"))}
{xcard("04", "Floral", "Buquê de flores", "Montam o próprio buquê autoral enquanto conversam — leve e lindo.", img("buque.jpg", "Buquê de flores autoral", "center 40%"))}
{xcard("05", "Perfumaria", "Perfume autoral", "Montam a própria fragrância, do jeitinho delas — e levam pra casa.", img("perfumaria-oficina.jpg", "Oficina de perfume autoral", "center 60%"))}
{xcard("06", "Cerâmica", "Joia em cerâmica", "Criam uma joia autoral em cerâmica pra usar e lembrar do dia.", img("ceramica-acessorio.jpg", "Joia de cerâmica autoral", "center 40%"))}
    </div>
    <p class="fineprint">✦ Valores por pessoa, a partir de R$ 199 · material, condução por profissional e espaço em café parceiro inclusos. Valor final conforme o espaço e o nível escolhidos (próximos slides).</p>
    {foot("As experiências")}
  </section>'''

# ============================ 4 · EXPERIÊNCIAS (2) ============================
vitrine_b = f'''
  <section class="slide">
{head_simple("As experiências")}
    <span class="eyebrow orange">◆ E tem mais 🥂</span>
    <h2>Pra todos os <em>estilos</em></h2>
    <div class="xgrid">
{xcard("07", "Papelaria", "Scrapbook", "Montam um álbum/caderninho de memórias da amizade — pura fofura.", img("cartonagem-cereja.jpg", "Scrapbook e papelaria artesanal", "center 50%"))}
{xcard("08", "Crochê", "Bolsa de crochê", "Aprendem o ponto e fazem uma bolsinha de crochê autoral.", img("croche-bolsa.jpg", "Bolsa de crochê autoral", "center 50%"))}
{xcard("09", "Pintura", "Pintura em aquarela", "Pintam em aquarela no seu ritmo — delicado, relaxante e cheio de charme.", img("aquarela1.jpg", "Pintura em aquarela", "center 40%"))}
{xcard("10", "Personalização", "Escova &amp; capinha", "Personalizam escova e capinha do jeitinho de cada uma — a lembrança perfeita.", img("lembrancinha-escova.jpg", "Escova e capinha personalizadas", "center 50%"))}
{xcard("11", "Drinks", "Bartenderia", "Aprendem a fazer drinks autorais com um bartender — e o brinde é garantido.", img("drinksmoleculares.jpg", "Drink autoral numa experiência de bartenderia", "center 50%"), price="459")}
    </div>
    <div class="bnote">◆ Dá pra combinar mais de uma experiência ou criar algo temático especial pra noiva. É só me contar o que vocês imaginam. 🥂</div>
    <p class="fineprint">✦ Experiências criativas a partir de R$ 199/pessoa · Bartenderia a partir de R$ 459/pessoa (bar, bartender e insumos inclusos). Valores por pessoa.</p>
    {foot("As experiências")}
  </section>'''

# ============================ 5 · ONDE ACONTECE ============================
onde = f'''
  <section class="slide">
{head_simple("Onde acontece")}
    <span class="eyebrow orange">◆ Todos os locais considerados</span>
    <h2>Onde <em>celebrar</em></h2>
    <p class="lead">Cafeterias parceiras charmosas, um estúdio exclusivo só de vocês ou a experiência levada até o seu local. É só escolher qual combina mais com a despedida. ☕</p>
    <div class="locgrid">
{loc("julescampobelo.jpg", "Jules — cafeteria charmosa em Campo Belo", "Campo Belo", "Jules", "Cafeteria charmosa e arejada, com mesas de madeira e guarda-sóis.", "a partir de R$ 199", "center 55%")}
{loc("sowcafe.jpg", "Sow Cake Lounge — café aconchegante em Vila Mariana", "Vila Mariana", "Sow Cake Lounge", "Café aconchegante e cheio de charme, ótimo para reunir o grupo.", "a partir de R$ 199", "center 50%")}
{loc("arethasoulkitchen.jpg", "Aretha Soul Kitchen — ambiente caloroso com bar", "Espaço parceiro", "Aretha Soul Kitchen", "Ambiente caloroso, com bar e cozinha e muita personalidade.", "a partir de R$ 199", "center 50%")}
{loc("betchavas2.jpg", "Betc Havas Café — moderno e cheio de charme", "Com voucher R$ 50", "Betc Havas Café", "Moderno e cheio de charme — já vem com R$ 50 de voucher de consumo.", "a partir de R$ 249", "center 55%")}
{loc("espaco1.jpg", "Bake Studio — estúdio exclusivo só do grupo", "★ Exclusivo · só de vocês", "Bake Studio", "Estúdio privado, sem consumação mínima, com sala e cozinha e liberdade pra decorar.", "a partir de R$ 289", "center 50%", hl=True)}
{loc("em-casa-hero-1.jpg", "A experiência levada até o local de vocês", "Vai até vocês", "No local de vocês", "A gente leva tudo pronto até a casa, pousada ou espaço que preferirem.", "sob cotação", "center 50%")}
    </div>
    <p class="fineprint">✦ Valores por pessoa · a partir de. Cafés parceiros e Aretha conforme disponibilidade na data. Deslocamento para o local de vocês sob cotação.</p>
    {foot("Onde acontece")}
  </section>'''

# ============================ 6 · VALORES POR ESPAÇO E NÍVEL ============================
valores = f'''
  <section class="slide">
{head_simple("Os valores")}
    <span class="eyebrow orange">◆ Valores por pessoa</span>
    <h2>Escolham o <em>nível</em></h2>
    <p class="lead">Todos os valores são <strong>por pessoa</strong>, com material, condução e espaço já inclusos. É só escolher o espaço e o quão completa querem a despedida. 🥂</p>
    <table class="ptable">
      <thead>
        <tr>
          <th>Espaço</th>
          <th class="r">A experiência</th>
          <th class="r">Com registro<small>+ foto profissional</small></th>
          <th class="r">Completo<small>+ lembrancinha &amp; decoração</small></th>
        </tr>
      </thead>
      <tbody>
        <tr><td class="pl">Café parceiro<span>Jules, Sow Cake Lounge ou Aretha</span></td><td class="r">R$ 199</td><td class="r">R$ 299</td><td class="hl">R$ 399</td></tr>
        <tr><td class="pl">Betc Havas Café<span>já com R$ 50 de voucher de consumo</span></td><td class="r">R$ 249</td><td class="r">R$ 349</td><td class="hl">R$ 449</td></tr>
        <tr><td class="pl">Bake Studio<span>estúdio exclusivo · só de vocês</span></td><td class="r">R$ 289</td><td class="r">R$ 389</td><td class="hl">R$ 539</td></tr>
      </tbody>
    </table>
    <p class="subh">Bartenderia &amp; adicionais</p>
    <table class="ptable">
      <tbody>
        <tr><td class="pl" style="font-size:14.5px">Bartenderia (drinks autorais)</td><td class="hl">a partir de R$ 459 /pessoa</td></tr>
        <tr><td class="pl" style="font-size:14.5px">Decoração temática</td><td class="r">R$ 790 (total)</td></tr>
        <tr><td class="pl" style="font-size:14.5px">Registro fotográfico profissional</td><td class="r">R$ 450 (total)</td></tr>
      </tbody>
    </table>
    <p class="fineprint">Valores por pessoa (exceto decoração e foto, valores totais), para cerca de 20 mulheres, em 11/10. No Bake Studio o "Com registro" inclui coffee break e o "Completo" inclui decoração. Foto e lembrancinha já entram nos níveis; decoração temática e registro avulsos quando não incluídos. Data e disponibilidade a confirmar.</p>
    {foot("Os valores")}
  </section>'''

# ============================ 7 · PRÓXIMOS PASSOS ============================
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Bora comemorar? 🥂</span>
    <h2>É só <em>escolher</em></h2>
    <p class="lead">Me conta a experiência favorita e onde vocês querem fazer que eu monto o orçamento certinho, com tudo pronto pro dia 11/10. 💛</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">1️⃣</div><h3>Escolham</h3><p>A(s) experiência(s), o espaço e o nível que combinam com a despedida.</p></div>
      <div class="infocard"><div class="ico">2️⃣</div><h3>Montamos o orçamento</h3><p>A gente cota espaço, material e organização sob medida pra turma.</p></div>
      <div class="infocard"><div class="ico">3️⃣</div><h3>É só celebrar</h3><p>No dia, chega tudo pronto. Vocês só aproveitam. 🥂</p></div>
    </div>
    <div class="quote">
      <i>Elarah · Experiências criativas</i><br>
      contato@elarah.com.br &nbsp;·&nbsp; <strong>elarah.com.br</strong> &nbsp;·&nbsp; @elarah.oficial
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n'
        + cover + emo + vitrine_a + vitrine_b + onde + valores + proximos
        + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/experiencia-despedida-solteira-completa.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
