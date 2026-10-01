# Proposta Elarah · Crie sua Propria Bolsa — Bucket Bag · turma privada
# 17/10 · 6 pessoas · ~5h · R$ 789/pessoa · R$ 4.734 grupo de 6.
# Premium fashion experience. Conduzida por Ursula Kaercher (~20 anos de moda).
# NAO mostrar fornecedor/comissao/margem. NAO citar endereco antigo (BETC Havas Cafe).
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/orcamento-adriana.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]

head = re.sub(r'<title>.*?</title>', '<title>Crie sua Própria Bolsa · Bucket Bag · Elarah</title>', head, count=1, flags=re.DOTALL)
head = re.sub(r'<meta name="description"[^>]*>',
              '<meta name="description" content="Crie sua Própria Bolsa — Bucket Bag: 5 horas de moda, criação e mãos à obra, conduzidas por Úrsula Kaercher. Experiência privativa Elarah.">',
              head, count=1)

extra = '''
<style>
  /* ===== pilares (criar / aprender / levar) ===== */
  .trio{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:22px}
  .trioc{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:24px 22px;box-shadow:0 14px 34px -26px rgba(0,0,0,.3)}
  .trioc .n{font-family:'DM Serif Display',serif;font-size:13px;color:var(--orange);letter-spacing:.04em}
  .trioc h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:22px;color:var(--navy);margin:8px 0 7px;line-height:1.05}
  .trioc p{font-size:12.5px;color:var(--muted);line-height:1.55;margin:0}
  .trioc p b{color:var(--navy);font-weight:700}
  .nosplit{display:grid;grid-template-columns:1.02fr .98fr;gap:36px;margin-top:22px;align-items:center}
  .nosplit .ph{border-radius:20px;overflow:hidden;border:1px solid var(--line);box-shadow:0 20px 48px -28px rgba(0,0,0,.45);height:300px;position:relative}
  .nosplit .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .nosplit .lead2{font-size:15px;color:var(--ink);line-height:1.6;margin:0}
  .nosplit .lead2 b{color:var(--navy);font-weight:700}
  /* ===== jornada (5 etapas) ===== */
  .jrn{display:grid;gap:13px;margin-top:20px}
  .jstep{display:grid;grid-template-columns:118px 1fr;gap:18px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:0 12px 30px -26px rgba(0,0,0,.3)}
  .jstep .jph{position:relative;height:92px;overflow:hidden}
  .jstep .jph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .jstep .jbd{padding:12px 18px 12px 0;display:flex;flex-direction:column;justify-content:center}
  .jstep .jn{font-size:10px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .jstep .jt{font-family:'DM Serif Display',serif;font-size:18px;color:var(--navy);line-height:1.08;margin:2px 0 3px}
  .jstep .jd{font-size:12px;color:var(--muted);line-height:1.45}
  /* ===== profissional ===== */
  .prof{display:grid;grid-template-columns:.92fr 1.08fr;gap:36px;margin-top:22px;align-items:center}
  .prof .pph{border-radius:20px;overflow:hidden;border:1px solid var(--line);box-shadow:0 20px 48px -28px rgba(0,0,0,.45);height:360px;position:relative}
  .prof .pph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .prof .name{font-family:'DM Serif Display',serif;font-size:30px;color:var(--navy);line-height:1.04;margin:0}
  .prof .role{font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin-top:7px}
  .prof .ptx{font-size:13.5px;color:var(--ink);line-height:1.62;margin:14px 0 0}
  .prof .ptx b{color:var(--navy);font-weight:700}
  .phigh{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-top:18px}
  .phigh .pi{background:#FBF1EE;border-radius:12px;padding:12px 15px;font-size:12px;color:var(--navy);font-weight:700;line-height:1.3}
  .phigh .pi b{color:var(--orange-dark)}
  /* ===== mosaico (mais que a bolsa) ===== */
  .mos{display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:150px;gap:13px;margin-top:20px}
  .mos figure{margin:0;border-radius:15px;overflow:hidden;border:1px solid var(--line);position:relative;box-shadow:0 14px 32px -24px rgba(0,0,0,.4)}
  .mos figure.big{grid-column:span 2;grid-row:span 2}
  .mos img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .mos figcaption{position:absolute;left:0;right:0;bottom:0;padding:16px 15px 11px;font-size:12px;font-weight:700;color:#fff;letter-spacing:.01em;background:linear-gradient(0deg,rgba(28,16,20,.82),rgba(28,16,20,0))}
  /* ===== cards (o que voce leva) ===== */
  .leva{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:22px}
  .levac{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:22px 20px;box-shadow:0 12px 30px -24px rgba(0,0,0,.3)}
  .levac .em{font-size:24px;line-height:1}
  .levac h4{font-family:'DM Serif Display',serif;font-weight:400;font-size:19px;color:var(--navy);margin:11px 0 6px;line-height:1.08}
  .levac p{font-size:12px;color:var(--muted);line-height:1.5;margin:0}
  /* ===== tudo incluso ===== */
  .incsplit{display:grid;grid-template-columns:1fr 1.18fr;gap:34px;margin-top:20px;align-items:center}
  .incsplit .ph{border-radius:20px;overflow:hidden;border:1px solid var(--line);box-shadow:0 20px 48px -28px rgba(0,0,0,.45);height:390px;position:relative}
  .incsplit .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .inclist{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:9px 20px}
  .inclist li{position:relative;padding-left:24px;font-size:12.5px;color:var(--ink);line-height:1.4}
  .inclist li b{color:var(--navy);font-weight:700}
  .inclist li .ck{position:absolute;left:0;top:1px;color:var(--orange);font-weight:800}
  .incnote{margin-top:16px;background:#FBF1EE;border-radius:14px;padding:14px 18px;font-size:13px;color:var(--navy-soft);line-height:1.5}
  .incnote b{color:var(--navy)}
  /* ===== investimento ===== */
  .invwrap{display:grid;grid-template-columns:1.1fr .9fr;gap:20px;margin-top:22px;align-items:stretch}
  .invmain{background:linear-gradient(158deg,var(--navy),#241722);color:#fff;border-radius:22px;padding:36px 36px;display:flex;flex-direction:column;justify-content:center;box-shadow:0 22px 50px -28px rgba(0,0,0,.5)}
  .invmain .tag{font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:var(--orange);font-weight:700}
  .invmain .big{font-family:'DM Serif Display',serif;font-size:58px;line-height:1;margin:8px 0 2px}
  .invmain .per{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.72);font-weight:700}
  .invside{display:flex;flex-direction:column;justify-content:center;gap:14px}
  .invtot{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px 24px;box-shadow:0 14px 34px -26px rgba(0,0,0,.3)}
  .invtot .k{font-size:10px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .invtot .v{font-family:'DM Serif Display',serif;font-size:34px;color:var(--navy);margin-top:4px;line-height:1}
  .invtot .v small{font-family:'DM Sans',sans-serif;font-size:12px;color:var(--muted);font-weight:600;letter-spacing:0}
  .invinc{background:#FBF1EE;border-radius:14px;padding:14px 18px;font-size:12px;color:var(--navy-soft);line-height:1.55}
  .invinc b{color:var(--navy)}
  /* ===== final ===== */
  .finwrap{display:grid;grid-template-columns:1.05fr .95fr;gap:38px;margin-top:22px;align-items:center}
  .finwrap .ph{border-radius:20px;overflow:hidden;border:1px solid var(--line);box-shadow:0 22px 52px -28px rgba(0,0,0,.45);height:420px;position:relative}
  .finwrap .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .finwrap .ftx p.lead{margin-top:0}
  .fincta{margin-top:20px;display:inline-block;background:var(--orange);color:#fff;font-weight:700;font-size:15px;padding:14px 26px;border-radius:999px;box-shadow:0 16px 34px -16px rgba(200,110,70,.6)}
  .fincontact{margin-top:16px;font-size:12.5px;color:var(--navy-soft);line-height:1.6}
  .fincontact b{color:var(--navy)}
</style>'''
head = head.replace("</head>", extra + "</head>", 1)


