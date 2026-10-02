# Portfólio Corporativo de Experiências da Elarah (institucional) · referência: deck Team Building Itaú.
# Estilo refinado: capa editorial, "por que funciona", vitrine com SUGESTÃO ELARAH, brunch, mimos,
# investimento (lista + planos), como funciona & contato. SEM graficos. Fotos reais. Elarah no plural.
# Precos base Itaú (a partir de, por pessoa), gama ampla. Sem fornecedor/margem/comissao.
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/orcamento-adriana.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]

head = re.sub(r'<title>.*?</title>', '<title>Experiências Corporativas · Elarah</title>', head, count=1, flags=re.DOTALL)
head = re.sub(r'<meta name="description"[^>]*>',
              '<meta name="description" content="Portfólio de experiências corporativas da Elarah: team building que ninguém finge gostar. Experiências criativas, sensoriais e gastronômicas — a Elarah vai até vocês.">',
              head, count=1)

extra = '''
<style>
  /* capa */
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
  /* note band */
  .noteband{margin-top:22px;background:#EBF1F4;border-left:4px solid var(--orange);border-radius:12px;padding:16px 22px;font-size:12.5px;color:var(--navy-soft);line-height:1.55}
  .noteband b{color:var(--navy);font-weight:700}
  /* por que funciona (3 cards foto) */
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
  .mc .mph{height:158px;position:relative;overflow:hidden}
  .mc .mph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .mc .badge{position:absolute;top:10px;left:10px;background:var(--orange);color:#fff;font-size:9px;letter-spacing:.1em;text-transform:uppercase;font-weight:800;padding:5px 11px;border-radius:999px}
  .mc .mbd{padding:16px 19px 18px;display:flex;flex-direction:column;flex:1}
  .mc .cat{font-size:9px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .mc .nm{font-family:'DM Serif Display',serif;font-size:19px;color:var(--navy);margin:5px 0 7px;line-height:1.08}
  .mc .ds{font-size:11px;color:var(--muted);line-height:1.5;margin:0 0 13px}
  .mc .pr{margin-top:auto;font-size:11.5px;font-weight:700;color:var(--navy-soft)}
  .mc .pr b{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--orange-dark)}
  .mc .pr.tbd{font-weight:600;color:var(--muted);font-style:italic}
  /* brunch */
  .brunchg{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px;margin-top:20px;width:100%}
  .brunchg .bc .bph{height:140px;border-radius:14px;overflow:hidden;position:relative;border:1px solid var(--line);box-shadow:0 12px 28px -22px rgba(0,0,0,.4)}
  .brunchg .bc .bph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .brunchg .bc .bk{font-size:10px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin-top:11px}
  .brunchg .bc p{font-size:10.5px;color:var(--muted);line-height:1.45;margin:5px 0 0}
  .priceband{margin-top:20px;background:linear-gradient(158deg,var(--navy),#241722);color:#fff;border-radius:18px;padding:22px 32px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;box-shadow:0 22px 50px -28px rgba(0,0,0,.5)}
  .priceband .k{font-size:10.5px;letter-spacing:.15em;text-transform:uppercase;color:var(--orange);font-weight:700}
  .priceband .v{font-family:'DM Serif Display',serif;font-size:32px;line-height:1;margin-top:4px}
  .priceband .v small{font-family:'DM Sans',sans-serif;font-size:12px;color:rgba(255,255,255,.72);font-weight:600}
  .priceband .r{text-align:right;font-size:12.5px;color:rgba(255,255,255,.82);line-height:1.5}
  .priceband .r b{color:#fff}
  /* mimos */
  .mimos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px;margin-top:22px;width:100%}
  .mimoc{background:var(--card);border:1px solid var(--line);border-radius:20px;overflow:hidden;box-shadow:0 16px 40px -28px rgba(0,0,0,.4);display:flex;flex-direction:column;min-width:0}
  .mimoc.full{border:2px solid var(--orange)}
  .mimoc .ph{height:190px;position:relative;overflow:hidden}
  .mimoc .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .mimoc .badge{position:absolute;top:12px;right:12px;background:var(--orange);color:#fff;font-size:9px;letter-spacing:.1em;text-transform:uppercase;font-weight:800;padding:6px 12px;border-radius:999px}
  .mimoc .bd{padding:20px 24px 22px}
  .mimoc .nm{font-family:'DM Serif Display',serif;font-size:21px;color:var(--navy);margin:0 0 10px;line-height:1.05}
  .mimoc ul{list-style:none;margin:0;padding:0;display:grid;gap:7px}
  .mimoc ul li{position:relative;padding-left:20px;font-size:12px;color:var(--ink);line-height:1.4}
  .mimoc ul li .ck{position:absolute;left:0;top:0;color:var(--orange);font-weight:800}
  .mimoc ul li b{color:var(--navy);font-weight:700}
  /* investimento */
  .invhero{display:flex;align-items:baseline;gap:14px;margin-top:4px}
  .invhero .n{font-family:'DM Serif Display',serif;font-size:42px;color:var(--navy);line-height:1}
  .invhero .n em{font-style:italic;color:var(--orange)}
  .invhero .l{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--navy-soft);font-weight:700;max-width:13ch;line-height:1.3}
  .invl{display:grid;grid-template-columns:1fr 1fr;gap:0 40px;margin-top:18px}
  .invl .row{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid var(--line);padding:9px 2px}
  .invl .row .e{font-family:'DM Serif Display',serif;font-size:14px;color:var(--navy)}
  .invl .row .pr{font-family:'DM Serif Display',serif;font-size:14px;color:var(--orange-dark);white-space:nowrap}
  .invl .row .pr.tbd{font-family:'DM Sans',sans-serif;font-size:11px;font-style:italic;color:var(--muted);font-weight:600}
  .plans{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:18px;width:100%}
  .plan{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:17px 19px;box-shadow:0 12px 30px -24px rgba(0,0,0,.3)}
  .plan.hl{border:2px solid var(--orange)}
  .plan .pk{font-size:10px;letter-spacing:.12em;text-transform:uppercase;font-weight:800;color:var(--orange-dark)}
  .plan .pt{font-family:'DM Serif Display',serif;font-size:16px;color:var(--navy);margin:4px 0 6px}
  .plan .pd{font-size:11px;color:var(--muted);line-height:1.45}
  .plan .pd b{color:var(--navy);font-weight:700}
  /* como funciona */
  .stg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-top:20px;width:100%}
  .stc{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px 22px;box-shadow:0 12px 30px -24px rgba(0,0,0,.3)}
  .stc .n{font-family:'DM Serif Display',serif;font-size:30px;color:var(--orange);line-height:1}
  .stc h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy);margin:8px 0 6px;line-height:1.1}
  .stc p{font-size:11.5px;color:var(--muted);line-height:1.5;margin:0}
  .ctabox{margin-top:20px;background:#EBF1F4;border-left:4px solid var(--orange);border-radius:14px;padding:20px 26px}
  .ctabox .t{font-family:'DM Serif Display',serif;font-size:19px;color:var(--navy);margin:0 0 7px}
  .ctabox .t em{font-style:italic;color:var(--orange)}
  .ctabox p{font-size:12.5px;color:var(--navy-soft);line-height:1.6;margin:0}
  .ctabox b{color:var(--navy);font-weight:700}
</style>'''
head = head.replace("</head>", extra + "</head>", 1)

