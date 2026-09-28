# Proposta Elarah · Aniversario Antonella · 13 anos · 15 convidadas · outubro (sab/dom) · Mooca
# SOMENTE no local da cliente (sem espaco parceiro) -> conceito "Elarah ate voce": levamos experiencia, materiais e producao.
# Duas experiencias: 1) Customize Escova & Presilha (2h, artistica) 2) Piranha & Escova Bedazzled (1h30, glam/cristais).
# Final comercial em 2 PACOTES (Completo / Premium), com valores por experiencia (nao arredondar):
#   Completo: Exp1 R$307,33pp/4.610,00 · Exp2 R$272,23pp/4.083,50 (15 conv).
#   Premium (+garrafa +foto): Exp1 R$487,23pp/7.308,50 · Exp2 R$452,13pp/6.782,00 (15 conv).
# Slides: capa(grupo) · experiencias · Elarah ate voce · A vibe · Escolha como celebrar(pacotes) · proximos.
# Padrao editorial Elarah aniversario. Paleta blush. Priorizar fotos com pessoas/jovens.
# PROIBIDO: ceramica, pintura em tela, tacas, workshops sem relacao, mencao a espaco parceiro/Bake Studio.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

# paleta blush / rosa delicado
reps = {
    "--orange:#B08D4C;": "--orange:#D96A8E;",
    "--orange-dark:#8A6D34;": "--orange-dark:#B24C6E;",
    "--navy:#12362B;": "--navy:#4A2334;",
    "--navy-soft:#3A5A4E;": "--navy-soft:#7A5866;",
    "--blue-accent:#B08D4C;": "--blue-accent:#D96A8E;",
    "#EFF3EE": "#FCEDF2", "#DCE8E1": "#F6DBE5", "#CBB06E": "#EBA6BE",
    "rgba(176,141,76,.24)": "rgba(217,106,142,.24)",
    "rgba(176,141,76,.26)": "rgba(217,106,142,.28)",
    "rgba(176,141,76,.10)": "rgba(217,106,142,.10)",
    "rgba(18,54,43,.16)": "rgba(74,35,52,.16)",
    "rgba(10,28,22,.86)": "rgba(40,20,28,.86)",
    "rgba(10,28,22,.85)": "rgba(40,20,28,.85)",
    "rgba(10,28,22,.82)": "rgba(40,20,28,.82)",
}
for a, b in reps.items():
    head = head.replace(a, b)

