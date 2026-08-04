# Despedida de solteira deck — wine/rose palette, 4-experience menu (com vinho incluso) + 3-tier plans.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

# ---- embed fonts: swap the 3 google-fonts <link> lines for the embedded <style> block ----
fonts = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/embedded_fonts_style.html", encoding="utf-8").read()
head = re.sub(r'<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>',
              fonts, head, count=1, flags=re.S)

# ---- recolor CSS to deep wine + rose + blush (despedida de solteira) ----
head = head.replace("--orange:#F27623;", "--orange:#D79A2B;")       # accent: warm copper
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#B07C12;")
head = head.replace("--navy:#16233C;", "--navy:#3A3016;")           # deep espresso (headings/dark)
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#6E6244;") # warm taupe for lead
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#D79A2B;")
head = head.replace("#EDF1F7", "#FBF4E2").replace("#DCE5F1", "#F3E7C5")
head = head.replace("#FF9A4D", "#E6C079")
head = head.replace("rgba(242,118,35,.22)", "rgba(215,154,43,.30)")

# extra CSS: experience menu grid (2x2) + investment table
extra = '''
  .menu{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:12px}
  .exp{position:relative;width:calc(33.333% - 11px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .exp .top{position:absolute;top:11px;left:11px;z-index:3;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 11px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(176,124,18,.5)}
  .exp-photo{aspect-ratio:5/4;overflow:hidden;background:#eee}
  .exp-photo img{width:100%;height:100%;object-fit:cover}
  .exp-body{padding:12px 15px 15px}
  .exp .n{display:inline-block;font-size:9px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:5px}
  .exp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--navy);line-height:1.05}
  .exp p{font-size:11px;color:var(--muted);margin-top:5px;line-height:1.38}
  /* ícones (svg) no lugar de emoji */
  .infocard .ico svg{width:30px;height:30px;display:block}
  /* tabela de investimento (2 coleções x 3 níveis) */
  .itable{width:100%;border-collapse:collapse;margin-top:18px;font-family:'DM Sans'}
  .itable th,.itable td{padding:16px 12px;border-bottom:1px solid var(--line);text-align:center;vertical-align:middle}
  .itable thead th{font-size:12px;color:var(--navy);font-weight:700;border-bottom:2px solid var(--navy);text-transform:uppercase;letter-spacing:.04em}
  .itable thead th span{display:block;font-size:9.5px;font-weight:500;color:var(--muted);letter-spacing:.01em;margin-top:4px;text-transform:none}
  .itable td.rl{text-align:left;width:38%}
  .itable td.rl b{font-family:'DM Serif Display',serif;font-weight:400;font-size:19px;color:var(--navy)}
  .itable td.rl span{display:block;font-size:10.5px;color:var(--muted);margin-top:4px;line-height:1.45}
  .itable .val{font-family:'DM Serif Display',serif;font-size:26px;color:var(--navy);line-height:1;white-space:nowrap}
  .itable .val small{display:block;font-family:'DM Sans';font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-top:4px}
  .itable .hl{background:#FAF0D5}
  .itable thead th.hl{color:var(--orange-dark)}
  .itable tbody tr:last-child td{border-bottom:none}
  .itable thead th.hl{position:relative}
  .itable .pill{display:inline-block;background:var(--navy);color:#fff;font-size:8px;letter-spacing:.08em;padding:3px 9px;border-radius:999px;margin-bottom:7px;font-weight:700;text-transform:uppercase}
  /* wtrio de experiências com vinho (3 quadrados na mesma linha) */
  .wtrio{display:flex;gap:16px;justify-content:center;margin-top:12px}
  .wcard{position:relative;flex:1;max-width:calc(33.333% - 11px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .wcard .top{position:absolute;top:11px;left:11px;z-index:3;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 11px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(176,124,18,.5)}
  .wcard .sq{aspect-ratio:1/1;overflow:hidden;background:#eee}
  .wcard .sq img{width:100%;height:100%;object-fit:cover}
  .wcard-body{padding:13px 15px 15px}
  .wcard .n{display:inline-block;font-size:9px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:5px}
  .wcard h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy);line-height:1.06}
  .wcard p{font-size:11.5px;color:var(--muted);margin-top:5px;line-height:1.4}
  /* bartenderia — destaque horizontal */
  .bfeat{display:flex;margin-top:18px;background:var(--card);border:1.6px solid var(--orange);border-radius:18px;overflow:hidden;box-shadow:0 18px 42px -24px rgba(0,0,0,.34)}
  .bfeat .bphoto{width:38%;overflow:hidden;background:#eee}
  .bfeat .bphoto img{width:100%;height:100%;object-fit:cover;display:block}
  .bfeat .bbody{flex:1;padding:22px 28px 24px;display:flex;flex-direction:column;justify-content:center}
  .bfeat .btag{align-self:flex-start;background:var(--navy);color:#fff;font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:6px 13px;border-radius:999px;margin-bottom:12px}
  .bfeat h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:24px;color:var(--navy);line-height:1}
  .bfeat .sub{display:inline-block;font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-top:6px}
  .bfeat p{font-size:12.5px;color:var(--muted);margin-top:9px;line-height:1.45}
  .dchips{display:flex;flex-wrap:wrap;gap:8px;margin-top:13px}
  .dchips span{background:#FAF0D5;border:1px solid var(--line);border-radius:999px;padding:6px 13px;font-size:11.5px;color:var(--navy);font-weight:500}
</style>'''
head = head.replace("</style>", extra, 1)
# print overrides for the wtrio + bartenderia layout
head = head.replace(".menu-cols{grid-template-columns:1fr 1fr}",
                    ".menu-cols{grid-template-columns:1fr 1fr}\n    .wtrio{flex-direction:row;gap:14px}\n    .wcard{max-width:calc(33.333% - 10px)}\n    .bfeat{flex-direction:row}\n    .bfeat .bphoto{width:38%;height:auto}\n    .wcard-body{padding:10px 13px 12px}\n    .wcard h3{font-size:16px}\n    .wcard p{font-size:10.5px;margin-top:4px;line-height:1.34}\n    .bfeat{margin-top:15px}\n    .bfeat .bbody{padding:16px 22px 17px}\n    .bfeat h3{font-size:21px}\n    .bfeat p{font-size:11.5px;margin-top:7px}\n    .dchips{margin-top:10px;gap:7px}\n    .dchips span{font-size:11px;padding:5px 11px}")
