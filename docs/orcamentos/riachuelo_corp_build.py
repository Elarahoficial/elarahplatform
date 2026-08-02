# Build the Riachuelo corporate deck (creative integration) from the Compass template head/CSS.
import re
base = open("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html", encoding="utf-8").read()
head = base.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + base.split('<div class="toolbar">')[1]

def opt(n, name, emoji, lead, photo1, alt1, photo2, alt2, feat, perso, allin1, allin2, pos1="center 50%", pos2="center 50%"):
    fl = "".join(f"<li>{x}</li>" for x in feat)
    pl = "".join(f"<li>{x}</li>" for x in perso)
    return f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Opção {n} · {name}</span></div>
    </div>
    <span class="eyebrow orange">◆ Opção {n} · Integração criativa</span>
    <h2>{name} {emoji}</h2>
    <p class="lead">{lead}</p>
    <div class="meta">
      <span>📍 <b>Na Riachuelo</b> · levamos até vocês</span>
      <span>⏱️ Duração <b>2h30–3h</b></span>
    </div>
    <div class="rule"></div>
    <div class="plans">
      <div class="plan">
        <div class="plan-photo sq"><img src="{photo1}" alt="{alt1}" style="object-position:{pos1}"></div>
        <div class="plan-body">
          <span class="tag basic">A experiência</span>
          <h3>{name}</h3>
          <div class="price soft">sob consulta<small>valor por pessoa</small></div>
          <ul class="feat">{fl}</ul>
          <span class="allin">{allin1}</span>
        </div>
      </div>
      <div class="plan featured">
        <span class="ribbon">★ Com a sua marca</span>
        <div class="plan-photo sq"><img src="{photo2}" alt="{alt2}" style="object-position:{pos2}"></div>
        <div class="plan-body">
          <span class="tag premium">Personalização</span>
          <h3>Com a Riachuelo</h3>
          <div class="more">Tudo da experiência, e mais</div>
          <ul class="feat">{pl}</ul>
          <span class="allin">{allin2}</span>
        </div>
      </div>
    </div>
    <div class="slide__foot"><span>Elarah · Experiências</span><span>Opção {n} · {name}</span></div>
  </section>'''

cover = '''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right">
        <span class="kicker">Proposta de experiência corporativa para</span>
        <span class="compass">RIACHU<span>E</span>LO<small>integração do time</small></span>
      </div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência Corporativa · Integração</span>
        <h1>Experiências<br>que <em>integram</em></h1>
        <p class="lead">Um encontro criativo pra <strong>tirar o time da rotina e integrar de verdade</strong> — leve, divertido e com a mão na massa. A gente leva tudo até vocês, <strong>aí na Riachuelo</strong>.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>20 pessoas</b></span>
          <span class="chip"><b>02</b> de setembro</span>
          <span class="chip">Integração · <b>criativo</b></span>
        </div>
      </div>
      <div class="cover-photo">
        <img src="assets/eventocorporativo.jpg" alt="Time reunido em um encontro Elarah, criando e se conectando">
      </div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> Já realizado para times como <b>Nubank</b> e <b>Adyen</b> · visto no <b>Mais Você</b> (Globo)</div>
    <div class="slide__foot"><span>Elarah · Experiências</span><span>Experiência Corporativa · Riachuelo</span></div>
  </section>'''

buscamos = '''
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
      <div class="infocard"><div class="ico">🤝</div><h3>Conexão de verdade</h3><p>Todo mundo criando junto — a atividade é o pretexto; a integração é o que fica.</p></div>
      <div class="infocard"><div class="ico">🎨</div><h3>Criativo e leve</h3><p>Mão na massa, acessível pra qualquer área, idade ou nível — e cada um leva a sua criação.</p></div>
      <div class="infocard"><div class="ico">🏢</div><h3>Aí na empresa</h3><p>A gente leva tudo até a Riachuelo — material, condução e estrutura. Vocês só vivem o dia.</p></div>
    </div>
    <div class="quote">
      <i>"Os melhores times se constroem fora da mesa de reunião."</i><br>
      — É isso que a Elarah leva pra Riachuelo: um encontro que vira <strong>história pra contar no corredor</strong>.
    </div>
    <div class="slide__foot"><span>Elarah · Experiências</span><span>Pensado pra Riachuelo</span></div>
  </section>'''

o1 = opt(1, "Tufting", "🧶",
  "Com a pistola de tufting, cada pessoa cria a sua peça decorativa — tapete ou quadro. Criativo, relaxante e cheio de personalidade, perfeito pra soltar e integrar o time. <strong>Cada um leva a sua pra casa.</strong>",
  "assets/tufting6.jpg", "Time criando peças de tufting juntos",
  "assets/pecaadyen.jpg", "Dupla exibindo a peça de tufting que criaram",
  ["Aula de tufting com instrutor(a)", "Todo o material e estrutura", "A sua peça pra levar pra casa", "Turma do time (até 20 pessoas)"],
  ["Peça maior / acabamento premium", "Coffee break completo", "<b>Personalização com a marca da Riachuelo</b> (brindes e lembrancinhas)"],
  "Cada um leva a sua arte", "Experiência + brindes", pos2="center 35%")

o2 = opt(2, "Cerâmica", "🏺",
  "Cada pessoa modela a sua peça <strong>em cerâmica fria, à mão</strong> — sensorial, relaxante e cheia de significado. Uma experiência que aproxima o time em volta da mesa. Cada um leva a sua criação pra casa.",
  "assets/desp-hero4.jpg", "Mesa montada para a experiência de modelagem em cerâmica fria",
  "assets/ceramicafamiliamais12.jpg", "Time modelando peças de cerâmica juntos",
  ["Modelagem em cerâmica fria, à mão", "Massa e todos os materiais", "Condução por ceramista", "A peça seca naturalmente e vai pra casa"],
  ["Mesa temática montada pro time", "Coffee break completo", "<b>Personalização com a marca da Riachuelo</b> (brindes e lembrancinhas)"],
  "Cada um leva a sua peça", "Experiência + brindes", pos1="center 30%", pos2="center 40%")

o3 = opt(3, "Pintura em Tela", "🎨",
  "Cada pessoa pinta a sua tela autoral — do jeito que quiser. Criativo, leve e cheio de estilo, ótimo pra descontrair e integrar. <strong>Cada um leva a sua obra pra casa.</strong>",
  "assets/pintura.jpg", "Time pintando telas num ateliê",
  "assets/quadropintado.jpg", "Pessoas exibindo as telas que pintaram",
  ["Pintura em tela com facilitadora", "Telas, tintas e cavaletes", "A sua obra pra levar pra casa", "Turma do time (até 20 pessoas)"],
  ["Avental personalizado (cada um leva o seu)", "Coffee break completo", "<b>Personalização com a marca da Riachuelo</b> (brindes e lembrancinhas)"],
  "Cada um leva a sua obra", "Experiência + brindes", pos2="center 55%")

o4 = opt(4, "Perfumaria Natural", "🌿",
  "Cada pessoa cria a sua fragrância botânica, do zero — uma imersão sensorial guiada por perfumista. Diferente, sofisticada e cheia de conexão. <strong>Cada um leva o seu perfume.</strong>",
  "assets/perfumariaharbolita.jpg", "Mesa de essências e frascos da experiência de perfumaria",
  "assets/perfumes10.jpg", "Pessoas testando notas e criando o próprio perfume",
  ["Menu de essências naturais", "Materiais, frasco e condução", "Cada um cria e leva o seu perfume", "Turma do time (até 20 pessoas)"],
  ["Rótulo personalizado do perfume", "Coffee break completo", "<b>Personalização com a marca da Riachuelo</b> (brindes e lembrancinhas)"],
  "Cada um leva o seu perfume", "Experiência + brindes", pos1="center 45%", pos2="center 40%")

como = '''
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
      <div class="step"><div class="num">1</div><h3>Escolhem a experiência</h3><p>Tufting, cerâmica, pintura ou perfumaria.</p></div>
      <div class="step"><div class="num">2</div><h3>A gente leva até vocês</h3><p>Aí na Riachuelo — material, condução e estrutura por nossa conta.</p></div>
      <div class="step"><div class="num">3</div><h3>O time vive e integra</h3><p>Vocês só chegam, se soltam e se conectam.</p></div>
    </div>
    <div class="addon">
      <span class="plus">➕</span>
      <div>
        <h4>Momento da empresa</h4>
        <p>Reservem <b>+1h no mesmo encontro</b> pra fala, brinde e agradecimento do time — assim vocês têm o período todo, sem correria. <b>Sem custo adicional: é por nossa conta.</b> 💛</p>
      </div>
    </div>
    <div class="cta">
      <h2>Bora integrar o time da <em>Riachuelo?</em> ✦</h2>
      <p>Me conta qual experiência mais chamou, que a gente fecha cada detalhe do encontro de 02 de setembro.</p>
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
    <p class="fineprint">Experiências criativas para integração de time, para cerca de 20 participantes, realizadas na sua empresa. Cada experiência dura cerca de 2h30–3h, com +1h para o momento da empresa, sem custo adicional. Incluem material, condução e estrutura. Valores por pessoa sob consulta. Proposta válida mediante confirmação de data (02 de setembro), experiência e disponibilidade de agenda.</p>
    <div class="slide__foot"><span>elarah.com.br · @elarah.oficial</span><span>Experiência Corporativa · Riachuelo · 2026</span></div>
  </section>'''

deck = '<div class="deck">\n' + cover + buscamos + o1 + o2 + o3 + o4 + como + '\n\n</div>\n\n'
html = head + deck + tail
out = "/home/user/elarahplatform/experiencia-corporativa-riachuelo.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides: 7 | Compass refs:", html.count("Compass"))
