# Danii · Workshop de primavera no local · 15 pessoas · Jundiai · 2a/3a semana set · floral · R$239 todas. Rose-primavera.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

fonts = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/embedded_fonts_style.html", encoding="utf-8").read()
head = re.sub(r'<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>',
              fonts, head, count=1, flags=re.S)

# ---- recolor: páprica-terracota (gastronomia) ----
head = head.replace("--orange:#F27623;", "--orange:#B15641;")
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#8E3F2E;")
head = head.replace("--navy:#16233C;", "--navy:#2B1B17;")
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#61483F;")
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#B15641;")
head = head.replace("#EDF1F7", "#F7EEEA").replace("#DCE5F1", "#EEDBD3")
head = head.replace("#FF9A4D", "#D3927E")
head = head.replace("rgba(242,118,35,.22)", "rgba(177,86,65,.26)")

extra = '''
  .menu{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:12px}
  .exp{position:relative;width:calc(33.333% - 11px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .exp .top{position:absolute;top:11px;left:11px;z-index:3;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 11px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(142,63,46,.4)}
  .exp-photo{aspect-ratio:16/11;overflow:hidden;background:#eee}
  .exp-photo img{width:100%;height:100%;object-fit:cover}
  .exp-body{padding:13px 15px 16px}
  .exp .n{display:inline-block;font-size:9px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:5px}
  .exp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--navy);line-height:1.05}
  .exp p{font-size:11px;color:var(--muted);margin-top:5px;line-height:1.42}
  /* como funciona no local */
  .bfeat{display:flex;margin-top:16px;background:var(--card);border:1.6px solid var(--orange);border-radius:18px;overflow:hidden;box-shadow:0 18px 42px -24px rgba(0,0,0,.34)}
  .bfeat .bphoto{width:42%;overflow:hidden;background:#eee}
  .bfeat .bphoto img{width:100%;height:100%;object-fit:cover;display:block}
  .bfeat .bbody{flex:1;padding:22px 28px 24px;display:flex;flex-direction:column;justify-content:center}
  .bfeat .btag{align-self:flex-start;background:var(--navy);color:#fff;font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:6px 13px;border-radius:999px;margin-bottom:11px}
  .bfeat h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:23px;color:var(--navy);line-height:1.02}
  .bfeat .sub{display:inline-block;font-size:10px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-top:5px}
  .bfeat p{font-size:12px;color:var(--muted);margin-top:10px;line-height:1.5}
  /* preco unico */
  .pcard{margin-top:16px;background:var(--card);border:1.8px solid var(--orange);border-radius:22px;overflow:hidden;box-shadow:0 20px 46px -26px rgba(0,0,0,.36);display:flex}
  .pcard .pl{flex:1;padding:30px 34px 32px;display:flex;flex-direction:column;justify-content:center;background:#F7EEEA}
  .pcard .pl .lab{display:inline-block;font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:8px}
  .pcard .pl .big{font-family:'DM Serif Display',serif;font-weight:400;font-size:58px;color:var(--navy);line-height:.95}
  .pcard .pl .per{font-size:13px;color:var(--muted);margin-top:8px}
  .pcard .pr{flex:1.15;padding:26px 32px 28px}
  .pcard .pr h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:20px;color:var(--navy);margin-bottom:12px}
  .pcard .pr ul{list-style:none;padding:0;margin:0}
  .pcard .pr li{position:relative;padding-left:24px;font-size:12.5px;color:var(--navy);line-height:1.4;margin-bottom:11px}
  .pcard .pr li:before{content:"\\2726";position:absolute;left:0;top:0;color:var(--orange);font-size:13px}
  .pcard .pr li b{font-weight:700}
</style>'''
head = head.replace("</style>", extra, 1)
head = head.replace(".menu-cols{grid-template-columns:1fr 1fr}",
                    ".menu-cols{grid-template-columns:1fr 1fr}\n    .exp{width:calc(33.333% - 11px)}\n    .bfeat{flex-direction:column}\n    .bfeat .bphoto{width:100%;height:auto;aspect-ratio:4/3}\n    .pcard{flex-direction:column}\n    .pcard .pl .big{font-size:46px}")

def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'

def exp(n, img, name, desc, alt, pos="center 50%"):
    return f'<div class="exp"><div class="exp-photo"><img src="assets/{img}" alt="{alt}" style="object-position:{pos}"></div><div class="exp-body"><span class="n">{n}</span><h3>{name}</h3><p>{desc}</p></div></div>'

cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right">
        <span class="kicker">Experiência gastronômica</span>
        <span class="compass">Cozinha <span>Elarah</span><small>Aula &amp; competição</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Aula gastronômica &amp; competição · Bake Studio</span>
        <h1>Mão na massa,<br>clima de <em>disputa</em></h1>
        <p class="lead">Uma experiência gastronômica cheia de energia: uma <strong>aula-competição</strong> estilo MasterChef, onde a turma se divide, coloca a mão na massa e prepara um menu completo — entrada, principal e sobremesa. Puro clima de disputa, risada e sabor. 👨‍🍳🔥</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>Aula</b> + competição</span>
          <span class="chip"><b>3 pratos</b> · menu completo</span>
          <span class="chip"><b>Bake Studio</b> · só de vocês</span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/corp-grupo.jpg" alt="Grupo de avental cozinhando junto numa aula-competição de gastronomia" style="object-position:center 40%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Já realizado para times como <b>Compass</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)</div>
    {foot("Aula gastronômica &amp; competição")}
  </section>'''

experiencias = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O menu</span></div>
    </div>
    <span class="eyebrow orange">◆ Um menu completo pra preparar</span>
    <h2>Três pratos, <em>uma disputa</em></h2>
    <p class="lead">A turma coloca a mão na massa e prepara, do zero, um menu de três tempos — com um chef guiando cada etapa. No fim, é hora do júri provar e eleger o melhor prato! 👨‍🍳</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("Entrada","prato-quiche.jpg","Quiche Lorraine","O clássico francês de massa amanteigada com bacon e queijo — pra abrir a disputa com charme.","Quiche Lorraine dourada e apetitosa","center 50%")}
      {exp("Principal","prato-risoto.jpg","Risoto bianco com ragu","Um risoto cremoso e sofisticado, coroado com um ragu encorpado — o prato principal da competição.","Risoto cremoso servido no prato","center 50%")}
      {exp("Sobremesa","prato-bavaroise.jpg","Bavaroise de café","Uma bavaroise de café com coulis de frutas amarelas — o toque doce e elegante do menu.","Bavaroise de café decorada com grãos","center 50%")}
    </div>
    <div class="note" style="margin-top:14px">◆ Menu completo — <b>entrada, principal e sobremesa</b> — preparado pela turma, com um chef conduzindo tudo. No fim, o júri prova e elege o time campeão! 🏆</div>
    {foot("O menu")}
  </section>'''

como = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Onde acontece</span></div>
    </div>
    <span class="eyebrow orange">◆ O espaço da experiência</span>
    <h2>No <em>Bake Studio</em></h2>
    <p class="lead">Um estúdio completo com cozinha equipada e sala, reservado só pra vocês — o cenário perfeito pra colocar o avental e entrar no clima da competição. 🔪</p>
    <div class="rule"></div>
    <div style="display:flex;gap:14px;margin-top:16px">
      <div style="flex:1;background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:0 14px 30px -22px rgba(0,0,0,.3)">
        <div style="aspect-ratio:4/3;overflow:hidden;background:#eee"><img src="assets/espa%C3%A7o2.jpg" alt="Cozinha equipada do Bake Studio" style="width:100%;height:100%;object-fit:cover;object-position:center 45%"></div>
        <div style="padding:14px 17px 16px"><span style="display:inline-block;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:4px 11px;border-radius:999px;margin-bottom:8px">A cozinha</span><h3 style="font-family:'DM Serif Display',serif;font-weight:400;font-size:19px;color:var(--navy);line-height:1.05">Cozinha equipada</h3><p style="font-size:11.5px;color:var(--muted);margin-top:6px;line-height:1.45">Bancada, forno e tudo o que a turma precisa pra colocar a mão na massa e preparar o menu completo.</p></div>
      </div>
      <div style="flex:1;background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:0 14px 30px -22px rgba(0,0,0,.3)">
        <div style="aspect-ratio:4/3;overflow:hidden;background:#eee"><img src="assets/espaco1.jpg" alt="Sala aconchegante do Bake Studio" style="width:100%;height:100%;object-fit:cover;object-position:center 50%"></div>
        <div style="padding:14px 17px 16px"><span style="display:inline-block;background:var(--navy);color:#fff;font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:4px 11px;border-radius:999px;margin-bottom:8px">A sala</span><h3 style="font-family:'DM Serif Display',serif;font-weight:400;font-size:19px;color:var(--navy);line-height:1.05">Sala aconchegante</h3><p style="font-size:11.5px;color:var(--muted);margin-top:6px;line-height:1.45">Um espaço lindo pra relaxar, disputar e saborear o resultado — tudo só de vocês.</p></div>
      </div>
    </div>
    <div class="note" style="margin-top:14px">◆ Espaço <b>privado e completo</b> só de vocês, com cozinha e sala — o cenário ideal pra aula-competição. 🏆</div>
    {foot("Onde acontece")}
  </section>'''

investimento = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ Tudo incluso, num valor só</span>
    <h2>Experiência <em>completa</em></h2>
    <p class="lead">O menu de três tempos, a aula-competição e o espaço privado do Bake Studio — tudo já incluso num valor por pessoa. É só reunir a turma. 👨‍🍳</p>
    <div class="rule"></div>
    <div class="pcard">
      <div class="pl">
        <span class="lab">Por pessoa</span>
        <span class="big">R$ 489</span>
        <span class="per">com o espaço privado do Bake Studio incluso</span>
      </div>
      <div class="pr">
        <h3>O que já vem incluso</h3>
        <ul>
          <li>O <b>menu completo</b> — Quiche Lorraine, risoto bianco com ragu &amp; bavaroise de café</li>
          <li>A <b>aula-competição</b> conduzida por um chef, do começo ao fim</li>
          <li>O <b>Bake Studio</b> reservado só pra vocês — cozinha equipada &amp; sala</li>
          <li>Todos os <b>ingredientes, material e estrutura</b> da experiência</li>
        </ul>
      </div>
    </div>
    <div class="note" style="margin-top:14px">◆ Valor <b>por pessoa</b>, com os três pratos, a competição e o espaço privado do Bake Studio inclusos. É só combinar a data e o número de convidados. 🏆</div>
    {foot("Investimento")}
  </section>'''

