# Proposta Elarah · Aniversário Lucy Andrade · Experiência de Drinks
# 12.07.2027 · 30 pessoas · Pinheiros-SP. Estilo aniversário aprovado (editorial, leve, feminino).
# HIERARQUIA: Workshop Drinks & Petiscos = EXPERIENCIA PRINCIPAL (Sugestao Elarah / Premium), R$ 479 p/p (R$ 14.370).
# Demais workshops = alternativas (cards menores). Sem fornecedor/comissao/margem/repasse.
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/orcamento-adriana.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]

head = re.sub(r'<title>.*?</title>', '<title>Aniversário Lucy Andrade · Experiência de Drinks · Elarah</title>', head, count=1, flags=re.DOTALL)
head = re.sub(r'<meta name="description"[^>]*>',
              '<meta name="description" content="Um aniversário para brindar. Experiência premium de drinks e petiscos para a Lucy Andrade — 30 pessoas, Pinheiros.">',
              head, count=1)

extra = '''
<style>
  /* capa */
  .pftitle{text-align:right;line-height:1.5}
  .pftitle .top{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--navy-soft);font-weight:700}
  .pftitle .big{font-size:17px;font-weight:800;color:var(--navy);letter-spacing:.01em;margin-top:2px}
  .pftitle .big em{font-style:normal;color:var(--orange)}
  .pftitle .sub{font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--navy-soft);font-weight:700;margin-top:2px}
  /* selos */
  .badges{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px}
  .badge{display:inline-flex;align-items:center;gap:6px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:800;padding:7px 15px;border-radius:999px}
  .badge.sug{background:var(--orange);color:#fff}
  .badge.prem{background:var(--navy);color:#fff}
  .badge.ghost{background:transparent;border:1.5px solid var(--orange);color:var(--orange-dark)}
  /* slide 2 — a experiencia (hero editorial + lista de destaques) */
  .expwrap{display:grid;grid-template-columns:1.08fr .92fr;gap:34px;margin-top:24px;width:100%;align-items:stretch}
  .exphero{border-radius:22px;overflow:hidden;position:relative;border:1px solid var(--line);box-shadow:0 24px 54px -28px rgba(0,0,0,.46);min-height:540px}
  .exphero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .exphero .cap{position:absolute;left:0;right:0;bottom:0;padding:60px 22px 22px;background:linear-gradient(to top,rgba(46,31,42,.9),transparent)}
  .exphero .cap .k{font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.82);font-weight:700}
  .exphero .cap .t{margin-top:5px;color:#fff;font-family:'DM Serif Display',serif;font-size:22px;line-height:1.15}
  .explist{display:flex;flex-direction:column;gap:14px;justify-content:center}
  .expc{display:grid;grid-template-columns:96px 1fr;gap:16px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:12px 16px 12px 12px;box-shadow:0 14px 34px -26px rgba(0,0,0,.3)}
  .expc .th{width:96px;height:96px;border-radius:12px;overflow:hidden;position:relative;flex:none}
  .expc .th img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .expc .th .no{position:absolute;left:8px;top:6px;font-family:'DM Serif Display',serif;font-size:15px;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.6)}
  .expc .bd .t{font-family:'DM Serif Display',serif;font-size:18px;color:var(--navy);line-height:1.1}
  .expc .bd .d{margin-top:5px;font-size:11.5px;color:var(--muted);line-height:1.45}
  /* slide 3 — experiencia premium (hero destaque) */
  .phero{display:grid;grid-template-columns:1.05fr 1fr;margin-top:18px;border-radius:24px;overflow:hidden;border:2px solid var(--orange);box-shadow:0 28px 64px -30px rgba(142,82,54,.55)}
  .phero .pic{position:relative;min-height:600px}
  .phero .pic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .phero .panel{background:var(--card);padding:30px 34px;display:flex;flex-direction:column}
  .phero .panel p{font-size:12px;color:var(--muted);line-height:1.55;margin:0 0 12px}
  .phero .panel p b{color:var(--navy);font-weight:700}
  .hl5{margin:4px 0 16px;background:#EBF1F4;border-left:4px solid var(--orange);border-radius:12px;padding:16px 20px;text-align:center}
  .hl5 .big{font-family:'DM Serif Display',serif;font-size:26px;color:var(--navy);line-height:1.1}
  .hl5 .big em{font-style:italic;color:var(--orange)}
  .hl5 .sub{margin-top:4px;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--navy-soft);font-weight:700}
  .pmeta{margin-top:auto;display:grid;grid-template-columns:1fr 1fr;gap:16px;border-top:1px solid var(--line);padding-top:16px}
  .pmeta .k{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange-dark);font-weight:800}
  .pmeta .v{margin-top:4px;font-size:12px;color:var(--navy-soft);line-height:1.4}
  .pmeta .v b{color:var(--navy);font-weight:700}
  /* slide 4 — menu editorial */
  .menu{display:flex;flex-direction:column;gap:13px;margin-top:22px;width:100%}
  .mrow{display:grid;grid-template-columns:40px 128px 1fr;gap:18px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:11px 22px 11px 11px;box-shadow:0 12px 30px -24px rgba(0,0,0,.3)}
  .mrow .no{font-family:'DM Serif Display',serif;font-size:24px;color:var(--orange);text-align:center}
  .mrow .th{width:128px;height:84px;border-radius:12px;overflow:hidden;position:relative}
  .mrow .th img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .mrow .nm{font-family:'DM Serif Display',serif;font-size:20px;color:var(--navy);line-height:1.1}
  .mrow .pair{margin-top:4px;font-size:12.5px;color:var(--muted);line-height:1.4}
  .mrow .pair b{color:var(--orange-dark);font-weight:700;letter-spacing:.04em;text-transform:uppercase;font-size:9.5px}
  /* slide 5 — investimento premium */
  .invp{display:grid;grid-template-columns:.92fr 1.08fr;gap:28px;margin-top:20px;align-items:stretch}
  .pcard{background:var(--navy);color:#fff;border-radius:22px;padding:34px 34px;display:flex;flex-direction:column;justify-content:center;box-shadow:0 26px 60px -30px rgba(60,31,40,.6)}
  .pcard .lab{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--orange);font-weight:800}
  .pcard .wk{font-family:'DM Serif Display',serif;font-size:22px;margin:8px 0 18px;line-height:1.12}
  .pcard .num{font-family:'DM Serif Display',serif;font-size:62px;line-height:1;color:var(--orange)}
  .pcard .per{margin-top:6px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.7);font-weight:700}
  .pcard .tot{margin-top:20px;padding-top:18px;border-top:1px solid rgba(255,255,255,.22)}
  .pcard .tot .k{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.7);font-weight:700}
  .pcard .tot .v{font-family:'DM Serif Display',serif;font-size:34px;color:var(--orange);line-height:1.05;margin-top:3px}
  .inccard{background:var(--card);border:1px solid var(--line);border-radius:22px;padding:28px 32px;box-shadow:0 18px 44px -28px rgba(0,0,0,.34);display:flex;flex-direction:column;justify-content:center}
  .inccard .h{font-family:'DM Serif Display',serif;font-size:18px;color:var(--navy);margin:0 0 16px}
  .incl{display:grid;grid-template-columns:1fr 1fr;gap:11px 22px}
  .incl .i{display:flex;align-items:flex-start;gap:9px;font-size:12.5px;color:var(--navy-soft);line-height:1.35}
  .incl .i::before{content:"✓";color:var(--orange);font-weight:800;flex:none;margin-top:1px}
  .incnote{margin-top:16px;padding-top:14px;border-top:1px solid var(--line);font-size:11px;color:var(--muted);line-height:1.5}
  .incnote b{color:var(--navy);font-weight:700}
  /* slide 6 — outras formas (cards menores) */
  .altg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:22px;width:100%}
  .altc{display:grid;grid-template-columns:104px 1fr;gap:0;background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:0 12px 30px -24px rgba(0,0,0,.28);min-width:0}
  .altc .th{position:relative;min-height:100%}
  .altc .th img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .altc .bd{padding:14px 18px 14px 16px;display:flex;flex-direction:column;min-width:0}
  .altc .nm{font-family:'DM Serif Display',serif;font-size:16px;color:var(--navy);line-height:1.1}
  .altc .ds{margin-top:5px;font-size:10.5px;color:var(--muted);line-height:1.4}
  .altc .pr{margin-top:auto;padding-top:9px;font-size:11px;color:var(--navy-soft);font-weight:700}
  .altc .pr b{font-family:'DM Serif Display',serif;font-weight:400;font-size:19px;color:var(--orange-dark)}
  .altc .pr span{font-weight:600;color:var(--muted)}
  .altc .inc{margin-top:5px;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--orange-dark);font-weight:700}
  .noteband{margin-top:20px;background:#EBF1F4;border-left:4px solid var(--orange);border-radius:12px;padding:14px 20px;font-size:11.5px;color:var(--navy-soft);line-height:1.5}
  .noteband b{color:var(--navy);font-weight:700}
  /* slide 7 — onde + fechamento */
  .finwrap{display:grid;grid-template-columns:.92fr 1.08fr;gap:34px;margin-top:18px;align-items:center}
  .finwrap .ph{border-radius:20px;overflow:hidden;border:1px solid var(--line);box-shadow:0 22px 52px -28px rgba(0,0,0,.45);height:360px;position:relative}
  .finwrap .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .finwrap p.lead{margin-top:0;font-size:13px}
  .bigquote{margin-top:16px;font-family:'DM Serif Display',serif;font-size:23px;color:var(--navy);line-height:1.2}
  .bigquote em{font-style:italic;color:var(--orange)}
  .ctabox{margin-top:18px;background:var(--navy);color:#fff;border-radius:16px;padding:20px 26px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px}
  .ctabox .t{font-family:'DM Serif Display',serif;font-size:21px;line-height:1.15;margin:0}
  .ctabox .t em{font-style:italic;color:var(--orange)}
  .ctabox .ct{font-size:11.5px;color:rgba(255,255,255,.85);line-height:1.5;text-align:right}
  .ctabox .ct b{color:#fff}
  .finnote{margin-top:14px;font-size:9.5px;color:var(--muted);font-style:italic;line-height:1.55}
</style>'''
head = head.replace("</head>", extra + "</head>", 1)


