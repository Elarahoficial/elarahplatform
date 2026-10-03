# Proposta Elarah · Evento Corporativo Gastronômico · 22/10 · 16 pessoas
# Base: portfolio corporativo APROVADO (mesma logica visual, estrutura, linguagem e componentes).
# Experiencias, descricoes e precos REAPROVEITADOS do portfolio (nao inventar):
#   Entre Fatias & Taças R$ 349 · Experiência Gastronômica (mão na massa) R$ 429 · Bartenderia & Coquetelaria R$ 319
# Sem fornecedor/margem/comissao. Elarah vai ate o espaco da empresa OU espaco parceiro.
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/orcamento-adriana.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]

head = re.sub(r'<title>.*?</title>', '<title>Experiência Corporativa Gastronômica · Elarah</title>', head, count=1, flags=re.DOTALL)
head = re.sub(r'<meta name="description"[^>]*>',
              '<meta name="description" content="Experiência corporativa gastronômica da Elarah — pizza & vinho, mão na massa e coquetelaria para o time. A Elarah vai até vocês.">',
              head, count=1)

extra = '''
<style>
  .pftitle{text-align:right;line-height:1.5}
  .pftitle .top{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--navy-soft);font-weight:700}
  .pftitle .big{font-size:17px;font-weight:800;color:var(--navy);letter-spacing:.01em;margin-top:2px}
  .pftitle .big em{font-style:normal;color:var(--orange)}
  .pftitle .sub{font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--navy-soft);font-weight:700;margin-top:2px}
  .pfproof{display:flex;gap:11px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:13px 18px;box-shadow:0 12px 30px -24px rgba(0,0,0,.3)}
  .pfproof .star{color:var(--orange);font-size:14px}
  .pfproof p{font-size:12px;color:var(--navy-soft);line-height:1.5;margin:0}
  .pfproof b{color:var(--navy);font-weight:700}
  .pffoot{margin-top:auto;width:100%;box-sizing:border-box}
  .noteband{margin-top:22px;background:#EBF1F4;border-left:4px solid var(--orange);border-radius:12px;padding:16px 22px;font-size:12.5px;color:var(--navy-soft);line-height:1.55}
  .noteband b{color:var(--navy);font-weight:700}
  /* conceito (3 cards foto) */
  .pqg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin-top:22px;width:100%}
  .pqc{background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 38px -26px rgba(0,0,0,.34);min-width:0}
  .pqc .ph{height:184px;position:relative;overflow:hidden}
  .pqc .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .pqc .bd{padding:18px 20px 20px}
  .pqc h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy);margin:0 0 7px;line-height:1.14}
  .pqc p{font-size:12px;color:var(--muted);line-height:1.55;margin:0}
  .pqc p b{color:var(--navy);font-weight:700}
  /* vitrine (menu cards) */
  .menu{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin-top:22px;width:100%}
  .mc{background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 38px -26px rgba(0,0,0,.34);min-width:0}
  .mc.sugg{border:2px solid var(--orange)}
  .mc .mph{height:170px;position:relative;overflow:hidden}
  .mc .mph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .mc .badge{position:absolute;top:10px;left:10px;background:var(--orange);color:#fff;font-size:9px;letter-spacing:.1em;text-transform:uppercase;font-weight:800;padding:5px 11px;border-radius:999px}
  .mc .mbd{padding:16px 19px 18px;display:flex;flex-direction:column;flex:1}
  .mc .cat{font-size:9px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .mc .nm{font-family:'DM Serif Display',serif;font-size:19px;color:var(--navy);margin:5px 0 7px;line-height:1.08}
  .mc .ds{font-size:11px;color:var(--muted);line-height:1.5;margin:0 0 13px}
  .mc .pr{margin-top:auto;font-size:11.5px;font-weight:700;color:var(--navy-soft)}
  .mc .pr b{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--orange-dark)}
  /* como funciona / proximos passos (steps) */
  .stg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-top:22px;width:100%}
  .stc{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px 22px;box-shadow:0 12px 30px -24px rgba(0,0,0,.3)}
  .stc .n{font-family:'DM Serif Display',serif;font-size:30px;color:var(--orange);line-height:1}
  .stc h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy);margin:8px 0 6px;line-height:1.1}
  .stc p{font-size:11.5px;color:var(--muted);line-height:1.5;margin:0}
  /* incluso (3 cards com lista) */
  .incg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin-top:22px;width:100%}
  .incc{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px 24px;box-shadow:0 16px 38px -26px rgba(0,0,0,.32);display:flex;flex-direction:column;min-width:0}
  .incc.sugg{border:2px solid var(--orange)}
  .incc .cat{font-size:9px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .incc .nm{font-family:'DM Serif Display',serif;font-size:19px;color:var(--navy);margin:5px 0 13px;line-height:1.08}
  .incc ul{list-style:none;margin:0;padding:0;display:grid;gap:9px}
  .incc li{position:relative;padding-left:20px;font-size:12px;color:var(--ink);line-height:1.42}
  .incc li .ck{position:absolute;left:0;top:0;color:var(--orange);font-weight:800}
  .incc li b{color:var(--navy);font-weight:700}
  /* investimento (lista 1 col) */
  .ginvl{display:grid;grid-template-columns:1fr;margin-top:20px}
  .ginvl .row{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding:15px 4px}
  .ginvl .row:first-child{border-top:1px solid var(--line)}
  .ginvl .row .e{font-family:'DM Serif Display',serif;font-size:19px;color:var(--navy);line-height:1.1}
  .ginvl .row .e small{display:block;font-family:'DM Sans',sans-serif;font-size:10.5px;letter-spacing:.04em;color:var(--muted);font-weight:600;margin-top:3px}
  .ginvl .row .pr{text-align:right;font-family:'DM Serif Display',serif;font-size:22px;color:var(--orange-dark);white-space:nowrap}
  .ginvl .row .pr i{font-family:'DM Sans',sans-serif;font-style:normal;font-size:11px;color:var(--navy-soft);font-weight:700}
  .ctabox{margin-top:20px;background:#EBF1F4;border-left:4px solid var(--orange);border-radius:14px;padding:20px 26px}
  .ctabox .t{font-family:'DM Serif Display',serif;font-size:19px;color:var(--navy);margin:0 0 7px}
  .ctabox .t em{font-style:italic;color:var(--orange)}
  .ctabox p{font-size:12.5px;color:var(--navy-soft);line-height:1.6;margin:0}
  .ctabox b{color:var(--navy);font-weight:700}
</style>'''
head = head.replace("</head>", extra + "</head>", 1)

