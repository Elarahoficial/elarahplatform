# Despedida de solteira deck — wine/rose palette, 4-experience menu (com vinho incluso) + 3-tier plans.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

# ---- embed fonts: swap the 3 google-fonts <link> lines for the embedded <style> block ----
fonts = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/embedded_fonts_style.html", encoding="utf-8").read()
head = re.sub(r'<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>',
              fonts, head, count=1, flags=re.S)

# ---- recolor CSS to elegant Mediterranean navy + warm gold (Entre Mares · Amissima) ----
head = head.replace("--orange:#F27623;", "--orange:#C0954E;")       # accent: warm gold
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#9C7638;")
head = head.replace("--navy:#16233C;", "--navy:#21384F;")           # deep sea navy (headings/dark)
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#556B7C;") # muted blue-grey for lead
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#C0954E;")
head = head.replace("#EDF1F7", "#EEF2F5").replace("#DCE5F1", "#D3E0E8")
head = head.replace("#FF9A4D", "#D9B879")
head = head.replace("rgba(242,118,35,.22)", "rgba(192,149,78,.26)")
head = head.replace(".itable .hl{background:#F7EAEF}", ".itable .hl{background:#F3ECDD}")  # soft sand highlight
head = head.replace(".tier.hl{border:2px solid var(--navy);background:#FBEBDF}", ".tier.hl{border:2px solid var(--navy);background:#F3ECDD}")
head = head.replace(".dchips span{background:#F5E9EE;", ".dchips span{background:#F3ECDD;")  # scent chips sand

