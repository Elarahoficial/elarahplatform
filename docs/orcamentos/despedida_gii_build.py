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
  .menu{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:12px}
  .exp{position:relative;width:calc(33.333% - 11px);background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .exp .top{position:absolute;top:11px;left:11px;z-index:3;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:5px 11px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(158,52,83,.55)}
  .exp-photo{aspect-ratio:4/3;overflow:hidden;background:#eee}
  .exp-photo img{width:100%;height:100%;object-fit:cover}
  .exp-body{padding:11px 14px 13px}
  .exp .n{display:inline-block;font-size:9px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:4px}
  .exp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--navy);line-height:1.05}
  .exp p{font-size:11px;color:var(--muted);margin-top:4px;line-height:1.38}
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
        <span class="compass">Despedida de <span>solteira</span><small>São Paulo · dezembro</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência · Despedida de solteira</span>
        <h1>Uma despedida<br>de <em>mão na massa</em></h1>
        <p class="lead">Uma tarde de <strong>criar junto e drink na mão</strong> pra celebrar a noiva com quem ela ama. Um menu cheio de opções criativas, num <strong>espaço charmoso só de vocês</strong>.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip">Grupo <b>íntimo</b></span>
          <span class="chip">Fim de semana · <b>dezembro</b></span>
          <span class="chip">São Paulo · <b>cafeteria parceira</b></span>
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
    <h2>Pra brindar a <em>última solteira</em></h2>
    <p class="lead">Momentos de <strong>mão na massa e drink na mão</strong>, leves e cheios de risada, em que o que importa é celebrar juntas. Uma experiência pensada pra soltar o grupo, mimar a noiva e render fotos lindas — pra qualquer uma, sem talento nenhum.</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#B14A6B" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3.5h12l-1 8a5 5 0 0 1-10 0z"/><path d="M14 16.5v6M10 22.5h8"/></svg></div><h3>Criativo & com drinks</h3><p>Mão na massa e drink na mão — cada uma cria a sua peça e brinda à noiva.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#B14A6B" stroke-width="1.6" stroke-linejoin="round"><path d="M14 24s-8.5-5-8.5-11a4.8 4.8 0 0 1 8.5-3 4.8 4.8 0 0 1 8.5 3c0 6-8.5 11-8.5 11z"/></svg></div><h3>Só de vocês</h3><p>Turma privada, a noiva no centro — o grupo inteiro criando e celebrando junto.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#B14A6B" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 21V11l10.5-7 10.5 7v10"/><path d="M10 21v-6h8v6"/></svg></div><h3>Num espaço charmoso</h3><p>Numa cafeteria parceira só de vocês — material, condução e estrutura por nossa conta.</p></div>
    </div>
    <div class="quote">
      <i>"As melhores histórias começam com um brinde."</i><br>
      — É isso que a Elarah leva pra despedida: uma tarde que vira <strong>memória (e foto linda)</strong>.
    </div>
    {foot("Pensado pra celebrar a noiva")}
  </section>'''

menu = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O menu</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham a experiência</span>
    <h2>Um menu <em>pra escolher</em></h2>
    <p class="lead">Um menu cheio de experiências criativas — cada uma cria (e leva) a sua peça pra casa. É só escolher a favorita do grupo. E, pra quem ama um bom brinde, a <strong>Bartenderia</strong> pra fechar com chave de ouro.</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","desp-hero4.jpg","Cerâmica","Modele a sua peça à mão, à mesa posta. Leve a sua criação pra casa.","Mesa posta para experiência de cerâmica","center 35%")}
      {exp("02","perfumariaharbolita.jpg","Perfumaria","Crie a sua fragrância autoral, numa imersão sensorial deliciosa.","Essências e frascos de perfumaria","center 45%")}
      {exp("03","pinturatacavinho.jpg","Pintura em Taça","Pinte a sua taça autoral e brinde com ela na mesma hora.","Taça pintada à mão","center 45%")}
      {exp("04","velaaromatica.jpg","Vela Aromática","Crie a sua vela perfumada, do aroma ao rótulo, com as amigas.","Vela aromática artesanal")}
      {exp("05","croche.jpg","Bolsa de Crochê","Aprenda crochê e faça a sua bolsinha autoral pra levar pra casa.","Bolsinhas de crochê coloridas")}
      {exp("06","saboneteroxo.jpg","Sabonete Artesanal","Crie os próprios sabonetes botânicos, com aroma e cor.","Sabonetes artesanais de lavanda")}
      {exp("07","fazendojoia.jpg","Joalheria","Crie a própria joia — anel, colar ou pingente pra chamar de seu.","Mãos criando uma joia à mão","center 40%")}
      {exp("08","buqueflor.jpg","Arranjo Floral","Monte o seu próprio arranjo de flores e leve pra casa.","Buquê de flores montado à mão")}
      {exp("09","drinks.jpg","Bartenderia · Drinks","Um bartender ensina o grupo a preparar os próprios drinks autorais.","Drink autoral servido numa aula de bartenderia","center 50%",top="★ Top em despedida")}
    </div>
    {foot("O menu")}
  </section>'''

