# Proposta Elarah · Corporativo NBCUniversal (Heloisa Ramires) · 15 pessoas · 1a semana de novembro · SP
# Base direta: deck BFA (bfa_ceramica_jardim_build.py) — mesma familia visual/comercial. Paleta editorial verde/terracota/argila.
# 9 slides: capa, conceito, atmosfera (6 fotos), 4 experiencias (2x2), Sugestao Elarah (Tufting/Lado B),
#           espacos I (Lado B Faria Lima + Entremaos Perdizes), espacos II (Spicy Gabriel + O Jardim), investimento, proximos.
# Recomendacao principal = TUFTING no Lado B (Faria Lima). Cerâmica Entremaos/Perdizes. Gastronomia Spicy Gabriel.
# Valores por pessoa: Tufting R$899, Ceramica R$499, Fragrancias R$359, Gastronomia R$899. Brindes a partir de R$139/pessoa.
# Bairros confirmados: Lado B/Sterna = Faria Lima; Entremaos = Perdizes. Spicy Gabriel e O Jardim = bairro a confirmar (nao inventar).
# Nunca mostrar custo de fornecedor/margem. Fotos reais reaproveitadas do historico + material tufting (Lado B).
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

# ---- paleta editorial BFA: off-white · verde profundo · terracota · argila ----
reps = {
    "--orange:#B08D4C;": "--orange:#A9663F;",
    "--orange-dark:#8A6D34;": "--orange-dark:#8A4F30;",
    "--navy:#12362B;": "--navy:#26332A;",
    "--navy-soft:#3A5A4E;": "--navy-soft:#4A5A4E;",
    "--blue-accent:#B08D4C;": "--blue-accent:#A9663F;",
    "#EFF3EE": "#F1F3EB", "#DCE8E1": "#DEE6D6", "#CBB06E": "#C79A72",
    "rgba(176,141,76,.24)": "rgba(169,102,63,.24)",
    "rgba(176,141,76,.26)": "rgba(169,102,63,.28)",
    "rgba(176,141,76,.10)": "rgba(169,102,63,.10)",
    "rgba(18,54,43,.16)": "rgba(38,51,42,.16)",
    "rgba(10,28,22,.86)": "rgba(20,28,22,.86)",
    "rgba(10,28,22,.85)": "rgba(20,28,22,.85)",
    "rgba(10,28,22,.82)": "rgba(20,28,22,.82)",
}
for a, b in reps.items():
    head = head.replace(a, b)

