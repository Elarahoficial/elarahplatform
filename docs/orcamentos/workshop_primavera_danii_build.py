# Danii · Workshop de primavera no local · 15 pessoas · Jundiai · 2a/3a semana set · floral · R$239 todas. Rose-primavera.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

fonts = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/embedded_fonts_style.html", encoding="utf-8").read()
head = re.sub(r'<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>',
              fonts, head, count=1, flags=re.S)

# ---- recolor: rosa-primavera ----
head = head.replace("--orange:#F27623;", "--orange:#D97A8E;")
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#BE5C72;")
head = head.replace("--navy:#16233C;", "--navy:#3C2A33;")
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#6E5560;")
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#D97A8E;")
head = head.replace("#EDF1F7", "#FBF0F3").replace("#DCE5F1", "#F3DEE6")
head = head.replace("#FF9A4D", "#E6A9B6")
head = head.replace("rgba(242,118,35,.22)", "rgba(217,122,142,.26)")

extra = '''
  .menu{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:12px}
  .exp{position:relative;width:calc(33.333% - 11px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .exp .top{position:absolute;top:11px;left:11px;z-index:3;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 11px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(190,92,114,.4)}
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
  .pcard .pl{flex:1;padding:30px 34px 32px;display:flex;flex-direction:column;justify-content:center;background:#FBF0F3}
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
                    ".menu-cols{grid-template-columns:1fr 1fr}\n    .exp{width:calc(33.333% - 11px)}\n    .bfeat{flex-direction:column}\n    .bfeat .bphoto{width:100%;height:200px}\n    .pcard{flex-direction:column}\n    .pcard .pl .big{font-size:46px}")

def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'

def exp(n, img, name, desc, alt, pos="center 50%"):
    return f'<div class="exp"><div class="exp-photo"><img src="assets/{img}" alt="{alt}" style="object-position:{pos}"></div><div class="exp-body"><span class="n">{n}</span><h3>{name}</h3><p>{desc}</p></div></div>'

cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right">
        <span class="kicker">Workshop de primavera</span>
        <span class="compass">Primavera <span>Elarah</span><small>Workshop floral</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Workshop no local · Tema primavera</span>
        <h1>A primavera<br>feita à <em>mão</em></h1>
        <p class="lead">Um workshop criativo cheio de charme, direto no seu espaço 🌸 A Elarah leva tudo até você — <strong>profissional, material e estrutura</strong> — pra galera colocar a mão na massa, relaxar e levar pra casa a própria criação. É só escolher a experiência!</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>15</b> pessoas</span>
          <span class="chip"><b>2ª ou 3ª</b> sem. de setembro</span>
          <span class="chip"><b>Jundiaí</b> · no seu espaço</span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/buque.jpg" alt="Buquê de flores da primavera, delicado e cheio de charme" style="object-position:center 45%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Já realizado para times como <b>Compass</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)</div>
    {foot("Workshop de primavera")}
  </section>'''

experiencias = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">As experiências</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham a favorita</span>
    <h2>Cinco jeitos de <em>florir</em> o dia</h2>
    <p class="lead">Todas com a cara da primavera, delicadas e cheias de charme — e <strong>todas pelo mesmo valor por pessoa</strong>. A gente guia tudo do começo ao fim, e cada convidado leva a própria criação de recordação. 🌸</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","florseca.jpg","Arranjos florais","Cada um monta o próprio arranjo com flores da estação — delicado e cheio de vida.","Arranjos florais de primavera em papel kraft","center 45%")}
      {exp("02","buqueflor.jpg","Buquê &amp; home spray","Um buquê lindo pra montar e um home spray floral pra perfumar a casa.","Buquê de flores silvestres colorido","center 40%")}
      {exp("03","perfumariadecor.jpg","Perfumaria floral","Criar o próprio perfume com notas florais — uma fragrância única pra levar.","Mesa de perfumaria com essências e flores","center 45%")}
      {exp("04","aquarela1.jpg","Pintura floral","Pintar flores à mão em aquarela — delicado, artístico e cheio de charme.","Pintura de flores em aquarela sobre a mesa","center 50%")}
      {exp("05","velaflor.jpg","Vela &amp; flores secas","Uma vela aromática decorada com flores secas — cheirosa e cheia de charme.","Vela aromática com flores secas","center 50%")}
    </div>
    <div class="note" style="margin-top:14px">◆ Todas com o <b>mesmo valor por pessoa</b> — a escolha é da turma. Cada convidado leva pra casa a própria criação. 🌷</div>
    {foot("As experiências")}
  </section>'''

como = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Como funciona</span></div>
    </div>
    <span class="eyebrow orange">◆ A gente leva tudo até você</span>
    <h2>Workshop <em>no seu espaço</em></h2>
    <p class="lead">Você só reúne a galera — a Elarah cuida de todo o resto, do começo ao fim. É só escolher a experiência e a data. 🌸</p>
    <div class="rule"></div>
    <div class="bfeat">
      <div class="bphoto"><img src="assets/florseca.jpg" alt="Estrutura de workshop floral montada, com flores e materiais" style="object-position:center 50%"></div>
      <div class="bbody">
        <span class="btag">Workshop no local</span>
        <h3>Levamos tudo até você</h3>
        <span class="sub">Profissional · material · estrutura</span>
        <p>Um profissional da Elarah conduz a experiência, com todo o material e a estrutura montada no seu espaço em Jundiaí. A galera só chega, cria e se diverte — e no fim cada um leva a própria criação da primavera pra casa. 🌷</p>
      </div>
    </div>
    <div class="note" style="margin-top:14px">◆ Ideal para <b>15 pessoas</b>, na <b>2ª ou 3ª semana de setembro</b> (a combinar). A gente monta tudo antes da galera chegar — é só curtir. 🌸</div>
    {foot("Como funciona")}
  </section>'''

