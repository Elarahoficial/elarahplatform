# Proposta Elarah · Aniversario Adriana · ate 20 pessoas · 07/11 · SP (Vila Madalena/Vila Romana/Pinheiros)
# Deck de curadoria (NAO catalogo): 10 slides. Linguagem leve, contemporanea, grupo misto (nao feminino demais).
# Paleta editorial BFA (off-white/verde/terracota/argila) — menos laranja. Fotos reais reaproveitadas do banco.
# Nao inventar valores/disponibilidade/fornecedores/duracao/capacidade/inclusoes. Enderecos vieram do briefing.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

# ---- paleta editorial: off-white · verde profundo · terracota · argila ----
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
  /* 4 universos (conceito) */
  .uni{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:22px}
  .un{position:relative;border-radius:16px;overflow:hidden;border:1px solid var(--line);box-shadow:0 16px 34px -24px rgba(0,0,0,.4);aspect-ratio:3/4}
  .un img{width:100%;height:100%;object-fit:cover;display:block}
  .un .uc{position:absolute;left:0;right:0;bottom:0;padding:34px 14px 14px;color:#fff;background:linear-gradient(to top,rgba(20,28,22,.9),transparent)}
  .un .uc b{font-family:'DM Serif Display',serif;font-weight:400;font-size:19px;letter-spacing:.02em;display:block;line-height:1}
  .un .uc span{font-size:10px;color:rgba(255,255,255,.9);line-height:1.35;display:block;margin-top:5px}
  /* faixa de 3 fotos */
  .gstrip{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:18px}
  .gstrip figure{margin:0;border-radius:16px;overflow:hidden;position:relative;height:330px;border:1px solid var(--line);box-shadow:0 16px 34px -22px rgba(0,0,0,.4)}
  .gstrip img{width:100%;height:100%;object-fit:cover;display:block}
  .gstrip figcaption{position:absolute;left:0;right:0;bottom:0;padding:26px 14px 12px;color:#fff;font-size:12.5px;font-weight:600;letter-spacing:.02em;background:linear-gradient(to top,rgba(20,28,22,.86),transparent)}
  /* lista curta ao lado da foto (aromas/drinks) */
  .sidelist{list-style:none;margin:16px 0 0;display:flex;flex-direction:column;gap:13px}
  .sidelist li{position:relative;padding-left:22px;font-size:13.5px;color:var(--ink);line-height:1.4}
  .sidelist li b{font-family:'DM Serif Display',serif;font-weight:400;font-size:15px;color:var(--navy)}
  .sidelist li:before{content:"";position:absolute;left:0;top:7px;width:8px;height:8px;border-radius:50%;background:var(--orange)}
  /* espacos parceiros (venues) */
  .vgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}
  .vn{display:grid;grid-template-columns:38% 1fr;background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:0 14px 32px -26px rgba(0,0,0,.32)}
  .vn .vph{overflow:hidden;background:#eee;position:relative;min-height:172px}
  .vn .vph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .vn .vb{padding:13px 15px 14px}
  .vn .vnm{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--navy);line-height:1.05}
  .vn .vad{font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--orange-dark);font-weight:700;margin-top:4px}
  .vn .vp{font-size:10.5px;color:var(--muted);line-height:1.4;margin-top:8px}
  .vn .vp b{color:var(--navy);font-weight:600}
  .vn .vdif{display:inline-block;margin-top:8px;background:rgba(169,102,63,.12);color:var(--orange-dark);font-size:8px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:3px 9px;border-radius:999px}
  .own{display:grid;grid-template-columns:1fr;gap:6px;margin-top:16px;background:var(--navy);border-radius:16px;padding:20px 26px;color:#fff}
  .own .ol{font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--orange);font-weight:700}
  .own h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:22px;color:#fff;margin:4px 0 0;line-height:1.1}
  .own p{font-size:12px;color:rgba(255,255,255,.82);line-height:1.5;margin:6px 0 0;max-width:70ch}
  /* combinacoes (2x2) */
  .cmb{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}
  .cm{position:relative;border-radius:16px;overflow:hidden;border:1px solid var(--line);box-shadow:0 16px 34px -24px rgba(0,0,0,.38);min-height:210px;display:flex;align-items:flex-end}
  .cm img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .cm .cmc{position:relative;padding:26px 20px 18px;color:#fff;width:100%;background:linear-gradient(to top,rgba(20,28,22,.9),rgba(20,28,22,.15) 70%,transparent)}
  .cm .cmc b{font-family:'DM Serif Display',serif;font-weight:400;font-size:21px;display:block;line-height:1.05}
  .cm .cmc span{font-size:11px;color:rgba(255,255,255,.9);display:block;margin-top:4px}
  /* chips de personalizacao */
  .pgrid{display:grid;grid-template-columns:1.1fr .9fr;gap:30px;margin-top:18px;align-items:center}
  .pphoto{border-radius:18px;overflow:hidden;border:1px solid var(--line);box-shadow:0 18px 42px -26px rgba(0,0,0,.42);min-height:360px}
  .pphoto img{width:100%;height:100%;object-fit:cover;display:block}
  .ptags{display:flex;flex-wrap:wrap;gap:9px}
  .ptags span{background:var(--card);border:1px solid var(--line);border-radius:999px;padding:9px 16px;font-size:12.5px;color:var(--navy);font-weight:600}
  /* proximos passos */
  .steps3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
  .stp{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px 20px 20px;box-shadow:0 12px 30px -22px rgba(0,0,0,.28)}
  .stp .num{font-family:'DM Serif Display',serif;color:var(--orange);font-size:24px;line-height:1}
  .stp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:16px;color:var(--navy);line-height:1.1;margin:7px 0 5px}
  .stp p{font-size:11.5px;color:var(--muted);line-height:1.5;margin:0}
