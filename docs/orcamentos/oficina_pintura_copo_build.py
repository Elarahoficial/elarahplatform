# Aniversario VM · Vela ou Ceramica · 15 pessoas · SP · domingo out/nov. Café (199/299/399) + Bake Studio (289/389/539). Wine-rose.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

fonts = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/embedded_fonts_style.html", encoding="utf-8").read()
head = re.sub(r'<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>',
              fonts, head, count=1, flags=re.S)

# ---- recolor: terracota-coral (pintura em copo) ----
head = head.replace("--orange:#F27623;", "--orange:#C56A47;")
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#A34F30;")
head = head.replace("--navy:#16233C;", "--navy:#33241C;")
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#6B5849;")
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#C56A47;")
head = head.replace("#EDF1F7", "#F7F0EA").replace("#DCE5F1", "#EEDFD2")
head = head.replace("#FF9A4D", "#DDA07E")
head = head.replace("rgba(242,118,35,.22)", "rgba(197,106,71,.26)")

extra = '''
  .menu{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:12px}
  .exp{position:relative;width:calc(50% - 8px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .exp .top{position:absolute;top:11px;left:11px;z-index:3;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 11px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(163,79,48,.4)}
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
  .itable .val small{display:block;font-family:'DM Sans';font-size:8.5px;font-weight:600;letter-spacing:.01em;text-transform:none;color:var(--muted);margin-top:6px;line-height:1.25;white-space:normal}
  .itable .hl{background:#F0E0D3}
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
  /* grid de espaços (3 opções) */
  .vg{display:flex;gap:14px;margin-top:16px}
  .vgc{flex:1;background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:0 14px 30px -22px rgba(0,0,0,.3);display:flex;flex-direction:column}
  .vgc.hl{border:1.6px solid var(--orange)}
  .vgc .p{aspect-ratio:4/3;overflow:hidden;background:#eee}
  .vgc .p img{width:100%;height:100%;object-fit:cover}
  .vgc .b{padding:13px 15px 16px}
  .vgc .t{display:inline-block;background:var(--navy);color:#fff;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:4px 10px;border-radius:999px;margin-bottom:8px}
  .vgc.hl .t{background:var(--orange)}
  .vgc h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--navy);line-height:1.05}
  .vgc .sub{display:inline-block;font-size:9px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-top:4px}
  .vgc p{font-size:11px;color:var(--muted);margin-top:7px;line-height:1.4}
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
        <span class="kicker">Proposta de experiência</span>
        <span class="compass">Oficina <span>Elarah</span><small>Pintura em copo</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Oficina · Pintura em copo</span>
        <h1>Cada copo,<br>uma <em>arte</em></h1>
        <p class="lead">Uma tarde criativa e cheia de charme pra turma: uma <strong>oficina de pintura em copo</strong>, onde cada um pinta o próprio copo com flores e cores e leva pra casa de lembrança. Puro clima de encontro, arte e boas conversas. 🎨</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>10</b> pessoas</span>
          <span class="chip">Em <b>setembro</b></span>
          <span class="chip"><b>3 opções</b> de espaço</span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/pinturataca2.jpg" alt="Copos pintados à mão com flores coloridas" style="object-position:center 55%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Já realizado para times como <b>Compass</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)</div>
    {foot("Oficina de pintura em copo")}
  </section>'''

experiencias = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">A oficina</span></div>
    </div>
    <span class="eyebrow orange">◆ Oficina de pintura em copo</span>
    <h2>Cada copo, <em>uma arte</em></h2>
    <p class="lead">Com tintas próprias pra vidro, cada convidado pinta o próprio copo — de flores delicadas a padrões coloridos, do jeitinho de cada um. A gente leva o profissional, o material e toda a estrutura; vocês só chegam e pintam. 🎨</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","pinturataca2.jpg","Cada copo, único","Flores, cores e padrões — cada um pinta o próprio copo, do jeitinho dele.","Copos pintados à mão com flores coloridas","center 55%")}
      {exp("02","pinturatacaaaa2.jpg","Do seu jeito","Da paleta delicada à mais vibrante, cada copo fica com a cara de quem pintou.","Copos pintados à mão com tulipas coloridas","center 50%")}
    </div>
    <div class="note" style="margin-top:14px">◆ Estas são <b>inspirações</b> — na hora, cada convidado pinta o próprio copo, livre e do jeitinho dele, e leva pra casa de lembrança. 🎨</div>
    {foot("A oficina")}
  </section>'''

vibe = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">A vibe</span></div>
    </div>
    <span class="eyebrow orange">◆ O clima da experiência</span>
    <h2>Uma mesa que é <em>só charme</em></h2>
    <p class="lead">Mais do que a experiência: a gente monta um cenário lindo pra comemoração — velas, flores, uma mesa cheia de charme e aquele clima gostoso de criar junto e comemorar. 🕯️🌸</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","aniv-decor.jpg","A mesa decorada","Velas, flores e cada detalhe pensado — o cenário perfeito pra criar e comemorar.","Mesa de pintura decorada com velas e flores","center 30%")}
      {exp("02","desp-hero4.jpg","Cada detalhe","Comidinhas, lembrancinhas e uma mesa montada só pra vocês, do começo ao fim.","Mesa de aniversário com comidinhas e lembrancinhas","center 45%")}
    </div>
    <div class="note" style="margin-top:14px">◆ A <b>decoração</b> completa entra no nível <b>Premium</b> do Bake Studio — pra festa 100% pronta, é só chegar e comemorar. 🌸</div>
    {foot("A vibe da experiência")}
  </section>'''