contato = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Próximos passos &amp; contato</span></div>
    </div>
    <span class="eyebrow orange">◆ Simples e sob medida</span>
    <h2>É só <em>reunir a turma</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pra a experiência ser inesquecível do começo ao fim:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Reúnam a turma</h3><p>A gente divide o grupo em times pra aula-competição estilo MasterChef, com um chef guiando tudo.</p></div>
      <div class="step"><div class="num">2</div><h3>Mão na massa</h3><p>Cada time prepara o menu de três tempos no Bake Studio — cozinha equipada e sala só de vocês.</p></div>
      <div class="step"><div class="num">3</div><h3>Provar &amp; premiar</h3><p>No fim, o júri prova os pratos e elege o time campeão — pura diversão e sabor. 🏆</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Sob medida pro seu dia</h4>
        <p>A gente ajusta cada detalhe conforme o número de convidados e o clima que você quer pra experiência. É só combinar. 👨‍🍳</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora <em>disputar na cozinha?</em> ✦</h2>
      <p>Me confirma o número de convidados e a data, que a gente reserva o Bake Studio e organiza tudo.</p>
      <div class="cta-actions">
        <a class="btn-wa" href="https://wa.me/5511914455930?text=Oi%2C%20Elarah!%20Vi%20a%20proposta%20da%20aula%20gastron%C3%B4mica%20com%20competi%C3%A7%C3%A3o%20e%20quero%20fechar%20os%20detalhes." target="_blank" rel="noopener">
          💬 Falar no WhatsApp
        </a>
        <div class="contact-links">
          <span>+55 (11) 91445-5930</span>
          <a href="https://instagram.com/elarah.oficial" target="_blank" rel="noopener">@elarah.oficial</a>
          <a href="https://elarah.com.br" target="_blank" rel="noopener">elarah.com.br</a>
        </div>
      </div>
    </div>
    <p class="fineprint">Proposta de experiência gastronômica da Elarah — aula-competição estilo MasterChef, no Bake Studio (espaço privado com cozinha equipada e sala, exclusivo para o grupo). A turma prepara um menu completo de três tempos: entrada (Quiche Lorraine), prato principal (risoto bianco com ragu) e sobremesa (bavaroise de café com coulis de frutas amarelas), com um chef conduzindo tudo, e um júri final elegendo o time campeão. Valor de R$ 489 por pessoa, incluindo os três pratos, a competição e o espaço privado do Bake Studio. Número de convidados e data a combinar. Proposta válida mediante confirmação de data e disponibilidade de agenda.</p>
    {foot("Aula gastronômica &amp; competição · 2026")}
  </section>'''

deck = '<div class="deck">\n' + cover + experiencias + como + investimento + contato + '\n\n</div>\n\n'
head = head.replace("<title>Setembro Amarelo · Elarah</title>", "<title>Aula Gastronômica &amp; Competição · Bake Studio · Elarah</title>")
head = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Aula gastronômica com competição da Elarah — menu de três tempos no Bake Studio.">', head)
head = head.replace("</head>",
    "<style>*{box-shadow:none!important;-webkit-box-shadow:none!important}"
    ".cover-photo{border:1px solid var(--line)}"
    ".bfeat .bphoto{border:1px solid var(--line)}"
    "</style>\n</head>")
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-gastronomica-competicao.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"))
