# Despedida · Pintura ou Cerâmica · 15 pessoas · SP · domingo out/nov. Café (199/299/399) + Bake Studio (289/389/539). Wine-rose.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

fonts = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/embedded_fonts_style.html", encoding="utf-8").read()
head = re.sub(r'<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>',
              fonts, head, count=1, flags=re.S)

# ---- recolor: vinho-rosé (despedida) ----
head = head.replace("--orange:#F27623;", "--orange:#B05670;")
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#8A3A54;")
head = head.replace("--navy:#16233C;", "--navy:#33222A;")
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#6E555D;")
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#B05670;")
head = head.replace("#EDF1F7", "#F8EEF1").replace("#DCE5F1", "#EFDAE1")
head = head.replace("#FF9A4D", "#CE8B9C")
head = head.replace("rgba(242,118,35,.22)", "rgba(176,86,112,.28)")

extra = '''
  .menu{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:12px}
  .exp{position:relative;width:calc(50% - 8px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .exp .top{position:absolute;top:11px;left:11px;z-index:3;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 11px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(138,58,84,.4)}
  .exp-photo{aspect-ratio:16/10;overflow:hidden;background:#eee}
  .exp-photo img{width:100%;height:100%;object-fit:cover}
  .exp-body{padding:14px 18px 17px}
  .exp .n{display:inline-block;font-size:9px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:5px}
  .exp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:20px;color:var(--navy);line-height:1.05}
  .exp p{font-size:12px;color:var(--muted);margin-top:5px;line-height:1.42}
  .itable{width:100%;border-collapse:collapse;margin-top:16px;font-family:'DM Sans'}
  .itable th,.itable td{padding:15px 11px;border-bottom:1px solid var(--line);text-align:center;vertical-align:middle}
  .itable thead th{font-size:11.5px;color:var(--navy);font-weight:700;border-bottom:2px solid var(--navy);text-transform:uppercase;letter-spacing:.03em}
  .itable thead th span{display:block;font-size:9px;font-weight:500;color:var(--muted);letter-spacing:.01em;margin-top:4px;text-transform:none;line-height:1.3}
  .itable td.rl{text-align:left;width:32%}
  .itable td.rl b{font-family:'DM Serif Display',serif;font-weight:400;font-size:16px;color:var(--navy)}
  .itable td.rl span{display:block;font-size:9.5px;color:var(--muted);margin-top:3px;line-height:1.35}
  .itable .val{font-family:'DM Serif Display',serif;font-size:23px;color:var(--navy);line-height:1;white-space:nowrap}
  .itable .hl{background:#F5E4EA}
  .itable thead th.hl{color:var(--orange-dark)}
  .itable tbody tr:last-child td{border-bottom:none}
  .itable .pill{display:inline-block;background:var(--navy);color:#fff;font-size:8px;letter-spacing:.07em;padding:3px 9px;border-radius:999px;margin-bottom:6px;font-weight:700;text-transform:uppercase}
  .bfeat{display:flex;margin-top:16px;background:var(--card);border:1.6px solid var(--orange);border-radius:18px;overflow:hidden;box-shadow:0 18px 42px -24px rgba(0,0,0,.34)}
  .bfeat.plain{border:1px solid var(--line)}
  .bfeat .bphoto{width:40%;overflow:hidden;background:#eee}
  .bfeat .bphoto img{width:100%;height:100%;object-fit:cover;display:block}
  .bfeat .bbody{flex:1;padding:20px 26px 22px;display:flex;flex-direction:column;justify-content:center}
  .bfeat .btag{align-self:flex-start;background:var(--navy);color:#fff;font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:6px 13px;border-radius:999px;margin-bottom:11px}
  .bfeat .btag.soft{background:var(--orange)}
  .bfeat h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:22px;color:var(--navy);line-height:1.02}
  .bfeat .sub{display:inline-block;font-size:10px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-top:5px}
  .bfeat p{font-size:12px;color:var(--muted);margin-top:9px;line-height:1.45}
</style>'''
head = head.replace("</style>", extra, 1)
head = head.replace(".menu-cols{grid-template-columns:1fr 1fr}",
                    ".menu-cols{grid-template-columns:1fr 1fr}\n    .bfeat{flex-direction:row}\n    .bfeat .bphoto{width:40%;height:auto}\n    .bfeat .bbody{padding:16px 22px 17px}\n    .bfeat h3{font-size:19px}\n    .bfeat p{font-size:11px;margin-top:7px}")
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
        <span class="eyebrow">✦ Despedida de solteira · Pintura ou Cerâmica</span>
        <h1>A última<br>de <em>solteira</em></h1>
        <p class="lead">Uma despedida leve e cheia de charme pra noiva e as amigas: uma <strong>oficina criativa</strong> — pintura ou cerâmica — pra colocar a mão na massa, brindar e rir muito. Ninguém precisa saber criar, e cada uma leva a própria peça. 🍷</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>15</b> pessoas</span>
          <span class="chip">Domingo · <b>out/nov</b></span>
          <span class="chip">Em <b>SP</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/desp-hero3.jpg" alt="Grupo de amigas comemorando animadas numa despedida" style="object-position:center 30%">
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
    <h2>Pintura <em>ou</em> cerâmica</h2>
    <p class="lead">Duas oficinas criativas e descomplicadas pra escolher — <strong>pelo mesmo valor por pessoa</strong>. A gente guia tudo do começo ao fim, e cada uma leva a própria peça de recordação. 🍷</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","pinturatacameninas.jpg","Pintura em taça","Cada uma personaliza a própria taça — linda pra brindar e levar de recordação.","Amigas pintando as próprias taças de vidro","center 40%")}
      {exp("02","ceramicamodelagem.jpg","Cerâmica","Modelar a argila à mão e criar uma peça única — relaxante e cheio de charme.","Mãos modelando uma peça de cerâmica","center 50%")}
    </div>
    <div class="note" style="margin-top:14px">◆ As duas têm o <b>mesmo valor por pessoa</b> — a escolha é da galera. Cada uma leva a própria criação de recordação. 🎨</div>
    {foot("As experiências")}
  </section>'''

espacos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Onde acontece</span></div>
    </div>
    <span class="eyebrow orange">◆ Duas opções de espaço</span>
    <h2>Numa cafeteria <em>ou</em> no estúdio</h2>
    <p class="lead">Dá pra fazer numa cafeteria parceira charmosa (Jules ou Betc Havas) ou reservar o Bake Studio, um estúdio exclusivo só da turma. É só escolher qual combina mais com a despedida. 🍷</p>
    <div class="rule"></div>
    <div class="bfeat plain" style="height:206px">
      <div class="bphoto"><img src="assets/julescampobelo.jpg" alt="Cafeteria parceira charmosa e arejada" style="object-position:center 60%"></div>
      <div class="bbody">
        <span class="btag soft">Opção 1 · a partir de R$ 199</span>
        <h3>Jules ou Betc Havas <span class="sub">cafeterias parceiras</span></h3>
        <p>Cafeterias modernas e cheias de charme. No <b>Betc Havas</b> o nível com foto já vem com <b>R$ 50 de voucher</b> de consumo. ☕</p>
      </div>
    </div>
    <div class="bfeat" style="margin-top:15px;height:206px">
      <div class="bphoto"><img src="assets/espaco1.jpg" alt="Lounge acolhedor do Bake Studio na Bela Vista" style="object-position:center 55%"></div>
      <div class="bbody">
        <span class="btag">★ Opção 2 · a partir de R$ 289</span>
        <h3>Bake Studio <span class="sub">Bela Vista · exclusivo</span></h3>
        <p>Um estúdio charmoso <b>só de vocês</b> — experiência + espaço reservado, com liberdade pra decorar. Já vem com coffee break nos níveis completos. 🌿</p>
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
    <p class="lead">Valores por pessoa, com material e condução inclusos — e cada uma sempre leva a própria peça. É só escolher o espaço e o nível que mais combinam com a despedida. 🍷</p>
    <div class="rule"></div>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th>A experiência<span>material & condução</span></th>
        <th>Com foto<span>+ foto profissional</span></th>
        <th class="hl"><span class="pill">★ Completo</span><br>Completo<span>nível mais completo</span></th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="rl"><b>Café · Jules ou Betc Havas</b><span>R$ 50 de voucher no Betc</span></td>
          <td class="val">R$ 199</td><td class="val">R$ 299</td><td class="val hl">R$ 399</td>
        </tr>
        <tr>
          <td class="rl"><b>Bake Studio</b><span>espaço exclusivo · experiência + espaço só de vocês</span></td>
          <td class="val">R$ 289</td><td class="val">R$ 389</td><td class="val hl">R$ 539</td>
        </tr>
      </tbody>
    </table>
    <div class="note" style="margin-top:14px">◆ Valores <b>por pessoa</b>, com material e condução inclusos. No <b>café</b>, o nível Com foto soma a foto profissional (e R$ 50 de voucher de consumo no Betc Havas) e o Completo soma a lembrancinha. No <b>Bake Studio</b> (espaço só de vocês), o Com foto soma a foto profissional e um <b>coffee break</b>, e o Completo vem com <b>decoração &amp; lembrancinha</b>. Domingo de outubro ou novembro a combinar.</div>
    {foot("Investimento")}
  </section>'''

