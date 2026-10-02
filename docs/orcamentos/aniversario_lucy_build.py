# Proposta Elarah · Aniversário Lucy Andrade · Experiência de Drinks
# 12.07.2027 · 30 pessoas · Pinheiros-SP. Estilo aniversário aprovado (editorial, leve, feminino, muita foto).
# 7 slides. 4 workshops (Caipirinha / Gin / Drinks com Café / Cervejas Especiais) com preco p/p e total.
# "inclui: workshop + petiscos". SEM fornecedor/comissao/margem. Fotos reais (andre-*, brinde, petiscos).
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/orcamento-adriana.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]

head = re.sub(r'<title>.*?</title>', '<title>Aniversário Lucy Andrade · Experiência de Drinks · Elarah</title>', head, count=1, flags=re.DOTALL)
head = re.sub(r'<meta name="description"[^>]*>',
              '<meta name="description" content="Um aniversário para brindar. Experiência de drinks para a Lucy Andrade — 30 pessoas, Pinheiros. Leve, divertida e cheia de sabor.">',
              head, count=1)

extra = '''
<style>
  /* capa (padrao aprovado) */
  .pftitle{text-align:right;line-height:1.5}
  .pftitle .top{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--navy-soft);font-weight:700}
  .pftitle .big{font-size:17px;font-weight:800;color:var(--navy);letter-spacing:.01em;margin-top:2px}
  .pftitle .big em{font-style:normal;color:var(--orange)}
  .pftitle .sub{font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--navy-soft);font-weight:700;margin-top:2px}
  .cover-note{margin-top:14px;font-size:11.5px;color:var(--muted);font-style:italic;line-height:1.5;max-width:42ch}
  /* note band */
  .noteband{margin-top:22px;background:#EBF1F4;border-left:4px solid var(--orange);border-radius:12px;padding:16px 22px;font-size:12.5px;color:var(--navy-soft);line-height:1.55}
  .noteband b{color:var(--navy);font-weight:700}
  /* mosaico atmosfera/experiencia (vibestrip) */
  .vibestrip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px;margin-top:24px;width:100%}
  .vibestrip figure{margin:0;border-radius:16px;overflow:hidden;position:relative;height:300px;box-shadow:0 14px 34px -24px rgba(0,0,0,.4)}
  .vibestrip img{width:100%;height:100%;object-fit:cover;display:block}
  .vibestrip figcaption{position:absolute;left:0;right:0;bottom:0;padding:34px 14px 14px;color:#fff;font-family:'DM Serif Display',serif;font-size:15px;line-height:1.18;background:linear-gradient(to top,rgba(46,31,42,.92),transparent)}
  /* highlights (chips grandes) */
  .hlrow{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:20px;width:100%}
  .hlc{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px;box-shadow:0 12px 28px -24px rgba(0,0,0,.3);text-align:center}
  .hlc .ic{font-size:20px}
  .hlc .tx{margin-top:6px;font-size:11.5px;font-weight:700;color:var(--navy);line-height:1.25}
  /* workshops (4 cards, 2 por linha, com foto) */
  .wkg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;margin-top:22px;width:100%;align-items:stretch}
  .wkc{background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 16px 38px -26px rgba(0,0,0,.34);display:flex;flex-direction:column;min-width:0}
  .wkc.hl{border:2px solid var(--orange)}
  .wkc .ph{height:150px;position:relative;overflow:hidden}
  .wkc .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .wkc .bd{padding:16px 20px 18px;display:flex;flex-direction:column;flex:1}
  .wkc .nm{font-family:'DM Serif Display',serif;font-size:19px;color:var(--navy);line-height:1.08}
  .wkc .ds{font-size:11.5px;color:var(--muted);line-height:1.5;margin:7px 0 0}
  .wkc .pr{margin-top:auto;padding-top:12px;font-size:11.5px;font-weight:700;color:var(--navy-soft)}
  .wkc .pr b{font-family:'DM Serif Display',serif;font-weight:400;font-size:23px;color:var(--orange-dark)}
  .wkc .pr span{display:block;font-weight:600;color:var(--muted);margin-top:2px}
  .wkc .inc{margin-top:9px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--orange-dark);font-weight:700}
  .wknote{margin-top:16px;text-align:center;font-size:12px;color:var(--navy-soft)}
  .wknote b{color:var(--navy)}
  /* drinks & petiscos (foto grande + lateral) */
  .dpwrap{display:grid;grid-template-columns:1.45fr 1fr;gap:18px;margin-top:22px;width:100%;align-items:stretch}
  .dpbig{border-radius:18px;overflow:hidden;position:relative;border:1px solid var(--line);box-shadow:0 18px 44px -28px rgba(0,0,0,.42);min-height:340px}
  .dpbig img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .dpside{display:flex;flex-direction:column;gap:16px}
  .dpside figure{margin:0;flex:1;border-radius:16px;overflow:hidden;position:relative;border:1px solid var(--line);box-shadow:0 14px 34px -26px rgba(0,0,0,.4);min-height:150px}
  .dpside figure img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .dpinfo{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px 18px;box-shadow:0 12px 28px -24px rgba(0,0,0,.3)}
  .dpinfo .k{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange-dark);font-weight:800}
  .dpinfo .v{margin-top:4px;font-size:12.5px;color:var(--navy-soft);line-height:1.45}
  .dpinfo .v b{color:var(--navy);font-weight:700}
  /* pilares (4 cards com foto) */
  .pilg{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-top:24px;width:100%}
  .pilc{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 14px 34px -26px rgba(0,0,0,.32);min-width:0}
  .pilc .ph{height:170px;position:relative;overflow:hidden}
  .pilc .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .pilc .bd{padding:15px 16px 17px}
  .pilc h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--navy);margin:0 0 5px;line-height:1.12}
  .pilc p{font-size:11px;color:var(--muted);line-height:1.5;margin:0}
  /* onde acontece (foto + texto) */
  .locwrap{display:grid;grid-template-columns:1fr 1.05fr;gap:36px;margin-top:22px;align-items:center}
  .locwrap .ph{border-radius:20px;overflow:hidden;border:1px solid var(--line);box-shadow:0 22px 52px -28px rgba(0,0,0,.45);height:400px;position:relative}
  .locwrap .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .bigquote{margin-top:20px;font-family:'DM Serif Display',serif;font-size:26px;color:var(--navy);line-height:1.2}
  .bigquote em{font-style:italic;color:var(--orange)}
  /* fechamento */
  .finwrap{display:grid;grid-template-columns:1.02fr .98fr;gap:38px;margin-top:20px;align-items:center}
  .finwrap .ph{border-radius:20px;overflow:hidden;border:1px solid var(--line);box-shadow:0 22px 52px -28px rgba(0,0,0,.45);height:430px;position:relative}
  .finwrap .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .finwrap .ftx p.lead{margin-top:0}
  .ctabox{margin-top:18px;background:#EBF1F4;border-left:4px solid var(--orange);border-radius:14px;padding:20px 24px}
  .ctabox .t{font-family:'DM Serif Display',serif;font-size:20px;color:var(--navy);margin:0 0 6px;line-height:1.2}
  .ctabox .t em{font-style:italic;color:var(--orange)}
  .ctabox .contact{margin-top:8px;font-size:12px;color:var(--navy-soft);line-height:1.5}
  .ctabox .contact b{color:var(--navy)}
  .finnote{margin-top:14px;font-size:10.5px;color:var(--muted);font-style:italic;line-height:1.5}
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


def vfig(src, cap, pos="center 50%"):
    return f'<figure>{img(src, cap, pos)}<figcaption>{cap}</figcaption></figure>'


def wkc(src, nome, desc, preco, total, pos="center 50%", hl=False):
    cls = "wkc hl" if hl else "wkc"
    return (f'<div class="{cls}"><div class="ph">{img(src, nome, pos)}</div>'
            f'<div class="bd"><div class="nm">{nome}</div><div class="ds">{desc}</div>'
            f'<div class="pr"><b>{preco}</b> / pessoa<span>30 pessoas · total {total}</span></div>'
            f'<div class="inc">inclui workshop + petiscos</div></div></div>')


def pilc(src, titulo, desc, pos="center 50%"):
    return (f'<div class="pilc"><div class="ph">{img(src, titulo, pos)}</div>'
            f'<div class="bd"><h3>{titulo}</h3><p>{desc}</p></div></div>')


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
          <span class="chip">Pinheiros · SP</span>
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
    <p class="lead">Todo mundo coloca a mão na massa, prova, descobre e brinda. Um encontro pensado para <strong>aproximar as pessoas</strong> em volta de boas doses e boa conversa.</p>
    <div class="vibestrip">
      {vfig("shoyu-grupo-brinde.jpg", "Mão na massa", "center 40%")}
      {vfig("andre-preparo.jpg", "Preparar junto", "center 45%")}
      {vfig("drinks-degustacao.jpg", "Degustar e descobrir", "center 50%")}
      {vfig("andre-mesa-drinks.jpg", "Brindar e celebrar", "center 45%")}
    </div>
    <div class="hlrow">
      <div class="hlc"><div class="ic">🙌</div><div class="tx">Mão na massa</div></div>
      <div class="hlc"><div class="ic">🍸</div><div class="tx">Degustação guiada</div></div>
      <div class="hlc"><div class="ic">🧀</div><div class="tx">Drinks + petiscos</div></div>
      <div class="hlc"><div class="ic">🥂</div><div class="tx">Experiência compartilhada</div></div>
    </div>
    {foot("A experiência")}
  </section>'''