FOOTNOTE = ("Valores a partir de, sujeitos a ajustes conforme número de participantes, localização "
            "e formato escolhido. Montamos cada experiência de acordo com o briefing do evento.")


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


def mc(num, cat, nome, desc, preco, src, pos="center 50%", sugg=False):
    cls = "mc sugg" if sugg else "mc"
    badge = '<div class="badge">★ Sugestão Elarah</div>' if sugg else ''
    if preco:
        prc = f'<div class="pr">A partir de <b>{preco}</b> / pessoa</div>'
    else:
        prc = '<div class="pr tbd">Valor sob consulta</div>'
    return (f'<div class="{cls}"><div class="mph">{img(src, nome, pos)}{badge}</div>'
            f'<div class="mbd"><div class="cat">{num} · {cat}</div><div class="nm">{nome}</div>'
            f'<div class="ds">{desc}</div>{prc}</div></div>')


def brc(src, titulo, itens, pos="center 50%"):
    return (f'<div class="bc"><div class="bph">{img(src, titulo, pos)}</div>'
            f'<div class="bk">{titulo}</div><p>{itens}</p></div>')


def invrow(nome, preco):
    if preco:
        return f'<div class="row"><span class="e">{nome}</span><span class="pr">{preco}</span></div>'
    return f'<div class="row"><span class="e">{nome}</span><span class="pr tbd">a confirmar</span></div>'


