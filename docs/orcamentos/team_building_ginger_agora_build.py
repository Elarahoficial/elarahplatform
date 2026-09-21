# Proposta Elarah · Team building Ginger · Ceramica (modelagem a mao) 3h · Agora Intu · 14 pessoas
# v4: sem slide "por que"; experiencia+inclui fundidos; atmosfera ceramica HQ; investimento com opcionais Menu(150/pp) + Foto(450).
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
  .checks{display:grid;grid-template-columns:1fr 1fr;gap:9px 24px;margin-top:14px}
  .checks li{list-style:none;position:relative;padding-left:26px;font-size:12px;color:var(--ink);line-height:1.3}
  .checks li b{color:var(--navy);font-weight:700}
  .checks li .ck{position:absolute;left:0;top:0;width:17px;height:17px;border-radius:999px;background:var(--orange);color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center}
  .num{font-family:'DM Serif Display',serif;color:var(--orange);font-size:24px;line-height:1}
  .egrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:16px}
  .egrid figure{margin:0;border-radius:14px;overflow:hidden;position:relative;height:205px;border:1px solid rgba(62,37,48,.10);box-shadow:0 12px 30px -20px rgba(0,0,0,.4)}
  .egrid img{width:100%;height:100%;object-fit:cover;display:block}
  .egrid figcaption{position:absolute;left:0;right:0;bottom:0;padding:24px 12px 10px;color:#fff;font-size:11.5px;font-weight:600;background:linear-gradient(to top,rgba(16,23,28,.86),transparent)}
  .priceband{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;background:var(--navy);color:#fff;border-radius:18px;padding:20px 28px;margin-top:14px}
  .priceband .pl{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange);font-weight:700}
  .priceband .pv{font-family:'DM Serif Display',serif;font-size:44px;line-height:1;margin-top:3px}
  .priceband .side{font-size:12px;color:rgba(255,255,255,.82);line-height:1.6;text-align:right}
  .priceband .side b{color:#fff}
  .subh{font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin:20px 0 0}
  .opts{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:12px;align-items:stretch}
  .opt{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:0;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 12px 30px -22px rgba(0,0,0,.28)}
  .opt .oph{aspect-ratio:1/1;overflow:hidden;position:relative;background:#eee;border-bottom:1px solid var(--line)}
  .opt .oph img{width:100%;height:100%;object-fit:cover;display:block}
  .opt .ob{padding:15px 20px 17px;flex:1;display:flex;flex-direction:column}
  .opt .ot{font-size:9px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .opt h4{font-family:'DM Serif Display',serif;font-weight:400;font-size:20px;color:var(--navy);line-height:1.06;margin-top:3px}
  .opt p{font-size:11.5px;color:var(--muted);line-height:1.45;margin-top:7px}
  .opt ul{list-style:none;margin-top:9px;display:flex;flex-direction:column;gap:5px}
  .opt ul li{position:relative;padding-left:16px;font-size:11px;color:var(--ink);line-height:1.3}
  .opt ul li::before{content:"\\2726";position:absolute;left:0;top:1px;color:var(--orange);font-size:9px}
  .opt .op{margin-top:auto;padding-top:12px;font-family:'DM Serif Display',serif;font-size:24px;color:var(--navy);line-height:1}
  .opt .op small{font-family:-apple-system,sans-serif;font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-weight:600;margin-left:4px}
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
        <p class="lead">Uma experiência de <strong>cerâmica</strong> só pro time da Ginger, no <strong>Agora Intu</strong>. Sem dinâmica forçada, sem slides — todo mundo na mesma mesa, criando com as próprias mãos. É o tipo de encontro que aproxima de verdade e deixa uma lembrança que fica.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>14</b> pessoas</span>
          <span class="chip">Cerâmica · <b>3h</b></span>
          <span class="chip"><b>R$ 269</b> por pessoa</span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip"><b>23/10</b> sex</span>
          <span class="chip"><b>29/10</b> qui</span>
          <span class="chip"><b>30/10</b> sex</span>
        </div>
      </div>
      <div class="cover-photo">{img("agora-mesa.jpg", "Cenário de cerâmica montado no Agora Intu", "center 50%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Team building · Ginger")}
  </section>'''

experiencia = f'''
  <section class="slide">
{head_simple("A experiência")}
    <span class="eyebrow orange">◆ Cerâmica · modelagem à mão</span>
    <h2>Cada um cria a <em>própria peça</em></h2>
    <p class="lead">Modelagem à mão, à mesa posta, com a <strong>ceramista conduzindo</strong>. A argila desacelera o time, aproxima as conversas — e cada um leva pra casa algo que fez com as próprias mãos, esmaltado e queimado, pronto pra durar.</p>
    <div class="bfeat">
      <div class="bphoto">{img("ceramicamodelagem.jpg", "Mãos modelando uma peça de cerâmica", "center 50%")}</div>
      <div class="bbody">
        <span class="btag">Como acontece · 3h</span>
        <h3>Da argila à peça pronta</h3>
        <ul class="feat">
          <li><span class="st">1</span><b>Boas-vindas</b> — mesa posta, playlist e o clima acolhedor do espaço.</li>
          <li><span class="st">2</span><b>Mão na argila</b> — cada um modela a própria peça, guiado pela ceramista.</li>
          <li><span class="st">3</span><b>Fica pronta</b> — a gente esmalta, queima e devolve a peça de cada um.</li>
        </ul>
      </div>
    </div>
    <p class="subh">Tudo incluso, sem surpresa</p>
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
    {foot("A experiência")}
  </section>'''

atmosfera = f'''
  <section class="slide">
{head_simple("A atmosfera")}
    <span class="eyebrow orange">◆ Cerâmica de verdade</span>
    <h2>O clima que espera <em>o time</em></h2>
    <p class="lead">Mesa posta com velas e flores, mãos na argila e o grupo criando junto — luz baixa, playlist boa e aquela sensação de estar num lugar especial. É essa a atmosfera do Agora Intu.</p>
    <div class="egrid">
      <figure>{img("agora-pintura.jpg", "Grupo criando cerâmica junto no Agora Intu", "center 40%")}<figcaption>Mão na massa, juntas</figcaption></figure>
      <figure>{img("agora-ceramica.jpg", "Modelagem de cerâmica à mão no Agora Intu", "center 40%")}<figcaption>Modelagem à mão</figcaption></figure>
      <figure>{img("agora-selfie.jpg", "Time rindo durante a experiência", "center 40%")}<figcaption>Risada garantida</figcaption></figure>
      <figure>{img("torno.jpg", "Mãos modelando argila", "center 50%")}<figcaption>Argila nas mãos</figcaption></figure>
      <figure>{img("ceramica2.jpg", "Peças de cerâmica autorais", "center 50%")}<figcaption>As peças que ficam</figcaption></figure>
      <figure>{img("agora-grupo.jpg", "Time reunido à mesa no Agora Intu", "center 50%")}<figcaption>O time à mesa</figcaption></figure>
    </div>
    <div class="bnote" style="margin-top:16px">◆ <b>Tudo incluso:</b> espaço exclusivo · ceramista conduzindo · todos os materiais · queima da cerâmica · mesas e ambientação · playlist e velas · café, chá e água — e cada um leva a própria peça.</div>
    {foot("A atmosfera do Agora")}
  </section>'''

investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Cerâmica no Agora Intu</span>
    <h2>Um encontro que <em>vale a lembrança</em></h2>
    <p class="lead">A experiência completa de cerâmica (3h), para a turma privada de 14, com tudo incluso — já está tudo somado.</p>
    <div class="priceband">
      <div><span class="pl">A experiência · por pessoa</span><span class="pv">R$ 269</span></div>
      <div class="side">Cerâmica · 3h · turma de 14<br><b>Total da turma: R$ 3.766</b></div>
    </div>
    <p class="subh">Opcionais pra deixar completo</p>
    <div class="opts">
      <div class="opt">
        <div class="oph">{img("menu-coffee.jpg", "Finger food e doces do coffee break", "center 50%")}</div>
        <div class="ob">
          <span class="ot">Alimentação</span>
          <h4>Menu Completo</h4>
          <p>Finger food + doce da casa + café, assinado pela chef parceira do Agora e servido durante a experiência.</p>
          <div class="op">R$ 150<small>por pessoa</small></div>
        </div>
      </div>
      <div class="opt">
        <div class="oph">{img("eventocorporativo.jpg", "Registro fotográfico profissional de evento corporativo", "center 40%")}</div>
        <div class="ob">
          <span class="ot">Registro</span>
          <h4>Foto profissional</h4>
          <ul>
            <li>Um fotógrafo cobre o encontro inteiro</li>
            <li>Cada conversa e cada criação registradas</li>
            <li>Álbum digital pronto pro RH e a comunicação interna</li>
            <li>Conteúdo pronto pra usar no LinkedIn</li>
          </ul>
          <div class="op">R$ 450<small>valor total</small></div>
        </div>
      </div>
    </div>
    <p class="fineprint">Valor por pessoa para a experiência de cerâmica (modelagem à mão, 3h), turma privada de 14, no Agora Intu (Pinheiros). Opcionais: Menu Completo (finger food + doce da casa + café) R$ 150 por pessoa; Registro fotográfico profissional R$ 450 (valor total). Datas: 23/10 (sex), 29/10 (qui) ou 30/10 (sex). Reserva com sinal de 50%; saldo até 3 dias antes; nº de convidados até 7 dias antes. A Elarah emite nota fiscal.</p>
    {foot("Investimento")}
  </section>'''

contato = f'''
  <section class="slide">
{head_simple("Como funciona & contato")}
    <span class="eyebrow orange">◆ Simples e sob medida</span>
    <h2>É só reunir o <em>time</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pro encontro ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="num">01</div><h3>Escolham a data</h3><p>23/10 (sex), 29/10 (qui) ou 30/10 (sex). A gente reserva o Agora só pro time.</p></div>
      <div class="infocard"><div class="num">02</div><h3>A gente leva tudo</h3><p>Ceramista, material e estrutura. Chegamos antes, montamos e desmontamos no fim.</p></div>
      <div class="infocard"><div class="num">03</div><h3>Cada um leva a peça</h3><p>A gente queima e devolve a peça de cada participante pronta.</p></div>
    </div>
    <div class="quote">
      Tássia, me confirma a <strong>data</strong> que faz mais sentido, que eu reservo o Agora Intu e organizo cada detalhe pro time da Ginger viver esse encontro. ✦<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Como funciona & contato")}
  </section>'''

deck = '<div class="deck">\n' + cover + experiencia + atmosfera + investimento + contato + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/experiencia-team-building-ginger-agora.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