FOOTNOTE = ("Valores a partir de, por pessoa. O investimento final pode variar conforme número de "
            "participantes, localização, espaço escolhido, deslocamento, duração, estrutura necessária "
            "e formato da experiência. Cada proposta é ajustada de acordo com o briefing do evento.")
FOOTNOTE_CURTO = ("Valores a partir de, por pessoa — ajustados conforme número de participantes, local, "
                  "duração, estrutura e formato. Cada proposta é feita sob o briefing do evento.")


def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'


def img(src, alt, pos="center 50%"):
    return f'<img src="assets/{src}" alt="{alt}" style="object-position:{pos}">'


def head_simple(kicker):
    return f'''    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">{kicker}</span></div>
    </div>'''


def pqc(src, titulo, desc, pos="center 50%"):
    return (f'<div class="pqc"><div class="ph">{img(src, titulo, pos)}</div>'
            f'<div class="bd"><h3>{titulo}</h3><p>{desc}</p></div></div>')


def mc(cat, nome, desc, preco, src, pos="center 50%", sugg=False):
    cls = "mc sugg" if sugg else "mc"
    badge = '<div class="badge">★ Sugestão Elarah</div>' if sugg else ''
    return (f'<div class="{cls}"><div class="mph">{img(src, nome, pos)}{badge}</div>'
            f'<div class="mbd"><div class="cat">{cat}</div><div class="nm">{nome}</div>'
            f'<div class="ds">{desc}</div><div class="pr">A partir de <b>{preco}</b> / pessoa</div></div></div>')


def stc(n, titulo, desc):
    return f'<div class="stc"><div class="n">{n}</div><h3>{titulo}</h3><p>{desc}</p></div>'


def incc(cat, nome, itens, sugg=False):
    cls = "incc sugg" if sugg else "incc"
    lis = "".join(f'<li><span class="ck">✓</span>{t}</li>' for t in itens)
    return f'<div class="{cls}"><div class="cat">{cat}</div><div class="nm">{nome}</div><ul>{lis}</ul></div>'


def ginv(nome, ref, preco):
    return (f'<div class="row"><span class="e">{nome}<small>{ref}</small></span>'
            f'<span class="pr">A partir de {preco} <i>/ pessoa</i></span></div>')


