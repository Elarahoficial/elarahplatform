# Proposta Elarah · Aniversario Fernanda · Ceramica no Agora · 5 amigas · 26/09 · Pinheiros
# Base visual: vinho_ceramica_aniversario (aprovado) — paleta vinho/terracota, feminina/elegante.
# Foco UNICO: Agora (Pinheiros). Vender atmosfera e experiencia, nao "aula de ceramica".
# Valor final ja com margem Elarah embutida: R$494/pessoa · R$2.470 grupo (5). NUNCA mostrar fornecedor/comissao.
# Opcionais ja no preco final. Fotos representativas de ceramica/atelie (trocar pelas fotos reais do Agora quando houver).
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

# ---- paleta vinho + terracota (mesma do deck aprovado) ----
reps = {
    "--orange:#B08D4C;": "--orange:#B87351;",
    "--orange-dark:#8A6D34;": "--orange-dark:#8E5236;",
    "--navy:#12362B;": "--navy:#3C1F28;",
    "--navy-soft:#3A5A4E;": "--navy-soft:#6B4A52;",
    "--blue-accent:#B08D4C;": "--blue-accent:#B87351;",
    "#EFF3EE": "#FBF1EE", "#DCE8E1": "#F0DED6", "#CBB06E": "#CFA07E",
    "rgba(176,141,76,.24)": "rgba(184,115,81,.24)",
    "rgba(176,141,76,.26)": "rgba(184,115,81,.28)",
    "rgba(176,141,76,.10)": "rgba(184,115,81,.10)",
    "rgba(18,54,43,.16)": "rgba(60,31,40,.16)",
    "rgba(10,28,22,.86)": "rgba(32,16,22,.86)",
    "rgba(10,28,22,.85)": "rgba(32,16,22,.85)",
    "rgba(10,28,22,.82)": "rgba(32,16,22,.82)",
}
for a, b in reps.items():
    head = head.replace(a, b)

extra = '''
  /* checklist do que esta incluso */
  .checks{display:grid;grid-template-columns:1fr 1fr;gap:11px 32px;margin-top:18px;list-style:none;padding:0}
  .checks li{position:relative;padding-left:26px;font-size:13.5px;color:var(--ink);line-height:1.4}
  .checks li:before{content:"✦";position:absolute;left:0;top:0;color:var(--orange);font-size:13px}
  .checks li b{color:var(--navy);font-weight:600}
  /* investimento · valor unico */
  .phero{display:grid;grid-template-columns:.95fr 1.05fr;gap:38px;margin-top:20px;align-items:center}
  .pheroph{border-radius:18px;overflow:hidden;border:1px solid var(--line);box-shadow:0 18px 42px -26px rgba(0,0,0,.42);min-height:380px}
  .pheroph img{width:100%;height:100%;object-fit:cover;display:block}
  .pval .pct{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange-dark);font-weight:700}
  .pval .pbig{font-family:'DM Serif Display',serif;font-size:68px;color:var(--navy);line-height:.92;margin:8px 0 2px}
  .pval .pper{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--navy-soft);font-weight:700}
  .pval .pgrp{font-family:'DM Serif Display',serif;font-size:23px;color:var(--orange-dark);margin-top:16px;line-height:1.1}
  .pval .pnote{font-size:12.5px;color:var(--muted);margin-top:14px;line-height:1.55;max-width:42ch}
  /* opcionais */
  .opl{display:flex;flex-direction:column;gap:11px;margin-top:18px}
  .op{display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:15px 22px;box-shadow:0 12px 28px -24px rgba(0,0,0,.26)}
  .op .opn{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy);line-height:1.08}
  .op .opd{font-size:11.5px;color:var(--muted);margin-top:4px;line-height:1.4}
  .op .opp{text-align:right;white-space:nowrap}
  .op .opp b{font-family:'DM Serif Display',serif;font-weight:400;font-size:22px;color:var(--orange-dark);display:block;line-height:1}
  .op .opp .pu{font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-weight:700}
  .op .opp .pt{display:block;font-size:10.5px;color:var(--muted);margin-top:5px}
  /* callout de data */
  .datecall{display:flex;gap:13px;align-items:flex-start;margin-top:18px;background:rgba(184,115,81,.12);border:1px solid rgba(184,115,81,.32);border-radius:14px;padding:14px 20px}
  .datecall .di{font-size:17px;line-height:1.2}
  .datecall p{font-size:12.5px;color:var(--navy);line-height:1.5;margin:0}
  .datecall p b{color:var(--orange-dark)}
</style>'''
head = head.replace("</style>", extra, 1)


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


