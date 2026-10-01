# Proposta Elarah · Confraternizacao corporativa / team building · Forth (Lucas Martins)
# 11/12/2026 · 26 pessoas · grupo misto · cliente ja tem espaco · 7 slides.
# Mensagem: a Elarah vai ate voces (profissional, materiais, estrutura, montagem, conducao).
# So experiencias existentes do portfolio. Sem linguagem de RH/treinamento. Sem fornecedor/margem.
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/orcamento-adriana.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]

head = re.sub(r'<title>.*?</title>', '<title>Confraternização Forth · Experiências Elarah</title>', head, count=1, flags=re.DOTALL)
head = re.sub(r'<meta name="description"[^>]*>',
              '<meta name="description" content="Proposta Elarah para a confraternização da Forth: experiências para criar, experimentar e celebrar. A Elarah vai até vocês.">',
              head, count=1)

extra = '''
<style>
  /* palavras-chave (4) */
  .kw{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:20px}
  .kw span{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 10px;text-align:center;font-family:'DM Serif Display',serif;font-size:17px;color:var(--navy);box-shadow:0 10px 26px -22px rgba(0,0,0,.3)}
  .tbsplit{display:grid;grid-template-columns:1.12fr .88fr;gap:34px;margin-top:20px;align-items:center}
  .tbsplit .ph{border-radius:20px;overflow:hidden;border:1px solid var(--line);box-shadow:0 20px 48px -28px rgba(0,0,0,.45);height:280px;position:relative}
  .tbsplit .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .tbsplit .lead2{font-size:14.5px;color:var(--ink);line-height:1.6;margin:0}
  .sems{margin-top:14px;display:flex;flex-wrap:wrap;gap:8px}
  .sems span{font-size:12px;font-weight:700;color:var(--navy-soft);background:#FBF1EE;border-radius:999px;padding:7px 14px}
  .band{margin-top:18px;background:linear-gradient(158deg,var(--navy),#241722);color:#fff;border-radius:18px;padding:22px 28px}
  .band .t{font-family:'DM Serif Display',serif;font-size:21px;color:#fff;margin:0 0 6px}
  .band .t em{font-style:italic;color:var(--orange)}
  .band p{font-size:12.5px;color:rgba(255,255,255,.82);line-height:1.55;margin:0;max-width:92ch}
  /* cards de experiencia */
  .xg{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:24px}
  .xc{background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 16px 38px -26px rgba(0,0,0,.34);display:flex;flex-direction:column}
  .xc .xph{height:188px;position:relative;overflow:hidden}
  .xc .xph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .xc .xbd{padding:19px 20px 20px;display:flex;flex-direction:column;flex:1}
  .xc h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:20px;color:var(--navy);margin:0 0 7px;line-height:1.08}
  .xc p{font-size:12px;color:var(--muted);line-height:1.5;margin:0 0 14px}
  .xc .price{margin-top:auto;font-size:12px;font-weight:700;letter-spacing:.02em;color:var(--orange-dark)}
  .xc .price b{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--navy)}
  /* vela sensorial */
  .velawrap{display:grid;grid-template-columns:1.1fr .9fr;gap:30px;margin-top:20px;align-items:stretch}
  .velawrap .vbig{border-radius:20px;overflow:hidden;border:1px solid var(--line);box-shadow:0 20px 48px -28px rgba(0,0,0,.45);position:relative;min-height:380px}
  .velawrap .vbig img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .velawrap .vright{display:flex;flex-direction:column}
  .velawrap .vsmall{border-radius:16px;overflow:hidden;border:1px solid var(--line);box-shadow:0 14px 34px -26px rgba(0,0,0,.4);height:150px;position:relative;margin-bottom:16px}
  .velawrap .vsmall img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .velawrap .vtx{font-size:13.5px;color:var(--ink);line-height:1.6;margin:0}
  .velawrap .vprice{margin-top:14px;font-size:12.5px;font-weight:700;color:var(--orange-dark)}
  .velawrap .vprice b{font-family:'DM Serif Display',serif;font-weight:400;font-size:19px;color:var(--navy)}
  .velawrap .vquote{margin-top:16px;font-family:'DM Serif Display',serif;font-style:italic;font-size:16px;color:var(--orange-dark);line-height:1.4}
  /* qual combina */
  .match{display:grid;gap:11px;margin-top:20px}
  .mrow{display:grid;grid-template-columns:92px 1fr;gap:18px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;box-shadow:0 10px 26px -24px rgba(0,0,0,.3)}
  .mrow .mph{height:66px;position:relative;overflow:hidden}
  .mrow .mph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .mrow .mbd{padding:10px 16px 10px 0}
  .mrow .mq{font-family:'DM Serif Display',serif;font-size:16px;color:var(--navy);line-height:1.1}
  .mrow .me{font-size:12px;color:var(--orange-dark);font-weight:700;margin-top:3px}
  .matchfoot{margin-top:18px}
  .matchfoot .big{font-size:14px;font-weight:700;color:var(--navy)}
  .matchfoot .big b{font-family:'DM Serif Display',serif;font-weight:400;font-size:24px;color:var(--orange-dark)}
  .matchfoot .fp{margin-top:11px;background:#FBF1EE;border-radius:12px;padding:13px 18px;font-size:12px;color:var(--navy-soft);line-height:1.55}
  .matchfoot .fp b{color:var(--navy);font-weight:700}
  /* fluxo */
  .flow{display:grid;gap:10px;margin-top:20px}
  .fstep{display:flex;align-items:center;gap:18px;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:15px 22px;box-shadow:0 10px 26px -24px rgba(0,0,0,.3)}
  .fstep .fn{width:34px;height:34px;flex:none;border-radius:999px;background:var(--orange);color:#fff;font-family:'DM Serif Display',serif;font-size:16px;display:flex;align-items:center;justify-content:center}
  .fstep .ft{font-size:15px;color:var(--navy);font-weight:600}
  .fstep .ft b{color:var(--orange-dark)}
  .flowclose{margin-top:20px;background:linear-gradient(158deg,var(--navy),#241722);color:#fff;border-radius:20px;padding:26px 32px;display:flex;justify-content:space-between;align-items:center;gap:22px;flex-wrap:wrap;box-shadow:0 22px 50px -28px rgba(0,0,0,.5)}
  .flowclose .ct{margin:0}
  .flowclose .ct .l1{font-size:12.5px;color:rgba(255,255,255,.8);line-height:1.5}
  .flowclose .ct .l2{font-family:'DM Serif Display',serif;font-size:24px;color:#fff;margin-top:6px}
  .flowclose .ct .l2 em{font-style:italic;color:var(--orange)}
  .flowclose .btn{background:var(--orange);color:#fff;font-weight:700;font-size:14px;padding:14px 26px;border-radius:999px;white-space:nowrap}
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


def xcard(foto, nome, desc, preco, pos="center 50%"):
    return (f'<div class="xc"><div class="xph">{img(foto, nome, pos)}</div>'
            f'<div class="xbd"><h3>{nome}</h3><p>{desc}</p>'
            f'<div class="price">A partir de <b>{preco}</b> por pessoa</div></div></div>')


def mrow(foto, mood, exps, pos="center 50%"):
    return (f'<div class="mrow"><div class="mph">{img(foto, mood, pos)}</div>'
            f'<div class="mbd"><div class="mq">{mood}</div><div class="me">{exps}</div></div></div>')


def fstep(n, txt):
    return f'<div class="fstep"><div class="fn">{n}</div><div class="ft">{txt}</div></div>'


# ===== 1 · CAPA =====
cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Confraternização · Experiências Elarah</span></div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ A Elarah vai até vocês</span>
        <h1>Um encontro para fazer mais do que <em>brindar</em></h1>
        <p class="lead"><strong>Criar, experimentar, conversar e celebrar</strong> juntos.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip">Confraternização <b>Forth</b></span>
          <span class="chip"><b>11.12.2026</b></span>
          <span class="chip"><b>26</b> pessoas</span>
        </div>
      </div>
      <div class="cover-photo">{img("bfa-grupo2.webp", "Grupo misto rindo e criando junto em uma experiência", "center 50%")}</div>
    </div>
    {foot("Confraternização Forth")}
  </section>'''

