# Riachuelo corporate deck v2 — RED palette, creative experience menu + 3-tier plans.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

# ---- recolor CSS to Samsung blue + navy + cream (corporate) ----
head = head.replace("--orange:#F27623;", "--orange:#2F6FCB;")       # accent: Samsung blue
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#244F97;")
head = head.replace("--navy:#16233C;", "--navy:#101B39;")           # deep navy (headings/dark)
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#4A5670;") # muted slate for lead
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#2F6FCB;")
head = head.replace("#EDF1F7", "#EAF0FA").replace("#DCE5F1", "#D6E2F4")
head = head.replace("#FF9A4D", "#7FA4DC")
head = head.replace("rgba(242,118,35,.22)", "rgba(47,111,203,.28)")
# extra CSS: experience menu grid + 3-plan variant
extra = '''
  .menu{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:10px}
  .exp{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 14px 32px -22px rgba(0,0,0,.34)}
  .exp-photo{height:150px;overflow:hidden;background:#eee}
  .exp-photo img{width:100%;height:100%;object-fit:cover}
  .exp-body{padding:13px 16px 16px}
  .exp .n{display:inline-block;font-size:9px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:5px}
  .exp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--navy);line-height:1.08}
  .exp p{font-size:11.5px;color:var(--muted);margin-top:5px;line-height:1.42}
  /* plano rows (horizontais, legíveis) */
  .prows{margin-top:12px;display:flex;flex-direction:column;gap:14px}
  .prow{display:flex;background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:0 14px 30px -24px rgba(0,0,0,.3)}
  .prow.hl{border:2px solid var(--navy)}
  .prow .pl{width:33%;padding:20px 24px;border-right:1px solid var(--line);display:flex;flex-direction:column;justify-content:center;gap:7px}
  .prow.hl .pl{background:#EDF3FC}
  .prow .pr{flex:1;padding:20px 26px;display:flex;flex-direction:column;justify-content:center}
  .prow h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:23px;color:var(--navy);line-height:1}
  .prow .pc{font-family:'DM Serif Display',serif;font-size:20px;color:var(--navy-soft)}
  .prow .pc small{font-family:'DM Sans';font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-left:6px}
  .prow .mlab{font-size:10px;letter-spacing:.1em;font-weight:700;text-transform:uppercase;color:var(--orange-dark);margin-bottom:9px}
  .prow ul{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:9px 22px}
  .prow ul li{position:relative;padding-left:20px;font-size:13px;color:var(--ink);line-height:1.3}
  .prow ul li::before{content:"✦";position:absolute;left:0;top:1px;color:var(--orange);font-size:11px}
  .prow ul li b{font-weight:700}
  /* ícones (svg) no lugar de emoji */
  .infocard .ico svg{width:30px;height:30px;display:block}
  /* tabela de investimento (2 coleções x 3 níveis) */
  .itable{width:100%;border-collapse:collapse;margin-top:16px;font-family:'DM Sans'}
  .itable th,.itable td{padding:15px 12px;border-bottom:1px solid var(--line);text-align:center;vertical-align:middle}
  .itable thead th{font-size:12px;color:var(--navy);font-weight:700;border-bottom:2px solid var(--navy);text-transform:uppercase;letter-spacing:.04em}
  .itable thead th span{display:block;font-size:9.5px;font-weight:500;color:var(--muted);letter-spacing:.01em;margin-top:4px;text-transform:none}
  .itable td.rl{text-align:left;width:36%}
  .itable td.rl b{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy)}
  .itable td.rl span{display:block;font-size:10.5px;color:var(--muted);margin-top:4px;line-height:1.45}
  .itable .val{font-family:'DM Serif Display',serif;font-size:25px;color:var(--navy);line-height:1}
  .itable .hl{background:#E8EFFB}
  .itable thead th.hl{color:var(--orange-dark)}
  .itable tbody tr:last-child td{border-bottom:none}
  .itable thead th.hl{position:relative}
  .itable .pill{display:inline-block;background:var(--navy);color:#fff;font-size:8px;letter-spacing:.08em;padding:3px 9px;border-radius:999px;margin-bottom:7px;font-weight:700;text-transform:uppercase}
  /* espaço exclusivo — fotos quadradas */
  .spaces{display:flex;gap:26px;justify-content:center;margin-top:20px}
  .space{width:330px;max-width:42%;margin:0}
  .space .sq{aspect-ratio:1/1;border-radius:16px;overflow:hidden;box-shadow:0 22px 46px -26px rgba(0,0,0,.42)}
  .space .sq img{width:100%;height:100%;object-fit:cover;display:block}
  .space figcaption{margin-top:13px;text-align:center;font-family:'DM Serif Display',serif;font-size:15.5px;color:var(--navy)}
  /* logo co-brand na capa */
  .cllogo{height:29px;width:auto;display:block;margin:3px 0 1px}
  .cbbrand{display:block;font-family:'DM Serif Display',serif;font-size:19px;color:var(--navy);line-height:1;margin:3px 0 2px}
  .cbsub{font-size:8.5px;letter-spacing:.28em;color:var(--navy-soft);font-weight:500;text-transform:uppercase}
  /* opções de objeto (7) */
  .opts{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin-top:16px}
  .opt{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px 14px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:9px;box-shadow:0 12px 26px -22px rgba(0,0,0,.3)}
  .opt svg{width:34px;height:34px;stroke:var(--orange);fill:none;stroke-width:1.5}
  .opt h4{font-family:'DM Serif Display',serif;font-weight:400;font-size:15.5px;color:var(--navy);line-height:1.05}
  /* pacote confirmado */
  .confbox{margin-top:16px;display:grid;grid-template-columns:1.05fr 1fr;gap:16px}
  .confbox .big{background:var(--navy);color:#fff;border-radius:18px;padding:26px 30px;display:flex;flex-direction:column;justify-content:center}
  .confbox .big .lab{font-size:10px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:#7FA4DC;margin-bottom:8px}
  .confbox .big .val{font-family:'DM Serif Display',serif;font-size:52px;line-height:.95}
  .confbox .big .per{font-size:12.5px;color:#C7D4EC;margin-top:8px}
  .confbox .inc{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px 26px}
  .confbox .inc h4{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy);margin-bottom:12px}
  .confbox .inc ul{list-style:none;padding:0;margin:0}
  .confbox .inc li{position:relative;padding-left:23px;font-size:12.5px;color:var(--navy);line-height:1.4;margin-bottom:10px}
  .confbox .inc li:before{content:"✓";position:absolute;left:0;top:0;color:var(--orange);font-weight:700}
  .confbox .inc li b{font-weight:700}
</style>'''
head = head.replace("</style>", extra, 1)
# print overrides for grid
head = head.replace(".menu-cols{grid-template-columns:1fr 1fr}",
                    ".menu-cols{grid-template-columns:1fr 1fr}\n    .menu{grid-template-columns:repeat(3,1fr);gap:13px}\n    .exp-photo{height:120px}\n    .exp-body{padding:10px 13px 12px}\n    .exp h3{font-size:15.5px}\n    .exp p{font-size:10.5px;margin-top:4px;line-height:1.35}\n    .opts{grid-template-columns:repeat(4,1fr)}\n    .confbox{grid-template-columns:1.05fr 1fr}")
