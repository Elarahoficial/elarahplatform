# Clube do livro · 2 anos — Colagem & Bordado com Fotografia. Terracota/clay palette.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

# ---- embed fonts ----
fonts = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/embedded_fonts_style.html", encoding="utf-8").read()
head = re.sub(r'<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>',
              fonts, head, count=1, flags=re.S)

# ---- recolor CSS: warm terracotta / clay (cozy, literary, afetivo) ----
head = head.replace("--orange:#F27623;", "--orange:#C56B54;")        # accent: terracotta rose
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#A4432E;")
head = head.replace("--navy:#16233C;", "--navy:#33241C;")            # deep espresso
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#6E5A4E;")  # warm taupe
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#C56B54;")
head = head.replace("#EDF1F7", "#F7EFE7").replace("#DCE5F1", "#ECDDD0")
head = head.replace("#FF9A4D", "#E39B7F")
head = head.replace("rgba(242,118,35,.22)", "rgba(197,107,84,.28)")

extra = '''
  .menu{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:12px}
  .exp{position:relative;width:calc(33.333% - 11px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .exp .top{position:absolute;top:11px;left:11px;z-index:3;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 11px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(164,67,46,.45)}
  .exp-photo{aspect-ratio:5/4;overflow:hidden;background:#eee}
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
  .itable .val small{display:block;font-family:'DM Sans';font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-top:4px}
  .itable .hl{background:#F6E7DE}
  .itable thead th.hl{color:var(--orange-dark)}
  .itable tbody tr:last-child td{border-bottom:none}
  .itable .pill{display:inline-block;background:var(--navy);color:#fff;font-size:8px;letter-spacing:.08em;padding:3px 9px;border-radius:999px;margin-bottom:7px;font-weight:700;text-transform:uppercase}
  /* espaço parceiro — destaque horizontal */
  .bfeat{display:flex;margin-top:18px;background:var(--card);border:1.6px solid var(--orange);border-radius:18px;overflow:hidden;box-shadow:0 18px 42px -24px rgba(0,0,0,.34)}
  .bfeat .bphoto{width:42%;overflow:hidden;background:#eee}
  .bfeat .bphoto img{width:100%;height:100%;object-fit:cover;display:block}
  .bfeat .bbody{flex:1;padding:24px 30px 26px;display:flex;flex-direction:column;justify-content:center}
  .bfeat .btag{align-self:flex-start;background:var(--navy);color:#fff;font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:6px 13px;border-radius:999px;margin-bottom:12px}
  .bfeat h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:25px;color:var(--navy);line-height:1.02}
  .bfeat .sub{display:inline-block;font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-top:6px}
  .bfeat p{font-size:12.5px;color:var(--muted);margin-top:11px;line-height:1.5}
  .dchips{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
  .dchips span{background:#F6E7DE;border:1px solid var(--line);border-radius:999px;padding:6px 13px;font-size:11.5px;color:var(--navy);font-weight:500}
  /* placeholder pra foto da lembrancinha (a Elara adiciona) */
  .plan-photo.ph{display:flex;align-items:center;justify-content:center;background:#F6E7DE;border:1.4px dashed var(--orange)!important}
  .plan-photo.ph span{font-size:12px;color:var(--orange-dark);font-weight:600;letter-spacing:.02em;text-align:center;padding:0 26px;line-height:1.5}
</style>'''
head = head.replace("</style>", extra, 1)
# print overrides
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
        <span class="kicker">Proposta de experiência · Clube do livro</span>
        <span class="compass">Clube do <span>Livro</span><small>2 anos de encontros</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência criativa · Colagem &amp; Bordado com Fotografia</span>
        <h1>Dois anos de<br>boas <em>histórias</em></h1>
        <p class="lead">Uma experiência <strong>afetiva e criativa</strong> pra comemorar os 2 anos do clube: <strong>colagem e bordado com fotografia</strong>, onde cada convidada monta a própria obra — e leva pra casa de recordação. 🧡</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>13</b> pessoas</span>
          <span class="chip"><b>Agosto</b> · a combinar</span>
          <span class="chip">Em <b>cafeteria parceira</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/rockworld1.jpg" alt="Grupo se abraçando e comemorando junto numa experiência da Elarah" style="object-position:center 30%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Já realizado para times como <b>Compass</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)</div>
    {foot("Clube do livro · 2 anos")}
  </section>'''

experiencia = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">A experiência</span></div>
    </div>
    <span class="eyebrow orange">◆ Como funciona</span>
    <h2>Colagem, bordado <em>&amp;</em> fotografia</h2>
    <p class="lead">Uma experiência guiada, sensível e cheia de memória: recortes, papéis afetivos, pontos de bordado e <strong>fotos de verdade</strong> se juntam numa obra única. Perfeita pra celebrar dois anos de boas leituras — e cada convidada leva a própria criação pra casa. 🧡</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#C56B54" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5h13l5 5v13H5z"/><path d="M18 5v5h5"/><path d="M9 15h8M9 19h6"/></svg></div><h3>A colagem</h3><p>Recortes de revistas, papéis e detalhes afetivos que viram uma composição só sua — livre e cheia de personalidade.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#C56B54" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22 L22 6"/><circle cx="22" cy="6" r="2.4"/><path d="M9 19l2 2M12 16l2 2M15 13l2 2"/></svg></div><h3>O bordado</h3><p>Pontos simples e delicados que dão textura e carinho à peça — um toque manual que faz toda a diferença.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#C56B54" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="7" width="20" height="15" rx="2.5"/><circle cx="14" cy="14.5" r="4"/><path d="M10 7l2-3h4l2 3"/></svg></div><h3>A fotografia</h3><p>Fotos que importam entram na obra — memórias do clube e das leituras que uniram todo mundo nesses dois anos.</p></div>
    </div>
    <div class="quote">
      <i>"Uma obra afetiva pra guardar — do jeitinho de cada uma."</i><br>
      É isso que a Elarah leva pros <strong>2 anos do clube</strong>. 🧡
    </div>
    {foot("A experiência")}
  </section>'''

