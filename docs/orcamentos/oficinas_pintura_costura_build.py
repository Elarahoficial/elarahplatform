# Turma privada · DUAS oficinas (Pintura Flores na Telinha 199 + Costura Criativa 139) · 13 pessoas · 05/09. Blush.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

fonts = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/embedded_fonts_style.html", encoding="utf-8").read()
head = re.sub(r'<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>',
              fonts, head, count=1, flags=re.S)

# ---- recolor: sage-grey (calmo, relaxante) ----
head = head.replace("--orange:#F27623;", "--orange:#C77E86;")
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#A85C66;")
head = head.replace("--navy:#16233C;", "--navy:#3A2530;")
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#7A5E66;")
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#C77E86;")
head = head.replace("#EDF1F7", "#F8EFF1").replace("#DCE5F1", "#F1DCE2")
head = head.replace("#FF9A4D", "#D9A6B0")
head = head.replace("rgba(242,118,35,.22)", "rgba(199,126,134,.28)")

extra = '''
  .menu{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:12px}
  .exp{position:relative;width:calc(33.333% - 11px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .exp .top{position:absolute;top:11px;left:11px;z-index:3;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 11px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(90,113,106,.4)}
  .exp-photo{aspect-ratio:1/1;overflow:hidden;background:#eee}
  .exp-photo img{width:100%;height:100%;object-fit:cover}
  .exp-body{padding:12px 15px 15px}
  .exp .n{display:inline-block;font-size:9px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:5px}
  .exp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--navy);line-height:1.05}
  .exp p{font-size:11px;color:var(--muted);margin-top:5px;line-height:1.38}
  .infocard .ico svg{width:30px;height:30px;display:block}
  .itable{width:100%;border-collapse:collapse;margin-top:18px;font-family:'DM Sans'}
  .itable th,.itable td{padding:15px 12px;border-bottom:1px solid var(--line);text-align:center;vertical-align:middle}
  .itable thead th{font-size:12px;color:var(--navy);font-weight:700;border-bottom:2px solid var(--navy);text-transform:uppercase;letter-spacing:.04em}
  .itable thead th span{display:block;font-size:9.5px;font-weight:500;color:var(--muted);letter-spacing:.01em;margin-top:4px;text-transform:none}
  .itable td.rl{text-align:left;width:36%}
  .itable td.rl b{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy)}
  .itable td.rl span{display:block;font-size:10px;color:var(--muted);margin-top:3px;line-height:1.4}
  .itable .val{font-family:'DM Serif Display',serif;font-size:25px;color:var(--navy);line-height:1;white-space:nowrap}
  .itable .hl{background:#E6EEE9}
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
head = head.replace("</head>", "<style>.menu.two{gap:22px}.menu.two .exp{width:calc(50% - 12px);max-width:360px}.pslot{border:2px dashed var(--orange);border-radius:0;background:rgba(199,126,134,.09);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:4px;width:100%;height:100%;box-sizing:border-box;padding:14px}.pslot .pi{font-size:22px}.pslot .pl{font-family:'DM Serif Display',serif;font-size:15px;color:var(--navy)}.pslot .ps{font-size:9px;color:var(--muted);font-weight:600;letter-spacing:.05em;text-transform:uppercase}.vibe{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}.vibe figure{margin:0;border-radius:16px;overflow:hidden;position:relative;aspect-ratio:3/4;box-shadow:0 16px 36px -24px rgba(0,0,0,.34)}.vibe img{width:100%;height:100%;object-fit:cover;display:block}.vibe figcaption{position:absolute;left:0;right:0;bottom:0;padding:28px 14px 13px;color:#fff;font-size:12.5px;font-weight:600;background:linear-gradient(to top,rgba(40,25,32,.82),transparent)}</style>\n</head>", 1)
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
        <span class="kicker">Proposta de experiência · Turma privada</span>
        <span class="compass">Duas <span>oficinas</span><small>Turma privada</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Duas oficinas criativas · turma privada</span>
        <h1>Duas oficinas <em>criativas</em></h1>
        <p class="lead">Duas experiências criativas pra turma: <strong>Pintando Flores na Telinha</strong> (pra quem nunca pintou) e a <strong>Oficina de Costura Criativa</strong> (pra iniciantes). Dá pra escolher uma ou fazer as duas — cada convidado leva pra casa a própria criação. 🌸🧵</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>13</b> pessoas</span>
          <span class="chip"><b>05/09</b></span>
          <span class="chip">Em <b>espaço parceiro</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/pintura-dupla.jpg" alt="Convidadas pintando flores numa experiência da Elarah" style="object-position:center 35%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Já realizado para times como <b>Compass</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)</div>
    {foot("Turma privada · Duas oficinas")}
  </section>'''

