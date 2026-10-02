# Proposta Elarah · Fabiana · Folding Book em Campinas (projeto de reconexão do feminino)
# 6 slides, editorial/feminino/clean/artesanal. Ate 20 participantes. Data/horario/local a definir.
# INVESTIMENTO: R$ 299/pessoa · total 20 = R$ 5.980 (grupo de 20, Campinas). Deslocamento incluso.
# NAO expor custo/fornecedor/margem/comissao/marca. Somente Folding Book (sem Low Poly/Honey Comb/colagem).
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/orcamento-adriana.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]

head = re.sub(r'<title>.*?</title>', '<title>Folding Book em Campinas · Fabiana · Elarah</title>', head, count=1, flags=re.DOTALL)
head = re.sub(r'<meta name="description"[^>]*>',
              '<meta name="description" content="Folding Book em Campinas — uma experiência para desacelerar, criar e transformar páginas em arte. Encontro feminino, intimista e criativo.">',
              head, count=1)

extra = '''
<style>
  /* capa */
  .pftitle{text-align:right;line-height:1.5}
  .pftitle .top{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--navy-soft);font-weight:700}
  .pftitle .big{font-size:17px;font-weight:800;color:var(--navy);letter-spacing:.01em;margin-top:2px}
  .pftitle .big em{font-style:normal;color:var(--orange)}
  .pftitle .sub{font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--navy-soft);font-weight:700;margin-top:2px}
  /* slide 2 — a experiencia (hero editorial + lista) */
  .expwrap{display:grid;grid-template-columns:1.02fr .98fr;gap:34px;margin-top:24px;width:100%;align-items:stretch}
  .exphero{border-radius:22px;overflow:hidden;position:relative;border:1px solid var(--line);box-shadow:0 24px 54px -28px rgba(0,0,0,.42);min-height:540px}
  .exphero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .exphero .cap{position:absolute;left:0;right:0;bottom:0;padding:62px 22px 22px;background:linear-gradient(to top,rgba(46,31,42,.88),transparent)}
  .exphero .cap .k{font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.82);font-weight:700}
  .exphero .cap .t{margin-top:5px;color:#fff;font-family:'DM Serif Display',serif;font-size:22px;line-height:1.15}
  .explist{display:flex;flex-direction:column;gap:14px;justify-content:center}
  .expc{display:grid;grid-template-columns:96px 1fr;gap:16px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:12px 16px 12px 12px;box-shadow:0 14px 34px -26px rgba(0,0,0,.3)}
  .expc .th{width:96px;height:96px;border-radius:12px;overflow:hidden;position:relative;flex:none}
  .expc .th img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .expc .bd .t{font-family:'DM Serif Display',serif;font-size:17px;color:var(--navy);line-height:1.12}
  .expc .bd .d{margin-top:5px;font-size:11.5px;color:var(--muted);line-height:1.45}
  /* slide 3 — trio desacelerar/criar/conectar */
  .trio{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin-top:24px;width:100%}
  .tcard{background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 38px -26px rgba(0,0,0,.32);min-width:0}
  .tcard .ph{height:230px;position:relative;overflow:hidden}
  .tcard .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .tcard .bd{padding:20px 22px 22px}
  .tcard h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:21px;color:var(--navy);margin:0 0 7px;line-height:1.1}
  .tcard p{font-size:12px;color:var(--muted);line-height:1.55;margin:0}
  /* slide 4 — como funciona (foto + checklist) */
  .cfwrap{display:grid;grid-template-columns:.96fr 1.04fr;gap:32px;margin-top:22px;align-items:stretch}
  .cfwrap .ph{border-radius:20px;overflow:hidden;position:relative;border:1px solid var(--line);box-shadow:0 22px 52px -28px rgba(0,0,0,.42);min-height:420px}
  .cfwrap .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .cflist{display:flex;flex-direction:column;justify-content:center;gap:12px}
  .cfi{display:flex;align-items:flex-start;gap:13px;font-size:13.5px;color:var(--navy-soft);line-height:1.4}
  .cfi::before{content:"✦";color:var(--orange);font-weight:800;flex:none;font-size:13px;margin-top:1px}
  .cfi b{color:var(--navy);font-weight:700}
  .cfnote{margin-top:16px;font-size:11.5px;color:var(--muted);font-style:italic;line-height:1.5}
  /* slide 5 — investimento */
  .invwrap{display:grid;grid-template-columns:.92fr 1.08fr;gap:26px;margin-top:22px;align-items:stretch}
  .pcard{background:var(--navy);color:#fff;border-radius:22px;padding:34px 34px;display:flex;flex-direction:column;justify-content:center;box-shadow:0 26px 60px -30px rgba(60,31,40,.6)}
  .pcard .lab{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--orange);font-weight:800}
  .pcard .wk{font-family:'DM Serif Display',serif;font-size:21px;margin:8px 0 18px;line-height:1.14}
  .pcard .num{font-family:'DM Serif Display',serif;font-size:58px;line-height:1;color:var(--orange)}
  .pcard .per{margin-top:6px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.7);font-weight:700}
  .pcard .tot{margin-top:20px;padding-top:18px;border-top:1px solid rgba(255,255,255,.22)}
  .pcard .tot .k{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.7);font-weight:700}
  .pcard .tot .v{font-family:'DM Serif Display',serif;font-size:32px;color:var(--orange);line-height:1.05;margin-top:3px}
  .inccard{background:var(--card);border:1px solid var(--line);border-radius:22px;padding:26px 30px;box-shadow:0 18px 44px -28px rgba(0,0,0,.3);display:flex;flex-direction:column;justify-content:center}
  .inccard .h{font-family:'DM Serif Display',serif;font-size:17px;color:var(--navy);margin:0 0 14px}
  .incl{display:grid;grid-template-columns:1fr;gap:9px}
  .incl .i{display:flex;align-items:flex-start;gap:10px;font-size:12.5px;color:var(--navy-soft);line-height:1.35}
  .incl .i::before{content:"✓";color:var(--orange);font-weight:800;flex:none;margin-top:1px}
  .invsmall{margin-top:16px;font-size:11px;color:var(--muted);font-style:italic;line-height:1.5}
  /* slide 6 — primeiro encontro de muitos */
  .finwrap{display:grid;grid-template-columns:1fr 1.02fr;gap:36px;margin-top:20px;align-items:center}
  .finwrap .ph{border-radius:20px;overflow:hidden;border:1px solid var(--line);box-shadow:0 22px 52px -28px rgba(0,0,0,.45);height:430px;position:relative}
  .finwrap .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .finwrap p.lead{margin-top:0}
  .bigquote{margin-top:16px;font-family:'DM Serif Display',serif;font-size:23px;color:var(--navy);line-height:1.22}
  .bigquote em{font-style:italic;color:var(--orange)}
  .ctabox{margin-top:18px;background:#EBF1F4;border-left:4px solid var(--orange);border-radius:14px;padding:20px 24px}
  .ctabox .t{font-family:'DM Serif Display',serif;font-size:18px;color:var(--navy);margin:0 0 6px;line-height:1.25}
  .ctabox .t em{font-style:italic;color:var(--orange)}
  .ctabox .contact{margin-top:8px;font-size:12px;color:var(--navy-soft);line-height:1.5}
  .ctabox .contact b{color:var(--navy)}
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


def expc(src, titulo, desc, pos="center 50%"):
    return (f'<div class="expc"><div class="th">{img(src, titulo, pos)}</div>'
            f'<div class="bd"><div class="t">{titulo}</div><div class="d">{desc}</div></div></div>')


def tcard(src, titulo, desc, pos="center 50%"):
    return (f'<div class="tcard"><div class="ph">{img(src, titulo, pos)}</div>'
            f'<div class="bd"><h3>{titulo}</h3><p>{desc}</p></div></div>')


def cfi(texto):
    return f'<div class="cfi">{texto}</div>'


# ===== 1 · CAPA =====
cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><div class="pftitle"><div class="top">Proposta de experiência</div><div class="big">Folding <em>Book</em></div><div class="sub">Campinas · Fabiana</div></div></div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência criativa · Folding Book</span>
        <h1>Folding Book em <em>Campinas</em></h1>
        <p class="lead">Uma experiência para <strong>desacelerar, criar e transformar páginas em arte</strong> — um encontro feminino, intimista e criativo.</p>
        <div class="chips">
          <span class="chip">Campinas · SP</span>
          <span class="chip">até <b>20</b> participantes</span>
          <span class="chip">data a definir</span>
        </div>
      </div>
      <div class="cover-photo">{img("foldingbook-maos.jpg", "Mãos segurando uma escultura de livro criada à mão", "center 45%")}</div>
    </div>
    {foot("Folding Book · Campinas")}
  </section>'''

