# Aniversario VM · Vela ou Ceramica · 15 pessoas · SP · domingo out/nov. Café (199/299/399) + Bake Studio (289/389/539). Wine-rose.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

fonts = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/embedded_fonts_style.html", encoding="utf-8").read()
head = re.sub(r'<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>',
              fonts, head, count=1, flags=re.S)

# ---- recolor: champagne-grafite (corporativo luxo) ----
head = head.replace("--orange:#F27623;", "--orange:#B08D57;")
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#8A6D3F;")
head = head.replace("--navy:#16233C;", "--navy:#22242A;")
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#54565E;")
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#B08D57;")
head = head.replace("#EDF1F7", "#F4F1EC").replace("#DCE5F1", "#E8E1D4")
head = head.replace("#FF9A4D", "#CBB183")
head = head.replace("rgba(242,118,35,.22)", "rgba(176,141,87,.26)")

extra = '''
  .menu{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:12px}
  .exp{position:relative;width:calc(33.333% - 11px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .exp .top{position:absolute;top:11px;left:11px;z-index:3;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 11px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(138,109,63,.4)}
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
  .itable .hl{background:#EFE7D6}
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
        <span class="kicker">Proposta corporativa · Experiência sensorial</span>
        <span class="compass">Corporativo <span>Elarah</span><small>Encontro sensorial</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Encontro corporativo · Experiência sensorial</span>
        <h1>Uma experiência<br>à sua <em>altura</em></h1>
        <p class="lead">Um encontro sofisticado e sensorial pra conectar os gestores: uma <strong>experiência criativa e autoral</strong> — perfumaria, aromatizador, vela aromática, pintura em taça ou folding book — pra relaxar, criar e viver um momento de conexão. Cada um leva pra casa a própria criação. ✨</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>13</b> participantes</span>
          <span class="chip"><b>25 a 26/11</b> · fim de tarde</span>
          <span class="chip"><b>Sorocaba</b> · levamos até vocês</span>
        </div>
        <div style="margin-top:24px;display:flex;align-items:center;gap:13px">
          <span style="font-size:10px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--muted)">Uma experiência para</span>
          <img src="assets/fasano-logo.png" alt="Fasano" style="height:21px;width:auto">
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/eventocorporativo.jpg" alt="Evento corporativo elegante com pessoas reunidas, brindando e conversando" style="object-position:center 40%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Já realizado para times como <b>Compass</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)</div>
    {foot("Encontro corporativo")}
  </section>'''

