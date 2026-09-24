# Proposta Elarah · Corporativo NBCUniversal (Heloisa Ramires) · 15 pessoas · 1a semana de novembro · SP
# Base: deck Team Building Itau (mesma identidade/estrutura envolvente). 7 slides: capa, proposito, experiencias(4), a vibe, mimos, investimento, contato.
# 4 experiencias: Tufting (sob confirmacao - Lado B, Av. Brig. Faria Lima 1572, 4h-5h), Ceramica R$499, Perfumaria R$289, Gastronomia interativa R$599.
# Imagens corporativas mistas (homens e mulheres). Sem custo de fornecedor/margem. Sem claim nao comprovado (Mais Voce removido).
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

# ---- paleta laranja Elarah (igual Itau/Ginger) ----
reps = {
    "--orange:#B08D4C;": "--orange:#F27623;",
    "--orange-dark:#8A6D34;": "--orange-dark:#D4600E;",
    "--navy:#12362B;": "--navy:#16233C;",
    "--navy-soft:#3A5A4E;": "--navy-soft:#3B4E6B;",
    "--blue-accent:#B08D4C;": "--blue-accent:#F27623;",
    "#EFF3EE": "#EDF1F7", "#DCE8E1": "#DCE5F1", "#CBB06E": "#FF9A4D",
    "rgba(176,141,76,.24)": "rgba(242,118,35,.22)",
    "rgba(176,141,76,.26)": "rgba(242,118,35,.26)",
    "rgba(176,141,76,.10)": "rgba(242,118,35,.10)",
    "rgba(18,54,43,.16)": "rgba(62,37,48,.14)",
    "rgba(10,28,22,.86)": "rgba(16,23,28,.86)",
    "rgba(10,28,22,.85)": "rgba(16,23,28,.85)",
    "rgba(10,28,22,.82)": "rgba(16,23,28,.82)",
}
for a, b in reps.items():
    head = head.replace(a, b)

