# Proposta Elarah · Aniversario Natalia Conti · 6 pessoas · 28/11/2026 · Morumbi
# Formato Elarah Ate Voce. Alinhado ao PORTFOLIO recente (padrao Amazon/corporativo):
# Capa portfolio -> O encontro -> A vibe -> O jeito Elarah -> A vitrine -> Como acontece -> Investimento -> Proximos.
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/orcamento-adriana.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]

head = re.sub(r'<title>.*?</title>', '<title>Natália Conti · Aniversário · Elarah</title>', head, count=1, flags=re.DOTALL)
head = re.sub(r'<meta name="description"[^>]*>',
              '<meta name="description" content="Portfólio de experiências Elarah para o aniversário da Natália Conti: criar, brindar e celebrar entre amigas, no formato Elarah Até Você.">',
              head, count=1)

extra = '''
<style>
  /* capa portfolio */
  .pflabel{text-align:right;line-height:1.7}
  .pflabel b{display:block;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--navy);font-weight:700}
  .pflabel span{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--navy-soft);font-weight:700}
  .chipcol{display:flex;flex-direction:column;align-items:flex-start;gap:10px;margin-top:4px}
  .pfproof{margin-top:16px;display:flex;gap:11px;align-items:flex-start;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:13px 16px;max-width:370px;box-shadow:0 12px 30px -24px rgba(0,0,0,.3)}
  .pfproof .star{color:var(--orange);font-size:14px;line-height:1.3}
  .pfproof p{font-size:11.5px;color:var(--navy-soft);line-height:1.5;margin:0}
  .pfproof b{color:var(--navy);font-weight:700}
  /* grade de icones (o encontro / o jeito elarah) */
  .ig{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:20px}
  .igc{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:19px 20px;box-shadow:0 12px 30px -24px rgba(0,0,0,.3)}
  .igc .em{font-size:23px;line-height:1}
  .igc h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy);margin:9px 0 6px;line-height:1.08}
  .igc p{font-size:11.5px;color:var(--muted);line-height:1.5;margin:0}
  .igc p b{color:var(--navy);font-weight:700}
  .qline{margin-top:18px;font-family:'DM Serif Display',serif;font-style:italic;font-size:17px;color:var(--orange-dark)}
  /* a vibe */
  .vibestrip{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:20px}
  .vibestrip figure{margin:0;border-radius:16px;overflow:hidden;position:relative;height:200px;box-shadow:0 14px 34px -24px rgba(0,0,0,.4)}
  .vibestrip img{width:100%;height:100%;object-fit:cover;display:block}
  .vibestrip figcaption{position:absolute;left:0;right:0;bottom:0;padding:28px 15px 12px;color:#fff;font-family:'DM Serif Display',serif;font-size:15px;background:linear-gradient(to top,rgba(46,31,42,.86),transparent)}
  /* a vitrine (cards ricos) */
  .vtg{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-top:18px}
  .vtc{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 14px 32px -24px rgba(0,0,0,.32)}
  .vtph{height:122px;position:relative;overflow:hidden;background:#eee}
  .vtph img{width:100%;height:100%;object-fit:cover;display:block}
  .vtnum{position:absolute;top:9px;left:9px;width:26px;height:26px;border-radius:999px;background:var(--navy);color:#fff;font-family:'DM Serif Display',serif;font-size:11.5px;display:flex;align-items:center;justify-content:center}
  .vtb{padding:11px 13px 12px;display:flex;flex-direction:column;flex:1}
  .vtcat{font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .vtn{font-family:'DM Serif Display',serif;font-size:14px;color:var(--navy);line-height:1.1;margin:4px 0 5px}
  .vtd{font-size:9.5px;color:var(--muted);line-height:1.42}
  .vtmeta{margin-top:auto;padding-top:9px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:baseline;gap:6px}
  .vtdur{font-size:9px;color:var(--navy-soft);font-weight:600;white-space:nowrap}
  .vtp{font-family:'DM Serif Display',serif;font-size:13px;color:var(--orange-dark);white-space:nowrap}
  .vtp small{font-family:'DM Sans',sans-serif;font-size:8.5px;color:var(--muted)}
  /* como acontece */
  .steps3{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:20px}
  .steps3 .s .n{font-family:'DM Serif Display',serif;font-size:34px;color:var(--orange);line-height:1}
  .steps3 .s h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:19px;color:var(--navy);margin:4px 0 6px}
  .steps3 .s p{font-size:12px;color:var(--muted);line-height:1.5}
  /* investimento lista */
  .invhero{display:flex;align-items:baseline;gap:14px;margin-top:4px}
  .invhero .n{font-family:'DM Serif Display',serif;font-size:40px;color:var(--navy);line-height:1}
  .invhero .l{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--navy-soft);font-weight:700;max-width:12ch;line-height:1.3}
  .invl{display:grid;grid-template-columns:1fr 1fr;gap:0 34px;margin-top:18px}
  .invl .row{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid var(--line);padding:11px 2px}
  .invl .row .e{font-family:'DM Serif Display',serif;font-size:14.5px;color:var(--navy)}
  .invl .row .pr{font-family:'DM Serif Display',serif;font-size:14.5px;color:var(--orange-dark);white-space:nowrap}
</style>'''
head = head.replace("</head>", extra + "</head>", 1)


