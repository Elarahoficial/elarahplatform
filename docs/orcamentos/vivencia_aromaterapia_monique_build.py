# Proposta Elarah · Vivencia em Aromaterapia · Monique Garcia · 12 a 20 pessoas · domingo de manha (novembro)
# Padrao editorial Elarah. Paleta bem-estar (ameixa suave + dourado/clay quente). Leve, feminina, sensorial.
# Fornecedor mapeado internamente: Muiky Harmonie (Vila Madalena, ref R$172/pessoa, ~1h40-2h) — NAO citar fornecedor
# nem custo no deck. Dinamica de aromaterapia baseada nos materiais reais da Elarah (imersao de aromas + criacao pessoal).
# Investimento: 12/15/20 com valores SINALIZADOS PARA VALIDACAO (nao fechar sem confirmar comissao/disponibilidade/valor).
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

# paleta bem-estar: off-white quente · ameixa suave · dourado/clay
reps = {
    "--orange:#B08D4C;": "--orange:#B98A63;",
    "--orange-dark:#8A6D34;": "--orange-dark:#8E6A43;",
    "--navy:#12362B;": "--navy:#4A3A4A;",
    "--navy-soft:#3A5A4E;": "--navy-soft:#6E5C6E;",
    "--blue-accent:#B08D4C;": "--blue-accent:#B98A63;",
    "#EFF3EE": "#F6F0F2", "#DCE8E1": "#EADFE4", "#CBB06E": "#CDAE8A",
    "rgba(176,141,76,.24)": "rgba(185,138,99,.24)",
    "rgba(176,141,76,.26)": "rgba(185,138,99,.28)",
    "rgba(176,141,76,.10)": "rgba(185,138,99,.10)",
    "rgba(18,54,43,.16)": "rgba(74,58,74,.16)",
    "rgba(10,28,22,.86)": "rgba(34,24,32,.86)",
    "rgba(10,28,22,.85)": "rgba(34,24,32,.85)",
    "rgba(10,28,22,.82)": "rgba(34,24,32,.82)",
}
for a, b in reps.items():
    head = head.replace(a, b)

xcss = '''
  .hbanner{border-radius:18px;overflow:hidden;border:1px solid var(--line);box-shadow:0 18px 42px -26px rgba(0,0,0,.4);height:300px;margin-top:22px}
  .hbanner img{width:100%;height:100%;object-fit:cover;display:block}
  .fmt{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:22px}
  .fc{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px 18px;box-shadow:0 12px 30px -24px rgba(0,0,0,.28)}
  .fc .fi{font-size:20px;line-height:1}
  .fc .ft{font-family:'DM Serif Display',serif;font-weight:400;font-size:19px;color:var(--navy);line-height:1.05;margin:9px 0 4px}
  .fc .fs{font-size:11px;color:var(--muted);line-height:1.4}
  .invhi{display:flex;align-items:baseline;gap:12px;margin-top:20px;flex-wrap:wrap}
  .invhi .il{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange-dark);font-weight:700}
  .invhi .iv{font-family:'DM Serif Display',serif;font-size:30px;color:var(--navy);line-height:1}
  .invhi .iv em{font-style:italic;color:var(--navy-soft);font-size:22px}
  .invcards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
  .ic2{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px;text-align:center;box-shadow:0 12px 30px -24px rgba(0,0,0,.28)}
  .ic2 .icnum{font-family:'DM Serif Display',serif;font-size:32px;color:var(--navy);line-height:1}
  .ic2 .iclbl{font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-top:2px}
  .ic2 .icval{margin-top:13px;padding-top:12px;border-top:1px solid var(--line);font-family:'DM Serif Display',serif;font-size:19px;color:var(--navy-soft);font-style:italic}
  /* opcionais lista */
  .oplist{list-style:none;margin:16px 0 0;padding:0;display:flex;flex-direction:column;gap:11px}
  .oplist li{display:flex;justify-content:space-between;align-items:baseline;gap:16px;border-bottom:1px solid var(--line);padding-bottom:11px}
  .oplist li:last-child{border-bottom:none}
  .oplist .on{font-size:13.5px;color:var(--navy);font-weight:600}
  .oplist .on span{display:block;font-size:11px;color:var(--muted);font-weight:400;margin-top:2px;line-height:1.4}
  .oplist .ov{font-family:'DM Serif Display',serif;font-size:17px;color:var(--orange-dark);white-space:nowrap}
  .oplist .ov.sc{font-size:13px;color:var(--muted);font-style:italic}
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
{head_block("Vivência · Aromaterapia", "Vivência em", "Aromaterapia", "Grupo privado · novembro")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Uma manhã de bem-estar</span>
        <h1>Uma pausa para <em>respirar e sentir</em></h1>
        <p class="lead">Uma manhã de domingo entre aromas, calma e boas conversas — uma vivência sensorial para o grupo desacelerar, se conectar e criar algo próprio para levar.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>12 a 20</b> pessoas</span>
          <span class="chip"><b>Domingo</b> de manhã</span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip">São Paulo · novembro</span>
        </div>
      </div>
      <div class="cover-photo">{img("aev-capa-duas.jpg", "Mulheres em uma vivência de aromas, com plantas e óleos essenciais", "center 40%")}</div>
    </div>
    {foot("Vivência em Aromaterapia")}
  </section>'''

