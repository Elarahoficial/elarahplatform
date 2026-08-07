# Despedida de solteira Isabela · Pintura/Cerâmica/Perfumaria (229) + Bartenderia (399) · 15 pessoas · novembro · Jundiaí/Itatiba (levamos até vocês). Emerald palette.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

fonts = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/embedded_fonts_style.html", encoding="utf-8").read()
head = re.sub(r'<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>',
              fonts, head, count=1, flags=re.S)

# ---- recolor: esmeralda (elegante, festivo) ----
head = head.replace("--orange:#F27623;", "--orange:#2E8B6B;")
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#1E6B4E;")
head = head.replace("--navy:#16233C;", "--navy:#1E3028;")
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#566E62;")
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#2E8B6B;")
head = head.replace("#EDF1F7", "#EBF4EF").replace("#DCE5F1", "#D4E8DD")
head = head.replace("#FF9A4D", "#77BCA0")
head = head.replace("rgba(242,118,35,.22)", "rgba(46,139,107,.28)")

extra = '''
  .menu{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:12px}
  .exp{position:relative;width:calc(33.333% - 11px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .exp .top{position:absolute;top:11px;left:11px;z-index:3;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 11px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(30,107,78,.4)}
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
  .itable th,.itable td{padding:14px 11px;border-bottom:1px solid var(--line);text-align:center;vertical-align:middle}
  .itable thead th{font-size:11.5px;color:var(--navy);font-weight:700;border-bottom:2px solid var(--navy);text-transform:uppercase;letter-spacing:.03em}
  .itable thead th span{display:block;font-size:9px;font-weight:500;color:var(--muted);letter-spacing:.01em;margin-top:4px;text-transform:none}
  .itable td.rl{text-align:left;width:36%}
  .itable td.rl b{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--navy)}
  .itable td.rl span{display:block;font-size:10px;color:var(--muted);margin-top:3px;line-height:1.4}
  .itable .val{font-family:'DM Serif Display',serif;font-size:25px;color:var(--navy);line-height:1;white-space:nowrap}
  .itable .hl{background:#DDEFE5}
  .itable thead th.hl{color:var(--orange-dark)}
  .itable tbody tr:last-child td{border-bottom:none}
  .itable .pill{display:inline-block;background:var(--navy);color:#fff;font-size:8px;letter-spacing:.08em;padding:3px 9px;border-radius:999px;margin-bottom:6px;font-weight:700;text-transform:uppercase}
  .bfeat{display:flex;margin-top:16px;background:var(--card);border:1.6px solid var(--orange);border-radius:18px;overflow:hidden;box-shadow:0 18px 42px -24px rgba(0,0,0,.34)}
  .bfeat .bphoto{width:40%;overflow:hidden;background:#eee}
  .bfeat .bphoto img{width:100%;height:100%;object-fit:cover;display:block}
  .bfeat .bbody{flex:1;padding:22px 28px 24px;display:flex;flex-direction:column;justify-content:center}
  .bfeat .btag{align-self:flex-start;background:var(--navy);color:#fff;font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:6px 13px;border-radius:999px;margin-bottom:12px}
  .bfeat h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:24px;color:var(--navy);line-height:1.02}
  .bfeat .sub{display:inline-block;font-size:10px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-top:6px}
  .bfeat p{font-size:12.5px;color:var(--muted);margin-top:10px;line-height:1.48}
  .dchips{display:flex;flex-wrap:wrap;gap:8px;margin-top:13px}
  .dchips span{background:#DDEFE5;border:1px solid var(--line);border-radius:999px;padding:6px 13px;font-size:11.5px;color:var(--navy);font-weight:600}
</style>'''
head = head.replace("</style>", extra, 1)
head = head.replace(".menu-cols{grid-template-columns:1fr 1fr}",
                    ".menu-cols{grid-template-columns:1fr 1fr}\n    .bfeat{flex-direction:row}\n    .bfeat .bphoto{width:40%;height:auto}\n    .bfeat .bbody{padding:16px 22px 17px}\n    .bfeat h3{font-size:21px}\n    .bfeat p{font-size:11.5px;margin-top:8px}\n    .dchips{margin-top:10px;gap:7px}\n    .dchips span{font-size:11px;padding:5px 11px}")
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
        <span class="kicker">Proposta de despedida de solteira</span>
        <span class="compass">Despedida <span>da noiva</span><small>Criar &amp; brindar</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Despedida de solteira · A gente leva até vocês</span>
        <h1>A última<br>de <em>solteira</em></h1>
        <p class="lead">Uma despedida à altura da noiva: experiências <strong>criativas e cheias de afeto</strong> pra galera viver junta — a gente <strong>leva tudo até vocês</strong>, em Jundiaí ou Itatiba. Cada uma cria, brinda e leva a própria peça de recordação. 🥂</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>~15</b> pessoas</span>
          <span class="chip"><b>Novembro</b></span>
          <span class="chip">Em <b>Jundiaí ou Itatiba</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/rockworld1.jpg" alt="Amigas se abraçando e comemorando juntas numa experiência da Elarah" style="object-position:center 30%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Já realizado para times como <b>Compass</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)</div>
    {foot("Despedida de solteira")}
  </section>'''

experiencias = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">As experiências</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham a favorita</span>
    <h2>Experiências <em>criativas</em></h2>
    <p class="lead">Três experiências lindas pra escolher — todas <strong>pelo mesmo valor por pessoa</strong>. É só decidir a que mais combina com a galera (ou combinar em estações). Cada uma cria e leva a própria peça pra casa. 🎨</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","pinturatacanova.jpg","Pintura","Personalizar a própria taça, xícara ou peça — linda pra brindar e levar de recordação.","Taça de vidro pintada à mão com flores","center 50%")}
      {exp("02","ceramicamodelagem.jpg","Cerâmica","Modelar a argila à mão e criar uma peça única — relaxante, sensorial e cheio de charme.","Mãos modelando uma peça de cerâmica","center 50%")}
      {exp("03","perfumariaharbolita.jpg","Perfumaria","Uma imersão sensorial guiada — cada uma cria a própria fragrância, do jeitinho dela.","Essências e frascos de uma imersão de perfumaria","center 45%")}
    </div>
    <div class="note" style="margin-top:14px">◆ As três têm o <b>mesmo valor por pessoa</b> — a escolha é da galera. Cada uma leva a própria criação de recordação. 🌿</div>
    {foot("As experiências")}
  </section>'''

