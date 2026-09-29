# Proposta Elarah · Aniversario Antonella · 13 anos · 15 convidadas · outubro (sab/dom) · Mooca
# DECK NOVO DO ZERO. Conceito: "Elarah ate voce" (no espaco da propria cliente). Padrao editorial Elarah, paleta blush.
# 7 slides: Capa · A vibe · As duas experiencias · Elarah ate voce · O que completa · Investimento (3 pacotes) · Proximos.
# Experiencias: 1) Customize Escova & Presilha (2h, R$229/pp, R$3.435) 2) Piranha & Escova Bedazzled (1h30, R$209/pp, R$3.135).
# Complementos: comidinhas R$89,90/pp · bolo+vela R$299,90 total · garrafa personalizada R$149,90/pp · registro R$450 total.
# Pacotes: SO EXPERIENCIA / COMPLETO (exp+comidinhas+bolo) / PREMIUM (+garrafa+registro). Premium selo "Experiencia completa" (NAO "Recomendacao Elarah").
#   Completo: Escova R$332,23/4.983,50 · Piranha R$312,23/4.683,50 | Premium: Escova R$512,13/7.682,00 · Piranha R$492,13/7.382,00.
# Fotos reais (escova/presilha pintada, piranhas com cristais, jovens criando). PROIBIDO: ceramica, tela, tacas, Bake Studio/parceiros, mimo extra.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

