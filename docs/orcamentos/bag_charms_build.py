# Proposta Elarah · Bag Charms · ATIVACAO DE MARCA / lancamento · 15 a 20 · SP
# v3: capa com pessoas; experiencia mais animada + negrito; momento vende vibe + rodape ativacao;
# investimento = tabela comparativa (Experiencia x Experiencia Completa); encerramento com passos + botao WhatsApp.
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/proposta-bag-charms.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]

extra = '''
<style>
  .cmt{width:100%;border-collapse:collapse;margin-top:18px;border-radius:16px;overflow:hidden;box-shadow:0 16px 40px -30px rgba(0,0,0,.3)}
  .cmt thead th{background:var(--navy);color:#fff;padding:15px 18px;font-size:12px;font-weight:700;text-align:center;letter-spacing:.02em}
  .cmt thead th.feat{text-align:left;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.7)}
  .cmt thead th.prem{background:var(--orange-dark)}
  .cmt thead th small{display:block;font-family:'DM Sans',sans-serif;font-weight:600;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.85);margin-top:3px}
  .cmt td{padding:13px 18px;border-bottom:1px solid var(--line);background:var(--card);font-size:12.5px;text-align:center;color:var(--ink)}
  .cmt td.feat{text-align:left;font-weight:600;color:var(--navy)}
  .cmt td.prem{background:#FBF0F3}
  .cmt .inc{color:var(--orange-dark);font-weight:700}
  .cmt .no{color:var(--muted)}
  .cmt tr.val td{font-family:'DM Serif Display',serif;font-size:17px;color:var(--navy);background:#F7EFEC}
  .cmt tr.val td.feat{font-family:'DM Sans',sans-serif;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--orange-dark);font-weight:700}
  .cmt tr.val td.prem{background:#F2D9E1}
  .cmt tr.tot td{background:var(--navy);color:#fff;font-family:'DM Serif Display',serif;font-size:18px}
  .cmt tr.tot td.feat{font-family:'DM Sans',sans-serif;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.8);font-weight:700}
  .cmt tr.tot td.prem{background:var(--orange-dark)}
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
{head_block("Ativação de marca · São Paulo", "Bag", "Charms", "15 a 20 convidadas")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Uma ativação Elarah</span>
        <h1>Crie seu <em>Bag Charm</em></h1>
        <p class="lead">Uma experiência para <strong>criar, personalizar e celebrar juntas</strong>: cada convidada monta o próprio bag charm — <strong>correntes, pingentes, pérolas, letras e fitas</strong> — e leva pra casa.</p>
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
      <div class="cover-photo">{img("antonella-capa-grupo.jpg", "Mulheres juntas, rindo e criando", "center 30%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Bag Charms · São Paulo")}
  </section>'''

experiencia = f'''
  <section class="slide">
{head_simple("A experiência")}
    <span class="eyebrow orange">◆ Cada uma cria o seu</span>
    <h2>Do charm à <em>peça final</em></h2>
    <p class="lead">Uma <strong>ativação criativa</strong> para o seu lançamento: cada convidada escolhe entre correntes, pingentes, pérolas e letras e <strong>monta o próprio bag charm</strong> — <strong>espontâneo, autoral e cheio de conexão</strong>, do começo ao fim.</p>
    <div class="flow4">
      {fstep("01", "charm-materials-tray.jpg", "center 55%", "Escolha", "Escolhem charms, pingentes, pérolas e letras.")}
      {fstep("02", "charmbar.jpg", "center 50%", "Composição", "Combinam cores, texturas e elementos.")}
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
      <figure>{img("charmbar.jpg", "Variedade de charms e pingentes", "center 50%")}<figcaption>Os charms</figcaption></figure>
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
{head_simple("Local & formato")}
    <span class="eyebrow orange">◆ Onde acontece</span>
    <h2>O espaço certo para <em>o lançamento</em></h2>
    <p class="lead">A Elarah trabalha com <strong>espaços parceiros e outras opções de locação</strong> em São Paulo. Dependendo do formato, o espaço pode ter ou não custo de locação — buscamos o ambiente com <strong>a cara da marca</strong>.</p>
    <div class="duo">
      <figure>{img("betchavas.jpg", "Rooftop e lounge contemporâneo", "center 50%")}<figcaption>Rooftop &amp; lounge</figcaption></figure>
      <figure>{img("betchavas3.jpg", "Espaço envidraçado e verde", "center 50%")}<figcaption>Envidraçado &amp; verde</figcaption></figure>
      <figure>{img("betchavas2.jpg", "Bar social contemporâneo", "center 50%")}<figcaption>Bar contemporâneo</figcaption></figure>
      <figure>{img("sterna-painel.webp", "Café urbano e bem localizado", "center 50%")}<figcaption>Café urbano</figcaption></figure>
    </div>
    <p class="fineprint">Sugestões de ambiente conforme região e disponibilidade. O espaço e as condições (com ou sem custo de locação) são confirmados ao alinhar o formato do evento.</p>
    {foot("Local & formato")}
  </section>'''

investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Escolham a <em>ativação</em></h2>
    <table class="cmt">
      <thead>
        <tr><th class="feat">O que inclui</th><th>Experiência</th><th class="prem">Experiência Completa<small>Ativação + registro + mimo</small></th></tr>
      </thead>
      <tbody>
        <tr><td class="feat">Charm de Bolsa</td><td class="inc">Incluso</td><td class="prem inc">Incluso</td></tr>
        <tr><td class="feat">Produção Elarah</td><td class="inc">Incluso</td><td class="prem inc">Incluso</td></tr>
        <tr><td class="feat">Fotografia</td><td class="no">—</td><td class="prem inc">Incluso</td></tr>
        <tr><td class="feat">Mimo para cada convidada</td><td class="no">—</td><td class="prem inc">Incluso</td></tr>
        <tr class="val"><td class="feat">Valor por pessoa</td><td>a partir de R$ 189</td><td class="prem">R$ 353,94</td></tr>
        <tr class="tot"><td class="feat">Total · 20 pessoas</td><td>R$ 3.780</td><td class="prem">R$ 7.078,80</td></tr>
      </tbody>
    </table>
    <p class="fineprint">Valores por pessoa. A <b>Experiência Completa</b> entrega uma ativação mais completa para o lançamento, com <b>registro fotográfico + mimo para cada convidada</b>. Fotografia R$ 499 (valor total) e mimo R$ 139,99 por pessoa inclusos na opção completa.</p>
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
    <a class="btn-wa" href="https://wa.me/5511914455930?text=Oi%2C%20Elarah!%20Quero%20falar%20sobre%20a%20ativa%C3%A7%C3%A3o%20de%20Bag%20Charms%20para%20o%20lan%C3%A7amento." target="_blank" rel="noopener">💬 Falar com a Elarah no WhatsApp</a>
    {foot("Vamos criar?")}
  </section>'''

deck = ('<div class="deck">\n' + cover + experiencia + momento + incluso + espaco
        + investimento + encerramento + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/proposta-bag-charms.html"
io.open(out, "w", encoding="utf-8").write(html)
assert "piranha" not in deck and "joia-atelie" not in deck, "PROIBIDO"
print("wrote", out, "| slides:", html.count('<section class="slide">'), "| ok")
