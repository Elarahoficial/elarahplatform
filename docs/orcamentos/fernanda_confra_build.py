# Proposta Elarah · Confraternizacao Corporativa de fim de ano (Fernanda) · ~25 pessoas
# Jornada 9h-16h: experiencia + almoco + bebidas. Grupo misto. Budget ~R$280/pessoa.
# Padrao portfolio recente. So experiencias reais do portfolio Elarah. Nao inventar valores.
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/orcamento-adriana.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]

head = re.sub(r'<title>.*?</title>', '<title>Confraternização Corporativa · Experiência Elarah</title>', head, count=1, flags=re.DOTALL)
head = re.sub(r'<meta name="description"[^>]*>',
              '<meta name="description" content="Proposta Elarah para uma confraternização corporativa de fim de ano: uma jornada de experiência, almoço e celebração para o time.">',
              head, count=1)

extra = '''
<style>
  .pflabel{text-align:right;line-height:1.7}
  .pflabel b{display:block;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--navy);font-weight:700}
  .pflabel span{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--navy-soft);font-weight:700}
  .chipcol{display:flex;flex-direction:column;align-items:flex-start;gap:10px;margin-top:4px}
  .pfproof{margin-top:16px;display:flex;gap:11px;align-items:flex-start;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:13px 16px;max-width:380px;box-shadow:0 12px 30px -24px rgba(0,0,0,.3)}
  .pfproof .star{color:var(--orange);font-size:14px;line-height:1.3}
  .pfproof p{font-size:11.5px;color:var(--navy-soft);line-height:1.5;margin:0}
  .pfproof b{color:var(--navy);font-weight:700}
  .ig{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:20px}
  .igc{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:19px 20px;box-shadow:0 12px 30px -24px rgba(0,0,0,.3)}
  .igc .em{font-size:23px;line-height:1}
  .igc h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy);margin:9px 0 6px;line-height:1.08}
  .igc p{font-size:11.5px;color:var(--muted);line-height:1.5;margin:0}
  .igc p b{color:var(--navy);font-weight:700}
  .qline{margin-top:18px;font-family:'DM Serif Display',serif;font-style:italic;font-size:17px;color:var(--orange-dark)}
  /* jornada (fluxo horizontal) */
  .jflow{display:flex;align-items:stretch;gap:0;margin-top:22px}
  .jflow .st{flex:1;background:var(--card);border:1px solid var(--line);border-radius:15px;padding:18px 12px;text-align:center;box-shadow:0 12px 30px -24px rgba(0,0,0,.3)}
  .jflow .st .em{font-size:24px;line-height:1}
  .jflow .st h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:15px;color:var(--navy);margin:9px 0 4px;line-height:1.1}
  .jflow .st p{font-size:10px;color:var(--muted);line-height:1.4;margin:0}
  .jflow .ar{display:flex;align-items:center;color:var(--orange);font-size:20px;padding:0 6px}
  /* roteiro */
  .rot{display:grid;gap:0;margin-top:20px}
  .rot .r{display:grid;grid-template-columns:118px 1fr;gap:20px;padding:12px 4px;border-bottom:1px solid var(--line);align-items:baseline}
  .rot .r:last-child{border-bottom:none}
  .rot .t{font-family:'DM Serif Display',serif;font-size:17px;color:var(--orange-dark);white-space:nowrap}
  .rot .a h3{font-size:13.5px;font-weight:700;color:var(--navy);margin:0 0 2px}
  .rot .a p{font-size:11px;color:var(--muted);line-height:1.45;margin:0}
  /* investimento pacote */
  .pkg{display:grid;grid-template-columns:1fr 1.25fr;gap:24px;margin-top:22px;align-items:stretch}
  .pkgbox{background:linear-gradient(158deg,var(--navy),#241722);color:#fff;border-radius:20px;padding:30px 30px;display:flex;flex-direction:column;justify-content:center;box-shadow:0 20px 48px -28px rgba(0,0,0,.5)}
  .pkgbox .tag{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange);font-weight:700}
  .pkgbox .big{font-family:'DM Serif Display',serif;font-size:46px;line-height:1.02;margin:10px 0 2px}
  .pkgbox .per{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.72);font-weight:700}
  .pkgbox .note{font-size:11px;color:rgba(255,255,255,.72);line-height:1.5;margin-top:16px}
  .pkgl{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:24px 28px;box-shadow:0 16px 40px -28px rgba(0,0,0,.3)}
  .pkgl h3{font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin:0 0 14px}
  .pkgl ul{list-style:none;margin:0;padding:0;display:grid;gap:11px}
  .pkgl li{position:relative;padding-left:27px;font-size:13px;color:var(--ink);line-height:1.4}
  .pkgl li b{color:var(--navy);font-weight:700}
  .pkgl li .ck{position:absolute;left:0;top:1px;width:18px;height:18px;border-radius:999px;background:var(--orange);color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center}
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


def igc(em, titulo, desc):
    return f'<div class="igc"><div class="em">{em}</div><h3>{titulo}</h3><p>{desc}</p></div>'


def jst(em, titulo, desc):
    return f'<div class="st"><div class="em">{em}</div><h3>{titulo}</h3><p>{desc}</p></div>'


def rotr(t, titulo, desc):
    return f'<div class="r"><div class="t">{t}</div><div class="a"><h3>{titulo}</h3><p>{desc}</p></div></div>'


def bfeat(foto, tag, titulo, desc, feats, pos="center 50%"):
    lis = "".join(f'<li><span class="st">✦</span>{f}</li>' for f in feats)
    return (f'<div class="bfeat"><div class="bphoto">{img(foto, titulo, pos)}</div>'
            f'<div class="bbody"><span class="btag">{tag}</span><h3>{titulo}</h3>'
            f'<p class="lead" style="margin-top:8px">{desc}</p><ul class="feat">{lis}</ul></div></div>')


# ===== 1 · CAPA =====
cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><div class="pflabel"><b>Confraternização Corporativa</b><span>Experiência Elarah</span></div></div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Confraternização de fim de ano</span>
        <h1>Um dia para <em>celebrar tudo</em> o que construímos juntos</h1>
        <p class="lead">Uma jornada para <strong>tirar o time da rotina</strong>, viver uma experiência criativa juntos e seguir o dia em clima de <strong>almoço e celebração</strong> — do café de boas-vindas ao brinde final.</p>
        <div class="chipcol">
          <span class="chip"><b>≈ 25</b> pessoas · grupo misto</span>
          <span class="chip"><b>7 a 17</b> de dezembro · 9h às 16h</span>
          <span class="chip">Vila Mariana e região</span>
        </div>
        <div class="pfproof"><span class="star">★</span><p>Experiências corporativas já realizadas para grupos como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)</p></div>
      </div>
      <div class="cover-photo">{img("bfa-grupo2.webp", "Time misto rindo e criando junto", "center 40%")}</div>
    </div>
    {foot("Preparado para Fernanda · Confraternização de fim de ano")}
  </section>'''

