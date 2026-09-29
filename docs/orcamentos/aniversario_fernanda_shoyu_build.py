# Proposta Elarah · Aniversario Fernanda · Ceramica + Pintura no SHOYU CRAFTS · 6 amigas · Pinheiros
# Sexta-feira, tarde ou noite (horario confirmado na reserva). Valor final: R$ 349/pp · R$ 2.094 (6 amigas).
# ZERO Agora Intu: sem mencoes, sem fotos agora-*. Fotos reais de ceramica/pintura (nao ha foto real do Shoyu no banco -> representativas).
# Estrutura (7 slides): Capa · A experiencia (Ceramica+Pintura) · Como acontece · A vibe · O espaco (Shoyu) · Investimento · Proximos.
# Paleta terracota/vinho (feminina/elegante). NUNCA mostrar custo de fornecedor/comissao/margem.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

# paleta terracota + vinho (feminina/elegante)
reps = {
    "--orange:#B08D4C;": "--orange:#B87351;",
    "--orange-dark:#8A6D34;": "--orange-dark:#8E5236;",
    "--navy:#12362B;": "--navy:#3C1F28;",
    "--navy-soft:#3A5A4E;": "--navy-soft:#6B4A52;",
    "--blue-accent:#B08D4C;": "--blue-accent:#B87351;",
    "#EFF3EE": "#FBF1EE", "#DCE8E1": "#F0DED6", "#CBB06E": "#CFA07E",
    "rgba(176,141,76,.24)": "rgba(184,115,81,.24)",
    "rgba(176,141,76,.26)": "rgba(184,115,81,.28)",
    "rgba(176,141,76,.10)": "rgba(184,115,81,.10)",
    "rgba(18,54,43,.16)": "rgba(60,31,40,.16)",
    "rgba(10,28,22,.86)": "rgba(32,16,22,.86)",
    "rgba(10,28,22,.85)": "rgba(32,16,22,.85)",
    "rgba(10,28,22,.82)": "rgba(32,16,22,.82)",
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
  .egrid figure{margin:0;border-radius:14px;overflow:hidden;position:relative;height:230px;border:1px solid rgba(60,31,40,.10);box-shadow:0 12px 30px -20px rgba(0,0,0,.4)}
  .egrid img{width:100%;height:100%;object-fit:cover;display:block}
  .egrid figcaption{position:absolute;left:0;right:0;bottom:0;padding:24px 12px 10px;color:#fff;font-size:11.5px;font-weight:600;background:linear-gradient(to top,rgba(32,16,22,.86),transparent)}
  /* dois momentos */
  .moments{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}
  .mcard{background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 36px -26px rgba(0,0,0,.3)}
  .mcard .mph{height:200px;overflow:hidden;background:#eee}
  .mcard .mph img{width:100%;height:100%;object-fit:cover;display:block}
  .mcard .mb{padding:17px 22px 20px}
  .mcard .mstep{font-size:9px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .mcard .mn{font-family:'DM Serif Display',serif;font-weight:400;font-size:21px;color:var(--navy);line-height:1.05;margin:3px 0 0}
  .mcard p{font-size:12px;color:var(--muted);line-height:1.5;margin:8px 0 0}
  .datecall{display:flex;gap:13px;align-items:flex-start;margin-top:16px;background:rgba(184,115,81,.12);border:1px solid rgba(184,115,81,.32);border-radius:14px;padding:14px 20px}
  .datecall .di{font-size:17px;line-height:1.2}
  .datecall p{font-size:12.5px;color:var(--navy);line-height:1.5;margin:0}
  .datecall p b{color:var(--orange-dark)}
  /* investimento · valor da experiencia */
  .phero{display:grid;grid-template-columns:.95fr 1.05fr;gap:38px;margin-top:22px;align-items:stretch}
  .pheroph{border-radius:18px;overflow:hidden;border:1px solid var(--line);box-shadow:0 18px 42px -26px rgba(0,0,0,.42);height:400px}
  .pheroph img{width:100%;height:100%;object-fit:cover;display:block}
  .pval{display:flex;flex-direction:column;justify-content:center}
  .pval .pct{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange-dark);font-weight:700}
  .pval .pbig{font-family:'DM Serif Display',serif;font-size:78px;color:var(--navy);line-height:.92;margin:8px 0 2px}
  .pval .pper{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--navy-soft);font-weight:700}
  .pval .pgrp{font-family:'DM Serif Display',serif;font-size:26px;color:var(--orange-dark);margin:18px 0 0;line-height:1.1}
  .pval .pgrp small{display:block;font-family:-apple-system,sans-serif;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-top:4px}
  .pval .pnote{font-size:12px;color:var(--muted);margin-top:16px;line-height:1.55;max-width:46ch}
  .pval .pnote b{color:var(--navy)}
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


# ============================ 1 · CAPA ============================
cover = f'''
  <section class="slide">
{head_block("Aniversário · entre amigas", "Fernanda", "", "Shoyu Crafts · Pinheiros")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Um aniversário para criar juntas</span>
        <h1>Um aniversário para <em>criar juntas</em></h1>
        <p class="lead">Uma experiência de <strong>cerâmica e pintura</strong> só de vocês, no <strong>Shoyu Crafts</strong>, em Pinheiros. Todo mundo na mesma mesa, colocando a mão na massa, conversando e brindando — e cada uma leva pra casa a peça que criou.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>6</b> amigas</span>
          <span class="chip">Cerâmica + Pintura</span>
          <span class="chip"><b>R$ 349</b> por pessoa</span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip">Shoyu Crafts · Pinheiros</span>
          <span class="chip">Sexta · tarde ou noite</span>
        </div>
      </div>
      <div class="cover-photo">{img("ceramica-meninas.jpg", "Amigas rindo e criando cerâmica juntas no ateliê", "center 30%")}</div>
    </div>
    {foot("Aniversário · Fernanda")}
  </section>'''

# ============================ 2 · A EXPERIÊNCIA ============================
experiencia = f'''
  <section class="slide">
{head_simple("A experiência")}
    <span class="eyebrow orange">◆ Cerâmica + Pintura</span>
    <h2>Criar algo <em>só de vocês</em></h2>
    <p class="lead">Uma experiência criativa, leve e intimista para as amigas celebrarem juntas. Sem pressa e sem precisar de experiência nenhuma — só o prazer de colocar a mão na massa, criar com as próprias mãos e levar pra casa uma lembrança feita por vocês.</p>
    <div class="bfeat">
      <div class="bphoto">{img("ceramicamodelagem.jpg", "Mãos modelando uma peça de cerâmica", "center 50%")}</div>
      <div class="bbody">
        <span class="btag">Dois momentos, uma tarde entre amigas</span>
        <h3>Da argila ao pincel</h3>
        <ul class="feat">
          <li><span class="st">1</span><b>Cerâmica</b> — cada uma modela a própria peça com as mãos.</li>
          <li><span class="st">2</span><b>Pintura</b> — depois, é hora de dar cor e personalidade à peça.</li>
          <li><span class="st">✦</span><b>Cada uma leva a sua</b> — a peça volta pronta pra casa, feita por você.</li>
        </ul>
      </div>
    </div>
    <div class="bnote" style="margin-top:16px">◆ <b>Tudo incluso:</b> espaço reservado só pras 6 · ceramista conduzindo · todos os materiais · esmaltação e queima · e a peça de cada uma pronta pra levar.</div>
    {foot("A experiência")}
  </section>'''

# ============================ 3 · COMO ACONTECE ============================
como = f'''
  <section class="slide">
{head_simple("Como acontece")}
    <span class="eyebrow orange">◆ Passo a passo</span>
    <h2>Em dois <em>momentos</em></h2>
    <p class="lead">Guiadas do começo ao fim, sem cara de aula — só vocês criando juntas, no ritmo de vocês.</p>
    <div class="moments">
      <div class="mcard">
        <div class="mph">{img("torno.jpg", "Mãos modelando argila", "center 50%")}</div>
        <div class="mb">
          <span class="mstep">Momento 1</span>
          <div class="mn">Modelagem em cerâmica</div>
          <p>Cada uma modela a própria peça com as mãos, guiada pela ceramista. A argila desacelera e a conversa flui.</p>
        </div>
      </div>
      <div class="mcard">
        <div class="mph">{img("ceramica1.jpg", "Mãos pintando uma peça de cerâmica", "center 50%")}</div>
        <div class="mb">
          <span class="mstep">Momento 2</span>
          <div class="mn">Pintura da peça</div>
          <p>Depois, é hora de dar cor: cada uma pinta a própria peça do seu jeito, com calma e liberdade.</p>
        </div>
      </div>
    </div>
    <div class="bnote" style="margin-top:16px">◆ No fim, a gente <b>esmalta, queima e devolve</b> a peça de cada uma pronta pra levar pra casa. 🤍</div>
    {foot("Como acontece")}
  </section>'''

# ============================ 4 · A VIBE ============================
vibe = f'''
  <section class="slide">
{head_simple("A vibe")}
    <span class="eyebrow orange">◆ Entre amigas</span>
    <h2>Criatividade, conversa <em>e celebração</em></h2>
    <p class="lead">Luz baixa, playlist boa e a mesa só de vocês. A cerâmica desacelera, a conversa flui e o aniversário vira um momento que fica — entre amigas, com a mão na massa.</p>
    <div class="egrid">
      <figure>{img("casalmodelagemceramica.jpg", "Mãos criando cerâmica lado a lado", "center 50%")}<figcaption>Mão na massa, juntas</figcaption></figure>
      <figure>{img("ceramicacool.jpg", "Peças de cerâmica pintadas à mão", "center 50%")}<figcaption>Cada peça do seu jeito</figcaption></figure>
      <figure>{img("pinturapratoceramica.jpg", "Peça de cerâmica pintada à mão", "center 50%")}<figcaption>Pra levar pra casa</figcaption></figure>
    </div>
    <div class="bnote" style="margin-top:16px">◆ Um encontro leve, feminino e especial — mais que uma oficina, uma comemoração entre amigas. ✨</div>
    {foot("A vibe")}
  </section>'''

# ============================ 5 · O ESPAÇO ============================
espaco = f'''
  <section class="slide">
{head_simple("O espaço")}
    <span class="eyebrow orange">◆ Shoyu Crafts · Pinheiros</span>
    <h2>Tudo acontece <em>no ateliê</em></h2>
    <p class="lead">A experiência é realizada no <strong>Shoyu Crafts</strong>, um ateliê acolhedor e intimista em Pinheiros. Um espaço só de vocês, com tudo montado — vocês só chegam e aproveitam.</p>
    <div class="bfeat">
      <div class="bphoto">{img("ceramica2.jpg", "Peças de cerâmica autorais, feitas à mão", "center 50%")}</div>
      <div class="bbody">
        <span class="btag">Shoyu Crafts · Pinheiros</span>
        <h3>Um cantinho só de vocês</h3>
        <ul class="feat">
          <li><span class="st">✓</span><b>Espaço reservado</b> pras 6 amigas</li>
          <li><span class="st">✓</span><b>Ceramista</b> conduzindo a experiência</li>
          <li><span class="st">✓</span><b>Todos os materiais</b> e a queima inclusos</li>
          <li><span class="st">✓</span><b>Ambiente acolhedor</b>, feminino e intimista</li>
        </ul>
      </div>
    </div>
    <div class="bnote" style="margin-top:16px">◆ Localização em <b>Pinheiros</b>, fácil pra todo mundo — a Elarah leva a produção e cuida de cada detalhe.</div>
    {foot("O espaço · Shoyu Crafts")}
  </section>'''

# ============================ 6 · INVESTIMENTO ============================
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>A experiência de <em>cerâmica e pintura</em></h2>
    <div class="phero">
      <div class="pheroph">{img("ceramicamodelagem.jpg", "Mãos modelando uma peça de cerâmica", "center 50%")}</div>
      <div class="pval">
        <span class="pct">Shoyu Crafts · Pinheiros</span>
        <div class="pbig">R$ 349</div>
        <span class="pper">por pessoa</span>
        <div class="pgrp">R$ 2.094<small>o grupo de 6 amigas</small></div>
        <p class="pnote">Inclui a experiência completa de <b>cerâmica e pintura</b>: espaço reservado, ceramista conduzindo, todos os materiais, esmaltação e queima — e a peça de cada uma pronta pra levar pra casa.</p>
      </div>
    </div>
    <p class="fineprint">Valor da experiência de cerâmica e pintura, turma privada de 6 amigas, no Shoyu Crafts (Pinheiros): <b>R$ 349 por pessoa · R$ 2.094 para o grupo</b> — inclui espaço reservado, ceramista, todos os materiais, esmaltação e queima, e a peça de cada uma. Disponibilidade às sextas-feiras, à tarde ou à noite; o horário exato é confirmado no momento da reserva, conforme a disponibilidade do ateliê.</p>
    {foot("Investimento")}
  </section>'''

# ============================ 7 · PRÓXIMOS PASSOS ============================
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Simples e sob medida</span>
    <h2>É só <em>escolher a data</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pra comemoração ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="num">01</div><h3>Escolham a data</h3><p>Sexta-feira, à tarde ou à noite — a que melhor combina com as 6.</p></div>
      <div class="infocard"><div class="num">02</div><h3>A gente organiza tudo</h3><p>Ceramista, materiais e estrutura — reservamos o Shoyu Crafts pra vocês.</p></div>
      <div class="infocard"><div class="num">03</div><h3>Cada uma leva a peça</h3><p>A gente esmalta, queima e devolve a peça de cada uma pronta.</p></div>
    </div>
    <div class="datecall">
      <span class="di">🗓️</span>
      <p>Disponibilidade às <b>sextas-feiras, à tarde ou à noite</b>. O horário exato é confirmado no momento da reserva, conforme a disponibilidade do ateliê.</p>
    </div>
    <div class="quote" style="margin-top:18px">
      Fernanda, me confirma a <strong>data</strong> que faz mais sentido que eu seguro a agenda do Shoyu Crafts e organizo cada detalhe pra vocês. 🤍<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = '<div class="deck">\n' + cover + experiencia + como + vibe + espaco + investimento + proximos + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/aniversario-fernanda-shoyu.html"
open(out, "w", encoding="utf-8").write(html)
# guarda: nenhuma mencao ao Agora deve restar
assert "agora" not in html.lower(), "ERRO: sobrou mencao/foto do Agora"
print("wrote", out, "| slides:", html.count('<section class="slide">'), "| sem Agora OK")
