# Proposta Segatta Neuropsicologia · Corporativo · Celebracao 100 mil seguidores (Instagram)
# 8 pessoas · sexta de outubro (a definir) · tarde · Perdizes, SP
# Base: modelo Vi Ardore (vi_ardore_100k_build.py) + componentes Elarah. Mesma estrutura/layout.
# Tom adaptado: acolhedor, elegante, humano, leve, profissional (neuropsicologia) — sem excesso festivo.
# Investimento condensado num unico slide (tabela 3x3). Valores "A confirmar / em curadoria".
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

xcss = '''
  /* cards de experiencia / espaco */
  .exp3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:22px}
  .exc{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:0 14px 32px -24px rgba(0,0,0,.3);display:flex;flex-direction:column}
  .exc figure{margin:0;height:174px;overflow:hidden;position:relative}
  .exc figure img{width:100%;height:100%;object-fit:cover;display:block}
  .exc .exb{padding:16px 18px 18px;display:flex;flex-direction:column;flex:1}
  .exc .exn{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .exc .exchip{position:absolute;top:11px;right:11px;background:var(--navy);color:#fff;font-size:8px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:4px 10px;border-radius:999px}
  .exc h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:20px;color:var(--navy);margin:4px 0 6px;line-height:1.06}
  .exc p{font-size:12px;color:var(--muted);line-height:1.5}
  /* investimento · tabela 3 experiencias x 3 niveis */
  .imatrix{margin-top:22px;border:1px solid var(--line);border-radius:18px;overflow:hidden;background:var(--card);box-shadow:0 16px 40px -28px rgba(0,0,0,.34)}
  .imrow{display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr}
  .imrow + .imrow{border-top:1px solid var(--line)}
  .imcell{padding:15px 18px;display:flex;flex-direction:column;justify-content:center}
  .imcell + .imcell{border-left:1px solid var(--line)}
  .imcol-hl{background:rgba(18,54,43,.045)}
  .imhead{background:#F3EFE7}
  .imhead .imcol-hl{background:rgba(18,54,43,.075)}
  .imhead .leg{font-size:9px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--muted)}
  .imhead .tname{font-size:11px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .imhead .imcol-hl .tname{color:var(--navy)}
  .imhead .tdesc{font-size:10px;color:var(--muted);line-height:1.45;margin-top:7px}
  .imtag{background:var(--navy);color:#fff;font-size:7.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:3px 8px;border-radius:999px}
  .imrow .rn{font-family:'DM Serif Display',serif;font-size:19px;color:var(--navy);line-height:1.05}
  .imrow .rs{font-size:10.5px;color:var(--muted);margin-top:3px}
  .imprice{font-family:'DM Serif Display',serif;font-size:17px;color:var(--muted);letter-spacing:.01em}
  .imprice.on{color:var(--navy)}
  .imper{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-top:3px}
  /* opcionais · pra levar de lembranca (layout Ginger) */
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
  .ophduo{display:grid;grid-template-columns:1fr 1fr;gap:2px;background:var(--line);border-bottom:1px solid var(--line);aspect-ratio:1/1}
  .ophduo .sq{overflow:hidden;position:relative;background:#eee}
  .ophduo .sq img{width:100%;height:100%;object-fit:cover;display:block}
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


def excard(n, src, alt, name, desc, pos="center 50%", chip=None):
    chiph = f'<span class="exchip">{chip}</span>' if chip else ''
    return (f'<div class="exc"><figure>{img(src, alt, pos)}{chiph}</figure>'
            f'<div class="exb"><span class="exn">{n}</span><h3>{name}</h3><p>{desc}</p></div></div>')


def mrow(name, sub, cells):
    return (f'<div class="imrow"><div class="imcell"><div class="rn">{name}</div><div class="rs">{sub}</div></div>'
            f'<div class="imcell">{cells[0]}</div><div class="imcell imcol-hl">{cells[1]}</div><div class="imcell">{cells[2]}</div></div>')


TBD = '<span class="imprice">A confirmar</span>'
P416 = '<span class="imprice on">R$ 416</span><span class="imper">por pessoa</span>' 


def optcard(src, alt, kicker, title, bullets, note, pos="center 50%"):
    lis = "".join(f"<li>{b}</li>" for b in bullets)
    return (f'<div class="optc"><figure>{img(src, alt, pos)}</figure>'
            f'<div class="optb"><span class="optn">{kicker}</span><h3>{title}</h3>'
            f'<ul>{lis}</ul><div class="optnote">{note}</div></div></div>')


PROOF = "Experiências criativas já realizadas para times de empresas como <b>Natura</b>, <b>Riachuelo</b> e <b>Samsung</b>"

# ============================ 1 · CAPA ============================
cover = f'''
  <section class="slide">
{head_block("Proposta de experiência · Corporativo", "Segatta", "Neuropsicologia", "Celebração dos 100 mil")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Segatta Neuropsicologia</span>
        <h1>Um marco que merece <em>ser celebrado</em></h1>
        <p class="lead">100 mil seguidores é uma conquista e tanto — e o motivo perfeito para reunir o time e comemorar juntos com uma experiência criativa e especial.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>100 mil</b> seguidores</span>
          <span class="chip"><b>Perdizes</b> · SP</span>
          <span class="chip">Sexta de <b>outubro</b> · a definir</span>
          <span class="chip"><b>8 pessoas</b> · tarde</span>
        </div>
      </div>
      <div class="cover-photo">{img("bfa-grupo1.webp", "Time reunido à mesa criando juntos, sorrindo, luz natural", "center 32%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Segatta Neuropsicologia · Celebração 100 mil")}
  </section>'''

# ============================ 2 · EXPERIÊNCIAS ============================
experiencias = f'''
  <section class="slide">
{head_simple("As experiências")}
    <span class="eyebrow orange">◆ Três experiências</span>
    <h2>Escolham como <em>celebrar</em></h2>
    <p class="lead">Três experiências criativas para reunir o time, <b>colocar a mão na massa e comemorar juntos</b> — todas conduzidas por profissionais, com materiais e produção da Elarah.</p>
    <div class="exp3">
      {excard("Experiência 01", "ceramicafamiliamais12.jpg", "Pessoas sorrindo enquanto criam cerâmica", "Cerâmica", "Modelagem à mão, guiada por ceramista, com todo o material incluso.", "center 40%", chip="Sugestão Elarah")}
      {excard("Experiência 02", "perfumaria-apre.jpg", "Pessoas experimentando aromas na bancada de perfumaria botânica", "Perfumaria Botânica", "Uma experiência sensorial para explorar aromas e criar um perfume botânico autoral.", "center 45%")}
      {excard("Experiência 03", "aniversario-mesa-real.jpg", "Grupo montando arranjos florais juntos à mesa", "Arranjos florais", "Uma experiência criativa para montar um arranjo autoral e levar a criação para casa.", "center 50%")}
    </div>
    {foot("As experiências")}
  </section>'''

# ============================ 3 · COMO ACONTECE ============================
como = f'''
  <section class="slide">
{head_simple("Como acontece")}
    <span class="eyebrow orange">◆ Como acontece</span>
    <h2>Simples, do início ao <em>fim</em></h2>
    <p class="lead">A Elarah prepara tudo. O time só chega, aproveita e celebra. 🎉</p>
    <div class="bfeat">
      <div class="bphoto">{img("bfa-grupo2.webp", "Grupo criando cerâmica junto, sorrindo, luz natural", "center 45%")}</div>
      <div class="bbody">
        <span class="btag">O passo a passo</span>
        <h3>É só aproveitar</h3>
        <ul class="feat">
          <li><span class="st">1</span><b>Chega tudo pronto</b> — recepção, mesa preparada e boas-vindas.</li>
          <li><span class="st">2</span><b>Criam juntos</b> — a experiência acontece de forma leve, guiada pelo profissional.</li>
          <li><span class="st">3</span><b>Celebram e levam uma memória</b> — cada um sai com a própria criação e uma lembrança desse momento.</li>
        </ul>
      </div>
    </div>
    {foot("Como acontece")}
  </section>'''

# ============================ 4 · A VIBE ============================
vibe = f'''
  <section class="slide">
{head_simple("A vibe")}
    <span class="eyebrow orange">◆ A vibe</span>
    <h2>Criar junto, <em>celebrar junto</em></h2>
    <p class="lead">Uma tarde leve, criativa e cheia de bons momentos — mãos ocupadas, conversa boa e um ótimo motivo para comemorar juntos.</p>
    <div class="vibe">
      <figure>{img("bfa-grupo1.webp", "Time reunido criando junto, sorrindo, luz natural", "center 32%")}<figcaption>Time reunido</figcaption></figure>
      <figure>{img("casalmodelagemceramica.jpg", "Mãos criando uma peça de cerâmica", "center 45%")}<figcaption>Mão na argila</figcaption></figure>
      <figure>{img("ceramica-meninas.jpg", "Pessoas rindo enquanto criam cerâmica", "center 45%")}<figcaption>Criar e rir</figcaption></figure>
      <figure>{img("aniversario-mesa-real.jpg", "Grupo montando arranjos florais juntos", "center 42%")}<figcaption>Arranjos a quatro mãos</figcaption></figure>
      <figure>{img("perfumaria-apresentacao.jpg", "Pessoas experimentando aromas na perfumaria", "center 50%")}<figcaption>Descobrir aromas</figcaption></figure>
      <figure>{img("agora-grupo.jpg", "Grupo reunido à mesa criando, luz natural", "center 45%")}<figcaption>Juntos na mesa</figcaption></figure>
    </div>
    {foot("A vibe da experiência")}
  </section>'''

# ============================ 5 · ESPAÇOS ============================
espacos = f'''
  <section class="slide">
{head_simple("Os espaços")}
    <span class="eyebrow orange">◆ Escolham o cenário</span>
    <h2>Espaços para a <em>celebração</em></h2>
    <p class="lead">Ateliês parceiros para receber a celebração, com estrutura completa para as experiências.</p>
    <div class="exp3">
      {excard("Cerâmica", "netas-atelie.jpg", "Ateliê de cerâmica com pessoas criando, luz natural", "Ateliê Signal", "Ateliê parceiro de cerâmica, com toda a estrutura para a experiência.", "center 50%")}
      {excard("Cerâmica", "casa-aquario-atelie.jpg", "Ateliê criativo e acolhedor com pessoas", "Entre Mãos", "Outro ateliê parceiro de cerâmica, no mesmo padrão de qualidade.", "center 50%")}
      {excard("Arranjos florais", "agora-mesa.jpg", "Cenário montado, mesa luminosa com flores e materiais", "Agora", "Espaço criativo e luminoso para a experiência de arranjos florais.", "center 50%")}
    </div>
    <div class="bnote">◆ Todos são definidos conforme a data da sexta escolhida.</div>
    {foot("Os espaços")}
  </section>'''

# ============================ 6 · INVESTIMENTO (tabela condensada) ============================
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Três níveis para <em>escolher</em></h2>
    <p class="lead">Cada experiência em três níveis — do essencial ao completo. A <b>Perfumaria Botânica</b> já entra com o valor por pessoa do plano Experiência; os demais valores seguem <b>a confirmar</b>.</p>
    <div class="imatrix">
      <div class="imrow imhead">
        <div class="imcell"><span class="leg">Experiências</span></div>
        <div class="imcell"><span class="tname">Experiência</span><div class="tdesc">Atividade + materiais + profissional + produção Elarah</div></div>
        <div class="imcell imcol-hl"><span class="tname">Premium <span class="imtag">Mais escolhido</span></span><div class="tdesc">Tudo da Experiência + comidinhas &amp; bebidas + foto profissional</div></div>
        <div class="imcell"><span class="tname">Completa</span><div class="tdesc">Tudo do Premium + brinde personalizado</div></div>
      </div>
      {mrow("Cerâmica", "Modelagem à mão · Perdizes", [TBD, TBD, TBD])}
      {mrow("Perfumaria Botânica", "Perfume autoral · 50 ml", [P416, TBD, TBD])}
      {mrow("Arranjos florais", "Arranjo autoral · Agora", [TBD, TBD, TBD])}
    </div>
    <p class="fineprint">Perfumaria Botânica: <b>R$ 416 por pessoa</b> no plano Experiência (fornecedor Semblante) — materiais e insumos inclusos, perfume autoral de 50 ml. Cerâmica, arranjos florais e os planos Premium e Completa: valores <b>a confirmar</b>. Alimentação e consumo dos espaços não inclusos até confirmação. Data: sexta-feira de outubro, a confirmar.</p>
    {foot("Investimento")}
  </section>'''

# ============================ 7 · OPCIONAIS: FOTO E BRINDES ============================
opcionais = f'''
  <section class="slide">
{head_simple("Pra levar de lembrança")}
    <span class="eyebrow orange">◆ Pra levar de lembrança</span>
    <h2>Bônus pra deixar <em>completo</em></h2>
    <p class="lead">Além da experiência, dá pra somar dois bônus que ficam com o time depois da celebração:</p>
    <div class="opts">
      <div class="opt">
        <div class="ophduo"><div class="sq">{img("mimo-copo-termico.jpg", "Copo térmico personalizado", "center 50%")}</div><div class="sq">{img("brinde-corp.jpg", "Kit de brinde personalizado", "center 50%")}</div></div>
        <div class="ob">
          <span class="ot">Lembrancinha</span>
          <h4>Brinde personalizado</h4>
          <p>Personalizado com a <b>identidade da Segatta</b> — uma lembrança do marco que fica com cada convidado.</p>
          <p>E tem mais: trabalhamos com <b>outras opções de brinde</b> (copo térmico, garrafa, kit personalizado). É só dizer a vibe do time que a gente monta a lembrança sob medida. 🤍</p>
          <div class="op">A confirmar<small>por pessoa</small></div>
        </div>
      </div>
      <div class="opt">
        <div class="oph">{img("ceramicafamiliamais12.jpg", "Registro fotográfico profissional da experiência", "center 40%")}</div>
        <div class="ob">
          <span class="ot">Registro</span>
          <h4>Foto profissional</h4>
          <ul>
            <li>Cobertura profissional da experiência</li>
            <li>Principais momentos registrados</li>
            <li>Álbum digital para compartilhar</li>
          </ul>
          <div class="op">A confirmar<small>valor total</small></div>
        </div>
      </div>
    </div>
    <p class="fineprint">Bônus opcionais, somados ao pacote escolhido. Os brindes também fazem parte do pacote Completa. Personalização com a identidade da Segatta e valores da foto e do brinde a confirmar.</p>
    {foot("Pra levar de lembrança")}
  </section>'''

# ============================ 8 · PRÓXIMOS PASSOS ============================
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Próximos passos</span>
    <h2>Vamos <em>seguir</em>?</h2>
    <p class="lead">É só escolher a experiência, o nível e o espaço — a Elarah cuida de toda a produção, do começo ao fim. Os valores entram assim que fecharmos o formato.</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico" style="font-family:'DM Serif Display',serif;color:var(--orange-dark)">01</div><h3>Escolhemos</h3><p>A experiência, o nível (Experiência · Premium · Completa) e o espaço.</p></div>
      <div class="infocard"><div class="ico" style="font-family:'DM Serif Display',serif;color:var(--orange-dark)">02</div><h3>Confirmamos</h3><p>A data de outubro, o espaço e os detalhes finais.</p></div>
      <div class="infocard"><div class="ico" style="font-family:'DM Serif Display',serif;color:var(--orange-dark)">03</div><h3>Produzimos</h3><p>A Elarah cuida de toda a execução da experiência.</p></div>
    </div>
    <div class="quote">
      <strong style="font-family:'DM Serif Display',serif;font-weight:400;font-size:22px;color:var(--navy);display:block;margin-bottom:8px">A confirmar: data (sexta de outubro) ✦</strong>
      Assim que definirmos formato, espaço e número final, alinhamos os últimos detalhes e cuidamos da produção da celebração.<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n'
        + cover + experiencias + como + vibe + espacos
        + investimento + opcionais + proximos + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/experiencia-segatta-100k.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
