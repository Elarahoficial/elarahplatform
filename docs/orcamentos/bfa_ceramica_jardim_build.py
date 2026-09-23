# Proposta Elarah · BFA (Images Matter) · Programa em 2 experiencias:
#   Exp 01 · Ceramics & Coffee (modelagem manual + coffee break · O Jardim · 10 pax · 08-10/12) — R$5.290
#   Exp 02 · Pizza & Wine (gastronomica conduzida · 10 pax) — R$8.990 (R$899/pax)
# Fotos reais priorizadas (evento corporativo, O Jardim, cozinha/gastronomia). Editorial/neutro, mesma identidade.
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
  /* vibe · mosaico de fotos humanas */
  .vibe{display:grid;grid-template-columns:1.35fr 1fr 1fr;grid-template-rows:188px 188px;gap:12px;margin-top:22px}
  .vibe figure{margin:0;border-radius:14px;overflow:hidden;position:relative;border:1px solid rgba(38,51,42,.10);box-shadow:0 14px 32px -22px rgba(0,0,0,.4)}
  .vibe img{width:100%;height:100%;object-fit:cover;display:block}
  .vibe .big{grid-row:1 / span 2}
  .vibe figcaption{position:absolute;left:0;right:0;bottom:0;padding:20px 12px 9px;color:#fff;font-size:10.5px;font-weight:600;letter-spacing:.02em;background:linear-gradient(to top,rgba(20,28,22,.8),transparent)}
  /* marcador de experiência */
  .expdiv{display:inline-flex;align-items:center;gap:9px;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;font-weight:700;color:var(--orange);border:1px solid rgba(169,102,63,.45);border-radius:999px;padding:6px 15px;margin-bottom:14px}
  /* jornada de vinhos */
  .wjourney{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:18px}
  .wj{display:flex;align-items:center;gap:12px;border:1px solid var(--line);border-radius:14px;padding:14px 18px;background:var(--card)}
  .wj .dot{width:22px;height:22px;border-radius:50%;flex:0 0 auto;box-shadow:inset 0 0 0 1px rgba(0,0,0,.1)}
  .wj b{font-family:'DM Serif Display',serif;font-weight:400;font-size:19px;color:var(--navy);display:block;line-height:1}
  .wj span{font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
  /* mapa de opções (curadoria) */
  .optmap{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:26px}
  .opt{border:1px solid var(--line);border-radius:18px;overflow:hidden;background:var(--card);box-shadow:0 16px 36px -26px rgba(0,0,0,.36);display:flex;flex-direction:column}
  .opt .ophoto{height:250px;position:relative}
  .opt .ophoto img{width:100%;height:100%;object-fit:cover;display:block}
  .opt .oplab{position:absolute;top:14px;left:14px;background:var(--navy);color:#fff;font-size:10px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;padding:6px 12px;border-radius:999px}
  .opt .opbody{padding:20px 26px 24px}
  .opt h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:27px;color:var(--navy);margin:0 0 8px;line-height:1}
  .opt .optags{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--orange);font-weight:700;margin-bottom:9px}
  .opt p{font-size:12.5px;color:var(--muted);line-height:1.5;margin:0}
  /* escolha final */
  .choicerow{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:24px}
  .choice{border:1px solid var(--line);border-radius:18px;padding:26px 26px 28px;background:var(--card);text-align:center;box-shadow:0 16px 36px -28px rgba(0,0,0,.34)}
  .choice .clab{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--orange-dark);font-weight:700}
  .choice h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:30px;color:var(--navy);margin:7px 0 7px;line-height:1}
  .choice .ctags{font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--orange);font-weight:700;margin-bottom:16px}
  .choice .cprice{font-family:'DM Serif Display',serif;font-size:36px;color:var(--navy);line-height:1}
  .choice .cper{display:block;font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-top:4px}
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

# ============================ CAPA + CURADORIA ============================

cover = f'''
  <section class="slide">
{head_block("BFA · Creative Team Experiences", "Images", "Matter", "Duas propostas")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiências para o time</span>
        <h1>Duas experiências pensadas para o <em>mesmo encontro</em></h1>
        <p class="lead">A partir do briefing da BFA, a Elarah selecionou <b>duas experiências</b> com propostas diferentes, mas o mesmo objetivo: criar um momento de <b>conexão, pausa e troca</b> para o time.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>10</b> participantes</span>
          <span class="chip">São Paulo</span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip"><b>08, 09 ou 10 de dezembro</b> · a confirmar</span>
        </div>
      </div>
      <div class="cover-photo">{img("eventocorporativo.jpg", "Evento corporativo da Elarah, grupo reunido e conversando", "center 42%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("BFA · Images Matter")}
  </section>'''

