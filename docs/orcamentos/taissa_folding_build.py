# Proposta Elarah · Folding Book · Turma privada · Taissa · 10 pessoas
# 27/10 ou 29/10 · R$ 329/pessoa · R$ 3.290 total (deslocamento incluso).
# Clean, editorial, sofisticado. Nao mencionar fornecedor/repasse/comissao/margem.
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/orcamento-adriana.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]

head = re.sub(r'<title>.*?</title>', '<title>Folding Book · Turma privada · Elarah</title>', head, count=1, flags=re.DOTALL)
head = re.sub(r'<meta name="description"[^>]*>',
              '<meta name="description" content="Proposta Elarah para uma turma privada de Folding Book: transformar livros em peças únicas, feitas à mão.">',
              head, count=1)

extra = '''
<style>
  .split{display:grid;grid-template-columns:1fr 1fr;gap:38px;margin-top:22px;align-items:center}
  .split .sph{border-radius:18px;overflow:hidden;border:1px solid var(--line);box-shadow:0 18px 44px -26px rgba(0,0,0,.42);height:380px}
  .split .sph img{width:100%;height:100%;object-fit:cover;display:block}
  .flist{list-style:none;margin:0;padding:0;display:grid;gap:14px}
  .flist li{position:relative;padding-left:29px;font-size:14px;color:var(--ink);line-height:1.4}
  .flist li b{color:var(--navy);font-weight:700}
  .flist li .ck{position:absolute;left:0;top:1px;width:19px;height:19px;border-radius:999px;background:var(--orange);color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center}
  /* informacoes */
  .info3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:22px}
  .infoc{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:24px 22px;box-shadow:0 12px 30px -24px rgba(0,0,0,.3)}
  .infoc .em{font-size:24px;line-height:1}
  .infoc .k{font-size:10px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin-top:10px}
  .infoc .v{font-family:'DM Serif Display',serif;font-size:21px;color:var(--navy);margin-top:5px;line-height:1.05}
  .infoc .v small{display:block;font-family:'DM Sans',sans-serif;font-size:11px;color:var(--muted);font-weight:600;margin-top:4px;letter-spacing:0}
  /* investimento */
  .invwrap{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:24px;align-items:stretch}
  .invmain{background:linear-gradient(158deg,var(--navy),#241722);color:#fff;border-radius:22px;padding:38px 36px;display:flex;flex-direction:column;justify-content:center;box-shadow:0 22px 50px -28px rgba(0,0,0,.5)}
  .invmain .tag{font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:var(--orange);font-weight:700}
  .invmain .big{font-family:'DM Serif Display',serif;font-size:60px;line-height:1;margin:10px 0 2px}
  .invmain .per{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.72);font-weight:700}
  .invside{display:flex;flex-direction:column;justify-content:center;gap:16px}
  .invtot{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:24px 26px;box-shadow:0 14px 34px -26px rgba(0,0,0,.3)}
  .invtot .k{font-size:10px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .invtot .v{font-family:'DM Serif Display',serif;font-size:34px;color:var(--navy);margin-top:5px;line-height:1}
  .invtot .v small{font-family:'DM Sans',sans-serif;font-size:12px;color:var(--muted);font-weight:600;letter-spacing:0}
  .invnote{background:#FBF1EE;border-radius:14px;padding:14px 18px;font-size:12.5px;color:var(--navy-soft);line-height:1.5}
  .invnote b{color:var(--navy)}
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


# ===== 1 · CAPA =====
cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Turma privada · Experiência Elarah</span></div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Uma experiência criativa em grupo</span>
        <h1>Folding <em>Book</em></h1>
        <p class="lead">Uma <strong>pausa criativa</strong> para transformar livros em <strong>peças únicas</strong>, feitas à mão e cheias de significado.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>10</b> participantes</span>
          <span class="chip"><b>27</b> ou <b>29</b> de outubro</span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip">Turma privada</span>
        </div>
      </div>
      <div class="cover-photo">{img("agora-grupo.jpg", "Grupo criando junto em um momento criativo", "center 50%")}</div>
    </div>
    {foot("Folding Book · Turma privada")}
  </section>'''

