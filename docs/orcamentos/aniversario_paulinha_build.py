# Despedida de solteira deck — wine/rose palette, 4-experience menu (com vinho incluso) + 3-tier plans.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

# ---- embed fonts: swap the 3 google-fonts <link> lines for the embedded <style> block ----
fonts = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/embedded_fonts_style.html", encoding="utf-8").read()
head = re.sub(r'<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>',
              fonts, head, count=1, flags=re.S)

# ---- recolor CSS to fresh teal + coral (aniversário festivo · drinks & pintura) ----
head = head.replace("--orange:#F27623;", "--orange:#E8734E;")       # accent: warm coral
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#C4552F;")
head = head.replace("--navy:#16233C;", "--navy:#1E3A38;")           # deep teal (headings/dark)
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#4E6462;") # muted teal for lead
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#E8734E;")
head = head.replace("#EDF1F7", "#EAF1EF").replace("#DCE5F1", "#CFE1DD")
head = head.replace("#FF9A4D", "#F0A07A")
head = head.replace("rgba(242,118,35,.22)", "rgba(232,115,78,.26)")
head = head.replace(".itable .hl{background:#F7EAEF}", ".itable .hl{background:#E3EEEB}")  # soft teal highlight

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
        <span class="kicker">Proposta de aniversário</span>
        <span class="compass">Aniversário da <span>Paulinha</span><small>19 de setembro</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência · Aniversário</span>
        <h1>Uma festa <br><em>criativa</em></h1>
        <p class="lead">Um aniversário <strong>diferente e cheio de vida</strong> pra celebrar com a galera — <strong>Pintura</strong>, <strong>Perfumaria</strong> ou uma aula de <strong>Drinks</strong>. Todo mundo põe a mão na massa, se diverte e leva a criação pra casa. 🎨🍸</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>20</b> convidados</span>
          <span class="chip"><b>19</b> de setembro</span>
          <span class="chip">A partir de <b>R$ 199</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/aniversariogi.jpg" alt="Mesa de aniversário cheia de charme, com pintura e drinks" style="object-position:center 40%">
      </div>
    </div>
    {foot("Experiência · Aniversário")}
  </section>'''

buscamos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Pensado pra você</span></div>
    </div>
    <span class="eyebrow orange">◆ Como funciona</span>
    <h2>Um aniversário <em>diferente</em></h2>
    <p class="lead">Nada de festa comum: aqui a galera põe <strong>a mão na massa</strong>, cria junto e se diverte de verdade. Uma comemoração que rende <strong>histórias, fotos lindas e uma lembrança feita à mão</strong> — pra qualquer pessoa, sem talento nenhum.</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#E8734E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3.5 L16 12 L24.5 14 L16 16 L14 24.5 L12 16 L3.5 14 L12 12 Z"/></svg></div><h3>Criativo & animado</h3><p>Pintura, perfumaria ou drinks — cada um cria (ou brinda) e leva a experiência pra casa.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#E8734E" stroke-width="1.6" stroke-linejoin="round"><path d="M14 24s-8.5-5-8.5-11a4.8 4.8 0 0 1 8.5-3 4.8 4.8 0 0 1 8.5 3c0 6-8.5 11-8.5 11z"/></svg></div><h3>Só de vocês</h3><p>Turma 100% privativa, a aniversariante no centro — todo mundo junto na diversão.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#E8734E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 21V11l10.5-7 10.5 7v10M10 21v-6h8v6"/></svg></div><h3>Onde você quiser</h3><p>No seu espaço, num parceiro ou a gente leva até você — material, condução e estrutura por nossa conta.</p></div>
    </div>
    <div class="quote">
      <i>"As melhores festas são as que ninguém esquece."</i><br>
      — E ninguém esquece o dia em que <strong>criou, brindou e se divertiu junto</strong>. 🎉
    </div>
    {foot("Pensado pra você")}
  </section>'''

