# Workshops By Elarah para eventos (B2B) — Cerâmica, Pintura de Taças, Perfumaria.
# Ativação criativa turnkey dentro do evento do cliente. Paleta terracota + navy.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
base = open(S + "/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

# ---- recolor: terracota quente + navy (sofisticado, on-brand) ----
head = head.replace("--orange:#F27623;", "--orange:#C0673C;")
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#9C4F2C;")
head = head.replace("--navy:#16233C;", "--navy:#23201D;")
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#6A5D52;")
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#C0673C;")
head = head.replace("#EDF1F7", "#F5EFE9").replace("#DCE5F1", "#EADFD3")
head = head.replace("#FF9A4D", "#D79A72")
head = head.replace("rgba(242,118,35,.22)", "rgba(192,103,60,.26)")

extra = '''
  .menu{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:14px}
  .exp{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 14px 32px -22px rgba(0,0,0,.3)}
  .exp-photo{height:190px;overflow:hidden;background:#eee}
  .exp-photo img{width:100%;height:100%;object-fit:cover}
  .exp-body{padding:15px 17px 17px}
  .exp .n{display:inline-block;font-size:9px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:5px}
  .exp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:20px;color:var(--navy);line-height:1.06}
  .exp p{font-size:12px;color:var(--muted);margin-top:6px;line-height:1.45}
  /* galeria vibe */
  .vibe{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
  .vibe figure{margin:0;border-radius:16px;overflow:hidden;position:relative;aspect-ratio:3/4;box-shadow:0 16px 36px -24px rgba(0,0,0,.34)}
  .vibe img{width:100%;height:100%;object-fit:cover;display:block}
  .vibe figcaption{position:absolute;left:0;right:0;bottom:0;padding:28px 14px 13px;color:#fff;font-size:12.5px;font-weight:600;background:linear-gradient(to top,rgba(30,24,20,.82),transparent)}
  .fineprint{font-size:10px;color:var(--muted);line-height:1.5;margin-top:16px}
</style>'''
head = head.replace("</style>", extra, 1)

# ---- PDF: sombras borradas viram bloco cinza em leitores iOS — troca por bordas ----
head = head.replace(
    "    @page{size:A4 portrait;margin:0}",
    "    .slide *{box-shadow:none !important}\n"
    "    .cover-photo,.exp-photo,.vibe figure{border:1px solid rgba(35,32,29,.14)}\n"
    "    .menu{grid-template-columns:repeat(3,1fr)}\n"
    "    .vibe{grid-template-columns:repeat(3,1fr)}\n"
    "    @page{size:A4 portrait;margin:0}", 1)
head = head.replace(".plans{grid-template-columns:1fr}",
                    ".plans{grid-template-columns:1fr}\n    .menu{grid-template-columns:1fr}\n    .vibe{grid-template-columns:1fr 1fr}")


def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'

def exp(n, img, name, desc, alt, pos="center 50%"):
    return (f'<div class="exp"><div class="exp-photo"><img src="assets/{img}" alt="{alt}" style="object-position:{pos}"></div>'
            f'<div class="exp-body"><span class="n">{n}</span><h3>{name}</h3><p>{desc}</p></div></div>')


cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right">
        <span class="kicker">Workshops By Elarah · para eventos</span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Ativações criativas · para o seu evento</span>
        <h1>Workshops pro<br>seu <em>evento</em></h1>
        <p class="lead">Leve uma experiência criativa e sensorial pra dentro do seu evento: a gente monta uma <strong>estação de workshop turnkey</strong> — com profissional, material e estrutura — e cada convidado cria (e leva pra casa) a própria peça. Uma ativação que vira foto, conversa e memória. 🌿</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>Cerâmica</b></span>
          <span class="chip"><b>Pintura de taças</b></span>
          <span class="chip"><b>Perfumaria</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/eventocorporativo.jpg" alt="Convidados num evento com uma ativação criativa da Elarah" style="object-position:center 45%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Já levado para marcas e times como <b>Compass</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)</div>
    {foot("Workshops By Elarah · para eventos")}
  </section>'''

como = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Como funciona no evento</span></div>
    </div>
    <span class="eyebrow orange">◆ Uma estação criativa, chave na mão</span>
    <h2>A gente <em>encaixa</em> no seu evento</h2>
    <p class="lead">Você cuida do evento; a Elarah cuida da experiência. Montamos uma estação de workshop no seu formato — pode ser rotativa (os convidados passam e criam) ou uma turma sentada — e levamos absolutamente tudo. 🌿</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">📦</div><h3>Turnkey</h3><p>Profissional, material e estrutura por nossa conta. Chega tudo pronto e a gente monta e desmonta.</p></div>
      <div class="infocard"><div class="ico">🎨</div><h3>Ativação que engaja</h3><p>Mão na massa — os convidados criam, interagem e levam pra casa a própria peça de recordação.</p></div>
      <div class="infocard"><div class="ico">✨</div><h3>Com a sua cara</h3><p>Dá pra personalizar cores, aromas e lembrancinhas com a identidade da marca ou do evento.</p></div>
    </div>
    <div class="quote">
      <i>"A melhor ativação é aquela que as pessoas levam pra casa."</i><br>
      — É isso que a Elarah leva pro seu evento: uma experiência que <strong>vira memória (e conteúdo)</strong>.
    </div>
    {foot("Como funciona no evento")}
  </section>'''

