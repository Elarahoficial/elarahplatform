# Despedida · Pintura (cerâmica/taça) c/ vinho & comidinhas · 12-15 pessoas · 22 ou 29/08. 4 níveis, 2 espaços. Wine-rose.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

fonts = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/embedded_fonts_style.html", encoding="utf-8").read()
head = re.sub(r'<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>',
              fonts, head, count=1, flags=re.S)

# ---- recolor: vinho-rosé (despedida, vinho) ----
head = head.replace("--orange:#F27623;", "--orange:#AF5A70;")
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#8A3E54;")
head = head.replace("--navy:#16233C;", "--navy:#33222A;")
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#6E555D;")
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#AF5A70;")
head = head.replace("#EDF1F7", "#F8EEF1").replace("#DCE5F1", "#EFDAE1")
head = head.replace("#FF9A4D", "#CE8B9C")
head = head.replace("rgba(242,118,35,.22)", "rgba(175,90,112,.28)")

extra = '''
  .menu{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:12px}
  .exp{position:relative;width:calc(50% - 8px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .exp .top{position:absolute;top:11px;left:11px;z-index:3;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 11px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(138,62,84,.4)}
  .exp-photo{aspect-ratio:16/10;overflow:hidden;background:#eee}
  .exp-photo img{width:100%;height:100%;object-fit:cover}
  .exp-body{padding:14px 18px 17px}
  .exp .n{display:inline-block;font-size:9px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:5px}
  .exp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:20px;color:var(--navy);line-height:1.05}
  .exp p{font-size:12px;color:var(--muted);margin-top:5px;line-height:1.42}
  /* tabela 4 níveis */
  .itable{width:100%;border-collapse:collapse;margin-top:16px;font-family:'DM Sans'}
  .itable th,.itable td{padding:13px 8px;border-bottom:1px solid var(--line);text-align:center;vertical-align:middle}
  .itable thead th{font-size:10.5px;color:var(--navy);font-weight:700;border-bottom:2px solid var(--navy);text-transform:uppercase;letter-spacing:.02em}
  .itable thead th span{display:block;font-size:8.5px;font-weight:500;color:var(--muted);letter-spacing:.01em;margin-top:4px;text-transform:none;line-height:1.3}
  .itable td.rl{text-align:left;width:24%}
  .itable td.rl b{font-family:'DM Serif Display',serif;font-weight:400;font-size:16px;color:var(--navy)}
  .itable td.rl span{display:block;font-size:9.5px;color:var(--muted);margin-top:3px;line-height:1.35}
  .itable .val{font-family:'DM Serif Display',serif;font-size:21px;color:var(--navy);line-height:1;white-space:nowrap}
  .itable .hl{background:#F5E4EA}
  .itable thead th.hl{color:var(--orange-dark)}
  .itable tbody tr:last-child td{border-bottom:none}
  .itable .pill{display:inline-block;background:var(--navy);color:#fff;font-size:7.5px;letter-spacing:.06em;padding:3px 8px;border-radius:999px;margin-bottom:5px;font-weight:700;text-transform:uppercase}
  /* níveis (2x2) */
  .lvls{display:flex;flex-wrap:wrap;gap:14px;margin-top:14px}
  .lvl{width:calc(50% - 7px);background:var(--card);border:1px solid var(--line);border-radius:14px;padding:15px 17px;display:flex;gap:12px;align-items:flex-start;box-shadow:0 14px 30px -22px rgba(0,0,0,.3)}
  .lvl.hl{border:1.4px solid var(--orange)}
  .lvl .b{flex-shrink:0;width:34px;height:34px;border-radius:10px;background:var(--orange);color:#fff;font-family:'DM Serif Display',serif;font-size:16px;display:flex;align-items:center;justify-content:center}
  .lvl h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:16px;color:var(--navy);line-height:1.05}
  .lvl p{font-size:11.5px;color:var(--muted);margin-top:4px;line-height:1.4}
  .lvl .pr{display:inline-block;font-size:10.5px;font-weight:700;color:var(--orange-dark);margin-top:6px;letter-spacing:.02em}
  /* vinho destaque */
  .bfeat{display:flex;margin-top:16px;background:var(--card);border:1.6px solid var(--orange);border-radius:18px;overflow:hidden;box-shadow:0 18px 42px -24px rgba(0,0,0,.34)}
  .bfeat .bphoto{width:42%;overflow:hidden;background:#eee}
  .bfeat .bphoto img{width:100%;height:100%;object-fit:cover;display:block}
  .bfeat .bbody{flex:1;padding:22px 28px 24px;display:flex;flex-direction:column;justify-content:center}
  .bfeat .btag{align-self:flex-start;background:var(--navy);color:#fff;font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:6px 13px;border-radius:999px;margin-bottom:12px}
  .bfeat h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:24px;color:var(--navy);line-height:1.02}
  .bfeat .sub{display:inline-block;font-size:10px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-top:6px}
  .bfeat p{font-size:12.5px;color:var(--muted);margin-top:10px;line-height:1.48}
</style>'''
head = head.replace("</style>", extra, 1)
head = head.replace(".menu-cols{grid-template-columns:1fr 1fr}",
                    ".menu-cols{grid-template-columns:1fr 1fr}\n    .bfeat{flex-direction:row}\n    .bfeat .bphoto{width:42%;height:auto}\n    .lvl{width:calc(50% - 7px)}")
