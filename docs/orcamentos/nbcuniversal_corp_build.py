# Proposta Elarah · Corporativo NBCUniversal (Heloisa Ramires) · 15 pessoas · 1a semana de novembro · SP
# Base direta: deck BFA (bfa_ceramica_jardim_build.py) — mesma familia visual/comercial. Paleta editorial verde/terracota/argila.
# 10 slides: capa, conceito, 4 experiencias (2x2), atmosfera (6 fotos), Sugestao Elarah (Tufting/Lado B), espaco Lado B,
#            ceramica (Perdizes), gastronomia (Spicy Gabriel), investimento, proximos passos.
# Recomendacao principal = TUFTING no Lado B (Av. Brig. Faria Lima 1572). Ceramica atelie Perdizes. Gastronomia Spicy Gabriel.
# Tufting: duracao/formato/valor SOB CONFIRMACAO (Lado B: workshops 4h-5h). Ceramica R$499, Perfumaria R$289, Gastronomia R$599.
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
        <p class="lead">Uma pausa na programação para criar, conversar e sair do automático — um encontro leve, espontâneo, feito de trocas e boas memórias juntos.</p>
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
    <div class="bfeat">
      <div class="bphoto">{img("corp-criativo.jpg", "Grupo diverso conversando enquanto cria junto", "center 45%")}</div>
      <div class="bbody">
        <span class="btag">Criar</span>
        <h3>Criar abre espaço para conversar</h3>
        <p>Com as mãos ocupadas, a conversa acontece sem esforço. Áreas diferentes se misturam sozinhas — sem roteiro e sem pressão.</p>
      </div>
    </div>
    <div class="bfeat">
      <div class="bphoto">{img("capa-homens-pintando.jpg", "Homens e mulheres criando juntos numa oficina", "center 42%")}</div>
      <div class="bbody">
        <span class="btag">No mesmo pé</span>
        <h3>Ninguém precisa ter experiência</h3>
        <p>Liderança e time começam do zero juntos — e é justamente aí que a hierarquia cai e o encontro fica espontâneo.</p>
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
      {mcard("01", "Tufting", "A mais autoral", "Com a pistola de tufting, cada participante desenvolve a própria criação em fios, cores e composição.", "Sob confirmação", "tufting12.jpg", "Pistola de tufting criando uma peça colorida", "center 50%", sc=True)}
      {mcard("02", "Cerâmica", "Modelagem à mão", "Cada participante molda a própria peça à mão, guiado por uma ceramista, no seu ritmo.", "R$ 499", "ceramicamodelagem.jpg", "Mãos modelando uma peça de cerâmica", "center 50%")}
      {mcard("03", "Perfumaria", "Criação de fragrância", "Cada participante explora diferentes notas e desenvolve a própria fragrância para levar.", "R$ 289", "perfumaria-corp.jpg", "Essências e frascos para criação de fragrância", "center 50%")}
      {mcard("04", "Gastronomia interativa", "Em torno da cozinha", "O grupo participa do preparo com um chef e termina a experiência à mesa, celebrando junto.", "R$ 599", "aula-grupo.jpg", "Grupo diverso cozinhando com um chef", "center 50%")}
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
        ("tuftingpacote8.jpg", "Participante criando uma peça de tufting", "center 45%", "Tufting"),
        ("ceramica-fria.jpg", "Mãos modelando cerâmica", "center 45%", "Cerâmica"),
        ("perfumaria-oficina.jpg", "Bancada de perfumaria com essências", "center 50%", "Perfumaria"),
        ("aula-grupo.jpg", "Grupo diverso cozinhando com um chef", "center 50%", "Gastronomia"),
        ("mimos-registro-itau.jpg", "Grupo corporativo diverso conversando e celebrando", "center 45%", "Conversa boa"),
        ("bfa-grupo1.webp", "O time reunido à mesa", "center 40%", "À mesa"),
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
    <h2 style="margin-top:12px">Nossa sugestão: <em>Tufting</em></h2>
    <p class="lead">Uma experiência criativa, visual e totalmente participativa. Cada participante aprende a técnica do tufting do zero e desenvolve a própria peça com fios, cores e a pistola de tufting — criatividade e concentração num clima leve e espontâneo.</p>
    <div class="cgrid">
      <figure class="cphoto">{img("tufting1.jpg", "Participante criando uma peça de tufting no ateliê", "center 45%")}</figure>
      <div class="cpil">
        <div class="cp"><span class="cn">01 · Introdução à técnica</span><p>A pistola de tufting e o funcionamento da atividade, do zero.</p></div>
        <div class="cp"><span class="cn">02 · Desenho &amp; cores</span><p>Cada participante escolhe o próprio desenho, as cores e a composição.</p></div>
        <div class="cp"><span class="cn">03 · Mãos à obra</span><p>A criação acontece com acompanhamento profissional o tempo todo.</p></div>
        <div class="cp"><span class="cn">04 · Finalização</span><p>Uma criação autoral do começo ao fim, feita por cada participante.</p></div>
      </div>
    </div>
    <div class="bnote" style="margin-top:16px">◆ Experiência para iniciantes, com acompanhamento profissional do começo ao fim e todos os materiais inclusos. <b>Duração e formato corporativo sob confirmação.</b></div>
    {foot("Sugestão Elarah · Tufting")}
  </section>'''

# ============================ 6 · O ESPAÇO · LADO B ============================
espaco = atmosfera(
    "O espaço · Lado B",
    "O espaço · Lado B",
    "Um ateliê criativo no <em>coração de São Paulo</em>",
    "Um espaço dedicado às artes manuais e ao Tufting, preparado para receber o grupo em uma experiência criativa e imersiva.",
    [
        ("tufting13.jpg", "Parede de fios e cones de lã do ateliê", "center 50%", "Parede de fios"),
        ("tufting15.jpg", "Pistola de tufting em uso sobre o bastidor", "center 50%", "A máquina em uso"),
        ("tufting17.jpg", "Participante observando as peças de tufting na parede", "center 45%", "No ateliê"),
        ("tufting7.jpg", "Participante criando a própria peça", "center 45%", "Mãos à obra"),
        ("tufting5.jpg", "Peça de tufting finalizada em fios coloridos", "center 45%", "Peças prontas"),
        ("tufting6.jpg", "Grupo reunido com as próprias criações", "center 40%", "O grupo no ateliê"),
    ],
    "Lado B Studio",
    "Av. Brigadeiro Faria Lima, 1572 · São Paulo · estrutura completa para a experiência",
    "O espaço · Lado B",
)

# ============================ 7 · CERÂMICA · PERDIZES ============================
ceramica = f'''
  <section class="slide">
{head_simple("Cerâmica · Perdizes")}
    <span class="eyebrow orange">Experiência · Cerâmica</span>
    <h2>Cerâmica em ateliê em <em>Perdizes</em></h2>
    <p class="lead">Uma experiência de modelagem à mão em um ateliê preparado para receber o grupo — com ceramista, materiais e toda a estrutura para cada participante desenvolver a própria peça.</p>
    <div class="gstrip">
      {gfig("netas-atelie.jpg", "Ateliê de cerâmica intimista, com luz natural", "O ateliê", "center 50%")}
      {gfig("ceramicamodelagem.jpg", "Mãos modelando uma peça de cerâmica", "Modelagem à mão", "center 50%")}
      {gfig("ceramicacool.jpg", "Peças de cerâmica finalizadas", "As peças", "center 50%")}
    </div>
    <div class="bnote" style="margin-top:16px">◆ <b>Ateliê parceiro · Perdizes, São Paulo</b> · ceramista, argila e materiais, acabamento e queima inclusos. As peças são finalizadas no ateliê e devolvidas depois de prontas.</div>
    {foot("Cerâmica · Perdizes")}
  </section>'''

# ============================ 8 · GASTRONOMIA · SPICY GABRIEL ============================
gastronomia = f'''
  <section class="slide">
{head_simple("Gastronomia · Spicy Gabriel")}
    <span class="eyebrow orange">Experiência · Gastronomia interativa</span>
    <h2>Gastronomia interativa na <em>Spicy Gabriel</em></h2>
    <p class="lead">Um encontro em torno da cozinha, com o grupo participando do preparo e terminando a experiência à mesa — conversa, sabores e celebração.</p>
    <div class="gstrip">
      {gfig("aula-grupo.jpg", "Grupo diverso cozinhando junto com um chef", "Mão na cozinha", "center 50%")}
      {gfig("pizza-brinde.jpg", "Mesa posta com pizzas e brinde de vinho", "À mesa", "center 50%")}
      {gfig("vinhotintos.jpg", "Taças e vinhos servidos para o encontro", "Para brindar", "center 45%")}
    </div>
    <div class="bnote" style="margin-top:16px">◆ <b>Spicy Gabriel · São Paulo</b> · chef, preparo participativo, serviço e experiência à mesa. Um formato mais lifestyle, feito para aproveitar o tempo junto.</div>
    {foot("Gastronomia · Spicy Gabriel")}
  </section>'''

# ============================ 9 · INVESTIMENTO ============================
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">Investimento</span>
    <h2>Valores por pessoa <em>para 15</em></h2>
    <p class="lead">Valores por pessoa para turma privada de 15 participantes, com profissional, materiais e estrutura necessários já inclusos.</p>
    <table class="itable">
      <thead><tr>
        <th class="l">Experiência</th>
        <th>Por pessoa</th>
        <th>Total · 15 pessoas</th>
      </tr></thead>
      <tbody>
        <tr class="hl">
          <td class="rl"><b>Tufting</b> · Lado B<span>criação autoral em fios e cores · ★ Sugestão Elarah</span></td>
          <td class="sc">Sob confirmação</td>
          <td class="sc">—</td>
        </tr>
        <tr>
          <td class="rl"><b>Cerâmica</b> · Perdizes<span>modelagem à mão, com queima e acabamento</span></td>
          <td class="val">R$ 499</td>
          <td class="tot">R$ 7.485</td>
        </tr>
        <tr>
          <td class="rl"><b>Perfumaria</b><span>criação de fragrância autoral para levar</span></td>
          <td class="val">R$ 289</td>
          <td class="tot">R$ 4.335</td>
        </tr>
        <tr>
          <td class="rl"><b>Gastronomia interativa</b> · Spicy Gabriel<span>preparo participativo e experiência à mesa</span></td>
          <td class="val">R$ 599</td>
          <td class="tot">R$ 8.985</td>
        </tr>
      </tbody>
    </table>
    <div class="optline">
      <span class="o">◆ Opcionais: <b>registro fotográfico profissional</b> R$ 450 (total)</span>
      <span class="o"><b>brindes / personalização</b> sob consulta</span>
    </div>
    <p class="fineprint">Valores por pessoa, para 15 participantes, na 1ª semana de novembro. O <b>Tufting</b> acontece no Lado B Studio (Av. Brigadeiro Faria Lima, 1572), com workshops de 4h a 5h conforme o tamanho da peça — formato corporativo e valor sob confirmação. A Elarah emite nota fiscal e ajusta as condições de pagamento com o financeiro da NBCUniversal.</p>
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
    <p class="fineprint">Proposta de experiência corporativa da Elarah para a NBCUniversal (a/c Heloisa Ramires) — turma privada de 15 pessoas, na 1ª semana de novembro, em São Paulo. Sugestão principal: Tufting no Lado B Studio (Av. Brigadeiro Faria Lima, 1572), workshops de 4h a 5h conforme o tamanho da peça, formato corporativo e valor sob confirmação. Demais experiências: Cerâmica em ateliê parceiro em Perdizes R$ 499 por pessoa; Perfumaria (criação de fragrância) R$ 289 por pessoa; Gastronomia interativa na Spicy Gabriel R$ 599 por pessoa. Cada experiência inclui profissional, materiais e estrutura necessários. Registro fotográfico profissional R$ 450 (total); brindes e personalização sob consulta. Emissão de nota fiscal e condições de pagamento alinhadas com o financeiro. Proposta válida mediante confirmação de data, disponibilidade de agenda e definição da experiência.</p>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n'
        + cover + conceito + experiencias + sugestao + espaco
        + ceramica + gastronomia + investimento + proximos + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/experiencia-corporativa-nbcuniversal.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
