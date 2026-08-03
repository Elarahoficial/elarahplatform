# Despedida de solteira deck — wine/rose palette, 4-experience menu (com vinho incluso) + 3-tier plans.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

# ---- embed fonts: swap the 3 google-fonts <link> lines for the embedded <style> block ----
fonts = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/embedded_fonts_style.html", encoding="utf-8").read()
head = re.sub(r'<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>',
              fonts, head, count=1, flags=re.S)

# ---- recolor CSS to deep wine + rose + blush (despedida de solteira) ----
head = head.replace("--orange:#F27623;", "--orange:#B14A6B;")       # accent: deep rose/wine
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#8E3453;")
head = head.replace("--navy:#16233C;", "--navy:#4A1E32;")           # deep wine/burgundy (headings/dark)
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#6E5560;") # muted mauve for lead
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#B14A6B;")
head = head.replace("#EDF1F7", "#F7EBEF").replace("#DCE5F1", "#EEDAE1")
head = head.replace("#FF9A4D", "#E29AB4")
head = head.replace("rgba(242,118,35,.22)", "rgba(177,74,107,.30)")

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
        <span class="kicker">Proposta pra Michele</span>
        <span class="compass">Despedida de <span>solteira</span><small>sábado · 12 de setembro</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência · Despedida de solteira</span>
        <h1>Uma tarde <br><em>só de vocês</em></h1>
        <p class="lead">Uma oficina <strong>sensorial e cheia de carinho</strong> pra celebrar a noiva com as pessoas que ela ama — <strong>Velas</strong> ou <strong>Cerâmica</strong>, num espaço privativo, com direito a bolo, doces e espumante. 🥂</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>13</b> mulheres</span>
          <span class="chip">Sábado · <b>12/09</b></span>
          <span class="chip">à tarde · <b>2h30–3h</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/desp-hero2.jpg" alt="Amigas comemorando juntas, taça na mão, numa despedida de solteira" style="object-position:center 28%">
      </div>
    </div>
    {foot("Experiência · Despedida de solteira")}
  </section>'''

buscamos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Pensado pra celebrar a noiva</span></div>
    </div>
    <span class="eyebrow orange">◆ O que a gente leva</span>
    <h2>Uma despedida <em>diferente</em></h2>
    <p class="lead">Uma tarde de <strong>mão na massa</strong>, delicada e cheia de risada, em que o que importa é criar e celebrar juntas. Uma oficina pensada pra soltar o grupo, mimar a noiva e render fotos lindas — pra qualquer uma, sem talento nenhum.</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#B14A6B" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3.5 L16 12 L24.5 14 L16 16 L14 24.5 L12 16 L3.5 14 L12 12 Z"/></svg></div><h3>Sensorial & criativo</h3><p>Vela ou cerâmica — cada uma cria a sua peça à mão e leva a criação pra casa.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#B14A6B" stroke-width="1.6" stroke-linejoin="round"><path d="M14 24s-8.5-5-8.5-11a4.8 4.8 0 0 1 8.5-3 4.8 4.8 0 0 1 8.5 3c0 6-8.5 11-8.5 11z"/></svg></div><h3>Só de vocês</h3><p>Turma 100% privativa, a noiva no centro — o grupo inteiro criando e celebrando junto.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#B14A6B" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12 V7 a2 2 0 0 1 2-2 h12 a2 2 0 0 1 2 2 v5 M4 12 h20 v3 a3 3 0 0 1-3 3 H7 a3 3 0 0 1-3-3 z M9 21 v1 M19 21 v1"/></svg></div><h3>Levem o docinho</h3><p>Bolo, doces e espumante são super bem-vindos — a mesa de vocês fica um charme. 🥂</p></div>
    </div>
    <div class="quote">
      <i>"As melhores memórias a gente cria com as mãos."</i><br>
      — É isso que a Elarah leva pra despedida da sua filha: uma tarde que vira <strong>lembrança (e foto linda)</strong>.
    </div>
    {foot("Pensado pra celebrar a noiva")}
  </section>'''

