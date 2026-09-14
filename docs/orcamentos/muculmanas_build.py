# Coleção Muçulmanas · 4 experiências (Gastronômica R$419 · Charuto R$799 · Floral R$239 · Automaquiagem parceria)
# Identidade coesa: verde esmeralda + dourado. Halal, sem álcool, elegante e temática.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"
base = open(S + "/compass_latest.html", encoding="utf-8").read()
head0 = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]


def make_head():
    head = head0
    # ---- paleta: esmeralda + dourado ----
    head = head.replace("--orange:#F27623;", "--orange:#B08D4C;")
    head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#8A6D34;")
    head = head.replace("--navy:#16233C;", "--navy:#12362B;")
    head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#3A5A4E;")
    head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#B08D4C;")
    head = head.replace("#EDF1F7", "#EFF3EE").replace("#DCE5F1", "#DCE8E1")
    head = head.replace("#FF9A4D", "#CBB06E")
    head = head.replace("rgba(242,118,35,.22)", "rgba(176,141,76,.24)")

    extra = '''
  /* feature (foto + texto) */
  .bfeat{display:grid;grid-template-columns:48% 1fr;margin-top:16px;background:var(--card);border:1.6px solid var(--orange);border-radius:18px;overflow:hidden;box-shadow:0 18px 42px -24px rgba(0,0,0,.3)}
  .bfeat .bphoto{overflow:hidden;background:#eee;position:relative;min-height:330px}
  .bfeat .bphoto img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .bfeat .bbody{padding:24px 30px 26px;display:flex;flex-direction:column;justify-content:center}
  .bfeat .btag{align-self:flex-start;background:var(--navy);color:#fff;font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:6px 13px;border-radius:999px;margin-bottom:12px}
  .bfeat h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:25px;color:var(--navy);line-height:1.05}
  .bfeat ul.feat{list-style:none;display:flex;flex-direction:column;gap:10px;margin-top:14px}
  .bfeat ul.feat li{position:relative;padding-left:26px;font-size:13px;color:var(--ink);line-height:1.35}
  .bfeat ul.feat li b{font-weight:700;color:var(--navy)}
  .bfeat ul.feat li .st{position:absolute;left:0;top:-1px;width:18px;height:18px;border-radius:999px;background:var(--orange);color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center}
  /* vibe */
  .vibe{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
  .vibe figure{margin:0;border-radius:16px;overflow:hidden;position:relative;aspect-ratio:3/4;box-shadow:0 16px 36px -24px rgba(0,0,0,.34)}
  .vibe img{width:100%;height:100%;object-fit:cover;display:block}
  .vibe figcaption{position:absolute;left:0;right:0;bottom:0;padding:28px 14px 13px;color:#fff;font-size:12.5px;font-weight:600;background:linear-gradient(to top,rgba(10,28,22,.85),transparent)}
  /* cards de item / preco */
  .vgrid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:16px}
  .vcard{background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 36px -24px rgba(0,0,0,.3);position:relative}
  .vcard.hl{border:2px solid var(--navy)}
  .vph{height:196px;overflow:hidden;position:relative;background:#eee}
  .vph img{width:100%;height:100%;object-fit:cover}
  .vpr{position:absolute;top:12px;right:12px;background:var(--navy);color:#fff;border-radius:14px;padding:7px 14px;text-align:center}
  .vpr b{font-family:'DM Serif Display',serif;font-size:22px;font-weight:400;line-height:1;display:block}
  .vpr small{font-size:8px;letter-spacing:.1em;text-transform:uppercase;font-weight:600;opacity:.85}
  .vb{padding:18px 22px 20px;flex:1;display:flex;flex-direction:column}
  .vt{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin-bottom:5px}
  .vcard h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:21px;color:var(--navy);line-height:1.05}
  .vaddr{font-size:11.5px;color:var(--muted);margin-top:6px;line-height:1.45}
  .vcard ul{list-style:none;margin-top:12px;display:flex;flex-direction:column;gap:6px}
  .vcard ul li{position:relative;padding-left:18px;font-size:11.5px;color:var(--ink);line-height:1.3}
  .vcard ul li::before{content:"\\2726";position:absolute;left:0;top:1px;color:var(--orange);font-size:10px}
  /* placeholder de foto */
  .pslot{width:100%;height:100%;min-height:100%;border:2px dashed var(--orange);background:rgba(176,141,76,.10);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;box-sizing:border-box;padding:16px}
  .pslot .pi{font-size:26px}
  .pslot .pl{font-family:'DM Serif Display',serif;font-size:16px;color:var(--navy)}
  .pslot .ps{font-size:9px;color:var(--muted);font-weight:600;letter-spacing:.05em;text-transform:uppercase}
  .invbox{display:flex;gap:22px;margin-top:16px;flex-wrap:wrap;align-items:stretch}
  .incl{flex:1;min-width:300px;background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px 26px}
  .incl ul{list-style:none;margin-top:10px;display:flex;flex-direction:column;gap:9px}
  .incl ul li{position:relative;padding-left:20px;font-size:13px;color:var(--ink);line-height:1.4}
  .incl ul li span{position:absolute;left:0;top:1px;color:var(--orange)}
  .pricebox{background:var(--navy);color:#fff;border-radius:18px;padding:26px 34px;display:flex;flex-direction:column;justify-content:center;text-align:center;min-width:230px}
  .pricebox .pl{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange);font-weight:700}
  .pricebox .pv{font-family:'DM Serif Display',serif;font-size:52px;line-height:1;margin:8px 0 2px}
  .pricebox .ps{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.78);font-weight:600}
  .bnote{margin-top:16px;background:#EFF3EE;border-left:4px solid var(--orange);border-radius:0 12px 12px 0;padding:12px 18px;font-size:12px;color:var(--navy-soft);line-height:1.5}
  .bnote b{color:var(--navy)}
  .fineprint{font-size:10px;color:var(--muted);line-height:1.5;margin-top:16px}
</style>'''
    head = head.replace("</style>", extra, 1)

    head = head.replace(
        "    @page{size:A4 portrait;margin:0}",
        "    .slide *{box-shadow:none !important}\n"
        "    .cover-photo,.bfeat .bphoto,.vibe figure,.vcard,.vph{border:1px solid rgba(18,54,43,.16)}\n"
        "    .vibe{grid-template-columns:repeat(3,1fr)}\n"
        "    .vgrid{grid-template-columns:1fr 1fr}\n"
        "    .bfeat{grid-template-columns:48% 1fr}\n"
        "    @page{size:A4 portrait;margin:0}", 1)
    head = head.replace(".plans{grid-template-columns:1fr}",
                        ".plans{grid-template-columns:1fr}\n    .vibe{grid-template-columns:1fr 1fr}\n    .vgrid{grid-template-columns:1fr}\n    .bfeat{grid-template-columns:1fr}\n    .bfeat .bphoto{min-height:200px}")
    return head


