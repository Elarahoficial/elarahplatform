# Corporativo Dia das Mulheres · 400 pax · no local da cliente (Cidade de Deus, Osasco) · março/27. Rosé palette.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

fonts = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/embedded_fonts_style.html", encoding="utf-8").read()
head = re.sub(r'<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>',
              fonts, head, count=1, flags=re.S)

# ---- recolor: rosé / magenta elegante (Dia das Mulheres) ----
head = head.replace("--orange:#F27623;", "--orange:#D14D7E;")
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#A82E5C;")
head = head.replace("--navy:#16233C;", "--navy:#33212A;")
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#6E5560;")
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#D14D7E;")
head = head.replace("#EDF1F7", "#FBEEF3").replace("#DCE5F1", "#F4DAE5")
head = head.replace("#FF9A4D", "#E58FB0")
head = head.replace("rgba(242,118,35,.22)", "rgba(209,77,126,.28)")

extra = '''
  .menu{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:12px}
  .exp{position:relative;width:calc(50% - 8px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .exp .top{position:absolute;top:11px;left:11px;z-index:3;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 11px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(168,46,92,.4)}
  .exp-photo{aspect-ratio:16/10;overflow:hidden;background:#eee}
  .exp-photo img{width:100%;height:100%;object-fit:cover}
  .exp-body{padding:14px 18px 17px}
  .exp .n{display:inline-block;font-size:9px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:5px}
  .exp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:20px;color:var(--navy);line-height:1.05}
  .exp p{font-size:12px;color:var(--muted);margin-top:5px;line-height:1.42}
  .infocard .ico svg{width:30px;height:30px;display:block}
  .itable{width:100%;border-collapse:collapse;margin-top:18px;font-family:'DM Sans'}
  .itable th,.itable td{padding:16px 12px;border-bottom:1px solid var(--line);text-align:center;vertical-align:middle}
  .itable thead th{font-size:12px;color:var(--navy);font-weight:700;border-bottom:2px solid var(--navy);text-transform:uppercase;letter-spacing:.04em}
  .itable thead th span{display:block;font-size:9.5px;font-weight:500;color:var(--muted);letter-spacing:.01em;margin-top:4px;text-transform:none}
  .itable td.rl{text-align:left;width:38%}
  .itable td.rl b{font-family:'DM Serif Display',serif;font-weight:400;font-size:19px;color:var(--navy)}
  .itable td.rl span{display:block;font-size:10.5px;color:var(--muted);margin-top:4px;line-height:1.45}
  .itable .val{font-family:'DM Serif Display',serif;font-size:26px;color:var(--navy);line-height:1;white-space:nowrap}
  .itable .hl{background:#FAE3EC}
  .itable thead th.hl{color:var(--orange-dark)}
  .itable tbody tr:last-child td{border-bottom:none}
  .itable .pill{display:inline-block;background:var(--navy);color:#fff;font-size:8px;letter-spacing:.08em;padding:3px 9px;border-radius:999px;margin-bottom:7px;font-weight:700;text-transform:uppercase}
  /* destaque horizontal (grupos grandes) */
  .bfeat{display:flex;margin-top:18px;background:var(--card);border:1.6px solid var(--orange);border-radius:18px;overflow:hidden;box-shadow:0 18px 42px -24px rgba(0,0,0,.34)}
  .bfeat .bphoto{width:42%;overflow:hidden;background:#eee}
  .bfeat .bphoto img{width:100%;height:100%;object-fit:cover;display:block}
  .bfeat .bbody{flex:1;padding:22px 28px 24px;display:flex;flex-direction:column;justify-content:center}
  .bfeat .btag{align-self:flex-start;background:var(--navy);color:#fff;font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:6px 13px;border-radius:999px;margin-bottom:12px}
  .bfeat h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:24px;color:var(--navy);line-height:1.02}
  .bfeat .sub{display:inline-block;font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-top:6px}
  .bfeat p{font-size:12.5px;color:var(--muted);margin-top:9px;line-height:1.48}
  .dchips{display:flex;flex-wrap:wrap;gap:8px;margin-top:13px}
  .dchips span{background:#FAE3EC;border:1px solid var(--line);border-radius:999px;padding:6px 13px;font-size:11.5px;color:var(--navy);font-weight:500}
</style>'''
head = head.replace("</style>", extra, 1)
head = head.replace(".menu-cols{grid-template-columns:1fr 1fr}",
                    ".menu-cols{grid-template-columns:1fr 1fr}\n    .bfeat{flex-direction:row}\n    .bfeat .bphoto{width:42%;height:auto}\n    .bfeat .bbody{padding:16px 22px 17px}\n    .bfeat h3{font-size:21px}\n    .bfeat p{font-size:11.5px;margin-top:7px}\n    .dchips{margin-top:10px;gap:7px}\n    .dchips span{font-size:11px;padding:5px 11px}")
