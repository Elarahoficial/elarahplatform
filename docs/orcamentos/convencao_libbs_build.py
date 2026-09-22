# Proposta Elarah · Convenção LIBBS · Festival LIBBS · Distrito Anhembi · 14 e 15/12 · ~1.500 pessoas · experiência olfativa
# Baseado no deck Ginger/Itaú (mesma identidade). 8 slides: capa, por que funciona, 3 experiencias, como funciona, personalizacao, extras, investimento, fechamento.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

# ---- paleta laranja Elarah (igual Ginger/Itau) ----
reps = {
    "--orange:#B08D4C;": "--orange:#F27623;",
    "--orange-dark:#8A6D34;": "--orange-dark:#D4600E;",
    "--navy:#12362B;": "--navy:#16233C;",
    "--navy-soft:#3A5A4E;": "--navy-soft:#3B4E6B;",
    "--blue-accent:#B08D4C;": "--blue-accent:#F27623;",
    "#EFF3EE": "#EDF1F7", "#DCE8E1": "#DCE5F1", "#CBB06E": "#FF9A4D",
    "rgba(176,141,76,.24)": "rgba(242,118,35,.22)",
    "rgba(176,141,76,.26)": "rgba(242,118,35,.26)",
    "rgba(176,141,76,.10)": "rgba(242,118,35,.10)",
    "rgba(18,54,43,.16)": "rgba(62,37,48,.14)",
    "rgba(10,28,22,.86)": "rgba(16,23,28,.86)",
    "rgba(10,28,22,.85)": "rgba(16,23,28,.85)",
    "rgba(10,28,22,.82)": "rgba(16,23,28,.82)",
}
for a, b in reps.items():
    head = head.replace(a, b)

