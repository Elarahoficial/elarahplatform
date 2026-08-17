# Folding Book · turma privada (levamos até o salão) · ~30 mulheres · 13 ou 20/09 · Alto da Lapa.
# Base Folding Book a partir de R$ 249 + 3 planos (+foto&coffee +150, +personalização +100). Paleta azul-acinzentado.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
base = open(S + "/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

# ---- recolor: azul-acinzentado (elegante, artístico, calmo) ----
head = head.replace("--orange:#F27623;", "--orange:#6E8CA0;")
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#516B7D;")
head = head.replace("--navy:#16233C;", "--navy:#26303A;")
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#5A6A76;")
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#6E8CA0;")
head = head.replace("#EDF1F7", "#EEF2F5").replace("#DCE5F1", "#DBE5EC")
head = head.replace("#FF9A4D", "#9BB4C4")
head = head.replace("rgba(242,118,35,.22)", "rgba(110,140,160,.28)")

extra = '''
  /* feature (folding) */
  .bfeat{display:grid;grid-template-columns:47% 1fr;margin-top:16px;background:var(--card);border:1.6px solid var(--orange);border-radius:18px;overflow:hidden;box-shadow:0 18px 42px -24px rgba(0,0,0,.32)}
  .bfeat .bphoto{overflow:hidden;background:#eee;position:relative;min-height:360px}
  .bfeat .bphoto img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .bfeat .bbody{padding:24px 30px 26px;display:flex;flex-direction:column;justify-content:center}
  .bfeat .btag{align-self:flex-start;background:var(--navy);color:#fff;font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:6px 13px;border-radius:999px;margin-bottom:12px}
  .bfeat h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:26px;color:var(--navy);line-height:1.05}
  .bfeat p{font-size:13px;color:var(--muted);margin-top:10px;line-height:1.5}
  .bfeat ul.feat{list-style:none;display:flex;flex-direction:column;gap:9px;margin-top:14px}
  .bfeat ul.feat li{position:relative;padding-left:22px;font-size:13px;color:var(--ink)}
  .bfeat ul.feat li b{font-weight:700}
  .bfeat ul.feat li::before{content:"✦";position:absolute;left:0;top:1px;color:var(--orange);font-size:12px}
  /* galeria vibe */
  .vibe{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
  .vibe figure{margin:0;border-radius:16px;overflow:hidden;position:relative;aspect-ratio:3/4;box-shadow:0 16px 36px -24px rgba(0,0,0,.34)}
  .vibe img{width:100%;height:100%;object-fit:cover;display:block}
  .vibe figcaption{position:absolute;left:0;right:0;bottom:0;padding:28px 14px 13px;color:#fff;font-size:12.5px;font-weight:600;background:linear-gradient(to top,rgba(22,26,30,.82),transparent)}
  /* planos (3 tiers) */
  .tiers{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:18px;align-items:stretch}
  .tier{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px 20px;display:flex;flex-direction:column;position:relative}
  .tier.hl{border:2px solid var(--navy);background:#EEF2F5}
  .tier .tt{font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin-bottom:7px}
  .tier h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:20px;color:var(--navy);line-height:1.06}
  .tier .tp{font-family:'DM Serif Display',serif;font-size:33px;color:var(--ink);line-height:1;margin:11px 0 1px}
  .tier .tu{font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);font-weight:600}
  .tier ul{list-style:none;margin-top:14px;display:flex;flex-direction:column;gap:8px;flex:1}
  .tier ul li{position:relative;padding-left:19px;font-size:12px;color:var(--ink);line-height:1.34}
  .tier ul li::before{content:"✦";position:absolute;left:0;top:1px;color:var(--orange);font-size:10px}
  .tier ul li b{font-weight:700}
  .ttag{position:absolute;top:-11px;left:18px;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:5px 12px;border-radius:999px;white-space:nowrap}
  .fineprint{font-size:10px;color:var(--muted);line-height:1.5;margin-top:16px}
</style>'''
head = head.replace("</style>", extra, 1)

# ---- PDF: sombras borradas viram bloco cinza em leitores iOS — troca por bordas ----
head = head.replace(
    "    @page{size:A4 portrait;margin:0}",
    "    .slide *{box-shadow:none !important}\n"
    "    .cover-photo,.vibe figure,.tier,.bfeat .bphoto{border:1px solid rgba(38,48,58,.14)}\n"
    "    .tiers{grid-template-columns:repeat(3,1fr)}\n"
    "    .vibe{grid-template-columns:repeat(3,1fr)}\n"
    "    .bfeat{grid-template-columns:47% 1fr}\n"
    "    @page{size:A4 portrait;margin:0}", 1)
head = head.replace(".plans{grid-template-columns:1fr}",
                    ".plans{grid-template-columns:1fr}\n    .tiers{grid-template-columns:1fr}\n    .vibe{grid-template-columns:1fr 1fr}\n    .bfeat{grid-template-columns:1fr}\n    .bfeat .bphoto{min-height:200px}")


def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'


cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right">
        <span class="kicker">Proposta de experiência · Turma privada</span>
        <span class="compass">Folding <span>Book</span><small>Turma privada</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência criativa · Folding Book</span>
        <h1>A arte de <em>dobrar</em></h1>
        <p class="lead">Uma tarde criativa e cheia de charme pro grupo: no <strong>Folding Book</strong>, cada convidada transforma as páginas de um livro em uma escultura linda — e leva pra casa a própria arte de recordação. Relaxante, delicado e diferente. 🌿</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>~30</b> mulheres</span>
          <span class="chip"><b>13</b> ou <b>20/09</b></span>
          <span class="chip">Alto da Lapa · <b>levamos até você</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/foldingbook2.jpg" alt="Escultura de folding book com detalhe dourado numa decoração zen" style="object-position:center 42%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Experiências já realizadas para grupos como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)</div>
    {foot("Turma privada · Folding Book")}
  </section>'''

exper = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">A experiência</span></div>
    </div>
    <span class="eyebrow orange">◆ O que é o Folding Book</span>
    <h2>Um livro que vira <em>arte</em></h2>
    <p class="lead">Sem precisar de talento nenhum: guiadas por um profissional, cada uma dobra as páginas de um livro criando formas e relevos lindos — uma peça artística pra decorar e guardar. Meditativo e cheio de significado. 🌿</p>
    <div class="bfeat">
      <div class="bphoto"><img src="assets/foldingbook3.jpg" alt="Escultura de folding book em suporte dourado" style="object-position:center 42%"></div>
      <div class="bbody">
        <span class="btag">Folding Book</span>
        <h3>Mão na massa, no ritmo de vocês</h3>
        <p>A gente leva o profissional, os livros e todo o material até o seu salão. É só o grupo chegar e criar, entre boas conversas.</p>
        <ul class="feat">
          <li>Conduzido por um <b>profissional</b>, do começo ao fim</li>
          <li>Todo o <b>material</b> incluso — sem preparo nenhum</li>
          <li>Cada convidada leva pra casa a <b>própria peça</b></li>
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
    <span class="eyebrow orange">◆ O que elas vão sentir</span>
    <h2>Juntas, <em>criando</em></h2>
    <p class="lead">Mais que uma atividade: uma tarde leve, afetiva e cheia de fotos boas — do tipo que o grupo vai lembrar pra sempre.</p>
    <div class="vibe">
      <figure><img src="assets/corp-criativo.jpg" alt="Convidadas criando lado a lado" style="object-position:center 35%"><figcaption>Mão na massa, junto</figcaption></figure>
      <figure><img src="assets/abraco-elegante.jpg" alt="Amigas se abraçando e rindo durante a experiência" style="object-position:center 25%"><figcaption>Conexão de verdade</figcaption></figure>
      <figure><img src="assets/cover-corp.jpg" alt="Grupo de mulheres num encontro elegante da Elarah" style="object-position:center 40%"><figcaption>Do início ao brinde</figcaption></figure>
    </div>
    {foot("A vibe da experiência")}
  </section>'''

