# Riachuelo corporate deck v2 — RED palette, creative experience menu + 3-tier plans.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

# ---- recolor CSS to Riachuelo red + near-black ----
head = head.replace("--orange:#F27623;", "--orange:#E4002B;")
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#B0001F;")
head = head.replace("--navy:#16233C;", "--navy:#1A1A1A;")
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#575252;")
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#E4002B;")
head = head.replace("#EDF1F7", "#FBEEEF").replace("#DCE5F1", "#F3D9DD")
head = head.replace("#FF9A4D", "#FF8A9B")
head = head.replace("rgba(242,118,35,.22)", "rgba(228,0,43,.28)")
# extra CSS: experience menu grid + 3-plan variant
extra = '''
  .menu{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-top:6px}
  .exp{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 12px 28px -22px rgba(0,0,0,.32)}
  .exp-photo{height:116px;overflow:hidden;background:#eee}
  .exp-photo img{width:100%;height:100%;object-fit:cover}
  .exp-body{padding:12px 15px 15px}
  .exp .n{display:inline-block;font-size:9px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:5px}
  .exp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:16.5px;color:var(--navy);line-height:1.08}
  .exp p{font-size:11px;color:var(--muted);margin-top:5px;line-height:1.4}
  .plans.three{grid-template-columns:repeat(3,1fr)}
</style>'''
head = head.replace("</style>", extra, 1)
# print overrides for grid
head = head.replace(".menu-cols{grid-template-columns:1fr 1fr}",
                    ".menu-cols{grid-template-columns:1fr 1fr}\n    .menu{grid-template-columns:repeat(3,1fr)}\n    .plans.three{grid-template-columns:repeat(3,1fr)}\n    .exp-photo{height:118px}")
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
        <span class="kicker">Proposta de experiência corporativa para</span>
        <span class="compass">RIACHU<span>E</span>LO<small>integração do time</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência Corporativa · Integração</span>
        <h1>Experiências<br>que <em>integram</em></h1>
        <p class="lead">Um encontro criativo pra <strong>tirar o time da rotina e integrar de verdade</strong> — leve, sofisticado e com a mão na massa. Um leque de experiências pra vocês escolherem; a gente leva tudo até a Riachuelo.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>20 pessoas</b></span>
          <span class="chip"><b>02</b> de setembro</span>
          <span class="chip">Integração · <b>criativa</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/eventocorporativo.jpg" alt="Time reunido em um encontro Elarah, criando e se conectando">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Já realizado para times como <b>Nubank</b> e <b>Adyen</b> · visto no <b>Mais Você</b> (Globo)</div>
    {foot("Experiência Corporativa · Riachuelo")}
  </section>'''

buscamos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Pensado pra Riachuelo</span></div>
    </div>
    <span class="eyebrow orange">◆ O que buscamos</span>
    <h2>Um time mais <em>integrado</em></h2>
    <p class="lead">Momentos de <strong>mão na massa</strong>, leves e criativos, em que o que importa é criar junto. Experiências pensadas pra soltar as pessoas, aproximar as áreas e render boas histórias — pra qualquer pessoa, sem talento nenhum.</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">🤝</div><h3>Conexão de verdade</h3><p>Todo mundo criando junto — a atividade é o pretexto; a integração é o que fica.</p></div>
      <div class="infocard"><div class="ico">🎨</div><h3>Criativo e sofisticado</h3><p>Um leque de experiências autorais — cada um cria e leva a sua peça pra casa.</p></div>
      <div class="infocard"><div class="ico">🏢</div><h3>Aí na empresa</h3><p>A gente leva tudo até a Riachuelo — material, condução e estrutura. Vocês só vivem o dia.</p></div>
    </div>
    <div class="quote">
      <i>"Os melhores times se constroem fora da mesa de reunião."</i><br>
      — É isso que a Elarah leva pra Riachuelo: um encontro que vira <strong>história pra contar no corredor</strong>.
    </div>
    {foot("Pensado pra Riachuelo")}
  </section>'''

