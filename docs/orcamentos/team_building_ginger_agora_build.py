# Proposta Elarah · Team building Ginger · Ceramica (modelagem a mao) 3h · Agora Intu · 14 pessoas
# Base visual: deck Elarah (laranja/navy). Conteudo: Agora Intu. Datas 23/10, 29/10, 30/10.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

# ---- reverte paleta esmeralda -> laranja Elarah (default) ----
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
  .checks{display:grid;grid-template-columns:1fr 1fr;gap:11px 26px;margin-top:16px}
  .checks li{list-style:none;position:relative;padding-left:28px;font-size:13px;color:var(--ink);line-height:1.35}
  .checks li b{color:var(--navy);font-weight:700}
  .checks li .ck{position:absolute;left:0;top:-1px;width:19px;height:19px;border-radius:999px;background:var(--orange);color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center}
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
        <p class="lead">Uma experiência de <strong>cerâmica</strong> só pro time da Ginger, no <strong>Agora Intu</strong>. Sem dinâmica forçada e sem slides: todo mundo na mesma mesa, modelando com as próprias mãos — e cada um leva pra casa a peça que fez. 🧡</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>14</b> pessoas</span>
          <span class="chip">Cerâmica · <b>3h</b></span>
          <span class="chip">Agora Intu · <b>Pinheiros</b></span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip"><b>23/10</b> sex</span>
          <span class="chip"><b>29/10</b> qui</span>
          <span class="chip"><b>30/10</b> sex</span>
        </div>
      </div>
      <div class="cover-photo">{img("agora-hero.jpg", "Time de mulheres numa experiência de cerâmica no Agora Intu", "center 50%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Team building · Ginger")}
  </section>'''

porque = f'''
  <section class="slide">
{head_simple("Por que funciona")}
    <span class="eyebrow orange">◆ O que o time leva junto</span>
    <h2>Team building que ninguém <em>finge gostar</em></h2>
    <p class="lead">A conexão acontece sozinha quando o time senta na mesma mesa pra criar algo com as próprias mãos — sem hierarquia, sem quem sabe mais e quem sabe menos. São 3h que soltam o grupo de verdade. 🧡</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">💬</div><h3>Conversa que não rola no escritório</h3><p>Horas lado a lado fazem o time falar de coisas que a reunião nunca puxa. Áreas diferentes se misturam sozinhas.</p></div>
      <div class="infocard"><div class="ico">🤝</div><h3>Todo mundo no mesmo pé</h3><p>Ninguém precisa saber modelar. Diretoria e time começam do zero juntos — e é aí que a hierarquia cai.</p></div>
      <div class="infocard"><div class="ico">🏺</div><h3>Fica depois do dia</h3><p>Cada um leva a própria peça pra mesa de trabalho. A lembrança do encontro fica visível no dia a dia.</p></div>
    </div>
    <div class="bnote" style="margin-top:16px">◆ A gente cuida de tudo: profissional que conduz, material, estrutura e ambientação. O RH só avisa a data e reúne o time — e, se quiserem, a gente reserva um momento de fala da liderança no meio do encontro. 🌿</div>
    {foot("Por que funciona")}
  </section>'''

experiencia = f'''
  <section class="slide">
{head_simple("A experiência")}
    <span class="eyebrow orange">◆ Cerâmica · modelagem à mão</span>
    <h2>Cada um cria a <em>própria peça</em></h2>
    <p class="lead">Modelagem à mão, à mesa posta, com a <strong>ceramista conduzindo</strong> do começo ao fim. Desacelera o time e cria um clima de conversa mais próxima — e depois a gente esmalta, <strong>queima</strong> e devolve a peça pronta. 🏺</p>
    <div class="bfeat">
      <div class="bphoto">{img("agora-ceramica.jpg", "Participante modelando a própria peça de cerâmica à mão", "center 40%")}</div>
      <div class="bbody">
        <span class="btag">Como acontece · 3h</span>
        <h3>Da argila à peça pronta</h3>
        <ul class="feat">
          <li><span class="st">1</span><b>Boas-vindas</b> — a mesa posta, a playlist e o clima do espaço.</li>
          <li><span class="st">2</span><b>Mão na argila</b> — cada um modela a própria peça, guiado pela ceramista.</li>
          <li><span class="st">3</span><b>Fica pronta</b> — a gente esmalta, queima e devolve a peça de cada um. 🧡</li>
        </ul>
      </div>
    </div>
    {foot("A experiência")}
  </section>'''

inclui = f'''
  <section class="slide">
{head_simple("O que inclui")}
    <span class="eyebrow orange">◆ Tudo incluso, sem surpresa</span>
    <h2>A experiência inclui <em>tudo isto</em></h2>
    <p class="lead">Do espaço à última peça queimada — a Ginger só precisa reunir o time. 🧡</p>
    <div class="rule"></div>
    <ul class="checks">
      <li><span class="ck">✓</span><b>Espaço exclusivo</b> no Agora Intu, só pro time</li>
      <li><span class="ck">✓</span><b>Ceramista / professora</b> conduzindo</li>
      <li><span class="ck">✓</span><b>Todos os materiais</b> inclusos</li>
      <li><span class="ck">✓</span><b>Queima da cerâmica</b> (peça devolvida pronta)</li>
      <li><span class="ck">✓</span><b>Mesas e ambientação</b> montadas</li>
      <li><span class="ck">✓</span><b>Playlist, velas</b> e o clima do espaço</li>
      <li><span class="ck">✓</span><b>Café, chá e água</b> à vontade</li>
      <li><span class="ck">✓</span>Cada participante <b>cria a própria peça</b></li>
    </ul>
    <div class="bnote" style="margin-top:18px">◆ Sem custos escondidos: material, queima, estrutura e ambientação já estão no valor. É só escolher a data. 🌿</div>
    {foot("O que inclui")}
  </section>'''

atmosfera = f'''
  <section class="slide">
{head_simple("A atmosfera")}
    <span class="eyebrow orange">◆ Já rolou aqui</span>
    <h2>Um pouco do que já aconteceu <em>nessa sala</em></h2>
    <p class="lead">Mesa posta com velas e flores, gente à mesa criando junto e muita risada — é essa a atmosfera que espera o time da Ginger no Agora Intu. 🕯️</p>
    <div class="vibe">
      <figure>{img("agora-mesa.jpg", "Mesa posta com velas, flores e cerâmica no Agora Intu", "center 50%")}<figcaption>Mesa posta &amp; velas</figcaption></figure>
      <figure>{img("agora-pintando.jpg", "Grupo criando à mesa no Agora Intu", "center 40%")}<figcaption>Mão na massa</figcaption></figure>
      <figure>{img("agora-grupo.jpg", "Time reunido à mesa no Agora Intu", "center 50%")}<figcaption>Time à mesa</figcaption></figure>
    </div>
    <div class="gstrip">
      <figure>{img("agora-selfie.jpg", "Amigas rindo durante a experiência", "center 40%")}<figcaption>Risada garantida</figcaption></figure>
      <figure>{img("agora-ceramica.jpg", "Modelagem de cerâmica à mão", "center 40%")}<figcaption>Modelagem à mão</figcaption></figure>
      <figure>{img("agora-aquarela.jpg", "Arte criada no espaço", "center 50%")}<figcaption>Arte de verdade</figcaption></figure>
    </div>
    {foot("A atmosfera do Agora")}
  </section>'''

investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Cerâmica no Agora Intu</span>
    <h2>O valor <em>fechado</em></h2>
    <p class="lead">A experiência completa de cerâmica (3h), para a turma privada de 14, com tudo incluso. Já está tudo somado — sem surpresa. 🧡</p>
    <div class="invbox">
      <div class="incl" style="flex:1;min-width:300px">
        <span class="vt">Já está incluso</span>
        <ul>
          <li><span>✦</span>Espaço exclusivo + ceramista conduzindo</li>
          <li><span>✦</span>Todos os materiais + queima da cerâmica</li>
          <li><span>✦</span>Mesas, ambientação, playlist e velas</li>
          <li><span>✦</span>Café, chá e água à vontade</li>
          <li><span>✦</span>Cada participante leva a própria peça</li>
        </ul>
      </div>
      <div class="pricebox">
        <span class="pl">Cerâmica · turma de 14 · 3h</span>
        <span class="pv">R$ 3.300</span>
        <span class="ps">≈ R$ 236 por pessoa</span>
      </div>
    </div>
    <div class="bnote">◆ <b>Opção de alimentação</b> — Menu Completo por <b>R$ 150 por pessoa</b>: finger food + doce da casa + café, assinado pela chef parceira do Agora. É só somar se quiserem. 🥐</div>
    <p class="fineprint">Valor para a experiência de cerâmica (modelagem à mão, 3h), turma privada de 14 pessoas, no Agora Intu (Pinheiros). Inclui espaço exclusivo, ceramista, todos os materiais, queima, mesas e ambientação, playlist, velas, café, chá e água. Menu Completo de alimentação opcional: R$ 150/pessoa. Datas disponíveis: 23/10 (sex), 29/10 (qui) ou 30/10 (sex). Reserva com sinal de 50%; saldo até 3 dias antes; número de convidados confirmado até 7 dias antes. A Elarah emite nota fiscal.</p>
    {foot("Investimento")}
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
      <div class="infocard"><div class="ico">2️⃣</div><h3>A gente leva tudo</h3><p>Ceramista, material e estrutura. Chegamos antes, montamos e desmontamos no fim.</p></div>
      <div class="infocard"><div class="ico">3️⃣</div><h3>Cada um leva a peça</h3><p>A gente queima e devolve a peça de cada participante pronta.</p></div>
    </div>
    <div class="quote">
      Tássia, me confirma a <strong>data</strong> que faz mais sentido, que eu reservo o Agora Intu e organizo tudo pro time da Ginger. ✦<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Como funciona & contato")}
  </section>'''

deck = '<div class="deck">\n' + cover + porque + experiencia + inclui + atmosfera + investimento + contato + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/experiencia-team-building-ginger-agora.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
