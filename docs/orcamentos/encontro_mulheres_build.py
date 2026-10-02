# Proposta Elarah · Encontro de Mulheres · Vela Aromática (+ Decorada) · Coffee opcional
# 31/10 · 60 mulheres (2 turmas de 30) · ABC Paulista · local a definir.
# Narrativa feminina, sensorial, acolhedora. Vela em recipiente de vidro, processo manual.
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
  .cover-note{margin-top:16px;font-size:11.5px;color:var(--muted);font-style:italic;line-height:1.5;max-width:40ch}
  /* experiencia (split foto + texto) */
  .exp{display:grid;grid-template-columns:1.02fr .98fr;gap:38px;margin-top:20px;align-items:center}
  .exp.rev .ph{order:2}
  .exp .ph{border-radius:20px;overflow:hidden;border:1px solid var(--line);box-shadow:0 20px 48px -28px rgba(0,0,0,.45);height:420px;position:relative}
  .exp .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .exp p.tx{font-size:14.5px;color:var(--ink);line-height:1.7;margin:0 0 12px}
  .exp p.tx b{color:var(--navy);font-weight:700}
  .exp .price{margin-top:8px;display:inline-flex;align-items:baseline;gap:12px;flex-wrap:wrap}
  .exp .price .pp{font-family:'DM Serif Display',serif;font-size:32px;color:var(--navy);line-height:1}
  .exp .price .pp small{font-family:'DM Sans',sans-serif;font-size:12px;color:var(--muted);font-weight:600}
  .exp .price .tt{font-size:12.5px;color:var(--navy-soft);font-weight:700}
  .exp .price .tt b{color:var(--orange-dark)}
  /* atmosfera mosaico */
  .atm{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px;margin-top:22px;width:100%}
  .atm figure{margin:0;border-radius:16px;overflow:hidden;position:relative;height:230px;box-shadow:0 14px 34px -24px rgba(0,0,0,.4)}
  .atm img{width:100%;height:100%;object-fit:cover;display:block}
  .atm figcaption{position:absolute;left:0;right:0;bottom:0;padding:30px 14px 13px;color:#fff;font-family:'DM Serif Display',serif;font-size:14px;line-height:1.2;background:linear-gradient(to top,rgba(46,31,42,.9),transparent)}
  /* comparativo */
  .cmp{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px;margin-top:22px;width:100%;align-items:stretch}
  .cmpc{background:var(--card);border:1px solid var(--line);border-radius:20px;overflow:hidden;box-shadow:0 16px 38px -26px rgba(0,0,0,.34);display:flex;flex-direction:column;min-width:0}
  .cmpc.hl{border:2px solid var(--orange)}
  .cmpc .cph{height:190px;position:relative;overflow:hidden}
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
  /* coffee opcional */
  .cbintro{background:#FBF1EE;border-radius:16px;padding:16px 22px;margin-top:18px;font-size:13px;color:var(--navy-soft);line-height:1.55}
  .cbintro b{color:var(--navy)}
  .cbtag{display:inline-block;background:var(--navy);color:#fff;font-size:10px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;padding:6px 14px;border-radius:999px;margin-bottom:12px}
  .cbg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-top:14px;width:100%}
  .cbc{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px 22px;box-shadow:0 14px 34px -26px rgba(0,0,0,.3);display:flex;flex-direction:column;position:relative}
  .cbc.hl{border:2px solid var(--orange)}
  .cbc .sg{display:inline-block;align-self:flex-start;background:var(--orange);color:#fff;font-size:9px;letter-spacing:.1em;text-transform:uppercase;font-weight:800;padding:5px 11px;border-radius:999px;margin-bottom:9px}
  .cbc .nm{font-family:'DM Serif Display',serif;font-size:19px;color:var(--navy)}
  .cbc .pr{margin-top:7px;font-size:12px;font-weight:700;color:var(--orange-dark)}
  .cbc .pr b{font-family:'DM Serif Display',serif;font-weight:400;font-size:22px;color:var(--navy)}
  .cbc .pr small{color:var(--muted);font-weight:600;display:block;margin-top:2px}
  .cbc .it{margin-top:12px;font-size:11px;color:var(--muted);line-height:1.5}
  /* experiencia completa (combos) */
  .combos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px;margin-top:22px;width:100%}
  .combo{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:24px 26px;box-shadow:0 14px 34px -26px rgba(0,0,0,.3)}
  .combo .ct{font-family:'DM Serif Display',serif;font-size:19px;color:var(--navy);margin:0 0 14px;line-height:1.1}
  .combo .cr{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid var(--line);padding:9px 0}
  .combo .cr:last-child{border-bottom:none}
  .combo .cr .k{font-size:12.5px;color:var(--navy-soft)}
  .combo .cr .v{font-family:'DM Serif Display',serif;font-size:17px;color:var(--orange-dark);white-space:nowrap}
  .combo .cr .v small{font-family:'DM Sans',sans-serif;font-size:10px;color:var(--muted);font-weight:600}
  /* fluxo */
  .flow{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:22px;width:100%}
  .fstep{display:flex;align-items:flex-start;gap:16px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px 22px;box-shadow:0 12px 30px -26px rgba(0,0,0,.3)}
  .fstep .fn{width:36px;height:36px;flex:none;border-radius:999px;background:var(--orange);color:#fff;font-family:'DM Serif Display',serif;font-size:17px;display:flex;align-items:center;justify-content:center}
  .fstep h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy);margin:0 0 4px;line-height:1.1}
  .fstep p{font-size:12px;color:var(--muted);line-height:1.45;margin:0}
  /* fechamento */
  .finwrap{display:grid;grid-template-columns:1.02fr .98fr;gap:38px;margin-top:20px;align-items:center}
  .finwrap .ph{border-radius:20px;overflow:hidden;border:1px solid var(--line);box-shadow:0 22px 52px -28px rgba(0,0,0,.45);height:430px;position:relative}
  .finwrap .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .finwrap .ftx p.tx{font-size:14px;color:var(--ink);line-height:1.7;margin:0 0 12px}
  .finwrap .ftx p.tx b{color:var(--navy);font-weight:700}
  .finsign{margin-top:16px;font-family:'DM Serif Display',serif;font-size:17px;color:var(--navy);line-height:1.35}
  .finsign em{font-style:italic;color:var(--orange)}
  .finsign .el{display:block;margin-top:10px;font-size:14px;letter-spacing:.16em;text-transform:uppercase;color:var(--orange-dark);font-weight:700;font-family:'DM Sans',sans-serif}
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


def vfig(src, cap, pos="center 50%"):
    return f'<figure>{img(src, cap, pos)}<figcaption>{cap}</figcaption></figure>'


# ===== 1 · CAPA =====
cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Encontro de Mulheres · Elarah</span></div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Uma experiência sensorial em grupo</span>
        <h1>Uma pausa para <em>criar, sentir e compartilhar</em></h1>
        <p class="lead">Entre aromas, conversas e mãos criando juntas, um encontro pensado para transformar algumas horas do dia em uma <strong>memória gostosa de levar para casa</strong>.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>31.10</b></span>
          <span class="chip"><b>60</b> mulheres</span>
          <span class="chip">2 turmas de 30</span>
          <span class="chip">ABC Paulista · local a definir</span>
        </div>
        <p class="cover-note">Aguardamos a definição do espaço para alinharmos os detalhes finais da experiência.</p>
      </div>
      <div class="cover-photo">{img("vela-grupo-oficina.jpg", "Mulheres reunidas à mesa criando velas aromáticas", "center 40%")}</div>
    </div>
    {foot("Encontro de Mulheres · 31.10")}
  </section>'''

# ===== 2 · VELA AROMÁTICA =====
vela = f'''
  <section class="slide">
{head_simple("A experiência")}
    <span class="eyebrow orange">◆ A experiência</span>
    <h2>Vela <em>Aromática</em></h2>
    <div class="exp">
      <div class="ph">{img("velas3.jpg", "Mãos criando velas aromáticas em recipientes de vidro", "center 50%")}</div>
      <div>
        <p class="tx">Tem alguma coisa especial em <b>criar com as próprias mãos</b>. Escolher um aroma, acompanhar a vela ganhar forma e transformar aquele momento em algo só seu.</p>
        <p class="tx">Nesta experiência, cada participante produz a <b>sua própria vela aromática artesanal</b> em uma pausa leve, sensorial e compartilhada.</p>
        <p class="tx">No final, a vela vai para casa — <b>e a memória do encontro também</b>.</p>
      </div>
    </div>
    {foot("A experiência")}
  </section>'''

# ===== 3 · A ATMOSFERA =====
atmosfera = f'''
  <section class="slide">
{head_simple("A atmosfera")}
    <span class="eyebrow orange">◆ A atmosfera</span>
    <h2>Uma mesa, bons aromas e <em>tempo para estar presente</em></h2>
    <p class="lead">Uma pausa na rotina para sentar juntas, criar sem pressa, conversar e viver algo diferente. A experiência acontece em torno de uma <strong>mesa preparada para receber o grupo</strong>, com materiais organizados e toda a condução necessária — é só chegar, criar e aproveitar.</p>
    <div class="atm">
      {vfig("teoriavela.jpg", "Mãos criando juntas", "center 45%")}
      {vfig("vela3.jpg", "Aromas escolhidos por cada uma", "center 50%")}
      {vfig("vela-grupo-oficina.jpg", "Conversas sem pressa", "center 40%")}
      {vfig("vela2.jpg", "Uma criação para levar", "center 50%")}
    </div>
    {foot("A atmosfera")}
  </section>'''

# ===== 4 · VELA AROMÁTICA DECORADA =====
decorada = f'''
  <section class="slide">
{head_simple("Segunda experiência")}
    <span class="eyebrow orange">◆ Segunda experiência</span>
    <h2>Vela Aromática <em>Decorada</em></h2>
    <div class="exp rev">
      <div class="ph">{img("velas2.jpg", "Vela aromática artesanal com acabamento decorado delicado", "center 45%")}</div>
      <div>
        <p class="tx"><b>Uma versão mais visual e personalizada.</b></p>
        <p class="tx">Cada participante cria a sua própria vela aromática e, na finalização, a peça ganha <b>detalhes decorativos</b>, que podem ser alinhados conforme o conceito escolhido para o encontro.</p>
        <p class="tx">Uma forma delicada de deixar cada criação ainda mais única.</p>
        <div class="price"><span class="pp">R$ 269 <small>/pessoa</small></span><span class="tt">60 participantes<br><b>R$ 16.140</b></span></div>
      </div>
    </div>
    {foot("Segunda experiência")}
  </section>'''

# ===== 5 · COMPARATIVO / INVESTIMENTO =====
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

# ===== 6 · COFFEE BREAK OPCIONAL =====
coffee = f'''
  <section class="slide">
{head_simple("Para completar")}
    <span class="eyebrow orange">◆ Quer deixar o encontro ainda mais completo?</span>
    <h2>Coffee break <em>opcional</em></h2>
    <div class="cbintro">Também podemos preparar o coffee break para acompanhar esse momento — <b>tudo organizado no mesmo formato</b>, para vocês não precisarem se preocupar com a operação. <span style="white-space:nowrap">☕ Opcional · contratado adicionalmente.</span></div>
    <div class="cbg">
      <div class="cbc">
        <div class="nm">Essencial</div>
        <div class="pr"><b>R$ 99</b> /pessoa<small>60 participantes · R$ 5.940</small></div>
        <div class="it">Mini sanduíches, salgado, doce, fruta ou iogurte, suco, água e café — com serviço de montagem.</div>
      </div>
      <div class="cbc hl">
        <span class="sg">Nossa sugestão</span>
        <div class="nm">Clássico</div>
        <div class="pr"><b>R$ 114</b> /pessoa<small>60 participantes · R$ 6.840</small></div>
        <div class="it">A composição completa e equilibrada para acompanhar a experiência — montagem e utensílios inclusos.</div>
      </div>
      <div class="cbc">
        <div class="nm">Especial</div>
        <div class="pr"><b>R$ 142</b> /pessoa<small>60 participantes · R$ 8.520</small></div>
        <div class="it">Mais opções de salgados e doces, para transformar o coffee em parte importante do encontro.</div>
      </div>
    </div>
    {foot("Coffee break opcional")}
  </section>'''

# ===== 7 · EXPERIÊNCIA COMPLETA (combos) =====
completa = f'''
  <section class="slide">
{head_simple("Experiência completa")}
    <span class="eyebrow orange">◆ Se quiserem juntar tudo</span>
    <h2>A experiência <em>completa</em></h2>
    <p class="lead">Uma composição opcional: a experiência + o coffee break, já no mesmo formato. O workshop também pode ser contratado sozinho.</p>
    <div class="combos">
      <div class="combo">
        <p class="ct">Vela Aromática + coffee</p>
        <div class="cr"><span class="k">Com Essencial</span><span class="v">a partir de R$ 338<small> /p</small></span></div>
        <div class="cr"><span class="k">Com Clássico</span><span class="v">a partir de R$ 353<small> /p</small></span></div>
        <div class="cr"><span class="k">Com Especial</span><span class="v">a partir de R$ 381<small> /p</small></span></div>
      </div>
      <div class="combo">
        <p class="ct">Vela Aromática Decorada + coffee</p>
        <div class="cr"><span class="k">Com Essencial</span><span class="v">a partir de R$ 368<small> /p</small></span></div>
        <div class="cr"><span class="k">Com Clássico</span><span class="v">a partir de R$ 383<small> /p</small></span></div>
        <div class="cr"><span class="k">Com Especial</span><span class="v">a partir de R$ 411<small> /p</small></span></div>
      </div>
    </div>
    <p class="fineprint">Valores por pessoa, a partir de. O coffee break é opcional e contratado adicionalmente. Cada proposta é ajustada conforme número de participantes, local e formato do encontro.</p>
    {foot("Experiência completa")}
  </section>'''

# ===== 8 · COMO FUNCIONA =====
como = f'''
  <section class="slide">
{head_simple("Como funciona")}
    <span class="eyebrow orange">◆ Como funciona</span>
    <h2>Simples do começo <em>ao fim</em></h2>
    <div class="flow">
      <div class="fstep"><div class="fn">1</div><div><h3>Escolhemos a experiência</h3><p>Vela Aromática ou Vela Aromática Decorada.</p></div></div>
      <div class="fstep"><div class="fn">2</div><div><h3>Montamos o formato</h3><p>Definimos local, horários e se o encontro terá apenas a experiência ou também coffee break.</p></div></div>
      <div class="fstep"><div class="fn">3</div><div><h3>Preparamos tudo</h3><p>Nós organizamos os materiais, a estrutura e os detalhes para receber o grupo.</p></div></div>
      <div class="fstep"><div class="fn">4</div><div><h3>Vivemos o encontro</h3><p>É só chegar, criar juntas e aproveitar o momento.</p></div></div>
    </div>
    {foot("Como funciona")}
  </section>'''

# ===== 9 · FECHAMENTO =====
final = f'''
  <section class="slide">
{head_simple("Para fechar")}
    <span class="eyebrow orange">◆ Para fechar</span>
    <h2>Uma pausa no dia para criar com as próprias mãos — e <em>levar essa memória para casa</em></h2>
    <div class="finwrap">
      <div class="ph">{img("vela-grupo-oficina.jpg", "Mulheres criando e conversando juntas", "center 50%")}</div>
      <div class="ftx">
        <p class="tx">No fim, não é só sobre fazer uma vela. É sobre <b>sentar juntas, conversar sem pressa, descobrir um aroma novo</b> e transformar algumas horas do dia em uma lembrança compartilhada.</p>
        <p class="tx">Vamos adorar preparar esse encontro com vocês.</p>
        <div class="finsign">Vocês escolhem a experiência. <em>Nós cuidamos do restante.</em><span class="el">Elarah</span></div>
      </div>
    </div>
    {foot("Para fechar")}
  </section>'''

deck = ('<div class="deck">\n' + cover + vela + atmosfera + decorada + comparativo
        + coffee + completa + como + final + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/proposta-encontro-mulheres.html"
io.open(out, "w", encoding="utf-8").write(html)
# guards
for bad in ["fornecedor", "repasse", "comiss", "margem", "wax melt", "sob consulta"]:
    assert bad not in deck.lower(), f"PROIBIDO: {bad}"
for val in ["R$ 239", "R$ 14.340", "R$ 269", "R$ 16.140", "R$ 99", "R$ 5.940", "R$ 114",
            "R$ 6.840", "R$ 142", "R$ 8.520", "R$ 338", "R$ 353", "R$ 381", "R$ 368", "R$ 383", "R$ 411"]:
    assert val in deck, f"FALTA VALOR: {val}"
# nao mencionar cafe/bolo como incluso no workshop (so na secao coffee opcional)
assert "Tudo preparado para viver" not in deck
assert deck.count("Wax Melts") == 0 and deck.count("Wax melt") == 0
print("wrote", out, "| slides:", html.count('<section class="slide">'))