# ===== 2 · O ENCONTRO =====
encontro = f'''
  <section class="slide">
{head_simple("O encontro")}
    <span class="eyebrow orange">◆ O encontro</span>
    <h2>Mais que uma festa, <em>um dia juntos</em></h2>
    <p class="lead">Fechar o ano merece mais do que um happy hour. A ideia é <strong>reunir o time fora da rotina</strong> para criar algo com as próprias mãos, rir, conversar e <strong>celebrar o que foi construído</strong> — e seguir juntos no almoço e na confraternização.</p>
    <div class="qline">"Os melhores times se aproximam quando criam algo juntos."</div>
    <div class="ig">
      {igc("🎉", "Celebrar o ano", "Um momento à altura de tudo o que o time entregou.")}
      {igc("🤝", "Aproximar o time", "Conversa, colaboração e conexão — de um jeito leve e real.")}
      {igc("🎨", "Viver algo novo", "Uma experiência criativa, divertida e fora do óbvio.")}
    </div>
    {foot("O encontro")}
  </section>'''

# ===== 3 · A JORNADA =====
jornada = f'''
  <section class="slide">
{head_simple("A jornada")}
    <span class="eyebrow orange">◆ A jornada do dia</span>
    <h2>Um dia pensado para <em>fluir</em></h2>
    <p class="lead">Da recepção ao brinde final, cada momento conduz o time para <strong>criar, almoçar e celebrar</strong> — sem pressa, no ritmo do grupo.</p>
    <div class="jflow">
      {jst("☕", "Recepção", "Café de boas-vindas e integração.")}
      <div class="ar">›</div>
      {jst("🎨", "Experiência", "A atividade criativa, mão na massa.")}
      <div class="ar">›</div>
      {jst("🍽️", "Almoço", "Almoço descontraído no espaço.")}
      <div class="ar">›</div>
      {jst("🥂", "Confraternização", "Bebidas, conversa e integração.")}
      <div class="ar">›</div>
      {jst("✨", "Brinde final", "Fotos do grupo e encerramento.")}
    </div>
    <div class="bnote" style="margin-top:20px">◆ Uma estrutura <strong>flexível</strong>: ajustamos o ritmo e os momentos conforme o espaço e a experiência escolhidos. 🥂</div>
    {foot("A jornada")}
  </section>'''