# paleta blush / rosa delicado (jovem, feminina, contemporanea)
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
  /* a vibe · grid de fotos */
  .gstrip{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:20px}
  .gstrip figure{margin:0;border-radius:16px;overflow:hidden;position:relative;height:320px;border:1px solid var(--line);box-shadow:0 16px 34px -22px rgba(0,0,0,.34)}
  .gstrip img{width:100%;height:100%;object-fit:cover;display:block}
  .gstrip figcaption{position:absolute;left:0;right:0;bottom:0;padding:26px 14px 12px;color:#fff;font-size:12px;font-weight:600;letter-spacing:.02em;background:linear-gradient(to top,rgba(40,20,28,.86),transparent)}
  /* duas experiencias */
  .cpg{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px;align-items:start}
  .cpc{background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 16px 36px -26px rgba(0,0,0,.3);display:flex;flex-direction:column}
  .cpc .cpph{height:168px;overflow:hidden;background:#eee}
  .cpc .cpph img{width:100%;height:100%;object-fit:cover;display:block}
  .cpc .cpb{padding:16px 20px 18px}
  .cpc .cptag{font-size:8.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--orange-dark);font-weight:700}
  .cpc .cpn{font-family:'DM Serif Display',serif;font-weight:400;font-size:20px;color:var(--navy);line-height:1.06;margin:4px 0 0}
  .cpc .cpdur{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--navy-soft);font-weight:700;margin-top:6px}
  .cpc .cpd{font-size:11px;color:var(--muted);line-height:1.45;margin-top:9px}
  .cpc ul.cpi{list-style:none;margin:10px 0 0;padding:0;display:flex;flex-direction:column;gap:4px}
  .cpc ul.cpi li{position:relative;padding-left:17px;font-size:10.5px;color:var(--ink);line-height:1.3}
  .cpc ul.cpi li:before{content:"\\2713";position:absolute;left:0;top:1px;color:var(--orange);font-size:9px;font-weight:800}
  .cpc .cpprice{margin-top:12px;padding-top:11px;border-top:1px solid var(--line)}
  .cpc .cpprice .pp{font-family:'DM Serif Display',serif;font-size:23px;color:var(--orange-dark);line-height:1}
  .cpc .cpprice .pp small{font-family:-apple-system,sans-serif;font-size:8.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-left:4px}
  .cpc .cpprice .tt{font-size:10.5px;color:var(--muted);margin-top:3px}
  /* complementos · 4 cards */
  .comp4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:20px}
  .cmc{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 14px 32px -24px rgba(0,0,0,.28)}
  .cmc .cmph{aspect-ratio:1/1;overflow:hidden;background:#eee}
  .cmc .cmph img{width:100%;height:100%;object-fit:cover;display:block}
  .cmc .cmb{padding:13px 16px 16px}
  .cmc .cmn{font-family:'DM Serif Display',serif;font-weight:400;font-size:16px;color:var(--navy);line-height:1.1}
  .cmc .cmv{font-family:'DM Serif Display',serif;font-size:20px;color:var(--orange-dark);margin-top:9px;line-height:1}
  .cmc .cmv small{font-family:-apple-system,sans-serif;font-size:8px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);font-weight:700;display:block;margin-top:3px}
  /* investimento · 3 pacotes */
  .pk3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:22px;align-items:stretch}
  .pkc{position:relative;background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px 20px 20px;display:flex;flex-direction:column;box-shadow:0 16px 38px -28px rgba(0,0,0,.3)}
  .pkc--hl{border:1.5px solid var(--orange);box-shadow:0 22px 46px -26px rgba(217,106,142,.45)}
  .pkbadge{position:absolute;top:-11px;left:50%;transform:translateX(-50%);white-space:nowrap;background:var(--orange-dark);color:#fff;font-size:8px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:5px 13px;border-radius:999px;box-shadow:0 8px 18px -6px rgba(0,0,0,.4)}
  .pkn{font-family:'DM Serif Display',serif;font-weight:400;font-size:22px;color:var(--navy);line-height:1.02}
  .pktag{font-size:8.5px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin-top:2px}
  .pkinc{font-size:10.5px;color:var(--muted);line-height:1.42;margin-top:11px;padding-bottom:13px;border-bottom:1px solid var(--line)}
  .pkinc b{color:var(--navy);font-weight:600}
  .pkrows{margin-top:13px;display:flex;flex-direction:column;gap:13px}
  .pkr .pkre{font-size:8.5px;letter-spacing:.06em;text-transform:uppercase;font-weight:700;color:var(--navy-soft)}
  .pkr .pkp{font-family:'DM Serif Display',serif;font-size:29px;color:var(--orange-dark);line-height:1;margin-top:3px}
  .pkr .pkp small{font-family:-apple-system,sans-serif;font-size:8.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-left:5px}
  .pkr .pkt{font-size:10px;color:var(--muted);margin-top:3px}
  /* proximos · passos + cta */
  .steps3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:18px}
  .stp{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px 20px 20px;box-shadow:0 12px 30px -22px rgba(0,0,0,.24)}
  .stp .num{font-family:'DM Serif Display',serif;color:var(--orange);font-size:24px;line-height:1}
  .stp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:16px;color:var(--navy);line-height:1.1;margin:7px 0 5px}
  .stp p{font-size:11.5px;color:var(--muted);line-height:1.5;margin:0}
  /* elarah ate voce · pontos */
  .checks{display:grid;grid-template-columns:1fr 1fr;gap:9px 24px;margin-top:14px}
  .checks li{list-style:none;position:relative;padding-left:26px;font-size:12px;color:var(--ink);line-height:1.35}
  .checks li b{color:var(--navy);font-weight:700}
  .checks li .ck{position:absolute;left:0;top:1px;width:17px;height:17px;border-radius:999px;background:var(--orange);color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center}
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
        <span class="eyebrow">✦ Uma comemoração para criar juntas</span>
        <h1>A festa da <em>Antonella</em> 🎀</h1>
        <p class="lead">Um encontro entre amigas para criar, se divertir e levar pra casa uma lembrança feita à mão — <b>no conforto do espaço de vocês</b>. Cada convidada personaliza os próprios acessórios do jeitinho dela.</p>
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
      <div class="cover-photo">{img("antonella-capa-grupo.jpg", "Grupo de amigas reunidas, criando e se divertindo juntas", "center 40%")}</div>
    </div>
    {foot("Aniversário · Antonella")}
  </section>'''

# ============================ 2 · A VIBE ============================
vibe = f'''
  <section class="slide">
{head_simple("A vibe")}
    <span class="eyebrow orange">◆ Entre amigas, brilho e diversão</span>
    <h2>A vibe da <em>comemoração</em></h2>
    <p class="lead">Um encontro leve e especial para celebrar os 13 anos da Antonella com criatividade, risadas e momentos gostosos entre amigas — mais do que uma oficina, uma festa bonita e cheia de personalidade.</p>
    <div class="gstrip">
      <figure>{img("escovas-grupo-maos.jpg", "Amigas mostrando os acessórios que personalizaram", "center 40%")}<figcaption>Amigas &amp; suas criações</figcaption></figure>
      <figure>{img("escova-maonamassa.jpg", "Meninas customizando os acessórios com tinta e brilho", "center 50%")}<figcaption>Mão na massa, juntas</figcaption></figure>
      <figure>{img("antonella-vibe-risada.jpg", "Amigas rindo com as peças que criaram", "center 30%")}<figcaption>Risadas garantidas</figcaption></figure>
    </div>
    {foot("A vibe")}
  </section>'''

# ============================ 3 · AS DUAS EXPERIÊNCIAS ============================
experiencias = f'''
  <section class="slide">
{head_simple("As experiências")}
    <span class="eyebrow orange">◆ Dois estilos para escolher</span>
    <h2>Qual combina mais <em>com a Antonella?</em></h2>
    <p class="lead">Duas oficinas conduzidas, no mesmo formato — uma mais artística e colorida, outra mais glam e cheia de brilho. Em ambas, cada convidada leva as próprias peças pra casa no mesmo dia.</p>
    <div class="cpg">
      <div class="cpc">
        <div class="cpph">{img("escova-presilha-floral.png", "Escova de madeira pintada à mão com presilha floral", "center 50%")}</div>
        <div class="cpb">
          <div class="cptag">Artística &amp; colorida · 2h</div>
          <div class="cpn">Customize sua Escova &amp; Presilha</div>
          <div class="cpd">Cada convidada personaliza uma escova de madeira e uma presilha com pintura, cores, flores, adesivos e materiais decorativos.</div>
          <ul class="cpi">
            <li>Oficina conduzida</li>
            <li>1 escova de madeira + 1 presilha por convidada</li>
            <li>Todos os materiais · avental e acessórios</li>
            <li>Peças prontas para levar pra casa</li>
          </ul>
          <div class="cpprice"><span class="pp">R$ 229<small>por pessoa</small></span><div class="tt">R$ 3.435 · 15 convidadas</div></div>
        </div>
      </div>
      <div class="cpc">
        <div class="cpph">{img("piranhapersonalizada.jpg", "Piranhas e escovas personalizadas com cristais", "center 50%")}</div>
        <div class="cpb">
          <div class="cptag">Glam &amp; cheia de brilho · 1h30</div>
          <div class="cpn">Piranha &amp; Escova Bedazzled</div>
          <div class="cpd">Cada convidada personaliza uma escova e uma piranha com cristais, brilho e a própria inicial — glam e delicado.</div>
          <ul class="cpi">
            <li>Oficina conduzida</li>
            <li>1 escova + 1 piranha por convidada</li>
            <li>Cristais e materiais · personalização com a inicial</li>
            <li>Peças prontas para levar pra casa</li>
          </ul>
          <div class="cpprice"><span class="pp">R$ 209<small>por pessoa</small></span><div class="tt">R$ 3.135 · 15 convidadas</div></div>
        </div>
      </div>
    </div>
    {foot("As experiências")}
  </section>'''

# ============================ 4 · ELARAH ATÉ VOCÊ ============================
ate_voce = f'''
  <section class="slide">
{head_simple("Elarah até você")}
    <span class="eyebrow orange">◆ Como funciona</span>
    <h2>Elarah <em>até você</em></h2>
    <p class="lead">A comemoração acontece no espaço de vocês — e nós levamos toda a experiência até lá. A família recebe as convidadas e aproveita a festa.</p>
    <div class="bfeat">
      <div class="bphoto">{img("nivergibrinde.jpg", "Kit da experiência pronto, delicado e personalizado", "center 50%")}</div>
      <div class="bbody">
        <span class="btag">Vocês recebem, a gente faz acontecer</span>
        <h3>Do início ao fim, com a Elarah</h3>
        <ul class="feat">
          <li><span class="st">1</span><b>Levamos os materiais</b> — tudo o que a experiência precisa vai até vocês.</li>
          <li><span class="st">2</span><b>Montamos a experiência</b> e organizamos a mesa no seu espaço.</li>
          <li><span class="st">3</span><b>Recebemos e coordenamos</b> a atividade do começo ao fim.</li>
          <li><span class="st">4</span><b>Cuidamos da produção</b> — vocês só aproveitam a comemoração.</li>
        </ul>
      </div>
    </div>
    <div class="bnote" style="margin-top:16px">◆ A família define <b>o local e a data</b> — a Elarah cuida de todo o resto da experiência. 🎀</div>
    {foot("Elarah até você")}
  </section>'''

# ============================ 5 · O QUE COMPLETA A COMEMORAÇÃO ============================
completa = f'''
  <section class="slide">
{head_simple("Complete a comemoração")}
    <span class="eyebrow orange">◆ O que completa a festa</span>
    <h2>Uma comemoração <em>completa</em></h2>
    <p class="lead">Além da experiência, dá pra somar os toques que transformam o dia numa festa completa e bem produzida:</p>
    <div class="comp4">
      <div class="cmc"><div class="cmph">{img("comidinhas-variedade.jpg", "Variedade de salgados e doces para a festa", "center 50%")}</div><div class="cmb"><div class="cmn">Comidinhas · salgados + doces</div><div class="cmv">R$ 89,90<small>por pessoa</small></div></div></div>
      <div class="cmc"><div class="cmph">{img("bolo-vela-bedazzled.jpg", "Bolo de aniversário decorado com velas", "center 35%")}</div><div class="cmb"><div class="cmn">Bolo + vela</div><div class="cmv">R$ 299,90<small>valor total</small></div></div></div>
      <div class="cmc"><div class="cmph">{img("garrafa-rosa-personalizada.jpg", "Garrafa personalizada com o nome de cada convidada", "center 45%")}</div><div class="cmb"><div class="cmn">Garrafa personalizada</div><div class="cmv">R$ 149,90<small>por pessoa</small></div></div></div>
      <div class="cmc"><div class="cmph">{img("vibe-risada.jpg", "Registro fotográfico de adolescentes rindo na festa", "center 30%")}</div><div class="cmb"><div class="cmn">Registro fotográfico profissional</div><div class="cmv">R$ 450<small>valor total</small></div></div></div>
    </div>
    <div class="bnote" style="margin-top:16px">◆ Cada item é opcional e entra conforme a escolha da família — ou já vem incluso nos pacotes a seguir. 🎀</div>
    {foot("Complete a comemoração")}
  </section>'''

# ============================ 6 · INVESTIMENTO (3 pacotes) ============================
def pkrow(exp, pp, tot):
    return (f'<div class="pkr"><div class="pkre">{exp}</div>'
            f'<div class="pkp">R$ {pp}<small>pp</small></div>'
            f'<div class="pkt">R$ {tot} · 15 convidadas</div></div>')


investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Escolha o <em>pacote ideal</em></h2>
    <p class="lead">É simples: escolha a <b>experiência</b>, escolha o <b>pacote</b> e veja o valor final. O valor por pessoa em destaque, o total para as 15 logo abaixo.</p>
    <div class="pk3">
      <div class="pkc">
        <div class="pkn">Só experiência</div>
        <div class="pktag">A oficina escolhida</div>
        <div class="pkinc">Experiência escolhida · condução, materiais e as peças de cada convidada.</div>
        <div class="pkrows">
          {pkrow("Escova &amp; Presilha", "229", "3.435")}
          {pkrow("Piranha Bedazzled", "209", "3.135")}
        </div>
      </div>
      <div class="pkc">
        <div class="pkn">Completo</div>
        <div class="pktag">Experiência + festa</div>
        <div class="pkinc">Tudo da experiência <b>+ comidinhas (salgados + doces) + bolo &amp; vela</b>.</div>
        <div class="pkrows">
          {pkrow("Escova &amp; Presilha", "332,23", "4.983,50")}
          {pkrow("Piranha Bedazzled", "312,23", "4.683,50")}
        </div>
      </div>
      <div class="pkc pkc--hl">
        <span class="pkbadge">✦ Experiência completa</span>
        <div class="pkn">Premium</div>
        <div class="pktag">A comemoração completa</div>
        <div class="pkinc">Tudo do Completo <b>+ garrafa personalizada + registro fotográfico profissional</b>.</div>
        <div class="pkrows">
          {pkrow("Escova &amp; Presilha", "512,13", "7.682,00")}
          {pkrow("Piranha Bedazzled", "492,13", "7.382,00")}
        </div>
      </div>
    </div>
    <div class="bnote" style="margin-top:16px">◆ Valores por pessoa e totais para 15 convidadas, no espaço de vocês, com toda a produção Elarah inclusa. 🎀</div>
    {foot("Investimento")}
  </section>'''

