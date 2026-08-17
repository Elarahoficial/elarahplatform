# AWS (Amazon) · Experiência gastronômica no Farol Santander (Cozinha do 31) · 20 pax.
# Base Accademia R$ 16.200 + 20% (parte Elarah) = R$ 19.440. Slots de foto pra Elarah preencher.
# Paleta espresso + cobre (gastronômico, premium).
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
base = open(S + "/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

# ---- recolor: espresso + cobre (gastronômico, premium) ----
head = head.replace("--orange:#F27623;", "--orange:#B07A46;")
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#8A5D34;")
head = head.replace("--navy:#16233C;", "--navy:#2A2320;")
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#6A5C52;")
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#B07A46;")
head = head.replace("#EDF1F7", "#F6F0E9").replace("#DCE5F1", "#EBDFD1")
head = head.replace("#FF9A4D", "#D0A876")
head = head.replace("rgba(242,118,35,.22)", "rgba(176,122,70,.26)")

extra = '''
  /* slot de foto (Elarah preenche) */
  .pslot{border:2px dashed var(--orange);border-radius:16px;background:rgba(176,122,70,.07);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:7px;padding:22px;height:100%;box-sizing:border-box}
  .pslot .pi{font-size:27px;line-height:1}
  .pslot .pl{font-family:'DM Serif Display',serif;font-size:17px;color:var(--navy);line-height:1.1}
  .pslot .ps{font-size:10.5px;color:var(--muted);font-weight:600;letter-spacing:.03em;text-transform:uppercase}
  .pgrid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:16px}
  .pgrid .cell{min-height:290px}
  /* cardápio (3 cozinhas) */
  .menu{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:14px}
  .cz{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px 18px 20px;display:flex;flex-direction:column;box-shadow:0 14px 32px -22px rgba(0,0,0,.28)}
  .cz .czt{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:4px}
  .cz h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:21px;color:var(--navy);line-height:1;margin-bottom:11px}
  .cz .row{padding:8px 0;border-top:1px solid var(--line)}
  .cz .row .rl{display:block;font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--orange-dark);font-weight:700;margin-bottom:2px}
  .cz .row p{font-size:11.5px;color:var(--ink);line-height:1.34}
  .cz .more{margin-top:auto;padding-top:12px;font-size:10.5px;color:var(--muted);font-style:italic}
  /* incluso (checklist) */
  .incl{display:grid;grid-template-columns:1fr 1fr;gap:9px 26px;margin-top:16px}
  .incl li{list-style:none;position:relative;padding-left:24px;font-size:12.5px;color:var(--ink);line-height:1.4}
  .incl li::before{content:"✦";position:absolute;left:0;top:1px;color:var(--orange);font-size:12px}
  .incl li b{font-weight:700;color:var(--navy)}
  /* investimento hero */
  .pcard{margin-top:16px;background:var(--navy);color:#fff;border-radius:20px;padding:34px 40px;display:flex;align-items:center;justify-content:space-between;gap:30px;flex-wrap:wrap}
  .pcard .pl .lbl{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--orange);font-weight:700}
  .pcard .pl h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:30px;line-height:1.08;margin-top:8px}
  .pcard .pl p{font-size:12px;color:rgba(255,255,255,.72);margin-top:8px;max-width:340px;line-height:1.5}
  .pcard .pr{text-align:right}
  .pcard .pr .big{font-family:'DM Serif Display',serif;font-size:52px;line-height:1}
  .pcard .pr .u{display:block;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.7);font-weight:600;margin-top:6px}
  .pcard .pr .pp{display:block;font-size:12.5px;color:var(--orange);font-weight:700;margin-top:8px}
  .fineprint{font-size:10px;color:var(--muted);line-height:1.5;margin-top:16px}
  .cllogo{height:26px;width:auto;display:block}
</style>'''
head = head.replace("</style>", extra, 1)

# ---- PDF: sombras borradas viram bloco cinza em leitores iOS — troca por bordas ----
head = head.replace(
    "    @page{size:A4 portrait;margin:0}",
    "    .slide *{box-shadow:none !important}\n"
    "    .cz{border:1px solid var(--line)}\n"
    "    .pgrid{grid-template-columns:1fr 1fr}\n"
    "    .menu{grid-template-columns:repeat(3,1fr)}\n"
    "    .incl{grid-template-columns:1fr 1fr}\n"
    "    @page{size:A4 portrait;margin:0}", 1)
head = head.replace(".plans{grid-template-columns:1fr}",
                    ".plans{grid-template-columns:1fr}\n    .menu{grid-template-columns:1fr}\n    .pgrid{grid-template-columns:1fr}\n    .incl{grid-template-columns:1fr}")


def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'

def pslot(label, sub):
    return f'<div class="pslot"><span class="pi">＋ 📷</span><span class="pl">{label}</span><span class="ps">{sub}</span></div>'


cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right">
        <span class="kicker">Proposta de experiência gastronômica para</span>
        <span class="cbbrand" style="font-family:'DM Serif Display',serif;font-size:20px;color:var(--navy);line-height:1;display:block;margin-top:3px">AWS · Amazon</span>
        <span class="cbsub" style="font-size:8.5px;letter-spacing:.26em;color:var(--navy-soft);font-weight:600;text-transform:uppercase">Experiência anual · time</span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência gastronômica · Farol Santander</span>
        <h1>Um dia no<br><em>Farol Santander</em></h1>
        <p class="lead">Uma experiência criativa e saborosa pro time: explorar o <strong>Farol Santander</strong>, colocar a mão na massa numa <strong>aula gastronômica com chef</strong> na icônica Cozinha do 31, degustar cada criação e fechar com um drink no lendário <strong>Bar do Cofre</strong>. 🍽️</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>20 pessoas</b></span>
          <span class="chip"><b>3h</b> de experiência</span>
          <span class="chip"><b>Farol Santander</b> · SP</span>
        </div>
      </div>
      <div class="cover-photo">{pslot("Farol Santander", "Foto do prédio / vista")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Experiências já realizadas para times como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)</div>
    {foot("Experiência Gastronômica · AWS")}
  </section>'''

roteiro = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O roteiro</span></div>
    </div>
    <span class="eyebrow orange">◆ Como funciona o dia</span>
    <h2>Uma jornada <em>completa</em></h2>
    <p class="lead">Do aperitivo de boas-vindas ao brinde final, tudo pensado pra ser leve, gostoso e memorável — conduzido por um Chef, com a nossa equipe cuidando de cada detalhe.</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">🥂</div><h3>Recepção</h3><p>Chegada e aperitivo de boas-vindas, num ambiente descontraído só do time.</p></div>
      <div class="infocard"><div class="ico">🍳</div><h3>Aula com Chef</h3><p>Mão na massa: uma atividade gastronômica divertida conduzida por um Chef.</p></div>
      <div class="infocard"><div class="ico">🍽️</div><h3>Degustação</h3><p>Todos provam as próprias criações — entrada, prato principal e sobremesa.</p></div>
      <div class="infocard"><div class="ico">🗼</div><h3>Farol Santander</h3><p>Visitação ao Farol pra explorar um dos cartões-postais de São Paulo.</p></div>
      <div class="infocard"><div class="ico">🍸</div><h3>Bar do Cofre</h3><p>Voucher para o primeiro drink no icônico Bar do Cofre.</p></div>
      <div class="infocard"><div class="ico">🎁</div><h3>Mimos</h3><p>Avental com logo, receitas digitais e brinde de limoncello pra levar.</p></div>
    </div>
    {foot("O roteiro")}
  </section>'''

farol = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Etapa · Farol Santander</span></div>
    </div>
    <span class="eyebrow orange">◆ O cenário</span>
    <h2>O icônico <em>Farol Santander</em></h2>
    <p class="lead">Um dos endereços mais lindos de São Paulo: o time explora o Farol Santander e ainda brinda no lendário Bar do Cofre — cenário perfeito pra uma experiência que vira foto e história.</p>
    <div class="pgrid">
      <div class="cell">{pslot("Farol Santander", "Foto do prédio / mirante")}</div>
      <div class="cell">{pslot("Bar do Cofre", "Foto do bar / drink")}</div>
    </div>
    {foot("Etapa · Farol Santander")}
  </section>'''

gastro = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Etapa · A aula gastronômica</span></div>
    </div>
    <span class="eyebrow orange">◆ Mão na massa</span>
    <h2>Uma aula com <em>Chef</em></h2>
    <p class="lead">Na Cozinha do 31, o time coloca a mão na massa numa atividade gastronômica divertida, guiada por um Chef e com assistente e copeira cuidando de tudo. No fim, todos degustam o que prepararam. 👩‍🍳</p>
    <div class="pgrid">
      <div class="cell">{pslot("A comida", "Foto dos pratos / degustação")}</div>
      <div class="cell">{pslot("Mão na massa", "Foto da equipe cozinhando")}</div>
    </div>
    {foot("Etapa · A aula gastronômica")}
  </section>'''

cardapio = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O cardápio</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham a cozinha</span>
    <h2>Três <em>cozinhas</em> autorais</h2>
    <p class="lead">O menu é entrada, prato principal e sobremesa — com três opções por cozinha pra escolher. Uma degustação abaixo; o cardápio pode ser adaptado ao gosto do time.</p>
    <div class="menu">
      <div class="cz"><span class="czt">Cozinha 01</span><h3>Brasileira</h3>
        <div class="row"><span class="rl">Entrada</span><p>Cuscuz paulista de palmito</p></div>
        <div class="row"><span class="rl">Principal</span><p>Bobó de frango com arroz de coco</p></div>
        <div class="row"><span class="rl">Sobremesa</span><p>Manezinho Araújo — banana caramelizada</p></div>
        <span class="more">+ 3 opções de menu</span></div>
      <div class="cz"><span class="czt">Cozinha 02</span><h3>Italiana</h3>
        <div class="row"><span class="rl">Entrada</span><p>Gnocchi alla romana gratinado</p></div>
        <div class="row"><span class="rl">Principal</span><p>Risotto — três opções à escolha</p></div>
        <div class="row"><span class="rl">Sobremesa</span><p>Torta de ricota e nozes com mel</p></div>
        <span class="more">+ 3 opções de menu</span></div>
      <div class="cz"><span class="czt">Cozinha 03</span><h3>Francesa</h3>
        <div class="row"><span class="rl">Entrada</span><p>Crème brûlée de queijo</p></div>
        <div class="row"><span class="rl">Principal</span><p>Coq au vin com mousseline de batatas</p></div>
        <div class="row"><span class="rl">Sobremesa</span><p>Crepe Suzette</p></div>
        <span class="more">+ 3 opções de menu</span></div>
    </div>
    {foot("O cardápio")}
  </section>'''

incluso = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O que está incluso</span></div>
    </div>
    <span class="eyebrow orange">◆ Tudo pronto pro time</span>
    <h2>O que está <em>incluso</em></h2>
    <p class="lead">Uma experiência completa, chave na mão — a nossa equipe cuida de cada detalhe pra vocês só aproveitarem.</p>
    <div class="rule"></div>
    <ul class="incl">
      <li><b>Aula gastronômica</b> com Chef da Accademia</li>
      <li>Entrada, prato principal e <b>sobremesa</b></li>
      <li>Aperitivo de <b>boas-vindas</b></li>
      <li>Café, refrigerante, água e suco</li>
      <li>Ingredientes, preparo e <b>degustação</b> ao final</li>
      <li>Assistente de chef e copeira</li>
      <li>Uso do <b>espaço</b> (Cozinha do 31) e utensílios</li>
      <li>Receitas dos pratos em <b>formato digital</b></li>
      <li>Brinde com <b>limoncello</b> (degustação)</li>
      <li>20 <b>aventais</b> personalizados</li>
      <li><b>Visitação no Farol Santander</b></li>
      <li>Voucher do 1º drink no <b>Bar do Cofre</b></li>
    </ul>
    <p class="fineprint">Experiência de 3h para 20 participantes, incluindo período de montagem e desmontagem do espaço. Itens extras (recepcionista, personalização de aventais, vinhos especiais, brindes exclusivos) sob consulta.</p>
    {foot("O que está incluso")}
  </section>'''

invest = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Uma experiência <em>completa</em></h2>
    <p class="lead">Valor total da experiência no Farol Santander (Cozinha do 31), para 20 participantes, com tudo o que foi descrito incluso — atividade, degustação, visitação e estrutura.</p>
    <div class="pcard">
      <div class="pl">
        <span class="lbl">Experiência gastronômica · Farol Santander</span>
        <h3>Evento completo · 3h<br>20 participantes</h3>
        <p>Aula com chef, degustação, visitação ao Farol, drink no Bar do Cofre e todos os mimos inclusos.</p>
      </div>
      <div class="pr">
        <span class="big">R$ 19.440</span>
        <span class="u">valor total do evento</span>
        <span class="pp">R$ 972 por pessoa</span>
      </div>
    </div>
    <p class="fineprint">Valor total para 20 participantes, evento de 3h no Farol Santander. Inclui atividade gastronômica com chef, degustação, aperitivo, bebidas não alcoólicas, uso do espaço, utensílios, aventais personalizados, receitas digitais, brinde de limoncello, visitação ao Farol Santander e voucher do primeiro drink no Bar do Cofre. Participantes extras, horas adicionais e bebidas alcoólicas não previstas são cobrados à parte. Data e horário sujeitos à disponibilidade no ato da confirmação. Proposta válida mediante confirmação e disponibilidade de agenda.</p>
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
    <p class="lead">Me confirma a data e a cozinha (Brasileira, Italiana ou Francesa) que a gente reserva o Farol Santander e organiza cada detalhe pro time. Qualquer dúvida, é só chamar. 🍽️</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">1️⃣</div><h3>Escolham</h3><p>A data, a cozinha e o número final de participantes.</p></div>
      <div class="infocard"><div class="ico">2️⃣</div><h3>Reservamos</h3><p>A gente segura o Farol Santander e alinha o cardápio.</p></div>
      <div class="infocard"><div class="ico">3️⃣</div><h3>É só viver</h3><p>No dia, chega tudo pronto. O time só cria e aproveita.</p></div>
    </div>
    <div class="quote">
      <i>Elarah · Experiências criativas</i><br>
      contato@elarah.com.br &nbsp;·&nbsp; <strong>elarah.com.br</strong> &nbsp;·&nbsp; @elarah
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = '<div class="deck">\n' + cover + roteiro + farol + gastro + cardapio + incluso + invest + proximos + '\n\n</div>\n\n'
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-aws-farol-gastronomia.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