def stc(n, titulo, desc):
    return f'<div class="stc"><div class="n">{n}</div><h3>{titulo}</h3><p>{desc}</p></div>'


# ===== 1 · CAPA =====
cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><div class="pftitle"><div class="top">Portfólio de experiências</div><div class="big">Elarah <em>Corporativo</em></div><div class="sub">Experiências para times</div></div></div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Team building · do nosso jeito</span>
        <h1>O time junto, <em>de mão na massa</em></h1>
        <p class="lead">Uma curadoria de experiências criativas, sensoriais e gastronômicas pro seu time. Sem dinâmica forçada e sem apresentação de slides: <strong>todo mundo na mesma mesa criando</strong>, num formato que solta o grupo de verdade — e deixa uma lembrança que continua depois do encontro. 🧡</p>
        <div class="chips">
          <span class="chip">Times de todos os tamanhos</span>
          <span class="chip">Happy hour &amp; confraternização</span>
          <span class="chip">A Elarah vai até vocês</span>
          <span class="chip">Experiências a partir de <b>R$ 159</b></span>
        </div>
      </div>
      <div class="cover-photo">{img("pintura-corp-class.jpg", "Time corporativo misto criando e rindo junto", "center 45%")}</div>
    </div>
    <div class="pfproof pffoot"><span class="star">★</span><p>Já realizado para times de empresas como <b>Amazon</b>, <b>Natura</b>, <b>Itaú</b> e <b>Compass</b> · visto no <b>Mais Você</b> (Globo)</p></div>
    {foot("Experiências corporativas")}
  </section>'''

# ===== 2 · POR QUE FUNCIONA =====
porque = f'''
  <section class="slide">
{head_simple("Por que funciona")}
    <span class="eyebrow orange">◆ O que o time leva junto</span>
    <h2>Team building que <em>ninguém finge gostar</em></h2>
    <p class="lead">A gente não faz dinâmica de quebra-gelo. A conexão acontece sozinha quando o time senta na mesma mesa pra criar algo com as próprias mãos — <strong>sem hierarquia, sem quem sabe mais e quem sabe menos.</strong> 🧡</p>
    <div class="pqg">
      {pqc("bfa-grupo2.webp", "Conversa que não rola no escritório", "Horas lado a lado fazem o time falar de coisas que a reunião nunca puxa. <b>Áreas diferentes se misturam sozinhas.</b>", "center 45%")}
      {pqc("corp-criativo.jpg", "Todo mundo no mesmo pé", "Ninguém precisa ter experiência. <b>Diretoria e time começam do zero juntos</b> — e é aí que a hierarquia cai.", "center 40%")}
      {pqc("ceramica2.jpg", "Fica depois do dia", "O que foi criado continua depois do encontro — <b>seja como peça individual ou memória coletiva</b> do time.", "center 50%")}
    </div>
    <div class="noteband">◆ <b>A gente cuida de tudo:</b> profissional que conduz, material, estrutura e montagem. O RH só precisa avisar a data e reunir o time — e, se quiserem, reservamos um momento de fala da liderança no meio do encontro.</div>
    {foot("Por que funciona")}
  </section>'''

# ===== 3 · VITRINE · ENTRADA =====
menu1 = f'''
  <section class="slide">
{head_simple("O menu de experiências")}
    <span class="eyebrow orange">◆ Escolham a experiência</span>
    <h2>Pra <em>começar</em> — a partir de R$ 159</h2>
    <p class="lead">Experiências leves e <strong>fáceis de participar</strong>, com ótimo custo pra abrir o encontro e soltar o grupo. Cada pessoa cria algo seu e leva pra casa.</p>
    <div class="menu">
      {mc("01", "Criativa · Acessórios", "Charm Bag Express", "Montam o próprio berloque de bolsa — autoral, rápido e cheio de estilo.", "R$ 159", "charm-making-grupo.jpg", "center 40%")}
      {mc("02", "Sensorial · Aromas", "Aromatizador de Ambiente", "Criam o próprio aromatizador de ambiente, escolhendo fragrâncias pra levar.", "R$ 169", "aromatizador-spray.jpg", "center 45%")}
      {mc("03", "Sensorial · Vela", "Vela Aromática", "Cada participante cria a própria vela, explorando aromas e combinações.", "R$ 189", "vela-grupo-oficina.jpg", "center 35%")}
    </div>
    <div class="noteband">◆ Faixa de <b>entrada</b> do portfólio — ideal pra grupos grandes e primeiros encontros. O formato final a gente ajusta conforme o briefing.</div>
    {foot("O menu · pra começar")}
  </section>'''

# ===== 4 · VITRINE · SENSORIAL & AUTORAL =====
menu2 = f'''
  <section class="slide">
{head_simple("O menu de experiências")}
    <span class="eyebrow orange">◆ Escolham a experiência</span>
    <h2>Entrada · pra <em>criar e levar</em></h2>
    <p class="lead">Mais experiências de <strong>entrada acessível</strong>, sensoriais e criativas — cada pessoa cria algo seu, do aroma ao acabamento.</p>
    <div class="menu">
      {mc("04", "Sensorial · Aromas", "Difusor de Ambiente", "Montam o próprio difusor de varetas, escolhendo essências e composição.", "R$ 189", "difusor-reed.jpg", "center 45%")}
      {mc("05", "Criativa · Pintura", "Pintura em Taça", "Leve e social: personalizam a própria taça enquanto o grupo conversa e brinda.", "R$ 199", "pintura-taca-experiencia.jpg", "center 45%", sugg=True)}
      {mc("06", "Sensorial · Autocuidado", "Lip Balm Autoral", "Cada um prepara o próprio hidratante labial, escolhendo aromas e texturas.", "R$ 229", "lipbalm-making.jpg", "center 45%")}
    </div>
    <div class="noteband">◆ Experiências <b>rápidas e desejáveis</b> — rendem lembrança pra cada pessoa levar e funcionam muito bem em grupos grandes.</div>
    {foot("O menu · entrada")}
  </section>'''

# ===== 5 · VITRINE · PEÇA AUTORAL =====
menu3 = f'''
  <section class="slide">
{head_simple("O menu de experiências")}
    <span class="eyebrow orange">◆ Escolham a experiência</span>
    <h2>Pra criar uma <em>peça autoral</em></h2>
    <p class="lead">Experiências mais imersivas, pra quem quer ir além e sair com uma <strong>peça de verdade</strong>.</p>
    <div class="menu">
      {mc("07", "Criativa · Cerâmica", "Cerâmica", "Modelar, criar e desenvolver uma peça com as próprias mãos.", "", "ceramica.jpg", "center 40%")}
      {mc("08", "Criativa · Têxtil", "Tufting &amp; Punch Needle", "Experiência têxtil e visual: cada um desenvolve a própria peça.", "", "lado-b-grupo-pecas.webp", "center 30%")}
      {mc("09", "Criativa · Porcelana", "Pintura em Porcelana", "Pintam à mão a própria peça de porcelana e levam pra casa.", "", "agora-pintando.jpg", "center 35%")}
    </div>
    <div class="noteband">◆ Experiências mais imersivas: o valor é validado no nosso histórico conforme o formato — por isso aparecem como <b>sob consulta</b>. Dá pra <b>combinar em estações simultâneas</b>.</div>
    {foot("O menu · peça autoral")}
  </section>'''

# ===== 6 · VITRINE · BRINDAR & COMPARTILHAR =====
menu4 = f'''
  <section class="slide">
{head_simple("O menu de experiências")}
    <span class="eyebrow orange">◆ Escolham a experiência</span>
    <h2>Pra <em>brindar e compartilhar</em></h2>
    <p class="lead">Quando a vibe é happy hour: gastronomia, drinks e aquele clima de <strong>mesa cheia e boa conversa</strong>.</p>
    <div class="menu">
      {mc("10", "Social · Drinks", "Bartenderia &amp; Coquetelaria", "Com bartender, aprendem técnicas e preparam os próprios drinks autorais.", "", "andre-mesa-drinks.jpg", "center 50%")}
      {mc("11", "Gastronômica · Mesa", "Entre Fatias &amp; Taças", "Pizza artesanal e vinhos: uma experiência gastronômica completa pra compartilhar.", "", "bfa-grupo1.webp", "center 50%")}
      {mc("12", "Gastronômica · Mão na massa", "Experiência Gastronômica", "Mão na massa em torno da gastronomia, criada pra aproximar o grupo.", "", "corp-grupo.jpg", "center 50%")}
    </div>
    <div class="noteband">◆ Drinks e gastronomia completa têm valor próprio conforme o formato (quantidade, bar, menu assinado) — por isso aparecem como <b>sob consulta</b>.</div>
    {foot("O menu · brindar & compartilhar")}
  </section>'''

# ===== 7 · O BRUNCH =====
brunch = f'''
  <section class="slide">
{head_simple("O brunch")}
    <span class="eyebrow orange">◆ Opcional · pra deixar o encontro completo</span>
    <h2>A mesa posta <em>esperando o time</em></h2>
    <p class="lead">A gente monta uma <strong>mesa de brunch completa</strong> pro grupo, servida durante a experiência no espaço de vocês — sem precisar contratar buffet à parte. Porque a pausa pro cafezinho também faz parte.</p>
    <div class="brunchg">
      {brc("salgadinho.jpg", "Salgados", "Mini sanduíches, salgados quentinhos e pão de queijo.", "center 50%")}
      {brc("paodoce.jpg", "Pães &amp; acompanhamentos", "Pães variados, manteiga, geleia e patês.", "center 50%")}
      {brc("bolocaseiro.jpg", "Doces &amp; frutas", "Bolo caseiro, docinhos e frutas da estação.", "center 50%")}
      {brc("brunch-office2.jpg", "Bebidas", "Café, sucos da estação, água e acompanhamentos.", "center 50%")}
    </div>
    <div class="priceband">
      <div><div class="k">Brunch corporativo · opcional</div><div class="v">R$ 99 <small>por pessoa</small></div></div>
      <div class="r">Servido durante a experiência, <b>no espaço de vocês</b>.<br>Opcional, combinado conforme o briefing.</div>
    </div>
    {foot("O brunch")}
  </section>'''

# ===== 8 · OS MIMOS =====
mimos = f'''
  <section class="slide">
{head_simple("Os mimos")}
    <span class="eyebrow orange">◆ Opcional · pra levar de lembrança</span>
    <h2>Mais do que uma <em>atividade</em></h2>
    <p class="lead">Além da peça que cada um cria, dá pra somar o <strong>registro fotográfico profissional</strong> do encontro e um <strong>brinde personalizado</strong> com a marca da empresa.</p>
    <div class="mimos">
      <div class="mimoc">
        <div class="ph">{img("eventocorporativo.jpg", "Registro fotográfico profissional do encontro", "center 35%")}</div>
        <div class="bd">
          <div class="nm">Registro fotográfico profissional</div>
          <ul>
            <li><span class="ck">✦</span>Um fotógrafo cobre o encontro inteiro</li>
            <li><span class="ck">✦</span>Cada conversa e cada criação registradas</li>
            <li><span class="ck">✦</span><b>Álbum digital</b> pronto pro RH e pra comunicação interna</li>
          </ul>
        </div>
      </div>
      <div class="mimoc full">
        <div class="ph">{img("kitempresa.jpg", "Brinde personalizado com a marca da empresa", "center 50%")}<div class="badge">★ Opcional</div></div>
        <div class="bd">
          <div class="nm">Brinde personalizado</div>
          <ul>
            <li><span class="ck">✦</span>Um brinde pra cada pessoa do time</li>
            <li><span class="ck">✦</span><b>Personalizado com a marca</b> da empresa</li>
            <li><span class="ck">✦</span>Entregue no dia, junto da peça que cada um criou</li>
          </ul>
        </div>
      </div>
    </div>
    {foot("Os mimos")}
  </section>'''

# ===== 9 · INVESTIMENTO =====
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Escolham a experiência</span>
    <h2>A partir de <em>R$ 159</em></h2>
    <p class="lead">Valores <strong>por pessoa, no formato de entrada</strong> de cada experiência. A composição de cada uma (materiais, estrutura, deslocamento, quantidade mínima) é definida conforme o briefing — o total é fechado pela experiência escolhida × o número de participantes.</p>
    <div class="invl">
      {invrow("Charm Bag Express", "R$ 159")}
      {invrow("Aromatizador de Ambiente", "R$ 169")}
      {invrow("Vela Aromática", "R$ 189")}
      {invrow("Difusor de Ambiente", "R$ 189")}
      {invrow("Pintura em Taça", "R$ 199")}
      {invrow("Lip Balm Autoral", "R$ 229")}
      {invrow("Bartenderia &amp; Coquetelaria", "")}
      {invrow("Cerâmica", "")}
      {invrow("Tufting &amp; Punch Needle", "")}
      {invrow("Pintura em Porcelana", "")}
      {invrow("Perfumaria Autoral", "")}
      {invrow("Sabonete Artesanal", "")}
      {invrow("Scrapbook &amp; Colagem", "")}
      {invrow("Entre Fatias &amp; Taças", "")}
      {invrow("Experiência Gastronômica", "")}
    </div>
    <div class="noteband">◆ As experiências marcadas como <b>a confirmar</b> têm o valor validado no nosso histórico antes da versão final da proposta — pra não publicar preço sem base.</div>
    <p class="fineprint">{FOOTNOTE}</p>
    {foot("Investimento")}
  </section>'''

