# Portfolio corporativo · presente de fim de ano · time de 8-10 mulheres · leve/desestressar + comida
# Destaque: O Jardim Café e Brunch (espaço privado + comida inclusa · R$ 229). Paleta sage + terracota.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

reps = {
    "--orange:#B08D4C;": "--orange:#B8734E;",
    "--orange-dark:#8A6D34;": "--orange-dark:#8E5636;",
    "--navy:#12362B;": "--navy:#2C3A2E;",
    "--navy-soft:#3A5A4E;": "--navy-soft:#54655A;",
    "--blue-accent:#B08D4C;": "--blue-accent:#B8734E;",
    "#EFF3EE": "#F1F4EC", "#DCE8E1": "#DEE7D8", "#CBB06E": "#D0A57F",
    "rgba(176,141,76,.24)": "rgba(184,115,78,.24)",
    "rgba(176,141,76,.26)": "rgba(184,115,78,.28)",
    "rgba(176,141,76,.10)": "rgba(184,115,78,.10)",
    "rgba(18,54,43,.16)": "rgba(44,58,46,.16)",
    "rgba(10,28,22,.86)": "rgba(24,34,26,.86)",
    "rgba(10,28,22,.85)": "rgba(24,34,26,.85)",
    "rgba(10,28,22,.82)": "rgba(24,34,26,.82)",
}
for a, b in reps.items():
    head = head.replace(a, b)