</style>'''
head = head.replace("</style>", xcss, 1)


def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'


# mapa de placeholders -> arquivos reais aprovados do banco (preenchido apos curadoria de fotos)
ALIAS = {}


def img(src, alt, pos="center 50%"):
    src = ALIAS.get(src, src)
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


def vibe(photos):
    figs = "\n      ".join(
        f'<figure>{img(src, alt, pos)}<figcaption>{cap}</figcaption></figure>'
        for src, alt, pos, cap in photos)
    return f'<div class="vibe">\n      {figs}\n    </div>'


# ============================ 1 · CAPA ============================
cover = f'''
  <section class="slide">
{head_block("Aniversário · celebração", "Adriana", "", "São Paulo · 07 nov")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Aniversário</span>
        <h1>Seu aniversário, <em>do seu jeito</em></h1>
        <p class="lead">Uma seleção para reunir, criar, brindar e comemorar.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>07 de novembro</b></span>
          <span class="chip"><b>Até 20</b> pessoas</span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip">São Paulo</span>
        </div>
      </div>
      <div class="cover-photo">{img("COVER.jpg", "Grupo de amigos comemorando juntos", "center 45%")}</div>
    </div>
    {foot("Aniversário · Adriana")}
  </section>'''

# ============================ 2 · CONCEITO ============================
conceito = f'''
  <section class="slide">
{head_simple("O conceito")}
    <span class="eyebrow orange">Quatro caminhos</span>
    <h2>Para comemorar <em>fazendo algo diferente</em></h2>
    <p class="lead">Pensamos em diferentes caminhos para reunir o grupo e transformar o aniversário em um programa gostoso de viver junto — dos mais criativos aos sensoriais, gastronômicos e descontraídos.</p>
    <div class="uni">
      <div class="un">{img("UNI_CRIAR.jpg", "Pessoas criando com as mãos", "center 45%")}<div class="uc"><b>Criar</b><span>experiências criativas e mão na massa</span></div></div>
      <div class="un">{img("UNI_SENTIR.jpg", "Criação de perfume e aromas", "center 45%")}<div class="uc"><b>Sentir</b><span>aromas, perfumaria e propostas sensoriais</span></div></div>
      <div class="un">{img("UNI_PROVAR.jpg", "Gastronomia e sabores", "center 45%")}<div class="uc"><b>Provar</b><span>gastronomia e sabores</span></div></div>
      <div class="un">{img("UNI_BRINDAR.jpg", "Vinhos e drinks para brindar", "center 45%")}<div class="uc"><b>Brindar</b><span>vinhos, drinks e formatos descontraídos</span></div></div>
    </div>
    {foot("O conceito")}
  </section>'''

# ============================ 3 · CRIATIVO ============================
criativo = f'''
  <section class="slide">
{head_simple("Criar · mão na massa")}
    <span class="eyebrow orange">Criar</span>
    <h2>Para colocar <em>a mão na massa</em></h2>
    <p class="lead">Algumas possibilidades que funcionam bem em grupo — cada um cria a própria peça, no seu ritmo.</p>
    {vibe([
        ("CR_ceramica.jpg", "Modelagem em cerâmica à mão", "center 50%", "Cerâmica"),
        ("CR_tacas.jpg", "Pintura em taças de vidro", "center 50%", "Pintura em taças"),
        ("CR_tufting.jpg", "Criação de peça em tufting", "center 45%", "Tufting"),
        ("CR_folding.jpg", "Folding book decorativo", "center 50%", "Folding Book"),
        ("CR_colagem.jpg", "Colagem criativa em grupo", "center 50%", "Colagem"),
        ("CR_tela.jpg", "Pintura livre em tela", "center 50%", "Pintura em tela"),
    ])}
    <div class="bnote">◆ Também: <b>pintura em cerâmica</b> — personalização de uma peça individual para levar.</div>
    {foot("Criar · mão na massa")}
  </section>'''

# ============================ 4 · AROMAS ============================
aromas = f'''
  <section class="slide">
{head_simple("Sentir · aromas")}
    <span class="eyebrow orange">Sentir</span>
    <h2>Para criar <em>através dos sentidos</em></h2>
    <div class="bfeat">
      <div class="bphoto">{img("AR_hero.jpg", "Criação de perfume e aromas", "center 45%")}</div>
      <div class="bbody">
        <span class="btag">Sensorial</span>
        <h3>Um aroma para chamar de seu</h3>
        <ul class="feat">
          <li><span class="st">✦</span><b>Criação de perfume</b></li>
          <li><span class="st">✦</span><b>Aroma para casa</b></li>
          <li><span class="st">✦</span><b>Velas aromáticas</b></li>
          <li><span class="st">✦</span><b>Workshop olfativo</b></li>
        </ul>
        <p style="font-size:12.5px;color:var(--muted);line-height:1.55;margin-top:14px">Cada pessoa explora diferentes aromas e cria algo próprio para levar para casa.</p>
      </div>
    </div>
    {foot("Sentir · aromas")}
  </section>'''

# ============================ 5 · GASTRONOMIA ============================
gastronomia = f'''
  <section class="slide">
{head_simple("Provar · gastronomia")}
    <span class="eyebrow orange">Provar</span>
    <h2>Para fazer, provar <em>e compartilhar</em></h2>
    <p class="lead">Algumas participativas, mão na massa; outras mais em torno da mesa, para confraternizar.</p>
    {vibe([
        ("GA_pizza.jpg", "Pizza artesanal", "center 50%", "Pizza artesanal"),
        ("GA_massa.jpg", "Massa fresca feita à mão", "center 50%", "Massa fresca"),
        ("GA_choco.jpg", "Chocolates artesanais", "center 50%", "Chocolates"),
        ("GA_cafe.jpg", "Café e degustação", "center 50%", "Café"),
        ("GA_aula.jpg", "Aula gastronômica em grupo", "center 50%", "Aula gastronômica"),
        ("GA_mesa.jpg", "Menu compartilhado à mesa", "center 50%", "Menu compartilhado"),
    ])}
    {foot("Provar · gastronomia")}
  </section>'''

# ============================ 6 · VINHOS & DRINKS ============================
drinks = f'''
  <section class="slide">
{head_simple("Brindar · vinhos & drinks")}
    <span class="eyebrow orange">Brindar</span>
    <h2>Para quem prefere <em>comemorar brindando</em></h2>
    <div class="gstrip">
      <figure>{img("DR_vinho.jpg", "Degustação de vinhos", "center 50%")}<figcaption>Degustação de vinhos</figcaption></figure>
      <figure>{img("DR_drinks.jpg", "Workshop de drinks", "center 50%")}<figcaption>Workshop de drinks</figcaption></figure>
      <figure>{img("DR_mesa.jpg", "Vinho e gastronomia à mesa", "center 50%")}<figcaption>Vinho + gastronomia</figcaption></figure>
    </div>
    <ul class="sidelist" style="display:grid;grid-template-columns:1fr 1fr;gap:10px 30px;margin-top:18px">
      <li><b>Degustação de vinhos</b></li>
      <li><b>Wine tasting + gastronomia</b></li>
      <li><b>Workshop de drinks</b></li>
      <li><b>Crie seu próprio drink</b></li>
      <li><b>Drinks + atividade criativa</b></li>
      <li><b>Vinho + cerâmica ou pintura</b></li>
    </ul>
    {foot("Brindar · vinhos & drinks")}
  </section>'''

# ============================ 7 · ONDE PODE ACONTECER ============================
espacos = f'''
  <section class="slide">
{head_simple("Onde pode acontecer")}
    <span class="eyebrow orange">O cenário</span>
    <h2>Escolhemos o cenário conforme <em>o clima da comemoração</em></h2>
    <p class="lead">A Elarah pode montar a experiência em espaços parceiros — ou levar tudo até o local que vocês escolherem.</p>
    <div class="vgrid">
      <div class="vn"><div class="vph">{img("VN_raus.jpg", "Raüs Café · Pinheiros")}</div><div class="vb"><div class="vnm">Raüs Café</div><div class="vad">Pinheiros · R. Simão Álvares, 351</div><p class="vp">Intimista e descontraído, ótimo para propostas criativas e sensoriais. <b>Cerâmica, aromas, pintura, colagem</b> — com café ou gastronomia.</p></div></div>
      <div class="vn"><div class="vph">{img("VN_salabar.jpg", "Sala Bar · Pinheiros")}</div><div class="vb"><div class="vnm">Sala Bar</div><div class="vad">Pinheiros · R. Fernão Dias, 767</div><p class="vp">Clima de bar e celebração. <b>Drinks, pintura em taças, atividades + bebidas</b> e confraternização.</p><span class="vdif">Não cobra espaço</span></div></div>
      <div class="vn"><div class="vph">{img("VN_cardeal.jpg", "Espaço Cardeal · Pinheiros")}</div><div class="vb"><div class="vnm">Espaço Cardeal</div><div class="vad">Pinheiros · R. Cardeal Arcoverde, 1745/1749</div><p class="vp">Mais estruturado e reservado, com liberdade para personalizar. <b>Cerâmica, aromas, gastronomia, drinks</b> e combinações.</p><span class="vdif">Locação sob consulta</span></div></div>
      <div class="vn"><div class="vph">{img("VN_sterna.jpg", "Sterna Faria Lima · Itaim Bibi")}</div><div class="vb"><div class="vnm">Sterna Faria Lima</div><div class="vad">Itaim Bibi · Av. Brig. Faria Lima, 4440</div><p class="vp">Alternativa prática e próxima ao eixo de Pinheiros, para algo mais leve. <b>Aromas, workshops mão na massa</b>, com café ou gastronomia leve.</p><span class="vdif">Não cobra espaço</span></div></div>
    </div>
    <div class="own">
      <span class="ol">Ou no espaço de vocês</span>
      <h3>Se vocês já tiverem um espaço em mente, nós vamos até vocês.</h3>
      <p>Casa, salão de festas, espaço do condomínio, escritório ou outro local escolhido por vocês — levamos a atividade, os fornecedores, os materiais e a estrutura necessária, conforme o formato da experiência.</p>
    </div>
    {foot("Onde pode acontecer")}
  </section>'''

# ============================ 8 · COMBINAÇÕES ============================
combinacoes = f'''
  <section class="slide">
{head_simple("Combinações Elarah")}
    <span class="eyebrow orange">Combinações</span>
    <h2>Algumas combinações que <em>funcionam muito bem</em></h2>
    <div class="cmb">
      <div class="cm">{img("CB_ceravinho.jpg", "Cerâmica e vinho", "center 50%")}<div class="cmc"><b>Cerâmica + vinho</b><span>Criatividade, conversa e vinho.</span></div></div>
      <div class="cm">{img("CB_aromadrinks.jpg", "Aromas e drinks", "center 50%")}<div class="cmc"><b>Aromas + drinks</b><span>Uma proposta sensorial e descontraída.</span></div></div>
      <div class="cm">{img("CB_pinturabar.jpg", "Pintura e bar", "center 50%")}<div class="cmc"><b>Pintura + bar</b><span>Atividade criativa com drinks e petiscos.</span></div></div>
      <div class="cm">{img("CB_gastrovinho.jpg", "Gastronomia e vinho", "center 50%")}<div class="cmc"><b>Gastronomia + vinho</b><span>Uma noite em torno da mesa.</span></div></div>
    </div>
    <div class="bnote">◆ São inspirações para começar a conversa — não pacotes fechados.</div>
    {foot("Combinações Elarah")}
  </section>'''

# ============================ 9 · PERSONALIZAÇÃO ============================
personalizacao = f'''
  <section class="slide">
{head_simple("Personalização")}
    <span class="eyebrow orange">Os detalhes</span>
    <h2>Podemos montar <em>os detalhes também</em></h2>
    <div class="pgrid">
      <div class="pphoto">{img("PZ_hero.jpg", "Mesa de comemoração com detalhes personalizados", "center 50%")}</div>
      <div>
        <p style="font-size:13.5px;color:var(--navy-soft);line-height:1.6;margin:0 0 16px">A partir da experiência escolhida, podemos construir também comida, bebida, ambientação e os detalhes da comemoração.</p>
        <div class="ptags">
          <span>Bolo</span><span>Doces</span><span>Finger foods</span><span>Vinho</span><span>Drinks</span>
          <span>Decoração de mesa</span><span>Flores</span><span>Menu personalizado</span>
          <span>Brindes</span><span>Lembranças</span><span>Fotógrafo</span><span>Playlist</span>
          <span>Peças personalizadas</span>
        </div>
      </div>
    </div>
    {foot("Personalização")}
  </section>'''

# ============================ 10 · PRÓXIMOS PASSOS ============================
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">Próximos passos</span>
    <h2>Qual caminho <em>mais combina com vocês?</em></h2>
    <p class="lead">A partir das opções que mais chamarem atenção, montamos a proposta final.</p>
    <div class="steps3">
      <div class="stp"><span class="num">01</span><h3>Vocês escolhem</h3><p>O tipo de experiência e o estilo da comemoração que mais combina com o grupo.</p></div>
      <div class="stp"><span class="num">02</span><h3>Definimos o cenário</h3><p>Espaço parceiro ou o local de vocês, conforme a preferência.</p></div>
      <div class="stp"><span class="num">03</span><h3>Fechamos a proposta</h3><p>Com disponibilidade para 07/11, número de convidados, local e faixa de investimento.</p></div>
    </div>
    <div class="quote" style="margin-top:22px">
      <strong style="font-family:'DM Serif Display',serif;font-weight:400;font-size:22px;color:var(--navy);display:block;margin-bottom:8px">Bora comemorar? 🧡</strong>
      Conta para a gente quais opções vocês mais gostaram e seguimos com a curadoria.<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    <p class="fineprint">Proposta inicial de curadoria da Elarah para o aniversário da Adriana — até 20 pessoas, data provável 07/11, em São Paulo (preferência por Vila Madalena, Vila Romana, Pinheiros e região). As experiências, os espaços e os detalhes apresentados são possibilidades; valores, disponibilidade, fornecedores, duração e inclusões são confirmados após a escolha da experiência e do formato. Espaços parceiros sujeitos à disponibilidade e a condições próprias de reserva, locação ou consumo.</p>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n'
        + cover + conceito + criativo + aromas + gastronomia + drinks
        + espacos + combinacoes + personalizacao + proximos + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/aniversario-adriana.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
