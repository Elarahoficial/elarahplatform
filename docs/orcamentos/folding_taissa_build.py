# Proposta Elarah · Folding Book · Taissa · turma privada · 10 pessoas · 28/10/2026
# Segue a identidade/estrutura do material de referência Folding Book (Dri),
# MAS: card único de investimento (R$ 289/pessoa · R$ 2.890), sem planos,
# sem Casa Aquário/BETC, sem coffee/foto/brindes. Valores antigos NAO mencionados.
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/experiencia-folding-book-dri.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]

# título/descrição
head = re.sub(r'<title>.*?</title>', '<title>Folding Book · Taissa · Elarah</title>', head, count=1, flags=re.DOTALL)
head = re.sub(r'<meta name="description"[^>]*>',
              '<meta name="description" content="Proposta Elarah para uma turma privada de Folding Book — 10 pessoas, 28/10/2026.">',
              head, count=1)


def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'


cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right">
        <span class="kicker">Proposta de experiência · Turma privada</span>
        <span class="compass">Folding <span>Book</span><small>Turma privada</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência criativa · Folding Book</span>
        <h1>A arte de <em>dobrar</em></h1>
        <p class="lead">Um encontro criativo e cheio de charme para o grupo: no <strong>Folding Book</strong>, cada convidado transforma as páginas de um livro em uma escultura — e leva a própria arte pra casa. Relaxante, delicado e diferente. 🌿</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>10</b> pessoas</span>
          <span class="chip"><b>28/10</b></span>
          <span class="chip">~4 horas</span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/foldingbook2.jpg" alt="Escultura de folding book com detalhe dourado numa decoração zen" style="object-position:center 42%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Experiências já realizadas para grupos como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)</div>
    {foot("Turma privada · Folding Book")}
  </section>'''

exper = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">A experiência</span></div>
    </div>
    <span class="eyebrow orange">◆ O que é o Folding Book</span>
    <h2>Um livro que vira <em>arte</em></h2>
    <p class="lead">Cada convidado transforma as páginas de um livro em uma <strong>escultura tridimensional</strong>, usando a técnica de Folding Book. Uma peça delicada pra decorar e guardar — sem precisar de experiência. 🌿</p>
    <div class="bfeat">
      <div class="bphoto"><img src="assets/foldingbook3.jpg" alt="Escultura de folding book em suporte dourado" style="object-position:center 42%"></div>
      <div class="bbody">
        <span class="btag">Folding Book</span>
        <h3>A arte de dobrar páginas</h3>
        <p>Do preparo do livro à construção da forma, cada dobra revela relevos e desenhos. Uma técnica meditativa, detalhista e cheia de significado.</p>
        <ul class="feat">
          <li>Um livro que vira <b>escultura</b></li>
          <li>Técnica <b>meditativa</b> e detalhista</li>
          <li>Uma peça <b>única</b>, feita por você</li>
        </ul>
      </div>
    </div>
    {foot("A experiência")}
  </section>'''

como = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Como acontece</span></div>
    </div>
    <span class="eyebrow orange">◆ Como acontece</span>
    <h2>Tudo pronto pra <em>vocês criarem</em></h2>
    <p class="lead">A gente leva o profissional, os livros e todo o material. O grupo é conduzido passo a passo, do preparo do livro à finalização da peça — uma experiência de cerca de <strong>4 horas</strong>. É só chegar e criar.</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">🎨</div><h3>Profissional conduz</h3><p>Passo a passo, do início ao fim — sem precisar de experiência prévia.</p></div>
      <div class="infocard"><div class="ico">📚</div><h3>Tudo incluso</h3><p>Livros, todos os materiais e a estrutura necessária para a experiência.</p></div>
      <div class="infocard"><div class="ico">🤍</div><h3>Você leva pra casa</h3><p>Cada participante cria e leva a própria escultura de recordação.</p></div>
    </div>
    {foot("Como acontece")}
  </section>'''

vibe = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">A vibe</span></div>
    </div>
    <span class="eyebrow orange">◆ O que fica</span>
    <h2>Juntos, <em>criando</em></h2>
    <p class="lead">Mais que uma atividade: uma tarde leve, criativa e cheia de conexão — do tipo que o grupo lembra pra sempre.</p>
    <div class="vibe">
      <figure><img src="assets/corp-criativo.jpg" alt="Convidados criando lado a lado" style="object-position:center 35%"><figcaption>Mão na massa, junto</figcaption></figure>
      <figure><img src="assets/abraco-elegante.jpg" alt="Amigas rindo durante a experiência" style="object-position:center 25%"><figcaption>Conexão de verdade</figcaption></figure>
      <figure><img src="assets/cover-corp.jpg" alt="Grupo num encontro criativo da Elarah" style="object-position:center 40%"><figcaption>Uma tarde diferente</figcaption></figure>
    </div>
    {foot("A vibe da experiência")}
  </section>'''

invest = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Turma privada de <em>Folding Book</em></h2>
    <div class="tiers" style="grid-template-columns:1fr;max-width:440px;margin-left:auto;margin-right:auto">
      <div class="tier hl" style="text-align:center;align-items:center">
        <span class="tt">Folding Book · Turma Privada</span>
        <div class="tp">R$ 289</div><div class="tu">por pessoa</div>
        <div style="font-family:'DM Serif Display',serif;font-size:20px;color:var(--orange-dark);margin:12px 0 2px">R$ 2.890 <span style="font-family:inherit">total</span></div>
        <div class="tu">10 pessoas</div>
        <p style="font-size:12.5px;color:var(--ink);line-height:1.5;margin-top:16px">Inclui experiência, profissional e todos os materiais.</p>
      </div>
    </div>
    <p class="fineprint" style="text-align:center">Data e local sujeitos à confirmação de disponibilidade.</p>
    {foot("Investimento")}
  </section>'''

proximos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Próximos passos</span></div>
    </div>
    <span class="eyebrow orange">◆ Bora reservar?</span>
    <h2>Vamos deixar tudo <em>pronto</em></h2>
    <p class="lead">Após a sua confirmação, alinhamos a disponibilidade da profissional, o espaço e os detalhes da experiência. É só me dar o ok. 🌿</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">1️⃣</div><h3>Você confirma</h3><p>A data e o número de convidados — me conta que eu já reservo.</p></div>
      <div class="infocard"><div class="ico">2️⃣</div><h3>Alinhamos</h3><p>Disponibilidade da profissional, o espaço e cada detalhe.</p></div>
      <div class="infocard"><div class="ico">3️⃣</div><h3>É só curtir</h3><p>No dia, chega tudo pronto. O grupo só cria e aproveita.</p></div>
    </div>
    <div class="quote">
      <i>Elarah · Experiências criativas</i><br>
      contato@elarah.com.br &nbsp;·&nbsp; <strong>elarah.com.br</strong> &nbsp;·&nbsp; @elarah
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = '<div class="deck">\n' + cover + exper + como + vibe + invest + proximos + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/proposta-folding-book-taissa.html"
io.open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
# guard: garantir que valores antigos nao aparecem
for bad in ["259", "409", "509", "Casa Aquário", "BETC", "coffee", "Coffee", "fotógrafo", "Plano 1", "Plano 2", "Plano 3"]:
    assert bad not in deck, f"PROIBIDO presente: {bad}"
print("OK: sem valores/itens proibidos")
