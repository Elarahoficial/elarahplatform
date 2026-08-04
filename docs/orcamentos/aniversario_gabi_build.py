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
  .itable .val{font-family:'DM Serif Display',serif;font-size:26px;color:var(--navy);line-height:1}
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
        <span class="kicker">Proposta de experiência · aniversário</span>
        <span class="compass">Aniversário da <span>Gabi</span><small>São Paulo · setembro</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência · Aniversário</span>
        <h1>Uma festa de<br><em>mão na massa</em></h1>
        <p class="lead">Uma tarde criativa e sensorial pra celebrar a Gabi com as amigas — <strong>criar perfume e lip balm</strong>, rir muito e levar a própria criação pra casa. Leve, charmosa e cheia de mimo. 🎀</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>16</b> meninas</span>
          <span class="chip"><b>Setembro</b> · a definir</span>
          <span class="chip">No seu salão <b>ou no Bake Studio</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/aniv-adulto.jpg" alt="Grupo reunido numa mesa linda e decorada, num encontro da Elarah" style="object-position:center 35%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Já realizado para marcas como <b>Compass</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)</div>
    {foot("Experiência · Aniversário da Gabi")}
  </section>'''

buscamos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Pensado pra festa da Gabi</span></div>
    </div>
    <span class="eyebrow orange">◆ Por que uma experiência</span>
    <h2>Uma festa <em>diferente</em></h2>
    <p class="lead">Muito mais que uma festinha: uma experiência <strong>mão na massa</strong> em que cada convidada cria o próprio perfume (ou lip balm), se diverte e leva a criação pra casa. Encantador, sensorial e cheio de charme — pra qualquer idade. 🎀</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#D96A8E" stroke-width="1.6"><circle cx="10.5" cy="14" r="6"/><circle cx="17.5" cy="14" r="6"/></svg></div><h3>Diversão de verdade</h3><p>Todas criando junto — uma atividade encantadora que vira a estrela da festa.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#D96A8E" stroke-width="1.6" stroke-linejoin="round"><path d="M14 3.5 L16 12 L24.5 14 L16 16 L14 24.5 L12 16 L3.5 14 L12 12 Z"/></svg></div><h3>Sensorial & criativo</h3><p>Aromas, cores e texturas — cada uma monta a própria fragrância ou lip balm autoral.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#D96A8E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3.5h12l-1 8a5 5 0 0 1-10 0z"/><path d="M14 16.5v6M10 22.5h8"/></svg></div><h3>A gente cuida de tudo</h3><p>Material, condução e estrutura por nossa conta — e a criação já é a lembrancinha de cada uma.</p></div>
    </div>
    <div class="quote">
      <i>"As melhores festas são as que a gente cria com as próprias mãos."</i><br>
      — É isso que a Elarah leva pra Gabi: uma tarde que vira <strong>memória (e cheirinho) pra sempre</strong>. 🎀
    </div>
    {foot("Pensado pra festa da Gabi")}
  </section>'''

