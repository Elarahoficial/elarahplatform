# Proposta Elarah · Aniversario Gabriela Rossi · 24/10 · 9 mulheres · Regiao Saude (SP)
# 6 slides: Capa · Curadoria · A mesa posta · Escolha onde celebrar (3 espacos) · Escolha a experiencia (6) · Proximos passos.
# Espacos perto da Saude: Casa Pretty (Bosque da Saude) / Sow Cafe (Vila Mariana, un. Cons. Rodrigues Alves) / YUCAFE (Vila Mariana).
# Condicoes dos espacos: "sob confirmacao" (nada inventado). Experiencias com valor/pessoa informado pela cliente.
# Paleta vinho/terracota. Reaproveita .vibe, .vcard, componentes Elarah.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

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

xcss = '''
  /* experiencias · 6 cards (2x3) */
  .xpgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:18px}
  .xp{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 12px 30px -24px rgba(0,0,0,.3)}
  .xp figure{margin:0;height:132px;overflow:hidden;position:relative}
  .xp figure img{width:100%;height:100%;object-fit:cover;display:block}
  .xp .xb{padding:13px 16px 15px;display:flex;flex-direction:column;flex:1}
  .xp .xn{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange-dark);font-weight:700}
  .xp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--navy);margin:3px 0 1px;line-height:1.06}
  .xp .xt{font-size:10.5px;color:var(--orange-dark);font-weight:700;font-style:italic}
  .xp p{font-size:10.5px;color:var(--muted);line-height:1.4;margin-top:7px;flex:1}
  .xp .xpr{font-family:'DM Serif Display',serif;font-size:19px;color:var(--navy);margin-top:9px;line-height:1}
  .xp .xpr small{font-family:'DM Sans',sans-serif;font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-left:3px}
  /* CTA final */
  .cta2{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-top:22px;background:var(--navy);color:#fff;border-radius:18px;padding:24px 30px}
  .cta2 .q{font-family:'DM Serif Display',serif;font-size:23px;line-height:1.15}
  .cta2 .q em{color:var(--orange-light,#CFA07E);font-style:italic}
  .cta2 .c{font-size:12.5px;color:rgba(255,255,255,.85);line-height:1.6;text-align:right}
  .cta2 .c b{color:#fff}
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


def vcard(src, alt, price, kicker, name, addr, itens, pos="center 50%", hl=False):
    cls = "vcard hl" if hl else "vcard"
    pr = f'<div class="vpr"><b style="font-size:14px">{price}</b></div>'
    lis = "".join(f"<li>{i}</li>" for i in itens)
    return (f'<div class="{cls}"><div class="vph">{img(src, alt, pos)}{pr}</div>'
            f'<div class="vb"><span class="vt">{kicker}</span><h3>{name}</h3>'
            f'<p class="vaddr">{addr}</p><ul>{lis}</ul></div></div>')


def xp(n, src, alt, name, tagline, desc, price, pos="center 50%"):
    return (f'<div class="xp"><figure>{img(src, alt, pos)}</figure>'
            f'<div class="xb"><span class="xn">{n}</span><h3>{name}</h3>'
            f'<span class="xt">{tagline}</span><p>{desc}</p>'
            f'<div class="xpr">{price}<small>por pessoa</small></div></div></div>')


def vfig(src, alt, cap, pos="center 50%"):
    return f'<figure>{img(src, alt, pos)}<figcaption>{cap}</figcaption></figure>'


PROOF = "Experiências já realizadas para grupos como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)"

# ============================ 1 · CAPA ============================
cover = f'''
  <section class="slide">
{head_block("Proposta de experiência · Aniversário", "Gabriela", "Rossi", "24.10 · 9 convidadas")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Aniversário · 24 de outubro</span>
        <h1>Um aniversário para <em>criar, brindar e celebrar</em></h1>
        <p class="lead">Gabriela Rossi · 24.10 · 9 convidadas · Região da Saúde, SP</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>24.10</b></span>
          <span class="chip"><b>9</b> convidadas</span>
          <span class="chip">Experiência + comidas &amp; bebidas</span>
        </div>
      </div>
      <div class="cover-photo">{img("ceramica-meninas.jpg", "Amigas rindo numa experiência criativa", "center 30%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Aniversário · Gabriela Rossi")}
  </section>'''

# ============================ 2 · CURADORIA ELARAH ============================
curadoria = f'''
  <section class="slide">
{head_simple("Curadoria Elarah")}
    <span class="eyebrow orange">◆ Curadoria Elarah</span>
    <h2>Opções pensadas <em>pra vocês</em></h2>
    <p class="lead">Selecionamos as melhores opções pra celebrar perto da <b>região da Saúde</b> — pensando em um grupo de <b>9 amigas</b> e em formatos que unem <b>experiência criativa, comidas e bebidas</b>.</p>
    <div class="grid3" style="margin-top:26px">
      <div class="infocard"><div class="ico">📍</div><h3>Perto de vocês</h3><p>Espaços na região da Saúde e Vila Mariana, fáceis de chegar.</p></div>
      <div class="infocard"><div class="ico">🥂</div><h3>Feito pra 9</h3><p>Formatos pensados para um grupo de amigas celebrar junto.</p></div>
      <div class="infocard"><div class="ico">🎨</div><h3>Experiência + mesa</h3><p>Criar com as mãos, brindar e aproveitar comidas e bebidas.</p></div>
    </div>
    {foot("Curadoria Elarah")}
  </section>'''

# ============================ 3 · A MESA POSTA ============================
mesa_posta = f'''
  <section class="slide">
{head_simple("A mesa posta")}
    <span class="eyebrow orange">◆ Antes de vocês chegarem</span>
    <h2>A mesa posta, do jeito <em>Elarah</em></h2>
    <p class="lead">Não é só a experiência: a gente cuida da mesa, dos materiais e dos detalhes para deixar tudo pronto para a turma aproveitar. A Elarah chega antes, organiza cada estação e deixa o ambiente com clima de comemoração — vocês só chegam, criam e curtem.</p>
    <div class="vibe">
      {vfig("aniversario-mesa-real.jpg", "Mesa da comemoração posta com flores", "Mesa da comemoração", "center 50%")}
      {vfig("buqueflor.jpg", "Flores e detalhes de ambientação", "Ambientação &amp; detalhes", "center 50%")}
      {vfig("agora-mesa.jpg", "Mesa e materiais prontos para o grupo", "Tudo pronto pra turma", "center 50%")}
      {vfig("vinhotintos.jpg", "Taças servidas para o brinde", "Um toque de aniversário", "center 45%")}
      {vfig("perfumaria-oficina.jpg", "Estações da experiência montadas", "Estações preparadas", "center 45%")}
      {vfig("ceramicacool.jpg", "Peças autorais finalizadas", "A criação vira lembrança", "center 50%")}
    </div>
    <p class="fineprint">Ambientação, comidas, bebidas, flores, bolo e lembrancinhas podem ser personalizados conforme a opção escolhida e o orçamento.</p>
    {foot("A mesa posta")}
  </section>'''

# ============================ 4 · ESCOLHA ONDE CELEBRAR ============================
onde = f'''
  <section class="slide">
{head_simple("Onde celebrar")}
    <span class="eyebrow orange">◆ Onde celebrar</span>
    <h2>Escolha onde <em>celebrar</em></h2>
    <p class="lead">Três espaços próximos à região da Saúde, cada um com um jeito diferente de viver a experiência.</p>
    <div class="vgrid" style="grid-template-columns:repeat(3,1fr)">
      {vcard("em-casa-hero-1.jpg", "Casa Pretty — ambiente acolhedor e intimista", "Sob confirmação", "Bosque da Saúde · o mais perto", "Casa Pretty", "Acolhedor e intimista, pertinho de vocês.", ["Bosque da Saúde — o mais perto de vocês", "Ambiente intimista, ótimo para 9 pessoas", "Experiência + comidas e bebidas"], "center 50%", hl=True)}
      {vcard("sowcafe.jpg", "Sow Café — café charmoso e acolhedor", "Sob confirmação", "Vila Mariana · perto da Saúde", "Sow Café", "Av. Conselheiro Rodrigues Alves, 256 · Vila Mariana.", ["Perto da Saúde, fácil de chegar", "Café charmoso para grupos pequenos", "Experiência + comidas e bebidas"], "center 50%")}
      {vcard("capa-croche-cafe.jpg", "YUCAFÉ Earth Based — café de proposta leve", "Sob confirmação", "Vila Mariana", "YUCAFÉ Earth Based", "Café de proposta leve, para um aniversário intimista.", ["Fácil acesso a partir da Saúde", "Ambiente de café para grupo pequeno", "Experiência + comidas e bebidas"], "center 50%")}
    </div>
    <p class="fineprint">Condições de reserva e consumo <b>sob confirmação</b> para os três espaços, conforme disponibilidade em 24.10.</p>
    {foot("Onde celebrar")}
  </section>'''

# ============================ 5 · ESCOLHA A EXPERIÊNCIA ============================
experiencias = f'''
  <section class="slide">
{head_simple("A experiência")}
    <span class="eyebrow orange">◆ A experiência</span>
    <h2>Escolha a <em>experiência</em></h2>
    <p class="lead">Seis jeitos diferentes de celebrar, criar e levar uma lembrança desse dia.</p>
    <div class="xpgrid">
      {xp("01", "pintura-taca.jpg", "Pintura em taça personalizada", "Pintura em Taça", "Para criar &amp; brindar", "Cada uma personaliza sua própria taça e leva a criação como lembrança do encontro.", "R$ 229", "center 50%")}
      {xp("02", "buque.jpg", "Arranjo floral autoral", "Arranjos Florais", "Para florescer juntas", "Flores, cores e composição: cada uma cria seu próprio arranjo autoral para levar para casa.", "R$ 279", "center 45%")}
      {xp("03", "velaflor.jpg", "Vela flor e home spray", "Vela Flor &amp; Home Spray", "Para despertar os sentidos", "Uma experiência entre aromas, flores e criação, com peças feitas pelas próprias convidadas.", "R$ 269", "center 50%")}
      {xp("04", "foldingbook.jpg", "Folding book autoral", "Crie seu Folding Book", "Para guardar histórias", "Cada convidada cria um livro-objeto autoral, feito à mão e cheio de personalidade.", "R$ 249", "center 50%")}
      {xp("05", "charm-bolsa.jpg", "Berloque de bolsa personalizado", "Berloque de Bolsa", "Para levar um pouco desse dia", "Cada uma escolhe e combina charms para criar um acessório personalizado para a bolsa.", "R$ 259", "center 50%")}
      {xp("06", "perfumaria-oficina.jpg", "Criação de perfume natural", "Criando seu Perfume Natural", "Para encontrar uma fragrância só sua", "Uma jornada pelos aromas para cada convidada criar sua combinação pessoal e levar para casa.", "R$ 259", "center 45%")}
    </div>
    {foot("A experiência")}
  </section>'''

# ============================ 6 · INVESTIMENTO & PRÓXIMOS PASSOS ============================
proximos = f'''
  <section class="slide">
{head_simple("Investimento & próximos passos")}
    <span class="eyebrow orange">◆ Investimento &amp; próximos passos</span>
    <h2>É só escolher a <em>combinação</em></h2>
    <p class="lead">O investimento final é a <b>experiência escolhida</b> (valor por pessoa) somada ao <b>espaço</b> e aos <b>opcionais</b> que fizerem sentido.</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">1️⃣</div><h3>Escolham o espaço</h3><p>Casa Pretty, Sow Café ou YUCAFÉ — perto da Saúde.</p></div>
      <div class="infocard"><div class="ico">2️⃣</div><h3>Escolham a experiência</h3><p>Uma das seis opções, com valor por pessoa já definido.</p></div>
      <div class="infocard"><div class="ico">3️⃣</div><h3>A gente cota e reserva</h3><p>Fechamos espaço, comidas, bebidas e opcionais e seguramos a data.</p></div>
    </div>
    <div class="cta2">
      <div class="q">Qual combinação mais <em>combina com vocês?</em></div>
      <div class="c">Nos conta a favorita — espaço + experiência — e ajustamos os detalhes pra reservar a data.<br><b>Elarah · Experiências</b> · WhatsApp +55 (11) 91445-5930 · @elarah.oficial</div>
    </div>
    <p class="fineprint">Valores por pessoa das experiências conforme informado. Espaços com condições de reserva e consumo <b>sob confirmação</b>. Ambientação, comidas, bebidas, flores, bolo e lembrancinhas personalizáveis conforme a opção e o orçamento. Data 24.10 sujeita à disponibilidade de agenda.</p>
    {foot("Investimento & próximos passos")}
  </section>'''

deck = ('<div class="deck">\n'
        + cover + curadoria + mesa_posta + onde + experiencias + proximos
        + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/experiencia-gabriela-rossi-aniversario.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
