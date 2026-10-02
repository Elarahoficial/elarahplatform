# Portfólio Corporativo de Experiências da Elarah (institucional/coringa)
# Estilo do portfolio Amazon aprovado: editorial, storytelling, cards "em detalhe" grandes, fotos reais.
# SEM graficos. 7 experiencias: Pintura 239 · Vela 269 · Bartenderia 319 · Entre Fatias 349 ·
# Gastronomica 429 · Ceramica 529 · Tufting 799. Elarah no plural. Sem fornecedor/margem/comissao.
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/orcamento-adriana.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]

head = re.sub(r'<title>.*?</title>', '<title>Experiências Corporativas · Elarah</title>', head, count=1, flags=re.DOTALL)
head = re.sub(r'<meta name="description"[^>]*>',
              '<meta name="description" content="Portfólio de experiências corporativas da Elarah: criar, conectar e celebrar fora da rotina. Experiências criativas, sensoriais, sociais e gastronômicas.">',
              head, count=1)

extra = '''
<style>
  /* capa */
  .pflabel{text-align:right;line-height:1.7}
  .pflabel b{display:block;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--navy);font-weight:700}
  .pflabel span{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--navy-soft);font-weight:700}
  .chipcol{display:flex;flex-direction:column;align-items:flex-start;gap:10px;margin-top:4px}
  .pfproof{margin-top:16px;display:flex;gap:11px;align-items:flex-start;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:13px 16px;max-width:380px;box-shadow:0 12px 30px -24px rgba(0,0,0,.3)}
  .pfproof .star{color:var(--orange);font-size:14px;line-height:1.3}
  .pfproof p{font-size:11.5px;color:var(--navy-soft);line-height:1.5;margin:0}
  .pfproof b{color:var(--navy);font-weight:700}
  .pffoot{margin-top:auto;max-width:none;width:100%;box-sizing:border-box;align-items:center}
  .pffoot p{font-size:12.5px}
  /* grade de icones */
  .ig{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:20px;width:100%}
  .igc{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:19px 20px;box-shadow:0 12px 30px -24px rgba(0,0,0,.3)}
  .igc .em{font-size:23px;line-height:1}
  .igc h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy);margin:9px 0 6px;line-height:1.08}
  .igc p{font-size:11.5px;color:var(--muted);line-height:1.5;margin:0}
  .igc p b{color:var(--navy);font-weight:700}
  .qline{margin-top:18px;font-family:'DM Serif Display',serif;font-style:italic;font-size:17px;color:var(--orange-dark)}
  /* vibe mosaico */
  .vibestrip{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:20px;width:100%}
  .vibestrip figure{margin:0;border-radius:16px;overflow:hidden;position:relative;height:206px;box-shadow:0 14px 34px -24px rgba(0,0,0,.4)}
  .vibestrip img{width:100%;height:100%;object-fit:cover;display:block}
  .vibestrip figcaption{position:absolute;left:0;right:0;bottom:0;padding:28px 16px 13px;color:#fff;font-family:'DM Serif Display',serif;font-size:15.5px;background:linear-gradient(to top,rgba(46,31,42,.88),transparent)}
  /* em detalhe (bandas grandes alternadas) */
  .detwrap{display:grid;gap:20px;margin-top:20px}
  .det{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.12fr);background:var(--card);border:1px solid var(--line);border-radius:20px;overflow:hidden;box-shadow:0 16px 40px -28px rgba(0,0,0,.4);min-height:212px}
  .det .dph{position:relative;overflow:hidden;min-height:212px}
  .det .dph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .det.rev .dph{order:2}
  .det .dbd{padding:26px 34px;display:flex;flex-direction:column;justify-content:center}
  .det .cat{font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .det .nm{font-family:'DM Serif Display',serif;font-size:25px;color:var(--navy);line-height:1.04;margin:7px 0 9px}
  .det .ds{font-size:13px;color:var(--muted);line-height:1.6;margin:0 0 16px}
  .det .ds b{color:var(--navy);font-weight:700}
  .det .pill{align-self:flex-start;background:#FBF1EE;border-radius:999px;padding:11px 20px;font-size:13px;font-weight:700;color:var(--navy-soft)}
  .det .pill b{font-family:'DM Serif Display',serif;font-weight:400;font-size:19px;color:var(--orange-dark)}
  .det .pill small{font-weight:600;color:var(--muted)}
  .detfoot{margin-top:14px;font-size:10px;color:var(--muted);line-height:1.45;text-align:center}
  /* como acontece */
  .steps3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;margin-top:20px;width:100%}
  .steps3 .s .n{font-family:'DM Serif Display',serif;font-size:34px;color:var(--orange);line-height:1}
  .steps3 .s h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:19px;color:var(--navy);margin:4px 0 6px}
  .steps3 .s p{font-size:12px;color:var(--muted);line-height:1.5}
  /* investimento lista (sem grafico) */
  .invhero{display:flex;align-items:baseline;gap:14px;margin-top:4px}
  .invhero .n{font-family:'DM Serif Display',serif;font-size:42px;color:var(--navy);line-height:1}
  .invhero .l{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--navy-soft);font-weight:700;max-width:13ch;line-height:1.3}
  .invl{display:grid;grid-template-columns:1fr 1fr;gap:0 40px;margin-top:20px}
  .invl .row{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid var(--line);padding:12px 2px}
  .invl .row .e{font-family:'DM Serif Display',serif;font-size:15px;color:var(--navy)}
  .invl .row .pr{font-family:'DM Serif Display',serif;font-size:15px;color:var(--orange-dark);white-space:nowrap}
  /* fechamento */
  .finbox{margin-top:20px;background:var(--card);border:1px solid var(--line);border-left:4px solid var(--orange);border-radius:14px;padding:20px 26px;box-shadow:0 14px 34px -26px rgba(0,0,0,.3)}
  .finbox .t{font-family:'DM Serif Display',serif;font-size:18px;color:var(--navy);margin:0 0 5px}
  .finbox p{font-size:12.5px;color:var(--navy-soft);line-height:1.5;margin:0}
  .finbox b{color:var(--navy)}
</style>'''
head = head.replace("</head>", extra + "</head>", 1)

