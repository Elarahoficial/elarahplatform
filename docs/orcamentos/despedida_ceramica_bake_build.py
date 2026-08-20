# Despedida de solteira (Adriana) · Pintura em Ceramica · Bake Studio exclusivo · 20 pessoas · 18/01/2027.
# 3 planos a partir de 349. Paleta rose/blush.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
base = open(S + "/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

# ---- recolor: terracota / argila (cerâmica, quente) ----
head = head.replace("--orange:#F27623;", "--orange:#C77E86;")
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#A85C66;")
head = head.replace("--navy:#16233C;", "--navy:#3A2530;")
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#7A5E66;")
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#C77E86;")
head = head.replace("#EDF1F7", "#F8EFF1").replace("#DCE5F1", "#F1DCE2")
head = head.replace("#FF9A4D", "#D9A6B0")
head = head.replace("rgba(242,118,35,.22)", "rgba(199,126,134,.28)")

extra = '''
  /* feature (foto + texto) */
  .bfeat{display:grid;grid-template-columns:48% 1fr;margin-top:16px;background:var(--card);border:1.6px solid var(--orange);border-radius:18px;overflow:hidden;box-shadow:0 18px 42px -24px rgba(0,0,0,.32)}
  .bfeat .bphoto{overflow:hidden;background:#eee;position:relative;min-height:340px}
  .bfeat .bphoto img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .bfeat .bbody{padding:24px 30px 26px;display:flex;flex-direction:column;justify-content:center}
  .bfeat .btag{align-self:flex-start;background:var(--navy);color:#fff;font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:6px 13px;border-radius:999px;margin-bottom:12px}
  .bfeat h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:25px;color:var(--navy);line-height:1.05}
  .bfeat p{font-size:12.5px;color:var(--muted);margin-top:9px;line-height:1.5}
  .bfeat ul.feat{list-style:none;display:flex;flex-direction:column;gap:10px;margin-top:14px}
  .bfeat ul.feat li{position:relative;padding-left:26px;font-size:13px;color:var(--ink);line-height:1.35}
  .bfeat ul.feat li b{font-weight:700;color:var(--navy)}
  .bfeat ul.feat li .st{position:absolute;left:0;top:-1px;width:18px;height:18px;border-radius:999px;background:var(--orange);color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center}
  .bnote{margin-top:14px;background:#F8EFF1;border-left:4px solid var(--orange);border-radius:0 12px 12px 0;padding:12px 18px;font-size:12px;color:var(--navy-soft);line-height:1.5}
  .bnote b{color:var(--navy)}
  /* planos (3 tiers) */
  .tiers{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px;align-items:stretch}
  .tier{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:20px 18px;display:flex;flex-direction:column;position:relative}
  .tier.hl{border:2px solid var(--navy);background:#F8EFF1}
  .tier .tt{font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin-bottom:6px}
  .tier h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:20px;color:var(--navy);line-height:1.06}
  .tier .sub{font-size:11px;color:var(--muted);margin-top:3px}
  .tier .tp{font-family:'DM Serif Display',serif;font-size:33px;color:var(--ink);line-height:1;margin:11px 0 1px}
  .tier .tu{font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);font-weight:600}
  .tier ul{list-style:none;margin-top:13px;display:flex;flex-direction:column;gap:7px;flex:1}
  .tier ul li{position:relative;padding-left:18px;font-size:11.5px;color:var(--ink);line-height:1.32}
  .tier ul li::before{content:"✦";position:absolute;left:0;top:1px;color:var(--orange);font-size:10px}
  .tier ul li b{font-weight:700}
  .ttag{position:absolute;top:-11px;left:18px;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:5px 12px;border-radius:999px;white-space:nowrap}
  .fineprint{font-size:10px;color:var(--muted);line-height:1.5;margin-top:16px}
  .vibe{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
  .vibe figure{margin:0;border-radius:16px;overflow:hidden;position:relative;aspect-ratio:3/4;box-shadow:0 16px 36px -24px rgba(0,0,0,.34)}
  .vibe img{width:100%;height:100%;object-fit:cover;display:block}
  .vibe figcaption{position:absolute;left:0;right:0;bottom:0;padding:28px 14px 13px;color:#fff;font-size:12.5px;font-weight:600;background:linear-gradient(to top,rgba(40,25,32,.82),transparent)}
</style>'''
head = head.replace("</style>", extra, 1)

# ---- PDF: sombras borradas viram bloco cinza em leitores iOS — troca por bordas ----
head = head.replace(
    "    @page{size:A4 portrait;margin:0}",
    "    .slide *{box-shadow:none !important}\n"
    "    .cover-photo,.tier,.bfeat .bphoto,.vibe figure{border:1px solid rgba(46,38,32,.14)}\n"
    "    .tiers{grid-template-columns:repeat(3,1fr)}\n"
    "    .bfeat{grid-template-columns:48% 1fr}\n"
    "    @page{size:A4 portrait;margin:0}", 1)
head = head.replace(".plans{grid-template-columns:1fr}",
                    ".plans{grid-template-columns:1fr}\n    .tiers{grid-template-columns:1fr}\n    .bfeat{grid-template-columns:1fr}\n    .bfeat .bphoto{min-height:200px}")


def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'


cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right">
        <span class="kicker">Proposta de despedida de solteira</span>
        <span class="compass">Pintura <span>em cerâmica</span><small>Bake Studio</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Despedida de solteira · Pintura em cerâmica</span>
        <h1>A despedida <em>perfeita</em></h1>
        <p class="lead">Uma tarde criativa e cheia de afeto pra celebrar a noiva: um workshop de <strong>pintura em cerâmica</strong> no <strong>Bake Studio</strong> — um estúdio só de vocês — onde cada convidada pinta a própria peça à mão e leva pra casa de lembrança. 🤍</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>20</b> convidadas</span>
          <span class="chip"><b>18/01/2027</b></span>
          <span class="chip"><b>Bake Studio</b> · exclusivo</span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/ceramica1.jpg" alt="Peças de cerâmica sendo pintadas à mão numa experiência da Elarah" style="object-position:center 40%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Experiências já realizadas para grupos como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)</div>
    {foot("Despedida · Pintura em cerâmica")}
  </section>'''

experiencia = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">A experiência</span></div>
    </div>
    <span class="eyebrow orange">◆ Pintura em cerâmica</span>
    <h2>Pintar <em>à mão</em></h2>
    <p class="lead">Conduzida por uma profissional, cada convidada escolhe a própria peça de cerâmica e pinta à mão — do desenho às cores, cheia de personalidade — e leva pra casa de lembrança. Sem precisar de talento nenhum. 🤍</p>
    <div class="bfeat">
      <div class="bphoto"><img src="assets/pinturapratoceramica.jpg" alt="Peça de cerâmica sendo pintada à mão" style="object-position:center 50%"></div>
      <div class="bbody">
        <span class="btag">Como acontece</span>
        <h3>Uma tarde, do começo ao fim</h3>
        <ul class="feat">
          <li><span class="st">1</span><b>Boas-vindas</b> — material posto na mesa e um clima leve pra começar.</li>
          <li><span class="st">2</span><b>Mão na massa</b> — com orientação o tempo todo, cada uma pinta a sua peça.</li>
          <li><span class="st">3</span><b>Leva pra casa</b> — cada convidada leva a própria peça de recordação.</li>
        </ul>
      </div>
    </div>
    {foot("A experiência")}
  </section>'''