xcss = '''
  /* atmosfera (base .vibe) + faixa de fotos */
  .gstrip{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:18px}
  .gstrip figure{margin:0;border-radius:16px;overflow:hidden;position:relative;height:300px;border:1px solid rgba(38,51,42,.10);box-shadow:0 16px 34px -22px rgba(0,0,0,.4)}
  .gstrip img{width:100%;height:100%;object-fit:cover;display:block}
  .gstrip figcaption{position:absolute;left:0;right:0;bottom:0;padding:24px 13px 11px;color:#fff;font-size:11.5px;font-weight:600;letter-spacing:.02em;background:linear-gradient(to top,rgba(20,28,22,.85),transparent)}
  /* conceito / etapas com foto (cgrid BFA) */
  .cgrid{display:grid;grid-template-columns:1fr 1fr;gap:36px;margin-top:22px;align-items:stretch}
  .cphoto{margin:0;border-radius:18px;overflow:hidden;border:1px solid var(--line);box-shadow:0 18px 42px -26px rgba(0,0,0,.42);min-height:380px}
  .cphoto img{width:100%;height:100%;object-fit:cover;display:block}
  .cpil{display:flex;flex-direction:column;justify-content:center;gap:18px}
  .cp{padding-left:20px;border-left:2px solid var(--orange)}
  .cp .cn{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--orange-dark);font-weight:700;display:block;margin-bottom:4px}
  .cp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy);margin:0 0 4px;line-height:1.08}
  .cp p{font-size:12px;color:var(--muted);line-height:1.5;margin:0}
  /* 4 experiencias · 2x2 cards grandes */
  .mcards{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px}
  .mc{position:relative;background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;display:flex;box-shadow:0 16px 38px -26px rgba(0,0,0,.34)}
  .mc .mph{flex:0 0 44%;overflow:hidden;background:#eee}
  .mc .mph img{width:100%;height:100%;object-fit:cover;display:block}
  .mc .mb{padding:18px 22px 20px;display:flex;flex-direction:column;flex:1;justify-content:center}
  .mc .mn{font-size:9px;letter-spacing:.15em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .mc h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:23px;color:var(--navy);line-height:1.03;margin:3px 0 0}
  .mc .md{font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--orange);font-weight:700;margin-top:5px}
  .mc p{font-size:11.5px;color:var(--muted);line-height:1.5;margin-top:9px;flex:1}
  .mc .mpr{margin-top:11px;padding-top:10px;border-top:1px solid var(--line);font-size:11.5px;color:var(--navy);font-weight:600}
  .mc .mpr b{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--orange-dark)}
  .mc .mpr.sc{color:var(--muted);font-family:'DM Serif Display',serif;font-size:14px;font-weight:400}
  /* selo sugestao */
  .selo{display:inline-block;background:var(--orange-dark);color:#fff;font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:6px 14px;border-radius:999px}
  /* tabela de investimento */
  .itable{width:100%;border-collapse:collapse;margin-top:16px;font-family:'DM Sans'}
  .itable th,.itable td{padding:15px 16px;border-bottom:1px solid var(--line);text-align:right;vertical-align:middle}
  .itable th.l,.itable td.rl{text-align:left}
  .itable td.rl{width:46%}
  .itable thead th{font-size:11px;color:var(--navy);font-weight:700;border-bottom:2px solid var(--navy);text-transform:uppercase;letter-spacing:.03em}
  .itable td.rl b{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy)}
  .itable td.rl span{display:block;font-size:9.5px;color:var(--muted);margin-top:3px;line-height:1.35}
  .itable td.rl .selo{margin-top:7px;font-size:7.5px;padding:3px 9px}
  .itable .val{font-family:'DM Serif Display',serif;font-size:23px;color:var(--navy);line-height:1;white-space:nowrap}
  .itable .tot{font-family:'DM Serif Display',serif;font-size:23px;color:var(--orange-dark);line-height:1;white-space:nowrap}
  .itable .sc{font-size:13px;color:var(--muted);font-family:'DM Serif Display',serif}
  .itable tbody tr:last-child td{border-bottom:none}
  .itable tr.hl td{background:rgba(169,102,63,.09)}
  .optline{display:flex;gap:24px;flex-wrap:wrap;margin-top:15px}
  .optline .o{font-size:12px;color:var(--navy-soft)}
  .optline .o b{color:var(--navy)}
  /* steps proximos */
  .steps3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:14px}
  .stp{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px 20px 22px;box-shadow:0 12px 30px -22px rgba(0,0,0,.28)}
  .stp .num{font-family:'DM Serif Display',serif;color:var(--orange);font-size:26px;line-height:1}
  .stp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--navy);line-height:1.1;margin:8px 0 5px}
  .stp p{font-size:12px;color:var(--muted);line-height:1.5;margin:0}
  /* dois espacos lado a lado (60/40 ou 50/50) */
  .duo{display:grid;gap:26px;margin-top:16px;align-items:start}
  .duo.b60{grid-template-columns:1.5fr 1fr}
  .duo.b50{grid-template-columns:1fr 1fr}
  .sp{display:flex;flex-direction:column}
  .sp .sphead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;border-bottom:1px solid var(--line);padding-bottom:9px;margin-bottom:12px}
  .sp .spn{font-family:'DM Serif Display',serif;font-weight:400;font-size:21px;color:var(--navy);line-height:1.04}
  .sp .spn small{display:block;font-family:'DM Sans';font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange-dark);font-weight:700;margin-top:5px}
  .sp .spsel{flex:none;font-size:7.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#fff;background:var(--orange-dark);padding:5px 10px;border-radius:999px;line-height:1.3;text-align:center;max-width:120px}
  .spgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
  .spgrid figure{margin:0;border-radius:12px;overflow:hidden;height:168px;border:1px solid rgba(38,51,42,.10);box-shadow:0 12px 26px -20px rgba(0,0,0,.34)}
  .duo.b50 .spgrid figure{height:180px}
  .spgrid img{width:100%;height:100%;object-fit:cover;display:block}
  .sp p{font-size:11.5px;color:var(--muted);line-height:1.5;margin:12px 0 0}
  /* adicionais (investimento) */
  .addhead{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--navy);margin-top:18px}
  .adds{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:10px}
  .add{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:15px 17px}
  .add .an{font-size:9px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .add h4{font-family:'DM Serif Display',serif;font-weight:400;font-size:16px;color:var(--navy);margin:4px 0 4px;line-height:1.08}
  .add span{font-size:11px;color:var(--muted);line-height:1.4}
  /* conceito estilo Itau: 3 cards foto em cima + texto */
  .pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:20px}
  .pcard{background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 38px -26px rgba(0,0,0,.34)}
  .pcard .pphoto{aspect-ratio:4/5;overflow:hidden;background:#eee}
  .pcard .pphoto img{width:100%;height:100%;object-fit:cover;display:block}
  .pcard .pbody{padding:18px 20px 20px}
  .pcard .pbody h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy);line-height:1.14;margin:0 0 7px;text-wrap:balance;min-height:2.3em}
  .pcard .pbody p{font-size:12px;color:var(--muted);line-height:1.5;margin:0}
  .pcard .pbody p b{color:var(--navy);font-weight:700}
</style>'''
head = head.replace("</style>", xcss, 1)


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


