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

FOOTNOTE = ("Valores a partir de, por pessoa, sujeitos a ajustes conforme número de participantes, "
            "localização, duração, personalização, estrutura necessária e formato da experiência.")


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
    return (f'<div class="{cls}"><div class="mph">{img(src, nome, pos)}{badge}</div>'
            f'<div class="mbd"><div class="cat">{num} · {cat}</div><div class="nm">{nome}</div>'
            f'<div class="ds">{desc}</div>'
            f'<div class="pr">A partir de <b>{preco}</b> / pessoa</div></div></div>')


def brc(src, titulo, itens, pos="center 50%"):
    return (f'<div class="bc"><div class="bph">{img(src, titulo, pos)}</div>'
            f'<div class="bk">{titulo}</div><p>{itens}</p></div>')


def invrow(nome, preco):
    return f'<div class="row"><span class="e">{nome}</span><span class="pr">{preco}</span></div>'


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
          <span class="chip">A partir de <b>R$ 289</b></span>
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

# ===== 3 · VITRINE · SENSORIAL =====
menu1 = f'''
  <section class="slide">
{head_simple("O menu de experiências")}
    <span class="eyebrow orange">◆ Escolham a experiência</span>
    <h2>Pra <em>desacelerar</em> e explorar aromas</h2>
    <p class="lead">Experiências sensoriais que tiram o time do automático — cada pessoa cria algo seu e <strong>leva pra casa</strong>.</p>
    <div class="menu">
      {mc("01", "Sensorial · Vela", "Vela Aromática", "Cada participante cria a própria vela, explorando aromas e combinações.", "R$ 289", "vela-grupo-oficina.jpg", "center 35%")}
      {mc("02", "Sensorial · Sabonete", "Sabonete Artesanal", "Aromas, moldes e texturas: cada um faz o próprio sabonete pra levar.", "R$ 289", "sabonete-grupo-oficina.jpg", "center 40%")}
      {mc("03", "Sensorial · Perfumaria", "Perfumaria Autoral", "Uma viagem olfativa guiada: cada pessoa cria a própria fragrância.", "R$ 329", "perfumaria-oficina.jpg", "center 45%")}
    </div>
    <div class="noteband">◆ Experiências leves e <b>fáceis de participar</b> — perfeitas pra abrir o encontro e soltar o grupo.</div>
    {foot("O menu · sensorial")}
  </section>'''

# ===== 4 · VITRINE · CRIATIVA =====
menu2 = f'''
  <section class="slide">
{head_simple("O menu de experiências")}
    <span class="eyebrow orange">◆ Escolham a experiência</span>
    <h2>Pra colocar <em>a mão na massa</em></h2>
    <p class="lead">Criar com as próprias mãos — <strong>bonito, visual e fácil de participar</strong>, mesmo pra quem nunca fez.</p>
    <div class="menu">
      {mc("04", "Criativa · Pintura", "Pintura em Taça", "Leve e social: personalizam a própria taça enquanto o grupo conversa e brinda.", "R$ 299", "pintura-taca-experiencia.jpg", "center 45%")}
      {mc("05", "Criativa · Acessórios", "Charm Bar &amp; Berloque", "Montam a própria joia e o berloque de bolsa — autoral e interativo.", "R$ 299", "charm-making-grupo.jpg", "center 40%")}
      {mc("06", "Criativa · Porcelana", "Pintura em Porcelana", "Pintam à mão a própria peça e levam pra casa. Rende conversa e lembrança.", "R$ 349", "agora-pintando.jpg", "center 35%", sugg=True)}
    </div>
    <div class="noteband">◆ Nossa sugestão pra grupos grandes é a <b>Pintura em Porcelana</b>: todo mundo participa, rende boas conversas e cada um leva a peça que criou.</div>
    {foot("O menu · criativa")}
  </section>'''

