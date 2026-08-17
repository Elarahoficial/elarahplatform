# Turma privada · Sabonete Artesanal · 5 pessoas · fim de semana de setembro. 2 espaços (Jules/Sterna 239, Betc 289). Lavender palette.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

fonts = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/embedded_fonts_style.html", encoding="utf-8").read()
head = re.sub(r'<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>',
              fonts, head, count=1, flags=re.S)

# ---- recolor: lavanda (sensorial, botânico) ----
head = head.replace("--orange:#F27623;", "--orange:#8E7BB0;")
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#6E5C90;")
head = head.replace("--navy:#16233C;", "--navy:#2E2740;")
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#645A7A;")
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#8E7BB0;")
head = head.replace("#EDF1F7", "#F3EFF8").replace("#DCE5F1", "#E7DEF2")
head = head.replace("#FF9A4D", "#B9A6D6")
head = head.replace("rgba(242,118,35,.22)", "rgba(142,123,176,.28)")

extra = '''
  .menu{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:12px}
  .exp{position:relative;width:calc(33.333% - 11px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .menu.two{gap:24px}
  .menu.two .exp{width:calc(50% - 12px);max-width:340px}
  .menu.two .exp-photo{aspect-ratio:4/3}
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
  /* galeria vibe */
  .vibe{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
  .vibe figure{margin:0;border-radius:16px;overflow:hidden;position:relative;aspect-ratio:3/4;box-shadow:0 16px 36px -24px rgba(0,0,0,.34)}
  .vibe img{width:100%;height:100%;object-fit:cover;display:block}
  .vibe figcaption{position:absolute;left:0;right:0;bottom:0;padding:28px 14px 13px;color:#fff;font-size:12.5px;font-weight:600;background:linear-gradient(to top,rgba(35,28,45,.82),transparent)}
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
        <span class="kicker">Proposta de experiência · Turma privada</span>
        <span class="compass">Sabonete <span>artesanal</span><small>Turma privada</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência sensorial · Sabonete artesanal</span>
        <h1>Aroma, cor e <em>afeto</em></h1>
        <p class="lead">Uma tarde super sensorial pra turma: um <strong>workshop de sabonete artesanal</strong>, onde cada convidado cria os próprios sabonetes botânicos — do aroma à cor — e leva pra casa cheirosos de lembrança. Puro relax, entre boas conversas. 🧼</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>5</b> pessoas</span>
          <span class="chip">Fim de semana de <b>setembro</b></span>
          <span class="chip">Em <b>espaço parceiro</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/sabonete.jpg" alt="Cesta de sabonetes artesanais coloridos com lavanda numa experiência da Elarah" style="object-position:center 50%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Já realizado para times como <b>Compass</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)</div>
    {foot("Turma privada · Sabonete artesanal")}
  </section>'''

