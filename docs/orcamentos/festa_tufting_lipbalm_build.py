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
head = head.replace("--orange:#F27623;", "--orange:#D96A8E;")       # accent: warm copper
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#B24C6E;")
head = head.replace("--navy:#16233C;", "--navy:#4A2334;")           # deep espresso (headings/dark)
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#7A5866;") # warm taupe for lead
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#D96A8E;")
head = head.replace("#EDF1F7", "#FCEDF2").replace("#DCE5F1", "#F6DBE5")
head = head.replace("#FF9A4D", "#EBA6BE")
head = head.replace("rgba(242,118,35,.22)", "rgba(217,106,142,.28)")

# extra CSS: experience menu grid (2x2) + investment table
extra = '''
  .menu{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:12px}
  .exp{position:relative;width:calc(50% - 9px);background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .exp .top{position:absolute;top:12px;left:12px;z-index:3;background:var(--orange);color:#fff;font-size:9.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:5px 12px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(178,76,110,.5)}
  .exp-photo{aspect-ratio:4/3;overflow:hidden;background:#eee}
  .exp-photo img{width:100%;height:100%;object-fit:cover}
  .exp-body{padding:16px 20px 20px}
  .exp .n{display:inline-block;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:6px}
  .exp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:22px;color:var(--navy);line-height:1.05}
  .exp p{font-size:12.5px;color:var(--muted);margin-top:7px;line-height:1.45}
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
  .itable .val{font-family:'DM Serif Display',serif;font-size:26px;color:var(--navy);line-height:1;white-space:nowrap}
  .itable th,.itable td{padding-left:8px;padding-right:8px}
  .itable .val small{display:block;font-family:'DM Sans';font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-top:4px}
  .itable .hl{background:#FBE7EE}
  .itable thead th.hl{color:var(--orange-dark)}
  .itable tbody tr:last-child td{border-bottom:none}
  .itable thead th.hl{position:relative}
  .itable .pill{display:inline-block;background:var(--navy);color:#fff;font-size:8px;letter-spacing:.08em;padding:3px 9px;border-radius:999px;margin-bottom:7px;font-weight:700;text-transform:uppercase}
  /* wtrio de experiências com vinho (3 quadrados na mesma linha) */
  .wtrio{display:flex;gap:16px;justify-content:center;margin-top:12px}
  .wcard{position:relative;flex:1;max-width:calc(33.333% - 11px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .wcard .top{position:absolute;top:11px;left:11px;z-index:3;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 11px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(178,76,110,.5)}
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
  .dchips span{background:#FBE7EE;border:1px solid var(--line);border-radius:999px;padding:6px 13px;font-size:11.5px;color:var(--navy);font-weight:500}
</style>'''
head = head.replace("</style>", extra, 1)
# print overrides for the wtrio + bartenderia layout
head = head.replace(".menu-cols{grid-template-columns:1fr 1fr}",
                    ".menu-cols{grid-template-columns:1fr 1fr}\n    .wtrio{flex-direction:row;gap:14px}\n    .wcard{max-width:calc(33.333% - 10px)}\n    .bfeat{flex-direction:row}\n    .bfeat .bphoto{width:38%;height:auto}\n    .wcard-body{padding:10px 13px 12px}\n    .wcard h3{font-size:16px}\n    .wcard p{font-size:10.5px;margin-top:4px;line-height:1.34}\n    .bfeat{margin-top:15px}\n    .bfeat .bbody{padding:16px 22px 17px}\n    .bfeat h3{font-size:21px}\n    .bfeat p{font-size:11.5px;margin-top:7px}\n    .dchips{margin-top:10px;gap:7px}\n    .dchips span{font-size:11px;padding:5px 11px}")
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
        <span class="kicker">Proposta de experiência · festa</span>
        <span class="compass">Festa das <span>meninas</span><small>São Paulo · em casa</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência · Festa Infantil</span>
        <h1>Uma festa de<br><em>mão na massa</em></h1>
        <p class="lead">Uma tarde criativa e divertida pra a turminha — <strong>fazer Tufting e Lip Balm</strong>, rir muito e levar a própria criação pra casa. Encantadora, sensorial e cheia de mimo, <strong>no conforto da sua casa</strong>. 🎀</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>8</b> meninas · 10 anos</span>
          <span class="chip">Data <b>a definir</b></span>
          <span class="chip">Na <b>sua casa</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/aniv-infantil.jpg" alt="Crianças numa oficina criativa e divertida da Elarah" style="object-position:center 40%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Já realizado para marcas como <b>Compass</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)</div>
    {foot("Experiência · Festa Infantil")}
  </section>'''

buscamos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Pensado pra festa das meninas</span></div>
    </div>
    <span class="eyebrow orange">◆ Por que uma experiência</span>
    <h2>Uma festa <em>diferente</em></h2>
    <p class="lead">Muito mais que uma festinha: uma experiência <strong>mão na massa</strong> em que cada convidada faz o próprio tapetinho de tufting (ou lip balm), se diverte e leva a criação pra casa. Encantador, criativo e cheio de charme — perfeito pra 10 aninhos. 🎀</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#D96A8E" stroke-width="1.6"><circle cx="10.5" cy="14" r="6"/><circle cx="17.5" cy="14" r="6"/></svg></div><h3>Diversão de verdade</h3><p>Todas criando junto — uma atividade encantadora que vira a estrela da festa.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#D96A8E" stroke-width="1.6" stroke-linejoin="round"><path d="M14 3.5 L16 12 L24.5 14 L16 16 L14 24.5 L12 16 L3.5 14 L12 12 Z"/></svg></div><h3>Criativo & colorido</h3><p>Cores, texturas e muito autoral — cada uma cria a própria peça pra chamar de sua.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#D96A8E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 21V11l10.5-7 10.5 7v10"/><path d="M10 21v-6h8v6"/></svg></div><h3>Na sua casa</h3><p>A gente leva a oficina inteira até você — material, condução e estrutura por nossa conta.</p></div>
    </div>
    <div class="quote">
      <i>"As melhores festas são as que a gente cria com as próprias mãos."</i><br>
      — É isso que a Elarah leva: uma tarde que vira <strong>memória (e uma peça linda) pra sempre</strong>. 🎀
    </div>
    {foot("Pensado pra festa das meninas")}
  </section>'''