def atmosfera(kicker, eyebrow, title_html, lead_html, photos, boxlabel, boxbody, footr):
    figs = "\n      ".join(
        f'<figure>{img(src, alt, pos)}<figcaption>{cap}</figcaption></figure>'
        for src, alt, pos, cap in photos)
    return f'''
  <section class="slide">
{head_simple(kicker)}
    <span class="eyebrow orange">{eyebrow}</span>
    <h2>{title_html}</h2>
    <p class="lead">{lead_html}</p>
    <div class="vibe">
      {figs}
    </div>
    <div class="bnote" style="margin-top:16px"><b>{boxlabel}:</b> {boxbody}</div>
    {foot(footr)}
  </section>'''


def mcard(n, name, descr, desc, price, src, alt, pos="center 50%", sc=False):
    pr = (f'<div class="mpr sc">{price}</div>' if sc
          else f'<div class="mpr">A partir de <b>{price}</b> por pessoa</div>')
    return (f'<div class="mc"><div class="mph">{img(src, alt, pos)}</div>'
            f'<div class="mb"><span class="mn">{n}</span><h3>{name}</h3>'
            f'<span class="md">{descr}</span><p>{desc}</p>{pr}</div></div>')


def gfig(src, alt, cap, pos="center 50%"):
    return f'<figure>{img(src, alt, pos)}<figcaption>{cap}</figcaption></figure>'


PROOF = "Já realizado para times de empresas como <b>Compass</b>, <b>Natura</b> e <b>Hidratei</b>"

# ============================ 1 · CAPA ============================
cover = f'''
  <section class="slide">
{head_block("Experiência corporativa privada", "NBCUniversal", "", "São Paulo · Novembro")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência corporativa privada</span>
        <h1>O time junto, <em>em outro ritmo</em></h1>
        <p class="lead">Uma pausa na programação para criar, conversar e <b>sair do automático</b> — um encontro leve, espontâneo, feito de trocas e <b>boas memórias juntos</b>.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>15</b> participantes</span>
          <span class="chip"><b>1ª semana de novembro</b></span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip">São Paulo</span>
        </div>
      </div>
      <div class="cover-photo">{img("eventocorporativo.jpg", "Grupo corporativo diverso reunido em um encontro à mesa", "center 42%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Corporativo · NBCUniversal")}
  </section>'''

