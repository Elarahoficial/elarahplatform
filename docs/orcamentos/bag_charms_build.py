# Proposta Elarah · Bag Charms · lancamento de marca · 15 a 20 meninas · SP
# v2: enxuto. Capa mao na massa (montando acessorio); experiencia unida com passo a passo;
# momento Elarah = mosaico 6; incluso com foto de charm; espaco com 4 sugestoes; investimento em tabela (Completa/Premium).
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/proposta-bag-charms.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]

extra = '''
<style>
  .mos2{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:16px}
  .mos2 figure{margin:0;border-radius:15px;overflow:hidden;position:relative;height:200px;border:1px solid var(--line);box-shadow:0 14px 34px -24px rgba(0,0,0,.36)}
  .mos2 img{width:100%;height:100%;object-fit:cover;display:block}
  .mos2 figcaption{position:absolute;left:0;right:0;bottom:0;padding:24px 14px 11px;color:#fff;font-size:11.5px;font-weight:600;letter-spacing:.03em;background:linear-gradient(to top,rgba(46,31,42,.86),transparent)}
  .itbl{width:100%;border-collapse:collapse;margin-top:20px;border-radius:16px;overflow:hidden;box-shadow:0 16px 40px -30px rgba(0,0,0,.32)}
  .itbl th{background:var(--navy);color:#fff;text-align:left;padding:13px 20px;font-size:10px;letter-spacing:.1em;text-transform:uppercase;font-weight:700}
  .itbl th.r{text-align:right}
  .itbl td{padding:16px 20px;border-bottom:1px solid var(--line);background:var(--card);vertical-align:top}
  .itbl tr:last-child td{border-bottom:none}
  .itbl tr.prem td{background:#FBF0F3}
  .itbl .opt{font-family:'DM Serif Display',serif;font-size:18px;color:var(--navy);line-height:1.06}
  .itbl .opt small{display:block;font-family:'DM Sans',sans-serif;font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--orange-dark);font-weight:700;margin-top:3px}
  .itbl .inc{font-size:11px;color:var(--muted);line-height:1.45}
  .itbl .pp,.itbl .tot{text-align:right;white-space:nowrap}
  .itbl .todo{font-family:'DM Sans',sans-serif;font-size:12.5px;font-style:italic;color:var(--orange-dark);font-weight:600}
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
      <div class="cover-photo">{img("fazendojoia.jpg", "Mãos montando um acessório com pingentes e pedras", "center 45%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Bag Charms · São Paulo")}
  </section>'''

experiencia = f'''
  <section class="slide">
{head_simple("A experiência")}
    <span class="eyebrow orange">◆ Cada uma cria o seu</span>
    <h2>Do charm à <em>peça final</em></h2>
    <p class="lead">Cada convidada escolhe entre correntes, pingentes, letras, pérolas e acessórios e monta o próprio bag charm — do jeitinho dela, com acompanhamento da facilitadora.</p>
    <div class="flow4">
      {fstep("01", "charmbar.jpg", "center 50%", "Escolha", "Escolhem charms, pingentes, pérolas e letras.")}
      {fstep("02", "charm-flatlay.jpg", "center 50%", "Composição", "Combinam cores, texturas e elementos.")}
      {fstep("03", "joia-atelie.jpg", "center 50%", "Montagem", "Montam a peça com acompanhamento.")}
      {fstep("04", "charm-bolsa-suede.jpg", "center 45%", "Peça final", "Cada uma leva o próprio charm na bolsa.")}
    </div>
    <div class="bnote" style="margin-top:18px">◆ Não precisa de experiência: a facilitadora conduz o grupo do começo ao fim, e cada convidada sai com um acessório único. 🧡</div>
    {foot("A experiência")}
  </section>'''

momento = f'''
  <section class="slide">
{head_simple("Momento Elarah")}
    <span class="eyebrow orange">◆ Momento Elarah</span>
    <h2>A experiência <em>acontecendo</em></h2>
    <div class="mos2">
      <figure>{img("hidrateimeninas.jpg", "Meninas criando e rindo juntas", "center 30%")}<figcaption>Criar junto</figcaption></figure>
      <figure>{img("fazendojoia.jpg", "Mãos montando o acessório", "center 50%")}<figcaption>Mão na massa</figcaption></figure>
      <figure>{img("charmbar.jpg", "Escolhendo charms e pingentes", "center 50%")}<figcaption>Escolher os charms</figcaption></figure>
      <figure>{img("joia-atelie.jpg", "Detalhe das mãos criando", "center 50%")}<figcaption>Cada detalhe</figcaption></figure>
      <figure>{img("charm-flatlay.jpg", "Mesa com materiais e resultado", "center 50%")}<figcaption>Materiais &amp; resultado</figcaption></figure>
      <figure>{img("charm-bolsa.jpg", "Bag charm finalizado na bolsa", "center 50%")}<figcaption>Na bolsa</figcaption></figure>
    </div>
    {foot("Momento Elarah")}
  </section>'''

