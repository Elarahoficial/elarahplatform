# Proposta corporativa Elarah · NBCUniversal (Heloisa Ramires) · 15 pessoas · 1a semana de novembro · SP
# Padrao corporativo Elarah (ref.: corporativa_criativa / experiencia_corporativa_empresa).
# 4 experiencias: Tufting, Ceramica (modelagem a mao), Perfumaria (criacao de fragrancia), Gastronomia interativa.
# Valores FINAIS por pessoa reaproveitados do historico (ja com margem Elarah); nada inventado.
#   Tufting R$589 (riachuelo/corp) · Ceramica R$499 (Bake modelagem) · Perfumaria R$289 (imersao/Bake) · Gastronomia R$599 (corporativa_gastronomia)
# Total 15: 8.835 / 7.485 / 4.335 / 8.985. Opcionais documentados: foto R$450 (fixo), lembrancinha R$99/pessoa.
# Duracao ceramica e espaco final = sob confirmacao. Nunca mostrar custo de fornecedor/margem.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

xcss = '''
  /* menu de experiencias (4 cards) */
  .menu{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:18px}
  .exp{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 14px 32px -24px rgba(0,0,0,.32)}
  .exp .eph{height:150px;overflow:hidden;position:relative;background:#eee}
  .exp .eph img{width:100%;height:100%;object-fit:cover;display:block}
  .exp .en{position:absolute;top:10px;left:10px;background:var(--navy);color:#fff;font-family:'DM Serif Display',serif;font-size:13px;width:26px;height:26px;border-radius:999px;display:flex;align-items:center;justify-content:center}
  .exp .eb{padding:13px 15px 16px;display:flex;flex-direction:column;flex:1}
  .exp .ec{font-size:8.5px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .exp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:16px;color:var(--navy);line-height:1.08;margin:3px 0 0}
  .exp p{font-size:10px;color:var(--muted);line-height:1.4;margin-top:6px;flex:1}
  .exp .epr{font-family:'DM Serif Display',serif;font-size:16px;color:var(--navy);margin-top:9px;line-height:1}
  .exp .epr small{font-family:'DM Sans',sans-serif;font-size:8px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:700;display:block;margin-top:2px}
  /* preco dentro do bfeat */
  .bprice{margin-top:16px;padding-top:14px;border-top:1px solid var(--line);display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
  .bprice .pp{font-family:'DM Serif Display',serif;font-size:26px;color:var(--navy);line-height:1}
  .bprice .ppu{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-weight:700}
  .bprice .tt{font-size:11px;color:var(--orange-dark);font-weight:700}
  .bfeat .bdesc{font-size:12.5px;color:var(--muted);line-height:1.5;margin-top:9px}
  /* tabela de investimento */
  .itable{width:100%;border-collapse:collapse;margin-top:18px;border-radius:16px;overflow:hidden;box-shadow:0 16px 36px -26px rgba(0,0,0,.3)}
  .itable th{background:var(--navy);color:#fff;text-align:left;padding:13px 18px;font-size:9.5px;letter-spacing:.07em;text-transform:uppercase;font-weight:700}
  .itable th.r{text-align:right}
  .itable td{padding:14px 18px;border-bottom:1px solid var(--line);background:var(--card);vertical-align:middle}
  .itable tr:last-child td{border-bottom:none}
  .itable tr:nth-child(even) td{background:rgba(176,141,76,.06)}
  .itable .nm{font-family:'DM Serif Display',serif;font-size:18px;color:var(--navy);line-height:1.1}
  .itable .nm span{display:block;font-family:'DM Sans',sans-serif;font-size:10px;letter-spacing:.03em;color:var(--muted);margin-top:3px}
  .itable .pp{text-align:right;font-family:'DM Serif Display',serif;font-size:20px;color:var(--navy);white-space:nowrap}
  .itable .tt{text-align:right;font-family:'DM Serif Display',serif;font-size:20px;color:var(--orange-dark);white-space:nowrap}
  .optline{display:flex;gap:22px;flex-wrap:wrap;margin-top:16px}
  .optline .o{font-size:12px;color:var(--navy-soft)}
  .optline .o b{color:var(--navy)}
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


def expcard(n, src, alt, cat, name, desc, price, pos="center 50%"):
    unit = '<small>por pessoa</small>' if price.strip().startswith("R$") else ''
    prcls = "epr" if price.strip().startswith("R$") else "epr"
    prstyle = '' if price.strip().startswith("R$") else ' style="font-size:12px;color:var(--muted)"'
    return (f'<div class="exp"><div class="eph"><span class="en">{n}</span>{img(src, alt, pos)}</div>'
            f'<div class="eb"><span class="ec">{cat}</span><h3>{name}</h3><p>{desc}</p>'
            f'<div class="{prcls}"{prstyle}>{price}{unit}</div></div></div>')


def bexp(tag, name, desc, feats, pp, total, src, alt, pos="center 50%"):
    lis = "".join(f'<li><span class="st">✦</span>{f}</li>' for f in feats)
    if total:
        price = (f'<div class="bprice"><span class="pp">{pp}</span><span class="ppu">por pessoa</span>'
                 f'<span class="tt">{total} · 15 pessoas</span></div>')
    else:
        price = (f'<div class="bprice"><span class="pp" style="font-size:18px">{pp}</span></div>')
    return (f'<div class="bfeat"><div class="bphoto">{img(src, alt, pos)}</div>'
            f'<div class="bbody"><span class="btag">{tag}</span><h3>{name}</h3>'
            f'<p class="bdesc">{desc}</p><ul class="feat">{lis}</ul>'
            f'{price}</div></div>')


PROOF = "Experiências corporativas já realizadas para times de grandes empresas como <b>Compass</b> e <b>Hidratei</b>"

# ============================ 1 · CAPA ============================
cover = f'''
  <section class="slide">
{head_block("Proposta corporativa · NBCUniversal", "Curadoria", "Elarah", "Novembro")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência corporativa · NBCUniversal</span>
        <h1>Uma curadoria criativa <em>para o time</em></h1>
        <p class="lead">Uma seleção de quatro experiências criativas para reunir o time — <b>tufting</b>, <b>cerâmica</b>, <b>perfumaria</b> e <b>gastronomia interativa</b>.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>15</b> participantes</span>
          <span class="chip">1ª semana de <b>novembro</b></span>
          <span class="chip">São Paulo</span>
        </div>
      </div>
      <div class="cover-photo">{img("tufting6.jpg", "Time reunido segurando as próprias peças criadas numa experiência de tufting", "center 40%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Proposta · NBCUniversal")}
  </section>'''

# ============================ 2 · A CURADORIA ============================
curadoria = f'''
  <section class="slide">
{head_simple("A curadoria")}
    <span class="eyebrow orange">◆ Quatro experiências</span>
    <h2>A <em>curadoria</em></h2>
    <p class="lead">Quatro formatos criativos e contemporâneos, conduzidos por profissionais, com materiais, condução e estrutura necessários inclusos. É só o time escolher a favorita.</p>
    <div class="menu">
      {expcard("1", "tufting12.jpg", "Máquina de tufting criando uma peça colorida", "Têxtil", "Tufting", "Com a máquina de tufting, cada um cria o próprio tapete ou quadro autoral.", "Sob confirmação", "center 50%")}
      {expcard("2", "ceramicamodelagem.jpg", "Mãos modelando uma peça de cerâmica", "Cerâmica", "Modelagem à mão", "Cada um molda a própria peça em cerâmica, do bowl ao vaso.", "R$ 499", "center 50%")}
      {expcard("3", "perfumaria-oficina.jpg", "Bancada de perfumaria com essências e ervas", "Perfumaria", "Criação de fragrância", "Cada um explora notas e cria a própria fragrância para levar.", "R$ 289", "center 50%")}
      {expcard("4", "cozinha31-prato.jpg", "Prato finalizado em experiência gastronômica", "Gastronomia", "Gastronomia interativa", "O time cozinha um menu com um chef e finaliza degustando junto.", "R$ 599", "center 50%")}
    </div>
    <p class="fineprint">Valores por pessoa, com experiência, materiais, condução e estrutura inclusos. Investimento final conforme o espaço escolhido.</p>
    {foot("A curadoria")}
  </section>'''

# ============================ 3 · TUFTING ============================
tufting = f'''
  <section class="slide">
{head_simple("Tufting")}
    <span class="eyebrow orange">◆ Experiência 01 · Têxtil</span>
    <h2>Tufting <em>autoral</em></h2>
    {bexp("4h a 5h · Av. Brigadeiro Faria Lima, 1572 · São Paulo", "Tufting",
          "Com a máquina de tufting, cada participante desenha e preenche a própria peça em fios coloridos — uma criação têxtil moderna e cheia de personalidade.",
          ["Cada um cria o próprio <b>tapete ou quadro</b> e leva para casa",
           "Duração conforme o tamanho da peça (4h, 4h30 ou 5h)",
           "Máquina de tufting, fios e condução inclusos"],
          "Formato corporativo sob confirmação", "", "tufting-cereja.jpg", "Pessoa criando uma peça de tufting num bastidor", "center 40%")}
    <p class="fineprint">Duração, formato e valor do tufting <b>sob confirmação</b> com o espaço parceiro (Av. Brigadeiro Faria Lima, 1572).</p>
    {foot("Tufting")}
  </section>'''

# ============================ 4 · CERÂMICA ============================
ceramica = f'''
  <section class="slide">
{head_simple("Cerâmica")}
    <span class="eyebrow orange">◆ Experiência 02 · Cerâmica</span>
    <h2>Modelagem <em>à mão</em></h2>
    {bexp("Duração a confirmar · São Paulo (a definir)", "Cerâmica · modelagem à mão",
          "Guiado por um ceramista, cada participante modela a própria peça à mão — um bowl, um vaso, um potinho — no seu ritmo.",
          ["Cada um leva a <b>própria peça</b>, após acabamento e queima",
           "Argila, materiais e ceramista inclusos",
           "Acabamento, queima e logística das peças"],
          "R$ 499", "R$ 7.485", "casalmodelagemceramica.jpg", "Mãos modelando um bowl de cerâmica à mão", "center 50%")}
    {foot("Cerâmica")}
  </section>'''

# ============================ 5 · PERFUMARIA ============================
perfumaria = f'''
  <section class="slide">
{head_simple("Perfumaria")}
    <span class="eyebrow orange">◆ Experiência 03 · Perfumaria</span>
    <h2>Criação de <em>fragrância</em></h2>
    {bexp("2h · São Paulo (a definir)", "Criação de fragrância",
          "Conduzido por um perfumista, cada participante explora as notas olfativas e compõe a própria fragrância, do zero.",
          ["Cada um cria e leva o <b>próprio frasco</b> de perfume",
           "Perfumista, essências e insumos inclusos",
           "Frasco e materiais + estrutura"],
          "R$ 289", "R$ 4.335", "perfumaria-corp.jpg", "Essências, frascos e ervas para a criação de fragrância", "center 50%")}
    {foot("Perfumaria")}
  </section>'''

# ============================ 6 · GASTRONOMIA INTERATIVA ============================
gastronomia = f'''
  <section class="slide">
{head_simple("Gastronomia interativa")}
    <span class="eyebrow orange">◆ Experiência 04 · Gastronomia</span>
    <h2>Gastronomia <em>interativa</em></h2>
    {bexp("3h · São Paulo (a definir)", "Gastronomia interativa",
          "Guiado por um chef, o time coloca a mão na massa e prepara um menu de três tempos — entrada, prato principal e sobremesa — para finalizar degustando o que criou.",
          ["O time cozinha com um <b>chef</b> e degusta o menu completo",
           "Ingredientes, preparo e degustação inclusos",
           "Espaço equipado, utensílios e receitas em digital"],
          "R$ 599", "R$ 8.985", "aula-grupo.jpg", "Grupo diverso cozinhando junto com um chef", "center 50%")}
    {foot("Gastronomia interativa")}
  </section>'''

# ============================ 7 · INVESTIMENTO ============================
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Valores por pessoa e para <em>15</em></h2>
    <p class="lead">Cada experiência com o valor por pessoa e o investimento total para o grupo — com materiais, condução e estrutura inclusos.</p>
    <table class="itable">
      <thead>
        <tr><th>Experiência</th><th class="r">Por pessoa</th><th class="r">Total · 15 pessoas</th></tr>
      </thead>
      <tbody>
        <tr><td class="nm">Tufting<span>criação têxtil na máquina de tufting</span></td><td class="pp" style="font-size:13px;color:var(--muted)">Sob confirmação</td><td class="tt" style="color:var(--muted)">—</td></tr>
        <tr><td class="nm">Cerâmica · modelagem à mão<span>peça autoral, com queima e acabamento</span></td><td class="pp">R$ 499</td><td class="tt">R$ 7.485</td></tr>
        <tr><td class="nm">Criação de fragrância<span>perfume autoral para levar</span></td><td class="pp">R$ 289</td><td class="tt">R$ 4.335</td></tr>
        <tr><td class="nm">Gastronomia interativa<span>menu de três tempos com chef</span></td><td class="pp">R$ 599</td><td class="tt">R$ 8.985</td></tr>
      </tbody>
    </table>
    <div class="optline">
      <span class="o">◆ Opcionais: <b>registro fotográfico profissional</b> R$ 450 (total)</span>
      <span class="o"><b>brindes / personalização</b> sob consulta</span>
    </div>
    <p class="fineprint">Valores por pessoa e totais para 15 participantes, com condução, materiais e estrutura necessários inclusos. Tufting, espaço final, duração e disponibilidade na 1ª semana de novembro <b>sob confirmação</b>.</p>
    {foot("Investimento")}
  </section>'''

# ============================ 8 · COMO FUNCIONA & PRÓXIMOS PASSOS ============================
proximos = f'''
  <section class="slide">
{head_simple("Como funciona & próximos passos")}
    <span class="eyebrow orange">◆ Simples e sob medida</span>
    <h2>É só <em>reunir o time</em></h2>
    <p class="lead">A Elarah coordena toda a experiência — da curadoria à produção — para o time só chegar e criar.</p>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Escolham a experiência</h3><p>Tufting, cerâmica, perfumaria ou gastronomia — a que mais combina com o time.</p></div>
      <div class="step"><div class="num">2</div><h3>Reservamos espaço e data</h3><p>Recomendamos e reservamos o espaço em São Paulo, na 1ª semana de novembro.</p></div>
      <div class="step"><div class="num">3</div><h3>A gente coordena tudo</h3><p>Cada experiência é produzida com profissional, materiais e estrutura necessários.</p></div>
    </div>
    <div class="addon">
      <span class="plus">✦</span>
      <div>
        <h4>Sob medida para a NBCUniversal</h4>
        <p>Podemos somar <b>registro profissional</b>, <b>lembrancinha personalizada</b> com a marca e ajustar a experiência ao time. Emitimos <b>nota fiscal</b> e alinhamos prazo e pagamento com o financeiro.</p>
      </div>
    </div>
    <div class="cta">
      <h2>Vamos <em>desenhar esse dia?</em> ✦</h2>
      <p>Heloisa, nos conta a experiência favorita, que a gente recomenda o espaço e organiza cada detalhe para a 1ª semana de novembro.</p>
      <div class="cta-actions">
        <a class="btn-wa" href="https://wa.me/5511914455930?text=Oi%2C%20Elarah!%20Sobre%20a%20proposta%20corporativa%20da%20NBCUniversal." target="_blank" rel="noopener">💬 Falar no WhatsApp</a>
        <div class="contact-links">
          <span>+55 (11) 91445-5930</span>
          <a href="https://instagram.com/elarah.oficial" target="_blank" rel="noopener">@elarah.oficial</a>
          <a href="https://elarah.com.br" target="_blank" rel="noopener">elarah.com.br</a>
        </div>
      </div>
    </div>
    <p class="fineprint">Proposta de experiência corporativa da Elarah para a NBCUniversal (a/c Heloisa Ramires) — experiência criativa à escolha (tufting, cerâmica, perfumaria ou gastronomia interativa) para 15 participantes, na 1ª semana de novembro, em São Paulo. Valores por pessoa: Cerâmica R$ 499 · Perfumaria R$ 289 · Gastronomia interativa R$ 599; Tufting sob confirmação. Espaço, formato do tufting e disponibilidade sob confirmação.</p>
    {foot("Como funciona & próximos passos")}
  </section>'''

deck = ('<div class="deck">\n'
        + cover + curadoria + tufting + ceramica + perfumaria + gastronomia + investimento + proximos
        + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/experiencia-corporativa-nbcuniversal.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
