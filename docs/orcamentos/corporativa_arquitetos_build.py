# Despedida de solteira deck — wine/rose palette, 4-experience menu (com vinho incluso) + 3-tier plans.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

# ---- embed fonts: swap the 3 google-fonts <link> lines for the embedded <style> block ----
fonts = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/embedded_fonts_style.html", encoding="utf-8").read()
head = re.sub(r'<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>',
              fonts, head, count=1, flags=re.S)

# ---- recolor CSS to terracotta clay + deep forest green (jardim & arquitetura) ----
head = head.replace("--orange:#F27623;", "--orange:#BE6B43;")       # accent: warm terracotta clay
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#9A5330;")
head = head.replace("--navy:#16233C;", "--navy:#26382C;")           # deep forest green (headings/dark)
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#5E6E60;") # sage for lead
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#BE6B43;")
head = head.replace("#EDF1F7", "#EFF1EC").replace("#DCE5F1", "#DDE4D6")
head = head.replace("#FF9A4D", "#D89A6E")
head = head.replace("rgba(242,118,35,.22)", "rgba(190,107,67,.26)")
head = head.replace(".itable .hl{background:#F7EAEF}", ".itable .hl{background:#EBF0E5}")  # sage highlight

# extra CSS: experience menu grid (2x2) + investment table
extra = '''
  .menu{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:12px}
  .exp{position:relative;width:calc(33.333% - 11px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .exp .top{position:absolute;top:11px;left:11px;z-index:3;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 11px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(158,52,83,.55)}
  .exp-photo{aspect-ratio:5/4;overflow:hidden;background:#eee}
  .exp-photo img{width:100%;height:100%;object-fit:cover}
  .exp-body{padding:12px 15px 15px}
  .exp .n{display:inline-block;font-size:9px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:5px}
  .exp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--navy);line-height:1.05}
  .exp p{font-size:11px;color:var(--muted);margin-top:5px;line-height:1.38}
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
        <span class="kicker">Proposta de experiência corporativa</span>
        <span class="compass">Relacionamento <span>&amp; arquitetos</span><small>2ª quinzena de setembro</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência Corporativa · Relacionamento</span>
        <h1>Um encontro que <br><em>aproxima</em></h1>
        <p class="lead">Uma experiência <strong>criativa e sofisticada</strong> pra fortalecer o relacionamento com os <strong>arquitetos parceiros da marca</strong> — mão na massa, conversa que flui e uma lembrança feita à mão. Tudo <strong>no jardim de vocês</strong>. 🌿</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>15</b> convidados</span>
          <span class="chip"><b>2ª quinzena</b> de setembro</span>
          <span class="chip">No <b>jardim</b> de vocês</span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/eventocorporativo.jpg" alt="Convidados se conectando num encontro criativo da Elarah" style="object-position:center 40%">
      </div>
    </div>
    {foot("Experiência Corporativa · Relacionamento")}
  </section>'''

buscamos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Pensado pra marca</span></div>
    </div>
    <span class="eyebrow orange">◆ Por que uma experiência</span>
    <h2>Relacionamento que <em>fica</em></h2>
    <p class="lead">Muito além de um evento: uma experiência <strong>mão na massa</strong> aproxima a marca dos seus arquitetos parceiros de um jeito genuíno. Enquanto criam, conversam, relaxam e levam pra casa uma lembrança — e a marca junto.</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#BE6B43" stroke-width="1.6" stroke-linejoin="round"><circle cx="10.5" cy="14" r="6"/><circle cx="17.5" cy="14" r="6"/></svg></div><h3>Conexão de verdade</h3><p>Criar junto solta a conversa — o relacionamento com os parceiros fica mais próximo e humano.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#BE6B43" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3.5 L16 12 L24.5 14 L16 16 L14 24.5 L12 16 L3.5 14 L12 12 Z"/></svg></div><h3>Criativo & sofisticado</h3><p>Experiências autorais e sensoriais — a cara de um público que respira design.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#BE6B43" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 25c6-4 9-8 9-12a5 5 0 0 0-9-3 5 5 0 0 0-9 3c0 4 3 8 9 12z"/><path d="M14 10v9M10.5 13.5 14 10l3.5 3.5"/></svg></div><h3>A marca no centro</h3><p>Cada convidado leva um kit com a identidade da marca — a lembrança que mantém o relacionamento vivo.</p></div>
    </div>
    <div class="quote">
      <i>"Os melhores relacionamentos se constroem fora da mesa de reunião."</i><br>
      — Um encontro que os parceiros vão <strong>lembrar (e comentar)</strong> muito depois do dia. 🌿
    </div>
    {foot("Pensado pra marca")}
  </section>'''

menu = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">As experiências</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham a experiência</span>
    <h2>Cinco opções <em>criativas</em></h2>
    <p class="lead">Cinco experiências que combinam com um público que respira design — <strong>sensoriais, autorais e cheias de estilo</strong>. Escolham a preferida (ou combinem uma estação de cada!).</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","velaaromatica.jpg","Vela Aromática","Criam a própria vela perfumada, do aroma ao rótulo — objeto de decoração pra levar pra casa.","Vela aromática artesanal num vidro elegante","center 50%")}
      {exp("02","bolsasmacrame.jpg","Bolsa em Macramê","Aprendem os nós do macramê e criam a própria bolsinha autoral — artesanal e cheia de charme.","Bolsas de macramê feitas à mão","center 50%")}
      {exp("03","perfumariadecor.jpg","Home Spray","Criam o próprio aromatizador de casa — um home spray autoral pra perfumar os ambientes.","Frascos de aromatizador de ambiente numa estação elegante","center 45%")}
      {exp("04","perfumariaharbolita.jpg","Perfumaria Botânica","Cada um cria a própria fragrância, numa imersão sensorial guiada. Casa lindo com o jardim.","Essências e frascos de uma imersão de perfumaria botânica","center 45%")}
      {exp("05","portaguardanapo.jpg","Porta Guardanapo","Um kit com 6 porta-guardanapos de macramê — peça de mesa delicada, pra levar o jardim pra casa.","Porta-guardanapos de macramê em formato de folha","center 40%")}
    </div>
    <div class="note" style="margin-top:16px">◆ Em todas, a Elarah leva <b>material, condução e estrutura</b> — e cada convidado leva a própria criação pra casa. 🌿</div>
    {foot("As experiências")}
  </section>'''

