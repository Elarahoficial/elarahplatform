# Riachuelo corporate deck v2 — RED palette, creative experience menu + 3-tier plans.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

# ---- recolor CSS to Riachuelo dark green + cream (matches the brand logo) ----
head = head.replace("--orange:#F27623;", "--orange:#2E7D5E;")       # accent: mid green
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#215B44;")
head = head.replace("--navy:#16233C;", "--navy:#0E3A30;")           # deep pine green (headings/dark)
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#52605A;") # muted sage for lead
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#2E7D5E;")
head = head.replace("#EDF1F7", "#EAF1EC").replace("#DCE5F1", "#D5E5DA")
head = head.replace("#FF9A4D", "#86C2A5")
head = head.replace("rgba(242,118,35,.22)", "rgba(46,125,94,.30)")
# extra CSS: experience menu grid + 3-plan variant
extra = '''
  .menu{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:10px}
  .exp{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 14px 32px -22px rgba(0,0,0,.34)}
  .exp-photo{height:150px;overflow:hidden;background:#eee}
  .exp-photo img{width:100%;height:100%;object-fit:cover}
  .exp-body{padding:13px 16px 16px}
  .exp .n{display:inline-block;font-size:9px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:5px}
  .exp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--navy);line-height:1.08}
  .exp p{font-size:11.5px;color:var(--muted);margin-top:5px;line-height:1.42}
  /* plano rows (horizontais, legíveis) */
  .prows{margin-top:12px;display:flex;flex-direction:column;gap:14px}
  .prow{display:flex;background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:0 14px 30px -24px rgba(0,0,0,.3)}
  .prow.hl{border:2px solid var(--navy)}
  .prow .pl{width:33%;padding:20px 24px;border-right:1px solid var(--line);display:flex;flex-direction:column;justify-content:center;gap:7px}
  .prow.hl .pl{background:#F1F5F1}
  .prow .pr{flex:1;padding:20px 26px;display:flex;flex-direction:column;justify-content:center}
  .prow h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:23px;color:var(--navy);line-height:1}
  .prow .pc{font-family:'DM Serif Display',serif;font-size:20px;color:var(--navy-soft)}
  .prow .pc small{font-family:'DM Sans';font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-left:6px}
  .prow .mlab{font-size:10px;letter-spacing:.1em;font-weight:700;text-transform:uppercase;color:var(--orange-dark);margin-bottom:9px}
  .prow ul{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:9px 22px}
  .prow ul li{position:relative;padding-left:20px;font-size:13px;color:var(--ink);line-height:1.3}
  .prow ul li::before{content:"✦";position:absolute;left:0;top:1px;color:var(--orange);font-size:11px}
  .prow ul li b{font-weight:700}
  /* ícones (svg) no lugar de emoji */
  .infocard .ico svg{width:30px;height:30px;display:block}
  /* tabela de investimento (2 coleções x 3 níveis) */
  .itable{width:100%;border-collapse:collapse;margin-top:16px;font-family:'DM Sans'}
  .itable th,.itable td{padding:15px 12px;border-bottom:1px solid var(--line);text-align:center;vertical-align:middle}
  .itable thead th{font-size:12px;color:var(--navy);font-weight:700;border-bottom:2px solid var(--navy);text-transform:uppercase;letter-spacing:.04em}
  .itable thead th span{display:block;font-size:9.5px;font-weight:500;color:var(--muted);letter-spacing:.01em;margin-top:4px;text-transform:none}
  .itable td.rl{text-align:left;width:36%}
  .itable td.rl b{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy)}
  .itable td.rl span{display:block;font-size:10.5px;color:var(--muted);margin-top:4px;line-height:1.45}
  .itable .val{font-family:'DM Serif Display',serif;font-size:25px;color:var(--navy);line-height:1}
  .itable .hl{background:#EEF4EF}
  .itable thead th.hl{color:var(--orange-dark)}
  .itable tbody tr:last-child td{border-bottom:none}
</style>'''
head = head.replace("</style>", extra, 1)
# print overrides for grid
head = head.replace(".menu-cols{grid-template-columns:1fr 1fr}",
                    ".menu-cols{grid-template-columns:1fr 1fr}\n    .menu{grid-template-columns:repeat(3,1fr);gap:13px}\n    .exp-photo{height:120px}\n    .exp-body{padding:10px 13px 12px}\n    .exp h3{font-size:15.5px}\n    .exp p{font-size:10.5px;margin-top:4px;line-height:1.35}")