vibe = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">A vibe da experiência</span></div>
    </div>
    <span class="eyebrow orange">◆ Imagina o clima</span>
    <h2>A vibe da <em>experiência</em></h2>
    <p class="lead">Música boa, taça na mão e todo mundo criando junto — leve, animado e cheio de conexão. É esse o clima de uma experiência Elarah: a festa vira memória afetiva. 🎉</p>
    <div class="rule"></div>
    <div class="pgrid g3">
      <div class="pcard"><div class="sq"><img src="assets/corp-grupo.jpg" alt="Grupo criando junto numa experiência, mão na massa" style="object-position:center 40%"></div><div class="pb"><span class="n">A vibe</span><h3>Mão na massa</h3><p>Todo mundo criando junto, sem pressa e sem talento nenhum.</p></div></div>
      <div class="pcard"><div class="sq"><img src="assets/drinksclassicos.jpg" alt="Drink autoral servido, clima de brinde" style="object-position:center 50%"></div><div class="pb"><span class="n">A vibe</span><h3>Taça na mão</h3><p>Brinde, música boa e muita risada do começo ao fim.</p></div></div>
      <div class="pcard"><div class="sq"><img src="assets/aniv-adulto.jpg" alt="Amigas celebrando juntas num jantar de aniversário" style="object-position:center 40%"></div><div class="pb"><span class="n">A vibe</span><h3>Memória afetiva</h3><p>Uma celebração diferente, que todo mundo lembra depois.</p></div></div>
    </div>
    <div class="note" style="margin-top:16px">◆ E o melhor: cada um sai com a <b>própria criação</b> na mão — a lembrança perfeita de um dia inesquecível. 💛</div>
    {foot("A vibe da experiência")}
  </section>'''

menu = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">As experiências</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolha a experiência</span>
    <h2>Três opções <em>pra festa</em></h2>
    <p class="lead">Escolham a que mais tem a cara da galera — dá pra combinar mais de uma também, montando estações! Em todas, cada um cria (ou brinda) e leva a experiência pra casa.</p>
    <div class="rule"></div>
    <div class="wtrio">
      <div class="wcard"><div class="sq"><img src="assets/pinturataca2.jpg" alt="Fileira de taças de vidro pintadas à mão com flores" style="object-position:center 55%"></div><div class="wcard-body"><span class="n">01</span><h3>Pintura</h3><p>Cada um pinta a sua peça autoral — em cerâmica, tela, vidro ou marca-página.</p></div></div>
      <div class="wcard"><div class="sq"><img src="assets/perfumariaharbolita.jpg" alt="Essências e frascos de uma imersão de perfumaria" style="object-position:center 45%"></div><div class="wcard-body"><span class="n">02</span><h3>Perfumaria Botânica</h3><p>Uma imersão sensorial — cada um cria a própria fragrância e leva o seu perfume.</p></div></div>
      <div class="wcard"><div class="sq"><img src="assets/drinks.jpg" alt="Drink autoral servido numa aula de bartenderia" style="object-position:center 50%"></div><div class="wcard-body"><span class="n">03</span><h3>Drinks</h3><p>Uma aula de bartenderia — todo mundo aprende a preparar (e brindar) drinks autorais.</p></div></div>
    </div>
    <div class="note" style="margin-top:16px">◆ Em todas, a Elarah leva <b>material, condução e estrutura</b> — vocês só chegam e curtem. A turma fica <b>100% privativa</b>, só de vocês. 🎉</div>
    {foot("As experiências")}
  </section>'''