# ============================ 2 · CONCEITO ============================
conceito = f'''
  <section class="slide">
{head_simple("O conceito")}
    <span class="eyebrow orange">O que o time leva junto</span>
    <h2>Conexão que <em>acontece sozinha</em></h2>
    <p class="lead">Sem quebra-gelo forçado. A conexão surge quando o time senta na mesma mesa para criar algo com as próprias mãos — <b>sem hierarquia, sem quem sabe mais e quem sabe menos.</b></p>
    <div class="pgrid">
      <div class="pcard">
        <div class="pphoto">{img("capa-itau-oficina.jpg", "Time conversando enquanto cria, de mão na massa", "center 42%")}</div>
        <div class="pbody"><h3>Conversa que não rola no escritório</h3><p>Algumas horas lado a lado fazem o time falar de coisas que a reunião nunca puxa. <b>Áreas diferentes se misturam sozinhas.</b></p></div>
      </div>
      <div class="pcard">
        <div class="pphoto">{img("corp-criativo.jpg", "Time inteiro de mão na massa, criando junto", "center 45%")}</div>
        <div class="pbody"><h3>Todo mundo no mesmo pé</h3><p>Ninguém precisa ter experiência. <b>Liderança e time começam do zero juntos</b> — e é justamente aí que a hierarquia cai.</p></div>
      </div>
      <div class="pcard">
        <div class="pphoto">{img("ceramica2.jpg", "As peças criadas no encontro, que ficam depois", "center 50%")}</div>
        <div class="pbody"><h3>Fica depois do dia</h3><p>O que foi criado continua depois do encontro — <b>seja como peça individual ou como memória coletiva</b> do time.</p></div>
      </div>
    </div>
    {foot("O conceito")}
  </section>'''

# ============================ 3 · QUATRO EXPERIÊNCIAS ============================
experiencias = f'''
  <section class="slide">
{head_simple("As experiências")}
    <span class="eyebrow orange">O menu</span>
    <h2>Quatro experiências <em>para conectar</em></h2>
    <p class="lead">Pensadas para quem nunca fez, funcionam bem em grupo e convidam todo mundo a participar — cada uma à sua maneira.</p>
    <div class="mcards">
      {mcard("01", "Tufting", "A mais autoral", "Com a pistola de tufting, cada participante desenvolve a própria criação em fios, cores e composição.", "R$ 899", "tufting12.jpg", "Pistola de tufting criando uma peça colorida", "center 50%")}
      {mcard("02", "Cerâmica", "Modelagem à mão", "Cada participante molda a própria peça à mão, guiado por uma ceramista, no seu ritmo.", "R$ 499", "ceramicamodelagem.jpg", "Mãos modelando uma peça de cerâmica", "center 50%")}
      {mcard("03", "Criação de fragrâncias", "Aromas", "Cada participante explora diferentes notas e desenvolve a própria fragrância para levar.", "R$ 359", "perfumaria-corp.jpg", "Essências e frascos para criação de fragrância", "center 50%")}
      {mcard("04", "Gastronomia", "Harmonização", "O grupo participa do preparo com um chef e termina em torno da mesa, com harmonização e celebração.", "R$ 899", "aula-grupo.jpg", "Grupo diverso cozinhando com um chef", "center 50%")}
    </div>
    <div class="bnote" style="margin-top:16px">◆ Nossa recomendação principal para a NBCUniversal é o <b>Tufting</b> — a mais autoral e visual das quatro, com cada participante criando a própria peça do começo ao fim. 🎨</div>
    {foot("As experiências")}
  </section>'''