# ===== 4 · EXPERIÊNCIA 01 =====
exp1 = f'''
  <section class="slide">
{head_simple("Experiência · opção 01")}
    <span class="eyebrow orange">◆ Opção de experiência 01</span>
    <h2>Pintura em <em>Taça</em></h2>
    {bfeat("pinturatacavinho.jpg", "Criativa · para todos", "Cada um pinta a própria taça", "Uma experiência leve e sofisticada: cada pessoa personaliza a própria taça e brinda com ela. Funciona muito bem para grupos mistos e já entra no clima de celebração.", ["<b>Todos participam</b> — simples, divertido e sem segredo", "<b>Conduzida</b> por profissional, com materiais inclusos", "Cada um <b>leva a própria taça</b> pra casa"], "center 45%")}
    {foot("Experiência · opção 01")}
  </section>'''

# ===== 5 · EXPERIÊNCIA 02 =====
exp2 = f'''
  <section class="slide">
{head_simple("Experiência · opção 02")}
    <span class="eyebrow orange">◆ Opção de experiência 02</span>
    <h2>Coquetelaria <em>&amp; Drinks</em></h2>
    {bfeat("drinksclassicos.jpg", "Interativa · happy hour", "Preparam os próprios drinks", "A cara de um happy hour premium: com um bartender, o time aprende técnicas e prepara os próprios drinks autorais (com versões sem álcool). Interação garantida e ótima aderência para grupos mistos.", ["<b>Mão na massa</b> — cada um cria o próprio drink", "Com <b>bartender</b> conduzindo, materiais inclusos", "Versões <b>com e sem álcool</b>"], "center 45%")}
    {foot("Experiência · opção 02")}
  </section>'''

# ===== 6 · ALMOÇO & CONFRATERNIZAÇÃO =====
almoco = f'''
  <section class="slide">
{head_simple("Almoço & confraternização")}
    <span class="eyebrow orange">◆ Depois da experiência</span>
    <h2>Ficar juntos, <em>sem pressa</em></h2>
    <p class="lead">A experiência é só o começo do dia. Depois de criar, o time segue no mesmo espaço para um <strong>almoço descontraído</strong>, com <strong>bebidas, conversa e integração</strong> — o tempo certo para o grupo relaxar e celebrar junto.</p>
    <div class="bfeat" style="margin-top:18px">
      <div class="bphoto">{img("jantar-vista.jpg", "Time reunido no almoço com bebidas", "center 45%")}</div>
      <div class="bbody">
        <span class="btag">No mesmo espaço</span>
        <h3>Almoço &amp; brinde</h3>
        <ul class="feat">
          <li><span class="st">✦</span><b>Almoço</b> descontraído, integrado à experiência</li>
          <li><span class="st">✦</span><b>Bebidas</b> e tempo livre para conversa</li>
          <li><span class="st">✦</span>Um <b>brinde de encerramento</b> e fotos do grupo</li>
        </ul>
      </div>
    </div>
    {foot("Almoço & confraternização")}
  </section>'''

# ===== 7 · ROTEIRO =====
roteiro = f'''
  <section class="slide">
{head_simple("Roteiro do dia")}
    <span class="eyebrow orange">◆ Como o dia acontece</span>
    <h2>Das <em>9h às 16h</em></h2>
    <div class="rot">
      {rotr("09h00", "Boas-vindas &amp; café", "Chegada dos convidados, café de recepção e integração inicial.")}
      {rotr("09h30", "Experiência Elarah", "Início da experiência criativa, conduzida pelo facilitador.")}
      {rotr("11h30", "Encerramento da experiência", "Finalização das peças, fotos e momento livre de conversa.")}
      {rotr("12h00", "Almoço", "Almoço descontraído no próprio espaço.")}
      {rotr("13h30", "Confraternização", "Bebidas, conversa e integração do grupo.")}
      {rotr("15h30", "Brinde de encerramento", "Fechamento, fotos do grupo e último momento de convivência.")}
      {rotr("16h00", "Encerramento", "")}
    </div>
    <p class="fineprint">Roteiro de referência — totalmente <b>personalizável</b> conforme o espaço e a experiência escolhidos.</p>
    {foot("Roteiro do dia")}
  </section>'''

