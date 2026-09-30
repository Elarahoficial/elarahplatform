# Proposta Elarah · Entre Charms · ATIVACAO DE MARCA / lancamento · 15 a 20 · SP
# v4: nome "Entre Charms" (experiencia, nao produto); capa com maos criando;
# composicao social; "Os charms" com elementos reais; investimento em 2 opcoes claras
# (Experiencia x Mais Completo - Sugestao Elarah); encerramento com passos + botao WhatsApp.
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/proposta-bag-charms.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]

# --- limpa <style> injetados por builds anteriores: mantem apenas os 2 blocos base ---
_parts = re.split(r'(<style>.*?</style>)', head, flags=re.DOTALL)
_kept = 0
_out = []
for _p in _parts:
    if _p.startswith('<style>'):
        _kept += 1
        if _kept <= 2:
            _out.append(_p)
    else:
        _out.append(_p)
head = ''.join(_out)

# --- titulo / meta ---
head = re.sub(r'<title>.*?</title>', '<title>Entre Charms · Elarah</title>', head, count=1, flags=re.DOTALL)
head = re.sub(r'<meta name="description"[^>]*>',
              '<meta name="description" content="Entre Charms · uma experiência Elarah de criação, encontros e personalidade: cada convidada monta o próprio bag charm. Ativação de marca em São Paulo.">',
              head, count=1)