# ===== 10 · COMO FUNCIONA & CONTATO =====
como = f'''
  <section class="slide">
{head_simple("Como funciona & contato")}
    <span class="eyebrow orange">◆ Simples e sob medida</span>
    <h2>É só reunir <em>o time</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pro encontro ser leve do começo ao fim.</p>
    <div class="stg">
      {stc("01", "Escolham a experiência e o plano", "Vocês dizem a data, o número de pessoas e a vibe do time.")}
      {stc("02", "A gente leva tudo", "Profissional, materiais e estrutura, montados no espaço de vocês.")}
      {stc("03", "Cada um leva uma lembrança", "O que foi criado continua com o time depois do dia.")}
    </div>
    <div class="ctabox">
      <p class="t">Bora reunir o time? <em>✦</em></p>
      <p>Conta pra gente a <b>experiência</b> e o <b>plano</b> que fazem mais sentido, que a gente organiza os próximos passos e cuida de toda a produção.<br><i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <b>+55 (11) 91445-5930</b> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br</p>
    </div>
    {foot("Como funciona & contato")}
  </section>'''

deck = ('<div class="deck">\n' + cover + porque + menu1 + menu2 + menu3 + menu4
        + brunch + mimos + investimento + como + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/portfolio-corporativo-elarah.html"
io.open(out, "w", encoding="utf-8").write(html)
for bad in ["fornecedor", "repasse", "comiss", "margem"]:
    assert bad not in deck.lower(), f"PROIBIDO: {bad}"
PRECOS_OK = ["R$ 159", "R$ 169", "R$ 189", "R$ 199", "R$ 229"]
for preco in PRECOS_OK:
    assert preco in deck, f"FALTA PRECO: {preco}"
# precos antigos nao podem reaparecer (so os 6 da tabela atual tem valor)
for ruim in ["R$ 179", "R$ 209", "R$ 219", "R$ 239", "R$ 289", "R$ 299", "R$ 329",
             "R$ 349", "R$ 369", "R$ 399", "R$ 459", "R$ 549", "R$ 599", "R$ 789", "R$ 799"]:
    assert ruim not in deck, f"PRECO ANTIGO AINDA PRESENTE: {ruim}"
for nome in ["Charm Bag Express", "Aromatizador de Ambiente", "Difusor de Ambiente", "Lip Balm Autoral"]:
    assert nome in deck, f"FALTA EXPERIENCIA: {nome}"
for conf in ["Bartenderia", "Cerâmica", "Tufting", "Pintura em Porcelana", "Perfumaria Autoral",
             "Sabonete Artesanal", "Scrapbook", "Entre Fatias", "Experiência Gastronômica"]:
    assert conf in deck, f"FALTA (a confirmar): {conf}"
assert "a confirmar" in deck and "Valor sob consulta" in deck
print("wrote", out, "| slides:", html.count('<section class="slide">'))
