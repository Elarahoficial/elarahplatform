# Proposta Elarah × Bar Fulero · Calendário de oficinas (1 experiência por semana, toda quarta 19h)
# Modelo: oficina + voucher de R$50 de consumo no bar; venda por link; repasse do voucher 48h antes.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

# ---- paleta Bar Fulero: verde + magenta ----
reps = {
    "--orange:#B08D4C;": "--orange:#C65A93;",
    "--orange-dark:#8A6D34;": "--orange-dark:#A23F76;",
    "--navy:#12362B;": "--navy:#2E4A3A;",
    "--navy-soft:#3A5A4E;": "--navy-soft:#52705E;",
    "--blue-accent:#B08D4C;": "--blue-accent:#C65A93;",
    "#EFF3EE": "#EEF3EC", "#DCE8E1": "#E2EDDF", "#CBB06E": "#E08CB8",
    "rgba(176,141,76,.24)": "rgba(198,90,147,.22)",
    "rgba(176,141,76,.26)": "rgba(198,90,147,.26)",
    "rgba(176,141,76,.10)": "rgba(198,90,147,.10)",
    "rgba(18,54,43,.16)": "rgba(46,74,58,.16)",
    "rgba(10,28,22,.86)": "rgba(28,40,32,.86)",
    "rgba(10,28,22,.85)": "rgba(28,40,32,.85)",
    "rgba(10,28,22,.82)": "rgba(28,40,32,.82)",
}
for a, b in reps.items():
    head = head.replace(a, b)

xcss = '''
  .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
  .infocard{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px 20px 20px;box-shadow:0 12px 30px -22px rgba(0,0,0,.28)}
  .infocard h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy);line-height:1.08;margin:8px 0 6px}
  .infocard p{font-size:12px;color:var(--muted);line-height:1.5;margin:0}
  .num{font-family:'DM Serif Display',serif;color:var(--orange);font-size:26px;line-height:1}
  .ofgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}
  .exp{position:relative;background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;box-shadow:0 16px 34px -22px rgba(0,0,0,.32)}
  .exp .ephoto{flex:0 0 40%;overflow:hidden;background:#eee}
  .exp .ephoto img{width:100%;height:100%;object-fit:cover;display:block}
  .exp .ebody{padding:15px 18px 16px;display:flex;flex-direction:column;flex:1}
  .exp .en{display:inline-block;font-size:9px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:4px}
  .exp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:19px;color:var(--navy);line-height:1.06}
  .exp p{font-size:10.5px;color:var(--muted);margin-top:7px;line-height:1.4}
  .exp .from{margin-top:auto;padding-top:10px;font-size:13px;color:var(--navy);font-weight:700;line-height:1.15}
  .exp .from b{font-family:'DM Serif Display',serif;font-weight:400;font-size:20px;color:var(--orange-dark)}
  .exp .from small{display:block;font-family:-apple-system,sans-serif;font-size:9.5px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-top:3px}
  .priceband{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;background:var(--navy);color:#fff;border-radius:16px;padding:16px 26px;margin-top:16px}
  .priceband .pl{display:block;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange);font-weight:700}
  .priceband .pv{font-family:'DM Serif Display',serif;font-size:26px;line-height:1.1;margin-top:3px}
  .priceband .side{font-size:12px;color:rgba(255,255,255,.85);line-height:1.5;text-align:right}
</style>'''
head = head.replace("</style>", xcss, 1)


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


PROOF = "Já realizado para times como <b>Compass</b>, <b>Natura</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)"

cover = f'''
  <section class="slide">
{head_block("Calendário de oficinas · Set / Out", "Bar", "Fulero", "com a Elarah")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Uma experiência por semana · toda quarta</span>
        <h1>O bar vira <em>ateliê</em> toda quarta</h1>
        <p class="lead">Um calendário de oficinas presenciais no <strong>Bar Fulero</strong>, conduzidas pela Elarah. Cada pessoa cria algo com as próprias mãos, leva pra casa — e ainda ganha um <strong>voucher de R$ 50</strong> pra gastar no bar. Mais movimento nas quartas, mais consumo na casa. 🍸</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>4 oficinas</b> · Set / Out</span>
          <span class="chip">Toda <b>quarta · 19h</b></span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip">Vagas limitadas</span>
          <span class="chip"><b>+ R$ 50</b> de consumo inclusos</span>
        </div>
      </div>
      <div class="cover-photo">{img("drinkspetisco.jpg", "Drinks e petiscos numa mesa do bar", "center 50%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Bar Fulero × Elarah")}
  </section>'''

como = f'''
  <section class="slide">
{head_simple("Como funciona")}
    <span class="eyebrow orange">◆ A parceria</span>
    <h2>Uma oficina por semana, <em>e a gente cuida de tudo</em></h2>
    <p class="lead">A ideia é simples: toda quarta, uma experiência criativa dentro do Bar Fulero — pra encher a casa num dia mais parado e transformar o bar num ponto de encontro criativo.</p>
    <div class="grid3">
      <div class="infocard"><span class="num">01</span><h3>Uma experiência por semana</h3><p>Toda quarta, às 19h, uma oficina presencial no bar, conduzida pela Lara e pela equipe Elarah.</p></div>
      <div class="infocard"><span class="num">02</span><h3>Calendário todo mês</h3><p>Na última semana de cada mês, a gente monta o calendário do mês seguinte e envia pra vocês já divulgarem e venderem.</p></div>
      <div class="infocard"><span class="num">03</span><h3>A Elarah cuida de tudo</h3><p>Kits, materiais, condução e produção. Vocês recebem o pessoal e ativam o bar — sem trabalho extra pra equipe.</p></div>
    </div>
    <div class="bnote" style="margin-top:16px">◆ <b>Bônus: consumo na casa.</b> Cada ingresso já inclui um <b>voucher de R$ 50</b> pra gastar no Bar Fulero — o 1º drink (cerveja ou caipirinha) sai por conta desse voucher. A experiência aquece a quarta e ainda gira consumo dentro do bar.</div>
    {foot("Como funciona")}
  </section>'''