# ===== 3 · ESCOLHA O SEU BRINDE =====
workshops = f'''
  <section class="slide">
{head_simple("Escolha o seu brinde")}
    <span class="eyebrow orange">◆ Escolha o seu brinde</span>
    <h2>Quatro formas de <em>celebrar com sabor</em></h2>
    <p class="lead">Escolham o workshop que mais tem a cara da Lucy. Em todos, o grupo aprende, prepara e prova — sempre com <strong>petiscos para acompanhar</strong>.</p>
    <div class="wkg">
      {wkc("andre-caipirinha.jpg", "Caipirinha", "A alma brasileira do brinde. Cachaça, frutas e aquele toque na medida certa — cada um prepara a sua.", "R$ 309,52", "R$ 9.285,71", "center 55%")}
      {wkc("andre-gin.jpg", "Gin &amp; seus drinks", "O queridinho das mesas. Gins, tônicas e botânicos para montar drinks aromáticos e refrescantes.", "R$ 380,95", "R$ 11.428,57", "center 50%")}
      {wkc("andre-coffee-cocktail.jpg", "Drinks com Café", "Para quem ama café com um toque especial. Coquetéis cremosos e marcantes, do clássico ao autoral.", "R$ 380,95", "R$ 11.428,57", "center 50%")}
      {wkc("andre-cerveja.jpg", "Cervejas Especiais", "Uma viagem pelos estilos e rótulos artesanais, com harmonizações que surpreendem.", "R$ 452,38", "R$ 13.571,43", "center 55%")}
    </div>
    <p class="wknote">Valores <b>por pessoa</b> · base de 30 participantes · cada workshop já inclui os petiscos da experiência.</p>
    {foot("Escolha o seu brinde")}
  </section>'''

