# Aniversário 46 anos · 6 amigas · Aromaterapia + Pintura em taça · 27/08. 2 espaços (Betc 199 / Jardim 299 c/ coffee). Mauve palette.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

fonts = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/embedded_fonts_style.html", encoding="utf-8").read()
head = re.sub(r'<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>',
              fonts, head, count=1, flags=re.S)

# ---- recolor: rosé-mauve (elegante, maduro) ----
head = head.replace("--orange:#F27623;", "--orange:#B07686;")
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#8C5265;")
head = head.replace("--navy:#16233C;", "--navy:#33262B;")
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#6E5A60;")
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#B07686;")
head = head.replace("#EDF1F7", "#F8F0F2").replace("#DCE5F1", "#EEDCE1")
head = head.replace("#FF9A4D", "#CE9AA8")
head = head.replace("rgba(242,118,35,.22)", "rgba(176,118,134,.28)")

extra = '''
  .menu{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:12px}
  .exp{position:relative;width:calc(50% - 8px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .exp .top{position:absolute;top:11px;left:11px;z-index:3;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 11px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(140,82,101,.4)}
  .exp-photo{aspect-ratio:16/10;overflow:hidden;background:#eee}
  .exp-photo img{width:100%;height:100%;object-fit:cover}
  .exp-body{padding:14px 18px 17px}
  .exp .n{display:inline-block;font-size:9px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:5px}
  .exp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:20px;color:var(--navy);line-height:1.05}
  .exp p{font-size:12px;color:var(--muted);margin-top:5px;line-height:1.42}
  .infocard .ico svg{width:30px;height:30px;display:block}
  .itable{width:100%;border-collapse:collapse;margin-top:18px;font-family:'DM Sans'}
  .itable th,.itable td{padding:15px 12px;border-bottom:1px solid var(--line);text-align:center;vertical-align:middle}
  .itable thead th{font-size:12px;color:var(--navy);font-weight:700;border-bottom:2px solid var(--navy);text-transform:uppercase;letter-spacing:.04em}
  .itable thead th span{display:block;font-size:9.5px;font-weight:500;color:var(--muted);letter-spacing:.01em;margin-top:4px;text-transform:none}
  .itable td.rl{text-align:left;width:36%}
  .itable td.rl b{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy)}
  .itable td.rl span{display:block;font-size:10px;color:var(--muted);margin-top:3px;line-height:1.4}
  .itable .val{font-family:'DM Serif Display',serif;font-size:25px;color:var(--navy);line-height:1;white-space:nowrap}
  .itable .hl{background:#F5E6EA}
  .itable thead th.hl{color:var(--orange-dark)}
  .itable tbody tr:last-child td{border-bottom:none}
  .itable .pill{display:inline-block;background:var(--navy);color:#fff;font-size:8px;letter-spacing:.08em;padding:3px 9px;border-radius:999px;margin-bottom:6px;font-weight:700;text-transform:uppercase}
  .bfeat{display:flex;margin-top:16px;background:var(--card);border:1.6px solid var(--orange);border-radius:18px;overflow:hidden;box-shadow:0 18px 42px -24px rgba(0,0,0,.34)}
  .bfeat .bphoto{width:40%;overflow:hidden;background:#eee}
  .bfeat .bphoto img{width:100%;height:100%;object-fit:cover;display:block}
  .bfeat .bbody{flex:1;padding:20px 26px 22px;display:flex;flex-direction:column;justify-content:center}
  .bfeat .btag{align-self:flex-start;background:var(--navy);color:#fff;font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:6px 13px;border-radius:999px;margin-bottom:11px}
  .bfeat h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:23px;color:var(--navy);line-height:1.02}
  .bfeat .sub{display:inline-block;font-size:10px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-top:5px}
  .bfeat p{font-size:12px;color:var(--muted);margin-top:9px;line-height:1.45}
</style>'''
head = head.replace("</style>", extra, 1)
head = head.replace(".menu-cols{grid-template-columns:1fr 1fr}",
                    ".menu-cols{grid-template-columns:1fr 1fr}\n    .bfeat{flex-direction:row}\n    .bfeat .bphoto{width:40%;height:auto}\n    .bfeat .bbody{padding:16px 22px 17px}\n    .bfeat h3{font-size:20px}\n    .bfeat p{font-size:11px;margin-top:7px}")
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
        <span class="compass">46 <span>anos</span><small>Aroma &amp; pintura</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Aniversário de 46 anos · Entre amigas</span>
        <h1>Comemorar<br>entre <em>amigas</em></h1>
        <p class="lead">Uma tarde íntima e cheia de charme pra celebrar os 46 anos: uma experiência <strong>sensorial e criativa</strong> — aromaterapia ou pintura em taça — com brunch, boas conversas e cada uma levando a própria criação de recordação. 🥂</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>6</b> amigas</span>
          <span class="chip"><b>27/08</b></span>
          <span class="chip">Betc Havas <b>ou Jardim</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/rockworld1.jpg" alt="Amigas se abraçando e comemorando juntas numa experiência da Elarah" style="object-position:center 30%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Já realizado para times como <b>Compass</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)</div>
    {foot("Aniversário de 46 anos")}
  </section>'''

experiencias = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">As experiências</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham a favorita</span>
    <h2>Duas experiências, <em>o mesmo valor</em></h2>
    <p class="lead">Duas experiências sensoriais lindas pra escolher — <strong>pelo mesmo valor por pessoa</strong>. É só decidir a que mais combina com a turma. Cada uma cria e leva a própria peça pra casa. 🌿</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","aromaterapiameninas.jpg","Aromaterapia","Uma imersão de aromas — cada uma cria a própria fragrância, do jeitinho dela.","Amigas criando as próprias fragrâncias numa imersão de aromaterapia","center 40%")}
      {exp("02","pinturatacameninas.jpg","Pintura em taça","Personalizar a própria taça — linda pra brindar e levar de recordação.","Amigas pintando as próprias taças de vidro","center 40%")}
    </div>
    <div class="note" style="margin-top:14px">◆ As duas têm o <b>mesmo valor por pessoa</b> — a escolha é da turma. Cada uma leva a própria criação de recordação. 🌿</div>
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
    <p class="lead">Dois espaços parceiros lindos, cada um com seu charme — a cafeteria moderna ou o jardim arborizado. É só escolher qual combina mais com a comemoração. 🌿</p>
    <div class="rule"></div>
    <div class="bfeat" style="height:206px">
      <div class="bphoto"><img src="assets/betchavas2.jpg" alt="Interior moderno e aconchegante do Betc Havas Café" style="object-position:center 55%"></div>
      <div class="bbody">
        <span class="btag">Opção 1 · a partir de R$ 199</span>
        <h3>Betc Havas Café <span class="sub">café &amp; lounge criativo</span></h3>
        <p>Um café moderno e cheio de charme, com madeira, arte nas paredes e clima gostoso de ficar. A experiência acontece lá, com o consumo à parte. ☕</p>
      </div>
    </div>
    <div class="bfeat" style="margin-top:15px;height:206px">
      <div class="bphoto"><img src="assets/ojardim1.jpg" alt="Jardim arborizado com árvores, guarda-sóis e mesas" style="object-position:center 55%"></div>
      <div class="bbody">
        <span class="btag">★ Opção 2 · a partir de R$ 399</span>
        <h3>O Jardim <span class="sub">café brunch &amp; arborizado</span></h3>
        <p>Um jardim lindo e arborizado, com aquele clima de tarde ao ar livre. Aqui o valor já vem com <b>café brunch, espaço e experiência inclusos</b> — só chegar e curtir. 🌳</p>
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
    <h2>Escolha o <em>combo</em></h2>
    <p class="lead">Valor por pessoa, com material e condução inclusos — e cada uma sempre leva a própria criação. É só escolher o espaço e o nível que mais combinam com a comemoração. 🥂</p>
    <div class="rule"></div>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th>A experiência<span>material & condução</span></th>
        <th>Com foto &amp; voucher<span>+ foto profissional &amp; R$ 30 de voucher</span></th>
        <th class="hl"><span class="pill">★ Completo</span><br>Completo<span>nível mais completo</span></th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="rl"><b>Betc Havas Café</b><span>consumo à parte</span></td>
          <td class="val">R$ 199</td><td class="val">R$ 299</td><td class="val hl">R$ 399</td>
        </tr>
        <tr>
          <td class="rl"><b>O Jardim · café brunch</b><span>café brunch, espaço &amp; experiência inclusos</span></td>
          <td class="val">R$ 399</td><td class="val" style="color:var(--muted);font-size:18px">—</td><td class="val hl">R$ 499</td>
        </tr>
      </tbody>
    </table>
    <div class="note" style="margin-top:18px">◆ Valor <b>por pessoa</b>, com material e condução inclusos. No <b>Betc Havas Café</b> o consumo é à parte; o nível Com foto soma a foto profissional e R$ 30 de voucher de consumo, e o Completo soma a lembrancinha. No <b>Jardim · café brunch</b> o valor já inclui <b>café brunch, espaço e experiência</b>, e o Completo (R$ 499) soma foto profissional &amp; lembrancinha.</div>
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
    <p class="lead">Dois extras opcionais que deixam a comemoração ainda mais marcante — o registro profissional e a lembrancinha personalizada pra cada convidada.</p>
    <div class="rule"></div>
    <div class="plans">
      <div class="plan">
        <div class="plan-photo sq"><img src="assets/perfumariaapresenta%C3%A7%C3%A3o.jpg" alt="Amigas na mesa numa experiência da Elarah, registradas por um fotógrafo" style="object-position:center 40%"></div>
        <div class="plan-body">
          <h3>Foto profissional &amp; voucher</h3>
          <span class="tag basic">Nível Com foto · R$ 299</span>
          <ul class="feat">
            <li>Um fotógrafo cobre a comemoração inteira</li>
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
            <li>Um mimo pra levarem da comemoração pra casa</li>
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
    <p class="lead">A Elarah cuida de toda a produção pra a comemoração ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Escolham a experiência</h3><p>Aromaterapia ou pintura em taça — pelo mesmo valor. A gente leva profissional, material e estrutura.</p></div>
      <div class="step"><div class="num">2</div><h3>Escolham o espaço</h3><p>Betc Havas Café ou o Jardim arborizado — a gente reserva e organiza tudo pra vocês.</p></div>
      <div class="step"><div class="num">3</div><h3>Cada uma leva a arte</h3><p>No fim, todas levam pra casa a própria criação — uma lembrança linda do dia. 🥂</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Sob medida pro seu dia</h4>
        <p>A gente ajusta cada detalhe conforme o número de convidadas, o espaço e o clima que você quer pra comemoração. É só combinar. 🥂</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora comemorar <em>os 46?</em> ✦</h2>
      <p>Me confirma a experiência e o espaço que você prefere, que a gente fecha tudo pro dia 27/08.</p>
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
    <p class="fineprint">Proposta de aniversário da Elarah — experiência à escolha (Aromaterapia ou Pintura em taça, pelo mesmo valor), para cerca de 6 pessoas, em 27/08 (a confirmar), em espaço parceiro. Cada convidada cria e leva a própria peça. Opção 1 · Betc Havas Café (consumo à parte): a partir de R$ 199 por pessoa (R$ 199 / 299 / 399 — A experiência / + foto profissional e R$ 30 de voucher / Completo com lembrancinha). Opção 2 · O Jardim (café brunch), com café brunch, espaço e experiência inclusos: a partir de R$ 399 por pessoa (Completo por R$ 499 com foto e lembrancinha). Valores por pessoa. Proposta válida mediante confirmação de data e disponibilidade de agenda.</p>
    {foot("Aniversário de 46 anos · 2026")}
  </section>'''

deck = '<div class="deck">\n' + cover + experiencias + espacos + planos + personaliza + como + '\n\n</div>\n\n'
head = head.replace("<title>Setembro Amarelo · Elarah</title>", "<title>Aniversário de 46 anos · Elarah</title>")
head = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Proposta de aniversário da Elarah — aromaterapia ou pintura em taça no Betc Havas Café ou no Jardim.">', head)
head = head.replace("</head>",
    "<style>*{box-shadow:none!important;-webkit-box-shadow:none!important}"
    ".cover-photo{border:1px solid var(--line)}"
    ".plan-photo,.bfeat .bphoto{border:1px solid var(--line)}"
    "</style>\n</head>")
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-aniversario-46.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"))