menu1 = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O menu · parte 1</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham a experiência</span>
    <h2>Um menu que <em>encanta</em></h2>
    <p class="lead">Da cozinha à perfumaria, do tufting à cerâmica — experiências autorais pra todo tipo de time. Escolham uma (ou combinem!) e a gente monta tudo.</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","massamolho.jpg","Gastronomia","Mão na massa com um chef — o time cozinha e senta pra comer junto.","Prato preparado numa aula de gastronomia")}
      {exp("02","drinks.jpg","Coquetelaria & Drinks","Cada um cria o próprio drink autoral com um bartender — com ou sem álcool.","Drink autoral em caneca de cobre","center 40%")}
      {exp("03","desp-hero4.jpg","Cerâmica","Modelagem em cerâmica fria, à mão. Cada um leva a sua peça.","Mesa montada para modelagem em cerâmica","center 30%")}
      {exp("04","perfumariaharbolita.jpg","Perfumaria Natural","Crie a sua fragrância botânica do zero, numa imersão sensorial.","Essências e frascos de perfumaria","center 45%")}
      {exp("05","tufting6.jpg","Tufting","Com a pistola de tufting, cada um cria a sua peça decorativa.","Time exibindo peças de tufting")}
      {exp("06","pinturatacavinho.jpg","Pintura Criativa","Em tela, taça, copo ou xícara — cada um leva a sua arte.","Taça pintada à mão")}
    </div>
    {foot("O menu · parte 1")}
  </section>'''

menu2 = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O menu · parte 2</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham a experiência</span>
    <h2>E tem <em>muito mais</em></h2>
    <p class="lead">Experiências diferentes e cheias de personalidade — as que mais têm a ver com a energia da Riachuelo.</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("07","velaaromatica.jpg","Velas Aromáticas","Cada um cria a sua vela perfumada, do aroma ao rótulo.","Vela aromática artesanal")}
      {exp("08","buqueflor.jpg","Buquê de Flores","Monte o seu próprio buquê autoral, pra levar pra casa.","Buquê de flores do campo","center 40%")}
      {exp("09","fazendojoia.jpg","Crie a sua Joia","Cada um cria a própria joia — anel, colar ou pingente.","Mãos criando uma joia à mão","center 40%")}
      {exp("10","croche.jpg","Bolsa de Crochê","Aprenda crochê e faça a sua bolsinha — a queridinha do momento.","Bolsinhas de crochê coloridas")}
      {exp("11","saboneteroxo.jpg","Sabonete Artesanal","Cada um cria os próprios sabonetes botânicos, com aroma e cor.","Sabonetes artesanais de lavanda")}
      {exp("12","aulateatro.jpg","Teatro & Dinâmicas","Jogos de improviso pra soltar o time e dar muita risada.","Time numa dinâmica de teatro","center 40%")}
    </div>
    {foot("O menu · parte 2")}
  </section>'''

def plan(tag, tagcls, name, more, feats, allin, featured=False):
    fl = "".join(f"<li>{x}</li>" for x in feats)
    more_html = f'<div class="more">{more}</div>' if more else ''
    cls = "plan featured" if featured else "plan"
    return f'''<div class="{cls}"><div class="plan-body">
        <span class="tag {tagcls}">{tag}</span>
        <h3>{name}</h3>
        <div class="price soft">sob consulta<small>por pessoa</small></div>
        {more_html}<ul class="feat">{fl}</ul>
        <span class="allin">{allin}</span>
      </div></div>'''