def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'


def img(src, alt, pos="center 50%"):
    return f'<img src="assets/{src}" alt="{alt}" style="object-position:{pos}">'


def pslot(icon, label, sub):
    return f'<div class="pslot"><span class="pi">{icon}</span><span class="pl">{label}</span><span class="ps">{sub}</span></div>'


def head_block(kicker, main, accent, small):
    return f'''    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right">
        <span class="kicker">{kicker}</span>
        <span class="compass">{main} <span>&amp; {accent}</span><small>{small}</small></span>
      </div>
    </div>'''


def head_simple(kicker):
    return f'''    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">{kicker}</span></div>
    </div>'''


def cover(kicker, main, accent, small, eyebrow, title, lead, chips, photo, proof, fr):
    return f'''
  <section class="slide">
{head_block(kicker, main, accent, small)}
    <div class="cover">
      <div>
        <span class="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p class="lead">{lead}</p>
        <div class="rule"></div>
        <div class="chips">{chips}</div>
      </div>
      <div class="cover-photo">{photo}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {proof}</div>
    {foot(fr)}
  </section>'''


def exp_page(kicker, eyebrow, title, lead, photo, btag, h3, steps, fr):
    li = "\n".join(f'          <li><span class="st">{i+1}</span>{s}</li>' for i, s in enumerate(steps))
    return f'''
  <section class="slide">
{head_simple(kicker)}
    <span class="eyebrow orange">{eyebrow}</span>
    <h2>{title}</h2>
    <p class="lead">{lead}</p>
    <div class="bfeat">
      <div class="bphoto">{photo}</div>
      <div class="bbody">
        <span class="btag">{btag}</span>
        <h3>{h3}</h3>
        <ul class="feat">
{li}
        </ul>
      </div>
    </div>
    {foot(fr)}
  </section>'''