# mobile: menu single col
head = head.replace(".plans{grid-template-columns:1fr}",
                    ".plans{grid-template-columns:1fr}\n    .menu{grid-template-columns:1fr}")

def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'

def exp(n, img, name, desc, alt, pos="center 50%"):
    return f'<div class="exp"><div class="exp-photo"><img src="assets/{img}" alt="{alt}" style="object-position:{pos}"></div><div class="exp-body"><span class="n">{n}</span><h3>{name}</h3><p>{desc}</p></div></div>'

cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right">
        <span class="kicker">Proposta de experiência corporativa para</span>
        <span class="compass">RIACHUELO<small>integração do time</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência Corporativa · Integração</span>
        <h1>Experiências<br>que <em>integram</em></h1>
        <p class="lead">Um encontro criativo pra <strong>tirar o time da rotina e integrar de verdade</strong> — leve, sofisticado e com a mão na massa. Um leque de experiências pra vocês escolherem; a gente leva tudo até a Riachuelo.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>20 pessoas</b></span>
          <span class="chip"><b>02</b> de setembro</span>
          <span class="chip">Integração · <b>criativa</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/eventocorporativo.jpg" alt="Time reunido em um encontro Elarah, criando e se conectando">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Já realizado para times como <b>Compass</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)</div>
    {foot("Experiência Corporativa · Riachuelo")}
  </section>'''

buscamos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Pensado pra Riachuelo</span></div>
    </div>
    <span class="eyebrow orange">◆ O que buscamos</span>
    <h2>Um time mais <em>integrado</em></h2>
    <p class="lead">Momentos de <strong>mão na massa</strong>, leves e criativos, em que o que importa é criar junto. Experiências pensadas pra soltar as pessoas, aproximar as áreas e render boas histórias — pra qualquer pessoa, sem talento nenhum.</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#2E7D5E" stroke-width="1.6"><circle cx="10.5" cy="14" r="6"/><circle cx="17.5" cy="14" r="6"/></svg></div><h3>Conexão de verdade</h3><p>Todo mundo criando junto — a atividade é o pretexto; a integração é o que fica.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#2E7D5E" stroke-width="1.6" stroke-linejoin="round"><path d="M14 3.5 L16 12 L24.5 14 L16 16 L14 24.5 L12 16 L3.5 14 L12 12 Z"/></svg></div><h3>Criativo e sofisticado</h3><p>Um leque de experiências autorais — cada um cria e leva a sua peça pra casa.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#2E7D5E" stroke-width="1.6" stroke-linejoin="round"><path d="M5 24 V11 L14 4.5 L23 11 V24"/><rect x="11.5" y="16" width="5" height="8"/></svg></div><h3>Espaço exclusivo</h3><p>Um espaço só de vocês, com tudo pronto — material, condução e estrutura por nossa conta.</p></div>
    </div>
    <div class="quote">
      <i>"Os melhores times se constroem fora da mesa de reunião."</i><br>
      — É isso que a Elarah leva pra Riachuelo: um encontro que vira <strong>história pra contar no corredor</strong>.
    </div>
    {foot("Pensado pra Riachuelo")}
  </section>'''