# mobile: menu single col
head = head.replace(".plans{grid-template-columns:1fr}",
                    ".plans{grid-template-columns:1fr}\n    .menu{grid-template-columns:1fr}")

def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'

def exp(n, img, name, desc, alt, pos="center 50%"):
    return f'<div class="exp"><div class="exp-photo"><img src="assets/{img}" alt="{alt}" style="object-position:{pos}"></div><div class="exp-body"><span class="n">{n}</span><h3>{name}</h3><p>{desc}</p></div></div>'

cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right">
        <span class="kicker">Experiência corporativa confirmada para</span>
        <img class="cllogo" src="assets/samsunglogo.png" alt="Samsung"><span class="cbsub">time de Design · pintura em vidro</span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Confirmação da experiência · Pintura em Vidro</span>
        <h1>Está tudo<br><em>pronto</em></h1>
        <p class="lead">O encontro do time de Design da Samsung está fechado: uma <strong>experiência de pintura em vidro</strong> no Bake Studio, com espaço exclusivo, coffee break e foto profissional. Cada um pinta o próprio objeto e leva pra casa. 🎨</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>10 pessoas</b></span>
          <span class="chip"><b>28</b> de agosto · tarde</span>
          <span class="chip"><b>Bake Studio</b> · exclusivo</span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/pinturatacaa.jpg" alt="Taças de vidro pintadas à mão com desenhos delicados" style="object-position:center 45%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Já realizado para times como <b>Compass</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)</div>
    {foot("Experiência confirmada · Samsung")}
  </section>'''

opcoes = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Escolham o objeto</span></div>
    </div>
    <span class="eyebrow orange">◆ Sete objetos pra pintar</span>
    <h2>Cada um escolhe o <em>seu</em></h2>
    <p class="lead">No dia, cada pessoa do time escolhe qual objeto de vidro quer pintar e levar pra casa. São sete opções — do brinde do dia a dia à peça de decoração:</p>
    <div class="opts">
      <div class="opt"><svg viewBox="0 0 24 24"><path d="M7 3h10l-1 7a4 4 0 0 1-8 0z"/><path d="M12 17v4"/><path d="M8 21h8"/></svg><h4>Taça</h4></div>
      <div class="opt"><svg viewBox="0 0 24 24"><path d="M5 8h12v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M17 9h2a2 2 0 0 1 0 5h-2"/></svg><h4>Xícara</h4></div>
      <div class="opt"><svg viewBox="0 0 24 24"><path d="M7 4h10l-1 15a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2z"/></svg><h4>Copo</h4></div>
      <div class="opt"><svg viewBox="0 0 24 24"><path d="M8 3h8l-.6 16a2 2 0 0 1-2 2h-2.8a2 2 0 0 1-2-2z"/><path d="M8.4 8h7.2"/></svg><h4>Copo de cerveja</h4></div>
      <div class="opt"><svg viewBox="0 0 24 24"><path d="M9 3h6l-1 4c3 2 4 5 4 8a6 6 0 0 1-12 0c0-3 1-6 4-8z"/></svg><h4>Vaso</h4></div>
      <div class="opt"><svg viewBox="0 0 24 24"><path d="M8 3h6v3l3 3v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9l2-2z"/><path d="M14 6h3"/></svg><h4>Jarra</h4></div>
      <div class="opt"><svg viewBox="0 0 24 24"><path d="M9 3h6v2l-1 2c3 1 5 4 5 8a7 7 0 0 1-14 0c0-4 2-7 5-8L9 5z"/></svg><h4>Moringa</h4></div>
      <div class="opt" style="background:#EDF3FC;border-color:var(--orange)"><svg viewBox="0 0 24 24" style="stroke:var(--orange)"><path d="M12 3l2.2 5.6L20 9.2l-4 3.9 1 5.9-5-2.9-5 2.9 1-5.9-4-3.9 5.8-.6z"/></svg><h4>É só escolher!</h4></div>
    </div>
    <div class="note" style="margin-top:14px">◆ Cada convidado escolhe o objeto favorito na hora e pinta do jeitinho dele — todos inclusos no valor, sem custo extra por tipo. 🎨</div>
    {foot("Escolham o objeto")}
  </section>'''