def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'


def img(src, alt, pos="center 50%"):
    return f'<img src="assets/{src}" alt="{alt}" style="object-position:{pos}">'


def head_simple(kicker):
    return f'''    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">{kicker}</span></div>
    </div>'''


def igc(em, titulo, desc):
    return f'<div class="igc"><div class="em">{em}</div><h3>{titulo}</h3><p>{desc}</p></div>'


def vfig(src, cap, pos="center 50%"):
    return f'<figure>{img(src, cap, pos)}<figcaption>{cap}</figcaption></figure>'


def vt(n, cat, nome, desc, dur, preco, src, pos="center 50%"):
    return (f'<div class="vtc"><div class="vtph">{img(src, nome, pos)}<div class="vtnum">{n}</div></div>'
            f'<div class="vtb"><div class="vtcat">{cat}</div><div class="vtn">{nome}</div>'
            f'<div class="vtd">{desc}</div>'
            f'<div class="vtmeta"><span class="vtdur">• {dur}</span><span class="vtp">{preco}<small>/pessoa</small></span></div>'
            f'</div></div>')


def invrow(nome, preco):
    return f'<div class="row"><span class="e">{nome}</span><span class="pr">{preco}</span></div>'


# ===== 1 · CAPA =====
cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><div class="pflabel"><b>Portfólio de Experiências</b><span>Elarah · Aniversário</span></div></div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Um aniversário só de vocês</span>
        <h1>Criar, <em>brindar</em>, <em>celebrar</em>.</h1>
        <p class="lead">Uma curadoria de experiências criativas para um grupo de <strong>amigas que gostam de criar, trocar e viver algo diferente</strong> — momentos bonitos e cheios de afeto, com a sofisticação da Elarah e a leveza de uma boa conversa.</p>
        <div class="chipcol">
          <span class="chip">Aniversário entre amigas</span>
          <span class="chip">Criativo &amp; sofisticado</span>
          <span class="chip">Uma lembrança pra levar</span>
        </div>
        <div class="pfproof"><span class="star">★</span><p>Experiências já realizadas para grupos como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)</p></div>
      </div>
      <div class="cover-photo">{img("aniversario-ceramica-capa.jpg", "Amigas rindo e criando juntas", "center 28%")}</div>
    </div>
    {foot("Preparado para Natália Conti · 6 convidadas · 28/11 · Morumbi")}
  </section>'''

# ===== 2 · O ENCONTRO =====
encontro = f'''
  <section class="slide">
{head_simple("O encontro")}
    <span class="eyebrow orange">◆ O encontro</span>
    <h2>Amigas <em>protagonistas</em>, criativas e conectadas</h2>
    <p class="lead">A ideia é simples e gostosa: um momento para <strong>sair da rotina, criar juntas e celebrar</strong>. Um grupo de amigas que gostam de experimentar, colocar a mão na massa e viver experiências que fogem do óbvio. Mais do que uma atividade, é um espaço de <strong>troca, risada e presença</strong> — onde cada uma cria algo com as próprias mãos e leva pra casa uma lembrança cheia de significado.</p>
    <div class="qline">"A melhor forma de comemorar é criar algo juntas."</div>
    <div class="ig">
      {igc("🎨", "Protagonismo", "Cada uma no centro da experiência, criando algo autoral e único.")}
      {igc("🤝", "Conexão", "Conversa, risada e troca — as amigas mais perto, de um jeito leve.")}
      {igc("✨", "Celebração", "Sair do óbvio e viver algo novo, bonito e memorável.")}
    </div>
    {foot("O encontro")}
  </section>'''

# ===== 3 · A VIBE =====
vibe = f'''
  <section class="slide">
{head_simple("A vibe")}
    <span class="eyebrow orange">◆ Conversa, conexão e criação</span>
    <h2>A vibe do <em>encontro</em></h2>
    <p class="lead">Taças, aromas, flores e pequenos detalhes: uma <strong>atmosfera sofisticada e sensorial</strong>, feita pra criar, brindar e viver momentos espontâneos de conversa.</p>
    <div class="vibestrip">
      {vfig("agora-grupo.jpg", "Criar juntas", "center 50%")}
      {vfig("agora-pintura.jpg", "Mãos que criam", "center 40%")}
      {vfig("aniv-decor.jpg", "Pequenos detalhes", "center 40%")}
      {vfig("pintura-taca-brinde.jpg", "Hora do brinde", "center 40%")}
      {vfig("buque.jpg", "Flores pra levar", "center 45%")}
      {vfig("vela-aromatica-real.jpg", "Aromas que ficam", "center 50%")}
    </div>
    {foot("A vibe da experiência")}
  </section>'''

# ===== 4 · O JEITO ELARAH =====
jeito = f'''
  <section class="slide">
{head_simple("O jeito Elarah")}
    <span class="eyebrow orange">◆ O que a Elarah leva</span>
    <h2>A <em>Elarah cuida de tudo</em></h2>
    <p class="lead">Vocês escolhem a experiência; o resto é com a gente. Da curadoria à última taça, <strong>tudo chega pronto</strong> pra que o grupo só precise viver o momento.</p>
    <div class="ig">
      {igc("🎨", "Curadoria", "Experiências selecionadas a dedo pro perfil do grupo — bonitas e desejáveis.")}
      {igc("🧑‍🎨", "Profissional &amp; material", "Artista conduzindo e todos os materiais premium inclusos.")}
      {igc("📦", "Operação completa", "Montagem, estrutura e desmontagem. A gente chega antes e cuida de tudo.")}
      {igc("📍", "No espaço de vocês", "<b>Elarah até você</b>: levamos a experiência até casa, condomínio ou onde preferirem.")}
      {igc("🍶", "Estações", "Dá pra combinar mais de uma experiência em estações simultâneas.")}
      {igc("🎁", "Lembrança", "Cada convidada leva pra casa a peça que criou — a memória do dia.")}
    </div>
    {foot("O jeito Elarah")}
  </section>'''

# ===== 5 · A VITRINE =====
vitrine = f'''
  <section class="slide">
{head_simple("A vitrine")}
    <span class="eyebrow orange">◆ Escolham a favorita</span>
    <h2>O <em>menu</em> de experiências</h2>
    <p class="lead">Experiências pensadas pra esse grupo. Escolham a favorita — ou combinem mais de uma em estações.</p>
    <div class="vtg">
      {vt("01", "Pintura", "Pintura em Taça", "Pintam à mão a própria taça e brindam com ela.", "2h", "R$ 259", "pinturataca.jpg", "center 45%")}
      {vt("02", "Acessórios", "Charm Bar &amp; Berloque", "Montam a própria joia e o berloque de bolsa.", "1h30", "R$ 259", "charm-making-mesa.jpg", "center 45%")}
      {vt("03", "Customização", "Escova &amp; Presilha", "Personalizam escovas e presilhas à mão.", "1h30", "R$ 269", "escova-pintada-flores.webp", "center 50%")}
      {vt("04", "Memórias", "Scrapbook", "Recortes e texturas viram uma composição autoral.", "2h", "R$ 279", "colagem.jpg", "center 55%")}
      {vt("05", "Vela", "Vela Aromática", "Criam a própria vela e aroma — levam pra casa.", "1h30", "R$ 289", "vela-grupo-oficina.jpg", "center 35%")}
      {vt("06", "Porcelana", "Pintura em Caneca", "Pintam à mão a própria caneca de porcelana.", "2h", "R$ 299", "xicarapintada.jpg", "center 50%")}
      {vt("07", "Cerâmica", "Pintura em Cerâmica", "Peças de cerâmica ganham cor e personalidade.", "2h", "R$ 299", "agora-pintando.jpg", "center 30%")}
      {vt("08", "Floral", "Buquê de Flores", "Montam o próprio arranjo com flores da estação.", "1h30", "R$ 319", "buque.jpg", "center 45%")}
    </div>
    <p class="fineprint">✦ Valores por pessoa, com condução por profissional, materiais e estrutura inclusos. Uma seleção do nosso portfólio — outras experiências sob consulta.</p>
    {foot("A vitrine")}
  </section>'''

# ===== 6 · COMO ACONTECE =====
como = f'''
  <section class="slide">
{head_simple("Como acontece")}
    <span class="eyebrow orange">◆ Como acontece</span>
    <h2>Simples pra vocês, <em>impecável</em> pro grupo</h2>
    <p class="lead">Do primeiro alinhamento ao último brinde, a <strong>Elarah cuida de tudo</strong> — vocês só escolhem e aproveitam.</p>
    <div class="steps3">
      <div class="s"><div class="n">1</div><h3>Escolham</h3><p>A experiência (ou a combinação) que mais tem a cara do grupo.</p></div>
      <div class="s"><div class="n">2</div><h3>A gente monta</h3><p>Materiais, profissionais e estrutura — tudo sob medida, no espaço de vocês.</p></div>
      <div class="s"><div class="n">3</div><h3>É só viver</h3><p>No dia, chega tudo pronto. O grupo só cria, celebra e aproveita.</p></div>
    </div>
    <div class="qline">"Vocês chegam, criam e levam pra casa. O resto é com a gente."</div>
    {foot("Como acontece")}
  </section>'''

# ===== 7 · INVESTIMENTO =====
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Valor <em>por pessoa</em></h2>
    <p class="lead">Todas as experiências já incluem condução profissional, materiais, estrutura e a <strong>lembrança pra levar pra casa</strong>.</p>
    <div class="invhero"><div class="n">R$ 259</div><div class="l">a partir de, por pessoa</div></div>
    <div class="invl">
      {invrow("Pintura em Taça", "R$ 259")}
      {invrow("Charm Bar &amp; Berloque", "R$ 259")}
      {invrow("Escova &amp; Presilha", "R$ 269")}
      {invrow("Scrapbook", "R$ 279")}
      {invrow("Vela Aromática", "R$ 289")}
      {invrow("Pintura em Caneca de Porcelana", "R$ 299")}
      {invrow("Pintura em Cerâmica", "R$ 299")}
      {invrow("Buquê de Flores", "R$ 319")}
    </div>
    <p class="fineprint">Investimento do grupo calculado pela experiência escolhida × número de participantes (6). Algumas experiências podem ter acréscimo de até <b>R$ 120 de deslocamento</b>, conforme a logística do atendimento. Aniversário em <b>28/11/2026</b>, sujeito à disponibilidade.</p>
    {foot("Investimento")}
  </section>'''

# ===== 8 · PRÓXIMOS PASSOS =====
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Bora escolher? ✨</span>
    <h2>É só <em>apontar</em> a favorita</h2>
    <p class="lead">Natália, me conta qual (ou quais!) experiência mais combinou com o grupo, que eu monto a <strong>proposta final</strong> — com investimento, estrutura e tudo pronto pro dia. 🤍</p>
    <div class="rule"></div>
    <div class="steps3">
      <div class="s"><div class="n">1</div><h3>Escolham</h3><p>A(s) experiência(s) favorita(s) do grupo.</p></div>
      <div class="s"><div class="n">2</div><h3>Organizamos</h3><p>Materiais, profissionais e estrutura por nossa conta.</p></div>
      <div class="s"><div class="n">3</div><h3>É só curtir</h3><p>No dia, chega tudo pronto — vocês só aproveitam.</p></div>
    </div>
    <div class="quote" style="margin-top:20px">
      Uma tarde pra criar, conectar e levar pra casa muito mais que uma lembrança. 🤍<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Preparado para Natália Conti")}
  </section>'''

deck = ('<div class="deck">\n' + cover + encontro + vibe + jeito + vitrine
        + como + investimento + proximos + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/natalia-conti.html"
io.open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