bartenderia = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Opção premium · drinks</span></div>
    </div>
    <span class="eyebrow orange">◆ Pra brindar em grande estilo</span>
    <h2>Bartenderia <em>&amp; drinks</em></h2>
    <p class="lead">A opção mais festiva pra despedida: um <strong>bar completo</strong> com bartender, pra galera aprender e degustar drinks autorais a noite toda — com muito brinde e clima de comemoração. 🍸</p>
    <div class="rule"></div>
    <div class="bfeat" style="height:240px">
      <div class="bphoto"><img src="assets/drinksclassicos.jpg" alt="Drink autoral servido numa bartenderia" style="object-position:center 50%"></div>
      <div class="bbody">
        <span class="btag">★ Opção premium</span>
        <h3>Bar completo <span class="sub">com bartender</span></h3>
        <p>Um bartender conduz a experiência, ensinando e preparando drinks autorais com a galera. Estrutura de bar, insumos e tudo o que precisa — só chegar e brindar. 🥂</p>
        <div class="dchips">
          <span>R$ 399 por pessoa</span>
          <span>Tudo incluso</span>
        </div>
      </div>
    </div>
    {foot("Bartenderia &amp; drinks")}
  </section>'''

planos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Escolha o seu <em>combo</em></h2>
    <p class="lead">Valores por pessoa, com material, condução e o deslocamento até Jundiaí/Itatiba inclusos — e cada uma sempre leva a própria criação. 🥂</p>
    <div class="rule"></div>

    <div class="vtitle">Experiências criativas <span>pintura · cerâmica · perfumaria</span></div>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th>A experiência<span>material &amp; condução</span></th>
        <th>Com foto &amp; coffee<span>+ foto profissional &amp; coffee break</span></th>
        <th class="hl"><span class="pill">★ Completo</span><br>Completo<span>+ lembrancinha</span></th>
      </tr></thead>
      <tbody><tr>
        <td class="rl"><b>Pintura · Cerâmica · Perfumaria</b><span>Todas pelo mesmo valor · levadas até vocês</span></td>
        <td class="val">R$ 229</td><td class="val">R$ 329</td><td class="val hl">R$ 429</td>
      </tr></tbody>
    </table>

    <div class="vtitle">Bartenderia &amp; drinks <span>opção premium</span></div>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th class="hl"><span class="pill">★ Tudo incluso</span><br>Bar completo<span>com bartender &amp; drinks autorais</span></th>
      </tr></thead>
      <tbody><tr>
        <td class="rl"><b>Bartenderia</b><span>Bar, bartender e insumos — tudo incluso</span></td>
        <td class="val hl">R$ 399</td>
      </tr></tbody>
    </table>

    <div class="note" style="margin-top:12px">◆ Valores <b>por pessoa</b>. As experiências criativas sobem de <b>R$ 100 em R$ 100</b> a cada extra (foto profissional, coffee break, lembrancinha). A <b>Bartenderia</b> já vem com tudo incluso. Realizado em Jundiaí ou Itatiba, em novembro (data a combinar).</div>
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
    <p class="lead">Dois extras opcionais que deixam a despedida ainda mais marcante — o registro profissional e a lembrancinha personalizada pra cada convidada.</p>
    <div class="rule"></div>
    <div class="plans">
      <div class="plan">
        <div class="plan-photo sq"><img src="assets/rockworld3.jpg" alt="Despedida registrada por um fotógrafo" style="object-position:center 40%"></div>
        <div class="plan-body">
          <h3>Foto profissional &amp; coffee</h3>
          <span class="tag basic">+ R$ 100 · nível Com foto</span>
          <ul class="feat">
            <li>Um fotógrafo cobre a despedida inteira</li>
            <li>Cada risada e cada criação registradas</li>
            <li>Um coffee break gostoso pra galera</li>
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
            <li>Um mimo pra levarem da despedida pra casa</li>
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
    <h2>A gente <em>vai até vocês</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pra a despedida ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Escolham a experiência</h3><p>Pintura, cerâmica, perfumaria ou a bartenderia — a gente leva profissional, material e estrutura.</p></div>
      <div class="step"><div class="num">2</div><h3>A gente leva até vocês</h3><p>Levamos tudo pronto até a casa em Jundiaí ou Itatiba. Sem preocupação — é só reunir a galera.</p></div>
      <div class="step"><div class="num">3</div><h3>Criar, brindar &amp; levar</h3><p>No fim, todas levam pra casa a própria criação — uma lembrança linda da despedida. 🥂</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Sob medida pra noiva</h4>
        <p>A gente ajusta cada detalhe conforme o número de convidadas, a experiência e o clima que vocês querem pra despedida. É só combinar. 🥂</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora fazer <em>a última de solteira?</em> ✦</h2>
      <p>Me confirma a experiência e a data de novembro, que a gente organiza tudo e leva até vocês.</p>
      <div class="cta-actions">
        <a class="btn-wa" href="https://wa.me/5511914455930?text=Oi%2C%20Elarah!%20Vi%20a%20proposta%20da%20despedida%20e%20quero%20fechar%20os%20detalhes." target="_blank" rel="noopener">
          💬 Falar no WhatsApp
        </a>
        <div class="contact-links">
          <span>+55 (11) 91445-5930</span>
          <a href="https://instagram.com/elarah.oficial" target="_blank" rel="noopener">@elarah.oficial</a>
          <a href="https://elarah.com.br" target="_blank" rel="noopener">elarah.com.br</a>
        </div>
      </div>
    </div>
    <p class="fineprint">Proposta de despedida de solteira da Elarah — experiência criativa à escolha (Pintura, Cerâmica ou Perfumaria, pelo mesmo valor) ou Bartenderia, para cerca de 15 pessoas, em novembro (data a combinar), levada até Jundiaí ou Itatiba. Cada participante cria e leva a própria peça. Experiências criativas: a partir de R$ 229 por pessoa (R$ 229 / 329 / 429), subindo de R$ 100 em R$ 100 a cada extra (foto profissional, coffee break, lembrancinha). Bartenderia: R$ 399 por pessoa, com tudo incluso. Valores por pessoa, já com deslocamento incluso. Proposta válida mediante confirmação de data e disponibilidade de agenda.</p>
    {foot("Despedida de solteira · 2026")}
  </section>'''

deck = '<div class="deck">\n' + cover + experiencias + bartenderia + planos + personaliza + como + '\n\n</div>\n\n'
head = head.replace("<title>Setembro Amarelo · Elarah</title>", "<title>Despedida de Solteira · Elarah</title>")
head = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Proposta de despedida de solteira da Elarah — pintura, cerâmica, perfumaria ou bartenderia, levada até Jundiaí/Itatiba.">', head)
head = head.replace("</head>",
    "<style>*{box-shadow:none!important;-webkit-box-shadow:none!important}"
    ".cover-photo{border:1px solid var(--line)}"
    ".plan-photo,.bfeat .bphoto{border:1px solid var(--line)}"
    "</style>\n</head>")
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-despedida-isabela.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"))
