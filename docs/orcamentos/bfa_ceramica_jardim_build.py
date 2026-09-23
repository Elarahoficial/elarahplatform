# Proposta Elarah · BFA (Images Matter) · 10 slides · duas experiencias (Ceramics & Coffee + Pizza & Wine)
# Reaproveita layouts Elarah existentes: .bfeat (blocos), .cgrid (conceito/etapas), .vibe (atmosfera 6 fotos),
# .sum/.priceband (investimento), .wjourney (jornada de vinhos), .choice (fechamento). Fotos reais priorizadas.
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

# CSS adicional — só o que a base head.html ainda não traz (conceito/etapas, investimento composto, jornada de vinhos, fechamento)
xcss = '''
  .steps3{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:8px}
  .gstrip{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:18px}
  .gstrip figure{margin:0;border-radius:14px;overflow:hidden;position:relative;height:220px;border:1px solid rgba(38,51,42,.10);box-shadow:0 14px 32px -22px rgba(0,0,0,.4)}
  .gstrip img{width:100%;height:100%;object-fit:cover;display:block}
  .gstrip figcaption{position:absolute;left:0;right:0;bottom:0;padding:22px 12px 10px;color:#fff;font-size:11px;font-weight:600;letter-spacing:.02em;background:linear-gradient(to top,rgba(20,28,22,.82),transparent)}
  .priceband{display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;background:var(--navy);color:#fff;border-radius:20px;padding:30px 38px;margin-top:24px}
  .priceband .pl{display:block;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--orange);font-weight:700}
  .priceband .pv{display:block;font-family:'DM Serif Display',serif;font-size:54px;line-height:1;margin-top:8px}
  .priceband .side{font-size:12px;color:rgba(255,255,255,.82);text-align:right;line-height:1.7}
  /* conceito / etapas com foto */
  .cgrid{display:grid;grid-template-columns:1fr 1fr;gap:36px;margin-top:26px;align-items:stretch}
  .cphoto{margin:0;border-radius:18px;overflow:hidden;border:1px solid var(--line);box-shadow:0 18px 42px -26px rgba(0,0,0,.42);min-height:420px}
  .cphoto img{width:100%;height:100%;object-fit:cover;display:block}
  .cpil{display:flex;flex-direction:column;justify-content:center;gap:24px}
  .cp{padding-left:20px;border-left:2px solid var(--orange)}
  .cp .cn{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--orange-dark);font-weight:700;display:block;margin-bottom:5px}
  .cp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:21px;color:var(--navy);margin:0 0 6px;line-height:1.08}
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
  /* jornada de vinhos */
  .wjourney{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:18px}
  .wj{display:flex;align-items:center;gap:12px;border:1px solid var(--line);border-radius:14px;padding:14px 18px;background:var(--card)}
  .wj .dot{width:22px;height:22px;border-radius:50%;flex:0 0 auto;box-shadow:inset 0 0 0 1px rgba(0,0,0,.1)}
  .wj b{font-family:'DM Serif Display',serif;font-weight:400;font-size:19px;color:var(--navy);display:block;line-height:1}
  .wj span{font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
  /* fechamento · dois momentos */
  .choicerow{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:22px}
  .choice{border:1px solid var(--line);border-radius:18px;padding:22px 26px 24px;background:var(--card);text-align:center;box-shadow:0 16px 36px -28px rgba(0,0,0,.34)}
  .choice .clab{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--orange-dark);font-weight:700}
  .choice h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:26px;color:var(--navy);margin:6px 0 6px;line-height:1}
  .choice .ctags{font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--orange);font-weight:700;margin-bottom:12px}
  .choice .cprice{font-family:'DM Serif Display',serif;font-size:30px;color:var(--navy);line-height:1}
  .choice .cper{display:block;font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-top:4px}
  /* dois blocos foto+texto (bfeat sem lista) */
  .bfeat + .bfeat{margin-top:18px}
  .bfeat .bbody p{font-size:13px;color:var(--muted);line-height:1.55;margin:10px 0 0}
  /* investimento final · 3 colunas comparativas */
  .invf{display:grid;grid-template-columns:1fr 1fr 1fr;gap:15px;margin-top:22px;align-items:stretch}
  .ic{display:flex;flex-direction:column;border:1px solid var(--line);border-radius:18px;padding:20px 20px 22px;background:var(--card);box-shadow:0 16px 38px -30px rgba(0,0,0,.34)}
  .ic .ihd{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange-dark);font-weight:700;line-height:1.5}
  .ic .ihd b{display:block;color:var(--navy);font-size:11px;letter-spacing:.11em;margin-top:1px}
  .ic figure{margin:12px 0 14px;border-radius:12px;overflow:hidden;height:124px}
  .ic figure img{width:100%;height:100%;object-fit:cover;display:block}
  .ic h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:22px;color:var(--navy);line-height:1.05;margin:0;min-height:47px}
  .ic .itags{font-size:8.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--orange);font-weight:700;margin-top:9px}
  .ic hr{border:0;border-top:1px solid var(--line);margin:14px 0}
  .ic .iprice{font-family:'DM Serif Display',serif;font-size:34px;color:var(--navy);line-height:1}
  .ic .iper{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-top:5px}
  .ic .itot{background:#F1EDE3;border-radius:11px;padding:9px 12px;text-align:center;margin-top:13px}
  .ic .itot span{font-size:8.5px;color:var(--muted);font-weight:600;letter-spacing:.02em;display:block}
  .ic .itot b{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy);letter-spacing:.01em}
  .ic .ilab{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange-dark);font-weight:700;margin-bottom:9px}
  .ic ul{list-style:none;display:flex;flex-direction:column;gap:6px}
  .ic ul li{position:relative;padding-left:16px;font-size:10.5px;color:var(--ink);line-height:1.3}
  .ic ul li span{position:absolute;left:0;top:0;color:var(--orange)}
  .ic .grow{flex:1}
  .ic.hl{background:linear-gradient(180deg,#F5EBDC,#F0E1CD);border:1.5px solid var(--orange)}
  .ic.hl .badge{align-self:center;background:var(--orange-dark);color:#fff;font-size:8.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:7px 15px;border-radius:999px}
  .ic.hl h3{text-align:center;font-size:23px;margin-top:12px;min-height:auto}
  .ic.hl h3 em{font-style:italic;color:var(--orange-dark)}
  .ic.hl .itags{text-align:center}
  .ic.hl hr{border-top-color:rgba(138,109,52,.28)}
  .ic.hl .itot{background:rgba(255,255,255,.55)}
  .ic .idesc{font-size:11px;color:var(--navy-soft);line-height:1.5;margin-top:13px}
  .invnote{display:flex;gap:14px;align-items:flex-start;margin-top:20px;background:#ECE7DC;border-radius:14px;padding:15px 22px}
  .invnote .ii{flex:0 0 auto;width:22px;height:22px;border-radius:50%;border:1.5px solid var(--muted);color:var(--muted);display:flex;align-items:center;justify-content:center;font-size:12px;font-family:Georgia,serif;font-style:italic;margin-top:1px}
  .invnote p{font-size:11px;color:var(--navy-soft);line-height:1.65;margin:0}
  .invnote p b{color:var(--navy)}
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


def atmosfera(kicker, eyebrow, title_html, lead_html, photos, boxlabel, boxbody, footr):
    figs = "\n      ".join(
        f'<figure>{img(src, alt, pos)}<figcaption>{cap}</figcaption></figure>'
        for src, alt, pos, cap in photos
    )
    return f'''
  <section class="slide">
{head_simple(kicker)}
    <span class="eyebrow orange">{eyebrow}</span>
    <h2>{title_html}</h2>
    <p class="lead">{lead_html}</p>
    <div class="vibe">
      {figs}
    </div>
    <div class="bnote" style="margin-top:16px"><b>{boxlabel}:</b> {boxbody}</div>
    {foot(footr)}
  </section>'''


# ============================ 1 · CAPA (aprovada) ============================

cover = f'''
  <section class="slide">
{head_block("Corporativo · Turma privada", "BFA", "", "Creative Team Experiences")}
    <div class="cover">
      <div>
        <span class="eyebrow">Corporativo · Turma privada</span>
        <h1>Duas experiências,<br><em>mesmo time</em></h1>
        <p class="lead">Em dois momentos com atmosferas próprias, a proposta é criar espaço para <b>sair da rotina</b>, estar junto e viver algo diferente. Cerâmica, café, sabores e vinho entram em cena com <b>conexão, presença e boas conversas</b>.</p>
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
    <div class="proof proof--wide"><span class="star">★</span> Já realizado para <b>Compass</b>, <b>Natura</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)</div>
    {foot("Corporativo · Turma privada")}
  </section>'''

# ============================ 2 · POR QUE FUNCIONA ============================

porque = f'''
  <section class="slide">
{head_simple("O que o time leva junto")}
    <span class="eyebrow orange">O que o time leva junto</span>
    <h2>Experiências que <em>mudam o ritmo</em> do dia</h2>
    <p class="lead">A ideia não é preencher a agenda com mais uma atividade. É criar espaço para <b>sair do automático, conversar de outro jeito e viver algo fora da rotina</b> — seja criando com as mãos ou se encontrando à mesa.</p>
    <div class="bfeat">
      <div class="bphoto">{img("porque-criar.jpg", "Grupo rindo enquanto cria peças de cerâmica", "center 42%")}</div>
      <div class="bbody">
        <span class="btag">Criar</span>
        <h3>Criar abre espaço para conversar</h3>
        <p>Quando as mãos estão ocupadas, a conversa acontece sem esforço. Sem roteiro, sem pressão — só o grupo criando, experimentando e trocando junto.</p>
      </div>
    </div>
    <div class="bfeat">
      <div class="bphoto">{img("porque-mesa.jpg", "Amigos brindando e rindo à mesa", "center 40%")}</div>
      <div class="bbody">
        <span class="btag">À mesa</span>
        <h3>A mesa aproxima naturalmente</h3>
        <p>Entre sabores, vinho e conversa, o ritmo muda. O time compartilha um momento mais leve, espontâneo e fora da rotina.</p>
      </div>
    </div>
    {foot("O que o time leva junto")}
  </section>'''

# ============================ 3 · CERAMICS & COFFEE — CONCEITO + COMO ACONTECE ============================

cer_conceito = f'''
  <section class="slide">
{head_simple("Experiência 01 · Ceramics & Coffee")}
    <span class="eyebrow orange">Experiência 01 · Ceramics &amp; Coffee</span>
    <h2>Uma pausa criativa entre <em>argila, conversa e café</em></h2>
    <p class="lead">Uma experiência manual e sensorial para <b>desacelerar</b>, criar junto e abrir espaço para uma troca mais leve — rende conversa e deixa uma <b>lembrança do encontro</b>.</p>
    <div class="cgrid">
      <figure class="cphoto">{img("ceramicamodelagem.jpg", "Mãos modelando uma peça de cerâmica", "center 50%")}</figure>
      <div class="cpil">
        <div class="cp"><span class="cn">01 · Modelar</span><p>Cada participante cria a própria peça com a orientação da ceramista.</p></div>
        <div class="cp"><span class="cn">02 · Finalizar</span><p>As peças seguem para acabamento, esmaltação e queima.</p></div>
        <div class="cp"><span class="cn">03 · Receber</span><p>Depois de prontas, são devolvidas ao grupo.</p></div>
      </div>
    </div>
    <div class="bnote" style="margin-top:14px">◆ A peça <b>não é levada pronta no dia</b> — depois de finalizada, é devolvida pronta ao grupo. 🌿</div>
    {foot("Ceramics & Coffee")}
  </section>'''

# ============================ 4 · CERAMICS & COFFEE — LOCAL + ATMOSFERA ============================

cer_atmosfera = atmosfera(
    "Experiência 01 · Ceramics & Coffee",
    "O local &amp; a atmosfera",
    "Um jardim no meio da <em>cidade</em>",
    "Um café cercado de verde, <b>reservado só para o grupo</b>. Uma grande mesa compartilhada, coffee break, mãos na argila e tempo para conversar, criar e simplesmente estar junto.",
    [
        ("ojardim1.jpg", "Deck e jardim do O Jardim", "center 50%", "O jardim"),
        ("natura-mesa.jpg", "Grupo numa grande mesa compartilhada no jardim", "center 50%", "Mesa compartilhada"),
        ("ceramica-fria.jpg", "Mãos na argila", "center 45%", "Mãos na argila"),
        ("natura-criando.jpg", "Participante modelando a própria peça no evento", "center 55%", "Criando juntos"),
        ("ojardim4.jpg", "Coffee break servido à mesa", "center 50%", "Coffee break"),
        ("bfa-grupo1.webp", "O time reunido à mesa", "center 40%", "O time à mesa"),
    ],
    "Tudo incluso",
    "espaço reservado · ceramista · materiais · acabamento e queima · coffee break · produção Elarah",
    "O local & a atmosfera",
)

# ============================ 5 · CERAMICS & COFFEE — INVESTIMENTO ============================

cer_investimento = f'''
  <section class="slide">
{head_simple("Experiência 01 · Ceramics & Coffee")}
    <span class="eyebrow orange">Investimento</span>
    <h2>Uma experiência completa, <em>mão na massa</em></h2>
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