def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'


def img(src, alt, pos="center 50%"):
    return f'<img src="assets/{src}" alt="{alt}" style="object-position:{pos}">'


def head_simple(kicker):
    return f'''    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">{kicker}</span></div>
    </div>'''


def expc(no, src, titulo, desc, pos="center 50%"):
    return (f'<div class="expc"><div class="th">{img(src, titulo, pos)}<span class="no">{no}</span></div>'
            f'<div class="bd"><div class="t">{titulo}</div><div class="d">{desc}</div></div></div>')


def mrow(no, src, nome, pairing, pos="center 50%"):
    return (f'<div class="mrow"><div class="no">{no}</div><div class="th">{img(src, nome, pos)}</div>'
            f'<div><div class="nm">{nome}</div><div class="pair"><b>harmoniza com</b><br>{pairing}</div></div></div>')


def altc(src, nome, desc, preco, total, pos="center 50%"):
    return (f'<div class="altc"><div class="th">{img(src, nome, pos)}</div>'
            f'<div class="bd"><div class="nm">{nome}</div><div class="ds">{desc}</div>'
            f'<div class="pr"><b>{preco}</b> / pessoa <span>· 30 pessoas · {total}</span></div>'
            f'<div class="inc">inclui workshop + petiscos</div></div></div>')


