# Proposta Elarah · Team building Ginger · Ceramica (modelagem a mao) 3h · Agora Intu · 14 pessoas
# v2: mais visual/premium, so ceramica+dinamica real, A partir de R$269, Menu Completo +150 c/ fotos.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

reps = {
    "--orange:#B08D4C;": "--orange:#F27623;",
    "--orange-dark:#8A6D34;": "--orange-dark:#D4600E;",
    "--navy:#12362B;": "--navy:#16233C;",
    "--navy-soft:#3A5A4E;": "--navy-soft:#3B4E6B;",
    "--blue-accent:#B08D4C;": "--blue-accent:#F27623;",
    "#EFF3EE": "#EDF1F7", "#DCE8E1": "#DCE5F1", "#CBB06E": "#FF9A4D",
    "rgba(176,141,76,.24)": "rgba(242,118,35,.22)",
    "rgba(176,141,76,.26)": "rgba(242,118,35,.26)",
    "rgba(176,141,76,.10)": "rgba(242,118,35,.10)",
    "rgba(18,54,43,.16)": "rgba(62,37,48,.14)",
    "rgba(10,28,22,.86)": "rgba(16,23,28,.86)",
    "rgba(10,28,22,.85)": "rgba(16,23,28,.85)",
    "rgba(10,28,22,.82)": "rgba(16,23,28,.82)",
}
for a, b in reps.items():
    head = head.replace(a, b)

