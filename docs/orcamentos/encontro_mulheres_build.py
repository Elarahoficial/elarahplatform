# Proposta Elarah · Encontro de Mulheres · Vela Aromática (+ Decorada) · Coffee opcional
# MESMO MODELO do portfolio corporativo aprovado (pftitle, pqc, cards, noteband, invl, stc, ctabox).
# 31/10 · 60 mulheres (2 turmas de 30) · ABC Paulista · local a definir.
# Vela R$239/p (R$14.340) · Vela Decorada R$269/p (R$16.140). Coffee OPCIONAL (99/114/142).
# Sem alimentacao inclusa no workshop. Sem fornecedor/margem/comissao. Elarah no plural.
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/orcamento-adriana.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]

head = re.sub(r'<title>.*?</title>', '<title>Encontro de Mulheres · Vela Aromática · Elarah</title>', head, count=1, flags=re.DOTALL)
head = re.sub(r'<meta name="description"[^>]*>',
              '<meta name="description" content="Encontro de Mulheres · uma pausa para criar, sentir e compartilhar. Workshop de Vela Aromática artesanal para 60 participantes.">',
              head, count=1)

extra = '''
<style>
  /* capa (padrao corporativo) */
  .pftitle{text-align:right;line-height:1.5}
  .pftitle .top{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--navy-soft);font-weight:700}
  .pftitle .big{font-size:17px;font-weight:800;color:var(--navy);letter-spacing:.01em;margin-top:2px}
  .pftitle .big em{font-style:normal;color:var(--orange)}
  .pftitle .sub{font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--navy-soft);font-weight:700;margin-top:2px}
  .pfproof{display:flex;gap:11px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:13px 18px;box-shadow:0 12px 30px -24px rgba(0,0,0,.3)}
  .pfproof .star{color:var(--orange);font-size:14px}
  .pfproof p{font-size:12px;color:var(--navy-soft);line-height:1.5;margin:0}
  .pfproof b{color:var(--navy);font-weight:700}
  .pffoot{margin-top:auto;width:100%;box-sizing:border-box}
  /* note band (azul com borda laranja) */
  .noteband{margin-top:22px;background:#EBF1F4;border-left:4px solid var(--orange);border-radius:12px;padding:16px 22px;font-size:12.5px;color:var(--navy-soft);line-height:1.55}
  .noteband b{color:var(--navy);font-weight:700}
  /* 3 cards com foto (pqc) */
  .pqg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin-top:22px;width:100%}
  .pqc{background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 38px -26px rgba(0,0,0,.34);min-width:0}
  .pqc .ph{height:184px;position:relative;overflow:hidden}
  .pqc .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .pqc .bd{padding:18px 20px 20px}
  .pqc h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy);margin:0 0 7px;line-height:1.14}
  .pqc p{font-size:12px;color:var(--muted);line-height:1.55;margin:0}
  .pqc p b{color:var(--navy);font-weight:700}
  /* mosaico atmosfera (vibestrip) */
  .vibestrip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px;margin-top:22px;width:100%}
  .vibestrip figure{margin:0;border-radius:16px;overflow:hidden;position:relative;height:224px;box-shadow:0 14px 34px -24px rgba(0,0,0,.4)}
  .vibestrip img{width:100%;height:100%;object-fit:cover;display:block}
  .vibestrip figcaption{position:absolute;left:0;right:0;bottom:0;padding:30px 14px 13px;color:#fff;font-family:'DM Serif Display',serif;font-size:14px;line-height:1.2;background:linear-gradient(to top,rgba(46,31,42,.9),transparent)}
  /* cards de experiencia (cmp, 2 col) */
  .cmp{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px;margin-top:22px;width:100%;align-items:stretch}
  .cmpc{background:var(--card);border:1px solid var(--line);border-radius:20px;overflow:hidden;box-shadow:0 16px 38px -26px rgba(0,0,0,.34);display:flex;flex-direction:column;min-width:0}
  .cmpc.hl{border:2px solid var(--orange)}
  .cmpc .cph{height:196px;position:relative;overflow:hidden}
  .cmpc .cph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .cmpc .cbd{padding:22px 24px 24px;display:flex;flex-direction:column;flex:1}
  .cmpc .nm{font-family:'DM Serif Display',serif;font-size:22px;color:var(--navy);line-height:1.05}
  .cmpc .sg{display:inline-block;align-self:flex-start;background:var(--orange);color:#fff;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:800;padding:5px 12px;border-radius:999px;margin-top:9px}
  .cmpc .ds{font-size:12.5px;color:var(--muted);line-height:1.55;margin:12px 0 0}
  .cmpc .ds b{color:var(--navy);font-weight:700}
  .cmpc .pr{margin-top:auto;padding-top:14px;font-size:12.5px;font-weight:700;color:var(--navy-soft)}
  .cmpc .pr b{font-family:'DM Serif Display',serif;font-weight:400;font-size:24px;color:var(--orange-dark)}
  .cmpc .pr span{display:block;font-weight:600;color:var(--muted);margin-top:3px}
  .cmpnote{margin-top:16px;text-align:center;font-size:12.5px;color:var(--navy-soft)}
  .cmpnote b{color:var(--navy)}
  /* coffee opcional (3 cards) */
  .cbg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-top:16px;width:100%}
  .cbc{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px 22px;box-shadow:0 14px 34px -26px rgba(0,0,0,.3);display:flex;flex-direction:column;position:relative}
  .cbc.hl{border:2px solid var(--orange)}
  .cbc .sg{display:inline-block;align-self:flex-start;background:var(--orange);color:#fff;font-size:9px;letter-spacing:.1em;text-transform:uppercase;font-weight:800;padding:5px 11px;border-radius:999px;margin-bottom:9px}
  .cbc .nm{font-family:'DM Serif Display',serif;font-size:19px;color:var(--navy)}
  .cbc .pr{margin-top:7px;font-size:12px;font-weight:700;color:var(--orange-dark)}
  .cbc .pr b{font-family:'DM Serif Display',serif;font-weight:400;font-size:22px;color:var(--navy)}
  .cbc .pr small{color:var(--muted);font-weight:600;display:block;margin-top:2px}
  .cbc .it{margin-top:12px;font-size:11px;color:var(--muted);line-height:1.5}
  /* investimento lista (combos) */
  .invhero{display:flex;align-items:baseline;gap:14px;margin-top:4px}
  .invhero .n{font-family:'DM Serif Display',serif;font-size:42px;color:var(--navy);line-height:1}
  .invhero .n em{font-style:italic;color:var(--orange)}
  .invhero .l{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--navy-soft);font-weight:700;max-width:14ch;line-height:1.3}
  .combos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px;margin-top:20px;width:100%}
  .combo{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px 26px;box-shadow:0 14px 34px -26px rgba(0,0,0,.3)}
  .combo .ct{font-family:'DM Serif Display',serif;font-size:18px;color:var(--navy);margin:0 0 12px;line-height:1.1}
  .combo .cr{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid var(--line);padding:9px 0}
  .combo .cr:last-child{border-bottom:none}
  .combo .cr .k{font-size:12.5px;color:var(--navy-soft)}
  .combo .cr .v{font-family:'DM Serif Display',serif;font-size:16px;color:var(--orange-dark);white-space:nowrap}
  /* como funciona (stc) */
  .stg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:22px;width:100%}
  .stc{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px 24px;box-shadow:0 12px 30px -24px rgba(0,0,0,.3);display:flex;align-items:flex-start;gap:16px}
  .stc .n{font-family:'DM Serif Display',serif;font-size:30px;color:var(--orange);line-height:1;flex:none}
  .stc h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy);margin:0 0 5px;line-height:1.1}
  .stc p{font-size:12px;color:var(--muted);line-height:1.5;margin:0}
  /* fechamento */
  .finwrap{display:grid;grid-template-columns:1.02fr .98fr;gap:38px;margin-top:20px;align-items:center}
  .finwrap .ph{border-radius:20px;overflow:hidden;border:1px solid var(--line);box-shadow:0 22px 52px -28px rgba(0,0,0,.45);height:420px;position:relative}
  .finwrap .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .finwrap .ftx p.lead{margin-top:0}
  .ctabox{margin-top:18px;background:#EBF1F4;border-left:4px solid var(--orange);border-radius:14px;padding:20px 24px}
  .ctabox .t{font-family:'DM Serif Display',serif;font-size:18px;color:var(--navy);margin:0 0 6px;line-height:1.2}
  .ctabox .t em{font-style:italic;color:var(--orange)}
  .ctabox .el{font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:var(--orange-dark);font-weight:700}
  .cover-note{margin-top:14px;font-size:11.5px;color:var(--muted);font-style:italic;line-height:1.5;max-width:42ch}
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


def pqc(src, titulo, desc, pos="center 50%"):
    return (f'<div class="pqc"><div class="ph">{img(src, titulo, pos)}</div>'
            f'<div class="bd"><h3>{titulo}</h3><p>{desc}</p></div></div>')


def vfig(src, cap, pos="center 50%"):
    return f'<figure>{img(src, cap, pos)}<figcaption>{cap}</figcaption></figure>'


def cbc(nome, preco, total, desc, hl=False):
    cls = "cbc hl" if hl else "cbc"
    sg = '<span class="sg">Nossa sugestão</span>' if hl else ''
    return (f'<div class="{cls}">{sg}<div class="nm">{nome}</div>'
            f'<div class="pr"><b>{preco}</b> /pessoa<small>60 participantes · {total}</small></div>'
            f'<div class="it">{desc}</div></div>')


def crow(k, v):
    return f'<div class="cr"><span class="k">{k}</span><span class="v">{v}</span></div>'


def stc(n, titulo, desc):
    return f'<div class="stc"><div class="n">{n}</div><div><h3>{titulo}</h3><p>{desc}</p></div></div>'


# ===== 1 · CAPA =====
cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><div class="pftitle"><div class="top">Proposta de experiência</div><div class="big">Encontro de <em>Mulheres</em></div><div class="sub">Vela Aromática · 31.10</div></div></div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Uma experiência sensorial em grupo</span>
        <h1>Uma pausa para <em>criar, sentir e compartilhar</em></h1>
        <p class="lead">Entre aromas, conversas e mãos criando juntas, um encontro pensado para transformar algumas horas do dia em uma <strong>memória gostosa de levar para casa</strong>.</p>
        <div class="chips">
          <span class="chip"><b>31.10</b></span>
          <span class="chip"><b>60</b> mulheres</span>
          <span class="chip">2 turmas de 30</span>
          <span class="chip">ABC Paulista · local a definir</span>
        </div>
      </div>
      <div class="cover-photo">{img("vela-grupo-oficina.jpg", "Mulheres reunidas à mesa criando velas aromáticas", "center 40%")}</div>
    </div>
    <div class="pfproof pffoot"><span class="star">★</span><p>Aguardamos a <b>definição do espaço</b> para alinharmos os detalhes finais da experiência.</p></div>
    {foot("Encontro de Mulheres · 31.10")}
  </section>'''

