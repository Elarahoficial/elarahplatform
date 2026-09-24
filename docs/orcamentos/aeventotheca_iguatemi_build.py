# Proposta Elarah · Aeventotheca (Marina Dias) · 02/10 · Shopping Iguatemi Campinas
# DUAS experiencias no mesmo dia, mesmo peso:
#   11h · LACES · Criacao de Sais de Banho · 12-15 pessoas
#   17h · Piselli · Chas, ervas & blends · 10 pessoas
# Fornecedores em cotacao: SEM nomes, SEM valores, SEM duracao, SEM ingredientes obrigatorios, SEM itens nao confirmados.
# Placeholders discretos e editaveis. Padrao visual corporativo Elarah (head.html). Paleta herbal + gold + marfim.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

reps = {
    "--orange:#B08D4C;": "--orange:#9C8A5E;",
    "--orange-dark:#8A6D34;": "--orange-dark:#786A3F;",
    "--navy:#12362B;": "--navy:#2C3A30;",
    "--navy-soft:#3A5A4E;": "--navy-soft:#586657;",
    "--blue-accent:#B08D4C;": "--blue-accent:#9C8A5E;",
    "#EFF3EE": "#F5F2EA", "#DCE8E1": "#E6E0D2", "#CBB06E": "#C3AE7C",
    "rgba(18,54,43,.16)": "rgba(44,58,48,.16)",
    "rgba(10,28,22,.86)": "rgba(28,36,30,.86)",
    "rgba(10,28,22,.85)": "rgba(28,36,30,.85)",
    "rgba(10,28,22,.82)": "rgba(28,36,30,.82)",
}
for a, b in reps.items():
    head = head.replace(a, b)

