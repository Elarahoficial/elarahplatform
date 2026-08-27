# Macarons · turma privada · 10 amigas · fim de semana de setembro · descontraída.
# 2 espaços: Escola Receitaria (Jd das Bandeiras) R$425 · Bake Studio R$699. Paleta rosé-macaron.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
base = open(S + "/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

# ---- recolor: rosé-macaron (doce, feminino) ----
head = head.replace("--orange:#F27623;", "--orange:#D07A93;")
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#B05873;")
head = head.replace("--navy:#16233C;", "--navy:#3E2530;")
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#7E5E68;")
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#D07A93;")
head = head.replace("#EDF1F7", "#FBEFF3").replace("#DCE5F1", "#F4DCE4")
head = head.replace("#FF9A4D", "#E1A6B6")
head = head.replace("rgba(242,118,35,.22)", "rgba(208,122,147,.28)")

extra = '''
  /* feature (foto + texto) */
  .bfeat{display:grid;grid-template-columns:48% 1fr;margin-top:16px;background:var(--card);border:1.6px solid var(--orange);border-radius:18px;overflow:hidden;box-shadow:0 18px 42px -24px rgba(0,0,0,.3)}
  .bfeat .bphoto{overflow:hidden;background:#eee;position:relative;min-height:330px}
  .bfeat .bphoto img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .bfeat .bbody{padding:24px 30px 26px;display:flex;flex-direction:column;justify-content:center}
  .bfeat .btag{align-self:flex-start;background:var(--navy);color:#fff;font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:6px 13px;border-radius:999px;margin-bottom:12px}
  .bfeat h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:25px;color:var(--navy);line-height:1.05}
  .bfeat ul.feat{list-style:none;display:flex;flex-direction:column;gap:10px;margin-top:14px}
  .bfeat ul.feat li{position:relative;padding-left:26px;font-size:13px;color:var(--ink);line-height:1.35}
  .bfeat ul.feat li b{font-weight:700;color:var(--navy)}
  .bfeat ul.feat li .st{position:absolute;left:0;top:-1px;width:18px;height:18px;border-radius:999px;background:var(--orange);color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center}
  /* vibe */
  .vibe{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
  .vibe figure{margin:0;border-radius:16px;overflow:hidden;position:relative;aspect-ratio:3/4;box-shadow:0 16px 36px -24px rgba(0,0,0,.34)}
  .vibe img{width:100%;height:100%;object-fit:cover;display:block}
  .vibe figcaption{position:absolute;left:0;right:0;bottom:0;padding:28px 14px 13px;color:#fff;font-size:12.5px;font-weight:600;background:linear-gradient(to top,rgba(50,25,35,.82),transparent)}
  /* venue cards */
  .vgrid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:16px}
  .vcard{background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 36px -24px rgba(0,0,0,.3);position:relative}
  .vcard.hl{border:2px solid var(--navy)}
  .vph{height:196px;overflow:hidden;position:relative;background:#eee}
  .vph img{width:100%;height:100%;object-fit:cover}
  .vpr{position:absolute;top:12px;right:12px;background:var(--navy);color:#fff;border-radius:14px;padding:7px 14px;text-align:center}
  .vpr b{font-family:'DM Serif Display',serif;font-size:22px;font-weight:400;line-height:1;display:block}
  .vpr small{font-size:8px;letter-spacing:.1em;text-transform:uppercase;font-weight:600;opacity:.85}
  .vb{padding:18px 22px 20px;flex:1;display:flex;flex-direction:column}
  .vt{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin-bottom:5px}
  .vcard h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:21px;color:var(--navy);line-height:1.05}
  .vaddr{font-size:11.5px;color:var(--muted);margin-top:6px;line-height:1.45}
  .vcard ul{list-style:none;margin-top:12px;display:flex;flex-direction:column;gap:6px}
  .vcard ul li{position:relative;padding-left:18px;font-size:11.5px;color:var(--ink);line-height:1.3}
  .vcard ul li::before{content:"✦";position:absolute;left:0;top:1px;color:var(--orange);font-size:10px}
  .pslot{width:100%;height:100%;border:2px dashed var(--orange);background:rgba(208,122,147,.09);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;text-align:center;box-sizing:border-box;padding:14px}
  .pslot .pi{font-size:22px}
  .pslot .pl{font-family:'DM Serif Display',serif;font-size:15px;color:var(--navy)}
  .pslot .ps{font-size:9px;color:var(--muted);font-weight:600;letter-spacing:.05em;text-transform:uppercase}
  .fineprint{font-size:10px;color:var(--muted);line-height:1.5;margin-top:16px}
</style>'''
head = head.replace("</style>", extra, 1)

# ---- PDF: sombras borradas viram bloco cinza em leitores iOS — troca por bordas ----
head = head.replace(
    "    @page{size:A4 portrait;margin:0}",
    "    .slide *{box-shadow:none !important}\n"
    "    .cover-photo,.bfeat .bphoto,.vibe figure,.vcard,.vph{border:1px solid rgba(62,37,48,.14)}\n"
    "    .vibe{grid-template-columns:repeat(3,1fr)}\n"
    "    .vgrid{grid-template-columns:1fr 1fr}\n"
    "    .bfeat{grid-template-columns:48% 1fr}\n"
    "    @page{size:A4 portrait;margin:0}", 1)
head = head.replace(".plans{grid-template-columns:1fr}",
                    ".plans{grid-template-columns:1fr}\n    .vibe{grid-template-columns:1fr 1fr}\n    .vgrid{grid-template-columns:1fr}\n    .bfeat{grid-template-columns:1fr}\n    .bfeat .bphoto{min-height:200px}")


def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'


cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right">
        <span class="kicker">Proposta de experiência · Turma privada</span>
        <span class="compass">Oficina de <span>Macarons</span><small>Turma privada</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência gastronômica · Macarons</span>
        <h1>Macarons <em>à mão</em></h1>
        <p class="lead">Uma tarde doce e super descontraída pra reunir as amigas: uma <strong>oficina de macarons</strong> guiada por chef, onde cada uma prepara (e leva pra casa) os próprios macarons franceses — cores, sabores e muita risada. 🧁</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>10</b> amigas</span>
          <span class="chip">Fim de semana de <b>setembro</b></span>
          <span class="chip">Reunião <b>descontraída</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/macarons2.jpg" alt="Macarons franceses em tons pastel numa experiência da Elarah" style="object-position:center 50%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Experiências já realizadas para grupos como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)</div>
    {foot("Turma privada · Macarons")}
  </section>'''

experiencia = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">A experiência</span></div>
    </div>
    <span class="eyebrow orange">◆ Oficina de Macarons</span>
    <h2>Mão na <em>massa</em></h2>
    <p class="lead">Guiadas por um chef, do começo ao fim, cada convidada aprende a fazer os próprios macarons franceses — da massinha ao recheio — e leva pra casa uma caixinha das suas criações. Sem precisar de experiência nenhuma. 🧁</p>
    <div class="bfeat">
      <div class="bphoto"><img src="assets/cozinha31-prato.jpg" alt="Chef preparando macarons à mão" style="object-position:center 45%"></div>
      <div class="bbody">
        <span class="btag">Como acontece</span>
        <h3>Uma tarde, do começo ao fim</h3>
        <ul class="feat">
          <li><span class="st">1</span><b>Boas-vindas</b> — avental, ingredientes na bancada e um clima leve.</li>
          <li><span class="st">2</span><b>Mão na massa</b> — com o chef guiando, cada uma faz e recheia os seus macarons.</li>
          <li><span class="st">3</span><b>Leva pra casa</b> — cada convidada leva uma caixinha dos próprios macarons.</li>
        </ul>
      </div>
    </div>
    {foot("A experiência")}
  </section>'''