# ===== 4 · DRINKS & PETISCOS =====
petiscos = f'''
  <section class="slide">
{head_simple("Drinks & petiscos")}
    <span class="eyebrow orange">◆ Drinks &amp; petiscos</span>
    <h2>Uma harmonização entre <em>coquetelaria e gastronomia</em></h2>
    <p class="lead">Cada drink ganha o acompanhamento perfeito. Entre um gole e outro, petiscos pensados para <strong>conversar com os sabores</strong> de cada coquetel.</p>
    <div class="dpwrap">
      <div class="dpbig">{img("drinkspetisco.jpg", "Drink autoral com petiscos finos harmonizados", "center 55%")}</div>
      <div class="dpside">
        <figure>{img("harmonizacaoqueijos.jpg", "Tábua de queijos para harmonizar", "center 50%")}</figure>
        <div class="dpinfo"><div class="k">Duração</div><div class="v"><b>2 a 3 horas</b> de experiência, sem pressa.</div></div>
        <div class="dpinfo"><div class="k">Formato</div><div class="v">Degustação guiada <b>+</b> preparo <b>+</b> conversa sobre harmonização.</div></div>
      </div>
    </div>
    {foot("Drinks & petiscos")}
  </section>'''

# ===== 5 · O QUE VOCÊS VIVEM =====
pilares = f'''
  <section class="slide">
{head_simple("O que vocês vivem")}
    <span class="eyebrow orange">◆ O que vocês vivem</span>
    <h2>Uma experiência para <em>provar, criar e brindar</em></h2>
    <p class="lead">Do primeiro gole ao último brinde, cada momento foi pensado para ser <strong>gostoso de viver em grupo</strong>.</p>
    <div class="pilg">
      {pilc("andre-coffee-cocktail.jpg", "Cinco coquetéis", "Uma seleção de drinks para provar e preparar ao longo do encontro.", "center 50%")}
      {pilc("harmonizacaoqueijos.jpg", "Harmonizações", "Petiscos escolhidos para conversar com cada drink da experiência.", "center 50%")}
      {pilc("andre-preparo.jpg", "Mão na massa", "Todo mundo prepara, mexe, prova e aprende junto — sem plateia.", "center 45%")}
      {pilc("andre-brinde.jpg", "Celebração", "Risadas, brindes e aquele clima de aniversário entre amigos.", "center 35%")}
    </div>
    {foot("O que vocês vivem")}
  </section>'''