xcss = '''
  .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
  .infocard{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px 20px 20px;box-shadow:0 12px 30px -22px rgba(0,0,0,.28)}
  .infocard h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy);line-height:1.08;margin:8px 0 6px}
  .infocard p{font-size:12px;color:var(--muted);line-height:1.5;margin:0}
  .num{font-family:'DM Serif Display',serif;color:var(--orange);font-size:26px;line-height:1}
  /* cards com foto no topo */
  .pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
  .pcard{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 12px 30px -22px rgba(0,0,0,.28)}
  .pcard .pphoto{aspect-ratio:4/5;overflow:hidden;background:#eee}
  .pcard .pphoto img{width:100%;height:100%;object-fit:cover;display:block}
  .pcard .pbody{padding:14px 17px 16px}
  .pcard .pbody h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:15.5px;color:var(--navy);line-height:1.15;margin:0 0 5px;text-wrap:balance;min-height:2.3em}
  .pcard .pbody p{font-size:11px;color:var(--muted);line-height:1.45;margin:0}
  .pcard .pbody p b{color:var(--navy);font-weight:700}
  /* menu de experiências */
  .menu3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
  .exp{position:relative;background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.32)}
  .exp .ephoto{aspect-ratio:16/11;overflow:hidden;background:#eee}
  .exp .ephoto img{width:100%;height:100%;object-fit:cover;display:block}
  .exp .ebody{padding:14px 17px 16px;display:flex;flex-direction:column;flex:1}
  .exp .en{display:inline-block;font-size:8.5px;letter-spacing:.15em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:4px}
  .exp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:19px;color:var(--navy);line-height:1.05}
  .exp p{font-size:11px;color:var(--muted);margin-top:6px;line-height:1.42}
  .exp .from{margin-top:auto;padding-top:10px;font-size:11.5px;color:var(--navy);font-weight:600}
  .exp .from b{color:var(--orange-dark)}
  /* números / escala */
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:16px}
  .stat{background:var(--navy);border-radius:16px;padding:18px 14px;text-align:center}
  .stat .sv{font-family:'DM Serif Display',serif;font-size:30px;line-height:1;color:var(--orange)}
  .stat .sl{font-size:9.5px;letter-spacing:.05em;color:rgba(255,255,255,.82);margin-top:8px;line-height:1.4;text-transform:uppercase}
  /* fluxo */
  .flow{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:16px}
  .fstep{text-align:center}
  .fstep .fn{width:36px;height:36px;border-radius:999px;background:var(--orange);color:#fff;font-family:'DM Serif Display',serif;font-size:17px;display:flex;align-items:center;justify-content:center;margin:0 auto 9px}
  .fstep h4{font-size:12px;color:var(--navy);font-weight:700;line-height:1.25;margin:0}
  /* personalização */
  .cofrow{display:flex;gap:22px;margin-top:16px;align-items:stretch;flex-wrap:wrap}
  .cofphoto{flex:0 0 320px;border-radius:16px;overflow:hidden;border:1px solid var(--line);box-shadow:0 16px 34px -24px rgba(0,0,0,.34);min-height:250px}
  .cofphoto img{width:100%;height:100%;object-fit:cover;display:block}
  .checks{flex:1;min-width:280px;display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;align-content:center;margin:0}
  .checks li{list-style:none;position:relative;padding-left:24px;font-size:12.5px;color:var(--ink);line-height:1.3}
  .checks li .ck{position:absolute;left:0;top:1px;width:16px;height:16px;border-radius:999px;background:var(--orange);color:#fff;font-size:8px;font-weight:800;display:flex;align-items:center;justify-content:center}
  /* extras */
  .opts{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:14px;align-items:stretch}
  .opt{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 12px 30px -22px rgba(0,0,0,.28)}
  .opt.hl{border:1.6px solid var(--orange)}
  .opt .oph{aspect-ratio:16/10;overflow:hidden;position:relative;background:#eee;border-bottom:1px solid var(--line)}
  .opt .oph img{width:100%;height:100%;object-fit:cover;display:block}
  .opt .oph .pctag{position:absolute;top:11px;right:11px;background:var(--orange);color:#fff;font-size:8.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:5px 12px;border-radius:999px}
  .opt .ob{padding:15px 20px 17px;flex:1;display:flex;flex-direction:column}
  .opt .otp{align-self:flex-start;font-size:8.5px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:var(--muted);background:#EFEAE0;padding:5px 12px;border-radius:999px;margin-bottom:7px}
  .opt h4{font-family:'DM Serif Display',serif;font-weight:400;font-size:20px;color:var(--navy);line-height:1.06}
  .opt ul{list-style:none;margin-top:9px;display:flex;flex-direction:column;gap:6px}
  .opt ul li{position:relative;padding-left:16px;font-size:11px;color:var(--ink);line-height:1.32}
  .opt ul li::before{content:"\\2726";position:absolute;left:0;top:1px;color:var(--orange);font-size:9px}
  /* investimento */
  .itable{width:100%;border-collapse:collapse;margin-top:16px;font-family:'DM Sans'}
  .itable th,.itable td{padding:16px 12px;border-bottom:1px solid var(--line);text-align:center;vertical-align:middle}
  .itable thead th{font-size:11.5px;color:var(--navy);font-weight:700;border-bottom:2px solid var(--navy);text-transform:uppercase;letter-spacing:.03em}
  .itable thead th span{display:block;font-size:9px;font-weight:500;color:var(--muted);letter-spacing:.01em;margin-top:5px;text-transform:none;line-height:1.35}
  .itable td.rl{text-align:left;width:34%}
  .itable td.rl b{font-family:'DM Serif Display',serif;font-weight:400;font-size:16px;color:var(--navy)}
  .itable td.rl span{display:block;font-size:9.5px;color:var(--muted);margin-top:3px;line-height:1.35}
  .itable .tbd{font-family:'DM Sans';font-size:12.5px;font-style:italic;color:var(--orange-dark);font-weight:600}
  .itable .hl{background:#FBE6D8}
  .itable thead th.hl{color:var(--orange-dark)}
  .itable tbody tr:last-child td{border-bottom:none}
  .itable .pill{display:inline-block;background:var(--navy);color:#fff;font-size:8px;letter-spacing:.07em;padding:3px 9px;border-radius:999px;margin-bottom:6px;font-weight:700;text-transform:uppercase}
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


PROOF = "Já realizado para times como <b>Compass</b>, <b>Natura</b> e <b>Hidratei</b> · visto no <b>Mais Você</b> (Globo)"

cover = f'''
  <section class="slide">
{head_block("Proposta de experiência · Convenção", "Convenção", "LIBBS", "Distrito Anhembi · Dez")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Festival LIBBS · Experiência olfativa</span>
        <h1>Um intervalo pra criar, <em>um motivo pra conectar</em></h1>
        <p class="lead">Uma experiência olfativa dentro da <strong>Convenção LIBBS</strong> — rápida, mão na massa e feita pra ficar na memória. Entre um conteúdo e outro, uma pausa pra criar e levar com você. 🧡</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>14 e 15 de dezembro</b></span>
          <span class="chip">Distrito Anhembi</span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip">Até <b>50 pessoas/hora</b></span>
          <span class="chip"><b>30–40 min</b> por experiência</span>
        </div>
      </div>
      <div class="cover-photo">{img("capa-homens-pintando.jpg", "Adultos criando juntos numa experiência corporativa", "center 45%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Convenção LIBBS")}
  </section>'''

porque = f'''
  <section class="slide">
{head_simple("Por que funciona")}
    <span class="eyebrow orange">◆ Um jeito leve de conectar</span>
    <h2>Uma pausa que cabe no <em>ritmo da convenção</em></h2>
    <p class="lead">No meio de um dia cheio de conteúdo, encontros e programação, a experiência cria uma pausa leve e mão na massa — sem tirar o participante por muito tempo do evento.</p>
    <div class="pgrid">
      <div class="pcard">
        <div class="pphoto">{img("capa-itau-oficina.jpg", "Pessoas conversando enquanto criam juntas", "center 42%")}</div>
        <div class="pbody"><h3>Conversa que acontece no caminho</h3><p>Enquanto escolhem aromas e criam juntos, as pessoas conversam de um jeito mais espontâneo. <b>Áreas e perfis diferentes se encontram naturalmente.</b></p></div>
      </div>
      <div class="pcard">
        <div class="pphoto">{img("perfumaria-oficina.jpg", "Grupo misto trabalhando com aromas", "center 50%")}</div>
        <div class="pbody"><h3>Todo mundo entra do mesmo jeito</h3><p>Ninguém precisa saber fazer. É simples, guiada e pensada pra quem nunca participou. <b>É só chegar, escolher e criar.</b></p></div>
      </div>
      <div class="pcard">
        <div class="pphoto">{img("velaaromatica.jpg", "Close do take-home aromático que cada um leva", "center 50%")}</div>
        <div class="pbody"><h3>Fica depois da convenção</h3><p>Cada pessoa leva pra casa o que criou durante a experiência. <b>A lembrança do encontro continua depois do evento.</b></p></div>
      </div>
    </div>
    <div class="bnote" style="margin-top:auto">◆ Desenhada pra acompanhar a escala da convenção: até <b>50 pessoas por hora</b> e potencial de envolver até <b>80% do público</b> nos dois dias.</div>
    {foot("Por que funciona")}
  </section>'''

experiencias = f'''
  <section class="slide">
{head_simple("As experiências")}
    <span class="eyebrow orange">◆ Escolham a experiência</span>
    <h2>Três experiências <em>pra conectar</em></h2>
    <p class="lead">Todas são rápidas, mão na massa e pensadas pra funcionar bem no fluxo da convenção. Cada pessoa escolhe, cria e leva um pouco da experiência pra casa. 🧡</p>
    <div class="menu3">
      <div class="exp">
        <div class="ephoto">{img("vela-aromatica-real.jpg", "Criação de vela aromática com escolha de aromas", "center 45%")}</div>
        <div class="ebody">
          <span class="en">01 · A mais sensorial</span>
          <h3>Vela Aromática</h3>
          <p>Cada pessoa escolhe seus aromas, cria a própria vela e leva pra casa uma lembrança feita ali. Gostosa de fazer, rende conversa e conexão de um jeito leve.</p>
          <span class="from">Até <b>50 pessoas</b> por hora.</span>
        </div>
      </div>
      <div class="exp">
        <div class="ephoto">{img("homespray.jpg", "Home spray personalizado criado na hora", "center 45%")}</div>
        <div class="ebody">
          <span class="en">02 · A mais fluida</span>
          <h3>Home Spray</h3>
          <p>Cada pessoa conhece os aromas, escolhe sua combinação e prepara o próprio home spray. Rápida e prática — criou, personalizou e já leva.</p>
          <span class="from">Até <b>50 pessoas</b> por hora.</span>
        </div>
      </div>
      <div class="exp">
        <div class="ephoto">{img("sabonete2.jpg", "Sabonetes aromáticos personalizados", "center 50%")}</div>
        <div class="ebody">
          <span class="en">03 · A mais leve</span>
          <h3>Sabonete Aromático</h3>
          <p>Uma experiência simples e criativa pra explorar aromas e criar um sabonete personalizado. Fácil de participar e com um take-home que continua depois do evento.</p>
          <span class="from">Até <b>50 pessoas</b> por hora.</span>
        </div>
      </div>
    </div>
    <div class="bnote" style="margin-top:14px">◆ Três jeitos diferentes de criar junto, conversar e levar um pouco desse encontro com você.</div>
    {foot("As experiências")}
  </section>'''

comofunciona = f'''
  <section class="slide">
{head_simple("Como funciona")}
    <span class="eyebrow orange">◆ Fácil de participar</span>
    <h2>É só chegar e <em>criar</em></h2>
    <p class="lead">Um fluxo simples e guiado, do primeiro aroma ao take-home — pensado pra acontecer no ritmo da convenção, com participação espontânea ao longo dos dois dias.</p>
    <div class="flow">
      <div class="fstep"><div class="fn">1</div><h4>Conhece os aromas</h4></div>
      <div class="fstep"><div class="fn">2</div><h4>Escolhe sua combinação</h4></div>
      <div class="fstep"><div class="fn">3</div><h4>Cria</h4></div>
      <div class="fstep"><div class="fn">4</div><h4>Personaliza</h4></div>
      <div class="fstep"><div class="fn">5</div><h4>Leva pra casa</h4></div>
    </div>
    <p class="subh" style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin:22px 0 0">Desenhada pra escala da convenção</p>
    <div class="stats">
      <div class="stat"><div class="sv">até 50</div><div class="sl">pessoas por hora</div></div>
      <div class="stat"><div class="sv">até 600</div><div class="sl">por dia (12h de programação)</div></div>
      <div class="stat"><div class="sv">até 1.200</div><div class="sl">capacidade nos 2 dias</div></div>
      <div class="stat"><div class="sv">até 80%</div><div class="sl">potencial do público total</div></div>
    </div>
    <div class="bnote" style="margin-top:16px">◆ Participação espontânea, com a ativação disponível ao longo da convenção — cada experiência leva <b>30–40 min</b> e cada pessoa sai com <b>1 take-home</b>. O formato final de mesas e estações será definido conforme a área disponível no Distrito Anhembi.</div>
    {foot("Como funciona")}
  </section>'''

personaliza = f'''
  <section class="slide">
{head_simple("Personalização")}
    <span class="eyebrow orange">◆ Com a cara da convenção</span>
    <h2>A experiência com a <em>cara da LIBBS</em></h2>
    <p class="lead">Da mesa ao produto que cada pessoa leva pra casa, a experiência pode receber a identidade da convenção.</p>
    <div class="cofrow">
      <div class="cofphoto">{img("perfumariadecor.jpg", "Mesa de aromas organizada com etiquetas e materiais", "center 45%")}</div>
      <ul class="checks">
        <li><span class="ck">✓</span>Etiquetas dos produtos</li>
        <li><span class="ck">✓</span>Materiais de mesa</li>
        <li><span class="ck">✓</span>Menu de aromas</li>
        <li><span class="ck">✓</span>Comunicação da ativação</li>
        <li><span class="ck">✓</span>Embalagem do take-home</li>
        <li><span class="ck">✓</span>Nome da experiência</li>
        <li><span class="ck">✓</span>Identidade visual da convenção</li>
      </ul>
    </div>
    <div class="bnote" style="margin-top:16px">◆ Aplicamos a identidade que a LIBBS já tem — do material de mesa ao produto final — pra experiência conversar com o Festival do começo ao fim.</div>
    {foot("Personalização")}
  </section>'''

extras = f'''
  <section class="slide">
{head_simple("Extras")}
    <span class="eyebrow orange">◆ Pra experiência chegar em mais gente</span>
    <h2>Pra experiência chegar em <em>mais gente</em></h2>
    <p class="lead">Como a convenção terá cerca de <strong>1.500 pessoas</strong> e a experiência tem capacidade limitada, dá pra incluir um pequeno item do universo olfativo pra quem não conseguir participar da atividade.</p>
    <div class="opts">
      <div class="opt hl">
        <div class="oph"><span class="pctag">★ Opcional</span>{img("aromatizador-corp.jpg", "Itens aromáticos para levar como lembrança", "center 50%")}</div>
        <div class="ob">
          <span class="otp">Um pouco da experiência pra levar</span>
          <h4>Take-home pra todo mundo</h4>
          <ul>
            <li>Mini vela</li>
            <li>Sabonete</li>
            <li>Sachê aromático</li>
            <li>Aromatizador ou outro item do universo olfativo</li>
          </ul>
        </div>
      </div>
      <div class="opt">
        <div class="oph">{img("vela-corp.jpg", "Mini vela aromática como lembrança do evento", "center 50%")}</div>
        <div class="ob">
          <span class="otp">Como funciona</span>
          <h4>Escala pra convenção inteira</h4>
          <ul>
            <li>Distribuído junto da ativação, pra quem passar pela área</li>
            <li>Mesmo universo olfativo da experiência</li>
            <li>Quantidade e item definidos com vocês</li>
            <li>Uma forma de a experiência alcançar mais gente</li>
          </ul>
        </div>
      </div>
    </div>
    <div class="bnote" style="margin-top:14px">◆ Apresentado como opcional. Definimos o item e o investimento junto com vocês, conforme a quantidade.</div>
    {foot("Extras")}
  </section>'''

investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Organizado por experiência</span>
    <h2>O <em>investimento</em></h2>
    <p class="lead">Valores por experiência, com todos os insumos, utensílios e materiais inclusos. O investimento final depende da quantidade de horas/sessões contratadas.</p>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th>Essencial<span>experiência guiada + peça feita na hora</span></th>
        <th class="hl"><span class="pill">Personalizada</span><br>Personalizada<span>combinação de aromas + detalhes extras</span></th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="rl"><b>Vela Aromática</b><span>escolhe os aromas e cria a própria vela</span></td>
          <td class="tbd">investimento em validação</td>
          <td class="tbd hl">investimento em validação</td>
        </tr>
        <tr>
          <td class="rl"><b>Home Spray</b><span>conhece, combina e prepara o próprio spray</span></td>
          <td class="tbd">investimento em validação</td>
          <td class="tbd hl">investimento em validação</td>
        </tr>
        <tr>
          <td class="rl"><b>Sabonete Aromático</b><span>explora aromas e cria um sabonete personalizado</span></td>
          <td class="tbd">investimento em validação</td>
          <td class="tbd hl">investimento em validação</td>
        </tr>
      </tbody>
    </table>
    <div class="bnote" style="margin-top:14px">◆ <b>Incluso na experiência:</b> todos os insumos, utensílios e materiais necessários para a produção e condução da atividade, com equipe de 4 a 5 facilitadores conforme o formato.</div>
    <p class="fineprint">O investimento final depende da quantidade de horas/sessões contratadas. Microfone, mesas e cadeiras não estão inclusos e deverão ser disponibilizados pelo contratante conforme a experiência escolhida — experiências com grupos maiores podem precisar de estrutura de áudio, validada conforme a estrutura disponível no evento.</p>
    {foot("Investimento")}
  </section>'''

fechamento = f'''
  <section class="slide">
{head_simple("Como funciona & contato")}
    <span class="eyebrow orange">◆ Simples e sob medida</span>
    <h2>É só escolher a <em>experiência</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pra a ativação rodar leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><span class="num">01</span><h3>Escolhem o formato</h3><p>A experiência e o número de sessões que fazem sentido pra convenção.</p></div>
      <div class="infocard"><span class="num">02</span><h3>A gente ajusta o espaço e o fluxo</h3><p>Mesas, estações e ritmo, conforme a área no Distrito Anhembi.</p></div>
      <div class="infocard"><span class="num">03</span><h3>A Elarah leva tudo</h3><p>Insumos, materiais e equipe — a gente cuida de toda a operação nos dois dias.</p></div>
    </div>
    <div class="quote">
      <strong style="font-family:'DM Serif Display',serif;font-weight:400;font-size:23px;color:var(--navy);display:block;margin-bottom:8px">Bora criar essa experiência juntos? ✦</strong>
      Renata, me confirma o <strong>formato</strong> e a quantidade de sessões que a gente organiza os próximos passos e cuida de toda a produção.<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    <p class="fineprint">Proposta de experiência olfativa da Elarah para a Convenção LIBBS (Festival LIBBS) — Distrito Anhembi, 14 e 15 de dezembro, das 7h às 19h, para um público de cerca de 1.500 pessoas (perfil misto). Experiências à escolha (Vela Aromática, Home Spray ou Sabonete Aromático), de aproximadamente 30–40 minutos, com capacidade de até 50 participantes por hora e participação espontânea ao longo da convenção; 1 take-home por participante. Capacidade teórica de até 600 participações por dia e até 1.200 nos dois dias, com potencial de envolver até 80% do público caso a operação rode na capacidade máxima — participação espontânea, sem número garantido. Insumos, utensílios e materiais inclusos; microfone, mesas e cadeiras por conta do contratante. Investimentos em validação; valor final conforme a quantidade de horas/sessões. Proposta válida mediante confirmação de data, formato e disponibilidade de agenda.</p>
    {foot("Como funciona & contato")}
  </section>'''

deck = '<div class="deck">\n' + cover + porque + experiencias + comofunciona + personaliza + extras + investimento + fechamento + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/experiencia-convencao-libbs.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