# ============================ 2 · CONCEITO ============================
conceito = f'''
  <section class="slide">
{head_simple("O convite")}
    <span class="eyebrow orange">◆ O convite</span>
    <h2>Uma manhã de <em>pausa e descoberta</em></h2>
    <p class="lead">No ritmo de sempre, parar já é um presente. A aromaterapia convida o grupo a desacelerar através dos sentidos — descobrir aromas, entender o que cada um desperta e criar uma composição pessoal, com calma e leveza.</p>
    <div class="hbanner">{img("perfumariamaes.jpg", "Óleos essenciais, flores e botânicos em uma bancada sensorial", "center 55%")}</div>
    {foot("O convite")}
  </section>'''

# ============================ 3 · A VIVÊNCIA ============================
vivencia = f'''
  <section class="slide">
{head_simple("A vivência")}
    <span class="eyebrow orange">◆ Como funciona</span>
    <h2>Uma imersão nos <em>aromas</em></h2>
    <p class="lead">Conduzida por uma aromaterapeuta, a vivência mergulha o grupo no universo dos óleos essenciais — explorando aromas, sensações e combinações, sem pressa, entre um papo e outro. Cada participante cria a própria composição e leva de recordação.</p>
    <div class="bfeat">
      <div class="bphoto">{img("perfumaria-oficina.jpg", "Bancada de aromas com óleos essenciais e frascos", "center 45%")}</div>
      <div class="bbody">
        <span class="btag">Como acontece · cerca de 2h</span>
        <h3>Do aroma à criação</h3>
        <ul class="feat">
          <li><span class="st">1</span><b>Boas-vindas</b> — a bancada de aromas montada e o grupo acolhido.</li>
          <li><span class="st">2</span><b>Imersão nos aromas</b> — a aromaterapeuta apresenta os óleos essenciais e as sensações de cada um.</li>
          <li><span class="st">3</span><b>Criação pessoal</b> — cada participante monta a própria composição, do jeito dela.</li>
          <li><span class="st">4</span><b>Leva com você</b> — cada uma sai com a própria criação de recordação.</li>
        </ul>
      </div>
    </div>
    <div class="bnote" style="margin-top:16px">◆ <b>Incluso:</b> aromaterapeuta conduzindo · óleos essenciais e materiais da vivência · a criação de cada participante · cerca de 2h. <i>Formato e itens finais confirmados com o parceiro selecionado.</i></div>
    {foot("A vivência")}
  </section>'''

