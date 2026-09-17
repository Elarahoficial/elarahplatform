# Portfolio corporativo · presente de fim de ano · O Jardim Cafe e Brunch
# Coffee break + espaco privado R$229 + experiencia R$239 = Plano inicial R$469. Paleta sage + terracota.
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
  .xgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
  .xcard{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 14px 32px -22px rgba(0,0,0,.34)}
  .xph{height:150px;overflow:hidden;position:relative;background:#eee;border-bottom:1px solid rgba(44,58,46,.10)}
  .xph img{width:100%;height:100%;object-fit:cover;display:block}
  .xnum{position:absolute;top:9px;left:9px;background:var(--navy);color:#fff;font-family:'DM Serif Display',serif;font-size:14px;width:28px;height:28px;border-radius:999px;display:flex;align-items:center;justify-content:center}
  .xpr{position:absolute;top:9px;right:9px;background:var(--navy);color:#fff;border-radius:12px;padding:6px 12px;line-height:1}
  .xpr b{font-family:'DM Serif Display',serif;font-size:15px;font-weight:400}
  .xb{padding:13px 15px 16px;flex:1;display:flex;flex-direction:column}
  .xcat{font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin-bottom:3px}
  .xb h4{font-family:'DM Serif Display',serif;font-weight:400;font-size:16.5px;color:var(--navy);line-height:1.08}
  .xb p{font-size:10.5px;color:var(--muted);line-height:1.42;margin-top:6px}
  .menu2{columns:2;column-gap:26px;margin-top:10px}
  .menu2 li{list-style:none;position:relative;padding-left:18px;font-size:12.5px;color:var(--ink);line-height:1.5;break-inside:avoid}
  .menu2 li::before{content:"\\2726";position:absolute;left:0;top:2px;color:var(--orange);font-size:10px}
  .sum{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:16px}
  .sum .box{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 20px;text-align:center;min-width:150px}
  .sum .box .bl{font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);display:block}
  .sum .box .bv{font-family:'DM Serif Display',serif;font-size:26px;color:var(--navy);line-height:1;margin:5px 0 3px;display:block}
  .sum .box small{font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-weight:600;display:block}
  .sum .op{font-family:'DM Serif Display',serif;font-size:24px;color:var(--orange-dark)}
  .sum .tot{background:var(--navy);border-color:var(--navy)}
  .sum .tot .bl{color:var(--orange)}
  .sum .tot .bv{color:#fff}
  .sum .tot small{color:rgba(255,255,255,.8)}
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


PROOF = "Experiências já realizadas para times como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)"

cover = f'''
  <section class="slide">
{head_block("Presente de fim de ano · Turma privada", "Experiências", "pro time", "8 a 10 mulheres")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Um presente que desestressa</span>
        <h1>Leve, gostoso e <em>só de vocês</em></h1>
        <p class="lead">Um presente de fim de ano pro seu time: uma experiência criativa e leve pra fazer <strong>enquanto conversam</strong>, num espaço só de vocês, com um <strong>coffee break</strong> delicioso incluso. Do tipo que desestressa, aproxima e rende foto boa. 🌿</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>8 a 10</b> mulheres</span>
          <span class="chip">Coffee break <b>incluso</b></span>
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
    <p class="lead">Fim de ano é agradecer e relaxar junto. A gente cuida de tudo — espaço privado, material, condução e o coffee break — pra vocês só chegarem, colocar a mão na massa e aproveitar. 🌿</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">🌿</div><h3>Leve &amp; relaxante</h3><p>Atividades tranquilas, sem técnica pra errar — só pra desacelerar.</p></div>
      <div class="infocard"><div class="ico">💬</div><h3>Dá pra conversar</h3><p>Feito pra fazer enquanto batem papo — e um momento pra comer depois.</p></div>
      <div class="infocard"><div class="ico">☕</div><h3>Coffee break incluso</h3><p>Espaço privado no Jardim + coffee break completo. Vocês só curtem.</p></div>
    </div>
    {foot("Pensado pro seu time")}
  </section>'''

espaco = f'''
  <section class="slide">
{head_simple("O espaço + coffee break")}
    <span class="eyebrow orange">◆ O Jardim Café &amp; Brunch</span>
    <h2>Espaço privado + <em>coffee break</em></h2>
    <p class="lead">Um café charmoso com jardim, <strong>reservado só pro seu time</strong>, com um coffee break completo servido à mesa. O cenário perfeito pra relaxar cercadas de verde. 🌿</p>
    <div class="invbox">
      <div class="incl" style="flex:1;min-width:300px">
        <span class="vt">No coffee break tem</span>
        <ul class="menu2">
          <li>Mini pão de queijo</li>
          <li>Mini sanduíche</li>
          <li>Mini toast</li>
          <li>Bolo da casa</li>
          <li>Saladinha de frutas</li>
          <li>Café, chá e leite</li>
          <li>Água</li>
          <li>Servido à mesa 🤍</li>
        </ul>
      </div>
      <div class="pricebox">
        <span class="pl">Coffee break + espaço privado</span>
        <span class="pv">R$ 229</span>
        <span class="ps">por pessoa</span>
      </div>
    </div>
    <div class="gstrip">
      <figure>{img("ojardim1.jpg", "Jardim e deck de O Jardim Café e Brunch", "center 50%")}<figcaption>Jardim &amp; deck</figcaption></figure>
      <figure>{img("ojardim4.jpg", "Coffee break servido em O Jardim", "center 50%")}<figcaption>Coffee break</figcaption></figure>
      <figure>{img("ojardim3.jpg", "Fachada de O Jardim Café e Brunch", "center 50%")}<figcaption>O Jardim Café &amp; Brunch</figcaption></figure>
    </div>
    {foot("O espaço · O Jardim")}
  </section>'''

vitrine = f'''
  <section class="slide">
{head_simple("As experiências")}
    <span class="eyebrow orange">◆ Escolham a de vocês</span>
    <h2>Experiências <em>leves</em> pra fazer juntas</h2>
    <div class="xgrid">
{xcard("01", "Floral", "Arranjo floral", "Cada uma monta o próprio arranjo enquanto conversa — leve e perfumado.", img("buqueflor.jpg", "Arranjo floral autoral", "center 50%"))}
{xcard("02", "Cerâmica", "Pintura em cerâmica", "Pintam uma peça no seu ritmo, com o papo rolando solto.", img("pinturapratoceramica.jpg", "Pintura em cerâmica", "center 50%"))}
{xcard("03", "Aromas", "Vela aromática", "Criam a própria vela — aroma, cor e aconchego pra levar pra casa.", img("vela-aromatica-real.jpg", "Vela aromática autoral", "center 40%"))}
{xcard("04", "Crochê", "Bolsa de crochê", "Aprendem o ponto e fazem uma bolsinha de crochê fofíssima.", img("croche-bolsa.jpg", "Bolsa de crochê autoral", "center 50%"))}
{xcard("05", "Acessório", "Charme de bolsa", "Criam o próprio charm e personalizam a bolsa — puro estilo.", img("charm-bolsa.jpg", "Charme de bolsa personalizado", "center 50%"))}
{xcard("06", "Perfumaria", "Perfume autoral", "Montam a própria fragrância, do jeitinho de cada uma.", img("perfumaria-oficina.jpg", "Oficina de perfume autoral", "center 60%"))}
    </div>
    <div class="bnote">◆ Todas as experiências saem por <b>R$ 239 por pessoa</b>. Gostou de mais de uma? Dá pra combinar — é só me contar. 🌿</div>
    {foot("As experiências")}
  </section>'''

investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ O plano inicial</span>
    <h2>Tudo incluso por <em>R$ 469</em></h2>
    <p class="lead">O plano inicial junta o melhor: o <strong>coffee break</strong> completo e o <strong>espaço privado</strong> no Jardim, mais a <strong>experiência</strong> que o time escolher. Simples assim: 🌿</p>
    <div class="sum">
      <div class="box"><span class="bl">Coffee break + espaço</span><span class="bv">R$ 229</span><small>por pessoa</small></div>
      <span class="op">+</span>
      <div class="box"><span class="bl">Experiência à escolha</span><span class="bv">R$ 239</span><small>por pessoa</small></div>
      <span class="op">=</span>
      <div class="box tot"><span class="bl">Plano inicial</span><span class="bv">R$ 469</span><small>por pessoa</small></div>
    </div>
    <div class="invbox" style="margin-top:20px">
      <div class="incl" style="flex:1;min-width:300px">
        <span class="vt">O que já está incluso</span>
        <ul>
          <li><span>✦</span>Espaço <b>privativo</b> só pro time, no Jardim Café &amp; Brunch</li>
          <li><span>✦</span><b>Coffee break</b> completo, servido à mesa</li>
          <li><span>✦</span>A <b>experiência</b> escolhida (qualquer uma da vitrine)</li>
          <li><span>✦</span>Material, condução e montagem completos</li>
        </ul>
      </div>
    </div>
    <p class="fineprint">Valor por pessoa. Plano inicial = coffee break &amp; espaço privado no Jardim Café &amp; Brunch (R$ 229) + experiência à escolha (R$ 239). Grupo de 8 a 10 pessoas · região Itaim, Moema ou Brooklin. Data e detalhes a confirmar.</p>
    {foot("Investimento")}
  </section>'''

proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Bora presentear o time? 🌿</span>
    <h2>É só <em>escolher</em></h2>
    <p class="lead">Me conta a experiência favorita e a data que vocês pensam, que a gente reserva o Jardim e organiza tudo — coffee break, material e o clima perfeito. 💛</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">1️⃣</div><h3>Escolham</h3><p>A experiência e a data que combinam com o time.</p></div>
      <div class="infocard"><div class="ico">2️⃣</div><h3>Reservamos</h3><p>Espaço privado com coffee break, tudo organizado.</p></div>
      <div class="infocard"><div class="ico">3️⃣</div><h3>É só relaxar</h3><p>No dia, chega tudo pronto. Vocês só aproveitam.</p></div>
    </div>
    <div class="quote">
      <i>Elarah · Experiências criativas</i><br>
      contato@elarah.com.br &nbsp;·&nbsp; <strong>elarah.com.br</strong> &nbsp;·&nbsp; @elarah
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = '<div class="deck">\n' + cover + intro + espaco + vitrine + investimento + proximos + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/experiencia-portfolio-corporativo-jardim.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
