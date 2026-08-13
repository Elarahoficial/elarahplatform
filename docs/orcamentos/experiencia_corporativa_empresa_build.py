# Aniversario VM · Vela ou Ceramica · 15 pessoas · SP · domingo out/nov. Café (199/299/399) + Bake Studio (289/389/539). Wine-rose.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

fonts = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/embedded_fonts_style.html", encoding="utf-8").read()
head = re.sub(r'<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>',
              fonts, head, count=1, flags=re.S)

# ---- recolor: esmeralda (corporativo) ----
head = head.replace("--orange:#F27623;", "--orange:#2E8577;")
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#206258;")
head = head.replace("--navy:#16233C;", "--navy:#1E2B28;")
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#4E605B;")
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#2E8577;")
head = head.replace("#EDF1F7", "#EDF4F1").replace("#DCE5F1", "#D6E8E2")
head = head.replace("#FF9A4D", "#7BB5A8")
head = head.replace("rgba(242,118,35,.22)", "rgba(46,133,119,.26)")

extra = '''
  .menu{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:12px}
  .exp{position:relative;width:calc(33.333% - 11px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .exp .top{position:absolute;top:11px;left:11px;z-index:3;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 11px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(32,98,88,.4)}
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
  .itable .hl{background:#DBEDE7}
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
        <span class="kicker">Proposta corporativa · Aniversário da empresa</span>
        <span class="compass">Corporativo <span>Elarah</span><small>Experiência criativa</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência corporativa · Aniversário da empresa</span>
        <h1>Celebrar<br>com as <em>mãos</em></h1>
        <p class="lead">Uma experiência criativa e sensorial pra celebrar o aniversário da empresa e integrar o time: uma vivência à escolha — <strong>perfumaria, cerâmica, pintura, vela ou arranjos florais</strong> — pra relaxar, criar junto e viver um momento especial. Cada um leva a própria criação. ✨</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>8</b> pessoas</span>
          <span class="chip"><b>Meados de setembro</b> · dia útil</span>
          <span class="chip"><b>Escritório</b> ou espaço parceiro</span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/aniv-adulto.jpg" alt="Time reunido numa mesa, criando e celebrando junto" style="object-position:center 40%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Já realizado para times como <b>Compass</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)</div>
    {foot("Experiência corporativa")}
  </section>'''

experiencias = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">As experiências</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham a favorita do time</span>
    <h2>Cinco vivências <em>criativas</em></h2>
    <p class="lead">Experiências sensoriais e relaxantes pra escolher — todas conduzidas por um profissional, com material e estrutura inclusos. Cada participante cria e leva pra casa a própria peça. ✨</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","perfumaria-corp.jpg","Perfumaria autoral","Cada um cria o próprio perfume com notas exclusivas — uma fragrância única e pessoal.","Mesa de perfumaria com essências e flores","center 45%")}
      {exp("02","ceramica1.jpg","Cerâmica","Pintar a própria peça de cerâmica com cores e desenhos — delicada e única.","Mãos pintando uma peça de cerâmica","center 50%")}
      {exp("03","pinturatacaa.jpg","Pintura em taça","Pintar à mão a própria taça com desenhos autorais — elegante e cheia de charme.","Taças pintadas à mão","center 50%")}
      {exp("04","velaaromatica.jpg","Vela aromática","Escolher o aroma e criar a própria vela — sofisticada, relaxante e cheia de charme.","Vela aromática artesanal acesa","center 50%")}
      {exp("05","florseca.jpg","Arranjos florais","Montar o próprio arranjo com flores da estação — delicado e cheio de vida.","Arranjos florais montados à mão","center 45%")}
    </div>
    <div class="note" style="margin-top:14px">◆ É só o time escolher a experiência favorita — a gente leva tudo até vocês (ou recebe no espaço parceiro) e cada um leva pra casa a própria criação. ✨</div>
    {foot("As experiências")}
  </section>'''

vibe = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">A vibe</span></div>
    </div>
    <span class="eyebrow orange">◆ O clima da experiência</span>
    <h2>Mais que uma dinâmica, <em>uma sensação</em></h2>
    <p class="lead">A gente monta um cenário lindo — velas, flores e uma mesa cheia de charme — mas o que fica mesmo é o sentimento: colocar a mão na massa, rir junto e viver um momento só de vocês. 🕯️🌸</p>
    <div class="rule"></div>
    <div class="bfeat">
      <div class="bphoto"><img src="assets/aniv-decor.jpg" alt="Mesa criativa decorada com velas, flores e materiais" style="object-position:center 30%"></div>
      <div class="bbody">
        <span class="btag soft">Feito com carinho</span>
        <h3>Uma mesa cheia de charme</h3>
        <span class="sub">Cenário acolhedor &amp; delicado</span>
        <p>Velas, flores e cada detalhe pensado — a gente cuida do cenário pra tudo ficar leve e bonito. É só a galera chegar, criar e se sentir em casa. 🌸</p>
      </div>
    </div>
    <span class="eyebrow orange" style="margin-top:20px;display:inline-block">◆ A vibe da experiência</span>
    <div class="vg">
      <div class="vgc">
        <div class="p"><img src="assets/aniv-experiencia.jpg" alt="Amigas pintando e criando juntas numa mesa cheia de cores" style="object-position:center 45%"></div>
        <div class="b"><span class="t">Juntas</span><h3>Criar lado a lado</h3><p>Mãos na massa, taças na mesa e aquele clima gostoso de criar junto.</p></div>
      </div>
      <div class="vgc">
        <div class="p"><img src="assets/aromaterapiameninas.jpg" alt="Mãos criando perfumaria com flores e essências" style="object-position:center 45%"></div>
        <div class="b"><span class="t">Sentir</span><h3>No próprio ritmo</h3><p>Aromas, cores e pincel livre — cada uma cria o que sente, sem pressa.</p></div>
      </div>
      <div class="vgc">
        <div class="p"><img src="assets/aniv-experienciaa.jpg" alt="Amigas rindo e brindando juntas" style="object-position:center 55%"></div>
        <div class="b"><span class="t">Afeto</span><h3>Rir e brindar</h3><p>A alegria de mostrar o que criou — e levar de recordação pra sempre.</p></div>
      </div>
    </div>
    <div class="note" style="margin-top:14px">◆ No <b>Bake Studio</b>, o espaço é reservado só pro time, com coffee break — pra celebração 100% pronta, é só chegar e criar. ✨</div>
    {foot("A vibe da experiência")}
  </section>'''

