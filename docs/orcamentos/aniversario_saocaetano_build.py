# Aniversário · 15 mulheres · 17/10 · salão do prédio (São Caetano). Colagem&bordado/Vela/Pintura em vidro (199) + Coquetelaria (399). Plum palette.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

fonts = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/embedded_fonts_style.html", encoding="utf-8").read()
head = re.sub(r'<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>',
              fonts, head, count=1, flags=re.S)

# ---- recolor: ameixa / aubergine (elegante, festivo) ----
head = head.replace("--orange:#F27623;", "--orange:#86527A;")
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#643C5A;")
head = head.replace("--navy:#16233C;", "--navy:#2A1E28;")
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#665560;")
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#86527A;")
head = head.replace("#EDF1F7", "#F4EEF2").replace("#DCE5F1", "#E7D7E3")
head = head.replace("#FF9A4D", "#B384A8")
head = head.replace("rgba(242,118,35,.22)", "rgba(134,82,122,.28)")

extra = '''
  .menu{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:12px}
  .exp{position:relative;width:calc(33.333% - 11px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .exp .top{position:absolute;top:11px;left:11px;z-index:3;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 11px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(100,60,90,.4)}
  .exp-photo{aspect-ratio:1/1;overflow:hidden;background:#eee}
  .exp-photo img{width:100%;height:100%;object-fit:cover}
  .exp-body{padding:12px 15px 15px}
  .exp .n{display:inline-block;font-size:9px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:5px}
  .exp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:16px;color:var(--navy);line-height:1.06}
  .exp p{font-size:11px;color:var(--muted);margin-top:5px;line-height:1.38}
  .infocard .ico svg{width:30px;height:30px;display:block}
  .itable{width:100%;border-collapse:collapse;margin-top:18px;font-family:'DM Sans'}
  .itable th,.itable td{padding:16px 12px;border-bottom:1px solid var(--line);text-align:center;vertical-align:middle}
  .itable thead th{font-size:12px;color:var(--navy);font-weight:700;border-bottom:2px solid var(--navy);text-transform:uppercase;letter-spacing:.04em}
  .itable thead th span{display:block;font-size:9.5px;font-weight:500;color:var(--muted);letter-spacing:.01em;margin-top:4px;text-transform:none}
  .itable td.rl{text-align:left;width:38%}
  .itable td.rl b{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--navy)}
  .itable td.rl span{display:block;font-size:10px;color:var(--muted);margin-top:3px;line-height:1.4}
  .itable .val{font-family:'DM Serif Display',serif;font-size:25px;color:var(--navy);line-height:1;white-space:nowrap}
  .itable .hl{background:#F0E4EC}
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
  .dchips span{background:#F0E4EC;border:1px solid var(--line);border-radius:999px;padding:6px 13px;font-size:11.5px;color:var(--navy);font-weight:600}
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
        <span class="kicker">Proposta de aniversário</span>
        <span class="compass">Aniversário <span>Elarah</span><small>Criar &amp; brindar</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Aniversário · A gente leva até vocês</span>
        <h1>Comemorar<br>entre <em>amigas</em></h1>
        <p class="lead">Um aniversário cheio de charme pra você e as amigas: uma experiência <strong>criativa e cheia de afeto</strong>, com direito a drinks e boas conversas — a gente <strong>leva tudo até o salão do seu prédio</strong>, em São Caetano. Cada uma cria e leva a própria peça. 🥂</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>15</b> mulheres</span>
          <span class="chip">Sábado · <b>17/10</b></span>
          <span class="chip">No <b>salão do prédio</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/aniv-adulto.jpg" alt="Amigas numa mesa decorada comemorando aniversário" style="object-position:center 40%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Já realizado para times como <b>Compass</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)</div>
    {foot("Aniversário · São Caetano")}
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
      {exp("01","colagemreal.jpg","Colagem &amp; bordado","Colagem e bordado com fotografia — recortes, pontos e fotos que viram uma obra afetiva.","Mãos recortando flores para uma colagem","center 40%")}
      {exp("02","velaaromatica.jpg","Vela aromática","Cada uma escolhe o aroma que ama e cria a própria vela. Cheirosa e cheia de charme.","Vela aromática artesanal","center 50%")}
      {exp("03","pinturatacanova.jpg","Pintura em vidro","Personalizar a própria taça ou peça de vidro — linda pra brindar e levar de recordação.","Taça de vidro pintada à mão com flores","center 50%")}
    </div>
    <div class="note" style="margin-top:14px">◆ As três têm o <b>mesmo valor por pessoa</b> — a escolha é da galera. Cada uma leva a própria criação de recordação. 🌸</div>
    {foot("As experiências")}
  </section>'''