def vibe_page(kicker, eyebrow, title, lead, figs, fr):
    ff = "\n".join(f'      <figure>{p}<figcaption>{c}</figcaption></figure>' for p, c in figs)
    return f'''
  <section class="slide">
{head_simple(kicker)}
    <span class="eyebrow orange">{eyebrow}</span>
    <h2>{title}</h2>
    <p class="lead">{lead}</p>
    <div class="vibe">
{ff}
    </div>
    {foot(fr)}
  </section>'''


def invest_single(eyebrow, title, lead, incl_title, incl, price, plbl, note, fine, fr):
    li = "\n".join(f'          <li><span>✦</span>{x}</li>' for x in incl)
    return f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">{eyebrow}</span>
    <h2>{title}</h2>
    <p class="lead">{lead}</p>
    <div class="rule"></div>
    <div class="invbox">
      <div class="incl">
        <span class="vt">{incl_title}</span>
        <ul>
{li}
        </ul>
      </div>
      <div class="pricebox">
        <span class="pl">{plbl}</span>
        <span class="pv">{price}</span>
        <span class="ps">por pessoa</span>
      </div>
    </div>
    <div class="bnote">{note}</div>
    <p class="fineprint">{fine}</p>
    {foot(fr)}
  </section>'''


def proximos(eyebrow, title, lead, cards, fr):
    cc = "\n".join(f'      <div class="infocard"><div class="ico">{i+1}️⃣</div><h3>{t}</h3><p>{d}</p></div>' for i, (t, d) in enumerate(cards))
    return f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">{eyebrow}</span>
    <h2>{title}</h2>
    <p class="lead">{lead}</p>
    <div class="rule"></div>
    <div class="grid3">
{cc}
    </div>
    <div class="quote">
      <i>Elarah · Experiências criativas</i><br>
      contato@elarah.com.br &nbsp;·&nbsp; <strong>elarah.com.br</strong> &nbsp;·&nbsp; @elarah
    </div>
    {foot(fr)}
  </section>'''


def write(name, sections):
    deck = '<div class="deck">\n' + "".join(sections) + '\n\n</div>\n\n'
    html = make_head() + deck + tail
    out = f"{ROOT}/experiencia-{name}.html"
    open(out, "w", encoding="utf-8").write(html)
    print("wrote", out, "| slides:", html.count('<section class="slide">'))


# =========================================================================
# 1) GASTRONÔMICA · Receitaria Escola Gourmet · R$ 419 · halal/temática
# =========================================================================
PROOF = "Experiências já realizadas para grupos como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)"

g_cover = cover(
    "Proposta de experiência · Turma privada", "Gastronômica", "Escola Gourmet", "Halal & temática",
    "✦ Experiência gastronômica · Receitaria Escola Gourmet",
    "Sabores que <em>viajam</em>",
    "Uma experiência gastronômica temática e <strong>halal</strong>, guiada por chef na <strong>Receitaria Escola Gourmet</strong>: a turma põe a mão na massa, prepara pratos cheios de história e se reúne à mesa pra celebrar. Sem álcool, do começo ao fim. 🌙",
    '<span class="chip"><b>Receitaria</b> Escola Gourmet</span><span class="chip"><b>Halal</b></span><span class="chip">Mão na massa <b>& à mesa</b></span>',
    img("arabe.jpg", "Mesa árabe temática, mezze halal", "center 50%"),
    PROOF, "Gastronômica · Escola Gourmet")