menu = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O menu</span></div>
    </div>
    <span class="eyebrow orange">◆ A experiência confirmada</span>
    <h2>Pintura em <em>Vidro</em></h2>
    <p class="lead">Com tintas próprias pra vidro, cada pessoa pinta à mão o próprio objeto — do desenho livre ao mais delicado — e leva pra casa uma peça única. Um chef da arte conduz tudo, sem precisar de talento nenhum. 🎨</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("Inspiração","pinturatacaa.jpg","Traços &amp; folhas","Desenhos delicados em dourado e cor — cada peça com a assinatura de quem pintou.","Taças pintadas à mão com folhas douradas","center 50%")}
      {exp("Inspiração","pinturatacavinho.jpg","Flores &amp; cores","De tulipas a padrões livres — a arte fica com a cara de cada um.","Taça pintada à mão com tulipas coloridas","center 45%")}
      {exp("Inspiração","xicarapintada.jpg","Listras &amp; padrões","Cores vibrantes e traços soltos — não tem certo nem errado.","Xícaras pintadas à mão com listras coloridas","center 50%")}
    </div>
    <div class="note" style="margin-top:14px">◆ Estas são <b>inspirações</b> — na hora, cada um pinta o próprio objeto, do jeitinho dele, e leva pra casa de recordação. 🎨</div>
    {foot("A experiência")}
  </section>'''

espaco = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O Bake Studio · exclusivo</span></div>
    </div>
    <span class="eyebrow orange">◆ Fora do escritório, só de vocês</span>
    <h2>O <em>Bake Studio</em></h2>
    <p class="lead">Um estúdio lindo e <strong>totalmente reservado pro time</strong> — lounge acolhedor e cozinha equipada. O cenário perfeito pra sair da rotina, criar e relaxar juntos, com espaço pra um <strong>coffee break</strong> só de vocês.</p>
    <div class="rule"></div>
    <div class="spaces">
      <figure class="space"><div class="sq"><img src="assets/espaco1.jpg" alt="Lounge do Bake Studio, espaço exclusivo" style="object-position:center 55%"></div><figcaption>Lounge acolhedor</figcaption></figure>
      <figure class="space"><div class="sq"><img src="assets/espa%C3%A7o2.jpg" alt="Cozinha equipada do Bake Studio"></div><figcaption>Cozinha equipada · coffee break</figcaption></figure>
    </div>
    {foot("O Bake Studio · exclusivo")}
  </section>'''

