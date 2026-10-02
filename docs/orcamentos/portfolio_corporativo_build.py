# Portfólio Corporativo de Experiências da Elarah (material institucional/coringa)
# Vitrine de experiencias corporativas · referencia: deck Amazon. Sem cliente/briefing especifico.
# Precos "a partir de": Pintura 239 · Vela 269 · Bartenderia 319 · Entre Fatias 349 ·
# Gastronomica 429 · Ceramica 529 · Tufting 799. Sem fornecedor/margem/comissao. Elarah no plural.
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/orcamento-adriana.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]

head = re.sub(r'<title>.*?</title>', '<title>Experiências Corporativas · Elarah</title>', head, count=1, flags=re.DOTALL)
head = re.sub(r'<meta name="description"[^>]*>',
              '<meta name="description" content="Portfólio de experiências corporativas da Elarah: experiências criativas, sensoriais, sociais e gastronômicas para conectar times fora da rotina.">',
              head, count=1)

extra = '''
<style>
  .kw3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:18px}
  .kw3 span{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:15px 10px;text-align:center;font-family:'DM Serif Display',serif;font-size:18px;color:var(--navy);box-shadow:0 10px 26px -22px rgba(0,0,0,.3)}
  .splitc{display:grid;grid-template-columns:1.04fr .96fr;gap:34px;margin-top:20px;align-items:center}
  .splitc .ph{border-radius:20px;overflow:hidden;border:1px solid var(--line);box-shadow:0 20px 48px -28px rgba(0,0,0,.45);height:320px;position:relative}
  .splitc .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .splitc p.tx{font-size:14px;color:var(--ink);line-height:1.62;margin:0 0 10px}
  .splitc p.tx b{color:var(--navy);font-weight:700}
  .callchips{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
  .callchips span{background:#FBF1EE;border-radius:999px;padding:10px 16px;font-size:12.5px;font-weight:700;color:var(--navy)}
  .callchips span b{color:var(--orange-dark)}
  /* vibe */
  .vibeg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:20px;width:100%}
  .vibec{background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 14px 34px -26px rgba(0,0,0,.32);display:grid;grid-template-columns:132px 1fr;min-width:0}
  .vibec .vph{position:relative;min-height:120px;overflow:hidden}
  .vibec .vph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .vibec .vbd{padding:18px 20px}
  .vibec .vk{font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:800;color:var(--orange-dark)}
  .vibec .vd{font-size:12.5px;color:var(--muted);line-height:1.5;margin-top:6px}
  /* portfolio 3-card */
  .xg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin-top:22px;width:100%}
  .xc{background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 16px 38px -26px rgba(0,0,0,.34);display:flex;flex-direction:column;min-width:0}
  .xc .xph{height:188px;position:relative;overflow:hidden}
  .xc .xph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .xc .xbd{padding:19px 20px 20px;display:flex;flex-direction:column;flex:1}
  .xc h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:20px;color:var(--navy);margin:0 0 7px;line-height:1.08}
  .xc p{font-size:12px;color:var(--muted);line-height:1.5;margin:0 0 14px}
  .xc .price{margin-top:auto;font-size:12px;font-weight:700;letter-spacing:.02em;color:var(--orange-dark)}
  .xc .price b{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--navy)}
  /* portfolio 2-card (horizontal grande) */
  .pg2{display:grid;gap:22px;margin-top:22px}
  .pc2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);background:var(--card);border:1px solid var(--line);border-radius:20px;overflow:hidden;box-shadow:0 16px 38px -26px rgba(0,0,0,.34);min-height:250px}
  .pc2 .pph{position:relative;overflow:hidden;min-height:250px}
  .pc2 .pph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .pc2 .pbd{padding:32px 36px;display:flex;flex-direction:column;justify-content:center}
  .pc2 .nm{font-family:'DM Serif Display',serif;font-size:27px;color:var(--navy);line-height:1.04}
  .pc2 .fr{font-size:13.5px;color:var(--muted);line-height:1.6;margin:12px 0 16px}
  .pc2 .pr{font-size:12.5px;font-weight:700;letter-spacing:.02em;color:var(--orange-dark)}
  .pc2 .pr b{font-family:'DM Serif Display',serif;font-weight:400;font-size:24px;color:var(--navy)}
  .pricefoot{margin-top:16px;font-size:10px;color:var(--muted);line-height:1.45;text-align:center}
  /* pipeline */
  .pipe{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:22px}
  .pipe .st{background:var(--card);border:1px solid var(--line);border-radius:999px;padding:13px 20px;font-size:13px;font-weight:700;color:var(--navy);box-shadow:0 10px 24px -20px rgba(0,0,0,.3)}
  .pipe .ar{color:var(--orange);font-weight:800;font-size:15px}
  .pipetx{margin-top:22px;background:#FBF1EE;border-radius:16px;padding:20px 26px;font-size:13.5px;color:var(--navy-soft);line-height:1.6;max-width:94ch}
  .pipetx b{color:var(--navy)}
  /* fechamento */
  .finwrap{display:grid;grid-template-columns:1.02fr .98fr;gap:38px;margin-top:20px;align-items:center}
  .finwrap .ph{border-radius:20px;overflow:hidden;border:1px solid var(--line);box-shadow:0 22px 52px -28px rgba(0,0,0,.45);height:430px;position:relative}
  .finwrap .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .finwrap .ftx p.lead{margin-top:0}
  .finsign{margin-top:22px;font-family:'DM Serif Display',serif;font-size:17px;color:var(--navy);line-height:1.4}
  .finsign .el{display:block;margin-top:12px;font-size:15px;letter-spacing:.16em;text-transform:uppercase;color:var(--orange-dark);font-weight:700;font-family:'DM Sans',sans-serif}
  .finsign .el small{display:block;font-family:'DM Serif Display',serif;font-style:italic;text-transform:none;letter-spacing:0;font-size:15px;color:var(--navy);font-weight:400;margin-top:4px}
</style>'''
head = head.replace("</head>", extra + "</head>", 1)

