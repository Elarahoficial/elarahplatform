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
  .cofwrap{display:grid;grid-template-columns:1.5fr 1fr;gap:16px;margin-top:16px;width:100%}
  .cofbig{border-radius:18px;overflow:hidden;position:relative;height:300px;border:1px solid var(--line);box-shadow:0 18px 44px -28px rgba(0,0,0,.42)}
  .cofbig img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .cofside{display:grid;grid-template-rows:repeat(3,1fr);gap:16px}
  .cofside figure{margin:0;border-radius:14px;overflow:hidden;position:relative;border:1px solid var(--line);box-shadow:0 12px 28px -22px rgba(0,0,0,.4)}
  .cofside figure img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .cbg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:16px;width:100%}
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
  /* pacotes */
  .pkgs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px;margin-top:22px;width:100%;align-items:stretch}
  .pkg{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:26px 30px;box-shadow:0 16px 38px -26px rgba(0,0,0,.34);display:flex;flex-direction:column}
  .pkg.hl{border:2px solid var(--orange)}
  .pkg .tag{align-self:flex-start;font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:800;color:var(--orange-dark);margin-bottom:4px}
  .pkg .pt{font-family:'DM Serif Display',serif;font-size:22px;color:var(--navy);line-height:1.08;margin:0 0 3px}
  .pkg .psub{font-size:12px;color:var(--muted);line-height:1.45;margin:0 0 6px}
  .pkg .prow{display:flex;justify-content:space-between;align-items:baseline;gap:12px;border-top:1px solid var(--line);padding:13px 0 11px}
  .pkg .prow .e{font-family:'DM Serif Display',serif;font-size:16px;color:var(--navy);line-height:1.15}
  .pkg .prow .e small{display:block;font-family:'DM Sans',sans-serif;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--orange-dark);font-weight:700;margin-top:3px}
  .pkg .prow .v{text-align:right;font-family:'DM Serif Display',serif;font-size:20px;color:var(--orange-dark);white-space:nowrap}
  .pkg .prow .v small{display:block;font-family:'DM Sans',sans-serif;font-size:10px;color:var(--muted);font-weight:600}
  .pkg .pnote{margin-top:auto;padding-top:13px;font-size:11px;color:var(--navy-soft);line-height:1.5}
  .pkg .pnote b{color:var(--navy);font-weight:700}
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
  .ctabox .contact{margin-top:8px;font-size:12px;color:var(--navy-soft);line-height:1.5}
  .ctabox .contact b{color:var(--navy)}
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
      {vfig("vela-mesa-materiais.webp", "Aromas escolhidos por cada uma", "center 50%")}
      {vfig("vela-mulheres-sorrindo.webp", "Conversas sem pressa", "center 50%")}
      {vfig("vela2.jpg", "Uma criação para levar", "center 50%")}
    </div>
    {foot("A atmosfera")}
  </section>'''

# ===== 4+5 · DUAS FORMAS + INVESTIMENTO (unificado) =====
duasformas = f'''
  <section class="slide">
{head_simple("Experiências & investimento")}
    <span class="eyebrow orange">◆ Duas formas de viver a experiência</span>
    <h2>Escolham o <em>clima do encontro</em></h2>
    <p class="invsub">60 mulheres · 2 turmas privativas de 30 participantes</p>
    <div class="cmp">
      <div class="cmpc hl">
        <div class="cph">{img("vela-lavanda.jpg", "Vela aromática artesanal em recipiente de vidro, com lavanda", "center 60%")}</div>
        <div class="cbd">
          <div class="nm">Vela Aromática</div>
          <span class="sg">Nossa sugestão</span>
          <p class="ds">Clássica, delicada e sensorial. Cada participante cria a <b>sua própria vela artesanal</b>.</p>
          <div class="pr">A partir de <b>R$ 239</b> / pessoa<span>60 participantes · R$ 14.340</span></div>
        </div>
      </div>
      <div class="cmpc">
        <div class="cph">{img("vela-decorada-frutas.jpg", "Velas aromáticas decoradas com detalhes em cera", "center 50%")}</div>
        <div class="cbd">
          <div class="nm">Vela Aromática Decorada</div>
          <p class="ds">Mais visual e personalizada, com <b>detalhes decorativos em cera</b>.</p>
          <div class="pr">A partir de <b>R$ 269</b> / pessoa<span>60 participantes · R$ 16.140</span></div>
        </div>
      </div>
    </div>
    <p class="cmpnote"><b>2 turmas privativas de 30</b> no mesmo dia · local a definir · ☕ coffee break opcional à parte (a seguir).</p>
    {foot("Experiências & investimento")}
  </section>'''

# ===== 6 · COFFEE BREAK (opcional) =====
coffee = f'''
  <section class="slide">
{head_simple("Coffee break")}
    <span class="eyebrow orange">◆ Opcional · contratado adicionalmente</span>
    <h2>Para deixar o encontro ainda mais <em>gostoso</em></h2>
    <p class="lead">Se quiserem completar esse momento, também podemos preparar o coffee break para acompanhar a experiência — <strong>tudo organizado e montado</strong> para receber o grupo.</p>
    <div class="cofwrap">
      <div class="cofbig">{img("brunch-office1.jpg", "Mesa de coffee break montada", "center 55%")}</div>
      <div class="cofside">
        <figure>{img("salgadinho.jpg", "Salgados quentinhos", "center 50%")}</figure>
        <figure>{img("paodoce.jpg", "Doces", "center 50%")}</figure>
        <figure>{img("bolocaseiro.jpg", "Bolo e frutas da estação", "center 50%")}</figure>
      </div>
    </div>
    <div class="cbg">
      <div class="cbc"><div class="nm">Básico</div><div class="pr"><b>R$ 49,90</b> /pessoa<small>60 participantes · R$ 2.994</small></div></div>
      <div class="cbc hl"><span class="sg">Nossa sugestão</span><div class="nm">Essencial</div><div class="pr"><b>R$ 99,90</b> /pessoa<small>60 participantes · R$ 5.994</small></div></div>
      <div class="cbc"><div class="nm">Clássico</div><div class="pr"><b>R$ 119,90</b> /pessoa<small>60 participantes · R$ 7.194</small></div></div>
    </div>
    <p class="invobs">Todos incluem mini sanduíches, salgado, doce, fruta ou iogurte, suco, Água na Caixa, café e serviço de montagem. ☕ Opcional, não incluído no valor das experiências de vela.</p>
    {foot("Coffee break opcional")}
  </section>'''

# ===== 6 · PRÓXIMOS PASSOS + FECHAMENTO (unificado) =====
final = f'''
  <section class="slide">
{head_simple("Para fechar")}
    <span class="eyebrow orange">◆ Próximos passos</span>
    <h2>Daqui pra frente, <em>a gente cuida de tudo</em></h2>
    <p class="lead">Mais do que uma oficina, queremos preparar um encontro <strong>gostoso, leve e especial</strong> para essas 60 mulheres.</p>
    <div class="stg">
      {stc("1", "Vocês escolhem a experiência", "Vela Aromática ou Vela Aromática Decorada.")}
      {stc("2", "Definimos o espaço", "Aguardamos a confirmação do local no ABC Paulista.")}
      {stc("3", "Alinhamos os detalhes", "Horários, dinâmica e coffee break, caso desejem incluir.")}
      {stc("4", "Preparamos o encontro", "Nós organizamos materiais, estrutura e toda a operação.")}
    </div>
    <div class="ctabox">
      <p class="t">Vamos fechar? <em>✦</em></p>
      <p class="el">Vocês escolhem · nós cuidamos do restante</p>
      <p class="contact">WhatsApp <b>+55 (11) 91445-5930</b> · @elarah.oficial · elarah.com.br</p>
    </div>
    {foot("Para fechar")}
  </section>'''

deck = ('<div class="deck">\n' + cover + vela + atmosfera + duasformas
        + coffee + final + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/proposta-encontro-mulheres.html"
io.open(out, "w", encoding="utf-8").write(html)
for bad in ["fornecedor", "repasse", "comiss", "margem", "wax melt", "sob consulta"]:
    assert bad not in deck.lower(), f"PROIBIDO: {bad}"
for val in ["R$ 239", "R$ 14.340", "R$ 269", "R$ 16.140", "R$ 49,90", "R$ 99,90", "R$ 119,90"]:
    assert val in deck, f"FALTA VALOR: {val}"
# nao expor custo de fornecedor nem percentual Elarah na versao final
for proib in ["fornecedor", "20%", "R$ 29", "R$ 72", "R$ 91", "comiss"]:
    assert proib not in deck.lower(), f"NAO EXPOR: {proib}"
assert "Tudo preparado para viver" not in deck
assert deck.count("Wax Melts") == 0
assert "experiência completa" not in deck.lower() and "Como funciona" not in deck
assert "Experiências &amp; investimento" in deck or "Duas formas" in deck, "falta slide de experiências/investimento"
assert "Daqui pra frente" in deck, "falta próximos passos no fechamento"
assert html.count('<section class="slide">') == 6, "esperado 6 slides"
assert "Vamos fechar" in deck, "falta CTA Vamos fechar no fechamento"
print("wrote", out, "| slides:", html.count('<section class="slide">'))