# ===== 2 · A EXPERIÊNCIA =====
vela = f'''
  <section class="slide">
{head_simple("A experiência")}
    <span class="eyebrow orange">◆ A experiência</span>
    <h2>Vela <em>Aromática</em></h2>
    <p class="lead">Tem alguma coisa especial em <strong>criar com as próprias mãos</strong>. Escolher um aroma, acompanhar a vela ganhar forma e transformar aquele momento em algo só seu.</p>
    <div class="pqg">
      {pqc("velas3.jpg", "Criar com as próprias mãos", "Cada participante produz a <b>sua própria vela aromática artesanal</b>, do começo ao fim.", "center 50%")}
      {pqc("teoriavela.jpg", "Uma pausa sensorial", "Escolher fragrâncias e acompanhar o processo, num ritmo <b>leve e compartilhado</b>.", "center 45%")}
      {pqc("vela2.jpg", "Uma lembrança pra levar", "No final, a vela vai para casa — <b>e a memória do encontro também</b>.", "center 50%")}
    </div>
    <div class="noteband">◆ Uma pausa delicada e criativa para <b>desacelerar, despertar os sentidos</b> e criar algo só seu, com as próprias mãos. 🤍</div>
    {foot("A experiência")}
  </section>'''

# ===== 3 · A ATMOSFERA =====
atmosfera = f'''
  <section class="slide">
{head_simple("A atmosfera")}
    <span class="eyebrow orange">◆ A atmosfera</span>
    <h2>Uma mesa, bons aromas e <em>tempo para estar presente</em></h2>
    <p class="lead">Uma pausa na rotina para sentar juntas, criar sem pressa, conversar e viver algo diferente. A experiência acontece em torno de uma <strong>mesa preparada para receber o grupo</strong> — é só chegar, criar e aproveitar.</p>
    <div class="vibestrip">
      {vfig("teoriavela.jpg", "Mãos criando juntas", "center 45%")}
      {vfig("vela3.jpg", "Aromas escolhidos por cada uma", "center 50%")}
      {vfig("vela-grupo-oficina.jpg", "Conversas sem pressa", "center 40%")}
      {vfig("vela2.jpg", "Uma criação para levar", "center 50%")}
    </div>
    {foot("A atmosfera")}
  </section>'''