xcss = '''
  .xgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;margin-top:16px}
  .xcard{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 14px 32px -22px rgba(0,0,0,.34)}
  .xph{height:150px;overflow:hidden;position:relative;background:#eee;border-bottom:1px solid rgba(44,58,46,.10)}
  .xph img{width:100%;height:100%;object-fit:cover;display:block}
  .xnum{position:absolute;top:9px;left:9px;background:var(--navy);color:#fff;font-family:'DM Serif Display',serif;font-size:14px;width:28px;height:28px;border-radius:999px;display:flex;align-items:center;justify-content:center}
  .xb{padding:14px 17px 17px;flex:1;display:flex;flex-direction:column}
  .xcat{font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin-bottom:3px}
  .xb h4{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy);line-height:1.08}
  .xb p{font-size:11.5px;color:var(--muted);line-height:1.45;margin-top:6px}
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


def xcard(num, cat, name, desc, photo):
    return f'''      <div class="xcard">
        <div class="xph"><span class="xnum">{num}</span>{photo}</div>
        <div class="xb">
          <span class="xcat">{cat}</span>
          <h4>{name}</h4>
          <p>{desc}</p>
        </div>
      </div>'''


PROOF = "Experiências já realizadas para times como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)"

cover = f'''
  <section class="slide">
{head_block("Presente de fim de ano · Turma privada", "Experiências", "pro time", "8 a 10 mulheres")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Um presente que desestressa</span>
        <h1>Leve, gostoso e <em>só de vocês</em></h1>
        <p class="lead">Um presente de fim de ano pro seu time: uma experiência criativa e leve pra fazer <strong>enquanto conversam</strong>, com um espaço só de vocês e <strong>comida inclusa</strong>. Do tipo que desestressa, aproxima e rende foto boa. 🌿</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>8 a 10</b> mulheres</span>
          <span class="chip">Comida <b>inclusa</b></span>
          <span class="chip">Itaim · Moema · Brooklin</span>
        </div>
      </div>
      <div class="cover-photo">{img("aniversario-mesa-real.jpg", "Time de mulheres numa experiência criativa com mesa posta", "center 50%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Experiências pro time")}
  </section>'''

intro = f'''
  <section class="slide">
{head_simple("Pensado pro seu time")}
    <span class="eyebrow orange">◆ O que a gente entrega</span>
    <h2>Um respiro no meio da <em>correria</em></h2>
    <p class="lead">Fim de ano é agradecer e relaxar junto. A gente cuida de tudo — espaço, material, condução e comida — pra vocês só chegarem, colocar a mão na massa e aproveitar. 🌿</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">🌿</div><h3>Leve &amp; relaxante</h3><p>Atividades tranquilas, sem técnica pra errar — só pra desacelerar.</p></div>
      <div class="infocard"><div class="ico">💬</div><h3>Dá pra conversar</h3><p>Feito pra fazer enquanto batem papo — e um tempinho pra comer depois.</p></div>
      <div class="infocard"><div class="ico">🍽️</div><h3>Comida inclusa</h3><p>Espaço privado e comida no valor. Vocês só curtem, a gente resolve.</p></div>
    </div>
    {foot("Pensado pro seu time")}
  </section>'''

espaco = f'''
  <section class="slide">
{head_simple("O espaço")}
    <span class="eyebrow orange">◆ O espaço em destaque</span>
    <h2>O Jardim <em>Café &amp; Brunch</em></h2>
    <p class="lead">Um café charmoso com jardim, pra vocês relaxarem cercadas de verde. O espaço fica <strong>privativo só pro seu time</strong>, com <strong>comida inclusa</strong> — a experiência criativa acontece ali, com calma e um brunch delicioso. 🌿</p>
    <div class="invbox">
      <div class="incl" style="flex:1;min-width:280px">
        <span class="vt">Tudo incluso no valor</span>
        <ul>
          <li><span>✦</span>Espaço <b>privativo</b> só pro seu time</li>
          <li><span>✦</span><b>Comida inclusa</b> (café da manhã / brunch)</li>
          <li><span>✦</span>Experiência criativa à escolha</li>
          <li><span>✦</span>Material, condução e montagem completos</li>
        </ul>
      </div>
      <div class="pricebox">
        <span class="pl">Espaço privado + comida</span>
        <span class="pv">R$ 229</span>
        <span class="ps">por pessoa</span>
      </div>
    </div>
    <div class="gstrip">
      <figure>{img("ojardim1.jpg", "Jardim e deck de O Jardim Café e Brunch", "center 50%")}<figcaption>Jardim &amp; deck</figcaption></figure>
      <figure>{img("ojardim4.jpg", "Brunch servido em O Jardim", "center 50%")}<figcaption>Comida inclusa</figcaption></figure>
      <figure>{img("ojardim3.jpg", "Fachada de O Jardim Café e Brunch", "center 50%")}<figcaption>O Jardim Café &amp; Brunch</figcaption></figure>
    </div>
    {foot("O espaço")}
  </section>'''

vitrine = f'''
  <section class="slide">
{head_simple("As experiências")}
    <span class="eyebrow orange">◆ Escolham a de vocês</span>
    <h2>Experiências <em>leves</em> pra fazer juntas</h2>
    <div class="xgrid">
{xcard("01", "Floral", "Arranjo floral", "Cada uma monta o próprio arranjo enquanto conversa — leve, perfumado e lindo de levar pra casa.", img("buqueflor.jpg", "Arranjo floral autoral", "center 50%"))}
{xcard("02", "Cerâmica", "Pintura em cerâmica", "Pintam uma peça no seu ritmo, com o papo rolando solto. Puro relaxamento.", img("pinturapratoceramica.jpg", "Pintura em cerâmica", "center 50%"))}
{xcard("03", "Café &amp; Brunch", "Kit café da manhã", "Um brunch caprichado pra dividir e relaxar juntas — o momento de sentar e conversar.", img("ojardim4.jpg", "Kit café da manhã e brunch", "center 50%"))}
{xcard("04", "Aromas", "Vela aromática", "Criam a própria vela aromática — aconchego que perfuma a casa depois.", img("vela-aromatica-real.jpg", "Vela aromática autoral", "center 40%"))}
    </div>
    <div class="bnote">◆ Gostou de mais de uma? Dá pra combinar, ou pensar em algo diferente pro time — é só me contar o clima que vocês querem. 🌿</div>
    <p class="fineprint">✦ Experiência à escolha inclusa no valor de R$ 229 por pessoa (espaço privativo + comida). Grupo de 8 a 10 pessoas · região Itaim, Moema ou Brooklin. Data e detalhes a confirmar.</p>
    {foot("As experiências")}
  </section>'''

vibe = f'''
  <section class="slide">
{head_simple("A vibe")}
    <span class="eyebrow orange">◆ O que o time vai sentir</span>
    <h2>Rir, criar e <em>respirar</em></h2>
    <p class="lead">Mais que um presente: uma tarde de leveza, papo bom e aquele carinho que só um momento junto proporciona. É disso que o time vai lembrar. 💛</p>
    <div class="vibe">
      <figure>{img("capa-croche-cafe.jpg", "Mulheres rindo numa experiência com café", "center 28%")}<figcaption>Risada &amp; café</figcaption></figure>
      <figure>{img("aniversario-mesa-real.jpg", "Time reunido numa experiência criativa", "center 50%")}<figcaption>Juntas, sem pressa</figcaption></figure>
      <figure>{img("ojardim2.jpg", "Jardim tranquilo de O Jardim", "center 50%")}<figcaption>Cercadas de verde</figcaption></figure>
    </div>
    {foot("A vibe da experiência")}
  </section>'''

proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Bora presentear o time? 🌿</span>
    <h2>É só <em>escolher</em></h2>
    <p class="lead">Me conta a experiência favorita e a data que vocês pensam, que a gente reserva O Jardim (ou outro espaço na região) e organiza tudo — comida, material e o clima perfeito. 💛</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">1️⃣</div><h3>Escolham</h3><p>A experiência e a data que combinam com o time.</p></div>
      <div class="infocard"><div class="ico">2️⃣</div><h3>Reservamos</h3><p>Espaço privativo com comida inclusa, tudo organizado.</p></div>
      <div class="infocard"><div class="ico">3️⃣</div><h3>É só relaxar</h3><p>No dia, chega tudo pronto. Vocês só aproveitam.</p></div>
    </div>
    <div class="quote">
      <i>Elarah · Experiências criativas</i><br>
      contato@elarah.com.br &nbsp;·&nbsp; <strong>elarah.com.br</strong> &nbsp;·&nbsp; @elarah
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = '<div class="deck">\n' + cover + intro + espaco + vitrine + vibe + proximos + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/experiencia-portfolio-corporativo-jardim.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
