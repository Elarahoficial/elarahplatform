# Proposta Natália Conti · Aniversário · 28/11/2026 · 6 pessoas · Morumbi
# Segue EXATAMENTE o modelo do Portfólio Aniversário (mesma identidade, estrutura e CSS).
import io

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/experiencia-portfolio-aniversario.html", encoding="utf-8").read()

head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]


def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'


def img(src, alt, pos="center 50%"):
    return f'<img src="assets/{src}" alt="{alt}" style="object-position:{pos}">'


def head_block(kicker, main, accent, small):
    return f'''    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right">
        <span class="kicker">{kicker}</span>
        <span class="compass">{main} <span>{accent}</span><small>{small}</small></span>
      </div>
    </div>'''


def head_simple(kicker):
    return f'''    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">{kicker}</span></div>
    </div>'''


def xcard(num, cat, name, desc, photo, price):
    return f'''      <div class="xcard">
        <div class="xph"><span class="xnum">{num}</span><div class="xpr"><small>por pessoa</small><b>{price}</b></div>{photo}</div>
        <div class="xb">
          <span class="xcat">{cat}</span>
          <h4>{name}</h4>
          <p>{desc}</p>
        </div>
      </div>'''


PROOF = "Experiências já realizadas para grupos como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)"

# 6 experiências (ordem = curadoria diversa)
EXPS = [
    ("01", "Pintura", "Pintura em taça", "Personalize a própria taça durante a experiência e leve a peça pra casa.", "pinturataca.jpg", "center 45%", "R$ 249"),
    ("02", "Papelaria &amp; memórias", "Scrapbook", "Monte um álbum ou caderninho de memórias personalizado, do seu jeito.", "colagemamor.jpg", "center 50%", "R$ 259"),
    ("03", "Personalização", "Berloque de bolsa", "Crie seu próprio charm e personalize o acessório com a sua cara.", "charm-bolsa.jpg", "center 50%", "R$ 279"),
    ("04", "Perfumaria", "Perfume autoral", "Crie a própria fragrância, escolhendo notas e combinações.", "perfumaria-oficina.jpg", "center 55%", "R$ 279"),
    ("05", "Floral", "Buquê de flores", "Monte o próprio buquê autoral, escolhendo e compondo as flores.", "buque.jpg", "center 45%", "R$ 289"),
    ("06", "Cerâmica", "Acessório em cerâmica", "Faça pequenos acessórios em cerâmica — colares, brincos e mimos.", "ceramica-acessorio.jpg", "center 40%", "R$ 289"),
]

cover = f'''
  <section class="slide">
{head_block("Portfólio de experiências · Aniversário", "Natália", "faz aniversário", "6 pessoas · 28/11")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Aniversário · Elarah Até Você</span>
        <h1>Escolha a sua <em>experiência</em></h1>
        <p class="lead">Reunimos uma curadoria de experiências criativas pra vocês escolherem a cara do aniversário — de pintura a perfume, cerâmica e flores. Cada uma vira a atividade <strong>e</strong> a lembrança, tudo numa coisa só. É só apontar a favorita. ✨</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>6</b> pessoas</span>
          <span class="chip"><b>28/11</b> · sábado</span>
          <span class="chip">Morumbi · SP</span>
        </div>
      </div>
      <div class="cover-photo">{img("capa-croche-cafe.jpg", "Amigas rindo numa experiência criativa com café", "center 28%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Portfólio de experiências")}
  </section>'''

intro = f'''
  <section class="slide">
{head_simple("O formato")}
    <span class="eyebrow orange">◆ Elarah Até Você</span>
    <h2>A experiência vai até <em>vocês</em></h2>
    <p class="lead">A gente leva a experiência inteira até onde vocês estiverem — com artista, materiais e tudo montado. É só escolher a favorita e curtir o dia com quem você ama. 🤍</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">🎨</div><h3>Criativo &amp; leve</h3><p>Cada uma cria a própria peça, do seu jeito — sem precisar de experiência.</p></div>
      <div class="infocard"><div class="ico">🤍</div><h3>Só de vocês</h3><p>Grupo fechado de 6, com artista acompanhando de perto.</p></div>
      <div class="infocard"><div class="ico">✨</div><h3>Tudo montado</h3><p>Chegamos antes, conduzimos e desmontamos no fim. Vocês só aproveitam.</p></div>
    </div>
    <div class="bnote">◆ Local a definir na região do Morumbi — podemos realizar a experiência na residência, condomínio ou avaliar um café próximo. 📍</div>
    {foot("O formato · Elarah Até Você")}
  </section>'''

