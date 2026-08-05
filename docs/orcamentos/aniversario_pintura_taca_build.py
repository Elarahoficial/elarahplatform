# Aniversário Marcia · Workshop pintura em taça de vidro · Betc Havas Café · 2ª semana de setembro (sáb/dom). Teal palette.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

fonts = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/embedded_fonts_style.html", encoding="utf-8").read()
head = re.sub(r'<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>',
              fonts, head, count=1, flags=re.S)

# ---- recolor: teal / verde-água fresco ----
head = head.replace("--orange:#F27623;", "--orange:#2E9088;")
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#1E6B63;")
head = head.replace("--navy:#16233C;", "--navy:#1E3230;")
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#52706B;")
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#2E9088;")
head = head.replace("#EDF1F7", "#E8F3F1").replace("#DCE5F1", "#D0E7E2")
head = head.replace("#FF9A4D", "#6DBBB1")
head = head.replace("rgba(242,118,35,.22)", "rgba(46,144,136,.26)")

extra = '''
  .menu{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:12px}
  .exp{position:relative;width:calc(33.333% - 11px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .exp .top{position:absolute;top:11px;left:11px;z-index:3;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 11px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(30,107,99,.4)}
  .exp-photo{aspect-ratio:4/5;overflow:hidden;background:#eee}
  .exp-photo img{width:100%;height:100%;object-fit:cover}
  .exp-body{padding:12px 15px 15px}
  .exp .n{display:inline-block;font-size:9px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:5px}
  .exp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--navy);line-height:1.05}
  .exp p{font-size:11px;color:var(--muted);margin-top:5px;line-height:1.38}
  .infocard .ico svg{width:30px;height:30px;display:block}
  .itable{width:100%;border-collapse:collapse;margin-top:18px;font-family:'DM Sans'}
  .itable th,.itable td{padding:16px 12px;border-bottom:1px solid var(--line);text-align:center;vertical-align:middle}
  .itable thead th{font-size:12px;color:var(--navy);font-weight:700;border-bottom:2px solid var(--navy);text-transform:uppercase;letter-spacing:.04em}
  .itable thead th span{display:block;font-size:9.5px;font-weight:500;color:var(--muted);letter-spacing:.01em;margin-top:4px;text-transform:none}
  .itable td.rl{text-align:left;width:38%}
  .itable td.rl b{font-family:'DM Serif Display',serif;font-weight:400;font-size:19px;color:var(--navy)}
  .itable td.rl span{display:block;font-size:10.5px;color:var(--muted);margin-top:4px;line-height:1.45}
  .itable .val{font-family:'DM Serif Display',serif;font-size:26px;color:var(--navy);line-height:1;white-space:nowrap}
  .itable .hl{background:#DBEEEA}
  .itable thead th.hl{color:var(--orange-dark)}
  .itable tbody tr:last-child td{border-bottom:none}
  .itable .pill{display:inline-block;background:var(--navy);color:#fff;font-size:8px;letter-spacing:.08em;padding:3px 9px;border-radius:999px;margin-bottom:7px;font-weight:700;text-transform:uppercase}
  .bfeat{display:flex;margin-top:18px;background:var(--card);border:1.6px solid var(--orange);border-radius:18px;overflow:hidden;box-shadow:0 18px 42px -24px rgba(0,0,0,.34)}
  .bfeat .bphoto{width:42%;overflow:hidden;background:#eee}
  .bfeat .bphoto img{width:100%;height:100%;object-fit:cover;display:block}
  .bfeat .bbody{flex:1;padding:24px 30px 26px;display:flex;flex-direction:column;justify-content:center}
  .bfeat .btag{align-self:flex-start;background:var(--navy);color:#fff;font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:6px 13px;border-radius:999px;margin-bottom:12px}
  .bfeat h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:25px;color:var(--navy);line-height:1.02}
  .bfeat .sub{display:inline-block;font-size:10px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-top:6px}
  .bfeat p{font-size:12.5px;color:var(--muted);margin-top:11px;line-height:1.5}
  .dchips{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
  .dchips span{background:#DBEEEA;border:1px solid var(--line);border-radius:999px;padding:6px 13px;font-size:11.5px;color:var(--navy);font-weight:500}
</style>'''
head = head.replace("</style>", extra, 1)
head = head.replace(".menu-cols{grid-template-columns:1fr 1fr}",
                    ".menu-cols{grid-template-columns:1fr 1fr}\n    .bfeat{flex-direction:row}\n    .bfeat .bphoto{width:42%;height:auto}\n    .bfeat .bbody{padding:18px 24px 19px}\n    .bfeat h3{font-size:22px}\n    .bfeat p{font-size:11.5px;margin-top:8px}\n    .dchips{margin-top:11px;gap:7px}\n    .dchips span{font-size:11px;padding:5px 11px}")