menu = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O menu</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham a experiência</span>
    <h2>Duas opções <em>encantadoras</em></h2>
    <p class="lead">Duas oficinas divertidas pra a turminha — é só escolher a favorita. Em ambas, cada convidada cria a sua peça e leva pra casa como lembrancinha. 🎀</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","tufting12.jpg","Oficina de Tufting","Com a pistolinha de tufting, cada uma cria o próprio tapetinho colorido — divertido, colorido e cheio de personalidade.","Peça de tufting colorida sendo criada","center 45%")}
      {exp("02","lipbalm1.jpg","Oficina de Lip Balm","Cada uma prepara o próprio lip balm com aromas e cores — divertido, cheiroso e pra usar (e mostrar) depois.","Lip balms coloridos criados numa oficina","center 50%")}
    </div>
    {foot("As experiências")}
  </section>'''

espacos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Onde acontece</span></div>
    </div>
    <span class="eyebrow orange">◆ Você escolhe</span>
    <h2>Onde a festa <em>acontece</em></h2>
    <p class="lead">Duas opções: a gente <strong>leva a experiência até o seu salão de festas</strong>, ou você reserva o nosso <strong>Bake Studio</strong> (Bela Vista) só pra vocês. O valor muda conforme a escolha — os dois lindos! 🎀</p>
    <div class="rule"></div>
    <div class="bfeat" style="height:230px">
      <div class="bphoto"><img src="assets/espaco1.jpg" alt="Lounge acolhedor do Bake Studio" style="object-position:center 55%"></div>
      <div class="bbody">
        <span class="btag">Opção 2 · espaço exclusivo</span>
        <h3>Bake Studio <span class="sub">Bela Vista</span></h3>
        <p>Um estúdio charmoso e reservado, só pra festa da Gabi. A gente cuida de tudo — as meninas só chegam e criam. 🌿</p>
      </div>
    </div>
    <div class="bfeat plain" style="margin-top:16px;height:190px">
      <div class="bphoto"><img src="assets/espa%C3%A7o2.jpg" alt="Cantinho aconchegante e equipado do Bake Studio" style="object-position:center 50%"></div>
      <div class="bbody">
        <span class="btag soft">Opção 1 · no seu salão</span>
        <h3>No seu <span class="sub">salão de festas</span></h3>
        <p>Prefere em casa? A gente leva a oficina inteira — material, condução e estrutura — até o seu salão de festas. Praticidade total.</p>
      </div>
    </div>
    {foot("Onde acontece")}
  </section>'''

