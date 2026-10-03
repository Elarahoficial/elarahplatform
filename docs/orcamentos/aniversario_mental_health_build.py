# Proposta Elarah · Aniversário Elarah Mental Health · manhã criativa para 6 pessoas · região Pinheiros/Itaim
# Padrao corporativo Elarah: vende primeiro ATMOSFERA/ocasiao, depois experiencias, espacos, formato, brinde, fechamento.
# SEM PRECOS (ainda em cotacao). Feminino, premium, editorial, clean. Fotos reais (atelie AGORA, vela, aquarela, cafe).
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/orcamento-adriana.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]

head = re.sub(r'<title>.*?</title>', '<title>Aniversário Elarah Mental Health · Manhã Criativa · Elarah</title>', head, count=1, flags=re.DOTALL)
head = re.sub(r'<meta name="description"[^>]*>',
              '<meta name="description" content="Uma manhã para celebrar, criar e estar juntas — experiência criativa para o aniversário da Elarah Mental Health.">',
              head, count=1)

extra = '''
<style>
  .pftitle{text-align:right;line-height:1.5}
  .pftitle .top{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--navy-soft);font-weight:700}
  .pftitle .big{font-size:16px;font-weight:800;color:var(--navy);letter-spacing:.01em;margin-top:2px}
  .pftitle .big em{font-style:normal;color:var(--orange)}
  .pftitle .sub{font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--navy-soft);font-weight:700;margin-top:2px}
  /* vibe chips */
  .vibe{display:flex;gap:9px;flex-wrap:wrap;margin-top:18px}
  .vibe .v{background:var(--card);border:1px solid var(--line);border-radius:999px;padding:8px 17px;font-family:'DM Serif Display',serif;font-size:14px;color:var(--navy)}
  .vibe .v em{font-style:italic;color:var(--orange)}
  /* moodboard */
  .mood{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px;margin-top:22px;width:100%}
  .mood figure{margin:0;border-radius:16px;overflow:hidden;position:relative;height:300px;box-shadow:0 16px 38px -26px rgba(0,0,0,.4)}
  .mood img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .mood figcaption{position:absolute;left:0;right:0;bottom:0;padding:30px 13px 12px;color:#fff;font-family:'DM Serif Display',serif;font-size:13.5px;line-height:1.18;background:linear-gradient(to top,rgba(46,31,42,.9),transparent)}
  /* experiencias (2x2 cards) */
  .exg{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:22px;width:100%}
  .exc{background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;display:grid;grid-template-columns:150px 1fr;box-shadow:0 16px 38px -26px rgba(0,0,0,.32);min-width:0;min-height:168px}
  .exc.sugg{border:2px solid var(--orange)}
  .exc .ph{position:relative;min-height:100%;overflow:hidden}
  .exc .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .exc .bd{padding:17px 20px 18px;display:flex;flex-direction:column;justify-content:center;min-width:0}
  .exc .tag{font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:800;color:var(--orange-dark)}
  .exc .nm{font-family:'DM Serif Display',serif;font-size:18px;color:var(--navy);margin:4px 0 6px;line-height:1.1}
  .exc .ds{font-size:11px;color:var(--muted);line-height:1.5;margin:0}
  /* espacos (venues) */
  .vng{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:20px;width:100%}
  .vn{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px 22px;box-shadow:0 14px 34px -26px rgba(0,0,0,.3);display:flex;flex-direction:column;min-width:0}
  .vn.sugg{border:2px solid var(--orange)}
  .vn .top{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
  .vn .nm{font-family:'DM Serif Display',serif;font-size:19px;color:var(--navy);line-height:1.08}
  .vn .rt{font-size:11px;font-weight:800;color:var(--orange-dark);white-space:nowrap}
  .vn .loc{font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--orange-dark);font-weight:800;margin-top:3px}
  .vn .ds{font-size:11.5px;color:var(--muted);line-height:1.5;margin:9px 0 0}
  .vn .sg{align-self:flex-start;margin-top:10px;background:var(--orange);color:#fff;font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;font-weight:800;padding:4px 11px;border-radius:999px}
  .vnote{margin-top:16px;background:#EBF1F4;border-left:4px solid var(--orange);border-radius:12px;padding:14px 20px;font-size:11.5px;color:var(--navy-soft);line-height:1.5}
  .vnote b{color:var(--navy);font-weight:700}
  /* formato elarah */
  .fmwrap{display:grid;grid-template-columns:.95fr 1.05fr;gap:34px;margin-top:22px;align-items:center}
  .fmwrap .ph{border-radius:20px;overflow:hidden;position:relative;height:420px;border:1px solid var(--line);box-shadow:0 22px 52px -28px rgba(0,0,0,.45)}
  .fmwrap .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .fmlist{list-style:none;margin:16px 0 0;padding:0;display:grid;gap:11px}
  .fmlist li{position:relative;padding-left:24px;font-size:13.5px;color:var(--navy-soft);line-height:1.4}
  .fmlist li .ck{position:absolute;left:0;top:0;color:var(--orange);font-weight:800}
  .fmlist li b{color:var(--navy);font-weight:700}
  /* brinde */
  .brg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin-top:22px;width:100%}
  .brc{background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 38px -26px rgba(0,0,0,.32);min-width:0}
  .brc .ph{height:180px;position:relative;overflow:hidden}
  .brc .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .brc .bd{padding:17px 20px 19px}
  .brc .nm{font-family:'DM Serif Display',serif;font-size:17px;color:var(--navy);line-height:1.1}
  .brc .ds{font-size:11px;color:var(--muted);line-height:1.5;margin:6px 0 0}
  .bropt{margin-top:18px;text-align:center;font-size:12px;color:var(--navy-soft)}
  .bropt b{color:var(--navy)}
  /* fechamento */
  .finwrap{display:grid;grid-template-columns:1fr 1.04fr;gap:36px;margin-top:20px;align-items:center}
  .finwrap .ph{border-radius:20px;overflow:hidden;position:relative;height:430px;border:1px solid var(--line);box-shadow:0 22px 52px -28px rgba(0,0,0,.45)}
  .finwrap .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .finwrap p.lead{margin-top:0}
  .datas{margin-top:16px;background:#EBF1F4;border-left:4px solid var(--orange);border-radius:14px;padding:16px 22px}
  .datas .k{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange-dark);font-weight:800}
  .datas .dd{display:flex;gap:8px;flex-wrap:wrap;margin-top:9px}
  .datas .d{background:var(--card);border:1px solid var(--line);border-radius:999px;padding:7px 15px;font-size:12.5px;font-weight:700;color:var(--navy)}
  .datas .mn{margin-top:9px;font-size:11px;color:var(--navy-soft);font-style:italic}
  .contact{margin-top:14px;font-size:11.5px;color:var(--navy-soft);line-height:1.5}
  .contact b{color:var(--navy)}
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


def mood(src, cap, pos="center 50%"):
    return f'<figure>{img(src, cap, pos)}<figcaption>{cap}</figcaption></figure>'


def exc(src, tag, nome, desc, pos="center 50%", sugg=False):
    cls = "exc sugg" if sugg else "exc"
    return (f'<div class="{cls}"><div class="ph">{img(src, nome, pos)}</div>'
            f'<div class="bd"><div class="tag">{tag}</div><div class="nm">{nome}</div><div class="ds">{desc}</div></div></div>')


def vn(nome, loc, rating, desc, sugg=False):
    cls = "vn sugg" if sugg else "vn"
    rt = f'<span class="rt">★ {rating}</span>' if rating else ''
    sg = '<span class="sg">★ Nossa sugestão</span>' if sugg else ''
    return (f'<div class="{cls}"><div class="top"><span class="nm">{nome}</span>{rt}</div>'
            f'<div class="loc">{loc}</div><div class="ds">{desc}</div>{sg}</div>')


def brc(src, nome, desc, pos="center 50%"):
    return (f'<div class="brc"><div class="ph">{img(src, nome, pos)}</div>'
            f'<div class="bd"><div class="nm">{nome}</div><div class="ds">{desc}</div></div></div>')


# ===== 1 · CAPA =====
cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><div class="pftitle"><div class="top">Proposta de experiência</div><div class="big">Elarah <em>Mental Health</em></div><div class="sub">Aniversário · manhã criativa</div></div></div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Aniversário · celebração criativa</span>
        <h1>Uma manhã para <em>celebrar, criar e estar juntas</em></h1>
        <p class="lead">Um encontro para marcar mais um ano da <strong>Elarah Mental Health</strong> — leve, intimista e cheio de cuidado, do tipo que fica na memória do time. 🧡</p>
        <div class="chips">
          <span class="chip">Período da manhã</span>
          <span class="chip"><b>6</b> participantes</span>
          <span class="chip">Pinheiros · Itaim</span>
        </div>
      </div>
      <div class="cover-photo">{img("agora-grupo.jpg", "Mulheres reunidas em volta de uma mesa criando juntas", "center 40%")}</div>
    </div>
    {foot("Aniversário · Elarah Mental Health")}
  </section>'''