# ===== 8 · ESPAÇO =====
espaco = f'''
  <section class="slide">
{head_simple("O espaço")}
    <span class="eyebrow orange">◆ Onde acontece</span>
    <h2>Um espaço <em>na sua região</em></h2>
    <p class="lead">A Elarah sugere um <strong>espaço parceiro</strong> em Vila Mariana, Vila Clementino, Saúde, Ibirapuera ou Ipiranga — um ambiente contemporâneo e acolhedor, que comporte a <strong>experiência, o almoço e a confraternização</strong> no mesmo lugar.</p>
    <div class="bfeat" style="margin-top:18px">
      <div class="bphoto">{img("piselli-salao.jpg", "Espaço contemporâneo e acolhedor", "center 50%")}</div>
      <div class="bbody">
        <span class="btag">Sugestão Elarah</span>
        <h3>Contemporâneo &amp; integrado</h3>
        <ul class="feat">
          <li><span class="st">✦</span>Na <b>região solicitada</b> ou próxima</li>
          <li><span class="st">✦</span>Comporta <b>experiência + almoço</b> no mesmo espaço</li>
          <li><span class="st">✦</span>Clima <b>elegante e descontraído</b> para ~25 pessoas</li>
        </ul>
      </div>
    </div>
    <p class="fineprint">Espaço e disponibilidade confirmados ao fechar a data (entre 7 e 17 de dezembro).</p>
    {foot("O espaço")}
  </section>'''

# ===== 9 · INVESTIMENTO =====
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>A jornada <em>completa</em></h2>
    <p class="lead">Uma proposta pensada para caber no <strong>budget do time</strong>, reunindo tudo o que o dia precisa em um só valor por pessoa.</p>
    <div class="pkg">
      <div class="pkgbox">
        <div class="tag">Jornada completa · por pessoa</div>
        <div class="big">≈ R$ 280</div>
        <div class="per">para o grupo de ≈ 25 pessoas</div>
      </div>
      <div class="pkgl">
        <h3>Tudo incluso</h3>
        <ul>
          <li><span class="ck">✓</span><b>Experiência Elarah</b> — condução profissional e materiais</li>
          <li><span class="ck">✓</span><b>Espaço</b> parceiro na região</li>
          <li><span class="ck">✓</span><b>Almoço</b> para o grupo</li>
          <li><span class="ck">✓</span><b>Bebidas</b> e confraternização</li>
          <li><span class="ck">✓</span><b>Operação Elarah</b> — montagem, condução e organização</li>
        </ul>
      </div>
    </div>
    <p class="fineprint"><b>Valor-alvo da proposta:</b> o investimento final é fechado conforme o espaço e a experiência escolhidos — montamos o melhor custo-benefício dentro do seu budget. Experiências sem Tufting para equilibrar o orçamento com espaço, almoço e bebidas. Valores confirmados conforme espaço, experiência e número final de convidados.</p>
    {foot("Investimento")}
  </section>'''

# ===== 10 · ENCERRAMENTO =====
encerramento = f'''
  <section class="slide">
{head_simple("Vamos criar juntos?")}
    <span class="eyebrow orange">◆ Para fechar o ano</span>
    <h2>Um dia para o time <em>levar na memória</em></h2>
    <p class="lead">Mais do que encerrar um ano, queremos criar um dia para o time <strong>celebrar, se conectar e levar uma boa memória</strong> dessa jornada juntos.</p>
    <div class="qline">Vamos criar esse encontro juntos?</div>
    <div class="quote" style="margin-top:20px">
      É só escolher a experiência e a data que a gente cuida de tudo. 🥂<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Preparado para Fernanda")}
  </section>'''

deck = ('<div class="deck">\n' + cover + encontro + jornada + exp1 + exp2 + almoco
        + roteiro + espaco + investimento + encerramento + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/proposta-confraternizacao-fernanda.html"
io.open(out, "w", encoding="utf-8").write(html)
assert "Tufting" not in deck.replace("sem Tufting", "") or "sem Tufting" in deck
print("wrote", out, "| slides:", html.count('<section class="slide">'))