espacos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Onde acontece</span></div>
    </div>
    <span class="eyebrow orange">◆ Cafeterias parceiras</span>
    <h2>Num espaço <em>charmoso</em></h2>
    <p class="lead">A gente reserva uma <strong>cafeteria linda só de vocês</strong> pra viver a experiência. Duas opções queridinhas em São Paulo — escolham a que fica melhor pro grupo.</p>
    <div class="rule"></div>
    <div class="bfeat">
      <div class="bphoto"><img src="assets/sowcafe.jpg" alt="Ambiente aconchegante da Sow Cake Lounge" style="object-position:center 50%"></div>
      <div class="bbody">
        <span class="btag">Opção 1 · Vila Mariana</span>
        <h3>Sow Cake Lounge <span class="sub">Vila Mariana</span></h3>
        <p>Um lounge charmoso e acolhedor, perfeito pra reunir o grupo, criar com calma e brindar à noiva num cantinho só de vocês.</p>
      </div>
    </div>
    <div class="bfeat" style="margin-top:16px">
      <div class="bphoto"><img src="assets/julescampobelo.jpg" alt="Ambiente da Jules l'Art du Pain no Campo Belo" style="object-position:center 50%"></div>
      <div class="bbody">
        <span class="btag">Opção 2 · Campo Belo</span>
        <h3>Jules l'Art du Pain <span class="sub">Campo Belo</span></h3>
        <p>Uma boulangerie afrancesada e cheia de charme, com aquele ar aconchegante que deixa a despedida ainda mais especial.</p>
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
    <span class="eyebrow orange">◆ Escolham o nível</span>
    <h2>Três níveis, do <em>seu jeito</em></h2>
    <p class="lead">Escolham a experiência e o nível que quiserem. Todos os valores são <strong>por pessoa</strong>, com material, condução e espaço já inclusos.</p>
    <div class="rule"></div>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th>A experiência<span>tudo pra viver o dia</span></th>
        <th>Com registro<span>+ foto profissional</span></th>
        <th class="hl"><span class="pill">★ Mais completo</span><br>Completo<span>+ personalização & lembrancinha</span></th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="rl"><b>Experiências criativas</b><span>Cerâmica · Perfumaria · Pintura · Vela · Crochê · Sabonete · Joalheria · Arranjo Floral</span></td>
          <td class="val">R$ —</td><td class="val">R$ —</td><td class="val hl">R$ —</td>
        </tr>
        <tr>
          <td class="rl"><b>Bartenderia · Drinks</b><span>Drinks autorais com bartender — pra brindar em grande</span></td>
          <td class="val">R$ —</td><td class="val">R$ —</td><td class="val hl">R$ —</td>
        </tr>
      </tbody>
    </table>
    <div class="note" style="margin-top:18px">◆ Valores <b>por pessoa</b>, com <b>material, condução e cafeteria parceira</b> já inclusos. Turma privada, só de vocês.</div>
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
      <div class="step"><div class="num">1</div><h3>Escolhem a experiência + nível</h3><p>Do menu criativo — ou a Bartenderia — no nível que preferirem.</p></div>
      <div class="step"><div class="num">2</div><h3>Numa cafeteria só de vocês</h3><p>A gente reserva a Sow ou a Jules e leva material, condução e estrutura — é só chegar.</p></div>
      <div class="step"><div class="num">3</div><h3>É só brindar</h3><p>Vocês só chegam, criam junto e celebram a noiva do jeito dela.</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Um mimo pra noiva</h4>
        <p>A gente ajuda a preparar uma <b>surpresinha pra ela</b> no meio da experiência — pra deixar o dia ainda mais especial. É só combinar. 💛</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora celebrar a <em>noiva?</em> ✦</h2>
      <p>Me conta qual experiência mais chamou e a data de dezembro, que a gente fecha cada detalhe da despedida.</p>
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
    <p class="fineprint">Proposta de experiência para despedida de solteira, turma privada, numa cafeteria parceira em São Paulo (Sow Cake Lounge · Vila Mariana ou Jules l'Art du Pain · Campo Belo). Menu à escolha: Cerâmica, Perfumaria, Pintura em Taça, Vela Aromática, Bolsa de Crochê, Sabonete Artesanal, Joalheria, Arranjo Floral — ou Bartenderia (drinks autorais). Níveis: A experiência (material, condução e espaço inclusos) / Com registro (+ foto profissional) / Completo (+ personalização & lembrancinha). Valores por pessoa, a confirmar conforme a experiência escolhida e o número de convidadas. Proposta válida mediante confirmação de data (fim de semana de dezembro) e disponibilidade de agenda.</p>
    {foot("Experiência · Despedida de solteira · 2026")}
  </section>'''

deck = '<div class="deck">\n' + cover + buscamos + menu + espacos + planos + personaliza + como + '\n\n</div>\n\n'
# fix title/meta
head = head.replace("<title>Experiência Corporativa · Elarah × Compass</title>", "<title>Despedida de Solteira · Elarah</title>")
head = re.sub(r'<meta name="description"[^>]*>', '<meta name="description" content="Proposta de experiência da Elarah para despedida de solteira — menu criativo com vinho incluso, a gente leva até você.">', head)
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-despedida-gii.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"), html.count("compass\">"))