workshop = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O workshop</span></div>
    </div>
    <span class="eyebrow orange">◆ Sabonete artesanal</span>
    <h2>Criar com as <em>mãos</em></h2>
    <p class="lead">Do zero: cada convidado escolhe aromas, cores e botânicos e cria os próprios sabonetes, guiado do começo ao fim. Sensorial, relaxante e cheio de charme. A gente leva o profissional, todo o material e a estrutura. 🧼</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","saboneteroxo.jpg","Escolha aromas & cores","Lavanda, camomila, cítricos... cada um monta a combinação que mais gosta.","Sabonetes artesanais de lavanda e camomila","center 50%")}
      {exp("02","sabonete3.jpg","Do seu jeito","Botânicos, flores e texturas — cada sabonete sai único, com a cara de quem criou.","Sabonete artesanal rosa com botões de rosa","center 50%")}
      {exp("03","sabonete4.jpg","Leve pra casa","Cada convidado leva pra casa os próprios sabonetes cheirosos de recordação.","Sabonetes artesanais embalados como lembrancinha","center 50%")}
    </div>
    <div class="note" style="margin-top:14px">◆ Sem precisar de experiência nenhuma — é só chegar e criar. Cada um leva os próprios sabonetes. 🧼</div>
    {foot("O workshop")}
  </section>'''

espacos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Onde acontece</span></div>
    </div>
    <span class="eyebrow orange">◆ Duas opções de espaço</span>
    <h2>Escolha o <em>cenário</em></h2>
    <p class="lead">Duas opções de espaço lindas, cada uma com seu charme e seu valor por pessoa. É só escolher qual combina mais com a turma — do café arejado ao lounge criativo. 🧼</p>
    <div class="rule"></div>
    <div class="menu two">
      {exp("Opção 1","julescampobelo.jpg","Jules · Sterna","Cafés charmosos e arejados (Jules · Campo Belo ou Sterna Café), com mesas de madeira e muito verde. Consumo à parte.","Café Jules em Campo Belo com mesas de madeira e guarda-sóis","center 60%",top="R$ 239")}
      {exp("Opção 2","betchavas2.jpg","Betc Havas Café","Moderno e cheio de charme — já vem com <b>R$ 50 de consumação</b> inclusos.","Interior moderno do Betc Havas Café","center 55%",top="R$ 289")}
    </div>
    <div class="note" style="margin-top:14px">◆ Valor <b>por pessoa</b>, com material e condução do profissional inclusos — cada um cria e leva os próprios sabonetes. No <b>Jules/Sterna</b> o consumo é à parte; o <b>Betc</b> já vem com R$ 50 de consumação inclusos. Fim de semana de setembro a confirmar. 🧼</div>
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
    <p class="lead">Valor por pessoa, com material e condução inclusos — e cada um sempre leva a própria peça. É só escolher o espaço e o nível que mais combinam com a turma. 🌿</p>
    <div class="rule"></div>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th>A experiência<span>material & condução</span></th>
        <th>Com foto<span>+ foto profissional · +R$ 50</span></th>
        <th class="hl"><span class="pill">★ Completo</span><br>Completo<span>+ lembrancinha · +R$ 100</span></th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="rl"><b>Jules · Campo Belo</b><span>consumo à parte</span></td>
          <td class="val">R$ 199</td><td class="val">R$ 249</td><td class="val hl">R$ 349</td>
        </tr>
        <tr>
          <td class="rl"><b>Betc Havas Café</b><span>R$ 50 de consumação inclusos</span></td>
          <td class="val">R$ 249</td><td class="val">R$ 299</td><td class="val hl">R$ 399</td>
        </tr>
        <tr>
          <td class="rl"><b>Bake Studio</b><span>espaço exclusivo · cozinha &amp; sala</span></td>
          <td class="val">R$ 499</td><td class="val">R$ 549</td><td class="val hl">R$ 649</td>
        </tr>
      </tbody>
    </table>
    <div class="note" style="margin-top:16px">◆ Valor <b>por pessoa</b>, com material e condução inclusos, na experiência de modelagem em cerâmica. O nível <b>Com foto</b> soma a foto profissional (+R$ 50) e o <b>Completo</b> soma a lembrancinha (+R$ 100). No <b>Jules</b> o consumo é à parte; o <b>Betc</b> já inclui R$ 50 de consumação; o <b>Bake Studio</b> é espaço exclusivo (cozinha &amp; sala). Data 23/08 a confirmar.</div>
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
    <p class="lead">Dois extras opcionais que deixam o encontro ainda mais marcante — o registro profissional com voucher e a lembrancinha personalizada pra cada um.</p>
    <div class="rule"></div>
    <div class="plans">
      <div class="plan">
        <div class="plan-photo sq"><img src="assets/perfumariaapresenta%C3%A7%C3%A3o.jpg" alt="Amigas na mesa numa experiência da Elarah, registradas por um fotógrafo" style="object-position:center 40%"></div>
        <div class="plan-body">
          <h3>Foto profissional</h3>
          <span class="tag basic">Nível Com foto · + R$ 50</span>
          <ul class="feat">
            <li>Um fotógrafo cobre o encontro inteiro</li>
            <li>Cada risada e cada peça registradas</li>
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
      <div class="step"><div class="num">1</div><h3>Escolham o espaço</h3><p>Jules, Sterna ou o Betc Havas Café — a gente reserva pra sua turma num fim de semana de setembro.</p></div>
      <div class="step"><div class="num">2</div><h3>A gente leva tudo</h3><p>Profissional, aromas, botânicos e toda a estrutura do workshop. Vocês só chegam e criam.</p></div>
      <div class="step"><div class="num">3</div><h3>Cada um leva o seu</h3><p>Todo mundo leva pra casa os próprios sabonetes cheirosos — uma lembrança linda do dia. 🧼</p></div>
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
      <p>Me confirma o espaço e o fim de semana de setembro que vocês preferem, que a gente reserva e organiza tudo.</p>
      <div class="cta-actions">
        <a class="btn-wa" href="https://wa.me/5511914455930?text=Oi%2C%20Elarah!%20Vi%20a%20proposta%20do%20workshop%20de%20sabonete%20artesanal%20e%20quero%20fechar." target="_blank" rel="noopener">
          💬 Falar no WhatsApp
        </a>
        <div class="contact-links">
          <span>+55 (11) 91445-5930</span>
          <a href="https://instagram.com/elarah.oficial" target="_blank" rel="noopener">@elarah.oficial</a>
          <a href="https://elarah.com.br" target="_blank" rel="noopener">elarah.com.br</a>
        </div>
      </div>
    </div>
    <p class="fineprint">Proposta de experiência da Elarah para turma privada — workshop de sabonete artesanal, para 5 pessoas, em um fim de semana de setembro (a confirmar), em espaço parceiro. Cada convidado cria e leva os próprios sabonetes, com material e condução do profissional inclusos. Duas opções de espaço, por pessoa: Jules ou Sterna Café (consumo à parte) a partir de R$ 239; Betc Havas Café (R$ 50 de consumação inclusos) R$ 289. Valores por pessoa. Proposta válida mediante confirmação de data e disponibilidade de agenda.</p>
    {foot("Turma privada · Sabonete artesanal · 2026")}
  </section>'''