# extra CSS: experience menu grid (2x2) + investment table
extra = '''
  .menu{display:flex;flex-wrap:wrap;gap:18px;justify-content:center;margin-top:12px}
  .exp{position:relative;width:calc(50% - 9px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .exp .top{position:absolute;top:12px;left:12px;z-index:3;background:var(--orange);color:#fff;font-size:9.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:5px 12px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(158,52,83,.55)}
  .exp-photo{height:184px;overflow:hidden;background:#eee}
  .exp-photo img{width:100%;height:100%;object-fit:cover}
  .exp-body{padding:15px 18px 18px}
  .exp .n{display:inline-block;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:6px}
  .exp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:20px;color:var(--navy);line-height:1.08}
  .exp p{font-size:12.5px;color:var(--muted);margin-top:6px;line-height:1.45}
  /* ícones (svg) no lugar de emoji */
  .infocard .ico svg{width:30px;height:30px;display:block}
  /* tabela de investimento (2 coleções x 3 níveis) */
  .itable{width:100%;border-collapse:collapse;margin-top:18px;font-family:'DM Sans'}
  .itable th,.itable td{padding:16px 12px;border-bottom:1px solid var(--line);text-align:center;vertical-align:middle}
  .itable thead th{font-size:12px;color:var(--navy);font-weight:700;border-bottom:2px solid var(--navy);text-transform:uppercase;letter-spacing:.04em}
  .itable thead th span{display:block;font-size:9.5px;font-weight:500;color:var(--muted);letter-spacing:.01em;margin-top:4px;text-transform:none}
  .itable td.rl{text-align:left;width:38%}
  .itable td.rl b{font-family:'DM Serif Display',serif;font-weight:400;font-size:19px;color:var(--navy)}
  .itable td.rl span{display:block;font-size:10.5px;color:var(--muted);margin-top:4px;line-height:1.45}
  .itable .val{font-family:'DM Serif Display',serif;font-size:26px;color:var(--navy);line-height:1}
  .itable .val small{display:block;font-family:'DM Sans';font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-top:4px}
  .itable .hl{background:#F7EAEF}
  .itable thead th.hl{color:var(--orange-dark)}
  .itable tbody tr:last-child td{border-bottom:none}
  .itable thead th.hl{position:relative}
  .itable .pill{display:inline-block;background:var(--navy);color:#fff;font-size:8px;letter-spacing:.08em;padding:3px 9px;border-radius:999px;margin-bottom:7px;font-weight:700;text-transform:uppercase}
  /* wtrio de experiências com vinho (3 quadrados na mesma linha) */
  .wtrio{display:flex;gap:16px;justify-content:center;margin-top:12px}
  .wcard{position:relative;flex:1;max-width:calc(33.333% - 11px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .wcard .top{position:absolute;top:11px;left:11px;z-index:3;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 11px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(158,52,83,.55)}
  .wcard .sq{aspect-ratio:1/1;overflow:hidden;background:#eee}
  .wcard .sq img{width:100%;height:100%;object-fit:cover}
  .wcard-body{padding:13px 15px 15px}
  .wcard .n{display:inline-block;font-size:9px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:5px}
  .wcard h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy);line-height:1.06}
  .wcard p{font-size:11.5px;color:var(--muted);margin-top:5px;line-height:1.4}
  /* bartenderia — destaque horizontal */
  .bfeat{display:flex;margin-top:18px;background:var(--card);border:1.6px solid var(--orange);border-radius:18px;overflow:hidden;box-shadow:0 18px 42px -24px rgba(0,0,0,.34)}
  .bfeat .bphoto{width:38%;overflow:hidden;background:#eee}
  .bfeat .bphoto img{width:100%;height:100%;object-fit:cover;display:block}
  .bfeat .bbody{flex:1;padding:22px 28px 24px;display:flex;flex-direction:column;justify-content:center}
  .bfeat .btag{align-self:flex-start;background:var(--navy);color:#fff;font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:6px 13px;border-radius:999px;margin-bottom:12px}
  .bfeat h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:24px;color:var(--navy);line-height:1}
  .bfeat .sub{display:inline-block;font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-top:6px}
  .bfeat p{font-size:12.5px;color:var(--muted);margin-top:9px;line-height:1.45}
  .dchips{display:flex;flex-wrap:wrap;gap:8px;margin-top:13px}
  .dchips span{background:#F5E9EE;border:1px solid var(--line);border-radius:999px;padding:6px 13px;font-size:11.5px;color:var(--navy);font-weight:500}
  /* venues (espaços) */
  .venues{display:flex;flex-direction:column;gap:16px;margin-top:14px}
  .venues .bfeat .bphoto{height:290px}
  .bfeat.plain{border:1px solid var(--line);box-shadow:0 14px 32px -24px rgba(0,0,0,.3)}
  .bfeat .vgal{display:flex;flex-direction:column;gap:2px}
  .bfeat .vgal img{width:100%;height:50%;object-fit:cover;display:block}
  .vprice{margin-top:13px;font-family:'DM Serif Display',serif;font-size:20px;color:var(--navy);line-height:1}
  .vprice small{font-family:'DM Sans';font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-left:7px;font-weight:600}
  .btag.soft{background:var(--navy-soft)}
  /* pieces grid — 4 quadrados (peças de crochê) */
  .pgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin-top:14px}
  .pgrid.g3{grid-template-columns:repeat(3,1fr);gap:16px}
  .pcard{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;box-shadow:0 13px 28px -20px rgba(0,0,0,.3);display:flex;flex-direction:column}
  .pcard .sq{aspect-ratio:1/1;overflow:hidden;background:#eee}
  .pcard .sq img{width:100%;height:100%;object-fit:cover;display:block}
  .pcard .pb{padding:11px 13px 14px}
  .pcard .n{display:inline-block;font-size:8.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:4px}
  .pcard h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:16px;color:var(--navy);line-height:1.05}
  .pcard p{font-size:10px;color:var(--muted);line-height:1.36;margin-top:4px}
  /* tiers — níveis de preço (uma tabela só) */
  .tiers{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:18px}
  .tier{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:26px 22px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:9px;box-shadow:0 16px 34px -24px rgba(0,0,0,.3)}
  .tier.hl{border:2px solid var(--navy);background:#FBEBDF}
  .tier .pill{display:inline-block;background:var(--navy);color:#fff;font-size:8px;letter-spacing:.08em;padding:4px 11px;border-radius:999px;font-weight:700;text-transform:uppercase}
  .tier .tn{font-size:10px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--orange)}
  .tier .tv{font-family:'DM Serif Display',serif;font-size:40px;color:var(--navy);line-height:1}
  .tier .td{font-size:12px;color:var(--muted);line-height:1.4}
</style>'''
head = head.replace("</style>", extra, 1)
# print overrides for the wtrio + bartenderia layout
head = head.replace(".menu-cols{grid-template-columns:1fr 1fr}",
                    ".menu-cols{grid-template-columns:1fr 1fr}\n    .wtrio{flex-direction:row;gap:14px}\n    .wcard{max-width:calc(33.333% - 10px)}\n    .bfeat{flex-direction:row}\n    .bfeat .bphoto{width:38%}\n    .venues .bfeat .bphoto{height:250px}\n    .wcard-body{padding:10px 13px 12px}\n    .wcard h3{font-size:16px}\n    .wcard p{font-size:10.5px;margin-top:4px;line-height:1.34}\n    .bfeat{margin-top:15px}\n    .bfeat .bbody{padding:16px 22px 17px}\n    .bfeat h3{font-size:21px}\n    .bfeat p{font-size:11.5px;margin-top:7px}\n    .dchips{margin-top:10px;gap:7px}\n    .dchips span{font-size:11px;padding:5px 11px}")