# --- CSS consolidado (uma unica injecao) ---
extra = '''
<style>
  /* fluxo da experiencia */
  .flow4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:18px}
  .flow4 .fs{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;box-shadow:0 12px 28px -22px rgba(0,0,0,.3);display:flex;flex-direction:column}
  .flow4 .fsph{height:118px;overflow:hidden;background:#eee}
  .flow4 .fsph img{width:100%;height:100%;object-fit:cover;display:block}
  .flow4 .fsb{padding:11px 14px 14px}
  .flow4 .fsn{font-family:'DM Serif Display',serif;color:var(--orange);font-size:17px;line-height:1}
  .flow4 .fst{font-family:'DM Serif Display',serif;font-size:14.5px;color:var(--navy);line-height:1.12;margin-top:3px}
  .flow4 .fsd{font-size:10px;color:var(--muted);line-height:1.4;margin-top:6px}
  /* incluso */
  .inclist{display:grid;grid-template-columns:1fr;gap:11px;margin:0;padding:0}
  .inclist li{list-style:none;position:relative;padding-left:28px;font-size:13px;color:var(--ink);line-height:1.4}
  .inclist li b{color:var(--navy);font-weight:700}
  .inclist li .ck{position:absolute;left:0;top:1px;width:18px;height:18px;border-radius:999px;background:var(--orange);color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center}
  .split{display:grid;grid-template-columns:1fr 1fr;gap:36px;margin-top:20px;align-items:center}
  .split .sph{border-radius:18px;overflow:hidden;border:1px solid var(--line);box-shadow:0 18px 42px -26px rgba(0,0,0,.4);height:380px}
  .split .sph img{width:100%;height:100%;object-fit:cover;display:block}
  /* espacos: O Jardim */
  .jhero{margin:18px 0 0;border-radius:18px;overflow:hidden;position:relative;height:250px;border:1px solid var(--line);box-shadow:0 18px 44px -28px rgba(0,0,0,.42)}
  .jhero img{width:100%;height:100%;object-fit:cover;display:block}
  .jhero figcaption{position:absolute;left:0;right:0;bottom:0;padding:28px 18px 14px;color:#fff;font-size:13px;font-weight:600;background:linear-gradient(to top,rgba(46,31,42,.86),transparent)}
  .jrow3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:14px}
  .jrow3 figure{margin:0;border-radius:15px;overflow:hidden;position:relative;height:150px;border:1px solid var(--line);box-shadow:0 14px 32px -24px rgba(0,0,0,.36)}
  .jrow3 img{width:100%;height:100%;object-fit:cover;display:block}
  .jrow3 figcaption{position:absolute;left:0;right:0;bottom:0;padding:22px 12px 10px;color:#fff;font-size:11px;font-weight:600;background:linear-gradient(to top,rgba(46,31,42,.86),transparent)}
  /* momento */
  .mos2{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:16px}
  .mos2 figure{margin:0;border-radius:15px;overflow:hidden;position:relative;height:200px;border:1px solid var(--line);box-shadow:0 14px 34px -24px rgba(0,0,0,.36)}
  .mos2 img{width:100%;height:100%;object-fit:cover;display:block}
  .mos2 figcaption{position:absolute;left:0;right:0;bottom:0;padding:24px 14px 11px;color:#fff;font-size:11.5px;font-weight:600;letter-spacing:.03em;background:linear-gradient(to top,rgba(46,31,42,.86),transparent)}
  /* investimento: 3 opcoes claras */
  .invtrio{display:grid;grid-template-columns:1fr 1fr 1.14fr;gap:14px;margin-top:22px;align-items:stretch}
  .iopt{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:20px 20px 18px;box-shadow:0 16px 40px -28px rgba(0,0,0,.3);display:flex;flex-direction:column}
  .iopt .tag{font-size:10px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);line-height:1.25}
  .iopt .desc{font-size:11px;color:var(--muted);line-height:1.4;margin-top:5px}
  .iopt .big{font-family:'DM Serif Display',serif;font-size:33px;color:var(--navy);line-height:1.02;margin:12px 0 2px}
  .iopt .per{font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--navy-soft);font-weight:700}
  .iopt .grp{margin-top:13px;font-family:'DM Serif Display',serif;font-size:18px;color:var(--navy)}
  .iopt .grp small{display:block;font-family:'DM Sans',sans-serif;font-size:9px;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-top:3px}
  .iopt .spacer{flex:1}
  .iopt .brk{margin-top:12px;border-top:1px solid var(--line);padding-top:10px;display:grid;gap:6px}
  .iopt .brk .row{display:flex;justify-content:space-between;gap:8px;font-size:10px;color:var(--muted)}
  .iopt .brk .row b{font-weight:700;white-space:nowrap;color:var(--navy-soft)}
  /* opcao recomendada */
  .iopt.rec{background:linear-gradient(158deg,var(--navy),#241722);border-color:transparent;color:#fff;position:relative;overflow:hidden}
  .iopt.rec .badge{display:inline-flex;align-items:center;gap:6px;align-self:flex-start;background:var(--orange);color:#fff;font-size:9px;letter-spacing:.1em;text-transform:uppercase;font-weight:800;padding:4px 11px;border-radius:999px;margin-bottom:12px}
  .iopt.rec .htop{display:flex;align-items:center;gap:11px}
  .iopt.rec .recph{width:52px;height:52px;border-radius:12px;object-fit:cover;flex:none;border:1px solid rgba(255,255,255,.22)}
  .iopt.rec .tag{color:var(--orange)}
  .iopt.rec .desc{color:rgba(255,255,255,.78)}
  .iopt.rec .big,.iopt.rec .grp{color:#fff}
  .iopt.rec .per{color:rgba(255,255,255,.72)}
  .iopt.rec .grp small{color:rgba(255,255,255,.6)}
  .iopt.rec .brk{border-top-color:rgba(255,255,255,.16)}
  .iopt.rec .brk .row{color:rgba(255,255,255,.82)}
  .iopt.rec .brk .row b{color:#fff}
  /* encerramento */
  .steps{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin-top:14px}
  .steps .step{background:var(--card);border:1px solid var(--line);border-radius:15px;padding:17px 15px;box-shadow:0 10px 26px -22px rgba(0,0,0,.3)}
  .steps .step .num{font-family:'DM Serif Display',serif;font-size:26px;color:var(--orange);line-height:1}
  .steps .step h3{font-size:13px;font-weight:700;color:var(--navy);margin:7px 0 5px;line-height:1.15}
  .steps .step p{font-size:10.5px;color:var(--muted);line-height:1.4}
  .subh{font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin:20px 0 0}
  .btn-wa{display:inline-flex;align-items:center;gap:9px;background:#25D366;color:#fff;font-weight:700;font-size:15px;padding:14px 26px;border-radius:999px;text-decoration:none;box-shadow:0 14px 30px -12px rgba(37,211,102,.55);margin-top:18px}
</style>'''
head = head.replace("</head>", extra + "</head>", 1)


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


