# Aniversário Mara · Vela/Pintura em taça/Cerâmica + Harmonização queijo&vinho · 15 pessoas · junho/2027. 2 espaços. Bordô palette.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

fonts = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/embedded_fonts_style.html", encoding="utf-8").read()
head = re.sub(r'<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>',
              fonts, head, count=1, flags=re.S)

# ---- recolor: bordô / vinho (drinks, sofisticado) ----
head = head.replace("--orange:#F27623;", "--orange:#9E4B57;")
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#7A3340;")
head = head.replace("--navy:#16233C;", "--navy:#331E24;")
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#6E555A;")
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#9E4B57;")
head = head.replace("#EDF1F7", "#F7EEEF").replace("#DCE5F1", "#EDD8DC")
head = head.replace("#FF9A4D", "#C98A93")
head = head.replace("rgba(242,118,35,.22)", "rgba(158,75,87,.28)")

extra = '''
  .menu{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:12px}
  .exp{position:relative;width:calc(33.333% - 11px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .exp .top{position:absolute;top:11px;left:11px;z-index:3;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 11px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(122,51,64,.4)}
  .exp-photo{aspect-ratio:1/1;overflow:hidden;background:#eee}
  .exp-photo img{width:100%;height:100%;object-fit:cover}
  .exp-body{padding:12px 15px 15px}
  .exp .n{display:inline-block;font-size:9px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:5px}
  .exp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--navy);line-height:1.05}
  .exp p{font-size:11px;color:var(--muted);margin-top:5px;line-height:1.38}
  .infocard .ico svg{width:30px;height:30px;display:block}
  .vtitle{font-family:'DM Serif Display',serif;font-weight:400;font-size:20px;color:var(--navy);margin-top:20px;display:flex;align-items:baseline;flex-wrap:wrap;gap:9px}
  .vtitle span{font-family:'DM Sans';font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--orange)}
  .itable{width:100%;border-collapse:collapse;margin-top:9px;font-family:'DM Sans'}
  .itable th,.itable td{padding:12px 10px;border-bottom:1px solid var(--line);text-align:center;vertical-align:middle}
  .itable thead th{font-size:11.5px;color:var(--navy);font-weight:700;border-bottom:2px solid var(--navy);text-transform:uppercase;letter-spacing:.03em}
  .itable thead th span{display:block;font-size:9px;font-weight:500;color:var(--muted);letter-spacing:.01em;margin-top:4px;text-transform:none}
  .itable td.rl{text-align:left;width:34%}
  .itable td.rl b{font-family:'DM Serif Display',serif;font-weight:400;font-size:16px;color:var(--navy)}
  .itable td.rl span{display:block;font-size:10px;color:var(--muted);margin-top:3px;line-height:1.4}
  .itable .val{font-family:'DM Serif Display',serif;font-size:24px;color:var(--navy);line-height:1;white-space:nowrap}
  .itable .hl{background:#F3E2E5}
  .itable thead th.hl{color:var(--orange-dark)}
  .itable tbody tr:last-child td{border-bottom:none}
  .itable .pill{display:inline-block;background:var(--navy);color:#fff;font-size:8px;letter-spacing:.08em;padding:3px 9px;border-radius:999px;margin-bottom:6px;font-weight:700;text-transform:uppercase}
  .bfeat{display:flex;margin-top:16px;background:var(--card);border:1.6px solid var(--orange);border-radius:18px;overflow:hidden;box-shadow:0 18px 42px -24px rgba(0,0,0,.34)}
  .bfeat.plain{border:1px solid var(--line)}
  .bfeat .bphoto{width:40%;overflow:hidden;background:#eee}
  .bfeat .bphoto img{width:100%;height:100%;object-fit:cover;display:block}
  .bfeat .bphoto.ph{display:flex;align-items:center;justify-content:center;background:#F3E2E5;border-right:1.4px dashed var(--orange)}
  .bfeat .bphoto.ph span{font-size:12px;color:var(--orange-dark);font-weight:600;text-align:center;line-height:1.5;padding:0 18px}
  .bfeat .bbody{flex:1;padding:20px 26px 22px;display:flex;flex-direction:column;justify-content:center}
  .bfeat .btag{align-self:flex-start;background:var(--navy);color:#fff;font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:6px 13px;border-radius:999px;margin-bottom:11px}
  .bfeat .btag.soft{background:var(--orange)}
  .bfeat h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:23px;color:var(--navy);line-height:1.02}
  .bfeat .sub{display:inline-block;font-size:10px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-top:5px}
  .bfeat p{font-size:12px;color:var(--muted);margin-top:9px;line-height:1.45}
  .dchips{display:flex;flex-wrap:wrap;gap:8px;margin-top:13px}
  .dchips span{background:#F3E2E5;border:1px solid var(--line);border-radius:999px;padding:6px 13px;font-size:11.5px;color:var(--navy);font-weight:600}
</style>'''
head = head.replace("</style>", extra, 1)
head = head.replace(".menu-cols{grid-template-columns:1fr 1fr}",
                    ".menu-cols{grid-template-columns:1fr 1fr}\n    .bfeat{flex-direction:row}\n    .bfeat .bphoto{width:40%;height:auto}\n    .bfeat .bbody{padding:16px 22px 17px}\n    .bfeat h3{font-size:20px}\n    .bfeat p{font-size:11px;margin-top:7px}\n    .dchips{margin-top:10px;gap:7px}\n    .dchips span{font-size:11px;padding:5px 11px}")