xcss = '''
  .gstrip{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:18px}
  .gstrip figure{margin:0;border-radius:16px;overflow:hidden;position:relative;height:300px;border:1px solid var(--line);box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .gstrip img{width:100%;height:100%;object-fit:cover;display:block}
  .gstrip figcaption{position:absolute;left:0;right:0;bottom:0;padding:24px 13px 11px;color:#fff;font-size:12px;font-weight:600;letter-spacing:.02em;background:linear-gradient(to top,rgba(40,20,28,.85),transparent)}
  /* onde acontece · 2 cards */
  .vg{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}
  .vc{background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 36px -26px rgba(0,0,0,.3)}
  .vc .vcph{height:200px;overflow:hidden;background:#eee}
  .vc .vcph img{width:100%;height:100%;object-fit:cover;display:block}
  .vc .vcb{padding:16px 20px 18px}
  .vc .vcn{font-family:'DM Serif Display',serif;font-weight:400;font-size:20px;color:var(--navy);line-height:1.05}
  .vc .vcd{font-size:12px;color:var(--muted);line-height:1.5;margin-top:8px}
  /* investimento */
  .invhi{display:flex;align-items:baseline;gap:12px;margin-top:20px;flex-wrap:wrap}
  .invhi .il{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange-dark);font-weight:700}
  .invhi .iv{font-family:'DM Serif Display',serif;font-size:30px;color:var(--navy);line-height:1}
  .invhi .iv em{font-style:italic;color:var(--navy-soft);font-size:22px}
  .invcards{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}
  .ic2{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px 22px;box-shadow:0 12px 30px -24px rgba(0,0,0,.24)}
  .ic2 .icn{font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--orange-dark);font-weight:700}
  .ic2 .icv{font-family:'DM Serif Display',serif;font-size:22px;color:var(--navy);margin-top:5px}
  .ic2 .icv em{font-style:italic;color:var(--navy-soft);font-size:18px}
  .ic2 .ics{font-size:11px;color:var(--muted);margin-top:4px;line-height:1.4}
  /* proximos */
  .steps3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
  .stp{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px 20px 20px;box-shadow:0 12px 30px -22px rgba(0,0,0,.24)}
  .stp .num{font-family:'DM Serif Display',serif;color:var(--orange);font-size:24px;line-height:1}
  .stp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:16px;color:var(--navy);line-height:1.1;margin:7px 0 5px}
  .stp p{font-size:11.5px;color:var(--muted);line-height:1.5;margin:0}
  /* comparativo de 2 experiencias */
  .cpg{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:18px;align-items:start}
  .cpc{background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 16px 36px -26px rgba(0,0,0,.3);display:flex;flex-direction:column}
  .cpc .cpph{height:170px;overflow:hidden;background:#eee}
  .cpc .cpph img{width:100%;height:100%;object-fit:cover;display:block}
  .cpc .cpb{padding:16px 20px 18px}
  .cpc .cptag{font-size:8.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--orange-dark);font-weight:700}
  .cpc .cpn{font-family:'DM Serif Display',serif;font-weight:400;font-size:20px;color:var(--navy);line-height:1.06;margin:4px 0 0}
  .cpc .cpdur{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--navy-soft);font-weight:700;margin-top:6px}
  .cpc .cpd{font-size:11.5px;color:var(--muted);line-height:1.45;margin-top:9px}
  .cpc ul.cpi{list-style:none;margin:11px 0 0;padding:0;display:flex;flex-direction:column;gap:5px}
  .cpc ul.cpi li{position:relative;padding-left:18px;font-size:10.5px;color:var(--ink);line-height:1.35}
  .cpc ul.cpi li:before{content:"✓";position:absolute;left:0;top:0;color:var(--orange);font-size:9px;font-weight:800}
  /* opcionais · strip de fotos + lista com precos */
  .ostrip{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:16px}
  .ostrip figure{margin:0;border-radius:14px;overflow:hidden;position:relative;height:150px;border:1px solid var(--line);box-shadow:0 12px 28px -22px rgba(0,0,0,.3)}
  .ostrip img{width:100%;height:100%;object-fit:cover;display:block}
  .ostrip figcaption{position:absolute;left:0;right:0;bottom:0;padding:16px 12px 9px;color:#fff;font-size:10.5px;font-weight:600;background:linear-gradient(to top,rgba(40,20,28,.85),transparent)}
  .oplist{display:flex;flex-direction:column;margin-top:14px;border:1px solid var(--line);border-radius:16px;overflow:hidden;background:var(--card);box-shadow:0 12px 30px -24px rgba(0,0,0,.22)}
  .oprow{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 20px}
  .oprow + .oprow{border-top:1px solid var(--line)}
  .oprow .oln{font-size:12.5px;color:var(--navy);font-weight:600;line-height:1.25}
  .oprow .old{font-size:10px;color:var(--muted);line-height:1.35;margin-top:2px}
  .oprow .opv{font-family:'DM Serif Display',serif;font-size:18px;color:var(--orange-dark);white-space:nowrap;text-align:right;line-height:1}
  .oprow .opv small{display:block;font-family:-apple-system,sans-serif;font-size:8px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-top:3px}
  .oprow .opv em{font-style:italic;font-size:15px;color:var(--navy-soft)}
  /* pacotes · completo x premium */
  .pkg2{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:18px;align-items:stretch}
  .pkgc{position:relative;background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px 24px 24px;box-shadow:0 16px 36px -26px rgba(0,0,0,.3);display:flex;flex-direction:column}
  .pkgc--hl{border:1.5px solid var(--orange);box-shadow:0 20px 46px -24px rgba(217,106,142,.5)}
  .pkgrib{position:absolute;top:-11px;right:22px;background:var(--orange-dark);color:#fff;font-size:8px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:5px 12px;border-radius:999px;box-shadow:0 8px 18px -6px rgba(0,0,0,.4)}
  .pkgtag{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange-dark);font-weight:700}
  .pkgn{font-family:'DM Serif Display',serif;font-weight:400;font-size:25px;color:var(--navy);line-height:1.02;margin-top:3px}
  .pkgsub{font-size:10.5px;color:var(--muted);line-height:1.4;margin-top:6px}
  .pkgincl{list-style:none;margin:13px 0 0;padding:0;display:flex;flex-direction:column;gap:5px}
  .pkgincl li{position:relative;padding-left:18px;font-size:10.5px;color:var(--ink);line-height:1.35}
  .pkgincl li:before{content:"✓";position:absolute;left:0;top:0;color:var(--orange);font-size:9px;font-weight:800}
  .pkgincl li.plus{color:var(--navy);font-weight:600}
  .pkgincl li.plus:before{content:"＋";color:var(--orange-dark);font-weight:800}
  .pkgval{margin-top:14px;padding-top:13px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:11px}
  .pkgv{display:flex;align-items:center;justify-content:space-between;gap:10px}
  .pkgv .pel{font-size:9.5px;color:var(--navy-soft);font-weight:700;line-height:1.25;max-width:50%;text-transform:uppercase;letter-spacing:.04em}
  .pkgv .per{text-align:right;white-space:nowrap}
  .pkgv .per .pp{font-family:'DM Serif Display',serif;font-size:20px;color:var(--orange-dark);line-height:1}
  .pkgv .per .pp small{font-family:-apple-system,sans-serif;font-size:8px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-left:3px}
  .pkgv .per .tt{display:block;font-size:9.5px;color:var(--muted);margin-top:2px}
</style>'''
head = head.replace("</style>", xcss, 1)


