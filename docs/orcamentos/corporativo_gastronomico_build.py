# Proposta Elarah · Evento Corporativo Gastronômico · 22/10 · 16 pessoas
# DUAS opcoes REAIS ja cotadas (nao inventar / nao criar experiencias novas):
#   OPCAO 1 · Casa Zuri (Brooklin) — 4 workshops (Massas / Arabe / Tapas / Mexicana) · ~3h · R$ 499 p/p · R$ 7.984 (16)
#   OPCAO 2 · Receitaria Escola Gourmet (Jardim das Bandeiras) — workshop de pizza · R$ 425 p/p · R$ 6.800 (16)
# Editorial/clean/corporativo. Fotos reais de pessoas cozinhando/compartilhando. Sem fornecedor/margem/comissao.
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/orcamento-adriana.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]

head = re.sub(r'<title>.*?</title>', '<title>Experiência Corporativa Gastronômica · Elarah</title>', head, count=1, flags=re.DOTALL)
head = re.sub(r'<meta name="description"[^>]*>',
              '<meta name="description" content="Uma experiência gastronômica para conectar o time — Casa Zuri ou Receitaria Escola Gourmet. 22 de outubro, 16 pessoas.">',
              head, count=1)

extra = '''
<style>
  .pftitle{text-align:right;line-height:1.5}
  .pftitle .top{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--navy-soft);font-weight:700}
  .pftitle .big{font-size:17px;font-weight:800;color:var(--navy);letter-spacing:.01em;margin-top:2px}
  .pftitle .big em{font-style:normal;color:var(--orange)}
  .pftitle .sub{font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--navy-soft);font-weight:700;margin-top:2px}
  /* conceito (texto + foto) */
  .cwrap{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:22px;align-items:center}
  .cwrap .ph{border-radius:20px;overflow:hidden;height:400px;position:relative;border:1px solid var(--line);box-shadow:0 22px 52px -28px rgba(0,0,0,.45)}
  .cwrap .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .idealine{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}
  .idealine .ic{background:var(--card);border:1px solid var(--line);border-radius:999px;padding:9px 18px;font-family:'DM Serif Display',serif;font-size:15px;color:var(--navy)}
  .idealine .ic em{font-style:italic;color:var(--orange)}
  .noteband{margin-top:20px;background:#EBF1F4;border-left:4px solid var(--orange);border-radius:12px;padding:16px 22px;font-size:12.5px;color:var(--navy-soft);line-height:1.55}
  .noteband b{color:var(--navy);font-weight:700}
  /* experiencia · hero band */
  .heroband{border-radius:20px;overflow:hidden;position:relative;height:286px;margin-top:18px;border:1px solid var(--line);box-shadow:0 22px 52px -30px rgba(0,0,0,.5)}
  .heroband img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .heroband .cap{position:absolute;left:0;bottom:0;right:0;padding:48px 24px 20px;background:linear-gradient(to top,rgba(46,31,42,.9),transparent)}
  .heroband .cap .k{font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.82);font-weight:700}
  .heroband .cap .t{margin-top:4px;color:#fff;font-family:'DM Serif Display',serif;font-size:24px;line-height:1.1}
  .heroband .price{position:absolute;top:16px;right:16px;background:var(--orange);color:#fff;font-size:12px;font-weight:800;padding:8px 15px;border-radius:999px;box-shadow:0 10px 24px -12px rgba(0,0,0,.5)}
  /* casa zuri · 4 culinarias */
  .cuig{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-top:18px;width:100%}
  .cuic{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px 18px;box-shadow:0 14px 34px -26px rgba(0,0,0,.3);display:flex;flex-direction:column;min-width:0}
  .cuic .k{font-family:'DM Serif Display',serif;font-size:17px;color:var(--navy);line-height:1.1}
  .cuic .fl{font-size:8.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange-dark);font-weight:800;margin-bottom:6px}
  .cuic p{font-size:11px;color:var(--muted);line-height:1.5;margin:8px 0 0}
  .exnote{margin-top:16px;font-size:12px;color:var(--navy-soft);line-height:1.5}
  .exnote b{color:var(--navy);font-weight:700}
  /* receitaria · split */
  .recwrap{display:grid;grid-template-columns:1.1fr .9fr;gap:28px;margin-top:18px;align-items:stretch}
  .recwrap .ph{border-radius:18px;overflow:hidden;position:relative;border:1px solid var(--line);box-shadow:0 20px 48px -28px rgba(0,0,0,.45);min-height:320px}
  .recwrap .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .steps{display:flex;flex-direction:column;gap:12px;justify-content:center}
  .stp{display:flex;align-items:flex-start;gap:13px;font-size:13.5px;color:var(--navy-soft);line-height:1.4}
  .stp .n{font-family:'DM Serif Display',serif;font-size:20px;color:var(--orange);line-height:1;flex:none;width:26px}
  .stp b{color:var(--navy);font-weight:700}
  .sabores{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px}
  .sabores .sb{background:#FBF1EE;border:1px solid var(--line);border-radius:999px;padding:8px 16px;font-size:12.5px;font-weight:700;color:var(--navy)}
  /* comparativo */
  .cmp{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;margin-top:22px;align-items:stretch;width:100%}
  .cmpc{background:var(--card);border:1px solid var(--line);border-radius:20px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 40px -28px rgba(0,0,0,.4);min-width:0}
  .cmpc .ph{height:168px;position:relative;overflow:hidden}
  .cmpc .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .cmpc .bd{padding:22px 26px 24px;display:flex;flex-direction:column;flex:1}
  .cmpc .loc{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange-dark);font-weight:800}
  .cmpc .nm{font-family:'DM Serif Display',serif;font-size:23px;color:var(--navy);margin:4px 0 12px;line-height:1.05}
  .cmpc ul{list-style:none;margin:0;padding:0;display:grid;gap:8px}
  .cmpc li{position:relative;padding-left:20px;font-size:12.5px;color:var(--ink);line-height:1.4}
  .cmpc li .ck{position:absolute;left:0;top:0;color:var(--orange);font-weight:800}
  .cmpc .pr{margin-top:auto;padding-top:15px;font-family:'DM Serif Display',serif;font-size:24px;color:var(--orange-dark)}
  .cmpc .pr small{font-family:'DM Sans',sans-serif;font-size:12px;color:var(--navy-soft);font-weight:700}
  /* investimento */
  .invp{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;margin-top:22px;width:100%}
  .ipc{background:var(--card);border:1px solid var(--line);border-radius:20px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 18px 44px -28px rgba(0,0,0,.4);min-width:0}
  .ipc .ph{height:150px;position:relative;overflow:hidden}
  .ipc .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .ipc .bd{padding:22px 28px 26px}
  .ipc .loc{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange-dark);font-weight:800}
  .ipc .nm{font-family:'DM Serif Display',serif;font-size:21px;color:var(--navy);margin:4px 0 14px;line-height:1.05}
  .ipc .big{font-family:'DM Serif Display',serif;font-size:44px;color:var(--orange-dark);line-height:1}
  .ipc .per{font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--navy-soft);font-weight:700;margin-top:4px}
  .ipc .tot{margin-top:14px;padding-top:13px;border-top:1px solid var(--line);font-size:13px;color:var(--navy-soft);font-weight:700}
  .ipc .tot b{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy)}
  .invobs{margin-top:18px;text-align:center;font-size:12px;color:var(--navy-soft)}
  .invobs b{color:var(--navy)}
  /* proximos passos */
  .stg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-top:22px;width:100%}
  .stc{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px 22px;box-shadow:0 12px 30px -24px rgba(0,0,0,.3)}
  .stc .n{font-family:'DM Serif Display',serif;font-size:30px;color:var(--orange);line-height:1}
  .stc h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--navy);margin:8px 0 6px;line-height:1.1}
  .stc p{font-size:11.5px;color:var(--muted);line-height:1.5;margin:0}
  .ctabox{margin-top:20px;background:#EBF1F4;border-left:4px solid var(--orange);border-radius:14px;padding:22px 26px}
  .ctabox .t{font-family:'DM Serif Display',serif;font-size:20px;color:var(--navy);margin:0 0 7px;line-height:1.2}
  .ctabox .t em{font-style:italic;color:var(--orange)}
  .ctabox p{font-size:12.5px;color:var(--navy-soft);line-height:1.6;margin:0}
  .ctabox b{color:var(--navy);font-weight:700}
</style>'''
head = head.replace("</head>", extra + "</head>", 1)


