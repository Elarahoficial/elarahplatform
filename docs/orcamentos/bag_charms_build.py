# Proposta Elarah · Criacao de Bag Charms / Chaveiros de bolsa · lancamento de marca
# 15 a 20 meninas · Sao Paulo · espaco parceiro. Base rose (Portfolio Aniversario), jovem/feminina.
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/experiencia-portfolio-aniversario.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]
head = re.sub(r'<title>.*?</title>', '<title>Bag Charms · Elarah</title>', head, count=1, flags=re.DOTALL)
head = re.sub(r'<meta name="description"[^>]*>',
              '<meta name="description" content="Experiência Elarah de criação de bag charms — personalização, montagem e celebração para 15 a 20 convidadas em São Paulo.">',
              head, count=1)

extra = '''
<style>
  .flow4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:18px}
  .flow4 .fs{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;box-shadow:0 12px 28px -22px rgba(0,0,0,.3);display:flex;flex-direction:column}
  .flow4 .fsph{height:118px;overflow:hidden;background:#eee}
  .flow4 .fsph img{width:100%;height:100%;object-fit:cover;display:block}
  .flow4 .fsb{padding:11px 14px 14px}
  .flow4 .fsn{font-family:'DM Serif Display',serif;color:var(--orange);font-size:17px;line-height:1}
  .flow4 .fst{font-family:'DM Serif Display',serif;font-size:14.5px;color:var(--navy);line-height:1.12;margin-top:3px}
  .flow4 .fsd{font-size:10px;color:var(--muted);line-height:1.4;margin-top:6px}
  .inclist{display:grid;grid-template-columns:1fr;gap:11px;margin:0;padding:0}
  .inclist li{list-style:none;position:relative;padding-left:28px;font-size:13px;color:var(--ink);line-height:1.4}
  .inclist li b{color:var(--navy);font-weight:700}
  .inclist li .ck{position:absolute;left:0;top:1px;width:18px;height:18px;border-radius:999px;background:var(--orange);color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center}
  .split{display:grid;grid-template-columns:1fr 1fr;gap:36px;margin-top:20px;align-items:center}
  .split .sph{border-radius:18px;overflow:hidden;border:1px solid var(--line);box-shadow:0 18px 42px -26px rgba(0,0,0,.4);height:380px}
  .split .sph img{width:100%;height:100%;object-fit:cover;display:block}
  .duo{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px}
  .duo figure{margin:0;border-radius:18px;overflow:hidden;position:relative;height:330px;border:1px solid var(--line);box-shadow:0 16px 40px -26px rgba(0,0,0,.4)}
  .duo img{width:100%;height:100%;object-fit:cover;display:block}
  .duo figcaption{position:absolute;left:0;right:0;bottom:0;padding:24px 15px 13px;color:#fff;font-size:12.5px;font-weight:600;background:linear-gradient(to top,rgba(46,31,42,.86),transparent)}
  .invph{display:flex;flex-direction:column;justify-content:center}
  .invph .il{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange-dark);font-weight:700}
  .invph .isub2{font-size:13.5px;color:var(--navy-soft);font-weight:600;margin-top:2px}
  .invph .ibig{font-family:'DM Serif Display',serif;font-size:40px;color:var(--navy);line-height:1.05;margin:12px 0 2px}
  .invph .iper{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--navy-soft);font-weight:700}
  .invph .inote{font-size:11.5px;color:var(--muted);margin-top:16px;line-height:1.55;max-width:42ch}
</style>'''
head = head.replace("</head>", extra + "</head>", 1)


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


def fstep(n, foto, pos, titulo, desc):
    return (f'<div class="fs"><div class="fsph">{img(foto, titulo, pos)}</div>'
            f'<div class="fsb"><div class="fsn">{n}</div><div class="fst">{titulo}</div><div class="fsd">{desc}</div></div></div>')


PROOF = "Experiências já realizadas para grupos como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)"

cover = f'''
  <section class="slide">
{head_block("Ativação de marca · São Paulo", "Bag", "Charms", "15 a 20 convidadas")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Uma experiência Elarah</span>
        <h1>Crie seu <em>Bag Charm</em></h1>
        <p class="lead">Uma experiência para <strong>criar, personalizar e celebrar juntas</strong>: cada convidada monta o próprio bag charm — correntes, pingentes, pérolas, letras e fitas — e leva pra casa.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>15 a 20</b> convidadas</span>
          <span class="chip">São Paulo</span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip">Lançamento de marca</span>
        </div>
      </div>
      <div class="cover-photo">{img("antonella-capa-grupo.jpg", "Grupo de meninas criando e rindo juntas", "center 30%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Bag Charms · São Paulo")}
  </section>'''

experiencia = f'''
  <section class="slide">
{head_simple("A experiência")}
    <span class="eyebrow orange">◆ Personalização</span>
    <h2>Cada uma cria <em>o seu</em></h2>
    <p class="lead">Cada convidada monta o próprio bag charm, escolhendo entre correntes, pingentes, letras, pérolas e acessórios — do jeitinho dela.</p>
    <div class="bfeat">
      <div class="bphoto">{img("charm-bolsa.jpg", "Bag charm personalizado com pérolas e letras", "center 50%")}</div>
      <div class="bbody">
        <span class="btag">Bag Charm autoral</span>
        <h3>Do jeitinho dela</h3>
        <ul class="feat">
          <li><span class="st">✦</span>Correntes, pingentes e <b>pérolas</b></li>
          <li><span class="st">✦</span><b>Letras</b> e charms para personalizar</li>
          <li><span class="st">✦</span>Cada uma leva a <b>própria criação</b></li>
        </ul>
      </div>
    </div>
    {foot("A experiência")}
  </section>'''

