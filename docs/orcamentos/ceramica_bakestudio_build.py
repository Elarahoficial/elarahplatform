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
head = head.replace("--orange:#F27623;", "--orange:#C0703A;")       # accent: warm copper
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#9C5626;")
head = head.replace("--navy:#16233C;", "--navy:#2A211C;")           # deep espresso (headings/dark)
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#6E5F54;") # warm taupe for lead
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#C0703A;")
head = head.replace("#EDF1F7", "#F7EFE7").replace("#DCE5F1", "#ECDFD0")
head = head.replace("#FF9A4D", "#E0A878")
head = head.replace("rgba(242,118,35,.22)", "rgba(192,112,58,.28)")

# extra CSS: experience menu grid (2x2) + investment table
extra = '''
  .menu{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:12px}
  .exp{position:relative;width:calc(50% - 9px);background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .exp .top{position:absolute;top:12px;left:12px;z-index:3;background:var(--orange);color:#fff;font-size:9.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:5px 12px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(156,86,38,.5)}
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
  .itable .hl{background:#F5E9DC}
  .itable thead th.hl{color:var(--orange-dark)}
  .itable tbody tr:last-child td{border-bottom:none}
  .itable thead th.hl{position:relative}
  .itable .pill{display:inline-block;background:var(--navy);color:#fff;font-size:8px;letter-spacing:.08em;padding:3px 9px;border-radius:999px;margin-bottom:7px;font-weight:700;text-transform:uppercase}
  /* wtrio de experiências com vinho (3 quadrados na mesma linha) */
  .wtrio{display:flex;gap:16px;justify-content:center;margin-top:12px}
  .wcard{position:relative;flex:1;max-width:calc(33.333% - 11px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .wcard .top{position:absolute;top:11px;left:11px;z-index:3;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 11px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(156,86,38,.5)}
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
  .dchips span{background:#F5E9DC;border:1px solid var(--line);border-radius:999px;padding:6px 13px;font-size:11.5px;color:var(--navy);font-weight:500}
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
        <span class="kicker">Proposta de experiência</span>
        <span class="compass">Oficina de <span>Cerâmica</span><small>São Paulo · 18 de agosto</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência · Cerâmica</span>
        <h1>Uma manhã na<br><em>argila</em></h1>
        <p class="lead">Uma experiência <strong>mão na massa</strong> pra criar junto, com calma e muita troca — cada um modela (ou pinta) a própria peça de cerâmica e leva pra casa. Num <strong>estúdio só de vocês</strong>. 🤍</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>6 pessoas</b></span>
          <span class="chip">Terça, <b>18/08</b> · 9h–13h</span>
          <span class="chip">Bake Studio · <b>Bela Vista</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/ceramicamodelagem.jpg" alt="Mãos modelando uma peça de cerâmica numa oficina" style="object-position:center 50%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Já realizado para marcas como <b>Compass</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)</div>
    {foot("Experiência · Oficina de Cerâmica")}
  </section>'''

buscamos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Pensado pra reunir o grupo</span></div>
    </div>
    <span class="eyebrow orange">◆ Por que a cerâmica</span>
    <h2>Mão na <em>argila</em></h2>
    <p class="lead">Poucas coisas relaxam e aproximam como <strong>modelar a argila com as próprias mãos</strong>. Uma manhã sensorial e criativa pra soltar o grupo, sair da rotina e criar junto — pra qualquer um, sem talento nenhum.</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#C0703A" stroke-width="1.6"><circle cx="10.5" cy="14" r="6"/><circle cx="17.5" cy="14" r="6"/></svg></div><h3>Conexão de verdade</h3><p>Todo mundo criando junto — a atividade é o pretexto; a conexão é o que fica.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#C0703A" stroke-width="1.6" stroke-linejoin="round"><path d="M14 3.5 L16 12 L24.5 14 L16 16 L14 24.5 L12 16 L3.5 14 L12 12 Z"/></svg></div><h3>Sensorial & relaxante</h3><p>O tato da argila é puro presente — meditativo, autoral e cheio de charme.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#C0703A" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 24 V11 L14 4.5 L23 11 V24"/><rect x="11.5" y="16" width="5" height="8"/></svg></div><h3>Espaço 100% de vocês</h3><p>Um estúdio lindo e totalmente fechado pro grupo — material, condução e estrutura inclusos.</p></div>
    </div>
    <div class="quote">
      <i>"Não tem nada como colocar a mão na argila pra desacelerar de verdade."</i><br>
      — É isso que a Elarah leva: uma manhã que vira <strong>memória (e uma peça linda)</strong>. 🤍
    </div>
    {foot("Pensado pra reunir o grupo")}
  </section>'''

menu = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O menu</span></div>
    </div>
    <span class="eyebrow orange">◆ A experiência</span>
    <h2>Modelar <em>ou</em> pintar</h2>
    <p class="lead">Duas formas de viver a cerâmica — as duas pelo <strong>mesmo valor</strong>, é só escolher a favorita do grupo. Em ambas, cada um cria a própria peça e leva pra casa de recordação. 🤍</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","ceramicamodelagem.jpg","Modelagem em Cerâmica","Modelem a própria peça à mão, na argila — do potinho ao vaso. O mão na massa mais literal (e relaxante) que existe.","Mãos modelando uma peça de cerâmica","center 50%")}
      {exp("02","pinturapratoceramica.jpg","Pintura em Cerâmica","Pintem à mão uma peça de cerâmica pronta — prato, caneca ou bowl — do jeitinho de cada um. Puro charme.","Peça de cerâmica sendo pintada à mão","center 50%")}
    </div>
    {foot("A experiência")}
  </section>'''