FOOTNOTE = ("Valores a partir de, por pessoa, sujeitos a ajustes conforme número de participantes, "
            "localização, duração, personalização, estrutura necessária e formato da experiência.")


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


def det(cat, nome, desc, preco, src, pos="center 50%", rev=False):
    cls = "det rev" if rev else "det"
    return (f'<div class="{cls}"><div class="dph">{img(src, nome, pos)}</div>'
            f'<div class="dbd"><div class="cat">{cat}</div><div class="nm">{nome}</div>'
            f'<div class="ds">{desc}</div>'
            f'<div class="pill">A partir de <b>{preco}</b> <small>/ por pessoa</small></div>'
            f'</div></div>')


def invrow(nome, preco):
    return f'<div class="row"><span class="e">{nome}</span><span class="pr">{preco}</span></div>'


# ===== 1 · CAPA =====
cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><div class="pflabel"><b>Portfólio de Experiências</b><span>Elarah · Corporativo</span></div></div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Um jeito diferente de estar junto</span>
        <h1>Sair da rotina,<br><em>criar</em> e <em>conectar</em>.</h1>
        <p class="lead">Uma curadoria de experiências <strong>criativas, sensoriais e gastronômicas</strong> para transformar encontros de equipe em momentos mais leves e naturais — onde o time cria, conversa e vive algo junto.</p>
        <div class="chipcol">
          <span class="chip">Happy hour &amp; confraternização</span>
          <span class="chip">Sofisticado &amp; criativo</span>
          <span class="chip">Team building diferente</span>
        </div>
      </div>
      <div class="cover-photo">{img("eventocorporativo.jpg", "Time corporativo misto brindando e celebrando junto", "center 32%")}</div>
    </div>
    <div class="pfproof pffoot"><span class="star">★</span><p>Experiências já realizadas para times de empresas como <b>Amazon</b>, <b>Natura</b> e <b>Itaú</b> — e vistas no <b>Mais Você</b> (Globo)</p></div>
    {foot("Portfólio institucional · Elarah")}
  </section>'''

# ===== 2 · O CONCEITO =====
conceito = f'''
  <section class="slide">
{head_simple("O conceito")}
    <span class="eyebrow orange">◆ Team building, mas diferente</span>
    <h2>Encontros mais <em>leves e naturais</em></h2>
    <p class="lead">Reunimos experiências criativas, gastronômicas e sensoriais para transformar encontros de equipe em <strong>momentos mais leves e naturais</strong>. Sem dinâmica forçada, sem quebra-gelo constrangedor — só pessoas <strong>criando, conversando e vivendo algo juntas</strong>.</p>
    <div class="qline">"A melhor forma de conectar um time é criar algo junto."</div>
    <div class="ig">
      {igc("🎨", "Criar", "Cada pessoa no centro da experiência, colocando a mão na massa.")}
      {igc("🤝", "Conectar", "Conversa e troca entre áreas — a hierarquia cai sozinha.")}
      {igc("✨", "Compartilhar", "Sair do óbvio e viver algo novo, bonito e memorável, junto.")}
    </div>
    {foot("O conceito")}
  </section>'''

# ===== 3 · A VIBE =====
vibe = f'''
  <section class="slide">
{head_simple("A vibe")}
    <span class="eyebrow orange">◆ Conexão, criatividade e leveza</span>
    <h2>A vibe do <em>encontro</em></h2>
    <p class="lead">Mãos criando, taças, boa conversa e aquele clima espontâneo: uma <strong>atmosfera contemporânea e acolhedora</strong>, pensada para o time relaxar e se conectar de verdade.</p>
    <div class="vibestrip">
      {vfig("bfa-grupo2.webp", "Criar juntos", "center 45%")}
      {vfig("ceramicamodelagem.jpg", "Mãos que criam", "center 50%")}
      {vfig("andre-brinde-drinks.jpg", "Hora do brinde", "center 40%")}
      {vfig("mesa-cafe-comemoracao.jpg", "Em torno da mesa", "center 45%")}
      {vfig("vibe-conexao-corp.jpg", "Conversa boa", "center 40%")}
      {vfig("lado-b-grupo-pecas.webp", "Peça pra levar", "center 30%")}
    </div>
    {foot("A vibe do encontro")}
  </section>'''

# ===== 4 · A ELARAH VAI ATÉ VOCÊS =====
jeito = f'''
  <section class="slide">
{head_simple("O jeito Elarah")}
    <span class="eyebrow orange">◆ A Elarah vai até vocês</span>
    <h2>Vocês escolhem. <em>Nós cuidamos de tudo.</em></h2>
    <p class="lead">A experiência acontece <strong>onde fizer mais sentido</strong> — no escritório, no espaço do evento ou no venue da empresa. Levamos tudo e montamos antes do grupo chegar.</p>
    <div class="ig">
      {igc("🎨", "Curadoria", "Experiências selecionadas pro perfil do time — bonitas e desejáveis.")}
      {igc("🧑‍🎨", "Profissional &amp; material", "Profissional especializado conduzindo e todos os materiais inclusos.")}
      {igc("📦", "Operação completa", "Montagem, estrutura e desmontagem. <b>Nós chegamos antes</b> e cuidamos de tudo.")}
      {igc("📍", "No espaço de vocês", "Levamos a Elarah até o escritório, rooftop, salão ou venue escolhido.")}
      {igc("🍶", "Estações", "Dá pra combinar mais de uma experiência em estações simultâneas.")}
      {igc("🎁", "Lembrança", "Cada pessoa leva pra casa a peça que criou — a memória do encontro.")}
    </div>
    {foot("O jeito Elarah")}
  </section>'''

# ===== 5 · PORTFÓLIO A · criar & brindar =====
port1 = f'''
  <section class="slide">
{head_simple("Portfólio de experiências")}
    <span class="eyebrow orange">◆ O menu de experiências</span>
    <h2>Para <em>criar e brindar</em></h2>
    <div class="detwrap">
      {det("Criativa · Pintura", "Pintura em Taça", "Uma experiência leve e social para <b>personalizar a própria taça</b> enquanto o grupo conversa e brinda.", "R$ 239", "pintura-corp-class.jpg", "center 45%")}
      {det("Sensorial · Vela", "Vela Aromática", "Cada participante <b>cria a própria vela</b>, explorando fragrâncias e combinações.", "R$ 269", "vela-grupo-oficina.jpg", "center 35%", rev=True)}
      {det("Social · Drinks", "Bartenderia", "Uma experiência prática de drinks para <b>aprender, preparar e brindar junto</b>.", "R$ 319", "andre-mesa-drinks.jpg", "center 50%")}
    </div>
    <div class="detfoot">{FOOTNOTE}</div>
    {foot("Portfólio · 1 de 3")}
  </section>'''

# ===== 6 · PORTFÓLIO B · em torno da mesa =====
port2 = f'''
  <section class="slide">
{head_simple("Portfólio de experiências")}
    <span class="eyebrow orange">◆ O menu de experiências</span>
    <h2>Em torno da <em>mesa</em></h2>
    <div class="detwrap">
      {det("Gastronômica · Compartilhar", "Entre Fatias &amp; Taças", "Pizza, vinho e uma experiência gastronômica <b>pensada para compartilhar</b> em torno da mesa.", "R$ 349", "bfa-grupo1.webp", "center 50%")}
      {det("Gastronômica · Mão na massa", "Experiência Gastronômica", "Uma experiência <b>mão na massa</b> em torno da gastronomia, criada para aproximar o grupo.", "R$ 429", "corp-grupo.jpg", "center 50%", rev=True)}
    </div>
    <div class="detfoot">{FOOTNOTE}</div>
    {foot("Portfólio · 2 de 3")}
  </section>'''

# ===== 7 · PORTFÓLIO C · mão na massa, peça autoral =====
port3 = f'''
  <section class="slide">
{head_simple("Portfólio de experiências")}
    <span class="eyebrow orange">◆ O menu de experiências</span>
    <h2>Mão na massa, <em>peça autoral</em></h2>
    <div class="detwrap">
      {det("Criativa · Cerâmica", "Cerâmica", "Uma pausa criativa para <b>modelar, criar e desenvolver uma peça</b> com as próprias mãos.", "R$ 529", "ceramica.jpg", "center 40%")}
      {det("Criativa · Têxtil", "Tufting &amp; Punch Needle", "Uma experiência têxtil criativa em que cada participante <b>desenvolve a própria peça</b>.", "R$ 799", "lado-b-grupo-pecas.webp", "center 30%", rev=True)}
    </div>
    <div class="detfoot">{FOOTNOTE}</div>
    {foot("Portfólio · 3 de 3")}
  </section>'''

# ===== 8 · COMO ACONTECE =====
como = f'''
  <section class="slide">
{head_simple("Como acontece")}
    <span class="eyebrow orange">◆ Como acontece</span>
    <h2>Simples pra vocês, <em>impecável</em> pro grupo</h2>
    <p class="lead">Do primeiro alinhamento ao último brinde, a <strong>Elarah cuida de tudo</strong> — o time só escolhe e aproveita.</p>
    <div class="steps3">
      <div class="s"><div class="n">1</div><h3>Escolham</h3><p>A experiência (ou a combinação) com mais a cara do time.</p></div>
      <div class="s"><div class="n">2</div><h3>A gente monta</h3><p>Profissional, materiais e estrutura — tudo sob medida, no espaço de vocês.</p></div>
      <div class="s"><div class="n">3</div><h3>É só viver</h3><p>No dia, chega tudo pronto. O grupo só cria, conecta e aproveita.</p></div>
    </div>
    <div class="qline">"Vocês chegam, criam e levam pra casa. O resto é com a gente."</div>
    {foot("Como acontece")}
  </section>'''

# ===== 9 · INVESTIMENTO (sem gráfico) =====
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Valor <em>por pessoa</em></h2>
    <p class="lead">Todas as experiências já incluem <strong>condução profissional, materiais, estrutura</strong> e a lembrança pra levar pra casa.</p>
    <div class="invhero"><div class="n">R$ 239</div><div class="l">a partir de, por pessoa</div></div>
    <div class="invl">
      {invrow("Pintura em Taça", "R$ 239")}
      {invrow("Vela Aromática", "R$ 269")}
      {invrow("Bartenderia", "R$ 319")}
      {invrow("Entre Fatias &amp; Taças", "R$ 349")}
      {invrow("Experiência Gastronômica", "R$ 429")}
      {invrow("Cerâmica", "R$ 529")}
      {invrow("Tufting &amp; Punch Needle", "R$ 799")}
    </div>
    <p class="fineprint">{FOOTNOTE} O investimento total é fechado pela experiência escolhida × o número de participantes.</p>
    {foot("Investimento")}
  </section>'''

