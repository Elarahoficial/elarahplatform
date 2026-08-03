# Despedida de solteira deck — wine/rose palette, 4-experience menu (com vinho incluso) + 3-tier plans.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

# ---- embed fonts: swap the 3 google-fonts <link> lines for the embedded <style> block ----
fonts = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/embedded_fonts_style.html", encoding="utf-8").read()
head = re.sub(r'<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>',
              fonts, head, count=1, flags=re.S)

# ---- recolor CSS to cheerful candy pink + berry (festa infantil) ----
head = head.replace("--orange:#F27623;", "--orange:#E8629A;")       # accent: happy candy pink
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#C63F79;")
head = head.replace("--navy:#16233C;", "--navy:#4A2440;")           # deep berry/plum (headings/dark)
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#7C5A70;") # muted mauve for lead
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#E8629A;")
head = head.replace("#EDF1F7", "#FCEAF3").replace("#DCE5F1", "#F7D6E6")
head = head.replace("#FF9A4D", "#F6A6C6")
head = head.replace("rgba(242,118,35,.22)", "rgba(232,98,154,.30)")

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
        <span class="kicker">Proposta de festa infantil</span>
        <span class="compass">Elarah <span>Kids</span><small>aniversário de 7 anos</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Elarah Kids · Aniversário</span>
        <h1>Uma festa de <br><em>fazer os olhinhos brilharem</em></h1>
        <p class="lead">Uma festa <strong>mão na massa</strong>, criativa e cheia de diversão pra comemorar os <strong>7 anos</strong> com a criançada — cada uma cria, cozinha, se lambuza e leva a sua obra pra casa. Do jeitinho da aniversariante. 💖</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>7 anos</b></span>
          <span class="chip">Festa <b>fechada</b></span>
          <span class="chip">Criativa · <b>mão na massa</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/kids4.jpg" alt="Menina com chapéu de chef, toda animada, numa oficina de gastronomia" style="object-position:center 20%">
      </div>
    </div>
    {foot("Elarah Kids · Aniversário de 7 anos")}
  </section>'''

buscamos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Pensado pra criançada</span></div>
    </div>
    <span class="eyebrow orange">◆ Como é a festa</span>
    <h2>Um aniversário <em>diferente</em></h2>
    <p class="lead">Nada de tela e tédio: aqui a criançada põe <strong>a mão na massa</strong> de verdade — cozinha, pinta, modela e se diverte junto. Uma festa que rende <strong>histórias, fotos lindas e uma lembrança feita à mão</strong>, pra qualquer idade e nível.</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#E8629A" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3.5 L16 12 L24.5 14 L16 16 L14 24.5 L12 16 L3.5 14 L12 12 Z"/></svg></div><h3>Mão na massa</h3><p>A criançada vira chef e artista por um dia — atividades feitas pra soltar a imaginação.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#E8629A" stroke-width="1.6" stroke-linejoin="round"><path d="M14 24s-8.5-5-8.5-11a4.8 4.8 0 0 1 8.5-3 4.8 4.8 0 0 1 8.5 3c0 6-8.5 11-8.5 11z"/></svg></div><h3>Cada um leva a sua obra</h3><p>Cada criança leva pra casa o que criou — a melhor lembrancinha da festa.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#E8629A" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 21V11l10.5-7 10.5 7v10M10 21v-6h8v6"/></svg></div><h3>A gente leva até você</h3><p>Em casa, no salão de festa ou num espaço parceiro — material, condução e estrutura por nossa conta.</p></div>
    </div>
    <div class="quote">
      <i>"Festa boa é aquela que a criança lembra pra sempre."</i><br>
      — E ninguém esquece o dia em que virou <strong>chef, artista e a estrela da festa</strong>. ✨
    </div>
    {foot("Pensado pra criançada")}
  </section>'''