espacos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Onde acontece</span></div>
    </div>
    <span class="eyebrow orange">◆ Três opções de espaço · valor por pessoa</span>
    <h2>Escolha o <em>cenário</em></h2>
    <p class="lead">Duas cafeterias parceiras charmosas ou a comodidade de fazer no seu próprio espaço. É só escolher qual combina mais com a oficina. 🎨</p>
    <div class="rule"></div>
    <div class="vg">
      <div class="vgc hl">
        <div class="p"><img src="assets/julescampobelo.jpg" alt="Cafeteria Jules em Campo Belo, arejada e charmosa" style="object-position:center 60%"></div>
        <div class="b"><span class="t">R$ 199 por pessoa</span><h3>Jules <span class="sub">Campo Belo</span></h3><p>Cafeteria charmosa e arejada, com mesas de madeira e guarda-sóis.</p></div>
      </div>
      <div class="vgc">
        <div class="p"><img src="assets/betchavas2.jpg" alt="Interior moderno do Betc Havas Café" style="object-position:center 55%"></div>
        <div class="b"><span class="t">R$ 249 por pessoa</span><h3>Betc Havas Café <span class="sub">com voucher</span></h3><p>Moderno e cheio de charme — já vem com <b>R$ 50 de voucher</b> de consumo.</p></div>
      </div>
      <div class="vgc">
        <div class="p"><img src="assets/em-casa-hero-1.jpg" alt="Oficina criativa acontecendo no espaço da cliente" style="object-position:center 45%"></div>
        <div class="b"><span class="t">R$ 199 por pessoa</span><h3>No seu espaço <span class="sub">a gente vai até você</span></h3><p>A comodidade de fazer <b>em casa</b> ou no seu espaço — levamos tudo até vocês.</p></div>
      </div>
    </div>
    <div class="note" style="margin-top:14px">◆ Valor <b>por pessoa</b>, com material e condução inclusos. No <b>Jules · Campo Belo</b> e <b>no seu espaço</b> (a gente leva tudo até você): R$ 199. No <b>Betc Havas Café</b>: R$ 249, já com <b>R$ 50 de voucher</b> de consumo pra usar no café. 🎨</div>
    {foot("Onde acontece &amp; investimento")}
  </section>'''

planos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Escolha o <em>combo</em></h2>
    <p class="lead">Valores por pessoa, com material e condução inclusos — e cada uma sempre leva a própria criação. É só escolher o espaço e o nível que mais combinam com a comemoração. 🥂</p>
    <div class="rule"></div>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th>Basic<span>a experiência</span></th>
        <th>Plus<span>+ foto do evento</span></th>
        <th class="hl"><span class="pill">★ Premium</span><br>Premium<span>com tudo incluso</span></th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="rl"><b>Jules · Campo Belo</b><span>cafeteria parceira</span></td>
          <td class="val">R$ 199</td>
          <td class="val">R$ 299<small>+ foto profissional</small></td>
          <td class="val hl">R$ 399<small>+ lembrancinha</small></td>
        </tr>
        <tr>
          <td class="rl"><b>Betc Havas Café</b><span>com R$ 50 de voucher de consumo</span></td>
          <td class="val">R$ 249</td>
          <td class="val">R$ 349<small>+ foto profissional</small></td>
          <td class="val hl">R$ 449<small>+ lembrancinha</small></td>
        </tr>
        <tr>
          <td class="rl"><b>Bake Studio</b><span>espaço exclusivo · só de vocês</span></td>
          <td class="val">R$ 289</td>
          <td class="val">R$ 389<small>+ foto &amp; coffee break</small></td>
          <td class="val hl">R$ 539<small>+ decoração &amp; lembrancinha</small></td>
        </tr>
      </tbody>
    </table>
    <div class="note" style="margin-top:14px">◆ Valores <b>por pessoa</b>, com material e condução inclusos. Cafeterias: <b>Jules</b> (a partir de R$ 199) e <b>Betc Havas Café</b> (a partir de R$ 249, já com <b>R$ 50 de voucher</b> de consumo) — o Com foto soma a foto profissional e o Completo soma a lembrancinha. No <b>Bake Studio</b> (espaço só de vocês), o Com foto soma a foto profissional e um <b>coffee break</b>, e o Completo vem com <b>decoração &amp; lembrancinha</b>. Início de setembro, a combinar.</div>
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
    <p class="lead">A partir do nível com foto, a festa ganha o registro profissional e a lembrancinha personalizada pra cada convidado — dois mimos pra deixar tudo ainda mais especial.</p>
    <div class="rule"></div>
    <div class="plans">
      <div class="plan">
        <div class="plan-photo sq"><img src="assets/desp-hero2.jpg" alt="Amigas se abraçando e rindo, registradas por um fotógrafo" style="object-position:center 25%"></div>
        <div class="plan-body">
          <h3>Foto profissional</h3>
          <span class="tag basic">Registro do evento</span>
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
          <span class="tag premium">★ Um mimo a mais</span>
          <ul class="feat">
            <li>Kit com <b>escova &amp; piranha</b> pra cada convidada</li>
            <li>Personalizado com o nome de cada uma</li>
            <li>Um mimo pra levarem da festa pra casa</li>
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
    <h2>É só <em>reunir a galera</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pra a oficina ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Escolham o espaço</h3><p>Jules · Campo Belo, Betc Havas Café ou no seu próprio espaço — a gente reserva pra melhor data de setembro pra vocês.</p>
      <div class="step"><div class="num">2</div><h3>A gente leva tudo</h3><p>Profissional, tintas, copos e toda a estrutura da oficina. Vocês só chegam e pintam.</p></div>
      <div class="step"><div class="num">3</div><h3>Cada um leva o copo</h3><p>No fim, todo mundo leva pra casa o próprio copo pintado — uma lembrança linda do dia. 🎨</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Sob medida pro seu dia</h4>
        <p>A gente ajusta cada detalhe conforme o número de convidadas e o clima que vocês querem pra oficina. É só combinar. 🎨</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora <em>pintar copos?</em> ✦</h2>
      <p>Me confirma o espaço e o número de convidados, que a gente organiza tudo pra setembro.</p>
      <div class="cta-actions">
        <a class="btn-wa" href="https://wa.me/5511914455930?text=Oi%2C%20Elarah!%20Vi%20a%20proposta%20da%20oficina%20de%20pintura%20em%20copo%20e%20quero%20fechar%20os%20detalhes." target="_blank" rel="noopener">
          💬 Falar no WhatsApp
        </a>
        <div class="contact-links">
          <span>+55 (11) 91445-5930</span>
          <a href="https://instagram.com/elarah.oficial" target="_blank" rel="noopener">@elarah.oficial</a>
          <a href="https://elarah.com.br" target="_blank" rel="noopener">elarah.com.br</a>
        </div>
      </div>
    </div>
    <p class="fineprint">Proposta da Elarah — oficina de pintura em copo, para turma privada de cerca de 10 pessoas, no mês de setembro (a combinar). Cada convidado pinta e leva o próprio copo. Valores por pessoa, com material e condução inclusos. No Jules · Campo Belo: R$ 199 por pessoa. No Betc Havas Café: R$ 249 por pessoa, já com R$ 50 de voucher de consumo para usar no café. No seu próprio espaço (a Elarah leva tudo até você): R$ 199 por pessoa. Proposta válida mediante confirmação de data e disponibilidade de agenda.</p>
    {foot("Oficina de pintura em copo · 2026")}
  </section>'''

deck = '<div class="deck">\n' + cover + experiencias + vibe + espacos + como + '\n\n</div>\n\n'
head = head.replace("<title>Setembro Amarelo · Elarah</title>", "<title>Oficina de Pintura em Copo · Elarah</title>")
head = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Proposta da Elarah — oficina de pintura em copo, no Jules, no Betc Havas Café ou no seu espaço.">', head)
head = head.replace("</head>",
    "<style>*{box-shadow:none!important;-webkit-box-shadow:none!important}"
    ".cover-photo{border:1px solid var(--line)}"
    ".plan-photo,.bfeat .bphoto{border:1px solid var(--line)}"
    "</style>\n</head>")
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-pintura-copo.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"))
