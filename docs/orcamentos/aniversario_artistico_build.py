# Aniversário artístico · 20 pessoas · 03/10 — 2 opções de espaço (Betc Havas Café + Bake Studio). Plum/berry palette.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

fonts = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/embedded_fonts_style.html", encoding="utf-8").read()
head = re.sub(r'<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>',
              fonts, head, count=1, flags=re.S)

# ---- recolor: plum / berry (artístico, celebrativo) ----
head = head.replace("--orange:#F27623;", "--orange:#A85678;")
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#7E3B57;")
head = head.replace("--navy:#16233C;", "--navy:#2F2330;")
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#6A5560;")
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#A85678;")
head = head.replace("#EDF1F7", "#F8EEF3").replace("#DCE5F1", "#EDD9E4")
head = head.replace("#FF9A4D", "#D68FAD")
head = head.replace("rgba(242,118,35,.22)", "rgba(168,86,120,.28)")

extra = '''
  .menu{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:12px}
  .exp{position:relative;width:calc(50% - 8px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .exp .top{position:absolute;top:11px;left:11px;z-index:3;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 11px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(126,59,87,.4)}
  .exp-photo{aspect-ratio:16/10;overflow:hidden;background:#eee}
  .exp-photo img{width:100%;height:100%;object-fit:cover}
  .exp-body{padding:13px 17px 16px}
  .exp .n{display:inline-block;font-size:9px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:5px}
  .exp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:19px;color:var(--navy);line-height:1.05}
  .exp p{font-size:11.5px;color:var(--muted);margin-top:5px;line-height:1.4}
  .infocard .ico svg{width:30px;height:30px;display:block}
  /* investimento — 2 tabelas compactas */
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
  .itable .hl{background:#F5E2EC}
  .itable thead th.hl{color:var(--orange-dark)}
  .itable tbody tr:last-child td{border-bottom:none}
  .itable .pill{display:inline-block;background:var(--navy);color:#fff;font-size:8px;letter-spacing:.08em;padding:3px 9px;border-radius:999px;margin-bottom:6px;font-weight:700;text-transform:uppercase}
  /* espaços — destaque horizontal */
  .bfeat{display:flex;margin-top:16px;background:var(--card);border:1.6px solid var(--orange);border-radius:18px;overflow:hidden;box-shadow:0 18px 42px -24px rgba(0,0,0,.34)}
  .bfeat.plain{border:1px solid var(--line)}
  .bfeat .bphoto{width:40%;overflow:hidden;background:#eee}
  .bfeat .bphoto img{width:100%;height:100%;object-fit:cover;display:block}
  .bfeat .bbody{flex:1;padding:20px 26px 22px;display:flex;flex-direction:column;justify-content:center}
  .bfeat .btag{align-self:flex-start;background:var(--navy);color:#fff;font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:6px 13px;border-radius:999px;margin-bottom:11px}
  .bfeat .btag.soft{background:var(--orange)}
  .bfeat h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:23px;color:var(--navy);line-height:1.02}
  .bfeat .sub{display:inline-block;font-size:10px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-top:5px}
  .bfeat p{font-size:12px;color:var(--muted);margin-top:9px;line-height:1.45}
  .dchips{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px}
  .dchips span{background:#F5E2EC;border:1px solid var(--line);border-radius:999px;padding:5px 12px;font-size:11px;color:var(--navy);font-weight:500}
</style>'''
head = head.replace("</style>", extra, 1)
head = head.replace(".menu-cols{grid-template-columns:1fr 1fr}",
                    ".menu-cols{grid-template-columns:1fr 1fr}\n    .bfeat{flex-direction:row}\n    .bfeat .bphoto{width:40%;height:auto}\n    .bfeat .bbody{padding:16px 22px 17px}\n    .bfeat h3{font-size:20px}\n    .bfeat p{font-size:11px;margin-top:7px}\n    .dchips{margin-top:9px;gap:6px}\n    .dchips span{font-size:10.5px;padding:4px 10px}")
