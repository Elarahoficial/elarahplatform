# One page Elarah · Charm Bar - Crie Seu Acessorio de Bolsa (Atelie AGIR)
# Pagina unica A4 retrato. Reaproveita fontes + paleta do deck Entre Charms.
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/proposta-bag-charms.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]

# mantem apenas os 2 blocos base de <style> (fontes + :root/componentes)
_parts = re.split(r'(<style>.*?</style>)', head, flags=re.DOTALL)
_kept, _out = 0, []
for _p in _parts:
    if _p.startswith('<style>'):
        _kept += 1
        if _kept <= 2:
            _out.append(_p)
    else:
        _out.append(_p)
head = ''.join(_out)

head = re.sub(r'<title>.*?</title>', '<title>Charm Bar · Elarah</title>', head, count=1, flags=re.DOTALL)
head = re.sub(r'<meta name="description"[^>]*>',
              '<meta name="description" content="Charm Bar: crie seu acessório de bolsa personalizado. Uma experiência Elarah de escolher, combinar e criar.">',
              head, count=1)

extra = '''
<style>
  @page{size:A4;margin:0}
  html,body{margin:0;padding:0;background:#E9E0D6}
  .op{width:210mm;height:297mm;margin:0 auto;background:#F5EDE6;box-sizing:border-box;
      padding:18mm 16mm 15mm;position:relative;font-family:'DM Sans',sans-serif;color:var(--ink);overflow:hidden}
  .op .brandrow{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1px solid var(--line);padding-bottom:12px}
  .op .brandrow .logo{height:28px;width:auto;display:block}
  .op .krow{text-align:right;line-height:1.5}
  .op .krow b{display:block;font-size:13px;color:var(--navy);font-weight:700}
  .op .krow b em{font-style:normal;color:var(--orange)}
  .op .krow span{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--navy-soft);font-weight:700}
  .op .ey{font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin-top:24px}
  .op h1{font-family:'DM Serif Display',serif;font-size:48px;color:var(--navy);line-height:1.02;margin:8px 0 6px}
  .op h1 em{font-style:italic;color:var(--orange)}
  .op .sub{font-family:'DM Serif Display',serif;font-size:21px;color:var(--navy-soft);font-style:italic;margin:0 0 18px}
  .op .main{display:grid;grid-template-columns:1.06fr .94fr;gap:26px;align-items:start}
  .op p.tx{font-size:13.5px;line-height:1.68;color:var(--ink);margin:0 0 13px}
  .op p.tx b{color:var(--navy);font-weight:700}
  .op .inclcard{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px 22px;box-shadow:0 14px 34px -26px rgba(0,0,0,.3);margin-top:16px}
  .op .inclcard h3{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin:0 0 13px}
  .op ul.oplist{list-style:none;margin:0;padding:0;border:none;border-radius:0;min-width:0;display:grid;gap:12px}
  .op ul.oplist li{position:relative;padding-left:27px;font-size:12.5px;color:var(--ink);line-height:1.4}
  .op ul.oplist li b{color:var(--navy);font-weight:700}
  .op ul.oplist li .ck{position:absolute;left:0;top:1px;width:18px;height:18px;border-radius:999px;background:var(--orange);color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center}
  .op .photos{display:grid;gap:14px}
  .op .photos figure{margin:0;border-radius:16px;overflow:hidden;position:relative;border:1px solid var(--line);box-shadow:0 16px 38px -26px rgba(0,0,0,.42);height:88mm}
  .op .photos figure.sm{height:58mm}
  .op .photos .pair{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .op .photos img{width:100%;height:100%;object-fit:cover;display:block}
  .op .photos figcaption{position:absolute;left:0;right:0;bottom:0;padding:22px 13px 10px;color:#fff;font-size:11px;font-weight:600;background:linear-gradient(to top,rgba(46,31,42,.86),transparent)}
  .op .close{margin-top:18px;background:linear-gradient(158deg,var(--navy),#241722);color:#fff;border-radius:16px;padding:18px 22px;font-size:13px;line-height:1.6}
  .op .close b{color:#fff;font-weight:700}
  .op .close .heart{color:var(--orange)}
  .op .proofline{margin-top:14px;background:#FBF0F3;border-radius:999px;padding:12px 22px;font-size:11px;color:var(--navy-soft);text-align:center}
  .op .proofline b{color:var(--navy);font-weight:700}
  .op .proofline .star{color:var(--orange);margin-right:5px}
  .op .foot{display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding-top:12px;border-top:1px solid var(--line);font-size:10.5px;color:var(--navy-soft);letter-spacing:.02em}
  .op .foot .wa{font-weight:700;color:var(--navy)}
</style>'''
head = head.replace("</head>", extra + "</head>", 1)


