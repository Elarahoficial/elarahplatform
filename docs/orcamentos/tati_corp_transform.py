# Adapt the Compass corporate deck into a generic proposal for Tati (50 pax, Dec 07/14).
src = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/compass_latest.html"
out = "/home/user/elarahplatform/experiencia-corporativa-tati.html"
h = open(src, encoding="utf-8").read()

R = [
 # title / meta
 ("<title>Experiência Corporativa · Elarah × Compass</title>",
  "<title>Experiência Corporativa · Elarah</title>"),
 ('content="Proposta de experiência corporativa da Elarah para a Compass gás & energia — team building que conecta o time, pertinho da Faria Lima."',
  'content="Proposta de experiência corporativa da Elarah — team building que conecta o seu time, no seu espaço ou em espaço parceiro."'),
 # cover co-brand block
 ('<span class="kicker">Proposta de experiência corporativa para</span>\n        <span class="compass">COMP<span>A</span>SS<small>gás &amp; energia</small></span>',
  '<span class="kicker">Proposta de experiência corporativa</span>\n        <span class="compass">Evento de <span>fim de ano</span><small>07 ou 14 de dezembro</small></span>'),
 # cover lead
 ('A gente cuida de tudo, num espaço parceiro <strong>pertinho da Faria Lima</strong>.',
  'A gente cuida de tudo — <strong>no seu espaço ou num espaço parceiro nosso</strong>.'),
 # cover chips
 ('<span class="chip">Até <b>15 pessoas</b></span>\n          <span class="chip"><b>Meio</b> período</span>\n          <span class="chip">Perto da <b>Faria Lima</b></span>',
  '<span class="chip">Até <b>50 pessoas</b></span>\n          <span class="chip"><b>Meio</b> período</span>\n          <span class="chip"><b>07 ou 14</b> de dezembro</span>'),
 # slide2 "perto e prático"
 ('Meio período, num espaço parceiro pertinho do escritório. A gente cuida de tudo.',
  'No seu espaço ou num espaço parceiro nosso — meio período, e a gente cuida de tudo.'),
 # slide2 quote
 ('— É isso que a Elarah leva pra Compass: um encontro que vira',
  '— É isso que a Elarah leva pra o seu time: um encontro que vira'),
 # Teatro meta address
 ('<span>📍 <b>Alameda dos Anapurus, 1190</b> · Moema</span>\n      <span>⏱️ Duração <b>2h30–3h</b></span>\n    </div>\n    <div class="rule"></div>\n\n    <div class="plans">\n      <div class="plan">\n        <div class="plan-photo sq"><img src="assets/rockworld1.jpg"',
  '<span>📍 <b>No seu espaço</b> ou parceiro nosso</span>\n      <span>⏱️ Duração <b>2h30–3h</b></span>\n    </div>\n    <div class="rule"></div>\n\n    <div class="plans">\n      <div class="plan">\n        <div class="plan-photo sq"><img src="assets/rockworld1.jpg"'),
 # Teatro premium photo
 ('<div class="plan-photo sq"><img src="assets/personalizacaocompass.png" alt="Brindes personalizados com a marca Compass"></div>',
  '<div class="plan-photo sq"><img src="assets/corp-conexao.jpg" alt="Time se conectando e comemorando junto" style="object-position:center 45%"></div>'),
 # Gastronomia meta address
 ('<span>📍 <b>Rua Nova Orleans, 34</b> · Brooklin</span>',
  '<span>📍 <b>No seu espaço</b> ou parceiro nosso</span>'),
 # Gastronomia premium photo + apron bullet
 ('<div class="plan-photo sq"><img src="assets/personalizacaocompass1.png" alt="Time da Compass de avental personalizado numa aula de culinária asiática" style="object-position:30% center"></div>',
  '<div class="plan-photo sq"><img src="assets/corp-grupo.jpg" alt="Time cozinhando junto, de avental, numa aula de gastronomia" style="object-position:center 55%"></div>'),
 ('<li><b>Avental personalizado</b> Compass (cada um leva o seu)</li>',
  '<li><b>Avental personalizado</b> (cada um leva o seu)</li>'),
 # Tufting meta address
 ('<span>📍 <b>Alameda dos Anapurus, 1190</b> · Moema</span>\n      <span>⏱️ Duração <b>2h30–3h</b></span>\n    </div>\n    <div class="rule"></div>\n\n    <div class="plans">\n      <div class="plan">\n        <div class="plan-photo sq"><img src="assets/tufting6.jpg"',
  '<span>📍 <b>No seu espaço</b> ou parceiro nosso</span>\n      <span>⏱️ Duração <b>2h30–3h</b></span>\n    </div>\n    <div class="rule"></div>\n\n    <div class="plans">\n      <div class="plan">\n        <div class="plan-photo sq"><img src="assets/tufting6.jpg"'),
 # how-it-works step 2
 ('Espaço nosso em Moema ou Brooklin, material e condução — tudo por nossa conta.',
  'No seu espaço ou num espaço parceiro nosso — material e condução por nossa conta.'),
 # CTA
 ('<h2>Bora conectar o time da <em>Compass?</em> ✦</h2>',
  '<h2>Bora conectar o <em>seu time?</em> ✦</h2>'),
 ('%20corporativa%20pra%20Compass%20e%20quero%20fechar%20os%20detalhes.',
  '%20corporativa%20e%20quero%20fechar%20os%20detalhes.'),
 # fineprint
 ('Valores por pessoa, para turmas de até 15 participantes. Cada experiência dura cerca de 2h30–3h, com +1h no mesmo espaço para o momento da empresa, sem custo adicional. Incluem material, condução e estrutura no espaço. Endereços: Alameda dos Anapurus, 1190 · Moema (Teatro e Tufting) e Rua Nova Orleans, 34 · Brooklin (Gastronomia). Proposta válida mediante confirmação de data, experiência e disponibilidade de agenda.',
  'Valores por pessoa, para o seu grupo (base 50 pessoas). Cada experiência dura cerca de 2h30–3h, com +1h no mesmo espaço para o momento da empresa, sem custo adicional. Incluem material, condução e estrutura. Realização no seu espaço ou em espaço parceiro nosso (São Paulo). Proposta válida mediante confirmação de data (07 ou 14 de dezembro), experiência e disponibilidade de agenda.'),
]

# global replacements
G = [
 ("Pensado pra Compass", "Pensado pra o seu time"),
 ("Personalização com a marca Compass", "Personalização com a marca da sua empresa"),
 ("<li>Turma de até 15 pessoas</li>", "<li>Materiais e estrutura pra todo o time</li>"),
 ("Experiência Corporativa · Compass", "Experiência Corporativa"),
]

missing = []
for a, b in R:
    if a not in h:
        missing.append(a[:60])
    h = h.replace(a, b)
for a, b in G:
    h = h.replace(a, b)

open(out, "w", encoding="utf-8").write(h)
print("wrote", out)
print("remaining 'Compass' count:", h.count("Compass"))
print("remaining 'Faria Lima':", h.count("Faria Lima"), "| 'até 15':", h.count("até 15"))
if missing:
    print("!! UNMATCHED:", missing)
else:
    print("all targeted replacements matched")