xcss = '''
  .pricehl{display:inline-flex;align-items:baseline;gap:8px;background:var(--navy);color:#fff;border-radius:999px;padding:10px 22px;margin-top:14px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;font-weight:700}
  .pricehl b{font-family:'DM Serif Display',serif;font-weight:400;font-size:24px;color:var(--orange);letter-spacing:0;text-transform:none}
  .pricehl small{font-size:10px;color:rgba(255,255,255,.75);letter-spacing:.1em}
  .checks{display:grid;grid-template-columns:1fr 1fr;gap:11px 26px;margin-top:16px}
  .checks li{list-style:none;position:relative;padding-left:28px;font-size:13px;color:var(--ink);line-height:1.35}
  .checks li b{color:var(--navy);font-weight:700}
  .checks li .ck{position:absolute;left:0;top:-1px;width:19px;height:19px;border-radius:999px;background:var(--orange);color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center}
  .priceband{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;background:var(--navy);color:#fff;border-radius:18px;padding:22px 28px;margin-top:16px}
  .priceband .pl{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange);font-weight:700}
  .priceband .pv{font-family:'DM Serif Display',serif;font-size:46px;line-height:1;margin-top:4px}
  .priceband .pv small{font-size:15px;color:rgba(255,255,255,.8)}
  .priceband .side{font-size:12px;color:rgba(255,255,255,.82);line-height:1.6;text-align:right;max-width:230px}
  .priceband .side b{color:#fff}
  .foodpr{display:inline-block;background:var(--orange);color:#fff;border-radius:999px;padding:9px 20px;font-weight:700;font-size:14px;margin-top:16px}
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


PROOF = "Já realizado para times como <b>Compass</b>, <b>Natura</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)"

cover = f'''
  <section class="slide">
{head_block("Proposta de experiência · Team building", "Team building", "Ginger", "Cerâmica · Agora Intu")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Team building · Turma privada</span>
        <h1>O time junto, <em>de mão na massa</em></h1>
        <p class="lead">Uma experiência de <strong>cerâmica</strong> só pro time da Ginger, no <strong>Agora Intu</strong>. Todo mundo na mesma mesa, modelando com as próprias mãos — e cada um leva pra casa a peça que fez. 🧡</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>14</b> pessoas</span>
          <span class="chip">Cerâmica · <b>3h</b></span>
          <span class="chip"><b>23/10</b> sex</span>
          <span class="chip"><b>29/10</b> qui</span>
          <span class="chip"><b>30/10</b> sex</span>
        </div>
        <div class="pricehl">A partir de <b>R$ 269</b> <small>por pessoa</small></div>
      </div>
      <div class="cover-photo">{img("agora-hero.jpg", "Time numa experiência de cerâmica no Agora Intu", "center 50%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Team building · Ginger")}
  </section>'''

porque = f'''
  <section class="slide">
{head_simple("Por que funciona")}
    <span class="eyebrow orange">◆ O que o time leva junto</span>
    <h2>Team building que ninguém <em>finge gostar</em></h2>
    <p class="lead">A conexão acontece sozinha quando o time senta na mesma mesa pra criar com as próprias mãos — sem hierarquia. São 3h que soltam o grupo de verdade. 🧡</p>
    <div class="gstrip">
      <figure>{img("agora-selfie.jpg", "Time rindo durante a experiência de cerâmica", "center 40%")}<figcaption>Conversa que rende</figcaption></figure>
      <figure>{img("ceramica-meninas.jpg", "Amigas criando cerâmica juntas", "center 30%")}<figcaption>Todo mundo no mesmo pé</figcaption></figure>
      <figure>{img("agora-grupo.jpg", "Time reunido à mesa criando", "center 50%")}<figcaption>O time junto</figcaption></figure>
    </div>
    <div class="grid3" style="margin-top:16px">
      <div class="infocard"><div class="ico">💬</div><h3>Conversa que não rola no escritório</h3><p>Horas lado a lado fazem o time falar do que a reunião nunca puxa.</p></div>
      <div class="infocard"><div class="ico">🤝</div><h3>Todo mundo no mesmo pé</h3><p>Diretoria e time começam do zero juntos — e a hierarquia cai.</p></div>
      <div class="infocard"><div class="ico">🏺</div><h3>Fica depois do dia</h3><p>Cada um leva a própria peça pra mesa de trabalho.</p></div>
    </div>
    {foot("Por que funciona")}
  </section>'''

experiencia = f'''
  <section class="slide">
{head_simple("A experiência")}
    <span class="eyebrow orange">◆ Cerâmica · modelagem à mão</span>
    <h2>Cada um cria a <em>própria peça</em></h2>
    <p class="lead">Modelagem à mão, à mesa posta, com a <strong>ceramista conduzindo</strong>. Desacelera o time e cria um clima de conversa mais próxima — e depois a gente esmalta, <strong>queima</strong> e devolve a peça pronta. 🏺</p>
    <div class="bfeat">
      <div class="bphoto">{img("agora-ceramica.jpg", "Participante modelando a própria peça de cerâmica à mão", "center 40%")}</div>
      <div class="bbody">
        <span class="btag">Como acontece · 3h</span>
        <h3>Da argila à peça pronta</h3>
        <ul class="feat">
          <li><span class="st">1</span><b>Boas-vindas</b> — mesa posta, playlist e o clima do espaço.</li>
          <li><span class="st">2</span><b>Mão na argila</b> — cada um modela a própria peça, guiado pela ceramista.</li>
          <li><span class="st">3</span><b>Fica pronta</b> — a gente esmalta, queima e devolve a peça de cada um. 🧡</li>
        </ul>
      </div>
    </div>
    {foot("A experiência")}
  </section>'''

atmosfera = f'''
  <section class="slide">
{head_simple("A atmosfera")}
    <span class="eyebrow orange">◆ Já rolou aqui</span>
    <h2>O que já aconteceu <em>nessa sala</em></h2>
    <p class="lead">Mesa posta com velas e flores, mãos na argila e o time criando junto — é essa a atmosfera que espera a Ginger no Agora Intu. 🕯️</p>
    <div class="vibe">
      <figure>{img("agora-mesa.jpg", "Mesa posta com velas e flores no Agora Intu", "center 50%")}<figcaption>Mesa posta &amp; velas</figcaption></figure>
      <figure>{img("ceramicamodelagem.jpg", "Mãos modelando uma peça de cerâmica", "center 50%")}<figcaption>Nas mãos, a argila</figcaption></figure>
      <figure>{img("agora-pintando.jpg", "Grupo criando à mesa no Agora Intu", "center 40%")}<figcaption>O time criando</figcaption></figure>
    </div>
    <div class="gstrip">
      <figure>{img("ceramicacool.jpg", "Peças de cerâmica autorais", "center 50%")}<figcaption>As peças</figcaption></figure>
      <figure>{img("agora-ceramica.jpg", "Modelagem de cerâmica à mão", "center 40%")}<figcaption>Modelagem à mão</figcaption></figure>
      <figure>{img("agora-grupo.jpg", "Time reunido à mesa", "center 50%")}<figcaption>Time à mesa</figcaption></figure>
    </div>
    {foot("A atmosfera do Agora")}
  </section>'''

investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Cerâmica no Agora Intu</span>
    <h2>Tudo incluso, <em>sem surpresa</em></h2>
    <p class="lead">A experiência completa de cerâmica (3h), para a turma privada de 14 — já com tudo somado. 🧡</p>
    <div class="priceband">
      <div><span class="pl">A partir de · por pessoa</span><span class="pv">R$ 269</span></div>
      <div class="side">Cerâmica · 3h · turma de 14<br><b>Total da turma: R$ 3.766</b></div>
    </div>
    <ul class="checks">
      <li><span class="ck">✓</span><b>Espaço exclusivo</b> no Agora Intu</li>
      <li><span class="ck">✓</span><b>Ceramista</b> conduzindo</li>
      <li><span class="ck">✓</span><b>Todos os materiais</b> inclusos</li>
      <li><span class="ck">✓</span><b>Queima</b> (peça devolvida pronta)</li>
      <li><span class="ck">✓</span><b>Mesas e ambientação</b> montadas</li>
      <li><span class="ck">✓</span><b>Playlist, velas</b> e o clima</li>
      <li><span class="ck">✓</span><b>Café, chá e água</b> à vontade</li>
      <li><span class="ck">✓</span>Cada um <b>leva a própria peça</b></li>
    </ul>
    <p class="fineprint">Valor por pessoa para a experiência de cerâmica (modelagem à mão, 3h), turma privada de 14, no Agora Intu (Pinheiros). Datas: 23/10 (sex), 29/10 (qui) ou 30/10 (sex). Reserva com sinal de 50%; saldo até 3 dias antes; nº de convidados até 7 dias antes. A Elarah emite nota fiscal.</p>
    {foot("Investimento")}
  </section>'''

alimentacao = f'''
  <section class="slide">
{head_simple("Alimentação")}
    <span class="eyebrow orange">◆ Opção de alimentação</span>
    <h2>Menu <em>Completo</em></h2>
    <p class="lead">Pra completar o encontro, dá pra somar o <strong>Menu Completo</strong>: finger food + doce da casa + café, assinado pela chef parceira do Agora — servido durante a experiência. 🥐</p>
    <div class="vibe">
      <figure>{img("prato-quiche.jpg", "Finger food servido no evento", "center 50%")}<figcaption>Finger food</figcaption></figure>
      <figure>{img("petitgateau.jpg", "Doce da casa", "center 50%")}<figcaption>Doce da casa</figcaption></figure>
      <figure>{img("prato-bavaroise.jpg", "Café e doces", "center 50%")}<figcaption>Café</figcaption></figure>
    </div>
    <span class="foodpr">+ R$ 150 por pessoa</span>
    <p class="fineprint">Menu Completo (finger food + doce da casa + café): R$ 150 por pessoa, opcional, assinado pela chef parceira do Agora Intu. Fotos ilustrativas — se houver restrição alimentar no time, a gente adapta. Com o Menu Completo, o valor por pessoa fica em R$ 419.</p>
    {foot("Alimentação · Menu Completo")}
  </section>'''

contato = f'''
  <section class="slide">
{head_simple("Como funciona & contato")}
    <span class="eyebrow orange">◆ Simples e sob medida</span>
    <h2>É só reunir o <em>time</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pro encontro ser leve do começo ao fim: 🧡</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">1️⃣</div><h3>Escolham a data</h3><p>23/10 (sex), 29/10 (qui) ou 30/10 (sex). A gente reserva o Agora só pro time.</p></div>
      <div class="infocard"><div class="ico">2️⃣</div><h3>A gente leva tudo</h3><p>Ceramista, material e estrutura. Chegamos antes, montamos e desmontamos.</p></div>
      <div class="infocard"><div class="ico">3️⃣</div><h3>Cada um leva a peça</h3><p>A gente queima e devolve a peça de cada participante pronta.</p></div>
    </div>
    <div class="quote">
      Tássia, me confirma a <strong>data</strong> que faz mais sentido, que eu reservo o Agora Intu e organizo tudo pro time da Ginger. ✦<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Como funciona & contato")}
  </section>'''

deck = '<div class="deck">\n' + cover + porque + experiencia + atmosfera + investimento + alimentacao + contato + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/experiencia-team-building-ginger-agora.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
