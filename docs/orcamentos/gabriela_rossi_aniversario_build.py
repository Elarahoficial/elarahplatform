# Proposta Elarah · Aniversario Gabriela Rossi · 24/10 · 9 mulheres · Regiao Saude (SP)
# Curadoria pronta pra decidir: 4 opcoes (Netas / Casa Pretty / Meu Outro Lado / Elarah na Saude) + opcionais + comparativo.
# Reaproveita paleta vinho/terracota e componente .vcard do build vinho_ceramica_aniversario.
# Valores documentados Elarah: Netas R$299 · Meu Outro Lado R$359 · foto R$450 · lembrancinha R$99. Demais: sob cotacao.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

# paleta vinho + terracota (mesma do vinho_ceramica_aniversario)
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
  /* opcionais · grade de 6 */
  .optgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:20px}
  .optc{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px 20px;box-shadow:0 12px 30px -24px rgba(0,0,0,.3)}
  .optc .oi{font-size:20px}
  .optc h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy);margin:8px 0 4px;line-height:1.05}
  .optc p{font-size:11.5px;color:var(--muted);line-height:1.45}
  .optc .ov{font-size:10px;font-weight:700;letter-spacing:.04em;color:var(--orange-dark);margin-top:8px;text-transform:uppercase}
  /* comparativo */
  .cmp{width:100%;border-collapse:collapse;margin-top:20px}
  .cmp th{text-align:left;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--orange-dark);font-weight:700;padding:0 14px 11px;border-bottom:1px solid var(--line)}
  .cmp td{padding:14px 14px;border-bottom:1px solid var(--line);vertical-align:middle}
  .cmp .op{font-family:'DM Serif Display',serif;font-size:16px;color:var(--navy);line-height:1.1}
  .cmp .rg{font-size:11px;color:var(--muted)}
  .cmp .pp{font-family:'DM Serif Display',serif;font-size:20px;color:var(--navy);white-space:nowrap}
  .cmp .tt{font-size:11.5px;color:var(--navy-soft);font-weight:600;white-space:nowrap}
  .cmp .inc{font-size:11px;color:var(--muted);line-height:1.4}
  .cmp .sc{font-style:italic;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:13px}
  .cta2{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-top:22px;background:var(--navy);color:#fff;border-radius:18px;padding:24px 30px}
  .cta2 .q{font-family:'DM Serif Display',serif;font-size:23px;line-height:1.1}
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


def vcard(src, alt, price, kicker, name, addr, itens, pos="center 50%", hl=False, pricesmall=False):
    cls = "vcard hl" if hl else "vcard"
    if pricesmall:
        pr = f'<div class="vpr"><b style="font-size:15px">{price}</b></div>'
    else:
        pr = f'<div class="vpr"><b>{price}</b><small>por pessoa</small></div>'
    lis = "".join(f"<li>{i}</li>" for i in itens)
    return (f'<div class="{cls}"><div class="vph">{img(src, alt, pos)}{pr}</div>'
            f'<div class="vb"><span class="vt">{kicker}</span><h3>{name}</h3>'
            f'<p class="vaddr">{addr}</p><ul>{lis}</ul></div></div>')


def optc(icon, title, desc, val):
    return (f'<div class="optc"><div class="oi">{icon}</div><h3>{title}</h3>'
            f'<p>{desc}</p><div class="ov">{val}</div></div>')


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
      <div class="infocard"><div class="ico">📍</div><h3>Perto de vocês</h3><p>Opções na região da Saúde e arredores fáceis de chegar.</p></div>
      <div class="infocard"><div class="ico">🥂</div><h3>Feito pra 9</h3><p>Formatos pensados para um grupo de amigas celebrar junto.</p></div>
      <div class="infocard"><div class="ico">🎨</div><h3>Experiência + mesa</h3><p>Criar com as mãos, brindar e aproveitar comidas e bebidas.</p></div>
    </div>
    {foot("Curadoria Elarah")}
  </section>'''

# ============================ 3 · OPÇÕES 1 & 2 ============================
opcoes12 = f'''
  <section class="slide">
{head_simple("Opções 1 & 2")}
    <span class="eyebrow orange">◆ Opções 1 &amp; 2</span>
    <h2>Duas formas de <em>celebrar</em></h2>
    <p class="lead">Da cerâmica com vinho a um espaço charmoso pertinho, com experiência, comidas e bebidas.</p>
    <div class="vgrid" style="grid-template-columns:repeat(2,1fr)">
      {vcard("netas-atelie.jpg", "Netas Ateliê — grupo em experiência de cerâmica", "R$ 299", "Cerâmica + vinho", "Netas Ateliê", "Vila Mariana · vocês levam o próprio vinho 🍷", ["Cerâmica guiada por artista", "Vocês levam o vinho de vocês", "Turma de 8 a 10 pessoas"], "center 40%")}
      {vcard("mesa-montada-corp.jpg", "Casa Pretty — espaço preparado para a celebração", "Sob cotação", "Espaço + experiência", "Casa Pretty", "Bosque da Saúde · pertinho de vocês", ["Espaço próximo, na região da Saúde", "Experiência + comidas e bebidas", "Formato a definir com o grupo"], "center 50%", pricesmall=True)}
    </div>
    <p class="fineprint">Netas Ateliê: R$ 299 por pessoa (vocês levam o próprio vinho). Casa Pretty: valores <b>sob cotação</b>. Disponibilidade a confirmar para 24.10.</p>
    {foot("Opções 1 & 2")}
  </section>'''

# ============================ 4 · OPÇÕES 3 & 4 ============================
opcoes34 = f'''
  <section class="slide">
{head_simple("Opções 3 & 4")}
    <span class="eyebrow orange">◆ Opções 3 &amp; 4</span>
    <h2>Mais duas <em>opções</em></h2>
    <p class="lead">Um ateliê com vinho já incluso ou a experiência Elarah levada até a região da Saúde — do jeito de vocês.</p>
    <div class="vgrid" style="grid-template-columns:repeat(2,1fr)">
      {vcard("meu-outro-lado.jpg", "Ateliê Meu Outro Lado — espaço da experiência", "R$ 359", "Cerâmica + vinho incluso", "Ateliê Meu Outro Lado", "Brooklin · vinho já incluso 🍷", ["Experiência completa de cerâmica", "<b>Vinho já incluso</b> no valor", "Turma de 8 a 10 pessoas"], "center 50%")}
      {vcard("pinturatacavinho.jpg", "Pintura em taças conduzida pela Elarah", "Sob cotação", "Elarah na Saúde · personalizável", "Experiência Elarah", "Levada a um espaço na região da Saúde", ["Pintura em taças ou modelagem em argila", "<b>Personalizável</b> para o grupo", "Espaço na região a combinar"], "center 45%", hl=True, pricesmall=True)}
    </div>
    <p class="fineprint">Ateliê Meu Outro Lado (Brooklin): R$ 359 por pessoa, experiência e vinho inclusos. Experiência Elarah levada à região da Saúde: formato personalizável, valores <b>sob cotação</b>.</p>
    {foot("Opções 3 & 4")}
  </section>'''

# ============================ 5 · DEIXAR COMPLETO ============================
completo = f'''
  <section class="slide">
{head_simple("Para completar")}
    <span class="eyebrow orange">◆ Opcionais</span>
    <h2>Pra deixar o aniversário <em>completo</em></h2>
    <p class="lead">Some o que quiser a qualquer opção — tudo opcional e sob cotação. 🤍</p>
    <div class="optgrid">
      {optc("🍸", "Comidas &amp; bebidas", "Menu e drinks para o grupo.", "Sob cotação")}
      {optc("🎂", "Bolo &amp; doces", "Bolo e mesa de doces.", "Sob cotação")}
      {optc("🌸", "Flores", "Arranjos e decoração da mesa.", "Sob cotação")}
      {optc("🎁", "Lembrancinhas", "Mimo personalizado pra cada convidada.", "R$ 99 · por pessoa")}
      {optc("📸", "Foto profissional", "Registro da experiência, álbum digital.", "R$ 450 · valor fixo")}
      {optc("✨", "Personalizações", "Detalhes com a cara de vocês.", "Sob cotação")}
    </div>
    {foot("Para completar")}
  </section>'''

# ============================ 6 · INVESTIMENTO + PRÓXIMOS PASSOS ============================
investimento = f'''
  <section class="slide">
{head_simple("Investimento & próximos passos")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>É só escolher a <em>favorita</em></h2>
    <p class="lead">Um comparativo rápido das quatro opções, pra decidir com facilidade.</p>
    <table class="cmp">
      <thead><tr><th>Opção</th><th>Região</th><th>Por pessoa</th><th>Total · 9 pessoas</th><th>Principais inclusões</th></tr></thead>
      <tbody>
        <tr><td><span class="op">Netas Ateliê</span></td><td class="rg">Vila Mariana</td><td><span class="pp">R$ 299</span></td><td class="tt">R$ 2.691</td><td class="inc">Cerâmica guiada + vocês levam o vinho</td></tr>
        <tr><td><span class="op">Casa Pretty</span></td><td class="rg">Bosque da Saúde</td><td><span class="sc">Sob cotação</span></td><td class="sc">Sob cotação</td><td class="inc">Espaço próximo + experiência + comidas e bebidas</td></tr>
        <tr><td><span class="op">Meu Outro Lado</span></td><td class="rg">Brooklin</td><td><span class="pp">R$ 359</span></td><td class="tt">R$ 3.231</td><td class="inc">Cerâmica + vinho já incluso</td></tr>
        <tr><td><span class="op">Experiência Elarah</span></td><td class="rg">Região da Saúde</td><td><span class="sc">Sob cotação</span></td><td class="sc">Sob cotação</td><td class="inc">Pintura em taças ou cerâmica · personalizável</td></tr>
      </tbody>
    </table>
    <div class="cta2">
      <div class="q">Qual opção mais <em>combina com vocês?</em></div>
      <div class="c">Nos conta a favorita e ajustamos os detalhes pra reservar a data.<br><b>Elarah · Experiências</b> · WhatsApp +55 (11) 91445-5930 · @elarah.oficial</div>
    </div>
    <p class="fineprint">Valores por pessoa conforme documentado pela Elarah para cada experiência; opções “sob cotação” dependem de confirmação de fornecedor e formato. Opcionais (comidas, bolo, flores, lembrancinhas, foto, personalizações) somados à parte. Data 24.10 e disponibilidade a confirmar.</p>
    {foot("Investimento & próximos passos")}
  </section>'''

deck = ('<div class="deck">\n'
        + cover + curadoria + opcoes12 + opcoes34 + completo + investimento
        + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/experiencia-gabriela-rossi-aniversario.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