personaliza = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Nos níveis completos</span></div>
    </div>
    <span class="eyebrow orange">◆ Os mimos que já vêm inclusos</span>
    <h2>Foto <em>&amp;</em> lembrancinha</h2>
    <p class="lead">A partir do nível com foto, a despedida ganha o registro profissional e a lembrancinha personalizada pra cada convidada — dois mimos pra deixar tudo ainda mais especial.</p>
    <div class="rule"></div>
    <div class="plans">
      <div class="plan">
        <div class="plan-photo sq"><img src="assets/desp-hero2.jpg" alt="Amigas se abraçando e brindando numa despedida, registradas por um fotógrafo" style="object-position:center 30%"></div>
        <div class="plan-body">
          <h3>Foto profissional</h3>
          <span class="tag basic">Registro do evento</span>
          <ul class="feat">
            <li>Um fotógrafo cobre a despedida inteira</li>
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
          <span class="tag premium">★ Um mimo a mais</span>
          <ul class="feat">
            <li>Kit com <b>escova &amp; piranha</b> pra cada convidada</li>
            <li>Personalizado com o nome de cada uma</li>
            <li>Um mimo pra levarem da despedida pra casa</li>
          </ul>
          <span class="allin">Cada uma leva o seu mimo</span>
        </div>
      </div>
    </div>
    {foot("Os mimos inclusos")}
  </section>'''

como = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Como funciona &amp; contato</span></div>
    </div>
    <span class="eyebrow orange">◆ Simples e sob medida</span>
    <h2>É só <em>reunir as amigas</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pra a despedida ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Escolham a experiência</h3><p>Pintura ou cerâmica — pelo mesmo valor. A gente leva profissional, material e estrutura.</p></div>
      <div class="step"><div class="num">2</div><h3>Escolham o espaço</h3><p>Cafeteria parceira (Jules ou Betc Havas) ou o Bake Studio exclusivo só de vocês.</p></div>
      <div class="step"><div class="num">3</div><h3>Criar, brindar &amp; levar</h3><p>No fim, todas levam pra casa a própria peça — uma lembrança linda da despedida. 🍷</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Sob medida pra noiva</h4>
        <p>A gente ajusta cada detalhe conforme o número de convidadas e o clima que vocês querem pra despedida. É só combinar. 🍷</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora fazer <em>a última de solteira?</em> ✦</h2>
      <p>Me confirma a experiência, o espaço e o domingo de outubro ou novembro, que a gente organiza tudo.</p>
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
    <p class="fineprint">Proposta de despedida de solteira da Elarah — oficina à escolha (pintura ou cerâmica, pelo mesmo valor), para cerca de 15 pessoas, num domingo de outubro ou novembro (a combinar), em SP. Cada participante cria e leva a própria peça. Valores por pessoa. No café (Jules ou Betc Havas): A experiência R$ 199 / Com foto R$ 299 (com foto profissional e R$ 50 de voucher de consumo no Betc) / Completo R$ 399 com lembrancinha. No Bake Studio (espaço exclusivo, experiência + espaço só de vocês): A experiência R$ 289 / Com foto R$ 389 (com foto profissional e coffee break) / Completo R$ 539 com decoração e lembrancinha. Valores por pessoa. Proposta válida mediante confirmação de data e disponibilidade de agenda.</p>
    {foot("Despedida de solteira · 2026")}
  </section>'''

deck = '<div class="deck">\n' + cover + experiencias + espacos + planos + personaliza + como + '\n\n</div>\n\n'
head = head.replace("<title>Setembro Amarelo · Elarah</title>", "<title>Despedida de Solteira · Elarah</title>")
head = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Proposta de despedida de solteira da Elarah — pintura ou cerâmica, no café (Jules/Betc) ou no Bake Studio.">', head)
head = head.replace("</head>",
    "<style>*{box-shadow:none!important;-webkit-box-shadow:none!important}"
    ".cover-photo{border:1px solid var(--line)}"
    ".plan-photo,.bfeat .bphoto{border:1px solid var(--line)}"
    "</style>\n</head>")
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-despedida-sp.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"))