xcss = '''
  .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
  .infocard{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px 20px 20px;box-shadow:0 12px 30px -22px rgba(0,0,0,.28)}
  .infocard h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy);line-height:1.08;margin:8px 0 6px}
  .infocard p{font-size:12px;color:var(--muted);line-height:1.5;margin:0}
  .num{font-family:'DM Serif Display',serif;color:var(--orange);font-size:26px;line-height:1}
  /* cards com foto no topo (proposito) */
  .pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
  .pcard{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 12px 30px -22px rgba(0,0,0,.28)}
  .pcard .pphoto{aspect-ratio:4/5;overflow:hidden;background:#eee}
  .pcard .pphoto img{width:100%;height:100%;object-fit:cover;display:block}
  .pcard .pbody{padding:14px 17px 16px}
  .pcard .pbody h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:15.5px;color:var(--navy);line-height:1.15;margin:0 0 5px;text-wrap:balance;min-height:2.3em}
  .pcard .pbody p{font-size:11px;color:var(--muted);line-height:1.45;margin:0}
  .pcard .pbody p b{color:var(--navy);font-weight:700}
  /* menu de experiências (4 cards) */
  .menu4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:16px}
  .exp{position:relative;background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.32)}
  .exp.hl{border:1.6px solid var(--orange)}
  .exp .selo{position:absolute;top:10px;left:10px;z-index:3;background:var(--orange);color:#fff;font-size:8px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;padding:5px 10px;border-radius:999px;box-shadow:0 8px 16px -6px rgba(212,96,14,.5)}
  .exp .ephoto{aspect-ratio:4/3;overflow:hidden;background:#eee}
  .exp .ephoto img{width:100%;height:100%;object-fit:cover;display:block}
  .exp .ebody{padding:13px 15px 15px;display:flex;flex-direction:column;flex:1}
  .exp .en{display:inline-block;font-size:8px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:4px}
  .exp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--navy);line-height:1.05}
  .exp p{font-size:10px;color:var(--muted);margin-top:6px;line-height:1.4;flex:1}
  .exp .from{margin-top:10px;padding-top:9px;border-top:1px solid var(--line);font-size:11px;color:var(--navy);font-weight:600}
  .exp .from b{font-family:'DM Serif Display',serif;font-weight:400;font-size:16px;color:var(--orange-dark)}
  .exp .from.sc{color:var(--muted);font-weight:600;font-family:'DM Serif Display',serif;font-size:13px}
  /* a vibe · grade de fotos */
  .bphotos{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:16px}
  .bph{aspect-ratio:1/1;border-radius:14px;overflow:hidden;position:relative;border:1px solid var(--line);box-shadow:0 14px 32px -24px rgba(0,0,0,.34)}
  .bph img{width:100%;height:100%;object-fit:cover;display:block}
  .bph figcaption{position:absolute;left:0;right:0;bottom:0;padding:20px 12px 9px;color:#fff;font-size:10.5px;font-weight:600;background:linear-gradient(to top,rgba(16,23,28,.85),transparent)}
  /* tabela de investimento */
  .itable{width:100%;border-collapse:collapse;margin-top:16px;font-family:'DM Sans'}
  .itable th,.itable td{padding:15px 14px;border-bottom:1px solid var(--line);text-align:right;vertical-align:middle}
  .itable thead th{font-size:11px;color:var(--navy);font-weight:700;border-bottom:2px solid var(--navy);text-transform:uppercase;letter-spacing:.03em}
  .itable th.l,.itable td.rl{text-align:left}
  .itable td.rl{width:44%}
  .itable td.rl b{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--navy)}
  .itable td.rl span{display:block;font-size:9.5px;color:var(--muted);margin-top:3px;line-height:1.35}
  .itable td.rl .selo{display:inline-block;margin-top:6px;background:var(--orange);color:#fff;font-size:7.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:3px 8px;border-radius:999px}
  .itable .val{font-family:'DM Serif Display',serif;font-size:22px;color:var(--navy);line-height:1;white-space:nowrap}
  .itable .tot{font-family:'DM Serif Display',serif;font-size:22px;color:var(--orange-dark);line-height:1;white-space:nowrap}
  .itable .sc{font-size:12px;color:var(--muted);font-family:'DM Serif Display',serif}
  .itable tr.hl td{background:#FBE6D8}
  .itable tbody tr:last-child td{border-bottom:none}
  .optline{display:flex;gap:22px;flex-wrap:wrap;margin-top:14px}
  .optline .o{font-size:12px;color:var(--navy-soft)}
  .optline .o b{color:var(--navy)}
  /* mimos (2 cards com foto) */
  .opts{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:14px;align-items:stretch}
  .opt{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 12px 30px -22px rgba(0,0,0,.28)}
  .opt.hl{border:1.6px solid var(--orange)}
  .opt .oph{aspect-ratio:16/10;overflow:hidden;position:relative;background:#eee;border-bottom:1px solid var(--line)}
  .opt .oph img{width:100%;height:100%;object-fit:cover;display:block}
  .opt .ob{padding:15px 20px 17px;flex:1;display:flex;flex-direction:column}
  .opt .oph .pctag{position:absolute;top:11px;right:11px;background:var(--orange);color:#fff;font-size:8.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:5px 12px;border-radius:999px;box-shadow:0 8px 16px -6px rgba(212,96,14,.5)}
  .opt .otp{align-self:flex-start;font-size:8.5px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:var(--muted);background:#EFEAE0;padding:5px 12px;border-radius:999px;margin-bottom:7px}
  .opt .otp.dark{background:var(--navy);color:#fff}
  .opt h4{font-family:'DM Serif Display',serif;font-weight:400;font-size:20px;color:var(--navy);line-height:1.06}
  .opt ul{list-style:none;margin-top:9px;display:flex;flex-direction:column;gap:6px}
  .opt ul li{position:relative;padding-left:16px;font-size:11px;color:var(--ink);line-height:1.32}
  .opt ul li::before{content:"\\2726";position:absolute;left:0;top:1px;color:var(--orange);font-size:9px}
  .opt .endpill{align-self:flex-start;margin-top:11px;background:#FBE6D8;color:var(--navy);font-size:10px;font-weight:600;padding:6px 14px;border-radius:999px}
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


def exp(n, cat, name, desc, price, src, alt, pos="center 50%", hl=False, sc=False, selo=None):
    cls = "exp hl" if hl else "exp"
    sl = f'<span class="selo">{selo}</span>' if selo else ''
    fr = (f'<span class="from sc">{price}</span>' if sc
          else f'<span class="from">A partir de <b>{price}</b> por pessoa.</span>')
    return (f'<div class="{cls}">{sl}<div class="ephoto">{img(src, alt, pos)}</div>'
            f'<div class="ebody"><span class="en">{n} · {cat}</span><h3>{name}</h3>'
            f'<p>{desc}</p>{fr}</div></div>')


def bfig(src, alt, cap, pos="center 50%"):
    return f'<figure class="bph">{img(src, alt, pos)}<figcaption>{cap}</figcaption></figure>'


PROOF = "Já realizado para times de empresas como <b>Compass</b>, <b>Natura</b> e <b>Hidratei</b>"

# ============================ 1 · CAPA ============================
cover = f'''
  <section class="slide">
{head_block("Proposta corporativa · NBCUniversal", "NBCUniversal", "· Elarah", "1ª semana de novembro")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência corporativa · NBCUniversal</span>
        <h1>O time junto, <em>de mão na massa</em></h1>
        <p class="lead">Uma experiência criativa e contemporânea para reunir o time da <strong>NBCUniversal</strong> — todo mundo na mesma mesa criando, sem dinâmica forçada. Uma seleção de quatro formatos que soltam o grupo e rendem boas conversas. 🎬</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>15 participantes</b></span>
          <span class="chip"><b>1ª semana de novembro</b></span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip">São Paulo</span>
          <span class="chip">A partir de <b>R$ 289</b></span>
        </div>
      </div>
      <div class="cover-photo">{img("capa-itau-oficina.jpg", "Time corporativo diverso criando junto numa oficina", "center 45%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Corporativo · NBCUniversal")}
  </section>'''

# ============================ 2 · POR QUE FUNCIONA ============================
proposito = f'''
  <section class="slide">
{head_simple("Por que funciona")}
    <span class="eyebrow orange">◆ O que o time leva junto</span>
    <h2>Conexão que <em>acontece sozinha</em></h2>
    <p class="lead">Sem quebra-gelo forçado. A conexão surge quando o time senta na mesma mesa para criar algo com as próprias mãos <strong>— sem hierarquia, sem quem sabe mais e quem sabe menos.</strong> 🎬</p>
    <div class="rule"></div>
    <div class="pgrid">
      <div class="pcard">
        <div class="pphoto">{img("corp-criativo.jpg", "Time diverso conversando enquanto cria junto", "center 45%")}</div>
        <div class="pbody"><h3>Conversa que não rola no escritório</h3><p>Lado a lado, o time fala de coisas que a reunião nunca puxa. <b>Áreas diferentes se misturam sozinhas.</b></p></div>
      </div>
      <div class="pcard">
        <div class="pphoto">{img("capa-homens-pintando.jpg", "Homens e mulheres criando juntos numa oficina", "center 42%")}</div>
        <div class="pbody"><h3>Todo mundo no mesmo pé</h3><p>Ninguém precisa ter experiência. <b>Liderança e time começam do zero juntos</b> — e é aí que a hierarquia cai.</p></div>
      </div>
      <div class="pcard">
        <div class="pphoto">{img("ceramica2.jpg", "As peças criadas no encontro, que ficam depois", "center 50%")}</div>
        <div class="pbody"><h3>Fica depois do dia</h3><p>O que foi criado continua depois do encontro — <b>como peça de cada um ou como memória do time.</b></p></div>
      </div>
    </div>
    <div class="bnote" style="margin-top:auto">◆ A Elarah coordena tudo: profissional que conduz, materiais, estrutura e montagem. O RH só reúne o time — e, se quiserem, reservamos um momento de fala da liderança no meio do encontro. 🌿</div>
    {foot("Por que funciona")}
  </section>'''

# ============================ 3 · AS EXPERIÊNCIAS (menu de 4) ============================
experiencias = f'''
  <section class="slide">
{head_simple("O menu")}
    <span class="eyebrow orange">◆ Escolham a experiência</span>
    <h2>Quatro experiências <em>pro time</em></h2>
    <p class="lead">Todas são feitas para quem nunca fez, funcionam bem em grupo e colocam todo mundo de mão na massa. É só escolher a que combina mais com o time. 🎬</p>
    <div class="menu4">
      {exp("01", "A mais trend", "Tufting", "Com a máquina de tufting, cada um cria o próprio tapete ou quadro em fios coloridos — uma criação têxtil moderna.", "Sob confirmação", "tufting-cereja.jpg", "Pessoa criando uma peça de tufting", "center 40%", sc=True)}
      {exp("02", "Mão na massa", "Cerâmica", "Cada um molda a própria peça à mão — do bowl ao vaso — guiado por uma ceramista, no seu ritmo.", "R$ 499", "ceramicamodelagem.jpg", "Mãos modelando uma peça de cerâmica", "center 50%")}
      {exp("03", "A mais sensorial", "Perfumaria", "Cada um explora notas olfativas e compõe a própria fragrância, do zero, para levar para casa.", "R$ 289", "perfumaria-corp.jpg", "Essências e frascos para criação de fragrância", "center 50%")}
      {exp("04", "A mais colaborativa", "Gastronomia interativa", "O time cozinha um menu de três tempos com um chef e finaliza degustando junto o que preparou.", "R$ 599", "aula-grupo.jpg", "Grupo diverso cozinhando com um chef", "center 50%", hl=True, selo="★ Sugestão Elarah")}
    </div>
    <div class="bnote" style="margin-top:auto">◆ Para um grupo de 15 pessoas, nossa sugestão é a <b>Gastronomia interativa</b>: coloca o time inteiro para colaborar em torno de um objetivo comum e termina com todos à mesa, celebrando o que criaram juntos. 🎬</div>
    {foot("O menu")}
  </section>'''

# ============================ 4 · A VIBE ============================
vibe = f'''
  <section class="slide">
{head_simple("A vibe")}
    <span class="eyebrow orange">◆ O clima do encontro</span>
    <h2>Uma experiência que <em>solta o grupo</em></h2>
    <p class="lead">Mais que uma dinâmica: uma tarde de mãos ocupadas, conversa boa e um motivo real para o time criar junto — com a estética criativa e contemporânea que combina com a NBCUniversal. 🎬</p>
    <div class="bphotos">
      {bfig("tufting6.jpg", "Time reunido com as próprias criações", "Criar junto", "center 40%")}
      {bfig("aula-grupo.jpg", "Grupo diverso cozinhando com um chef", "Colaborar", "center 50%")}
      {bfig("mimos-registro-itau.jpg", "Encontro corporativo diverso, com brinde e conversa", "Celebrar", "center 45%")}
      {bfig("mesa-montada-corp.jpg", "Mesa montada e ambientada para o encontro", "Tudo pronto", "center 50%")}
    </div>
    <div class="bnote" style="margin-top:auto">◆ <b>Tudo incluso:</b> profissional que conduz · materiais e estrutura necessários · montagem e desmontagem · e cada experiência deixa uma lembrança que continua depois do dia. 🧡</div>
    {foot("A vibe")}
  </section>'''

# ============================ 5 · OS MIMOS ============================
mimos = f'''
  <section class="slide">
{head_simple("Os mimos")}
    <span class="eyebrow orange">◆ Para deixar completo</span>
    <h2>Registro <em>&amp; lembrança</em></h2>
    <p class="lead">Além da experiência, dá para somar o registro fotográfico profissional — conteúdo pronto para a comunicação interna — e um brinde personalizado com a marca da NBCUniversal.</p>
    <div class="opts">
      <div class="opt">
        <div class="oph">{img("mimos-registro-itau.jpg", "Registro fotográfico profissional de um encontro corporativo diverso", "center 42%")}</div>
        <div class="ob">
          <span class="otp">Opcional</span>
          <h4>Registro fotográfico profissional</h4>
          <ul>
            <li>Um fotógrafo cobre o encontro inteiro</li>
            <li>Cada conversa e cada criação registradas</li>
            <li>Álbum digital pronto pro RH e pra comunicação interna</li>
          </ul>
          <span class="endpill">✓ Conteúdo pronto pra usar no LinkedIn</span>
        </div>
      </div>
      <div class="opt hl">
        <div class="oph"><span class="pctag">Sob consulta</span>{img("brinde-corp.jpg", "Brinde personalizado — kit corporativo premium", "center 50%")}</div>
        <div class="ob">
          <span class="otp dark">O brinde</span>
          <h4>Brinde personalizado</h4>
          <ul>
            <li>Um brinde para cada pessoa do time</li>
            <li>Personalizado com a marca da NBCUniversal</li>
            <li>Entregue no dia, junto da experiência</li>
          </ul>
          <span class="endpill">✓ Item e personalização definidos na confirmação</span>
        </div>
      </div>
    </div>
    <div class="bnote" style="margin-top:14px">◆ Registro fotográfico R$ 450 (valor total). Brinde e personalização sob consulta — a gente fecha o item com vocês antes do encontro. 🧡</div>
    {foot("Os mimos")}
  </section>'''

# ============================ 6 · INVESTIMENTO ============================
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Valores por pessoa e para 15</span>
    <h2>A partir de <em>R$ 289</em></h2>
    <p class="lead">Valores por pessoa, para turma privada de 15 participantes, com profissional, materiais e estrutura necessários já inclusos.</p>
    <table class="itable">
      <thead><tr>
        <th class="l">Experiência</th>
        <th>Por pessoa</th>
        <th>Total · 15 pessoas</th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="rl"><b>Tufting</b><span>criação têxtil na máquina de tufting</span></td>
          <td class="sc">Sob confirmação</td>
          <td class="sc">—</td>
        </tr>
        <tr>
          <td class="rl"><b>Cerâmica · modelagem à mão</b><span>peça autoral, com queima e acabamento</span></td>
          <td class="val">R$ 499</td>
          <td class="tot">R$ 7.485</td>
        </tr>
        <tr>
          <td class="rl"><b>Criação de fragrância</b><span>perfume autoral para levar</span></td>
          <td class="val">R$ 289</td>
          <td class="tot">R$ 4.335</td>
        </tr>
        <tr class="hl">
          <td class="rl"><b>Gastronomia interativa</b><span>menu de três tempos com chef</span><span class="selo">★ Sugestão Elarah</span></td>
          <td class="val">R$ 599</td>
          <td class="tot">R$ 8.985</td>
        </tr>
      </tbody>
    </table>
    <div class="optline">
      <span class="o">◆ Opcionais: <b>registro fotográfico profissional</b> R$ 450 (total)</span>
      <span class="o"><b>brindes / personalização</b> sob consulta</span>
    </div>
    <div class="bnote" style="margin-top:12px">◆ Valores por pessoa, para 15 participantes, na 1ª semana de novembro, com profissional, materiais e estrutura necessários inclusos. O <b>Tufting</b> acontece em espaço parceiro (Av. Brigadeiro Faria Lima, 1572), com duração de 4h a 5h conforme o tamanho da peça — formato corporativo e valor <b>sob confirmação</b>. A Elarah emite nota fiscal e ajusta as condições de pagamento com o financeiro da NBCUniversal.</div>
    {foot("Investimento")}
  </section>'''

# ============================ 7 · COMO FUNCIONA & CONTATO ============================
contato = f'''
  <section class="slide">
{head_simple("Como funciona & contato")}
    <span class="eyebrow orange">◆ Simples e sob medida</span>
    <h2>É só reunir <em>o time</em></h2>
    <p class="lead">A Elarah coordena toda a experiência — da curadoria à produção — para o time só chegar e criar:</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><span class="num">01</span><h3>Escolham a experiência</h3><p>A gente reserva a agenda para o time da NBCUniversal na 1ª semana de novembro.</p></div>
      <div class="infocard"><span class="num">02</span><h3>A gente coordena tudo</h3><p>Profissional, materiais e estrutura necessários, montados no espaço em São Paulo.</p></div>
      <div class="infocard"><span class="num">03</span><h3>O encontro deixa uma lembrança</h3><p>Cada experiência continua com o time depois do dia.</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4 style="font-family:'DM Serif Display',serif;font-weight:400;font-size:16px;color:var(--navy);margin:0 0 4px">Sob medida pro time</h4>
        <p style="font-size:11.5px;color:var(--muted);line-height:1.5;margin:0">Fala da liderança no encontro, registro fotográfico e brinde com a marca da NBCUniversal. Emitimos nota fiscal e ajustamos o pagamento com o financeiro. 🧡</p>
      </div>
    </div>
    <div class="quote">
      <strong style="font-family:'DM Serif Display',serif;font-weight:400;font-size:23px;color:var(--navy);display:block;margin-bottom:8px">Bora reunir o time? ✦</strong>
      Heloisa, me confirma a <strong>experiência</strong> que faz mais sentido para o time, que a gente organiza os próximos passos e coordena toda a produção.<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    <p class="fineprint">Proposta de experiência corporativa da Elarah para a NBCUniversal (a/c Heloisa Ramires) — turma privada de 15 pessoas, na 1ª semana de novembro, em São Paulo. Experiências à escolha, para iniciantes: Tufting, Cerâmica (modelagem à mão), Criação de fragrância ou Gastronomia interativa. Valores por pessoa: Cerâmica R$ 499 · Perfumaria R$ 289 · Gastronomia interativa R$ 599; Tufting sob confirmação (espaço parceiro na Av. Brigadeiro Faria Lima, 1572, duração de 4h a 5h conforme o tamanho da peça). Cada experiência inclui profissional, materiais e estrutura necessários. Registro fotográfico profissional R$ 450 (total); brindes e personalização sob consulta. Emissão de nota fiscal e condições de pagamento alinhadas com o financeiro da NBCUniversal. Proposta válida mediante confirmação de data, disponibilidade de agenda e definição da experiência escolhida.</p>
    {foot("Como funciona & contato")}
  </section>'''

deck = '<div class="deck">\n' + cover + proposito + experiencias + vibe + mimos + investimento + contato + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/experiencia-corporativa-nbcuniversal.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