planos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham a oficina</span>
    <h2>A partir de <em>R$ 199</em></h2>
    <p class="lead">Cada oficina tem o seu valor — é só escolher a favorita e o nível. Todos <strong>por pessoa</strong>, com a gente levando tudo <strong>até a sua casa</strong> (material e condução inclusos). 🎀</p>
    <div class="rule"></div>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th>A experiência<span>material & condução</span></th>
        <th>Com foto<span>+ foto profissional</span></th>
        <th class="hl"><span class="pill">★ Mais completo</span><br>Completo<span>+ lembrancinha escova &amp; piranha</span></th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="rl"><b>Oficina de Lip Balm</b><span>Cada uma leva o próprio lip balm</span></td>
          <td class="val">R$ 199</td><td class="val">R$ 299</td><td class="val hl">R$ 399</td>
        </tr>
        <tr>
          <td class="rl"><b>Oficina de Tufting</b><span>Cada uma leva o próprio tapetinho</span></td>
          <td class="val">R$ 579</td><td class="val">R$ 679</td><td class="val hl">R$ 779</td>
        </tr>
      </tbody>
    </table>
    <div class="note" style="margin-top:18px">◆ Valores <b>por pessoa</b>, com a Elarah levando tudo <b>até a sua casa</b> — material e condução inclusos, e a criação (tapetinho ou lip balm) de <b>lembrancinha</b> de cada uma. Cada nível soma <b>+R$ 100</b>: foto profissional e, no Completo, o kit de escova &amp; piranha personalizado. Turma de 8 meninas.</div>
    {foot("Investimento")}
  </section>'''

personaliza = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Extras opcionais</span></div>
    </div>
    <span class="eyebrow orange">◆ Pra deixar a festa ainda mais completa</span>
    <h2>Os mimos da <em>festa</em></h2>
    <p class="lead">Além do perfuminho (ou lip balm) que cada uma leva, dá pra somar dois mimos que deixam o dia inesquecível — o registro profissional e a lembrancinha personalizada.</p>
    <div class="rule"></div>
    <div class="plans">
      <div class="plan">
        <div class="plan-photo sq"><img src="assets/registrogabi.jpg" alt="Criança pintando, momento da festa registrado por um fotógrafo" style="object-position:center 45%"></div>
        <div class="plan-body">
          <span class="tag basic">Nível Com foto</span>
          <h3>Registro fotográfico profissional</h3>
          <ul class="feat">
            <li>Um fotógrafo cobre a festa inteira</li>
            <li>Cada risada e cada criação registradas</li>
            <li>Álbum digital lindo pra guardar (e postar)</li>
          </ul>
          <span class="allin">A memória do dia, pra sempre</span>
        </div>
      </div>
      <div class="plan featured">
        <span class="ribbon">★ Nível Completo</span>
        <div class="plan-photo sq"><img src="assets/personaliza%C3%A7aobrindeescovapiranha.jpg" alt="Kit de lembrancinha personalizada com escova e piranha" style="object-position:center"></div>
        <div class="plan-body">
          <span class="tag premium">Lembrancinha</span>
          <h3>Kit escova &amp; piranha</h3>
          <ul class="feat">
            <li>Kit com <b>escova &amp; piranha</b> pra cada convidada</li>
            <li>Personalizado com o nome de cada uma</li>
            <li>Um mimo a mais pra levarem da festa pra casa</li>
          </ul>
          <span class="allin">Cada uma leva o seu mimo</span>
        </div>
      </div>
    </div>
    {foot("Os mimos da festa")}
  </section>'''

como = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Como funciona &amp; contato</span></div>
    </div>
    <span class="eyebrow orange">◆ Simples e sob medida</span>
    <h2>É só <em>reunir as meninas</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pra a festa ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Escolhem a oficina</h3><p>Tufting ou Lip Balm — é só escolher a favorita da turminha.</p></div>
      <div class="step"><div class="num">2</div><h3>A gente vai até você</h3><p>Levamos a oficina inteira até a sua casa — material, condução e estrutura inclusos. É só receber.</p></div>
      <div class="step"><div class="num">3</div><h3>As meninas criam &amp; levam</h3><p>Cada uma põe a mão na massa e leva a própria criação pra casa de lembrancinha. 🎀</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>A criação já é a lembrancinha</h4>
        <p>O tapetinho (ou lip balm) que cada convidada faz já vai pra casa como <b>lembrancinha</b> — e dá pra somar o kit de escova &amp; piranha personalizado. 💛</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora fazer essa <em>festa?</em> ✦</h2>
      <p>Me conta qual oficina mais chamou e a data, que a gente fecha cada detalhe da festa das meninas.</p>
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
    <p class="fineprint">Proposta de experiência de festa infantil da Elarah para cerca de 8 meninas (10 anos), na casa da cliente, em São Paulo (data a definir). Oficina à escolha: Lip Balm a partir de R$ 199 por pessoa (níveis R$ 199 / 299 / 399) ou Tufting a partir de R$ 579 por pessoa (níveis R$ 579 / 679 / 779) — cada convidada cria e leva a própria criação como lembrancinha. Níveis: A experiência (material e condução) / + foto profissional (+R$ 100) / Completo com lembrancinha personalizada de escova & piranha (+R$ 100). Valores por pessoa, com a Elarah levando tudo até o local. Proposta válida mediante confirmação de data e disponibilidade de agenda.</p>
    {foot("Experiência · Festa Infantil · 2026")}
  </section>'''

cardapio = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O cardápio</span></div>
    </div>
    <span class="eyebrow orange">◆ Na Aula Gastronômica</span>
    <h2>Um menu de <em>três tempos</em></h2>
    <p class="lead">O time cozinha um menu completo, dividido em grupos — cada um cuida de uma etapa. No fim, todo mundo senta pra saborear juntos.</p>
    <div class="rule"></div>
    <div class="wtrio">
      <div class="wcard"><span class="top">1º tempo</span><div class="sq"><img src="assets/entradachef.jpg" alt="Bruschetta de prosciutto com ricota e mel, entrada do chef" style="object-position:center 55%"></div><div class="wcard-body"><span class="n">Entrada</span><h3>Entrada</h3><p>Uma abertura caprichada pra começar bem — quentinha e cheia de sabor.</p></div></div>
      <div class="wcard"><span class="top">2º tempo</span><div class="sq"><img src="assets/risotomar.jpg" alt="Risoto de frutos do mar como prato principal" style="object-position:center 50%"></div><div class="wcard-body"><span class="n">Prato principal</span><h3>Prato principal</h3><p>O prato-estrela, feito a várias mãos — o momento mais mão na massa da noite.</p></div></div>
      <div class="wcard"><span class="top">3º tempo</span><div class="sq"><img src="assets/brownie.jpg" alt="Sobremesa artesanal" style="object-position:center 50%"></div><div class="wcard-body"><span class="n">Sobremesa</span><h3>Sobremesa</h3><p>Pra fechar com chave de ouro — o docinho que coroa o encontro.</p></div></div>
    </div>
    <div class="note" style="margin-top:16px">◆ Este é um <b>exemplo de menu</b> — o cardápio final é definido junto com vocês e pode variar conforme a preferência do time. 🍽️</div>
    {foot("O cardápio")}
  </section>'''

deck = '<div class="deck">\n' + cover + buscamos + menu + planos + personaliza + como + '\n\n</div>\n\n'
# fix title/meta
head = head.replace("<title>Festa Infantil · Tufting & Lip Balm · Elarah</title>", "<title>Aniversário da Gabi · Elarah</title>")
head = re.sub(r'<meta name="description" content="Proposta de festa infantil da Elarah — oficina de Tufting ou Lip Balm, em casa.">]*>', '<meta name="description" content="Proposta de experiência de aniversário da Elarah — oficina de Perfumaria ou Lip Balm para a festa da Gabi.">', head)
# mobile-PDF-safe: some phone PDF viewers render box-shadows as solid gray boxes.
# Kill all shadows and lean on hairline borders instead (clean on every viewer).
head = head.replace("</head>",
    "<style>*{box-shadow:none!important;-webkit-box-shadow:none!important}"
    ".cover-photo{border:1px solid var(--line)}"
    ".plan-photo,.bfeat .bphoto{border:1px solid var(--line)}"
    "</style>\n</head>")
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-festa-tufting-lipbalm.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"), html.count("compass\">"))