def fstep(n, foto, pos, titulo, desc):
    return (f'<div class="fs"><div class="fsph">{img(foto, titulo, pos)}</div>'
            f'<div class="fsb"><div class="fsn">{n}</div><div class="fst">{titulo}</div><div class="fsd">{desc}</div></div></div>')


def step(n, titulo, desc):
    return f'<div class="step"><div class="num">{n}</div><h3>{titulo}</h3><p>{desc}</p></div>'


PROOF = "Experiências já realizadas para grupos como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)"

cover = f'''
  <section class="slide">
{head_block("Ativação de marca · São Paulo", "Entre", "Charms", "15 a 20 convidadas")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Uma ativação Elarah</span>
        <h1>Entre <em>Charms</em></h1>
        <p class="lead"><strong>Uma experiência de criação, encontros e personalidade.</strong> Cada convidada monta o próprio bag charm — <strong>correntes, pingentes, pérolas, letras e fitas</strong> — no seu tempo, entre boas conversas.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>15 a 20</b> convidadas</span>
          <span class="chip">São Paulo</span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip">Lançamento de marca</span>
          <span class="chip"><b>1h30</b> de experiência</span>
        </div>
      </div>
      <div class="cover-photo">{img("charm-making-mesa.jpg", "Mulheres criando seus bag charms juntas", "center 42%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Entre Charms · São Paulo")}
  </section>'''

experiencia = f'''
  <section class="slide">
{head_simple("A experiência")}
    <span class="eyebrow orange">◆ Cada uma cria o seu</span>
    <h2>Do charm à <em>peça final</em></h2>
    <p class="lead">Uma <strong>ativação criativa</strong> para o seu lançamento: cada convidada escolhe entre correntes, pingentes, pérolas e letras e <strong>monta o próprio bag charm</strong> — <strong>espontâneo, autoral e cheio de conexão</strong>, do começo ao fim.</p>
    <div class="flow4">
      {fstep("01", "charm-materials-tray.jpg", "center 55%", "Escolha", "Escolhem charms, pingentes, pérolas e letras.")}
      {fstep("02", "antonella-capa-grupo.jpg", "center 30%", "Composição", "Entre risadas, combinam cores, texturas e elementos.")}
      {fstep("03", "charm-making-maos.jpg", "center 45%", "Montagem", "Montam a peça com acompanhamento.")}
      {fstep("04", "charm-bolsa-suede.jpg", "center 45%", "Peça final", "Cada uma leva o próprio charm na bolsa.")}
    </div>
    <div class="bnote" style="margin-top:18px">◆ <strong>Não precisa de experiência:</strong> em cerca de <strong>1h30</strong>, a facilitadora conduz o grupo do começo ao fim, e cada convidada sai com um <strong>acessório único</strong>. 🧡</div>
    {foot("A experiência")}
  </section>'''