# ===== 6 · ONDE ACONTECE =====
onde = f'''
  <section class="slide">
{head_simple("Onde acontece")}
    <span class="eyebrow orange">◆ Onde acontece</span>
    <h2>A experiência <em>vai até vocês</em></h2>
    <div class="locwrap">
      <div class="ph">{img("andre-mesa-drinks.jpg", "Grupo reunido à mesa com drinks e flores", "center 45%")}</div>
      <div>
        <p class="lead">Levamos tudo para o espaço de vocês — pode ser o salão de festas do prédio, a casa da aniversariante ou o cantinho preferido em <strong>Pinheiros</strong>. A Elarah cuida da estrutura, dos ingredientes e de toda a operação.</p>
        <p class="bigquote">"Vocês brindam. <em>A gente cuida do resto.</em>"</p>
      </div>
    </div>
    {foot("Onde acontece")}
  </section>'''

# ===== 7 · FECHAMENTO =====
final = f'''
  <section class="slide">
{head_simple("Para fechar")}
    <div class="finwrap">
      <div class="ph">{img("andre-brinde-drinks.jpg", "Amigas brindando com coquetéis", "center 35%")}</div>
      <div class="ftx">
        <span class="eyebrow orange">◆ Vamos brindar?</span>
        <h2>Agora é só escolher o <em>primeiro brinde</em> 🧡</h2>
        <p class="lead">O resto a gente prepara por aqui. Vai ser um prazer transformar esse aniversário em uma experiência <strong>gostosa, divertida e cheia de boas memórias</strong>.</p>
        <div class="ctabox">
          <p class="t">Bora comemorar? <em>✦</em></p>
          <p class="contact">WhatsApp <b>+55 (11) 91445-5930</b> · @elarah.oficial · elarah.com.br</p>
        </div>
        <p class="finnote">Valores sujeitos à confirmação de disponibilidade e formato escolhido. A data é reservada após a confirmação.</p>
      </div>
    </div>
    {foot("Aniversário · Lucy Andrade")}
  </section>'''

deck = ('<div class="deck">\n' + cover + experiencia + workshops + petiscos
        + pilares + onde + final + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/aniversario-lucy-andrade.html"
io.open(out, "w", encoding="utf-8").write(html)

# ---- guardas ----
for bad in ["fornecedor", "repasse", "comiss", "margem", "20%", "sob consulta", "bartender course", "nightclub"]:
    assert bad not in deck.lower(), f"PROIBIDO: {bad}"
for val in ["R$ 309,52", "R$ 9.285,71", "R$ 380,95", "R$ 11.428,57", "R$ 452,38", "R$ 13.571,43"]:
    assert val in deck, f"FALTA VALOR: {val}"
assert deck.count("inclui workshop + petiscos") == 4, "4 cards devem ter 'inclui workshop + petiscos'"
assert "drinksclassicos" not in deck, "nao usar foto de drink isolado no escuro"
assert "Agora é só escolher o" in deck, "falta frase de fechamento"
assert "Vocês brindam" in deck, "falta frase destaque onde acontece"
assert "A data é reservada após a confirmação" in deck, "falta rodape discreto"
assert html.count('<section class="slide">') == 7, "esperado 7 slides"
print("wrote", out, "| slides:", html.count('<section class="slide">'))