invest = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ Valores por pessoa</span>
    <h2>Escolham o <em>plano</em></h2>
    <p class="lead">A gente leva a experiência até o seu salão no Alto da Lapa — com profissional, material e estrutura inclusos. É só escolher o quão completo querem o encontro:</p>
    <div class="rule"></div>
    <div class="tiers">
      <div class="tier">
        <span class="tt">Plano 1 · Essencial</span>
        <h3>A Experiência</h3>
        <div class="tp">R$ 229</div><div class="tu">por pessoa</div>
        <ul>
          <li>O workshop de Folding Book</li>
          <li>Todo o <b>material</b> e a condução do profissional</li>
          <li><b>Levamos até o seu salão</b></li>
        </ul>
      </div>
      <div class="tier hl">
        <span class="ttag">Mais escolhido</span>
        <span class="tt">Plano 2 · Registro</span>
        <h3>+ Foto &amp; Coffee</h3>
        <div class="tp">R$ 379</div><div class="tu">por pessoa</div>
        <ul>
          <li>Tudo do <b>Plano 1</b></li>
          <li><b>Foto profissional</b> do encontro</li>
          <li><b>Coffee break</b> pra turma</li>
        </ul>
      </div>
      <div class="tier">
        <span class="tt">Plano 3 · Completo</span>
        <h3>+ Personalização</h3>
        <div class="tp">R$ 479</div><div class="tu">por pessoa</div>
        <ul>
          <li>Tudo do <b>Plano 2</b></li>
          <li><b>Lembrancinha personalizada</b></li>
          <li>Com o nome de cada convidada</li>
        </ul>
      </div>
    </div>
    <p class="fineprint">Proposta de experiência da Elarah para turma privada — workshop de Folding Book, para cerca de 30 mulheres, em 13 ou 20/09 (a confirmar), no salão de festas de vocês no Alto da Lapa (levamos até você). Cada participante cria e leva a própria peça, com material e condução do profissional inclusos. Três planos, por pessoa: A Experiência a partir de R$ 229; + Foto &amp; Coffee (foto profissional + coffee break) R$ 379; + Personalização (lembrancinha personalizada) R$ 479. Valores por pessoa. Proposta válida mediante confirmação de data e disponibilidade de agenda.</p>
    {foot("Investimento")}
  </section>'''

proximos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Próximos passos</span></div>
    </div>
    <span class="eyebrow orange">◆ Bora reservar?</span>
    <h2>Vamos deixar tudo <em>pronto</em></h2>
    <p class="lead">Me confirma a data (13 ou 20/09), o plano e o número final de convidadas, que a gente reserva a agenda e organiza tudo pro dia — vocês só aproveitam. 🌿</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">1️⃣</div><h3>Escolham</h3><p>A data, o plano e o número de convidadas — me conta que eu já confirmo.</p></div>
      <div class="infocard"><div class="ico">2️⃣</div><h3>Reservamos</h3><p>A gente segura a agenda e alinha cada detalhe do encontro com você.</p></div>
      <div class="infocard"><div class="ico">3️⃣</div><h3>É só curtir</h3><p>No dia, chega tudo pronto no salão. O grupo só cria e aproveita.</p></div>
    </div>
    <div class="quote">
      <i>Elarah · Experiências criativas</i><br>
      contato@elarah.com.br &nbsp;·&nbsp; <strong>elarah.com.br</strong> &nbsp;·&nbsp; @elarah
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = '<div class="deck">\n' + cover + exper + vibe + invest + proximos + '\n\n</div>\n\n'
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-folding-book-carolina.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