investimento = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ Um valor, todas as experiências</span>
    <h2>Simples <em>&amp;</em> transparente</h2>
    <p class="lead">Qualquer uma das cinco experiências florais tem o mesmo valor por pessoa — com tudo já incluso. É só escolher a favorita da turma. 🌸</p>
    <div class="rule"></div>
    <div class="pcard">
      <div class="pl">
        <span class="lab">Por pessoa</span>
        <span class="big">R$ 239</span>
        <span class="per">para grupos de 15 pessoas · workshop no local em Jundiaí</span>
      </div>
      <div class="pr">
        <h3>O que já vem incluso</h3>
        <ul>
          <li>A <b>experiência à escolha</b> — arranjos, buquê &amp; home spray, perfumaria, pintura ou vela com flores secas</li>
          <li><b>Profissional</b> da Elarah conduzindo tudo do começo ao fim</li>
          <li>Todo o <b>material</b> e a <b>estrutura</b> montada no seu espaço</li>
          <li>Cada convidado <b>leva pra casa</b> a própria criação de recordação</li>
        </ul>
      </div>
    </div>
    <div class="note" style="margin-top:14px">◆ Valor <b>por pessoa</b>, para grupos de cerca de 15 pessoas em Jundiaí. Todas as experiências pelo mesmo valor — a escolha é da turma. 🌷</div>
    {foot("Investimento")}
  </section>'''

contato = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Próximos passos &amp; contato</span></div>
    </div>
    <span class="eyebrow orange">◆ Simples e sob medida</span>
    <h2>É só <em>reunir a galera</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pra a primavera chegar leve e linda no seu espaço:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Escolham a experiência</h3><p>Arranjos, buquê &amp; home spray, perfumaria, pintura ou vela com flores secas — pelo mesmo valor.</p></div>
      <div class="step"><div class="num">2</div><h3>Combinamos a data</h3><p>2ª ou 3ª semana de setembro, no seu espaço em Jundiaí. A gente leva tudo até você.</p></div>
      <div class="step"><div class="num">3</div><h3>Criar &amp; levar</h3><p>No fim, todo mundo leva pra casa a própria criação — uma lembrança linda da primavera. 🌸</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Sob medida pro seu dia</h4>
        <p>A gente ajusta cada detalhe conforme o número de convidados e o clima que você quer pro workshop. É só combinar. 🌷</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora florir <em>a primavera?</em> ✦</h2>
      <p>Me confirma a experiência e a data (2ª ou 3ª semana de setembro), que a gente organiza tudo.</p>
      <div class="cta-actions">
        <a class="btn-wa" href="https://wa.me/5511914455930?text=Oi%2C%20Elarah!%20Vi%20a%20proposta%20do%20workshop%20de%20primavera%20e%20quero%20fechar%20os%20detalhes." target="_blank" rel="noopener">
          💬 Falar no WhatsApp
        </a>
        <div class="contact-links">
          <span>+55 (11) 91445-5930</span>
          <a href="https://instagram.com/elarah.oficial" target="_blank" rel="noopener">@elarah.oficial</a>
          <a href="https://elarah.com.br" target="_blank" rel="noopener">elarah.com.br</a>
        </div>
      </div>
    </div>
    <p class="fineprint">Proposta de workshop de primavera da Elarah — experiência à escolha (arranjos florais, buquê &amp; home spray, perfumaria floral, pintura floral ou vela aromática com flores secas, todas pelo mesmo valor), para cerca de 15 pessoas, na 2ª ou 3ª semana de setembro (a combinar), no espaço da cliente em Jundiaí. Workshop no local: a Elarah leva profissional, material e estrutura. Cada participante cria e leva a própria criação. Valor de R$ 239 por pessoa. Proposta válida mediante confirmação de data e disponibilidade de agenda.</p>
    {foot("Workshop de primavera · 2026")}
  </section>'''

deck = '<div class="deck">\n' + cover + experiencias + como + investimento + contato + '\n\n</div>\n\n'
head = head.replace("<title>Setembro Amarelo · Elarah</title>", "<title>Workshop de Primavera · Elarah</title>")
head = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Workshop de primavera da Elarah — experiências florais no seu espaço em Jundiaí.">', head)
head = head.replace("</head>",
    "<style>*{box-shadow:none!important;-webkit-box-shadow:none!important}"
    ".cover-photo{border:1px solid var(--line)}"
    ".bfeat .bphoto{border:1px solid var(--line)}"
    "</style>\n</head>")
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-primavera-danii.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"))