incluso = f'''
  <section class="slide">
{head_simple("O que está incluso")}
    <span class="eyebrow orange">◆ Tudo pronto</span>
    <h2>O que está <em>incluso</em></h2>
    <div class="split">
      <div class="sph">{img("charm-bolsa-suede.jpg", "Bag charm finalizado", "center 45%")}</div>
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

espaco = f'''
  <section class="slide">
{head_simple("Local & formato")}
    <span class="eyebrow orange">◆ Onde acontece</span>
    <h2>O espaço certo para <em>o lançamento</em></h2>
    <p class="lead">A Elarah trabalha com espaços parceiros e outras opções de locação em São Paulo. Dependendo do formato, o espaço pode ter ou não custo de locação — buscamos o ambiente com a cara da marca.</p>
    <div class="duo">
      <figure>{img("betchavas.jpg", "Rooftop e lounge contemporâneo", "center 50%")}<figcaption>Rooftop &amp; lounge</figcaption></figure>
      <figure>{img("betchavas3.jpg", "Espaço envidraçado e verde", "center 50%")}<figcaption>Envidraçado &amp; verde</figcaption></figure>
      <figure>{img("betchavas2.jpg", "Bar social contemporâneo", "center 50%")}<figcaption>Bar contemporâneo</figcaption></figure>
      <figure>{img("sterna-painel.webp", "Café urbano e bem localizado", "center 50%")}<figcaption>Café urbano</figcaption></figure>
    </div>
    <p class="fineprint">Sugestões de ambiente conforme região e disponibilidade. O espaço e as condições (com ou sem custo de locação) são confirmados ao alinhar o formato do evento.</p>
    {foot("Local & formato")}
  </section>'''

investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Escolham a <em>opção</em></h2>
    <table class="itbl">
      <thead>
        <tr><th>Opção</th><th>O que inclui</th><th class="r">Por pessoa</th><th class="r">Total</th></tr>
      </thead>
      <tbody>
        <tr>
          <td class="opt">Completa</td>
          <td class="inc">Experiência + curadoria de charms + materiais + facilitadora — cada uma leva a peça.</td>
          <td class="pp"><span class="todo">a confirmar</span></td>
          <td class="tot"><span class="todo">a confirmar</span></td>
        </tr>
        <tr class="prem">
          <td class="opt">Premium<small>+ foto &amp; mimo</small></td>
          <td class="inc">Tudo da Completa + <b>registro fotográfico</b> do evento + <b>mimo</b> para as convidadas.</td>
          <td class="pp"><span class="todo">a confirmar</span></td>
          <td class="tot"><span class="todo">a confirmar</span></td>
        </tr>
      </tbody>
    </table>
    <p class="fineprint">Valores por pessoa e total a confirmar conforme o número de convidadas, o espaço e o nível de personalização. Experiência para 15 a 20 convidadas.</p>
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
      <div class="infocard"><div class="num">01</div><h3>Escolham a data</h3><p>A gente confirma a disponibilidade e o espaço.</p></div>
      <div class="infocard"><div class="num">02</div><h3>A gente organiza</h3><p>Curadoria, materiais, facilitadora e montagem por nossa conta.</p></div>
      <div class="infocard"><div class="num">03</div><h3>É só criar</h3><p>No dia, cada convidada monta e leva o próprio bag charm.</p></div>
    </div>
    <div class="quote" style="margin-top:20px">
      Me conta a data que vocês têm em mente que a gente reserva o espaço e organiza cada detalhe do lançamento. 🧡<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n' + cover + experiencia + momento + incluso + espaco
        + investimento + encerramento + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/proposta-bag-charms.html"
io.open(out, "w", encoding="utf-8").write(html)
assert "piranha" not in deck, "PROIBIDO: piranha"
print("wrote", out, "| slides:", html.count('<section class="slide">'), "| ok")