comoacontece = f'''
  <section class="slide">
{head_simple("Como acontece")}
    <span class="eyebrow orange">◆ Simples e criativo</span>
    <h2>Como <em>acontece</em></h2>
    <div class="flow4">
      {fstep("01", "piranha-cristais-materiais.jpg", "center 40%", "Escolha", "Cada uma escolhe pedras, charms, letras e pingentes.")}
      {fstep("02", "charmbar.jpg", "center 50%", "Composição", "Combinam cores, texturas e elementos do seu jeito.")}
      {fstep("03", "charm-bolsa.jpg", "center 50%", "Montagem", "Montam a peça com acompanhamento da facilitadora.")}
      {fstep("04", "charm-bolsa-suede.jpg", "center 45%", "Peça pronta", "Cada uma leva o próprio charm na bolsa.")}
    </div>
    <div class="bnote" style="margin-top:18px">◆ Não precisa de experiência: a facilitadora conduz o grupo do começo ao fim, e cada convidada sai com um acessório único. 🧡</div>
    {foot("Como acontece")}
  </section>'''

atmosfera = f'''
  <section class="slide">
{head_simple("Momento Elarah")}
    <span class="eyebrow orange">◆ Momento Elarah</span>
    <h2>Mais que uma oficina, um <em>encontro</em></h2>
    <p class="lead">Mesa montada, materiais lindos e o grupo criando junto — a energia de um lançamento que conecta as convidadas de verdade.</p>
    <div class="egrid">
      <figure>{img("grupo-oficina-atelie.webp", "Evento com o grupo criando junto", "center 40%")}<figcaption>O evento acontecendo</figcaption></figure>
      <figure>{img("hidrateimeninas.jpg", "Meninas criando e rindo juntas", "center 30%")}<figcaption>Criar junto</figcaption></figure>
      <figure>{img("charmbar.jpg", "Detalhes de charms, pérolas e metais", "center 50%")}<figcaption>Detalhes que encantam</figcaption></figure>
    </div>
    {foot("Momento Elarah")}
  </section>'''

incluso = f'''
  <section class="slide">
{head_simple("O que está incluso")}
    <span class="eyebrow orange">◆ Tudo pronto</span>
    <h2>O que está <em>incluso</em></h2>
    <div class="split">
      <div class="sph">{img("piranha-cristais-materiais.jpg", "Mesa com curadoria de charms e materiais", "center 40%")}</div>
      <ul class="inclist">
        <li><span class="ck">✓</span><b>Curadoria e produção</b> Elarah</li>
        <li><span class="ck">✓</span><b>Facilitadora</b> da experiência</li>
        <li><span class="ck">✓</span><b>Materiais</b> para os bag charms</li>
        <li><span class="ck">✓</span>Variedade de <b>charms e elementos</b></li>
        <li><span class="ck">✓</span><b>Ferramentas</b> necessárias</li>
        <li><span class="ck">✓</span><b>Montagem</b> e acompanhamento da atividade</li>
        <li><span class="ck">✓</span>Cada participante <b>leva sua criação</b></li>
      </ul>
    </div>
    {foot("O que está incluso")}
  </section>'''

local = f'''
  <section class="slide">
{head_simple("Local & formato")}
    <span class="eyebrow orange">◆ Onde acontece</span>
    <h2>Em um <em>espaço parceiro</em> Elarah</h2>
    <p class="lead">A Elarah realiza a experiência em um dos nossos espaços parceiros em São Paulo, escolhido conforme região, disponibilidade e o perfil do evento. Se vocês já tiverem um local em mente, também podemos avaliar.</p>
    <div class="duo">
      <figure>{img("betchavas.jpg", "Espaço parceiro em São Paulo", "center 50%")}<figcaption>Espaços com curadoria</figcaption></figure>
      <figure>{img("betchavas2.jpg", "Ambiente contemporâneo para o evento", "center 50%")}<figcaption>Ambiente para o lançamento</figcaption></figure>
    </div>
    {foot("Local & formato")}
  </section>'''

investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>O <em>investimento</em></h2>
    <div class="split">
      <div class="sph">{img("charm-flatlay.jpg", "Bag charm finalizado", "center 50%")}</div>
      <div class="invph">
        <span class="il">Experiência para</span>
        <span class="isub2">15 a 20 convidadas</span>
        <div class="ibig">a partir de R$ XX</div>
        <span class="iper">por pessoa</span>
        <p class="inote">O investimento final varia conforme a quantidade de participantes, o espaço escolhido e o nível de personalização. Confirmamos o valor por pessoa e o total do grupo ao alinhar os detalhes.</p>
      </div>
    </div>
    {foot("Investimento")}
  </section>'''

encerramento = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Bora criar?</span>
    <h2>A gente cuida de <em>tudo</em></h2>
    <p class="lead">Da curadoria à montagem, a Elarah cuida da experiência do início ao fim. Vocês escolhem a data e recebem as convidadas.</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="num">01</div><h3>Escolham a data</h3><p>A gente confirma a disponibilidade e o espaço parceiro.</p></div>
      <div class="infocard"><div class="num">02</div><h3>A gente organiza</h3><p>Curadoria, materiais, facilitadora e montagem por nossa conta.</p></div>
      <div class="infocard"><div class="num">03</div><h3>É só criar</h3><p>No dia, cada convidada monta e leva o próprio bag charm.</p></div>
    </div>
    <div class="quote" style="margin-top:20px">
      Me conta a data que vocês têm em mente que a gente reserva o espaço e organiza cada detalhe do lançamento. 🧡<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n' + cover + experiencia + comoacontece + atmosfera
        + incluso + local + investimento + encerramento + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/proposta-bag-charms.html"
io.open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