cafes = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">As cafeterias · aberto</span></div>
    </div>
    <span class="eyebrow orange">◆ A opção de R$ 199</span>
    <h2>Ou numa <em>cafeteria</em></h2>
    <p class="lead">Se preferirem um clima mais descontraído, a experiência também rola numa <strong>cafeteria charmosa em São Paulo</strong> — espaço aberto e compartilhado, por R$ 199 por pessoa. Duas opções queridinhas:</p>
    <div class="rule"></div>
    <div class="spaces">
      <figure class="space"><div class="sq"><img src="assets/sowcafe.jpg" alt="Ambiente da Sow Cake Lounge, na Vila Mariana" style="object-position:center 50%"></div><figcaption>Sow Cake Lounge · Vila Mariana</figcaption></figure>
      <figure class="space"><div class="sq"><img src="assets/julescampobelo.jpg" alt="Ambiente da Jules l'Art du Pain, no Campo Belo" style="object-position:center 50%"></div><figcaption>Jules l'Art du Pain · Campo Belo</figcaption></figure>
    </div>
    {foot("As cafeterias · aberto")}
  </section>'''

planos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ O pacote fechado</span>
    <h2>O que está <em>incluso</em></h2>
    <p class="lead">O time escolheu o formato <strong>Bake Studio</strong> — o pacote completo, com espaço exclusivo, coffee break e foto profissional. Tudo por um valor por pessoa. 🎨</p>
    <div class="rule"></div>
    <div class="confbox">
      <div class="big">
        <span class="lab">Por pessoa</span>
        <span class="val">R$ 279</span>
        <span class="per">para 10 pessoas · total R$ 2.790</span>
      </div>
      <div class="inc">
        <h4>Tudo já incluso</h4>
        <ul>
          <li>A experiência de <b>pintura em vidro</b> (objeto à escolha)</li>
          <li><b>Bake Studio</b> exclusivo — cozinha &amp; sala só de vocês</li>
          <li><b>Coffee break</b> incluso</li>
          <li><b>Foto profissional</b> do encontro</li>
          <li>Todo o <b>material, condução e estrutura</b></li>
        </ul>
      </div>
    </div>
    <div class="note" style="margin-top:16px">◆ Valor <b>por pessoa</b>, com tudo incluso. Para 10 pessoas, o pacote fecha em <b>R$ 2.790</b> — no Bake Studio, espaço exclusivo, com coffee break e foto profissional. 🎨</div>
    {foot("O pacote confirmado")}
  </section>'''

