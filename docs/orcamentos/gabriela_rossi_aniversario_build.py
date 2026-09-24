# Proposta Elarah · Aniversario Gabriela Rossi · 24/10 · 9 mulheres · Regiao Saude (SP)
# 6 slides: Capa (emocional) · Curadoria · A mesa posta · Escolha onde celebrar (3 espacos) · Escolha a experiencia (6) · Proximos passos.
# Espacos: Casa Pretty (Bosque da Saude, sem locacao + menu da casa R$120-160/pessoa) / Sow Cafe (Vila Mariana, sob confirmacao) / YUCAFE (Vila Mariana, sem locacao).
# Experiencias: valor/pessoa + opcao "com um carinho a mais" (+ lembranca R$129/pessoa). Nada inventado; sem vinho pressuposto.
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
  /* capa · chips maiores e celebrativos */
  .chips .chip{font-size:13px;padding:9px 18px}
  /* mesa posta · badge opcional sobre a foto */
  .vibe .vopt{position:absolute;top:11px;left:11px;background:rgba(255,255,255,.93);color:var(--navy);border-radius:999px;padding:4px 12px;font-size:9px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;box-shadow:0 4px 12px -6px rgba(0,0,0,.45);z-index:2}
  /* espacos · atmosfera + nota comercial discreta */
  .vnote{margin-top:auto;padding-top:13px;margin-top:14px;border-top:1px solid var(--line);font-size:10px;color:var(--muted);font-weight:400;line-height:1.5}
  /* experiencias · 6 cards (2x3) */
  .xpgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:18px}
  .xp{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 12px 30px -24px rgba(0,0,0,.3)}
  .xp figure{margin:0;height:124px;overflow:hidden;position:relative}
  .xp figure img{width:100%;height:100%;object-fit:cover;display:block}
  .xp .xb{padding:13px 16px 15px;display:flex;flex-direction:column;flex:1}
  .xp .xn{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange-dark);font-weight:700}
  .xp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--navy);margin:3px 0 1px;line-height:1.06}
  .xp .xt{font-size:10.5px;color:var(--orange-dark);font-weight:700;font-style:italic}
  .xp p{font-size:10.5px;color:var(--muted);line-height:1.4;margin-top:7px;flex:1}
  .xp .xpr{font-family:'DM Serif Display',serif;font-size:19px;color:var(--navy);margin-top:9px;line-height:1}
  .xp .xpr small{font-family:'DM Sans',sans-serif;font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-left:3px}
  .xp .xadd{margin-top:6px;padding-top:6px;border-top:1px dashed var(--line);font-size:9.5px;color:var(--muted);line-height:1.35}
  .xp .xadd em{font-style:italic;color:var(--orange-dark);font-weight:700}
  .xp .xadd b{color:var(--navy);font-weight:700}
  /* CTA final */
  .cta2{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-top:22px;background:var(--navy);color:#fff;border-radius:18px;padding:24px 30px}
  .cta2 .q{font-family:'DM Serif Display',serif;font-size:23px;line-height:1.15}
  .cta2 .q em{color:var(--orange-light,#CFA07E);font-style:italic}
  .cta2 .c{font-size:12.5px;color:rgba(255,255,255,.85);line-height:1.6;text-align:right}
  .cta2 .c b{color:#fff}
  /* Premium */
  .plusbadge{display:inline-block;background:var(--orange);color:#fff;border-radius:999px;padding:9px 20px;font-weight:700;font-size:14px;margin-top:16px}
  /* Investimento · tabela */
  .ptable{width:100%;border-collapse:collapse;margin-top:18px;font-size:13px;border-radius:14px;overflow:hidden;box-shadow:0 14px 32px -24px rgba(0,0,0,.32)}
  .ptable th{background:var(--navy);color:#fff;text-align:left;padding:13px 18px;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;font-weight:700}
  .ptable th.r{text-align:right}
  .ptable td{padding:12px 18px;border-bottom:1px solid var(--line);color:var(--ink)}
  .ptable tr:last-child td{border-bottom:none}
  .ptable tr:nth-child(even) td{background:#FBF1EE}
  .ptable td.exp{font-weight:600;color:var(--navy)}
  .ptable td.r{text-align:right;color:var(--muted);font-weight:600}
  .ptable td.prem{text-align:right;font-family:'DM Serif Display',serif;font-size:17px;color:var(--orange-dark)}
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


def vcard(src, alt, kicker, name, phrase, itens, note, pos="center 50%"):
    lis = "".join(f"<li>{i}</li>" for i in itens)
    return (f'<div class="vcard"><div class="vph">{img(src, alt, pos)}</div>'
            f'<div class="vb"><span class="vt">{kicker}</span><h3>{name}</h3>'
            f'<p class="vaddr">{phrase}</p><ul>{lis}</ul>'
            f'<div class="vnote">{note}</div></div></div>')


def xp(n, src, alt, name, tagline, desc, price, pos="center 50%"):
    return (f'<div class="xp"><figure>{img(src, alt, pos)}</figure>'
            f'<div class="xb"><span class="xn">{n}</span><h3>{name}</h3>'
            f'<span class="xt">{tagline}</span><p>{desc}</p>'
            f'<div class="xpr">{price}<small>por pessoa</small></div></div></div>')


def vfig(src, alt, cap, pos="center 50%", opt=False):
    badge = '<span class="vopt">Opcional</span>' if opt else ''
    return f'<figure>{img(src, alt, pos)}{badge}<figcaption>{cap}</figcaption></figure>'


PROOF = "Experiências já realizadas para grupos como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)"

# ============================ 1 · CAPA ============================
cover = f'''
  <section class="slide">
{head_block("Proposta de experiência", "Gabriela", "Rossi", "")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Um aniversário Elarah</span>
        <h1>Um dia para <em>guardar na memória</em></h1>
        <p class="lead">Entre conversas, criações e pequenos detalhes, <b>uma celebração pensada para viver sem pressa.</b> ✨</p>
        <div class="chips">
          <span class="chip">📍 São Paulo, SP</span>
          <span class="chip">🎉 24.10</span>
          <span class="chip">👭 9 convidadas</span>
        </div>
      </div>
      <div class="cover-photo">{img("pintura-grupo.jpg", "Amigas celebrando juntas numa experiência criativa ao ar livre", "center 22%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Aniversário · Gabriela Rossi")}
  </section>'''

# ============================ 2 · CURADORIA ELARAH ============================
curadoria = f'''
  <section class="slide">
{head_simple("Curadoria Elarah")}
    <span class="eyebrow orange">◆ Curadoria Elarah</span>
    <h2>Pensamos em cada detalhe <em>pra vocês</em></h2>
    <p class="lead">Para um aniversário assim, a gente imaginou um encontro leve, bonito e cheio de pequenos momentos para guardar: um espaço gostoso, uma experiência feita juntas e uma mesa pronta para celebrar sem pressa.</p>
    <div class="grid3" style="margin-top:26px">
      <div class="infocard"><div class="ico">📍</div><h3>Perto de vocês</h3><p>Espaços charmosos, próximos à região da Saúde, escolhidos para o grupo ficar à vontade.</p></div>
      <div class="infocard"><div class="ico">🎨</div><h3>Criar juntas</h3><p>Uma experiência para colocar a mão na massa, conversar, rir e levar um pedacinho desse dia pra casa.</p></div>
      <div class="infocard"><div class="ico">🥂</div><h3>Tudo pronto para celebrar</h3><p>Mesa, comida, detalhes e atmosfera pensados para vocês só chegarem e aproveitarem.</p></div>
    </div>
    {foot("Curadoria Elarah")}
  </section>'''

# ============================ 3 · A MESA POSTA ============================
mesa_posta = f'''
  <section class="slide">
{head_simple("A mesa posta")}
    <span class="eyebrow orange">◆ Antes de vocês chegarem</span>
    <h2>A mesa posta, do jeito <em>Elarah</em></h2>
    <p class="lead">A gente chega antes, prepara cada detalhe e deixa tudo com clima de comemoração. Quando vocês chegam, a mesa já está pronta, as estações organizadas e o momento começa leve — é só criar, conversar e curtir juntas. ✨</p>
    <div class="vibe">
      {vfig("aniversario-mesa-real.jpg", "Mesa da comemoração posta com flores", "Mesa da comemoração", "center 50%")}
      {vfig("buqueflor.jpg", "Flores e detalhes de ambientação", "Ambientação &amp; detalhes", "center 50%")}
      {vfig("agora-mesa.jpg", "Mesa e materiais prontos para o grupo", "Tudo pronto pra turma", "center 50%")}
      {vfig("cheesecakes.jpg", "Bolo e doces para o momento do aniversário", "Um toque de aniversário", "center 50%", opt=True)}
      {vfig("perfumaria-oficina.jpg", "Estações da experiência montadas", "Estações preparadas", "center 45%")}
      {vfig("ceramicacool.jpg", "Peças autorais finalizadas", "A criação vira lembrança", "center 50%")}
    </div>
    <p class="fineprint">Flores, bolo, lembrancinhas, comidas e bebidas podem ser personalizados conforme o estilo da comemoração.</p>
    {foot("A mesa posta")}
  </section>'''

# ============================ 4 · ESCOLHA ONDE CELEBRAR ============================
onde = f'''
  <section class="slide">
{head_simple("Onde celebrar")}
    <span class="eyebrow orange">◆ Onde celebrar</span>
    <h2>Escolha onde <em>celebrar</em></h2>
    <p class="lead">Três atmosferas diferentes para viver o mesmo momento: intimista, leve e cheio de personalidade.</p>
    <div class="vgrid" style="grid-template-columns:repeat(3,1fr)">
      {vcard("casa-pretty-real.jpg", "Casa Pretty — mesa posta e grupo reunido", "Intimista &amp; acolhedor", "Casa Pretty", "Um espaço charmoso e reservado, com mesa posta para receber o grupo e possibilidade de menu completo.", ["Ambiente reservado e acolhedor", "Mesa posta para receber o grupo", "Possibilidade de menu completo"], "Sem locação · menu de R$ 120 a R$ 160/pessoa", "center 45%")}
      {vcard("yucafe-real.jpg", "YUCAFÉ Earth Based — terraço leve e cheio de verde", "Leve &amp; natural", "YUCAFÉ Earth Based", "Um café contemporâneo e descontraído, com clima gostoso para uma comemoração pequena e espontânea.", ["Ambiente leve e contemporâneo", "Bom para grupos pequenos", "Combina com experiências criativas"], "Sem locação · cardápio sob confirmação", "center 55%")}
      {vcard("sowcafe-fachada.jpg", "Sow Café — fachada charmosa com luzes", "Charmoso &amp; aconchegante", "Sow Café", "Um espaço acolhedor e cheio de personalidade, ideal para grupos pequenos e experiências criativas.", ["Atmosfera acolhedora", "Bom para grupos pequenos", "Conversa bem com experiências manuais"], "Reserva e consumo sob confirmação", "center 50%")}
    </div>
    <p class="fineprint">Cada espaço tem a sua própria atmosfera — a gente ajuda vocês a escolher a que mais combina com a comemoração.</p>
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
    <p class="fineprint">Valores por pessoa. Quer deixar completo? Dá pra somar um <b>brinde</b> — uma lembrancinha personalizada — a seguir.</p>
    {foot("A experiência")}
  </section>'''

# ============================ 6 · O BRINDE ESPECIAL ============================
premium = f'''
  <section class="slide">
{head_simple("O brinde")}
    <span class="eyebrow orange">◆ Quer deixar completo?</span>
    <h2>Um brinde <em>especial</em></h2>
    <p class="lead">Qualquer experiência pode ganhar um brinde: uma <b>lembrancinha personalizada</b> pra cada uma levar pra casa e guardar de recordação. É só somar <b>R$ 129 por pessoa</b>. 🎁</p>
    <div class="invbox">
      <div style="flex:0 0 36%;min-width:220px;border-radius:18px;overflow:hidden;position:relative;min-height:250px;border:1px solid var(--line)">
        <img src="assets/lembrancinha-escova.jpg" alt="Lembrancinha personalizada numa caixa de presente" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 45%">
      </div>
      <div class="incl" style="flex:1;min-width:280px;display:flex;flex-direction:column;justify-content:center">
        <span class="vt">Como funciona o brinde</span>
        <ul>
          <li><span>✦</span>Tudo da experiência escolhida</li>
          <li><span>✦</span><b>Lembrancinha personalizada</b> pra cada uma</li>
          <li><span>✦</span>À escolha: <b>escova gravada</b> ou <b>garrafa personalizada</b></li>
        </ul>
        <span class="plusbadge">+ R$ 129 por pessoa</span>
      </div>
    </div>
    <p class="fineprint">O brinde é opcional e pode ser personalizado conforme o estilo da comemoração.</p>
    {foot("O brinde")}
  </section>'''

# ============================ 7 · INVESTIMENTO (POR PESSOA E GRUPO) ============================
_exp = [("Pintura em Taça", 229), ("Arranjos Florais", 279), ("Vela Flor &amp; Home Spray", 269),
        ("Crie seu Folding Book", 249), ("Berloque de Bolsa", 259), ("Criando seu Perfume Natural", 259)]


def brl(v):
    return "R$ " + f"{v:,.0f}".replace(",", ".")


_rows = "\n".join(
    f'        <tr><td class="exp">{n}</td><td class="r">{brl(p)}</td>'
    f'<td class="prem">{brl(p * 9)}</td></tr>'
    for n, p in _exp)

investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Por pessoa e por <em>grupo</em></h2>
    <p class="lead">Cada experiência tem um valor por pessoa. Aqui está o total estimado para as 9 convidadas.</p>
    <table class="ptable">
      <thead>
        <tr><th>Experiência</th><th class="r">Por pessoa</th><th class="r">Grupo de 9</th></tr>
      </thead>
      <tbody>
{_rows}
      </tbody>
    </table>
    <p class="fineprint">Grupo estimado para 9 convidadas. O <b>brinde</b> (lembrancinha personalizada) é opcional: +R$ 129 por pessoa. Espaço e menu da casa à parte, conforme a opção escolhida. Data 24.10 sujeita à disponibilidade.</p>
    {foot("Investimento")}
  </section>'''

# ============================ 8 · PRÓXIMOS PASSOS ============================
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Próximos passos</span>
    <h2>É só escolher a <em>combinação</em></h2>
    <p class="lead">Agora é a parte boa: vocês escolhem o espaço e a experiência, decidem se querem somar o brinde, e a gente cuida de todo o resto pra reservar a data.</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">1️⃣</div><h3>Escolham o espaço</h3><p>Casa Pretty, YUCAFÉ ou Sow Café.</p></div>
      <div class="infocard"><div class="ico">2️⃣</div><h3>Escolham a experiência</h3><p>Uma das seis opções — com ou sem brinde personalizado.</p></div>
      <div class="infocard"><div class="ico">3️⃣</div><h3>A gente cota e reserva</h3><p>Fechamos espaço, mesa e lembrancinhas e seguramos a data.</p></div>
    </div>
    <div class="cta2">
      <div class="q">Qual combinação mais <em>combina com vocês?</em></div>
      <div class="c">Nos conta a favorita — espaço + experiência — e ajustamos os detalhes pra reservar a data.<br><b>Elarah · Experiências</b> · WhatsApp +55 (11) 91445-5930 · @elarah.oficial</div>
    </div>
    <p class="fineprint">Valores por pessoa das experiências conforme informado; espaço e menu da casa à parte, conforme a opção escolhida. Data 24.10 sujeita à disponibilidade de agenda.</p>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n'
        + cover + curadoria + mesa_posta + onde + experiencias + premium + investimento + proximos
        + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/experiencia-gabriela-rossi-aniversario.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