head = head.replace(".plans{grid-template-columns:1fr}",
                    ".plans{grid-template-columns:1fr}\n    .bfeat{flex-direction:column}\n    .bfeat .bphoto{width:100%;height:210px}")

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
        <span class="kicker">Proposta corporativa · Dia das Mulheres</span>
        <span class="compass">Dia das <span>Mulheres</span><small>Experiência criativa</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Evento corporativo · Dia das Mulheres</span>
        <h1>Um brinde<br>a <em>elas</em></h1>
        <p class="lead">Uma celebração de Dia das Mulheres à altura do time: um <strong>workshop criativo</strong> — pintura em taça ou vela aromática — pra até <strong>400 mulheres</strong> viverem juntas, no conforto da própria empresa. Cada uma leva a própria criação. 🌷</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip">Até <b>400</b> pessoas</span>
          <span class="chip"><b>Março</b> · 2027</span>
          <span class="chip">No <b>local da empresa</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/aniv-experiencia.jpg" alt="Mulheres criando juntas numa experiência da Elarah" style="object-position:center 30%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Já realizado para times como <b>Compass</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)</div>
    {foot("Corporativo · Dia das Mulheres")}
  </section>'''

workshops = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Os workshops</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham o workshop</span>
    <h2>Dois workshops, <em>o mesmo valor</em></h2>
    <p class="lead">Duas experiências criativas lindas pra escolher — <strong>pelo mesmo valor por pessoa</strong>. É só decidir a que mais combina com o time (ou combinar as duas em estações). Cada participante cria e leva a própria peça. 🌷</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","pinturatacavinho.jpg","Pintura em taça","Cada uma personaliza a própria taça, com cores e traços só seus — o brinde do dia fica ainda mais especial.","Taça de vidro pintada à mão","center 45%")}
      {exp("02","velaaromatica.jpg","Vela aromática","Um ritual sensorial — cada uma cria a própria vela com o aroma que ama. Puro relax e autocuidado.","Vela aromática artesanal","center 50%")}
    </div>
    <div class="note" style="margin-top:14px">◆ Os dois workshops têm o <b>mesmo valor por pessoa</b> — a escolha é do time. Cada participante leva a própria criação de recordação. 🌷</div>
    {foot("Os workshops")}
  </section>'''