vibe = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">A vibe</span></div>
    </div>
    <span class="eyebrow orange">◆ O que vocês vão sentir</span>
    <h2>Risada, cor e <em>docinho</em></h2>
    <p class="lead">Mais que uma aula: uma tarde leve, descontraída e cheia de fotos boas — do tipo que rende história (e docinho) pra levar pra casa. 🧁</p>
    <div class="vibe">
      <figure><img src="assets/vibe-risada.jpg" alt="Amigas rindo juntas na experiência" style="object-position:center 28%"><figcaption>Risada garantida</figcaption></figure>
      <figure><img src="assets/macarons.jpg" alt="Macarons coloridos feitos à mão" style="object-position:center 50%"><figcaption>Cores e sabores</figcaption></figure>
      <figure><img src="assets/macarons1.jpg" alt="Macarons franceses para levar pra casa" style="object-position:center 50%"><figcaption>Docinhos pra levar</figcaption></figure>
    </div>
    {foot("A vibe da experiência")}
  </section>'''

espacos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Onde acontece &amp; investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ Dois espaços à escolha</span>
    <h2>Escolham o <em>cenário</em></h2>
    <p class="lead">Duas opções lindas pra reunir a turma — é só escolher qual combina mais com vocês. Valor por pessoa, com material, ingredientes e condução do chef inclusos.</p>
    <div class="vgrid">
      <div class="vcard">
        <div class="vph"><div class="pslot"><span class="pi">＋ 📷</span><span class="pl">Foto do espaço</span><span class="ps">Escola Receitaria</span></div><div class="vpr"><b>R$ 425</b><small>por pessoa</small></div></div>
        <div class="vb">
          <span class="vt">Opção 1 · Escola Gourmet</span>
          <h3>Escola Receitaria</h3>
          <p class="vaddr">Jardim das Bandeiras · Rua Abegoaria, 538</p>
          <ul>
            <li>Direto no espaço da escola (cozinha equipada)</li>
            <li>Material, ingredientes e chef inclusos</li>
            <li>Cada uma leva os próprios macarons</li>
          </ul>
        </div>
      </div>
      <div class="vcard hl">
        <div class="vph"><img src="assets/espaco1.jpg" alt="Lounge acolhedor do Bake Studio"><div class="vpr"><b>R$ 699</b><small>por pessoa</small></div></div>
        <div class="vb">
          <span class="vt">Opção 2 · Exclusivo</span>
          <h3>Bake Studio</h3>
          <p class="vaddr">Estúdio exclusivo, só do grupo — cozinha e sala com liberdade pra decorar.</p>
          <ul>
            <li>Espaço <b>exclusivo</b> só de vocês</li>
            <li>Material, ingredientes e chef inclusos</li>
            <li>Clima intimista pra reunião de amigas</li>
          </ul>
        </div>
      </div>
    </div>
    <p class="fineprint">Valores por pessoa, para a oficina de macarons, para um grupo de 10 pessoas, num fim de semana de setembro (a confirmar). Na Escola Receitaria (Escola Gourmet · Jardim das Bandeiras, Rua Abegoaria, 538): R$ 425 por pessoa. No Bake Studio (espaço exclusivo do grupo): R$ 699 por pessoa. Em ambos, material, ingredientes e condução do chef inclusos; cada convidada leva os próprios macarons. Proposta válida mediante confirmação de data e disponibilidade de agenda.</p>
    {foot("Onde acontece · Investimento")}
  </section>'''

proximos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Próximos passos</span></div>
    </div>
    <span class="eyebrow orange">◆ Bora adoçar o encontro?</span>
    <h2>É só <em>escolher</em></h2>
    <p class="lead">Me confirma o espaço e a data (fim de semana de setembro) que a gente reserva tudo e organiza a oficina pra vocês. Qualquer dúvida, é só chamar. 🧁</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">1️⃣</div><h3>Escolham</h3><p>O espaço (Escola Receitaria ou Bake Studio) e a data.</p></div>
      <div class="infocard"><div class="ico">2️⃣</div><h3>Reservamos</h3><p>A gente segura a agenda e o espaço pra sua turma.</p></div>
      <div class="infocard"><div class="ico">3️⃣</div><h3>É só curtir</h3><p>No dia, chega tudo pronto. Vocês só põem a mão na massa.</p></div>
    </div>
    <div class="quote">
      <i>Elarah · Experiências criativas</i><br>
      contato@elarah.com.br &nbsp;·&nbsp; <strong>elarah.com.br</strong> &nbsp;·&nbsp; @elarah
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = '<div class="deck">\n' + cover + experiencia + vibe + espacos + proximos + '\n\n</div>\n\n'
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-macarons.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