def foot(right):
    return f'<div class="slide__foot"><span>Elarah · Experiências</span><span>{right}</span></div>'


def img(src, alt, pos="center 50%"):
    return f'<img src="assets/{src}" alt="{alt}" style="object-position:{pos}">'


def head_simple(kicker):
    return f'''    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">{kicker}</span></div>
    </div>'''


def cuic(nome, fam, desc):
    return f'<div class="cuic"><div class="fl">{fam}</div><div class="k">{nome}</div><p>{desc}</p></div>'


def stp(n, txt):
    return f'<div class="stp"><div class="n">{n}</div><div>{txt}</div></div>'


def stc(n, titulo, desc):
    return f'<div class="stc"><div class="n">{n}</div><h3>{titulo}</h3><p>{desc}</p></div>'


# ===== 1 · CAPA =====
cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><div class="pftitle"><div class="top">Proposta corporativa</div><div class="big">Experiência <em>Gastronômica</em></div><div class="sub">Evento corporativo · 22.10</div></div></div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Evento corporativo · gastronomia</span>
        <h1>Uma experiência gastronômica para <em>conectar o time</em></h1>
        <p class="lead">Um encontro para o time <strong>sair da rotina, cozinhar junto e compartilhar a mesa</strong> — com a Elarah cuidando de toda a produção, do começo ao fim. 🧡</p>
        <div class="chips">
          <span class="chip"><b>22</b> de outubro</span>
          <span class="chip"><b>16</b> pessoas</span>
          <span class="chip">Duas experiências à escolha</span>
        </div>
      </div>
      <div class="cover-photo">{img("bfa-grupo1.webp", "Time reunido compartilhando uma mesa em uma experiência gastronômica", "center 50%")}</div>
    </div>
    {foot("Experiência gastronômica · 22.10")}
  </section>'''

# ===== 2 · O CONCEITO =====
conceito = f'''
  <section class="slide">
{head_simple("O conceito")}
    <span class="eyebrow orange">◆ Por que gastronomia</span>
    <h2>Uma pausa na rotina para <em>criar e compartilhar</em></h2>
    <div class="cwrap">
      <div>
        <p class="lead">Pensamos em <strong>duas experiências gastronômicas em que o time participa de verdade</strong> — colocando a mão na massa, aprendendo algo novo e terminando o encontro ao redor da mesa.</p>
        <div class="idealine">
          <span class="ic">Criar</span>
          <span class="ic"><em>Experimentar</em></span>
          <span class="ic">Compartilhar</span>
        </div>
        <div class="noteband">◆ Gastronomia funciona como uma experiência de <b>conexão, interação e team building</b> — sem parecer uma dinâmica corporativa forçada. Todo mundo na mesma mesa, no mesmo ritmo.</div>
      </div>
      <div class="ph">{img("bfa-grupo2.webp", "Time conversando e compartilhando a mesa", "center 45%")}</div>
    </div>
    {foot("O conceito")}
  </section>'''

# ===== 3 · CASA ZURI =====
zuri = f'''
  <section class="slide">
{head_simple("Opção 1 · Casa Zuri")}
    <span class="eyebrow orange">◆ Opção 1 · Casa Zuri · Brooklin</span>
    <h2>Uma experiência gastronômica <em>à escolha do grupo</em></h2>
    <div class="heroband">{img("spicy-mesa-pratos.webp", "Chef conduz a experiência em uma cozinha gourmet com a mesa posta para o grupo", "center 35%")}
      <div class="price">R$ 499 / pessoa</div>
      <div class="cap"><div class="k">Casa Zuri · Brooklin</div><div class="t">O time escolhe um dos quatro workshops</div></div>
    </div>
    <div class="cuig">
      {cuic("Massas Frescas", "Italiana", "Preparo da massa e 3 tipos — 2 longas e 1 recheada — com molhos.")}
      {cuic("Cozinha Árabe", "Oriente Médio", "Hommus, tabule, kafta modelada e arroz árabe.")}
      {cuic("Tapas Espanholas", "Espanha", "Pão com tomate e jamón, croquetas de cogumelos, gambas al ajillo e batatas bravas.")}
      {cuic("Cozinha Mexicana", "México", "Guacamole, pico de gallo, quesadilla, chilli com carne, tacos e sour cream.")}
    </div>
    <p class="exnote">◆ Duração aproximada de <b>3 horas</b> · o grupo escolhe <b>um</b> dos workshops · a experiência termina com a <b>degustação dos pratos preparados pelo próprio grupo</b>.</p>
    {foot("Opção 1 · Casa Zuri")}
  </section>'''

# ===== 4 · RECEITARIA =====
receitaria = f'''
  <section class="slide">
{head_simple("Opção 2 · Receitaria")}
    <span class="eyebrow orange">◆ Opção 2 · Receitaria Escola Gourmet · Jardim das Bandeiras</span>
    <h2>Mão na massa no <em>universo da pizza</em></h2>
    <div class="heroband">{img("pizza-brinde.jpg", "Grupo brindando ao redor de pizzas artesanais", "center 50%")}
      <div class="price">R$ 425 / pessoa</div>
      <div class="cap"><div class="k">Receitaria Escola Gourmet · Jardim das Bandeiras</div><div class="t">Uma experiência prática e descontraída</div></div>
    </div>
    <div class="recwrap">
      <div class="steps">
        {stp("01", "Manipulação das massas <b>tradicional e integral</b>")}
        {stp("02", "<b>Preparo do molho</b>")}
        {stp("03", "<b>Montagem</b> das pizzas")}
        {stp("04", "Técnicas para <b>assar em forno caseiro</b>")}
        <div class="sabores">
          <span class="sb">Margherita</span><span class="sb">Abobrinha</span><span class="sb">Calabresa</span><span class="sb">Catupiry</span>
        </div>
      </div>
      <div class="ph">{img("pizza.jpg", "Pizza artesanal feita no workshop", "center 50%")}</div>
    </div>
    {foot("Opção 2 · Receitaria")}
  </section>'''

# ===== 5 · COMPARATIVO =====
comparativo = f'''
  <section class="slide">
{head_simple("Comparativo")}
    <span class="eyebrow orange">◆ Dois estilos, a mesma entrega</span>
    <h2>Qual <em>combina mais</em> com o time?</h2>
    <p class="lead">Duas experiências com <strong>estilos diferentes</strong> — ambas com o time de mão na massa e a Elarah cuidando de toda a produção.</p>
    <div class="cmp">
      <div class="cmpc">
        <div class="ph">{img("massacolorida.jpg", "Massas frescas artesanais da Casa Zuri", "center 50%")}</div>
        <div class="bd">
          <div class="loc">Brooklin</div>
          <div class="nm">Casa Zuri</div>
          <ul>
            <li><span class="ck">✦</span>4 opções de workshops</li>
            <li><span class="ck">✦</span>Aproximadamente 3h</li>
            <li><span class="ck">✦</span>Experiência gastronômica mais completa</li>
          </ul>
          <div class="pr">R$ 499 <small>/ pessoa</small></div>
        </div>
      </div>
      <div class="cmpc">
        <div class="ph">{img("pizza1.jpg", "Pizza artesanal da Receitaria Escola Gourmet", "center 50%")}</div>
        <div class="bd">
          <div class="loc">Jardim das Bandeiras</div>
          <div class="nm">Receitaria Escola Gourmet</div>
          <ul>
            <li><span class="ck">✦</span>Workshop de pizza</li>
            <li><span class="ck">✦</span>Experiência prática e descontraída</li>
            <li><span class="ck">✦</span>Foco no universo da pizza</li>
          </ul>
          <div class="pr">R$ 425 <small>/ pessoa</small></div>
        </div>
      </div>
    </div>
    {foot("Comparativo")}
  </section>'''

# ===== 6 · INVESTIMENTO =====
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>Valores para o <em>grupo de 16</em></h2>
    <div class="invp">
      <div class="ipc">
        <div class="ph">{img("arabe.jpg", "Pratos da experiência Casa Zuri", "center 50%")}</div>
        <div class="bd">
          <div class="loc">Casa Zuri · Brooklin</div>
          <div class="nm">Experiência gastronômica</div>
          <div class="big">R$ 499</div>
          <div class="per">por pessoa</div>
          <div class="tot">16 pessoas · <b>R$ 7.984</b></div>
        </div>
      </div>
      <div class="ipc">
        <div class="ph">{img("pizzanegroni.jpg", "Pizza artesanal da Receitaria", "center 50%")}</div>
        <div class="bd">
          <div class="loc">Receitaria · Jardim das Bandeiras</div>
          <div class="nm">Workshop de pizza</div>
          <div class="big">R$ 425</div>
          <div class="per">por pessoa</div>
          <div class="tot">16 pessoas · <b>R$ 6.800</b></div>
        </div>
      </div>
    </div>
    <p class="invobs">Valores considerando o <b>grupo de 16 participantes</b>.</p>
    {foot("Investimento")}
  </section>'''