espaco = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O espaço</span></div>
    </div>
    <span class="eyebrow orange">◆ Onde acontece</span>
    <h2>Bake <em>Studio</em></h2>
    <p class="lead">Um estúdio exclusivo, só do grupo de vocês, com cozinha e sala e liberdade pra decorar. O cenário perfeito pra uma despedida criativa e memorável.</p>
    <div class="bfeat">
      <div class="bphoto"><img src="assets/espaco1.jpg" alt="Lounge acolhedor do Bake Studio" style="object-position:center 50%"></div>
      <div class="bbody">
        <span class="btag">Bake Studio · exclusivo</span>
        <h3>Um estúdio só de vocês</h3>
        <p>Espaço exclusivo com cozinha e sala, só do grupo — com liberdade pra decorar e receber foto profissional.</p>
        <div class="bnote">◆ No Bake Studio, o espaço é <b>exclusivo do grupo</b> — sem consumação mínima, com liberdade total pra decorar, brindar e curtir a despedida do jeitinho de vocês. 🥂</div>
      </div>
    </div>
    {foot("O espaço · Bake Studio")}
  </section>'''

planos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham o plano</span>
    <h2>O <em>investimento</em></h2>
    <p class="lead">Valor por pessoa, para a pintura em cerâmica no Bake Studio (espaço exclusivo só de vocês). É só escolher o quão completa querem a despedida:</p>
    <div class="rule"></div>
    <div class="tiers">
      <div class="tier">
        <span class="tt">Plano 1</span>
        <h3>Essencial</h3><span class="sub">A experiência + espaço exclusivo.</span>
        <div class="tp">R$ 349</div><div class="tu">por pessoa</div>
        <ul>
          <li>A <b>experiência</b> de pintura em cerâmica</li>
          <li>Todo o <b>material</b> e condução por profissional</li>
          <li><b>Espaço exclusivo</b> no Bake Studio, só de vocês</li>
          <li>A peça pronta, pra cada uma <b>levar pra casa</b></li>
        </ul>
      </div>
      <div class="tier hl">
        <span class="ttag">Mais escolhido</span>
        <span class="tt">Plano 2</span>
        <h3>Premium</h3><span class="sub">+ Foto profissional &amp; coffee.</span>
        <div class="tp">R$ 499</div><div class="tu">por pessoa</div>
        <ul>
          <li>Tudo do <b>Essencial</b></li>
          <li><b>Foto profissional</b> da despedida</li>
          <li><b>Coffee break</b> completo — salgados, doces e bebidas</li>
        </ul>
      </div>
      <div class="tier">
        <span class="tt">Plano 3</span>
        <h3>Completo</h3><span class="sub">Com tudo e personalizado.</span>
        <div class="tp">R$ 599</div><div class="tu">por pessoa</div>
        <ul>
          <li>Tudo do <b>Premium</b></li>
          <li><b>Decoração temática</b> do ambiente</li>
          <li><b>Lembrancinhas personalizadas</b> (escova &amp; piranha com a inicial)</li>
        </ul>
      </div>
    </div>
    <div class="bnote" style="margin-top:16px">◆ No <b>Bake Studio</b> o espaço é <b>exclusivo do grupo</b>, sem consumação mínima — os planos já incluem tudo o que está descrito. 🥂</div>
    <p class="fineprint">Valores por pessoa, para a experiência de pintura em cerâmica no Bake Studio (espaço exclusivo do grupo, sem consumação mínima), para 20 pessoas, em 18/01/2027. Reserva: 50% + 50% até 72h antes · Pix, cartão ou transferência (até 12x) · Duração de 2h a 3h. Data e horário sujeitos à confirmação e disponibilidade de agenda.</p>
    {foot("Investimento")}
  </section>'''

