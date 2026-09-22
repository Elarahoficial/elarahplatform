# Proposta Elarah · BFA (Images Matter) · Modelagem manual em ceramica + coffee break · O Jardim (deck) · 10 pax · 08-10/12
# Base: portfolio_corporativo_jardim (experiencia + espaco + coffee + investimento). Editorial/neutro. Valor-alvo R$5.200 (a confirmar).
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
  .pillars{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:24px}
  .pil{border-top:2px solid var(--orange);padding-top:15px}
  .pil .pn{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--orange-dark);font-weight:700}
  .pil h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:22px;color:var(--navy);line-height:1.08;margin:7px 0 9px}
  .pil p{font-size:12.5px;color:var(--muted);line-height:1.55;margin:0}
  .steps3{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:8px}
  .st3 .sn{font-family:'DM Serif Display',serif;font-size:30px;color:var(--orange);line-height:1}
  .st3 h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy);margin:5px 0 4px;line-height:1.1}
  .st3 p{font-size:11.5px;color:var(--muted);line-height:1.45;margin:0}
  .gstrip{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:18px}
  .gstrip figure{margin:0;border-radius:14px;overflow:hidden;position:relative;height:220px;border:1px solid rgba(38,51,42,.10);box-shadow:0 14px 32px -22px rgba(0,0,0,.4)}
  .gstrip img{width:100%;height:100%;object-fit:cover;display:block}
  .gstrip figcaption{position:absolute;left:0;right:0;bottom:0;padding:22px 12px 10px;color:#fff;font-size:11px;font-weight:600;letter-spacing:.02em;background:linear-gradient(to top,rgba(20,28,22,.82),transparent)}
  .cofrow{display:flex;gap:28px;margin-top:20px;align-items:center;flex-wrap:wrap}
  .cofphoto{flex:0 0 320px;aspect-ratio:4/3;border-radius:16px;overflow:hidden;border:1px solid var(--line);box-shadow:0 16px 36px -24px rgba(0,0,0,.36)}
  .cofphoto img{width:100%;height:100%;object-fit:cover;display:block}
  .checks{flex:1;min-width:300px;display:grid;grid-template-columns:1fr 1fr;gap:11px 26px;margin:0}
  .checks li{list-style:none;position:relative;padding-left:20px;font-size:12.5px;color:var(--ink);line-height:1.35}
  .checks li::before{content:"—";position:absolute;left:0;top:0;color:var(--orange);font-weight:700}
  .priceband{display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;background:var(--navy);color:#fff;border-radius:20px;padding:30px 38px;margin-top:24px}
  .priceband .pl{display:block;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--orange);font-weight:700}
  .priceband .pv{display:block;font-family:'DM Serif Display',serif;font-size:54px;line-height:1;margin-top:8px}
  .priceband .side{font-size:12px;color:rgba(255,255,255,.82);text-align:right;line-height:1.7}
  .nextrow{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:20px}
  .nx{border-top:1.5px solid var(--line);padding-top:13px}
  .nx .nn{font-family:'DM Serif Display',serif;font-size:22px;color:var(--orange)}
  .nx h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:16px;color:var(--navy);margin:5px 0 0;line-height:1.15}
  /* conceito editorial com foto */
  .cgrid{display:grid;grid-template-columns:1fr 1fr;gap:36px;margin-top:26px;align-items:stretch}
  .cphoto{margin:0;border-radius:18px;overflow:hidden;border:1px solid var(--line);box-shadow:0 18px 42px -26px rgba(0,0,0,.42);min-height:430px}
  .cphoto img{width:100%;height:100%;object-fit:cover;display:block}
  .cpil{display:flex;flex-direction:column;justify-content:center;gap:28px}
  .cp{padding-left:20px;border-left:2px solid var(--orange)}
  .cp .cn{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--orange-dark);font-weight:700;display:block;margin-bottom:5px}
  .cp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:21px;color:var(--navy);margin:0 0 7px;line-height:1.08}
  .cp p{font-size:12.5px;color:var(--muted);line-height:1.5;margin:0}
  /* investimento · valor construído */
  .sum{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:22px}
  .sum .box{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px 22px;text-align:center;min-width:160px;flex:1}
  .sum .box .bl{font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);display:block;line-height:1.3}
  .sum .box .bv{font-family:'DM Serif Display',serif;font-size:30px;color:var(--navy);line-height:1;margin:8px 0 4px;display:block}
  .sum .box small{font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-weight:600;display:block}
  .sum .op{font-family:'DM Serif Display',serif;font-size:26px;color:var(--orange-dark);flex:0 0 auto}
  .sum .tot{background:var(--navy);border-color:var(--navy)}
  .sum .tot .bl{color:var(--orange)}
  .sum .tot .bv{color:#fff}
  .sum .tot small{color:rgba(255,255,255,.82)}
  .invsum{margin-top:18px;font-size:14.5px;color:var(--ink);line-height:1.5}
  .invsum b{color:var(--navy)}
  .invsum .big{font-family:'DM Serif Display',serif;font-size:22px;color:var(--orange-dark);vertical-align:-1px}
  .invsum span{color:var(--muted)}
  .incl2 ul{list-style:none;margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:9px 26px}
  .incl2 ul li{position:relative;padding-left:20px;font-size:12.5px;color:var(--ink);line-height:1.35}
  .incl2 ul li span{position:absolute;left:0;top:1px;color:var(--orange)}
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


PROOF = "Experiências já realizadas para times como <b>Compass</b>, <b>Natura</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)"

cover = f'''
  <section class="slide">
{head_block("BFA · Creative Team Experience", "Images", "Matter", "Ceramics & Coffee")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Ceramics &amp; Coffee</span>
        <h1>Uma pausa criativa entre <em>argila, conversa e café</em></h1>
        <p class="lead">Um encontro tátil e sensorial para o time da BFA: modelagem manual em cerâmica e coffee break, num jardim reservado no meio da cidade. Cada pessoa cria a própria peça — e leva pra casa.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip">Campo Belo · São Paulo</span>
          <span class="chip"><b>10</b> participantes</span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip"><b>08–10 de dezembro</b> · a confirmar</span>
        </div>
      </div>
      <div class="cover-photo">{img("ceramicamodelagem.jpg", "Mãos modelando uma peça de cerâmica", "center 50%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("BFA · Images Matter")}
  </section>'''

conceito = f'''
  <section class="slide">
{head_simple("O conceito")}
    <span class="eyebrow orange">◆ O conceito</span>
    <h2>Um respiro no meio da <em>correria</em></h2>
    <p class="lead">Em meio à programação, um momento para desacelerar, criar com as mãos e estar junto de uma forma diferente. A Elarah cuida da curadoria e da produção para que o grupo apenas chegue e aproveite.</p>
    <div class="cgrid">
      <figure class="cphoto">{img("casalmodelagemceramica.jpg", "Mãos modelando argila juntas", "center 50%")}</figure>
      <div class="cpil">
        <div class="cp"><span class="cn">01</span><h3>Criar com as mãos</h3><p>Uma experiência manual, intuitiva e sem necessidade de conhecimento prévio.</p></div>
        <div class="cp"><span class="cn">02</span><h3>Conectar o time</h3><p>Uma dinâmica leve, que permite conversar e interagir naturalmente.</p></div>
        <div class="cp"><span class="cn">03</span><h3>Desacelerar</h3><p>Um intervalo diferente dentro da programação, cercado de verde.</p></div>
      </div>
    </div>
    {foot("O conceito")}
  </section>'''

experiencia = f'''
  <section class="slide">
{head_simple("A experiência")}
    <span class="eyebrow orange">◆ Mão na massa</span>
    <h2>Modelagem manual em <em>cerâmica</em></h2>
    <p class="lead">Cada participante recebe argila e a orientação de uma ceramista para criar a própria peça, na modelagem manual. Depois, as peças seguem para acabamento, secagem e queima — e são devolvidas prontas.</p>
    <div class="steps3">
      <div class="st3"><span class="sn">01</span><h3>Modelar</h3><p>Cada pessoa cria a própria peça, no seu tempo, guiada pela ceramista.</p></div>
      <div class="st3"><span class="sn">02</span><h3>Finalizar</h3><p>As peças seguem para acabamento, secagem e queima.</p></div>
      <div class="st3"><span class="sn">03</span><h3>Levar</h3><p>Depois de prontas, são devolvidas ao grupo.</p></div>
    </div>
    <div class="gstrip">
      <figure>{img("ceramica-fria.jpg", "Mãos na argila, modelando uma peça", "center 45%")}<figcaption>Mãos na argila</figcaption></figure>
      <figure>{img("ceramica2.jpg", "Peças de cerâmica autorais em processo", "center 50%")}<figcaption>Peças em processo</figcaption></figure>
      <figure>{img("agora-grupo.jpg", "Grupo criando junto numa mesa compartilhada", "center 50%")}<figcaption>Mesa compartilhada</figcaption></figure>
    </div>
    {foot("A experiência")}
  </section>'''

local = f'''
  <section class="slide">
{head_simple("O local")}
    <span class="eyebrow orange">◆ O local</span>
    <h2>Um jardim no meio da <em>cidade</em></h2>
    <p class="lead">Um ambiente reservado, cercado de verde, para receber o grupo em uma grande mesa compartilhada — em Campo Belo/Brooklin. O coffee break entra como parte da experiência.</p>
    <div class="gstrip">
      <figure>{img("ojardim1.jpg", "Deck e jardim do O Jardim", "center 50%")}<figcaption>O deck</figcaption></figure>
      <figure>{img("ojardim2.jpg", "Área verde reservada", "center 50%")}<figcaption>Cercado de verde</figcaption></figure>
      <figure>{img("ojardim4.jpg", "Coffee break servido à mesa", "center 50%")}<figcaption>Coffee break</figcaption></figure>
    </div>
    <div class="bnote" style="margin-top:16px">◆ Ambiente intimista, ao ar livre, no ritmo de um grupo pequeno. Disponibilidade e formato da mesa <b>a confirmar</b> com o espaço.</div>
    {foot("O local")}
  </section>'''

incluso = f'''
  <section class="slide">
{head_simple("O que está incluído")}
    <span class="eyebrow orange">◆ Tudo pensado para o grupo</span>
    <h2>O que está <em>incluído</em></h2>
    <div class="cofrow">
      <div class="cofphoto">{img("agora-ceramica.jpg", "Modelagem de cerâmica à mão", "center 45%")}</div>
      <ul class="checks">
        <li>Espaço reservado</li>
        <li>Experiência de modelagem</li>
        <li>Ceramista conduzindo</li>
        <li>Argila e materiais</li>
        <li>Condução da atividade</li>
        <li>Acabamento e queima</li>
        <li>Coffee break</li>
        <li>Montagem e ambientação</li>
        <li>Logística e devolução das peças</li>
        <li>Produção e curadoria Elarah</li>
      </ul>
    </div>
    <p class="fineprint">Experiência completa produzida pela Elarah — do espaço à devolução das peças prontas. Detalhes operacionais (duração, menu do coffee e prazo de devolução) a confirmar.</p>
    {foot("O que está incluído")}
  </section>'''

investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Uma experiência completa, <em>produzida pela Elarah</em></h2>
    <p class="lead">O investimento reúne o melhor da experiência: espaço reservado, coffee break e modelagem manual em cerâmica, com produção integral da Elarah.</p>
    <div class="sum">
      <div class="box"><span class="bl">Espaço + coffee break</span><span class="bv">R$ 250</span><small>por pessoa</small></div>
      <span class="op">+</span>
      <div class="box"><span class="bl">Modelagem em cerâmica</span><span class="bv">R$ 270</span><small>por pessoa</small></div>
      <span class="op">=</span>
      <div class="box tot"><span class="bl">Experiência completa</span><span class="bv">R$ 520</span><small>por pessoa</small></div>
    </div>
    <p class="invsum"><b>Experiência completa para até 10 participantes</b> — <span class="big">R$ 5.200</span> <span>· equivalente a R$ 520 por pessoa</span></p>
    <div class="invbox" style="margin-top:16px">
      <div class="incl incl2" style="flex:1;min-width:300px">
        <span class="vt">O que está incluído</span>
        <ul>
          <li><span>✦</span>Espaço reservado no O Jardim</li>
          <li><span>✦</span>Coffee break</li>
          <li><span>✦</span>Modelagem manual em cerâmica</li>
          <li><span>✦</span>Ceramista</li>
          <li><span>✦</span>Argila e materiais</li>
          <li><span>✦</span>Acabamento e queima</li>
          <li><span>✦</span>Logística e devolução das peças</li>
          <li><span>✦</span>Produção e curadoria Elarah</li>
        </ul>
      </div>
    </div>
    <p class="fineprint">Composição comercial da proposta (valor por pessoa), para grupo de até 10 participantes. Valor sujeito à confirmação final de data, disponibilidade e fornecedores. Datas em avaliação: 08, 09 ou 10 de dezembro.</p>
    {foot("Investimento")}
  </section>'''

proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Próximos passos</span>
    <h2>Como <em>seguimos</em></h2>
    <p class="lead">É só confirmar a data que a gente cuida de todo o resto.</p>
    <div class="nextrow">
      <div class="nx"><span class="nn">01</span><h3>Confirmamos a data</h3></div>
      <div class="nx"><span class="nn">02</span><h3>Reservamos espaço e parceiros</h3></div>
      <div class="nx"><span class="nn">03</span><h3>A Elarah organiza toda a experiência</h3></div>
      <div class="nx"><span class="nn">04</span><h3>O grupo chega e aproveita</h3></div>
    </div>
    <div class="quote" style="margin-top:26px">
      <strong style="font-family:'DM Serif Display',serif;font-weight:400;font-size:22px;color:var(--navy);display:block;margin-bottom:8px">Bora reservar o encontro? ✦</strong>
      Me confirma qual das datas — 08, 09 ou 10 de dezembro — faz mais sentido pro time, que a gente organiza tudo.<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = '<div class="deck">\n' + cover + conceito + experiencia + local + investimento + proximos + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/experiencia-bfa-ceramica-jardim.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