# mobile: wtrio + bfeat stack
head = head.replace(".plans{grid-template-columns:1fr}",
                    ".plans{grid-template-columns:1fr}\n    .wtrio{flex-direction:column}\n    .wcard{max-width:100%}\n    .bfeat{flex-direction:column}\n    .bfeat .bphoto{width:100%;height:220px}")

def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'

def exp(n, img, name, desc, alt, pos="center 50%", top=None):
    tb = f'<span class="top">{top}</span>' if top else ''
    return f'<div class="exp">{tb}<div class="exp-photo"><img src="assets/{img}" alt="{alt}" style="object-position:{pos}"></div><div class="exp-body"><span class="n">{n}</span><h3>{name}</h3><p>{desc}</p></div></div>'

cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right">
        <span class="kicker">Experiência de marca para</span>
        <span class="compass">AMISSIMA<small>lançamento · Entre Mares</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência de marca · Evento em loja</span>
        <h1>Experiências <br><em>Entre Mares</em></h1>
        <p class="lead">Um menu de experiências <strong>finas, elegantes e diferentes</strong> pra encantar as clientes no lançamento de <strong>Entre Mares</strong> — cada uma vive um momento sensorial e leva a criação de recordação. Tudo com a cara da <strong>Riviera Francesa &amp; da Grécia</strong>. 🌊</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>20 a 30</b> clientes</span>
          <span class="chip"><b>19</b> de agosto</span>
          <span class="chip">Shopping <b>JK</b> · SP</span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/perfumariamaes.jpg" alt="Mesa elegante com essências, lavanda e flores mediterrâneas" style="object-position:center 45%">
      </div>
    </div>
    {foot("Experiência de marca · Amissima")}
  </section>'''

buscamos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Pensado pra Amissima</span></div>
    </div>
    <span class="eyebrow orange">◆ Por que uma experiência</span>
    <h2>Encanta a cliente, <em>eleva a marca</em></h2>
    <p class="lead">Muito além de um mimo: uma experiência sensorial faz a cliente <strong>viver a coleção na pele</strong> — literalmente. Ela cria, se emociona, leva o perfume de recordação e ainda gera <strong>conteúdo lindo</strong> pro Instagram da marca.</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#C0954E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3.5 L16 12 L24.5 14 L16 16 L14 24.5 L12 16 L3.5 14 L12 12 Z"/></svg></div><h3>Fino & diferente</h3><p>Uma experiência elegante e sensorial, à altura da Amissima — nada de óbvio.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#C0954E" stroke-width="1.6" stroke-linejoin="round"><path d="M6 22 C6 14 10 6 14 4 C18 6 22 14 22 22 M9 22 h10"/><path d="M14 4 v18"/></svg></div><h3>Feito pra coleção</h3><p>Tudo amarrado a <b>Entre Mares</b> — as notas, o clima e a estética da Riviera &amp; da Grécia.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#C0954E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21 q4-5 5-9 M4 21 q5 1 9-1 M14 15 l7-11 M14 15 q3 3 7 3 M21 4 q3 4 0 11"/></svg></div><h3>Conteúdo pra marca</h3><p>Estação linda e instagramável — rende fotos e stories que viram divulgação espontânea.</p></div>
    </div>
    <div class="quote">
      <i>"A cliente não lembra do que ganhou — lembra do que sentiu."</i><br>
      — E é isso que a Elarah leva pro lançamento da Amissima: uma <strong>memória sensorial da coleção</strong>. 🌊
    </div>
    {foot("Pensado pra Amissima")}
  </section>'''