# ===== 5 · VITRINE · MÃO NA MASSA / PEÇA AUTORAL =====
menu3 = f'''
  <section class="slide">
{head_simple("O menu de experiências")}
    <span class="eyebrow orange">◆ Escolham a experiência</span>
    <h2>Pra criar uma <em>peça autoral</em></h2>
    <p class="lead">Experiências mais imersivas, pra quem quer ir além e sair com uma <strong>peça de verdade</strong>.</p>
    <div class="menu">
      {mc("07", "Criativa · Memórias", "Scrapbook &amp; Colagem", "Recortes, texturas e uma composição feita a muitas mãos pelo time.", "R$ 369", "colagem.jpg", "center 50%")}
      {mc("08", "Criativa · Cerâmica", "Cerâmica", "Modelar, criar e desenvolver uma peça com as próprias mãos.", "R$ 549", "ceramica.jpg", "center 40%")}
      {mc("09", "Criativa · Têxtil", "Tufting &amp; Punch Needle", "Experiência têxtil e visual: cada um desenvolve a própria peça.", "R$ 799", "lado-b-grupo-pecas.webp", "center 30%")}
    </div>
    <div class="noteband">◆ Dá pra <b>combinar mais de uma experiência em estações simultâneas</b> — ótimo pra grupos grandes com perfis diferentes.</div>
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
      {mc("10", "Social · Drinks", "Bartenderia &amp; Coquetelaria", "Com bartender, aprendem técnicas e preparam os próprios drinks autorais.", "R$ 369", "andre-mesa-drinks.jpg", "center 50%")}
      {mc("11", "Gastronômica · Mesa", "Entre Fatias &amp; Taças", "Pizza, vinho e gastronomia pensada pra compartilhar em torno da mesa.", "R$ 399", "bfa-grupo1.webp", "center 50%")}
      {mc("12", "Gastronômica · Mão na massa", "Experiência Gastronômica", "Mão na massa em torno da gastronomia, criada pra aproximar o grupo.", "R$ 459", "corp-grupo.jpg", "center 50%")}
    </div>
    <div class="noteband">◆ Experiências <b>sociais e descontraídas</b> — perfeitas pra confraternização e fim de ano.</div>
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
      <div class="r">Servido durante a experiência, <b>no espaço de vocês</b>.<br>Já incluso nos planos Premium e Completo.</div>
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
        <div class="ph">{img("kitempresa.jpg", "Brinde personalizado com a marca da empresa", "center 50%")}<div class="badge">★ Plano completo</div></div>
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
    <span class="eyebrow orange">◆ Escolham a experiência e o plano</span>
    <h2>A partir de <em>R$ 289</em></h2>
    <p class="lead">Valores por pessoa, já com <strong>profissional, materiais, estrutura, montagem e desmontagem</strong> inclusos. O total é fechado pela experiência escolhida × o número de participantes.</p>
    <div class="invl">
      {invrow("Vela Aromática", "R$ 289")}
      {invrow("Sabonete Artesanal", "R$ 289")}
      {invrow("Pintura em Taça", "R$ 299")}
      {invrow("Charm Bar &amp; Berloque", "R$ 299")}
      {invrow("Perfumaria Autoral", "R$ 329")}
      {invrow("Pintura em Porcelana", "R$ 349")}
      {invrow("Scrapbook &amp; Colagem", "R$ 369")}
      {invrow("Bartenderia &amp; Coquetelaria", "R$ 369")}
      {invrow("Entre Fatias &amp; Taças", "R$ 399")}
      {invrow("Experiência Gastronômica", "R$ 459")}
      {invrow("Cerâmica", "R$ 549")}
      {invrow("Tufting &amp; Punch Needle", "R$ 799")}
    </div>
    <div class="plans">
      <div class="plan"><div class="pk">A experiência</div><div class="pt">Base</div><div class="pd">Profissional, materiais e estrutura inclusos.</div></div>
      <div class="plan"><div class="pk">Premium</div><div class="pt">+ completo</div><div class="pd">Soma <b>registro fotográfico</b> profissional e <b>brunch corporativo</b>.</div></div>
      <div class="plan hl"><div class="pk">★ Completo</div><div class="pt">+ brinde</div><div class="pd">Tudo do Premium e ainda um <b>brinde personalizado</b> com a marca da empresa.</div></div>
    </div>
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
EXPS = {"Vela Aromática": "R$ 289", "Sabonete Artesanal": "R$ 289", "Pintura em Taça": "R$ 299",
        "Charm Bar": "R$ 299", "Perfumaria Autoral": "R$ 329", "Pintura em Porcelana": "R$ 349",
        "Scrapbook": "R$ 369", "Bartenderia": "R$ 369", "Entre Fatias": "R$ 399",
        "Experiência Gastronômica": "R$ 459", "Cerâmica": "R$ 549", "Tufting": "R$ 799"}
for nome, preco in EXPS.items():
    assert nome in deck, f"FALTA EXPERIENCIA: {nome}"
    assert preco in deck, f"FALTA PRECO: {preco}"
print("wrote", out, "| slides:", html.count('<section class="slide">'))
