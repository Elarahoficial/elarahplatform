# Proposta Elarah · Aniversario Adriana · MAO NA MASSA · ate 20 pessoas · 07/11 · SP
# Deck curto (6 slides), comercial e visual. Foco: 5 experiencias criativas (sem gastronomia).
# Paleta editorial (off-white/verde/terracota). Fotos reais aprovadas do banco, grupo misto.
# Nao inventar valores/disponibilidade/duracao/fornecedor/capacidade/inclusoes.
# Agora Intu: formato recebido contempla ate 16 pessoas — sinalizado com clareza (nao em rodape).
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

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
  /* 5 experiencias (3 + 2 centralizados) */
  .mmg{display:flex;flex-wrap:wrap;justify-content:center;gap:18px;margin-top:20px}
  .mm{width:calc(33.333% - 12px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 36px -26px rgba(0,0,0,.34)}
  .mm .mmph{height:196px;overflow:hidden;background:#eee}
  .mm .mmph img{width:100%;height:100%;object-fit:cover;display:block}
  .mm .mmb{padding:14px 17px 16px}
  .mm .mmn{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy);line-height:1.05}
  .mm .mmd{font-size:11.5px;color:var(--muted);line-height:1.45;margin-top:6px}
  /* etapas (foto + passos numerados) */
  .cgrid{display:grid;grid-template-columns:1fr 1fr;gap:34px;margin-top:22px;align-items:stretch}
  .cphoto{margin:0;border-radius:18px;overflow:hidden;border:1px solid var(--line);box-shadow:0 18px 42px -26px rgba(0,0,0,.42);min-height:420px}
  .cphoto img{width:100%;height:100%;object-fit:cover;display:block}
  .cpil{display:flex;flex-direction:column;justify-content:center;gap:22px}
  .cp{padding-left:20px;border-left:2px solid var(--orange)}
  .cp .cn{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--orange-dark);font-weight:700;display:block;margin-bottom:5px}
  .cp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:19px;color:var(--navy);margin:0 0 5px;line-height:1.08}
  .cp p{font-size:12.5px;color:var(--muted);line-height:1.5;margin:0}
  /* espacos (3 + 2) */
  .vg{display:flex;flex-wrap:wrap;justify-content:center;gap:16px;margin-top:18px}
  .vc{width:calc(33.333% - 11px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 14px 32px -26px rgba(0,0,0,.3);position:relative}
  .vc .vcph{height:150px;overflow:hidden;background:#eee}
  .vc .vcph img{width:100%;height:100%;object-fit:cover;display:block}
  .vc .vcb{padding:13px 16px 15px}
  .vc .vcn{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--navy);line-height:1.05}
  .vc .vcbairro{font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--orange-dark);font-weight:700;margin-top:4px}
  .vc .vcd{font-size:11px;color:var(--muted);line-height:1.45;margin-top:8px}
  .vc .vccap{display:inline-block;margin-top:9px;background:var(--navy);color:#fff;font-size:8px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:4px 10px;border-radius:999px}
  /* levamos ate voces */
  .own{background:var(--navy);border-radius:18px;padding:26px 32px;color:#fff;margin-top:8px}
  .own .ol{font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--orange);font-weight:700}
  .own h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:26px;color:#fff;margin:6px 0 0;line-height:1.08}
  .own p{font-size:13px;color:rgba(255,255,255,.85);line-height:1.55;margin:12px 0 0;max-width:66ch}
  /* proximos passos */
  .nx{list-style:none;margin:14px 0 0;display:grid;grid-template-columns:1fr 1fr;gap:10px 28px;max-width:60ch}
  .nx li{position:relative;padding-left:20px;font-size:13px;color:var(--ink);line-height:1.4}
  .nx li:before{content:"";position:absolute;left:0;top:7px;width:8px;height:8px;border-radius:50%;background:var(--orange)}
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


def mm(src, alt, name, desc, pos="center 50%"):
    return (f'<div class="mm"><div class="mmph">{img(src, alt, pos)}</div>'
            f'<div class="mmb"><div class="mmn">{name}</div><div class="mmd">{desc}</div></div></div>')


def vc(src, alt, name, bairro, desc, cap=None, pos="center 50%"):
    caph = f'<span class="vccap">{cap}</span>' if cap else ''
    return (f'<div class="vc"><div class="vcph">{img(src, alt, pos)}</div>'
            f'<div class="vcb"><div class="vcn">{name}</div><div class="vcbairro">{bairro}</div>'
            f'<div class="vcd">{desc}</div>{caph}</div></div>')


# ============================ 1 · CAPA ============================
cover = f'''
  <section class="slide">
{head_block("Aniversário · mão na massa", "Adriana", "", "São Paulo · 07 nov")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Aniversário</span>
        <h1>Um aniversário <em>feito à mão</em></h1>
        <p class="lead">Uma comemoração para sair do óbvio: criar alguma coisa juntos, conversar, brindar e ainda levar uma lembrança feita por vocês.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>07/11</b></span>
          <span class="chip"><b>Até 20</b> pessoas</span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip">São Paulo</span>
        </div>
      </div>
      <div class="cover-photo">{img("bfa-grupo2.webp", "Grupo misto de amigos criando junto à mesa", "center 45%")}</div>
    </div>
    {foot("Aniversário · Adriana")}
  </section>'''

# ============================ 2 · 5 EXPERIÊNCIAS ============================
experiencias = f'''
  <section class="slide">
{head_simple("Mão na massa")}
    <span class="eyebrow orange">Cinco caminhos</span>
    <h2>Qual tem <em>mais a cara de vocês?</em></h2>
    <div class="mmg">
      {mm("pinturatacavinho.jpg", "Pintura em taças", "Pintura em taças", "Cada um cria e personaliza a própria taça.", "center 50%")}
      {mm("ceramicamodelagem.jpg", "Modelagem em cerâmica", "Cerâmica", "Argila na mão para modelar uma peça do zero.", "center 50%")}
      {mm("tufting6.jpg", "Criação em tufting", "Tufting", "Fios e texturas para uma peça autoral.", "center 45%")}
      {mm("pinturapratoceramica.jpg", "Pintura em cerâmica", "Pintura em cerâmica", "Peças prontas ganham cor e personalidade.", "center 50%")}
      {mm("vela-aromatica-real.jpg", "Velas aromáticas", "Velas aromáticas", "Cada um escolhe os aromas e cria a própria vela.", "center 50%")}
    </div>
    {foot("Cinco experiências")}
  </section>'''

# ============================ 3 · COMO É VIVER ============================
vivencia = f'''
  <section class="slide">
{head_simple("A experiência")}
    <span class="eyebrow orange">Como funciona</span>
    <h2>Criar, conversar <em>e levar pra casa</em></h2>
    <div class="cgrid">
      <figure class="cphoto">{img("ceramica-fria.jpg", "Mãos modelando uma peça de cerâmica", "center 50%")}</figure>
      <div class="cpil">
        <div class="cp"><span class="cn">01 · Chegada</span><h3>Tudo pronto para começar</h3><p>A bancada já está montada, com todos os materiais.</p></div>
        <div class="cp"><span class="cn">02 · Mão na massa</span><h3>Ninguém fica de fora</h3><p>Um profissional conduz o grupo — mesmo quem nunca fez consegue participar.</p></div>
        <div class="cp"><span class="cn">03 · Criação autoral</span><h3>Cada peça é única</h3><p>Cada pessoa desenvolve a própria criação, no seu ritmo.</p></div>
        <div class="cp"><span class="cn">04 · Pra levar</span><h3>Uma lembrança de verdade</h3><p>Sempre que o formato permitir, cada um leva a sua criação para casa.</p></div>
      </div>
    </div>
    {foot("A experiência")}
  </section>'''

# ============================ 4 · ONDE PODE ACONTECER ============================
espacos = f'''
  <section class="slide">
{head_simple("Onde pode acontecer")}
    <span class="eyebrow orange">Os espaços</span>
    <h2>Escolhemos o espaço de acordo com <em>a experiência</em></h2>
    <div class="vg">
      {vc("sowcafe.jpg", "Raüs Café", "Raüs Café", "Pinheiros", "Ambiente intimista e descontraído para propostas criativas e sensoriais.")}
      {vc("bar-do-cofre.jpg", "Sala Bar", "Sala Bar", "Pinheiros", "Mais social, para combinar atividade mão na massa + drinks.")}
      {vc("casa-aquario-lounge.jpg", "Espaço Cardeal", "Espaço Cardeal", "Pinheiros", "Reservado e flexível para montar a experiência do zero.")}
      {vc("sterna-painel.webp", "Sterna Faria Lima", "Sterna Faria Lima", "Itaim Bibi", "Próximo ao eixo pedido, para workshops e encontros criativos.")}
      {vc("netas-atelie.jpg", "Agora Intu", "Agora Intu", "Pinheiros", "Ateliê criativo, ótimo para cerâmica, pintura em cerâmica e atividades manuais.", cap="Grupos de até 16 pessoas")}
    </div>
    <div class="bnote">◆ O formato recebido do <b>Agora Intu</b> contempla grupos de <b>até 16 pessoas</b> — uma ótima possibilidade caso o número final do grupo fique dentro dessa capacidade.</div>
    {foot("Onde pode acontecer")}
  </section>'''

# ============================ 5 · LEVAMOS ATÉ VOCÊS ============================
levamos = f'''
  <section class="slide">
{head_simple("No espaço de vocês")}
    <span class="eyebrow orange">Flexível</span>
    <h2>Já têm um espaço <em>em mente?</em></h2>
    <div class="bfeat" style="margin-top:18px">
      <div class="bphoto">{img("yucafe-real.jpg", "Bancada de workshop montada em uma mesa", "center 55%")}</div>
      <div class="bbody">
        <span class="btag">Onde vocês quiserem</span>
        <h3>A Elarah leva a experiência até lá</h3>
        <p style="font-size:13px;color:var(--muted);line-height:1.6;margin-top:12px">Se preferirem comemorar em casa, no salão do prédio ou em outro espaço escolhido por vocês, montamos tudo no local.</p>
        <p style="font-size:12.5px;color:var(--navy-soft);line-height:1.55;margin-top:10px">Coordenamos <b>profissional, materiais e a estrutura necessária</b> de acordo com a atividade escolhida.</p>
      </div>
    </div>
    {foot("No espaço de vocês")}
  </section>'''

# ============================ 6 · PRÓXIMOS PASSOS ============================
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">Próximos passos</span>
    <h2>Qual delas <em>vocês fariam?</em></h2>
    <p class="lead">Conta pra gente quais <b>2 ou 3 opções</b> mais chamaram atenção. A partir daí, montamos a combinação ideal considerando:</p>
    <ul class="nx">
      <li>Disponibilidade em <b>07/11</b></li>
      <li>Número final de convidados</li>
      <li>Espaço escolhido</li>
      <li>Investimento</li>
    </ul>
    <div class="quote" style="margin-top:24px">
      <strong style="font-family:'DM Serif Display',serif;font-weight:400;font-size:23px;color:var(--navy);display:block;margin-bottom:8px">Vocês escolhem a favorita. A Elarah cuida do resto. 🧡</strong>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    <p class="fineprint">Primeira curadoria da Elarah para o aniversário da Adriana — até 20 pessoas, data provável 07/11, em São Paulo (Vila Madalena, Vila Romana, Pinheiros e arredores). As experiências e os espaços apresentados são possibilidades; valores, disponibilidade, duração, capacidade e inclusões são confirmados após a escolha das experiências finalistas. O formato recebido do Agora Intu contempla grupos de até 16 pessoas.</p>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n'
        + cover + experiencias + vivencia + espacos + levamos + proximos + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/aniversario-adriana-maonamassa.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
