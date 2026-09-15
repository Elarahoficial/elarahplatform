# Portfólio / Vitrine de experiências · Aniversário 20 meninas (14-15 anos) · 19/09
# Paleta rosé + bordô (jovem e chique). Cliente não quis só a caneca — quer variedade.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

# ---- recolor: esmeralda -> rosé + bordô ----
reps = {
    "--orange:#B08D4C;": "--orange:#C25E7A;",
    "--orange-dark:#8A6D34;": "--orange-dark:#9E4560;",
    "--navy:#12362B;": "--navy:#2E1F2A;",
    "--navy-soft:#3A5A4E;": "--navy-soft:#6B4A5C;",
    "--blue-accent:#B08D4C;": "--blue-accent:#C25E7A;",
    "#EFF3EE": "#FBF0F3", "#DCE8E1": "#F2D9E1", "#CBB06E": "#D98FA6",
    "rgba(176,141,76,.24)": "rgba(194,94,122,.24)",
    "rgba(176,141,76,.26)": "rgba(194,94,122,.28)",
    "rgba(176,141,76,.10)": "rgba(194,94,122,.10)",
    "rgba(18,54,43,.16)": "rgba(46,31,42,.16)",
    "rgba(10,28,22,.86)": "rgba(30,20,28,.86)",
    "rgba(10,28,22,.85)": "rgba(30,20,28,.85)",
    "rgba(10,28,22,.82)": "rgba(30,20,28,.82)",
}
for a, b in reps.items():
    head = head.replace(a, b)