def opt(name, desc, unit, total):
    return (f'<div class="op"><div><div class="opn">{name}</div><div class="opd">{desc}</div></div>'
            f'<div class="opp"><b>{unit}</b><span class="pu">por pessoa</span><span class="pt">{total} · para 5</span></div></div>')


# ============================ 1 · CAPA ============================
cover = f'''
  <section class="slide">
{head_block("Aniversário · cerâmica", "Fernanda", "", "Agora · Pinheiros · 26/09")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Um aniversário no ateliê</span>
        <h1>Um aniversário para <em>criar juntas</em></h1>
        <p class="lead">Cerâmica, conversa boa e uma tarde só de vocês.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>26/09</b></span>
          <span class="chip"><b>5</b> amigas</span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip">Agora · Pinheiros</span>
        </div>
      </div>
      <div class="cover-photo">{img("ceramica-meninas.jpg", "Amigas rindo juntas numa experiência de cerâmica", "center 30%")}</div>
    </div>
    {foot("Aniversário · Fernanda")}
  </section>'''

# ============================ 2 · A EXPERIÊNCIA ============================
experiencia = f'''
  <section class="slide">
{head_simple("A experiência")}
    <span class="eyebrow orange">◆ A experiência</span>
    <h2>Criar, conversar <em>e celebrar</em></h2>
    <p class="lead">Uma comemoração intimista em um ateliê criativo no coração de Pinheiros. Guiadas por uma professora, vocês criam as próprias peças em cerâmica — sem precisar ter experiência nenhuma. A ideia é desacelerar, colocar a mão na massa e aproveitar algumas horas juntas.</p>
    <div class="bfeat">
      <div class="bphoto">{img("ceramicamodelagem.jpg", "Mãos modelando uma peça de cerâmica", "center 50%")}</div>
      <div class="bbody">
        <span class="btag">Cerca de 3 horas</span>
        <h3>Como acontece</h3>
        <ul class="feat">
          <li><span class="st">1</span><b>Chegada &amp; boas-vindas</b> — o espaço preparado exclusivamente para o grupo.</li>
          <li><span class="st">2</span><b>Mão na argila</b> — cada convidada cria a própria peça, com a professora ao lado.</li>
          <li><span class="st">3</span><b>Finalização</b> — o Agora esmalta, queima e devolve as peças prontas depois.</li>
          <li><span class="st">4</span><b>Celebração</b> — tempo para conversar, brindar e aproveitar o aniversário.</li>
        </ul>
      </div>
    </div>
    {foot("A experiência")}
  </section>'''

# ============================ 3 · O QUE ESTÁ INCLUSO ============================
incluso = f'''
  <section class="slide">
{head_simple("O que está incluso")}
    <span class="eyebrow orange">◆ Tudo pronto para vocês</span>
    <h2>O que está <em>incluso</em></h2>
    <div class="vibe">
      <figure>{img("netas-atelie.jpg", "Ateliê com mesas montadas para o grupo", "center 50%")}<figcaption>Ambiente montado</figcaption></figure>
      <figure>{img("ceramica-fria.jpg", "Mãos modelando a própria peça", "center 50%")}<figcaption>Mão na argila</figcaption></figure>
      <figure>{img("ceramicacool.jpg", "Peças de cerâmica finalizadas", "center 50%")}<figcaption>Peças autorais</figcaption></figure>
    </div>
    <ul class="checks">
      <li><b>Espaço exclusivo</b> para as 5 amigas</li>
      <li><b>Professora</b> conduzindo toda a experiência</li>
      <li><b>Materiais completos</b></li>
      <li><b>Queima</b> da cerâmica</li>
      <li><b>Ambientação</b> com mesas montadas</li>
      <li><b>Playlist e velas</b></li>
      <li><b>Café, chá e água</b> à vontade</li>
      <li><b>Uma peça</b> criada por cada uma</li>
    </ul>
    {foot("O que está incluso")}
  </section>'''