curadoria = f'''
  <section class="slide">
{head_simple("A curadoria")}
    <span class="eyebrow orange">◆ A curadoria</span>
    <h2>Duas formas de viver esse <em>encontro</em></h2>
    <p class="lead">A partir do briefing, buscamos experiências que funcionassem para um <b>grupo pequeno</b>, criassem espaço para <b>conversa e interação</b> e trouxessem algo especial para a programação. Chegamos a duas propostas com atmosferas diferentes: uma mais <b>criativa e contemplativa</b>; outra mais <b>social e gastronômica</b>.</p>
    <div class="optmap">
      <div class="opt">
        <div class="ophoto">{img("ojardim1.jpg", "Espaço O Jardim, ao ar livre", "center 50%")}<span class="oplab">Opção 01</span></div>
        <div class="opbody">
          <h3>Ceramics &amp; Coffee</h3>
          <div class="optags">Criativa · manual · durante o dia</div>
          <p>Uma pausa criativa entre argila, conversa e café.</p>
        </div>
      </div>
      <div class="opt">
        <div class="ophoto">{img("pizzanegroni.jpg", "Pizza artesanal e bebida", "center 45%")}<span class="oplab">Opção 02</span></div>
        <div class="opbody">
          <h3>Pizza &amp; Wine</h3>
          <div class="optags">Gastronômica · social · fim de tarde/noite</div>
          <p>Uma noite de sabores, vinho e conversa.</p>
        </div>
      </div>
    </div>
    {foot("A curadoria")}
  </section>'''

opt1_divider = f'''
  <section class="slide">
{head_block("BFA · Opção 01", "Ceramics", "&amp; Coffee", "Criativa & contemplativa")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Opção 01 · Ceramics &amp; Coffee</span>
        <h1>Uma pausa criativa entre <em>argila, conversa e café</em></h1>
        <p class="lead">Uma experiência <b>criativa, manual e durante o dia</b> — tátil e sensorial, para o time desacelerar e criar junto, em um jardim reservado no meio da cidade.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip">Criativa</span>
          <span class="chip">Manual</span>
          <span class="chip">Durante o dia</span>
        </div>
      </div>
      <div class="cover-photo">{img("ceramicamodelagem.jpg", "Mãos modelando uma peça de cerâmica", "center 50%")}</div>
    </div>
    {foot("Opção 01 · Ceramics & Coffee")}
  </section>'''

conceito = f'''
  <section class="slide">
{head_simple("O conceito")}
    <span class="eyebrow orange">◆ O conceito</span>
    <h2>Um respiro no meio da <em>correria</em></h2>
    <p class="lead">Em meio à programação, um momento para <b>desacelerar</b>, <b>criar com as mãos</b> e <b>estar junto</b> de uma forma diferente. A Elarah cuida da <b>curadoria e da produção</b> para que o grupo apenas chegue e aproveite.</p>
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
    <p class="lead">Cada participante recebe <b>argila</b> e a <b>orientação de uma ceramista</b> para criar a própria peça, no dia. Depois, as peças ficam com a profissional e seguem para <b>acabamento, esmaltação e queima</b> — e são <b>devolvidas prontas</b> ao grupo.</p>
    <div class="steps3">
      <div class="st3"><span class="sn">01</span><h3>Modelar</h3><p>Os participantes fazem a peça no dia, acompanhados pela profissional.</p></div>
      <div class="st3"><span class="sn">02</span><h3>Finalizar</h3><p>Ao final, as peças ficam com a profissional e seguem para acabamento, esmaltação e queima.</p></div>
      <div class="st3"><span class="sn">03</span><h3>Receber</h3><p>Depois de finalizadas, as peças são devolvidas prontas aos participantes.</p></div>
    </div>
    <div class="gstrip">
      <figure>{img("ceramica-fria.jpg", "Mãos na argila, modelando uma peça", "center 45%")}<figcaption>Mãos na argila</figcaption></figure>
      <figure>{img("ceramica2.jpg", "Peças de cerâmica autorais em processo", "center 50%")}<figcaption>Peças em processo</figcaption></figure>
      <figure>{img("bfa-grupo2.webp", "Grupo criando junto numa grande mesa compartilhada ao ar livre", "center 40%")}<figcaption>Mesa compartilhada</figcaption></figure>
    </div>
    <div class="bnote" style="margin-top:14px">◆ A peça <b>não é levada pronta no dia</b>: depois da finalização (acabamento, esmaltação e queima), ela é <b>devolvida pronta</b> ao grupo. 🌿</div>
    {foot("A experiência")}
  </section>'''