coquetel = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Opção premium · drinks</span></div>
    </div>
    <span class="eyebrow orange">◆ Pra brindar em grande estilo</span>
    <h2>Coquetelaria <em>&amp; drinks</em></h2>
    <p class="lead">A opção mais festiva pra comemoração: um <strong>bar completo</strong> com bartender, pra galera aprender e degustar <strong>drinks à escolha</strong> a noite toda — com muito brinde e clima de celebração. 🍸</p>
    <div class="rule"></div>
    <div class="bfeat" style="height:240px">
      <div class="bphoto"><img src="assets/drinksclassicos.jpg" alt="Drink autoral servido numa coquetelaria" style="object-position:center 50%"></div>
      <div class="bbody">
        <span class="btag">★ Opção premium</span>
        <h3>Bar completo <span class="sub">com bartender</span></h3>
        <p>Um bartender conduz a experiência, preparando drinks autorais com a galera — vocês escolhem os coquetéis. Estrutura de bar, insumos e tudo o que precisa, direto no salão. 🥂</p>
        <div class="dchips">
          <span>A partir de R$ 399</span>
          <span>Drinks à escolha</span>
        </div>
      </div>
    </div>
    {foot("Coquetelaria &amp; drinks")}
  </section>'''

planos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Escolha o seu <em>combo</em></h2>
    <p class="lead">Valores por pessoa, com material, condução e o deslocamento até o salão do seu prédio inclusos — e cada uma sempre leva a própria criação. 🥂</p>
    <div class="rule"></div>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th>A experiência<span>material & condução</span></th>
        <th>Com foto<span>+ foto profissional</span></th>
        <th class="hl"><span class="pill">★ Completo</span><br>Completo<span>+ lembrancinha</span></th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="rl"><b>Experiências criativas</b><span>Colagem &amp; bordado · Vela · Pintura em vidro</span></td>
          <td class="val">R$ 199</td><td class="val">R$ 249</td><td class="val hl">R$ 349</td>
        </tr>
        <tr>
          <td class="rl"><b>Coquetelaria &amp; drinks</b><span>Bar completo · drinks à escolha</span></td>
          <td class="val">R$ 399</td><td class="val">R$ 449</td><td class="val hl">R$ 549</td>
        </tr>
      </tbody>
    </table>
    <div class="note" style="margin-top:16px">◆ Valores <b>por pessoa</b>, do pacote <b>só experiência</b> — o nível Com foto soma a foto profissional do evento e o Completo soma a lembrancinha personalizada. Dá pra montar também o <b>pacote completo com decoração &amp; comida</b> — me conta o que você imaginou que eu faço sob medida. Realizado no salão do seu prédio (São Caetano), em 17/10.</div>
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
    <p class="lead">Dois extras opcionais que deixam o aniversário ainda mais marcante — o registro profissional e a lembrancinha personalizada pra cada convidada.</p>
    <div class="rule"></div>
    <div class="plans">
      <div class="plan">
        <div class="plan-photo sq"><img src="assets/aniv-adulto.jpg" alt="Amigas felizes numa mesa decorada, registradas por um fotógrafo" style="object-position:center 40%"></div>
        <div class="plan-body">
          <h3>Foto profissional</h3>
          <span class="tag basic">Nível Com foto · + R$ 50</span>
          <ul class="feat">
            <li>Um fotógrafo cobre a festa inteira</li>
            <li>Cada risada e cada criação registradas</li>
            <li>Álbum digital lindo pra guardar de recordação</li>
          </ul>
          <span class="allin">Memória linda pra sempre</span>
        </div>
      </div>
      <div class="plan featured">
        <div class="plan-photo sq"><img src="assets/personaliza%C3%A7aobrindeescovapiranha.jpg" alt="Kit de lembrancinha personalizada com escova e piranha" style="object-position:center"></div>
        <div class="plan-body">
          <h3>Lembrancinha personalizada</h3>
          <span class="tag premium">★ Nível Completo · + R$ 100</span>
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
    <h2>A gente <em>vai até vocês</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pra o aniversário ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Escolham a experiência</h3><p>Colagem &amp; bordado, vela aromática, pintura em vidro ou a coquetelaria — a gente leva tudo pronto.</p></div>
      <div class="step"><div class="num">2</div><h3>A gente leva até vocês</h3><p>Montamos tudo no salão do seu prédio, em São Caetano. Sem preocupação — é só reunir as amigas.</p></div>
      <div class="step"><div class="num">3</div><h3>Criar, brindar &amp; levar</h3><p>No fim, todas levam pra casa a própria criação — uma lembrança linda do dia. 🥂</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Pacote completo, se quiser</h4>
        <p>Além da experiência, dá pra somar <b>decoração e comida</b> pra deixar tudo redondo. Me conta o que você imaginou que eu monto o orçamento sob medida. 🥂</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora comemorar <em>juntas?</em> ✦</h2>
      <p>Me confirma a experiência e se quer o pacote completo, que a gente organiza tudo pro dia 17/10.</p>
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
    <p class="fineprint">Proposta de aniversário da Elarah — experiência criativa à escolha (Colagem &amp; bordado com fotografia, Vela aromática ou Pintura em vidro, pelo mesmo valor) ou Coquetelaria &amp; drinks, para cerca de 15 pessoas, no sábado 17/10, no salão de festas do prédio em São Caetano do Sul. Cada participante cria e leva a própria peça. Pacote só experiência: Experiências criativas a partir de R$ 199 por pessoa (R$ 199 / 249 / 349); Coquetelaria &amp; drinks a partir de R$ 399 por pessoa (R$ 399 / 449 / 549) — em ambos, Com foto soma a foto profissional (+R$ 50) e o Completo soma a lembrancinha (+R$ 100). Pacote completo com decoração e comida sob consulta. Valores por pessoa, já com deslocamento incluso. Proposta válida mediante confirmação de data e disponibilidade de agenda.</p>
    {foot("Aniversário · São Caetano · 2026")}
  </section>'''

deck = '<div class="deck">\n' + cover + experiencias + coquetel + planos + personaliza + como + '\n\n</div>\n\n'
head = head.replace("<title>Setembro Amarelo · Elarah</title>", "<title>Aniversário · Criar &amp; Brindar · Elarah</title>")
head = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Proposta de aniversário da Elarah — colagem & bordado, vela, pintura em vidro ou coquetelaria, no salão do prédio em São Caetano.">', head)
head = head.replace("</head>",
    "<style>*{box-shadow:none!important;-webkit-box-shadow:none!important}"
    ".cover-photo{border:1px solid var(--line)}"
    ".plan-photo,.bfeat .bphoto{border:1px solid var(--line)}"
    "</style>\n</head>")
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-aniversario-saocaetano.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"))
