# Aniversario VM · Vela ou Ceramica · 15 pessoas · SP · domingo out/nov. Café (199/299/399) + Bake Studio (289/389/539). Wine-rose.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

fonts = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/embedded_fonts_style.html", encoding="utf-8").read()
head = re.sub(r'<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>',
              fonts, head, count=1, flags=re.S)

# ---- recolor: terracota-rosé (loja aconchegante) ----
head = head.replace("--orange:#F27623;", "--orange:#C77B6B;")
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#A55D4D;")
head = head.replace("--navy:#16233C;", "--navy:#2E2320;")
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#665650;")
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#C77B6B;")
head = head.replace("#EDF1F7", "#F7F0EC").replace("#DCE5F1", "#EEDDD4")
head = head.replace("#FF9A4D", "#DBA593")
head = head.replace("rgba(242,118,35,.22)", "rgba(199,123,107,.26)")

extra = '''
  .menu{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:12px}
  .exp{position:relative;width:calc(33.333% - 11px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .exp .top{position:absolute;top:11px;left:11px;z-index:3;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 11px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(165,93,77,.4)}
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
  .itable .hl{background:#EFE0D7}
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
  .itbl-label{margin-top:16px;margin-bottom:2px;font-family:'DM Serif Display',serif;font-size:18px;color:var(--navy);display:flex;align-items:baseline;gap:9px}
  .itbl-label b{font-size:10px;letter-spacing:.09em;text-transform:uppercase;font-weight:700;color:var(--orange);font-family:'DM Sans'}
  .itable.cx{margin-top:7px}
  .itable.cx th,.itable.cx td{padding:9px 11px}
  .itable.cx .val{font-size:20px}
  .itable.cx thead th{font-size:11px}
  .itable.cx .val small{margin-top:4px}
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
        <span class="kicker">Proposta corporativa · Experiências mensais</span>
        <span class="compass">Na sua <span>loja</span><small>Experiências mensais</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiências mensais na sua loja · 1º tema: Arranjos florais</span>
        <h1>Um ritual<br>que <em>encanta</em></h1>
        <p class="lead">Uma série de encontros criativos na sua loja, com um <strong>tema novo a cada edição</strong> — pra encantar clientes e time e criar comunidade. Começando pelos <strong>arranjos florais</strong>: cada convidado monta o próprio e leva pra casa. 🌸</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>15</b> pessoas</span>
          <span class="chip"><b>Mensal</b> ou a cada 45 dias</span>
          <span class="chip"><b>Praia Grande</b> · na sua loja</span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/florseca.jpg" alt="Arranjos florais delicados montados à mão em papel kraft" style="object-position:center 45%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Já realizado para times como <b>Compass</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)</div>
    {foot("Experiências mensais na loja")}
  </section>'''

