# Proposta · Criando seu Perfume Natural · turma privada · 10 pessoas · 01/11 · 9h-11h · no local do cliente · R$239
# Paleta lavanda + ameixa (perfumaria natural).
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

reps = {
    "--orange:#B08D4C;": "--orange:#9A79A6;",
    "--orange-dark:#8A6D34;": "--orange-dark:#6E5079;",
    "--navy:#12362B;": "--navy:#2E2436;",
    "--navy-soft:#3A5A4E;": "--navy-soft:#5B4E63;",
    "--blue-accent:#B08D4C;": "--blue-accent:#9A79A6;",
    "#EFF3EE": "#F4EFF6", "#DCE8E1": "#E6DCEC", "#CBB06E": "#B79CC2",
    "rgba(176,141,76,.24)": "rgba(154,121,166,.24)",
    "rgba(176,141,76,.26)": "rgba(154,121,166,.28)",
    "rgba(176,141,76,.10)": "rgba(154,121,166,.10)",
    "rgba(18,54,43,.16)": "rgba(46,36,54,.16)",
    "rgba(10,28,22,.86)": "rgba(28,20,34,.86)",
    "rgba(10,28,22,.85)": "rgba(28,20,34,.85)",
    "rgba(10,28,22,.82)": "rgba(28,20,34,.82)",
}
for a, b in reps.items():
    head = head.replace(a, b)


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
{head_block("Proposta de experiência · Turma privada", "Perfume", "Natural", "01/11 · 10 pessoas")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência sensorial · Perfumaria natural</span>
        <h1>Criando seu <em>Perfume Natural</em></h1>
        <p class="lead">Uma manhã de aromas pra turma de vocês: guiadas por um perfumista, cada uma explora as notas, cria a própria fragrância natural e leva pra casa um perfume único — feito do jeitinho de cada uma. E o melhor: a gente leva tudo até o local de vocês. 🌿</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>01/11</b> · 9h às 11h</span>
          <span class="chip"><b>10</b> pessoas</span>
          <span class="chip">No <b>local de vocês</b></span>
        </div>
      </div>
      <div class="cover-photo">{img("perfumariamaes.jpg", "Ingredientes naturais de uma experiência de perfumaria", "center 50%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Criando seu Perfume Natural")}
  </section>'''

experiencia = f'''
  <section class="slide">
{head_simple("A experiência")}
    <span class="eyebrow orange">◆ Perfumaria natural</span>
    <h2>Uma fragrância <em>só sua</em></h2>
    <p class="lead">Com um perfumista ao lado, a turma mergulha no mundo dos aromas: descobre as famílias olfativas, experimenta as notas naturais e monta o próprio blend — sem pressa, entre um papo e outro. No fim, cada uma leva pra casa o seu perfume autoral. 🌿</p>
    <div class="bfeat">
      <div class="bphoto">{img("perfumaria-oficina.jpg", "Bancada de perfumaria com essências naturais", "center 40%")}</div>
      <div class="bbody">
        <span class="btag">Como acontece</span>
        <h3>Do aroma ao frasco</h3>
        <ul class="feat">
          <li><span class="st">1</span><b>Boas-vindas</b> — a bancada de aromas montada no seu local.</li>
          <li><span class="st">2</span><b>Mão na massa</b> — exploram as notas e criam o próprio blend, guiadas pelo perfumista.</li>
          <li><span class="st">3</span><b>Leva pra casa</b> — cada uma sai com o seu perfume natural autoral. 🤍</li>
        </ul>
      </div>
    </div>
    {foot("A experiência")}
  </section>'''

vibe = f'''
  <section class="slide">
{head_simple("A vibe")}
    <span class="eyebrow orange">◆ O que vocês vão sentir</span>
    <h2>Entre amigas e <em>aromas</em></h2>
    <p class="lead">Mais que uma oficina: uma manhã de amigas reunidas, muita risada e a alegria de criar algo tão pessoal quanto um perfume. É leve, sensorial e rende as melhores fotos — daquelas que viram memória. 🌸</p>
    <div class="vibe">
      <figure>{img("capa-croche-cafe.jpg", "Amigas rindo numa experiência criativa", "center 28%")}<figcaption>Risada garantida</figcaption></figure>
      <figure>{img("macaron-risada.jpg", "Amigas se divertindo juntas", "center 30%")}<figcaption>Pura diversão</figcaption></figure>
      <figure>{img("aniversario-mesa-real.jpg", "Amigas reunidas numa experiência criativa", "center 50%")}<figcaption>Entre amigas</figcaption></figure>
    </div>
    {foot("A vibe da experiência")}
  </section>'''

investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Uma experiência <em>sob medida</em></h2>
    <p class="lead">A experiência completa de perfumaria natural, levada até o local de vocês, por <strong>R$ 239 por pessoa</strong> — com perfumista, todos os insumos e o frasco inclusos. 🌿</p>
    <div class="rule"></div>
    <div class="invbox">
      <div class="incl" style="flex:1;min-width:300px">
        <span class="vt">O que já está incluso</span>
        <ul>
          <li><span>✦</span>Perfumista conduzindo a experiência, do começo ao fim</li>
          <li><span>✦</span>Essências e insumos naturais para criar a fragrância</li>
          <li><span>✦</span>Frasco do perfume pra cada uma levar pra casa</li>
          <li><span>✦</span>Montagem completa <b>no local de vocês</b></li>
          <li><span>✦</span>Cerca de 2h de experiência (9h às 11h)</li>
        </ul>
      </div>
      <div class="pricebox">
        <span class="pl">Valor por pessoa</span>
        <span class="pv">R$ 239</span>
        <span class="ps">turma de 10</span>
      </div>
    </div>
    <div class="bnote">◆ Quer deixar ainda mais <b>especial</b>? Dá pra incluir lembrancinha, registro fotográfico ou uma ambientação temática — a gente monta sob medida. 🤍</div>
    <p class="fineprint">Valor por pessoa para a experiência Criando seu Perfume Natural, turma privada de 10 pessoas, em 01/11 das 9h às 11h, no local de vocês. Inclui perfumista, insumos naturais, frasco e montagem. Data e horário sujeitos à confirmação e disponibilidade de agenda.</p>
    {foot("Investimento")}
  </section>'''

proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Bora criar? 🌿</span>
    <h2>É só <em>confirmar</em></h2>
    <p class="lead">Me confirma a data e o endereço que a gente reserva a agenda e organiza tudo pra levar a experiência até vocês. Qualquer dúvida, é só chamar. 🤍</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">1️⃣</div><h3>Confirmem</h3><p>A data (01/11) e o endereço da turma.</p></div>
      <div class="infocard"><div class="ico">2️⃣</div><h3>Reservamos</h3><p>A gente segura a agenda e organiza cada detalhe.</p></div>
      <div class="infocard"><div class="ico">3️⃣</div><h3>É só criar</h3><p>No dia, chega tudo pronto no seu local. Vocês só aproveitam.</p></div>
    </div>
    <div class="quote">
      <i>Elarah · Experiências criativas</i><br>
      contato@elarah.com.br &nbsp;·&nbsp; <strong>elarah.com.br</strong> &nbsp;·&nbsp; @elarah
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = '<div class="deck">\n' + cover + experiencia + vibe + investimento + proximos + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/experiencia-perfume-natural-turma.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