# ============================ 6 · PIZZA & WINE — CONCEITO + COMO ACONTECE ============================

pw_conceito = f'''
  <section class="slide">
{head_simple("Experiência 02 · Pizza & Wine")}
    <span class="eyebrow orange">Experiência 02 · Pizza &amp; Wine</span>
    <h2>Uma noite de <em>sabores, vinho e conversa</em></h2>
    <p class="lead">Uma experiência <b>gastronômica e social</b> em torno da mesa, com <b>três sabores de pizza</b> e diferentes <b>harmonizações</b> ao longo da noite — feita para provar, conversar e compartilhar.</p>
    <div class="cgrid">
      <figure class="cphoto">{img("pizza-brinde.jpg", "Brinde com taças de vinho sobre a mesa com pizzas", "center 50%")}</figure>
      <div class="cpil">
        <div class="cp"><span class="cn">01 · Recepção &amp; boas-vindas</span><p>O grupo chega, se acomoda e começa a noite com calma.</p></div>
        <div class="cp"><span class="cn">02 · Preparo conduzido</span><p>O preparo das pizzas acontece conduzido pelo parceiro gastronômico e acompanhado pelo grupo.</p></div>
        <div class="cp"><span class="cn">03 · Degustação &amp; harmonização</span><p>Três sabores são servidos em sequência, acompanhados por diferentes vinhos.</p></div>
      </div>
    </div>
    {foot("Pizza & Wine")}
  </section>'''