momento = f'''
  <section class="slide">
{head_simple("Momento Elarah")}
    <span class="eyebrow orange">◆ Momento Elarah</span>
    <h2>A experiência <em>acontecendo</em></h2>
    <div class="mos2">
      <figure>{img("charm-making-grupo.jpg", "Mulheres montando os bag charms juntas", "center 45%")}<figcaption>Criar junto</figcaption></figure>
      <figure>{img("hidrateimeninas.jpg", "Grupo de mulheres rindo e criando", "center 30%")}<figcaption>Risadas &amp; conexão</figcaption></figure>
      <figure>{img("charm-mesa-rosa.jpg", "Mesa montada com charms e ferramentas", "center 45%")}<figcaption>Escolher os elementos</figcaption></figure>
      <figure>{img("charm-final-flatlay.jpg", "Detalhe do bag charm finalizado", "center 50%")}<figcaption>Cada detalhe</figcaption></figure>
      <figure>{img("charm-elementos-mesa.jpg", "Variedade de correntes, letras, pingentes e pérolas", "center 50%")}<figcaption>Os charms</figcaption></figure>
      <figure>{img("charm-bolsa.jpg", "Bag charm finalizado na bolsa", "center 50%")}<figcaption>O resultado</figcaption></figure>
    </div>
    <div class="bnote" style="margin-top:16px">◆ Mais do que uma oficina, uma <strong>experiência que aproxima pessoas e marca</strong> de um jeito leve, criativo e espontâneo. A <strong>Elarah cuida da ativação</strong> — da curadoria à experiência acontecendo.</div>
    {foot("Momento Elarah")}
  </section>'''

incluso = f'''
  <section class="slide">
{head_simple("O que está incluso")}
    <span class="eyebrow orange">◆ Tudo pronto</span>
    <h2>O que está <em>incluso</em></h2>
    <div class="split">
      <div class="sph">{img("charm-flatlay.jpg", "Bag charm finalizado", "center 50%")}</div>
      <ul class="inclist">
        <li><span class="ck">✓</span><b>Curadoria e produção</b> Elarah</li>
        <li><span class="ck">✓</span><b>Facilitadora</b> da experiência</li>
        <li><span class="ck">✓</span><b>Materiais</b> para os bag charms</li>
        <li><span class="ck">✓</span>Variedade de <b>charms e elementos</b></li>
        <li><span class="ck">✓</span><b>Ferramentas</b> necessárias</li>
        <li><span class="ck">✓</span><b>Montagem</b> e acompanhamento da atividade</li>
        <li><span class="ck">✓</span>Cada participante <b>leva sua criação</b></li>
      </ul>
    </div>
    {foot("O que está incluso")}
  </section>'''

espaco = f'''
  <section class="slide">
{head_simple("Local & atmosfera")}
    <span class="eyebrow orange">◆ Onde acontece</span>
    <h2>O Jardim — <em>ou o seu espaço</em></h2>
    <p class="lead">A nossa recomendação é o <strong>O Jardim · Café &amp; Brunch</strong>: um café charmoso com <strong>área externa arborizada</strong>, o cenário natural perfeito pra experiência acontecer entre o verde e render foto o dia inteiro. Também dá pra levar tudo até o <strong>seu espaço</strong>. 🌿</p>
    <div class="jhero">{img("ojardim1.jpg", "Área externa arborizada do O Jardim", "center 55%")}<figcaption>Área externa arborizada</figcaption></div>
    <div class="jrow3">
      <figure>{img("ojardim4.jpg", "Coffee break e brunch servido à mesa", "center 55%")}<figcaption>Coffee break &amp; brunch</figcaption></figure>
      <figure>{img("ojardim2.jpg", "Jardim e deck do O Jardim", "center 50%")}<figcaption>Jardim &amp; deck</figcaption></figure>
      <figure>{img("ojardim3.jpg", "Fachada do O Jardim Café & Brunch", "center 50%")}<figcaption>O Jardim · Café &amp; Brunch</figcaption></figure>
    </div>
    <div class="bnote" style="margin-top:16px">◆ No Jardim: <strong>R$ 600</strong> de locação do espaço + <strong>R$ 99</strong> de brunch por pessoa. Data e disponibilidade a confirmar.</div>
    {foot("Local & atmosfera")}
  </section>'''

investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Escolham a <em>ativação</em></h2>
    <div class="invtrio">
      <div class="iopt">
        <span class="tag">Só experiência</span>
        <p class="desc">A experiência de charms, com curadoria e produção Elarah.</p>
        <div class="big">R$ 179</div>
        <span class="per">por pessoa</span>
        <div class="spacer"></div>
        <div class="grp">R$ 3.580<small>20 participantes</small></div>
      </div>
      <div class="iopt">
        <span class="tag">Brunch + espaço + experiência</span>
        <p class="desc">A experiência no O Jardim, com brunch e espaço privado.</p>
        <div class="big">R$ 308</div>
        <span class="per">por pessoa</span>
        <div class="brk">
          <div class="row"><span>Experiência</span><b>R$ 179 / pessoa</b></div>
          <div class="row"><span>Brunch (O Jardim)</span><b>R$ 99 / pessoa</b></div>
          <div class="row"><span>Locação do espaço</span><b>R$ 600 total</b></div>
        </div>
        <div class="spacer"></div>
        <div class="grp">R$ 6.160<small>20 participantes</small></div>
      </div>
      <div class="iopt rec">
        <span class="badge">✦ Sugestão Elarah</span>
        <div class="htop">
          <img class="recph" src="assets/garrafa-rosa-personalizada.jpg" alt="Mimo personalizado">
          <div>
            <span class="tag">Premium</span>
            <p class="desc">Tudo + registro fotográfico + mimo personalizado.</p>
          </div>
        </div>
        <div class="big">R$ 472,35</div>
        <span class="per">por pessoa</span>
        <div class="brk">
          <div class="row"><span>Experiência</span><b>R$ 179 / pessoa</b></div>
          <div class="row"><span>Brunch (O Jardim)</span><b>R$ 99 / pessoa</b></div>
          <div class="row"><span>Locação do espaço</span><b>R$ 600 total</b></div>
          <div class="row"><span>Registro fotográfico</span><b>R$ 489 total</b></div>
          <div class="row"><span>Mimo personalizado</span><b>R$ 139,90 / pessoa</b></div>
        </div>
        <div class="spacer"></div>
        <div class="grp">R$ 9.447<small>20 participantes</small></div>
      </div>
    </div>
    <p class="fineprint">Valores por pessoa (locação do espaço e registro fotográfico são valores totais), com base em 20 participantes no <b>O Jardim · Café &amp; Brunch</b>. A opção <b>Premium — Sugestão Elarah</b> é a nossa recomendação para uma ativação de lançamento, com registro profissional e mimo personalizado para cada convidada.</p>
    {foot("Investimento")}
  </section>'''

encerramento = f'''
  <section class="slide">
{head_simple("Vamos criar?")}
    <span class="eyebrow orange">◆ Bora criar?</span>
    <h2>E aí, <em>vamos criar?</em></h2>
    <p class="lead"><strong>A gente cuida de tudo</strong> — da curadoria à montagem. Uma <strong>ativação by Elarah</strong> pensada para transformar o lançamento em um momento de <strong>criação, conexão e marca</strong>.</p>
    <p class="subh">Bora reunir o time?</p>
    <div class="steps">
      {step("1", "Escolha a experiência", "Confirme a opção que mais combina com o lançamento.")}
      {step("2", "Defina o espaço", "Escolhemos juntas o espaço e o formato ideal.")}
      {step("3", "Confirme a data", "Com a confirmação, reservamos e organizamos a produção.")}
      {step("4", "A Elarah cuida do resto", "Curadoria, materiais, montagem e todos os detalhes.")}
    </div>
    <a class="btn-wa" href="https://wa.me/5511914455930?text=Oi%2C%20Elarah!%20Quero%20falar%20sobre%20a%20experi%C3%AAncia%20Entre%20Charms%20para%20o%20lan%C3%A7amento." target="_blank" rel="noopener">💬 Falar com a Elarah no WhatsApp</a>
    {foot("Vamos criar?")}
  </section>'''

deck = ('<div class="deck">\n' + cover + experiencia + momento + incluso + espaco
        + investimento + encerramento + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/proposta-bag-charms.html"
io.open(out, "w", encoding="utf-8").write(html)
assert "piranha" not in deck and "joia-atelie" not in deck and "charmbar" not in deck, "PROIBIDO"
_ns = html.count('<style>', 0, html.find('<div class="deck">'))
print("wrote", out, "| slides:", html.count('<section class="slide">'), "| style blocks:", _ns)