# ===== 2 · VIBE & ATMOSFERA =====
vibe = f'''
  <section class="slide">
{head_simple("Vibe & atmosfera")}
    <span class="eyebrow orange">◆ A atmosfera que imaginamos</span>
    <h2>Uma manhã leve, intimista e <em>criativa</em></h2>
    <p class="lead">Pensada para um time pequeno que valoriza <strong>cuidado e atenção aos detalhes</strong>. Sair um pouco da rotina e criar um momento gostoso de celebração — com mesa bonita, materiais preparados, café, conversa e uma experiência feita com as mãos.</p>
    <div class="vibe">
      <span class="v">Criativa</span><span class="v"><em>Acolhedora</em></span><span class="v">Delicada</span><span class="v"><em>Intimista</em></span><span class="v">Sem pressa</span>
    </div>
    <div class="mood">
      {mood("agora-mesa.jpg", "Mesa posta", "center 50%")}
      {mood("colagem.jpg", "Mãos criando", "center 50%")}
      {mood("mesa-cafe-comemoracao.jpg", "Café & conversa", "center 50%")}
      {mood("velaaromatica.jpg", "Detalhes & aromas", "center 50%")}
    </div>
    {foot("Vibe & atmosfera")}
  </section>'''

# ===== 3 · EXPERIÊNCIAS =====
experiencias = f'''
  <section class="slide">
{head_simple("As experiências")}
    <span class="eyebrow orange">◆ Como materializamos essa manhã</span>
    <h2>Experiências <em>feitas com as mãos</em></h2>
    <p class="lead">Escolham a que mais combina com o time — todas sem necessidade de experiência prévia, no ritmo de uma <strong>manhã sem pressa</strong>.</p>
    <div class="exg">
      {exc("vela-aromatica-real.jpg", "Novidade", "Resina Criativa + Vela Aromática", "Cada participante cria uma peça em resina e a transforma em parte de um objeto final com vela.", "center 50%", sugg=True)}
      {exc("agora-pintando.jpg", "Arte", "Pausa com Arte", "Sair do automático pela arte, sem certo ou errado — pintura, desenho, argila ou colagem.", "center 45%")}
      {exc("vela-mesa-materiais.webp", "Sensorial", "Vela Aromática", "Criação da própria vela, da escolha das fragrâncias à composição da peça.", "center 50%")}
      {exc("aquarela1.jpg", "Criativa", "Aquarela &amp; Papelaria Criativa", "Pintura e composição em aquarela, com marcadores e pequenas peças autorais.", "center 40%")}
    </div>
    {foot("As experiências")}
  </section>'''

