# OPÇÃO FINAL · Modelagem em Cerâmica · Betc Havas Café · consumo min R$50/pessoa.
# Planos mantidos: Essencial 189 / Premium 279 / Completo 399. Paleta terracota/argila.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
base = open(S + "/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

# ---- recolor: terracota / argila (cerâmica, quente) ----
head = head.replace("--orange:#F27623;", "--orange:#B0714E;")
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#8C5638;")
head = head.replace("--navy:#16233C;", "--navy:#2E2620;")
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#6E6053;")
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#B0714E;")
head = head.replace("#EDF1F7", "#F6F0E9").replace("#DCE5F1", "#EBDFD0")
head = head.replace("#FF9A4D", "#CFA079")
head = head.replace("rgba(242,118,35,.22)", "rgba(176,113,78,.26)")

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
  .bnote{margin-top:14px;background:#F6F0E9;border-left:4px solid var(--orange);border-radius:0 12px 12px 0;padding:12px 18px;font-size:12px;color:var(--navy-soft);line-height:1.5}
  .bnote b{color:var(--navy)}
  /* planos (3 tiers) */
  .tiers{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px;align-items:stretch}
  .tier{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:20px 18px;display:flex;flex-direction:column;position:relative}
  .tier.hl{border:2px solid var(--navy);background:#F6F0E9}
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
</style>'''
head = head.replace("</style>", extra, 1)

# ---- PDF: sombras borradas viram bloco cinza em leitores iOS — troca por bordas ----
head = head.replace(
    "    @page{size:A4 portrait;margin:0}",
    "    .slide *{box-shadow:none !important}\n"
    "    .cover-photo,.tier,.bfeat .bphoto{border:1px solid rgba(46,38,32,.14)}\n"
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
        <span class="kicker">Proposta final · turma privada</span>
        <span class="compass">Modelagem <span>em cerâmica</span><small>Betc Havas Café</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Opção escolhida · Modelagem em cerâmica</span>
        <h1>Está tudo <em>pronto</em></h1>
        <p class="lead">A opção fechada: uma tarde de <strong>modelagem em cerâmica</strong> no charmoso <strong>Betc Havas Café</strong>, onde cada convidada dá forma à própria peça à mão e leva pra casa de recordação. Agora é só escolher o plano. 🤍</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>Modelagem</b> em cerâmica</span>
          <span class="chip"><b>Betc Havas</b> Café</span>
          <span class="chip">A partir de <b>R$ 189</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/ceramicamodelagem.jpg" alt="Mãos modelando uma peça de cerâmica à mão" style="object-position:center 50%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Experiências já realizadas para grupos como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)</div>
    {foot("Opção final · Modelagem em cerâmica")}
  </section>'''

experiencia = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">A experiência</span></div>
    </div>
    <span class="eyebrow orange">◆ Modelagem em cerâmica</span>
    <h2>Dar forma <em>à mão</em></h2>
    <p class="lead">Conduzida por uma profissional, cada convidada modela a própria peça de cerâmica — do barro à forma, cheia de personalidade — e leva pra casa de lembrança. Sem precisar de experiência nenhuma. 🤍</p>
    <div class="bfeat">
      <div class="bphoto"><img src="assets/casalmodelagemceramica.jpg" alt="Mãos modelando cerâmica juntas" style="object-position:center 45%"></div>
      <div class="bbody">
        <span class="btag">Como acontece</span>
        <h3>Uma tarde, do começo ao fim</h3>
        <ul class="feat">
          <li><span class="st">1</span><b>Boas-vindas</b> — material posto na mesa e um clima leve pra começar.</li>
          <li><span class="st">2</span><b>Mão na massa</b> — com orientação o tempo todo, cada uma modela a sua peça.</li>
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
    <h2>Betc Havas <em>Café</em></h2>
    <p class="lead">Um café moderno e cheio de charme, com aquele clima gostoso pra turma criar junto. O cenário perfeito pra uma tarde criativa e memorável.</p>
    <div class="bfeat">
      <div class="bphoto"><img src="assets/betchavas2.jpg" alt="Interior moderno e acolhedor do Betc Havas Café" style="object-position:center 55%"></div>
      <div class="bbody">
        <span class="btag">Betc Havas Café · SP</span>
        <h3>Moderno, aconchegante e cheio de charme</h3>
        <p>Um espaço lindo pra receber o grupo, com a experiência montada só de vocês.</p>
        <div class="bnote">◆ No Betc, cada participante tem um <b>consumo mínimo de R$ 50</b> no café (bebidas e petiscos à escolha) — à parte do valor da experiência.</div>
      </div>
    </div>
    {foot("O espaço · Betc Havas Café")}
  </section>'''

planos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham o plano</span>
    <h2>O <em>investimento</em></h2>
    <p class="lead">Valor por pessoa, para a modelagem em cerâmica no Betc Havas Café. É só escolher o quão completo querem o encontro:</p>
    <div class="rule"></div>
    <div class="tiers">
      <div class="tier">
        <span class="tt">Plano 1</span>
        <h3>Essencial</h3><span class="sub">A experiência, pura.</span>
        <div class="tp">R$ 189</div><div class="tu">por pessoa</div>
        <ul>
          <li>A <b>experiência</b> de modelagem em cerâmica</li>
          <li>Todo o <b>material</b> e condução por profissional</li>
          <li>A peça pronta, pra cada uma <b>levar pra casa</b></li>
        </ul>
      </div>
      <div class="tier hl">
        <span class="ttag">Mais escolhido</span>
        <span class="tt">Plano 2</span>
        <h3>Premium</h3><span class="sub">Experiência + coffee break.</span>
        <div class="tp">R$ 279</div><div class="tu">por pessoa</div>
        <ul>
          <li>Tudo do <b>Essencial</b></li>
          <li><b>Coffee break</b> completo — salgados, doces e bebidas</li>
          <li>Mesa posta e <b>caprichada</b> pra vocês</li>
        </ul>
      </div>
      <div class="tier">
        <span class="tt">Plano 3</span>
        <h3>Completo</h3><span class="sub">Com tudo e personalizado.</span>
        <div class="tp">R$ 399</div><div class="tu">por pessoa</div>
        <ul>
          <li>Tudo do <b>Premium</b></li>
          <li><b>Decoração temática</b> do ambiente</li>
          <li><b>Lembrancinhas personalizadas</b> (escova &amp; piranha com a inicial)</li>
        </ul>
      </div>
    </div>
    <p class="fineprint">Valores por pessoa, para a experiência de modelagem em cerâmica no Betc Havas Café. Cada participante tem consumo mínimo de R$ 50 no café, à parte do valor da experiência. Reserva: 50% + 50% até 72h antes · Pix, cartão ou transferência (até 12x) · Duração de 2h a 3h. Data e horário sujeitos à confirmação e disponibilidade de agenda.</p>
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
    <p class="lead">Me confirma o plano e a data, que a gente reserva o Betc Havas Café e organiza cada detalhe pra deixar esse encontro especial. 🤍</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">1️⃣</div><h3>Escolham o plano</h3><p>Essencial, Premium ou Completo — me diz qual combina mais.</p></div>
      <div class="infocard"><div class="ico">2️⃣</div><h3>Reservamos</h3><p>Confirmando a data, a gente segura o Betc Havas pra vocês.</p></div>
      <div class="infocard"><div class="ico">3️⃣</div><h3>É só criar</h3><p>No dia, chega tudo pronto. A turma só coloca a mão na massa.</p></div>
    </div>
    <div class="quote">
      <i>Elarah · Experiências criativas</i><br>
      WhatsApp +55 (11) 91445-5930 &nbsp;·&nbsp; <strong>elarah.com.br</strong> &nbsp;·&nbsp; @elarah.oficial
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = '<div class="deck">\n' + cover + experiencia + espaco + planos + proximos + '\n\n</div>\n\n'
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-final-ceramica-betc.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
