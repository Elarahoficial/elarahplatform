# Aniversario · Bartenderia & Drinks (aprender drinks, harmonizacao, aula gastronomica) · 05/09 · 10-20 pax · ~R$425. Amber.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
base = open(S + "/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

# ---- recolor: rosé-macaron (doce, feminino) ----
head = head.replace("--orange:#F27623;", "--orange:#B8863F;")
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#8F6626;")
head = head.replace("--navy:#16233C;", "--navy:#241F1A;")
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#665E52;")
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#B8863F;")
head = head.replace("#EDF1F7", "#F7F1E6").replace("#DCE5F1", "#EEE1C9")
head = head.replace("#FF9A4D", "#D6B472")
head = head.replace("rgba(242,118,35,.22)", "rgba(184,134,63,.26)")

extra = '''
  /* feature (foto + texto) */
  .bfeat{display:grid;grid-template-columns:48% 1fr;margin-top:16px;background:var(--card);border:1.6px solid var(--orange);border-radius:18px;overflow:hidden;box-shadow:0 18px 42px -24px rgba(0,0,0,.3)}
  .bfeat .bphoto{overflow:hidden;background:#eee;position:relative;min-height:330px}
  .bfeat .bphoto img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .bfeat .bbody{padding:24px 30px 26px;display:flex;flex-direction:column;justify-content:center}
  .bfeat .btag{align-self:flex-start;background:var(--navy);color:#fff;font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:6px 13px;border-radius:999px;margin-bottom:12px}
  .bfeat h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:25px;color:var(--navy);line-height:1.05}
  .bfeat ul.feat{list-style:none;display:flex;flex-direction:column;gap:10px;margin-top:14px}
  .bfeat ul.feat li{position:relative;padding-left:26px;font-size:13px;color:var(--ink);line-height:1.35}
  .bfeat ul.feat li b{font-weight:700;color:var(--navy)}
  .bfeat ul.feat li .st{position:absolute;left:0;top:-1px;width:18px;height:18px;border-radius:999px;background:var(--orange);color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center}
  /* vibe */
  .vibe{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
  .vibe figure{margin:0;border-radius:16px;overflow:hidden;position:relative;aspect-ratio:3/4;box-shadow:0 16px 36px -24px rgba(0,0,0,.34)}
  .vibe img{width:100%;height:100%;object-fit:cover;display:block}
  .vibe figcaption{position:absolute;left:0;right:0;bottom:0;padding:28px 14px 13px;color:#fff;font-size:12.5px;font-weight:600;background:linear-gradient(to top,rgba(28,22,16,.82),transparent)}
  /* venue cards */
  .vgrid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:16px}
  .vcard{background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 36px -24px rgba(0,0,0,.3);position:relative}
  .vcard.hl{border:2px solid var(--navy)}
  .vph{height:196px;overflow:hidden;position:relative;background:#eee}
  .vph img{width:100%;height:100%;object-fit:cover}
  .vpr{position:absolute;top:12px;right:12px;background:var(--navy);color:#fff;border-radius:14px;padding:7px 14px;text-align:center}
  .vpr b{font-family:'DM Serif Display',serif;font-size:22px;font-weight:400;line-height:1;display:block}
  .vpr small{font-size:8px;letter-spacing:.1em;text-transform:uppercase;font-weight:600;opacity:.85}
  .vb{padding:18px 22px 20px;flex:1;display:flex;flex-direction:column}
  .vt{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin-bottom:5px}
  .vcard h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:21px;color:var(--navy);line-height:1.05}
  .vaddr{font-size:11.5px;color:var(--muted);margin-top:6px;line-height:1.45}
  .vcard ul{list-style:none;margin-top:12px;display:flex;flex-direction:column;gap:6px}
  .vcard ul li{position:relative;padding-left:18px;font-size:11.5px;color:var(--ink);line-height:1.3}
  .vcard ul li::before{content:"✦";position:absolute;left:0;top:1px;color:var(--orange);font-size:10px}
  .pslot{width:100%;height:100%;border:2px dashed var(--orange);background:rgba(168,88,71,.09);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;text-align:center;box-sizing:border-box;padding:14px}
  .pslot .pi{font-size:22px}
  .pslot .pl{font-family:'DM Serif Display',serif;font-size:15px;color:var(--navy)}
  .pslot .ps{font-size:9px;color:var(--muted);font-weight:600;letter-spacing:.05em;text-transform:uppercase}
  .fineprint{font-size:10px;color:var(--muted);line-height:1.5;margin-top:16px}
</style>'''
head = head.replace("</style>", extra, 1)

# ---- PDF: sombras borradas viram bloco cinza em leitores iOS — troca por bordas ----
head = head.replace(
    "    @page{size:A4 portrait;margin:0}",
    "    .slide *{box-shadow:none !important}\n"
    "    .cover-photo,.bfeat .bphoto,.vibe figure,.vcard,.vph{border:1px solid rgba(62,37,48,.14)}\n"
    "    .vibe{grid-template-columns:repeat(3,1fr)}\n"
    "    .vgrid{grid-template-columns:1fr 1fr}\n"
    "    .bfeat{grid-template-columns:48% 1fr}\n"
    "    @page{size:A4 portrait;margin:0}", 1)
head = head.replace(".plans{grid-template-columns:1fr}",
                    ".plans{grid-template-columns:1fr}\n    .vibe{grid-template-columns:1fr 1fr}\n    .vgrid{grid-template-columns:1fr}\n    .bfeat{grid-template-columns:1fr}\n    .bfeat .bphoto{min-height:200px}")


def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'


cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right">
        <span class="kicker">Proposta de experiência · Turma privada</span>
        <span class="compass">Bartenderia <span>&amp; Drinks</span><small>Aniversário</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Aniversário · Bartenderia &amp; harmonização</span>
        <h1>Um brinde <em>autoral</em></h1>
        <p class="lead">Uma experiência pra comemorar com estilo: uma <strong>aula de bartenderia</strong>, onde o grupo aprende a fazer os próprios drinks autorais, com <strong>harmonização</strong> e petiscos preparados na hora. Descontraído, saboroso e cheio de brinde. 🍸</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>05/09</b></span>
          <span class="chip"><b>10 a 20</b> pessoas</span>
          <span class="chip">Drinks <b>&amp; harmonização</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/drinksclassicos.jpg" alt="Drink autoral numa experiência de bartenderia da Elarah" style="object-position:center 50%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Experiências já realizadas para grupos como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)</div>
    {foot("Aniversário · Bartenderia & Drinks")}
  </section>'''

experiencia = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">A experiência</span></div>
    </div>
    <span class="eyebrow orange">◆ Bartenderia &amp; harmonização</span>
    <h2>Aprender a fazer <em>drinks</em></h2>
    <p class="lead">Guiados por um bartender, todos aprendem a montar os próprios drinks autorais — técnicas, dosagens e aquele toque especial — com harmonização e petiscos preparados na hora. No fim, é só brindar com o que vocês criaram. 🍸</p>
    <div class="bfeat">
      <div class="bphoto"><img src="assets/drinkspetisco.jpg" alt="Drinks autorais e harmonização com petiscos" style="object-position:center 50%"></div>
      <div class="bbody">
        <span class="btag">Como acontece</span>
        <h3>Uma tarde, do começo ao fim</h3>
        <ul class="feat">
          <li><span class="st">1</span><b>Boas-vindas</b> — um welcome drink e a bancada montada pra começar.</li>
          <li><span class="st">2</span><b>Mão na coqueteleira</b> — com o bartender, o grupo aprende a fazer os próprios drinks.</li>
          <li><span class="st">3</span><b>Harmonização</b> — os drinks encontram os petiscos, e é só brindar. 🥂</li>
        </ul>
      </div>
    </div>
    {foot("A experiência")}
  </section>'''

