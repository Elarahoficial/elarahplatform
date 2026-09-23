# Proposta Elarah · Aniversario · 13/12 · no espaco Elarah
# Yoga (10 adultos) + Ceramica (8 criancas) SIMULTANEOS + Brunch (todos).
# Precos ao cliente ja com margem de 20% (preco = custo / 0,8, arredondado p/ cima):
#   Brunch Op1 custo 755 -> 950 | Op2 custo 414 -> 520 | Op3 custo 350 -> 440 | Ceramica+Yoga custo 1750 -> 2200
# Atualizado: Brunch R$ 59/39/29 por pessoa (1.062/702/522) | Experiencia 2.339
# Reaproveita base/componentes Elarah (head/tail, .bfeat, .exp3/.exc, .tiers/.tier).
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

xcss = '''
  /* cards de experiencia */
  .exp3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:22px}
  .exc{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:0 14px 32px -24px rgba(0,0,0,.3);display:flex;flex-direction:column}
  .exc figure{margin:0;height:172px;overflow:hidden;position:relative}
  .exc figure img{width:100%;height:100%;object-fit:cover;display:block}
  .exc .exb{padding:16px 18px 18px;display:flex;flex-direction:column;flex:1}
  .exc .exn{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .exc h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:20px;color:var(--navy);margin:4px 0 6px;line-height:1.06}
  .exc p{font-size:12px;color:var(--muted);line-height:1.5}
  /* brunch · 3 opcoes (tiers) */
  .tiers{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:20px}
  .tier{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:22px 18px 20px;display:flex;flex-direction:column;box-shadow:0 14px 32px -22px rgba(0,0,0,.32);position:relative}
  .tier.hl{border:2px solid var(--navy)}
  .tier .tname{font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .tier .tprice{font-family:'DM Serif Display',serif;font-size:31px;color:var(--navy);margin:8px 0 1px;line-height:1}
  .tier .tunit{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;font-weight:600;margin-bottom:2px;line-height:1.3}
  .tier .tnote{font-size:9.5px;color:var(--muted);font-weight:600;letter-spacing:.02em;margin:0 0 13px}
  .bfeat .bphoto.bphoto-duo{display:grid;grid-template-columns:1fr 1fr;gap:3px;background:var(--line)}
  .bphoto-duo .bpd{position:relative;overflow:hidden}
  .bphoto-duo .bpl{position:absolute;left:0;right:0;bottom:0;z-index:2;color:#fff;font-size:9.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:22px 11px 9px;background:linear-gradient(to top,rgba(10,28,22,.85),transparent)}
  .tier ul{list-style:none;display:flex;flex-direction:column;gap:7px;margin-top:2px}
  .tier ul li{position:relative;padding-left:18px;font-size:11.5px;color:var(--ink);line-height:1.3}
  .tier ul li::before{content:"\\2726";position:absolute;left:0;top:1px;color:var(--orange);font-size:10px}
  .tier .tag{position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:var(--navy);color:#fff;font-size:8.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:4px 13px;border-radius:999px;white-space:nowrap}
  /* investimento */
  .invhero{display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;background:var(--navy);color:#fff;border-radius:20px;padding:26px 34px;margin-top:22px}
  .invhero .il{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--orange);font-weight:700}
  .invhero .id{font-size:12px;color:rgba(255,255,255,.82);margin-top:6px;line-height:1.5}
  .invhero .iv{font-family:'DM Serif Display',serif;font-size:44px;line-height:1;text-align:right}
  .invhero .iv small{display:block;font-family:'DM Sans',sans-serif;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.72);font-weight:600;margin-top:6px}
  .brunchrow{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:16px}
  .bopt{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px;text-align:center}
  .bopt .bn{font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--orange-dark);font-weight:700}
  .bopt .bv{font-family:'DM Serif Display',serif;font-size:23px;color:var(--navy);margin-top:5px}
  .bopt .bs{font-size:8.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;font-weight:600;margin-top:3px}
  .invtot{margin-top:16px;font-size:14px;color:var(--ink);line-height:1.55}
  .invtot b{color:var(--navy);font-family:'DM Serif Display',serif;font-size:16px}
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


def excard(n, src, alt, name, desc, pos="center 50%"):
    return (f'<div class="exc"><figure>{img(src, alt, pos)}</figure>'
            f'<div class="exb"><span class="exn">{n}</span><h3>{name}</h3><p>{desc}</p></div></div>')


def brunch(nome, pp, total, itens, hl=False, tag=None):
    tagh = f'<span class="tag">{tag}</span>' if tag else ''
    lis = "".join(f"<li>{i}</li>" for i in itens)
    cls = "tier hl" if hl else "tier"
    return (f'<div class="{cls}">{tagh}<span class="tname">{nome}</span>'
            f'<span class="tprice">R$ {pp}</span><span class="tunit">por pessoa</span>'
            f'<span class="tnote">R$ {total} no total · 18 pessoas</span>'
            f'<ul>{lis}</ul></div>')


# ============================ 1 · CAPA ============================
cover = f'''
  <section class="slide">
{head_block("Proposta de experiência · Aniversário", "Aniversário", "13/12", "No espaço Elarah")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Aniversário · 13 de dezembro</span>
        <h1>Uma manhã para celebrar <em>com leveza</em></h1>
        <p class="lead">Um aniversário diferente e especial: <strong>yoga</strong> para os adultos, <strong>cerâmica</strong> para as crianças e um <strong>brunch</strong> para reunir todo mundo à mesa. 🧡</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>13/12</b></span>
          <span class="chip"><b>10 adultos</b> + <b>8 crianças</b></span>
          <span class="chip">No espaço <b>Elarah</b></span>
          <span class="chip">Rua Martim Pescador, <b>170</b></span>
          <span class="chip">Jardim <b>Anália Franco</b></span>
          <span class="chip">Yoga · Cerâmica · Brunch</span>
        </div>
      </div>
      <div class="cover-photo">{img("aniv-yoga-capa-mesa.jpg", "Mesa de aniversário montada com flores rosa e cadeiras com aventais rosa", "center 40%")}</div>
    </div>
    {foot("Aniversário · 13 de dezembro")}
  </section>'''

# ============================ 2 · COMO FUNCIONA ============================
como = f'''
  <section class="slide">
{head_simple("Como funciona")}
    <span class="eyebrow orange">◆ A ideia do dia</span>
    <h2>Dois momentos, uma <em>celebração</em></h2>
    <p class="lead">Uma manhã pensada para todo mundo aproveitar: adultos e crianças vivem experiências diferentes <b>ao mesmo tempo</b> e se encontram no brunch para celebrar juntos.</p>
    <div class="bfeat">
      <div class="bphoto bphoto-duo"><div class="bpd">{img("yoga-momento.jpg", "Momento de yoga dos adultos", "center 50%")}<span class="bpl">Adultos · Yoga</span></div><div class="bpd">{img("ceramica-kids.jpg", "Crianças modelando cerâmica", "center 55%")}<span class="bpl">Crianças · Cerâmica</span></div></div>
      <div class="bbody">
        <span class="btag">O ritmo da manhã</span>
        <h3>Cada um no seu momento</h3>
        <ul class="feat">
          <li><span class="st">1</span><b>Ao mesmo tempo</b> — enquanto os adultos fazem yoga, as crianças criam na cerâmica.</li>
          <li><span class="st">2</span><b>Tudo conduzido</b> — duas experiências guiadas por profissionais, com todo o material incluso.</li>
          <li><span class="st">3</span><b>Brunch para celebrar</b> — no fim, todos se reúnem à mesa para um brunch especial.</li>
        </ul>
      </div>
    </div>
    {foot("Como funciona")}
  </section>'''

# ============================ 3 · AS EXPERIÊNCIAS ============================
experiencias = f'''
  <section class="slide">
{head_simple("As experiências")}
    <span class="eyebrow orange">◆ O que acontece</span>
    <h2>Uma experiência para <em>cada grupo</em></h2>
    <p class="lead">Adultos e crianças aproveitam ao mesmo tempo — e todos se encontram no brunch para celebrar juntos.</p>
    <div class="exp3">
      {excard("Para os adultos", "yoga-real.jpg", "Duas mulheres praticando yoga ao ar livre", "Yoga · 10 adultos", "Uma prática leve e relaxante para começar a manhã com calma e bem-estar.", "center 45%")}
      {excard("Para as crianças", "aniv-infantil.jpg", "Crianças pintando e criando peças de cerâmica", "Cerâmica · 8 crianças", "As crianças criam e pintam a própria peça, com condução e todo o material — ao mesmo tempo do yoga.", "center 40%")}
      {excard("Para todos", "brunch-office1.jpg", "Mesa de brunch com pães, bolos e frutas", "Brunch · todos juntos", "Depois das experiências, todo mundo se reúne à mesa para um brunch gostoso e celebrar.", "center 50%")}
    </div>
    {foot("As experiências")}
  </section>'''


# ============================ 3.5 · A VIBE ============================
vibe = f'''
  <section class="slide">
{head_simple("A vibe")}
    <span class="eyebrow orange">◆ A vibe do dia</span>
    <h2>Uma manhã leve e <em>cheia de vida</em></h2>
    <p class="lead">Relaxar, criar, brincar e celebrar — cada momento com o seu clima, e todos juntos no brunch para fechar o dia com carinho. 🧡</p>
    <div class="vibe">
      <figure>{img("encontro-1.jpg", "Amigas rindo durante a aula de yoga", "20% 25%")}<figcaption>Respirar e relaxar</figcaption></figure>
      <figure>{img("aniv-yoga-maozinhas-argila.jpg", "Mãozinhas de criança modelando argila", "center 40%")}<figcaption>Mãozinhas na argila</figcaption></figure>
      <figure>{img("aniv-yoga-criar-sem-pressa.jpg", "Criança pintando a própria caneca de cerâmica", "center 45%")}<figcaption>Criar sem pressa</figcaption></figure>
      <figure>{img("aniv-yoga-brunch-mesa.jpg", "Mesa de brunch com flores, frutas e quitutes", "center 55%")}<figcaption>Brunch caprichado</figcaption></figure>
      <figure>{img("aniv-yoga-quitutes.jpg", "Cestas de pães, croissants e bolos da manhã", "center 60%")}<figcaption>Quitutes da manhã</figcaption></figure>
      <figure>{img("capa-aniversario.jpg", "Momento feliz de celebração à mesa", "center 30%")}<figcaption>Hora de celebrar</figcaption></figure>
    </div>
    {foot("A vibe da experiência")}
  </section>'''

# ============================ 4 · BRUNCH — 3 OPÇÕES ============================
brunch_slide = f'''
  <section class="slide">
{head_simple("O brunch")}
    <span class="eyebrow orange">◆ Escolham o brunch</span>
    <h2>Três opções de <em>brunch</em></h2>
    <p class="lead">Três cardápios para reunir todo mundo à mesa — é só escolher o que mais combina com a comemoração. 🥐</p>
    <div class="tiers">
      {brunch("Opção 1", "59", "1.062", ["Mini lanche natural", "Pão de queijo", "3 bolos", "Waffle", "Requeijão &amp; geleia", "Suco &amp; café"], hl=True, tag="Mais completo")}
      {brunch("Opção 2", "39", "702", ["Pão italiano", "Pão de queijo", "Waffle", "3 bolos", "Requeijão &amp; geleia", "Suco &amp; café"])}
      {brunch("Opção 3", "29", "522", ["Pão de queijo", "3 bolos", "Salada de frutas", "Suco &amp; café"])}
    </div>
    <p class="fineprint">Valores diluídos por pessoa, considerando 18 participantes (10 adultos + 8 crianças); o total de cada opção está indicado em cada card. Cardápios podem ter pequenos ajustes conforme disponibilidade. A escolha do brunch soma-se ao valor da experiência (próximo slide).</p>
    {foot("O brunch")}
  </section>'''

# ============================ 5 · INVESTIMENTO ============================
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>O investimento da <em>celebração</em></h2>
    <p class="lead">A experiência completa para os dois grupos, mais o brunch da opção que vocês escolherem.</p>
    <div class="invhero">
      <div>
        <span class="il">A experiência</span>
        <div class="id">Cerâmica para <b style="color:#fff">8 crianças</b> + Yoga para <b style="color:#fff">10 adultos</b><br>condução, materiais e produção Elarah inclusos</div>
      </div>
      <div class="iv">R$ 2.339<small>valor fechado da experiência</small></div>
    </div>
    <div class="brunchrow">
      <div class="bopt"><div class="bn">+ Brunch · Opção 3</div><div class="bv">R$ 522</div><div class="bs">no total</div></div>
      <div class="bopt"><div class="bn">+ Brunch · Opção 2</div><div class="bv">R$ 702</div><div class="bs">no total</div></div>
      <div class="bopt"><div class="bn">+ Brunch · Opção 1</div><div class="bv">R$ 1.062</div><div class="bs">no total</div></div>
    </div>
    <p class="invtot">Com o brunch escolhido, o investimento total fica entre <b>R$ 2.861</b> e <b>R$ 3.401</b>, conforme a opção.</p>
    <p class="fineprint">Experiência para 8 crianças (cerâmica) e 10 adultos (yoga), no espaço Elarah (Rua Martim Pescador, 170 · Jardim Anália Franco), em 13/12. Inclui condução profissional, materiais e produção. O brunch é somado conforme a opção escolhida. Data e detalhes finais a confirmar.</p>
    {foot("Investimento")}
  </section>'''

# ============================ 6 · PRÓXIMOS PASSOS ============================
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Vamos celebrar? 🧡</span>
    <h2>É só <em>combinar</em></h2>
    <p class="lead">Escolham a opção de brunch e confirmem a data — a Elarah cuida de toda a produção: yoga, cerâmica e o brunch prontinhos no dia.</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico" style="font-family:'DM Serif Display',serif;color:var(--orange-dark)">01</div><h3>Escolham</h3><p>A opção de brunch e confirmam o dia 13/12.</p></div>
      <div class="infocard"><div class="ico" style="font-family:'DM Serif Display',serif;color:var(--orange-dark)">02</div><h3>Reservamos</h3><p>A gente organiza o yoga, a cerâmica e o brunch para vocês.</p></div>
      <div class="infocard"><div class="ico" style="font-family:'DM Serif Display',serif;color:var(--orange-dark)">03</div><h3>É só celebrar</h3><p>No dia, chega tudo pronto. Vocês só aproveitam. 🧡</p></div>
    </div>
    <div class="quote">
      <strong style="font-family:'DM Serif Display',serif;font-weight:400;font-size:22px;color:var(--navy);display:block;margin-bottom:8px">Uma manhã para ficar na memória ✦</strong>
      Qualquer ajuste no cardápio ou na programação, a gente adapta com carinho.<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n'
        + cover + como + experiencias + vibe + brunch_slide + investimento + proximos
        + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/experiencia-aniversario-yoga-ceramica-brunch.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