# ===== 2 · TEAM BUILDING DO NOSSO JEITO =====
tb = f'''
  <section class="slide">
{head_simple("O nosso jeito")}
    <span class="eyebrow orange">◆ Confraternização do nosso jeito</span>
    <h2>Confraternização sem cara de <em>evento corporativo</em></h2>
    <div class="tbsplit">
      <div>
        <p class="lead2">Uma pausa para o time <strong>sair da rotina, experimentar algo novo e celebrar junto</strong> — sem dinâmica forçada e sem programação engessada.</p>
        <div class="kw"><span>Criar</span><span>Experimentar</span><span>Compartilhar</span><span>Celebrar</span></div>
      </div>
      <div class="ph">{img("corp-conexao.jpg", "Time misto interagindo de forma natural", "center 35%")}</div>
    </div>
    <div class="band">
      <p class="t">No espaço <em>de vocês</em>.</p>
      <p>Nós levamos <b style="color:#fff">profissional, materiais e toda a estrutura necessária</b>. Antes do grupo chegar, deixamos tudo pronto para a experiência acontecer.</p>
    </div>
    {foot("O nosso jeito")}
  </section>'''

# ===== 3 · EXPERIÊNCIAS CRIATIVAS =====
criativas = f'''
  <section class="slide">
{head_simple("Experiências criativas")}
    <span class="eyebrow orange">◆ Experiências criativas</span>
    <h2>Colocar a mão na massa, <em>junto</em></h2>
    <div class="xg">
      {xcard("pintura-taca-experiencia.jpg", "Pintura em Taça", "Experiência leve, social e descontraída. Cada participante personaliza sua própria taça e leva a peça como lembrança.", "R$ 259", "center 45%")}
      {xcard("ceramicamodelagem.jpg", "Cerâmica", "Para colocar a mão na massa, criar uma peça própria e desacelerar enquanto o grupo conversa.", "R$ 529", "center 50%")}
      {xcard("tufting3.jpg", "Tufting &amp; Punch", "Uma experiência visual e contemporânea envolvendo cores, texturas e a criação de uma peça autoral.", "R$ 799", "center 50%")}
    </div>
    {foot("Experiências criativas")}
  </section>'''