xcss = '''
  /* visao geral do dia */
  .daygrid{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:20px}
  .daycard{background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 16px 36px -24px rgba(0,0,0,.3);display:flex;flex-direction:column}
  .daycard .dph{height:210px;overflow:hidden;position:relative}
  .daycard .dph img{width:100%;height:100%;object-fit:cover;display:block}
  .daycard .dtime{position:absolute;top:13px;left:13px;background:var(--navy);color:#fff;font-family:'DM Serif Display',serif;font-size:19px;padding:5px 15px;border-radius:999px}
  .daycard .db{padding:20px 24px 24px;flex:1;display:flex;flex-direction:column}
  .daycard .dvenue{font-size:10px;letter-spacing:.15em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .daycard h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:23px;color:var(--navy);line-height:1.06;margin:5px 0 0}
  .daycard .dsub{font-size:12.5px;color:var(--navy-soft);line-height:1.45;margin-top:9px;font-style:italic}
  .daycard .dppl{font-size:11.5px;letter-spacing:.03em;color:var(--muted);border-top:1px solid var(--line);padding-top:12px;margin-top:14px}
  /* legenda de espaço (contexto do local) */
  .vcap{margin-top:12px;font-size:11px;letter-spacing:.02em;color:var(--muted);line-height:1.5}
  .vcap b{color:var(--orange-dark);letter-spacing:.06em;text-transform:uppercase;font-size:10px}
  /* 4 etapas */
  .steps.s4{grid-template-columns:repeat(4,1fr);gap:14px}
  .steps.s4 .step{padding:20px 18px}
  .steps.s4 .step .num{font-size:30px}
  /* tabela de investimento */
  .invt{width:100%;border-collapse:collapse;margin-top:20px;border-radius:16px;overflow:hidden;box-shadow:0 16px 34px -24px rgba(0,0,0,.3)}
  .invt td{padding:22px 26px;border-bottom:1px solid var(--line);background:var(--card);vertical-align:middle}
  .invt tr:last-child td{border-bottom:none}
  .invt .nm{font-family:'DM Serif Display',serif;font-size:21px;color:var(--navy);line-height:1.1}
  .invt .nm span{display:block;font-family:'DM Sans',sans-serif;font-size:10.5px;letter-spacing:.06em;color:var(--muted);text-transform:uppercase;margin-top:5px;font-weight:600}
  .invt .vl{text-align:right;font-family:'DM Serif Display',serif;font-size:25px;color:var(--orange-dark);white-space:nowrap}
  .invt .ph{color:var(--muted);letter-spacing:.14em}
  .invt tr.tot td{background:var(--navy)}
  .invt tr.tot .nm{color:#fff}
  .invt tr.tot .vl{color:#fff}
  .invt tr.tot .nm span{color:rgba(255,255,255,.7)}
  /* nota discreta / placeholder */
  .phnote{margin-top:14px;font-size:11.5px;color:var(--muted);line-height:1.5;border-left:2px solid var(--line);padding-left:14px}
  .phnote b{color:var(--navy-soft)}
  /* slide de experiencia consolidado */
  .exbig{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:18px;align-items:stretch}
  .exphotos{display:flex;flex-direction:column;gap:12px}
  .exmain{flex:1;border-radius:18px;overflow:hidden;position:relative;min-height:300px;border:1px solid var(--line)}
  .exmain img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .exthumb{height:118px;border-radius:14px;overflow:hidden;position:relative;border:1px solid var(--line)}
  .exthumb img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .exthumb .cap{position:absolute;left:0;right:0;bottom:0;padding:18px 12px 8px;background:linear-gradient(to top,rgba(28,36,30,.88),transparent);color:#fff;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;font-weight:700}
  .exbody{display:flex;flex-direction:column;justify-content:center}
  .extag{align-self:flex-start;background:var(--navy);color:#fff;font-size:9.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:6px 14px;border-radius:999px;margin-bottom:13px}
  .exbody h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:27px;color:var(--navy);line-height:1.05}
  .exbody .exc{font-size:13px;color:var(--muted);line-height:1.55;margin-top:11px}
  .exincl{margin-top:18px;padding-top:15px;border-top:1px solid var(--line)}
  .exincl .il{font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin-bottom:9px}
  .exincl ul{list-style:none;display:flex;flex-direction:column;gap:7px}
  .exincl li{position:relative;padding-left:18px;font-size:11.5px;color:var(--ink);line-height:1.4}
  .exincl li::before{content:"\\2726";position:absolute;left:0;top:1px;color:var(--orange);font-size:10px}
  /* investimento · 3 colunas */
  .invt3{width:100%;border-collapse:collapse;margin-top:20px;border-radius:16px;overflow:hidden;box-shadow:0 16px 34px -24px rgba(0,0,0,.3)}
  .invt3 th{background:var(--navy);color:#fff;text-align:right;padding:14px 20px;font-size:9.5px;letter-spacing:.07em;text-transform:uppercase;font-weight:700}
  .invt3 th.l{text-align:left}
  .invt3 td{padding:20px;border-bottom:1px solid var(--line);background:var(--card);vertical-align:middle;text-align:right}
  .invt3 tr:last-child td{border-bottom:none}
  .invt3 .nm{text-align:left;font-family:'DM Serif Display',serif;font-size:20px;color:var(--navy);line-height:1.1}
  .invt3 .nm span{display:block;font-family:'DM Sans',sans-serif;font-size:10px;letter-spacing:.05em;color:var(--muted);text-transform:uppercase;margin-top:4px;font-weight:600}
  .invt3 .ppl{font-family:'DM Serif Display',serif;font-size:20px;color:var(--navy);white-space:nowrap}
  .invt3 .val{font-family:'DM Serif Display',serif;font-size:20px;color:var(--orange-dark);white-space:nowrap}
  .invt3 .ph{color:var(--muted);letter-spacing:.12em;font-family:'DM Serif Display',serif}
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


def daycard(time, venue, name, sub, ppl, src, alt, pos="center 50%"):
    return (f'<div class="daycard"><div class="dph"><span class="dtime">{time}</span>{img(src, alt, pos)}</div>'
            f'<div class="db"><span class="dvenue">{venue}</span><h3>{name}</h3>'
            f'<p class="dsub">{sub}</p><div class="dppl">{ppl}</div></div></div>')


def bfeat(tag, title, feats, src, alt, pos="center 50%"):
    lis = "".join(f'<li><span class="st">✦</span>{f}</li>' for f in feats)
    return (f'<div class="bfeat"><div class="bphoto">{img(src, alt, pos)}</div>'
            f'<div class="bbody"><span class="btag">{tag}</span><h3>{title}</h3>'
            f'<ul class="feat">{lis}</ul></div></div>')


def exbig(tag, title, concept, itens, main_src, main_alt, thumb_src, thumb_alt, thumb_cap,
          main_pos="center 50%", thumb_pos="center 50%"):
    lis = "".join(f"<li>{i}</li>" for i in itens)
    return (f'<div class="exbig">'
            f'<div class="exphotos">'
            f'<div class="exmain">{img(main_src, main_alt, main_pos)}</div>'
            f'<div class="exthumb">{img(thumb_src, thumb_alt, thumb_pos)}<div class="cap">{thumb_cap}</div></div>'
            f'</div>'
            f'<div class="exbody"><span class="extag">{tag}</span><h3>{title}</h3>'
            f'<p class="exc">{concept}</p>'
            f'<div class="exincl"><div class="il">O que está contemplado</div><ul>{lis}</ul></div>'
            f'</div></div>')


def steps4(items):
    st = "".join(f'<div class="step"><div class="num">{i+1}</div><h3>{t}</h3><p>{d}</p></div>'
                 for i, (t, d) in enumerate(items))
    return f'<div class="steps s4">{st}</div>'


def incl(src, alt, title, items, pos="center 50%", cap=""):
    lis = "".join(f'<li><span>✦</span>{i}</li>' for i in items)
    capdiv = (f'<div style="position:absolute;left:0;right:0;bottom:0;padding:22px 14px 11px;'
              f'background:linear-gradient(to top,rgba(28,36,30,.85),transparent);color:#fff;'
              f'font-size:10.5px;letter-spacing:.06em;font-weight:600">{cap}</div>') if cap else ''
    return (f'<div class="invbox">'
            f'<div style="flex:0 0 40%;min-width:250px;border-radius:18px;overflow:hidden;position:relative;min-height:280px;border:1px solid var(--line)">'
            f'<img src="assets/{src}" alt="{alt}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:{pos}">{capdiv}</div>'
            f'<div class="incl" style="flex:1;min-width:290px;display:flex;flex-direction:column;justify-content:center">'
            f'<span class="vt" style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)">{title}</span>'
            f'<ul>{lis}</ul></div></div>')


PROOF = "Já realizado para times como <b>Compass</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)"

# ============================ 1 · CAPA ============================
cover = f'''
  <section class="slide">
{head_block("Proposta para Aeventotheca", "Iguatemi", "Campinas", "02.10")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Duas experiências · um dia</span>
        <h1>Duas experiências. <em>Um mesmo dia.</em></h1>
        <p class="lead">Dois momentos sensoriais no mesmo dia — para <b>descobrir</b>, <b>experimentar</b> e <b>compartilhar</b>. ✨</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip">🗓️ <b>02.10</b></span>
          <span class="chip">📍 Iguatemi Campinas</span>
          <span class="chip"><b>Duas</b> experiências</span>
        </div>
      </div>
      <div class="cover-photo">{img("aev-capa-duas.jpg", "Duas mulheres sorrindo e sentindo aromas numa experiência sensorial", "center 30%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Proposta · Aeventotheca")}
  </section>'''

# ============================ 2 · VISÃO GERAL DO DIA ============================
visao = f'''
  <section class="slide">
{head_simple("Visão geral do dia")}
    <span class="eyebrow orange">◆ 02.10 · Iguatemi Campinas</span>
    <h2>O dia em <em>dois momentos</em></h2>
    <p class="lead">Dois momentos para <b>sair do automático</b>, <b>descobrir</b> algo novo e <b>compartilhar</b> uma boa experiência.</p>
    <div class="daygrid">
      {daycard("11h", "LACES · Iguatemi Campinas", "Criação de Sais de Banho", "De manhã, uma experiência sensorial.", "<b>15 pessoas</b>", "sais-composicao.jpg", "Sais de banho com ervas e flores secas, em composição", "center 50%")}
      {daycard("17h", "Piselli · Iguatemi Campinas", "Chás, ervas &amp; blends", "No fim da tarde, aromas e sabores.", "<b>10 pessoas</b>", "cha-ervas-selecao.jpg", "Ervas soltas em potes para a experiência de chás e blends", "center 45%")}
    </div>
    {foot("Visão geral do dia")}
  </section>'''

# ============================ 3 · EXPERIÊNCIA LACES — SAIS ============================
expLACES = f'''
  <section class="slide">
{head_simple("Experiência LACES · Sais de banho")}
    <span class="eyebrow orange">◆ <b>11h</b> · LACES · Iguatemi Campinas · <b>15 pessoas</b></span>
    <h2>Criação de <em>sais de banho</em></h2>
    {exbig("11h · LACES · 15 pessoas", "Criação de Sais de Banho",
           "Uma experiência sensorial em torno de aromas, texturas e criação — pensada para um momento leve e personalizado ao grupo.",
           ["Condução por profissional",
            "Materiais e insumos da experiência",
            "Montagem, operação e produção do dia",
            "Deslocamento"],
           "sais-grupo.jpg", "Grupo criando os próprios sais de banho",
           "laces-espaco.jpg", "Interior da loja LACES, com plantas e madeira", "LACES · Iguatemi Campinas",
           "center 55%", "center 50%")}
    {foot("Experiência LACES · Sais de banho")}
  </section>'''

# ============================ 4 · EXPERIÊNCIA PISELLI — CHÁS ============================
expPiselli = f'''
  <section class="slide">
{head_simple("Experiência Piselli · Chás & blends")}
    <span class="eyebrow orange">◆ <b>17h</b> · Piselli · Iguatemi Campinas · <b>10 pessoas</b></span>
    <h2>Chás, ervas &amp; <em>blends</em></h2>
    {exbig("17h · Piselli · 10 pessoas", "Chás, ervas &amp; blends",
           "Uma experiência em torno do universo dos chás, ervas e blends — clima de encontro, mesa e novos sabores.",
           ["Condução por profissional",
            "Ervas e insumos da experiência",
            "Operação e produção do dia",
            "Deslocamento"],
           "cha-blend-funil.jpg", "Blend de ervas e xícaras servidas sobre a mesa",
           "piselli-mesa.jpg", "Mesa redonda de mármore posta no Piselli", "Piselli · Iguatemi Campinas",
           "center 45%", "center 50%")}
    {foot("Experiência Piselli · Chás & blends")}
  </section>'''

# ============================ 9 · INVESTIMENTO ============================
PH = '<span class="ph">R$ ______</span>'
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>As duas <em>experiências</em></h2>
    <p class="lead">Cada experiência com participantes, valor por pessoa e total.</p>
    <table class="invt3">
      <thead>
        <tr><th class="l">Experiência</th><th>Participantes</th><th>Preço por pessoa</th><th>Preço total</th></tr>
      </thead>
      <tbody>
        <tr><td class="nm">Sais de Banho<span>11h · LACES</span></td><td class="ppl">15 pessoas</td><td class="val">{PH}</td><td class="val">{PH}</td></tr>
        <tr><td class="nm">Chás &amp; Blends<span>17h · Piselli</span></td><td class="ppl">10 pessoas</td><td class="val">{PH}</td><td class="val">{PH}</td></tr>
      </tbody>
    </table>
    <p class="phnote">Investimentos finais apresentados após a definição do formato escolhido.</p>
    {foot("Investimento")}
  </section>'''

# ============================ 10 · PRÓXIMOS PASSOS ============================
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Próximos passos</span>
    <h2>Como <em>seguimos</em></h2>
    <p class="lead">Um caminho simples até a reserva da data — cuidamos de cada etapa com vocês.</p>
    {steps4([
        ("Aprovação", "Aprovada a proposta, seguimos com os detalhes."),
        ("Confirmação", "Confirmamos a data — 02.10, no Iguatemi Campinas."),
        ("Ajustes finais", "Alinhamos cada detalhe das duas experiências."),
        ("Produção", "Cuidamos da produção de cada momento."),
    ])}
    <div class="cta">
      <h2>Má, <em>seguimos juntas?</em> ✦</h2>
      <p>Aprovado o formato, alinhamos cada detalhe e reservamos o dia <b>02.10</b> no Iguatemi Campinas.</p>
      <div class="cta-actions">
        <a class="btn-wa" href="https://wa.me/5511914455930?text=Oi%2C%20Elarah!%20Sobre%20a%20proposta%20das%20experi%C3%AAncias%20no%20Iguatemi%20Campinas." target="_blank" rel="noopener">💬 Falar no WhatsApp</a>
        <div class="contact-links">
          <span>+55 (11) 91445-5930</span>
          <a href="https://instagram.com/elarah.oficial" target="_blank" rel="noopener">@elarah.oficial</a>
          <a href="https://elarah.com.br" target="_blank" rel="noopener">elarah.com.br</a>
        </div>
      </div>
    </div>
    <p class="fineprint">Proposta de experiências da Elarah para a Aeventotheca (a/c Marina Dias) — 02.10, no Iguatemi Campinas: Sais de Banho às 11h na LACES (15 pessoas) e Chás, ervas &amp; blends às 17h no Piselli (10 pessoas). Investimentos finais apresentados após a definição do formato escolhido.</p>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n'
        + cover + visao + expLACES + expPiselli + investimento + proximos
        + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/experiencia-aeventotheca-iguatemi.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