espacos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Onde acontece</span></div>
    </div>
    <span class="eyebrow orange">◆ Já incluso · espaço exclusivo</span>
    <h2>No <em>Bake Studio</em></h2>
    <p class="lead">Um estúdio lindo e acolhedor na <strong>Bela Vista</strong> (Rua Conselheiro Ramalho, 378), totalmente reservado pro grupo. O cenário perfeito pra criar com calma, relaxar e trocar ideia — com toda a estrutura pronta pra receber vocês.</p>
    <div class="rule"></div>
    <div class="bfeat" style="height:230px">
      <div class="bphoto"><img src="assets/espaco1.jpg" alt="Lounge acolhedor do Bake Studio" style="object-position:center 55%"></div>
      <div class="bbody">
        <span class="btag">★ Espaço exclusivo incluso</span>
        <h3>Bake Studio <span class="sub">Bela Vista</span></h3>
        <p>Um estúdio charmoso e reservado, só de vocês. A gente reserva o espaço e leva toda a estrutura — o grupo só chega e põe a mão na argila. 🤍</p>
      </div>
    </div>
    <div class="bfeat plain" style="margin-top:16px;height:190px">
      <div class="bphoto"><img src="assets/espa%C3%A7o2.jpg" alt="Cozinha equipada do Bake Studio, ótima pra um coffee" style="object-position:center 50%"></div>
      <div class="bbody">
        <span class="btag soft">O lounge</span>
        <h3>Acolhedor <span class="sub">e completo</span></h3>
        <p>Cozinha equipada pra um coffee gostoso e um cantinho lindo pra relaxar entre uma criação e outra. Aconchego do começo ao fim.</p>
      </div>
    </div>
    {foot("Onde acontece · Bake Studio")}
  </section>'''

planos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham o nível</span>
    <h2>A partir de <em>R$ 289</em></h2>
    <p class="lead">Modelagem ou pintura têm o mesmo valor — muda só o nível que escolherem. Todos <strong>por pessoa</strong>, já com o <strong>espaço exclusivo no Bake Studio</strong>, material e condução inclusos. 🤍</p>
    <div class="rule"></div>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th>A experiência<span>espaço exclusivo + material & condução</span></th>
        <th>Com foto<span>+ foto profissional</span></th>
        <th class="hl"><span class="pill">★ Mais completo</span><br>Completo<span>+ personalização & lembrancinha</span></th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="rl"><b>Cerâmica — Modelagem ou Pintura</b><span>As duas pelo mesmo valor — cada um leva a sua peça</span></td>
          <td class="val">R$ 289</td><td class="val">R$ 389</td><td class="val hl">R$ 489</td>
        </tr>
      </tbody>
    </table>
    <div class="note" style="margin-top:20px">◆ Valores <b>por pessoa</b>, com o <b>espaço exclusivo no Bake Studio</b> já incluso, além de material e condução. <b>Níveis:</b> A experiência → <b>+ foto profissional</b> (+R$ 100) → <b>+ personalização & lembrancinha</b> (+R$ 100). Turma de 6, na terça 18/08 (9h–13h).</div>
    {foot("Investimento")}
  </section>'''

