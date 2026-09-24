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
  /* investimento · total */
  .invtotal{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:18px;background:var(--navy);color:#fff;border-radius:16px;padding:20px 30px}
  .invtotal .lbl{font-size:11px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:rgba(255,255,255,.82)}
  .invtotal .v{font-family:'DM Serif Display',serif;font-size:32px;color:#fff;line-height:1}
  /* para levar (bloco de valor) */
  .levar{margin-top:20px;background:rgba(176,141,76,.07);border:1px solid var(--line);border-radius:16px;padding:17px 22px}
  .levar .lk{font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin-bottom:12px}
  .levar .litems{display:flex;flex-wrap:wrap;gap:9px}
  .levar .li{font-size:11.5px;color:var(--navy);background:var(--card);border:1px solid var(--line);border-radius:999px;padding:8px 14px;font-weight:600}
  .levar .li b{color:var(--orange-dark)}
  /* contemplado agrupado */
  .inclgrp{margin-top:16px;padding-top:14px;border-top:1px solid var(--line);display:grid;grid-template-columns:1fr 1fr;gap:11px 20px}
  .inclgrp .gt{font-size:9px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .inclgrp p{font-size:10.5px;color:var(--muted);line-height:1.4;margin-top:2px}
  /* duas criacoes (duo) */
  .duo{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}
  .duo .d{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 15px}
  .duo .d .dt{font-family:'DM Serif Display',serif;font-size:16px;color:var(--navy)}
  .duo .d p{font-size:10.5px;color:var(--muted);line-height:1.35;margin-top:3px}
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
    subhtml = f'<p class="dsub">{sub}</p>' if sub else ''
    return (f'<div class="daycard"><div class="dph"><span class="dtime">{time}</span>{img(src, alt, pos)}</div>'
            f'<div class="db"><span class="dvenue">{venue}</span><h3>{name}</h3>'
            f'{subhtml}<div class="dppl">{ppl}</div></div></div>')


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
        <span class="eyebrow">✦ Experiências sensoriais</span>
        <h1>Um dia de pausa, criação <em>e descoberta.</em></h1>
        <p class="lead">Entre aromas, texturas e sabores, um convite para desacelerar, criar e levar um pouco da experiência para casa.</p>
      </div>
      <div class="cover-photo">{img("libbs-s2-conversa.jpg", "Mulheres reunidas, sorrindo e conversando durante um encontro", "center 40%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Proposta · Aeventotheca")}
  </section>'''

# ============================ 2 · VISÃO GERAL DO DIA ============================
visao = f'''
  <section class="slide">
{head_simple("O dia")}
    <span class="eyebrow orange">◆ 02.10 · Iguatemi Campinas</span>
    <h2>Do criar ao <em>saborear</em></h2>
    <p class="lead">Pela manhã, uma pausa de criação entre aromas, ervas e texturas. No fim da tarde, a experiência muda de ritmo e chega à mesa — com chás, combinações e novos sabores.</p>
    <div class="daygrid">
      {daycard("11h", "LACES", "Sais para escalda-pés", "", "<b>15 pessoas</b> · 1h30", "sais-composicao.jpg", "Sais, ervas e óleos para a composição do escalda-pés", "center 50%")}
      {daycard("17h", "Piselli", "Chás, ervas &amp; blends", "", "<b>10 pessoas</b>", "cha-ervas-selecao.jpg", "Ervas soltas em potes para a criação de blends", "center 45%")}
    </div>
    {foot("O dia")}
  </section>'''

# ============================ 3 · EXPERIÊNCIA LACES — SAIS ESCALDA-PÉS ============================
expLACES = f'''
  <section class="slide">
{head_simple("Experiência LACES · Sais para escalda-pés")}
    <span class="eyebrow orange">◆ <b>11h</b> · LACES · Iguatemi Campinas · <b>15 pessoas</b> · <b>1h30</b></span>
    <h2>Oficina de Sais para Escalda-pés <em>da Primavera</em></h2>
    <div class="exbig">
      <div class="exphotos">
        <div class="exmain">{img("sais-grupo.jpg", "Grupo criando a própria composição de sais e ervas", "center 55%")}</div>
        <div class="exthumb">{img("laces-espaco.jpg", "Interior da loja LACES, com plantas e madeira", "center 50%")}<div class="cap">LACES · Iguatemi Campinas</div></div>
      </div>
      <div class="exbody">
        <p class="exc">Uma pausa para criar com calma. Inspirada na primavera, a experiência convida o grupo a explorar aromas, ervas, sais e texturas em uma criação individual, leve e pessoal — e cada participante leva consigo algo feito por ela.</p>
        <div class="inclgrp">
          <div class="g"><div class="gt">Condução</div><p>Profissional especializada durante toda a experiência.</p></div>
          <div class="g"><div class="gt">Materiais</div><p>Sais, óleos essenciais, ervas e utensílios da criação.</p></div>
          <div class="g"><div class="gt">Personalização</div><p>Frasco individual, rótulo e tag para nomear.</p></div>
          <div class="g"><div class="gt">Produção</div><p>Preparação, operação e logística até Campinas.</p></div>
        </div>
      </div>
    </div>
    <div class="levar">
      <div class="lk">Para levar com você</div>
      <div class="litems">
        <span class="li">Sua composição individual</span>
        <span class="li"><b>Frasco de vidro 80 ml</b></span>
        <span class="li">Rótulo personalizado</span>
        <span class="li">Tag para nome ou intenção</span>
        <span class="li"><b>Chá relaxante</b> de presente</span>
      </div>
    </div>
    {foot("Experiência LACES · Sais para escalda-pés")}
  </section>'''

# ============================ 4 · EXPERIÊNCIA PISELLI — CHÁS & BLENDS ============================
expPiselli = f'''
  <section class="slide">
{head_simple("Experiência Piselli · Chás & blends")}
    <span class="eyebrow orange">◆ <b>17h</b> · Piselli · Iguatemi Campinas · <b>10 pessoas</b></span>
    <h2>Oficina de Chás, Ervas &amp; <em>Blends</em></h2>
    <div class="exbig">
      <div class="exphotos">
        <div class="exmain">{img("aev-capa-duas.jpg", "Mulheres à mesa, conversando e experimentando aromas de chás", "center 35%")}</div>
        <div class="exthumb">{img("piselli-mesa.jpg", "Mesa redonda de mármore posta no Piselli", "center 50%")}<div class="cap">Piselli · Iguatemi Campinas</div></div>
      </div>
      <div class="exbody">
        <p class="exc">Uma pausa no fim da tarde para descobrir ervas, combinações e novos sabores. Com a orientação da tea expert, o grupo explora ingredientes, cria os próprios blends e transforma a mesa em espaço de troca e descoberta.</p>
        <div class="duo">
          <div class="d"><div class="dt">Relaxar</div><p>Um blend autoral de perfil mais acolhedor.</p></div>
          <div class="d"><div class="dt">Energizar</div><p>Um blend autoral para um momento estimulante.</p></div>
        </div>
        <div class="inclgrp">
          <div class="g"><div class="gt">Condução</div><p>Tea expert e curadoria das ervas.</p></div>
          <div class="g"><div class="gt">Materiais</div><p>Ingredientes dos dois blends, potes e utensílios.</p></div>
        </div>
      </div>
    </div>
    <div class="levar">
      <div class="lk">Da mesa para casa</div>
      <div class="litems">
        <span class="li"><b>2 blends</b> criados por você</span>
        <span class="li">2 frascos de vidro 60 ml</span>
        <span class="li">Infusor tipo bolinha</span>
        <span class="li"><b>Caixa</b> para os itens</span>
        <span class="li">Guia impresso de preparo</span>
      </div>
    </div>
    {foot("Experiência Piselli · Chás & blends")}
  </section>'''

# ============================ 9 · INVESTIMENTO ============================
PH = '<span class="ph">R$ ______</span>'
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Experiências <em>completas</em></h2>
    <p class="lead">Cada detalhe pensado para o grupo viver a experiência com leveza — da condução aos materiais, da personalização ao que cada uma leva para casa.</p>
    <table class="invt3">
      <thead>
        <tr><th class="l">Experiência</th><th>Valor por pessoa</th><th>Investimento total</th></tr>
      </thead>
      <tbody>
        <tr><td class="nm">Oficina de Sais para Escalda-pés<span>11h · LACES · 15 pessoas · 1h30</span></td><td class="val">R$ 329,27</td><td class="val">R$ 4.939</td></tr>
        <tr><td class="nm">Oficina de Chás, Ervas &amp; Blends<span>17h · Piselli · 10 pessoas</span></td><td class="val">R$ 391,90</td><td class="val">R$ 3.919</td></tr>
      </tbody>
    </table>
    <div class="invtotal">
      <span class="lbl">Investimento total</span>
      <span class="v">R$ 8.858</span>
    </div>
    {foot("Investimento")}
  </section>'''

# ============================ 10 · PRÓXIMOS PASSOS ============================
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Próximos passos</span>
    <h2>Como <em>seguimos</em></h2>
    <p class="lead">Com tudo aprovado, seguimos para transformar o planejamento em experiência.</p>
    {steps4([
        ("Aprovação", "Aprovada a proposta, seguimos em frente."),
        ("Alinhamento", "Alinhamos os detalhes com a profissional."),
        ("Ajustes finais", "Fechamos os últimos detalhes com a profissional."),
        ("Produção", "Cuidamos de toda a produção."),
    ])}
    <div class="cta">
      <h2>Má, <em>seguimos juntas?</em> ✦</h2>
      <p>Com a proposta aprovada, alinhamos os últimos detalhes com a profissional e seguimos para a produção.</p>
      <div class="cta-actions">
        <a class="btn-wa" href="https://wa.me/5511914455930?text=Oi%2C%20Elarah!%20Sobre%20a%20proposta%20das%20experi%C3%AAncias%20no%20Iguatemi%20Campinas." target="_blank" rel="noopener">💬 Falar no WhatsApp</a>
        <div class="contact-links">
          <span>+55 (11) 91445-5930</span>
          <a href="https://instagram.com/elarah.oficial" target="_blank" rel="noopener">@elarah.oficial</a>
          <a href="https://elarah.com.br" target="_blank" rel="noopener">elarah.com.br</a>
        </div>
      </div>
    </div>
    <p class="fineprint">Proposta de experiências da Elarah para a Aeventotheca (a/c Marina Dias) — 02.10, no Iguatemi Campinas: Oficina de Sais para Escalda-pés da Primavera às 11h na LACES (15 pessoas · 1h30), R$ 329,27 por pessoa · R$ 4.939; Oficina de Chás, Ervas e Criação de Blends às 17h no Piselli (10 pessoas), R$ 391,90 por pessoa · R$ 3.919. Investimento total R$ 8.858. Valores contemplam materiais, condução, preparação e logística das experiências.</p>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n'
        + cover + visao + expLACES + expPiselli + investimento + proximos
        + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/experiencia-aeventotheca-iguatemi.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