def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'


def img(src, alt, pos="center 50%"):
    return f'<img src="assets/{src}" alt="{alt}" style="object-position:{pos}">'


def head_simple(kicker):
    return f'''    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">{kicker}</span></div>
    </div>'''


def jstep(n, foto, titulo, desc, pos="center 50%"):
    return (f'<div class="jstep"><div class="jph">{img(foto, titulo, pos)}</div>'
            f'<div class="jbd"><span class="jn">{n}</span><span class="jt">{titulo}</span><span class="jd">{desc}</span></div></div>')


# ===== 1 · CAPA =====
cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Turma privada · Experiência Elarah</span></div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Bucket Bag Experience</span>
        <h1>Crie sua <em>Própria Bolsa</em></h1>
        <p class="lead"><strong>5 horas</strong> de moda, criação e mãos à obra para transformar materiais em uma <strong>bolsa inteiramente sua</strong>.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>6</b> participantes</span>
          <span class="chip"><b>17</b> de outubro</span>
          <span class="chip">≈ <b>5h</b> de experiência</span>
        </div>
      </div>
      <div class="cover-photo">{img("croche-bolsa.jpg", "Bolsa autoral usada como peça de moda", "center 40%")}</div>
    </div>
    {foot("Bucket Bag · Turma privada")}
  </section>'''

# ===== 2 · NÃO É SÓ UMA OFICINA =====
nao = f'''
  <section class="slide">
{head_simple("A experiência")}
    <span class="eyebrow orange">◆ Não é só uma oficina</span>
    <h2>Você não escolhe uma bolsa. <em>Você cria a sua.</em></h2>
    <div class="nosplit">
      <div class="ph">{img("costura-costurando.jpg", "Participante costurando a própria bolsa", "center 45%")}</div>
      <p class="lead2">Durante <b>cinco horas</b>, cada participante acompanha a construção da própria <b>Mini Bucket Bag</b> do início ao fim — escolhendo detalhes, aprendendo técnicas e colocando a mão na massa em cada etapa.</p>
    </div>
    <div class="trio">
      <div class="trioc"><div class="n">01</div><h3>Criar</h3><p>Escolher <b>materiais, combinações e personalidade</b> para a sua peça.</p></div>
      <div class="trioc"><div class="n">02</div><h3>Aprender</h3><p>Técnicas reais de <b>estruturação, montagem e acabamento</b>.</p></div>
      <div class="trioc"><div class="n">03</div><h3>Levar</h3><p>Uma <b>bolsa autoral</b> criada por você, pronta para usar.</p></div>
    </div>
    {foot("Não é só uma oficina")}
  </section>'''

# ===== 3 · COMO ACONTECE (jornada) =====
jornada = f'''
  <section class="slide">
{head_simple("Como acontece")}
    <span class="eyebrow orange">◆ Como a experiência acontece</span>
    <h2>Cinco horas, <em>cinco momentos</em></h2>
    <div class="jrn">
      {jstep("01 · Boas-vindas & inspiração", "grupo-oficina-atelie.webp", "Boas-vindas & inspiração", "Apresentação da experiência, dos materiais e das possibilidades.", "center 40%")}
      {jstep("02 · Escolhas & composição", "bag-couro-mesa.jpg", "Escolhas & composição", "Tecidos, ferragens, detalhes e acabamentos começam a ganhar personalidade.", "center 50%")}
      {jstep("03 · Mão na massa", "costura-costurando.jpg", "Mão na massa", "Estruturação e montagem da bolsa com orientação da profissional.", "center 45%")}
      {jstep("04 · Acabamentos", "charm-bolsa-suede.jpg", "Acabamentos", "Os detalhes finais transformam o projeto em uma peça pronta.", "center 50%")}
      {jstep("05 · O momento “eu que fiz”", "bucket-bag-preta.jpg", "O momento “eu que fiz”", "Cada participante termina e leva para casa a sua própria Bucket Bag.", "center 50%")}
    </div>
    {foot("Como acontece")}
  </section>'''

# ===== 4 · A PROFISSIONAL =====
prof = f'''
  <section class="slide">
{head_simple("A profissional")}
    <span class="eyebrow orange">◆ A profissional</span>
    <h2>Moda de perto, com <em>quem vive esse universo</em></h2>
    <div class="prof">
      <div class="pph">{img("bag-couro-mesa.jpg", "Orientação próxima durante a confecção, com materiais e ferramentas", "center 50%")}</div>
      <div>
        <p class="name">Úrsula Kaercher</p>
        <div class="role">Estilista · ≈ 20 anos de moda</div>
        <p class="ptx">A experiência é conduzida por <b>Úrsula Kaercher, estilista com cerca de 20 anos de atuação no mercado de moda</b>. Em um grupo intimista de apenas seis participantes, ela acompanha cada etapa de perto — compartilhando técnicas, orientando escolhas e ajudando cada pessoa a transformar materiais em uma peça pronta.</p>
        <div class="phigh">
          <div class="pi"><b>20 anos</b> de experiência em moda</div>
          <div class="pi"><b>Acompanhamento</b> próximo</div>
          <div class="pi"><b>Turma pequena</b> e privativa</div>
          <div class="pi"><b>Orientação</b> em todo o processo</div>
        </div>
      </div>
    </div>
    {foot("A profissional")}
  </section>'''

# ===== 5 · MAIS QUE A BOLSA =====
mais = f'''
  <section class="slide">
{head_simple("Mais que a bolsa")}
    <span class="eyebrow orange">◆ Mais que a bolsa</span>
    <h2>Uma tarde inteira para <em>criar, conversar e aproveitar</em></h2>
    <div class="mos">
      <figure class="big">{img("shoyu-pintura-amigas.jpg", "Amigas rindo durante a experiência", "center 35%")}<figcaption>Momentos para compartilhar</figcaption></figure>
      <figure>{img("menu-coffee.jpg", "Coffee break com comidinhas", "center 50%")}<figcaption>Coffee break</figcaption></figure>
      <figure>{img("charm-final-flatlay.jpg", "Brindes e mimos preparados para a experiência", "center 50%")}<figcaption>Brindes selecionados</figcaption></figure>
      <figure>{img("ecobag.jpg", "Eco bag exclusiva do projeto Eu Que Fiz", "center 50%")}<figcaption>Eco Bag exclusiva</figcaption></figure>
      <figure>{img("charm-bolsa-suede.jpg", "Bucket bag finalizada para levar", "center 50%")}<figcaption>A sua Bucket Bag</figcaption></figure>
    </div>
    {foot("Mais que a bolsa")}
  </section>'''

# ===== 6 · O QUE VOCÊ LEVA =====
leva = f'''
  <section class="slide">
{head_simple("O que você leva")}
    <span class="eyebrow orange">◆ O que você leva</span>
    <h2>Muito mais do que <em>uma bolsa</em></h2>
    <div class="leva">
      <div class="levac"><div class="em">👜</div><h4>Sua Bucket Bag</h4><p>Uma peça criada e finalizada por você, pronta para usar.</p></div>
      <div class="levac"><div class="em">🧵</div><h4>Uma nova habilidade</h4><p>Técnicas de estruturação, montagem e acabamento.</p></div>
      <div class="levac"><div class="em">🛍️</div><h4>Eco Bag exclusiva</h4><p>Um mimo do projeto “Eu Que Fiz”.</p></div>
      <div class="levac"><div class="em">🎁</div><h4>Brindes especiais</h4><p>Detalhes preparados para marcar o encontro.</p></div>
      <div class="levac"><div class="em">🧡</div><h4>A memória do dia</h4><p>Cinco horas vivendo algo novo, juntas.</p></div>
    </div>
    {foot("O que você leva")}
  </section>'''

# ===== 7 · TUDO INCLUSO =====
incluso = f'''
  <section class="slide">
{head_simple("Tudo incluso")}
    <span class="eyebrow orange">◆ Tudo incluso</span>
    <h2>A gente prepara tudo. <em>Vocês só chegam e criam.</em></h2>
    <div class="incsplit">
      <div class="ph">{img("bag-grupo-amigas.jpg", "Grupo de amigas criando junto na experiência", "center 30%")}</div>
      <div>
        <ul class="inclist">
          <li><span class="ck">✓</span>Experiência <b>privativa para 6</b></li>
          <li><span class="ck">✓</span>≈ <b>5 horas</b> de duração</li>
          <li><span class="ck">✓</span><b>Todos os materiais</b> da bolsa</li>
          <li><span class="ck">✓</span>Tecidos, ferragens e acabamentos</li>
          <li><span class="ck">✓</span>Estrutura e equipamentos</li>
          <li><span class="ck">✓</span><b>Orientação profissional</b></li>
          <li><span class="ck">✓</span>Acompanhamento individual</li>
          <li><span class="ck">✓</span><b>Mini Bucket Bag</b> de cada uma</li>
          <li><span class="ck">✓</span>Eco Bag exclusiva</li>
          <li><span class="ck">✓</span>Brindes selecionados</li>
          <li><span class="ck">✓</span>Coffee break com comidinhas</li>
        </ul>
        <div class="incnote">O padrão Elarah: <b>cuidamos da experiência do início ao fim</b> para o grupo simplesmente chegar e aproveitar.</div>
      </div>
    </div>
    {foot("Tudo incluso")}
  </section>'''

# ===== 8 · INVESTIMENTO =====
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Cinco horas para transformar uma ideia em <em>algo que você leva com você</em></h2>
    <div class="invwrap">
      <div class="invmain">
        <div class="tag">Por pessoa</div>
        <div class="big">R$ 789</div>
        <div class="per">experiência completa · ≈ 5h</div>
      </div>
      <div class="invside">
        <div class="invtot"><div class="k">Grupo · 6 participantes</div><div class="v">R$ 4.734 <small>turma privativa</small></div></div>
        <div class="invinc">Experiência privativa · 5 horas · todos os materiais · <b>acompanhamento profissional</b> · Bucket Bag individual · coffee break · Eco Bag + brindes.</div>
      </div>
    </div>
    {foot("Investimento")}
  </section>'''