def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'


def img(src, alt, pos="center 50%"):
    return f'<img src="assets/{src}" alt="{alt}" style="object-position:{pos}">'


def head_block(kicker, main, accent, small):
    return f'''    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right">
        <span class="kicker">{kicker}</span>
        <span class="compass">{main} <span>{accent}</span><small>{small}</small></span>
      </div>
    </div>'''


def head_simple(kicker):
    return f'''    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">{kicker}</span></div>
    </div>'''


# ============================ 1 · CAPA ============================
cover = f'''
  <section class="slide">
{head_block("Aniversário · 13 anos", "Antonella", "", "São Paulo · outubro")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Uma comemoração completa</span>
        <h1>A festa da <em>Antonella</em> 🎀</h1>
        <p class="lead">Um encontro entre amigas para criar, se divertir e levar pra casa uma lembrança feita à mão — <b>no conforto do espaço de vocês</b>. Cada convidada personaliza a própria escova &amp; presilha do jeitinho dela.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>13</b> anos</span>
          <span class="chip"><b>15</b> convidadas</span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip">Outubro · sábado ou domingo</span>
          <span class="chip">No seu espaço · Mooca</span>
        </div>
      </div>
      <div class="cover-photo">{img("pintura-grupo.jpg", "Grupo de amigas reunidas, criando e se divertindo juntas", "center 30%")}</div>
    </div>
    {foot("Aniversário · Antonella")}
  </section>'''