menu = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">As experiências</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham as ativações</span>
    <h2>Três workshops <em>queridinhos</em></h2>
    <p class="lead">As três que vocês curtiram — dá pra ter uma só ou combinar mais de uma como estações diferentes dentro do mesmo evento. Todas conduzidas por um profissional, do começo ao fim.</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","ceramicamodelagem.jpg","Cerâmica","Mão na argila: cada convidado modela a própria peça e leva pra casa — sensorial e relaxante.","Mãos modelando uma peça de cerâmica","center 50%")}
      {exp("02","pinturatacaa.jpg","Pintura de Taças","Cada um pinta à mão a própria taça de vidro e brinda com a sua arte — elegante e divertido.","Taças de vidro pintadas à mão","center 45%")}
      {exp("03","perfumariaharbolita.jpg","Perfumaria","Cada convidado cria a própria fragrância autoral, numa imersão sensorial guiada por especialista.","Essências e frascos de perfumaria","center 45%")}
    </div>
    {foot("As experiências")}
  </section>'''

vibe = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">A vibe</span></div>
    </div>
    <span class="eyebrow orange">◆ Como fica no evento</span>
    <h2>Gente junto, <em>criando</em></h2>
    <p class="lead">Momentos reais das nossas ativações: convidados de mão na massa, conectados e cheios de fotos boas — do tipo que dá gosto de compartilhar.</p>
    <div class="vibe">
      <figure><img src="assets/corp-criativo.jpg" alt="Convidados criando lado a lado numa ativação Elarah" style="object-position:center 35%"><figcaption>Mão na massa, junto</figcaption></figure>
      <figure><img src="assets/vibe-conexao-corp.jpg" alt="Convidada rindo durante a experiência" style="object-position:center 30%"><figcaption>Conexão de verdade</figcaption></figure>
      <figure><img src="assets/cover-corp.jpg" alt="Convidadas num evento elegante da Elarah" style="object-position:center 40%"><figcaption>Do início ao brinde</figcaption></figure>
    </div>
    {foot("A vibe no evento")}
  </section>'''

proximos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Próximos passos</span></div>
    </div>
    <span class="eyebrow orange">◆ Montamos sob medida</span>
    <h2>Bora desenhar a sua <em>ativação?</em></h2>
    <p class="lead">Cada evento é único, então o orçamento a gente monta sob medida. Pra fechar o formato e o valor certinho, me conta alguns detalhes:</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">👥</div><h3>Quantos convidados</h3><p>Número estimado de participantes (e se é rotativo ou turma sentada).</p></div>
      <div class="infocard"><div class="ico">📅</div><h3>Data & local</h3><p>Quando e onde acontece o evento — a gente leva a experiência até lá.</p></div>
      <div class="infocard"><div class="ico">🎯</div><h3>Formato & marca</h3><p>Quais workshops, duração da ativação e se querem personalizar com a marca.</p></div>
    </div>
    <div class="quote">
      <i>Elarah · Experiências criativas</i><br>
      contato@elarah.com.br &nbsp;·&nbsp; <strong>elarah.com.br</strong> &nbsp;·&nbsp; @elarah
    </div>
    <p class="fineprint">Proposta de apresentação das ativações By Elarah para eventos — workshops de cerâmica, pintura de taças e perfumaria, conduzidos por profissional, com material e estrutura inclusos. Formato (estação rotativa ou turma sentada), duração e número de convidados definidos conforme o evento. Orçamento montado sob medida mediante os detalhes do evento e disponibilidade de agenda.</p>
    {foot("Próximos passos")}
  </section>'''

deck = '<div class="deck">\n' + cover + como + menu + vibe + proximos + '\n\n</div>\n\n'
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-workshops-eventos.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