# ============================ 7 · PRÓXIMOS PASSOS ============================
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Bora comemorar? 🎀</span>
    <h2>Pronta para celebrar <em>os 13 da Antonella?</em></h2>
    <p class="lead">É só combinar três coisas que a Elarah cuida de todo o resto:</p>
    <div class="steps3">
      <div class="stp"><span class="num">01</span><h3>Escolha a experiência</h3><p>Escova &amp; Presilha ou Piranha &amp; Escova Bedazzled.</p></div>
      <div class="stp"><span class="num">02</span><h3>Escolha o formato</h3><p>Completo ou Premium — do jeitinho que combina com a festa.</p></div>
      <div class="stp"><span class="num">03</span><h3>Escolha a data</h3><p>Um sábado ou domingo de outubro, conforme a disponibilidade.</p></div>
    </div>
    <div class="quote" style="margin-top:22px">
      <strong style="font-family:'DM Serif Display',serif;font-weight:400;font-size:22px;color:var(--navy);display:block;margin-bottom:8px">Escolheu a favorita? 🎀</strong>
      Conta pra gente e seguimos com a reserva da data.<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n'
        + cover + vibe + experiencias + ate_voce + completa + investimento + proximos + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/aniversario-antonella.html"
open(out, "w", encoding="utf-8").write(html)
# guardas
low = html.lower()
for termo in ["agora", "bake studio", "recomendação elarah", "nécessaire", "necessaire", "espelhinho"]:
    assert termo not in low, f"ERRO: termo proibido presente -> {termo}"
print("wrote", out, "| slides:", html.count('<section class="slide">'), "| guards OK")