proximos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Próximos passos</span></div>
    </div>
    <span class="eyebrow orange">◆ Bora reunir as amigas? 🎨</span>
    <h2>É só <em>confirmar</em></h2>
    <p class="lead">Me confirma o plano e a data, que a gente reserva o Bake Studio e organiza cada detalhe pra deixar esse encontro especial. 🤍</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">1️⃣</div><h3>Escolham o plano</h3><p>Essencial, Premium ou Completo — me diz qual combina mais.</p></div>
      <div class="infocard"><div class="ico">2️⃣</div><h3>Reservamos</h3><p>Confirmando a data, a gente segura o Bake Studio pra vocês.</p></div>
      <div class="infocard"><div class="ico">3️⃣</div><h3>É só criar</h3><p>No dia, chega tudo pronto. A turma só coloca a mão na massa.</p></div>
    </div>
    <div class="quote">
      <i>Elarah · Experiências criativas</i><br>
      WhatsApp +55 (11) 91445-5930 &nbsp;·&nbsp; <strong>elarah.com.br</strong> &nbsp;·&nbsp; @elarah.oficial
    </div>
    {foot("Próximos passos")}
  </section>'''

vibe = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">A vibe</span></div>
    </div>
    <span class="eyebrow orange">◆ O que vocês vão sentir</span>
    <h2>Risada, arte e <em>lembrança</em></h2>
    <p class="lead">Mais que uma atividade: uma tarde leve, afetiva e cheia de fotos boas — do tipo que a noiva e as amigas vão lembrar pra sempre. E cada uma ainda leva a própria peça e uma lembrancinha. 🤍</p>
    <div class="vibe">
      <figure><img src="assets/desp-hero2.jpg" alt="Amigas se abraçando e rindo" style="object-position:center 22%"><figcaption>Juntas, do início ao fim</figcaption></figure>
      <figure><img src="assets/corp-criativo.jpg" alt="Convidadas criando lado a lado" style="object-position:center 35%"><figcaption>Mão na massa, junto</figcaption></figure>
      <figure><img src="assets/personaliza%C3%A7aobrindeescovapiranha.jpg" alt="Lembrancinha personalizada" style="object-position:center 50%"><figcaption>Lembrancinha personalizada</figcaption></figure>
    </div>
    {foot("A vibe da experiência")}
  </section>'''

deck = '<div class="deck">\n' + cover + experiencia + espaco + vibe + planos + proximos + '\n\n</div>\n\n'
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-despedida-ceramica-bake.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
