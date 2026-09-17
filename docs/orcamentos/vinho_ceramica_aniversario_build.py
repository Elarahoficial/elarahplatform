# Cotacao aniversario · Vinho & Ceramica · 8 amigas · 27/09 · Vila Mariana/Moema
# Netas Atelie R$299 (levam o proprio vinho) · Sow Cafe (ceramica + cafe da tarde, sob consulta). Split entre 7.
# Paleta vinho + terracota.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

reps = {
    "--orange:#B08D4C;": "--orange:#B87351;",
    "--orange-dark:#8A6D34;": "--orange-dark:#8E5236;",
    "--navy:#12362B;": "--navy:#3C1F28;",
    "--navy-soft:#3A5A4E;": "--navy-soft:#6B4A52;",
    "--blue-accent:#B08D4C;": "--blue-accent:#B87351;",
    "#EFF3EE": "#FBF1EE", "#DCE8E1": "#F0DED6", "#CBB06E": "#CFA07E",
    "rgba(176,141,76,.24)": "rgba(184,115,81,.24)",
    "rgba(176,141,76,.26)": "rgba(184,115,81,.28)",
    "rgba(176,141,76,.10)": "rgba(184,115,81,.10)",
    "rgba(18,54,43,.16)": "rgba(60,31,40,.16)",
    "rgba(10,28,22,.86)": "rgba(32,16,22,.86)",
    "rgba(10,28,22,.85)": "rgba(32,16,22,.85)",
    "rgba(10,28,22,.82)": "rgba(32,16,22,.82)",
}
for a, b in reps.items():
    head = head.replace(a, b)

extra = '''
  .splitbox{display:flex;gap:18px;align-items:center;flex-wrap:wrap;margin-top:18px;background:var(--navy);color:#fff;border-radius:16px;padding:18px 24px}
  .splitbox .sv{font-family:'DM Serif Display',serif;font-size:30px;line-height:1;color:#fff}
  .splitbox .sl{font-size:12.5px;color:rgba(255,255,255,.9);line-height:1.5}
  .splitbox .sl b{color:var(--orange)}
</style>'''
head = head.replace("</style>", extra, 1)


def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'


def img(src, alt, pos="center 50%"):
    return f'<img src="assets/{src}" alt="{alt}" style="object-position:{pos}">'


def pslot(icon, label, sub):
    return f'<div class="pslot"><span class="pi">{icon}</span><span class="pl">{label}</span><span class="ps">{sub}</span></div>'


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


PROOF = "Experiências já realizadas para grupos como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)"

cover = f'''
  <section class="slide">
{head_block("Proposta de experiência · Aniversário", "Vinho", "& Cerâmica", "8 amigas · 27/09")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Aniversário · Vinho &amp; cerâmica</span>
        <h1>Um brinde à <em>amizade</em></h1>
        <p class="lead">A combinação perfeita pra celebrar: taça de vinho na mão e mão na argila. Guiadas por um artista, cada uma cria a própria peça de cerâmica enquanto brinda e conversa — e leva pra casa de lembrança. 🍷🏺</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>27/09</b></span>
          <span class="chip"><b>8</b> amigas</span>
          <span class="chip">Vila Mariana · Moema</span>
        </div>
      </div>
      <div class="cover-photo">{img("ceramica-meninas.jpg", "Amigas rindo numa experiência de cerâmica", "center 30%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Vinho & Cerâmica")}
  </section>'''

