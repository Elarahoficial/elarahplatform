# Portfolio despedida de solteira/solteiro · 11 pessoas · 19/09/26 · foco no emocional · 11 experiências
# Paleta champagne dourado + vinho (romântica). Usa fotos de despedida.
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
  .xgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
  .xcard{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 14px 32px -22px rgba(0,0,0,.34)}
  .xph{height:132px;overflow:hidden;position:relative;background:#eee;border-bottom:1px solid rgba(58,30,42,.10)}
  .xph img{width:100%;height:100%;object-fit:cover;display:block}
  .xnum{position:absolute;top:9px;left:9px;background:var(--navy);color:#fff;font-family:'DM Serif Display',serif;font-size:14px;width:28px;height:28px;border-radius:999px;display:flex;align-items:center;justify-content:center}
  .xb{padding:13px 15px 16px;flex:1;display:flex;flex-direction:column}
  .xcat{font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin-bottom:3px}
  .xb h4{font-family:'DM Serif Display',serif;font-weight:400;font-size:16.5px;color:var(--navy);line-height:1.08}
  .xb p{font-size:10.5px;color:var(--muted);line-height:1.42;margin-top:6px}
  .xpr{position:absolute;top:9px;right:9px;background:var(--navy);color:#fff;border-radius:12px;padding:6px 12px;text-align:center;line-height:1}
  .xpr b{font-family:'DM Serif Display',serif;font-size:16px;font-weight:400}
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


def xcard(num, cat, name, desc, photo, price="R$ 239"):
    return f'''      <div class="xcard">
        <div class="xph"><span class="xnum">{num}</span><div class="xpr"><b>{price}</b></div>{photo}</div>
        <div class="xb">
          <span class="xcat">{cat}</span>
          <h4>{name}</h4>
          <p>{desc}</p>
        </div>
      </div>'''


PROOF = "Experiências já realizadas para grupos como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)"

cover = f'''
  <section class="slide">
{head_block("Despedida de solteira · Turma privada", "Uma despedida", "inesquecível", "11 pessoas · 19/09")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Despedida de solteira &amp; solteiro</span>
        <h1>A última festa de <em>solteira</em></h1>
        <p class="lead">Uma despedida do jeito que ela merece: as amigas reunidas, mão na massa numa experiência criativa e muita risada — daquelas que viram memória pra vida toda. A gente cuida de tudo, vocês só curtem. 🥂</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>11</b> pessoas</span>
          <span class="chip"><b>19/09</b></span>
          <span class="chip">Turma <b>privada</b></span>
        </div>
      </div>
      <div class="cover-photo">{img("desp-hero3.jpg", "Amigas celebrando a despedida de solteira", "center 30%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Despedida de solteira")}
  </section>'''

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

vitrine_a = f'''
  <section class="slide">
{head_simple("As experiências")}
    <span class="eyebrow orange">◆ Escolham a cara da despedida</span>
    <h2>As <em>experiências</em></h2>
    <div class="xgrid">
{xcard("01", "Cerâmica", "Modelagem em cerâmica", "Mão na argila: cada uma modela a própria peça, rindo do começo ao fim.", img("ceramica-meninas.jpg", "Amigas modelando cerâmica juntas", "center 30%"))}
{xcard("02", "Aromas", "Vela aromática", "Criam a própria vela — aroma, cor e aquele aconchego pra levar pra casa.", img("vela-aromatica-real.jpg", "Oficina de vela aromática", "center 40%"))}
{xcard("03", "Pintura", "Pintura em taça", "Cada uma pinta a própria taça pra brindar a noite — pura diversão.", img("pinturatacameninas.jpg", "Meninas pintando taças", "center 30%"))}
{xcard("04", "Floral", "Buquê de flores", "Montam o próprio buquê autoral enquanto conversam — leve e lindo.", img("buque.jpg", "Buquê de flores autoral", "center 40%"))}
{xcard("05", "Drinks", "Bartenderia", "Aprendem a fazer drinks autorais com um bartender — e o brinde é garantido.", img("drinksclassicos.jpg", "Experiência de bartenderia", "center 50%"), price="R$ 329")}
{xcard("06", "Cerâmica", "Joia em cerâmica", "Criam uma joia autoral em cerâmica pra usar e lembrar do dia.", img("ceramica-acessorio.jpg", "Joia de cerâmica autoral", "center 40%"))}
    </div>
    {foot("As experiências")}
  </section>'''

vitrine_b = f'''
  <section class="slide">
{head_simple("As experiências")}
    <span class="eyebrow orange">◆ E tem mais 🥂</span>
    <h2>Pra todos os <em>estilos</em></h2>
    <div class="xgrid">
{xcard("07", "Papelaria", "Scrapbook", "Montam um álbum/caderninho de memórias da amizade — pura fofura.", img("cartonagem-cereja.jpg", "Scrapbook e papelaria artesanal", "center 50%"))}
{xcard("08", "Crochê", "Bolsa de crochê", "Aprendem o ponto e fazem uma bolsinha de crochê autoral.", img("croche-bolsa.jpg", "Bolsa de crochê autoral", "center 50%"))}
{xcard("09", "Personalização", "Escova &amp; capinha", "Personalizam escova e capinha do jeitinho de cada uma — a lembrança perfeita.", img("lembrancinha-escova.jpg", "Escova e capinha personalizadas", "center 50%"))}
{xcard("10", "Perfumaria", "Perfume autoral", "Montam a própria fragrância, do jeitinho delas — e levam pra casa.", img("perfumaria-oficina.jpg", "Oficina de perfume autoral", "center 60%"))}
{xcard("11", "Pintura", "Pintura em aquarela", "Pintam em aquarela no seu ritmo — delicado, relaxante e cheio de charme.", img("aquarela1.jpg", "Pintura em aquarela", "center 40%"))}
    </div>
    <div class="bnote">◆ Dá pra combinar mais de uma experiência ou criar algo temático especial pra noiva. É só me contar o que vocês imaginam. 🥂</div>
    <p class="fineprint">✦ Valores por pessoa · condução por profissional, material e estrutura inclusos. Bartenderia R$ 329; demais experiências R$ 239. Grupo de 11 pessoas · data 19/09 e local a confirmar.</p>
    {foot("As experiências")}
  </section>'''

proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Bora comemorar? 🥂</span>
    <h2>É só <em>escolher</em></h2>
    <p class="lead">Me conta a experiência favorita e onde vocês querem fazer (nosso espaço ou outro local) que eu monto o orçamento certinho, com tudo pronto pro dia. 💛</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">1️⃣</div><h3>Escolham</h3><p>A(s) experiência(s) e o local que combinam com a despedida.</p></div>
      <div class="infocard"><div class="ico">2️⃣</div><h3>Montamos o orçamento</h3><p>A gente cota espaço, material e organização sob medida.</p></div>
      <div class="infocard"><div class="ico">3️⃣</div><h3>É só celebrar</h3><p>No dia, chega tudo pronto. Vocês só aproveitam.</p></div>
    </div>
    <div class="quote">
      <i>Elarah · Experiências criativas</i><br>
      contato@elarah.com.br &nbsp;·&nbsp; <strong>elarah.com.br</strong> &nbsp;·&nbsp; @elarah
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = '<div class="deck">\n' + cover + emo + vitrine_a + vitrine_b + proximos + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/experiencia-portfolio-despedida.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