# ============================ 4 · ATMOSFERA ============================
atmosfera_slide = atmosfera(
    "A atmosfera",
    "A atmosfera",
    "Experiências que mudam o <em>ritmo do dia</em>",
    "Uma pausa para sair do automático, criar, conversar e viver algo diferente da rotina.",
    [
        ("tuftingpacote8.jpg", "Participante criando uma peça de tufting", "center 45%", "Criar junto"),
        ("ceramica-fria.jpg", "Mãos modelando cerâmica", "center 45%", "Mãos ocupadas"),
        ("perfumaria-oficina.jpg", "Bancada de perfumaria com essências", "center 50%", "Um outro ritmo"),
        ("bfa-grupo1.webp", "O time reunido à mesa", "center 40%", "Mesa compartilhada"),
        ("mimos-registro-itau.jpg", "Grupo corporativo diverso conversando e celebrando", "center 45%", "Conversa boa"),
        ("aula-grupo.jpg", "Grupo diverso cozinhando com um chef", "center 50%", "Tempo juntos"),
    ],
    "Tudo incluso",
    "profissional que conduz · materiais e estrutura · montagem e desmontagem · produção Elarah",
    "A atmosfera",
)

# ============================ 5 · SUGESTÃO ELARAH · TUFTING NO LADO B ============================
sugestao = f'''
  <section class="slide">
{head_simple("Sugestão Elarah")}
    <span class="selo">★ Sugestão Elarah</span>
    <h2 style="margin-top:12px">Tufting no <em>Lado B</em></h2>
    <p class="lead">Uma experiência criativa, visual e completamente mão na massa. No Lado B Studio, o time aprende a técnica do tufting do zero e desenvolve a própria peça usando fios, cores e a pistola de tufting — criatividade, concentração e troca de um jeito leve e espontâneo.</p>
    <div class="cgrid">
      <figure class="cphoto">{img("tufting1.jpg", "Participante criando uma peça de tufting no ateliê", "center 45%")}</figure>
      <div class="cpil">
        <div class="cp"><span class="cn">01 · Introdução à técnica</span><p>A pistola de tufting e o funcionamento da atividade, do zero.</p></div>
        <div class="cp"><span class="cn">02 · Desenho &amp; cores</span><p>Cada participante escolhe o próprio desenho, as cores e a composição.</p></div>
        <div class="cp"><span class="cn">03 · Mãos à obra</span><p>A criação acontece com acompanhamento profissional o tempo todo.</p></div>
        <div class="cp"><span class="cn">04 · Finalização</span><p>Uma criação autoral do começo ao fim, feita por cada participante.</p></div>
      </div>
    </div>
    <div class="bnote" style="margin-top:16px">◆ <b>Lado B Studio</b> · estúdio especializado em artes manuais e Tufting · Av. Brigadeiro Faria Lima, 1572. Experiência para iniciantes, com acompanhamento profissional e materiais inclusos. <b>A partir de R$ 899 por pessoa · formato corporativo sob confirmação.</b></div>
    {foot("Sugestão Elarah · Tufting")}
  </section>'''

# ---- helper: bloco de um espaço (nome · bairro + selo opcional + 3 fotos + texto) ----
def spblock(name, bairro, photos, body, selo=None):
    figs = "\n        ".join(
        f'<figure>{img(src, alt, pos)}</figure>' for src, alt, pos in photos)
    sel = f'<span class="spsel">{selo}</span>' if selo else ''
    return f'''<div class="sp">
      <div class="sphead">
        <div class="spn">{name}<small>{bairro}</small></div>
        {sel}
      </div>
      <div class="spgrid">
        {figs}
      </div>
      <p>{body}</p>
    </div>'''