head = head.replace(".plans{grid-template-columns:1fr}",
                    ".plans{grid-template-columns:1fr}\n    .bfeat{flex-direction:column}\n    .bfeat .bphoto{width:100%;height:200px}")

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
        <span class="compass">Aniversário <span>Elarah</span><small>Experiência artística</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Aniversário · Experiência artística</span>
        <h1>Comemorar<br>criando <em>arte</em></h1>
        <p class="lead">Um aniversário diferente e cheio de charme: a galera escolhe uma <strong>experiência artística</strong> — cerâmica, pintura, taça ou vela — e cada convidado leva pra casa a própria criação. Puro clima de celebração. 🥂</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>~20</b> pessoas</span>
          <span class="chip"><b>03/10</b></span>
          <span class="chip">Em <b>espaço parceiro</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/rockworld1.jpg" alt="Grupo comemorando junto numa experiência da Elarah" style="object-position:center 30%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Já realizado para times como <b>Compass</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)</div>
    {foot("Aniversário · Experiência artística")}
  </section>'''

menu = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">As experiências</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolha a sua vibe</span>
    <h2>Experiências <em>artísticas</em></h2>
    <p class="lead">Quatro experiências pra escolher — todas <strong>pelo mesmo valor por pessoa</strong>. É só escolher a favorita (ou combinar estações). Cada convidado cria e leva a própria peça pra casa. 🎨</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","ceramicamodelagem.jpg","Cerâmica","Modelar a argila à mão e criar uma peça única — relaxante e cheio de charme.","Mãos modelando uma peça de cerâmica","center 50%")}
      {exp("02","pinturapratoceramica.jpg","Pintura em cerâmica","Pintar pratos, canecas e peças de cerâmica com cores e traços só seus.","Prato de cerâmica pintado à mão com limões e queijos","center 50%")}
      {exp("03","pinturatacavinho.jpg","Pintura em taça","Personalizar a própria taça — o brinde fica ainda mais especial.","Taça de vidro pintada à mão","center 45%")}
      {exp("04","velaaromatica.jpg","Vela aromática","Um ritual sensorial — cada um cria a própria vela com o aroma que ama.","Vela aromática artesanal","center 50%")}
    </div>
    <div class="note" style="margin-top:14px">◆ Todas as experiências <b>a partir de R$ 199 por pessoa</b> — cada convidado leva a própria criação de recordação. 🎨</div>
    {foot("As experiências")}
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
    <div class="bfeat" style="height:212px">
      <div class="bphoto"><img src="assets/betchavas2.jpg" alt="Interior moderno e aconchegante do Betc Havas Café" style="object-position:center 55%"></div>
      <div class="bbody">
        <span class="btag">Opção 1 · a partir de R$ 199</span>
        <h3>Betc Havas Café <span class="sub">café &amp; lounge criativo</span></h3>
        <p>Um café moderno, cheio de charme, com madeira, arte nas paredes e clima gostoso de ficar. A experiência acontece lá, com <b>comida à parte</b> conforme o combo escolhido. ☕</p>
      </div>
    </div>
    <div class="bfeat plain" style="margin-top:15px;height:212px">
      <div class="bphoto"><img src="assets/espaco1.jpg" alt="Lounge acolhedor do Bake Studio na Bela Vista" style="object-position:center 55%"></div>
      <div class="bbody">
        <span class="btag soft">Opção 2 · a partir de R$ 279</span>
        <h3>Bake Studio <span class="sub">Bela Vista · exclusivo</span></h3>
        <p>Um estúdio com cozinha e sala, <b>só de vocês por 9 horas</b> — com liberdade pra decorar do jeito que quiserem. Espaço exclusivo, do começo ao fim. 🌿</p>
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
    <h2>Dois jeitos de <em>comemorar</em></h2>
    <p class="lead">Escolha o espaço e o nível que mais combinam. Valores por pessoa, com material e condução inclusos — e cada convidado sempre leva a própria criação. 🥂</p>
    <div class="rule"></div>

    <div class="vtitle">Opção 1 · Betc Havas Café <span>comida à parte</span></div>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th>A experiência<span>material & condução</span></th>
        <th>Com foto &amp; voucher<span>+ foto profissional &amp; R$ 30 de voucher</span></th>
        <th class="hl"><span class="pill">★ Completo</span><br>Completo<span>+ lembrancinha</span></th>
      </tr></thead>
      <tbody><tr>
        <td class="rl"><b>Cerâmica · Pintura · Taça · Vela</b><span>Todas pelo mesmo valor</span></td>
        <td class="val">R$ 199</td><td class="val">R$ 299</td><td class="val hl">R$ 399</td>
      </tr></tbody>
    </table>

    <div class="vtitle">Opção 2 · Bake Studio · Bela Vista <span>espaço exclusivo · 9h · podem decorar</span></div>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th>A experiência<span>+ espaço exclusivo (9h)</span></th>
        <th class="hl"><span class="pill">★ Completo</span><br>Completo<span>+ foto profissional &amp; lembrancinha</span></th>
      </tr></thead>
      <tbody><tr>
        <td class="rl"><b>Cerâmica · Pintura · Taça · Vela</b><span>Espaço só de vocês, com liberdade pra decorar</span></td>
        <td class="val">R$ 279</td><td class="val hl">R$ 499</td>
      </tr></tbody>
    </table>

    <div class="note" style="margin-top:15px">◆ Valores <b>por pessoa</b>, com material e condução inclusos. No <b>Betc Havas Café</b> a comida é à parte; o nível Com foto soma a foto profissional e R$ 30 de voucher de consumo, e o Completo soma a lembrancinha. No <b>Bake Studio</b> o espaço é exclusivo por 9h, e o Completo já inclui foto profissional &amp; lembrancinha.</div>
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
    <p class="lead">Dois extras opcionais que deixam o aniversário ainda mais marcante — o registro profissional e a lembrancinha personalizada pra cada convidado.</p>
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
            <li>Kit com <b>escova &amp; piranha</b> pra cada convidado</li>
            <li>Personalizado com o nome de cada um</li>
            <li>Um mimo pra levarem da festa pra casa</li>
          </ul>
          <span class="allin">Cada um leva o seu mimo</span>
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
    <h2>É só <em>reunir a galera</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pra a festa ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Escolha a experiência</h3><p>Cerâmica, pintura, taça ou vela — a gente leva profissional, material e toda a estrutura.</p></div>
      <div class="step"><div class="num">2</div><h3>Escolha o espaço</h3><p>Betc Havas Café ou o Bake Studio exclusivo — a gente reserva e organiza tudo pra vocês.</p></div>
      <div class="step"><div class="num">3</div><h3>Cada um leva a arte</h3><p>No fim, todo mundo leva pra casa a própria criação — uma lembrança linda do dia. 🥂</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Sob medida pro seu dia</h4>
        <p>A gente ajusta cada detalhe conforme o número de pessoas, o espaço e o clima que você quer pra festa. É só combinar. 🥂</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora comemorar <em>criando?</em> ✦</h2>
      <p>Me confirma o número de pessoas e qual espaço você prefere, que a gente fecha tudo pro dia 03/10.</p>
      <div class="cta-actions">
        <a class="btn-wa" href="https://wa.me/5511914455930?text=Oi%2C%20Elarah!%20Vi%20a%20proposta%20do%20anivers%C3%A1rio%20art%C3%ADstico%20e%20quero%20fechar%20os%20detalhes." target="_blank" rel="noopener">
          💬 Falar no WhatsApp
        </a>
        <div class="contact-links">
          <span>+55 (11) 91445-5930</span>
          <a href="https://instagram.com/elarah.oficial" target="_blank" rel="noopener">@elarah.oficial</a>
          <a href="https://elarah.com.br" target="_blank" rel="noopener">elarah.com.br</a>
        </div>
      </div>
    </div>
    <p class="fineprint">Proposta de aniversário da Elarah com experiência artística à escolha — Cerâmica, Pintura em cerâmica, Pintura em taça ou Vela aromática — para cerca de 20 pessoas, em 03/10. Cada convidado cria e leva a própria peça. Opção 1 · Betc Havas Café (comida à parte): a partir de R$ 199 por pessoa (níveis R$ 199 / 299 / 399) — A experiência (material e condução) / + foto profissional e R$ 30 de voucher de consumo / Completo com lembrancinha. Opção 2 · Bake Studio (Bela Vista), espaço exclusivo por 9h com liberdade pra decorar: a partir de R$ 279 por pessoa; Completo por R$ 499 com foto profissional e lembrancinha. Valores por pessoa. Proposta válida mediante confirmação de data e disponibilidade de agenda.</p>
    {foot("Aniversário · Experiência artística · 2026")}
  </section>'''

deck = '<div class="deck">\n' + cover + menu + espacos + planos + personaliza + como + '\n\n</div>\n\n'
head = head.replace("<title>Setembro Amarelo · Elarah</title>", "<title>Aniversário · Experiência artística · Elarah</title>")
head = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Proposta de aniversário da Elarah — experiência artística (cerâmica, pintura, taça, vela) no Betc Havas Café ou Bake Studio.">', head)
head = head.replace("</head>",
    "<style>*{box-shadow:none!important;-webkit-box-shadow:none!important}"
    ".cover-photo{border:1px solid var(--line)}"
    ".plan-photo,.bfeat .bphoto{border:1px solid var(--line)}"
    "</style>\n</head>")
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-aniversario-artistico.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"))