# ============================ 8 · PIZZA & WINE — LOCAL + ATMOSFERA ============================

pw_atmosfera = atmosfera(
    "Experiência 02 · Pizza & Wine",
    "O local &amp; a atmosfera",
    "Uma noite que acontece em torno da <em>mesa</em>",
    "Luz mais baixa, cozinha em movimento, mesa posta e taças servidas. Entre pizza, vinho e conversa, o encontro ganha um ritmo <b>mais social, leve e feito para aproveitar o tempo junto</b>.",
    [
        ("weber-balcao.webp", "Chef conduzindo no balcão da cozinha", "center 30%", "Cozinha em cena"),
        ("weber-mesa.webp", "Mesa posta para a experiência gastronômica", "center 55%", "Mesa posta"),
        ("vinhotintos.jpg", "Taças e vinhos servidos", "center 45%", "Taças servidas"),
        ("pizza.jpg", "Pizza artesanal em três sabores", "center 50%", "Sabores da noite"),
        ("weber-grupo.webp", "Grupo sorrindo durante a experiência conduzida", "center 45%", "Condução da experiência"),
        ("harmonizacaoqueijos.jpg", "Tábua curada para harmonizar", "center 50%", "Curadoria à mesa"),
    ],
    "Experiência completa",
    "espaço · condução gastronômica · pizza em três sabores · harmonização de vinhos · serviço · produção Elarah",
    "O local & a atmosfera",
)