# ===== 2 · A EXPERIÊNCIA =====
experiencia = f'''
  <section class="slide">
{head_simple("A experiência")}
    <span class="eyebrow orange">◆ A experiência</span>
    <h2>Páginas que ganham <em>uma nova forma</em></h2>
    <p class="lead">Cada participante transforma um livro em uma <strong>escultura tridimensional</strong> pela técnica do Folding Book — dobra a dobra, as páginas ganham volume, textura e forma.</p>
    <div class="expwrap">
      <div class="exphero">{img("foldingbook2.jpg", "Escultura de livro dobrado, peça autoral finalizada", "center 45%")}
        <div class="cap"><div class="k">Feito à mão</div><div class="t">Uma peça única<br>para levar para casa</div></div>
      </div>
      <div class="explist">
        {expc("foldingbook-grupo.jpg", "Sem experiência prévia", "Nenhum conhecimento é necessário — a técnica é ensinada do zero.", "center 40%")}
        {expc("foldingbook-dobra.jpg", "Acompanhamento da artista", "A artista conduz cada passo, da preparação à finalização da peça.", "center 50%")}
        {expc("foldingbook3.jpg", "Processo manual e contemplativo", "Horas de presença, mãos ocupadas e mente tranquila.", "center 50%")}
        {expc("foldingbook.jpg", "Uma peça para levar", "Cada participante leva para casa a escultura que criou.", "center 50%")}
      </div>
    </div>
    {foot("A experiência")}
  </section>'''