# ===== 4 · BRINDAR & COMPARTILHAR =====
brindar = f'''
  <section class="slide">
{head_simple("Brindar & compartilhar")}
    <span class="eyebrow orange">◆ Experiências para brindar &amp; compartilhar</span>
    <h2>Em torno da <em>mesa</em></h2>
    <div class="xg">
      {xcard("drinksclassicos.jpg", "Bartenderia &amp; Coquetelaria", "O grupo entra no universo dos drinks, conhece técnicas e participa da preparação dos próprios coquetéis.", "R$ 319", "center 50%")}
      {xcard("pizzanegroni.jpg", "Entre Fatias &amp; Taças", "Uma experiência em torno da mesa, combinando gastronomia, vinho e o prazer de compartilhar.", "R$ 349", "center 50%")}
      {xcard("risotomar.jpg", "Gastronomia", "Conduzida de forma participativa, combinando preparo, descoberta de sabores e o prazer de comer junto.", "R$ 429", "center 50%")}
    </div>
    {foot("Brindar & compartilhar")}
  </section>'''

# ===== 5 · EXPERIÊNCIA SENSORIAL =====
sensorial = f'''
  <section class="slide">
{head_simple("Experiência sensorial")}
    <span class="eyebrow orange">◆ Experiência sensorial</span>
    <h2>Vela <em>Aromática</em></h2>
    <div class="velawrap">
      <div class="vbig">{img("vela-grupo-oficina.jpg", "Grupo participando da criação de velas em mesa montada", "center 40%")}</div>
      <div class="vright">
        <div class="vsmall">{img("vela-aromatica-real.jpg", "Materiais e fragrâncias organizados na estação", "center 50%")}</div>
        <p class="vtx">Uma experiência sensorial e tranquila: cada participante acompanha a <strong>criação da própria vela</strong>, escolhe as fragrâncias e leva sua peça para casa.</p>
        <div class="vprice">A partir de <b>R$ 269</b> por pessoa</div>
        <p class="vquote">Para desacelerar, criar e sair da rotina juntos.</p>
      </div>
    </div>
    {foot("Experiência sensorial")}
  </section>'''

