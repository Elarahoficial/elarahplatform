# Proposta Vi Ardore · Corporativo · Celebracao 100 mil seguidores (Instagram)
# 8 pessoas · sexta de outubro (a definir) · tarde · Perdizes, SP
# ESQUELETO no padrao Elarah: reaproveita head/tail + componentes .bfeat/.vibe/.tiers/.lembra dos builds existentes.
# 3 experiencias (Ceramica / Arranjos florais / Perfumaria-Home Spray), cada uma em 3 niveis: Experiencia / Premium / Completa.
# Valores em curadoria (budget nao definido) -> "A confirmar" / "Em curadoria". Nao inventar precos/enderecos/disponibilidade.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

xcss = '''
  /* pacotes · 3 niveis (reaproveitado do build de arranjos Sow Cafe) */
  .tiers{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:22px}
  .tier{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:24px 18px 20px;display:flex;flex-direction:column;box-shadow:0 14px 32px -22px rgba(0,0,0,.32);position:relative}
  .tier.hl{border:2px solid var(--navy)}
  .tier .tname{font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .tier .tprice{font-family:'DM Serif Display',serif;font-size:31px;color:var(--navy);margin:8px 0 1px;line-height:1}
  .tier .tprice.tbd{font-size:20px;color:var(--muted);letter-spacing:.01em;margin-top:10px}
  .tier .tunit{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;font-weight:600;margin-bottom:14px;line-height:1.3}
  .tier ul{list-style:none;display:flex;flex-direction:column;gap:8px;margin-top:2px}
  .tier ul li{position:relative;padding-left:18px;font-size:11.5px;color:var(--ink);line-height:1.35}
  .tier ul li b{color:var(--navy);font-weight:700}
  .tier ul li::before{content:"\\2726";position:absolute;left:0;top:1px;color:var(--orange);font-size:10px}
  .tier .tag{position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:var(--navy);color:#fff;font-size:8.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:4px 13px;border-radius:999px;white-space:nowrap}
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


def tier(name, bullets, hl=False, tag=None, price="A confirmar"):
    tagh = f'<span class="tag">{tag}</span>' if tag else ''
    lis = "".join(f"<li>{b}</li>" for b in bullets)
    cls = "tier hl" if hl else "tier"
    return (f'<div class="{cls}">{tagh}<span class="tname">{name}</span>'
            f'<span class="tprice tbd">{price}</span>'
            f'<span class="tunit">por pessoa · em curadoria</span><ul>{lis}</ul></div>')


def optcard(src, alt, kicker, title, bullets, note, pos="center 50%"):
    lis = "".join(f"<li>{b}</li>" for b in bullets)
    return (f'<div class="optc"><figure>{img(src, alt, pos)}</figure>'
            f'<div class="optb"><span class="optn">{kicker}</span><h3>{title}</h3>'
            f'<ul>{lis}</ul><div class="optnote">{note}</div></div></div>')


PROOF = "Experiências criativas já realizadas para times como <b>Natura</b>, <b>Riachuelo</b> e <b>Samsung</b>"

# ============================ 1 · CAPA ============================
cover = f'''
  <section class="slide">
{head_block("Proposta de experiência · Corporativo", "Vi", "Ardore", "100 mil seguidores")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Vi Ardore · Celebração dos 100 mil</span>
        <h1>Um marco que merece <em>celebração</em></h1>
        <p class="lead">Uma tarde criativa e afetiva pra comemorar os <strong>100 mil seguidores</strong> no Instagram — o time junto, criando com as mãos, brindando e registrando a conquista. 🎉</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>100 mil</b> seguidores</span>
          <span class="chip"><b>Perdizes</b> · SP</span>
          <span class="chip">Sexta de <b>outubro</b> · a definir</span>
          <span class="chip"><b>8 pessoas</b> · tarde</span>
        </div>
      </div>
      <div class="cover-photo">{img("cover-corp.jpg", "Time reunido em experiência criativa e celebração", "center 45%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Vi Ardore · Celebração 100 mil")}
  </section>'''

# ============================ 2 · EXPERIÊNCIAS ============================
experiencias = f'''
  <section class="slide">
{head_simple("As experiências")}
    <span class="eyebrow orange">◆ Três experiências</span>
    <h2>Escolham como <em>celebrar</em></h2>
    <p class="lead">Três experiências criativas — todas conduzidas por profissionais, com material completo e produção da Elarah. Dá pra escolher uma ou combinar mais de uma na tarde. ✨</p>
    <div class="exp3">
      {excard("Experiência 01", "ceramicamodelagem.jpg", "Mãos modelando peça em argila", "Cerâmica", "Cada um modela a própria peça em argila, à mão e sem pressa — e leva pra casa.", "center 50%")}
      {excard("Experiência 02", "buque.jpg", "Arranjo floral autoral", "Arranjos florais", "Guiados por uma florista, montam o próprio arranjo autoral com flores selecionadas.", "center 45%")}
      {excard("Experiência 03", "perfumaria-oficina.jpg", "Bancada de perfumaria com essências", "Perfumaria & Home Spray", "Criam a própria fragrância ou um home spray autoral pra perfumar os ambientes.", "center 45%")}
    </div>
    {foot("As experiências")}
  </section>'''

# ============================ 3 · COMO ACONTECE ============================
como = f'''
  <section class="slide">
{head_simple("Como acontece")}
    <span class="eyebrow orange">◆ Como acontece</span>
    <h2>Simples, do início ao <em>fim</em></h2>
    <p class="lead">A Elarah leva tudo montado até o local escolhido — profissional, materiais e estrutura. O time só chega, cria e comemora. 🤍</p>
    <div class="bfeat">
      <div class="bphoto">{img("aula-grupo.jpg", "Grupo criando junto com condução de profissional", "center 40%")}</div>
      <div class="bbody">
        <span class="btag">O passo a passo</span>
        <h3>Chega tudo pronto</h3>
        <ul class="feat">
          <li><span class="st">1</span><b>Boas-vindas</b> — recepção, bancada montada e um brinde de boas-vindas.</li>
          <li><span class="st">2</span><b>Mão na obra</b> — cada um cria a própria peça, guiado pelo profissional.</li>
          <li><span class="st">3</span><b>Leva pra casa</b> — todo mundo sai com a própria criação e o registro do dia.</li>
        </ul>
      </div>
    </div>
    {foot("Como acontece")}
  </section>'''

# ============================ 4 · VIBE DA EXPERIÊNCIA ============================
vibe = f'''
  <section class="slide">
{head_simple("A vibe")}
    <span class="eyebrow orange">◆ A vibe</span>
    <h2>Criar junto, <em>celebrar junto</em></h2>
    <p class="lead">Mãos ocupadas, conversa boa e muitos registros lindos — leveza, criação e a energia de comemorar em equipe. 🎉</p>
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
    <h2>Pertinho de <em>vocês</em></h2>
    <p class="lead">Pode ser no próprio escritório da Vi Ardore, em Perdizes, ou num ateliê parceiro próximo. O espaço em Perdizes está <b>em curadoria</b> — abaixo, parceiros que já estão no radar da Elarah. 🌿</p>
    <div class="exp3">
      {excard("Opção base", "mesa-montada-corp.jpg", "Mesa montada para experiência no escritório", "No escritório da Vi Ardore", "Perdizes · SP. Levamos a experiência inteira montada até vocês.", "center 50%", chip="No local")}
      {excard("Ateliês de cerâmica", "netas-atelie.jpg", "Ateliê de cerâmica parceiro", "Netas Ateliê · Meu Outro Lado", "Parceiros de cerâmica já no radar Elarah (Vila Mariana / Brooklin).", "center 50%", chip="Em curadoria")}
      {excard("Cafés parceiros", "casa-aquario-atelie.jpg", "Café e ateliê parceiro aconchegante", "Sow Café · Casa Aquário", "Espaços charmosos (Zona Norte / Pinheiros). Consumo à parte, a confirmar.", "center 50%", chip="Em curadoria")}
    </div>
    <div class="bnote">◆ Endereços, disponibilidade e eventuais consumos mínimos <b>a confirmar</b>. Priorizamos parceiros já conhecidos da Elarah; um espaço específico em <b>Perdizes</b> segue <b>em curadoria</b>.</div>
    {foot("Os espaços")}
  </section>'''

# ============================ 6 · PACOTES E INVESTIMENTO (3 experiências) ============================
def pacotes(kick, atividade):
    return f'''
  <section class="slide">
{head_simple(f"Pacotes · {kick}")}
    <span class="eyebrow orange">◆ Pacotes · {kick}</span>
    <h2>Três níveis, é só <em>escolher</em></h2>
    <p class="lead">A experiência de <b>{atividade.lower()}</b> em três níveis — do essencial ao completo, com gastronomia e personalização. Os <b>valores estão em curadoria</b> e entram assim que definirmos formato e número final. </p>
    <div class="tiers">
      {tier("Experiência", [f"{atividade} guiada", "Materiais e insumos inclusos", "Profissional responsável", "Produção e condução Elarah"])}
      {tier("Premium", ["Tudo da <b>Experiência</b>", "Comidinhas + bebidas", "Incremento gastronômico compatível"], hl=True, tag="Mais escolhido")}
      {tier("Completa", ["Tudo do <b>Premium</b>", "Brindes / lembrancinhas", "Personalização Vi Ardore"])}
    </div>
    <p class="fineprint">Valores por pessoa <b>em curadoria</b> — definidos com o formato, o espaço e o número final de participantes (8 pessoas). Foto profissional e brindes personalizados disponíveis como opcionais (próximo slide). Data: sexta-feira de outubro, a confirmar.</p>
    {foot(f"Pacotes · {kick}")}
  </section>'''

pac_ceramica = pacotes("Cerâmica", "Modelagem em argila")
pac_arranjos = pacotes("Arranjos florais", "Montagem do arranjo floral")
pac_perfumaria = pacotes("Perfumaria", "Criação da fragrância / home spray")

# ============================ 7 · OPCIONAIS: FOTO E BRINDES ============================
opcionais = f'''
  <section class="slide">
{head_simple("Opcionais")}
    <span class="eyebrow orange">◆ Opcionais</span>
    <h2>Pra deixar ainda mais <em>especial</em></h2>
    <p class="lead">Dois complementos que já são clássicos das experiências Elarah — pra registrar o dia e pra levar um mimo personalizado da Vi Ardore. Valores <b>em curadoria</b>. 📸</p>
    <div class="optcards">
      {optcard("mimos-registro.jpg", "Registro fotográfico profissional do evento", "Complemento 01", "Foto profissional", ["Fotógrafo cobre a experiência inteira", "Cada criação e risada registradas", "Álbum digital pra Vi Ardore compartilhar"], "Formato: valor fixo ou por pessoa · a confirmar", "center 50%")}
      {optcard("lembrancinha-escova.jpg", "Lembrancinha personalizada em caixinha", "Complemento 02", "Brindes & lembrancinhas", ["Mimo personalizado pra cada convidado", "Personalização com a marca <b>Vi Ardore</b>", "Referências Elarah: kit escova &amp; piranha, copo térmico, garrafa"], "Personalização Vi Ardore · em curadoria", "center 50%")}
    </div>
    <p class="fineprint">Complementos opcionais, somados ao pacote escolhido. Foto profissional e lembrancinha personalizada seguem o padrão já usado nas experiências Elarah; personalização com a identidade da Vi Ardore <b>em curadoria</b>. Valores a confirmar.</p>
    {foot("Opcionais · foto e brindes")}
  </section>'''

# ============================ 8 · PRÓXIMOS PASSOS ============================
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Bora celebrar? 🎉</span>
    <h2>Vamos <em>seguir</em>?</h2>
    <p class="lead">Com a experiência (ou combinação), o espaço e a data de outubro definidos, a Elarah cuida de toda a produção. Os valores entram assim que fecharmos o formato. 🤍</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">1️⃣</div><h3>Escolham</h3><p>A(s) experiência(s), o nível (Experiência · Premium · Completa) e o espaço.</p></div>
      <div class="infocard"><div class="ico">2️⃣</div><h3>Curadoria</h3><p>Fechamos o espaço em Perdizes, os fornecedores e os valores finais.</p></div>
      <div class="infocard"><div class="ico">3️⃣</div><h3>Celebrar</h3><p>No dia, chega tudo montado. O time só cria e comemora os 100 mil.</p></div>
    </div>
    <div class="quote">
      <strong style="font-family:'DM Serif Display',serif;font-weight:400;font-size:22px;color:var(--navy);display:block;margin-bottom:8px">A confirmar: data (sexta de outubro) ✦</strong>
      Assim que definirmos formato, espaço e número final, ajustamos os últimos detalhes e cuidamos da produção da celebração.<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n'
        + cover + experiencias + como + vibe + espacos
        + pac_ceramica + pac_arranjos + pac_perfumaria
        + opcionais + proximos + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/experiencia-vi-ardore-100k.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