# ===== 1 · CAPA =====
cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><div class="pftitle"><div class="top">Proposta de experiência</div><div class="big">Lucy <em>Andrade</em></div><div class="sub">Aniversário · 12.07</div></div></div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Aniversário · Experiência de drinks</span>
        <h1>Um aniversário para <em>brindar</em> ✨</h1>
        <p class="lead">Uma experiência <strong>leve, divertida e cheia de sabor</strong> para comemorar entre amigos — com drinks na mão, petiscos na mesa e muitas risadas.</p>
        <div class="chips">
          <span class="chip"><b>12.07.2027</b></span>
          <span class="chip"><b>30</b> pessoas</span>
          <span class="chip">São Paulo · local a definir</span>
        </div>
      </div>
      <div class="cover-photo">{img("andre-brinde.jpg", "Amigos reunidos brindando e rindo juntos", "center 35%")}</div>
    </div>
    {foot("Aniversário · Lucy Andrade")}
  </section>'''

# ===== 2 · A EXPERIÊNCIA =====
experiencia = f'''
  <section class="slide">
{head_simple("A experiência")}
    <span class="eyebrow orange">◆ A experiência</span>
    <h2>Mais do que drinks, uma experiência <em>para viver juntos</em></h2>
    <p class="lead">Todo mundo coloca a mão na massa, prova, descobre e brinda. Um encontro pensado para transformar o aniversário em uma experiência <strong>divertida, gostosa e cheia de boas memórias</strong>.</p>
    <div class="expwrap">
      <div class="exphero">{img("andre-brinde-drinks.jpg", "Amigas brindando com coquetéis", "center 35%")}
        <div class="cap"><div class="k">Entre amigos</div><div class="t">Preparar, provar<br>e brindar juntos</div></div>
      </div>
      <div class="explist">
        {expc("01", "andre-preparo.jpg", "Mão na massa", "Cada um assume o shaker e prepara o próprio drink.", "center 45%")}
        {expc("02", "drinks-degustacao.jpg", "Degustação", "Provar, comparar e descobrir novos sabores guiados.", "center 50%")}
        {expc("03", "drinkspetisco.jpg", "Drinks + petiscos", "Coquetéis que ganham o acompanhamento perfeito.", "center 55%")}
        {expc("04", "andre-mesa-drinks.jpg", "Experiência compartilhada", "Tudo pensado para aproximar e render boas histórias.", "center 45%")}
      </div>
    </div>
    {foot("A experiência")}
  </section>'''

# ===== 3 · EXPERIÊNCIA PRINCIPAL (PREMIUM) =====
premium = f'''
  <section class="slide">
{head_simple("Experiência premium")}
    <div class="badges"><span class="badge sug">★ Sugestão Elarah</span><span class="badge prem">Experiência Premium</span></div>
    <h2>Workshop <em>Drinks &amp; Petiscos</em></h2>
    <p class="lead">Uma experiência de harmonização entre <strong>coquetelaria e gastronomia</strong>.</p>
    <div class="phero">
      <div class="pic">{img("drinkspetisco.jpg", "Drink autoral harmonizado com petiscos finos", "center 55%")}</div>
      <div class="panel">
        <p>Uma experiência descontraída e saborosa para descobrir como as características dos coquetéis <b>transformam a percepção dos alimentos</b> — e vice-versa.</p>
        <p>Os convidados conhecem a história e as características dos coquetéis, participam do preparo e experimentam combinações pensadas para explorar <b>sabores, aromas, texturas e contrastes</b>.</p>
        <div class="hl5"><div class="big">5 coquetéis <em>+</em> 5 harmonizações</div><div class="sub">especialmente pensadas para o grupo</div></div>
        <div class="pmeta">
          <div><div class="k">Duração</div><div class="v"><b>2 a 3 horas</b> de experiência</div></div>
          <div><div class="k">Formato</div><div class="v">Degustação guiada · preparo · conversa sobre harmonização</div></div>
        </div>
      </div>
    </div>
    {foot("Experiência premium · Workshop Drinks & Petiscos")}
  </section>'''

# ===== 4 · O MENU DA EXPERIÊNCIA PREMIUM =====
menu = f'''
  <section class="slide">
{head_simple("O menu da experiência premium")}
    <span class="eyebrow orange">◆ Workshop Drinks &amp; Petiscos</span>
    <h2>Cinco brindes. <em>Cinco harmonizações.</em></h2>
    <div class="menu">
      {mrow("01", "andre-mesa-drinks.jpg", "Aperol Spritz", "Bruschetta de tomate, manjericão e azeite", "center 45%")}
      {mrow("02", "drinkspetisco.jpg", "Fitzgerald", "Camarão empanado + molho cítrico", "center 55%")}
      {mrow("03", "andre-caipirinha.jpg", "Caipirinha de Maracujá com Gengibre", "Dadinho de tapioca + geleia de maracujá", "center 55%")}
      {mrow("04", "harmonizacaoqueijos.jpg", "Negroni", "Mini quiche de queijo", "center 50%")}
      {mrow("05", "andre-coffee-cocktail.jpg", "Espresso Martini", "Brownie + sorvete de baunilha", "center 50%")}
    </div>
    {foot("O menu da experiência premium")}
  </section>'''

# ===== 5 · INVESTIMENTO DA EXPERIÊNCIA PREMIUM =====
inc_items = [
    "Workshop guiado", "Preparo dos coquetéis", "5 coquetéis", "5 harmonizações especiais",
    "Ingredientes", "Materiais e utensílios", "Profissional responsável", "Operação da experiência",
]
inc_html = "".join(f'<div class="i">{t}</div>' for t in inc_items)
investimento = f'''
  <section class="slide">
{head_simple("Investimento · experiência premium")}
    <div class="badges"><span class="badge sug">★ Sugestão Elarah</span><span class="badge prem">Experiência Premium</span></div>
    <h2>O investimento para <em>brindar juntos</em></h2>
    <div class="invp">
      <div class="pcard">
        <div class="lab">Workshop Drinks &amp; Petiscos</div>
        <div class="wk">Experiência completa<br>de coquetelaria</div>
        <div class="num">R$ 479</div>
        <div class="per">por pessoa · 30 pessoas</div>
        <div class="tot"><div class="k">Total da experiência</div><div class="v">R$ 14.370</div></div>
      </div>
      <div class="inccard">
        <p class="h">O valor inclui tudo o que a experiência precisa:</p>
        <div class="incl">{inc_html}</div>
        <p class="incnote">Valor referente <b>apenas à experiência</b>. A locação do espaço não está incluída.</p>
      </div>
    </div>
    {foot("Investimento · experiência premium")}
  </section>'''

# ===== 6 · OUTRAS FORMAS DE BRINDAR =====
outras = f'''
  <section class="slide">
{head_simple("Outras formas de brindar")}
    <span class="eyebrow orange">◆ Se preferirem outro formato</span>
    <h2>Outras formas de <em>brindar</em></h2>
    <p class="lead">Alternativas para quem quiser outro estilo ou faixa de investimento — todas com a <strong>mesma dedicação</strong> da Elarah.</p>
    <div class="altg">
      {altc("andre-caipirinha.jpg", "Workshop de Caipirinha", "Técnicas e variações da caipirinha com diferentes frutas, açúcares e bebidas.", "R$ 319", "R$ 9.570", "center 55%")}
      {altc("andre-gin.jpg", "Gin &amp; seus drinks", "História e características do gin, com degustação e preparo de clássicos e variações.", "R$ 389", "R$ 11.670", "center 50%")}
      {altc("andre-coffee-cocktail.jpg", "Drinks com Café", "Bebidas quentes e geladas à base de café, com e sem álcool, de clássicos a criações.", "R$ 389", "R$ 11.670", "center 50%")}
      {altc("andre-cerveja.jpg", "Cervejas Especiais", "Estilos, ingredientes, produção, história, serviço e degustação guiada.", "R$ 459", "R$ 13.770", "center 55%")}
    </div>
    <div class="noteband">Valores para <b>30 pessoas</b> · referentes <b>apenas à experiência</b> (locação do espaço não inclusa) · <b>petiscos inclusos</b> em cada workshop.</div>
    {foot("Outras formas de brindar")}
  </section>'''

# ===== 7 · ONDE ACONTECE + FECHAMENTO =====
final = f'''
  <section class="slide">
{head_simple("Onde acontece & fechamento")}
    <span class="eyebrow orange">◆ Onde acontece</span>
    <h2>A experiência <em>vai até vocês</em></h2>
    <div class="finwrap">
      <div class="ph">{img("andre-mesa-drinks.jpg", "Grupo reunido à mesa com drinks e petiscos", "center 45%")}</div>
      <div>
        <p class="lead">Realizamos a experiência no espaço escolhido para a comemoração — salão de festas, casa ou um espaço parceiro. O <strong>local ainda está a definir</strong>: buscamos e confirmamos as melhores opções com nossos parceiros cerca de 6 meses antes da data. A Elarah cuida da experiência, dos profissionais, ingredientes, materiais e operação.</p>
        <p class="bigquote">"Vocês brindam. <em>A gente cuida do resto.</em>"</p>
      </div>
    </div>
    <div class="ctabox">
      <p class="t">Agora é só escolher o <em>primeiro brinde</em> 🧡</p>
      <p class="ct">O resto a gente prepara por aqui.<br>WhatsApp <b>+55 (11) 91445-5930</b> · @elarah.oficial</p>
    </div>
    <p class="finnote">Valores referentes apenas à experiência para 30 participantes. O local ainda está a definir e a locação do espaço não está incluída nesta proposta. Como o evento acontece em julho de 2027, confirmamos as opções de espaços parceiros com valores mais precisos cerca de 6 meses antes da data. Os valores das experiências podem ser garantidos mediante fechamento e confirmação da reserva.</p>
    {foot("Aniversário · Lucy Andrade")}
  </section>'''

deck = ('<div class="deck">\n' + cover + experiencia + premium + menu
        + investimento + outras + final + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/aniversario-lucy-andrade.html"
io.open(out, "w", encoding="utf-8").write(html)

# ---- guardas ----
for bad in ["fornecedor", "repasse", "comiss", "margem", "20%", "sob consulta", "nightclub", "balada", "neon"]:
    assert bad not in deck.lower(), f"PROIBIDO: {bad}"
for val in ["R$ 479", "R$ 14.370", "R$ 319", "R$ 9.570", "R$ 389", "R$ 11.670", "R$ 459", "R$ 13.770"]:
    assert val in deck, f"FALTA VALOR: {val}"
assert deck.count("inclui workshop + petiscos") == 4, "4 cards alternativos devem ter 'inclui workshop + petiscos'"
assert deck.count("Sugestão Elarah") == 2, "selo Sugestão Elarah no premium (slide 3) e investimento (slide 5)"
assert deck.count("Experiência Premium") == 2, "selo Experiência Premium em 2 slides"
assert "drinksclassicos" not in deck, "nao usar foto de drink isolado no escuro"
assert "shoyu-grupo-brinde" not in deck, "foto de ceramica/argila nao faz sentido no deck de drinks"
assert "5 coquetéis" in deck and "5 harmonizações" in deck, "faltou destaque 5+5"
assert "Cinco brindes" in deck, "faltou titulo do menu"
assert "Agora é só escolher o" in deck, "falta frase de fechamento"
assert "Vocês brindam" in deck, "falta frase destaque"
assert "locação do espaço não está incluída" in deck, "falta rodape de locacao"
assert "julho de 2027" in deck, "falta rodape de espacos parceiros"
assert html.count('<section class="slide">') == 7, "esperado 7 slides"
# premium antes das alternativas
assert deck.index("Experiência Premium") < deck.index("Outras formas de"), "premium deve vir antes das alternativas"
print("wrote", out, "| slides:", html.count('<section class="slide">'))