experiencias = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">As experiências</span></div>
    </div>
    <span class="eyebrow orange">◆ Cinco experiências sensoriais</span>
    <h2>Escolham a <em>favorita</em></h2>
    <p class="lead">Cinco vivências elegantes e sensoriais pra escolher — todas conduzidas por um profissional, com material e estrutura inclusos. Cada participante cria e leva pra casa a própria peça autoral. ✨</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","perfumaria-corp.jpg","Perfumaria autoral","Cada um cria o próprio perfume com notas exclusivas — uma fragrância única e pessoal.","Mesa de perfumaria autoral com essências e flores","center 50%")}
      {exp("02","aromatizador-corp.jpg","Aromatizador","Criar o próprio aromatizador de ambiente — assinatura olfativa pra levar pra casa ou o escritório.","Kit de aromatizador de ambiente artesanal e elegante","center 50%")}
      {exp("03","vela-corp.jpg","Vela aromática","Escolher o aroma e criar a própria vela — sofisticada, relaxante e cheia de charme.","Vela aromática artesanal acesa","center 50%")}
      {exp("04","pinturatacaa.jpg","Pintura em taça","Pintar à mão a própria taça com desenhos autorais — elegante e cheia de personalidade.","Taças pintadas à mão com desenhos dourados e delicados","center 50%")}
      {exp("05","foldingbook.jpg","Folding book","Dobrar as páginas de um livro em formas esculturais — uma peça de design pra decorar.","Livros dobrados em formas esculturais","center 50%")}
    </div>
    <div class="note" style="margin-top:14px">◆ É só o grupo escolher a experiência favorita — a gente leva tudo até Sorocaba e cada um leva pra casa a própria criação autoral. ✨</div>
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
    <p class="lead">A gente monta um cenário sofisticado e sensorial — mas o que fica mesmo é a experiência: sair do piloto automático, colocar a mão na massa e viver um momento de presença e conexão do time. ✨</p>
    <div class="rule"></div>
    <span class="eyebrow orange" style="display:inline-block">◆ Um cenário à altura</span>
    <div class="vg">
      <div class="vgc">
        <div class="p"><img src="assets/perfumaria-corp.jpg" alt="Mesa sensorial montada com essências, frascos e flores secas" style="object-position:center 50%"></div>
        <div class="b"><span class="t">Sensorial</span><h3>A mesa montada</h3><p>Essências, frascos e detalhes selecionados — um cenário elegante de imersão.</p></div>
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
    <div class="note" style="margin-top:14px">◆ Tudo montado com cuidado em Sorocaba, com um profissional conduzindo a experiência do começo ao fim — pro time só chegar e viver o momento. ✨</div>
    {foot("A vibe da experiência")}
  </section>'''

espacos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Onde acontece</span></div>
    </div>
    <span class="eyebrow orange">◆ A gente leva tudo até vocês</span>
    <h2>Experiência <em>no seu evento</em></h2>
    <p class="lead">Vocês só reúnem o time — a Elarah cuida de todo o resto, direto no espaço do encontro em Sorocaba. É só escolher a experiência e o momento. ✨</p>
    <div class="rule"></div>
    <div class="bfeat">
      <div class="bphoto"><img src="assets/perfumariamaes.jpg" alt="Estrutura sensorial montada, com essências, materiais e flores" style="object-position:center 45%"></div>
      <div class="bbody">
        <span class="btag">No local · Sorocaba</span>
        <h3>Levamos até você</h3>
        <span class="sub">Profissional · material · estrutura</span>
        <p>Um profissional da Elarah conduz a experiência, com todo o material e a estrutura montada no espaço do encontro. O time só chega, cria e se conecta — e cada um leva pra casa a própria criação autoral. Ideal pra um <b>fim de tarde/noite</b> do encontro. ✨</p>
      </div>
    </div>
    <div class="note" style="margin-top:14px">◆ Perfeito para <b>13 participantes</b>, entre os dias <b>25 e 26/11</b> (a combinar). A gente monta tudo antes do time chegar — é só viver o momento. ✨</div>
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
    <p class="lead">Valores por pessoa, com material, condução e a estrutura montada em Sorocaba inclusos. Escolham o nível que mais combina com o encontro — a experiência é à escolha do grupo. ✨</p>
    <div class="rule"></div>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th>Basic<span>a experiência</span></th>
        <th>Plus<span>+ registro do evento</span></th>
        <th class="hl"><span class="pill">★ Premium</span><br>Premium<span>com tudo incluso</span></th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="rl"><b>Experiência à escolha</b><span>perfumaria, aromatizador, vela, pintura em taça ou folding book</span></td>
          <td class="val">R$ 199</td>
          <td class="val">R$ 299<small>+ foto profissional</small></td>
          <td class="val hl">R$ 399<small>+ lembrancinha personalizada</small></td>
        </tr>
      </tbody>
    </table>
    <div class="note" style="margin-top:16px">◆ Valores <b>por pessoa</b>, para as 5 experiências. O <b>Basic</b> é a experiência completa (profissional, material e estrutura em Sorocaba); o <b>Plus</b> soma o registro fotográfico profissional do encontro; e o <b>Premium</b> vem com tudo incluso, com a lembrancinha personalizada pra cada participante. Dias 25 ou 26/11, a combinar.</div>
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
    <p class="lead">A partir do nível Plus, o encontro ganha o registro profissional e a lembrancinha personalizada pra cada participante — dois mimos pra deixar a experiência ainda mais marcante.</p>
    <div class="rule"></div>
    <div class="plans">
      <div class="plan">
        <div class="plan-photo sq"><img src="assets/hidrateimeninas.jpg" alt="Encontro corporativo registrado por um fotógrafo" style="object-position:center 35%"></div>
        <div class="plan-body">
          <h3>Registro fotográfico</h3>
          <span class="tag basic">Nível Plus</span>
          <ul class="feat">
            <li>Um fotógrafo cobre o encontro inteiro</li>
            <li>Cada criação e cada conexão registradas</li>
            <li>Álbum digital pro time e pra empresa</li>
          </ul>
          <span class="allin">Memória do encontro pra sempre</span>
        </div>
      </div>
      <div class="plan featured">
        <div class="plan-photo sq"><img src="assets/kitempresa.jpg" alt="Kit corporativo personalizado, elegante" style="object-position:center"></div>
        <div class="plan-body">
          <h3>Lembrancinha personalizada</h3>
          <span class="tag premium">★ Nível Premium</span>
          <ul class="feat">
            <li>Brinde exclusivo, personalizável com a <b>identidade do encontro</b></li>
            <li>A própria criação autoral embalada com cuidado</li>
            <li>Um mimo elegante pra cada participante levar</li>
          </ul>
          <span class="allin">Cada um leva o seu mimo</span>
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
    <p class="lead">A Elarah cuida de toda a produção pra o encontro ser leve e memorável do começo ao fim:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Escolham a experiência</h3><p>Perfumaria, aromatizador, vela, pintura em taça ou folding book — a gente leva profissional, material e estrutura.</p></div>
      <div class="step"><div class="num">2</div><h3>A gente vai até vocês</h3><p>Montamos tudo no espaço do encontro em Sorocaba, no fim de tarde/noite dos dias 25 ou 26/11.</p></div>
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
      <h2>Bora <em>criar uma experiência à altura?</em> ✦</h2>
      <p>Me confirma a experiência e a data (25 ou 26/11), que a gente organiza tudo até Sorocaba.</p>
      <div class="cta-actions">
        <a class="btn-wa" href="https://wa.me/5511914455930?text=Oi%2C%20Elarah!%20Vi%20a%20proposta%20do%20encontro%20corporativo%20e%20quero%20fechar%20os%20detalhes." target="_blank" rel="noopener">
          💬 Falar no WhatsApp
        </a>
        <div class="contact-links">
          <span>+55 (11) 91445-5930</span>
          <a href="https://instagram.com/elarah.oficial" target="_blank" rel="noopener">@elarah.oficial</a>
          <a href="https://elarah.com.br" target="_blank" rel="noopener">elarah.com.br</a>
        </div>
      </div>
    </div>
    <p class="fineprint">Proposta de encontro corporativo da Elarah — experiência sensorial à escolha (perfumaria autoral, aromatizador, vela aromática, pintura em taça ou folding book), para cerca de 13 participantes, nos dias 25 ou 26/11 (a combinar), no espaço do encontro em Sorocaba (a Elarah leva profissional, material e estrutura). Cada participante cria e leva a própria criação autoral. Valores por pessoa: Basic R$ 199 (a experiência) / Plus R$ 299 (com registro fotográfico profissional) / Premium R$ 399 (com tudo incluso e lembrancinha personalizada). Proposta válida mediante confirmação de data e disponibilidade de agenda.</p>
    {foot("Encontro corporativo · 2026")}
  </section>'''

deck = '<div class="deck">\n' + cover + experiencias + vibe + espacos + planos + personaliza + como + '\n\n</div>\n\n'
head = head.replace("<title>Setembro Amarelo · Elarah</title>", "<title>Encontro Corporativo · Experiência Sensorial · Elarah</title>")
head = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Proposta da Elarah — encontro de pintura em cerâmica e folding book, no café (Jules/Sterna Faria Lima/Betc) ou no Bake Studio.">', head)
head = head.replace("</head>",
    "<style>*{box-shadow:none!important;-webkit-box-shadow:none!important}"
    ".cover-photo{border:1px solid var(--line)}"
    ".plan-photo,.bfeat .bphoto{border:1px solid var(--line)}"
    "</style>\n</head>")
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-corporativo-fasano.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"))