workshop = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">As oficinas</span></div>
    </div>
    <span class="eyebrow orange">◆ Duas experiências criativas</span>
    <h2>Escolham a(s) <em>oficina(s)</em></h2>
    <p class="lead">Duas oficinas queridinhas pra turma — dá pra escolher só uma ou combinar as duas no mesmo encontro. Cada convidado leva pra casa a própria criação. Os valores de cada uma estão nas páginas a seguir. 🌸🧵</p>
    <div class="rule"></div>
    <div class="menu two">
      {exp("Oficina 01","pintura-grupo.jpg","Pintando Flores na Telinha","Pra quem nunca pintou — cada um pinta o próprio quadro de flores e leva pra casa. A partir de R$ 199.","Grupo pintando ao ar livre","center 45%")}
      {exp("Oficina 02","costura-costurando.jpg","Oficina de Costura Criativa","Pra iniciantes — cada um costura o próprio projeto do zero e leva pra casa. A partir de R$ 139.","Convidadas costurando à mão","center 40%")}
    </div>
    <div class="note" style="margin-top:14px">◆ As duas são feitas pra quem nunca fez — é só chegar e criar. Cada um leva a própria criação. 🌸🧵</div>
    {foot("As oficinas")}
  </section>'''

espacos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Onde acontece</span></div>
    </div>
    <span class="eyebrow orange">◆ Três opções de espaço</span>
    <h2>Escolha o <em>cenário</em></h2>
    <p class="lead">Três espaços parceiros lindos, cada um com seu charme e seu valor por pessoa. É só escolher qual combina mais com a turma — do café arejado ao estúdio exclusivo. 🌸</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("Opção 1","julescampobelo.jpg","Jules · Campo Belo","Café charmoso e arejado, com mesas de madeira e guarda-sóis. Consumo à parte.","Café Jules em Campo Belo com mesas de madeira e guarda-sóis","center 60%")}
      {exp("Opção 2","betchavas2.jpg","Betc Havas Café","Moderno e cheio de charme — já vem com <b>R$ 50 de consumação</b> inclusos.","Interior moderno do Betc Havas Café","center 55%")}
      {exp("Opção 3","espaco1.jpg","Bake Studio","Estúdio exclusivo com <b>cozinha e sala</b>, só de vocês, com liberdade pra decorar.","Lounge acolhedor do Bake Studio","center 55%")}
    </div>
    <div class="note" style="margin-top:14px">◆ Os valores de cada oficina, por espaço e nível, estão nas duas tabelas a seguir. No <b>Jules</b> o consumo é à parte; o <b>Betc</b> já vem com R$ 50 de voucher; o <b>Bake Studio</b> é exclusivo só de vocês. 🌸🧵</div>
    {foot("Onde acontece")}
  </section>'''