# ===== 7 · PRÓXIMOS PASSOS =====
proximos = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ Próximos passos</span>
    <h2>Qual experiência combina mais com <em>o time de vocês?</em></h2>
    <p class="lead">Depois da escolha, a Elarah cuida de tudo para o dia 22/10 sair do jeito que vocês imaginam.</p>
    <div class="stg">
      {stc("01", "Confirmamos a disponibilidade", "Reservamos a experiência escolhida para o dia 22/10.")}
      {stc("02", "Organizamos os detalhes", "Alinhamos horários, formato e tudo o que o encontro precisa.")}
      {stc("03", "Acompanhamos a produção", "Cuidamos de toda a operação até o dia do evento.")}
    </div>
    <div class="ctabox">
      <p class="t">Vocês escolhem a experiência. <em>A gente cuida do resto.</em> 🧡</p>
      <p>Conta pra gente qual experiência faz mais sentido para o time, que seguimos com os próximos passos.<br><i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <b>+55 (11) 91445-5930</b> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br</p>
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n' + cover + conceito + zuri + receitaria
        + comparativo + investimento + proximos + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/proposta-corporativo-gastronomico.html"
io.open(out, "w", encoding="utf-8").write(html)

# ---- guardas ----
for bad in ["fornecedor", "repasse", "comiss", "margem", "sob consulta", "melhor opção", "pior"]:
    assert bad not in deck.lower(), f"PROIBIDO: {bad}"
