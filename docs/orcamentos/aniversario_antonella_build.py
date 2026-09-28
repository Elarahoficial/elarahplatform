# Proposta Elarah · Aniversario Antonella · 13 anos · 15 convidadas · outubro (sab/dom) · Mooca
# Experiencia: oficina de escova + presilha (cada convidada personaliza a propria e leva). Comidinhas/bebidas opcionais.
# Local: casa da cliente OU cafe/espaco parceiro. Padrao editorial Elarah aniversario. Paleta blush (jovem, delicada, divertida).
# Fotos reais do banco. NAO ha foto de oficina de escova em acao — usar kit finalizado + meninas criando (representativo).
# Valores NAO confirmados -> estrutura "a confirmar" (nao inventar). Total para 15 quando o valor for definido.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

# paleta blush / rosa delicado
reps = {
    "--orange:#B08D4C;": "--orange:#D96A8E;",
    "--orange-dark:#8A6D34;": "--orange-dark:#B24C6E;",
    "--navy:#12362B;": "--navy:#4A2334;",
    "--navy-soft:#3A5A4E;": "--navy-soft:#7A5866;",
    "--blue-accent:#B08D4C;": "--blue-accent:#D96A8E;",
    "#EFF3EE": "#FCEDF2", "#DCE8E1": "#F6DBE5", "#CBB06E": "#EBA6BE",
    "rgba(176,141,76,.24)": "rgba(217,106,142,.24)",
    "rgba(176,141,76,.26)": "rgba(217,106,142,.28)",
    "rgba(176,141,76,.10)": "rgba(217,106,142,.10)",
    "rgba(18,54,43,.16)": "rgba(74,35,52,.16)",
    "rgba(10,28,22,.86)": "rgba(40,20,28,.86)",
    "rgba(10,28,22,.85)": "rgba(40,20,28,.85)",
    "rgba(10,28,22,.82)": "rgba(40,20,28,.82)",
}
for a, b in reps.items():
    head = head.replace(a, b)

