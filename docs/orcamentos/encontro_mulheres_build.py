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
  .pqc .bd.word{padding:20px;text-align:center}
  .pqc .bd.word h3{margin:0;font-size:22px;color:var(--orange-dark)}
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
  .cbg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:14px;width:100%}
  .cbc{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px 18px;box-shadow:0 14px 34px -26px rgba(0,0,0,.3);display:flex;flex-direction:column;position:relative}
  .cbc.hl{border:2px solid var(--orange)}
  .cbc .sg{display:inline-block;align-self:flex-start;background:var(--orange);color:#fff;font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;font-weight:800;padding:4px 10px;border-radius:999px;margin-bottom:8px}
  .cbc .nm{font-family:'DM Serif Display',serif;font-size:17px;color:var(--navy)}
  .cbc .pr{margin-top:6px;font-size:11px;font-weight:700;color:var(--orange-dark)}
  .cbc .pr b{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy)}
  .cbc .pr small{color:var(--muted);font-weight:600;display:block;margin-top:2px}
  .cbc .it{margin-top:9px;font-size:10.5px;color:var(--muted);line-height:1.45}
  /* investimento lista (combos) */
  .invhero{display:flex;align-items:baseline;gap:14px;margin-top:4px}
  .invhero .n{font-family:'DM Serif Display',serif;font-size:42px;color:var(--navy);line-height:1}
  .invhero .n em{font-style:italic;color:var(--orange)}
  .invhero .l{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--navy-soft);font-weight:700;max-width:14ch;line-height:1.3}
  .invsub{font-size:12.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--navy-soft);font-weight:700;margin-top:4px}
  .invcards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px;margin-top:24px;width:100%}
  .invcard{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px 26px;box-shadow:0 16px 38px -26px rgba(0,0,0,.34);display:flex;flex-direction:column}
  .invcard.hl{border:2px solid var(--orange)}
  .invcard .sg{align-self:flex-start;background:var(--orange);color:#fff;font-size:9px;letter-spacing:.12em;text-transform:uppercase;font-weight:800;padding:4px 11px;border-radius:999px;margin-bottom:9px}
  .invcard .nm{font-family:'DM Serif Display',serif;font-size:20px;color:var(--navy);line-height:1.05}
  .invcard .big{font-family:'DM Serif Display',serif;font-size:36px;color:var(--orange-dark);line-height:1;margin:8px 0 2px}
  .invcard .per{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--navy-soft);font-weight:700}
  .invcard .tot{margin-top:11px;padding-top:11px;border-top:1px solid var(--line);font-size:12.5px;color:var(--navy-soft);font-weight:700}
  .invcard .tot b{font-family:'DM Serif Display',serif;font-weight:400;font-size:16px;color:var(--navy)}
  .invobs{margin-top:14px;font-size:11px;color:var(--muted);line-height:1.5}
  .cbhead{margin-top:20px;display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:15px}
  .cbhead span{font-family:'DM Serif Display',serif;font-size:18px;color:var(--navy)}
  .cbhead span em{font-style:italic;color:var(--orange)}
  .cbhead small{font-size:11.5px;color:var(--muted);line-height:1.4}
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


