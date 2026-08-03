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
  .exp{position:relative;width:calc(50% - 9px);background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .exp .top{position:absolute;top:12px;left:12px;z-index:3;background:var(--orange);color:#fff;font-size:9.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:5px 12px;border-radius:999px;box-shadow:0 6px 14px -4px rgba(158,52,83,.55)}
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
        <span class="compass">Vela &amp; Vinho · <span>Tinta &amp; Vinho</span><small>Pinheiros · setembro</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência · Vela &amp; Vinho · Tinta &amp; Vinho</span>
        <h1>Uma noite de<br>criar com <em>vinho</em></h1>
        <p class="lead">Uma noite pra sair da rotina — <strong>mão na massa e taça de vinho na mão</strong>. Cada uma cria a própria peça e leva pra casa, num espaço charmoso em Pinheiros. Tudo <strong>à vontade</strong>. 🕯️🍷</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>~30</b> mulheres</span>
          <span class="chip">Segunda · setembro · <b>19h30</b></span>
          <span class="chip">Casa Aquário · <b>Pinheiros</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/pintura.jpg" alt="Grupo de mulheres pintando em telas numa oficina, com taças e flores" style="object-position:center 30%">
      </div>
    </div>
    {foot("Experiência · Vela &amp; Vinho · Tinta &amp; Vinho")}
  </section>'''

buscamos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Pensado pra soltar o time</span></div>
    </div>
    <span class="eyebrow orange">◆ O que a gente leva</span>
    <h2>Uma noite que <em>relaxa</em></h2>
    <p class="lead">Momentos de <strong>mão na massa e taça de vinho na mão</strong>, leves e cheios de risada, no fim de um dia de trabalho. Uma experiência pensada pra soltar o grupo, aproximar as pessoas e render fotos lindas — pra qualquer uma, sem talento nenhum.</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#B14A6B" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3.5h12l-1 8a5 5 0 0 1-10 0z"/><path d="M14 16.5v6M10 22.5h8"/></svg></div><h3>Criativo & com vinho</h3><p>Mão na massa e taça na mão — cada uma cria a sua peça e brinda com o time.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#B14A6B" stroke-width="1.6" stroke-linejoin="round"><path d="M14 24s-8.5-5-8.5-11a4.8 4.8 0 0 1 8.5-3 4.8 4.8 0 0 1 8.5 3c0 6-8.5 11-8.5 11z"/></svg></div><h3>Só de vocês</h3><p>Turma privada — o grupo inteiro criando e curtindo junto, num espaço só de vocês.</p></div>
      <div class="infocard"><div class="ico"><svg viewBox="0 0 28 28" fill="none" stroke="#B14A6B" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 21V11l10.5-7 10.5 7v10"/><path d="M10 21v-6h8v6"/></svg></div><h3>Tudo incluso</h3><p>Espaço, material, condução e o <b>vinho à vontade</b> — por nossa conta. Vocês só chegam.</p></div>
    </div>
    <div class="quote">
      <i>"As melhores histórias começam com um brinde."</i><br>
      — É isso que a Elarah leva: uma noite que vira <strong>memória (e foto linda)</strong>. 🍷
    </div>
    {foot("Pensado pra soltar o time")}
  </section>'''

menu = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O menu</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham a experiência</span>
    <h2>Duas experiências <em>com vinho</em></h2>
    <p class="lead">Duas oficinas deliciosas — as duas pelo <strong>mesmo valor</strong>, é só escolher a favorita do grupo. Em ambas, cada uma cria a própria peça, leva pra casa e brinda com <strong>vinho à vontade</strong>. 🍷</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","velaaromatica.jpg","Vela &amp; Vinho","Cada uma cria a própria vela aromática, do aroma ao rótulo — enquanto brinda com uma taça de vinho na mão.","Vela aromática artesanal num vidro elegante","center 50%",top="🍷 Vinho à vontade")}
      {exp("02","quadropintado.jpg","Tinta &amp; Vinho","Pintura em tela: cada uma pinta o próprio quadro num cavalete, com taça de vinho e muita risada. Leve a sua arte pra casa.","Telas pintadas à mão numa oficina de pintura","center 60%",top="🍷 Vinho à vontade")}
    </div>
    {foot("O menu")}
  </section>'''

espacos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Onde acontece</span></div>
    </div>
    <span class="eyebrow orange">◆ Já incluso</span>
    <h2>Na <em>Casa Aquário</em></h2>
    <p class="lead">Um casarão charmoso e cheio de personalidade em <strong>Pinheiros</strong> (R. Filipe de Alcaçova, 38), só de vocês pra viver a noite. Ambiente artístico e acolhedor — o cenário perfeito pra criar, relaxar e brindar.</p>
    <div class="rule"></div>
    <div class="bfeat" style="height:230px">
      <div class="bphoto"><img src="assets/casaaquario1.jpg" alt="Lounge acolhedor e artístico da Casa Aquário" style="object-position:center 45%"></div>
      <div class="bbody">
        <span class="btag">★ Espaço incluso</span>
        <h3>Casa Aquário <span class="sub">Pinheiros</span></h3>
        <p>Um casarão cheio de charme e arte, só de vocês. A gente reserva o espaço e leva toda a estrutura — vocês só chegam e curtem a noite. 🍷</p>
      </div>
    </div>
    <div class="bfeat plain" style="margin-top:16px;height:190px">
      <div class="bphoto"><img src="assets/casaaquario.jpg" alt="Cantinho verde e aconchegante da Casa Aquário" style="object-position:center 45%"></div>
      <div class="bbody">
        <span class="btag soft">O clima</span>
        <h3>Aconchegante <span class="sub">e cheio de charme</span></h3>
        <p>Cantinhos verdes, luz quentinha e uma atmosfera artística que combina demais com uma noite de criar com vinho na mão.</p>
      </div>
    </div>
    {foot("Onde acontece · Casa Aquário")}
  </section>'''

planos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ Um valor, tudo incluso</span>
    <h2>Tudo à vontade por <em>R$ 269</em></h2>
    <p class="lead">Um valor único <strong>por pessoa</strong>, igual pras duas experiências. É só escolher entre Vela &amp; Vinho ou Tinta &amp; Vinho — o resto é por nossa conta. 🍷</p>
    <div class="rule"></div>
    <div style="display:flex;gap:34px;align-items:center;margin-top:26px;flex-wrap:wrap;justify-content:center">
      <div style="text-align:center;min-width:210px">
        <div style="font-family:'DM Serif Display',serif;font-size:74px;color:var(--navy);line-height:.95">R$ 269</div>
        <div style="font-size:11.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-top:8px">por pessoa · tudo à vontade</div>
        <div style="margin-top:12px;display:inline-block;background:var(--orange);color:#fff;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:6px 14px;border-radius:999px">Vela &amp; Vinho · Tinta &amp; Vinho</div>
      </div>
      <ul class="feat" style="flex:1;min-width:280px;font-size:14.5px;line-height:1.5">
        <li>Espaço exclusivo na <b>Casa Aquário</b> (Pinheiros)</li>
        <li>A <b>experiência à escolha</b> — Vela ou Tinta</li>
        <li><b>Vinho à vontade</b> a noite toda 🍷</li>
        <li>Todo o <b>material, condução e estrutura</b></li>
        <li>Cada uma leva a <b>própria criação</b> pra casa</li>
      </ul>
    </div>
    <div class="note" style="margin-top:24px">◆ Valor <b>por pessoa</b>, turma de ~30 mulheres, numa segunda de setembro às 19h30. Espaço, experiência e vinho — <b>tudo à vontade e já incluso</b>.</div>
    {foot("Investimento")}
  </section>'''

personaliza = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Extras opcionais</span></div>
    </div>
    <span class="eyebrow orange">◆ Se quiserem deixar ainda mais completo</span>
    <h2>Dois <em>extras</em> pra somar</h2>
    <p class="lead">Além da peça que cada uma cria, dá pra somar dois mimos que deixam a noite inesquecível — a foto profissional e a lembrancinha personalizada com a marca da empresa.</p>
    <div class="rule"></div>
    <div class="plans">
      <div class="plan">
        <div class="plan-photo sq"><img src="assets/aniv-adulto.jpg" alt="Grupo de mulheres reunidas, registradas por um fotógrafo" style="object-position:center 30%"></div>
        <div class="plan-body">
          <span class="tag basic">Extra opcional</span>
          <h3>Registro fotográfico profissional</h3>
          <ul class="feat">
            <li>Um fotógrafo cobre a noite inteira</li>
            <li>Cada brinde e cada criação registrados</li>
            <li>Álbum digital lindo pra empresa usar e postar</li>
          </ul>
          <span class="allin">A memória da noite, pra sempre</span>
        </div>
      </div>
      <div class="plan featured">
        <span class="ribbon">★ Com a marca</span>
        <div class="plan-photo sq"><img src="assets/kitempresa.jpg" alt="Kit personalizado com a identidade da empresa" style="object-position:center 50%"></div>
        <div class="plan-body">
          <span class="tag premium">Personalização</span>
          <h3>Lembrancinha personalizada</h3>
          <ul class="feat">
            <li>Um kit personalizado pra cada convidada</li>
            <li>Com o nome e a identidade da empresa</li>
            <li>Um mimo pra levarem da noite pra casa</li>
          </ul>
          <span class="allin">Cada uma leva o seu mimo</span>
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
    <h2>É só <em>reunir o time</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pra a noite ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="steps">
      <div class="step"><div class="num">1</div><h3>Escolhem a experiência</h3><p>Vela &amp; Vinho ou Tinta &amp; Vinho (pintura em tela) — pelo mesmo valor.</p></div>
      <div class="step"><div class="num">2</div><h3>Na Casa Aquário</h3><p>A gente reserva o espaço em Pinheiros e leva material, condução e o vinho — é só chegar.</p></div>
      <div class="step"><div class="num">3</div><h3>É só brindar</h3><p>Vocês criam junto, relaxam e cada uma leva a própria peça pra casa. 🍷</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4>Um momento da empresa</h4>
        <p>Reservem um espacinho na noite pra uma <b>fala ou brinde do time</b> — a gente encaixa naturalmente, sem custo adicional. 💛</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora soltar o <em>time?</em> ✦</h2>
      <p>Me conta qual experiência mais chamou, que a gente fecha a data da segunda de setembro e cada detalhe da noite.</p>
      <div class="cta-actions">
        <a class="btn-wa" href="https://wa.me/5511914455930?text=Oi%2C%20Elarah!%20Vi%20a%20proposta%20de%20Vela%20%26%20Vinho%20e%20quero%20fechar%20os%20detalhes." target="_blank" rel="noopener">
          💬 Falar no WhatsApp
        </a>
        <div class="contact-links">
          <span>+55 (11) 91445-5930</span>
          <a href="https://instagram.com/elarah.oficial" target="_blank" rel="noopener">@elarah.oficial</a>
          <a href="https://elarah.com.br" target="_blank" rel="noopener">elarah.com.br</a>
        </div>
      </div>
    </div>
    <p class="fineprint">Proposta de experiência corporativa da Elarah para uma noite de integração do time, turma de cerca de 30 mulheres, numa segunda-feira de setembro às 19h30, na Casa Aquário (R. Filipe de Alcaçova, 38 · Pinheiros · São Paulo). Experiência à escolha, pelo mesmo valor: Vela &amp; Vinho (criação de vela aromática) ou Tinta &amp; Vinho (pintura em tela). Valor único de R$ 269 por pessoa, com espaço exclusivo, experiência, vinho à vontade, material, condução e estrutura inclusos — cada participante leva a própria criação. Extras opcionais: registro fotográfico profissional e lembrancinha personalizada com a marca da empresa. Inclui um momento para fala/brinde do time, sem custo adicional. Proposta válida mediante confirmação de data e disponibilidade de agenda.</p>
    {foot("Experiência · Vela &amp; Vinho · Tinta &amp; Vinho · 2026")}
  </section>'''

deck = '<div class="deck">\n' + cover + buscamos + menu + espacos + planos + personaliza + como + '\n\n</div>\n\n'
# fix title/meta
head = head.replace("<title>Experiência Corporativa · Elarah × Compass</title>", "<title>Vela &amp; Vinho · Tinta &amp; Vinho · Elarah</title>")
head = re.sub(r'<meta name="description"[^>]*>', '<meta name="description" content="Proposta de experiência da Elarah — noite de Vela & Vinho ou Tinta & Vinho na Casa Aquário, Pinheiros.">', head)
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-vela-tinta-vinho.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
print("slides:", html.count('<section class="slide">'),
      "| embedded fonts:", html.count("data:font")+html.count("data:application"),
      "| leftover google link:", html.count("googleapis.com"),
      "| Compass refs:", html.count("Compass"), html.count("compass\">"))