vibe = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">A vibe</span></div>
    </div>
    <span class="eyebrow orange">◆ O que vocês vão sentir</span>
    <h2>Do welcome drink ao <em>brinde</em></h2>
    <p class="lead">Mais que uma aula: um encontro animado e cheio de fotos boas — drinks autorais, harmonização e muita risada, do welcome drink ao último brinde. 🍸</p>
    <div class="vibe">
      <figure><img src="assets/drinks.jpg" alt="Drinks autorais feitos na aula" style="object-position:center 50%"><figcaption>Drinks autorais</figcaption></figure>
      <figure><img src="assets/harmonizacaoqueijos.jpg" alt="Harmonização de drinks com petiscos" style="object-position:center 50%"><figcaption>Harmonização &amp; petiscos</figcaption></figure>
      <figure><img src="assets/drinksmoleculares.jpg" alt="Coquetelaria criativa" style="object-position:center 50%"><figcaption>Toque de show</figcaption></figure>
    </div>
    {foot("A vibe da experiência")}
  </section>'''

vibe2 = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">A turma</span></div>
    </div>
    <span class="eyebrow orange">◆ Amigos reunidos</span>
    <h2>Risada garantida, <em>brinde na mão</em></h2>
    <p class="lead">No fim, o que fica é o encontro: gente junta, coqueteleira na mão, muita risada e aquele brinde que rende as melhores fotos. É a sua turma vivendo um momento só de vocês. 🥂</p>
    <div class="vibe">
      <figure><img src="assets/aula-risada.jpg" alt="Grupo rindo durante a experiência" style="object-position:center 40%"><figcaption>Risada garantida</figcaption></figure>
      <figure><img src="assets/aula-grupo.jpg" alt="Amigos preparando os próprios drinks juntos" style="object-position:center 45%"><figcaption>Mão na coqueteleira, juntos</figcaption></figure>
      <figure><img src="assets/jantar-vista.jpg" alt="Turma reunida à noite com drinks e boa vista" style="object-position:center 50%"><figcaption>A turma animada</figcaption></figure>
    </div>
    {foot("A vibe da experiência")}
  </section>'''

