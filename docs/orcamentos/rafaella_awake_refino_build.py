# Refino do deck Awake / Rafaella — mais atmosfera e proposito, papel da Elarah,
# 3 experiencias como protagonistas (com "por que combina") + opcionais (sob consulta).
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/proposta-rafaella-awake.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]

head = re.sub(r'<title>.*?</title>', '<title>Awake Health · Rafaella · Elarah</title>', head, count=1, flags=re.DOTALL)


def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'


def hsimple(kicker):
    return f'''    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">{kicker}</span></div>
    </div>'''


def experiencia(kicker, marca, titulo_a, titulo_b, lead, foto, pos, preco, total, inclui, porque, foot_r):
    lis = "\n".join(f"          <li>{i}</li>" for i in inclui)
    return f'''
  <section class="slide">
{hsimple(kicker)}
    <span class="eyebrow orange">◆ {marca}</span>
    <h2>{titulo_a} <em>{titulo_b}</em></h2>
    <p class="lead">{lead}</p>
    <div class="phero">
      <div class="pheroph"><img src="assets/{foto}" alt="{titulo_a} {titulo_b}" style="object-position:{pos}"></div>
      <div class="pval">
        <span class="pct">{marca}</span>
        <div class="pbig">{preco}</div>
        <span class="pper">por pessoa</span>
        <div class="pgrp">{total}<small>grupo de 15</small></div>
        <ul class="pinc">
{lis}
        </ul>
      </div>
    </div>
    <div class="bnote" style="margin-top:18px">◆ <b>Por que combina:</b> {porque}</div>
    {foot(foot_r)}
  </section>'''


cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right">
        <span class="kicker">Experiência · manhã na Awake Health</span>
        <span class="compass">Rafaella <span></span><small>Awake Health · Jardim América</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Um encontro sensorial &amp; autoral</span>
        <h1>Uma manhã para <em>criar juntas</em></h1>
        <p class="lead">Uma experiência sensorial para receber suas convidadas na <strong>Awake Health</strong>. Uma manhã de <strong>pausa, conexão e criação</strong> — cada uma coloca a mão na massa e leva uma lembrança feita por ela.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>até 15</b> convidadas</span>
          <span class="chip">Sábado · 03/10 · manhã</span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip">Awake Health · Jardim América</span>
        </div>
      </div>
      <div class="cover-photo"><img src="assets/aromaterapiameninas.jpg" alt="Grupo de mulheres em uma experiência criativa e delicada" style="object-position:center 40%"></div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Experiências já realizadas para grupos como <b>Compass</b> e <b>Hidratei</b> · vistas no <b>Mais Você</b> (Globo)</div>
    {foot("Awake Health · Rafaella")}
  </section>'''

atmosfera = f'''
  <section class="slide">
{hsimple("A atmosfera")}
    <span class="eyebrow orange">◆ A atmosfera do encontro</span>
    <h2>Uma pausa para <em>sentir e criar</em></h2>
    <p class="lead">Entre aromas, texturas e boas conversas, cada convidada desacelera e cria com as próprias mãos. Delicado, contemporâneo e cheio de presença — do tipo de manhã que fica na memória.</p>
    <div class="vibe">
      <figure><img src="assets/antonella-vibe-risada.jpg" alt="Mulheres rindo enquanto criam juntas" style="object-position:center 30%"><figcaption>Criar juntas</figcaption></figure>
      <figure><img src="assets/perfumaria-oficina.jpg" alt="Detalhe sensorial de uma oficina delicada" style="object-position:center 55%"><figcaption>Sensorial &amp; delicado</figcaption></figure>
      <figure><img src="assets/abraco-elegante.jpg" alt="Convidadas em um momento de conexão" style="object-position:center 25%"><figcaption>Conexão de verdade</figcaption></figure>
    </div>
    {foot("A atmosfera do encontro")}
  </section>'''

elarah = f'''
  <section class="slide">
{hsimple("A Elarah cuida de tudo")}
    <span class="eyebrow orange">◆ Do seu lado, do início ao fim</span>
    <h2>A experiência acontece, e o resto é <em>com a gente</em></h2>
    <p class="lead">A Awake recebe; a Elarah cuida de toda a produção. Você só precisa estar presente com as suas convidadas.</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">🤍</div><h3>A gente vai até vocês</h3><p>Levamos a experiência inteira à Awake — fornecedor, materiais e equipe.</p></div>
      <div class="infocard"><div class="ico">✨</div><h3>Cuidado nos detalhes</h3><p>Montagem, condução e organização por nossa conta, do início ao fim.</p></div>
      <div class="infocard"><div class="ico">🌿</div><h3>Você só aproveita</h3><p>Rafaella recebe as convidadas e vive o momento — sem pensar na operação.</p></div>
    </div>
    {foot("A Elarah cuida de tudo")}
  </section>'''

lip = experiencia(
    "Experiência 1 · protagonista", "Pollen &amp; Pop",
    "Lip Balm", "Autoral",
    "Cada convidada cria o próprio lip balm natural, escolhendo aromas, cores e textura. Autocuidado em forma de ritual.",
    "lipbalm.jpg", "center 50%", "R$ 280", "R$ 4.200",
    ["Criação de um lip balm natural exclusivo", "Curadoria de aromas, cores e ingredientes", "Materiais e condução da Pollen &amp; Pop", "Peça pronta para levar no mesmo dia"],
    "um gesto de autocuidado que conversa diretamente com o universo da Awake e da dermatologia. 🤍",
    "Experiência 1 · Lip Balm Autoral")

taca = experiencia(
    "Experiência 2 · protagonista", "Ateliê Meu Outro Lado",
    "Pintura de", "Taça",
    "Cada uma personaliza a própria taça de vidro, no seu tempo e no seu traço. Sem regra — só o prazer de criar.",
    "pinturataca.jpg", "center 45%", "R$ 180", "R$ 2.700",
    ["Personalização de uma taça de vidro", "Tintas, pincéis e materiais", "Orientação durante toda a experiência", "A taça pronta para levar no mesmo dia"],
    "leve e descontraída, abre a manhã com criatividade e boas risadas entre o grupo.",
    "Experiência 2 · Pintura de Taça")

charm = experiencia(
    "Experiência 3 · protagonista", "Ateliê Agir",
    "Charm de", "Bolsa",
    "Cada convidada compõe um charm exclusivo, escolhendo pedras, letras e detalhes. Uma peça para levar e usar todo dia.",
    "charm-bolsa.jpg", "center 50%", "R$ 179", "R$ 2.685",
    ["Criação de um charm de bolsa exclusivo", "Curadoria de pedras, letras e charms", "Materiais e condução do Ateliê Agir", "Peça pronta para levar no mesmo dia"],
    "delicado e personalizável, vira um mimo afetivo que cada uma leva de recordação.",
    "Experiência 3 · Charm de Bolsa")

opcionais = f'''
  <section class="slide">
{hsimple("Opcionais")}
    <span class="eyebrow orange">◆ Para deixar ainda mais especial</span>
    <h2>Camadas <em>sob medida</em></h2>
    <p class="lead">Toques extras para elevar o encontro, se fizer sentido para vocês.</p>
    <div class="vgrid">
      <div class="vcard">
        <div class="vph"><img src="assets/vela-aromatica-real.jpg" alt="Um presente delicado e sensorial" style="object-position:center 45%"></div>
        <div class="vb">
          <span class="vt">Opcional</span>
          <h3>Um mimo a mais</h3>
          <p>Um presente delicado para cada convidada levar — alinhado à identidade da Awake e ao clima da manhã.</p>
          <span style="margin-top:auto;padding-top:12px;font-family:'DM Serif Display',serif;font-size:19px;color:var(--orange-dark)">Sob consulta</span>
        </div>
      </div>
      <div class="vcard">
        <div class="vph"><img src="assets/mimos-registro.jpg" alt="Registro fotográfico do encontro" style="object-position:center 40%"></div>
        <div class="vb">
          <span class="vt">Opcional</span>
          <h3>Registro fotográfico</h3>
          <p>Cobertura do encontro — detalhes, processo criativo e momentos espontâneos, prontos para as redes da Rafaella e da Awake.</p>
          <span style="margin-top:auto;padding-top:12px;font-family:'DM Serif Display',serif;font-size:19px;color:var(--orange-dark)">Sob consulta</span>
        </div>
      </div>
    </div>
    {foot("Opcionais")}
  </section>'''

proximos = f'''
  <section class="slide">
{hsimple("Próximos passos")}
    <span class="eyebrow orange">◆ Próximos passos</span>
    <h2>Vamos <em>desenhar juntas</em></h2>
    <p class="lead">Me conta qual experiência mais combina com a manhã de vocês que eu cuido de toda a produção e confirmo a disponibilidade para a data. 🤍</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">1️⃣</div><h3>Escolham a experiência</h3><p>A que mais combina com a manhã e com as convidadas.</p></div>
      <div class="infocard"><div class="ico">2️⃣</div><h3>Cuidamos de tudo</h3><p>Fornecedor, materiais, equipe e montagem por nossa conta.</p></div>
      <div class="infocard"><div class="ico">3️⃣</div><h3>Vocês só recebem</h3><p>No dia, é só receber as convidadas e viver o momento.</p></div>
    </div>
    <div class="quote">
      Rafaella, é só me dar o sinal que eu deixo tudo pronto para a Awake. 🤍<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = '<div class="deck">\n' + cover + atmosfera + elarah + lip + taca + charm + opcionais + proximos + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/proposta-rafaella-awake.html"
io.open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