head = head.replace(".plans{grid-template-columns:1fr}",
                    ".plans{grid-template-columns:1fr}\n    .bfeat{flex-direction:column}\n    .bfeat .bphoto{width:100%;height:200px}\n    .bfeat .bphoto.ph{height:140px}")

def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'

def exp(n, img, name, desc, alt, pos="center 50%", top=None):
    tb = f'<span class="top">{top}</span>' if top else ''
    return f'<div class="exp">{tb}<div class="exp-photo"><img src="assets/{img}" alt="{alt}" style="object-position:{pos}"></div><div class="exp-body"><span class="n">{n}</span><h3>{name}</h3><p>{desc}</p></div></div>'

cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right">
        <span class="kicker">Proposta de aniversário</span>
        <span class="compass">Aniversário <span>Elarah</span><small>Criar &amp; brindar</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Aniversário · Experiência criativa &amp; drinks</span>
        <h1>Criar, brindar<br>e <em>celebrar</em></h1>
        <p class="lead">Um aniversário do jeitinho que você imaginou: <strong>coisinhas manuais, bonitas e cheirosas</strong> pra cada uma criar e levar pra casa, com aquele clima gostoso de <strong>drinks</strong> e boas conversas. 🥂</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>~15</b> pessoas</span>
          <span class="chip"><b>Junho</b> · 2027</span>
          <span class="chip">Em <b>espaço parceiro</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/hidrateimeninas.jpg" alt="Amigas felizes criando juntas numa experiência da Elarah" style="object-position:center 22%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Já realizado para times como <b>Compass</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)</div>
    {foot("Aniversário · Criar &amp; brindar")}
  </section>'''

workshops = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">As experiências</span></div>
    </div>
    <span class="eyebrow orange">◆ Coisinhas manuais &amp; cheirosas</span>
    <h2>Escolham a <em>favorita</em></h2>
    <p class="lead">Três experiências criativas lindas pra escolher — todas <strong>pelo mesmo valor por pessoa</strong>. É só decidir a que mais combina com a turma (ou combinar em estações). Cada uma cria e leva a própria peça pra casa. 🎨</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","velaaromatica.jpg","Vela aromática","Cada uma escolhe o aroma que ama e cria a própria vela. Cheirosa e cheia de charme.","Vela aromática artesanal","center 50%")}
      {exp("02","pinturatacanova.jpg","Pintura em taça","Personalizar a própria taça — linda pra brindar e levar de recordação.","Taça de vidro pintada à mão com flores","center 50%")}
      {exp("03","ceramicamodelagem.jpg","Cerâmica","Modelar a argila à mão e criar uma peça única — relaxante e sensorial.","Mãos modelando uma peça de cerâmica","center 50%")}
    </div>
    <div class="note" style="margin-top:14px">◆ As três têm o <b>mesmo valor por pessoa</b> — a escolha é da turma. Cada uma leva a própria criação de recordação. 🎨</div>
    {foot("As experiências")}
  </section>'''