# ===== 4 · ONDE ACONTECE =====
onde = f'''
  <section class="slide">
{head_simple("Onde essa manhã pode acontecer")}
    <span class="eyebrow orange">◆ Escolhemos alguns espaços que combinam com a experiência</span>
    <h2>Onde essa manhã <em>pode acontecer</em></h2>
    <div class="vng">
      {vn("AGORA com Intu", "Pinheiros · ateliê criativo", "5,0", "Ateliê criativo com mesa longa e atmosfera artística — já recebe experiências como cerâmica, pintura e bordado.", sugg=True)}
      {vn("Raus Café", "Pinheiros · cafeteria", "4,9", "Mais casual e gostoso para uma manhã pequena, ideal para misturar experiência + café.")}
      {vn("Espaço Cardeal", "Pinheiros · espaço de eventos", "", "Mais privativo e corporativo, voltado a workshops e eventos, com estrutura para coffee break.")}
      {vn("Sterna Café · Faria Lima", "Itaim Bibi · cafeteria", "4,7", "Exatamente na região pedida, com uma atmosfera mais urbana e de café.")}
    </div>
    <div class="vnote">◆ Também podemos <b>levar a experiência até outro espaço</b> escolhido pelo grupo. Disponibilidade e possíveis taxas de locação são confirmadas após a escolha da experiência e da data.</div>
    {foot("Onde essa manhã pode acontecer")}
  </section>'''

# ===== 5 · O FORMATO ELARAH =====
formato = f'''
  <section class="slide">
{head_simple("O formato Elarah")}
    <span class="eyebrow orange">◆ Zero trabalho para o cliente</span>
    <h2>Vocês chegam. <em>A gente cuida do resto.</em></h2>
    <div class="fmwrap">
      <div class="ph">{img("grupo-oficina-atelie.webp", "Grupo vivenciando uma experiência criativa preparada pela Elarah", "center 40%")}</div>
      <div>
        <p class="lead">Uma experiência <strong>privativa</strong>, pensada nos detalhes para o time só precisar chegar e aproveitar.</p>
        <ul class="fmlist">
          <li><span class="ck">✦</span>Experiência <b>privativa para 6 pessoas</b></li>
          <li><span class="ck">✦</span><b>Profissional especializado</b> conduzindo</li>
          <li><span class="ck">✦</span>Todos os <b>materiais</b> inclusos</li>
          <li><span class="ck">✦</span>Preparação da <b>mesa e da experiência</b></li>
          <li><span class="ck">✦</span><b>Alinhamento com o espaço</b> escolhido</li>
          <li><span class="ck">✦</span><b>Acompanhamento Elarah</b> do início ao fim</li>
          <li><span class="ck">✦</span>Opção de incluir <b>café, registro e presente</b></li>
        </ul>
      </div>
    </div>
    {foot("O formato Elarah")}
  </section>'''