# ============================ 4 · ATMOSFERA ============================
atmosfera = f'''
  <section class="slide">
{head_simple("A atmosfera")}
    <span class="eyebrow orange">◆ O clima da manhã</span>
    <h2>Aromas, flores <em>e afeto</em></h2>
    <p class="lead">Óleos essenciais, ervas, flores e uma mesa bonita — uma atmosfera calma e sensorial, feita pra estar presente e aproveitar o tempo junto.</p>
    <div class="vibe">
      <figure>{img("sais-composicao.jpg", "Óleos, sais e botânicos sobre a mesa", "center 50%")}<figcaption>Óleos &amp; botânicos</figcaption></figure>
      <figure>{img("vela-aromatica-real.jpg", "Velas aromáticas e flores secas", "center 50%")}<figcaption>Aromas em cada detalhe</figcaption></figure>
      <figure>{img("cha-ervas-selecao.jpg", "Ervas selecionadas em potes de vidro", "center 50%")}<figcaption>Ervas &amp; naturais</figcaption></figure>
      <figure>{img("buque.jpg", "Flores frescas", "center 50%")}<figcaption>Flores frescas</figcaption></figure>
      <figure>{img("sais-grupo.jpg", "Grupo explorando aromas juntas", "center 45%")}<figcaption>Momentos em grupo</figcaption></figure>
      <figure>{img("perfumariadecor.jpg", "Frascos âmbar e flores na bancada", "center 50%")}<figcaption>A bancada de aromas</figcaption></figure>
    </div>
    {foot("A atmosfera")}
  </section>'''

# ============================ 5 · FORMATO ============================
formato = f'''
  <section class="slide">
{head_simple("O formato")}
    <span class="eyebrow orange">◆ O formato do encontro</span>
    <h2>Uma turma <em>só de vocês</em></h2>
    <p class="lead">Um encontro exclusivo e sem pressa, no ritmo do grupo.</p>
    <div class="fmt">
      <div class="fc"><div class="fi">✦</div><div class="ft">12 a 20</div><div class="fs">turma privada e exclusiva</div></div>
      <div class="fc"><div class="fi">☀</div><div class="ft">Domingo</div><div class="fs">pela manhã, em novembro</div></div>
      <div class="fc"><div class="fi">◷</div><div class="ft">≈ 2 horas</div><div class="fs">duração aproximada</div></div>
      <div class="fc"><div class="fi">✧</div><div class="ft">Espaço parceiro</div><div class="fs">selecionado pela Elarah</div></div>
    </div>
    <div class="bnote" style="margin-top:18px">◆ Nós cuidamos da <b>curadoria, da produção e da condução</b> — o grupo só chega e aproveita a manhã.</div>
    {foot("O formato")}
  </section>'''

# ============================ 6 · O ESPAÇO ============================
espaco = f'''
  <section class="slide">
{head_simple("O espaço")}
    <span class="eyebrow orange">◆ Onde acontece</span>
    <h2>Um espaço parceiro, <em>na sua região</em></h2>
    <div class="bfeat">
      <div class="bphoto">{img("yucafe-real.jpg", "Espaço claro e acolhedor, com plantas e luz natural", "center 50%")}</div>
      <div class="bbody">
        <span class="btag">Curadoria de espaço</span>
        <h3>A gente encontra o lugar certo</h3>
        <p style="font-size:13px;color:var(--muted);line-height:1.6;margin-top:12px">Realizamos a vivência em um espaço parceiro acolhedor, com a atmosfera certa para a manhã. Trabalhamos com opções em diferentes regiões de São Paulo.</p>
        <p style="font-size:12.5px;color:var(--navy-soft);line-height:1.55;margin-top:10px">É só nos contar a <b>região mais conveniente</b> para o grupo que selecionamos o espaço que faz mais sentido.</p>
      </div>
    </div>
    {foot("O espaço")}
  </section>'''