# ===== 1 · CAPA =====
cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><div class="pftitle"><div class="top">Proposta corporativa</div><div class="big">Experiência <em>Gastronômica</em></div><div class="sub">Evento corporativo · 22.10</div></div></div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Evento corporativo · experiência gastronômica</span>
        <h1>Uma experiência <em>gastronômica</em> para o time</h1>
        <p class="lead">Um encontro para o time sair da rotina, sentar à mesma mesa e <strong>compartilhar uma experiência gostosa</strong> — com a Elarah cuidando de toda a produção, no espaço de vocês ou em um espaço parceiro. 🧡</p>
        <div class="chips">
          <span class="chip"><b>22.10</b></span>
          <span class="chip"><b>16</b> pessoas</span>
          <span class="chip">Experiência gastronômica</span>
          <span class="chip">A Elarah vai até vocês</span>
        </div>
      </div>
      <div class="cover-photo">{img("bfa-grupo1.webp", "Time corporativo reunido à mesa em uma experiência gastronômica", "center 50%")}</div>
    </div>
    <div class="pfproof pffoot"><span class="star">★</span><p>Já realizado para times de empresas como <b>Amazon</b>, <b>Natura</b>, <b>Itaú</b> e <b>Compass</b> · visto no <b>Mais Você</b> (Globo)</p></div>
    {foot("Experiência corporativa · 22.10")}
  </section>'''

# ===== 2 · CONCEITO =====
conceito = f'''
  <section class="slide">
{head_simple("O conceito")}
    <span class="eyebrow orange">◆ O que o time leva junto</span>
    <h2>Um momento para <em>sair da rotina</em></h2>
    <p class="lead">Mais do que um almoço de equipe: algumas horas para o time <strong>desacelerar, conversar fora do crachá e viver algo junto</strong> — do preparo ao brinde.</p>
    <div class="pqg">
      {pqc("eventocorporativo.jpg", "Sair da rotina", "Trocar a sala de reunião por uma mesa posta <b>muda o clima na hora</b>.", "center 40%")}
      {pqc("bfa-grupo2.webp", "Conectar de verdade", "Áreas e níveis diferentes <b>se misturam sozinhos</b> quando todo mundo senta junto.", "center 45%")}
      {pqc("corp-criativo.jpg", "Compartilhar", "Uma experiência vivida em grupo vira <b>memória coletiva</b> — e assunto depois.", "center 40%")}
    </div>
    <div class="noteband">◆ <b>A Elarah cuida de tudo:</b> profissionais que conduzem, ingredientes, materiais, montagem e operação. O time só precisa chegar.</div>
    {foot("O conceito")}
  </section>'''

# ===== 3 · OPÇÕES GASTRONÔMICAS =====
opcoes = f'''
  <section class="slide">
{head_simple("Opções gastronômicas")}
    <span class="eyebrow orange">◆ Escolham a experiência</span>
    <h2>Opções <em>gastronômicas</em> para o grupo</h2>
    <p class="lead">Três experiências que já aprovamos e que funcionam muito bem para <strong>grupos corporativos</strong> — descontraídas, saborosas e feitas para compartilhar.</p>
    <div class="menu">
      {mc("Gastronômica · Mesa", "Entre Fatias &amp; Taças", "Pizza artesanal e vinhos: uma experiência gastronômica pra compartilhar.", "R$ 349", "pizzanegroni.jpg", "center 50%", sugg=True)}
      {mc("Gastronômica · Mão na massa", "Experiência Gastronômica", "Mão na massa em torno da gastronomia, criada pra aproximar o grupo.", "R$ 429", "corp-grupo.jpg", "center 50%")}
      {mc("Social · Drinks", "Bartenderia &amp; Coquetelaria", "Com bartender, aprendem técnicas e preparam os próprios drinks autorais.", "R$ 319", "andre-mesa-drinks.jpg", "center 50%")}
    </div>
    <p class="fineprint">{FOOTNOTE_CURTO}</p>
    {foot("Opções gastronômicas")}
  </section>'''

# ===== 4 · COMO FUNCIONA =====
comofunciona = f'''
  <section class="slide">
{head_simple("Como funciona")}
    <span class="eyebrow orange">◆ Onde acontece</span>
    <h2>A Elarah <em>vai até vocês</em></h2>
    <p class="lead">Levamos toda a experiência para o espaço da empresa — ou indicamos e cotamos um <strong>espaço parceiro</strong>, se preferirem.</p>
    <div class="stg">
      {stc("01", "No espaço de vocês", "A empresa tem espaço próprio? A gente leva tudo e monta por lá, sem complicação.")}
      {stc("02", "Ou em um espaço parceiro", "Se preferirem, indicamos e cotamos um espaço parceiro para receber o encontro.")}
      {stc("03", "A gente opera tudo", "Profissionais, ingredientes, materiais, montagem e operação por nossa conta.")}
    </div>
    <div class="noteband">◆ Vocês escolhem o <b>local</b> e a <b>experiência</b>; a Elarah cuida da montagem, dos profissionais, dos materiais e de toda a operação no dia.</div>
    {foot("Como funciona")}
  </section>'''

# ===== 5 · O QUE ESTÁ INCLUSO =====
incluso = f'''
  <section class="slide">
{head_simple("O que está incluso")}
    <span class="eyebrow orange">◆ O que está incluso</span>
    <h2>Tudo pronto <em>para o grupo</em></h2>
    <p class="lead">Cada experiência já vem completa — do profissional que conduz aos materiais e à <strong>operação no dia</strong>.</p>
    <div class="incg">
      {incc("Gastronômica · Mesa", "Entre Fatias &amp; Taças", ["Rodízio de <b>pizzas artesanais</b>", "Degustação de <b>vinhos</b> (Branco, Rosé e Tinto)", "Dicas de <b>harmonização</b>", "Profissionais e operação"], sugg=True)}
      {incc("Gastronômica · Mão na massa", "Experiência Gastronômica", ["<b>Chef</b> conduz a experiência", "Ingredientes e materiais", "<b>Mão na massa</b> em grupo", "Degustação do que for preparado"])}
      {incc("Social · Drinks", "Bartenderia &amp; Coquetelaria", ["<b>Bartender</b> conduz a experiência", "Técnicas de coquetelaria", "Preparo dos <b>próprios drinks</b>", "Insumos e materiais"])}
    </div>
    <div class="noteband">◆ Em todas as experiências a Elarah leva <b>profissionais, materiais, montagem e operação</b>. A locação do espaço é à parte — no espaço de vocês ou em um parceiro.</div>
    {foot("O que está incluso")}
  </section>'''

# ===== 6 · INVESTIMENTO =====
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Valores <em>por pessoa</em></h2>
    <p class="lead">Valores <strong>a partir de, por pessoa</strong>, no formato de cada experiência. O total é fechado pela experiência escolhida × <strong>16 participantes</strong>.</p>
    <div class="ginvl">
      {ginv("Bartenderia &amp; Coquetelaria", "16 pessoas · a partir de R$ 5.104", "R$ 319")}
      {ginv("Entre Fatias &amp; Taças", "16 pessoas · a partir de R$ 5.584", "R$ 349")}
      {ginv("Experiência Gastronômica", "16 pessoas · a partir de R$ 6.864", "R$ 429")}
    </div>
    <div class="noteband">◆ Valores por pessoa já com <b>profissionais, materiais e operação</b>. <b>Não inclui</b> a locação do espaço (realizamos no espaço de vocês ou em um parceiro, cotado à parte).</div>
    <p class="fineprint">{FOOTNOTE}</p>
    {foot("Investimento")}
  </section>'''