g_exp = exp_page(
    "A experiência",
    "◆ Na Receitaria Escola Gourmet",
    "Uma cozinha para <em>chamar de sua</em>",
    "Num espaço lindo e equipado, com o chef ao lado, a turma aprende a preparar pratos temáticos — tudo halal e sem álcool. É colocar a mão na massa, aprender técnicas e, no fim, celebrar cada prato à mesa. 🌙",
    img("receitaria.jpg", "Chef preparando na Receitaria Escola Gourmet", "center 30%"),
    "Como acontece",
    "Da bancada à mesa",
    ["<b>Boas-vindas</b> — um chá especial ou mocktail e a bancada montada pra começar.",
     "<b>Mão na massa</b> — com o chef, a turma prepara os pratos temáticos, passo a passo.",
     "<b>À mesa</b> — todos se reúnem pra degustar o que criaram, com calma e afeto. 🍽️"],
    "A experiência")

g_vibe = vibe_page(
    "A vibe",
    "◆ O que vocês vão sentir",
    "Uma mesa cheia de <em>história</em>",
    "Mais que uma aula: um encontro caloroso, aromas que abraçam e pratos de dar orgulho — do primeiro tempero ao doce final. 🌿",
    [(img("gastronomiamolecular.jpg", "Prato autoral com toque de chef", "center 50%"), "Toque de chef"),
     (img("prato-bavaroise.jpg", "Sobremesa autoral", "center 50%"), "Sobremesa autoral"),
     (img("petitgateau.jpg", "Doce especial ao final", "center 50%"), "Doce final")],
    "A vibe da experiência")

g_inv = invest_single(
    "◆ Investimento",
    "Uma experiência <em>sob medida</em>",
    "A experiência gastronômica completa, direto na <strong>Receitaria Escola Gourmet</strong>, por <strong>R$ 419 por pessoa</strong> — chef, ingredientes halal, receitas temáticas e toda a estrutura inclusos.",
    "O que já está incluso",
    ["Chef conduzindo a experiência, do começo ao fim",
     "Ingredientes <b>halal</b> e receitas temáticas",
     "Espaço equipado na Receitaria Escola Gourmet",
     "Bebidas sem álcool (chás e mocktails) e degustação à mesa",
     "Todo o material, avental e estrutura"],
    "R$ 419", "Valor por pessoa",
    "◆ Quer deixar ainda mais <b>especial</b>? Dá pra incluir lembrancinha, decoração temática ou registro fotográfico — a gente monta sob medida. É só me contar o que vocês imaginam. 🌙",
    "Valor por pessoa para a experiência gastronômica temática (halal, sem álcool) na Receitaria Escola Gourmet. Inclui chef, ingredientes, receitas, bebidas sem álcool, material e estrutura. Número de pessoas e data a confirmar. Proposta válida mediante confirmação de disponibilidade de agenda.",
    "Investimento")

g_prox = proximos(
    "◆ Bora pra cozinha? 🌙",
    "É só <em>escolher</em>",
    "Me confirma o número de pessoas e a data que a gente reserva a Receitaria e organiza tudo — temperos, receitas e a mesa posta pra vocês. Qualquer dúvida, é só chamar. 🍽️",
    [("Escolham", "O número de pessoas e a data que têm em mente."),
     ("Reservamos", "A gente segura a agenda e a cozinha pra sua turma."),
     ("É só cozinhar", "No dia, chega tudo pronto. Vocês só põem a mão na massa.")],
    "Próximos passos")

write("gastronomica-halal", [g_cover, g_exp, g_vibe, g_inv, g_prox])


# =========================================================================
# 2) CHARUTO · R$ 799 · sofisticado (fotos placeholder)
# =========================================================================
c_cover = cover(
    "Proposta de experiência · Turma privada", "Charuto", "Café", "Experiência sensorial",
    "✦ Experiência sensorial · Charuto & harmonização sem álcool",
    "A arte do <em>charuto</em>",
    "Uma experiência sensorial e sofisticada: um mestre charuteiro guia a turma pelos aromas, a escolha e o ritual do charuto — harmonizado com <strong>cafés especiais e chás</strong>, sem álcool. Um momento de pausa, elegância e boa conversa. 🌙",
    '<span class="chip"><b>Lounge</b> privativo</span><span class="chip">Harmonização <b>sem álcool</b></span><span class="chip">Mestre <b>charuteiro</b></span>',
    pslot("🖼️", "Foto do charuto", "enviar imagem"),
    PROOF, "A arte do Charuto")

