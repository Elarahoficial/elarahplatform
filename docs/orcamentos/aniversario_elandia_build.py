# Despedida de solteira deck — wine/rose palette, 4-experience menu (com vinho incluso) + 3-tier plans.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

# ---- embed fonts: swap the 3 google-fonts <link> lines for the embedded <style> block ----
fonts = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/embedded_fonts_style.html", encoding="utf-8").read()
head = re.sub(r'<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>',
              fonts, head, count=1, flags=re.S)

# ---- recolor CSS to warm clay + cozy brown (aniversário criativo · crochê & botânico) ----
head = head.replace("--orange:#F27623;", "--orange:#CE7B5C;")       # accent: warm clay/coral
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#A85835;")
head = head.replace("--navy:#16233C;", "--navy:#3E2C26;")           # deep cozy brown (headings/dark)
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#6B564C;") # warm taupe for lead
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#CE7B5C;")
head = head.replace("#EDF1F7", "#FBEEE7").replace("#DCE5F1", "#F3DDCF")
head = head.replace("#FF9A4D", "#E3A98A")
head = head.replace("rgba(242,118,35,.22)", "rgba(206,123,92,.28)")
head = head.replace(".itable .hl{background:#F7EAEF}", ".itable .hl{background:#FBEBDF}")  # warm cream highlight

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
        <span class="compass">Aniversário da <span>Elandia</span><small>03 ou 04 de outubro</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência · Aniversário</span>
        <h1>Comemore com as <br><em>mãos na massa</em></h1>
        <p class="lead">Um aniversário <strong>criativo e cheio de charme</strong> pra celebrar com quem você ama — uma imersão de <strong>Perfumaria</strong> ou uma oficina de <strong>Crochê</strong>, em que cada uma cria a sua peça e leva pra casa de recordação. 🧶</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>10</b> convidadas</span>
          <span class="chip"><b>03 ou 04</b> de outubro</span>
          <span class="chip">A partir de <b>R$ 219</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/ceramica.jpg" alt="Amigas sorrindo juntas com as peças que criaram numa experiência Elarah" style="object-position:center 30%">
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
    <p class="lead">Uma tarde de <strong>mão na massa</strong>, delicada e cheia de risada, em que o que importa é criar junto. Uma experiência pensada pra soltar o grupo, curtir o momento e render fotos lindas — pra qualquer uma, sem talento nenhum.</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#CE7B5C" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3.5 L16 12 L24.5 14 L16 16 L14 24.5 L12 16 L3.5 14 L12 12 Z"/></svg></div><h3>Criativo & sensorial</h3><p>Perfumaria ou crochê — cada uma cria a sua peça à mão e leva a criação pra casa.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#CE7B5C" stroke-width="1.6" stroke-linejoin="round"><path d="M14 24s-8.5-5-8.5-11a4.8 4.8 0 0 1 8.5-3 4.8 4.8 0 0 1 8.5 3c0 6-8.5 11-8.5 11z"/></svg></div><h3>Só de vocês</h3><p>Turma 100% privativa, a aniversariante no centro — todo mundo criando e comemorando junto.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#CE7B5C" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 21V11l10.5-7 10.5 7v10M10 21v-6h8v6"/></svg></div><h3>Onde você quiser</h3><p>Num espaço parceiro ou a gente leva até você — material, condução e estrutura por nossa conta.</p></div>
    </div>
    <div class="quote">
      <i>"As melhores memórias a gente cria com as mãos."</i><br>
      — E aniversário é o dia perfeito pra <strong>criar junto e guardar de recordação</strong>. 🧡
    </div>
    {foot("Pensado pra você")}
  </section>'''

menu = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">As experiências</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolha a experiência</span>
    <h2>Perfumaria <em>ou</em> Crochê</h2>
    <p class="lead">Duas experiências sensoriais e cheias de charme pra escolher a que mais tem a sua cara — em ambas, cada uma cria a sua peça e leva pra casa de recordação.</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("Experiência","perfumariaharbolita.jpg","Perfumaria Botânica","Uma imersão sensorial guiada por perfumista — cada uma monta a própria fragrância, do menu de essências ao frasco. Cada uma leva o seu perfume.","Essências e frascos de uma imersão de perfumaria","center 45%")}
      {exp("Experiência","croche.jpg","Crochê","Aprendam a crochetar do zero e criem a própria peça — bolsinha, hang plant, colar ou porta-guardanapo. Relaxante, charmoso e cheio de estilo.","Bolsinhas de crochê coloridas feitas à mão","center 50%")}
    </div>
    <div class="note" style="margin-top:16px">◆ Nas duas, a Elarah leva <b>todo o material, a condução e a estrutura</b> — vocês só chegam e criam. A turma fica <b>100% privativa</b>, só de vocês.</div>
    {foot("As experiências")}
  </section>'''

