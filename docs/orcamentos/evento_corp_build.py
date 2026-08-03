# Riachuelo corporate deck v2 — RED palette, creative experience menu + 3-tier plans.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

# ---- recolor CSS to warm terracotta + deep plum + cream (beleza & bem-estar) ----
head = head.replace("--orange:#F27623;", "--orange:#C0705E;")       # accent: terracotta-rose
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#9E5344;")
head = head.replace("--navy:#16233C;", "--navy:#2F2530;")           # deep espresso-plum (headings/dark)
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#6B5F64;") # muted plum-gray for lead
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#C0705E;")
head = head.replace("#EDF1F7", "#F5ECE8").replace("#DCE5F1", "#EAD8D0")
head = head.replace("#FF9A4D", "#E0A491")
head = head.replace("rgba(242,118,35,.22)", "rgba(192,112,94,.30)")
head = head.replace("#E6F0E9", "#F5ECE7")  # itable highlight -> blush
# extra CSS: experience menu grid + 3-plan variant
extra = '''
  .menu{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:10px}
  .exp{position:relative;width:calc(33.333% - 11px);background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 14px 32px -22px rgba(0,0,0,.34)}
  .exp .top{position:absolute;top:11px;left:11px;z-index:3;background:var(--orange);color:#fff;font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:5px 11px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(158,83,68,.6)}
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
  .itable .hl{background:#E6F0E9}
  .itable thead th.hl{color:var(--orange-dark)}
  .itable tbody tr:last-child td{border-bottom:none}
  .itable thead th.hl{position:relative}
  .itable .pill{display:inline-block;background:var(--navy);color:#fff;font-size:8px;letter-spacing:.08em;padding:3px 9px;border-radius:999px;margin-bottom:7px;font-weight:700;text-transform:uppercase}
  /* espaço exclusivo — fotos quadradas */
  .spaces{display:flex;gap:26px;justify-content:center;margin-top:20px}
  .space{width:330px;max-width:42%;margin:0}
  .space .sq{aspect-ratio:1/1;border-radius:16px;overflow:hidden;box-shadow:0 22px 46px -26px rgba(0,0,0,.42)}
  .space .sq img{width:100%;height:100%;object-fit:cover;display:block}
  .space figcaption{margin-top:13px;text-align:center;font-family:'DM Serif Display',serif;font-size:15.5px;color:var(--navy)}
  /* logo co-brand na capa */
  .cllogo{height:29px;width:auto;display:block;margin:3px 0 1px}
  .cbsub{font-size:8.5px;letter-spacing:.28em;color:var(--navy-soft);font-weight:500;text-transform:uppercase}
  /* rodízio (duas turmas) */
  .rounds{display:flex;align-items:center;justify-content:center;gap:20px;margin-top:22px}
  .round{flex:1;max-width:320px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:22px 24px;box-shadow:0 14px 30px -24px rgba(0,0,0,.3)}
  .round.hl2{border:1.6px solid var(--orange)}
  .rtag{display:inline-block;background:var(--navy);color:#fff;font-size:10px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;padding:5px 13px;border-radius:999px;margin-bottom:14px}
  .rpair{display:flex;align-items:center;gap:10px;margin-top:11px}
  .rpair .turma{font-family:'DM Serif Display',serif;font-size:16px;color:var(--navy);width:70px;flex:none}
  .rpair .rarrow{color:var(--orange);font-weight:700;font-size:15px}
  .rpair .rexp{font-size:13px;color:var(--ink);background:#F5ECE8;border-radius:8px;padding:5px 12px}
  .rswap{display:flex;flex-direction:column;align-items:center;color:var(--orange);flex:none}
  .rswap span{font-size:32px;line-height:1}
  .rswap small{font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-top:5px}
</style>'''
head = head.replace("</style>", extra, 1)
# print overrides for grid
head = head.replace(".menu-cols{grid-template-columns:1fr 1fr}",
                    ".menu-cols{grid-template-columns:1fr 1fr}\n    .menu{gap:13px}\n    .exp{width:calc(33.333% - 9px)}\n    .exp-photo{height:100px}\n    .exp-body{padding:9px 12px 11px}\n    .exp h3{font-size:15px}\n    .exp p{font-size:10px;margin-top:3px;line-height:1.32}")