menu = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O menu</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham a experiência</span>
    <h2>Duas opções <em>encantadoras</em></h2>
    <p class="lead">Duas oficinas deliciosas — as duas pelo <strong>mesmo valor</strong>, é só escolher a favorita da Gabi. Em ambas, cada convidada cria a sua peça e leva pra casa como lembrancinha. 🎀</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","perfumariakids.jpg","Oficina de Perfumaria","Cada convidada cria a própria fragrância autoral, numa imersão sensorial cheia de encanto. Leva o seu perfuminho pra casa.","Menina criando o próprio perfume numa oficina","center 30%")}
      {exp("02","lipbalm.jpg","Oficina de Lip Balm","Cada uma prepara o próprio lip balm com aromas e cores — divertido, cheiroso e pra usar (e mostrar) depois.","Lip balm artesanal criado numa oficina","center 50%")}
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
    <span class="eyebrow orange">◆ Escolham o formato</span>
    <h2>A partir de <em>R$ 199</em></h2>
    <p class="lead">O valor é o mesmo pra Perfumaria ou Lip Balm — muda só onde acontece e o nível. Todos <strong>por pessoa</strong>, já com material e condução inclusos. 🎀</p>
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
          <td class="rl"><b>No seu salão</b><span>A gente leva a oficina até você</span></td>
          <td class="val">R$ 199</td><td class="val">R$ 299</td><td class="val hl">R$ 399</td>
        </tr>
        <tr>
          <td class="rl"><b>No Bake Studio</b><span>Espaço exclusivo, só pra festa</span></td>
          <td class="val">R$ 289</td><td class="val">R$ 389</td><td class="val hl">R$ 489</td>
        </tr>
      </tbody>
    </table>
    <div class="note" style="margin-top:18px">◆ Valores <b>por pessoa</b>. <b>A experiência</b> já inclui material e condução, com o produto (perfume ou lip balm) de <b>lembrancinha</b> de cada uma. Cada nível soma <b>+R$ 100</b>: foto profissional e, no Completo, o kit de escova &amp; piranha personalizado.</div>
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
        <div class="plan-photo sq"><img src="assets/rockworld1.jpg" alt="Momento da festa registrado por um fotógrafo" style="object-position:center 45%"></div>
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
    <p class="lead">A Elarah cuida de toda a produção pra a festa da Gabi ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Escolhem a oficina</h3><p>Perfumaria ou Lip Balm — pelo mesmo valor, é só escolher a favorita.</p></div>
      <div class="step"><div class="num">2</div><h3>No seu salão ou no Bake Studio</h3><p>A gente leva a experiência até o seu salão, ou reserva o nosso estúdio — material e condução inclusos.</p></div>
      <div class="step"><div class="num">3</div><h3>As meninas criam &amp; levam</h3><p>Cada uma põe a mão na massa e leva a própria criação pra casa de lembrancinha. 🎀</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>A criação já é a lembrancinha</h4>
        <p>O perfuminho (ou lip balm) que cada convidada faz já vai pra casa como <b>lembrancinha</b> — e dá pra somar o kit de escova &amp; piranha personalizado. 💛</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora celebrar a <em>Gabi?</em> ✦</h2>
      <p>Me conta qual oficina mais chamou e a data de setembro, que a gente fecha cada detalhe da festa.</p>
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
    <p class="fineprint">Proposta de experiência de aniversário da Elarah para a festa da Gabi, cerca de 16 convidadas, em setembro (data a definir). Oficina à escolha, pelo mesmo valor: Perfumaria ou Lip Balm — cada convidada cria e leva a própria criação como lembrancinha. Dois formatos: no seu salão de festas (a gente leva a oficina até você) a partir de R$ 199 por pessoa (níveis R$ 199 / 299 / 399); ou no Bake Studio (espaço exclusivo · Rua Conselheiro Ramalho, 378 · Bela Vista · São Paulo) a partir de R$ 289 por pessoa (níveis R$ 289 / 389 / 489). Níveis: A experiência (material e condução) / + foto profissional (+R$ 100) / Completo com lembrancinha personalizada de escova & piranha (+R$ 100). Valores por pessoa. Proposta válida mediante confirmação de data e disponibilidade de agenda.</p>
    {foot("Experiência · Aniversário da Gabi · 2026")}
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

deck = '<div class="deck">\n' + cover + buscamos + menu + espacos + planos + personaliza + como + '\n\n</div>\n\n'
# fix title/meta
head = head.replace("<title>Experiência Corporativa · Elarah × Compass</title>", "<title>Aniversário da Gabi · Elarah</title>")
head = re.sub(r'<meta name="description"[^>]*>', '<meta name="description" content="Proposta de experiência de aniversário da Elarah — oficina de Perfumaria ou Lip Balm para a festa da Gabi.">', head)
# mobile-PDF-safe: some phone PDF viewers render box-shadows as solid gray boxes.
# Kill all shadows and lean on hairline borders instead (clean on every viewer).
head = head.replace("</head>",
    "<style>*{box-shadow:none!important;-webkit-box-shadow:none!important}"
    ".cover-photo{border:1px solid var(--line)}"
    ".plan-photo,.bfeat .bphoto{border:1px solid var(--line)}"
    "</style>\n</head>")
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-aniversario-gabi.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"), html.count("compass\">"))
