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
  .exc .exptags{display:flex;flex-wrap:wrap;gap:6px;margin-top:13px}
  .exc .exptags span{font-size:9.5px;font-weight:700;letter-spacing:.02em;color:var(--navy);background:rgba(18,54,43,.06);border:1px solid var(--line);border-radius:999px;padding:5px 11px}
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
  /* investimento · dois blocos de preço */
  .invblocks{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:22px;align-items:start}
  .invb{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px 26px 20px;box-shadow:0 16px 40px -28px rgba(0,0,0,.34)}
  .invb .ibsp{font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .invb .ibsub{font-size:11.5px;color:var(--muted);margin-top:5px;line-height:1.4}
  .invb .ibrows{margin-top:14px;border-top:1px solid var(--line)}
  .invrow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 0}
  .invrow + .invrow{border-top:1px solid var(--line)}
  .invrow .ie{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--navy)}
  .invrow .iv{display:flex;flex-direction:column;align-items:flex-end;line-height:1.05}
  .invrow .pp{font-family:'DM Serif Display',serif;font-size:24px;color:var(--navy)}
  .invrow .ppu{font-size:9px;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-top:2px}
  .invrow .tg{font-size:10px;color:var(--orange-dark);font-weight:700;margin-top:4px;letter-spacing:.02em}
  .invb .ibnote{margin-top:14px;font-size:10.5px;color:var(--muted);line-height:1.5}
  .imper{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-top:3px}
  /* vibe · legenda no padrão atmosfera Elarah (igual ao print) */
  .vibe figcaption{padding:24px 12px 10px;background:linear-gradient(to top,rgba(16,23,28,.86),transparent);font-size:11.5px}
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
  /* investimento · 3 pacotes */
  .subline{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin-top:12px}
  .pkgs{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:20px;align-items:stretch}
  .pkg{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:24px 22px 20px;display:flex;flex-direction:column;box-shadow:0 16px 40px -30px rgba(0,0,0,.32);position:relative}
  .pkg.hl{border:1.8px solid var(--orange);box-shadow:0 22px 48px -26px rgba(0,0,0,.4)}
  .pkg .pkbadge{position:absolute;top:-11px;left:50%;transform:translateX(-50%);white-space:nowrap;background:var(--orange);color:#fff;font-size:8px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:5px 13px;border-radius:999px}
  .pkg .pkn{font-size:10px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .pkg .pkt{font-size:12px;color:var(--muted);margin-top:5px;line-height:1.4;min-height:34px}
  .pkg .pkp{font-family:'DM Serif Display',serif;font-size:33px;color:var(--navy);line-height:1;margin-top:16px}
  .pkg .pku{font-size:8.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-top:5px}
  .pkg .pktot{font-size:12px;color:var(--navy);font-weight:700;margin-top:7px}
  .pkg .pkstep{font-size:10px;color:var(--muted);margin-top:6px;font-style:italic;padding-bottom:14px;border-bottom:1px solid var(--line)}
  .pkg ul{list-style:none;margin-top:14px;display:flex;flex-direction:column;gap:7px;flex:1}
  .pkg ul li{position:relative;padding-left:17px;font-size:11px;color:var(--ink);line-height:1.4}
  .pkg ul li::before{content:"\\2726";position:absolute;left:0;top:1px;color:var(--orange);font-size:9px}
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
          <span class="chip"><b>02/10</b> · 16h às 19h30</span>
          <span class="chip"><b>8</b> participantes</span>
        </div>
      </div>
      <div class="cover-photo">{img("segatta-capa.webp", "Grupo sorrindo durante a experiência de cerâmica, luz natural", "center 40%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Segatta Neuropsicologia · Celebração 100 mil")}
  </section>'''

# ============================ 2 · EXPERIÊNCIAS ============================
experiencias = f'''
  <section class="slide">
{head_simple("A experiência")}
    <span class="eyebrow orange">◆ A experiência</span>
    <h2>Cerâmica, a experiência <em>escolhida</em></h2>
    <p class="lead">Uma tarde para o time reunir, <b>colocar a mão na massa e comemorar junto</b> — conduzida por ceramista, com todos os materiais e a produção da Elarah.</p>
    <div class="bfeat">
      <div class="bphoto">{img("ceramicafamiliamais12.jpg", "Pessoas sorrindo enquanto criam cerâmica juntas", "center 40%")}</div>
      <div class="bbody">
        <span class="btag">Escolha da Segatta</span>
        <h3>Cerâmica</h3>
        <ul class="feat">
          <li><span class="st">✦</span><b>Modelagem à mão</b>, guiada por ceramista.</li>
          <li><span class="st">✦</span>Materiais, <b>comidas e bebidas</b> e registro em vídeo inclusos.</li>
          <li><span class="st">✦</span>Peças <b>finalizadas no ateliê</b> e retiradas depois.</li>
        </ul>
      </div>
    </div>
    {foot("A experiência")}
  </section>'''

# ============================ 3 · COMO ACONTECE ============================
como = f'''
  <section class="slide">
{head_simple("Como acontece")}
    <span class="eyebrow orange">◆ Como acontece</span>
    <h2>Simples, do início ao <em>fim</em></h2>
    <p class="lead">A Elarah prepara tudo. O time só chega, aproveita e celebra. 🎉</p>
    <div class="bfeat">
      <div class="bphoto">{img("segatta-como.jpg", "Grupo criando junto à mesa, vista de cima, luz natural", "center 50%")}</div>
      <div class="bbody">
        <span class="btag">O passo a passo</span>
        <h3>É só aproveitar</h3>
        <ul class="feat">
          <li><span class="st">1</span><b>Chega tudo pronto</b> — recepção, mesa preparada e boas-vindas.</li>
          <li><span class="st">2</span><b>Criam juntos</b> — a experiência acontece de forma leve, guiada pela ceramista.</li>
          <li><span class="st">3</span><b>Registram e celebram</b> — fotógrafo e vídeo do encontro; as peças são finalizadas no ateliê e retiradas depois.</li>
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
      <figure>{img("agora-pintura.jpg", "Grupo criando cerâmica junto", "center 40%")}<figcaption>Mão na massa, juntas</figcaption></figure>
      <figure>{img("agora-ceramica.jpg", "Modelagem de cerâmica à mão", "center 40%")}<figcaption>Modelagem à mão</figcaption></figure>
      <figure>{img("agora-selfie.jpg", "Time rindo durante a experiência", "center 40%")}<figcaption>Risada garantida</figcaption></figure>
      <figure>{img("torno.jpg", "Mãos modelando argila no torno", "center 50%")}<figcaption>Argila nas mãos</figcaption></figure>
      <figure>{img("ceramicacool.jpg", "Peças de cerâmica finalizadas e esmaltadas", "center 50%")}<figcaption>Peças finalizadas</figcaption></figure>
      <figure>{img("pinturapratoceramica.jpg", "Peça de cerâmica sendo pintada à mão", "center 50%")}<figcaption>Cor &amp; acabamento</figcaption></figure>
    </div>
    <div class="bnote" style="margin-top:16px">◆ <b>Tudo incluso:</b> espaço · ceramista + assistente · todos os materiais · comidas e bebidas · fotógrafo, captação e vídeo editado · finalização das peças no ateliê (secagem, duas queimas e esmalte) e retirada posterior.</div>
    {foot("A vibe da experiência")}
  </section>'''

# ============================ 5 · ESPAÇOS ============================
espacos = f'''
  <section class="slide">
{head_simple("O espaço")}
    <span class="eyebrow orange">◆ O espaço</span>
    <h2>Onde a experiência <em>acontece</em></h2>
    <p class="lead">Um espaço intimista e acolhedor em Perdizes, reservado para o time da Segatta viver a experiência com calma.</p>
    <div class="exp3" style="grid-template-columns:1fr;max-width:560px;margin:22px auto 0">
      <div class="exc"><figure>{img("netas-atelie.jpg", "Ateliê Entre Mãos, intimista, com pessoas em experiência criativa e luz natural", "center 50%")}<span class="exchip">Cerâmica</span></figure>
        <div class="exb"><span class="exn">Perdizes · o espaço escolhido</span><h3>Entre Mãos</h3>
          <p>Um ateliê acolhedor e cheio de luz, preparado para receber a experiência de cerâmica do começo ao fim.</p>
          <div class="exptags"><span>Espaço reservado</span><span>Ambientação</span><span>Comidinhas &amp; bebidas</span></div></div></div>
    </div>
    <div class="bnote">◆ Endereço e horário <b>confirmados</b>: 02/10, das 16h às 19h30.</div>
    {foot("O espaço")}
  </section>'''

# ============================ 6 · INVESTIMENTO (tabela condensada) ============================
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Duas formas de viver <em>a experiência</em></h2>
    <div class="subline">02/10 · 16h às 19h30 · Entre Mãos, Perdizes · 8 participantes</div>
    <p class="lead">A diferença está na <b>dinâmica da cerâmica</b>. Fotógrafo, vídeo e comidas já estão inclusos nas duas.</p>
    <div class="pkgs" style="grid-template-columns:1fr 1fr">
      <div class="pkg">
        <span class="pkn">Opção A ou B</span>
        <div class="pkt">Modelagem de duas peças<br>ou modelagem + coloração</div>
        <div class="pkp">R$ 493,75</div>
        <div class="pku">por pessoa</div>
        <div class="pktot">R$ 3.950 · 8 participantes</div>
        <div class="pkstep">Duas técnicas de cerâmica, à escolha.</div>
        <ul>
          <li><b>A ·</b> 800g de argila e duas peças autorais</li>
          <li><b>B ·</b> uma peça autoral + coloração em engobe</li>
        </ul>
      </div>
      <div class="pkg hl">
        <span class="pkbadge">Recomendação Elarah</span>
        <span class="pkn">Opção C · a mais completa</span>
        <div class="pkt">Modelagem + pintura de uma segunda peça</div>
        <div class="pkp">R$ 531,25</div>
        <div class="pku">por pessoa</div>
        <div class="pktot">R$ 4.250 · 8 participantes</div>
        <div class="pkstep">+ R$ 37,50/pessoa · dois momentos criativos.</div>
        <ul>
          <li><b>Modela</b> uma peça autoral com a ceramista</li>
          <li><b>Pinta</b> uma segunda peça (copo ou bowl) com corantes e esmaltes</li>
        </ul>
      </div>
    </div>
    <div class="bnote" style="margin-top:18px">◆ <b>As duas opções já incluem:</b> ceramista + assistente de apoio · todos os materiais · comidas e bebidas · fotógrafo, captação e vídeo editado · finalização das peças no ateliê (secagem, duas queimas e esmalte) e retirada posterior.</div>
    <p class="fineprint">Valores por pessoa e totais para 8 participantes. A peça modelada é finalizada no ateliê e retirada depois de pronta.</p>
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
{head_simple("Como funciona & contato")}
    <span class="eyebrow orange">◆ Simples e sob medida</span>
    <h2>É só <em>reunir o time</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pro encontro ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Escolham a opção</h3><p>A, B ou C — a data e o espaço já estão confirmados: 02/10, das 16h às 19h30, no Entre Mãos.</p></div>
      <div class="step"><div class="num">2</div><h3>A gente leva tudo</h3><p>Ceramista, assistente, todos os materiais e as comidas e bebidas. Chegamos antes, montamos e cuidamos de tudo.</p></div>
      <div class="step"><div class="num">3</div><h3>Registramos e finalizamos</h3><p>Fotógrafo e vídeo do encontro; as peças são finalizadas no ateliê e retiradas depois de prontas.</p></div>
    </div>
    <div class="addon">
      <span class="plus">✦</span>
      <div>
        <h4>Sob medida pro time</h4>
        <p>Dá pra reservar um momento de <b>fala da liderança</b> e ajustar a experiência ao time. A gente emite <b>nota fiscal</b> e alinha prazo e forma de pagamento com o financeiro. É só combinar. 🧡</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora <em>reunir o time?</em> ✦</h2>
      <p>Vi, me confirma a opção (A, B ou C) que faz mais sentido, que eu deixo tudo organizado pro dia 02/10.</p>
      <div class="cta-actions">
        <a class="btn-wa" href="https://wa.me/5511914455930?text=Oi%2C%20Elarah!%20Vi%20a%20proposta%20da%20Segatta%20e%20quero%20fechar%20os%20detalhes." target="_blank" rel="noopener">💬 Falar no WhatsApp</a>
        <div class="contact-links">
          <span>+55 (11) 91445-5930</span>
          <a href="https://instagram.com/elarah.oficial" target="_blank" rel="noopener">@elarah.oficial</a>
          <a href="https://elarah.com.br" target="_blank" rel="noopener">elarah.com.br</a>
        </div>
      </div>
    </div>
    <p class="fineprint">Proposta de experiência da Elarah para a celebração dos 100 mil da Segatta Neuropsicologia — experiência de Cerâmica no Entre Mãos (Perdizes), em 02/10, das 16h às 19h30, para 8 participantes. Opção A ou B (modelagem de duas peças ou modelagem + coloração) R$ 493,75 por pessoa (R$ 3.950 · 8 participantes); Opção C, a mais completa (modelagem + pintura de uma segunda peça), R$ 531,25 por pessoa (R$ 4.250 · 8 participantes). As duas opções incluem ceramista, assistente, materiais, comidas e bebidas, fotógrafo, captação e vídeo editado; as peças são finalizadas no ateliê e retiradas depois de prontas.</p>
    {foot("Como funciona & contato")}
  </section>'''

deck = ('<div class="deck">\n'
        + cover + experiencias + como + vibe + espacos
        + investimento + proximos + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/experiencia-segatta-100k.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