calendario = f'''
  <section class="slide">
{head_simple("O calendário")}
    <span class="eyebrow orange">◆ Setembro / Outubro</span>
    <h2>As oficinas <em>de estreia</em></h2>
    <p class="lead">Quatro oficinas pra abrir o calendário — cada uma com kit completo, condução guiada e o voucher de R$ 50 de consumo já incluso. 🍸</p>
    <div class="ofgrid">
      <div class="exp">
        <div class="ephoto">{img("pinturapratoceramica.jpg", "Petisqueira de cerâmica pintada à mão", "center 50%")}</div>
        <div class="ebody">
          <span class="en">30/09 · Quarta · 19h</span>
          <h3>Petisqueira Cerâmica Fria</h3>
          <p>Kit: cerâmica fria 500g · 2 pincéis · 6 cores · lixas · bucha · máscara · verniz.</p>
          <span class="from"><b>R$ 189</b> + R$ 50<small>voucher · 1º drink + petisco</small></span>
        </div>
      </div>
      <div class="exp">
        <div class="ephoto">{img("pinturataca.jpg", "Pintura à mão em copos", "center 45%")}</div>
        <div class="ebody">
          <span class="en">07/10 · Quarta · 19h</span>
          <h3>Pintura: 2 Copos Americanos</h3>
          <p>Kit: 2 copos americanos · aventais · tintas especiais · pincéis · oficina guiada.</p>
          <span class="from"><b>R$ 195</b> + R$ 50<small>voucher · 1ª bebida</small></span>
        </div>
      </div>
      <div class="exp">
        <div class="ephoto">{img("colagem.jpg", "Scrapbook e colagem sobre a mesa", "center 45%")}</div>
        <div class="ebody">
          <span class="en">14/10 · Quarta · 19h</span>
          <h3>Scrapbook: Tema Bar</h3>
          <p>Kit: caderno kraft A5 · adesivos temáticos · papelaria · apliques · 2h guiada.</p>
          <span class="from"><b>R$ 180</b> + R$ 50<small>voucher · 1º drink + petisco</small></span>
        </div>
      </div>
      <div class="exp">
        <div class="ephoto">{img("veladrink.jpg", "Velas aromáticas em copos martini", "center 50%")}</div>
        <div class="ebody">
          <span class="en">21/10 · Quarta · 19h</span>
          <h3>Vela Aromática: Copo Martini</h3>
          <p>Kit: 1 copo martini · essências aromáticas · 2h guiada.</p>
          <span class="from"><b>R$ 225</b> + R$ 50<small>voucher · 1ª bebida: um martini</small></span>
        </div>
      </div>
    </div>
    <div class="bnote" style="margin-top:14px">◆ Valores por pessoa: <b>oficina + R$ 50 de voucher</b> de consumo no bar. Kits e condução por conta da Elarah.</div>
    {foot("O calendário")}
  </section>'''

venda = f'''
  <section class="slide">
{head_simple("A venda & o repasse")}
    <span class="eyebrow orange">◆ Simples e organizado</span>
    <h2>Vende pelo link, <em>o bar só aproveita</em></h2>
    <p class="lead">A gente organiza a venda e a produção do começo ao fim — o bar entra pra receber o pessoal e girar consumo.</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><span class="num">01</span><h3>Compra 100% pelo link</h3><p>Todo mundo garante a vaga online, com antecedência. Vocês só divulgam o link.</p></div>
      <div class="infocard"><span class="num">02</span><h3>Repasse do voucher</h3><p>A Elarah repassa os <b>R$ 50 de consumo por pessoa</b> pro bar até 48h antes de cada oficina.</p></div>
      <div class="infocard"><span class="num">03</span><h3>Vagas limitadas</h3><p>Cada oficina tem lugares limitados — o suficiente pra lotar a quarta e manter a experiência boa.</p></div>
    </div>
    <div class="quote">
      <strong style="font-family:'DM Serif Display',serif;font-weight:400;font-size:22px;color:var(--navy);display:block;margin-bottom:8px">Bora encher a casa toda quarta? ✦</strong>
      A gente monta o calendário do mês, divulga junto e cuida de toda a produção. É só combinar o começo.<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; @atelieflordeartebarfulero
    </div>
    <p class="fineprint">Proposta de parceria recorrente entre a Elarah e o Bar Fulero — uma oficina presencial por semana (às quartas, 19h), com calendário mensal montado pela Elarah e enviado ao bar na última semana do mês anterior para divulgação e venda. Valores por pessoa: Petisqueira Cerâmica Fria R$ 189, Pintura 2 Copos Americanos R$ 195, Scrapbook Tema Bar R$ 180 e Vela Aromática Copo Martini R$ 225, sempre acrescidos de um voucher de R$ 50 de consumo no bar (1ª bebida por conta do voucher). Kits, materiais e condução inclusos e por conta da Elarah. Venda 100% por link; a Elarah repassa ao Bar Fulero os R$ 50 de voucher por participante até 48h antes de cada oficina. Vagas limitadas; datas e oficinas sujeitas a confirmação e disponibilidade de agenda.</p>
    {foot("A venda & o repasse")}
  </section>'''

deck = '<div class="deck">\n' + cover + como + calendario + venda + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/experiencia-calendario-bar-fulero.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