grande = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Para grupos grandes</span></div>
    </div>
    <span class="eyebrow orange">◆ Estrutura pra 400 pessoas</span>
    <h2>Feito pra <em>grandes times</em></h2>
    <p class="lead">Grupo grande a gente resolve com organização: montamos <strong>estações e turmas simultâneas</strong>, com vários profissionais e kits, pra todas viverem a experiência ao mesmo tempo — fluido, sem fila e no <strong>local da empresa</strong> (Cidade de Deus · Osasco). 🙌</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#D14D7E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="8" height="8" rx="1.5"/><rect x="16.5" y="5" width="8" height="8" rx="1.5"/><rect x="3.5" y="16" width="8" height="8" rx="1.5"/><rect x="16.5" y="16" width="8" height="8" rx="1.5"/></svg></div><h3>Estações simultâneas</h3><p>Várias frentes acontecendo ao mesmo tempo, com kits pra todas — todo mundo cria junto, sem espera.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#D14D7E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="10" r="3"/><circle cx="19" cy="10" r="3"/><path d="M3.5 22c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5M14 22c0-3.3 2.5-5.5 5.5-5.5s5 2.2 5 5.5"/></svg></div><h3>Vários profissionais</h3><p>Uma equipe completa da Elarah conduz as turmas — cada grupo bem acompanhado do início ao fim.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#D14D7E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3l2.5 5.2 5.7.8-4.1 4 1 5.7L14 21.8 8.9 24.5l1-5.7-4.1-4 5.7-.8z"/></svg></div><h3>A gente vai até vocês</h3><p>Levamos material, estrutura e equipe direto pra empresa. Sem custo de espaço — é só reunir as 400. 🌷</p></div>
    </div>
    <div class="quote">
      <i>"400 mulheres, uma experiência só — organizada nos mínimos detalhes."</i><br>
      É isso que a Elarah leva pro <strong>Dia das Mulheres</strong> de vocês. 🌷
    </div>
    {foot("Para grupos grandes")}
  </section>'''

planos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>A partir de <em>R$ 199</em></h2>
    <p class="lead">Escolha o nível que combina com a celebração — do essencial ao completo. Valores por pessoa, com material e condução inclusos, no local da empresa. 🌷</p>
    <div class="rule"></div>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th>A experiência<span>material & condução</span></th>
        <th>Com foto<span>+ foto profissional do evento</span></th>
        <th class="hl"><span class="pill">★ Completo</span><br>Completo<span>+ lembrancinha personalizada</span></th>
      </tr></thead>
      <tbody><tr>
        <td class="rl"><b>Pintura em taça · Vela aromática</b><span>Os dois workshops pelo mesmo valor — cada uma leva a sua peça</span></td>
        <td class="val">R$ 199</td><td class="val">R$ 259</td><td class="val hl">R$ 329</td>
      </tr></tbody>
    </table>
    <div class="note" style="margin-top:18px">◆ Valores <b>por pessoa</b>, com material e condução inclusos. Realizado <b>no local da empresa</b> (Cidade de Deus · Osasco), sem custo de espaço. O nível <b>Com foto</b> soma a foto profissional do evento; o <b>Completo</b> soma também a lembrancinha personalizada. Os dois workshops — Pintura em taça e Vela aromática — têm o mesmo valor.</div>
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
    <p class="lead">Dois extras opcionais que deixam a celebração ainda mais marcante — o registro profissional e a lembrancinha personalizada pra cada participante.</p>
    <div class="rule"></div>
    <div class="plans">
      <div class="plan">
        <div class="plan-photo sq"><img src="assets/rockworld1.jpg" alt="Celebração registrada por um fotógrafo" style="object-position:center 30%"></div>
        <div class="plan-body">
          <h3>Foto profissional</h3>
          <span class="tag basic">Nível Com foto · R$ 259</span>
          <ul class="feat">
            <li>Um fotógrafo cobre o evento inteiro</li>
            <li>Cada sorriso e cada criação registrados</li>
            <li>Álbum digital lindo pra empresa usar e postar</li>
          </ul>
          <span class="allin">Memória (e conteúdo) pra marca</span>
        </div>
      </div>
      <div class="plan featured">
        <div class="plan-photo sq"><img src="assets/personaliza%C3%A7aobrindeescovapiranha.jpg" alt="Kit de lembrancinha personalizada com escova e piranha" style="object-position:center"></div>
        <div class="plan-body">
          <h3>Lembrancinha personalizada</h3>
          <span class="tag premium">★ Nível Completo · R$ 329</span>
          <ul class="feat">
            <li>Kit com <b>escova &amp; piranha</b> pra cada participante</li>
            <li>Personalizado com o nome de cada uma</li>
            <li>Um mimo pra levarem do dia pra casa</li>
          </ul>
          <span class="allin">Cada uma leva o seu mimo</span>
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
    <h2>É só <em>reunir elas</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pra o Dia das Mulheres ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Escolham o workshop</h3><p>Pintura em taça ou vela aromática — pelo mesmo valor. A gente leva profissionais, material e estrutura.</p></div>
      <div class="step"><div class="num">2</div><h3>A gente vai até vocês</h3><p>Montamos tudo no local da empresa, com estações e turmas simultâneas pra 400 pessoas. Sem custo de espaço.</p></div>
      <div class="step"><div class="num">3</div><h3>Cada uma leva a arte</h3><p>No fim, todas levam pra casa a própria criação — uma lembrança linda do dia delas. 🌷</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Sob medida pro seu time</h4>
        <p>A gente ajusta a estrutura conforme o número final de pessoas, o formato e a mensagem que vocês querem passar. É só combinar. 🌷</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora celebrar <em>elas?</em> ✦</h2>
      <p>Me confirma o número de participantes e a data de março, que a gente monta a estrutura completa pro Dia das Mulheres do seu time.</p>
      <div class="cta-actions">
        <a class="btn-wa" href="https://wa.me/5511914455930?text=Oi%2C%20Elarah!%20Vi%20a%20proposta%20de%20Dia%20das%20Mulheres%20e%20quero%20fechar%20os%20detalhes." target="_blank" rel="noopener">
          💬 Falar no WhatsApp
        </a>
        <div class="contact-links">
          <span>+55 (11) 91445-5930</span>
          <a href="https://instagram.com/elarah.oficial" target="_blank" rel="noopener">@elarah.oficial</a>
          <a href="https://elarah.com.br" target="_blank" rel="noopener">elarah.com.br</a>
        </div>
      </div>
    </div>
    <p class="fineprint">Proposta corporativa de Dia das Mulheres da Elarah — workshop criativo à escolha (Pintura em taça ou Vela aromática, pelo mesmo valor), para até 400 participantes, em março/2027 (data a definir), realizado no local da empresa (Cidade de Deus, S/N · Vila Yara · Osasco) com estações e turmas simultâneas — sem custo de espaço. Cada participante cria e leva a própria peça. A partir de R$ 199 por pessoa (níveis R$ 199 / 259 / 329): A experiência (material e condução) / + foto profissional do evento / Completo com lembrancinha personalizada. Valores por pessoa. Proposta válida mediante confirmação de data e disponibilidade de agenda.</p>
    {foot("Corporativo · Dia das Mulheres · 2027")}
  </section>'''

deck = '<div class="deck">\n' + cover + workshops + grande + planos + personaliza + como + '\n\n</div>\n\n'
head = head.replace("<title>Setembro Amarelo · Elarah</title>", "<title>Dia das Mulheres · Corporativo · Elarah</title>")
head = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Proposta corporativa de Dia das Mulheres da Elarah — workshop de pintura em taça ou vela pra 400 pessoas, no local da empresa.">', head)
head = head.replace("</head>",
    "<style>*{box-shadow:none!important;-webkit-box-shadow:none!important}"
    ".cover-photo{border:1px solid var(--line)}"
    ".plan-photo,.bfeat .bphoto{border:1px solid var(--line)}"
    "</style>\n</head>")
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-dia-das-mulheres.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"))