planos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento · Pintura</span></div>
    </div>
    <span class="eyebrow orange">◆ Oficina 01 · Pintando Flores na Telinha 🌸</span>
    <h2>Escolha o <em>combo</em></h2>
    <p class="lead">Valor por pessoa, com material e condução inclusos — e cada um sempre leva a própria criação. É só escolher o espaço e o nível que mais combinam com a turma. 🌿</p>
    <div class="rule"></div>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th>A experiência<span>material & condução</span></th>
        <th>Com foto<span>+ foto profissional</span></th>
        <th class="hl"><span class="pill">★ Completo</span><br>Completo<span>+ lembrancinha &amp; mimos</span></th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="rl"><b>Jules · Campo Belo</b><span>consumo à parte</span></td>
          <td class="val">R$ 199</td><td class="val">R$ 299</td><td class="val hl">R$ 399</td>
        </tr>
        <tr>
          <td class="rl"><b>Betc Havas Café</b><span>R$ 50 de voucher inclusos</span></td>
          <td class="val">R$ 249</td><td class="val">R$ 349</td><td class="val hl">R$ 449</td>
        </tr>
        <tr>
          <td class="rl"><b>Bake Studio</b><span>espaço exclusivo · cozinha &amp; sala</span></td>
          <td class="val">R$ 289</td><td class="val">R$ 389</td><td class="val hl">R$ 539</td>
        </tr>
      </tbody>
    </table>
    <div class="note" style="margin-top:16px">◆ Valor <b>por pessoa</b>, com material e condução da artista inclusos, na pintura em tela (feita pra quem nunca pintou). O nível <b>Com foto</b> soma a foto profissional e o <b>Completo</b> soma a lembrancinha personalizada. No <b>Jules</b> o consumo é à parte; o <b>Betc</b> já inclui R$ 50 de voucher; o <b>Bake Studio</b> é espaço exclusivo (cozinha &amp; sala, com coffee break). Data 05/09 a confirmar.</div>
    {foot("Investimento · Pintura")}
  </section>'''

personaliza = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Extras opcionais</span></div>
    </div>
    <span class="eyebrow orange">◆ Se quiserem deixar ainda mais completo</span>
    <h2>Dois <em>mimos</em> a mais</h2>
    <p class="lead">Dois extras opcionais que deixam o encontro ainda mais marcante — o registro profissional com voucher e a lembrancinha personalizada pra cada um.</p>
    <div class="rule"></div>
    <div class="plans">
      <div class="plan">
        <div class="plan-photo sq"><img src="assets/perfumariaapresenta%C3%A7%C3%A3o.jpg" alt="Amigas na mesa numa experiência da Elarah, registradas por um fotógrafo" style="object-position:center 40%"></div>
        <div class="plan-body">
          <h3>Foto profissional</h3>
          <span class="tag basic">Nível Com foto</span>
          <ul class="feat">
            <li>Um fotógrafo cobre o encontro inteiro</li>
            <li>Cada risada e cada quadro registrados</li>
            <li>Álbum digital lindo pra guardar de recordação</li>
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
            <li>Kit com <b>escova &amp; piranha</b> pra cada um</li>
            <li>Personalizado com o nome de cada pessoa</li>
            <li>Um mimo pra levarem do encontro pra casa</li>
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
    <h2>É só <em>reunir a turma</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pra o encontro ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Escolham o espaço</h3><p>Jules (Campo Belo), Betc Havas Café ou o Bake Studio exclusivo — a gente reserva pra sua turma no dia 05/09.</p></div>
      <div class="step"><div class="num">2</div><h3>A gente leva tudo</h3><p>A profissional, todo o material e a estrutura das oficinas. Vocês só chegam e criam.</p></div>
      <div class="step"><div class="num">3</div><h3>Cada um leva a peça</h3><p>Cada um leva a própria criação — uma lembrança linda do dia. 🌸🧵</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Sob medida pro seu dia</h4>
        <p>A gente ajusta cada detalhe conforme o número de convidados e o clima que você quer pro encontro. É só combinar. 🌿</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora <em>criar junto?</em> ✦</h2>
      <p>Me confirma o espaço e o nível que vocês preferem, que a gente reserva e organiza tudo pro dia 05/09.</p>
      <div class="cta-actions">
        <a class="btn-wa" href="https://wa.me/5511914455930?text=Oi%2C%20Elarah!%20Vi%20a%20proposta%20das%20oficinas%20(pintura%20e%20costura)%20e%20quero%20fechar." target="_blank" rel="noopener">
          💬 Falar no WhatsApp
        </a>
        <div class="contact-links">
          <span>+55 (11) 91445-5930</span>
          <a href="https://instagram.com/elarah.oficial" target="_blank" rel="noopener">@elarah.oficial</a>
          <a href="https://elarah.com.br" target="_blank" rel="noopener">elarah.com.br</a>
        </div>
      </div>
    </div>
    <p class="fineprint">Proposta de experiência da Elarah para turma privada — duas oficinas à escolha: Pintando Flores na Telinha (pra quem nunca pintou, a partir de R$ 199) e Oficina de Costura Criativa (pra iniciantes, a partir de R$ 139), para 13 pessoas, em 05/09 (a confirmar), em espaço parceiro. Cada convidado leva a própria criação. Três opções de espaço (Jules · consumo à parte; Betc · R$ 50 de voucher; Bake Studio · exclusivo, com coffee break). Em todas, o nível Com foto soma a foto profissional e o Completo soma a lembrancinha personalizada. Valores por pessoa. Proposta válida mediante confirmação de data e disponibilidade de agenda.</p>
    {foot("Turma privada · Duas oficinas · 2026")}
  </section>'''