experiencia = f'''
  <section class="slide">
{head_simple("A experiência")}
    <span class="eyebrow orange">◆ Vinho &amp; cerâmica</span>
    <h2>Criar, brindar e <em>relaxar</em></h2>
    <p class="lead">Com um artista ao lado, a turma aprende a modelar ou pintar a própria peça de cerâmica, sem pressa e com a taça sempre por perto. É criativo, relaxante e cheio de conversa boa — do primeiro gole ao último detalhe. 🍷</p>
    <div class="bfeat">
      <div class="bphoto">{img("ceramicamodelagem.jpg", "Mãos modelando uma peça de cerâmica", "center 50%")}</div>
      <div class="bbody">
        <span class="btag">Como acontece</span>
        <h3>Da taça à peça pronta</h3>
        <ul class="feat">
          <li><span class="st">1</span><b>Boas-vindas</b> — a taça de vinho servida e a bancada montada.</li>
          <li><span class="st">2</span><b>Mão na argila</b> — cada uma cria a própria peça, guiada pelo artista.</li>
          <li><span class="st">3</span><b>Brinde final</b> — a peça fica pronta pra levar, e é só celebrar. 🥂</li>
        </ul>
      </div>
    </div>
    {foot("A experiência")}
  </section>'''

vibe = f'''
  <section class="slide">
{head_simple("A vibe")}
    <span class="eyebrow orange">◆ O que vocês vão sentir</span>
    <h2>Arte, vinho e <em>afeto</em></h2>
    <p class="lead">Um encontro leve e caloroso: cores, argila, taças cheias e muita risada. A tarde perfeita pra comemorar entre amigas — e ainda levar pra casa uma peça feita à mão. 🍷</p>
    <div class="vibe">
      <figure>{img("ceramicacool.jpg", "Peças de cerâmica autorais", "center 50%")}<figcaption>Peças autorais</figcaption></figure>
      <figure>{img("pinturapratoceramica.jpg", "Prato de cerâmica pintado à mão", "center 50%")}<figcaption>Pintura à mão</figcaption></figure>
      <figure>{img("vinhotintos.jpg", "Vinhos para o brinde", "center 50%")}<figcaption>Vinho &amp; brinde</figcaption></figure>
    </div>
    {foot("A vibe da experiência")}
  </section>'''

espacos = f'''
  <section class="slide">
{head_simple("Os espaços")}
    <span class="eyebrow orange">◆ Três opções de espaço</span>
    <h2>Onde <em>celebrar</em></h2>
    <p class="lead">Escolham a que mais combina com vocês — temos opções na Vila Mariana, Moema e Brooklin, e outras também, é só pedir. 🍷</p>
    <div class="vgrid" style="grid-template-columns:repeat(3,1fr)">
      <div class="vcard hl">
        <div class="vph">
          {img("netas-atelie.jpg", "Netas Ateliê — grupo na experiência de cerâmica", "center 40%")}
          <div class="vpr"><b>R$ 299</b><small>por pessoa</small></div>
        </div>
        <div class="vb">
          <span class="vt">Cerâmica + vinho</span>
          <h3>Netas Ateliê</h3>
          <p class="vaddr">Vocês levam o próprio vinho 🍷</p>
          <ul>
            <li>Cerâmica guiada por artista</li>
            <li>Vocês levam o vinho de vocês</li>
            <li>Turma de 8 a 10 pessoas</li>
          </ul>
        </div>
      </div>
      <div class="vcard">
        <div class="vph">
          {img("sowcafe.jpg", "Sow Café — cerâmica com opção de café da tarde", "center 50%")}
          <div class="vpr"><b>R$ 299</b><small>por pessoa</small></div>
        </div>
        <div class="vb">
          <span class="vt">Cerâmica</span>
          <h3>Sow Café</h3>
          <p class="vaddr">Café da tarde opcional, à parte ☕</p>
          <ul>
            <li>Cerâmica guiada por artista</li>
            <li>Café da tarde como opção à parte</li>
            <li>Turma de 8 a 10 pessoas</li>
          </ul>
        </div>
      </div>
      <div class="vcard">
        <div class="vph">
          {img("meu-outro-lado.jpg", "Ateliê Meu Outro Lado — espaço da experiência", "center 50%")}
          <div class="vpr"><b>R$ 359</b><small>por pessoa</small></div>
        </div>
        <div class="vb">
          <span class="vt">Cerâmica + vinho incluso</span>
          <h3>Ateliê Meu Outro Lado</h3>
          <p class="vaddr">Brooklin · vinho incluso 🍷</p>
          <ul>
            <li>Experiência completa de cerâmica</li>
            <li><b>Vinho já incluso</b> no valor</li>
            <li>Turma de 8 a 10 pessoas</li>
          </ul>
        </div>
      </div>
    </div>
    {foot("Os espaços")}
  </section>'''