# ===== 6 · BRINDE OPCIONAL =====
brinde = f'''
  <section class="slide">
{head_simple("Um detalhe para levar")}
    <span class="eyebrow orange">◆ Opcional · lembrança da celebração</span>
    <h2>Um detalhe para <em>lembrar desse dia</em></h2>
    <p class="lead">Além da peça criada durante a experiência, podemos preparar um pequeno presente para cada participante — <strong>personalizado para o aniversário da Elarah Mental Health</strong>.</p>
    <div class="brg">
      {brc("garrafa-rosa-personalizada.jpg", "Garrafa personalizada", "Com o nome ou a identidade da empresa.", "center 50%")}
      {brc("HOMESPRAY.jpg", "Vela ou Home Spray", "Uma extensão sensorial da experiência.", "center 50%")}
      {brc("lipbalm-kit.jpg", "Kit de papelaria ou autocuidado", "Delicado e personalizado para o grupo.", "center 50%")}
    </div>
    <p class="bropt">Opcional · <b>valor conforme a escolha e a personalização</b>.</p>
    {foot("Um detalhe para levar")}
  </section>'''

# ===== 7 · FECHAMENTO =====
final = f'''
  <section class="slide">
{head_simple("Para fechar")}
    <span class="eyebrow orange">◆ Para fechar</span>
    <h2>Uma manhã pequena no tamanho. <em>Grande nos detalhes.</em></h2>
    <div class="finwrap">
      <div class="ph">{img("agora-hero.jpg", "Encontro criativo preparado para o time", "center 45%")}</div>
      <div>
        <p class="lead">Para celebrar mais um ano da <strong>Elarah Mental Health</strong>, queremos criar um encontro com a cara do time: bonito, leve, próximo e especial. Escolham a experiência que mais combina com vocês — nós cuidamos do restante. 🧡</p>
        <div class="datas">
          <div class="k">Datas sugeridas · período da manhã</div>
          <div class="dd"><span class="d">19–22/10</span><span class="d">24/10</span><span class="d">26–29/10</span><span class="d">31/10</span></div>
          <div class="mn">Confirmamos a data após a escolha da experiência e do espaço.</div>
        </div>
        <p class="contact"><i>Elarah · Experiências</i> · WhatsApp <b>+55 (11) 91445-5930</b> · @elarah.oficial · elarah.com.br</p>
      </div>
    </div>
    {foot("Aniversário · Elarah Mental Health")}
  </section>'''

deck = ('<div class="deck">\n' + cover + vibe + experiencias + onde
        + formato + brinde + final + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/proposta-aniversario-elarah-mental-health.html"
io.open(out, "w", encoding="utf-8").write(html)

# ---- guardas ----
for bad in ["fornecedor", "repasse", "comiss", "margem", "sob consulta"]:
    assert bad not in deck.lower(), f"PROIBIDO: {bad}"
# ainda em cotacao: nenhum preco pode aparecer
assert "R$" not in deck, "sem precos nesta versao (ainda em cotacao)"
assert "R$ 139" not in deck
for nome in ["Resina Criativa", "Pausa com Arte", "Vela Aromática", "Aquarela &amp; Papelaria",
             "AGORA com Intu", "Raus Café", "Espaço Cardeal", "Sterna Café", "Elarah Mental Health"]:
    assert nome in deck, f"FALTA: {nome}"
for frase in ["celebrar, criar e estar juntas", "A atmosfera que imaginamos",
              "Vocês chegam", "lembrar desse dia", "Grande nos detalhes"]:
    assert frase in deck, f"FALTA FRASE: {frase}"
# fotos com marca de terceiros fora
for marca in ["corp-grupo.jpg", "nbc-", "cozinha31", "weber-", "kitempresa.jpg"]:
    assert marca not in deck, f"FOTO COM MARCA: {marca}"
assert html.count('<section class="slide">') == 7, "esperado 7 slides"
print("wrote", out, "| slides:", html.count('<section class="slide">'))