# ============================ 4 · INVESTIMENTO ============================
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>A experiência <em>completa</em></h2>
    <div class="phero">
      <div class="pheroph">{img("aniversario-mesa-real.jpg", "Mesa montada para a comemoração no ateliê", "center 50%")}</div>
      <div class="pval">
        <span class="pct">Experiência de cerâmica no Agora</span>
        <div class="pbig">R$ 494</div>
        <span class="pper">por pessoa</span>
        <div class="pgrp">R$ 2.470 para o grupo de 5 amigas</div>
        <p class="pnote">O valor contempla toda a experiência: espaço exclusivo, professora, materiais, queima, ambientação e a peça que cada uma leva para casa.</p>
      </div>
    </div>
    {foot("Investimento")}
  </section>'''

# ============================ 5 · OPCIONAIS ============================
opcionais = f'''
  <section class="slide">
{head_simple("Complementos")}
    <span class="eyebrow orange">◆ Opcionais</span>
    <h2>Deixe a comemoração ainda mais <em>especial</em></h2>
    <p class="lead">Complementos para montar o aniversário do jeito de vocês — é só somar à experiência.</p>
    <div class="opl">
      {opt("Tábua de boas-vindas", "Queijos, embutidos, pães artesanais, conservas e frutas.", "R$ 91", "R$ 455")}
      {opt("Finger food", "5 bites quentes e frios servidos ao longo da experiência.", "R$ 143", "R$ 715")}
      {opt("Menu completo", "Finger food + doce da casa + café.", "R$ 195", "R$ 975")}
      {opt("Welcome drink", "Espumante ou drink autoral sem álcool + água aromatizada.", "R$ 52", "R$ 260")}
      {opt("Serviço de bebidas", "Vocês levam as bebidas e o espaço cuida de taças, gelo e serviço.", "R$ 32,50", "R$ 162,50")}
    </div>
    {foot("Complementos")}
  </section>'''

# ============================ 6 · PRÓXIMOS PASSOS ============================
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Bora celebrar? 🤍</span>
    <h2>Agora é só <em>celebrar</em></h2>
    <p class="lead">Escolhendo a experiência e os opcionais, confirmamos a disponibilidade e cuidamos dos próximos detalhes para vocês.</p>
    <div class="datecall">
      <span class="di">⚡</span>
      <p>Como a comemoração é já em <b>26/09</b>, a disponibilidade da agenda está sujeita à <b>confirmação imediata</b> — quanto antes definirmos, melhor para garantir a data.</p>
    </div>
    <div class="quote" style="margin-top:22px">
      <strong style="font-family:'DM Serif Display',serif;font-weight:400;font-size:22px;color:var(--navy);display:block;margin-bottom:8px">Vamos reservar? 🤍</strong>
      Me confirma a experiência e os opcionais que a gente segura a agenda e organiza tudo para o dia.<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    <p class="fineprint">Proposta de experiência de cerâmica da Elarah para o aniversário da Fernanda — 5 amigas, 26/09, no Agora (Pinheiros). Valor da experiência: R$ 494 por pessoa · R$ 2.470 para o grupo de 5, contemplando espaço exclusivo, professora, materiais, queima, ambientação e a peça de cada participante. Opcionais por pessoa: tábua de boas-vindas R$ 91 · finger food R$ 143 · menu completo R$ 195 · welcome drink R$ 52 · serviço de bebidas R$ 32,50. Data e horário sujeitos à disponibilidade de agenda, com confirmação imediata devido à proximidade da data.</p>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n'
        + cover + experiencia + incluso + investimento + opcionais + proximos + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/aniversario-fernanda-agora.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