planos_costura = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento · Costura</span></div>
    </div>
    <span class="eyebrow orange">◆ Oficina 02 · Oficina de Costura Criativa 🧵</span>
    <h2>Escolha o <em>combo</em></h2>
    <p class="lead">Valor por pessoa, com material e condução inclusos — e cada um sempre leva a própria criação. É só escolher o espaço e o nível que mais combinam com a turma. 🌿</p>
    <div class="rule"></div>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th>A experiência<span>material & condução</span></th>
        <th>Com foto<span>+ foto profissional</span></th>
        <th class="hl"><span class="pill">★ Completo</span><br>Completo<span>+ lembrancinha &amp; mimos</span></th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="rl"><b>Jules · Campo Belo</b><span>consumo à parte</span></td>
          <td class="val">R$ 139</td><td class="val">R$ 239</td><td class="val hl">R$ 339</td>
        </tr>
        <tr>
          <td class="rl"><b>Betc Havas Café</b><span>R$ 50 de voucher inclusos</span></td>
          <td class="val">R$ 189</td><td class="val">R$ 289</td><td class="val hl">R$ 389</td>
        </tr>
        <tr>
          <td class="rl"><b>Bake Studio</b><span>espaço exclusivo · cozinha &amp; sala</span></td>
          <td class="val">R$ 229</td><td class="val">R$ 329</td><td class="val hl">R$ 479</td>
        </tr>
      </tbody>
    </table>
    <div class="note" style="margin-top:16px">◆ Valor <b>por pessoa</b>, com material e condução da artista inclusos, na oficina de costura (feita pra iniciantes). O nível <b>Com foto</b> soma a foto profissional e o <b>Completo</b> soma a lembrancinha personalizada. No <b>Jules</b> o consumo é à parte; o <b>Betc</b> já inclui R$ 50 de voucher; o <b>Bake Studio</b> é espaço exclusivo (cozinha &amp; sala, com coffee break). Data 05/09 a confirmar.</div>
    {foot("Investimento · Costura")}
  </section>'''

vibe = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">A vibe</span></div>
    </div>
    <span class="eyebrow orange">◆ O que vocês vão sentir</span>
    <h2>Mão na massa e <em>lembrança</em></h2>
    <p class="lead">Mais que uma atividade: uma tarde leve, afetiva e cheia de fotos boas — e cada convidado ainda leva pra casa a própria criação e uma lembrancinha personalizada. 🌸🧵</p>
    <div class="vibe">
      <figure><img src="assets/vibe-risada.jpg" alt="Convidadas rindo com suas criações" style="object-position:center 28%"><figcaption>Risada garantida</figcaption></figure>
      <figure><img src="assets/personaliza%C3%A7aobrindeescovapiranha.jpg" alt="Lembrancinha personalizada com o nome de cada convidado" style="object-position:center 50%"><figcaption>Lembrancinha personalizada</figcaption></figure>
      <figure><img src="assets/vibe-mesa.jpg" alt="Mesa montada da experiência, com flores e mimos" style="object-position:center 45%"><figcaption>Cada detalhe cuidado</figcaption></figure>
    </div>
    {foot("A vibe da experiência")}
  </section>'''

deck = '<div class="deck">\n' + cover + workshop + espacos + vibe + planos + planos_costura + como + '\n\n</div>\n\n'
head = head.replace("<title>Setembro Amarelo · Elarah</title>", "<title>Duas Oficinas Criativas · Turma privada · Elarah</title>")
head = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Proposta da Elarah — duas oficinas (Pintura Flores na Telinha e Costura Criativa) para turma privada no Jules, Betc ou Bake Studio.">', head)
head = head.replace("</head>",
    "<style>*{box-shadow:none!important;-webkit-box-shadow:none!important}"
    ".cover-photo{border:1px solid var(--line)}"
    ".plan-photo,.bfeat .bphoto,.vibe figure{border:1px solid var(--line)}"
    "</style>\n</head>")
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-duas-oficinas.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"))
