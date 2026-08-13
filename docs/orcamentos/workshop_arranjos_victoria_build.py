# Aniversario VM · Vela ou Ceramica · 15 pessoas · SP · domingo out/nov. Café (199/299/399) + Bake Studio (289/389/539). Wine-rose.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

fonts = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/embedded_fonts_style.html", encoding="utf-8").read()
head = re.sub(r'<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>',
              fonts, head, count=1, flags=re.S)

# ---- recolor: coral-blush (arranjos florais) ----
head = head.replace("--orange:#F27623;", "--orange:#D5867A;")
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#B86558;")
head = head.replace("--navy:#16233C;", "--navy:#33272A;")
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#6B575A;")
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#D5867A;")
head = head.replace("#EDF1F7", "#FAF0EE").replace("#DCE5F1", "#F2DED9")
head = head.replace("#FF9A4D", "#E4A99E")
head = head.replace("rgba(242,118,35,.22)", "rgba(213,134,122,.26)")

extra = '''
  .menu{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:12px}
  .exp{position:relative;width:calc(50% - 8px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .exp .top{position:absolute;top:11px;left:11px;z-index:3;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 11px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(184,101,88,.4)}
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
  .itable .hl{background:#F3E0DB}
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
        <span class="kicker">Proposta de experiência · Turma privada</span>
        <span class="compass">Workshop <span>Elarah</span><small>Arranjos florais</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Workshop de arranjos florais · Turma privada</span>
        <h1>Um encontro<br>que <em>floresce</em></h1>
        <p class="lead">Uma tarde criativa e cheia de charme pra você e a turma: um <strong>workshop de arranjos florais</strong>, onde cada uma monta o próprio arranjo com flores da estação e leva pra casa. Puro clima de encontro, delicadeza e boas conversas. 🌸</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>10</b> pessoas</span>
          <span class="chip"><b>Sábado</b> ou <b>domingo</b></span>
          <span class="chip">Em <b>espaço parceiro</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/buque.jpg" alt="Arranjo de flores delicado montado à mão" style="object-position:center 45%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Já realizado para times como <b>Compass</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)</div>
    {foot("Workshop de arranjos florais")}
  </section>'''