xcss = '''
  .gstrip{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:18px}
  .gstrip figure{margin:0;border-radius:16px;overflow:hidden;position:relative;height:300px;border:1px solid var(--line);box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .gstrip img{width:100%;height:100%;object-fit:cover;display:block}
  .gstrip figcaption{position:absolute;left:0;right:0;bottom:0;padding:24px 13px 11px;color:#fff;font-size:12px;font-weight:600;letter-spacing:.02em;background:linear-gradient(to top,rgba(40,20,28,.85),transparent)}
  /* onde acontece · 2 cards */
  .vg{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}
  .vc{background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 36px -26px rgba(0,0,0,.3)}
  .vc .vcph{height:200px;overflow:hidden;background:#eee}
  .vc .vcph img{width:100%;height:100%;object-fit:cover;display:block}
  .vc .vcb{padding:16px 20px 18px}
  .vc .vcn{font-family:'DM Serif Display',serif;font-weight:400;font-size:20px;color:var(--navy);line-height:1.05}
  .vc .vcd{font-size:12px;color:var(--muted);line-height:1.5;margin-top:8px}
  /* investimento */
  .invhi{display:flex;align-items:baseline;gap:12px;margin-top:20px;flex-wrap:wrap}
  .invhi .il{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange-dark);font-weight:700}
  .invhi .iv{font-family:'DM Serif Display',serif;font-size:30px;color:var(--navy);line-height:1}
  .invhi .iv em{font-style:italic;color:var(--navy-soft);font-size:22px}
  .invcards{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}
  .ic2{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px 22px;box-shadow:0 12px 30px -24px rgba(0,0,0,.24)}
  .ic2 .icn{font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--orange-dark);font-weight:700}
  .ic2 .icv{font-family:'DM Serif Display',serif;font-size:22px;color:var(--navy);margin-top:5px}
  .ic2 .icv em{font-style:italic;color:var(--navy-soft);font-size:18px}
  .ic2 .ics{font-size:11px;color:var(--muted);margin-top:4px;line-height:1.4}
  /* proximos */
  .steps3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
  .stp{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px 20px 20px;box-shadow:0 12px 30px -22px rgba(0,0,0,.24)}
  .stp .num{font-family:'DM Serif Display',serif;color:var(--orange);font-size:24px;line-height:1}
  .stp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:16px;color:var(--navy);line-height:1.1;margin:7px 0 5px}
  .stp p{font-size:11.5px;color:var(--muted);line-height:1.5;margin:0}
  /* comparativo de 2 experiencias */
  .cpg{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:18px;align-items:start}
  .cpc{background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 16px 36px -26px rgba(0,0,0,.3);display:flex;flex-direction:column}
  .cpc .cpph{height:170px;overflow:hidden;background:#eee}
  .cpc .cpph img{width:100%;height:100%;object-fit:cover;display:block}
  .cpc .cpb{padding:16px 20px 18px}
  .cpc .cptag{font-size:8.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--orange-dark);font-weight:700}
  .cpc .cpn{font-family:'DM Serif Display',serif;font-weight:400;font-size:20px;color:var(--navy);line-height:1.06;margin:4px 0 0}
  .cpc .cpdur{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--navy-soft);font-weight:700;margin-top:6px}
  .cpc .cpd{font-size:11.5px;color:var(--muted);line-height:1.45;margin-top:9px}
  .cpc ul.cpi{list-style:none;margin:11px 0 0;padding:0;display:flex;flex-direction:column;gap:5px}
  .cpc ul.cpi li{position:relative;padding-left:18px;font-size:10.5px;color:var(--ink);line-height:1.35}
  .cpc ul.cpi li:before{content:"✓";position:absolute;left:0;top:0;color:var(--orange);font-size:9px;font-weight:800}
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


# ============================ 1 · CAPA ============================
cover = f'''
  <section class="slide">
{head_block("Aniversário · 13 anos", "Antonella", "", "São Paulo · outubro")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Um aniversário para criar</span>
        <h1>A festa da <em>Antonella</em> 🎀</h1>
        <p class="lead">Um encontro entre amigas para criar, se divertir e levar pra casa uma lembrança feita à mão. Cada convidada personaliza a própria <b>escova &amp; presilha</b> — do jeitinho dela.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>13</b> anos</span>
          <span class="chip"><b>15</b> convidadas</span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip">Outubro · sábado ou domingo</span>
        </div>
      </div>
      <div class="cover-photo">{img("aniv-infantil.jpg", "Meninas criando juntas em uma festa delicada e florida", "center 40%")}</div>
    </div>
    {foot("Aniversário · Antonella")}
  </section>'''

# ============================ 2 · AS EXPERIÊNCIAS ============================
experiencia = f'''
  <section class="slide">
{head_simple("As experiências")}
    <span class="eyebrow orange">◆ Dois estilos para escolher</span>
    <h2>Qual combina mais <em>com a Antonella?</em></h2>
    <p class="lead">Duas oficinas conduzidas, no mesmo formato — uma mais artística e colorida, outra mais glam e cheia de brilho. Em ambas, cada convidada leva as próprias peças pra casa.</p>
    <div class="cpg">
      <div class="cpc">
        <div class="cpph">{img("pinturatacameninas.jpg", "Meninas pintando e decorando seus acessórios", "center 40%")}</div>
        <div class="cpb">
          <div class="cptag">Pintura &amp; personalização</div>
          <div class="cpn">Customize sua Escova &amp; Presilha</div>
          <div class="cpdur">Duração · 2h</div>
          <div class="cpd">Cada convidada personaliza uma escova de madeira e uma presilha, escolhendo cores, flores, adesivos e detalhes — bem a cara dela.</div>
          <ul class="cpi">
            <li>Oficina conduzida</li>
            <li>1 escova de madeira + 1 presilha por convidada</li>
            <li>Tintas, adesivos e materiais de decoração</li>
            <li>Avental e acessórios</li>
            <li>Peças prontas para levar pra casa</li>
          </ul>
        </div>
      </div>
      <div class="cpc">
        <div class="cpph">{img("piranhapersonalizada.jpg", "Presilhas personalizadas com cristais e iniciais", "center 50%")}</div>
        <div class="cpb">
          <div class="cptag">Personalização com brilho</div>
          <div class="cpn">Piranha &amp; Escova Bedazzled</div>
          <div class="cpdur">Duração · a confirmar</div>
          <div class="cpd">Uma customização glam: cada convidada decora a própria piranha e escova com cristais e a própria inicial, pra deixar tudo ainda mais especial.</div>
          <ul class="cpi">
            <li>Oficina conduzida</li>
            <li>1 piranha + 1 escova por convidada</li>
            <li>Cristais e materiais de customização</li>
            <li>Personalização com a inicial</li>
            <li>Peças prontas para levar pra casa</li>
          </ul>
        </div>
      </div>
    </div>
    {foot("As experiências")}
  </section>'''

# ============================ 3 · A VIBE ============================
vibe = f'''
  <section class="slide">
{head_simple("O que cada uma leva")}
    <span class="eyebrow orange">◆ O que cada uma leva</span>
    <h2>Escova &amp; presilha <em>personalizadas</em></h2>
    <p class="lead">Cores, brilho e detalhes que fazem diferença — cada convidada personaliza a própria escova e a própria presilha e leva pra casa numa caixinha linda.</p>
    <div class="gstrip">
      <figure>{img("lembrancinha-escova.jpg", "Escova personalizada com o nome e presilha de flor", "center 50%")}<figcaption>A escova personalizada</figcaption></figure>
      <figure>{img("piranhapersonalizada.jpg", "Presilhas personalizadas com nomes e brilhos", "center 50%")}<figcaption>As presilhas de cada uma</figcaption></figure>
      <figure>{img("nivergibrinde.jpg", "Kit de escova e presilha em caixinha rosa", "center 50%")}<figcaption>Numa caixinha linda</figcaption></figure>
    </div>
    <div class="bnote" style="margin-top:16px">◆ Cada peça é personalizada com o <b>nome</b> e os detalhes preferidos de cada convidada — brilhos, cores e aquele toque delicado. 🎀</div>
    {foot("O que cada uma leva")}
  </section>'''

# ============================ 4 · ONDE ACONTECE ============================
espacos = f'''
  <section class="slide">
{head_simple("Onde acontece")}
    <span class="eyebrow orange">◆ Onde comemorar</span>
    <h2>Na sua casa ou em um <em>espaço parceiro</em></h2>
    <p class="lead">A festa acontece onde for mais gostoso para vocês — em casa ou em um café/espaço parceiro na região da Mooca.</p>
    <div class="vg">
      <div class="vc"><div class="vcph">{img("aniv-decor.jpg", "Mesa montada em casa, delicada e colorida", "center 50%")}</div><div class="vcb"><div class="vcn">Na casa de vocês 🏡</div><div class="vcd">A Elarah leva tudo e monta a experiência aí mesmo — vocês só recebem as amigas.</div></div></div>
      <div class="vc"><div class="vcph">{img("sowcafe.jpg", "Café aconchegante para a comemoração", "center 50%")}</div><div class="vcb"><div class="vcn">Café ou espaço parceiro ☕</div><div class="vcd">Selecionamos um café ou espaço acolhedor na região da Mooca, conforme a preferência.</div></div></div>
    </div>
    <div class="bnote" style="margin-top:16px">◆ É só nos contar o que preferem que a gente cuida da curadoria do espaço e de toda a produção. 🎀</div>
    {foot("Onde acontece")}
  </section>'''

# ============================ 5 · COMIDINHAS & BEBIDAS ============================
comidinhas = f'''
  <section class="slide">
{head_simple("Comidinhas & bebidas")}
    <span class="eyebrow orange">◆ Pra deixar mais gostoso</span>
    <h2>Docinhos, comidinhas <em>e bebidas</em></h2>
    <p class="lead">Dá pra somar uma mesa de comidinhas e bebidas pra deixar a celebração ainda mais especial — tudo opcional, do jeitinho que vocês quiserem.</p>
    <div class="gstrip">
      <figure>{img("cupcake.jpg", "Cupcakes decorados", "center 50%")}<figcaption>Cupcakes &amp; bolo</figcaption></figure>
      <figure>{img("macarons.jpg", "Macarons coloridos", "center 50%")}<figcaption>Doces &amp; macarons</figcaption></figure>
      <figure>{img("brigadeirolab.jpg", "Brigadeiros", "center 50%")}<figcaption>Brigadeiros</figcaption></figure>
    </div>
    <div class="bnote" style="margin-top:16px">◆ E também <b>bebidas</b>: sucos naturais, limonadas e drinks sem álcool pra brindar a festa. Cardápio e valores combinados conforme a escolha de vocês. 🍓</div>
    {foot("Comidinhas & bebidas")}
  </section>'''

# ============================ 6 · INVESTIMENTO ============================
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>O valor da <em>festa</em></h2>
    <p class="lead">Cada experiência tem um valor por convidada, que inclui a condução, as peças de cada uma e todos os materiais. O total acompanha o número final de convidadas.</p>
    <div class="invhi">
      <span class="il">Duas experiências · escolham o estilo</span>
      <span class="iv"><em>valores a confirmar</em></span>
    </div>
    <div class="invcards">
      <div class="ic2"><span class="icn">Opção 1 · Pintura &amp; personalização</span><div class="icv">Customize sua Escova &amp; Presilha</div><div class="ics"><em>Valor por convidada a confirmar</em> · condução, escova e presilha e materiais inclusos.</div></div>
      <div class="ic2"><span class="icn">Opção 2 · Personalização com brilho</span><div class="icv">Piranha &amp; Escova Bedazzled</div><div class="ics"><em>Valor por convidada a confirmar</em> · condução, piranha e escova, cristais e inicial inclusos.</div></div>
    </div>
    <div class="bnote" style="margin-top:16px">◆ <b>Estimativa em confirmação.</b> Fechamos o valor por convidada de cada experiência e o total para as 15 assim que confirmarmos o espaço (casa ou parceiro), a data e as comidinhas/bebidas — antes de fechar a proposta com vocês.</div>
    <p class="fineprint">Aniversário de 13 anos da Antonella, para 15 convidadas, em outubro (sábado ou domingo), em São Paulo (região da Mooca). Valor por convidada e total confirmados após a definição do espaço, da data e dos opcionais de comidinhas e bebidas.</p>
    {foot("Investimento")}
  </section>'''

# ============================ 7 · PRÓXIMOS PASSOS ============================
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Bora comemorar? 🎀</span>
    <h2>É só <em>reunir as amigas</em></h2>
    <p class="lead">A gente cuida de tudo pra Antonella e as amigas só chegarem e aproveitarem:</p>
    <div class="steps3">
      <div class="stp"><span class="num">01</span><h3>Escolhem</h3><p>O espaço (casa ou parceiro), a data e as comidinhas que quiserem.</p></div>
      <div class="stp"><span class="num">02</span><h3>Confirmamos</h3><p>O valor por convidada, o total e a disponibilidade da agenda.</p></div>
      <div class="stp"><span class="num">03</span><h3>A gente monta tudo</h3><p>Levamos os materiais, montamos e conduzimos a oficina — do começo ao fim.</p></div>
    </div>
    <div class="quote" style="margin-top:22px">
      <strong style="font-family:'DM Serif Display',serif;font-weight:400;font-size:22px;color:var(--navy);display:block;margin-bottom:8px">Vamos deixar essa festa inesquecível? 🎀</strong>
      Nos conta o espaço e a data que a gente confirma os valores e organiza cada detalhe.<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n'
        + cover + experiencia + vibe + espacos + comidinhas + investimento + proximos + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/aniversario-antonella.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