# ============================ 7 · INVESTIMENTO ============================
investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Investimento</span>
    <h2>O investimento <em>da vivência</em></h2>
    <p class="lead">O valor por pessoa é o mesmo para toda a turma; o total acompanha o número final de participantes.</p>
    <div class="invhi">
      <span class="il">Valor por pessoa</span>
      <span class="iv"><em>a validar</em></span>
    </div>
    <div class="invcards">
      <div class="ic2"><div class="icnum">12</div><div class="iclbl">participantes</div><div class="icval">total a validar</div></div>
      <div class="ic2"><div class="icnum">15</div><div class="iclbl">participantes</div><div class="icval">total a validar</div></div>
      <div class="ic2"><div class="icnum">20</div><div class="iclbl">participantes</div><div class="icval">total a validar</div></div>
    </div>
    <div class="bnote" style="margin-top:18px">◆ <b>Estimativa em validação.</b> Antes de fechar os números, estamos confirmando a <b>disponibilidade</b>, o <b>valor atualizado do parceiro</b> e as condições. Fechamos o valor por pessoa e os totais com você antes de enviar à cliente.</div>
    <p class="fineprint">Turma privada de 12 a 20 pessoas, domingo pela manhã, em novembro, em espaço parceiro. Valor por pessoa e totais confirmados após a validação de disponibilidade, condições do espaço/parceiro e do número final de participantes.</p>
    {foot("Investimento")}
  </section>'''

# ============================ 8 · OPCIONAIS ============================
opcionais = f'''
  <section class="slide">
{head_simple("Opcionais")}
    <span class="eyebrow orange">◆ Pra completar a manhã</span>
    <h2>Deixe ainda mais <em>especial</em></h2>
    <div class="bfeat">
      <div class="bphoto">{img("brunch-office1.jpg", "Mesa de café da manhã e comidinhas", "center 50%")}</div>
      <div class="bbody">
        <span class="btag">Opcionais</span>
        <h3>Comidinhas, fotos e um mimo</h3>
        <ul class="oplist">
          <li><span class="on">Café da manhã / brunch<span>uma mesa gostosa pra começar a manhã</span></span><span class="ov sc">sob consulta</span></li>
          <li><span class="on">Comidinhas<span>quitutes e petiscos ao longo da vivência</span></span><span class="ov sc">sob consulta</span></li>
          <li><span class="on">Bebidas<span>sucos, águas aromatizadas e afins</span></span><span class="ov sc">sob consulta</span></li>
          <li><span class="on">Fotografia<span>registro dos momentos do grupo</span></span><span class="ov">R$ 450</span></li>
          <li><span class="on">Personalização / mimo<span>um detalhe especial pra cada participante</span></span><span class="ov">R$ 139</span></li>
        </ul>
      </div>
    </div>
    <p class="fineprint">Opcionais somados à vivência, conforme a preferência do grupo. Café da manhã, comidinhas e bebidas com valores sob consulta, de acordo com o cardápio e o espaço. Fotografia R$ 450 (valor total). Personalização/mimo a partir de R$ 139 por pessoa.</p>
    {foot("Opcionais")}
  </section>'''

# ============================ 9 · ENCERRAMENTO ============================
encerramento = f'''
  <section class="slide">
{head_simple("Próximos passos")}
    <span class="eyebrow orange">◆ A Elarah cuida de tudo</span>
    <h2>É só <em>respirar e aproveitar</em></h2>
    <p class="lead">Da curadoria à produção, cuidamos de cada detalhe para o grupo viver uma manhã leve e memorável — vocês só chegam e se entregam à experiência.</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><div class="ico">✦</div><h3>Escolhem</h3><p>A região e, se quiserem, os opcionais que completam a manhã.</p></div>
      <div class="infocard"><div class="ico">✧</div><h3>Confirmamos</h3><p>Espaço, data, valor por pessoa e disponibilidade da agenda.</p></div>
      <div class="infocard"><div class="ico">❀</div><h3>Cuidamos de tudo</h3><p>Curadoria, produção e condução — do começo ao fim.</p></div>
    </div>
    <div class="quote" style="margin-top:22px">
      Monique, me conta a região e o número de convidadas que a gente valida os valores e organiza cada detalhe dessa manhã. 🤍<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    {foot("Próximos passos")}
  </section>'''

deck = ('<div class="deck">\n'
        + cover + conceito + vivencia + atmosfera + formato + espaco
        + investimento + opcionais + encerramento + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/vivencia-aromaterapia-monique.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