# ============================ 2 · AS EXPERIÊNCIAS ============================
experiencia = f'''
  <section class="slide">
{head_simple("As experiências")}
    <span class="eyebrow orange">◆ Dois estilos para escolher</span>
    <h2>Qual combina mais <em>com a Antonella?</em></h2>
    <p class="lead">Duas oficinas conduzidas, no mesmo formato — uma mais artística e colorida, outra mais glam e cheia de brilho. Em ambas, cada convidada leva as próprias peças pra casa.</p>
    <div class="cpg">
      <div class="cpc">
        <div class="cpph">{img("escova-pintada-flores.webp", "Escovas de madeira pintadas à mão com flores", "center 45%")}</div>
        <div class="cpb">
          <div class="cptag">Artística &amp; colorida</div>
          <div class="cpn">Customize sua Escova &amp; Presilha</div>
          <div class="cpdur">Duração · 2h</div>
          <div class="cpd">Cada convidada personaliza uma escova de madeira e uma presilha com pintura, cores, flores, adesivos e detalhes — bem a cara dela.</div>
          <ul class="cpi">
            <li>Oficina conduzida</li>
            <li>1 escova de madeira + 1 presilha por convidada</li>
            <li>Tintas, adesivos e materiais de decoração</li>
            <li>Avental e acessórios</li>
            <li>Peças prontas para levar pra casa</li>
          </ul>
        </div>
      </div>
      <div class="cpc">
        <div class="cpph">{img("piranhapersonalizada.jpg", "Presilhas personalizadas com cristais e iniciais", "center 50%")}</div>
        <div class="cpb">
          <div class="cptag">Glam &amp; cheia de brilho</div>
          <div class="cpn">Piranha &amp; Escova Bedazzled</div>
          <div class="cpdur">Duração · 1h30</div>
          <div class="cpd">Uma customização glam: cada convidada decora a própria piranha e escova com <b>cristais, brilho e a própria inicial</b>, pra deixar tudo ainda mais especial.</div>
          <ul class="cpi">
            <li>Oficina conduzida</li>
            <li>1 piranha + 1 escova por convidada</li>
            <li>Cristais e materiais de customização</li>
            <li>Personalização com a inicial</li>
            <li>Peças prontas para levar pra casa</li>
          </ul>
        </div>
      </div>
    </div>
    {foot("As experiências")}
  </section>'''

# ============================ 3 · A VIBE ============================
vibe = f'''
  <section class="slide">
{head_simple("O que cada uma leva")}
    <span class="eyebrow orange">◆ O que cada uma leva</span>
    <h2>Escova &amp; presilha <em>personalizadas</em></h2>
    <p class="lead">Cores, brilho e detalhes que fazem diferença — cada convidada personaliza a própria escova e a própria presilha e leva pra casa numa caixinha linda.</p>
    <div class="gstrip">
      <figure>{img("lembrancinha-escova.jpg", "Escova personalizada com o nome e presilha de flor", "center 50%")}<figcaption>A escova personalizada</figcaption></figure>
      <figure>{img("piranhapersonalizada.jpg", "Presilhas personalizadas com nomes e brilhos", "center 50%")}<figcaption>As presilhas de cada uma</figcaption></figure>
      <figure>{img("nivergibrinde.jpg", "Kit de escova e presilha em caixinha rosa", "center 50%")}<figcaption>Numa caixinha linda</figcaption></figure>
    </div>
    <div class="bnote" style="margin-top:16px">◆ Cada peça é personalizada com o <b>nome</b> e os detalhes preferidos de cada convidada — brilhos, cores e aquele toque delicado. 🎀</div>
    {foot("O que cada uma leva")}
  </section>'''

# ============================ 4 · ELARAH ATÉ VOCÊ ============================
ate_voce = f'''
  <section class="slide">
{head_simple("Elarah até você")}
    <span class="eyebrow orange">◆ Como funciona</span>
    <h2>Elarah <em>até você</em></h2>
    <p class="lead">A comemoração acontece no espaço de vocês — e nós levamos toda a experiência até lá. Vocês só recebem as amigas.</p>
    <div class="bfeat">
      <div class="bphoto">{img("nivergibrinde.jpg", "Kit da experiência pronto, delicado e personalizado", "center 50%")}</div>
      <div class="bbody">
        <span class="btag">Vocês recebem, a gente faz acontecer</span>
        <h3>Do início ao fim, com a Elarah</h3>
        <ul class="feat">
          <li><span class="st">1</span><b>Levamos os materiais</b> — tudo o que a experiência precisa vai até vocês.</li>
          <li><span class="st">2</span><b>Montamos a experiência</b> — organizamos a mesa e a estrutura no seu espaço.</li>
          <li><span class="st">3</span><b>Recebemos e coordenamos</b> — conduzimos a atividade do começo ao fim.</li>
        </ul>
      </div>
    </div>
    <div class="bnote" style="margin-top:16px">◆ A família define <b>o local e a data</b> — a Elarah cuida de todo o resto da experiência. 🎀</div>
    {foot("Elarah até você")}
  </section>'''

