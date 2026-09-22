# Proposta Elarah · Convenção LIBBS · Festival LIBBS · Distrito Anhembi · 14 e 15/12 · ~1.500 pessoas · experiência olfativa
# Baseado no deck Ginger/Itaú (mesma identidade). 8 slides: capa, por que funciona, 3 experiencias, como funciona, personalizacao, extras, investimento, fechamento.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

# ---- paleta laranja Elarah (igual Ginger/Itau) ----
reps = {
    "--orange:#B08D4C;": "--orange:#F27623;",
    "--orange-dark:#8A6D34;": "--orange-dark:#D4600E;",
    "--navy:#12362B;": "--navy:#16233C;",
    "--navy-soft:#3A5A4E;": "--navy-soft:#3B4E6B;",
    "--blue-accent:#B08D4C;": "--blue-accent:#F27623;",
    "#EFF3EE": "#EDF1F7", "#DCE8E1": "#DCE5F1", "#CBB06E": "#FF9A4D",
    "rgba(176,141,76,.24)": "rgba(242,118,35,.22)",
    "rgba(176,141,76,.26)": "rgba(242,118,35,.26)",
    "rgba(176,141,76,.10)": "rgba(242,118,35,.10)",
    "rgba(18,54,43,.16)": "rgba(62,37,48,.14)",
    "rgba(10,28,22,.86)": "rgba(16,23,28,.86)",
    "rgba(10,28,22,.85)": "rgba(16,23,28,.85)",
    "rgba(10,28,22,.82)": "rgba(16,23,28,.82)",
}
for a, b in reps.items():
    head = head.replace(a, b)