# ===== 10 · PRÓXIMOS PASSOS =====
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Bora escolher? ✨</span>
    <h2>É só <em>apontar</em> a favorita</h2>
    <p class="lead">Seja para <strong>celebrar, integrar o time</strong> ou simplesmente sair um pouco da rotina, nós montamos uma experiência pensada para o grupo de vocês.</p>
    <div class="qline">Conta pra gente a data, o número de pessoas e a vibe do encontro — nós cuidamos do restante.</div>
    <div class="finbox">
      <p class="t">Elarah · Experiências para viver junto.</p>
      <p>contato@elarah.com.br &nbsp;·&nbsp; <b>elarah.com.br</b> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; WhatsApp <b>+55 (11) 91445-5930</b></p>
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n' + cover + conceito + vibe + jeito + port1 + port2 + port3
        + como + investimento + proximos + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/portfolio-corporativo-elarah.html"
io.open(out, "w", encoding="utf-8").write(html)
for bad in ["fornecedor", "repasse", "comiss", "margem"]:
    assert bad not in deck.lower(), f"PROIBIDO: {bad}"
PRECOS = {"Pintura em Taça": "R$ 239", "Vela Aromática": "R$ 269", "Bartenderia": "R$ 319",
          "Entre Fatias": "R$ 349", "Experiência Gastronômica": "R$ 429", "Cerâmica": "R$ 529",
          "Tufting": "R$ 799"}
for nome, preco in PRECOS.items():
    assert nome in deck, f"FALTA EXPERIENCIA: {nome}"
    assert preco in deck, f"FALTA PRECO: {preco}"
print("wrote", out, "| slides:", html.count('<section class="slide">'))