head = head.replace(".plans{grid-template-columns:1fr}",
                    ".plans{grid-template-columns:1fr}\n    .bfeat{flex-direction:column}\n    .bfeat .bphoto{width:100%;height:220px}")

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
        <span class="compass">Pintura <span>em taça</span><small>Aniversário criativo</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Aniversário · Workshop de pintura em taça</span>
        <h1>Um brinde<br>que você <em>pintou</em></h1>
        <p class="lead">Um aniversário diferente e cheio de charme: a galera se reúne pra um <strong>workshop de pintura em taça de vidro</strong> — cada um personaliza a sua e leva pra casa de recordação. Puro clima de celebração. 🥂</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>Pintura</b> em taça</span>
          <span class="chip"><b>2ª semana</b> de setembro</span>
          <span class="chip">Sáb <b>ou</b> dom</span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/aniv-experiencia.jpg" alt="Grupo pintando e brindando junto numa experiência da Elarah" style="object-position:center 30%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Já realizado para times como <b>Compass</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)</div>
    {foot("Aniversário · Pintura em taça")}
  </section>'''

workshop = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O workshop</span></div>
    </div>
    <span class="eyebrow orange">◆ Pintura em taça de vidro</span>
    <h2>Cada taça, <em>uma arte</em></h2>
    <p class="lead">Com tintas próprias pra vidro, cada convidado cria a própria taça — de flores delicadas a corações, do jeitinho de cada um. A gente leva o profissional, o material e toda a estrutura; vocês só chegam e pintam. 🎨</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","pinturatacavinho.jpg","Mão na massa","Um momento leve e relaxante — tinta, taça e boa companhia. Ninguém precisa saber pintar.","Convidada pintando a própria taça de vidro","center 45%")}
      {exp("02","pinturatacanova.jpg","Florzinhas","Buquês de flores do campo que deixam a taça delicada e cheia de charme.","Taça de vidro pintada com flores do campo","center 50%")}
      {exp("03","pinturatacamaes.jpg","Do seu jeito","Corações, nomes, cores favoritas — cada taça fica única, com a cara de quem pintou.","Taça de vidro pintada à mão com corações","center 40%")}
    </div>
    <div class="note" style="margin-top:14px">◆ Estas são <b>inspirações</b> — na hora, cada convidado pinta a própria taça, livre e do jeitinho dele, e leva pra casa. 🥂</div>
    {foot("O workshop")}
  </section>'''

