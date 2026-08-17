# Despedida de solteira — Itu, 7 convidadas, 20/nov. Menu de 4 experiências,
# preço avulso + pacotes com desconto. Paleta rosé/bordô festiva e elegante.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
base = open(S + "/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

# ---- recolor: rosé + bordô + creme (despedida feminina, elegante) ----
head = head.replace("--orange:#F27623;", "--orange:#D65A83;")       # accent rosé
head = head.replace("--orange-dark:#D4600E;", "--orange-dark:#B23E64;")
head = head.replace("--navy:#16233C;", "--navy:#4A2138;")           # bordô profundo (títulos)
head = head.replace("--navy-soft:#3B4E6B;", "--navy-soft:#7A5566;")
head = head.replace("--blue-accent:#4C6EA3;", "--blue-accent:#D65A83;")
head = head.replace("#EDF1F7", "#F8EEF3").replace("#DCE5F1", "#F0DBE5")
head = head.replace("#FF9A4D", "#E6A2BC")
head = head.replace("rgba(242,118,35,.22)", "rgba(214,90,131,.24)")

# ---- extra CSS ----
extra = '''
  /* menu de experiências */
  .menu{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;margin-top:12px}
  .exp{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 14px 32px -22px rgba(0,0,0,.28)}
  .exp-photo{height:210px;overflow:hidden;background:#eee}
  .exp-photo img{width:100%;height:100%;object-fit:cover}
  .exp-body{padding:15px 18px 17px}
  .exp .n{display:inline-block;font-size:9px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:5px}
  .exp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:20px;color:var(--navy);line-height:1.06}
  .exp p{font-size:12px;color:var(--muted);margin-top:6px;line-height:1.45}
  .exp .price{display:inline-block;margin-top:10px;font-size:12px;color:var(--navy);font-weight:600}
  .exp .price b{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px}
  /* galeria vibe */
  .vibe{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:14px}
  .vibe figure{margin:0;border-radius:16px;overflow:hidden;position:relative;aspect-ratio:3/4;box-shadow:0 16px 36px -24px rgba(0,0,0,.34)}
  .vibe img{width:100%;height:100%;object-fit:cover;display:block}
  .vibe figcaption{position:absolute;left:0;right:0;bottom:0;padding:26px 14px 12px;color:#fff;font-size:12.5px;font-weight:600;
    background:linear-gradient(to top,rgba(40,15,30,.78),transparent)}
  /* investimento — dois blocos */
  .invest{display:grid;grid-template-columns:.92fr 1.08fr;gap:26px;margin-top:14px;align-items:start}
  .iblock h4{font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin-bottom:12px}
  .arow{display:flex;justify-content:space-between;align-items:center;padding:13px 2px;border-bottom:1px solid var(--line)}
  .arow:last-child{border-bottom:none}
  .arow .an{font-size:14px;color:var(--ink)}
  .arow .an span{display:block;font-size:10.5px;color:var(--muted);margin-top:2px}
  .arow .av{font-family:'DM Serif Display',serif;font-size:22px;color:var(--navy);white-space:nowrap}
  .arow .av small{font-family:'DM Sans';font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-weight:600;margin-left:3px}
  .pcards{display:flex;flex-direction:column;gap:13px}
  .pc{display:flex;align-items:center;justify-content:space-between;gap:14px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px 22px}
  .pc.hl{border:2px solid var(--navy);background:#FBF2F6;position:relative}
  .pc .pl h5{font-family:'DM Serif Display',serif;font-weight:400;font-size:20px;color:var(--navy);line-height:1.05}
  .pc .pl p{font-size:11.5px;color:var(--muted);margin-top:3px}
  .pc .pr{text-align:right;flex-shrink:0}
  .pc .pr .big{font-family:'DM Serif Display',serif;font-size:30px;color:var(--ink);line-height:1;white-space:nowrap}
  .pc .pr .u{display:block;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-weight:600;margin-top:3px}
  .pc .pr .old{display:block;font-size:11px;color:var(--muted);text-decoration:line-through;margin-bottom:2px}
  .ptag{position:absolute;top:-11px;right:18px;background:var(--orange);color:#fff;font-size:9.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:5px 12px;border-radius:999px}
  .fineprint{font-size:10px;color:var(--muted);line-height:1.5;margin-top:16px}
  .cllogo{height:29px;width:auto;display:block}
</style>'''
head = head.replace("</style>", extra, 1)

# ---- PDF: sombras borradas viram bloco cinza em leitores iOS — troca por bordas ----
head = head.replace(
    "    @page{size:A4 portrait;margin:0}",
    "    .slide *{box-shadow:none !important}\n"
    "    .cover-photo,.exp-photo,.vibe figure,.pc{border:1px solid rgba(74,33,56,.14)}\n"
    "    .invest{grid-template-columns:.92fr 1.08fr}\n"
    "    .menu{grid-template-columns:repeat(2,1fr)}\n"
    "    .vibe{grid-template-columns:repeat(3,1fr)}\n"
    "    @page{size:A4 portrait;margin:0}", 1)
# mobile: colapsa grids
head = head.replace(".plans{grid-template-columns:1fr}",
                    ".plans{grid-template-columns:1fr}\n    .menu{grid-template-columns:1fr}\n    .invest{grid-template-columns:1fr}\n    .vibe{grid-template-columns:1fr 1fr}")


def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'

def exp(n, img, name, desc, price, pos="center 50%"):
    return (f'<div class="exp"><div class="exp-photo"><img src="assets/{img}" alt="{name}" style="object-position:{pos}"></div>'
            f'<div class="exp-body"><span class="n">{n}</span><h3>{name}</h3><p>{desc}</p>'
            f'<span class="price">avulsa · <b>R$ {price}</b> /pessoa</span></div></div>')


cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right">
        <span class="kicker">Proposta de despedida de solteira</span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Despedida de solteira · turma privada</span>
        <h1>A despedida<br><em>perfeita</em></h1>
        <p class="lead">Um dia só de vocês, criativo e cheio de risada: a gente <strong>leva a experiência até Itu</strong>, com o profissional, todo o material e a estrutura. Cada convidada cria — e leva pra casa — a sua lembrança dessa festa. 🥂</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>7 convidadas</b></span>
          <span class="chip"><b>20</b> de novembro · feriado</span>
          <span class="chip"><b>Itu</b> · levamos até vocês</span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/pinturatacameninas.jpg" alt="Amigas juntas criando numa experiência Elarah" style="object-position:center 35%">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Experiências já realizadas para grupos como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)</div>
    {foot("Despedida · Itu · 20 de novembro")}
  </section>'''

como = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Como funciona</span></div>
    </div>
    <span class="eyebrow orange">◆ Só de vocês, do começo ao fim</span>
    <h2>A gente <em>leva</em> a festa</h2>
    <p class="lead">Vocês escolhem a(s) experiência(s), a gente cuida de todo o resto. É uma <strong>turma privada</strong> — só o grupo de vocês —, no lugar que preferirem em Itu (casa, pousada, espaço). Sem preocupação com nada: chega tudo pronto.</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">🎀</div><h3>Turma privada</h3><p>A experiência é exclusiva do grupo — só as 7 amigas, do jeitinho de vocês.</p></div>
      <div class="infocard"><div class="ico">🚗</div><h3>Levamos até Itu</h3><p>Profissional, material e estrutura por nossa conta — no endereço que vocês escolherem.</p></div>
      <div class="infocard"><div class="ico">💝</div><h3>Lembrança pra casa</h3><p>Cada convidada leva pra casa o que criou — a recordação perfeita da despedida.</p></div>
    </div>
    <div class="quote">
      <i>"As melhores histórias começam com as amigas reunidas."</i><br>
      — É isso que a Elarah leva pra vocês: uma tarde que vira <strong>memória (e foto) pra vida toda</strong>.
    </div>
    {foot("Como funciona")}
  </section>'''

menu = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">O menu de experiências</span></div>
    </div>
    <span class="eyebrow orange">◆ Escolham a vibe da galera</span>
    <h2>Quatro experiências <em>queridinhas</em></h2>
    <p class="lead">Dá pra escolher uma só ou combinar várias no mesmo dia — e aí entra o preço especial de pacote (na próxima página). O valor avulso de cada uma:</p>
    <div class="rule"></div>
    <div class="menu">
      {exp("01","pinturatacaa.jpg","Pintura em Taça","Cada uma pinta à mão a própria taça e brinda com a sua arte.","239","center 45%")}
      {exp("02","ceramicamodelagem.jpg","Cerâmica na Roda","Mão na argila: modelem a própria peça e levem pra casa.","239","center 50%")}
      {exp("03","drinksclassicos.jpg","Coquetelaria Autoral","Um bartender conduz — vocês criam (e provam) os próprios drinks.","239","center 50%")}
      {exp("04","velaflor.jpg","Vela Aromática","Criem a vela perfumada da despedida, do aroma ao rótulo.","239","center 50%")}
    </div>
    {foot("O menu de experiências")}
  </section>'''

vibe = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">A vibe</span></div>
    </div>
    <span class="eyebrow orange">◆ O que vocês vão sentir</span>
    <h2>Risada, taça na mão e <em>mão na massa</em></h2>
    <p class="lead">Mais que uma atividade: um encontro leve, afetivo e cheio de fotos boas — do tipo que a noiva e as amigas vão lembrar pra sempre.</p>
    <div class="vibe">
      <figure><img src="assets/aromaterapiameninas.jpg" alt="Amigas juntas numa experiência Elarah" style="object-position:center 40%"><figcaption>Juntas, do início ao fim</figcaption></figure>
      <figure><img src="assets/corp-grupo.jpg" alt="Amigas criando e rindo" style="object-position:center 40%"><figcaption>Criando lado a lado</figcaption></figure>
      <figure><img src="assets/encontro-1.jpg" alt="Amigas se divertindo" style="object-position:center 30%"><figcaption>Pura descontração</figcaption></figure>
    </div>
    {foot("A vibe da experiência")}
  </section>'''

invest = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Investimento</span></div>
    </div>
    <span class="eyebrow orange">◆ Valores</span>
    <h2>Uma experiência — ou o <em>pacote</em></h2>
    <p class="lead">Escolhendo uma só, o valor é o avulso. Combinando mais de uma no mesmo dia, entra o <strong>preço especial de pacote</strong> — quanto mais experiências, maior o desconto por pessoa.</p>
    <div class="rule"></div>
    <div class="invest">
      <div class="iblock">
        <h4>Escolhendo uma (avulsa)</h4>
        <div class="arow"><div class="an">Vela Aromática</div><div class="av">R$ 239<small>/pessoa</small></div></div>
        <div class="arow"><div class="an">Pintura em Taça</div><div class="av">R$ 239<small>/pessoa</small></div></div>
        <div class="arow"><div class="an">Coquetelaria Autoral</div><div class="av">R$ 239<small>/pessoa</small></div></div>
        <div class="arow"><div class="an">Cerâmica na Roda</div><div class="av">R$ 239<small>/pessoa</small></div></div>
      </div>
      <div class="iblock">
        <h4>Combinando experiências (pacote)</h4>
        <div class="pcards">
          <div class="pc"><div class="pl"><h5>2 experiências</h5><p>Vocês escolhem quais duas.</p></div><div class="pr"><span class="old">R$ 478</span><span class="big">R$ 439</span><span class="u">/pessoa</span></div></div>
          <div class="pc hl"><span class="ptag">Mais escolhido</span><div class="pl"><h5>3 experiências</h5><p>O trio favorito da despedida.</p></div><div class="pr"><span class="old">R$ 717</span><span class="big">R$ 649</span><span class="u">/pessoa</span></div></div>
        </div>
      </div>
    </div>
    <p class="fineprint">Valores por pessoa, para turma privada de 7 convidadas, com material, condução do profissional e toda a estrutura inclusos. Deslocamento da equipe até Itu já incluso. As experiências de pacote acontecem no mesmo dia, no endereço escolhido por vocês. Valores válidos para o feriado de 20 de novembro, sujeitos à confirmação de data e disponibilidade de agenda.</p>
    {foot("Investimento")}
  </section>'''

como2 = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Próximos passos</span></div>
    </div>
    <span class="eyebrow orange">◆ Bora reservar?</span>
    <h2>Vamos deixar tudo <em>pronto</em></h2>
    <p class="lead">Me confirma quais experiências vocês querem (uma ou o pacote) e a gente já reserva o 20 de novembro pra despedida. Qualquer dúvida, é só chamar — vou adorar montar esse dia com vocês. 🥂</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">1️⃣</div><h3>Escolham</h3><p>Uma experiência ou o pacote — me diz a vibe da galera.</p></div>
      <div class="infocard"><div class="ico">2️⃣</div><h3>Reservamos</h3><p>Confirmando a data, a gente segura o 20/11 pra vocês.</p></div>
      <div class="infocard"><div class="ico">3️⃣</div><h3>É só curtir</h3><p>No dia, chega tudo pronto em Itu. Vocês só aproveitam.</p></div>
    </div>
    <div class="quote">
      <i>Elarah · Experiências criativas</i><br>
      contato@elarah.com.br &nbsp;·&nbsp; <strong>elarah.com.br</strong> &nbsp;·&nbsp; @elarah
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = '<div class="deck">\n' + cover + como + menu + vibe + invest + como2 + '\n\n</div>\n\n'
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-despedida-itu.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, len(html), "bytes")