espacos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Onde acontece</span></div>
    </div>
    <span class="eyebrow orange">◆ Três opções de espaço</span>
    <h2>Escolha o <em>cenário</em></h2>
    <p class="lead">Duas cafeterias parceiras charmosas ou o Bake Studio, um estúdio exclusivo reservado só pro time. E, se preferirem, a gente também leva a experiência até o escritório de vocês. ✨</p>
    <div class="rule"></div>
    <div class="vg">
      <div class="vgc">
        <div class="p"><img src="assets/julescampobelo.jpg" alt="Cafeteria Jules em Campo Belo, arejada e charmosa" style="object-position:center 60%"></div>
        <div class="b"><span class="t">A partir de R$ 239</span><h3>Jules <span class="sub">Campo Belo</span></h3><p>Cafeteria charmosa e arejada, com mesas de madeira e clima leve.</p></div>
      </div>
      <div class="vgc">
        <div class="p"><img src="assets/betchavas2.jpg" alt="Interior moderno do Betc Havas Café" style="object-position:center 55%"></div>
        <div class="b"><span class="t">A partir de R$ 289</span><h3>Betc Havas Café <span class="sub">moderno</span></h3><p>Moderno e cheio de charme, com arte nas paredes e clima criativo.</p></div>
      </div>
      <div class="vgc hl">
        <div class="p"><img src="assets/espaco1.jpg" alt="Lounge acolhedor do Bake Studio" style="object-position:center 55%"></div>
        <div class="b"><span class="t">★ A partir de R$ 409</span><h3>Bake Studio <span class="sub">exclusivo</span></h3><p>Estúdio <b>reservado só pro time</b> — experiência + espaço privado, com coffee break.</p></div>
      </div>
    </div>
    <div class="note" style="margin-top:14px">◆ Cada espaço com o seu valor por pessoa (detalhes por experiência na próxima página). O <b>Bake Studio</b> é reservado só pro time. A experiência também pode acontecer <b>no escritório de vocês</b> — é só combinar. ✨</div>
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
    <p class="lead">Valores por pessoa, com material e condução inclusos — e cada um sempre leva a própria criação. É só escolher a experiência e o espaço que mais combinam com o time. ✨</p>
    <div class="rule"></div>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th class="hl"><span class="pill">Perfumaria</span><br>Perfumaria<span>autoral</span></th>
        <th>Cerâmica · Pintura<span>Vela · Arranjos florais</span></th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="rl"><b>Jules · Campo Belo</b><span>cafeteria parceira</span></td>
          <td class="val hl">R$ 299</td>
          <td class="val">R$ 239</td>
        </tr>
        <tr>
          <td class="rl"><b>Betc Havas Café</b><span>café moderno &amp; criativo</span></td>
          <td class="val hl">R$ 349</td>
          <td class="val">R$ 289</td>
        </tr>
        <tr>
          <td class="rl"><b>Bake Studio</b><span>espaço reservado só pro time</span></td>
          <td class="val hl">R$ 469</td>
          <td class="val">R$ 409</td>
        </tr>
      </tbody>
    </table>
    <div class="note" style="margin-top:14px">◆ Valores <b>por pessoa</b>, com material e condução inclusos. A <b>perfumaria autoral</b> tem um valor; <b>cerâmica, pintura, vela e arranjos florais</b> compartilham o mesmo valor (mais em conta). O <b>Bake Studio</b> é um espaço reservado só pro time. Meados de setembro, em dia útil, a combinar.</div>
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
    <p class="lead">A partir do nível com foto, o workshop ganha o registro profissional e a lembrancinha personalizada pra cada convidada — dois mimos pra deixar tudo ainda mais especial.</p>
    <div class="rule"></div>
    <div class="plans">
      <div class="plan">
        <div class="plan-photo sq"><img src="assets/desp-hero2.jpg" alt="Amigas se abraçando e rindo, registradas por um fotógrafo" style="object-position:center 25%"></div>
        <div class="plan-body">
          <h3>Foto profissional</h3>
          <span class="tag basic">Registro do evento</span>
          <ul class="feat">
            <li>Um fotógrafo cobre o workshop inteiro</li>
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
            <li>Um mimo pra levarem do dia pra casa</li>
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
    <h2>É só <em>reunir o time</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pra a celebração ser leve e memorável do começo ao fim:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Escolham a experiência</h3><p>Perfumaria, cerâmica, pintura, vela ou arranjos florais — a que mais combina com o time.</p></div>
      <div class="step"><div class="num">2</div><h3>Escolham o espaço</h3><p>Jules, Betc Havas, o Bake Studio exclusivo ou o próprio escritório — em meados de setembro, dia útil.</p></div>
      <div class="step"><div class="num">3</div><h3>Criar &amp; levar</h3><p>No fim, todo mundo leva pra casa a própria criação — uma lembrança linda do dia. 🥂</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Sob medida pro seu dia</h4>
        <p>A gente ajusta cada detalhe conforme o time e o clima que vocês querem pra celebração. É só combinar. ✨</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora <em>celebrar criando?</em> ✦</h2>
      <p>Me confirma a experiência, o espaço e a data (meados de setembro), que a gente organiza tudo.</p>
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
    <p class="fineprint">Proposta de experiência corporativa da Elarah — vivência criativa à escolha (perfumaria autoral, cerâmica, pintura, vela aromática ou arranjos florais) para celebrar o aniversário da empresa e integrar o time, para cerca de 8 pessoas, em meados de setembro (em dia útil, a combinar), em espaço parceiro em SP, no Bake Studio ou no próprio escritório da empresa. Cada participante cria e leva a própria peça. Valores por pessoa. Perfumaria autoral: Jules · Campo Belo R$ 299 / Betc Havas Café R$ 349 / Bake Studio (espaço reservado) R$ 469. Cerâmica, pintura, vela e arranjos florais: Jules · Campo Belo R$ 239 / Betc Havas Café R$ 289 / Bake Studio R$ 409. Proposta válida mediante confirmação de data e disponibilidade de agenda.</p>
    {foot("Experiência corporativa · 2026")}
  </section>'''

deck = '<div class="deck">\n' + cover + experiencias + vibe + espacos + planos + como + '\n\n</div>\n\n'
head = head.replace("<title>Setembro Amarelo · Elarah</title>", "<title>Experiência Corporativa · Aniversário da Empresa · Elarah</title>")
head = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Proposta corporativa da Elarah — perfumaria, cerâmica, pintura, vela ou arranjos florais, no café, no Bake Studio ou no escritório.">', head)
head = head.replace("</head>",
    "<style>*{box-shadow:none!important;-webkit-box-shadow:none!important}"
    ".cover-photo{border:1px solid var(--line)}"
    ".plan-photo,.bfeat .bphoto{border:1px solid var(--line)}"
    "</style>\n</head>")
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-corporativa-empresa.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"))