head = head.replace(".plans{grid-template-columns:1fr}",
                    ".plans{grid-template-columns:1fr}\n    .bfeat{flex-direction:column}\n    .bfeat .bphoto{width:100%;height:200px}\n    .lvl{width:100%}")

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
        <span class="compass">Despedida <span>da noiva</span><small>Pintar &amp; brindar</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Despedida de solteira · Pintura, vinho &amp; comidinhas</span>
        <h1>A última<br>de <em>solteira</em></h1>
        <p class="lead">Uma despedida leve e cheia de charme pra noiva e as amigas: uma <strong>oficina de pintura</strong> descomplicada (em cerâmica ou taça), com <strong>vinho e comidinhas</strong> pra brindar. Ninguém precisa saber pintar — e cada uma leva a própria peça. 🍷</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>12 a 15</b> pessoas</span>
          <span class="chip"><b>22</b> ou <b>29/08</b></span>
          <span class="chip"><b>Vinho</b> &amp; comidinhas</span>
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
    <span class="eyebrow orange">◆ Fácil e divertido</span>
    <h2>Pintar <em>sem segredo</em></h2>
    <p class="lead">Duas oficinas de pintura descomplicadas pra escolher — <strong>pelo mesmo valor por pessoa</strong>. Ninguém precisa ser artista: a gente guia do começo ao fim, com tinta, taça de vinho na mão e muita risada. Cada uma leva a própria peça. 🍷</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","pinturatacamaes.jpg","Pintura em taça","Cada uma personaliza a própria taça — linda pra brindar e levar de recordação.","Convidada pintando a própria taça de vidro","center 45%")}
      {exp("02","pinturapratoceramica.jpg","Pintura em cerâmica","Pintar pratos e peças de cerâmica com cores e traços só seus — fácil e cheio de charme.","Prato de cerâmica pintado à mão","center 50%")}
    </div>
    <div class="note" style="margin-top:14px">◆ As duas têm o <b>mesmo valor por pessoa</b> — a escolha é da galera. Descomplicadas e cheias de charme, com a gente guiando tudo. 🎨</div>
    {foot("As experiências")}
  </section>'''

vinho = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Coffee break &amp; vinho</span></div>
    </div>
    <span class="eyebrow orange">◆ Pra brindar a despedida</span>
    <h2>Com <em>vinho &amp; comidinhas</em></h2>
    <p class="lead">Porque despedida boa pede um brinde: a experiência pode vir com um <strong>coffee break e vinho inclusos</strong> — comidinhas gostosas e taças cheias pra acompanhar a pintura e as boas conversas. 🍷🧀</p>
    <div class="rule"></div>
    <div class="bfeat" style="height:238px">
      <div class="bphoto"><img src="assets/harmonizacaoqueijos.jpg" alt="Tábua de queijos e comidinhas para acompanhar o vinho" style="object-position:center 60%"></div>
      <div class="bbody">
        <span class="btag">★ Opcional · a partir do nível 2</span>
        <h3>Coffee break &amp; vinho <span class="sub">comidinhas &amp; taças</span></h3>
        <p>Uma mesa de comidinhas e vinho pra deixar o clima ainda mais gostoso durante a experiência — do jeito que uma despedida entre amigas merece. 🥂</p>
      </div>
    </div>
    {foot("Coffee break &amp; vinho")}
  </section>'''

