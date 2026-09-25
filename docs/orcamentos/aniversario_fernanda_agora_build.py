# Proposta Elarah · Aniversario Fernanda · Ceramica no Agora · 5 amigas · 26/09 · 17:30 · Pinheiros
# Racional + layout do deck Ginger (team_building_ginger_agora): capa, experiencia+incluso, atmosfera (egrid 6 fotos reais Agora),
# investimento em planos (base R$494 + menu -> tiers 585/637/689), proximos passos. Tom aniversario entre amigas.
# Fotos reais do Agora (agora-*.jpg) do deck Ginger. Paleta terracota/vinho (feminina/elegante).
# Valores finais com margem Elarah embutida; NUNCA mostrar custo de fornecedor/comissao.
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
  .egrid figure{margin:0;border-radius:14px;overflow:hidden;position:relative;height:205px;border:1px solid rgba(60,31,40,.10);box-shadow:0 12px 30px -20px rgba(0,0,0,.4)}
  .egrid img{width:100%;height:100%;object-fit:cover;display:block}
  .egrid figcaption{position:absolute;left:0;right:0;bottom:0;padding:24px 12px 10px;color:#fff;font-size:11.5px;font-weight:600;background:linear-gradient(to top,rgba(32,16,22,.86),transparent)}
  .subh{font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin:20px 0 0}
  .foodrow{display:flex;gap:22px;align-items:center;margin-top:12px;flex-wrap:wrap}
  .foodsq{flex:0 0 190px;aspect-ratio:1/1;border-radius:16px;overflow:hidden;border:1px solid var(--line);box-shadow:0 14px 34px -22px rgba(0,0,0,.34)}
  .foodsq img{width:100%;height:100%;object-fit:cover;display:block}
  .foodrow .lead{flex:1;min-width:270px;margin:0}
  .tiers{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:16px}
  .tier{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px 16px 16px;display:flex;flex-direction:column;box-shadow:0 12px 30px -22px rgba(0,0,0,.28);position:relative}
  .tier.hl{border:2px solid var(--navy)}
  .tier .tname{font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .tier .tprice{font-family:'DM Serif Display',serif;font-size:30px;color:var(--navy);margin:6px 0 1px;line-height:1}
  .tier .tbase{font-size:10px;color:var(--muted);font-weight:600;margin-bottom:10px}
  .tier p{font-size:11.5px;color:var(--ink);line-height:1.4;margin:0}
  .tier .tag{position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:var(--navy);color:#fff;font-size:8px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:4px 12px;border-radius:999px;white-space:nowrap}
  .addons{font-size:12px;color:var(--navy-soft);line-height:1.5;margin-top:8px}
  .addons b{color:var(--navy)}
  .datecall{display:flex;gap:13px;align-items:flex-start;margin-top:16px;background:rgba(184,115,81,.12);border:1px solid rgba(184,115,81,.32);border-radius:14px;padding:14px 20px}
  .datecall .di{font-size:17px;line-height:1.2}
  .datecall p{font-size:12.5px;color:var(--navy);line-height:1.5;margin:0}
  .datecall p b{color:var(--orange-dark)}
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
{head_block("Aniversário · cerâmica", "Fernanda", "", "Agora · Pinheiros · 26/09")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Um aniversário no ateliê</span>
        <h1>Um aniversário para <em>criar juntas</em></h1>
        <p class="lead">Uma tarde de <strong>cerâmica</strong> só de vocês, no <strong>Agora</strong>, em Pinheiros. Sem pressa: todo mundo na mesma mesa, criando com as próprias mãos, conversando e brindando o aniversário — e cada uma leva pra casa a peça que fez.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>5</b> amigas</span>
          <span class="chip">Cerâmica</span>
          <span class="chip">A partir de <b>R$ 494</b></span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip"><b>26/09</b></span>
          <span class="chip">A partir das <b>17:30</b></span>
        </div>
      </div>
      <div class="cover-photo">{img("agora-mesa.jpg", "Mesa de cerâmica montada no Agora, com velas e flores", "center 50%")}</div>
    </div>
    {foot("Aniversário · Fernanda")}
  </section>'''

# ============================ 2 · A EXPERIÊNCIA (+ incluso) ============================
experiencia = f'''
  <section class="slide">
{head_simple("A experiência")}
    <span class="eyebrow orange">◆ Cerâmica · modelagem à mão</span>
    <h2>Cada uma cria a <em>própria peça</em></h2>
    <p class="lead">Guiadas por uma ceramista, vocês modelam as próprias peças — sem precisar ter experiência nenhuma. A argila desacelera, aproxima a conversa, e cada uma leva pra casa algo feito à mão, esmaltado e queimado, pronto pra durar.</p>
    <div class="bfeat">
      <div class="bphoto">{img("ceramicamodelagem.jpg", "Mãos modelando uma peça de cerâmica", "center 50%")}</div>
      <div class="bbody">
        <span class="btag">Cerca de 3h · a partir das 17:30</span>
        <h3>Da argila à peça pronta</h3>
        <ul class="feat">
          <li><span class="st">1</span><b>Chegada &amp; boas-vindas</b> — o espaço preparado só pra vocês, mesa posta e playlist.</li>
          <li><span class="st">2</span><b>Mão na argila</b> — cada uma cria a própria peça, com a ceramista ao lado.</li>
          <li><span class="st">3</span><b>Finalização</b> — a gente esmalta, queima e devolve as peças prontas depois.</li>
          <li><span class="st">4</span><b>Celebração</b> — tempo pra conversar, brindar e aproveitar o aniversário.</li>
        </ul>
      </div>
    </div>
    <p class="subh">Tudo incluso, sem surpresa</p>
    <ul class="checks">
      <li><span class="ck">✓</span><b>Espaço exclusivo</b> pras 5 amigas</li>
      <li><span class="ck">✓</span><b>Ceramista</b> conduzindo</li>
      <li><span class="ck">✓</span><b>Todos os materiais</b> inclusos</li>
      <li><span class="ck">✓</span><b>Queima</b> (peça devolvida pronta)</li>
      <li><span class="ck">✓</span><b>Mesas e ambientação</b> montadas</li>
      <li><span class="ck">✓</span><b>Playlist, velas</b> e o clima</li>
      <li><span class="ck">✓</span><b>Café, chá e água</b> à vontade</li>
      <li><span class="ck">✓</span>Cada uma <b>leva a própria peça</b></li>
    </ul>
    {foot("A experiência")}
  </section>'''

# ============================ 3 · A ATMOSFERA ============================
atmosfera = f'''
  <section class="slide">
{head_simple("A atmosfera")}
    <span class="eyebrow orange">◆ Cerâmica de verdade</span>
    <h2>O clima que espera <em>vocês</em></h2>
    <p class="lead">Mesa posta com velas e flores, mãos na argila e o grupo criando junto — luz baixa, playlist boa e a sensação de estar num lugar especial. É essa a atmosfera do Agora.</p>
    <div class="egrid">
      <figure>{img("agora-pintura.jpg", "Amigas criando cerâmica juntas no Agora", "center 40%")}<figcaption>Mão na massa, juntas</figcaption></figure>
      <figure>{img("agora-ceramica.jpg", "Modelagem de cerâmica à mão no Agora", "center 40%")}<figcaption>Modelagem à mão</figcaption></figure>
      <figure>{img("agora-selfie.jpg", "Amigas rindo durante a experiência", "center 40%")}<figcaption>Risada garantida</figcaption></figure>
      <figure>{img("torno.jpg", "Mãos modelando argila", "center 50%")}<figcaption>Argila nas mãos</figcaption></figure>
      <figure>{img("ceramica2.jpg", "Peças de cerâmica autorais", "center 50%")}<figcaption>As peças que ficam</figcaption></figure>
      <figure>{img("agora-grupo.jpg", "Amigas reunidas à mesa no Agora", "center 50%")}<figcaption>O grupo à mesa</figcaption></figure>
    </div>
    <div class="bnote" style="margin-top:16px">◆ <b>Tudo incluso:</b> espaço exclusivo · ceramista conduzindo · todos os materiais · queima da cerâmica · mesas e ambientação · playlist e velas · café, chá e água — e cada uma leva a própria peça.</div>
    {foot("A atmosfera do Agora")}
  </section>'''

# ============================ 4 · OS PLANOS ============================
investimento = f'''
  <section class="slide">
{head_simple("Os planos")}
    <span class="eyebrow orange">◆ A experiência + o menu</span>
    <h2>Escolham o <em>plano</em></h2>
    <div class="foodrow">
      <div class="foodsq">{img("menu-coffee.jpg", "Finger food e doces do menu", "center 42%")}</div>
      <p class="lead">A experiência de cerâmica no Agora — <strong>espaço exclusivo só de vocês</strong>, o momento de criar e o café — por <strong>R$ 494 por pessoa</strong>. É só escolher o menu que completa a comemoração:</p>
    </div>
    <div class="tiers">
      <div class="tier">
        <span class="tname">Tábua de boas-vindas</span>
        <span class="tprice">R$ 585</span>
        <span class="tbase">base R$ 494 + R$ 91</span>
        <p>Queijos, embutidos, pães artesanais, conservas e frutas.</p>
      </div>
      <div class="tier hl">
        <span class="tag">Mais escolhido</span>
        <span class="tname">Finger food</span>
        <span class="tprice">R$ 637</span>
        <span class="tbase">base R$ 494 + R$ 143</span>
        <p>5 bites quentes e frios, servidos ao longo do encontro.</p>
      </div>
      <div class="tier">
        <span class="tname">Menu completo</span>
        <span class="tprice">R$ 689</span>
        <span class="tbase">base R$ 494 + R$ 195</span>
        <p>Finger food + doce da casa + café.</p>
      </div>
    </div>
    <p class="subh">Ainda dá pra somar</p>
    <p class="addons"><b>Welcome drink</b> R$ 52/pessoa — espumante ou drink autoral sem álcool + água aromatizada. &nbsp;·&nbsp; <b>Serviço de bebidas</b> R$ 32,50/pessoa — vocês levam as bebidas e o espaço cuida de taças, gelo e serviço.</p>
    <p class="fineprint">Valores por pessoa, turma privada de 5, no Agora (Pinheiros). Base R$ 494 (espaço exclusivo só do grupo, a experiência de cerâmica e o café) — R$ 2.470 para as 5 — + menu à escolha: Tábua R$ 91, Finger food R$ 143 ou Menu completo R$ 195 por pessoa. Add-ons: welcome drink R$ 52 · serviço de bebidas R$ 32,50 por pessoa. Aniversário em 26/09, a partir das 17:30. Data e horário sujeitos à disponibilidade de agenda, com confirmação imediata devido à proximidade da data.</p>
    {foot("Os planos")}
  </section>'''

# ============================ 5 · PRÓXIMOS PASSOS ============================
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Simples e sob medida</span>
    <h2>É só <em>escolher</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pra tarde ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="num">01</div><h3>Escolham o plano</h3><p>A experiência + o menu que fecha a comemoração das 5.</p></div>
      <div class="infocard"><div class="num">02</div><h3>A gente leva tudo</h3><p>Ceramista, materiais e estrutura — chega tudo montado no Agora.</p></div>
      <div class="infocard"><div class="num">03</div><h3>Cada uma leva a peça</h3><p>A gente esmalta, queima e devolve a peça de cada uma pronta.</p></div>
    </div>
    <div class="datecall">
      <span class="di">⚡</span>
      <p>Como o aniversário é já em <b>26/09, a partir das 17:30</b>, a disponibilidade da agenda está sujeita à <b>confirmação imediata</b> — quanto antes fecharmos, melhor pra garantir a data e o horário.</p>
    </div>
    <div class="quote" style="margin-top:18px">
      Fernanda, me confirma o <strong>plano</strong> que faz mais sentido que eu seguro a agenda do Agora e organizo cada detalhe pra vocês. 🤍<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = '<div class="deck">\n' + cover + experiencia + atmosfera + investimento + proximos + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/aniversario-fernanda-agora.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
