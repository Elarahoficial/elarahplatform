# One page Elarah · Entre Fatias & Tacas (sexta) | Pizza & Vinho
# Pagina unica A4 retrato, formato "pagina da experiencia": valor, data/horario, incluso, descricao, CTA grupo.
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/orcamento-adriana.html", encoding="utf-8").read()
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

head = re.sub(r'<title>.*?</title>', '<title>Entre Fatias &amp; Taças · Pizza &amp; Vinho · Elarah</title>', head, count=1, flags=re.DOTALL)
head = re.sub(r'<meta name="description"[^>]*>',
              '<meta name="description" content="Entre Fatias & Taças · experiência de pizza e vinho às sextas em Moema. Rodízio de pizzas artesanais e vinhos argentinos.">',
              head, count=1)

extra = '''
<style>
  @page{size:A4;margin:0}
  html,body{margin:0;padding:0;background:#E9E0D6}
  .op{width:210mm;height:297mm;margin:0 auto;background:#F5EDE6;box-sizing:border-box;
      padding:15mm 15mm 12mm;position:relative;font-family:'DM Sans',sans-serif;color:var(--ink);overflow:hidden}
  .op .brow{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:11px}
  .op .brow img{height:26px;display:block}
  .op .brow .r{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--navy-soft);font-weight:700}
  /* hero */
  .op .hero{margin-top:14px;border-radius:18px;overflow:hidden;position:relative;height:150px;border:1px solid var(--line);box-shadow:0 16px 40px -26px rgba(0,0,0,.42)}
  .op .hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .op .hero .ov{position:absolute;inset:0;background:linear-gradient(90deg,rgba(32,16,22,.82),rgba(32,16,22,.25));display:flex;flex-direction:column;justify-content:center;padding:0 30px}
  .op .hero .ey{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:#f0c9a8;font-weight:700}
  .op .hero h1{font-family:'DM Serif Display',serif;font-weight:400;font-size:38px;color:#fff;line-height:1.02;margin:6px 0 4px}
  .op .hero h1 em{font-style:italic;color:#f0c9a8}
  .op .hero .sub{font-size:12px;color:rgba(255,255,255,.9);letter-spacing:.02em}
  .op .meta{display:flex;gap:18px;flex-wrap:wrap;margin-top:12px;font-size:11.5px;color:var(--navy-soft);font-weight:600}
  .op .meta b{color:var(--navy)}
  /* grid */
  .op .main{display:grid;grid-template-columns:1.48fr 1fr;gap:26px;margin-top:16px;align-items:start}
  .op h2.sec{font-family:'DM Serif Display',serif;font-weight:400;font-size:21px;color:var(--navy);margin:0 0 8px;line-height:1.08}
  .op h2.sec em{font-style:italic;color:var(--orange)}
  .op p.tx{font-size:11.5px;line-height:1.6;color:var(--ink);margin:0 0 9px}
  .op p.tx b{color:var(--navy);font-weight:700}
  .op h3.inc{font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin:14px 0 9px}
  .op ul.inc{list-style:none;margin:0;padding:0;display:grid;gap:8px}
  .op ul.inc li{position:relative;padding-left:25px;font-size:11.5px;color:var(--ink);line-height:1.4}
  .op ul.inc li .ck{position:absolute;left:0;top:1px;width:17px;height:17px;border-radius:999px;background:var(--orange);color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center}
  .op .close{margin-top:13px;font-family:'DM Serif Display',serif;font-style:italic;font-size:13.5px;color:var(--orange-dark);line-height:1.5}
  .op .gal{display:grid;grid-template-columns:repeat(3,1fr);gap:11px;margin-top:16px}
  .op .gal figure{margin:0;border-radius:13px;overflow:hidden;height:118px;border:1px solid var(--line);box-shadow:0 12px 28px -22px rgba(0,0,0,.4)}
  .op .gal img{width:100%;height:100%;object-fit:cover;display:block}
  /* booking card */
  .bcard{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:20px 20px;box-shadow:0 18px 44px -26px rgba(0,0,0,.34)}
  .bcard .price{font-family:'DM Serif Display',serif;font-size:38px;color:var(--navy);line-height:1}
  .bcard .price small{font-family:'DM Sans',sans-serif;font-size:11px;color:var(--muted);font-weight:600;letter-spacing:0}
  .bcard .x12{font-size:11px;color:var(--muted);margin-top:3px}
  .bcard .sel{display:flex;justify-content:space-between;align-items:center;border:1px solid var(--line);border-radius:11px;padding:11px 14px;margin-top:11px;font-size:12px;color:var(--navy-soft);font-weight:600;background:#fff}
  .bcard .sel .cv{color:var(--orange-dark)}
  .bcard .inclui{margin-top:13px;background:#FBF1EE;border-radius:11px;padding:11px 14px;font-size:12px;color:var(--navy);font-weight:700}
  .bcard .inclui span{color:var(--orange-dark)}
  .bcard ul.tr{list-style:none;margin:13px 0 0;padding:0;display:grid;gap:8px}
  .bcard ul.tr li{position:relative;padding-left:22px;font-size:10.8px;color:var(--navy-soft);line-height:1.4}
  .bcard ul.tr li .ck{position:absolute;left:0;top:0;color:#2E7D5B;font-weight:800}
  .bcard .grp{margin-top:15px;border-top:1px solid var(--line);padding-top:13px}
  .bcard .grp p{font-size:10.8px;color:var(--muted);line-height:1.45;margin:0 0 10px}
  .bcard .grp p b{color:var(--navy);font-weight:700}
  .btn-wa{display:flex;align-items:center;justify-content:center;gap:8px;background:#25D366;color:#fff;font-weight:700;font-size:13px;padding:13px 16px;border-radius:12px;text-decoration:none;box-shadow:0 12px 26px -12px rgba(37,211,102,.55)}
  .op .foot{position:absolute;left:15mm;right:15mm;bottom:11mm;display:flex;justify-content:space-between;font-size:9.5px;color:var(--navy-soft);border-top:1px solid var(--line);padding-top:9px}
  .op .foot b{color:var(--navy)}
</style>'''
head = head.replace("</head>", extra + "</head>", 1)