personaliza = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Extras opcionais</span></div>
    </div>
    <span class="eyebrow orange">◆ Se quiserem deixar ainda mais completo</span>
    <h2>Dois <em>mimos</em> a mais</h2>
    <p class="lead">Dois extras opcionais que deixam a manhã inesquecível — o registro profissional do encontro e a lembrancinha personalizada.</p>
    <div class="rule"></div>
    <div class="plans">
      <div class="plan">
        <div class="plan-photo sq"><img src="assets/rockworld1.jpg" alt="Momento do time registrado por um fotógrafo" style="object-position:center 45%"></div>
        <div class="plan-body">
          <span class="tag basic">Nível Com foto · R$ 389</span>
          <h3>Registro fotográfico profissional</h3>
          <ul class="feat">
            <li>Um fotógrafo cobre o encontro inteiro</li>
            <li>Cada risada e cada criação registradas</li>
            <li>Álbum digital lindo pra empresa usar e postar</li>
          </ul>
          <span class="allin">Memória (e conteúdo) pra marca</span>
        </div>
      </div>
      <div class="plan featured">
        <span class="ribbon">★ Nível Completo · R$ 489</span>
        <div class="plan-photo sq"><img src="assets/personaliza%C3%A7aobrindeescovapiranha.jpg" alt="Kit de lembrancinha personalizada com escova e piranha" style="object-position:center"></div>
        <div class="plan-body">
          <span class="tag premium">Brinde personalizado</span>
          <h3>Lembrancinha personalizada</h3>
          <ul class="feat">
            <li>Kit com <b>escova &amp; piranha</b> pra cada pessoa</li>
            <li>Personalizado com o nome de cada uma</li>
            <li>Um mimo pra levarem do encontro pra casa</li>
          </ul>
          <span class="allin">Cada um leva o seu mimo</span>
        </div>
      </div>
    </div>
    {foot("Extras opcionais")}
  </section>'''

como = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Como funciona &amp; contato</span></div>
    </div>
    <span class="eyebrow orange">◆ Simples e sob medida</span>
    <h2>É só <em>reunir o grupo</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pra a manhã ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Escolhem a experiência</h3><p>Modelagem ou pintura em cerâmica — pelo mesmo valor.</p></div>
      <div class="step"><div class="num">2</div><h3>No Bake Studio</h3><p>A gente reserva o estúdio exclusivo na Bela Vista e leva material, condução e estrutura — é só chegar.</p></div>
      <div class="step"><div class="num">3</div><h3>Cada um cria &amp; leva</h3><p>Todo mundo põe a mão na argila e leva a própria peça pra casa de recordação. 🤍</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Manhã completa</h4>
        <p>A oficina acontece das <b>9h às 13h</b>, com tempo de sobra pra criar sem correria e ainda relaxar com um coffee. ☕</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora colocar a mão na <em>argila?</em> ✦</h2>
      <p>Me conta se preferem modelagem ou pintura, que a gente fecha cada detalhe da terça 18/08.</p>
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
    <p class="fineprint">Proposta de experiência de cerâmica da Elarah para grupo de cerca de 6 pessoas, na terça-feira 18 de agosto (das 9h às 13h), no Bake Studio (espaço exclusivo · Rua Conselheiro Ramalho, 378 · Bela Vista · São Paulo). Experiência à escolha, pelo mesmo valor: Modelagem em Cerâmica ou Pintura em Cerâmica — cada participante cria e leva a própria peça. A partir de R$ 289 por pessoa (níveis R$ 289 / 389 / 489): A experiência (espaço exclusivo, material e condução) / + foto profissional (+R$ 100) / Completo com personalização e lembrancinha (+R$ 100). Valores por pessoa, com o espaço exclusivo já incluso. Proposta válida mediante confirmação de data e disponibilidade de agenda.</p>
    {foot("Experiência · Oficina de Cerâmica · 2026")}
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
head = head.replace("<title>Oficina de Cerâmica · Elarah</title>", "<title>Experiência Corporativa · Integração · Elarah</title>")
head = re.sub(r'<meta name="description" content="Proposta de oficina de cerâmica da Elarah — modelagem ou pintura, no Bake Studio.">]*>', '<meta name="description" content="Proposta de experiência corporativa da Elarah — cerâmica, charme de bolsa, perfume ou crochê no Bake Studio.">', head)
# mobile-PDF-safe: some phone PDF viewers render box-shadows as solid gray boxes.
# Kill all shadows and lean on hairline borders instead (clean on every viewer).
head = head.replace("</head>",
    "<style>*{box-shadow:none!important;-webkit-box-shadow:none!important}"
    ".cover-photo{border:1px solid var(--line)}"
    ".plan-photo,.bfeat .bphoto{border:1px solid var(--line)}"
    "</style>\n</head>")
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-ceramica.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"), html.count("compass\">"))