# ===== 6 · QUAL COMBINA MAIS? =====
combina = f'''
  <section class="slide">
{head_simple("Qual combina mais?")}
    <span class="eyebrow orange">◆ Qual combina mais com o time?</span>
    <h2>É só escolher o <em>clima</em></h2>
    <div class="match">
      {mrow("ceramicamodelagem.jpg", "Queremos criar e conversar", "Pintura em Taça · Cerâmica", "center 50%")}
      {mrow("tufting3.jpg", "Queremos algo novo e diferente", "Tufting &amp; Punch", "center 50%")}
      {mrow("drinksclassicos.jpg", "Queremos brindar e celebrar", "Bartenderia &amp; Coquetelaria", "center 50%")}
      {mrow("pizzanegroni.jpg", "Queremos comer, beber e ficar juntos", "Entre Fatias &amp; Taças · Gastronomia", "center 50%")}
      {mrow("vela-aromatica-real.jpg", "Queremos desacelerar", "Vela Aromática", "center 50%")}
    </div>
    <div class="matchfoot">
      <div class="big">A partir de <b>R$ 259</b> por pessoa</div>
      <div class="fp"><b>Valores a partir de.</b> O investimento final é definido de acordo com a experiência escolhida, endereço do evento, estrutura disponível no espaço, duração, logística e possíveis personalizações.</div>
    </div>
    {foot("Qual combina mais?")}
  </section>'''

# ===== 7 · A ELARAH CUIDA DO RESTO =====
resto = f'''
  <section class="slide">
{head_simple("A Elarah cuida do resto")}
    <span class="eyebrow orange">◆ A Elarah cuida do resto</span>
    <h2>Vocês escolhem. <em>Nós fazemos acontecer.</em></h2>
    <div class="flow">
      {fstep("1", "A <b>experiência escolhida</b> por vocês")}
      {fstep("2", "<b>Nós alinhamos</b> tudo — data, espaço e detalhes")}
      {fstep("3", "<b>Levamos</b> profissional + materiais + estrutura")}
      {fstep("4", "<b>Montamos</b> a mesa e a estação antes do grupo chegar")}
      {fstep("5", "<b>O time chega e aproveita</b> — do começo ao fim")}
    </div>
    <div class="flowclose">
      <div class="ct">
        <div class="l1">No fim, o que fica é o que vocês viveram juntos.</div>
        <div class="l2">Vamos criar <em>esse encontro?</em></div>
      </div>
      <span class="btn">💬 WhatsApp +55 (11) 91445-5930</span>
    </div>
    {foot("A Elarah cuida do resto")}
  </section>'''

deck = ('<div class="deck">\n' + cover + tb + criativas + brindar + sensorial + combina + resto + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/proposta-forth-confra.html"
io.open(out, "w", encoding="utf-8").write(html)
for bad in ["fornecedor", "repasse", "comiss", "margem", "treinamento"]:
    assert bad not in deck.lower(), f"PROIBIDO: {bad}"
print("wrote", out, "| slides:", html.count('<section class="slide">'))
