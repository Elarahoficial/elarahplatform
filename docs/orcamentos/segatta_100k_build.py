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
  /* opcionais · foto + brindes */
  .optcards{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:22px}
  .optc{display:grid;grid-template-columns:132px 1fr;background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:0 14px 32px -24px rgba(0,0,0,.3)}
  .optc figure{margin:0;position:relative;min-height:172px}
  .optc figure img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .optc .optb{padding:18px 20px 18px}
  .optc .optn{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .optc h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:20px;color:var(--navy);margin:3px 0 4px;line-height:1.05}
  .optc ul{list-style:none;margin-top:8px;display:flex;flex-direction:column;gap:7px}
  .optc ul li{position:relative;padding-left:18px;font-size:11.5px;color:var(--ink);line-height:1.35}
  .optc ul li b{color:var(--navy);font-weight:700}
  .optc ul li::before{content:"\\2726";position:absolute;left:0;top:1px;color:var(--orange);font-size:10px}
  .optc .optnote{margin-top:11px;font-size:10px;color:var(--orange-dark);font-weight:700;letter-spacing:.02em}
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


def mrow(name, sub):
    c = '<span class="imprice">A confirmar</span>'
    return (f'<div class="imrow"><div class="imcell"><div class="rn">{name}</div><div class="rs">{sub}</div></div>'
            f'<div class="imcell">{c}</div><div class="imcell imcol-hl">{c}</div><div class="imcell">{c}</div></div>')


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
        <span class="eyebrow">✦ Segatta Neuropsicologia · Celebração dos 100 mil</span>
        <h1>Um marco que merece <em>ser celebrado</em></h1>
        <p class="lead">Uma tarde especial para celebrar os <strong>100 mil seguidores</strong> no Instagram — o time junto, criando, compartilhando e marcando essa conquista de um jeito especial.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>100 mil</b> seguidores</span>
          <span class="chip"><b>Perdizes</b> · SP</span>
          <span class="chip">Sexta de <b>outubro</b> · a definir</span>
          <span class="chip"><b>8 pessoas</b> · tarde</span>
        </div>
      </div>
      <div class="cover-photo">{img("agora-grupo.jpg", "Time reunido em experiência criativa, luz natural", "center 45%")}</div>
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
    <p class="lead">Três experiências criativas para escolher a que mais combina com o time — todas conduzidas por profissionais, com materiais e produção da Elarah.</p>
    <div class="exp3">
      {excard("Experiência 01", "ceramicamodelagem.jpg", "Mãos modelando peça em argila", "Cerâmica", "Cada um modela a própria peça em argila, à mão e sem pressa — e leva para casa.", "center 50%")}
      {excard("Experiência 02", "buque.jpg", "Arranjo floral autoral", "Arranjos florais", "Guiados por uma florista, montam o próprio arranjo autoral com flores selecionadas.", "center 45%")}
      {excard("Experiência 03", "perfumaria-oficina.jpg", "Bancada de perfumaria com essências", "Perfumaria & Home Spray", "Criam a própria fragrância ou um home spray autoral para perfumar os ambientes.", "center 45%")}
    </div>
    {foot("As experiências")}
  </section>'''

# ============================ 3 · COMO ACONTECE ============================
como = f'''
  <section class="slide">
{head_simple("Como acontece")}
    <span class="eyebrow orange">◆ Como acontece</span>
    <h2>Simples, do início ao <em>fim</em></h2>
    <p class="lead">A Elarah leva tudo montado até o local escolhido — profissional, materiais e estrutura. O time só chega e cria.</p>
    <div class="bfeat">
      <div class="bphoto">{img("aula-grupo.jpg", "Grupo criando junto com condução de profissional", "center 40%")}</div>
      <div class="bbody">
        <span class="btag">O passo a passo</span>
        <h3>Chega tudo pronto</h3>
        <ul class="feat">
          <li><span class="st">1</span><b>Boas-vindas</b> — recepção, bancada montada e um café de boas-vindas.</li>
          <li><span class="st">2</span><b>Mão na criação</b> — cada um cria a própria peça, guiado pelo profissional.</li>
          <li><span class="st">3</span><b>Leva para casa</b> — todo mundo sai com a própria criação e uma lembrança desse marco.</li>
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
    <p class="lead">Uma pausa gostosa na rotina, com criação, conversa e um momento especial para comemorar em equipe.</p>
    <div class="vibe">
      <figure>{img("ceramicamodelagem.jpg", "Mãos na argila", "center 50%")}<figcaption>Mão na argila</figcaption></figure>
      <figure>{img("buqueflor.jpg", "Flores selecionadas para o arranjo", "center 50%")}<figcaption>Flores selecionadas</figcaption></figure>
      <figure>{img("perfumariamaes.jpg", "Bancada de perfumaria com essências e pétalas", "center 50%")}<figcaption>Aromas autorais</figcaption></figure>
    </div>
    {foot("A vibe da experiência")}
  </section>'''

# ============================ 5 · ESPAÇOS ============================
espacos = f'''
  <section class="slide">
{head_simple("Os espaços")}
    <span class="eyebrow orange">◆ Onde acontece</span>
    <h2>Onde for melhor para <em>vocês</em></h2>
    <p class="lead">Pode acontecer no próprio escritório da Segatta, em Perdizes, ou em um espaço parceiro próximo. O espaço final está <b>em curadoria</b> — abaixo, as opções que estamos avaliando.</p>
    <div class="exp3">
      {excard("Opção principal", "mesa-montada-corp.jpg", "Mesa montada para a experiência no escritório", "No escritório da Segatta", "Perdizes · SP. Levamos a experiência completa até o local.", "center 50%", chip="No local")}
      {excard("Espaço parceiro próximo", "agora-ceramica.jpg", "Ateliê parceiro de cerâmica com luz natural", "Ateliê parceiro · zona oeste", "Parceiros próximos a Perdizes (ex.: Pinheiros) já no radar da Elarah.", "center 50%", chip="Em curadoria")}
      {excard("Outra opção de espaço", "casa-aquario-atelie.jpg", "Café ou ateliê parceiro aconchegante", "Café ou ateliê parceiro", "Selecionado conforme a experiência escolhida e a data do evento.", "center 50%", chip="Em curadoria")}
    </div>
    <div class="bnote">◆ Endereços, disponibilidade e eventuais consumos mínimos <b>a confirmar</b>. Priorizamos parceiros próximos a Perdizes já conhecidos da Elarah; o espaço final segue <b>em curadoria</b>.</div>
    {foot("Os espaços")}
  </section>'''

# ============================ 6 · INVESTIMENTO (tabela condensada) ============================
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Três níveis para <em>escolher</em></h2>
    <p class="lead">Cada experiência em três níveis — do essencial ao completo. Os <b>valores estão em curadoria</b> e entram assim que definirmos o formato, o espaço e o número final de participantes.</p>
    <div class="imatrix">
      <div class="imrow imhead">
        <div class="imcell"><span class="leg">Experiências</span></div>
        <div class="imcell"><span class="tname">Experiência</span><div class="tdesc">Atividade + materiais + profissional + produção Elarah</div></div>
        <div class="imcell imcol-hl"><span class="tname">Premium <span class="imtag">Mais escolhido</span></span><div class="tdesc">Tudo da Experiência + comidinhas + bebidas</div></div>
        <div class="imcell"><span class="tname">Completa</span><div class="tdesc">Tudo do Premium + brindes / lembrancinhas + personalização</div></div>
      </div>
      {mrow("Cerâmica", "Modelagem em argila")}
      {mrow("Arranjos florais", "Arranjo autoral")}
      {mrow("Perfumaria &amp; Home Spray", "Fragrância / home spray")}
    </div>
    <p class="fineprint">Valores por pessoa <b>em curadoria</b> — definidos com o formato, o espaço e o número final de participantes (8 pessoas). Foto profissional e brindes personalizados disponíveis como opcionais (próximo slide). Data: sexta-feira de outubro, a confirmar.</p>
    {foot("Investimento")}
  </section>'''

