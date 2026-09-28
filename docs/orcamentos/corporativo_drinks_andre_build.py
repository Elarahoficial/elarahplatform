# Proposta Elarah · Corporativo André · Drinks + comidinhas · 8 a 11 pessoas · ~2h30 · no espaco do cliente
# Padrao editorial corporativo Elarah (base NBCU/BFA — verde/terracota). Sofisticado, contemporaneo, neutro.
# Evento no espaco do cliente (Elarah leva e monta tudo). 5 experiencias de drinks em cards visuais.
# Valores FINAIS ao cliente: Caipirinha 489 · Gin 569 · Drinks com Café 569 · Mocktail 619 · Cerveja 619.
# NUNCA mostrar custo de fornecedor/comissao/margem. Fotos reais existentes (sem inventar imagens/valores).
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

# paleta editorial BFA: off-white · verde profundo · terracota · argila
reps = {
    "--orange:#B08D4C;": "--orange:#A9663F;",
    "--orange-dark:#8A6D34;": "--orange-dark:#8A4F30;",
    "--navy:#12362B;": "--navy:#26332A;",
    "--navy-soft:#3A5A4E;": "--navy-soft:#4A5A4E;",
    "--blue-accent:#B08D4C;": "--blue-accent:#A9663F;",
    "#EFF3EE": "#F1F3EB", "#DCE8E1": "#DEE6D6", "#CBB06E": "#C79A72",
    "rgba(176,141,76,.24)": "rgba(169,102,63,.24)",
    "rgba(176,141,76,.26)": "rgba(169,102,63,.28)",
    "rgba(176,141,76,.10)": "rgba(169,102,63,.10)",
    "rgba(18,54,43,.16)": "rgba(38,51,42,.16)",
    "rgba(10,28,22,.86)": "rgba(20,28,22,.86)",
    "rgba(10,28,22,.85)": "rgba(20,28,22,.85)",
    "rgba(10,28,22,.82)": "rgba(20,28,22,.82)",
}
for a, b in reps.items():
    head = head.replace(a, b)