menu = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">As oficinas</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham a oficina</span>
    <h2>Vela <em>ou</em> Cerâmica</h2>
    <p class="lead">Duas oficinas sensoriais, perfeitas pra despedida — e pelo <strong>mesmo valor</strong>, é só escolher a preferida (ou me conta que a gente pensa junto!).</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("Oficina","velaaromatica.jpg","Vela Aromática","Cada uma cria a sua vela perfumada — escolhendo aroma, cor e rótulo. Delicada, relaxante e super sensorial, do jeitinho que a Michele amou.","Vela aromática artesanal criada numa oficina","center 45%")}
      {exp("Oficina","ceramicamodelagem.jpg","Cerâmica","Cada uma modela (ou pinta) a sua peça de cerâmica à mão — sensorial e cheia de significado. Cada uma leva a sua criação pra casa.","Mãos modelando uma peça de cerâmica","center 50%")}
    </div>
    <div class="note" style="margin-top:16px">◆ Nas duas, a Elarah leva <b>todo o material, a condução e a estrutura</b> — vocês só chegam, criam e celebram. A oficina fica <b>100% privativa</b>, só pro grupo de vocês.</div>
    {foot("As oficinas")}
  </section>'''

espacos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Onde acontece</span></div>
    </div>
    <span class="eyebrow orange">◆ Dois jeitos de fazer</span>
    <h2>Escolham o <em>espaço</em></h2>
    <p class="lead">Como você prefere não se preocupar com o local, a nossa sugestão é o <strong>Studio</strong> — reservado e pronto pra receber. Mas dá também pra fazer numa cafeteria parceira.</p>
    <div class="rule"></div>
    <div class="venues">
      <div class="bfeat">
        <div class="bphoto vgal"><img src="assets/espaco1.jpg" alt="Lounge acolhedor do Studio" style="object-position:center 55%"><img src="assets/espa%C3%A7o2.jpg" alt="Cozinha equipada do Studio"></div>
        <div class="bbody">
          <span class="btag">★ A nossa sugestão · espaço exclusivo</span>
          <h3>No nosso Studio <span class="sub">só de vocês</span></h3>
          <p>Um <b>lounge acolhedor com cozinha equipada</b>, reservado e fechado só pro grupo. Tudo pronto pra criar, comer junto e brindar — é só chegar. Levem bolo, doces e espumante que a mesa fica linda. 🥂</p>
          <div class="vprice">a partir de R$ 269<small>por pessoa</small></div>
        </div>
      </div>
      <div class="bfeat plain">
        <div class="bphoto"><img src="assets/julescampobelo.jpg" alt="Cafeteria parceira Jules, ambiente charmoso" style="object-position:center 55%"></div>
        <div class="bbody">
          <span class="btag soft">Cafeteria parceira</span>
          <h3>Na cafeteria Jules <span class="sub">só a experiência</span></h3>
          <p>Um cantinho lindo e charmoso numa cafeteria parceira, no maior clima de despedida — vocês vivem a oficina num ambiente aconchegante.</p>
          <div class="vprice">a partir de R$ 199<small>por pessoa</small></div>
        </div>
      </div>
    </div>
    <div class="note" style="margin-top:15px">◆ E se um dia preferir, a gente também <b>leva a experiência até vocês</b> — em casa ou no salão do condomínio.</div>
    {foot("Onde acontece")}
  </section>'''

planos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham o nível</span>
    <h2>A partir de <em>R$ 199</em></h2>
    <p class="lead">O valor é o mesmo pra <strong>Vela ou Cerâmica</strong> — muda só o espaço e o nível que escolherem. Todos os valores são <strong>por pessoa</strong>, com material e condução inclusos.</p>
    <div class="rule"></div>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th>Só a experiência<span>material & condução</span></th>
        <th>Com registro<span>+ foto profissional + voucher R$ 50 na cafeteria</span></th>
        <th class="hl"><span class="pill">★ Mais completo</span><br>Com lembrança<span>+ lembrancinha personalizada</span></th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="rl"><b>No nosso Studio</b><span>Espaço exclusivo &amp; fechado só de vocês</span></td>
          <td class="val">R$ 269</td><td class="val">R$ 369</td><td class="val hl">R$ 469</td>
        </tr>
        <tr>
          <td class="rl"><b>Na cafeteria Jules</b><span>Só a experiência, num ambiente charmoso</span></td>
          <td class="val">R$ 199</td><td class="val">R$ 299</td><td class="val hl">R$ 399</td>
        </tr>
      </tbody>
    </table>
    <div class="note" style="margin-top:16px">◆ <b>Vela ou Cerâmica pelo mesmo valor</b> — é só escolher a preferida. Turma privada de 13, sábado 12/09 à tarde (2h30–3h).</div>
    <div class="note" style="margin-top:9px">◆ <b>Coffee break incluso</b> no nosso Studio (que tem cozinha equipada) — e podem levar bolo, doces e espumante. 🥂</div>
    <div class="note" style="margin-top:9px">◆ Na <b>cafeteria Jules</b>, o nível <i>Com registro</i> inclui <b>R$ 50 de voucher</b> pra gastar na cafeteria + o registro fotográfico.</div>
    {foot("Investimento")}
  </section>'''

personaliza = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Os mimos da despedida</span></div>
    </div>
    <span class="eyebrow orange">◆ Nos níveis Com registro & Completo</span>
    <h2>Pra levar de <em>lembrança</em></h2>
    <p class="lead">Além da peça que cada uma cria, dá pra somar dois mimos que deixam o dia inesquecível — a foto profissional e a lembrancinha personalizada.</p>
    <div class="rule"></div>
    <div class="plans">
      <div class="plan">
        <div class="plan-photo sq"><img src="assets/desp-hero3.jpg" alt="Grupo de amigas comemorando a despedida, registrado por um fotógrafo" style="object-position:center 25%"></div>
        <div class="plan-body">
          <span class="tag basic">Nível Com registro</span>
          <h3>Registro fotográfico profissional</h3>
          <ul class="feat">
            <li>Um fotógrafo cobre a despedida inteira</li>
            <li>Cada brinde e cada risada registrados</li>
            <li>Álbum digital lindo pra guardar (e postar)</li>
          </ul>
          <span class="allin">A memória do dia, pra sempre</span>
        </div>
      </div>
      <div class="plan featured">
        <span class="ribbon">★ Nível Completo</span>
        <div class="plan-photo sq"><img src="assets/personaliza%C3%A7aobrindeescovapiranha.jpg" alt="Lembrancinha personalizada: escova e piranha de cabelo" style="object-position:center"></div>
        <div class="plan-body">
          <span class="tag premium">Personalização</span>
          <h3>Lembrancinha personalizada</h3>
          <ul class="feat">
            <li>Kit com <b>escova &amp; piranha</b> pra cada convidada</li>
            <li>Personalizado com o nome de cada uma</li>
            <li>Um mimo pra elas levarem da despedida</li>
          </ul>
          <span class="allin">Cada uma leva o seu mimo</span>
        </div>
      </div>
    </div>
    {foot("Os mimos da despedida")}
  </section>'''

como = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Como funciona &amp; contato</span></div>
    </div>
    <span class="eyebrow orange">◆ Simples e sob medida</span>
    <h2>É só <em>reunir o grupo</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pra a despedida ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Escolhem a oficina</h3><p>Vela Aromática ou Cerâmica — pelo mesmo valor, a preferida do grupo.</p></div>
      <div class="step"><div class="num">2</div><h3>Escolhem o espaço</h3><p>O nosso Studio exclusivo ou a cafeteria Jules — ou, se preferir, levamos até vocês.</p></div>
      <div class="step"><div class="num">3</div><h3>É só criar e celebrar</h3><p>Material, condução e estrutura por nossa conta. Vocês só chegam e curtem.</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Levem o docinho 🍰</h4>
        <p>Bolo, doces e espumante são super bem-vindos pra deixar a mesa de vocês ainda mais linda — a gente ajuda a montar tudo com todo o carinho. 🥂</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora celebrar a <em>noiva?</em> ✦</h2>
      <p>Me conta qual oficina e qual espaço mais chamaram, que a gente já reserva o sábado 12/09 e fecha cada detalhe.</p>
      <div class="cta-actions">
        <a class="btn-wa" href="https://wa.me/5511914455930?text=Oi%2C%20Elarah!%20Vi%20a%20proposta%20da%20despedida%20de%20solteira%20e%20quero%20fechar%20os%20detalhes." target="_blank" rel="noopener">
          💬 Falar no WhatsApp
        </a>
        <div class="contact-links">
          <span>+55 (11) 91445-5930</span>
          <a href="https://instagram.com/elarah.oficial" target="_blank" rel="noopener">@elarah.oficial</a>
          <a href="https://elarah.com.br" target="_blank" rel="noopener">elarah.com.br</a>
        </div>
      </div>
    </div>
    <p class="fineprint">Proposta de experiência para despedida de solteira, turma privada de 13 mulheres, no sábado 12/09 à tarde (oficina de cerca de 2h30 a 3h). Oficina à escolha: Vela Aromática ou Cerâmica — pelo mesmo valor. Formatos: no nosso Studio (espaço exclusivo e fechado) a partir de R$ 269 por pessoa (níveis R$ 269 / 369 / 469) — ou na cafeteria parceira Jules (só a experiência) a partir de R$ 199 por pessoa (níveis R$ 199 / 299 / 399). Níveis: Só a experiência (material & condução inclusos) / Com registro (+ foto profissional) / Com lembrança (+ lembrancinha personalizada). No Studio, coffee break incluso; na cafeteria Jules, o nível Com registro inclui R$ 50 de voucher para consumo na cafeteria além do registro fotográfico. Valores por pessoa. Bolo, doces e espumante liberados. Também é possível levar a experiência até o local do grupo. Proposta válida mediante confirmação de data (12/09) e disponibilidade de agenda.</p>
    {foot("Experiência · Despedida de solteira · 2026")}
  </section>'''

deck = '<div class="deck">\n' + cover + buscamos + menu + espacos + planos + personaliza + como + '\n\n</div>\n\n'
# fix title/meta
head = head.replace("<title>Experiência Corporativa · Elarah × Compass</title>", "<title>Despedida de Solteira · Elarah</title>")
head = re.sub(r'<meta name="description"[^>]*>', '<meta name="description" content="Proposta de experiência da Elarah para despedida de solteira — oficina de Velas ou Cerâmica, turma privativa.">', head)
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-despedida-michele.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"), html.count("compass\">"))