# ============================ 7 · OPCIONAIS: FOTO E BRINDES ============================
opcionais = f'''
  <section class="slide">
{head_simple("Opcionais")}
    <span class="eyebrow orange">◆ Opcionais</span>
    <h2>Para tornar o momento ainda mais <em>especial</em></h2>
    <p class="lead">Dois complementos opcionais, somados ao pacote escolhido — para registrar o dia e levar uma lembrança personalizada da Segatta. Valores <b>em curadoria</b>.</p>
    <div class="optcards">
      {optcard("mimos-registro.jpg", "Registro fotográfico profissional do evento", "Complemento 01", "Foto profissional", ["Cobertura profissional da experiência", "Principais momentos registrados", "Álbum digital para compartilhar"], "Formato: valor fixo ou por pessoa · a confirmar", "center 50%")}
      {optcard("mimo-copo-termico.jpg", "Lembrança personalizada — copo térmico", "Complemento 02", "Brindes & lembrancinhas", ["Personalização com a identidade da <b>Segatta Neuropsicologia</b>", "Uma lembrança do marco para cada convidado", "Referências Elarah como inspiração (copo térmico, garrafa, kit personalizado)"], "Personalização Segatta · em curadoria", "center 50%")}
    </div>
    <p class="fineprint">Complementos opcionais, somados ao pacote escolhido. Os brindes já fazem parte do pacote <b>Completa</b> e também podem ser contratados à parte. Personalização com a identidade da Segatta <b>em curadoria</b>; valores a confirmar.</p>
    {foot("Opcionais · foto e brindes")}
  </section>'''

# ============================ 8 · PRÓXIMOS PASSOS ============================
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Próximos passos</span>
    <h2>Vamos <em>seguir</em>?</h2>
    <p class="lead">Com a experiência, o nível e o espaço definidos, a Elarah cuida de toda a execução. Os valores entram assim que fecharmos o formato.</p>
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