local = f'''
  <section class="slide">
{head_simple("O local")}
    <span class="eyebrow orange">◆ O local</span>
    <h2>Um jardim no meio da <em>cidade</em></h2>
    <p class="lead">Um café charmoso, cercado de verde, <b>reservado só para o grupo</b>. A ideia é criar uma pausa gostosa no meio da programação — com uma <b>grande mesa compartilhada</b>, <b>coffee break</b> e tempo para conversar, criar e simplesmente estar junto.</p>
    <div class="gstrip">
      <figure>{img("ojardim1.jpg", "Deck e jardim do O Jardim", "center 50%")}<figcaption>O deck</figcaption></figure>
      <figure>{img("ojardim2.jpg", "Área verde reservada", "center 50%")}<figcaption>Cercado de verde</figcaption></figure>
      <figure>{img("ojardim4.jpg", "Coffee break servido à mesa", "center 50%")}<figcaption>Coffee break</figcaption></figure>
    </div>
    <div class="bnote" style="margin-top:16px">◆ Um cenário intimista, ao ar livre, com luz natural e atmosfera leve — a experiência acontece no próprio ritmo do grupo. Disponibilidade e formato da mesa <b>a confirmar</b> com o espaço. 🌿</div>
    {foot("O local")}
  </section>'''

vibe = f'''
  <section class="slide">
{head_simple("A vibe da experiência")}
    <span class="eyebrow orange">◆ O clima do encontro</span>
    <h2>A vibe da <em>experiência</em></h2>
    <p class="lead">Criar junto muda o ritmo do encontro — uma pausa para conversar, rir e estar presente.</p>
    <div class="vibe">
      <figure class="big">{img("cover-corp.jpg", "Convidadas conversando em evento corporativo da Elarah", "center 35%")}</figure>
      <figure>{img("vibe-conexao-corp.jpg", "Pessoas rindo e conversando", "center 40%")}</figure>
      <figure>{img("vibe-criar-corp.jpg", "Mãos criando, com drinks na mesa", "center 55%")}</figure>
      <figure>{img("corp-conexao.jpg", "Momento espontâneo de conexão entre o time", "center 40%")}</figure>
      <figure>{img("mesa-montada-corp.jpg", "Grande mesa compartilhada montada", "center 55%")}</figure>
    </div>
    {foot("A vibe da experiência")}
  </section>'''

investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento · Ceramics &amp; Coffee</span>
    <h2>Uma experiência completa, <em>produzida pela Elarah</em></h2>
    <p class="lead">O investimento reúne o melhor da experiência: <b>espaço reservado</b>, <b>coffee break</b> e <b>modelagem manual em cerâmica</b>, com <b>produção integral da Elarah</b>.</p>
    <div class="sum">
      <div class="box"><span class="bl">Espaço + coffee break</span><span class="bv">R$ 249</span><small>por pessoa</small></div>
      <span class="op">+</span>
      <div class="box"><span class="bl">Modelagem em cerâmica</span><span class="bv">R$ 279</span><small>por pessoa</small></div>
      <span class="op">=</span>
      <div class="box tot"><span class="bl">Experiência completa</span><span class="bv">R$ 529</span><small>por pessoa</small></div>
    </div>
    <p class="invsum"><b>Experiência completa para até 10 participantes</b> — <span class="big">R$ 5.290</span> <span>· equivalente a R$ 529 por pessoa</span></p>
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
    {foot("Investimento · Ceramics & Coffee")}
  </section>'''

# ============================ OPÇÃO 02 · PIZZA & WINE ============================

opt2_divider = f'''
  <section class="slide">
{head_block("BFA · Opção 02", "Pizza", "&amp; Wine", "Gastronômica & social")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Opção 02 · Pizza &amp; Wine</span>
        <h1>Uma noite de <em>sabores, vinho e conversa</em></h1>
        <p class="lead">Uma experiência <b>gastronômica, social e no fim de tarde/noite</b> — em torno da pizza e do vinho, feita para provar, conversar e compartilhar.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip">Gastronômica</span>
          <span class="chip">Social</span>
          <span class="chip">Fim de tarde/noite</span>
        </div>
      </div>
      <div class="cover-photo">{img("jantar-vista.jpg", "Jantar intimista à noite, com vista da cidade", "center 45%")}</div>
    </div>
    {foot("Opção 02 · Pizza & Wine")}
  </section>'''

g_conceito = f'''
  <section class="slide">
{head_simple("Como acontece")}
    <span class="eyebrow orange">◆ Como acontece a noite</span>
    <h2>Uma noite de <em>pizza, vinho e conexão</em></h2>
    <p class="lead">Uma experiência gastronômica em torno da pizza e do vinho: <b>três sabores</b>, diferentes <b>harmonizações</b> e uma noite feita para <b>provar, conversar e compartilhar</b>. Conduzida por um parceiro gastronômico — social, leve e sofisticada.</p>
    <div class="cgrid">
      <figure class="cphoto">{img("drinkspetisco.jpg", "Taça de vinho e petiscos à mesa", "center 50%")}</figure>
      <div class="cpil">
        <div class="cp"><span class="cn">01</span><h3>Recepção &amp; boas-vindas</h3><p>Chegada tranquila, com o grupo se acomodando para a noite.</p></div>
        <div class="cp"><span class="cn">02</span><h3>Preparo conduzido</h3><p>O preparo das pizzas acontece conduzido por um parceiro gastronômico — acompanhado de perto pelo grupo.</p></div>
        <div class="cp"><span class="cn">03</span><h3>Degustação &amp; harmonização</h3><p>Três sabores servidos em sequência, cada um com sua harmonização de vinho.</p></div>
      </div>
    </div>
    {foot("Pizza & Wine · Como acontece")}
  </section>'''

g_pizza = f'''
  <section class="slide">
{head_simple("Pizza & Wine")}
    <span class="eyebrow orange">◆ Pizza &amp; harmonização</span>
    <h2>Pizza em <em>três sabores</em>, uma jornada de vinhos</h2>
    <p class="lead">Uma sequência pensada para provar aos poucos: <b>três sabores selecionados especialmente para a experiência</b>, cada um com uma harmonização diferente. A ideia é viver a jornada de sabores e conversar entre uma taça e outra.</p>
    <div class="gstrip">
      <figure>{img("pizza.jpg", "Pizza artesanal recém-saída do forno", "center 50%")}<figcaption>Três sabores</figcaption></figure>
      <figure>{img("pizza1.jpg", "Pizza artesanal fatiada", "center 50%")}<figcaption>Sabor a sabor</figcaption></figure>
      <figure>{img("vinhotintos.jpg", "Seleção de vinhos para harmonização", "center 45%")}<figcaption>Harmonização</figcaption></figure>
    </div>
    <div class="wjourney">
      <div class="wj"><span class="dot" style="background:#E9D8A6"></span><div><b>Branco</b><span>Abertura leve</span></div></div>
      <div class="wj"><span class="dot" style="background:#E0959E"></span><div><b>Rosé</b><span>Meio da jornada</span></div></div>
      <div class="wj"><span class="dot" style="background:#6E1F2E"></span><div><b>Tinto</b><span>Final encorpado</span></div></div>
    </div>
    <div class="bnote" style="margin-top:14px">◆ Sequência de harmonização sugerida (branco · rosé · tinto). Sabores das pizzas e seleção final de vinhos <b>a confirmar</b> com o parceiro gastronômico. 🍷</div>
    {foot("Pizza & Wine")}
  </section>'''

g_espaco = f'''
  <section class="slide">
{head_simple("O espaço & a vibe")}
    <span class="eyebrow orange">◆ O espaço &amp; a vibe</span>
    <h2>Um espaço preparado para <em>gastronomia</em></h2>
    <p class="lead">Um ambiente montado para experiências gastronômicas, com <b>cozinha completa</b> e capacidade confortável para o grupo. O clima é de <b>jantar intimista</b> — mesa, taças e boa conversa.</p>
    <div class="gstrip">
      <figure>{img("espaço2.jpg", "Cozinha completa e equipada do espaço", "center 50%")}<figcaption>Cozinha completa</figcaption></figure>
      <figure>{img("cozinha31-prato.jpg", "Preparo conduzido por profissional", "center 40%")}<figcaption>Preparo conduzido</figcaption></figure>
      <figure>{img("harmonizacaoqueijos.jpg", "Tábua para harmonizar com os vinhos", "center 50%")}<figcaption>À mesa</figcaption></figure>
    </div>
    <div class="bnote" style="margin-top:16px">◆ O <b>espaço</b> e o <b>parceiro gastronômico</b> têm funções diferentes: o ambiente recebe o grupo e a condução da experiência é feita pelo parceiro. Espaço, endereço e formato final <b>a confirmar</b>. 🍕</div>
    {foot("O espaço & a vibe")}
  </section>'''

g_investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento · Pizza &amp; Wine</span>
    <h2>Uma noite completa, <em>tudo incluso</em></h2>
    <p class="lead">A experiência gastronômica completa — <b>pizza em três sabores</b>, <b>harmonização de vinhos</b> e condução por <b>parceiro gastronômico</b>, com produção da Elarah.</p>
    <div class="priceband">
      <div><span class="pl">Experiência completa · até 10 participantes</span><span class="pv">R$ 8.990</span></div>
      <div class="side">R$ 899 por pessoa<br>pizza · harmonização de vinhos<br><b style="color:#fff;font-family:'DM Serif Display',serif">tudo incluso</b></div>
    </div>
    <div class="invbox" style="margin-top:16px">
      <div class="incl incl2" style="flex:1;min-width:300px">
        <span class="vt">O que a noite inclui</span>
        <ul>
          <li><span>✦</span>Pizza em três sabores</li>
          <li><span>✦</span>Harmonização / degustação de vinhos</li>
          <li><span>✦</span>Condução por parceiro gastronômico</li>
          <li><span>✦</span>Espaço preparado para a experiência</li>
          <li><span>✦</span>Serviço e estrutura</li>
          <li><span>✦</span>Produção e curadoria Elarah</li>
        </ul>
      </div>
    </div>
    <p class="fineprint">Investimento único da experiência completa (valor por pessoa), para grupo de até 10 participantes. Espaço, parceiro gastronômico e seleção de vinhos a confirmar. Datas em avaliação: 08, 09 ou 10 de dezembro.</p>
    {foot("Investimento · Pizza & Wine")}
  </section>'''

# ============================ A ESCOLHA ============================

escolha = f'''
  <section class="slide">
{head_simple("A escolha")}
    <span class="eyebrow orange">◆ A escolha</span>
    <h2>Qual experiência combina mais com esse <em>momento</em>?</h2>
    <p class="lead">Duas propostas, duas atmosferas diferentes. A partir da <b>escolha da experiência e da data</b>, a Elarah cuida de toda a produção.</p>
    <div class="choicerow">
      <div class="choice">
        <span class="clab">Opção 01</span>
        <h3>Ceramics &amp; Coffee</h3>
        <div class="ctags">Criatividade · pausa · natureza</div>
        <span class="cprice">R$ 529</span><span class="cper">por pessoa · até 10</span>
      </div>
      <div class="choice">
        <span class="clab">Opção 02</span>
        <h3>Pizza &amp; Wine</h3>
        <div class="ctags">Gastronomia · vinho · conexão</div>
        <span class="cprice">R$ 899</span><span class="cper">por pessoa · até 10</span>
      </div>
    </div>
    <div class="quote" style="margin-top:24px">
      <strong style="font-family:'DM Serif Display',serif;font-weight:400;font-size:22px;color:var(--navy);display:block;margin-bottom:8px">Vamos seguir? ✦</strong>
      Nos conte qual das duas propostas faz mais sentido para a programação da BFA — e para qual data (<b>08, 09 ou 10 de dezembro</b>) — que seguimos com os próximos passos.<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("A escolha")}
  </section>'''

deck = ('<div class="deck">\n'
        + cover + curadoria
        + opt1_divider + conceito + experiencia + local + vibe + investimento
        + opt2_divider + g_conceito + g_pizza + g_espaco + g_investimento
        + escolha + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/experiencia-bfa-ceramica-jardim.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