c_exp = exp_page(
    "A experiência",
    "◆ O ritual do charuto",
    "Um momento para <em>desacelerar</em>",
    "Guiados por um mestre charuteiro, todos conhecem a origem, os aromas e a forma certa de apreciar cada charuto — acompanhado de cafés especiais e chás selecionados. Sem pressa, sem álcool: só bom gosto e boa companhia. 🌙",
    pslot("🖼️", "Foto do charuto / lounge", "enviar imagem"),
    "Como acontece",
    "Do primeiro aroma ao brinde",
    ["<b>Boas-vindas</b> — recepção no lounge, café especial ou chá na mão.",
     "<b>O ritual</b> — o mestre apresenta a seleção, os aromas e como apreciar.",
     "<b>Harmonização</b> — cada charuto encontra seu café ou chá, e é só relaxar. ☕"],
    "A experiência")

c_vibe = vibe_page(
    "A vibe",
    "◆ O que vocês vão sentir",
    "Elegância em cada <em>detalhe</em>",
    "Um ambiente acolhedor e sofisticado, aromas marcantes e aquela conversa boa que rende — a experiência perfeita pra celebrar com requinte. 🌙",
    [(pslot("🖼️", "Seleção de charutos", "enviar foto"), "Seleção autoral"),
     (img("sowcafe.jpg", "Café especial para harmonização", "center 50%"), "Café & chás especiais"),
     (pslot("🖼️", "Lounge / ambiente", "enviar foto"), "Lounge privativo")],
    "A vibe da experiência")

c_inv = invest_single(
    "◆ Investimento",
    "Uma experiência <em>exclusiva</em>",
    "A experiência completa do charuto — mestre charuteiro, seleção autoral e harmonização com cafés e chás especiais — por <strong>R$ 799 por pessoa</strong>.",
    "O que já está incluso",
    ["Mestre charuteiro conduzindo a experiência",
     "Seleção autoral de charutos por pessoa",
     "Harmonização com <b>cafés especiais e chás</b> (sem álcool)",
     "Lounge privativo e ambientação",
     "Toda a estrutura e serviço"],
    "R$ 799", "Valor por pessoa",
    "◆ Quer algo ainda mais <b>exclusivo</b>? Dá pra incluir espaço temático, música ao vivo ou lembrancinha personalizada — a gente monta sob medida. 🌙",
    "Valor por pessoa para a experiência sensorial do charuto, com harmonização sem álcool. Inclui mestre charuteiro, seleção de charutos, cafés e chás, lounge e estrutura. Número de pessoas e data a confirmar. Proposta válida mediante confirmação de disponibilidade de agenda.",
    "Investimento")

c_prox = proximos(
    "◆ Vamos celebrar? 🌙",
    "É só <em>escolher</em>",
    "Me confirma o número de pessoas e a data que a gente reserva o lounge e organiza tudo pra vocês. Qualquer dúvida, é só chamar. ☕",
    [("Escolham", "O número de pessoas e a data que têm em mente."),
     ("Reservamos", "A gente segura a agenda e o lounge pra sua turma."),
     ("É só relaxar", "No dia, chega tudo pronto. Vocês só aproveitam.")],
    "Próximos passos")

write("charuto", [c_cover, c_exp, c_vibe, c_inv, c_prox])


# =========================================================================
# 3) ARRANJO FLORAL · R$ 239
# =========================================================================
f_cover = cover(
    "Proposta de experiência · Turma privada", "Arranjo", "Floral", "Turma privada",
    "✦ Experiência criativa · Arranjo floral autoral",
    "Flores que <em>encantam</em>",
    "Uma experiência delicada e cheia de charme: guiadas por uma florista, cada uma monta o seu próprio arranjo autoral — escolhendo flores, cores e formas — pra levar pra casa um pedacinho de beleza feito à mão. 🌸",
    '<span class="chip">Arranjo <b>autoral</b></span><span class="chip">Leva <b>pra casa</b></span><span class="chip">Florista <b>guiando</b></span>',
    img("buque.jpg", "Buquê floral autoral", "center 40%"),
    PROOF, "Arranjo Floral")

