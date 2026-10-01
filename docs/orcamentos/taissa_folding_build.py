# Proposta Elarah · Folding Book · Turma privada · Taissa · 10 pessoas
# 27/10 ou 29/10 · R$ 329/pessoa · R$ 3.290 total (deslocamento incluso).
# 3 slides: capa poetica · a vibe · informacoes + investimento (por pessoa e em grupo).
# Clean, editorial, poetico. Nao mencionar fornecedor/repasse/comissao/margem.
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
  /* ===== vibe ===== */
  .vibe{display:grid;grid-template-columns:1.05fr .95fr;gap:40px;margin-top:22px;align-items:stretch}
  .vibe .vph{border-radius:20px;overflow:hidden;border:1px solid var(--line);box-shadow:0 22px 52px -28px rgba(0,0,0,.45);min-height:470px;position:relative}
  .vibe .vph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .vibe .vtx{display:flex;flex-direction:column;justify-content:center}
  .vibe .vtx .poem{font-family:'DM Serif Display',serif;font-size:27px;line-height:1.28;color:var(--navy);font-weight:400;margin:0}
  .vibe .vtx .poem em{font-style:italic;color:var(--orange)}
  .moods{list-style:none;margin:26px 0 0;padding:0;display:grid;gap:15px}
  .moods li{position:relative;padding-left:30px;font-size:14px;color:var(--ink);line-height:1.45}
  .moods li b{color:var(--navy);font-weight:700}
  .moods li .dot{position:absolute;left:0;top:3px;width:17px;height:17px;border-radius:999px;background:var(--orange);color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center}
  .vmini{margin-top:26px;border-radius:16px;overflow:hidden;border:1px solid var(--line);height:150px;box-shadow:0 16px 38px -26px rgba(0,0,0,.4);position:relative}
  .vmini img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  /* ===== informacoes + investimento ===== */
  .fchips{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:22px}
  .fchip{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px 20px;box-shadow:0 12px 30px -24px rgba(0,0,0,.3)}
  .fchip .em{font-size:22px;line-height:1}
  .fchip .k{font-size:10px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin-top:9px}
  .fchip .v{font-family:'DM Serif Display',serif;font-size:20px;color:var(--navy);margin-top:4px;line-height:1.05}
  .fchip .v small{display:block;font-family:'DM Sans',sans-serif;font-size:11px;color:var(--muted);font-weight:600;margin-top:3px;letter-spacing:0}
  .invwrap{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:22px;align-items:stretch}
  .invmain{background:linear-gradient(158deg,var(--navy),#241722);color:#fff;border-radius:22px;padding:34px 34px;display:flex;flex-direction:column;justify-content:center;box-shadow:0 22px 50px -28px rgba(0,0,0,.5)}
  .invmain .tag{font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:var(--orange);font-weight:700}
  .invmain .big{font-family:'DM Serif Display',serif;font-size:58px;line-height:1;margin:8px 0 2px}
  .invmain .per{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.72);font-weight:700}
  .invside{display:flex;flex-direction:column;justify-content:center;gap:14px}
  .invtot{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px 24px;box-shadow:0 14px 34px -26px rgba(0,0,0,.3)}
  .invtot .k{font-size:10px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .invtot .v{font-family:'DM Serif Display',serif;font-size:32px;color:var(--navy);margin-top:4px;line-height:1}
  .invtot .v small{font-family:'DM Sans',sans-serif;font-size:12px;color:var(--muted);font-weight:600;letter-spacing:0}
  .invnote{background:#FBF1EE;border-radius:14px;padding:13px 17px;font-size:12.5px;color:var(--navy-soft);line-height:1.5}
  .invnote b{color:var(--navy)}
  .fclose{margin-top:20px;font-family:'DM Serif Display',serif;font-style:italic;font-size:15px;color:var(--orange-dark);line-height:1.5}
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
        <p class="lead">Dar nova vida a um livro, <strong>dobra a dobra</strong>, até ele virar uma <strong>peça única</strong> — feita à mão, no seu tempo, cheia de significado.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>10</b> participantes</span>
          <span class="chip"><b>27</b> ou <b>29</b> de outubro</span>
          <span class="chip">Turma privada</span>
        </div>
      </div>
      <div class="cover-photo">{img("foldingbook-grupo.jpg", "Grupo reunido criando folding book à mesa", "center 55%")}</div>
    </div>
    {foot("Folding Book · Turma privada")}
  </section>'''

# ===== 2 · A VIBE =====
vibe = f'''
  <section class="slide">
{head_simple("A vibe")}
    <span class="eyebrow orange">◆ A vibe da experiência</span>
    <h2>Mãos ocupadas, <em>mente leve</em></h2>
    <div class="vibe">
      <div class="vph">{img("foldingbook-maos.jpg", "Mãos segurando uma peça de folding book finalizada", "center 50%")}</div>
      <div class="vtx">
        <p class="poem">Uma pausa para <em>desacelerar</em>, criar com as próprias mãos e <em>conversar sem pressa</em> — enquanto cada livro vira arte.</p>
        <ul class="moods">
          <li><span class="dot">✦</span>Um <b>momento guiado</b>, do começo ao fim — é só se entregar ao processo</li>
          <li><span class="dot">✦</span>Clima <b>leve e acolhedor</b>, com tempo pra conversa e pra criar</li>
          <li><span class="dot">✦</span>Cada peça sai <b>diferente</b> — do jeito de quem fez</li>
          <li><span class="dot">✦</span>No fim, cada um leva pra casa a <b>sua própria obra</b></li>
        </ul>
        <div class="vmini">{img("foldingbook-dobra.jpg", "Mãos dobrando as páginas de um livro", "center 40%")}</div>
      </div>
    </div>
    {foot("A vibe da experiência")}
  </section>'''

# ===== 3 · INFORMAÇÕES + INVESTIMENTO =====
investimento = f'''
  <section class="slide">
{head_simple("O encontro & investimento")}
    <span class="eyebrow orange">◆ O encontro & investimento</span>
    <h2>Simples de <em>combinar</em></h2>
    <div class="fchips">
      <div class="fchip"><div class="em">👥</div><div class="k">Participantes</div><div class="v">10 pessoas<small>turma fechada</small></div></div>
      <div class="fchip"><div class="em">🗓️</div><div class="k">Datas</div><div class="v">27 ou 29/10<small>vocês escolhem</small></div></div>
      <div class="fchip"><div class="em">🤍</div><div class="k">Formato</div><div class="v">Turma privada<small>só o seu grupo</small></div></div>
    </div>
    <div class="invwrap">
      <div class="invmain">
        <div class="tag">Por pessoa</div>
        <div class="big">R$ 319</div>
        <div class="per">experiência completa</div>
      </div>
      <div class="invside">
        <div class="invtot"><div class="k">Grupo · 10 participantes</div><div class="v">R$ 3.190 <small>turma fechada</small></div></div>
        <div class="invnote">✓ <b>Deslocamento já incluso.</b><br>✓ Experiência guiada, materiais e a peça que cada um leva pra casa.</div>
      </div>
    </div>
    <p class="fclose">Taissa, é só escolher a data que a gente cuida de todo o resto. 🤍 &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> · @elarah.oficial</p>
    {foot("O encontro & investimento")}
  </section>'''

deck = ('<div class="deck">\n' + cover + vibe + investimento + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/proposta-folding-book-taissa.html"
io.open(out, "w", encoding="utf-8").write(html)
for bad in ["fornecedor", "repasse", "comiss", "margem"]:
    assert bad not in deck.lower(), f"PROIBIDO: {bad}"
print("wrote", out, "| slides:", html.count('<section class="slide">'))