galeria = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Inspirações</span></div>
    </div>
    <span class="eyebrow orange">◆ Uma prévia</span>
    <h2>O que vocês vão <em>criar</em></h2>
    <p class="lead">Um gostinho do que dá pra montar — colagens, pontos de bordado e fotos que viram uma obra única, do jeito de cada convidada. Nenhuma fica igual à outra. 🧡</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","colagemreal.jpg","Colagem à mão","Recortar flores, fotos e papéis com calma — o momento mais gostoso e afetivo da experiência.","Mãos recortando flores para uma colagem","center 40%")}
      {exp("02","colagemamor4.jpg","Diário afetivo","Páginas de colagem com selos, fotos e frases — um caderno-obra pra guardar memórias.","Diário de colagem aberto com recortes e fotos","center 50%")}
      {exp("03","colagemamor3.jpg","Bordado &amp; detalhes","Patches, pontos e texturas que dão delicadeza e um toque manual único à peça.","Bordado e detalhes de colagem sobre linho","center 50%")}
    </div>
    <div class="note" style="margin-top:14px">◆ Estas são <b>inspirações</b> — na hora, cada convidada cria a própria obra, livre e do jeitinho dela. 🎨</div>
    {foot("Inspirações")}
  </section>'''

espaco = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Onde acontece</span></div>
    </div>
    <span class="eyebrow orange">◆ Espaço parceiro · a sugestão</span>
    <h2>No <em>Betc Havas Café</em></h2>
    <p class="lead">A sugestão perfeita pro clube: uma cafeteria <strong>cheia de livros</strong>, mas ao mesmo tempo <strong>moderna e bem aconchegante</strong> — cheia de charme e daquele clima gostoso de sentar e ficar. O cenário ideal pra criar, trocar ideia e comemorar em <strong>agosto</strong>. ☕📚</p>
    <div class="rule"></div>
    <div class="bfeat" style="height:250px">
      <div class="bphoto"><img src="assets/sowcafe.jpg" alt="Cafeteria aconchegante e moderna, com madeira, plantas e livros" style="object-position:center 45%"></div>
      <div class="bbody">
        <span class="btag">★ Espaço parceiro</span>
        <h3>Betc Havas Café <span class="sub">livraria &amp; café</span></h3>
        <p>Madeira, plantas, cantinhos de leitura e um café gostoso — um espaço que já respira afeto e criatividade. A gente reserva e leva toda a estrutura da experiência; vocês só chegam e curtem. 🌿</p>
        <div class="dchips">
          <span>Clima de livraria</span>
          <span>Moderno &amp; aconchegante</span>
          <span>Super dá em agosto</span>
        </div>
      </div>
    </div>
    {foot("Onde acontece · cafeteria parceira")}
  </section>'''

