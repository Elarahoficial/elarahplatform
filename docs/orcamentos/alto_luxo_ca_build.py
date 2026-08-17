# Proposta alto luxo (Ca) — dois encontros: Cerâmica Autoral (6 amigas, R$239) e
# Degustação Grandes Tintos Italianos (8 lojistas, R$459). Cada experiência sobe
# nos mesmos 3 planos: Essencial / +Foto&Coffee (+150) / +Decoração (+100).
# Paleta champagne-dourado + vinho.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
base = open(S + "/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

# ---- recolor: champagne/ouro + vinho + creme (alto luxo) ----
head = head.replace("--orange:#F27623;", "--orange:#A9884E;")       # accent ouro velho
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#856A3A;")
head = head.replace("--navy:#16233C;", "--navy:#3B1F2B;")           # vinho profundo (títulos)
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#6B5058;")
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#A9884E;")
head = head.replace("#EDF1F7", "#F6F0E8").replace("#DCE5F1", "#ECE0D0")
head = head.replace("#FF9A4D", "#C9A96A")
head = head.replace("rgba(242,118,35,.22)", "rgba(169,136,78,.26)")

extra = '''
  /* menu de experiências (2 col) */
  .menu{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;margin-top:14px}
  .exp{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 14px 32px -22px rgba(0,0,0,.28)}
  .exp-photo{height:214px;overflow:hidden;background:#eee}
  .exp-photo img{width:100%;height:100%;object-fit:cover}
  .exp-body{padding:17px 20px 19px}
  .exp .n{display:inline-block;font-size:9px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:6px}
  .exp .who{float:right;font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;font-weight:700;color:var(--navy-soft);background:#F6F0E8;border-radius:999px;padding:4px 11px;margin-top:-2px}
  .exp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:21px;color:var(--navy);line-height:1.06}
  .exp p{font-size:12.5px;color:var(--muted);margin-top:7px;line-height:1.5}
  .exp .from{display:inline-block;margin-top:11px;font-size:12px;color:var(--navy);font-weight:600}
  .exp .from b{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px}
  /* tabela de investimento (2 experiências x 3 planos) */
  .itable{width:100%;border-collapse:collapse;margin-top:18px;font-family:'DM Sans'}
  .itable th,.itable td{padding:16px 14px;border-bottom:1px solid var(--line);text-align:center;vertical-align:middle}
  .itable thead th{font-size:12.5px;color:var(--navy);font-weight:700;border-bottom:2px solid var(--navy);text-transform:uppercase;letter-spacing:.04em}
  .itable thead th span{display:block;font-size:9.5px;font-weight:600;color:var(--orange-dark);letter-spacing:.06em;margin-top:5px;text-transform:uppercase}
  .itable td.rl{text-align:left;width:40%}
  .itable td.rl b{font-family:'DM Serif Display',serif;font-weight:400;font-size:19px;color:var(--navy)}
  .itable td.rl span{display:block;font-size:11px;color:var(--muted);margin-top:3px;line-height:1.4}
  .itable .val{font-family:'DM Serif Display',serif;font-size:27px;color:var(--navy);line-height:1;white-space:nowrap}
  .itable .val small{font-family:'DM Sans';display:block;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-weight:600;margin-top:4px}
  .itable tbody tr.hl td{background:#F6F0E8}
  .itable tbody tr:last-child td{border-bottom:none}
  .itable .pill{display:block;width:-moz-fit-content;width:fit-content;margin:8px 0 5px;background:var(--navy);color:#fff;font-size:8.5px;letter-spacing:.09em;padding:4px 13px;border-radius:999px;font-weight:700;text-transform:uppercase;text-align:center}
  .fineprint{font-size:10px;color:var(--muted);line-height:1.5;margin-top:16px}
  /* galeria vibe */
  .vibe{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
  .vibe figure{margin:0;border-radius:16px;overflow:hidden;position:relative;aspect-ratio:3/4;box-shadow:0 16px 36px -24px rgba(0,0,0,.34)}
  .vibe img{width:100%;height:100%;object-fit:cover;display:block}
  .vibe figcaption{position:absolute;left:0;right:0;bottom:0;padding:28px 14px 13px;color:#fff;font-size:12.5px;font-weight:600;background:linear-gradient(to top,rgba(30,14,20,.82),transparent)}
</style>'''
head = head.replace("</style>", extra, 1)

# ---- PDF: sombras borradas viram bloco cinza em leitores iOS — troca por bordas ----
head = head.replace(
    "    @page{size:A4 portrait;margin:0}",
    "    .slide *{box-shadow:none !important}\n"
    "    .cover-photo,.exp-photo,.vibe figure{border:1px solid rgba(59,31,43,.14)}\n"
    "    .menu{grid-template-columns:repeat(2,1fr)}\n"
    "    .vibe{grid-template-columns:repeat(3,1fr)}\n"
    "    @page{size:A4 portrait;margin:0}", 1)
head = head.replace(".plans{grid-template-columns:1fr}",
                    ".plans{grid-template-columns:1fr}\n    .menu{grid-template-columns:1fr}\n    .vibe{grid-template-columns:1fr 1fr}")


def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'


cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right">
        <span class="kicker">Proposta de experiências · alto luxo</span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiências alto luxo · turma privada</span>
        <h1>Encontros <em>memoráveis</em></h1>
        <p class="lead">Para os seus dois grupos, duas experiências sofisticadas e sensoriais — pensadas nos mínimos detalhes. <strong>A gente leva tudo até vocês</strong>: o profissional, o material fino e a estrutura. Cada convidada vive (e leva) algo único. 🌿</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>6 amigas</b> · Cerâmica Autoral</span>
          <span class="chip"><b>8 lojistas</b> · Grandes Tintos</span>
          <span class="chip">Turma <b>privada</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/cover-corp.jpg" alt="Convidadas num encontro Elarah elegante e sensorial" style="object-position:center 40%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Experiências já realizadas para grupos como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)</div>
    {foot("Experiências alto luxo")}
  </section>'''

buscamos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O conceito</span></div>
    </div>
    <span class="eyebrow orange">◆ Sofisticado do começo ao fim</span>
    <h2>Uma experiência <em>alto luxo</em></h2>
    <p class="lead">Mais que um encontro: uma vivência sensorial, elegante e exclusiva — do tipo que encanta amigas e clientes na mesma medida. Turma privada, no lugar que vocês escolherem, com tudo pronto.</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">🌿</div><h3>Sensorial e exclusiva</h3><p>Aromas, texturas e sabores conduzidos por especialistas — uma imersão de verdade.</p></div>
      <div class="infocard"><div class="ico">🥂</div><h3>Sob medida</h3><p>Cada grupo com a sua experiência: cerâmica para as amigas, grandes tintos para as lojistas.</p></div>
      <div class="infocard"><div class="ico">💝</div><h3>Lembrança fina</h3><p>Cada convidada leva pra casa a peça (ou a memória) — a assinatura do encontro.</p></div>
    </div>
    <div class="quote">
      <i>"O luxo está no detalhe — e no tempo bem vivido."</i><br>
      — É isso que a Elarah leva: um encontro que vira <strong>história pra contar</strong>.
    </div>
    {foot("O conceito")}
  </section>'''