def pqc_word(src, palavra, pos="center 50%"):
    return (f'<div class="pqc"><div class="ph">{img(src, palavra, pos)}</div>'
            f'<div class="bd word"><h3>{palavra}</h3></div></div>')


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
    <p class="lead">Escolher um aroma, acompanhar a vela ganhar forma e criar algo com as próprias mãos. Cada participante produz <strong>sua própria vela artesanal</strong> e leva a criação para casa.</p>
    <div class="pqg">
      {pqc_word("velas3.jpg", "Criar", "center 50%")}
      {pqc_word("teoriavela.jpg", "Sentir", "center 45%")}
      {pqc_word("vela2.jpg", "Levar", "center 50%")}
    </div>
    {foot("A experiência")}
  </section>'''

# ===== 3 · A ATMOSFERA =====
atmosfera = f'''
  <section class="slide">
{head_simple("A atmosfera")}
    <span class="eyebrow orange">◆ A atmosfera</span>
    <h2>Uma mesa, bons aromas e <em>tempo para estar presente</em></h2>
    <p class="lead">Uma mesa preparada para receber o grupo, materiais à mão e <strong>tempo para criar juntas</strong>.</p>
    <div class="vibestrip">
      {vfig("teoriavela.jpg", "Mãos criando juntas", "center 45%")}
      {vfig("vela3.jpg", "Aromas escolhidos por cada uma", "center 50%")}
      {vfig("vela-grupo-oficina.jpg", "Conversas sem pressa", "center 40%")}
      {vfig("vela2.jpg", "Uma criação para levar", "center 50%")}
    </div>
    {foot("A atmosfera")}
  </section>'''

# ===== 4 · DUAS FORMAS DE VIVER A EXPERIÊNCIA =====
duasformas = f'''
  <section class="slide">
{head_simple("Duas opções")}
    <span class="eyebrow orange">◆ Duas formas de viver a experiência</span>
    <h2>Escolham o <em>clima do encontro</em></h2>
    <div class="cmp">
      <div class="cmpc">
        <div class="cph">{img("vela1.jpg", "Vela aromática artesanal em recipiente de vidro", "center 50%")}</div>
        <div class="cbd">
          <div class="nm">Vela Aromática</div>
          <p class="ds">Clássica, delicada e sensorial. Cada participante cria a <b>sua própria vela artesanal</b>.</p>
        </div>
      </div>
      <div class="cmpc">
        <div class="cph">{img("velas2.jpg", "Vela aromática decorada de forma delicada", "center 45%")}</div>
        <div class="cbd">
          <div class="nm">Vela Aromática Decorada</div>
          <p class="ds">Mais visual e personalizada, com <b>detalhes decorativos em cera</b>.</p>
        </div>
      </div>
    </div>
    {foot("Duas opções")}
  </section>'''

# ===== 5 · INVESTIMENTO =====
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>O investimento para <em>esse encontro</em></h2>
    <p class="invsub">60 mulheres · 2 turmas privativas de 30 participantes</p>
    <div class="invcards">
      <div class="invcard hl">
        <span class="sg">Nossa sugestão</span>
        <div class="nm">Vela Aromática</div>
        <div class="big">R$ 239</div>
        <div class="per">a partir de · por pessoa</div>
        <div class="tot">Para 60 participantes · <b>R$ 14.340</b></div>
      </div>
      <div class="invcard">
        <div class="nm">Vela Aromática Decorada</div>
        <div class="big">R$ 269</div>
        <div class="per">a partir de · por pessoa</div>
        <div class="tot">Para 60 participantes · <b>R$ 16.140</b></div>
      </div>
    </div>
    <div class="cbhead"><span>☕ Coffee break <em>opcional</em></span><small>Para deixar o encontro ainda mais completo — contratado à parte, nunca somado ao workshop.</small></div>
    <div class="cbg">
      {cbc("Essencial", "R$ 99", "R$ 5.940", "Mini sanduíches, salgado, doce, fruta, suco, água e café.")}
      {cbc("Clássico", "R$ 114", "R$ 6.840", "Composição completa e equilibrada — montagem e utensílios inclusos.", hl=True)}
      {cbc("Especial", "R$ 142", "R$ 8.520", "Mais opções de salgados e doces para o coffee.")}
    </div>
    <p class="invobs">Valores considerando duas turmas de 30 participantes no mesmo dia. Local ainda a definir. Coffee break opcional, não somado ao workshop.</p>
    {foot("Investimento & coffee")}
  </section>'''

# ===== 7 · PRÓXIMOS PASSOS =====
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Próximos passos</span>
    <h2>Daqui pra frente, <em>a gente cuida de tudo</em></h2>
    <div class="stg">
      {stc("1", "Vocês escolhem a experiência", "Vela Aromática ou Vela Aromática Decorada.")}
      {stc("2", "Definimos o espaço", "Aguardamos a confirmação do local no ABC Paulista.")}
      {stc("3", "Alinhamos os detalhes", "Horários, dinâmica e coffee break, caso desejem incluir.")}
      {stc("4", "Preparamos o encontro", "Nós organizamos materiais, estrutura e toda a operação para receber o grupo.")}
    </div>
    <div class="noteband">◆ Depois da confirmação, seguimos com a <b>reserva da data</b> e todos os alinhamentos finais.</div>
    {foot("Próximos passos")}
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
        <p class="lead">Mais do que uma oficina, queremos preparar um encontro <strong>gostoso, leve e especial</strong> para essas 60 mulheres. Vamos adorar viver esse momento com vocês.</p>
        <div class="ctabox">
          <p class="t">Vocês escolhem a experiência.</p>
          <p class="el">Nós cuidamos do restante</p>
        </div>
      </div>
    </div>
    {foot("Para fechar")}
  </section>'''

deck = ('<div class="deck">\n' + cover + vela + atmosfera + duasformas + investimento
        + proximos + final + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/proposta-encontro-mulheres.html"
io.open(out, "w", encoding="utf-8").write(html)
for bad in ["fornecedor", "repasse", "comiss", "margem", "wax melt", "sob consulta"]:
    assert bad not in deck.lower(), f"PROIBIDO: {bad}"
for val in ["R$ 239", "R$ 14.340", "R$ 269", "R$ 16.140", "R$ 99", "R$ 5.940", "R$ 114",
            "R$ 6.840", "R$ 142", "R$ 8.520"]:
    assert val in deck, f"FALTA VALOR: {val}"
assert "Tudo preparado para viver" not in deck
assert deck.count("Wax Melts") == 0
assert "experiência completa" not in deck.lower() and "Como funciona" not in deck
assert "O investimento para" in deck, "falta slide de investimento"
assert "Próximos passos" in deck and "Daqui pra frente" in deck, "falta slide de próximos passos"
assert html.count('<section class="slide">') == 7, "esperado 7 slides"
print("wrote", out, "| slides:", html.count('<section class="slide">'))