f_exp = exp_page(
    "A experiência",
    "◆ Mão na massa (e nas flores 🌸)",
    "Cada arranjo, uma <em>assinatura</em>",
    "Com a florista ao lado, a turma aprende a escolher, combinar e montar as flores — técnicas, harmonia de cores e aquele toque pessoal. No fim, cada uma leva o próprio arranjo pra casa. 🌷",
    img("pinturavasoearranjo.jpg", "Vasos e arranjos florais autorais", "center 50%"),
    "Como acontece",
    "Do buquê ao vaso",
    ["<b>Boas-vindas</b> — um chá especial e a bancada de flores montada.",
     "<b>Mão nas flores</b> — a florista ensina a escolher e compor o arranjo.",
     "<b>Leva pra casa</b> — cada uma finaliza e leva o seu arranjo autoral. 🌸"],
    "A experiência")

f_vibe = vibe_page(
    "A vibe",
    "◆ O que vocês vão sentir",
    "Delicadeza em cada <em>detalhe</em>",
    "Um encontro leve, perfumado e cheio de fotos lindas — cores, texturas e a alegria de criar algo com as próprias mãos. 🌿",
    [(img("buqueflor.jpg", "Buquê de flores do campo", "center 50%"), "Flores selecionadas"),
     (img("florseca.jpg", "Mini arranjos de flores secas", "center 50%"), "Composições autorais"),
     (img("pinturavasoearranjo.jpg", "Vasos pintados com arranjo", "center 50%"), "Leva pra casa")],
    "A vibe da experiência")

f_inv = invest_single(
    "◆ Investimento",
    "Uma experiência <em>sob medida</em>",
    "A experiência de arranjo floral completa — florista, flores selecionadas e todo o material — por <strong>R$ 239 por pessoa</strong>. Cada uma leva o próprio arranjo pra casa. 🌸",
    "O que já está incluso",
    ["Florista conduzindo a experiência, do começo ao fim",
     "Flores selecionadas e material para o arranjo",
     "Vaso ou suporte para levar pra casa",
     "Bebida sem álcool (chás) de boas-vindas",
     "Todo o material e estrutura"],
    "R$ 239", "Valor por pessoa",
    "◆ Quer deixar ainda mais <b>especial</b>? Dá pra incluir lembrancinha, decoração temática ou registro fotográfico — a gente monta sob medida. 🌷",
    "Valor por pessoa para a experiência de arranjo floral autoral. Inclui florista, flores, material, vaso/suporte, bebida sem álcool e estrutura. Número de pessoas e data a confirmar. Proposta válida mediante confirmação de disponibilidade de agenda.",
    "Investimento")

f_prox = proximos(
    "◆ Bora criar? 🌸",
    "É só <em>escolher</em>",
    "Me confirma o número de pessoas e a data que a gente organiza as flores e a bancada pra vocês. Qualquer dúvida, é só chamar. 🌿",
    [("Escolham", "O número de pessoas e a data que têm em mente."),
     ("Reservamos", "A gente separa as flores e o material pra sua turma."),
     ("É só criar", "No dia, chega tudo pronto. Vocês só põem a mão nas flores.")],
    "Próximos passos")

write("arranjo-floral", [f_cover, f_exp, f_vibe, f_inv, f_prox])


# =========================================================================
# 4) AUTOMAQUIAGEM BY ELARAH · parceria Sephora / Laura Mercier · sem custo
# =========================================================================
m_cover = cover(
    "Proposta de experiência · Parceria de marca", "Beleza", "Autoestima", "Automaquiagem by Elarah",
    "✦ Experiência de beleza · Curso de automaquiagem",
    "Beleza que <em>ensina</em>",
    "Um curso de automaquiagem criado especialmente <strong>com vocês</strong>: uma maquiadora profissional ensina, passo a passo, técnicas de automaquiagem — num formato pensado pra encantar e valorizar cada uma. ✨",
    '<span class="chip">Curso <b>exclusivo</b></span><span class="chip">Maquiadora <b>profissional</b></span><span class="chip">Parceria <b>de marca</b></span>',
    pslot("🖼️", "Foto de beleza / aula", "enviar imagem"),
    PROOF, "Automaquiagem by Elarah")