# ===== 4 · ESCOLHAM A EXPERIÊNCIA =====
comparativo = f'''
  <section class="slide">
{head_simple("Qual combina mais?")}
    <span class="eyebrow orange">◆ Nossa sugestão</span>
    <h2>Qual experiência combina mais com <em>esse encontro?</em></h2>
    <div class="cmp">
      <div class="cmpc hl">
        <div class="cph">{img("vela1.jpg", "Vela aromática artesanal em recipiente de vidro", "center 50%")}</div>
        <div class="cbd">
          <div class="nm">Vela Aromática</div>
          <span class="sg">Nossa sugestão</span>
          <p class="ds">Clássica, delicada e sensorial. Cada participante cria a <b>sua própria vela artesanal</b>.</p>
          <div class="pr">A partir de <b>R$ 239</b> / pessoa<span>60 participantes · R$ 14.340</span></div>
        </div>
      </div>
      <div class="cmpc">
        <div class="cph">{img("velas2.jpg", "Vela aromática decorada de forma delicada", "center 45%")}</div>
        <div class="cbd">
          <div class="nm">Vela Aromática Decorada</div>
          <p class="ds">Mais visual e personalizada. A experiência ganha uma <b>finalização especial</b> com detalhes decorativos.</p>
          <div class="pr">A partir de <b>R$ 269</b> / pessoa<span>60 participantes · R$ 16.140</span></div>
        </div>
      </div>
    </div>
    <p class="cmpnote"><b>2 turmas privativas de 30 participantes</b> · mesma experiência nos dois períodos.</p>
    {foot("Qual combina mais?")}
  </section>'''

