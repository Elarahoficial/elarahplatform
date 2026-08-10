# Aniversário 18 anos · 25 adolescentes · Ipiranga (levamos até vocês). Menu de 5 experiências jovens. Hot-pink.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

fonts = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/embedded_fonts_style.html", encoding="utf-8").read()
head = re.sub(r'<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>',
              fonts, head, count=1, flags=re.S)

# ---- recolor: pink vibrante (jovem, instagramável) ----
head = head.replace("--orange:#F27623;", "--orange:#D6478A;")
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#AE2E6A;")
head = head.replace("--navy:#16233C;", "--navy:#331E29;")
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#6E5560;")
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#D6478A;")
head = head.replace("#EDF1F7", "#FBEEF4").replace("#DCE5F1", "#F5D9E6")
head = head.replace("#FF9A4D", "#E68AB4")
head = head.replace("rgba(242,118,35,.22)", "rgba(214,71,138,.28)")

extra = '''
  .menu{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:12px}
  .exp{position:relative;width:calc(33.333% - 11px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .exp .top{position:absolute;top:11px;left:11px;z-index:3;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 11px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(174,46,106,.4)}
  .exp-photo{aspect-ratio:1/1;overflow:hidden;background:#eee}
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
  .itable td.rl b{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy)}
  .itable td.rl span{display:block;font-size:10.5px;color:var(--muted);margin-top:4px;line-height:1.45}
  .itable .val{font-family:'DM Serif Display',serif;font-size:26px;color:var(--navy);line-height:1;white-space:nowrap}
  .itable .hl{background:#FAE2EF}
  .itable thead th.hl{color:var(--orange-dark)}
  .itable tbody tr:last-child td{border-bottom:none}
  .itable .pill{display:inline-block;background:var(--navy);color:#fff;font-size:8px;letter-spacing:.08em;padding:3px 9px;border-radius:999px;margin-bottom:7px;font-weight:700;text-transform:uppercase}
  /* catálogo (carrossel de opções) */
  .cat{display:flex;flex-wrap:wrap;gap:12px;margin-top:12px}
  .catc{width:calc(25% - 9px);background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden;box-shadow:0 12px 26px -20px rgba(0,0,0,.3)}
  .catc .p{aspect-ratio:1/1;overflow:hidden;background:#eee}
  .catc .p img{width:100%;height:100%;object-fit:cover}
  .catc h4{font-family:'DM Serif Display',serif;font-weight:400;font-size:13px;color:var(--navy);padding:8px 8px 10px;line-height:1.08;text-align:center}
</style>'''
head = head.replace("</style>", extra, 1)

def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'

def exp(n, img, name, desc, alt, pos="center 50%", top=None):
    tb = f'<span class="top">{top}</span>' if top else ''
    return f'<div class="exp">{tb}<div class="exp-photo"><img src="assets/{img}" alt="{alt}" style="object-position:{pos}"></div><div class="exp-body"><span class="n">{n}</span><h3>{name}</h3><p>{desc}</p></div></div>'

def catc(img, name, pos="center 50%"):
    return f'<div class="catc"><div class="p"><img src="assets/{img}" alt="{name}" style="object-position:{pos}"></div><h4>{name}</h4></div>'

cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right">
        <span class="kicker">Proposta de aniversário</span>
        <span class="compass">18 <span>anos</span><small>Criativo &amp; instagramável</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Aniversário de 18 anos · A gente leva até vocês</span>
        <h1>Fazer 18<br>com <em>estilo</em></h1>
        <p class="lead">Um aniversário jovem, criativo e super <strong>instagramável</strong>: a galera escolhe uma experiência mão na massa, e cada uma leva pra casa o que criou. A gente <strong>leva tudo até vocês</strong>, no Ipiranga. ✨</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>25</b> convidadas</span>
          <span class="chip"><b>18</b> anos</span>
          <span class="chip">No <b>Ipiranga</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/rockworld1.jpg" alt="Amigas comemorando animadas numa experiência da Elarah" style="object-position:center 30%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Já realizado para times como <b>Compass</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)</div>
    {foot("Aniversário de 18 anos")}
  </section>'''

menu = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">As experiências</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham a favorita</span>
    <h2>Cinco ideias <em>instagramáveis</em></h2>
    <p class="lead">As experiências que mais fazem sucesso com a galera jovem — todas <strong>pelo mesmo valor por pessoa</strong>. É só escolher a favorita (ou combinar estações). Cada uma cria e leva pra casa o que fez. ✨</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","pinturatacanova.jpg","Pintura em taça","Cada uma pinta a própria taça — a mais fácil e a mais fofa pra brindar os 18.","Taça de vidro pintada à mão com flores","center 50%")}
      {exp("02","bedazzling-dolce-verao-kit-1781973976526.jpg","Bedazzled","Arte com pedrarias que brilham — telas cheias de charme e muito glitter.","Tela de arte com pedrarias brilhantes","center 50%")}
      {exp("03","tufting12.jpg","Tufting","Com a pistola de tufting, cada uma cria o próprio tapetinho ou quadro. Puro trend!","Pistola de tufting criando um tapete de flor","center 55%")}
      {exp("04","perfumariaapresenta%C3%A7%C3%A3o.jpg","Perfumaria","Uma imersão de aromas — cada uma cria a própria fragrância, do jeitinho dela.","Amigas criando as próprias fragrâncias","center 40%")}
      {exp("05","drinksclassicos.jpg","Aula de drinks","Coquetéis autorais (com versão sem álcool!) pra brindar em grande estilo.","Drink autoral colorido","center 50%")}
    </div>
    <div class="note" style="margin-top:14px">◆ Todas <b>pelo mesmo valor por pessoa</b> — a escolha é da aniversariante. A aula de drinks tem versão <b>sem álcool</b>. 🍹</div>
    {foot("As experiências")}
  </section>'''