espacos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Onde acontece</span></div>
    </div>
    <span class="eyebrow orange">◆ Onde acontece</span>
    <h2>No <em>jardim</em> de vocês</h2>
    <p class="lead">A gente leva a experiência inteira até aí — e monta uma estação linda no seu jardim, do material à ambientação. Vocês só recebem os parceiros e aproveitam o encontro.</p>
    <div class="rule"></div>
    <div class="venues">
      <div class="bfeat">
        <div class="bphoto vgal"><img src="assets/ojardim1.jpg" alt="Jardim com estação montada para o encontro" style="object-position:center 50%"><img src="assets/ojardim4.jpg" alt="Mesa posta ao ar livre num jardim" style="object-position:center 55%"></div>
        <div class="bbody">
          <span class="btag">★ A gente leva tudo até você</span>
          <h3>A experiência vai <span class="sub">até o seu jardim</span></h3>
          <p>Levamos <b>material, condução, estrutura e a montagem</b> — uma estação criativa e acolhedora ao ar livre, com a cara da marca. O cenário perfeito pra criar, conversar e se conectar em meio ao verde. 🌿</p>
          <div class="vprice">Turma de 15<small>no jardim de vocês</small></div>
        </div>
      </div>
    </div>
    <div class="note" style="margin-top:15px">◆ Duração de cerca de <b>2h30 a 3h</b>, com um momento pra fala da marca e agradecimento aos parceiros no meio do encontro — sem custo adicional.</div>
    {foot("Onde acontece · no jardim")}
  </section>'''

planos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham o nível</span>
    <h2>Valores por <em>convidado</em></h2>
    <p class="lead">Cada experiência tem o seu valor por pessoa, com material, condução e estrutura inclusos — a gente leva tudo até o jardim. É só escolher a experiência e o nível.</p>
    <div class="rule"></div>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th>Só a experiência<span>material & condução</span></th>
        <th>Com coffee & foto<span>+ coffee break & foto profissional</span></th>
        <th class="hl"><span class="pill">★ Mais completo</span><br>Completo<span>+ personalização da marca</span></th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="rl"><b>Vela · Bolsa Macramê · Home Spray</b><span>As três pelo mesmo valor — cada um leva a sua peça</span></td>
          <td class="val">R$ 199</td><td class="val">R$ 299</td><td class="val hl">R$ 399</td>
        </tr>
        <tr>
          <td class="rl"><b>Perfumaria Botânica</b><span>Imersão sensorial — casa com o jardim</span></td>
          <td class="val">R$ 239</td><td class="val">R$ 339</td><td class="val hl">R$ 439</td>
        </tr>
        <tr>
          <td class="rl"><b>Porta Guardanapo</b><span>Kit com 6 peças de macramê</span></td>
          <td class="val">R$ 259</td><td class="val">R$ 359</td><td class="val hl">R$ 459</td>
        </tr>
      </tbody>
    </table>
    <div class="note" style="margin-top:15px">◆ <b>Níveis:</b> Só a experiência → <b>+ coffee break & foto profissional</b> (+R$ 100) → <b>+ personalização da marca</b> (+R$ 100). Valores por pessoa, turma de 15, no jardim de vocês. Oficina de <b>cerca de 1h30 a 2h</b>.</div>
    {foot("Investimento")}
  </section>'''