# mobile: wtrio + bfeat stack
head = head.replace(".plans{grid-template-columns:1fr}",
                    ".plans{grid-template-columns:1fr}\n    .wtrio{flex-direction:column}\n    .wcard{max-width:100%}\n    .bfeat{flex-direction:column}\n    .bfeat .bphoto{width:100%;height:220px}")

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
        <span class="kicker">Proposta de experiência corporativa</span>
        <span class="compass">Setembro <span>Amarelo</span><small>Autocuidado &amp; presença</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência Corporativa · Setembro Amarelo</span>
        <h1>Longe das telas,<br>perto de <em>si</em></h1>
        <p class="lead">Uma ação de <strong>autocuidado e saúde mental</strong> pro time: uma palestra sobre o tema somada a uma experiência <strong>mão na massa</strong> que traz presença, desacelera a mente e reforça o cuidar de si. 💛</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip">Palestra <b>+ experiência</b></span>
          <span class="chip"><b>Setembro</b> · a definir</span>
          <span class="chip">Na empresa <b>ou espaço parceiro</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/aniv-experiencia.jpg" alt="Grupo interagindo e criando junto numa experiência da Elarah" style="object-position:center 35%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Já realizado para times como <b>Compass</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)</div>
    {foot("Experiência Corporativa · Setembro Amarelo")}
  </section>'''

buscamos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Palestra + experiência</span></div>
    </div>
    <span class="eyebrow orange">◆ Como funciona a ação</span>
    <h2>Falar <em>e</em> vivenciar</h2>
    <p class="lead">A ação une duas partes que se completam: uma <strong>palestra sobre saúde mental &amp; autocuidado</strong> pra sensibilizar o time, e uma <strong>experiência mão na massa</strong> que coloca o cuidar de si em prática — longe das telas, no presente. 💛</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#D79A2B" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h20v13H14l-5 4v-4H4z"/></svg></div><h3>A palestra</h3><p>Um bate-papo sensível sobre saúde mental, autocuidado e o excesso de telas — pra abrir a conversa no time.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#D79A2B" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3.5 L16 12 L24.5 14 L16 16 L14 24.5 L12 16 L3.5 14 L12 12 Z"/></svg></div><h3>A experiência</h3><p>Mão na massa e sensorial — argila, aromas, pintura. Presença pura, que acalma e reconecta.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#D79A2B" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 25c6-4 9-8 9-12a5 5 0 0 0-9-3 5 5 0 0 0-9 3c0 4 3 8 9 12z"/></svg></div><h3>O que fica</h3><p>Cada um leva a própria criação — um lembrete de pausa e autocuidado pra levar pra casa.</p></div>
    </div>
    <div class="quote">
      <i>"Cuidar da mente também é colocar a mão na massa e voltar pro presente."</i><br>
      — É isso que a Elarah leva pro <strong>Setembro Amarelo</strong> do seu time. 💛
    </div>
    {foot("Palestra + experiência")}
  </section>'''