def img(src, alt, pos="center 50%"):
    return f'<img src="assets/{src}" alt="{alt}" style="object-position:{pos}">'


WA = ("https://wa.me/5511914455930?text=Ol%C3%A1!%20Quero%20fechar%20a%20experi%C3%AAncia%20%22Entre%20Fatias%20%26%20"
      "Ta%C3%A7as%20(sexta)%22%20para%20um%20grupo%20%2F%20turma%20privada.%20Pode%20me%20ajudar%20com%20datas%20e%20valores%3F")

op = f'''<div class="op">
  <div class="brow">
    <img src="assets/logo.png" alt="Elarah">
    <div class="r">Experiência · toda sexta</div>
  </div>

  <div class="hero">
    {img("pizzanegroni.jpg", "Pizza artesanal e taça de vinho", "center 50%")}
    <div class="ov">
      <span class="ey">✦ Pizza &amp; Vinho</span>
      <h1>Entre Fatias <em>&amp; Taças</em></h1>
      <span class="sub">Uma noite para brindar, saborear e se conectar.</span>
    </div>
  </div>
  <div class="meta"><span>⏱ <b>3h00</b> de experiência</span><span>📍 <b>Moema</b> · Rua dos Chanés, 50</span><span>🍷 Toda <b>sexta-feira</b></span></div>

  <div class="main">
    <div>
      <h2 class="sec">O que você vai <em>viver</em></h2>
      <p class="tx">Desfrute de uma noite onde os sabores da boa gastronomia se encontram com a arte de <b>compartilhar momentos especiais</b>. Você vai apreciar um <b>rodízio de pizzas artesanais</b> harmonizado com uma seleção dos vinhos argentinos <b>Siempre Tengo un Plan B</b> — Branco, Rosé e Tinto.</p>
      <p class="tx">Mais do que um jantar, é um convite para <b>desacelerar, conhecer novas pessoas, brindar à vida</b> e criar conexões em um ambiente acolhedor, elegante e descontraído.</p>
      <h3 class="inc">O que está incluso</h3>
      <ul class="inc">
        <li><span class="ck">✓</span>Rodízio de <b>pizzas artesanais</b></li>
        <li><span class="ck">✓</span>Degustação dos <b>vinhos argentinos</b> Siempre Tengo un Plan B (Branco, Rosé e Tinto)</li>
        <li><span class="ck">✓</span><b>Dicas de harmonização</b> entre pizzas e vinhos</li>
        <li><span class="ck">✓</span>Ambiente <b>intimista</b> e cuidadosamente preparado</li>
        <li><span class="ck">✓</span>Momentos de <b>conexão, conversa e networking</b></li>
      </ul>
      <p class="close">Cada taça e cada fatia contam uma nova história. 🍷</p>
      <div class="gal">
        <figure>{img("pizza.jpg", "Pizza artesanal", "center 50%")}</figure>
        <figure>{img("curadoria-vinhos.jpg", "Degustação de vinhos", "center 45%")}</figure>
        <figure>{img("harmonizacaoqueijos.jpg", "Harmonização", "center 55%")}</figure>
      </div>
    </div>

    <div class="bcard">
      <div class="price">R$ 219 <small>/pessoa</small></div>
      <div class="x12">ou em até <b>12x</b> no cartão</div>
      <div class="sel"><span>Escolha uma data</span><span class="cv">▾</span></div>
      <div class="sel"><span>Escolha um horário</span><span class="cv">▾</span></div>
      <div class="inclui"><span>🍷 Inclui:</span> Vinho à vontade</div>
      <ul class="tr">
        <li><span class="ck">✓</span>Confirmação na hora, por e-mail</li>
        <li><span class="ck">✓</span>Pagamento seguro — Pix ou cartão</li>
        <li><span class="ck">✓</span>Suporte no WhatsApp se precisar</li>
      </ul>
      <div class="grp">
        <p>Quer fechar <b>em grupo</b>? Aniversário, empresa ou turma privada.</p>
        <a class="btn-wa" href="{WA}" target="_blank" rel="noopener">💬 Falar no WhatsApp</a>
      </div>
    </div>
  </div>

  <div class="foot"><span><b>Elarah</b> · Experiências</span><span>@elarah.oficial · elarah.com.br · (11) 91445-5930</span></div>
</div>'''

html = head + op + '\n</body>\n</html>\n'
out = ROOT + "/entre-fatias-tacas-onepage.html"
io.open(out, "w", encoding="utf-8").write(html)
assert "Siempre Tengo un Plan B" in html and "R$ 219" in html
print("wrote", out)
