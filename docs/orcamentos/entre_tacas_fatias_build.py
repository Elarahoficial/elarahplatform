# Proposta Elarah · Entre Tacas & Fatias | Pizza & Vinho
# Experiencia privada para um casal (2 pessoas) · 02/10/2026 · Emporio da Ci (confirmado)
# Clima intimista e gastronomico. Sem inventar duracao/valores/itens. Valor = a confirmar com o Emporio.
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/orcamento-adriana.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]

head = re.sub(r'<title>.*?</title>', '<title>Entre Taças &amp; Fatias · Pizza &amp; Vinho · Elarah</title>', head, count=1, flags=re.DOTALL)
head = re.sub(r'<meta name="description"[^>]*>',
              '<meta name="description" content="Entre Taças & Fatias · uma experiência privada de pizza e vinho para dois, no Empório da Ci.">',
              head, count=1)

extra = '''
<style>
  /* como funciona */
  .hiw{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:22px}
  .hiwc{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 14px 32px -24px rgba(0,0,0,.32)}
  .hiwph{height:155px;position:relative;overflow:hidden;background:#eee}
  .hiwph img{width:100%;height:100%;object-fit:cover;display:block}
  .hiwnum{position:absolute;top:10px;left:10px;width:28px;height:28px;border-radius:999px;background:var(--navy);color:#fff;font-family:'DM Serif Display',serif;font-size:13px;display:flex;align-items:center;justify-content:center}
  .hiwb{padding:14px 17px 16px}
  .hiwb h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:16px;color:var(--navy);line-height:1.12;margin:0 0 6px}
  .hiwb p{font-size:11.5px;color:var(--muted);line-height:1.5;margin:0}
  .hiwb p b{color:var(--navy);font-weight:700}
  /* o que esta incluso */
  .isplit{display:grid;grid-template-columns:1fr 1fr;gap:36px;margin-top:22px;align-items:center}
  .isplit .ph{border-radius:18px;overflow:hidden;border:1px solid var(--line);box-shadow:0 18px 42px -26px rgba(0,0,0,.42);height:350px}
  .isplit .ph img{width:100%;height:100%;object-fit:cover;display:block}
  .ilist{list-style:none;margin:0;padding:0;display:grid;gap:14px}
  .ilist li{position:relative;padding-left:29px;font-size:14px;color:var(--ink);line-height:1.4}
  .ilist li b{color:var(--navy);font-weight:700}
  .ilist li .ck{position:absolute;left:0;top:1px;width:19px;height:19px;border-radius:999px;background:var(--orange);color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center}
  /* o local */
  .locsplit{display:grid;grid-template-columns:1.12fr 1fr;margin-top:20px;border-radius:18px;overflow:hidden;border:1px solid var(--line);box-shadow:0 18px 44px -28px rgba(0,0,0,.42)}
  .locsplit .ph{position:relative;min-height:320px}
  .locsplit .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .locsplit .bd{background:var(--card);padding:30px 34px;display:flex;flex-direction:column;justify-content:center}
  .locsplit .tag{font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .locsplit h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:27px;color:var(--navy);margin:6px 0 10px;line-height:1.05}
  .locsplit p{font-size:13px;color:var(--muted);line-height:1.6;margin:0}
  .locsplit .conf{margin-top:16px;align-self:flex-start;display:inline-flex;gap:7px;background:#EAF3EC;color:#2E7D5B;font-size:11px;font-weight:700;padding:7px 14px;border-radius:999px}
  /* investimento */
  .ibox{margin-top:24px;background:linear-gradient(158deg,var(--navy),#2a1620);color:#fff;border-radius:20px;padding:38px 40px;text-align:center;box-shadow:0 22px 50px -28px rgba(0,0,0,.5)}
  .ibox .tag{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--orange);font-weight:700}
  .ibox .big{font-family:'DM Serif Display',serif;font-size:32px;margin:12px 0 10px;line-height:1.1}
  .ibox p{font-size:13px;color:rgba(255,255,255,.82);line-height:1.6;margin:0 auto;max-width:52ch}
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


def hiw(n, foto, titulo, desc, pos="center 50%"):
    return (f'<div class="hiwc"><div class="hiwph">{img(foto, titulo, pos)}<div class="hiwnum">{n}</div></div>'
            f'<div class="hiwb"><h3>{titulo}</h3><p>{desc}</p></div></div>')


# ===== 1 · CAPA =====
cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Experiência privada · a dois</span><span class="compass">Pizza <span>&amp; Vinho</span><small>Empório da Ci · 02/10</small></span></div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Uma experiência a dois</span>
        <h1>Entre Taças <em>&amp; Fatias</em></h1>
        <p class="lead">Uma noite só de vocês dois: <strong>rodízio de pizzas artesanais</strong>, uma seleção de <strong>vinhos argentinos</strong> e dicas de harmonização — no <strong>Empório da Ci</strong>. 🍷</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>2</b> pessoas</span>
          <span class="chip"><b>02/10</b></span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip">Empório da Ci</span>
          <span class="chip">Experiência privada</span>
        </div>
      </div>
      <div class="cover-photo">{img("cozinhacasal.jpg", "Casal rindo em um jantar intimista com vinho", "center 30%")}</div>
    </div>
    {foot("Pizza & Vinho · a dois")}
  </section>'''