planos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ A experiência</span>
    <h2>A partir de <em>R$ 199</em></h2>
    <p class="lead">Escolha o nível que combina com a comemoração — do essencial ao completo. Com material e condução inclusos, sempre com cada convidada levando a própria obra pra casa. 🧡</p>
    <div class="rule"></div>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th>A experiência<span>material & condução</span></th>
        <th>Com foto &amp; voucher<span>+ foto profissional &amp; R$ 30 de voucher</span></th>
        <th class="hl"><span class="pill">★ Mais completo</span><br>Completo<span>+ lembrancinha personalizada</span></th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="rl"><b>Colagem &amp; Bordado com Fotografia</b><span>Cada convidada cria e leva a própria obra</span></td>
          <td class="val">R$ 199</td><td class="val">R$ 299</td><td class="val hl">R$ 399</td>
        </tr>
      </tbody>
    </table>
    <div class="note" style="margin-top:18px">◆ Valores <b>por pessoa</b>, com material e condução inclusos. O nível <b>Com foto &amp; voucher</b> soma a <b>foto profissional</b> do encontro e um <b>voucher de R$ 30</b> de consumo na cafeteria por pessoa; o <b>Completo</b> soma também a <b>lembrancinha personalizada</b>. Realizado no Betc Havas Café, em agosto (data a combinar).</div>
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
    <p class="lead">Dois extras opcionais que deixam a comemoração ainda mais especial — o registro profissional com voucher e a lembrancinha personalizada pra cada uma.</p>
    <div class="rule"></div>
    <div class="plans">
      <div class="plan">
        <div class="plan-photo sq"><img src="assets/colagem.jpg" alt="Momento de colagem do clube registrado por um fotógrafo" style="object-position:center 55%"></div>
        <div class="plan-body">
          <span class="tag basic">Nível Com foto &amp; voucher · R$ 299</span>
          <h3>Foto profissional &amp; voucher</h3>
          <ul class="feat">
            <li>Um fotógrafo cobre o encontro inteiro</li>
            <li>Cada obra, cada risada e cada detalhe registrados</li>
            <li><b>R$ 30 de voucher</b> de consumo na cafeteria pra cada uma</li>
          </ul>
          <span class="allin">Memória (e um mimo) pra levar</span>
        </div>
      </div>
      <div class="plan featured">
        <span class="ribbon">★ Nível Completo · R$ 399</span>
        <div class="plan-photo sq"><img src="assets/marcapaginaflores.jpg" alt="Marca-páginas artesanais de flores prensadas com tassel" style="object-position:center 30%"></div>
        <div class="plan-body">
          <span class="tag premium">Brinde personalizado</span>
          <h3>Marca-página de flores prensadas</h3>
          <ul class="feat">
            <li>Um marca-página artesanal de <b>flores prensadas</b> pra cada convidada</li>
            <li>Com tassel e um toque só dela</li>
            <li>O mimo perfeito pra quem ama ler 🧡</li>
          </ul>
          <span class="allin">Cada uma leva o seu marca-página</span>
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
    <h2>É só <em>reunir o clube</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pra a comemoração ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>A experiência</h3><p>Colagem &amp; bordado com fotografia, com material, condução e toda a estrutura por nossa conta.</p></div>
      <div class="step"><div class="num">2</div><h3>Na cafeteria</h3><p>Num espaço parceiro cheio de livros e charme — a gente reserva e organiza tudo pra vocês.</p></div>
      <div class="step"><div class="num">3</div><h3>Cada uma leva a obra</h3><p>No fim, todo mundo leva pra casa a própria criação — uma recordação afetiva dos 2 anos. 🧡</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Sob medida pro clube</h4>
        <p>A gente ajusta cada detalhe conforme a data de agosto e o clima que vocês querem pra comemoração. É só combinar. 🧡</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora comemorar os <em>2 anos?</em> ✦</h2>
      <p>Me confirma a data de agosto que a gente fecha tudo e reserva a cafeteria pro clube.</p>
      <div class="cta-actions">
        <a class="btn-wa" href="https://wa.me/5511914455930?text=Oi%2C%20Elarah!%20Vi%20a%20proposta%20de%20Colagem%20%26%20Bordado%20com%20Fotografia%20pro%20clube%20e%20quero%20fechar." target="_blank" rel="noopener">
          💬 Falar no WhatsApp
        </a>
        <div class="contact-links">
          <span>+55 (11) 91445-5930</span>
          <a href="https://instagram.com/elarah.oficial" target="_blank" rel="noopener">@elarah.oficial</a>
          <a href="https://elarah.com.br" target="_blank" rel="noopener">elarah.com.br</a>
        </div>
      </div>
    </div>
    <p class="fineprint">Proposta de experiência de Colagem &amp; Bordado com Fotografia da Elarah para a comemoração de 2 anos do clube do livro, para cerca de 13 pessoas, em agosto (data a combinar), no Betc Havas Café. Cada convidada cria e leva a própria obra. A partir de R$ 199 por pessoa (níveis R$ 199 / 299 / 399): A experiência (material e condução) / + foto profissional e R$ 30 de voucher de consumo por pessoa (+R$ 100) / Completo com lembrancinha personalizada (+R$ 100). Valores por pessoa. Proposta válida mediante confirmação de data e disponibilidade de agenda.</p>
    {foot("Clube do livro · Colagem & Bordado com Fotografia · 2026")}
  </section>'''

deck = '<div class="deck">\n' + cover + experiencia + galeria + espaco + planos + personaliza + como + '\n\n</div>\n\n'
head = head.replace("<title>Setembro Amarelo · Elarah</title>", "<title>Colagem & Bordado com Fotografia · Clube do livro · Elarah</title>")
head = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Proposta da Elarah — Colagem & Bordado com Fotografia para os 2 anos do clube do livro, em cafeteria parceira.">', head)
# mobile-PDF-safe: kill shadows, hairline borders
head = head.replace("</head>",
    "<style>*{box-shadow:none!important;-webkit-box-shadow:none!important}"
    ".cover-photo{border:1px solid var(--line)}"
    ".plan-photo,.bfeat .bphoto{border:1px solid var(--line)}"
    "</style>\n</head>")
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-clube-livro.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"))