# ===== 2 · A EXPERIÊNCIA =====
experiencia = f'''
  <section class="slide">
{head_simple("A experiência")}
    <span class="eyebrow orange">◆ A experiência</span>
    <h2>Dobra a dobra, <em>uma peça única</em></h2>
    <div class="split">
      <div class="sph">{img("foldingbook.jpg", "Peças de folding book criadas à mão", "center 50%")}</div>
      <div>
        <p class="lead" style="margin-top:0">Cada participante aprende a <strong>técnica de dobradura das páginas</strong> para transformar um livro em uma <strong>peça decorativa única</strong>.</p>
        <ul class="flist" style="margin-top:18px">
          <li><span class="ck">✦</span>Experiência <b>guiada por profissional</b></li>
          <li><span class="ck">✦</span><b>Todos os materiais</b> necessários inclusos</li>
          <li><span class="ck">✦</span>Cada um <b>cria a própria peça</b></li>
          <li><span class="ck">✦</span>Momento <b>criativo e descontraído</b> em grupo</li>
          <li><span class="ck">✦</span><b>Peça final</b> para levar para casa</li>
        </ul>
      </div>
    </div>
    {foot("A experiência")}
  </section>'''

# ===== 3 · INFORMAÇÕES DO ENCONTRO =====
info = f'''
  <section class="slide">
{head_simple("O encontro")}
    <span class="eyebrow orange">◆ Informações do encontro</span>
    <h2>Combinadas do <em>dia</em></h2>
    <div class="info3">
      <div class="infoc"><div class="em">👥</div><div class="k">Participantes</div><div class="v">10 pessoas<small>turma fechada</small></div></div>
      <div class="infoc"><div class="em">🗓️</div><div class="k">Datas disponíveis</div><div class="v">27 ou 29/10<small>vocês escolhem a melhor</small></div></div>
      <div class="infoc"><div class="em">🤍</div><div class="k">Formato</div><div class="v">Turma privada<small>só para o seu grupo</small></div></div>
    </div>
    <div class="bnote" style="margin-top:20px">◆ É só escolher entre <strong>27/10</strong> ou <strong>29/10</strong>, conforme a preferência do grupo, que a gente reserva a data. 🤍</div>
    {foot("O encontro")}
  </section>'''

# ===== 4 · INVESTIMENTO =====
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Simples e <em>transparente</em></h2>
    <div class="invwrap">
      <div class="invmain">
        <div class="tag">Por pessoa</div>
        <div class="big">R$ 329</div>
        <div class="per">experiência completa</div>
      </div>
      <div class="invside">
        <div class="invtot"><div class="k">Total · 10 participantes</div><div class="v">R$ 3.290 <small>grupo fechado</small></div></div>
        <div class="invnote">✓ <b>Deslocamento já incluso</b> no valor.<br>✓ Experiência guiada, materiais e a peça que cada um leva pra casa.</div>
      </div>
    </div>
    {foot("Investimento")}
  </section>'''

# ===== 5 · FECHAMENTO =====
fechamento = f'''
  <section class="slide">
{head_simple("Vamos criar?")}
    <span class="eyebrow orange">◆ Para fechar</span>
    <h2>Um encontro para <em>criar e lembrar</em></h2>
    <p class="lead">Mais do que uma atividade, um momento para <strong>desacelerar, criar com as próprias mãos</strong> e levar pra casa uma <strong>lembrança especial</strong> desse encontro em grupo.</p>
    <div class="quote" style="margin-top:22px">
      Taissa, é só escolher a data que a gente cuida de todo o resto. 🤍<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Vamos criar?")}
  </section>'''

deck = ('<div class="deck">\n' + cover + experiencia + info + investimento + fechamento + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/proposta-folding-book-taissa.html"
io.open(out, "w", encoding="utf-8").write(html)
for bad in ["fornecedor", "repasse", "comiss", "margem"]:
    assert bad not in deck.lower(), f"PROIBIDO: {bad}"
print("wrote", out, "| slides:", html.count('<section class="slide">'))