xcss = '''
  .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
  .infocard{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px 20px 20px;box-shadow:0 12px 30px -22px rgba(0,0,0,.28)}
  .infocard h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy);line-height:1.08;margin:8px 0 6px}
  .infocard p{font-size:12px;color:var(--muted);line-height:1.5;margin:0}
  .num{font-family:'DM Serif Display',serif;color:var(--orange);font-size:26px;line-height:1}
  /* cards com foto no topo */
  .pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
  .pcard{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 12px 30px -22px rgba(0,0,0,.28)}
  .pcard .pphoto{aspect-ratio:4/5;overflow:hidden;background:#eee}
  .pcard .pphoto img{width:100%;height:100%;object-fit:cover;display:block}
  .pcard .pbody{padding:14px 17px 16px}
  .pcard .pbody h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:15.5px;color:var(--navy);line-height:1.15;margin:0 0 5px;text-wrap:balance;min-height:2.3em}
  .pcard .pbody p{font-size:11px;color:var(--muted);line-height:1.45;margin:0}
  .pcard .pbody p b{color:var(--navy);font-weight:700}
  /* menu de experiências */
  .menu3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
  .exp{position:relative;background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.32)}
  .exp .ephoto{aspect-ratio:16/11;overflow:hidden;background:#eee}
  .exp .ephoto img{width:100%;height:100%;object-fit:cover;display:block}
  .exp .ebody{padding:14px 17px 16px;display:flex;flex-direction:column;flex:1}
  .exp .en{display:inline-block;font-size:8.5px;letter-spacing:.15em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:4px}
  .exp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:19px;color:var(--navy);line-height:1.05}
  .exp p{font-size:11px;color:var(--muted);margin-top:6px;line-height:1.42}
  .exp .from{margin-top:auto;padding-top:10px;font-size:11.5px;color:var(--navy);font-weight:600}
  .exp .from b{color:var(--orange-dark)}
  /* números / escala */
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:16px}
  .stat{background:var(--navy-soft);border-radius:16px;padding:18px 14px;text-align:center}
  .stat .sv{font-family:'DM Serif Display',serif;font-size:32px;line-height:1;color:#FFB877}
  .stat .sl{font-size:10px;letter-spacing:.05em;color:#fff;margin-top:8px;line-height:1.4;text-transform:uppercase;font-weight:600}
  /* fluxo com fotos */
  .flow{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-top:14px}
  .fstep{text-align:center}
  .fstep .fph{aspect-ratio:1/1;border-radius:14px;overflow:hidden;position:relative;border:1px solid var(--line);box-shadow:0 12px 26px -20px rgba(0,0,0,.36)}
  .fstep .fph img{width:100%;height:100%;object-fit:cover;display:block}
  .fstep .fn{position:absolute;top:8px;left:8px;width:26px;height:26px;border-radius:999px;background:var(--orange);color:#fff;font-family:'DM Serif Display',serif;font-size:13px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px -3px rgba(0,0,0,.3)}
  .fstep .ft{font-size:9px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin-top:9px}
  .fstep h4{font-size:11px;color:var(--navy);font-weight:600;line-height:1.25;margin:2px 0 0}
  .scalehint{font-size:11px;color:var(--muted);margin-top:10px;text-align:center}
  .scalehint b{color:var(--orange-dark)}
  .closing{text-align:center;font-family:'DM Serif Display',serif;font-style:italic;font-size:15px;color:var(--navy);margin-top:16px;line-height:1.4}
  .xbanner{position:relative;border-radius:18px;overflow:hidden;border:1px solid var(--line);box-shadow:0 18px 42px -26px rgba(0,0,0,.42);margin-top:16px;aspect-ratio:16/8}
  .xbanner img{width:100%;height:100%;object-fit:cover;display:block}
  .xbanner .pctag{position:absolute;top:14px;right:14px;background:var(--orange);color:#fff;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:6px 15px;border-radius:999px;box-shadow:0 8px 16px -6px rgba(212,96,14,.55)}
  /* personalização */
  .cofrow{display:flex;gap:22px;margin-top:16px;align-items:stretch;flex-wrap:wrap}
  .cofphoto{flex:0 0 320px;border-radius:16px;overflow:hidden;border:1px solid var(--line);box-shadow:0 16px 34px -24px rgba(0,0,0,.34);min-height:250px}
  .cofphoto img{width:100%;height:100%;object-fit:cover;display:block}
  .checks{flex:1;min-width:280px;display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;align-content:center;margin:0}
  .checks li{list-style:none;position:relative;padding-left:24px;font-size:12.5px;color:var(--ink);line-height:1.3}
  .checks li .ck{position:absolute;left:0;top:1px;width:16px;height:16px;border-radius:999px;background:var(--orange);color:#fff;font-size:8px;font-weight:800;display:flex;align-items:center;justify-content:center}
  /* extras */
  .opts{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:14px;align-items:stretch}
  .opt{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 12px 30px -22px rgba(0,0,0,.28)}
  .opt.hl{border:1.6px solid var(--orange)}
  .opt .oph{aspect-ratio:16/10;overflow:hidden;position:relative;background:#eee;border-bottom:1px solid var(--line)}
  .opt .oph img{width:100%;height:100%;object-fit:cover;display:block}
  .opt .oph .pctag{position:absolute;top:11px;right:11px;background:var(--orange);color:#fff;font-size:8.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:5px 12px;border-radius:999px}
  .opt .ob{padding:15px 20px 17px;flex:1;display:flex;flex-direction:column}
  .opt .otp{align-self:flex-start;font-size:8.5px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:var(--muted);background:#EFEAE0;padding:5px 12px;border-radius:999px;margin-bottom:7px}
  .opt h4{font-family:'DM Serif Display',serif;font-weight:400;font-size:20px;color:var(--navy);line-height:1.06}
  .opt ul{list-style:none;margin-top:9px;display:flex;flex-direction:column;gap:6px}
  .opt ul li{position:relative;padding-left:16px;font-size:11px;color:var(--ink);line-height:1.32}
  .opt ul li::before{content:"\\2726";position:absolute;left:0;top:1px;color:var(--orange);font-size:9px}
  /* investimento */
  .itable{width:100%;border-collapse:collapse;margin-top:16px;font-family:'DM Sans'}
  .itable th,.itable td{padding:16px 12px;border-bottom:1px solid var(--line);text-align:center;vertical-align:middle}
  .itable thead th{font-size:11.5px;color:var(--navy);font-weight:700;border-bottom:2px solid var(--navy);text-transform:uppercase;letter-spacing:.03em}
  .itable thead th span{display:block;font-size:9px;font-weight:500;color:var(--muted);letter-spacing:.01em;margin-top:5px;text-transform:none;line-height:1.35}
  .itable td.rl{text-align:left;width:34%}
  .itable td.rl b{font-family:'DM Serif Display',serif;font-weight:400;font-size:16px;color:var(--navy)}
  .itable td.rl span{display:block;font-size:9.5px;color:var(--muted);margin-top:3px;line-height:1.35}
  .itable .tbd{font-family:'DM Sans';font-size:12.5px;font-style:italic;color:var(--orange-dark);font-weight:600}
  .itable.tot td.rl{width:26%}
  .itable.tot th,.itable.tot td{padding:13px 8px}
  .itable .valm{font-family:'DM Serif Display',serif;font-size:16px;color:var(--navy);line-height:1.1;white-space:nowrap}
  .itable .valm.big{font-size:21px;color:var(--orange-dark)}
  .itable .hl{background:#FBE6D8}
  .itable thead th.hl{color:var(--orange-dark)}
  .itable tbody tr:last-child td{border-bottom:none}
  .itable .pill{display:inline-block;background:var(--navy);color:#fff;font-size:8px;letter-spacing:.07em;padding:3px 9px;border-radius:999px;margin-bottom:6px;font-weight:700;text-transform:uppercase}
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


PROOF = "Já realizado para times como <b>Compass</b>, <b>Natura</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)"

cover = f'''
  <section class="slide">
{head_block("Proposta de experiência · Convenção", "Convenção", "LIBBS", "Distrito Anhembi · Dez")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Conexões transformam</span>
        <h1>O time junto, <em>de mão na massa</em></h1>
        <p class="lead">Uma experiência criativa dentro da <strong>Convenção LIBBS</strong>. Uma pausa no meio da programação pra criar, conversar e se conectar de um jeito leve — todo mundo junto, fazendo algo com as próprias mãos e levando uma lembrança pra casa. 🧡</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>14 e 15 de dezembro</b></span>
          <span class="chip">Distrito Anhembi</span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip"><b>50 pessoas por sessão</b> · formato recomendado</span>
          <span class="chip">A partir de <b>R$ 89</b></span>
        </div>
      </div>
      <div class="cover-photo">{img("libbs-capa.jpg", "Pessoas se conectando na convenção", "center 40%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Convenção LIBBS")}
  </section>'''

porque = f'''
  <section class="slide">
{head_simple("Por que funciona")}
    <span class="eyebrow orange">◆ O que o time leva junto</span>
    <h2>Conexão que acontece <em>além do palco</em></h2>
    <p class="lead">A gente não faz dinâmica de quebra-gelo. A conexão acontece sozinha quando o time senta na mesma mesa pra criar algo com as próprias mãos <strong>— sem hierarquia, sem quem sabe mais e quem sabe menos.</strong> 🧡</p>
    <div class="pgrid">
      <div class="pcard">
        <div class="pphoto">{img("libbs-s2-conversa.jpg", "Time rindo e conversando junto no encontro", "center 35%")}</div>
        <div class="pbody"><h3>Conversa que não rola no escritório</h3><p>Alguns minutos lado a lado fazem o time falar de coisas que a rotina nunca puxa. <b>Áreas diferentes se misturam sozinhas.</b></p></div>
      </div>
      <div class="pcard">
        <div class="pphoto">{img("libbs-s2-criar.jpg", "Time criando junto na ativação, do zero", "center 42%")}</div>
        <div class="pbody"><h3>Todo mundo no mesmo pé</h3><p>Ninguém precisa saber fazer ou ter experiência. <b>Diretoria e time começam do zero juntos</b> — e é justamente aí que a hierarquia cai.</p></div>
      </div>
      <div class="pcard">
        <div class="pphoto">{img("libbs-s2-vela.jpg", "Vela personalizada — a criação que cada um leva", "center 50%")}</div>
        <div class="pbody"><h3>Fica depois do dia</h3><p>Cada um leva pra casa o que criou durante a experiência. <b>A lembrança do encontro continua depois da convenção.</b></p></div>
      </div>
    </div>
    <div class="bnote" style="margin-top:auto">◆ Feita pra acompanhar o ritmo da convenção: <b>50 pessoas por sessão</b> (formato recomendado) e potencial de envolver até <b>60% do público</b> nos dois dias.</div>
    {foot("Por que funciona")}
  </section>'''

experiencias = f'''
  <section class="slide">
{head_simple("As experiências")}
    <span class="eyebrow orange">◆ Escolham a experiência</span>
    <h2>Três experiências <em>pra conectar</em></h2>
    <p class="lead">Dinâmicas, mão na massa, com uma criação pra levar. Cada pessoa cria algo e leva uma lembrança. Escolha a que mais combina com a marca. 🧡</p>
    <div class="menu3">
      <div class="exp">
        <div class="ephoto">{img("libbs-homespray-hand.jpg", "Home spray personalizado sendo criado na ativação", "center 40%")}</div>
        <div class="ebody">
          <span class="en">01 · A mais fluida</span>
          <h3>Home Spray Personalizado</h3>
          <p>Cada pessoa escolhe os aromas e cria um home spray de 100 ml personalizado com a identidade do evento. <b>Rápida, prática e fácil de encaixar no fluxo da convenção.</b></p>
          <span class="from"><b>R$ 89</b> por pessoa</span>
        </div>
      </div>
      <div class="exp">
        <div class="ephoto">{img("libbs-vela.jpg", "Vela aromática criada na ativação da convenção", "center 45%")}</div>
        <div class="ebody">
          <span class="en">02 · A mais sensorial</span>
          <h3>Vela Aromática</h3>
          <p>Cada pessoa escolhe o aroma, cria a própria vela e leva pra casa uma lembrança feita ali. <b>Convida à conversa e deixa uma memória física do encontro.</b></p>
          <span class="from"><b>R$ 119</b> por pessoa</span>
        </div>
      </div>
      <div class="exp">
        <div class="ephoto">{img("libbs-vela-lata.jpg", "Vela em lata personalizada com fragrância autoral e flor seca", "center 50%")}</div>
        <div class="ebody">
          <span class="en">03 · A mais personalizada</span>
          <h3>Vela + Criação de Fragrância</h3>
          <p>Cada pessoa combina diferentes aromas e cria uma vela em lata personalizada com a identidade do evento. <b>Até 5 aromas combináveis, finalização com flor seca e uma experiência mais autoral.</b></p>
          <span class="from"><b>R$ 129</b> por pessoa</span>
        </div>
      </div>
    </div>
    <div class="bnote" style="margin-top:14px">◆ No fim, todas transformam o <b>“Juntos, bora conectar”</b> em algo que se vive, se cria e se leva pra casa.</div>
    {foot("As experiências")}
  </section>'''

comofunciona = f'''
  <section class="slide">
{head_simple("Como funciona")}
    <span class="eyebrow orange">◆ Fácil de participar</span>
    <h2>É só chegar e <em>criar</em></h2>
    <p class="lead">Em poucos minutos, a pessoa sai do ritmo da convenção, escolhe, experimenta e coloca a mão na massa. Uma pausa guiada que cabe na programação — e termina com algo feito por ela pra levar pra casa.</p>
    <div class="flow">
      <div class="fstep"><div class="fph"><span class="fn">1</span>{img("flow-descobre.jpg","Fitas olfativas e frascos de essência","center 50%")}</div><div class="ft">Descobre</div><h4>Conhece os aromas</h4></div>
      <div class="fstep"><div class="fph"><span class="fn">2</span>{img("flow-escolhe.jpg","Escolha dos aromas","center 40%")}</div><div class="ft">Escolhe</div><h4>Encontra sua combinação</h4></div>
      <div class="fstep"><div class="fph"><span class="fn">3</span>{img("flow-cria.jpg","Mãos criando o produto","center 45%")}</div><div class="ft">Cria</div><h4>Coloca a mão na massa</h4></div>
      <div class="fstep"><div class="fph"><span class="fn">4</span>{img("flow-personaliza.jpg","Personalização com etiqueta do evento","center 50%")}</div><div class="ft">Personaliza</div><h4>Deixa com a sua cara</h4></div>
      <div class="fstep"><div class="fph"><span class="fn">5</span>{img("flow-leva.jpg","Produto final pronto pra levar","center 50%")}</div><div class="ft">Leva</div><h4>Leva a própria criação</h4></div>
    </div>
    <p class="subh" style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin:22px 0 0">Feita pra acompanhar o ritmo da convenção</p>
    <div class="stats">
      <div class="stat"><div class="sv">50</div><div class="sl">pessoas por sessão</div></div>
      <div class="stat"><div class="sv">9</div><div class="sl">sessões por dia</div></div>
      <div class="stat"><div class="sv">450</div><div class="sl">participações por dia</div></div>
      <div class="stat"><div class="sv">900</div><div class="sl">participações nos 2 dias</div></div>
    </div>
    <p class="scalehint"><b>50 pessoas é a referência recomendada por sessão.</b> Grupos maiores podem ser avaliados conforme espaço, estrutura e dinâmica escolhida · potencial de envolver até <b>60% do público total</b>.</p>
    <div class="bnote" style="margin-top:14px"><b>A experiência foi desenhada para turmas de 50 pessoas</b>, garantindo mais conforto, interação e fluidez — dependendo da estrutura disponível, podemos avaliar grupos maiores por sessão. Equipe de 4 facilitadores; insumos, utensílios e materiais inclusos. Infraestrutura do evento (microfone, mesas e cadeiras) por conta do contratante — para grupos maiores, a estrutura de espaço, mesas, cadeiras e áudio deverá ser validada previamente.</div>
    <p class="closing">Mais do que passar pela ativação: parar, criar junto e levar um pouco desse encontro pra casa.</p>
    {foot("Como funciona")}
  </section>'''

personaliza = f'''
  <section class="slide">
{head_simple("Personalização")}
    <span class="eyebrow orange">◆ Com a cara da convenção</span>
    <h2>A experiência com a <em>cara da LIBBS</em></h2>
    <p class="lead">Da mesa ao produto que cada pessoa leva pra casa, a experiência pode receber a identidade da convenção.</p>
    <div class="cofrow">
      <div class="cofphoto">{img("perfumaria-corp.jpg", "Bancada de ativação com essências, menu de aromas e materiais organizados", "center 55%")}</div>
      <ul class="checks">
        <li><span class="ck">✓</span>Etiquetas dos produtos</li>
        <li><span class="ck">✓</span>Materiais de mesa</li>
        <li><span class="ck">✓</span>Menu de aromas</li>
        <li><span class="ck">✓</span>Comunicação da ativação</li>
        <li><span class="ck">✓</span>Embalagem da criação</li>
        <li><span class="ck">✓</span>Nome da experiência</li>
        <li><span class="ck">✓</span>Identidade visual da convenção</li>
      </ul>
    </div>
    <div class="bnote" style="margin-top:16px">◆ Aplicamos a identidade que a LIBBS já tem — do material de mesa ao produto final — pra experiência conversar com o Festival do começo ao fim.</div>
    {foot("Personalização")}
  </section>'''

extras = f'''
  <section class="slide">
{head_simple("Extras")}
    <span class="eyebrow orange">◆ Pra experiência chegar em mais gente</span>
    <h2>Mais alcance, <em>mesma proposta sensorial</em></h2>
    <p class="lead">Além da ativação principal, podemos incluir um <strong>brinde olfativo personalizado LIBBS</strong> para ampliar o alcance da proposta e fazer com que mais pessoas levem uma lembrança da convenção. <strong>A partir de R$ 49,90 por pessoa.</strong></p>
    <p class="lead" style="margin-top:8px">Uma forma simples de ampliar o alcance da ativação, reforçar a presença da marca e fazer com que ninguém fique de fora.</p>
    <div class="xbanner"><span class="pctag">★ Premium</span>{img("libbs-extras.jpg", "Participantes recebendo o brinde olfativo personalizado LIBBS na ativação", "center 45%")}</div>
    <div class="bnote" style="margin-top:14px">◆ Foto ilustrativa do brinde. A gente fecha com vocês o item e a personalização antes do encontro. 🧡</div>
    {foot("Extras")}
  </section>'''

investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Organizado por experiência</span>
    <h2>O <em>investimento</em></h2>
    <p class="lead">Por pessoa e por operação, com todos os insumos, utensílios e materiais inclusos. O investimento final depende da quantidade de sessões contratadas.</p>
    <table class="itable tot">
      <thead><tr>
        <th class="corner"></th>
        <th>Por pessoa</th>
        <th>1 dia<span>9 sessões · até 450</span></th>
        <th>2 dias<span>18 sessões · até 900</span></th>
        <th class="hl"><span class="pill">✦ Mais completo</span><br>2 dias + 500 brindes<span>brinde olfativo personalizado</span></th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="rl"><b>Home Spray Personalizado</b><span>a mais fluida</span></td>
          <td class="valm big">R$ 89</td>
          <td class="valm">R$ 40.050</td>
          <td class="valm">R$ 80.100</td>
          <td class="valm hl">R$ 105.050</td>
        </tr>
        <tr>
          <td class="rl"><b>Vela Aromática</b><span>a mais sensorial</span></td>
          <td class="valm big">R$ 119</td>
          <td class="valm">R$ 53.550</td>
          <td class="valm">R$ 107.100</td>
          <td class="valm hl">R$ 132.050</td>
        </tr>
        <tr>
          <td class="rl"><b>Vela + Criação de Fragrância</b><span>a mais personalizada</span></td>
          <td class="valm big">R$ 129</td>
          <td class="valm">R$ 58.050</td>
          <td class="valm">R$ 116.100</td>
          <td class="valm hl">R$ 141.050</td>
        </tr>
      </tbody>
    </table>
    <div class="bnote" style="margin-top:14px">◆ <b>Incluso na experiência:</b> todos os insumos, utensílios e materiais necessários para a produção e condução da atividade, com equipe de 4 a 5 facilitadores conforme o formato.</div>
    <p class="fineprint">O plano Mais Completo considera a operação de 2 dias + 500 brindes olfativos personalizados LIBBS, a R$ 49,90 por unidade. O investimento final depende da quantidade de sessões contratadas. Microfone, mesas e cadeiras não estão inclusos e deverão ser disponibilizados pelo contratante conforme a experiência escolhida — experiências com grupos maiores podem precisar de estrutura de áudio, validada conforme a estrutura disponível no evento.</p>
    {foot("Investimento")}
  </section>'''

fechamento = f'''
  <section class="slide">
{head_simple("Como funciona & contato")}
    <span class="eyebrow orange">◆ Simples e sob medida</span>
    <h2>É só escolher a <em>experiência</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pra a ativação rodar leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><span class="num">01</span><h3>Escolhem o formato</h3><p>A experiência e o número de sessões que fazem sentido pra convenção.</p></div>
      <div class="infocard"><span class="num">02</span><h3>A gente ajusta o espaço e o fluxo</h3><p>Mesas, estações e ritmo, conforme a área no Distrito Anhembi.</p></div>
      <div class="infocard"><span class="num">03</span><h3>A Elarah leva tudo</h3><p>Insumos, materiais e equipe — a gente cuida de toda a operação nos dois dias.</p></div>
    </div>
    <div class="quote">
      <strong style="font-family:'DM Serif Display',serif;font-weight:400;font-size:23px;color:var(--navy);display:block;margin-bottom:8px">Bora criar essa experiência juntos? ✦</strong>
      Renata, me confirma o <strong>formato</strong> e a quantidade de sessões que a gente organiza os próximos passos e cuida de toda a produção.<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    <p class="fineprint">Proposta de experiência da Elarah para a Convenção LIBBS — Distrito Anhembi, 14 e 15 de dezembro, das 7h às 19h, para um público de cerca de 1.500 pessoas (perfil misto). Experiências à escolha, valores por pessoa: Home Spray Personalizado R$ 89, Vela Aromática R$ 119 ou Vela + Criação de Fragrância R$ 129. Cada sessão leva cerca de 40 minutos, com 20 minutos de giro entre turmas, participação espontânea e turmas de 50 pessoas por sessão como formato recomendado (grupos maiores avaliados conforme a estrutura disponível) — 9 sessões por dia, 18 no total, com capacidade de até 900 participações nos dois dias e potencial de envolver até 60% do público, caso a operação rode na capacidade máxima (participação espontânea, sem número garantido). Cada participante leva a própria criação. Insumos, utensílios e materiais inclusos; microfone, mesas e cadeiras por conta do contratante. Valor final conforme a quantidade de horas/sessões contratadas. Proposta válida mediante confirmação de data, formato e disponibilidade de agenda.</p>
    {foot("Como funciona & contato")}
  </section>'''

deck = '<div class="deck">\n' + cover + porque + experiencias + comofunciona + extras + investimento + fechamento + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/experiencia-convencao-libbs.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