experiencias = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">As experiências</span></div>
    </div>
    <span class="eyebrow orange">◆ Um tema novo a cada edição</span>
    <h2>Calendário de <em>experiências</em></h2>
    <p class="lead">A ideia é criar um ritual: a cada mês (ou 45 dias), uma experiência criativa diferente na loja. Começando pelos <strong>arranjos florais</strong> e seguindo com uma vitrine de temas pra manter a comunidade sempre animada. 🌸</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","florseca.jpg","Arranjos florais","Cada um monta o próprio arranjo com flores da estação — delicado e cheio de vida.","Arranjos florais montados à mão","center 45%","★ 1º tema")}
      {exp("02","homespray.jpg","Buquê &amp; home spray","Um buquê lindo pra montar e um home spray floral pra perfumar a casa.","Home spray floral artesanal em frasco elegante","center 50%")}
      {exp("03","perfumariamaes.jpg","Perfumaria","Criar o próprio perfume com notas exclusivas — uma fragrância única.","Mesa de perfumaria com essências e flores","center 45%")}
      {exp("04","velaaromatica.jpg","Vela aromática","Escolher o aroma e criar a própria vela — relaxante e cheia de charme.","Vela aromática artesanal acesa","center 50%")}
      {exp("05","pinturatacaa.jpg","Pintura em taça","Pintar à mão a própria taça com desenhos autorais — elegante e única.","Taças pintadas à mão","center 50%")}
      {exp("06","ceramica1.jpg","Pintura em cerâmica","Pintar a própria peça de cerâmica com cores e desenhos — delicada e única.","Mãos pintando cerâmica","center 50%")}
    </div>
    <div class="note" style="margin-top:14px">◆ A gente monta um <b>calendário sob medida</b> com você — é só escolher os temas e as datas. Cada convidado cria e leva pra casa a própria peça. 🌸</div>
    {foot("As experiências")}
  </section>'''

vibe = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">A vibe</span></div>
    </div>
    <span class="eyebrow orange">◆ O clima da experiência</span>
    <h2>Mais que um evento, <em>uma experiência</em></h2>
    <p class="lead">A gente monta um cenário lindo na loja — mas o que fica mesmo é a experiência: colocar a mão na massa, criar junto e transformar a loja num ponto de encontro cheio de charme. 🌸</p>
    <div class="rule"></div>
    <span class="eyebrow orange" style="display:inline-block">◆ Um cenário à altura</span>
    <div class="vg">
      <div class="vgc">
        <div class="p"><img src="assets/mesa-montada-corp.jpg" alt="Mesa montada decorada com flores, cerâmica e cada lugar preparado" style="object-position:center 50%"></div>
        <div class="b"><span class="t">Sensorial</span><h3>A mesa montada</h3><p>Flores, cerâmica e cada lugar preparado com esmero — um cenário elegante de imersão.</p></div>
      </div>
      <div class="vgc">
        <div class="p"><img src="assets/desp-hero4.jpg" alt="Mesa montada com peças de cerâmica, materiais e flores" style="object-position:center 45%"></div>
        <div class="b"><span class="t">Detalhes</span><h3>Cada detalhe pensado</h3><p>Peças de cerâmica, materiais e flores — a gente cuida do ambiente pra tudo ficar à altura.</p></div>
      </div>
    </div>
    <span class="eyebrow orange" style="margin-top:18px;display:inline-block">◆ A vibe da experiência</span>
    <div class="vg">
      <div class="vgc">
        <div class="p"><img src="assets/vibe-mesa-corp.jpg" alt="Mesa montada com cuidado, materiais e flores secas" style="object-position:center 50%"></div>
        <div class="b"><span class="t">Cuidado</span><h3>Um cenário montado</h3><p>Cada lugar preparado com esmero — mesa, materiais e detalhes à altura.</p></div>
      </div>
      <div class="vgc">
        <div class="p"><img src="assets/vibe-criar-corp.jpg" alt="Mãos criando lado a lado numa experiência sensorial" style="object-position:center 50%"></div>
        <div class="b"><span class="t">Presença</span><h3>Mãos na massa</h3><p>Longe das telas — cada um cria a própria peça, no seu ritmo.</p></div>
      </div>
      <div class="vgc">
        <div class="p"><img src="assets/vibe-conexao-corp.jpg" alt="Convidadas conversando e sorrindo num ambiente elegante" style="object-position:center 40%"></div>
        <div class="b"><span class="t">Conexão</span><h3>Rir e se conectar</h3><p>Um brinde, boas conversas e um time mais unido — pra levar pra sempre.</p></div>
      </div>
    </div>
    <div class="note" style="margin-top:14px">◆ Tudo montado com cuidado na sua loja, com um profissional conduzindo a experiência do começo ao fim — é só receber os convidados e viver o momento. 🌸</div>
    {foot("A vibe da experiência")}
  </section>'''