harmoniza = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Opção especial · drinks</span></div>
    </div>
    <span class="eyebrow orange">◆ Pra somar mais brinde à festa</span>
    <h2>Harmonização de <em>queijos &amp; vinhos</em></h2>
    <p class="lead">Uma opção deliciosa pra quem ama <strong>drinks e boas conversas</strong>: uma degustação guiada de queijos e vinhos, aprendendo a harmonizar cada combinação — com muito brinde e clima de comemoração. 🍷</p>
    <div class="rule"></div>
    <div class="bfeat" style="height:240px">
      <div class="bphoto ph"><span>✎ foto de queijos &amp; vinhos<br>(me envie a sua!)</span></div>
      <div class="bbody">
        <span class="btag">Opção especial</span>
        <h3>Degustação guiada <span class="sub">queijos &amp; vinhos</span></h3>
        <p>Um sommelier conduz a harmonização, apresentando os pares de queijos e vinhos num clima leve e cheio de brinde. Perfeita como experiência principal ou pra somar à criativa. 🧀🍷</p>
        <div class="dchips">
          <span>A partir de R$ 239</span>
          <span>Completo R$ 399 · foto + lembrancinha</span>
        </div>
      </div>
    </div>
    {foot("Harmonização de queijos &amp; vinhos")}
  </section>'''

espacos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Onde acontece</span></div>
    </div>
    <span class="eyebrow orange">◆ Duas opções de espaço</span>
    <h2>Escolha o <em>cenário</em></h2>
    <p class="lead">Dois espaços parceiros lindos, cada um com seu clima — a cafeteria charmosa ou o estúdio só de vocês. É só escolher qual combina mais com a comemoração. 🥂</p>
    <div class="rule"></div>
    <div class="bfeat plain" style="height:210px">
      <div class="bphoto"><img src="assets/betchavas2.jpg" alt="Interior moderno e aconchegante do Betc Havas Café" style="object-position:center 55%"></div>
      <div class="bbody">
        <span class="btag soft">Opção 1 · a partir de R$ 199</span>
        <h3>Betc Havas Café <span class="sub">café &amp; lounge criativo</span></h3>
        <p>Um café moderno e cheio de charme, com madeira, arte nas paredes e clima gostoso de ficar. A experiência acontece lá, com comida à parte conforme o combo escolhido. ☕</p>
      </div>
    </div>
    <div class="bfeat" style="margin-top:15px;height:210px">
      <div class="bphoto"><img src="assets/espaco1.jpg" alt="Lounge acolhedor do Bake Studio na Bela Vista" style="object-position:center 55%"></div>
      <div class="bbody">
        <span class="btag">★ Opção 2 · a partir de R$ 279</span>
        <h3>Bake Studio <span class="sub">Bela Vista · cozinha &amp; sala</span></h3>
        <p>Um estúdio charmoso com <b>cozinha e sala</b>, só de vocês — com liberdade pra decorar do jeito que quiserem. Espaço exclusivo e reservado, do começo ao fim. 🌿</p>
      </div>
    </div>
    {foot("Onde acontece")}
  </section>'''

planos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Escolha o seu <em>combo</em></h2>
    <p class="lead">Valores por pessoa, com material e condução inclusos — e cada uma sempre leva a própria criação. As experiências manuais têm o mesmo valor; a harmonização é uma opção à parte. 🥂</p>
    <div class="rule"></div>

    <div class="vtitle">Experiências manuais · Betc Havas Café <span>vela · pintura em taça · cerâmica</span></div>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th>A experiência<span>material & condução</span></th>
        <th>Com foto &amp; voucher<span>+ foto profissional &amp; R$ 30 de voucher</span></th>
        <th class="hl"><span class="pill">★ Completo</span><br>Completo<span>+ lembrancinha</span></th>
      </tr></thead>
      <tbody><tr>
        <td class="rl"><b>No Betc Havas Café</b><span>comida à parte</span></td>
        <td class="val">R$ 199</td><td class="val">R$ 299</td><td class="val hl">R$ 399</td>
      </tr></tbody>
    </table>

    <div class="vtitle">Experiências manuais · Bake Studio <span>espaço exclusivo · cozinha &amp; sala</span></div>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th>A experiência<span>+ espaço exclusivo</span></th>
        <th class="hl"><span class="pill">★ Completo</span><br>Completo<span>+ foto profissional &amp; lembrancinha</span></th>
      </tr></thead>
      <tbody><tr>
        <td class="rl"><b>No Bake Studio</b><span>só de vocês, com liberdade pra decorar</span></td>
        <td class="val">R$ 279</td><td class="val hl">R$ 499</td>
      </tr></tbody>
    </table>

    <div class="vtitle">Harmonização de queijos &amp; vinhos <span>opção à parte</span></div>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th>A experiência<span>degustação guiada</span></th>
        <th class="hl"><span class="pill">★ Completo</span><br>Completo<span>+ foto profissional &amp; lembrancinha</span></th>
      </tr></thead>
      <tbody><tr>
        <td class="rl"><b>Queijos &amp; vinhos</b><span>degustação conduzida por sommelier</span></td>
        <td class="val">R$ 239</td><td class="val hl">R$ 399</td>
      </tr></tbody>
    </table>
    {foot("Investimento")}
  </section>'''

personaliza = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Extras opcionais</span></div>
    </div>
    <span class="eyebrow orange">◆ Se quiserem deixar ainda mais completo</span>
    <h2>Dois <em>mimos</em> a mais</h2>
    <p class="lead">Dois extras opcionais que deixam o aniversário ainda mais marcante — o registro profissional com voucher e a lembrancinha personalizada pra cada convidada.</p>
    <div class="rule"></div>
    <div class="plans">
      <div class="plan">
        <div class="plan-photo sq"><img src="assets/rockworld1.jpg" alt="Aniversário registrado por um fotógrafo" style="object-position:center 30%"></div>
        <div class="plan-body">
          <h3>Foto profissional &amp; voucher</h3>
          <span class="tag basic">Nível Com foto · R$ 299</span>
          <ul class="feat">
            <li>Um fotógrafo cobre a festa inteira</li>
            <li>Cada risada e cada criação registradas</li>
            <li><b>R$ 30 de voucher</b> de consumo por pessoa (no Betc)</li>
          </ul>
          <span class="allin">Memória (e um mimo) pra levar</span>
        </div>
      </div>
      <div class="plan featured">
        <div class="plan-photo sq"><img src="assets/personaliza%C3%A7aobrindeescovapiranha.jpg" alt="Kit de lembrancinha personalizada com escova e piranha" style="object-position:center"></div>
        <div class="plan-body">
          <h3>Lembrancinha personalizada</h3>
          <span class="tag premium">★ Nível Completo</span>
          <ul class="feat">
            <li>Kit com <b>escova &amp; piranha</b> pra cada convidada</li>
            <li>Personalizado com o nome de cada uma</li>
            <li>Um mimo pra levarem da festa pra casa</li>
          </ul>
          <span class="allin">Cada uma leva o seu mimo</span>
        </div>
      </div>
    </div>
    {foot("Extras opcionais")}
  </section>'''

como = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Como funciona &amp; contato</span></div>
    </div>
    <span class="eyebrow orange">◆ Simples e sob medida</span>
    <h2>É só <em>reunir as amigas</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pra a festa ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Escolham a experiência</h3><p>Vela, pintura em taça, cerâmica ou a harmonização de queijos e vinhos — a gente leva tudo pronto.</p></div>
      <div class="step"><div class="num">2</div><h3>Escolham o espaço</h3><p>Betc Havas Café ou o Bake Studio exclusivo (cozinha e sala) — a gente reserva e organiza tudo.</p></div>
      <div class="step"><div class="num">3</div><h3>Criar, brindar &amp; levar</h3><p>No fim, todas levam pra casa a própria criação — uma lembrança linda do dia. 🥂</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Sob medida pro seu dia</h4>
        <p>A gente ajusta cada detalhe conforme o número de convidadas, a experiência e o clima que você quer pra festa. É só combinar. 🥂</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora <em>criar e brindar?</em> ✦</h2>
      <p>Me confirma a experiência e o espaço que você prefere, que a gente fecha tudo pro seu junho de 2027.</p>
      <div class="cta-actions">
        <a class="btn-wa" href="https://wa.me/5511914455930?text=Oi%2C%20Elarah!%20Vi%20a%20proposta%20do%20anivers%C3%A1rio%20e%20quero%20fechar%20os%20detalhes." target="_blank" rel="noopener">
          💬 Falar no WhatsApp
        </a>
        <div class="contact-links">
          <span>+55 (11) 91445-5930</span>
          <a href="https://instagram.com/elarah.oficial" target="_blank" rel="noopener">@elarah.oficial</a>
          <a href="https://elarah.com.br" target="_blank" rel="noopener">elarah.com.br</a>
        </div>
      </div>
    </div>
    <p class="fineprint">Proposta de aniversário da Elarah — experiência criativa à escolha (Vela aromática, Pintura em taça ou Cerâmica, pelo mesmo valor) ou Harmonização de queijos e vinhos, para cerca de 15 pessoas, em junho de 2027 (data a combinar), em espaço parceiro. Cada participante cria e leva a própria peça. Experiências manuais — Betc Havas Café (comida à parte): a partir de R$ 199 por pessoa (R$ 199 / 299 / 399: A experiência / + foto profissional e R$ 30 de voucher / Completo com lembrancinha); Bake Studio (Bela Vista, cozinha e sala), espaço exclusivo: a partir de R$ 279 por pessoa (Completo por R$ 499 com foto e lembrancinha). Harmonização de queijos e vinhos: a partir de R$ 239 por pessoa (Completo por R$ 399 com foto e lembrancinha). Valores por pessoa. Proposta válida mediante confirmação de data e disponibilidade de agenda.</p>
    {foot("Aniversário · Criar &amp; brindar · 2027")}
  </section>'''

deck = '<div class="deck">\n' + cover + workshops + harmoniza + espacos + planos + personaliza + como + '\n\n</div>\n\n'
head = head.replace("<title>Setembro Amarelo · Elarah</title>", "<title>Aniversário · Criar &amp; Brindar · Elarah</title>")
head = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Proposta de aniversário da Elarah — vela, pintura em taça, cerâmica ou harmonização de queijos e vinhos, no Betc Havas Café ou Bake Studio.">', head)
head = head.replace("</head>",
    "<style>*{box-shadow:none!important;-webkit-box-shadow:none!important}"
    ".cover-photo{border:1px solid var(--line)}"
    ".plan-photo,.bfeat .bphoto{border:1px solid var(--line)}"
    "</style>\n</head>")
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-aniversario-criar-brindar.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"))