# ============================ 6 · ESPAÇOS I · LADO B + ENTREMÃOS ============================
lado_b = spblock(
    "Lado B Studio", "Faria Lima · São Paulo",
    [
        ("tufting6.jpg", "Grupo reunido com as próprias criações de tufting", "center 40%"),
        ("tufting1.jpg", "Participante criando a própria peça de tufting", "center 45%"),
        ("tufting17.jpg", "Participante diante da parede de peças de tufting", "center 45%"),
    ],
    "Um ateliê criativo no coração de São Paulo, dedicado às artes manuais e ao Tufting — preparado para receber o grupo em uma experiência imersiva e mão na massa.",
    selo="★ Sugestão Elarah para Tufting",
)
entremaos = spblock(
    "Entremãos", "Perdizes · São Paulo",
    [
        ("netas-atelie.jpg", "Ateliê de cerâmica intimista, com luz natural", "center 50%"),
        ("ceramicamodelagem.jpg", "Mãos modelando uma peça de cerâmica", "center 50%"),
        ("ceramicacool.jpg", "Peças de cerâmica finalizadas", "center 50%"),
    ],
    "Um ateliê acolhedor em Perdizes, com clima intimista e luz natural — cenário ideal para a experiência de cerâmica, no ritmo de cada participante.",
)
espacos1 = f'''
  <section class="slide">
{head_simple("Os espaços")}
    <span class="eyebrow orange">Os espaços</span>
    <h2>Onde a experiência <em>acontece</em></h2>
    <p class="lead">Cada espaço é escolhido conforme a experiência, a região e o ritmo do encontro. Para o Tufting, nossa sugestão é o Lado B Studio.</p>
    <div class="duo b60">
      {lado_b}
      {entremaos}
    </div>
    <div class="bnote" style="margin-top:16px">◆ Espaços sujeitos à consulta e disponibilidade na data escolhida.</div>
    {foot("Os espaços · I")}
  </section>'''

# ============================ 7 · ESPAÇOS II · SPICY GABRIEL + O JARDIM ============================
spicy = spblock(
    "Spicy Gabriel", "São Paulo <i>· bairro a confirmar</i>",
    [
        ("aula-grupo.jpg", "Grupo diverso cozinhando junto com um chef", "center 50%"),
        ("pizza-brinde.jpg", "Mesa posta com comida e brinde", "center 50%"),
        ("vinhotintos.jpg", "Taças e vinhos servidos para o encontro", "center 45%"),
    ],
    "Um encontro em torno da cozinha e da mesa — preparo participativo com chef, sabores e celebração. Um formato mais gastronômico, feito para aproveitar o tempo junto.",
)
jardim = spblock(
    "O Jardim", "São Paulo <i>· bairro a confirmar</i>",
    [
        ("ojardim1.jpg", "Jardim arborizado com deck e verde ao redor", "center 50%"),
        ("natura-mesa.jpg", "Grupo reunido à mesa em meio ao verde", "center 50%"),
        ("ojardim4.jpg", "Espaço ao ar livre cercado de verde e luz natural", "center 50%"),
    ],
    "Um café-ateliê cercado de verde e luz natural, com mesa compartilhada ao ar livre — um cenário mais leve e espontâneo para o encontro.",
)
espacos2 = f'''
  <section class="slide">
{head_simple("Os espaços")}
    <span class="eyebrow orange">A curadoria de espaços</span>
    <h2>O cenário também faz parte da <em>experiência</em></h2>
    <p class="lead">De ateliês criativos a jardins, cafés e espaços gastronômicos, selecionamos o cenário de acordo com a experiência, a região e o ritmo que o encontro pede.</p>
    <div class="duo b50">
      {spicy}
      {jardim}
    </div>
    <div class="optline" style="margin-top:14px">
      <span class="o">◆ Outras possibilidades: <b>Sterna Café · Faria Lima</b> &nbsp;·&nbsp; <b>Ateliê parceiro · Perdizes</b></span>
    </div>
    <p class="fineprint" style="margin-top:10px">Espaços sujeitos à consulta, disponibilidade e condições específicas de reserva ou consumo.</p>
    {foot("Os espaços · II")}
  </section>'''