espacos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Onde acontece</span></div>
    </div>
    <span class="eyebrow orange">◆ A gente leva tudo até a sua loja</span>
    <h2>Experiência <em>na sua loja</em></h2>
    <p class="lead">Você só abre as portas — a Elarah cuida de todo o resto, direto na sua loja na Praia Grande. É só escolher os temas e as datas. 🌸</p>
    <div class="rule"></div>
    <div class="bfeat">
      <div class="bphoto"><img src="assets/levamos-corp.jpg" alt="Time reunido e conversando num encontro criativo" style="object-position:center 35%"></div>
      <div class="bbody">
        <span class="btag">Na sua loja · Praia Grande</span>
        <h3>Levamos até você</h3>
        <span class="sub">Profissional · material · estrutura</span>
        <p>Um profissional da Elarah conduz a experiência, com todo o material e a estrutura montada na loja. Os convidados chegam, criam e se conectam — e cada um leva pra casa a própria criação. Perfeito pra atrair clientes e criar comunidade. 🌸</p>
      </div>
    </div>
    <div class="note" style="margin-top:14px">◆ Perfeito para <b>15 pessoas</b> por edição, <b>mensal ou a cada 45 dias</b> (a combinar). A gente monta tudo antes dos convidados chegarem — a loja vira um ponto de encontro. 🌸</div>
    {foot("Como funciona")}
  </section>'''

planos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Escolha o <em>combo</em></h2>
    <p class="lead">Valores por pessoa, com material, condução e estrutura montada na loja inclusos. Escolham o nível que mais combina com a edição — a partir dos arranjos florais. 🌸</p>
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
          <td class="rl"><b>Experiência do mês</b><span>arranjos florais &amp; próximos temas</span></td>
          <td class="val">R$ 299</td>
          <td class="val">R$ 399<small>+ foto profissional</small></td>
          <td class="val hl">R$ 499<small>+ lembrancinha personalizada</small></td>
        </tr>
      </tbody>
    </table>
    <div class="note" style="margin-top:16px">◆ Valores <b>por pessoa</b>, com material e condução inclusos. O <b>Plus</b> soma a foto profissional do evento e o <b>Premium</b> vem com a lembrancinha personalizada. 🚗 <b>Deslocamento até a Praia Grande</b> (cerca de 80 km / 1h30 de São Paulo) a combinar à parte — e com a agenda recorrente, dá pra otimizar. Datas a combinar.</div>
    {foot("Investimento")}
  </section>'''