catalogo = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Todas as opções</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham a favorita</span>
    <h2>Um <em>menu de ideias</em></h2>
    <p class="lead">Um monte de experiência criativa e instagramável pra escolher — <strong>todas pelo mesmo valor por pessoa</strong>. É só apontar a que a galera curtir (ou combinar estações)! ✨</p>
    <div class="rule"></div>
    <div class="cat">
      {catc("pinturatacanova.jpg","Pintura em taça")}
      {catc("pinturapratoceramica.jpg","Pintura em cerâmica")}
      {catc("ceramicamodelagem.jpg","Modelagem em cerâmica")}
      {catc("velaaromatica.jpg","Vela aromática")}
      {catc("perfumariaapresenta%C3%A7%C3%A3o.jpg","Perfumaria","center 40%")}
      {catc("sabonete.jpg","Sabonete artesanal")}
      {catc("bedazzling-dolce-verao-kit-1781973976526.jpg","Bedazzled")}
      {catc("croche.jpg","Bolsa em crochê")}
      {catc("charmbar.jpg","Charm de bolsa")}
      {catc("bolsasmacrame.jpg","Bolsa de macramê")}
    </div>
    <div class="note" style="margin-top:12px">◆ Todas <b>pelo mesmo valor por pessoa</b> — dá pra escolher uma ou combinar estações. Quer alguma que não está aqui? É só pedir! 🎉</div>
    {foot("Todas as opções")}
  </section>'''

planos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ A experiência</span>
    <h2>A partir de <em>R$ 199</em></h2>
    <p class="lead">Todas as experiências têm o mesmo valor por pessoa — é só escolher a favorita e o nível. Com material e condução inclusos, e a gente leva tudo até o Ipiranga. ✨</p>
    <div class="rule"></div>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th>A experiência<span>material & condução</span></th>
        <th>Com foto<span>+ foto profissional</span></th>
        <th class="hl"><span class="pill">★ Completo</span><br>Completo<span>+ lembrancinha personalizada</span></th>
      </tr></thead>
      <tbody><tr>
        <td class="rl"><b>Pintura · Bedazzled · Perfumaria · Crochê · Charm · Macramê</b><span>Todas pelo mesmo valor — cada uma leva o que criou</span></td>
        <td class="val">R$ 199</td><td class="val">R$ 249</td><td class="val hl">R$ 349</td>
      </tr></tbody>
    </table>
    <div class="note" style="margin-top:18px">◆ Valor <b>por pessoa</b>, com material e condução inclusos. O nível <b>Com foto</b> soma a foto profissional do evento; o <b>Completo</b> soma também a lembrancinha personalizada. A gente leva tudo até o espaço de vocês, no Ipiranga. Data a combinar.</div>
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
    <p class="lead">Dois extras opcionais que deixam os 18 ainda mais marcantes — o registro profissional e a lembrancinha personalizada pra cada convidada.</p>
    <div class="rule"></div>
    <div class="plans">
      <div class="plan">
        <div class="plan-photo sq"><img src="assets/rockworld1.jpg" alt="Festa registrada por um fotógrafo" style="object-position:center 30%"></div>
        <div class="plan-body">
          <h3>Foto profissional</h3>
          <span class="tag basic">Nível Com foto · R$ 249</span>
          <ul class="feat">
            <li>Um fotógrafo cobre a festa inteira</li>
            <li>Cada risada e cada criação registradas</li>
            <li>Álbum digital lindo (e super postável!)</li>
          </ul>
          <span class="allin">Conteúdo pronto pro feed</span>
        </div>
      </div>
      <div class="plan featured">
        <div class="plan-photo sq"><img src="assets/personaliza%C3%A7aobrindeescovapiranha.jpg" alt="Kit de lembrancinha personalizada com escova e piranha" style="object-position:center"></div>
        <div class="plan-body">
          <h3>Lembrancinha personalizada</h3>
          <span class="tag premium">★ Nível Completo · R$ 349</span>
          <ul class="feat">
            <li>Kit com <b>escova &amp; piranha</b> pra cada convidada</li>
            <li>Personalizado com o nome de cada uma</li>
            <li>Um mimo pra levarem da festa pra casa</li>
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
    <h2>A gente <em>vai até vocês</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pra a festa ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Escolham a experiência</h3><p>Pintura, bedazzled, tufting, perfumaria ou drinks — pelo mesmo valor. A gente leva tudo pronto.</p></div>
      <div class="step"><div class="num">2</div><h3>A gente leva até vocês</h3><p>Montamos tudo no espaço de vocês, no Ipiranga, com estrutura pra as 25 convidadas. Sem preocupação.</p></div>
      <div class="step"><div class="num">3</div><h3>Criar &amp; levar</h3><p>Cada uma leva pra casa o que criou — e um monte de foto linda pro feed. ✨</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Sob medida pros 18</h4>
        <p>A gente ajusta cada detalhe conforme o número final de convidadas e o clima que vocês querem pra festa. É só combinar. 🎉</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora comemorar <em>os 18?</em> ✦</h2>
      <p>Me confirma a experiência e a data, que a gente organiza tudo e leva até o Ipiranga.</p>
      <div class="cta-actions">
        <a class="btn-wa" href="https://wa.me/5511914455930?text=Oi%2C%20Elarah!%20Vi%20a%20proposta%20dos%2018%20anos%20e%20quero%20fechar%20os%20detalhes." target="_blank" rel="noopener">
          💬 Falar no WhatsApp
        </a>
        <div class="contact-links">
          <span>+55 (11) 91445-5930</span>
          <a href="https://instagram.com/elarah.oficial" target="_blank" rel="noopener">@elarah.oficial</a>
          <a href="https://elarah.com.br" target="_blank" rel="noopener">elarah.com.br</a>
        </div>
      </div>
    </div>
    <p class="fineprint">Proposta de aniversário de 18 anos da Elarah — experiência à escolha (pintura, bedazzled, perfumaria, cerâmica, sabonete, bolsa em crochê, charm de bolsa, macramê e mais, pelo mesmo valor), para cerca de 25 pessoas, em data a combinar, no espaço de vocês (Ipiranga) — a gente leva tudo até lá. Cada participante cria e leva a própria peça. A partir de R$ 199 por pessoa (níveis R$ 199 / 249 / 349): A experiência (material e condução) / + foto profissional / Completo com lembrancinha personalizada. Valores por pessoa. Proposta válida mediante confirmação de data, número de participantes e disponibilidade de agenda.</p>
    {foot("Aniversário de 18 anos · 2026")}
  </section>'''

deck = '<div class="deck">\n' + cover + catalogo + planos + personaliza + como + '\n\n</div>\n\n'
head = head.replace("<title>Setembro Amarelo · Elarah</title>", "<title>Aniversário de 18 anos · Elarah</title>")
head = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Proposta de aniversário de 18 anos da Elarah — pintura, bedazzled, tufting, perfumaria ou drinks, no espaço de vocês.">', head)
head = head.replace("</head>",
    "<style>*{box-shadow:none!important;-webkit-box-shadow:none!important}"
    ".cover-photo{border:1px solid var(--line)}"
    ".plan-photo,.bfeat .bphoto{border:1px solid var(--line)}"
    "</style>\n</head>")
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-18-anos.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"))