xcss = '''
  .gstrip{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:18px}
  .gstrip figure{margin:0;border-radius:16px;overflow:hidden;position:relative;height:320px;border:1px solid var(--line);box-shadow:0 16px 34px -22px rgba(0,0,0,.4)}
  .gstrip img{width:100%;height:100%;object-fit:cover;display:block}
  .gstrip figcaption{position:absolute;left:0;right:0;bottom:0;padding:26px 14px 12px;color:#fff;font-size:12.5px;font-weight:600;letter-spacing:.02em;background:linear-gradient(to top,rgba(20,28,22,.86),transparent)}
  /* 5 cards de drinks (3 + 2) */
  .dgrid{display:flex;flex-wrap:wrap;justify-content:center;gap:16px;margin-top:18px}
  .dc{width:calc(33.333% - 11px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 14px 32px -26px rgba(0,0,0,.32)}
  .dc .dph{height:146px;overflow:hidden;background:#eee}
  .dc .dph img{width:100%;height:100%;object-fit:cover;display:block}
  .dc .db{padding:13px 16px 15px;display:flex;flex-direction:column;flex:1}
  .dc .dn{font-family:'DM Serif Display',serif;font-weight:400;font-size:19px;color:var(--navy);line-height:1.03}
  .dc .dtag{font-size:8.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--orange-dark);font-weight:700;margin-top:5px}
  .dc .dd{font-size:11px;color:var(--muted);line-height:1.45;margin-top:8px;flex:1}
  .dc .dpr{margin-top:11px;padding-top:10px;border-top:1px solid var(--line);font-family:'DM Serif Display',serif;font-size:20px;color:var(--orange-dark);line-height:1}
  .dc .dpr small{font-family:-apple-system,sans-serif;font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-left:5px}
  /* formato */
  .fmt{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:22px}
  .fc{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px 18px;box-shadow:0 12px 30px -24px rgba(0,0,0,.28)}
  .fc .fi{font-size:20px;line-height:1}
  .fc .ft{font-family:'DM Serif Display',serif;font-weight:400;font-size:19px;color:var(--navy);line-height:1.05;margin:9px 0 4px}
  .fc .fs{font-size:11px;color:var(--muted);line-height:1.4}
  /* investimento */
  .itable{width:100%;border-collapse:collapse;margin-top:18px;font-family:'DM Sans'}
  .itable th,.itable td{padding:14px 16px;border-bottom:1px solid var(--line);text-align:left;vertical-align:middle}
  .itable thead th{font-size:10.5px;color:var(--navy);font-weight:700;border-bottom:2px solid var(--navy);text-transform:uppercase;letter-spacing:.06em}
  .itable th.r,.itable td.r{text-align:right;white-space:nowrap}
  .itable td.nm b{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy)}
  .itable td.cm{font-size:11.5px;color:var(--muted)}
  .itable td.val{font-family:'DM Serif Display',serif;font-size:21px;color:var(--orange-dark);text-align:right;white-space:nowrap}
  .itable tbody tr:last-child td{border-bottom:none}
  .num{font-family:'DM Serif Display',serif;color:var(--orange);font-size:24px;line-height:1}
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


def dcard(name, tag, desc, price, src, alt, pos="center 50%"):
    return (f'<div class="dc"><div class="dph">{img(src, alt, pos)}</div>'
            f'<div class="db"><div class="dn">{name}</div><div class="dtag">{tag}</div>'
            f'<div class="dd">{desc}</div>'
            f'<div class="dpr">R$ {price}<small>por pessoa</small></div></div></div>')


# ============================ 1 · CAPA ============================
cover = f'''
  <section class="slide">
{head_block("Experiência corporativa", "Drinks", "& confraternização", "No espaço de vocês")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência corporativa privada</span>
        <h1>Drinks, Sabores <em>&amp; Conexões</em></h1>
        <p class="lead">Drinks e comidinhas para reunir o time — o grupo aprende, prova e brinda junto. Menos reunião, mais integração: descoberta, conversa e confraternização.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>8 a 11</b> pessoas</span>
          <span class="chip">≈ <b>2h30</b></span>
          <span class="chip">No seu espaço</span>
        </div>
      </div>
      <div class="cover-photo">{img("andre-workshop.jpg", "Grupo em uma experiência de drinks, preparando coquetéis juntos", "center 35%")}</div>
    </div>
    {foot("Drinks & confraternização")}
  </section>'''

# ============================ 2 · CONCEITO ============================
conceito = f'''
  <section class="slide">
{head_simple("O conceito")}
    <span class="eyebrow orange">◆ Mais que uma aula de drinks</span>
    <h2>Um encontro para <em>criar e brindar junto</em></h2>
    <p class="lead">Em torno da mesa, o time descobre técnicas, prova, conversa e relaxa. Cada experiência é uma desculpa boa para integrar o grupo — com um profissional conduzindo e comidinhas para acompanhar do começo ao fim.</p>
    <div class="bfeat">
      <div class="bphoto">{img("pizza-brinde.jpg", "Grupo brindando junto à mesa", "center 50%")}</div>
      <div class="bbody">
        <span class="btag">Integração, descoberta &amp; confraternização</span>
        <h3>Do primeiro gole à última risada</h3>
        <p style="font-size:13px;color:var(--muted);line-height:1.6;margin-top:12px">Uma pausa na rotina corporativa que aproxima o time de verdade — mão na coqueteleira, sabores para dividir e aquele clima leve que só um bom brinde cria.</p>
      </div>
    </div>
    {foot("O conceito")}
  </section>'''

# ============================ ATMOSFERA (encontro & atmosfera) ============================
atmosfera = f'''
  <section class="slide">
{head_simple("O encontro & a atmosfera")}
    <span class="eyebrow orange">◆ O encontro &amp; a atmosfera</span>
    <h2>Um encontro que acontece <em>em torno da mesa</em></h2>
    <p class="lead">Drinks sendo preparados, comidinhas à mesa e tempo para conversar. Uma experiência leve e interativa, pensada para reunir o grupo, experimentar novos sabores e aproveitar o momento juntos.</p>
    <div class="vibe">
      <figure>{img("andre-preparo.jpg", "Preparo de drinks com utensílios de bar", "center 45%")}<figcaption>Drinks em preparo</figcaption></figure>
      <figure>{img("andre-mesa-drinks.jpg", "Mesa da experiência com coqueteleiras e ingredientes", "center 40%")}<figcaption>Experiência à mesa</figcaption></figure>
      <figure>{img("andre-brinde-drinks.jpg", "Taças e drinks servidos em um brinde", "center 45%")}<figcaption>Sabores &amp; brindes</figcaption></figure>
      <figure>{img("menu-coffee.jpg", "Petiscos e finger food bem apresentados", "center 50%")}<figcaption>Petiscos para compartilhar</figcaption></figure>
      <figure>{img("aula-grupo.jpg", "Grupo corporativo reunido, conversando com taças", "center 50%")}<figcaption>Momento de conexão</figcaption></figure>
      <figure>{img("drinkspetisco.jpg", "Detalhe da finalização de um coquetel", "center 50%")}<figcaption>Condução da experiência</figcaption></figure>
    </div>
    <div class="bnote" style="margin-top:16px">◆ <b>Experiência completa:</b> condução do workshop · ingredientes e bebidas · petiscos · degustação · produção Elarah.</div>
    {foot("O encontro & a atmosfera")}
  </section>'''

# ============================ NO SEU ESPAÇO ============================
espaco = f'''
  <section class="slide">
{head_simple("No espaço de vocês")}
    <span class="eyebrow orange">◆ A Elarah vai até você</span>
    <h2>No seu espaço, <em>montamos tudo</em></h2>
    <p class="lead">A experiência acontece onde for melhor para o time — na empresa, num salão ou onde vocês preferirem. A gente leva tudo, monta o cenário e cuida de cada detalhe. Vocês só reúnem o grupo.</p>
    <div class="bfeat">
      <div class="bphoto">{img("drinkspetisco.jpg", "Balcão montado com drinks e petiscos", "center 50%")}</div>
      <div class="bbody">
        <span class="btag">A gente leva &amp; monta</span>
        <h3>É só receber o time</h3>
        <ul class="feat">
          <li><span class="st">✓</span><b>Profissional conduzindo</b> a experiência</li>
          <li><span class="st">✓</span><b>Estrutura e utensílios</b> montados no local</li>
          <li><span class="st">✓</span><b>Drinks e insumos</b> de cada experiência</li>
          <li><span class="st">✓</span><b>Comidinhas</b> para acompanhar</li>
          <li><span class="st">✓</span><b>Montagem e desmontagem</b> por conta da Elarah</li>
        </ul>
      </div>
    </div>
    <div class="bnote" style="margin-top:16px">◆ Precisa apenas de um <b>local que comporte o grupo</b>, com um ponto de água e energia por perto — do resto, cuidamos nós.</div>
    {foot("No espaço de vocês")}
  </section>'''

# ============================ 4 · EXPERIÊNCIAS DE DRINKS ============================
experiencias = f'''
  <section class="slide">
{head_simple("As experiências")}
    <span class="eyebrow orange">◆ Cinco caminhos</span>
    <h2>Escolham a experiência <em>do time</em></h2>
    <p class="lead">Cinco formatos, todos com comidinhas inclusas, profissional conduzindo e muita troca. Diferentes maneiras de transformar o encontro em confraternização.</p>
    <div class="dgrid">
      {dcard("Workshop Caipirinha Brasileira", "com mini salgados", "O clássico brasileiro: técnica, cortes, equilíbrio de sabores e variações — com prática e degustação.", "489", "andre-caipirinha.jpg", "Caipirinha com limão e gelo", "center 50%")}
      {dcard("Descobrindo o Universo do Gin", "com mini salgados", "Do gin tônica perfeito ao highball: história, rótulos, técnicas e combinações, degustando diferentes gins.", "569", "andre-gin.jpg", "Preparo de gin tônica com botânicos", "center 45%")}
      {dcard("Coffee &amp; Cocktails", "com pães de queijo &amp; acompanhamentos", "Coquetelaria encontra o café: fundamentos, preparo e apresentação de bebidas, com degustação.", "569", "andre-coffee-cocktail.jpg", "Coquetel de café sendo servido", "center 50%")}
      {dcard("Mocktail Experience", "com tábua de frios &amp; queijos curados", "Coquetelaria sem álcool: equilíbrio, xaropes e releituras de clássicos como Mojito e Espresso Martini.", "619", "andre-mocktail.jpg", "Drinks sem álcool coloridos", "center 50%")}
      {dcard("Jornada pela Cerveja Artesanal", "com salgadinhos", "Estilos, ingredientes e análise sensorial: degustação técnica guiada de quatro cervejas.", "619", "andre-cerveja.jpg", "Brinde com cervejas e petiscos", "center 40%")}
    </div>
    {foot("As experiências")}
  </section>'''

# ============================ 5 · FORMATO ============================
# ============================ 6 · FORMATO & INVESTIMENTO ============================
investimento = f'''
  <section class="slide">
{head_simple("Formato & investimento")}
    <span class="eyebrow orange">◆ Formato &amp; investimento</span>
    <h2>O formato <em>&amp; os valores</em></h2>
    <p class="lead">Turma privada de 8 a 11, cerca de 2h30, no espaço de vocês. Cada experiência já inclui a condução profissional, a estrutura e as comidinhas.</p>
    <div class="chips" style="margin-top:14px">
      <span class="chip"><b>8 a 11</b> pessoas</span>
      <span class="chip">≈ <b>2h30</b></span>
      <span class="chip">No seu espaço</span>
      <span class="chip">Drinks + comidinhas</span>
    </div>
    <table class="itable">
      <thead><tr>
        <th>Experiência</th>
        <th>Comidinhas</th>
        <th class="r">Valor por pessoa</th>
      </tr></thead>
      <tbody>
        <tr><td class="nm"><b>Workshop Caipirinha Brasileira</b></td><td class="cm">Mini salgados</td><td class="val">R$ 489</td></tr>
        <tr><td class="nm"><b>Descobrindo o Universo do Gin</b></td><td class="cm">Mini salgados</td><td class="val">R$ 569</td></tr>
        <tr><td class="nm"><b>Coffee &amp; Cocktails</b></td><td class="cm">Pães de queijo e acompanhamentos</td><td class="val">R$ 569</td></tr>
        <tr><td class="nm"><b>Mocktail Experience</b> · sem álcool</td><td class="cm">Tábua de frios e queijos curados</td><td class="val">R$ 619</td></tr>
        <tr><td class="nm"><b>Jornada pela Cerveja Artesanal</b></td><td class="cm">Salgadinhos</td><td class="val">R$ 619</td></tr>
      </tbody>
    </table>
    <p class="fineprint">Valores por pessoa, para turma privada de 8 a 11 participantes, no espaço de vocês, com duração aproximada de 2h30. Cada experiência inclui profissional conduzindo, estrutura montada no local e as comidinhas indicadas. A Elarah emite nota fiscal e alinha as condições de pagamento com o financeiro.</p>
    {foot("Investimento")}
  </section>'''

# ============================ 7 · PRÓXIMOS PASSOS ============================
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Como seguimos</span>
    <h2>É só <em>escolher e brindar</em></h2>
    <p class="lead">A gente cuida de toda a produção pro encontro ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="num">01</div><h3>Escolham a experiência</h3><p>Definimos juntos o formato de drinks que mais combina com o time.</p></div>
      <div class="infocard"><div class="num">02</div><h3>Confirmamos a data</h3><p>Reservamos a agenda e combinamos o espaço de vocês para o encontro.</p></div>
      <div class="infocard"><div class="num">03</div><h3>A gente monta tudo</h3><p>Levamos profissional, estrutura e comidinhas até o local — o time só chega e aproveita.</p></div>
    </div>
    <div class="quote" style="margin-top:22px">
      André, me confirma a <strong>experiência</strong> e a data que a gente organiza tudo e monta no espaço de vocês. ✦<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n'
        + cover + conceito + atmosfera + espaco + experiencias + investimento + proximos + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/corporativo-drinks-andre.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