# ============================ · A VIBE ============================
a_vibe = f'''
  <section class="slide">
{head_simple("A vibe")}
    <span class="eyebrow orange">◆ Entre amigas, brilho e diversão</span>
    <h2>A vibe <em>da comemoração</em></h2>
    <p class="lead">Um encontro leve e especial para celebrar os 13 anos da Antonella com criatividade, risadas e momentos gostosos entre amigas — mais do que uma oficina, uma festa bonita e cheia de personalidade.</p>
    <div class="gstrip">
      <figure>{img("vibe-risada.jpg", "Amigas rindo e se divertindo juntas", "center 30%")}<figcaption>Amigas se divertindo juntas</figcaption></figure>
      <figure>{img("macaron-risada.jpg", "Meninas rindo e trocando olhares", "center 40%")}<figcaption>Risadas e momentos gostosos</figcaption></figure>
      <figure>{img("aniversariogi2.jpg", "Mesa montada, delicada e florida", "center 50%")}<figcaption>Mesa montada &amp; clima de festa</figcaption></figure>
    </div>
    <div class="bnote" style="margin-top:16px">◆ Clima leve e feminino, mão na massa entre amigas e uma <b>lembrança especial</b> pra cada uma levar pra casa. ✨</div>
    {foot("A vibe")}
  </section>'''

# ============================ 5 · COMPLETE A COMEMORAÇÃO ============================
complete = f'''
  <section class="slide">
{head_simple("Complete a comemoração")}
    <span class="eyebrow orange">◆ Opcionais para completar</span>
    <h2>Uma comemoração <em>completa</em></h2>
    <p class="lead">Mais que uma oficina: monte a festa do jeitinho de vocês. Cada item é opcional e entra conforme a escolha da família.</p>
    <div class="ostrip">
      <figure>{img("salgadosemgluten.jpg", "Salgadinhos para a mesa da festa", "center 50%")}<figcaption>Comidinhas</figcaption></figure>
      <figure>{img("bologanache.jpg", "Bolo de aniversário", "center 50%")}<figcaption>Bolo &amp; vela</figcaption></figure>
      <figure>{img("lembrancinha-garrafa.jpg", "Garrafa personalizada com o nome da convidada", "center 45%")}<figcaption>Garrafas personalizadas</figcaption></figure>
    </div>
    <div class="oplist">
      <div class="oprow"><div><div class="oln">Comidinhas · salgados + doces</div><div class="old">Mesa de salgadinhos e docinhos para a festa</div></div><div class="opv">R$ 89,90<small>por pessoa</small></div></div>
      <div class="oprow"><div><div class="oln">Bolo + vela</div><div class="old">Bolo de aniversário com vela para o momento do parabéns</div></div><div class="opv">R$ 200<small>valor total</small></div></div>
      <div class="oprow"><div><div class="oln">Registro fotográfico profissional</div><div class="old">Fotógrafo cobrindo a comemoração · álbum digital para compartilhar</div></div><div class="opv">R$ 450<small>valor total</small></div></div>
      <div class="oprow"><div><div class="oln">Garrafa personalizada</div><div class="old">Com o nome de cada convidada, posicionada na mesa</div></div><div class="opv">R$ 149,90<small>por pessoa</small></div></div>
      <div class="oprow"><div><div class="oln">Mimo extra · nécessaire ou espelhinho personalizado</div><div class="old">Uma lembrança a mais para cada convidada levar</div></div><div class="opv"><em>a cotar</em></div></div>
    </div>
    {foot("Complete a comemoração")}
  </section>'''