niveis = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Os níveis</span></div>
    </div>
    <span class="eyebrow orange">◆ Do essencial ao 100% pronto</span>
    <h2>Monte do <em>seu jeito</em></h2>
    <p class="lead">Quatro níveis que vão somando mimos — é só escolher até onde quer ir. Cada nível já inclui tudo do anterior. 🍷</p>
    <div class="rule"></div>
    <div class="lvls">
      <div class="lvl"><div class="b">1</div><div><h3>A experiência</h3><p>A oficina de pintura (taça ou cerâmica), com material e condução inclusos. Cada uma leva a peça.</p><span class="pr">No seu espaço · a partir de R$ 199</span></div></div>
      <div class="lvl"><div class="b">2</div><div><h3>+ Coffee break &amp; vinho</h3><p>Soma as comidinhas e o vinho pra brindar durante a experiência.</p><span class="pr">a partir de R$ 349</span></div></div>
      <div class="lvl"><div class="b">3</div><div><h3>+ Foto &amp; lembrancinha</h3><p>Foto profissional do evento e a lembrancinha personalizada pra cada convidada.</p><span class="pr">a partir de R$ 449</span></div></div>
      <div class="lvl hl"><div class="b">★</div><div><h3>Completo 100%</h3><p>Com tudo incluso — soma a <b>decoração temática</b>, pra festa 100% pronta.</p><span class="pr">a partir de R$ 529</span></div></div>
    </div>
    {foot("Os níveis")}
  </section>'''

espacos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Onde acontece</span></div>
    </div>
    <span class="eyebrow orange">◆ Duas opções de espaço</span>
    <h2>No seu espaço <em>ou</em> no estúdio</h2>
    <p class="lead">Dá pra fazer no conforto do seu espaço — a gente leva tudo até vocês — ou reservar o Bake Studio, um estúdio charmoso e exclusivo só da turma. É só escolher qual combina mais com a despedida. 🍷</p>
    <div class="rule"></div>
    <div class="bfeat" style="height:206px">
      <div class="bphoto"><img src="assets/desp-hero4.jpg" alt="Mesa de despedida montada no seu espaço, com comidinhas e lembrancinhas" style="object-position:center 45%"></div>
      <div class="bbody">
        <span class="btag">Opção 1 · a partir de R$ 199</span>
        <h3>No seu espaço <span class="sub">a gente leva até vocês</span></h3>
        <p>A gente monta tudo no espaço de vocês — casa, salão ou onde a despedida vai rolar. Sem preocupação: é só reunir as amigas e curtir. 🥂</p>
      </div>
    </div>
    <div class="bfeat" style="margin-top:15px;height:206px">
      <div class="bphoto"><img src="assets/espaco1.jpg" alt="Lounge acolhedor do Bake Studio na Bela Vista" style="object-position:center 55%"></div>
      <div class="bbody">
        <span class="btag">★ Opção 2 · a partir de R$ 329</span>
        <h3>Bake Studio <span class="sub">Bela Vista · exclusivo</span></h3>
        <p>Um estúdio charmoso com <b>cozinha e sala</b>, só de vocês — com liberdade pra decorar do jeito que quiserem. Espaço reservado do começo ao fim. 🌿</p>
      </div>
    </div>
    {foot("Onde acontece")}
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
        <th>A experiência<span>só a experiência</span></th>
        <th>+ Coffee &amp; vinho<span>coffee break &amp; vinho</span></th>
        <th>+ Foto &amp; lembrancinha<span>foto profissional &amp; lembrancinha</span></th>
        <th class="hl"><span class="pill">★ 100%</span><br>Completo<span>com tudo · decoração</span></th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="rl"><b>No seu espaço</b><span>a gente leva até vocês</span></td>
          <td class="val">R$ 199</td><td class="val">R$ 349</td><td class="val">R$ 449</td><td class="val hl">R$ 529</td>
        </tr>
        <tr>
          <td class="rl"><b>Bake Studio</b><span>espaço exclusivo · cozinha &amp; sala</span></td>
          <td class="val">R$ 329</td><td class="val">R$ 479</td><td class="val">R$ 579</td><td class="val hl">R$ 659</td>
        </tr>
      </tbody>
    </table>
    <div class="note" style="margin-top:16px">◆ Valores <b>por pessoa</b>, com material e condução inclusos. Cada nível já inclui tudo do anterior: <b>+ coffee break &amp; vinho</b>, depois <b>+ foto profissional &amp; lembrancinha</b>, e o <b>Completo 100%</b> com <b>decoração</b> também — festa já pronta. No <b>Bake Studio</b> o espaço é exclusivo (cozinha &amp; sala). Datas 22/08 ou 29/08 a combinar.</div>
    {foot("Investimento")}
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
      <div class="step"><div class="num">1</div><h3>Escolham a pintura</h3><p>Em taça ou em cerâmica — pelo mesmo valor. A gente leva profissional, material e estrutura.</p></div>
      <div class="step"><div class="num">2</div><h3>Escolham o nível</h3><p>Do essencial ao Completo 100% (com vinho, foto, lembrancinha e decoração), no seu espaço ou no Bake Studio.</p></div>
      <div class="step"><div class="num">3</div><h3>Pintar, brindar &amp; levar</h3><p>No fim, todas levam pra casa a própria peça — uma lembrança linda da despedida. 🍷</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Sob medida pra noiva</h4>
        <p>A gente ajusta cada detalhe conforme o número final de convidadas e o clima que vocês querem pra despedida. É só combinar. 🍷</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora fazer <em>a última de solteira?</em> ✦</h2>
      <p>Me confirma a pintura, o nível e a data (22 ou 29/08), que a gente organiza tudo.</p>
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
    <p class="fineprint">Proposta de despedida de solteira da Elarah — oficina de pintura à escolha (em taça ou em cerâmica, pelo mesmo valor), para cerca de 12 a 15 pessoas, em 22/08 ou 29/08 (a combinar). Cada participante pinta e leva a própria peça. Quatro níveis, valores por pessoa. No seu espaço: A experiência R$ 199 / + coffee break e vinho R$ 349 / + foto profissional e lembrancinha R$ 449 / Completo 100% com decoração R$ 529. No Bake Studio (espaço exclusivo, cozinha e sala): a partir de R$ 329, subindo nos mesmos valores (R$ 329 / 479 / 579 / 659). Cada nível já inclui tudo do anterior. Valores por pessoa. Proposta válida mediante confirmação de data, número de participantes e disponibilidade de agenda.</p>
    {foot("Despedida de solteira · 2026")}
  </section>'''

deck = '<div class="deck">\n' + cover + experiencias + espacos + vinho + planos + personaliza + como + '\n\n</div>\n\n'
head = head.replace("<title>Setembro Amarelo · Elarah</title>", "<title>Despedida de Solteira · Pintura &amp; Vinho · Elarah</title>")
head = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Proposta de despedida da Elarah — pintura em taça ou cerâmica com vinho e comidinhas, no seu espaço ou no Bake Studio.">', head)
head = head.replace("</head>",
    "<style>*{box-shadow:none!important;-webkit-box-shadow:none!important}"
    ".cover-photo{border:1px solid var(--line)}"
    ".plan-photo,.bfeat .bphoto{border:1px solid var(--line)}"
    "</style>\n</head>")
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-despedida-pintura-vinho.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"))