menu = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O menu</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham a experiência</span>
    <h2>Experiências de <em>autocuidado</em></h2>
    <p class="lead">Cinco experiências sensoriais que conversam com o tema — <strong>presença, calma e cuidar de si</strong>. É só escolher a favorita do time (ou combinar estações). Cada um cria e leva a própria peça. 💛</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","ceramicamodelagem.jpg","Cerâmica","Modelar a argila à mão — meditativo e terapêutico. Puro aqui e agora.","Mãos modelando uma peça de cerâmica","center 50%")}
      {exp("02","pinturatacavinho.jpg","Pintura","Em taça, xícara, caneca, vaso, prato... cada um pinta a peça que quiser.","Peça de vidro pintada à mão","center 45%")}
      {exp("03","perfumariaharbolita.jpg","Perfumaria Botânica","Uma imersão sensorial guiada — respirar fundo e criar a própria fragrância.","Essências e frascos de uma imersão de perfumaria","center 45%")}
      {exp("04","velaaromatica.jpg","Vela Aromática","Um ritual de aromaterapia — cada um cria a própria vela pra acalmar.","Vela aromática artesanal","center 50%")}
      {exp("05","saboneteroxo.jpg","Sabonete Artesanal","Autocuidado no sentido mais literal — aromas e botânicos que relaxam.","Sabonetes artesanais de lavanda","center 50%")}
    </div>
    <div class="note" style="margin-top:14px">◆ Na <b>Pintura</b>, a peça é livre: <b>taça, xícara, caneca, vaso, prato, azulejo</b> e mais — cada um escolhe o que levar pra casa. 🎨</div>
    {foot("As experiências")}
  </section>'''

espacos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Onde acontece</span></div>
    </div>
    <span class="eyebrow orange">◆ Já incluso · espaço exclusivo</span>
    <h2>No <em>Bake Studio</em></h2>
    <p class="lead">Um estúdio lindo e acolhedor na <strong>Bela Vista</strong> (Rua Conselheiro Ramalho, 378), totalmente reservado pro time. O cenário perfeito pra criar com calma, relaxar e trocar ideia — com toda a estrutura pronta pra receber vocês.</p>
    <div class="rule"></div>
    <div class="bfeat" style="height:230px">
      <div class="bphoto"><img src="assets/espaco1.jpg" alt="Lounge acolhedor do Bake Studio" style="object-position:center 55%"></div>
      <div class="bbody">
        <span class="btag">★ Espaço exclusivo incluso</span>
        <h3>Bake Studio <span class="sub">Bela Vista</span></h3>
        <p>Um estúdio charmoso e reservado, só de vocês. A gente reserva o espaço e leva toda a estrutura — o time só chega e põe a mão na massa. 🌿</p>
      </div>
    </div>
    <div class="bfeat plain" style="margin-top:16px;height:190px">
      <div class="bphoto"><img src="assets/espa%C3%A7o2.jpg" alt="Cozinha equipada do Bake Studio, ótima pra um coffee" style="object-position:center 50%"></div>
      <div class="bbody">
        <span class="btag soft">O lounge</span>
        <h3>Acolhedor <span class="sub">e completo</span></h3>
        <p>Cozinha equipada pra um coffee gostoso e um cantinho lindo pra relaxar entre uma criação e outra. Aconchego do começo ao fim.</p>
      </div>
    </div>
    {foot("Onde acontece · Bake Studio")}
  </section>'''