# ===== 7 · PRÓXIMOS PASSOS =====
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Simples e sob medida</span>
    <h2>É só <em>reunir o time</em></h2>
    <p class="lead">A Elarah cuida de toda a produção para o encontro ser leve do começo ao fim.</p>
    <div class="stg">
      {stc("01", "Escolham a experiência", "Entre Fatias &amp; Taças, Experiência Gastronômica ou Bartenderia &amp; Coquetelaria.")}
      {stc("02", "Definimos o local", "No espaço de vocês ou em um espaço parceiro que indicamos e cotamos.")}
      {stc("03", "A gente leva tudo no dia", "Profissionais, materiais e estrutura montados para o grupo em 22.10.")}
    </div>
    <div class="ctabox">
      <p class="t">Bora reunir o time? <em>✦</em></p>
      <p>Confirmem a <b>experiência</b> e o <b>local</b>, que a gente organiza os próximos passos e cuida de toda a produção.<br><i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <b>+55 (11) 91445-5930</b> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br</p>
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n' + cover + conceito + opcoes + comofunciona
        + incluso + investimento + proximos + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/proposta-corporativo-gastronomico.html"
io.open(out, "w", encoding="utf-8").write(html)

# ---- guardas ----
for bad in ["fornecedor", "repasse", "comiss", "margem", "sob consulta"]:
    assert bad not in deck.lower(), f"PROIBIDO: {bad}"
# precos aprovados (nao inventar)
for val in ["R$ 319", "R$ 349", "R$ 429", "R$ 5.104", "R$ 5.584", "R$ 6.864"]:
    assert val in deck, f"FALTA VALOR: {val}"
for nome in ["Entre Fatias &amp; Taças", "Experiência Gastronômica", "Bartenderia &amp; Coquetelaria"]:
    assert nome in deck, f"FALTA EXPERIENCIA: {nome}"
# nao inventar experiencias fora do portfolio aprovado
for ruim in ["Tufting", "Cerâmica", "Perfumaria", "Charm Bag", "Low Poly", "Folding"]:
    assert ruim not in deck, f"EXPERIENCIA FORA DO ESCOPO: {ruim}"
assert "16 participantes" in deck
assert html.count('<section class="slide">') == 7, "esperado 7 slides"
print("wrote", out, "| slides:", html.count('<section class="slide">'))