for val in ["R$ 499", "R$ 7.984", "R$ 425", "R$ 6.800"]:
    assert val in deck, f"FALTA VALOR: {val}"
for nome in ["Casa Zuri", "Receitaria", "Massas Frescas", "Cozinha Árabe", "Tapas Espanholas",
             "Cozinha Mexicana", "Margherita", "Abobrinha", "Calabresa", "Catupiry"]:
    assert nome in deck, f"FALTA: {nome}"
# nao criar experiencias novas / nao reusar precos de outro portfolio
for ruim in ["R$ 319", "R$ 349", "R$ 429", "Bartenderia", "Entre Fatias", "Experiência Gastronômica · Mão"]:
    assert ruim not in deck, f"FORA DO ESCOPO: {ruim}"
assert "16" in deck
# evitar fotos com marca de terceiros (aventais/placas de outras escolas)
for marca in ["corp-grupo.jpg", "nbc-gastronomia-pizza.jpg", "nbc-mesa-grupo.webp", "cozinha31-prato.jpg", "massanasalturas.jpg", "weber-", "kitempresa"]:
    assert marca not in deck, f"FOTO COM MARCA DE TERCEIRO: {marca}"
assert html.count('<section class="slide">') == 7, "esperado 7 slides"
print("wrote", out, "| slides:", html.count('<section class="slide">'))