# ============================ · ESCOLHA COMO CELEBRAR (PACOTES) ============================
pacotes = f'''
  <section class="slide">
{head_simple("Escolha como celebrar")}
    <span class="eyebrow orange">◆ Dois pacotes, uma decisão fácil</span>
    <h2>Escolha como <em>celebrar</em></h2>
    <p class="lead">Dois pacotes prontos, cada um com a experiência escolhida e toda a produção da Elarah. É só escolher o pacote e a experiência — a gente cuida do resto, no espaço de vocês.</p>
    <div class="pkg2">
      <div class="pkgc">
        <span class="pkgtag">Pacote</span>
        <div class="pkgn">Completo</div>
        <div class="pkgsub">Tudo pronto para a festa acontecer.</div>
        <ul class="pkgincl">
          <li>Experiência escolhida · condução + todos os materiais</li>
          <li>Comidinhas · salgados + doces</li>
          <li>Bolo de aniversário + vela decorativa</li>
        </ul>
        <div class="pkgval">
          <div class="pkgv"><span class="pel">Exp. 1 · Escova &amp; Presilha</span><span class="per"><span class="pp">R$ 307,33<small>pp</small></span><span class="tt">R$ 4.610,00 · 15 convidadas</span></span></div>
          <div class="pkgv"><span class="pel">Exp. 2 · Piranha Bedazzled</span><span class="per"><span class="pp">R$ 272,23<small>pp</small></span><span class="tt">R$ 4.083,50 · 15 convidadas</span></span></div>
        </div>
      </div>
      <div class="pkgc pkgc--hl">
        <span class="pkgrib">✦ Experiência completa</span>
        <span class="pkgtag">Pacote</span>
        <div class="pkgn">Premium</div>
        <div class="pkgsub">A comemoração completa, do começo ao fim.</div>
        <ul class="pkgincl">
          <li>Tudo do pacote Completo</li>
          <li class="plus">Garrafa personalizada com o nome de cada convidada, na mesa</li>
          <li class="plus">Registro fotográfico profissional da comemoração</li>
        </ul>
        <div class="pkgval">
          <div class="pkgv"><span class="pel">Exp. 1 · Escova &amp; Presilha</span><span class="per"><span class="pp">R$ 487,23<small>pp</small></span><span class="tt">R$ 7.308,50 · 15 convidadas</span></span></div>
          <div class="pkgv"><span class="pel">Exp. 2 · Piranha Bedazzled</span><span class="per"><span class="pp">R$ 452,13<small>pp</small></span><span class="tt">R$ 6.782,00 · 15 convidadas</span></span></div>
        </div>
      </div>
    </div>
    <div class="bnote" style="margin-top:16px">◆ Todos os pacotes acontecem <b>no espaço de vocês</b>, com toda a produção Elarah inclusa. Valores calculados para 15 convidadas. 🎀</div>
    {foot("Escolha como celebrar")}
  </section>'''

# ============================ 7 · PRÓXIMOS PASSOS ============================
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Bora comemorar? 🎀</span>
    <h2>É só <em>reunir as amigas</em></h2>
    <p class="lead">A gente cuida de tudo pra Antonella e as amigas só chegarem e aproveitarem:</p>
    <div class="steps3">
      <div class="stp"><span class="num">01</span><h3>Escolhem</h3><p>A experiência, o pacote (Completo ou Premium) e a data — o local é o espaço de vocês.</p></div>
      <div class="stp"><span class="num">02</span><h3>Confirmamos</h3><p>Fechamos o pacote, o total para as convidadas e a disponibilidade da agenda.</p></div>
      <div class="stp"><span class="num">03</span><h3>Levamos até vocês</h3><p>Materiais, montagem e condução da experiência — do começo ao fim, no seu espaço.</p></div>
    </div>
    <div class="quote" style="margin-top:22px">
      <strong style="font-family:'DM Serif Display',serif;font-weight:400;font-size:22px;color:var(--navy);display:block;margin-bottom:8px">Vamos deixar essa festa inesquecível? 🎀</strong>
      Nos conta o espaço e a data que a gente confirma os valores e organiza cada detalhe.<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n'
        + cover + experiencia + ate_voce + a_vibe + pacotes + proximos + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/aniversario-antonella.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