# ---- CSS da vitrine (cards de experiência) ----
xcss = '''
  .xgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
  .xcard{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 14px 32px -22px rgba(0,0,0,.34)}
  .xph{height:134px;overflow:hidden;position:relative;background:#eee;border-bottom:1px solid rgba(46,31,42,.10)}
  .xph img{width:100%;height:100%;object-fit:cover;display:block}
  .xnum{position:absolute;top:9px;left:9px;background:var(--navy);color:#fff;font-family:'DM Serif Display',serif;font-size:14px;width:28px;height:28px;border-radius:999px;display:flex;align-items:center;justify-content:center}
  .xb{padding:13px 15px 16px;flex:1;display:flex;flex-direction:column}
  .xcat{font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin-bottom:3px}
  .xb h4{font-family:'DM Serif Display',serif;font-weight:400;font-size:16.5px;color:var(--navy);line-height:1.08}
  .xb p{font-size:10.5px;color:var(--muted);line-height:1.42;margin-top:6px}
  .egrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:16px}
  .egrid figure{margin:0;border-radius:14px;overflow:hidden;position:relative;height:214px;border:1px solid rgba(46,31,42,.12);box-shadow:0 12px 30px -20px rgba(0,0,0,.4)}
  .egrid img{width:100%;height:100%;object-fit:cover;display:block}
  .egrid figcaption{position:absolute;left:0;right:0;bottom:0;padding:26px 13px 11px;color:#fff;font-size:12px;font-weight:600;background:linear-gradient(to top,rgba(30,20,28,.86),transparent)}
  .xpr{position:absolute;top:9px;right:9px;background:var(--navy);color:#fff;border-radius:12px;padding:5px 11px 6px;text-align:center;line-height:1}
  .xpr small{font-size:7px;letter-spacing:.08em;text-transform:uppercase;opacity:.85;display:block;margin-bottom:1px}
  .xpr b{font-family:'DM Serif Display',serif;font-size:16px;font-weight:400;display:block}
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


def xcard(num, cat, name, desc, photo, price, prefix=""):
    pre = '<small>a partir de</small>' if prefix else ''
    return f'''      <div class="xcard">
        <div class="xph"><span class="xnum">{num}</span><div class="xpr">{pre}<b>{price}</b></div>{photo}</div>
        <div class="xb">
          <span class="xcat">{cat}</span>
          <h4>{name}</h4>
          <p>{desc}</p>
        </div>
      </div>'''


PROOF = "Experiências já realizadas para grupos como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)"

cover = f'''
  <section class="slide">
{head_block("Portfólio de experiências · Turma privada", "Aniversário", "entre amigas", "20 meninas · 19/09")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Um portfólio só de vocês</span>
        <h1>Escolha a sua <em>experiência</em></h1>
        <p class="lead">Reunimos várias experiências criativas pra vocês escolherem a cara da festa — de charm bar a cerâmica, perfume, vela e muito mais. Cada uma vira a atividade <strong>e</strong> a lembrancinha, tudo numa coisa só. É só apontar a(s) favorita(s). ✨</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>20</b> meninas</span>
          <span class="chip"><b>19/09</b> · à tarde</span>
          <span class="chip">São Paulo</span>
        </div>
      </div>
      <div class="cover-photo">{img("croche.jpg", "Bolsinhas de crochê autorais coloridas", "center 50%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Portfólio de experiências")}
  </section>'''

intro = f'''
  <section class="slide">
{head_simple("Pensado pra essa idade")}
    <span class="eyebrow orange">◆ O que a gente leva</span>
    <h2>Uma festa que elas fazem <em>juntas</em></h2>
    <p class="lead">Com 20 meninas de 14 e 15 anos, o segredo é ter o que fazer: mão na massa, música rolando e todo mundo comparando a própria criação. Rende conteúdo pro feed o tempo todo — e ninguém fica no celular por falta de assunto. 📸</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">🎨</div><h3>Criativo &amp; leve</h3><p>Cada uma cria do próprio jeito — sem técnica pra errar, só diversão.</p></div>
      <div class="infocard"><div class="ico">🤍</div><h3>Só de vocês</h3><p>Turma privada, espaço reservado e artista acompanhando mesa por mesa.</p></div>
      <div class="infocard"><div class="ico">✨</div><h3>Tudo montado</h3><p>A gente chega antes, conduz a oficina e desmonta no fim. Vocês só chegam.</p></div>
    </div>
    {foot("Pensado pra essa idade")}
  </section>'''

vitrine_a = f'''
  <section class="slide">
{head_simple("A vitrine")}
    <span class="eyebrow orange">◆ Escolham a cara da festa</span>
    <h2>As <em>experiências</em></h2>
    <div class="xgrid">
{xcard("01", "Charm Bar · bolsa", "Berloque de bolsa", "Cada uma cria o próprio charm e personaliza a bolsa — puro estilo.", img("charm-bolsa.jpg", "Charm bar de bolsa personalizado", "center 50%"), "R$ 259")}
{xcard("02", "Charm Bar · joia", "Criar a própria joia", "Escolhem pedrinhas e pingentes e saem com uma joia autoral.", img("joia-atelie.jpg", "Criando a própria joia no ateliê", "center 50%"), "R$ 599", prefix=True)}
{xcard("03", "Papelaria", "Cartonagem &amp; encadernação", "Montam o próprio caderninho artesanal — capa, costura e tudo.", img("cartonagem-cereja.jpg", "Cadernos de cartonagem e encadernação", "center 50%"), "R$ 499")}
{xcard("04", "Cerâmica", "Modelagem de cerâmica", "Mão na argila: cada uma modela a própria peça do zero.", img("ceramica-meninas.jpg", "Meninas rindo modelando cerâmica no torno", "center 30%"), "R$ 259")}
{xcard("05", "Crochê", "Bolsa de crochê", "Aprendem o ponto e fazem uma bolsinha de crochê fofíssima.", img("croche-bolsa.jpg", "Bolsa de crochê com alça de corrente", "center 50%"), "R$ 259")}
{xcard("06", "Cerâmica", "Acessório em cerâmica", "Criam colares, brincos e mimos em cerâmica pra usar e levar.", img("ceramica-acessorio.jpg", "Colar de flor em cerâmica", "center 40%"), "R$ 259")}
    </div>
    <p class="fineprint">✦ Valores por pessoa · condução por profissional, material e estrutura inclusos. Número final conforme o grupo e a data.</p>
    {foot("A vitrine")}
  </section>'''

vitrine_b = f'''
  <section class="slide">
{head_simple("A vitrine")}
    <span class="eyebrow orange">◆ E tem mais ✨</span>
    <h2>Aromas &amp; <em>arte</em></h2>
    <div class="xgrid">
{xcard("07", "Perfumaria", "Perfume autoral", "Montam a própria fragrância, do jeitinho delas — e levam pra casa.", img("perfumaria-oficina.jpg", "Oficina de perfume autoral", "center 40%"), "R$ 259")}
{xcard("08", "Aromas", "Vela aromática", "Escolhem aroma e fazem a própria vela — com ou sem tema.", img("vela-aromatica-real.jpg", "Oficina de vela aromática com flores secas", "center 40%"), "R$ 259")}
{xcard("09", "Arte têxtil", "Tufting &amp; punch", "Tapetinho ou quadrinho à mão — 4h com todos os materiais inclusos.", img("tufting-cereja.jpg", "Tapete de tufting com cerejas", "center 50%"), "R$ 599")}
    </div>
    <div class="bnote">◆ Essas são só algumas ideias — dá pra combinar mais de uma experiência ou criar algo temático especial pra festa. É só me contar o que a aniversariante ama. 💛</div>
    <p class="fineprint">✦ Valores por pessoa · condução por profissional, material e estrutura inclusos. Número final conforme o grupo e a data.</p>
    {foot("A vitrine")}
  </section>'''

proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Bora escolher? ✨</span>
    <h2>É só <em>apontar</em> a favorita</h2>
    <p class="lead">Me conta qual (ou quais!) experiência a turma curtiu que eu monto o orçamento certinho — com espaço, material e tudo pronto pro dia. Qualquer dúvida, é só chamar. 💛</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">1️⃣</div><h3>Escolham</h3><p>A(s) experiência(s) que mais combinam com a festa.</p></div>
      <div class="infocard"><div class="ico">2️⃣</div><h3>Montamos o orçamento</h3><p>A gente cota espaço, material e organização sob medida.</p></div>
      <div class="infocard"><div class="ico">3️⃣</div><h3>É só curtir</h3><p>No dia, chega tudo pronto. Vocês só aproveitam.</p></div>
    </div>
    <div class="quote">
      <i>Elarah · Experiências criativas</i><br>
      contato@elarah.com.br &nbsp;·&nbsp; <strong>elarah.com.br</strong> &nbsp;·&nbsp; @elarah
    </div>
    {foot("Próximos passos")}
  </section>'''

emo = f'''
  <section class="slide">
{head_simple("A vibe")}
    <span class="eyebrow orange">◆ O que elas vão levar no coração</span>
    <h2>Amigas, risada e <em>memória</em></h2>
    <p class="lead">No fim, o que fica não é só a lembrancinha — é a tarde inteira de risada, mão na massa e foto boa. É a festa que elas vão lembrar por muito tempo. 💛</p>
    <div class="egrid">
      <figure>{img("encontro-1.jpg", "Amigas rindo juntas", "center 30%")}<figcaption>Risada garantida</figcaption></figure>
      <figure>{img("hidrateimeninas.jpg", "Meninas curtindo a experiência juntas", "center 30%")}<figcaption>Juntas, do começo ao fim</figcaption></figure>
      <figure>{img("aniversariogi.jpg", "Meninas pintando cerâmica no aniversário", "center 50%")}<figcaption>Momento só delas</figcaption></figure>
      <figure>{img("pinturatacameninas.jpg", "Meninas pintando juntas", "center 30%")}<figcaption>Mão na massa</figcaption></figure>
      <figure>{img("macaron-risada.jpg", "Amigas rindo na experiência", "center 30%")}<figcaption>Muita risada</figcaption></figure>
      <figure>{img("pintura-grupo.jpg", "Turma reunida criando", "center 40%")}<figcaption>Turma reunida</figcaption></figure>
    </div>
    {foot("A vibe da experiência")}
  </section>'''

prova = f'''
  <section class="slide">
{head_simple("Festas de verdade")}
    <span class="eyebrow orange">◆ Como fica na prática</span>
    <h2>A mesa posta, do <em>jeito Elarah</em></h2>
    <p class="lead">Não é só a atividade: é a mesa montada com carinho, a decoração no clima e cada estação pronta esperando a turma. A gente chega antes, deixa tudo lindo e desmonta no fim — vocês só curtem. 🎀</p>
    <div class="egrid">
      <figure>{img("aniversario-mesa-real.jpg", "Mesa de aniversário com oficina de cerâmica", "center 50%")}<figcaption>Mesa de aniversário</figcaption></figure>
      <figure>{img("aniv-decor.jpg", "Decoração e clima de festa", "center 50%")}<figcaption>Decoração &amp; clima</figcaption></figure>
      <figure>{img("mesa-montada-corp.jpg", "Mesa posta para a turma", "center 50%")}<figcaption>Mesa posta pra turma</figcaption></figure>
      <figure>{img("velaniversario.jpg", "Vela lembrancinha make a wish", "center 50%")}<figcaption>Lembrancinha que fica</figcaption></figure>
      <figure>{img("vibe-mesa-corp.jpg", "Estações prontas com material", "center 50%")}<figcaption>Estações prontas</figcaption></figure>
      <figure>{img("ceramicacool.jpg", "Peças de cerâmica prontas pra levar", "center 50%")}<figcaption>Peças que elas levam</figcaption></figure>
    </div>
    {foot("Festas de verdade")}
  </section>'''

deck = '<div class="deck">\n' + cover + intro + emo + prova + vitrine_a + vitrine_b + proximos + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/experiencia-portfolio-aniversario.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