# ===== 5 · COFFEE BREAK OPCIONAL =====
coffee = f'''
  <section class="slide">
{head_simple("Para completar")}
    <span class="eyebrow orange">◆ Quer deixar o encontro ainda mais completo?</span>
    <h2>Coffee break <em>opcional</em></h2>
    <div class="noteband">Também podemos preparar o coffee break para acompanhar esse momento — <b>tudo organizado no mesmo formato</b>, para vocês não precisarem se preocupar com a operação. ☕ Opcional · contratado adicionalmente.</div>
    <div class="cbg">
      {cbc("Essencial", "R$ 99", "R$ 5.940", "Mini sanduíches, salgado, doce, fruta ou iogurte, suco, água e café — com serviço de montagem.")}
      {cbc("Clássico", "R$ 114", "R$ 6.840", "A composição completa e equilibrada para acompanhar a experiência — montagem e utensílios inclusos.", hl=True)}
      {cbc("Especial", "R$ 142", "R$ 8.520", "Mais opções de salgados e doces, para transformar o coffee em parte importante do encontro.")}
    </div>
    {foot("Coffee break opcional")}
  </section>'''

# ===== 6 · A EXPERIÊNCIA COMPLETA =====
completa = f'''
  <section class="slide">
{head_simple("Experiência completa")}
    <span class="eyebrow orange">◆ Se quiserem juntar tudo</span>
    <h2>A experiência <em>completa</em></h2>
    <p class="lead">Uma composição opcional: a experiência + o coffee break, já no mesmo formato. O workshop também pode ser contratado sozinho.</p>
    <div class="combos">
      <div class="combo">
        <p class="ct">Vela Aromática + coffee</p>
        {crow("Com Essencial", "a partir de R$ 338")}
        {crow("Com Clássico", "a partir de R$ 353")}
        {crow("Com Especial", "a partir de R$ 381")}
      </div>
      <div class="combo">
        <p class="ct">Vela Aromática Decorada + coffee</p>
        {crow("Com Essencial", "a partir de R$ 368")}
        {crow("Com Clássico", "a partir de R$ 383")}
        {crow("Com Especial", "a partir de R$ 411")}
      </div>
    </div>
    <p class="fineprint">Valores por pessoa, a partir de. O coffee break é opcional e contratado adicionalmente. Cada proposta é ajustada conforme número de participantes, local e formato do encontro.</p>
    {foot("Experiência completa")}
  </section>'''