# mobile: menu single col
head = head.replace(".plans{grid-template-columns:1fr}",
                    ".plans{grid-template-columns:1fr}\n    .exp{width:100%}")

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
        <span class="compass">Evento de <span>fim de ano</span><small>07 ou 14 de dezembro</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência Corporativa · Integração</span>
        <h1>Experiências<br>que <em>integram</em></h1>
        <p class="lead">Um encontro criativo e sensorial pra <strong>integrar os times de verdade</strong> — leve, sofisticado e com a mão na massa. Em <strong>duas turmas em rodízio</strong>, pra ninguém ficar de fora. A gente leva tudo até vocês.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>50 pessoas</b></span>
          <span class="chip"><b>07 ou 14</b> de dezembro</span>
          <span class="chip">Criativo · <b>bem-estar</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/eventocorporativo.jpg" alt="Time reunido em um encontro Elarah, criando e se conectando">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Já realizado para times como <b>Compass</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)</div>
    {foot("Experiência Corporativa · Integração")}
  </section>'''

buscamos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Pensado pro seu time</span></div>
    </div>
    <span class="eyebrow orange">◆ O que buscamos</span>
    <h2>Times mais <em>conectados</em></h2>
    <p class="lead">Momentos de <strong>mão na massa</strong>, leves e sensoriais, em que o que importa é criar junto. Experiências pensadas pra soltar as pessoas, aproximar as áreas e cuidar do time — pra qualquer pessoa, sem talento nenhum.</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#C0705E" stroke-width="1.6"><circle cx="10.5" cy="14" r="6"/><circle cx="17.5" cy="14" r="6"/></svg></div><h3>Conexão de verdade</h3><p>Todo mundo criando junto — a atividade é o pretexto; a integração é o que fica.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#C0705E" stroke-width="1.6" stroke-linejoin="round"><path d="M14 3.5 L16 12 L24.5 14 L16 16 L14 24.5 L12 16 L3.5 14 L12 12 Z"/></svg></div><h3>Criativo & bem-estar</h3><p>Experiências autorais e sensoriais — cada um cria e leva a sua peça pra casa.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#C0705E" stroke-width="1.6" stroke-linejoin="round"><path d="M4 14 h7 M17 14 h7 M11 9 l3 5 -3 5 M17 9 l-3 5 3 5"/></svg></div><h3>Duas turmas em rodízio</h3><p>50 pessoas divididas em duas turmas que se revezam — atenção de verdade pra todo mundo.</p></div>
    </div>
    <div class="quote">
      <i>"Os melhores times se constroem fora da mesa de reunião."</i><br>
      — É isso que a Elarah leva pro seu time: um encontro que vira <strong>história pra contar no corredor</strong>.
    </div>
    {foot("Pensado pro seu time")}
  </section>'''