vibe = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">A vibe da experiência</span></div>
    </div>
    <span class="eyebrow orange">◆ Imagina o clima</span>
    <h2>A vibe da <em>experiência</em></h2>
    <p class="lead">Uma estação elegante, frascos âmbar, essências e as clientes descobrindo aromas — sofisticado, sensorial e cheio de charme. É esse o clima que a Elarah leva pra loja da Amissima. 🌊</p>
    <div class="rule"></div>
    <div class="pgrid g3">
      <div class="pcard"><div class="sq"><img src="assets/perfumariaharbolita.jpg" alt="Mãos testando essências numa fita olfativa" style="object-position:center 45%"></div><div class="pb"><span class="n">A vibe</span><h3>Sensorial</h3><p>Cada cliente testa notas e monta a própria fragrância, com calma.</p></div></div>
      <div class="pcard"><div class="sq"><img src="assets/perfumariaapresenta%C3%A7%C3%A3o.jpg" alt="Clientes descobrindo aromas numa estação de perfumaria" style="object-position:center 40%"></div><div class="pb"><span class="n">A vibe</span><h3>Encontro</h3><p>As clientes vivem juntas, trocam e se encantam — momento da marca.</p></div></div>
      <div class="pcard"><div class="sq"><img src="assets/perfumariaapresenta%C3%A7%C3%A3o2.jpg" alt="Cliente sentindo um aroma numa fita olfativa" style="object-position:center 35%"></div><div class="pb"><span class="n">A vibe</span><h3>Elegância</h3><p>Uma experiência fina e instagramável, com a estética da coleção.</p></div></div>
    </div>
    <div class="note" style="margin-top:16px">◆ E o melhor: cada cliente sai com o <b>próprio perfume</b> — a lembrança perfeita do lançamento e da marca. ✨</div>
    {foot("A vibe da experiência")}
  </section>'''

menu = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O menu de opções</span></div>
    </div>
    <span class="eyebrow orange">◆ Opções finas &amp; diferentes</span>
    <h2>Um menu <em>elegante</em></h2>
    <p class="lead">Experiências sofisticadas em <strong>formato de estação</strong> — as clientes passam, criam em ~10-15 min e levam a peça de recordação. Escolham uma ou combinem em estações. Tudo tematizável pra <strong>Entre Mares</strong>. 🌊</p>
    <div class="rule"></div>
    <div class="pgrid g3">
      <div class="pcard"><div class="sq"><img src="assets/velaaromatica.jpg" alt="Vela aromática artesanal num vidro elegante" style="object-position:center 50%"></div><div class="pb"><span class="n">Opção</span><h3>Vela Aromática</h3><p>Cada cliente cria a própria vela, com aromas do Mediterrâneo.</p></div></div>
      <div class="pcard"><div class="sq"><img src="assets/perfumariadecor.jpg" alt="Frascos de aromatizador de ambiente numa estação elegante" style="object-position:center 45%"></div><div class="pb"><span class="n">Opção</span><h3>Aromatizador de Ambiente</h3><p>Um difusor autoral pra perfumar a casa, com a assinatura da coleção.</p></div></div>
      <div class="pcard"><div class="sq"><img src="assets/charmbar.jpg" alt="Peça personalizada com charms delicados" style="object-position:center 45%"></div><div class="pb"><span class="n">Opção</span><h3>Charm Bag</h3><p>Cada cliente personaliza a sua peça com charms — conchas, sol, iniciais.</p></div></div>
      <div class="pcard"><div class="sq"><img src="assets/croche.jpg" alt="Bolsinhas de crochê coloridas feitas à mão" style="object-position:center 50%"></div><div class="pb"><span class="n">Opção</span><h3>Bolsa de Crochê</h3><p>Uma bolsinha autoral com a cara do verão mediterrâneo.</p></div></div>
      <div class="pcard"><div class="sq"><img src="assets/saboneteroxo.jpg" alt="Sabonetes artesanais de lavanda" style="object-position:center 50%"></div><div class="pb"><span class="n">Sugestão Elarah</span><h3>Sabonete Artesanal</h3><p>Sabonetes botânicos de lavanda &amp; ervas — puro Mediterrâneo.</p></div></div>
      <div class="pcard"><div class="sq"><img src="assets/pinturataca2.jpg" alt="Fileira de taças de vidro pintadas à mão" style="object-position:center 55%"></div><div class="pb"><span class="n">Sugestão Elarah</span><h3>Pintura em Taça</h3><p>Cada cliente pinta a própria taça e usa na bebida do evento.</p></div></div>
    </div>
    <div class="note" style="margin-top:15px">◆ Em todas, a Elarah leva <b>profissional, material e ambientação</b> — e a cliente sai com a criação de recordação. Ideal pra 20 a 30 clientes. ✨</div>
    {foot("O menu de opções")}
  </section>'''