FOOTNOTE = ("Valores a partir de, sujeitos a ajustes conforme número de participantes, localização, "
            "duração, personalização, estrutura necessária e formato da experiência.")


def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'


def img(src, alt, pos="center 50%"):
    return f'<img src="assets/{src}" alt="{alt}" style="object-position:{pos}">'


def head_simple(kicker):
    return f'''    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">{kicker}</span></div>
    </div>'''


def xcard(foto, nome, frase, preco, pos="center 50%"):
    return (f'<div class="xc"><div class="xph">{img(foto, nome, pos)}</div>'
            f'<div class="xbd"><h3>{nome}</h3><p>{frase}</p>'
            f'<div class="price">A partir de <b>{preco}</b> por pessoa</div></div></div>')


def pcard2(foto, nome, frase, preco, pos="center 50%"):
    return (f'<div class="pc2"><div class="pph">{img(foto, nome, pos)}</div>'
            f'<div class="pbd"><div class="nm">{nome}</div><p class="fr">{frase}</p>'
            f'<div class="pr">A partir de <b>{preco}</b> por pessoa</div></div></div>')


def vibec(foto, cat, desc, pos="center 50%"):
    return (f'<div class="vibec"><div class="vph">{img(foto, cat, pos)}</div>'
            f'<div class="vbd"><div class="vk">{cat}</div><div class="vd">{desc}</div></div></div>')