m_exp = exp_page(
    "A experiência",
    "◆ Passo a passo, com carinho",
    "Aprender a se <em>valorizar</em>",
    "Uma maquiadora profissional conduz o curso do começo ao fim: pele, olhos, boca e aquele toque final — cada uma aprende as técnicas no seu tempo, com produtos de primeira linha na mão. ✨",
    pslot("🖼️", "Aula de automaquiagem", "enviar imagem"),
    "Como acontece",
    "Do primeiro pincel ao acabamento",
    ["<b>Boas-vindas</b> — recepção, kit de produtos e espelho montado.",
     "<b>Mão na massa</b> — a maquiadora ensina cada etapa, passo a passo.",
     "<b>Toque final</b> — cada uma finaliza o próprio look e leva as dicas pra vida. 💄"],
    "A experiência")

m_vibe = vibe_page(
    "A vibe",
    "◆ O que vocês vão sentir",
    "Autoestima em cada <em>detalhe</em>",
    "Um encontro leve, cheio de dicas e produtos incríveis — beleza, cuidado e aquela sensação boa de aprender algo que fica pra sempre. ✨",
    [(img("lipbalm1.jpg", "Produtos de beleza selecionados", "center 50%"), "Produtos de primeira linha"),
     (pslot("🖼️", "Aula / mãos na maquiagem", "enviar foto"), "Passo a passo"),
     (img("lipbalm.jpg", "Detalhe de produto de beleza", "center 50%"), "Toque final")],
    "A vibe da experiência")

# investimento especial (parceria, sem preço fixo)
m_inv = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Uma parceria sob medida</span>
    <h2>Beleza em <em>parceria</em></h2>
    <p class="lead">Este curso é diferente: a gente pode construir a experiência como uma <strong>parceria de marca</strong>. A ideia é somar a Elarah a um patrocínio da <strong>Sephora</strong> para o lançamento de novos produtos de marcas como a <strong>Laura Mercier</strong> — combinando o valor juntos e, dependendo do formato, viabilizando a experiência <strong>sem custo em parceria</strong>.</p>
    <div class="rule"></div>
    <div class="invbox">
      <div class="incl">
        <span class="vt">Como funciona a parceria</span>
        <ul>
          <li><span>✦</span>Curso de automaquiagem criado sob medida com vocês</li>
          <li><span>✦</span>Patrocínio da <b>Sephora</b> para lançamento de novos produtos</li>
          <li><span>✦</span>Marcas como a <b>Laura Mercier</b> em destaque na experiência</li>
          <li><span>✦</span>Maquiadora profissional e todo o material inclusos</li>
          <li><span>✦</span>Valor definido em conjunto — podendo ser <b>sem custo</b></li>
        </ul>
      </div>
      <div class="pricebox">
        <span class="pl">Formato</span>
        <span class="pv" style="font-size:34px;margin:12px 0 6px">Parceria</span>
        <span class="ps">valor a combinar</span>
      </div>
    </div>
    <div class="bnote">◆ A gente <b>desenha juntos</b>: número de pessoas, produtos em destaque e o modelo de patrocínio. Assim a experiência fica incrível pra elas e faz sentido pra marca. ✨</div>
    <p class="fineprint">Proposta de parceria de marca — valores e formato definidos em conjunto entre Elarah, o patrocinador (Sephora) e as marcas em destaque (ex.: Laura Mercier). Sujeita a confirmação de patrocínio, número de participantes e disponibilidade de agenda. Possibilidade de realização sem custo para o grupo mediante parceria fechada.</p>
    {foot("Investimento")}
  </section>'''

m_prox = proximos(
    "◆ Vamos desenhar juntos? ✨",
    "É só <em>começar</em>",
    "Me conta quantas pessoas e a data que vocês pensam, que a gente desenha o formato da parceria e alinha o patrocínio pra deixar tudo redondo. Qualquer dúvida, é só chamar. 💄",
    [("Contem pra gente", "Número de pessoas, data e o que imaginam."),
     ("Desenhamos a parceria", "A gente alinha patrocínio, produtos e formato."),
     ("É só brilhar", "No dia, chega tudo pronto. Vocês só aproveitam.")],
    "Próximos passos")

write("automaquiagem-parceria", [m_cover, m_exp, m_vibe, m_inv, m_prox])

print("== todos os 4 decks gerados ==")