personaliza = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">A personalização</span></div>
    </div>
    <span class="eyebrow orange">◆ No nível Premium · com a marca da empresa</span>
    <h2>Escolha a <em>personalização</em></h2>
    <p class="lead">No nível Premium, cada participante leva uma lembrancinha personalizada com a marca da empresa. É só escolher qual combina mais com o time — dois mimos elegantes pra levar de recordação. ✨</p>
    <div class="rule"></div>
    <div class="plans">
      <div class="plan">
        <div class="plan-photo sq"><img src="assets/garrafa-fasano.jpg" alt="Garrafa térmica personalizada com o logo da empresa" style="object-position:center"></div>
        <div class="plan-body">
          <h3>Garrafa térmica</h3>
          <span class="tag basic">Opção 1</span>
          <ul class="feat">
            <li>Personalizada com o <b>logo da empresa</b></li>
            <li>Elegante, sofisticada e resistente</li>
            <li>Pra acompanhar o time todo dia</li>
          </ul>
          <span class="allin">Um mimo pra levar</span>
        </div>
      </div>
      <div class="plan featured">
        <div class="plan-photo sq"><img src="assets/kitempresa.jpg" alt="Bolsa corporativa personalizada com a marca da empresa" style="object-position:center"></div>
        <div class="plan-body">
          <h3>Bolsa personalizada</h3>
          <span class="tag premium">Opção 2</span>
          <ul class="feat">
            <li>Exclusiva com a <b>identidade da empresa</b></li>
            <li>Prática, elegante e do dia a dia</li>
            <li>Pra levar pra todo lugar</li>
          </ul>
          <span class="allin">Cada um escolhe o seu</span>
        </div>
      </div>
    </div>
    <div class="note" style="margin-top:14px">◆ A escolha da lembrancinha é do grupo — <b>garrafa</b> ou <b>bolsa</b>, ambas personalizáveis com o logo da empresa. A partir do <b>Plus</b>, o encontro também ganha foto profissional, coffee break e a mesa montada. ✨</div>
    {foot("A personalização")}
  </section>'''

como = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Como funciona &amp; contato</span></div>
    </div>
    <span class="eyebrow orange">◆ Simples e sob medida</span>
    <h2>É só <em>abrir as portas</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pra cada edição ser leve e memorável do começo ao fim:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Escolham a experiência</h3><p>Perfumaria, aromatizador, vela, pintura em taça ou folding book — a gente leva profissional, material e estrutura.</p></div>
      <div class="step"><div class="num">2</div><h3>A gente vai até a loja</h3><p>Montamos tudo na sua loja na Praia Grande, na data combinada de cada edição.</p></div>
      <div class="step"><div class="num">3</div><h3>Criar &amp; levar</h3><p>Cada participante leva pra casa a própria criação autoral — e o time, uma memória marcante. ✨</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Sob medida pro seu dia</h4>
        <p>A gente ajusta cada detalhe conforme o time e o clima que vocês querem pro encontro. É só combinar. ✨</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora <em>criar esse ritual?</em> ✦</h2>
      <p>Me confirma o primeiro tema (arranjos florais) e a data, que a gente organiza tudo até a Praia Grande.</p>
      <div class="cta-actions">
        <a class="btn-wa" href="https://wa.me/5511914455930?text=Oi%2C%20Elarah!%20Vi%20a%20proposta%20das%20experi%C3%AAncias%20mensais%20na%20loja%20e%20quero%20fechar%20os%20detalhes." target="_blank" rel="noopener">
          💬 Falar no WhatsApp
        </a>
        <div class="contact-links">
          <span>+55 (11) 91445-5930</span>
          <a href="https://instagram.com/elarah.oficial" target="_blank" rel="noopener">@elarah.oficial</a>
          <a href="https://elarah.com.br" target="_blank" rel="noopener">elarah.com.br</a>
        </div>
      </div>
    </div>
    <p class="fineprint">Proposta da Elarah para experiências criativas recorrentes na loja da cliente (Praia Grande) — encontros mensais ou a cada 45 dias, com um tema novo a cada edição, começando pelos arranjos florais e seguindo com buquê, perfumaria, vela aromática, pintura em taça, cerâmica e outros. Para cerca de 15 pessoas por edição. A Elarah leva profissional, material e estrutura até a loja; cada convidado cria e leva a própria peça. Valores por pessoa: Basic R$ 299 (a experiência) / Plus R$ 399 (com foto profissional) / Premium R$ 499 (com lembrancinha personalizada). Deslocamento de São Paulo até a Praia Grande (cerca de 80 km) a combinar à parte. Proposta válida mediante confirmação de datas e disponibilidade de agenda.</p>
    {foot("Experiências mensais na loja · 2026")}
  </section>'''

deck = '<div class="deck">\n' + cover + experiencias + vibe + espacos + planos + como + '\n\n</div>\n\n'
head = head.replace("<title>Setembro Amarelo · Elarah</title>", "<title>Experiências Mensais na Loja · Arranjos Florais · Elarah</title>")
head = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Proposta da Elarah — encontro de pintura em cerâmica e folding book, no café (Jules/Sterna Faria Lima/Betc) ou no Bake Studio.">', head)
head = head.replace("</head>",
    "<style>*{box-shadow:none!important;-webkit-box-shadow:none!important}"
    ".cover-photo{border:1px solid var(--line)}"
    ".plan-photo,.bfeat .bphoto{border:1px solid var(--line)}"
    "</style>\n</head>")
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-loja-mensal.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"))