# ============================ 9 · PIZZA & WINE — INVESTIMENTO ============================

pw_investimento = f'''
  <section class="slide">
{head_simple("Experiência 02 · Pizza & Wine")}
    <span class="eyebrow orange">Investimento</span>
    <h2>Uma noite completa, <em>tudo incluso</em></h2>
    <p class="lead">A experiência gastronômica completa — <b>pizza em três sabores</b>, <b>harmonização de vinhos</b> e condução por <b>parceiro gastronômico</b>, com produção da Elarah.</p>
    <div class="priceband">
      <div><span class="pl">Experiência completa</span><span class="pv">R$ 899</span><span style="display:block;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.75);font-weight:600;margin-top:6px">por pessoa</span></div>
      <div class="side">pizza · harmonização de vinhos<br>condução gastronômica<br><b style="color:#fff;font-family:'DM Serif Display',serif">tudo incluso</b></div>
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
    <p class="fineprint">Investimento único da experiência completa, valor por pessoa. Espaço, parceiro gastronômico e seleção de vinhos a confirmar. Datas em avaliação: 08, 09 ou 10 de dezembro.</p>
    {foot("Investimento · Pizza & Wine")}
  </section>'''

# ============================ 7 · INVESTIMENTO FINAL (CONSOLIDADO) ============================