espacos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O tema · Entre Mares</span></div>
    </div>
    <span class="eyebrow orange">◆ Amarrado à coleção</span>
    <h2>Tudo com a cara de <em>Entre Mares</em></h2>
    <p class="lead">A gente tematiza a experiência inteira pra traduzir a coleção — dos <strong>aromas</strong> às <strong>cores e à ambientação</strong>. Um passeio da Riviera Francesa às ilhas gregas, do começo ao fim.</p>
    <div class="rule"></div>
    <div class="bfeat">
      <div class="bphoto"><img src="assets/perfumariaapresenta%C3%A7%C3%A3o.jpg" alt="Cliente descobrindo aromas numa estação de perfumaria" style="object-position:center 40%"></div>
      <div class="bbody">
        <span class="btag">Riviera Francesa &amp; Grécia</span>
        <h3>Os aromas <span class="sub">do Mediterrâneo</span></h3>
        <p>Um menu de essências curado pra coleção, pra vela, o aromatizador ou o perfume:</p>
        <div class="dchips"><span>Neroli</span><span>Cítricos &amp; Bergamota</span><span>Figo</span><span>Sal marinho</span><span>Lavanda</span><span>Alecrim</span><span>Âmbar solar</span></div>
      </div>
    </div>
    <div class="note" style="margin-top:15px">◆ <b>A estética também:</b> paleta azul &amp; branco grego, dourado e oliveira, palha e linho — a ambientação da estação com a assinatura visual da Amissima. 🌊</div>
    {foot("O tema · Entre Mares")}
  </section>'''

planos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ Sob medida pra Amissima</span>
    <h2>O que está <em>incluso</em></h2>
    <p class="lead">Um pacote completo pra você só receber as clientes — do perfumista à ambientação temática. E cada cliente sai com o perfume, com a cara da marca. 🌊</p>
    <div class="rule"></div>
    <div class="plans">
      <div class="plan">
        <div class="plan-photo sq"><img src="assets/perfumes11.jpg" alt="Clientes vivendo a experiência numa estação montada na loja" style="object-position:center 40%"></div>
        <div class="plan-body">
          <span class="tag basic">Tudo incluso</span>
          <h3>A estação completa</h3>
          <ul class="feat">
            <li>Perfumista pra conduzir a experiência</li>
            <li>Menu de essências, frascos e materiais</li>
            <li>Ambientação temática <b>Entre Mares</b></li>
          </ul>
          <span class="allin">Você só recebe as clientes</span>
        </div>
      </div>
      <div class="plan featured">
        <span class="ribbon">★ Com a marca</span>
        <div class="plan-photo sq"><img src="assets/perfumariaharbolita.jpg" alt="Frasco de perfume criado pela cliente" style="object-position:center 45%"></div>
        <div class="plan-body">
          <span class="tag premium">Personalização</span>
          <h3>A Amissima no perfume</h3>
          <ul class="feat">
            <li>Frasco &amp; rótulo com a identidade da marca</li>
            <li>Cada cliente leva a coleção de recordação</li>
            <li>Conteúdo lindo e espontâneo pra marca</li>
          </ul>
          <span class="allin">A coleção no bolso da cliente</span>
        </div>
      </div>
    </div>
    <div class="note" style="margin-top:15px">◆ <b>Investimento sob medida</b> conforme o número de clientes (20 a 30) — fechamos o pacote certinho pra você. 💛</div>
    {foot("Investimento")}
  </section>'''