personaliza = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Os extras da marca</span></div>
    </div>
    <span class="eyebrow orange">◆ O que soma nos níveis</span>
    <h2>O toque da <em>marca</em></h2>
    <p class="lead">Dois extras que transformam o encontro em relacionamento de verdade — o registro profissional e o kit personalizado que cada arquiteto leva pra casa.</p>
    <div class="rule"></div>
    <div class="plans">
      <div class="plan">
        <div class="plan-photo sq"><img src="assets/rockworld1.jpg" alt="Convidados se conectando num encontro registrado por um fotógrafo" style="object-position:center 30%"></div>
        <div class="plan-body">
          <span class="tag basic">Nível 2</span>
          <h3>Coffee break &amp; foto profissional</h3>
          <ul class="feat">
            <li>Coffee break lindo montado no jardim</li>
            <li>Um fotógrafo cobre o encontro inteiro</li>
            <li>Álbum digital pra marca postar e enviar aos parceiros</li>
          </ul>
          <span class="allin">Conteúdo (e relacionamento) pra marca</span>
        </div>
      </div>
      <div class="plan featured">
        <span class="ribbon">★ Nível Completo</span>
        <div class="plan-photo sq"><img src="assets/personaliza%C3%A7aobrindeescovapiranha.jpg" alt="Kit de lembrancinha personalizada com escova e piranha" style="object-position:center"></div>
        <div class="plan-body">
          <span class="tag premium">Personalização</span>
          <h3>Kit personalizado da marca</h3>
          <ul class="feat">
            <li>Kit com <b>escova &amp; piranha</b> pra cada convidado</li>
            <li>Personalizado com o nome e a identidade da marca</li>
            <li>Um mimo pra cada um levar do encontro pra casa</li>
          </ul>
          <span class="allin">A lembrança que mantém o vínculo</span>
        </div>
      </div>
    </div>
    {foot("Os extras da marca")}
  </section>'''

como = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Como funciona &amp; contato</span></div>
    </div>
    <span class="eyebrow orange">◆ Simples e sob medida</span>
    <h2>É só <em>reunir os parceiros</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pra o encontro ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Escolhem a experiência</h3><p>Vela, Bolsa em Macramê, Home Spray, Perfumaria ou Porta Guardanapo — no nível que preferirem.</p></div>
      <div class="step"><div class="num">2</div><h3>A gente leva até o jardim</h3><p>Material, condução, estrutura e montagem por nossa conta. Vocês só recebem.</p></div>
      <div class="step"><div class="num">3</div><h3>Os parceiros vivem &amp; conectam</h3><p>Todo mundo cria, conversa e leva a própria peça (e a marca) pra casa.</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Momento da marca</h4>
        <p>Reservem um espacinho no encontro pra uma <b>fala e agradecimento aos parceiros</b> — a gente encaixa naturalmente, sem custo adicional. 🌿</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora aproximar a <em>marca dos parceiros?</em> ✦</h2>
      <p>Me conta qual experiência e nível mais chamaram, que a gente fecha a data da 2ª quinzena de setembro e cada detalhe do encontro.</p>
      <div class="cta-actions">
        <a class="btn-wa" href="https://wa.me/5511914455930?text=Oi%2C%20Elarah!%20Vi%20a%20proposta%20de%20experi%C3%AAncia%20corporativa%20e%20quero%20fechar%20os%20detalhes." target="_blank" rel="noopener">
          💬 Falar no WhatsApp
        </a>
        <div class="contact-links">
          <span>+55 (11) 91445-5930</span>
          <a href="https://instagram.com/elarah.oficial" target="_blank" rel="noopener">@elarah.oficial</a>
          <a href="https://elarah.com.br" target="_blank" rel="noopener">elarah.com.br</a>
        </div>
      </div>
    </div>
    <p class="fineprint">Proposta de experiência corporativa da Elarah para relacionamento com arquitetos parceiros da marca, turma de cerca de 15 convidados, na 2ª quinzena de setembro, no jardim da empresa (oficina de cerca de 1h30 a 2h). Experiência à escolha: Vela Aromática, Bolsa em Macramê ou Home Spray (a partir de R$ 199 · níveis R$ 199 / 299 / 399), Perfumaria Botânica (a partir de R$ 239 · níveis R$ 239 / 339 / 439) ou Porta Guardanapo — kit com 6 peças de macramê (a partir de R$ 259 · níveis R$ 259 / 359 / 459). Níveis: Só a experiência (material & condução inclusos) / + coffee break & foto profissional (+R$ 100) / + personalização da marca (+R$ 100). Valores por pessoa. A Elarah leva material, condução, estrutura e montagem até o local. Inclui um momento para fala da marca, sem custo adicional. Proposta válida mediante confirmação de data (2ª quinzena de setembro) e disponibilidade de agenda.</p>
    {foot("Experiência Corporativa · Relacionamento · 2026")}
  </section>'''

deck = '<div class="deck">\n' + cover + buscamos + menu + planos + personaliza + como + '\n\n</div>\n\n'
# fix title/meta
head = head.replace("<title>Experiência Corporativa · Elarah × Compass</title>", "<title>Experiência Corporativa · Relacionamento · Elarah</title>")
head = re.sub(r'<meta name="description"[^>]*>', '<meta name="description" content="Proposta de experiência corporativa da Elarah — relacionamento com arquitetos parceiros, experiências criativas no jardim.">', head)
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-corporativa-arquitetos.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"), html.count("compass\">"))