investimento_final = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">✦ Investimento final</span>
    <h2>Os dois momentos, <em>com valores claros</em></h2>
    <p class="lead">Abaixo, o investimento de cada experiência e o valor total caso a programação inclua os <b>dois momentos</b>.</p>
    <div class="invf">
      <div class="ic">
        <span class="ihd">Experiência 01<b>Ceramics &amp; Coffee</b></span>
        <figure>{img("ceramicamodelagem.jpg", "Mãos modelando cerâmica", "center 50%")}</figure>
        <h3>Criação com as mãos</h3>
        <div class="itags">Criatividade · pausa · natureza</div>
        <hr>
        <div class="iprice">R$ 529</div>
        <div class="iper">por pessoa</div>
        <div class="itot"><span>Total para até 10 participantes</span><b>R$ 5.290</b></div>
        <hr>
        <span class="ilab">Inclui</span>
        <ul class="grow">
          <li><span>✦</span>Espaço reservado</li>
          <li><span>✦</span>Coffee break</li>
          <li><span>✦</span>Modelagem em cerâmica</li>
          <li><span>✦</span>Ceramista</li>
          <li><span>✦</span>Argila e materiais</li>
          <li><span>✦</span>Acabamento e queima</li>
          <li><span>✦</span>Produção Elarah</li>
        </ul>
      </div>
      <div class="ic">
        <span class="ihd">Experiência 02<b>Pizza &amp; Wine</b></span>
        <figure>{img("pizza.jpg", "Pizza artesanal servida à mesa", "center 50%")}</figure>
        <h3>Encontro à mesa</h3>
        <div class="itags">Gastronomia · vinho · conexão</div>
        <hr>
        <div class="iprice">R$ 899</div>
        <div class="iper">por pessoa</div>
        <div class="itot"><span>Total para até 10 participantes</span><b>R$ 8.990</b></div>
        <hr>
        <span class="ilab">Inclui</span>
        <ul class="grow">
          <li><span>✦</span>Espaço reservado</li>
          <li><span>✦</span>Pizza em três sabores</li>
          <li><span>✦</span>Harmonização de vinhos</li>
          <li><span>✦</span>Condução gastronômica</li>
          <li><span>✦</span>Serviço à mesa</li>
          <li><span>✦</span>Produção e curadoria Elarah</li>
        </ul>
      </div>
      <div class="ic hl">
        <span class="badge">★ Programação completa</span>
        <h3>Dois momentos,<br><em>um só time</em></h3>
        <div class="itags">Criar · compartilhar · celebrar</div>
        <figure>{img("pizza-brinde.jpg", "Brinde entre os dois momentos", "center 50%")}</figure>
        <hr>
        <span class="ilab">Valor total</span>
        <div class="iprice">R$ 14.280</div>
        <div class="itot"><span>Para até 10 participantes</span></div>
        <p class="idesc grow">A união da criatividade com a gastronomia para um dia completo de conexão, leveza e boas memórias.</p>
        <hr>
        <span class="ilab" style="margin-bottom:0">Inclui tudo o que está nas duas experiências</span>
      </div>
    </div>
    <div class="invnote">
      <span class="ii">i</span>
      <p><b>Valores para grupo de até 10 participantes.</b> Datas previstas: 08, 09 ou 10 de dezembro. Ajustes finais de produção e agenda sujeitos à confirmação. A Elarah cuida da produção e do alinhamento final de cada experiência.</p>
    </div>
    {foot("Investimento final")}
  </section>'''

# ============================ 10 · PRÓXIMOS PASSOS ============================

proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">Próximos passos</span>
    <h2>Dois momentos para ficar na <em>memória</em></h2>
    <p class="lead">Duas experiências com atmosferas próprias, pensadas para trazer novos ritmos à programação do time — da <b>criação com as mãos</b> aos <b>encontros em torno da mesa</b>.</p>
    <div class="choicerow">
      <div class="choice">
        <span class="clab">Ceramics &amp; Coffee</span>
        <h3>Criação com as mãos</h3>
        <div class="ctags">Criatividade · pausa · natureza</div>
        <span class="cprice">R$ 529</span><span class="cper">por pessoa · até 10</span>
      </div>
      <div class="choice">
        <span class="clab">Pizza &amp; Wine</span>
        <h3>Encontro à mesa</h3>
        <div class="ctags">Gastronomia · vinho · conexão</div>
        <span class="cprice">R$ 899</span><span class="cper">por pessoa · até 10</span>
      </div>
    </div>
    <div class="quote" style="margin-top:22px">
      <strong style="font-family:'DM Serif Display',serif;font-weight:400;font-size:22px;color:var(--navy);display:block;margin-bottom:8px">Vamos seguir? ✦</strong>
      A partir da definição das datas (<b>08, 09 ou 10 de dezembro</b>), ajustamos os últimos detalhes e cuidamos da produção de cada experiência.<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n'
        + cover + porque
        + cer_conceito + cer_atmosfera
        + pw_conceito + pw_atmosfera
        + investimento_final
        + proximos + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/experiencia-bfa-ceramica-jardim.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