vibe = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">A vibe</span></div>
    </div>
    <span class="eyebrow orange">◆ O que vocês vão sentir</span>
    <h2>Aroma, risada e <em>relax</em></h2>
    <p class="lead">Mais que uma atividade: uma tarde leve, sensorial e cheia de fotos boas — e cada convidado ainda leva pra casa os próprios sabonetes cheirosos de lembrança. 🧼</p>
    <div class="vibe">
      <figure><img src="assets/desp-hero2.jpg" alt="Amigas se abraçando e rindo numa experiência Elarah" style="object-position:center 22%"><figcaption>Juntas, do início ao fim</figcaption></figure>
      <figure><img src="assets/corp-criativo.jpg" alt="Convidadas criando lado a lado" style="object-position:center 35%"><figcaption>Mão na massa, junto</figcaption></figure>
      <figure><img src="assets/sabonete4.jpg" alt="Sabonetes artesanais embalados para levar pra casa" style="object-position:center 50%"><figcaption>O cheirinho pra levar</figcaption></figure>
    </div>
    {foot("A vibe da experiência")}
  </section>'''

deck = '<div class="deck">\n' + cover + workshop + vibe + espacos + como + '\n\n</div>\n\n'
head = head.replace("<title>Setembro Amarelo · Elarah</title>", "<title>Sabonete Artesanal · Turma privada · Elarah</title>")
head = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Proposta da Elarah — workshop de sabonete artesanal para turma privada, no Jules, Sterna ou no Betc Havas Café.">', head)
head = head.replace("</head>",
    "<style>*{box-shadow:none!important;-webkit-box-shadow:none!important}"
    ".cover-photo{border:1px solid var(--line)}"
    ".plan-photo,.bfeat .bphoto{border:1px solid var(--line)}"
    ".vibe figure{border:1px solid var(--line)}"
    "</style>\n</head>")
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-turma-sabonete.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"))