menu = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O menu</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham as experiências</span>
    <h2>Um menu <em>curado</em></h2>
    <p class="lead">Sete experiências que combinam com os dois times — <strong>criativas e de bem-estar</strong>. No rodízio, cada turma vive duas delas.</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","perfumariaharbolita.jpg","Perfumaria Natural","Crie a sua fragrância botânica, numa imersão sensorial.","Essências e frascos de perfumaria","center 45%")}
      {exp("02","velaaromatica.jpg","Vela Aromática","Crie a sua vela perfumada, do aroma ao rótulo.","Vela aromática artesanal")}
      {exp("03","saboneteroxo.jpg","Sabonete Artesanal","Crie os próprios sabonetes botânicos, com aroma e cor.","Sabonetes artesanais de lavanda")}
      {exp("04","fazendojoia.jpg","Joalheria","Crie a própria joia — anel, colar ou pingente, pra usar.","Mãos criando uma joia à mão","center 40%")}
      {exp("05","desp-hero4.jpg","Cerâmica","Modelagem ou pintura em cerâmica — leve a sua peça.","Mesa montada para experiência de cerâmica","center 30%")}
      {exp("06","tufting6.jpg","Tufting","Com a pistola de tufting, crie a sua peça decorativa.","Time exibindo peças de tufting")}
      {exp("07","massamolho.jpg","Gastronomia &amp; Bartenderia","Cozinhem juntos ou criem drinks autorais — unissex e social.","Prato preparado numa aula de gastronomia", top="★ Top 1")}
    </div>
    {foot("O menu")}
  </section>'''

rodizio = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O formato</span></div>
    </div>
    <span class="eyebrow orange">◆ Pensado pra 50 pessoas</span>
    <h2>Duas turmas, <em>em rodízio</em></h2>
    <p class="lead">Com 50 pessoas, atenção é tudo. Dividimos o time em <strong>duas turmas</strong>: enquanto uma vive uma experiência, a outra vive outra — e, no meio do caminho, <strong>trocam</strong>. No fim, todo mundo fez as duas, sem correria.</p>
    <div class="rule"></div>
    <div class="rounds">
      <div class="round">
        <span class="rtag">1ª rodada</span>
        <div class="rpair"><span class="turma">Turma A</span><span class="rarrow">→</span><span class="rexp">Experiência 1</span></div>
        <div class="rpair"><span class="turma">Turma B</span><span class="rarrow">→</span><span class="rexp">Experiência 2</span></div>
      </div>
      <div class="rswap"><span>⇅</span><small>trocam</small></div>
      <div class="round">
        <span class="rtag">2ª rodada</span>
        <div class="rpair"><span class="turma">Turma A</span><span class="rarrow">→</span><span class="rexp">Experiência 2</span></div>
        <div class="rpair"><span class="turma">Turma B</span><span class="rarrow">→</span><span class="rexp">Experiência 1</span></div>
      </div>
    </div>
    <div class="note" style="margin-top:22px">◆ <b>Experiências complementares</b> — combinamos duas que conversam entre si (ex.: perfumaria &amp; vela, ou cerâmica &amp; tufting). Uma pausa entre as rodadas pra todo mundo respirar e trocar ideia.</div>
    {foot("O formato · rodízio")}
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
    <div class="spaces">
      <figure class="space"><div class="sq"><img src="assets/espaco1.jpg" alt="Lounge do espaço exclusivo" style="object-position:center 55%"></div><figcaption>Lounge acolhedor</figcaption></figure>
      <figure class="space"><div class="sq"><img src="assets/espa%C3%A7o2.jpg" alt="Cozinha equipada do espaço exclusivo"></div><figcaption>Cozinha equipada</figcaption></figure>
    </div>
    {foot("O espaço exclusivo")}
  </section>'''

def prow(tag, tagcls, name, more, feats, hl=False):
    fl = "".join(f"<li>{x}</li>" for x in feats)
    mlab = f'<div class="mlab">{more}</div>' if more else ''
    cls = "prow hl" if hl else "prow"
    return f'''<div class="{cls}">
        <div class="pl">
          <span class="tag {tagcls}">{tag}</span>
          <h3>{name}</h3>
          <div class="pc">sob consulta<small>por pessoa</small></div>
        </div>
        <div class="pr">{mlab}<ul>{fl}</ul></div>
      </div>'''