# ===== 9 · FINAL =====
final = f'''
  <section class="slide">
{head_simple("Vamos criar?")}
    <span class="eyebrow orange">◆ Para fechar</span>
    <h2>Imagina terminar o dia e poder dizer: <em>“eu que fiz”</em></h2>
    <div class="finwrap">
      <div class="ph">{img("bucket-bag-dourada.jpg", "Bucket Bag finalizada, pronta para usar", "center 50%")}</div>
      <div class="ftx">
        <p class="lead">Mais do que aprender uma técnica, é reservar algumas horas para <strong>criar juntas, desacelerar</strong> e sair com <strong>algo feito pelas próprias mãos</strong>.</p>
        <div class="fincta">Vamos criar esse dia juntas? 🧡</div>
        <p class="fincontact"><i>Elarah · Experiências</i><br>WhatsApp <b>+55 (11) 91445-5930</b> · @elarah.oficial · elarah.com.br</p>
      </div>
    </div>
    {foot("Vamos criar?")}
  </section>'''

deck = ('<div class="deck">\n' + cover + nao + jornada + prof + leva + incluso + investimento + final + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/proposta-bucket-bag-ursula.html"
io.open(out, "w", encoding="utf-8").write(html)
for bad in ["fornecedor", "repasse", "comiss", "margem", "betc", "havas"]:
    assert bad not in deck.lower(), f"PROIBIDO: {bad}"
print("wrote", out, "| slides:", html.count('<section class="slide">'))