espacos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">As peças de crochê</span></div>
    </div>
    <span class="eyebrow orange">◆ No crochê, você escolhe</span>
    <h2>Qual peça vão <em>criar?</em></h2>
    <p class="lead">Na oficina de crochê, cada uma escolhe a peça que quer fazer — <strong>todas pelo mesmo valor</strong>. É só decidir a preferida! 🧶</p>
    <div class="rule"></div>
    <div class="pgrid">
      <div class="pcard"><div class="sq"><img src="assets/bolsasmacrame.jpg" alt="Bolsinhas de macramê feitas à mão" style="object-position:center 50%"></div><div class="pb"><span class="n">Opção</span><h3>Bolsinha</h3><p>Autoral e cheia de charme, pra sair usando na mesma hora.</p></div></div>
      <div class="pcard"><div class="sq"><img src="assets/hangplantmacrame.jpg" alt="Suportes de planta em macramê pendurados" style="object-position:center 30%"></div><div class="pb"><span class="n">Opção</span><h3>Hang plant</h3><p>Um suporte de plantinha pra deixar a casa mais verde.</p></div></div>
      <div class="pcard"><div class="sq"><img src="assets/colarmacrame.jpg" alt="Colar de macramê artesanal" style="object-position:center 58%"></div><div class="pb"><span class="n">Opção</span><h3>Colar</h3><p>Delicado e autoral, pra levar (e usar) de recordação.</p></div></div>
      <div class="pcard"><div class="sq"><img src="assets/portaguardanapo.jpg" alt="Porta-guardanapos de macramê em formato de folha" style="object-position:center 45%"></div><div class="pb"><span class="n">Opção</span><h3>Porta-guardanapo</h3><p>Charmoso, pra deixar a mesa de casa com a sua cara.</p></div></div>
    </div>
    <div class="note" style="margin-top:16px">◆ Todas as peças pelo <b>mesmo valor</b> — é só escolher a preferida que a gente prepara tudo com carinho! 💛</div>
    {foot("As peças de crochê")}
  </section>'''

planos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolha o nível</span>
    <h2>A partir de <em>R$ 219</em></h2>
    <p class="lead">O valor é o mesmo pra <strong>Crochê ou Perfumaria</strong> — é só escolher a experiência e o nível. Todos os valores são <strong>por pessoa</strong>, com material e condução inclusos. 🧶</p>
    <div class="rule"></div>
    <div class="tiers">
      <div class="tier">
        <span class="tn">Só a experiência</span>
        <span class="tv">R$ 219</span>
        <span class="td">Material &amp; condução inclusos — cada uma leva a sua peça</span>
      </div>
      <div class="tier">
        <span class="tn">Com registro</span>
        <span class="tv">R$ 319</span>
        <span class="td">Tudo da experiência<br>+ <b>foto profissional</b> do dia</span>
      </div>
      <div class="tier hl">
        <span class="pill">★ Mais completo</span>
        <span class="tn">Completo</span>
        <span class="tv">R$ 419</span>
        <span class="td">Experiência + foto<br>+ <b>personalização &amp; lembrancinha</b></span>
      </div>
    </div>
    <div class="note" style="margin-top:18px">◆ Vale pra <b>Crochê</b> (bolsinha, hang plant, colar ou porta-guardanapo) ou <b>Perfumaria Botânica</b> — as duas pelo mesmo valor. Por pessoa, turma de 10, na data de 03 ou 04 de outubro.</div>
    <div class="note" style="margin-top:9px">◆ <b>Níveis:</b> Só a experiência → <b>+ foto profissional</b> (+R$ 100) → <b>+ personalização & lembrancinha</b> (+R$ 100).</div>
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
    <p class="lead">A Elarah cuida de toda a produção pra a comemoração ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Escolhe a experiência</h3><p>Perfumaria ou crochê — e, no crochê, a peça que mais te encanta.</p></div>
      <div class="step"><div class="num">2</div><h3>Onde você quiser</h3><p>Num espaço parceiro ou a gente leva até você — material e condução por nossa conta.</p></div>
      <div class="step"><div class="num">3</div><h3>É só criar e comemorar</h3><p>Vocês só chegam, criam junto e cada uma leva a própria peça pra casa.</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Do seu jeitinho 🧡</h4>
        <p>A gente personaliza a experiência com a cara da comemoração — e ajuda a montar tudo com todo o carinho pra o dia ficar inesquecível.</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora comemorar o <em>seu dia?</em> ✦</h2>
      <p>Me conta qual experiência mais chamou e a data (03 ou 04/10), que a gente fecha cada detalhe da comemoração.</p>
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
    <p class="fineprint">Proposta de experiência de aniversário da Elarah, turma privada de cerca de 10 pessoas, na data de 03 ou 04 de outubro. Experiência à escolha: Crochê — com escolha da peça (bolsinha, hang plant, colar ou porta-guardanapo), todas pelo mesmo valor — ou Perfumaria Botânica, ambas a partir de R$ 219 por pessoa (níveis R$ 219 / 319 / 419). Níveis: Só a experiência (material & condução inclusos) / Com registro (+ foto profissional) / Completo (+ personalização & lembrancinha). Valores por pessoa. Realizada em espaço parceiro ou no local do grupo. Proposta válida mediante confirmação de data e disponibilidade de agenda.</p>
    {foot("Experiência · Aniversário · 2026")}
  </section>'''

deck = '<div class="deck">\n' + cover + buscamos + menu + espacos + planos + como + '\n\n</div>\n\n'
# fix title/meta
head = head.replace("<title>Experiência Corporativa · Elarah × Compass</title>", "<title>Aniversário · Elarah</title>")
head = re.sub(r'<meta name="description"[^>]*>', '<meta name="description" content="Proposta de experiência de aniversário da Elarah — imersão de Perfumaria ou oficina de Crochê, turma privativa.">', head)
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-aniversario-elandia.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"), html.count("compass\">"))