def img(src, alt, pos="center 50%"):
    return f'<img src="assets/{src}" alt="{alt}" style="object-position:{pos}">'


op = f'''<div class="op">
  <div class="brandrow">
    <img class="logo" src="assets/logo.png" alt="Elarah">
    <div class="krow"><b>Charm <em>Bar</em></b><span>Crie seu acessório de bolsa</span></div>
  </div>

  <div class="ey">◆ Charm Bar</div>
  <h1>O que você vai <em>viver</em></h1>
  <p class="sub">Escolha. Combine. Crie uma peça que tenha a sua cara.</p>

  <div class="main">
    <div>
      <p class="tx">Viva uma experiência de <b>Charm Bar</b> e crie seu próprio acessório de bolsa personalizado, escolhendo entre uma curadoria de <b>cores, pedras, letras e charms</b>.</p>
      <p class="tx">Você poderá explorar os materiais, testar combinações e escolher <b>até 5 charms</b> para criar uma composição única e cheia de personalidade.</p>
      <p class="tx">Durante toda a experiência, você será <b>acompanhada em cada etapa</b> da criação. <b>Não é necessário ter experiência</b> — você escolhe os elementos que mais combinam com você e nós ajudamos a transformar suas escolhas em uma peça especial.</p>
      <div class="inclcard">
        <h3>A experiência inclui</h3>
        <ul class="oplist">
          <li><span class="ck">✓</span><b>Todos os materiais</b> para a criação</li>
          <li><span class="ck">✓</span>Escolha entre diferentes <b>cores, pedras e letras</b></li>
          <li><span class="ck">✓</span>Até <b>5 charms</b></li>
          <li><span class="ck">✓</span><b>Acompanhamento</b> durante a montagem</li>
          <li><span class="ck">✓</span><b>1 acessório de bolsa</b> personalizado criado por você</li>
          <li><span class="ck">✓</span><b>Embalagem</b> para levar sua criação para casa</li>
        </ul>
      </div>
    </div>
    <div class="photos">
      <figure>{img("charm-making-mesa.jpg", "Mulheres criando seus acessórios de bolsa", "center 42%")}<figcaption>Escolher, combinar e criar</figcaption></figure>
      <div class="pair">
        <figure class="sm">{img("charm-materials-tray.jpg", "Curadoria de cores, pedras, letras e charms", "center 55%")}<figcaption>A curadoria</figcaption></figure>
        <figure class="sm">{img("charm-flatlay.jpg", "Acessório de bolsa personalizado", "center 50%")}<figcaption>Sua peça única</figcaption></figure>
      </div>
    </div>
  </div>

  <div class="close">
    Mais do que montar um acessório, é um momento para <b>criar, conversar, se divertir e viver algo diferente</b>. Venha sozinha ou convide uma amiga. Ao final, você leva uma <b>peça única</b> — feita por você e com a sua história. <span class="heart">🤎</span>
  </div>

  <div class="proofline"><span class="star">★</span> Experiências já realizadas para grupos como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)</div>

  <div class="foot">
    <span class="wa">WhatsApp +55 (11) 91445-5930</span>
    <span>@elarah.oficial · elarah.com.br</span>
  </div>
</div>'''

html = head + op + '\n</body>\n</html>\n'
out = ROOT + "/charm-bar-onepage.html"
io.open(out, "w", encoding="utf-8").write(html)
assert "AGIR" not in html and "Ateliê" not in html and "até 5 charms" in html, "FORNECEDOR NAO PODE APARECER"
print("wrote", out)