experiencias = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O workshop</span></div>
    </div>
    <span class="eyebrow orange">◆ Arranjos florais</span>
    <h2>Cada arranjo, <em>uma arte</em></h2>
    <p class="lead">Com flores fresquinhas da estação, cada convidada monta o próprio arranjo — escolhe as cores, as texturas e o jeitinho dela. A gente leva o profissional, as flores e toda a estrutura; vocês só chegam e criam. 🌸🌿</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","florseca.jpg","Cada arranjo, único","Flores do campo, cores e texturas — cada uma monta o próprio arranjo, do jeitinho dela.","Arranjos florais montados à mão em papel kraft","center 45%")}
      {exp("02","buqueflor.jpg","Do seu jeito","Da paleta delicada à mais vibrante, cada arranjo fica com a cara de quem montou.","Buquê de flores silvestres colorido montado à mão","center 40%")}
    </div>
    <div class="note" style="margin-top:14px">◆ Estas são <b>inspirações</b> — na hora, cada convidada monta o próprio arranjo, livre e do jeitinho dela, e leva pra casa. 🌷</div>
    {foot("As experiências")}
  </section>'''

vibe = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">A vibe</span></div>
    </div>
    <span class="eyebrow orange">◆ O clima da experiência</span>
    <h2>Mais que um workshop, <em>uma sensação</em></h2>
    <p class="lead">A gente monta um cenário lindo — velas, flores e uma mesa cheia de charme — mas o que fica mesmo é o sentimento: colocar a mão na massa, rir junto e viver um momento só de vocês. 🕯️🌸</p>
    <div class="rule"></div>
    <div class="bfeat">
      <div class="bphoto"><img src="assets/aniv-decor.jpg" alt="Mesa de workshop decorada com velas, flores e materiais" style="object-position:center 30%"></div>
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
    <div class="note" style="margin-top:14px">◆ A <b>decoração</b> completa entra no nível <b>Premium</b> do Bake Studio — pra tudo 100% pronto, é só chegar e criar. 🌸</div>
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
    <p class="lead">Duas cafeterias parceiras charmosas (ou o Sterna · Café Faria Lima, também externo) ou o Bake Studio, um estúdio exclusivo só da turma. É só escolher qual combina mais com o workshop. 🌸</p>
    <div class="rule"></div>
    <div class="vg">
      <div class="vgc">
        <div class="p"><img src="assets/julescampobelo.jpg" alt="Cafeteria Jules em Campo Belo, arejada e charmosa" style="object-position:center 60%"></div>
        <div class="b"><span class="t">A partir de R$ 199</span><h3>Jules <span class="sub">Campo Belo · ou Sterna · Faria Lima</span></h3><p>Cafeteria charmosa e arejada. Mesmo valor no <b>Sterna · Café Faria Lima</b> (externo).</p></div>
      </div>
      <div class="vgc">
        <div class="p"><img src="assets/betchavas2.jpg" alt="Interior moderno do Betc Havas Café" style="object-position:center 55%"></div>
        <div class="b"><span class="t">A partir de R$ 249</span><h3>Betc Havas Café <span class="sub">com voucher</span></h3><p>Moderno e cheio de charme — já vem com <b>R$ 50 de voucher</b> de consumo.</p></div>
      </div>
      <div class="vgc hl">
        <div class="p"><img src="assets/espaco1.jpg" alt="Lounge acolhedor do Bake Studio" style="object-position:center 55%"></div>
        <div class="b"><span class="t">★ A partir de R$ 299</span><h3>Bake Studio <span class="sub">exclusivo</span></h3><p>Estúdio <b>só de vocês</b> — experiência + espaço reservado, com coffee break.</p></div>
      </div>
    </div>
    <div class="note" style="margin-top:14px">◆ Cada espaço com o seu valor por pessoa. O <b>Jules · Campo Belo</b> e o <b>Sterna · Café Faria Lima</b> (externo) têm o mesmo valor; no <b>Betc Havas</b> já entra R$ 50 de voucher de consumo; o <b>Bake Studio</b> é reservado só pra turma, com coffee break e decoração nos níveis completos. 🌸</div>
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
    <p class="lead">Valores por pessoa, com material e condução inclusos — e cada uma sempre leva o próprio arranjo. É só escolher o espaço e o nível que mais combinam com o workshop. 🌸</p>
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
          <td class="rl"><b>Jules · Campo Belo ou Sterna · Café Faria Lima</b><span>cafeteria parceira ou externa · mesmo valor</span></td>
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
          <td class="val">R$ 299</td>
          <td class="val">R$ 399<small>+ foto &amp; coffee break</small></td>
          <td class="val hl">R$ 499<small>+ decoração &amp; lembrancinha</small></td>
        </tr>
      </tbody>
    </table>
    <div class="note" style="margin-top:14px">◆ Valores <b>por pessoa</b>, com material e condução inclusos. Cafeterias: <b>Jules · Campo Belo</b> e <b>Sterna · Café Faria Lima</b> (externo, mesmo valor) a partir de R$ 199, e <b>Betc Havas Café</b> (a partir de R$ 249, já com <b>R$ 50 de voucher</b> de consumo) — o Com foto soma a foto profissional e o Completo soma a lembrancinha. No <b>Bake Studio</b> (espaço só de vocês), o Com foto soma a foto profissional e um <b>coffee break</b>, e o Completo vem com <b>decoração &amp; lembrancinha</b>. Sábado ou domingo, a combinar.</div>
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
    <h2>É só <em>reunir a turma</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pra o workshop ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Escolham o espaço</h3><p>Jules · Campo Belo, Sterna · Café Faria Lima, Betc Havas ou o Bake Studio exclusivo — no sábado ou domingo.</p></div>
      <div class="step"><div class="num">2</div><h3>A gente leva tudo</h3><p>Profissional, flores da estação e toda a estrutura do workshop. Vocês só chegam e montam.</p></div>
      <div class="step"><div class="num">3</div><h3>Criar &amp; levar</h3><p>No fim, todo mundo leva pra casa a própria criação — uma lembrança linda do dia. 🥂</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Sob medida pro seu dia</h4>
        <p>A gente ajusta cada detalhe conforme o número de convidadas e o clima que você quer pro workshop. É só combinar. 🌸</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora <em>montar arranjos?</em> ✦</h2>
      <p>Me confirma o espaço e a data (sábado ou domingo), que a gente organiza tudo.</p>
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
    <p class="fineprint">Proposta de experiência da Elarah para turma privada — workshop de arranjos florais, para cerca de 10 pessoas, num sábado ou domingo (a combinar), em espaço parceiro em São Paulo. Cada convidada monta e leva o próprio arranjo. Valores por pessoa. No Jules · Campo Belo e no Sterna · Café Faria Lima (opção externa, mesmo valor): A experiência R$ 199 / Com foto R$ 299 / Completo R$ 399 com lembrancinha. No Betc Havas Café (já com R$ 50 de voucher de consumo): A experiência R$ 249 / Com foto R$ 349 / Completo R$ 449 com lembrancinha. No Bake Studio (espaço exclusivo, experiência + espaço só de vocês): A experiência R$ 299 / Com foto R$ 399 (com foto profissional e coffee break) / Completo R$ 499 com decoração e lembrancinha. Proposta válida mediante confirmação de data e disponibilidade de agenda.</p>
    {foot("Workshop de arranjos florais · 2026")}
  </section>'''

deck = '<div class="deck">\n' + cover + experiencias + vibe + espacos + planos + personaliza + como + '\n\n</div>\n\n'
head = head.replace("<title>Setembro Amarelo · Elarah</title>", "<title>Workshop de Arranjos Florais · Turma Privada · Elarah</title>")
head = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Proposta da Elarah — workshop de arranjos florais para turma privada, no café (Jules/Sterna/Betc) ou no Bake Studio.">', head)
head = head.replace("</head>",
    "<style>*{box-shadow:none!important;-webkit-box-shadow:none!important}"
    ".cover-photo{border:1px solid var(--line)}"
    ".plan-photo,.bfeat .bphoto{border:1px solid var(--line)}"
    "</style>\n</head>")
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-arranjos-victoria.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"))