vibe = f'''
  <section class="slide">
{head_simple("A vibe")}
    <span class="eyebrow orange">◆ O que fica de verdade</span>
    <h2>Amigas, risada e <em>memória</em></h2>
    <p class="lead">No fim, o que fica não é só a peça — é a tarde inteira de conversa, mão na massa e foto boa. Um aniversário do jeitinho de vocês. 💛</p>
    <div class="egrid">
      <figure>{img("antonella-vibe-risada.jpg", "Amigas rindo enquanto criam juntas", "center 30%")}<figcaption>Rir e criar juntas</figcaption></figure>
      <figure>{img("pintura-grupo.jpg", "Grupo reunido pintando", "center 40%")}<figcaption>Mão na massa</figcaption></figure>
      <figure>{img("macaron-risada.jpg", "Amigas rindo na experiência", "center 30%")}<figcaption>Muita risada</figcaption></figure>
      <figure>{img("abraco-elegante.jpg", "Amigas se reencontrando", "center 25%")}<figcaption>Entre amigas</figcaption></figure>
      <figure>{img("vibe-risada.jpg", "Momento leve criando à mão", "center 20%")}<figcaption>No clima da experiência</figcaption></figure>
      <figure>{img("encontro-1.jpg", "Amigas curtindo o momento juntas", "center 25%")}<figcaption>Um momento de vocês</figcaption></figure>
    </div>
    {foot("A vibe da experiência")}
  </section>'''

vitrine = f'''
  <section class="slide">
{head_simple("A vitrine")}
    <span class="eyebrow orange">◆ Escolham a favorita</span>
    <h2>As <em>experiências</em></h2>
    <div class="xgrid">
{chr(10).join(xcard(n, c, nm, d, img(src, nm, pos), pr) for n, c, nm, d, src, pos, pr in EXPS)}
    </div>
    <p class="fineprint">✦ Valores por pessoa · artista, materiais e estrutura inclusos, no formato Elarah Até Você. Local a definir na região do Morumbi.</p>
    {foot("A vitrine")}
  </section>'''

_rows = "\n".join(
    f'        <tr><td class="exp">{nm}</td><td class="ess">{c}</td><td class="prem">{pr}</td></tr>'
    for n, c, nm, d, src, pos, pr in EXPS)

valores = f'''
  <section class="slide">
{head_simple("Valores")}
    <span class="eyebrow orange">◆ Tudo por pessoa</span>
    <h2>Os <em>valores</em></h2>
    <p class="lead">Cada experiência já inclui artista, materiais e estrutura — no formato Elarah Até Você, dentro do seu orçamento. 💛</p>
    <table class="ptable">
      <thead>
        <tr><th>Experiência</th><th>Categoria</th><th class="r">Por pessoa</th></tr>
      </thead>
      <tbody>
{_rows}
      </tbody>
    </table>
    <p class="fineprint">✦ Valores por pessoa, conforme informado. Artista, materiais e estrutura inclusos. Local a definir na região do Morumbi — residência, condomínio ou café próximo a avaliar.</p>
    {foot("Valores")}
  </section>'''

proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Bora escolher? ✨</span>
    <h2>É só <em>apontar</em> a favorita</h2>
    <p class="lead">Me conta qual experiência a Natália e as amigas mais curtiram que a gente confirma a disponibilidade e o local certinho pro dia. Qualquer dúvida, é só chamar. 💛</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">1️⃣</div><h3>Escolham</h3><p>A experiência favorita da curadoria.</p></div>
      <div class="infocard"><div class="ico">2️⃣</div><h3>Confirmamos</h3><p>Disponibilidade, local no Morumbi e todos os detalhes.</p></div>
      <div class="infocard"><div class="ico">3️⃣</div><h3>É só curtir</h3><p>No dia, chega tudo pronto. Vocês só aproveitam.</p></div>
    </div>
    <div class="quote">
      <i>Elarah · Experiências criativas</i><br>
      contato@elarah.com.br &nbsp;·&nbsp; <strong>elarah.com.br</strong> &nbsp;·&nbsp; @elarah
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = '<div class="deck">\n' + cover + intro + vibe + vitrine + valores + proximos + '\n\n</div>\n\n'

# título/descrição
head = head.replace("<title>", "<title>", 1)
import re
head = re.sub(r'<title>.*?</title>', '<title>Aniversário · Natália Conti · Elarah</title>', head, count=1, flags=re.DOTALL)
head = re.sub(r'<meta name="description"[^>]*>',
              '<meta name="description" content="Proposta Elarah para o aniversário da Natália Conti — curadoria de 6 experiências criativas no formato Elarah Até Você.">',
              head, count=1)

html = head + deck + tail
out = ROOT + "/proposta-natalia-conti.html"
io.open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