espaco = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Onde acontece</span></div>
    </div>
    <span class="eyebrow orange">◆ Espaço parceiro · a sugestão</span>
    <h2>No <em>Betc Havas Café</em></h2>
    <p class="lead">A sugestão perfeita pra celebrar: um café <strong>moderno e cheio de charme</strong>, com madeira, arte autoral nas paredes e cantinhos <strong>bem aconchegantes</strong> pra sentar e ficar. O cenário ideal pra pintar, brindar e comemorar num sábado ou domingo de setembro. ☕</p>
    <div class="rule"></div>
    <div class="bfeat" style="height:250px">
      <div class="bphoto"><img src="assets/betchavas2.jpg" alt="Interior moderno e aconchegante do Betc Havas Café, com madeira, bar e arte nas paredes" style="object-position:center 55%"></div>
      <div class="bbody">
        <span class="btag">★ Espaço parceiro</span>
        <h3>Betc Havas Café <span class="sub">café &amp; lounge criativo</span></h3>
        <p>Madeira, iluminação quente, arte autoral e um café gostoso — um espaço que já respira criatividade. A gente reserva e leva toda a estrutura do workshop; vocês só chegam e curtem. 🌿</p>
        <div class="dchips">
          <span>Moderno &amp; criativo</span>
          <span>Charme &amp; aconchego</span>
          <span>Sáb ou dom de setembro</span>
        </div>
      </div>
    </div>
    {foot("Onde acontece · Betc Havas Café")}
  </section>'''

planos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>A partir de <em>R$ 199</em></h2>
    <p class="lead">Escolha o nível que combina com a comemoração — do essencial ao completo. Valor por pessoa, com material e condução inclusos, e cada convidado leva a própria taça. 🥂</p>
    <div class="rule"></div>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th>A experiência<span>material & condução</span></th>
        <th>Com foto &amp; voucher<span>+ foto profissional &amp; R$ 30 de voucher</span></th>
        <th class="hl"><span class="pill">★ Completo</span><br>Completo<span>+ lembrancinha personalizada</span></th>
      </tr></thead>
      <tbody><tr>
        <td class="rl"><b>Pintura em taça de vidro</b><span>Cada convidado pinta e leva a própria taça</span></td>
        <td class="val">R$ 199</td><td class="val">R$ 299</td><td class="val hl">R$ 399</td>
      </tr></tbody>
    </table>
    <div class="note" style="margin-top:18px">◆ Valor <b>por pessoa</b>, com material e condução inclusos. O nível <b>Com foto &amp; voucher</b> soma a foto profissional do encontro e um voucher de R$ 30 de consumo por pessoa; o <b>Completo</b> soma também a lembrancinha personalizada. Realizado no Betc Havas Café, na 2ª semana de setembro (sábado ou domingo, a combinar).</div>
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
    <p class="lead">Dois extras opcionais que deixam o aniversário ainda mais marcante — o registro profissional com voucher e a lembrancinha personalizada pra cada convidado.</p>
    <div class="rule"></div>
    <div class="plans">
      <div class="plan">
        <div class="plan-photo sq"><img src="assets/rockworld1.jpg" alt="Aniversário registrado por um fotógrafo" style="object-position:center 30%"></div>
        <div class="plan-body">
          <h3>Foto profissional &amp; voucher</h3>
          <span class="tag basic">Nível Com foto · R$ 299</span>
          <ul class="feat">
            <li>Um fotógrafo cobre a festa inteira</li>
            <li>Cada risada e cada taça registradas</li>
            <li><b>R$ 30 de voucher</b> de consumo por pessoa</li>
          </ul>
          <span class="allin">Memória (e um mimo) pra levar</span>
        </div>
      </div>
      <div class="plan featured">
        <div class="plan-photo sq"><img src="assets/personaliza%C3%A7aobrindeescovapiranha.jpg" alt="Kit de lembrancinha personalizada com escova e piranha" style="object-position:center"></div>
        <div class="plan-body">
          <h3>Lembrancinha personalizada</h3>
          <span class="tag premium">★ Nível Completo · R$ 399</span>
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
      <div class="step"><div class="num">1</div><h3>Marcamos a data</h3><p>Um sábado ou domingo da 2ª semana de setembro — a gente reserva o Betc Havas Café pra vocês.</p></div>
      <div class="step"><div class="num">2</div><h3>A gente leva tudo</h3><p>Profissional, tintas, taças e toda a estrutura do workshop. Vocês só chegam e pintam.</p></div>
      <div class="step"><div class="num">3</div><h3>Cada um leva a taça</h3><p>No fim, todo mundo leva pra casa a própria taça pintada — uma lembrança linda do dia. 🥂</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Sob medida pro seu dia</h4>
        <p>A gente ajusta cada detalhe conforme o número de convidados e o clima que você quer pra festa. É só combinar. 🥂</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora <em>pintar e brindar?</em> ✦</h2>
      <p>Me confirma o número de convidados e o dia de setembro, que a gente reserva o café e organiza tudo.</p>
      <div class="cta-actions">
        <a class="btn-wa" href="https://wa.me/5511914455930?text=Oi%2C%20Elarah!%20Vi%20a%20proposta%20do%20workshop%20de%20pintura%20em%20ta%C3%A7a%20e%20quero%20fechar." target="_blank" rel="noopener">
          💬 Falar no WhatsApp
        </a>
        <div class="contact-links">
          <span>+55 (11) 91445-5930</span>
          <a href="https://instagram.com/elarah.oficial" target="_blank" rel="noopener">@elarah.oficial</a>
          <a href="https://elarah.com.br" target="_blank" rel="noopener">elarah.com.br</a>
        </div>
      </div>
    </div>
    <p class="fineprint">Proposta de aniversário da Elarah — workshop de pintura em taça de vidro, na 2ª semana de setembro (sábado ou domingo, data a combinar), no Betc Havas Café. Cada convidado pinta e leva a própria taça. A partir de R$ 199 por pessoa (níveis R$ 199 / 299 / 399): A experiência (material e condução) / + foto profissional e R$ 30 de voucher de consumo por pessoa / Completo com lembrancinha personalizada. Valor por pessoa. Proposta válida mediante confirmação de data e disponibilidade de agenda.</p>
    {foot("Aniversário · Pintura em taça · 2026")}
  </section>'''

deck = '<div class="deck">\n' + cover + workshop + espaco + planos + personaliza + como + '\n\n</div>\n\n'
head = head.replace("<title>Setembro Amarelo · Elarah</title>", "<title>Workshop de Pintura em Taça · Aniversário · Elarah</title>")
head = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Proposta de aniversário da Elarah — workshop de pintura em taça de vidro no Betc Havas Café.">', head)
head = head.replace("</head>",
    "<style>*{box-shadow:none!important;-webkit-box-shadow:none!important}"
    ".cover-photo{border:1px solid var(--line)}"
    ".plan-photo,.bfeat .bphoto{border:1px solid var(--line)}"
    "</style>\n</head>")
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-pintura-taca.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"))