# ===== 3 · POR QUE COMBINA =====
combina = f'''
  <section class="slide">
{head_simple("Por que combina com o encontro")}
    <span class="eyebrow orange">◆ Um fazer manual que convida à presença</span>
    <h2>Criar também pode ser uma forma de <em>pausa</em></h2>
    <p class="lead">Durante algumas horas, o grupo desacelera, trabalha com as mãos e acompanha <strong>páginas comuns se transformarem</strong> em uma peça completamente nova.</p>
    <div class="trio">
      {tcard("foldingbook-maos.jpg", "Desacelerar", "Um tempo só seu, longe da pressa, para estar inteira no presente.", "center 45%")}
      {tcard("foldingbook-dobra.jpg", "Criar", "Mãos ocupadas, mente leve: a arte como pausa e expressão.", "center 50%")}
      {tcard("foldingbook-grupo.jpg", "Conectar", "Um encontro feminino para criar e compartilhar lado a lado.", "center 40%")}
    </div>
    {foot("Por que combina com o encontro")}
  </section>'''

# ===== 4 · COMO FUNCIONA =====
comofunciona = f'''
  <section class="slide">
{head_simple("Como funciona")}
    <span class="eyebrow orange">◆ Como funciona</span>
    <h2>Tudo pensado para o <em>grupo criar junto</em></h2>
    <div class="cfwrap">
      <div class="ph">{img("foldingbook-grupo.jpg", "Grupo de mulheres em workshop de Folding Book", "center 45%")}</div>
      <div class="cflist">
        {cfi("Grupo de <b>até 20 participantes</b>")}
        {cfi("Experiência conduzida pela <b>artista</b>")}
        {cfi("Duração aproximada de <b>3h a 5h</b>")}
        {cfi("<b>Livros e materiais</b> inclusos")}
        {cfi("Escultura <b>Folding Book</b> produzida no encontro")}
        {cfi("Cada participante <b>leva a sua criação</b>")}
        {cfi("Realização em <b>Campinas</b>")}
        <p class="cfnote">Data, horário e endereço serão definidos em conjunto, conforme a agenda do grupo e o espaço escolhido.</p>
      </div>
    </div>
    {foot("Como funciona")}
  </section>'''