planos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ A experiência</span>
    <h2>A partir de <em>R$ 199</em></h2>
    <p class="lead">Todas as experiências têm o mesmo valor por pessoa — é só escolher a favorita e o nível. Com material e condução inclusos. A <strong>palestra</strong> entra como um <strong>combo à parte</strong>, sob medida pro grupo. 💛</p>
    <div class="rule"></div>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th>A experiência<span>material & condução</span></th>
        <th>Com foto &amp; coffee<span>+ registro profissional &amp; coffee break</span></th>
        <th class="hl"><span class="pill">★ Mais completo</span><br>Completo<span>+ personalização & lembrancinha</span></th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="rl"><b>Cerâmica · Pintura · Perfumaria · Vela · Sabonete</b><span>Todas pelo mesmo valor — cada um leva a sua peça</span></td>
          <td class="val">R$ 199</td><td class="val">R$ 299</td><td class="val hl">R$ 399</td>
        </tr>
      </tbody>
    </table>
    <div class="note" style="margin-top:18px">◆ Valores <b>por pessoa</b>, com material e condução inclusos. O nível <b>Com foto &amp; coffee</b> soma a foto profissional do evento e um coffee break; o <b>Completo</b> soma também a personalização &amp; lembrancinha. A <b>palestra de Setembro Amarelo</b> é combinada à parte, conforme o tema e o número de participantes. Realizado na empresa ou em espaço parceiro.</div>
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
    <p class="lead">Dois extras opcionais que deixam a ação ainda mais marcante — o registro profissional e a lembrancinha personalizada pra cada um.</p>
    <div class="rule"></div>
    <div class="plans">
      <div class="plan">
        <div class="plan-photo sq"><img src="assets/rockworld1.jpg" alt="Momento do time registrado por um fotógrafo" style="object-position:center 45%"></div>
        <div class="plan-body">
          <span class="tag basic">Nível Com foto &amp; coffee · R$ 299</span>
          <h3>Foto profissional &amp; coffee break</h3>
          <ul class="feat">
            <li>Um fotógrafo cobre o encontro inteiro</li>
            <li>Cada risada e cada criação registradas</li>
            <li>Coffee break pra relaxar entre uma criação e outra</li>
          </ul>
          <span class="allin">Memória (e conteúdo) pra marca</span>
        </div>
      </div>
      <div class="plan featured">
        <span class="ribbon">★ Nível Completo · R$ 399</span>
        <div class="plan-photo sq"><img src="assets/personaliza%C3%A7aobrindeescovapiranha.jpg" alt="Kit de lembrancinha personalizada com escova e piranha" style="object-position:center"></div>
        <div class="plan-body">
          <span class="tag premium">Brinde personalizado</span>
          <h3>Lembrancinha personalizada</h3>
          <ul class="feat">
            <li>Kit com <b>escova &amp; piranha</b> pra cada pessoa</li>
            <li>Personalizado com o nome de cada uma</li>
            <li>Um mimo pra levarem do encontro pra casa</li>
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
    <h2>É só <em>reunir o time</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pra o encontro ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>A palestra</h3><p>Um bate-papo sobre saúde mental, autocuidado e sair das telas — pra abrir a conversa.</p></div>
      <div class="step"><div class="num">2</div><h3>A experiência</h3><p>A oficina escolhida — na empresa ou em espaço parceiro. Material, condução e estrutura por nossa conta.</p></div>
      <div class="step"><div class="num">3</div><h3>Presença &amp; cuidado</h3><p>Todo mundo desacelera, cria com as mãos e leva a própria peça pra casa. 💛</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Sob medida pro seu time</h4>
        <p>A gente ajusta a palestra e a experiência conforme o número de pessoas e a mensagem que vocês querem passar. É só combinar. 💛</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora cuidar do <em>seu time?</em> ✦</h2>
      <p>Me conta o número de pessoas e a data de setembro, que a gente monta a ação de autocuidado completa pro seu time.</p>
      <div class="cta-actions">
        <a class="btn-wa" href="https://wa.me/5511914455930?text=Oi%2C%20Elarah!%20Vi%20a%20proposta%20de%20experi%C3%AAncia%20corporativa%20e%20quero%20fechar%20os%20detalhes." target="_blank" rel="noopener">
          💬 Falar no WhatsApp
        </a>
        <div class="contact-links">
          <span>+55 (11) 91445-5930</span>
          <a href="https://instagram.com/elarah.oficial" target="_blank" rel="noopener">@elarah.oficial</a>
          <a href="https://elarah.com.br" target="_blank" rel="noopener">elarah.com.br</a>
        </div>
      </div>
    </div>
    <p class="fineprint">Proposta de ação de Setembro Amarelo da Elarah, unindo uma palestra sobre saúde mental e autocuidado a uma experiência criativa mão na massa, para o time, em setembro (data a definir), na empresa ou em espaço parceiro. Experiência à escolha, pelo mesmo valor: Cerâmica, Pintura (em taça, xícara, caneca, vaso, prato e mais), Perfumaria Botânica, Vela Aromática ou Sabonete Artesanal — cada participante cria e leva a própria peça. A partir de R$ 199 por pessoa (níveis R$ 199 / 299 / 399): A experiência (material e condução) / + foto profissional e coffee break (+R$ 100) / Completo com personalização e lembrancinha (+R$ 100). A palestra é combinada à parte, conforme o número de participantes. Valores por pessoa. Proposta válida mediante confirmação de data e disponibilidade de agenda.</p>
    {foot("Experiência Corporativa · Setembro Amarelo · 2026")}
  </section>'''

cardapio = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O cardápio</span></div>
    </div>
    <span class="eyebrow orange">◆ Na Aula Gastronômica</span>
    <h2>Um menu de <em>três tempos</em></h2>
    <p class="lead">O time cozinha um menu completo, dividido em grupos — cada um cuida de uma etapa. No fim, todo mundo senta pra saborear juntos.</p>
    <div class="rule"></div>
    <div class="wtrio">
      <div class="wcard"><span class="top">1º tempo</span><div class="sq"><img src="assets/entradachef.jpg" alt="Bruschetta de prosciutto com ricota e mel, entrada do chef" style="object-position:center 55%"></div><div class="wcard-body"><span class="n">Entrada</span><h3>Entrada</h3><p>Uma abertura caprichada pra começar bem — quentinha e cheia de sabor.</p></div></div>
      <div class="wcard"><span class="top">2º tempo</span><div class="sq"><img src="assets/risotomar.jpg" alt="Risoto de frutos do mar como prato principal" style="object-position:center 50%"></div><div class="wcard-body"><span class="n">Prato principal</span><h3>Prato principal</h3><p>O prato-estrela, feito a várias mãos — o momento mais mão na massa da noite.</p></div></div>
      <div class="wcard"><span class="top">3º tempo</span><div class="sq"><img src="assets/brownie.jpg" alt="Sobremesa artesanal" style="object-position:center 50%"></div><div class="wcard-body"><span class="n">Sobremesa</span><h3>Sobremesa</h3><p>Pra fechar com chave de ouro — o docinho que coroa o encontro.</p></div></div>
    </div>
    <div class="note" style="margin-top:16px">◆ Este é um <b>exemplo de menu</b> — o cardápio final é definido junto com vocês e pode variar conforme a preferência do time. 🍽️</div>
    {foot("O cardápio")}
  </section>'''

deck = '<div class="deck">\n' + cover + buscamos + menu + planos + personaliza + como + '\n\n</div>\n\n'
# fix title/meta
head = head.replace("<title>Setembro Amarelo · Elarah</title>", "<title>Experiência Corporativa · Integração · Elarah</title>")
head = re.sub(r'<meta name="description" content="Proposta de ação de Setembro Amarelo da Elarah — palestra + experiência de autocuidado.">]*>', '<meta name="description" content="Proposta de experiência corporativa da Elarah — cerâmica, charme de bolsa, perfume ou crochê no Bake Studio.">', head)
# mobile-PDF-safe: some phone PDF viewers render box-shadows as solid gray boxes.
# Kill all shadows and lean on hairline borders instead (clean on every viewer).
head = head.replace("</head>",
    "<style>*{box-shadow:none!important;-webkit-box-shadow:none!important}"
    ".cover-photo{border:1px solid var(--line)}"
    ".plan-photo,.bfeat .bphoto{border:1px solid var(--line)}"
    "</style>\n</head>")
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-setembro-amarelo.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"), html.count("compass\">"))