# ===== 7 · COMO FUNCIONA =====
como = f'''
  <section class="slide">
{head_simple("Como funciona")}
    <span class="eyebrow orange">◆ Como funciona</span>
    <h2>Simples do começo <em>ao fim</em></h2>
    <div class="stg">
      {stc("1", "Escolhemos a experiência", "Vela Aromática ou Vela Aromática Decorada.")}
      {stc("2", "Montamos o formato", "Definimos local, horários e se o encontro terá apenas a experiência ou também coffee break.")}
      {stc("3", "Preparamos tudo", "Nós organizamos os materiais, a estrutura e os detalhes para receber o grupo.")}
      {stc("4", "Vivemos o encontro", "É só chegar, criar juntas e aproveitar o momento.")}
    </div>
    {foot("Como funciona")}
  </section>'''

# ===== 8 · FECHAMENTO =====
final = f'''
  <section class="slide">
{head_simple("Para fechar")}
    <span class="eyebrow orange">◆ Para fechar</span>
    <h2>Criar com as próprias mãos — e <em>levar essa memória para casa</em></h2>
    <div class="finwrap">
      <div class="ph">{img("vela-grupo-oficina.jpg", "Mulheres criando e conversando juntas", "center 50%")}</div>
      <div class="ftx">
        <p class="lead">No fim, não é só sobre fazer uma vela. É sobre <strong>sentar juntas, conversar sem pressa, descobrir um aroma novo</strong> e transformar algumas horas do dia em uma lembrança compartilhada.</p>
        <div class="ctabox">
          <p class="t">Vamos adorar preparar <em>esse encontro</em> com vocês.</p>
          <p class="el">Vocês escolhem · nós cuidamos do restante</p>
        </div>
      </div>
    </div>
    {foot("Para fechar")}
  </section>'''

deck = ('<div class="deck">\n' + cover + vela + atmosfera + comparativo
        + coffee + completa + como + final + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/proposta-encontro-mulheres.html"
io.open(out, "w", encoding="utf-8").write(html)
for bad in ["fornecedor", "repasse", "comiss", "margem", "wax melt", "sob consulta"]:
    assert bad not in deck.lower(), f"PROIBIDO: {bad}"
for val in ["R$ 239", "R$ 14.340", "R$ 269", "R$ 16.140", "R$ 99", "R$ 5.940", "R$ 114",
            "R$ 6.840", "R$ 142", "R$ 8.520", "R$ 338", "R$ 353", "R$ 381", "R$ 368", "R$ 383", "R$ 411"]:
    assert val in deck, f"FALTA VALOR: {val}"
assert "Tudo preparado para viver" not in deck
assert deck.count("Wax Melts") == 0
print("wrote", out, "| slides:", html.count('<section class="slide">'))