# ===== 5 · INVESTIMENTO =====
inc_items = [
    "Workshop de Folding Book", "Condução da artista",
    "Livros para a realização da experiência", "Todos os materiais necessários",
    "Tesoura, cola e itens de acabamento", "Certificado",
    "Deslocamento da profissional até Campinas",
]
inc_html = "".join(f'<div class="i">{t}</div>' for t in inc_items)
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Um encontro feito <em>sob medida</em></h2>
    <div class="invwrap">
      <div class="pcard">
        <div class="lab">Experiência Folding Book</div>
        <div class="wk">Oficina completa<br>para o grupo</div>
        <div class="num">R$ 299</div>
        <div class="per">por pessoa</div>
        <div class="tot"><div class="k">Total · 20 participantes</div><div class="v">R$ 5.980</div></div>
      </div>
      <div class="inccard">
        <p class="h">O valor inclui:</p>
        <div class="incl">{inc_html}</div>
      </div>
    </div>
    <p class="invsmall">Valor considerando grupo de 20 participantes e realização em Campinas. A locação do espaço não está incluída. Data sujeita à disponibilidade da profissional.</p>
    {foot("Investimento")}
  </section>'''

# ===== 6 · UM PRIMEIRO ENCONTRO DE MUITOS =====
final = f'''
  <section class="slide">
{head_simple("Um primeiro encontro de muitos")}
    <span class="eyebrow orange">◆ Um primeiro encontro de muitos</span>
    <h2>Este pode ser apenas <em>o começo</em></h2>
    <div class="finwrap">
      <div class="ph">{img("foldingbook-dobra.jpg", "Mãos criando juntas durante a oficina de Folding Book", "center 45%")}</div>
      <div>
        <p class="lead">A Elarah pode acompanhar os próximos encontros do seu projeto com <strong>novas experiências criativas</strong>, construindo formatos diferentes ao longo do calendário e de acordo com cada momento.</p>
        <p class="bigquote">Um encontro delicado — <em>o primeiro de muitos.</em></p>
        <div class="ctabox">
          <p class="t">Quando a data e o espaço estiverem definidos, <em>seguimos juntos</em></p>
          <p class="contact">Cuidamos dos próximos detalhes e deixamos toda a experiência pronta para vocês.<br>WhatsApp <b>+55 (11) 91445-5930</b> · @elarah.oficial · elarah.com.br</p>
        </div>
      </div>
    </div>
    {foot("Folding Book · Campinas")}
  </section>'''

deck = ('<div class="deck">\n' + cover + experiencia + combina + comofunciona
        + investimento + final + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/proposta-folding-fabiana.html"
io.open(out, "w", encoding="utf-8").write(html)

# ---- guardas ----
for bad in ["fornecedor", "repasse", "comiss", "margem", "papelizei", "low poly", "honey comb", "colagem",
            "r$ 200", "r$ 4.000", "4.000", "sob consulta"]:
    assert bad not in deck.lower(), f"PROIBIDO: {bad}"
for val in ["R$ 299", "R$ 5.980"]:
    assert val in deck, f"FALTA VALOR: {val}"
assert "A definir" not in deck, "investimento agora tem valores confirmados"
assert "Deslocamento da profissional até Campinas" in deck, "falta item de deslocamento"
assert "Folding Book" in deck
assert "Páginas que ganham" in deck
assert "Desacelerar" in deck and "Criar" in deck and "Conectar" in deck
assert "até 20 participantes" in deck or "até <b>20</b> participantes" in deck
assert "locação do espaço não está incluída" in deck
assert "o primeiro de muitos" in deck.lower()
assert html.count('<section class="slide">') == 6, "esperado 6 slides"
print("wrote", out, "| slides:", html.count('<section class="slide">'))