personaliza = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Os extras da festa</span></div>
    </div>
    <span class="eyebrow orange">◆ Nos níveis Com registro & Completo</span>
    <h2>Foto &amp; <em>lembrancinha</em></h2>
    <p class="lead">Além da peça que cada um cria, dá pra somar dois mimos que deixam o dia inesquecível — a foto profissional e a lembrancinha personalizada.</p>
    <div class="rule"></div>
    <div class="plans">
      <div class="plan">
        <div class="plan-photo sq"><img src="assets/rockworld1.jpg" alt="Convidados se divertindo na festa, registrados por um fotógrafo" style="object-position:center 30%"></div>
        <div class="plan-body">
          <span class="tag basic">Nível Com registro</span>
          <h3>Registro fotográfico profissional</h3>
          <ul class="feat">
            <li>Um fotógrafo cobre a festa inteira</li>
            <li>Cada brinde e cada risada registrados</li>
            <li>Álbum digital lindo pra guardar (e postar)</li>
          </ul>
          <span class="allin">A memória do dia, pra sempre</span>
        </div>
      </div>
      <div class="plan featured">
        <span class="ribbon">★ Nível Completo</span>
        <div class="plan-photo sq"><img src="assets/personaliza%C3%A7aobrindeescovapiranha.jpg" alt="Lembrancinha personalizada num box com o nome de cada convidado" style="object-position:center"></div>
        <div class="plan-body">
          <span class="tag premium">Personalização</span>
          <h3>Lembrancinha personalizada</h3>
          <ul class="feat">
            <li>Cada convidado leva uma lembrancinha da festa</li>
            <li>Personalizada com o nome de cada um</li>
            <li>Um mimo pra levarem de recordação</li>
          </ul>
          <span class="allin">Cada um leva o seu mimo</span>
        </div>
      </div>
    </div>
    {foot("Os extras da festa")}
  </section>'''

como = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Como funciona &amp; contato</span></div>
    </div>
    <span class="eyebrow orange">◆ Simples e sob medida</span>
    <h2>É só <em>abrir as portas</em></h2>
    <p class="lead">A Elarah cuida da curadoria e da produção de ponta a ponta — você não precisa contatar ninguém:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Fechamos o tema &amp; formato</h3><p>Bar de Perfumaria "Entre Mares", com as notas curadas pra coleção.</p></div>
      <div class="step"><div class="num">2</div><h3>A gente leva até a loja</h3><p>Perfumista, essências, frascos e ambientação. Você não contata nenhum parceiro.</p></div>
      <div class="step"><div class="num">3</div><h3>As clientes se encantam</h3><p>Elas passam na estação, criam o perfume e levam a coleção de recordação.</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Curadoria de ponta a ponta 🤍</h4>
        <p>A Elarah é a organização e a curadoria: temos uma rede de artistas e parceiros, e cuidamos de tudo pra você — do conceito à execução na loja.</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora encantar as clientes da <em>Amissima?</em> ✦</h2>
      <p>Me conta se topa esse caminho, que a gente fecha o pacote e cada detalhe pro dia 19/08 no JK.</p>
      <div class="cta-actions">
        <a class="btn-wa" href="https://wa.me/5511914455930?text=Oi%2C%20Elarah!%20Vi%20a%20proposta%20do%20Bar%20de%20Perfumaria%20e%20quero%20fechar%20os%20detalhes." target="_blank" rel="noopener">
          💬 Falar no WhatsApp
        </a>
        <div class="contact-links">
          <span>+55 (11) 91445-5930</span>
          <a href="https://instagram.com/elarah.oficial" target="_blank" rel="noopener">@elarah.oficial</a>
          <a href="https://elarah.com.br" target="_blank" rel="noopener">elarah.com.br</a>
        </div>
      </div>
    </div>
    <p class="fineprint">Proposta de experiência de marca da Elarah para a Amissima — Bar de Perfumaria temático, no lançamento da coleção Entre Mares (Riviera Francesa &amp; Grécia), em evento de loja no Shopping JK (São Paulo), no dia 19 de agosto, para cerca de 20 a 30 clientes. Formato de estação: cada cliente cria a própria fragrância a partir de um menu de essências curado para a coleção e leva o perfume em frasco personalizado com a identidade da marca. A Elarah cuida da curadoria e produção de ponta a ponta — perfumista, essências, frascos, materiais e ambientação temática. Investimento sob medida conforme o número de clientes. Proposta válida mediante confirmação de data e disponibilidade de agenda.</p>
    {foot("Experiência de marca · Amissima · 2026")}
  </section>'''

deck = '<div class="deck">\n' + cover + buscamos + menu + espacos + planos + como + '\n\n</div>\n\n'
# fix title/meta
head = head.replace("<title>Experiência Corporativa · Elarah × Compass</title>", "<title>Bar de Perfumaria · Amissima · Elarah</title>")
head = re.sub(r'<meta name="description"[^>]*>', '<meta name="description" content="Proposta da Elarah para a Amissima — Bar de Perfumaria temático Entre Mares para o lançamento da coleção.">', head)
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-marca-amissima.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"), html.count("compass\">"))