# ===== 1 · CAPA =====
cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Experiências Corporativas</span></div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Portfólio corporativo</span>
        <h1>Experiências <em>Corporativas</em> Elarah</h1>
        <p class="lead">Um jeito diferente de <strong>estar junto</strong> — experiências criativas para conectar pessoas fora da rotina.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip">Criativas</span>
          <span class="chip">Sensoriais</span>
          <span class="chip">Sociais</span>
          <span class="chip">Gastronômicas</span>
        </div>
      </div>
      <div class="cover-photo">{img("bfa-grupo2.webp", "Grupo misto participando de uma experiência criativa", "center 45%")}</div>
    </div>
    {foot("Experiências Corporativas")}
  </section>'''

# ===== 2 · TEAM BUILDING, MAS DIFERENTE =====
conceito = f'''
  <section class="slide">
{head_simple("O conceito")}
    <span class="eyebrow orange">◆ Team building, mas diferente</span>
    <h2>Encontros mais <em>leves e naturais</em></h2>
    <div class="splitc">
      <div>
        <p class="tx">Reunimos experiências <b>criativas, gastronômicas e sensoriais</b> para transformar encontros de equipe em momentos mais leves e naturais.</p>
        <p class="tx">Sem dinâmica forçada. Sem quebra-gelo constrangedor. Só pessoas <b>criando, conversando e vivendo algo juntas</b>.</p>
        <div class="kw3"><span>Criar</span><span>Conectar</span><span>Compartilhar</span></div>
      </div>
      <div class="ph">{img("corp-conexao.jpg", "Time interagindo de forma natural", "center 35%")}</div>
    </div>
    {foot("O conceito")}
  </section>'''

# ===== 3 · A ELARAH VAI ATÉ VOCÊS =====
vaiate = f'''
  <section class="slide">
{head_simple("A Elarah vai até vocês")}
    <span class="eyebrow orange">◆ A Elarah vai até vocês</span>
    <h2>A experiência acontece <em>onde fizer mais sentido</em></h2>
    <div class="splitc">
      <div class="ph">{img("mesa-montada-corp.jpg", "Mesa pronta e materiais organizados para a experiência", "center 50%")}</div>
      <div>
        <p class="tx">Podemos levar a Elarah para o <b>escritório, espaço do evento ou venue</b> escolhido pela empresa.</p>
        <p class="tx">Nós <b>montamos a experiência, organizamos os materiais, acompanhamos a atividade e cuidamos da operação</b>. A empresa não precisa se preocupar com nada da montagem.</p>
        <div class="callchips"><span><b>✓</b> Mesa pronta</span><span><b>✓</b> Materiais inclusos</span><span><b>✓</b> Profissional especializado</span><span><b>✓</b> Operação Elarah</span></div>
      </div>
    </div>
    {foot("A Elarah vai até vocês")}
  </section>'''

# ===== 4 · ESCOLHA A VIBE =====
vibe = f'''
  <section class="slide">
{head_simple("Escolha a vibe")}
    <span class="eyebrow orange">◆ Escolha a vibe</span>
    <h2>Qual é a vibe do <em>seu time?</em></h2>
    <div class="vibeg">
      {vibec("ceramicamodelagem.jpg", "Criativa", "Para colocar a mão na massa e criar junto.", "center 50%")}
      {vibec("aroma-meninas-jardim.jpg", "Sensorial", "Para desacelerar e explorar aromas.", "center 45%")}
      {vibec("shoyu-grupo-brinde.jpg", "Social", "Para conversar, brindar e se conectar.", "center 45%")}
      {vibec("nbc-gastronomia-pizza.jpg", "Gastronômica", "Para criar enquanto todo mundo come e bebe junto.", "center 50%")}
    </div>
    {foot("Escolha a vibe")}
  </section>'''

# ===== 5 · PORTFÓLIO (entrada) =====
port1 = f'''
  <section class="slide">
{head_simple("Portfólio de experiências")}
    <span class="eyebrow orange">◆ Portfólio de experiências</span>
    <h2>Para <em>criar e brindar</em></h2>
    <div class="xg">
      {xcard("pintura-taca-experiencia.jpg", "Pintura em Taça", "Leve e social: cada um personaliza a própria taça enquanto o grupo conversa e brinda.", "R$ 239", "center 45%")}
      {xcard("vela-grupo-oficina.jpg", "Vela Aromática", "Cada participante cria sua própria vela, explorando fragrâncias e combinações.", "R$ 269", "center 40%")}
      {xcard("drinksclassicos.jpg", "Bartenderia", "Uma experiência prática de drinks para aprender, preparar e brindar junto.", "R$ 319", "center 50%")}
    </div>
    <div class="pricefoot">{FOOTNOTE}</div>
    {foot("Portfólio · 1 de 3")}
  </section>'''

# ===== 6 · PORTFÓLIO (gastronomia) =====
port2 = f'''
  <section class="slide">
{head_simple("Portfólio de experiências")}
    <span class="eyebrow orange">◆ Portfólio de experiências</span>
    <h2>Em torno da <em>mesa</em></h2>
    <div class="pg2">
      {pcard2("pizzanegroni.jpg", "Entre Fatias &amp; Taças", "Pizza, vinho e uma experiência gastronômica pensada para compartilhar em torno da mesa.", "R$ 349", "center 50%")}
      {pcard2("corp-grupo.jpg", "Experiência Gastronômica", "Uma experiência mão na massa em torno da gastronomia, criada para aproximar o grupo.", "R$ 429", "center 50%")}
    </div>
    <div class="pricefoot">{FOOTNOTE}</div>
    {foot("Portfólio · 2 de 3")}
  </section>'''

# ===== 7 · PORTFÓLIO (mão na massa premium) =====
port3 = f'''
  <section class="slide">
{head_simple("Portfólio de experiências")}
    <span class="eyebrow orange">◆ Portfólio de experiências</span>
    <h2>Mão na massa, <em>peça autoral</em></h2>
    <div class="pg2">
      {pcard2("ceramica.jpg", "Cerâmica", "Uma pausa criativa para modelar, criar e desenvolver uma peça com as próprias mãos.", "R$ 529", "center 40%")}
      {pcard2("lado-b-grupo-pecas.webp", "Tufting &amp; Punch Needle", "Uma experiência têxtil criativa em que cada participante desenvolve sua própria peça.", "R$ 799", "center 35%")}
    </div>
    <div class="pricefoot">{FOOTNOTE}</div>
    {foot("Portfólio · 3 de 3")}
  </section>'''

# ===== 8 · NÓS CUIDAMOS DO RESTO =====
cuidamos = f'''
  <section class="slide">
{head_simple("Nós cuidamos do resto")}
    <span class="eyebrow orange">◆ Nós cuidamos do resto</span>
    <h2>Você escolhe a experiência. <em>Nós montamos o resto.</em></h2>
    <div class="pipe">
      <span class="st">Planejamento</span><span class="ar">→</span>
      <span class="st">Materiais</span><span class="ar">→</span>
      <span class="st">Montagem</span><span class="ar">→</span>
      <span class="st">Profissional</span><span class="ar">→</span>
      <span class="st">Experiência</span><span class="ar">→</span>
      <span class="st">Desmontagem</span>
    </div>
    <div class="pipetx">Nós <b>adaptamos cada experiência</b> ao grupo, ao espaço e ao formato do encontro. Quando fizer sentido, também conseguimos incluir elementos complementares — como <b>alimentos, bebidas, registro ou personalização</b> — sempre de acordo com o briefing.</div>
    {foot("Nós cuidamos do resto")}
  </section>'''

# ===== 9 · FECHAMENTO =====
final = f'''
  <section class="slide">
{head_simple("Para fechar")}
    <span class="eyebrow orange">◆ Para fechar</span>
    <h2>Agora é só escolher como vocês <em>querem estar juntos</em></h2>
    <div class="finwrap">
      <div class="ph">{img("eventocorporativo.jpg", "Grupo celebrando e interagindo junto", "center 32%")}</div>
      <div class="ftx">
        <p class="lead">Seja para <strong>celebrar, integrar o time</strong> ou simplesmente sair um pouco da rotina, nós montamos uma experiência pensada para o grupo de vocês.</p>
        <p class="lead" style="font-size:15px">Conta pra gente a <strong>data</strong>, o <strong>número de pessoas</strong> e a <strong>vibe</strong> do encontro. Nós cuidamos do restante.</p>
        <div class="finsign"><span class="el">Elarah<small>Experiências para viver junto.</small></span></div>
      </div>
    </div>
    {foot("Para fechar")}
  </section>'''

deck = ('<div class="deck">\n' + cover + conceito + vaiate + vibe + port1 + port2 + port3 + cuidamos + final + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/portfolio-corporativo-elarah.html"
io.open(out, "w", encoding="utf-8").write(html)
for bad in ["fornecedor", "repasse", "comiss", "margem"]:
    assert bad not in deck.lower(), f"PROIBIDO: {bad}"
# precos exatos + todas as experiencias presentes
PRECOS = {"Pintura em Taça": "R$ 239", "Vela Aromática": "R$ 269", "Bartenderia": "R$ 319",
          "Entre Fatias": "R$ 349", "Experiência Gastronômica": "R$ 429", "Cerâmica": "R$ 529",
          "Tufting": "R$ 799"}
for nome, preco in PRECOS.items():
    assert nome in deck, f"FALTA EXPERIENCIA: {nome}"
    assert preco in deck, f"FALTA PRECO: {preco}"
print("wrote", out, "| slides:", html.count('<section class="slide">'))