espacos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Escolha o seu <em>brinde</em></h2>
    <p class="lead">A experiência completa — bartender, drinks autorais, harmonização e petiscos — por <strong>R$ 425 por pessoa</strong>. E se quiserem um toque de amor a mais, dá pra viver tudo isso num <strong>casarão só de vocês</strong>, temático e decorado, por <strong>R$ 629 por pessoa</strong>.</p>
    <div class="vgrid">
      <div class="vcard">
        <div class="vph">
          <img src="assets/drinkspetisco.jpg" alt="Experiência de bartenderia com drinks e petiscos">
          <div class="vpr"><b>R$ 425</b><small>por pessoa</small></div>
        </div>
        <div class="vb">
          <span class="vt">A experiência</span>
          <h3>Bartenderia &amp; harmonização</h3>
          <p class="vaddr">A aula completa, num espaço a combinar.</p>
          <ul>
            <li>Bartender conduzindo a aula, do começo ao fim</li>
            <li>Drinks autorais — vocês aprendem e preparam</li>
            <li>Harmonização com petiscos na hora</li>
            <li>Todo o material, ingredientes e estrutura</li>
          </ul>
        </div>
      </div>
      <div class="vcard hl">
        <div class="vph">
          <img src="assets/casarao.jpg" alt="Casarão temático e decorado só para a sua turma">
          <div class="vpr"><b>R$ 629</b><small>por pessoa</small></div>
        </div>
        <div class="vb">
          <span class="vt">Um toque de amor</span>
          <h3>Casarão só de vocês</h3>
          <p class="vaddr">Uma casa temática, decorada e ambientada — pra vocês se sentirem nas nuvens.</p>
          <ul>
            <li>Tudo da experiência completa incluso</li>
            <li>Uma casa exclusiva, só pra sua turma</li>
            <li>Ambientação temática e decoração especial</li>
            <li>Clima de sonho do começo ao fim</li>
          </ul>
        </div>
      </div>
    </div>
    <div class="bnote" style="margin-top:16px;background:#F7F1E6;border-left:4px solid var(--orange);border-radius:0 12px 12px 0;padding:12px 18px;font-size:12px;color:var(--navy-soft);line-height:1.5">◆ Quer deixar ainda mais <b style="color:var(--navy)">exclusivo</b>? Dá pra incluir open bar premium e mais opções de drinks — a gente monta tudo sob medida. É só me contar o que vocês imaginam. 🥂</div>
    <p class="fineprint">Valores por pessoa, para a experiência de bartenderia &amp; harmonização, para um grupo de 10 a 20 pessoas, em 05/09 (a confirmar). Inclui bartender, drinks autorais, harmonização com petiscos, material e estrutura. Opção casarão (R$ 629) inclui a casa exclusiva, temática e decorada. Proposta válida mediante confirmação de data e disponibilidade de agenda.</p>
    {foot("Investimento")}
  </section>'''

proximos = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Próximos passos</span></div>
    </div>
    <span class="eyebrow orange">◆ Bora brindar? 🥂</span>
    <h2>É só <em>escolher</em></h2>
    <p class="lead">Me confirma a data (05/09) e a opção que a gente reserva tudo e organiza a experiência pra vocês. Qualquer dúvida, é só chamar. 🍸</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">1️⃣</div><h3>Escolham</h3><p>O número de pessoas e se querem a experiência ou o casarão exclusivo.</p></div>
      <div class="infocard"><div class="ico">2️⃣</div><h3>Reservamos</h3><p>A gente segura a agenda e o espaço pra sua turma.</p></div>
      <div class="infocard"><div class="ico">3️⃣</div><h3>É só brindar</h3><p>No dia, chega tudo pronto. Vocês só põem a mão na coqueteleira.</p></div>
    </div>
    <div class="quote">
      <i>Elarah · Experiências criativas</i><br>
      contato@elarah.com.br &nbsp;·&nbsp; <strong>elarah.com.br</strong> &nbsp;·&nbsp; @elarah
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = '<div class="deck">\n' + cover + experiencia + vibe + vibe2 + espacos + proximos + '\n\n</div>\n\n'
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-aniversario-bartenderia.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