personaliza = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Os mimos do encontro</span></div>
    </div>
    <span class="eyebrow orange">◆ No Bake Studio</span>
    <h2>Memória pro <em>time</em></h2>
    <p class="lead">O encontro rende registro profissional e, se quiserem, lembrancinha com a cara da Samsung — pra virar memória do time e conteúdo lindo pra marca.</p>
    <div class="rule"></div>
    <div class="plans">
      <div class="plan">
        <div class="plan-photo sq"><img src="assets/rockworld1.jpg" alt="Momento do time registrado por um fotógrafo" style="object-position:center 45%"></div>
        <div class="plan-body">
          <span class="tag basic">Incluso no Bake Studio</span>
          <h3>Registro fotográfico profissional</h3>
          <ul class="feat">
            <li>Um fotógrafo cobre o encontro inteiro</li>
            <li>Cada risada e cada criação registradas</li>
            <li>Álbum digital lindo pra usar como quiser</li>
          </ul>
          <span class="allin">Memória (e conteúdo) pra marca</span>
        </div>
      </div>
      <div class="plan featured">
        <span class="ribbon">★ Opcional</span>
        <div class="plan-photo sq"><img src="assets/kitempresa.jpg" alt="Kit corporativo personalizado com a marca" style="object-position:center 50%"></div>
        <div class="plan-body">
          <span class="tag premium">Personalização</span>
          <h3>Kits &amp; lembrancinhas</h3>
          <ul class="feat">
            <li>Cada pessoa leva uma lembrancinha da Samsung</li>
            <li>Kit e brinde com o nome de cada um</li>
            <li>Mesa de boas-vindas com a identidade do time</li>
          </ul>
          <span class="allin">Cada um leva o seu mimo</span>
        </div>
      </div>
    </div>
    {foot("Os mimos do encontro")}
  </section>'''

como = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Como funciona &amp; contato</span></div>
    </div>
    <span class="eyebrow orange">◆ Está tudo alinhado</span>
    <h2>Próximos <em>passos</em></h2>
    <p class="lead">O que ficou definido pro encontro do time de Design da Samsung — é só chegar e criar. A Elarah cuida de todo o resto:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>A experiência</h3><p>Pintura em vidro — cada um escolhe o objeto (taça, xícara, copo, vaso e mais) e leva pra casa.</p></div>
      <div class="step"><div class="num">2</div><h3>O espaço</h3><p>No Bake Studio, exclusivo pro time — com coffee break e foto profissional inclusos.</p></div>
      <div class="step"><div class="num">3</div><h3>É só chegar</h3><p>Um profissional conduz tudo, com material e estrutura prontos. Vocês só criam e se conectam. 🎨</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Momento da empresa</h4>
        <p>Reservem <b>+1h no mesmo encontro</b> pra fala, brinde e agradecimento do time — a tarde toda, sem correria. <b>Sem custo adicional: é por nossa conta.</b></p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora deixar tudo <em>redondo?</em> ✦</h2>
      <p>Me confirma a data (28 de agosto) e o número final de convidados, que a gente reserva o Bake Studio e fecha cada detalhe.</p>
      <div class="cta-actions">
        <a class="btn-wa" href="https://wa.me/5511914455930?text=Oi%2C%20Elarah!%20Sobre%20a%20experi%C3%AAncia%20de%20pintura%20em%20vidro%20da%20Samsung%2C%20quero%20fechar%20os%20detalhes." target="_blank" rel="noopener">
          💬 Falar no WhatsApp
        </a>
        <div class="contact-links">
          <span>+55 (11) 91445-5930</span>
          <a href="https://instagram.com/elarah.oficial" target="_blank" rel="noopener">@elarah.oficial</a>
          <a href="https://elarah.com.br" target="_blank" rel="noopener">elarah.com.br</a>
        </div>
      </div>
    </div>
    <p class="fineprint">Apresentação final da experiência corporativa da Elarah para o time de Design da Samsung, para 10 participantes, no dia 28 de agosto (período da tarde). Experiência confirmada: pintura em vidro, com cada convidado escolhendo o objeto a pintar (taça, xícara, copo, copo de cerveja, vaso, jarra ou moringa) e levando a peça pra casa. Formato Bake Studio: espaço exclusivo (cozinha e sala) só do time, com coffee break e foto profissional inclusos, a R$ 279 por pessoa — total de R$ 2.790 para 10 pessoas. Valor por pessoa, com material, condução e estrutura inclusos. Inclui +1h para o momento da empresa, sem custo adicional. Sujeito à confirmação da data (28 de agosto) e disponibilidade de agenda.</p>
    {foot("Experiência confirmada · Samsung · 2026")}
  </section>'''

deck = '<div class="deck">\n' + cover + menu + opcoes + espaco + planos + como + '\n\n</div>\n\n'
# fix title/meta
head = head.replace("<title>Experiência Corporativa · Elarah × Compass</title>", "<title>Pintura em Vidro · Elarah × Samsung · Confirmação</title>")
head = re.sub(r'<meta name="description"[^>]*>', '<meta name="description" content="Apresentação final da experiência de pintura em vidro da Elarah para o time de Design da Samsung, no Bake Studio.">', head)
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-samsung-pintura-vidro.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| Compass refs:", html.count("Compass"), "| Riachuelo refs:", html.count("Riachuelo"), "| slides: 7")
