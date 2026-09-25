# Proposta Elarah · Aniversario Adriana · ate 20 pessoas · 07/11 · SP (Vila Madalena/Vila Romana/Pinheiros)
# Mesmo modelo do deck da Fernanda (base Ginger): capa igual, paleta terracota/vinho, layout editorial.
# 5 experiencias mao na massa (Tufting -> Flores/Arranjos). 3 espacos: Agora Intu, Raus Cafe, Sterna (sem "ate 16 pessoas").
# Slide de adicional: registro fotografico. Investimento no padrao Elarah — valores sob consulta (nao inventar).
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
  /* 5 experiencias (3 + 2 centralizados) */
  .mmg{display:flex;flex-wrap:wrap;justify-content:center;gap:18px;margin-top:20px}
  .mm{width:calc(33.333% - 12px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 36px -26px rgba(0,0,0,.34)}
  .mm .mmph{height:196px;overflow:hidden;background:#eee}
  .mm .mmph img{width:100%;height:100%;object-fit:cover;display:block}
  .mm .mmb{padding:14px 17px 16px}
  .mm .mmn{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy);line-height:1.05}
  .mm .mmd{font-size:11.5px;color:var(--muted);line-height:1.45;margin-top:6px}
  /* espacos (3 cards) */
  .vg{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:18px}
  .vc{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 14px 32px -26px rgba(0,0,0,.3)}
  .vc .vcph{height:168px;overflow:hidden;background:#eee}
  .vc .vcph img{width:100%;height:100%;object-fit:cover;display:block}
  .vc .vcb{padding:14px 17px 16px}
  .vc .vcn{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy);line-height:1.05}
  .vc .vcbairro{font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--orange-dark);font-weight:700;margin-top:4px}
  .vc .vcd{font-size:11px;color:var(--muted);line-height:1.45;margin-top:8px}
  /* investimento padrao Elarah */
  .phero{display:grid;grid-template-columns:.95fr 1.05fr;gap:38px;margin-top:20px;align-items:stretch}
  .pheroph{border-radius:18px;overflow:hidden;border:1px solid var(--line);box-shadow:0 18px 42px -26px rgba(0,0,0,.42);height:410px}
  .pheroph img{width:100%;height:100%;object-fit:cover;display:block}
  .pval{display:flex;flex-direction:column;justify-content:center}
  .pval .pct{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange-dark);font-weight:700}
  .pval .pcons{font-family:'DM Serif Display',serif;font-size:40px;color:var(--navy);line-height:1.02;margin:8px 0 4px}
  .fld{display:flex;gap:26px;margin-top:16px;flex-wrap:wrap}
  .fld .f{border-left:2px solid var(--orange);padding-left:14px}
  .fld .f .fl{font-size:9px;letter-spacing:.13em;text-transform:uppercase;color:var(--orange-dark);font-weight:700}
  .fld .f .fv{font-family:'DM Serif Display',serif;font-size:20px;color:var(--navy);margin-top:3px}
  .pval .pnote{font-size:12px;color:var(--muted);margin-top:16px;line-height:1.55;max-width:44ch}
  /* adicional (bfeat foto) valor */
  .avalpill{align-self:flex-start;margin-top:14px;background:var(--navy);color:#fff;font-family:'DM Serif Display',serif;font-size:22px;padding:8px 18px;border-radius:12px}
  .avalpill small{font-family:-apple-system,sans-serif;font-size:10px;letter-spacing:.06em;text-transform:uppercase;font-weight:700;color:rgba(255,255,255,.8);margin-left:6px}
  /* callout de data */
  .datecall{display:flex;gap:13px;align-items:flex-start;margin-top:16px;background:rgba(184,115,81,.12);border:1px solid rgba(184,115,81,.32);border-radius:14px;padding:14px 20px}
  .datecall .di{font-size:17px;line-height:1.2}
  .datecall p{font-size:12.5px;color:var(--navy);line-height:1.5;margin:0}
  .datecall p b{color:var(--orange-dark)}
  /* proximos */
  .num{font-family:'DM Serif Display',serif;color:var(--orange);font-size:24px;line-height:1}
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


def vc(src, alt, name, bairro, desc, pos="center 50%"):
    return (f'<div class="vc"><div class="vcph">{img(src, alt, pos)}</div>'
            f'<div class="vcb"><div class="vcn">{name}</div><div class="vcbairro">{bairro}</div>'
            f'<div class="vcd">{desc}</div></div></div>')


# ============================ 1 · CAPA (mesma da Fernanda) ============================
cover = f'''
  <section class="slide">
{head_block("Aniversário · mão na massa", "Adriana", "", "São Paulo · 07/11")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Um aniversário no ateliê</span>
        <h1>Um aniversário para <em>criar juntos</em></h1>
        <p class="lead">Uma comemoração para sair do óbvio: colocar a mão na massa, criar alguma coisa juntos, conversar, brindar — e ainda levar pra casa uma lembrança feita por vocês.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>Até 20</b> pessoas</span>
          <span class="chip"><b>07/11</b></span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip">São Paulo</span>
        </div>
      </div>
      <div class="cover-photo">{img("agora-mesa.jpg", "Mesa criativa montada no ateliê, com velas e flores", "center 50%")}</div>
    </div>
    {foot("Aniversário · Adriana")}
  </section>'''

# ============================ 2 · AS EXPERIÊNCIAS ============================
experiencias = f'''
  <section class="slide">
{head_simple("Mão na massa")}
    <span class="eyebrow orange">◆ Cinco caminhos</span>
    <h2>Qual tem <em>mais a cara de vocês?</em></h2>
    <div class="mmg">
      {mm("pinturatacavinho.jpg", "Pintura em taças", "Pintura em taças", "Cada um cria e personaliza a própria taça.", "center 50%")}
      {mm("ceramicamodelagem.jpg", "Modelagem em cerâmica", "Cerâmica", "Argila na mão para modelar uma peça do zero.", "center 50%")}
      {mm("buque.jpg", "Flores e arranjos", "Flores &amp; arranjos", "Cada um monta o próprio arranjo com flores frescas.", "center 50%")}
      {mm("pinturapratoceramica.jpg", "Pintura em cerâmica", "Pintura em cerâmica", "Peças prontas ganham cor e personalidade.", "center 50%")}
      {mm("vela-aromatica-real.jpg", "Velas aromáticas", "Velas aromáticas", "Cada um escolhe os aromas e cria a própria vela.", "center 50%")}
    </div>
    {foot("Cinco experiências")}
  </section>'''

# ============================ 3 · OS ESPAÇOS ============================
espacos = f'''
  <section class="slide">
{head_simple("Onde pode acontecer")}
    <span class="eyebrow orange">◆ Os espaços</span>
    <h2>Escolhemos o espaço de acordo com <em>a experiência</em></h2>
    <p class="lead">Opções na região que vocês preferem — e, se quiserem, a gente também leva a experiência até o local de vocês.</p>
    <div class="vg">
      {vc("agora-grupo.jpg", "Agora Intu", "Agora Intu", "Pinheiros", "Ateliê criativo, ótimo para cerâmica, pintura e experiências manuais.", "center 50%")}
      {vc("yucafe-real.jpg", "Raüs Café", "Raüs Café", "Pinheiros", "Intimista e descontraído, para propostas criativas e sensoriais.", "center 50%")}
      {vc("sterna-painel.webp", "Sterna Faria Lima", "Sterna Faria Lima", "Itaim Bibi", "Café urbano e bem localizado, para workshops e encontros criativos.", "center 50%")}
    </div>
    <div class="bnote" style="margin-top:16px">◆ Também dá pra <b>levar a experiência até vocês</b> — casa, salão do prédio ou outro espaço escolhido por vocês. É só combinar conforme o formato.</div>
    {foot("Onde pode acontecer")}
  </section>'''

# ============================ 4 · INVESTIMENTO ============================
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>O valor da <em>experiência</em></h2>
    <div class="phero">
      <div class="pheroph">{img("agora-mesa.jpg", "Mesa criativa montada no ateliê", "center 50%")}</div>
      <div class="pval">
        <span class="pct">Valor por experiência</span>
        <div class="pcons">Sob consulta</div>
        <div class="fld">
          <div class="f"><div class="fl">Por pessoa</div><div class="fv">a confirmar</div></div>
          <div class="f"><div class="fl">Grupo · até 20</div><div class="fv">a confirmar</div></div>
        </div>
        <p class="pnote">Cada experiência tem um valor por pessoa próprio, que inclui profissional, materiais e estrutura. Confirmamos o valor por pessoa e o total do grupo assim que vocês escolherem a experiência e o número final de convidados.</p>
      </div>
    </div>
    <p class="fineprint">Valores por pessoa definidos conforme a experiência escolhida, o espaço e o número final de convidados (até 20). O espaço pode ter condições próprias de reserva, locação ou consumo, confirmadas conforme o local. Aniversário em 07/11, sujeito à disponibilidade de agenda.</p>
    {foot("Investimento")}
  </section>'''

# ============================ 5 · ADICIONAL · REGISTRO FOTOGRÁFICO ============================
adicional = f'''
  <section class="slide">
{head_simple("Adicional")}
    <span class="eyebrow orange">◆ Pra guardar o dia</span>
    <h2>Registro <em>fotográfico</em></h2>
    <div class="bfeat">
      <div class="bphoto">{img("bfa-grupo2.webp", "Grupo comemorando junto, registro espontâneo", "center 45%")}</div>
      <div class="bbody">
        <span class="btag">Opcional</span>
        <h3>As memórias do aniversário</h3>
        <p style="font-size:13px;color:var(--muted);line-height:1.6;margin-top:12px">Um fotógrafo acompanha a comemoração e registra os melhores momentos — o grupo, as criações e a celebração. Vocês recebem um álbum digital pronto pra compartilhar.</p>
        <div class="avalpill">R$ 450 <small>valor total</small></div>
      </div>
    </div>
    <p class="fineprint">Adicional opcional de registro fotográfico profissional: R$ 450 (valor total), somado à experiência escolhida. Cobertura do encontro e álbum digital entregues após a comemoração.</p>
    {foot("Adicional · registro")}
  </section>'''

# ============================ 6 · PRÓXIMOS PASSOS ============================
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Simples e sob medida</span>
    <h2>Qual delas <em>vocês fariam?</em></h2>
    <p class="lead">Conta pra gente quais <b>2 ou 3 experiências</b> mais chamaram atenção que a gente monta a proposta final:</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="num">01</div><h3>Escolham</h3><p>A experiência e o espaço (ou o local de vocês) que mais combinam com o grupo.</p></div>
      <div class="infocard"><div class="num">02</div><h3>Fechamos o valor</h3><p>Confirmamos o valor por pessoa e o total, conforme a experiência e o número de convidados.</p></div>
      <div class="infocard"><div class="num">03</div><h3>A gente cuida do resto</h3><p>Reservamos a agenda, levamos tudo e organizamos cada detalhe.</p></div>
    </div>
    <div class="datecall">
      <span class="di">✦</span>
      <p>O aniversário é em <b>07/11</b> — assim que definirmos a experiência e o espaço, confirmamos a <b>disponibilidade de agenda</b> e seguimos com a reserva.</p>
    </div>
    <div class="quote" style="margin-top:18px">
      Adriana, me conta quais experiências mais gostaram que a gente segue com a curadoria e o orçamento final. 🧡<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n'
        + cover + experiencias + espacos + investimento + adicional + proximos + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/orcamento-adriana.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