planos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ Como monta o valor</span>
    <h2>Vocês montam o <em>rodízio</em></h2>
    <p class="lead">Cada experiência tem o seu valor. Como no rodízio cada pessoa vive <strong>duas</strong>, o valor por pessoa é a <strong>soma das duas escolhidas</strong> — no nível que preferirem.</p>
    <div class="rule"></div>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th>A experiência<span>material & condução</span></th>
        <th>+ coffee & foto<span>+ foto profissional & coffee break</span></th>
        <th class="hl"><span class="pill">★ Mais completo</span><br>Completo<span>+ personalização & lembrancinha</span></th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="rl"><b>Perfumaria · Vela · Cerâmica · Sabonete</b><span>As quatro pelo mesmo valor</span></td>
          <td class="val">R$ 199</td><td class="val">R$ 299</td><td class="val hl">R$ 399</td>
        </tr>
        <tr>
          <td class="rl"><b>Gastronomia & Bartenderia</b><span>Aula de gastronomia ou bartenderia</span></td>
          <td class="val">R$ 459</td><td class="val">R$ 559</td><td class="val hl">R$ 659</td>
        </tr>
        <tr>
          <td class="rl"><b>Joalheria & Tufting</b><span>As mais especiais, com equipamento</span></td>
          <td class="val">R$ 579</td><td class="val">R$ 679</td><td class="val hl">R$ 779</td>
        </tr>
      </tbody>
    </table>
    <div class="note" style="margin-top:18px">◆ <b>No rodízio, some as duas.</b> Ex.: Perfumaria <i>(R$ 199)</i> + Joalheria <i>(R$ 579)</i>, no nível inicial = <b>R$ 778 por pessoa</b>. Valores por pessoa — a experiência acontece <b>no espaço de vocês</b>, com material e condução inclusos.</div>
    {foot("Investimento")}
  </section>'''

personaliza = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O toque da sua marca</span></div>
    </div>
    <span class="eyebrow orange">◆ No nível Completo</span>
    <h2>Com a cara da <em>sua empresa</em></h2>
    <p class="lead">O encontro sai com a identidade da empresa — pra virar memória do time e conteúdo lindo pra marca.</p>
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
        <div class="plan-photo sq"><img src="assets/kitempresa.jpg" alt="Kit corporativo personalizado com a marca da empresa" style="object-position:center"></div>
        <div class="plan-body">
          <span class="tag premium">Personalização</span>
          <h3>Kits &amp; lembrancinhas</h3>
          <ul class="feat">
            <li>Cada convidado leva uma lembrancinha da empresa</li>
            <li>Kit e brinde com o nome de cada um</li>
            <li>Mesa de boas-vindas com a identidade da marca</li>
          </ul>
          <span class="allin">Cada um leva o seu mimo</span>
        </div>
      </div>
    </div>
    {foot("O toque da sua marca")}
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
      <div class="step"><div class="num">1</div><h3>Escolhem 2 experiências + nível</h3><p>Do menu curado, pro rodízio das duas turmas, no nível que preferirem.</p></div>
      <div class="step"><div class="num">2</div><h3>No espaço de vocês</h3><p>A gente leva material, condução e estrutura até o local de vocês — é só receber o time.</p></div>
      <div class="step"><div class="num">3</div><h3>As turmas vivem e trocam</h3><p>Metade vive uma experiência, a outra vive outra — e no meio, trocam.</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Momento da empresa</h4>
        <p>Reservem <b>+1h no mesmo encontro</b> pra fala, brinde e agradecimento do time — assim vocês têm o período todo, sem correria. <b>Sem custo adicional: é por nossa conta.</b></p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora integrar o <em>seu time?</em> ✦</h2>
      <p>Me conta quais experiências mais chamaram e qual nível, que a gente fecha cada detalhe do encontro de dezembro.</p>
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
    <p class="fineprint">Proposta de experiências criativas e de bem-estar para integração de time, para cerca de 50 participantes, em duas turmas de rodízio, no espaço da empresa. Cada pessoa vive duas experiências complementares do menu curado (Perfumaria, Vela Aromática, Sabonete, Cerâmica, Joalheria, Tufting, Gastronomia & Bartenderia). Valor por pessoa é a soma das duas experiências escolhidas: Perfumaria, Vela, Cerâmica e Sabonete a partir de R$ 199 (níveis R$ 199/299/399); Gastronomia & Bartenderia a partir de R$ 459 (R$ 459/559/659); Joalheria & Tufting a partir de R$ 579 (R$ 579/679/779), conforme o nível (A experiência / + foto profissional & coffee break / Completo + personalização & lembrancinha), subindo R$ 100 por nível. A Elarah leva material, condução e estrutura até o local. O encontro dura o período, com +1h para o momento da empresa, sem custo adicional. Proposta válida mediante confirmação de data (07 ou 14 de dezembro) e disponibilidade de agenda.</p>
    {foot("Experiência Corporativa · 2026")}
  </section>'''

deck = '<div class="deck">\n' + cover + buscamos + rodizio + menu + planos + personaliza + como + '\n\n</div>\n\n'
# fix title/meta
head = head.replace("<title>Experiência Corporativa · Elarah × Compass</title>", "<title>Experiência Corporativa · Elarah</title>")
head = re.sub(r'<meta name="description"[^>]*>', '<meta name="description" content="Proposta de experiência corporativa da Elarah — menu de experiências criativas e de bem-estar, em duas turmas de rodízio.">', head)
html = head.replace("#2E7D5E", "#C0705E") + deck + tail
out = "/home/user/elarahplatform/experiencia-corporativa-evento.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides: 8 | remaining Riachuelo:", html.count("Riachuelo"))