menu = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">As oficinas criativas</span></div>
    </div>
    <span class="eyebrow orange">◆ Criar, pintar &amp; inventar</span>
    <h2>As oficinas <em>criativas</em></h2>
    <p class="lead">Pra uma aniversariante que <strong>ama desenhar</strong>, essas são a cara dela — cada criança cria a sua e sai com a obra na mão. Escolham uma ou combinem mais de uma na mesma festa.</p>
    <div class="rule"></div>
    <div class="wtrio">
      <div class="wcard"><div class="sq"><img src="assets/ecobagpintura.jpg" alt="Criança pintando uma bolsinha de pano com flores" style="object-position:center 45%"></div><div class="wcard-body"><span class="n">01</span><h3>Pintura de Bolsinha</h3><p>Pintam a própria ecobag e saem usando com o maior charme. Puro estilo.</p></div></div>
      <div class="wcard"><div class="sq"><img src="assets/aniv-infantil.jpg" alt="Crianças pintando numa festa de arte" style="object-position:center 30%"></div><div class="wcard-body"><span class="n">02</span><h3>Pintura &amp; Desenho</h3><p>Pintam a própria telinha e desenham à vontade — pra quem ama soltar a arte.</p></div></div>
      <div class="wcard"><div class="sq"><img src="assets/ceramicamodelagem.jpg" alt="Mãos modelando uma peça de cerâmica" style="object-position:center 50%"></div><div class="wcard-body"><span class="n">03</span><h3>Cerâmica</h3><p>Modelam e pintam a própria pecinha de cerâmica, e levam pra casa de recordação.</p></div></div>
    </div>
    <div class="note" style="margin-top:16px">◆ Em todas, a Elarah leva <b>todo o material, a condução e os aventalzinhos</b> — a criançada só chega e coloca a mão na massa. 💖</div>
    {foot("As oficinas criativas")}
  </section>'''

gastronomia = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">A estrela da festa</span></div>
    </div>
    <span class="eyebrow orange">◆ A queridinha da criançada</span>
    <h2>Gastronomia é a <em>estrela</em> ✨</h2>
    <p class="lead">A preferida das festas: a criançada vira <strong>chef por um dia</strong>, com direito a chapeuzinho e avental. Cozinham, decoram e — claro — provam tudo. Vale montar um menu com as delícias que a aniversariante mais ama.</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("Cozinha kids","cupcake.jpg","Cupcakes decorados","Confeitam e decoram os próprios cupcakes com cores, granulados e muito glacê.","Cupcakes decorados com cobertura rosa","center 50%",top="★ Top 1")}
      {exp("Cozinha kids","biscoitorecheado.jpg","Cookies &amp; Biscoitos","Modelam e decoram biscoitinhos e cookies — os de coração fazem o maior sucesso.","Biscoitos em formato de coração decorados","center 50%")}
      {exp("Cozinha kids","pizzakids.jpg","Pizza &amp; Focaccia","Abrem a massa, montam os ingredientes e viram pizzaiolos por um dia.","Pizza feita pelas crianças","center 50%")}
      {exp("Cozinha kids","hotdogkids.jpg","Lanches divertidos","Montam hot dogs, mini-lanches e comidinhas gostosas do jeito que quiserem.","Hot dogs montados pelas crianças","center 50%")}
    </div>
    {foot("A estrela da festa · Gastronomia")}
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
    <h2>É só <em>reunir a criançada</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pra a festa ser leve do começo ao fim — e você aproveitar junto:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Escolhem as oficinas</h3><p>Gastronomia, pintura de bolsinha, cerâmica, desenho — uma ou combinando várias.</p></div>
      <div class="step"><div class="num">2</div><h3>A gente leva até você</h3><p>Em casa, no salão de festa ou num espaço parceiro — material, avental e condução por nossa conta.</p></div>
      <div class="step"><div class="num">3</div><h3>É só a criançada curtir</h3><p>Todo mundo cria, se diverte e leva a própria obra pra casa. Você só aproveita a festa.</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Do jeitinho da aniversariante 💖</h4>
        <p>A gente personaliza tudo com a cara dela — cores, tema e as atividades favoritas. Vaidosa, agitada e apaixonada por desenhar? Montamos uma festa que é a cara dela.</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora fazer essa festa <em>inesquecível?</em> ✦</h2>
      <p>Me conta quantas crianças, a data e quais oficinas mais chamaram, que eu monto o orçamento personalizado pra vocês.</p>
      <div class="cta-actions">
        <a class="btn-wa" href="https://wa.me/5511914455930?text=Oi%2C%20Elarah!%20Vi%20a%20proposta%20de%20festa%20infantil%20e%20quero%20saber%20mais." target="_blank" rel="noopener">
          💬 Falar no WhatsApp
        </a>
        <div class="contact-links">
          <span>+55 (11) 91445-5930</span>
          <a href="https://instagram.com/elarah.oficial" target="_blank" rel="noopener">@elarah.oficial</a>
          <a href="https://elarah.com.br" target="_blank" rel="noopener">elarah.com.br</a>
        </div>
      </div>
    </div>
    <p class="fineprint">Proposta de festa de aniversário infantil da Elarah Kids, com oficinas criativas e de gastronomia conduzidas para a criançada. Atividades à escolha: Gastronomia (cupcakes, cookies & biscoitos, pizza & focaccia, lanches), Pintura de bolsinha (ecobag), Pintura & desenho e Cerâmica — uma ou combinando mais de uma na mesma festa. A Elarah leva material, aventais, condução e estrutura; realizada em casa, em salão de festa ou em espaço parceiro. Cada festa é montada sob medida — o valor por criança varia conforme o número de convidados, as oficinas escolhidas e o formato. Proposta válida mediante confirmação de data, número de crianças e disponibilidade de agenda.</p>
    {foot("Elarah Kids · Aniversário")}
  </section>'''

deck = '<div class="deck">\n' + cover + buscamos + menu + gastronomia + como + '\n\n</div>\n\n'
# fix title/meta
head = head.replace("<title>Experiência Corporativa · Elarah × Compass</title>", "<title>Festa Infantil · Elarah Kids</title>")
head = re.sub(r'<meta name="description"[^>]*>', '<meta name="description" content="Proposta de festa de aniversário infantil da Elarah Kids — oficinas de gastronomia, pintura, cerâmica e mais, com a mão na massa.">', head)
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-festa-infantil.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"), html.count("compass\">"))