menu = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">As experiências</span></div>
    </div>
    <span class="eyebrow orange">◆ As duas escolhidas</span>
    <h2>Uma para cada <em>encontro</em></h2>
    <p class="lead">Duas experiências que combinam elegância e mão na massa — cada uma pensada para o seu grupo. Os valores completos estão na próxima página.</p>
    <div class="rule"></div>
    <div class="menu">
      <div class="exp"><div class="exp-photo"><img src="assets/ceramicamodelagem.jpg" alt="Cerâmica autoral sendo modelada à mão" style="object-position:center 50%"></div>
        <div class="exp-body"><span class="who">6 amigas</span><span class="n">01 · Cerâmica</span><h3>Cerâmica Autoral</h3>
        <p>Mão na argila: cada convidada modela a própria peça, com acompanhamento de uma ceramista — e leva a arte pra casa.</p>
        <span class="from">a partir de <b>R$ 239</b> /pessoa</span></div></div>
      <div class="exp"><div class="exp-photo"><img src="assets/vinhotintos.jpg" alt="Degustação de grandes vinhos tintos italianos" style="object-position:center 42%"></div>
        <div class="exp-body"><span class="who">8 lojistas</span><span class="n">02 · Degustação</span><h3>Grandes Tintos Italianos</h3>
        <p>Uma degustação guiada por sommelier pelos grandes tintos da Itália, com harmonização — sensorial, elegante e envolvente.</p>
        <span class="from">a partir de <b>R$ 459</b> /pessoa</span></div></div>
    </div>
    {foot("As experiências")}
  </section>'''

invest = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ Valores por pessoa</span>
    <h2>Escolham o <em>plano</em></h2>
    <p class="lead">Cada experiência tem três formatos — do essencial ao completo. É só escolher o quão especial querem cada encontro:</p>
    <div class="rule"></div>
    <table class="itable">
      <thead><tr>
        <th class="rl">Plano</th>
        <th>Cerâmica Autoral<span>6 amigas</span></th>
        <th>Grandes Tintos<span>8 lojistas</span></th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="rl"><b>Essencial</b><span>A experiência + material, condução e deslocamento inclusos.</span></td>
          <td><span class="val">R$ 239<small>/pessoa</small></span></td>
          <td><span class="val">R$ 459<small>/pessoa</small></span></td>
        </tr>
        <tr class="hl">
          <td class="rl"><b>Registro</b><span class="pill">Mais escolhido</span><span>Tudo do Essencial + foto profissional + coffee break.</span></td>
          <td><span class="val">R$ 389<small>/pessoa</small></span></td>
          <td><span class="val">R$ 609<small>/pessoa</small></span></td>
        </tr>
        <tr>
          <td class="rl"><b>Completo</b><span>Tudo do Registro + lembrancinha especial pra cada convidada.</span></td>
          <td><span class="val">R$ 489<small>/pessoa</small></span></td>
          <td><span class="val">R$ 709<small>/pessoa</small></span></td>
        </tr>
      </tbody>
    </table>
    <p class="fineprint">Valores por pessoa, para turma privada (Cerâmica: 6 pessoas · Grandes Tintos: 8 pessoas), com todo o material, condução do especialista e estrutura inclusos. Deslocamento da equipe já incluso. Cada encontro acontece no endereço escolhido por vocês, na data confirmada. Valores sujeitos à confirmação de data e disponibilidade de agenda.</p>
    {foot("Investimento")}
  </section>'''

como = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Próximos passos</span></div>
    </div>
    <span class="eyebrow orange">◆ Vamos reservar?</span>
    <h2>É só alinhar as <em>datas</em></h2>
    <p class="lead">Me manda as datas que você está tentando conciliar para os dois grupos que eu já confirmo a disponibilidade e deixo cada encontro reservado e prontinho. Qualquer dúvida, é só chamar — vai ser um prazer cuidar dos dois. 🥂</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">1️⃣</div><h3>Datas</h3><p>Você me passa as datas dos dois encontros; eu confirmo a agenda.</p></div>
      <div class="infocard"><div class="ico">2️⃣</div><h3>Plano</h3><p>Escolhem o formato de cada experiência (Essencial, Registro ou Completo).</p></div>
      <div class="infocard"><div class="ico">3️⃣</div><h3>É só viver</h3><p>No dia, chega tudo pronto no local. Vocês só aproveitam.</p></div>
    </div>
    <div class="quote">
      <i>Elarah · Experiências criativas</i><br>
      contato@elarah.com.br &nbsp;·&nbsp; <strong>elarah.com.br</strong> &nbsp;·&nbsp; @elarah
    </div>
    {foot("Próximos passos")}
  </section>'''

vibe = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">A vibe</span></div>
    </div>
    <span class="eyebrow orange">◆ O que vocês vão sentir</span>
    <h2>Encontros que viram <em>memória</em></h2>
    <p class="lead">Momentos reais dos nossos encontros: gente junto, taça na mão e mão na massa — leve, elegante e cheio de fotos boas.</p>
    <div class="vibe">
      <figure><img src="assets/vibe-conexao-corp.jpg" alt="Convidadas rindo juntas num encontro Elarah" style="object-position:center 30%"><figcaption>Conexão de verdade</figcaption></figure>
      <figure><img src="assets/corp-criativo.jpg" alt="Convidadas criando lado a lado" style="object-position:center 35%"><figcaption>Mão na massa, junto</figcaption></figure>
      <figure><img src="assets/eventocorporativo.jpg" alt="Mesa de um encontro Elarah, do início ao brinde" style="object-position:center 45%"><figcaption>Do início ao brinde</figcaption></figure>
    </div>
    {foot("A vibe da experiência")}
  </section>'''

deck = '<div class="deck">\n' + cover + buscamos + menu + vibe + invest + como + '\n\n</div>\n\n'
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-alto-luxo-ca.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, len(html), "bytes")