menu = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O menu</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham a experiência</span>
    <h2>Um menu <em>autoral</em></h2>
    <p class="lead">Nove experiências criativas e sofisticadas — cada um cria (e leva) a sua peça pra casa. Os valores estão na página a seguir.</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","croche.jpg","Bolsa de Crochê","Aprenda crochê e faça a sua bolsinha autoral.","Bolsinhas de crochê coloridas")}
      {exp("02","desp-hero4.jpg","Cerâmica","Modelagem ou pintura em cerâmica — leve a sua peça.","Mesa montada para experiência de cerâmica","center 30%")}
      {exp("03","perfumariaharbolita.jpg","Perfumaria Natural","Crie a sua fragrância botânica, numa imersão sensorial.","Essências e frascos de perfumaria","center 45%")}
      {exp("04","pinturatacavinho.jpg","Pintura em Vidro","Em copo, xícara, vaso ou taça — leve a sua arte.","Taça de vidro pintada à mão")}
      {exp("05","saboneteroxo.jpg","Sabonete Artesanal","Crie os próprios sabonetes botânicos, com aroma e cor.","Sabonetes artesanais de lavanda")}
      {exp("06","velaaromatica.jpg","Vela Artesanal","Crie a sua vela perfumada, do aroma ao rótulo.","Vela aromática artesanal")}
      {exp("07","tufting6.jpg","Tufting","Com a pistola de tufting, crie a sua peça decorativa.","Time exibindo peças de tufting")}
      {exp("08","fazendojoia.jpg","Joalheria","Crie a própria joia — anel, colar ou pingente.","Mãos criando uma joia à mão","center 40%")}
      {exp("09","massamolho.jpg","Gastronomia &amp; Bartenderia","Aula de gastronomia, bartenderia ou bake studio.","Prato preparado numa aula de gastronomia")}
    </div>
    {foot("O menu")}
  </section>'''

espaco = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O espaço exclusivo</span></div>
    </div>
    <span class="eyebrow orange">◆ Já incluso desde o Básico</span>
    <h2>Um espaço <em>só de vocês</em></h2>
    <p class="lead">Um estúdio lindo e reservado — <strong>lounge acolhedor e cozinha equipada</strong>. O cenário perfeito pra criar, comer junto e relaxar, com toda a estrutura pronta pra receber o time.</p>
    <div class="rule"></div>
    <div class="pizza-hero">
      <div class="pizza-photo"><img src="assets/espaco1.jpg" alt="Lounge do espaço exclusivo"></div>
      <div class="pizza-photo"><img src="assets/espa%C3%A7o2.jpg" alt="Cozinha equipada do espaço exclusivo"></div>
    </div>
    {foot("O espaço exclusivo")}
  </section>'''

planos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham o nível</span>
    <h2>Do essencial ao <em>tudo incluso</em></h2>
    <p class="lead">Toda experiência já vem com <strong>espaço exclusivo</strong>. Vocês escolhem o quão completo querem o encontro — três níveis, dois valores por coleção.</p>
    <div class="rule"></div>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th>Básico<span>espaço exclusivo + experiência</span></th>
        <th>Intermediário<span>+ foto profissional & coffee</span></th>
        <th class="hl">Completo<span>+ personalização & lembrancinha</span></th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="rl"><b>Coleção Essencial</b><span>Crochê · Cerâmica · Perfumaria · Pintura em vidro · Sabonete · Vela</span></td>
          <td class="val">R$ 289</td><td class="val">R$ 389</td><td class="val hl">R$ 499</td>
        </tr>
        <tr>
          <td class="rl"><b>Coleção Premium</b><span>Tufting · Joalheria · Gastronomia & Bartenderia</span></td>
          <td class="val">R$ 589</td><td class="val">R$ 689</td><td class="val hl">R$ 799</td>
        </tr>
      </tbody>
    </table>
    <div class="note" style="margin-top:20px">◆ Valores <b>por pessoa</b>. O <b>espaço exclusivo</b> já está incluso no nível Básico. Cada nível seguinte acrescenta: <b>foto profissional & coffee break</b> e, no Completo, <b>personalização com a marca + lembrancinha</b> pra cada convidado.</div>
    {foot("Investimento")}
  </section>'''

personaliza = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O toque Riachuelo</span></div>
    </div>
    <span class="eyebrow orange">◆ No plano Completo</span>
    <h2>Com a cara da <em>sua empresa</em></h2>
    <p class="lead">O encontro sai com a identidade da Riachuelo — pra virar memória do time e conteúdo lindo pra marca.</p>
    <div class="rule"></div>
    <div class="plans">
      <div class="plan">
        <div class="plan-photo sq"><img src="assets/rockworld1.jpg" alt="Momento do time registrado por um fotógrafo" style="object-position:center 45%"></div>
        <div class="plan-body">
          <span class="tag basic">Incluso</span>
          <h3>Registro fotográfico profissional</h3>
          <ul class="feat">
            <li>Um fotógrafo cobre o encontro inteiro</li>
            <li>Cada risada e cada criação registradas</li>
            <li>Álbum digital lindo pra usar como quiser</li>
          </ul>
          <span class="allin">Memória (e conteúdo) pra marca</span>
        </div>
      </div>
      <div class="plan featured">
        <span class="ribbon">★ Com a sua marca</span>
        <div class="plan-photo sq"><img src="assets/nivergibrinde.jpg" alt="Kit personalizado com o nome de cada convidado" style="object-position:center 35%"></div>
        <div class="plan-body">
          <span class="tag premium">Personalização</span>
          <h3>Kits &amp; lembrancinhas</h3>
          <ul class="feat">
            <li>Cada convidado leva uma lembrancinha da Riachuelo</li>
            <li>Kit e brinde com o nome de cada um</li>
            <li>Mesa de boas-vindas com a identidade da marca</li>
          </ul>
          <span class="allin">Cada um leva o seu mimo</span>
        </div>
      </div>
    </div>
    {foot("O toque Riachuelo")}
  </section>'''

como = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Como funciona &amp; contato</span></div>
    </div>
    <span class="eyebrow orange">◆ Simples e sob medida</span>
    <h2>É só <em>reunir o time</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pra o encontro ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Escolhem experiência + nível</h3><p>Do menu criativo, no nível Básico, Intermediário ou Completo.</p></div>
      <div class="step"><div class="num">2</div><h3>Num espaço exclusivo</h3><p>Só de vocês — a gente cuida do espaço, do material, da condução e da estrutura.</p></div>
      <div class="step"><div class="num">3</div><h3>O time vive e integra</h3><p>Vocês só chegam, criam juntos e se conectam.</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Momento da empresa</h4>
        <p>Reservem <b>+1h no mesmo encontro</b> pra fala, brinde e agradecimento do time — assim vocês têm o período todo, sem correria. <b>Sem custo adicional: é por nossa conta.</b></p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora integrar o time da <em>Riachuelo?</em> ✦</h2>
      <p>Me conta qual experiência e qual plano mais chamaram, que a gente fecha cada detalhe do encontro de 02 de setembro.</p>
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
    <p class="fineprint">Proposta de experiências criativas para integração de time, para cerca de 20 participantes, em espaço exclusivo. Coleção Essencial a partir de R$ 289/pessoa (Crochê, Cerâmica, Perfumaria, Pintura em vidro, Sabonete, Vela). Coleção Premium a partir de R$ 589/pessoa (Tufting, Joalheria, Gastronomia & Bartenderia). Cada nível acrescenta foto profissional & coffee break e, no Completo, personalização com a marca + lembrancinha. Cada experiência dura cerca de 2h30–3h, com +1h para o momento da empresa, sem custo adicional. Proposta válida mediante confirmação de data (02 de setembro) e disponibilidade de agenda.</p>
    {foot("Experiência Corporativa · Riachuelo · 2026")}
  </section>'''

deck = '<div class="deck">\n' + cover + buscamos + espaco + menu + planos + personaliza + como + '\n\n</div>\n\n'
# fix title/meta
head = head.replace("<title>Experiência Corporativa · Elarah × Compass</title>", "<title>Experiência Corporativa · Elarah × Riachuelo</title>")
head = re.sub(r'<meta name="description"[^>]*>', '<meta name="description" content="Proposta de experiência corporativa criativa da Elarah para a Riachuelo — menu de experiências e planos de integração.">', head)
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-corporativa-riachuelo.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| Compass refs:", html.count("Compass"), "| slides: 7")