espacos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">As categorias de pintura</span></div>
    </div>
    <span class="eyebrow orange">◆ Na pintura, você escolhe</span>
    <h2>Pintar <em>o quê?</em></h2>
    <p class="lead">A pintura tem várias categorias — cada um escolhe o que quer pintar, <strong>todas pelo mesmo valor</strong>. É só decidir a preferida! 🎨</p>
    <div class="rule"></div>
    <div class="pgrid g3">
      <div class="pcard"><div class="sq"><img src="assets/pinturapratoceramica.jpg" alt="Prato de cerâmica pintado à mão" style="object-position:center 50%"></div><div class="pb"><span class="n">Categoria</span><h3>Em Cerâmica</h3><p>Pratos, canecas e peças pintadas à mão, pra usar em casa.</p></div></div>
      <div class="pcard"><div class="sq"><img src="assets/pintura.jpg" alt="Pessoas pintando telas num ateliê" style="object-position:center 40%"></div><div class="pb"><span class="n">Categoria</span><h3>Em Tela</h3><p>Uma obra autoral pra pendurar e chamar de sua.</p></div></div>
      <div class="pcard"><div class="sq"><img src="assets/pinturatacaaaa.jpg" alt="Taça de vidro pintada à mão com flores" style="object-position:center 45%"></div><div class="pb"><span class="n">Categoria</span><h3>Em Vidro</h3><p>Taças e copos autorais, pra brindar com estilo.</p></div></div>
    </div>
    <div class="note" style="margin-top:16px">◆ E ainda dá pra pintar um <b>marca-página</b> — todas as categorias pelo mesmo valor. É só escolher a preferida! 🎨</div>
    {foot("As categorias de pintura")}
  </section>'''

planos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham o nível</span>
    <h2>A partir de <em>R$ 199</em></h2>
    <p class="lead">Cada experiência tem o seu valor por pessoa, com material e condução inclusos. É só escolher a experiência e o nível — os valores abaixo valem no <strong>seu espaço ou na cafeteria Jules</strong> (sem custo de espaço).</p>
    <div class="rule"></div>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th>Só a experiência<span>material & condução</span></th>
        <th>Com registro<span>+ foto profissional</span></th>
        <th class="hl"><span class="pill">★ Mais completo</span><br>Completo<span>+ personalização & lembrancinha</span></th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="rl"><b>Pintura</b><span>Cerâmica · Tela · Vidro · Marca-página</span></td>
          <td class="val">R$ 199</td><td class="val">R$ 299</td><td class="val hl">R$ 399</td>
        </tr>
        <tr>
          <td class="rl"><b>Perfumaria Botânica</b><span>Imersão sensorial — cada um leva o seu perfume</span></td>
          <td class="val">R$ 239</td><td class="val">R$ 339</td><td class="val hl">R$ 439</td>
        </tr>
        <tr>
          <td class="rl"><b>Drinks</b><span>Aula de bartenderia — drinks autorais</span></td>
          <td class="val">R$ 399</td><td class="val">R$ 499</td><td class="val hl">R$ 599</td>
        </tr>
      </tbody>
    </table>
    <div class="note" style="margin-top:14px">◆ <b>Onde acontece:</b> no <b>seu espaço</b> ou na <b>cafeteria Jules</b>, sem custo de espaço. No <b>Bake Studio</b> (espaço fechado e exclusivo), Pintura e Perfumaria a partir de <b>R$ 249</b> e Drinks a partir de <b>R$ 459</b> — subindo +R$ 100 por nível.</div>
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
    <h2>É só <em>reunir o grupo</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pra a comemoração ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Escolhem a experiência</h3><p>Pintura, Perfumaria ou Drinks — uma ou combinando mais de uma em estações.</p></div>
      <div class="step"><div class="num">2</div><h3>Onde vocês quiserem</h3><p>No seu espaço, na cafeteria Jules ou no Bake Studio — a gente leva tudo.</p></div>
      <div class="step"><div class="num">3</div><h3>É só criar e comemorar</h3><p>Vocês só chegam, põem a mão na massa e cada um leva a experiência pra casa.</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Com a cara da festa 🎉</h4>
        <p>A gente personaliza a experiência com o tema da comemoração — e ajuda a montar tudo com carinho pra o dia ficar inesquecível.</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora comemorar o <em>seu dia?</em> ✦</h2>
      <p>Me conta quais experiências mais chamaram e o espaço, que a gente fecha o 19/09 e cada detalhe da festa.</p>
      <div class="cta-actions">
        <a class="btn-wa" href="https://wa.me/5511914455930?text=Oi%2C%20Elarah!%20Vi%20a%20proposta%20de%20anivers%C3%A1rio%20e%20quero%20saber%20mais." target="_blank" rel="noopener">
          💬 Falar no WhatsApp
        </a>
        <div class="contact-links">
          <span>+55 (11) 91445-5930</span>
          <a href="https://instagram.com/elarah.oficial" target="_blank" rel="noopener">@elarah.oficial</a>
          <a href="https://elarah.com.br" target="_blank" rel="noopener">elarah.com.br</a>
        </div>
      </div>
    </div>
    <p class="fineprint">Proposta de experiência de aniversário da Elarah, turma privada de cerca de 20 pessoas, na data de 19 de setembro. Experiências à escolha (uma ou combinando): Pintura (categorias cerâmica, tela, vidro ou marca-página) a partir de R$ 199 por pessoa (níveis R$ 199 / 299 / 399); Perfumaria Botânica a partir de R$ 239 por pessoa (níveis R$ 239 / 339 / 439); Drinks (aula de bartenderia) a partir de R$ 399 por pessoa (níveis R$ 399 / 499 / 599). Níveis: Só a experiência (material & condução inclusos) / Com registro (+ foto profissional) / Completo (+ personalização & lembrancinha), subindo R$ 100 por nível. Valores por pessoa, válidos no espaço do grupo ou na cafeteria parceira Jules (sem custo de espaço); no Bake Studio (espaço fechado e exclusivo), Pintura e Perfumaria a partir de R$ 249 e Drinks a partir de R$ 459. Proposta válida mediante confirmação de data e disponibilidade de agenda.</p>
    {foot("Experiência · Aniversário · 2026")}
  </section>'''

deck = '<div class="deck">\n' + cover + buscamos + vibe + menu + espacos + planos + personaliza + como + '\n\n</div>\n\n'
# fix title/meta
head = head.replace("<title>Experiência Corporativa · Elarah × Compass</title>", "<title>Aniversário · Elarah</title>")
head = re.sub(r'<meta name="description"[^>]*>', '<meta name="description" content="Proposta de experiência de aniversário da Elarah — Pintura, Perfumaria ou Drinks, turma privativa.">', head)
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-aniversario-paulinha.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"), html.count("compass\">"))