# ============================ 9 · INVESTIMENTO ============================
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">Investimento</span>
    <h2>Escolha a experiência que <em>combina com o time</em></h2>
    <p class="lead">Quatro formatos, diferentes maneiras de criar, compartilhar e sair da rotina. Valores por pessoa para turma privada de 15 participantes, com profissional, materiais e estrutura já inclusos.</p>
    <table class="itable">
      <thead><tr>
        <th class="l">Experiência</th>
        <th>Por pessoa</th>
        <th>Total · 15 pessoas</th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="rl"><b>Criação de fragrâncias</b><span>fragrância autoral para levar</span></td>
          <td class="val">R$ 359</td>
          <td class="tot">R$ 5.385</td>
        </tr>
        <tr>
          <td class="rl"><b>Cerâmica</b><span>modelagem à mão, com queima e acabamento</span></td>
          <td class="val">R$ 499</td>
          <td class="tot">R$ 7.485</td>
        </tr>
        <tr class="hl">
          <td class="rl"><b>Tufting</b><span>criação autoral em fios e cores · ★ Sugestão Elarah</span></td>
          <td class="val">R$ 899</td>
          <td class="tot">R$ 13.485</td>
        </tr>
        <tr>
          <td class="rl"><b>Gastronomia</b> · harmonização<span>preparo participativo e experiência à mesa</span></td>
          <td class="val">R$ 899</td>
          <td class="tot">R$ 13.485</td>
        </tr>
      </tbody>
    </table>
    <div class="addhead">Para deixar a experiência ainda mais completa</div>
    <div class="adds">
      <div class="add"><span class="an">Registro fotográfico</span><h4>Fotos do encontro</h4><span>Valor sob consulta</span></div>
      <div class="add"><span class="an">Brindes &amp; personalização</span><h4>Lembrança do dia</h4><span>A partir de R$ 139 por pessoa</span></div>
      <div class="add"><span class="an">Espaços</span><h4>Cenário da experiência</h4><span>Sob consulta e disponibilidade</span></div>
    </div>
    <p class="fineprint">Os espaços apresentados estão sujeitos à disponibilidade na data escolhida. Eventuais condições de reserva, locação ou consumo são confirmadas de acordo com o local e o formato da experiência. Valores por pessoa, para 15 participantes, na 1ª semana de novembro. A Elarah emite nota fiscal e ajusta as condições de pagamento com o financeiro da NBCUniversal.</p>
    {foot("Investimento")}
  </section>'''

# ============================ 10 · PRÓXIMOS PASSOS ============================
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">Próximos passos</span>
    <h2>É só reunir <em>o time</em></h2>
    <p class="lead">A Elarah coordena toda a experiência — da curadoria à produção — para o time só chegar e aproveitar.</p>
    <div class="steps3">
      <div class="stp"><span class="num">01</span><h3>Escolhem a experiência</h3><p>Definimos junto a experiência que mais combina com o time da NBCUniversal.</p></div>
      <div class="stp"><span class="num">02</span><h3>Confirmamos data e espaço</h3><p>Reservamos a agenda e o espaço parceiro para a 1ª semana de novembro.</p></div>
      <div class="stp"><span class="num">03</span><h3>Coordenamos a produção</h3><p>Cada formato é preparado com profissional, materiais e estrutura necessários.</p></div>
    </div>
    <div class="quote" style="margin-top:22px">
      <strong style="font-family:'DM Serif Display',serif;font-weight:400;font-size:22px;color:var(--navy);display:block;margin-bottom:8px">Vamos seguir? ✦</strong>
      Heloisa, nos conta qual experiência faz mais sentido para o time e seguimos com a confirmação de disponibilidade e os próximos passos.<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    <p class="fineprint">Proposta de experiência corporativa da Elarah para a NBCUniversal (a/c Heloisa Ramires) — turma privada de 15 pessoas, na 1ª semana de novembro, em São Paulo. Sugestão principal: Tufting no Lado B Studio (Faria Lima), R$ 899 por pessoa. Demais experiências: Cerâmica R$ 499 por pessoa; Criação de fragrâncias R$ 359 por pessoa; Gastronomia interativa (harmonização) R$ 899 por pessoa. Cada experiência inclui profissional, materiais e estrutura necessários. Adicionais: registro fotográfico sob consulta; brindes e personalização a partir de R$ 139 por pessoa; espaços sob consulta e disponibilidade. Emissão de nota fiscal e condições de pagamento alinhadas com o financeiro. Proposta válida mediante confirmação de data, disponibilidade de agenda e definição da experiência.</p>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n'
        + cover + conceito + atmosfera_slide + experiencias + sugestao
        + espacos1 + espacos2 + investimento + proximos + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/experiencia-corporativa-nbcuniversal.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