planos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Os planos</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham o plano</span>
    <h2>Do essencial ao <em>tudo incluso</em></h2>
    <p class="lead">Qualquer experiência do menu pode vir em três formatos — vocês escolhem o quão completo querem o encontro.</p>
    <div class="rule"></div>
    <div class="plans three">
      {plan("Plano 1 · Básico", "basic", "A experiência", None,
            ["A experiência criativa escolhida","Todos os materiais e estrutura","Condução por profissional","Cada um leva a sua criação pra casa"],
            "Tudo da experiência")}
      {plan("Plano 2 · Com gastronomia", "basic", "Experiência + comida", "Tudo do Básico, e mais",
            ["Gastronomia: brunch, almoço ou coquetelaria","Opção de drinks / coquetelaria autoral","Registro fotográfico profissional (opcional)"],
            "Experiência + comida")}
      {plan("Plano 3 · Completo", "premium", "Tudo incluso", "Tudo dos planos anteriores, e mais",
            ["Registro fotográfico profissional incluso","Kits personalizados com a marca da Riachuelo","Mesa de boas-vindas + coffee break"],
            "Experiência + comida + foto + kits", featured=True)}
    </div>
    {foot("Os planos")}
  </section>'''

personaliza = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O toque Riachuelo</span></div>
    </div>
    <span class="eyebrow orange">◆ No plano Completo</span>
    <h2>Com a cara da <em>sua empresa</em></h2>
    <p class="lead">O encontro sai com a identidade da Riachuelo — pra virar memória do time e conteúdo lindo pra marca.</p>
    <div class="rule"></div>
    <div class="plans">
      <div class="plan">
        <div class="plan-photo sq"><img src="assets/rockworld1.jpg" alt="Momento do time registrado por um fotógrafo" style="object-position:center 45%"></div>
        <div class="plan-body">
          <span class="tag basic">Incluso</span>
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
        <span class="ribbon">★ Com a sua marca</span>
        <div class="plan-photo sq"><img src="assets/nivergibrinde.jpg" alt="Kit personalizado com o nome de cada convidado" style="object-position:center 35%"></div>
        <div class="plan-body">
          <span class="tag premium">Personalização</span>
          <h3>Kits personalizados</h3>
          <ul class="feat">
            <li>Cada convidado leva um kit da Riachuelo</li>
            <li>Do avental ao brinde, com o nome de cada um</li>
            <li>Mesa de boas-vindas com a identidade da marca</li>
          </ul>
          <span class="allin">Cada um leva o seu mimo</span>
        </div>
      </div>
    </div>
    {foot("O toque Riachuelo")}
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
      <div class="step"><div class="num">1</div><h3>Escolhem experiência + plano</h3><p>Do menu criativo, no formato Básico, Com gastronomia ou Completo.</p></div>
      <div class="step"><div class="num">2</div><h3>A gente leva até vocês</h3><p>Aí na Riachuelo — material, condução e estrutura por nossa conta.</p></div>
      <div class="step"><div class="num">3</div><h3>O time vive e integra</h3><p>Vocês só chegam, criam juntos e se conectam.</p></div>
    </div>
    <div class="addon">
      <span class="plus">➕</span>
      <div>
        <h4>Momento da empresa</h4>
        <p>Reservem <b>+1h no mesmo encontro</b> pra fala, brinde e agradecimento do time — assim vocês têm o período todo, sem correria. <b>Sem custo adicional: é por nossa conta.</b> 💛</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora integrar o time da <em>Riachuelo?</em> ✦</h2>
      <p>Me conta qual experiência e qual plano mais chamaram, que a gente fecha cada detalhe do encontro de 02 de setembro.</p>
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
    <p class="fineprint">Proposta de experiências criativas para integração de time, para cerca de 20 participantes, realizada na Riachuelo. Escolham a experiência e o plano (Básico · Com gastronomia · Completo). Cada experiência dura cerca de 2h30–3h, com +1h para o momento da empresa, sem custo adicional. Valores por pessoa sob consulta. Proposta válida mediante confirmação de data (02 de setembro), experiência e disponibilidade de agenda.</p>
    {foot("Experiência Corporativa · Riachuelo · 2026")}
  </section>'''

deck = '<div class="deck">\n' + cover + buscamos + menu1 + menu2 + planos + personaliza + como + '\n\n</div>\n\n'
# fix title/meta
head = head.replace("<title>Experiência Corporativa · Elarah × Compass</title>", "<title>Experiência Corporativa · Elarah × Riachuelo</title>")
head = re.sub(r'<meta name="description"[^>]*>', '<meta name="description" content="Proposta de experiência corporativa criativa da Elarah para a Riachuelo — menu de experiências e planos de integração.">', head)
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-corporativa-riachuelo.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| Compass refs:", html.count("Compass"), "| slides: 7")