pacotes = f'''
  <section class="slide">
{head_simple("Pacotes & valores")}
    <span class="eyebrow orange">◆ Outros pacotes</span>
    <h2>Deixe ainda mais <em>especial</em></h2>
    <p class="lead">Dá pra somar a qualquer espaço: registro fotográfico profissional e uma lembrancinha personalizada pra cada uma levar pra casa. 🤍</p>
    <div class="invbox">
      <div class="incl" style="flex:1;min-width:250px">
        <span class="vt">Foto profissional</span>
        <p style="font-size:12.5px;color:var(--muted);margin-top:6px;line-height:1.45">Registro fotográfico profissional da experiência, pra guardar cada momento.</p>
        <div style="font-family:'DM Serif Display',serif;font-size:28px;color:var(--navy);margin-top:10px">R$ 450 <span style="font-size:11px;color:var(--muted);font-family:-apple-system,sans-serif;text-transform:uppercase;letter-spacing:.06em;font-weight:600">valor fixo</span></div>
      </div>
      <div class="incl" style="flex:1;min-width:250px">
        <span class="vt">Lembrancinha</span>
        <p style="font-size:12.5px;color:var(--muted);margin-top:6px;line-height:1.45">Lembrancinha personalizada pra cada convidada levar pra casa de recordação.</p>
        <div style="font-family:'DM Serif Display',serif;font-size:28px;color:var(--navy);margin-top:10px">R$ 99 <span style="font-size:11px;color:var(--muted);font-family:-apple-system,sans-serif;text-transform:uppercase;letter-spacing:.06em;font-weight:600">por pessoa</span></div>
      </div>
    </div>
    <div class="splitbox">
      <span class="sv">÷ 7</span>
      <span class="sl">Pra <b>dividir entre as 7</b> que presenteiam: é o valor por pessoa × 8, dividido por 7. Ex.: <b>R$ 299 → R$ 342</b> cada · <b>R$ 359 → R$ 410</b> cada. Ajusta conforme o número final. 🤍</span>
    </div>
    <p class="fineprint">Netas Ateliê e Sow Café: R$ 299/pessoa (Netas: vocês levam o próprio vinho · Sow: café da tarde opcional à parte). Ateliê Meu Outro Lado (Brooklin): R$ 359/pessoa, experiência e vinho inclusos. Turma de 8 a 10. Pacotes: foto profissional R$ 450 (valor fixo) · lembrancinha personalizada R$ 99/pessoa. Aniversário em 27/09. Data e horário sujeitos à disponibilidade de agenda.</p>
    {foot("Pacotes & valores")}
  </section>'''

proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Bora brindar? 🥂</span>
    <h2>É só <em>escolher</em></h2>
    <p class="lead">Me confirma o espaço e o número de pessoas que a gente reserva tudo e organiza a experiência pra vocês. Qualquer dúvida, é só chamar. 🍷</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">1️⃣</div><h3>Escolham</h3><p>O espaço (Netas, Sow ou Meu Outro Lado) e o número de pessoas.</p></div>
      <div class="infocard"><div class="ico">2️⃣</div><h3>Reservamos</h3><p>A gente segura a agenda e organiza cada detalhe.</p></div>
      <div class="infocard"><div class="ico">3️⃣</div><h3>É só brindar</h3><p>No dia, chega tudo pronto. Vocês só criam e celebram.</p></div>
    </div>
    <div class="quote">
      <i>Elarah · Experiências criativas</i><br>
      contato@elarah.com.br &nbsp;·&nbsp; <strong>elarah.com.br</strong> &nbsp;·&nbsp; @elarah
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = '<div class="deck">\n' + cover + experiencia + vibe + espacos + pacotes + proximos + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/experiencia-vinho-ceramica-aniversario.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