# ===== 2 · COMO FUNCIONA =====
como = f'''
  <section class="slide">
{head_simple("Como funciona")}
    <span class="eyebrow orange">◆ Como funciona</span>
    <h2>Uma noite de <em>pizza &amp; vinho</em></h2>
    <p class="lead">Do forno à taça: fatias artesanais, vinhos argentinos e as melhores combinações — num ritmo leve, só de vocês.</p>
    <div class="hiw">
      {hiw("01", "pizza.jpg", "Rodízio de pizzas artesanais", "Pizzas artesanais servidas no capricho, à vontade.", "center 50%")}
      {hiw("02", "curadoria-vinhos.jpg", "Degustação de vinhos", "Vinhos argentinos <b>Siempre Tengo un Plan B</b> — Branco, Rosé e Tinto.", "center 45%")}
      {hiw("03", "harmonizacaoqueijos.jpg", "Dicas de harmonização", "Como combinar cada pizza com o vinho ideal.", "center 55%")}
    </div>
    <div class="bnote" style="margin-top:18px">◆ A experiência acontece no <strong>Empório da Ci</strong> — um ambiente aconchegante e gastronômico, pensado para vocês dois. 🍷</div>
    {foot("Como funciona")}
  </section>'''

# ===== 3 · O QUE ESTÁ INCLUSO =====
incluso = f'''
  <section class="slide">
{head_simple("O que está incluso")}
    <span class="eyebrow orange">◆ Tudo pensado para vocês</span>
    <h2>O que está <em>incluso</em></h2>
    <div class="isplit">
      <div class="ph">{img("vinhotintos.jpg", "Vinhos e taças — branco, rosé e tinto", "center 50%")}</div>
      <ul class="ilist">
        <li><span class="ck">✓</span><b>Rodízio</b> de pizzas artesanais</li>
        <li><span class="ck">✓</span><b>Degustação</b> dos vinhos argentinos — Branco, Rosé e Tinto</li>
        <li><span class="ck">✓</span><b>Dicas de harmonização</b> entre pizzas e vinhos</li>
        <li><span class="ck">✓</span>Experiência privada no <b>Empório da Ci</b></li>
      </ul>
    </div>
    {foot("O que está incluso")}
  </section>'''

# ===== 4 · O LOCAL =====
local = f'''
  <section class="slide">
{head_simple("O local")}
    <span class="eyebrow orange">◆ Onde acontece</span>
    <h2>Empório <em>da Ci</em></h2>
    <div class="locsplit">
      <div class="ph">{img("pizzanegroni.jpg", "Ambiente gastronômico e aconchegante", "center 50%")}</div>
      <div class="bd">
        <span class="tag">O ponto de encontro</span>
        <h3>Empório da Ci</h3>
        <p>Um ambiente <strong>aconchegante e gastronômico</strong>, com a atmosfera perfeita para uma experiência intimista de pizza e vinho a dois.</p>
        <span class="conf">✓ Local já confirmado</span>
      </div>
    </div>
    {foot("O local")}
  </section>'''

# ===== 5 · INVESTIMENTO =====
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>A experiência <em>a dois</em></h2>
    <p class="lead">Uma experiência privada de pizza e vinho, pensada para vocês dois no Empório da Ci.</p>
    <div class="ibox">
      <div class="tag">Investimento</div>
      <div class="big">Valor a confirmar</div>
      <p>Assim que o <b style="color:#fff">Empório da Ci</b> confirmar, enviamos o valor final da experiência — já no formato privado para o casal.</p>
    </div>
    <div class="quote" style="margin-top:22px">
      É só confirmar que a gente deixa tudo pronto para a noite de vocês. 🍷<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Investimento")}
  </section>'''

deck = ('<div class="deck">\n' + cover + como + incluso + local + investimento + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/proposta-entre-tacas-fatias.html"
io.open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
