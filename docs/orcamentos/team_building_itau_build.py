# Proposta Elarah · Team building Itaú · 25 pessoas · São Paulo · Novembro/2026 · no espaço do Itaú · contato Nathália
# Adaptado do deck Ginger (mesma identidade visual). 7 slides: capa, proposito, experiencias(3), coffee, mimos, investimento(tabela), contato.
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()
tail = open(S + "/tail.html", encoding="utf-8").read()

# ---- paleta laranja Elarah (igual Ginger) ----
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
  /* propósito (3 colunas) */
  .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
  .infocard{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px 20px 20px;box-shadow:0 12px 30px -22px rgba(0,0,0,.28)}
  .infocard h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy);line-height:1.08;margin:8px 0 6px}
  .infocard p{font-size:12px;color:var(--muted);line-height:1.5;margin:0}
  .num{font-family:'DM Serif Display',serif;color:var(--orange);font-size:26px;line-height:1}
  /* cards com foto no topo (slide propósito) */
  .pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
  .pcard{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 12px 30px -22px rgba(0,0,0,.28)}
  .pcard .pphoto{aspect-ratio:4/5;overflow:hidden;background:#eee}
  .pcard .pphoto img{width:100%;height:100%;object-fit:cover;display:block}
  .pcard .pbody{padding:14px 17px 16px}
  .pcard .pbody h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:15.5px;color:var(--navy);line-height:1.15;margin:0 0 5px;text-wrap:balance;min-height:2.3em}
  .pcard .pbody p{font-size:11px;color:var(--muted);line-height:1.45;margin:0}
  .pcard .pbody p b{color:var(--navy);font-weight:700}
  /* menu de experiências (3 cards) */
  .menu3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
  .exp{position:relative;background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 16px 34px -22px rgba(0,0,0,.32)}
  .exp.hl{border:1.6px solid var(--orange)}
  .exp .selo{position:absolute;top:11px;left:11px;z-index:3;background:var(--orange);color:#fff;font-size:8.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:5px 11px;border-radius:999px;box-shadow:0 8px 16px -6px rgba(212,96,14,.5)}
  .exp .ephoto{aspect-ratio:16/11;overflow:hidden;background:#eee}
  .exp .ephoto img{width:100%;height:100%;object-fit:cover;display:block}
  .exp .ebody{padding:14px 17px 16px;display:flex;flex-direction:column;flex:1}
  .exp .en{display:inline-block;font-size:8.5px;letter-spacing:.15em;text-transform:uppercase;font-weight:700;color:var(--orange);margin-bottom:4px}
  .exp h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:19px;color:var(--navy);line-height:1.05}
  .exp p{font-size:11px;color:var(--muted);margin-top:6px;line-height:1.42}
  .exp .from{margin-top:auto;padding-top:10px;font-size:12px;color:var(--navy);font-weight:600}
  .exp .from b{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--orange-dark)}
  /* tabela de investimento */
  .itable{width:100%;border-collapse:collapse;margin-top:16px;font-family:'DM Sans'}
  .itable th,.itable td{padding:16px 12px;border-bottom:1px solid var(--line);text-align:center;vertical-align:middle}
  .itable thead th{font-size:11.5px;color:var(--navy);font-weight:700;border-bottom:2px solid var(--navy);text-transform:uppercase;letter-spacing:.03em}
  .itable thead th span{display:block;font-size:9px;font-weight:500;color:var(--muted);letter-spacing:.01em;margin-top:5px;text-transform:none;line-height:1.35}
  .itable td.rl{text-align:left;width:30%}
  .itable td.rl b{font-family:'DM Serif Display',serif;font-weight:400;font-size:16px;color:var(--navy)}
  .itable td.rl span{display:block;font-size:9.5px;color:var(--muted);margin-top:3px;line-height:1.35}
  .itable td.rl .selo{display:inline-block;margin-top:6px;background:var(--orange);color:#fff;font-size:7.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:3px 8px;border-radius:999px}
  .itable .val{font-family:'DM Serif Display',serif;font-size:24px;color:var(--navy);line-height:1;white-space:nowrap}
  .itable .hl{background:#FBE6D8}
  .itable thead th.hl{color:var(--orange-dark)}
  .itable tbody tr:last-child td{border-bottom:none}
  .itable .pill{display:inline-block;background:var(--navy);color:#fff;font-size:8px;letter-spacing:.07em;padding:3px 9px;border-radius:999px;margin-bottom:6px;font-weight:700;text-transform:uppercase}
  /* coffee */
  .cofrow{display:flex;gap:20px;margin-top:14px;align-items:stretch;flex-wrap:wrap}
  .cofphoto{flex:0 0 300px;border-radius:16px;overflow:hidden;border:1px solid var(--line);box-shadow:0 16px 34px -24px rgba(0,0,0,.34);min-height:230px}
  .cofphoto img{width:100%;height:100%;object-fit:cover;display:block}
  .cofcats{flex:1;min-width:280px;display:grid;grid-template-columns:1fr 1fr;gap:12px 18px;align-content:start}
  .cofcat h4{font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:var(--orange-dark);margin:0 0 4px}
  .cofcat p{font-size:10.5px;color:var(--ink);line-height:1.5;margin:0}
  .bphotos{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:14px}
  .bph{aspect-ratio:1/1;border-radius:14px;overflow:hidden;border:1px solid var(--line);box-shadow:0 14px 32px -24px rgba(0,0,0,.34)}
  .bph img{width:100%;height:100%;object-fit:cover;display:block}
  .bmenu{display:grid;grid-template-columns:repeat(4,1fr);gap:14px 18px;margin-top:16px}
  .priceband{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;background:var(--navy);color:#fff;border-radius:16px;padding:16px 26px;margin-top:14px}
  .priceband .pl{display:block;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange);font-weight:700}
  .priceband .pv{font-family:'DM Serif Display',serif;font-size:30px;line-height:1;margin-top:3px}
  .priceband .side{font-size:12px;color:rgba(255,255,255,.85);line-height:1.5;text-align:right}
  .priceband .side b{color:#fff;font-family:'DM Serif Display',serif;font-size:20px}
  /* mimos (2 cards com foto) */
  .opts{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:14px;align-items:stretch}
  .opt{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 12px 30px -22px rgba(0,0,0,.28)}
  .opt.hl{border:1.6px solid var(--orange)}
  .opt .oph{aspect-ratio:16/10;overflow:hidden;position:relative;background:#eee;border-bottom:1px solid var(--line)}
  .opt .oph img{width:100%;height:100%;object-fit:cover;display:block}
  .opt .ob{padding:15px 20px 17px;flex:1;display:flex;flex-direction:column}
  .opt .oph .pctag{position:absolute;top:11px;right:11px;background:var(--orange);color:#fff;font-size:8.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:5px 12px;border-radius:999px;box-shadow:0 8px 16px -6px rgba(212,96,14,.5)}
  .opt .otp{align-self:flex-start;font-size:8.5px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:var(--muted);background:#EFEAE0;padding:5px 12px;border-radius:999px;margin-bottom:7px}
  .opt .otp.dark{background:var(--navy);color:#fff}
  .opt h4{font-family:'DM Serif Display',serif;font-weight:400;font-size:20px;color:var(--navy);line-height:1.06}
  .opt ul{list-style:none;margin-top:9px;display:flex;flex-direction:column;gap:6px}
  .opt ul li{position:relative;padding-left:16px;font-size:11px;color:var(--ink);line-height:1.32}
  .opt ul li::before{content:"\\2726";position:absolute;left:0;top:1px;color:var(--orange);font-size:9px}
  .opt .endpill{align-self:flex-start;margin-top:11px;background:#FBE6D8;color:var(--navy);font-size:10px;font-weight:600;padding:6px 14px;border-radius:999px}
  /* logo cliente no header */
  .cobrand{display:flex;align-items:center;gap:9px}
  .cobrand .xx{color:var(--muted);font-size:15px;font-weight:300}
  .cobrand .client{font-family:'DM Serif Display',serif;font-size:19px;color:var(--navy);letter-spacing:.01em;line-height:1}
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
{head_block("Proposta de experiência · Team building", "Team building", "Itaú", "Conceição · São Paulo")}
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Team building · Turma privada</span>
        <h1>O time junto, <em>de mão na massa</em></h1>
        <p class="lead">Uma experiência criativa só pro time do <strong>Itaú</strong>. Sem dinâmica forçada e sem apresentação de slides: <strong>todo mundo na mesma mesa criando</strong>, num formato que solta o grupo de verdade — e deixa uma lembrança que continua depois do encontro. 🧡</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>25 pessoas</b></span>
          <span class="chip"><b>Novembro de 2026</b></span>
        </div>
        <div class="chips" style="margin-top:10px">
          <span class="chip">Conceição · São Paulo</span>
          <span class="chip">A partir de <b>R$ 289</b></span>
        </div>
      </div>
      <div class="cover-photo">{img("capa-homens-pintando.jpg", "Time corporativo pintando junto numa oficina criativa", "center 45%")}</div>
    </div>
    <div class="proof proof--wide"><span class="star">★</span> {PROOF}</div>
    {foot("Team building · Itaú")}
  </section>'''

proposito = f'''
  <section class="slide">
{head_simple("Por que funciona")}
    <span class="eyebrow orange">◆ O que o time leva junto</span>
    <h2>Team building que <em>ninguém finge gostar</em></h2>
    <p class="lead">A gente não faz dinâmica de quebra-gelo. A conexão acontece sozinha quando o time senta na mesma mesa pra criar algo com as próprias mãos <strong>— sem hierarquia, sem quem sabe mais e quem sabe menos.</strong> 🧡</p>
    <div class="rule"></div>
    <div class="pgrid">
      <div class="pcard">
        <div class="pphoto">{img("capa-itau-oficina.jpg", "Time conversando enquanto cria, de mão na massa", "center 42%")}</div>
        <div class="pbody"><h3>Conversa que não rola no escritório</h3><p>Duas horas e meia lado a lado fazem o time falar de coisas que a reunião nunca puxa. <b>Áreas diferentes se misturam sozinhas.</b></p></div>
      </div>
      <div class="pcard">
        <div class="pphoto">{img("corp-criativo.jpg", "Time inteiro de mão na massa, criando junto", "center 45%")}</div>
        <div class="pbody"><h3>Todo mundo no mesmo pé</h3><p>Ninguém precisa ter experiência. <b>Diretoria e time começam do zero juntos</b> — e é justamente aí que a hierarquia cai.</p></div>
      </div>
      <div class="pcard">
        <div class="pphoto">{img("ceramica2.jpg", "As peças criadas no encontro, que ficam depois", "center 50%")}</div>
        <div class="pbody"><h3>Fica depois do dia</h3><p>O que foi criado continua depois do encontro — <b>seja como peça individual ou como memória coletiva</b> do time.</p></div>
      </div>
    </div>
    <div class="bnote" style="margin-top:auto">◆ A gente cuida de tudo: profissional que conduz, material, estrutura e montagem. O RH só precisa avisar a data e reunir o time — e, se quiserem, a gente reserva um momento de fala da liderança no meio do encontro. 🌿</div>
    {foot("Por que funciona")}
  </section>'''

experiencias = f'''
  <section class="slide">
{head_simple("O menu")}
    <span class="eyebrow orange">◆ Escolham a experiência</span>
    <h2>Três experiências <em>pro time</em></h2>
    <p class="lead">Todas são feitas pra quem nunca fez, funcionam bem em grupo e colocam todo mundo de mão na massa. É só escolher a que combina mais com o time. 🧡</p>
    <div class="menu3">
      <div class="exp">
        <div class="ephoto">{img("vela-itau.jpg", "Vela aromática personalizada com a marca do Itaú", "center 50%")}</div>
        <div class="ebody">
          <span class="en">01 · A mais sensorial</span>
          <h3>Sabonete ou Vela</h3>
          <p>Cada participante cria sua própria peça escolhendo aromas e combinações. Uma pausa gostosa pra desacelerar, conversar e fazer algo diferente junto.</p>
          <span class="from">A partir de <b>R$ 289</b> por pessoa.</span>
        </div>
      </div>
      <div class="exp hl">
        <span class="selo">★ Sugestão Elarah</span>
        <div class="ephoto">{img("xicarapintada.jpg", "Peças de porcelana pintadas à mão, coloridas e autorais", "center 50%")}</div>
        <div class="ebody">
          <span class="en">02 · A mais criativa</span>
          <h3>Pintura em Porcelana</h3>
          <p>Cada pessoa personaliza sua própria peça e leva pra casa. Leve, visual e fácil de participar — rende conversa e deixa uma lembrança do encontro.</p>
          <span class="from">A partir de <b>R$ 349</b> por pessoa.</span>
        </div>
      </div>
      <div class="exp">
        <div class="ephoto">{img("capa-itau-moodboard.jpg", "Colagem criativa do time com a marca do Itaú", "center 50%")}</div>
        <div class="ebody">
          <span class="en">03 · A mais colaborativa</span>
          <h3>Pintura ou Colagem</h3>
          <p>Cada pessoa contribui com uma parte da criação. No final, tudo se encontra em uma única composição feita pelo time.</p>
          <span class="from">A partir de <b>R$ 369</b> por pessoa.</span>
        </div>
      </div>
    </div>
    <div class="bnote" style="margin-top:auto">◆ Para um grupo de 25 pessoas, nossa sugestão é a <b>Pintura em Porcelana</b>: leve, criativa e fácil de participar, coloca todo mundo de mão na massa e cria espaço para conversas mais naturais — e cada pessoa leva uma lembrança que continua no dia a dia. 🧡</div>
    {foot("O menu")}
  </section>'''

coffee = f'''
  <section class="slide">
{head_simple("O brunch")}
    <span class="eyebrow orange">◆ Incluso nos planos mais altos</span>
    <h2>A mesa posta <em>esperando o time</em></h2>
    <p class="lead">A gente monta uma mesa de brunch completa pro grupo, servida durante a experiência no próprio <strong>Centro Empresarial Itaú Conceição</strong> — sem precisar contratar buffet à parte. Porque a pausa pro cafezinho também faz parte do encontro. 🥐</p>
    <div class="bphotos">
      <div class="bph">{img("salgadinho1.jpg", "Salgados: pão de queijo e mini salgados", "center 50%")}</div>
      <div class="bph">{img("croissant.jpg", "Pães: croissants e pães variados", "center 50%")}</div>
      <div class="bph">{img("bolocaseiro.jpg", "Doces & frutas: bolo caseiro de laranja", "center 50%")}</div>
      <div class="bph">{img("brunch-office2.jpg", "Bebidas: café e sucos no brunch corporativo", "center 45%")}</div>
    </div>
    <div class="bmenu">
      <div class="cofcat"><h4>Salgados</h4><p>Mini croissants de presunto e queijo · mini sanduíches de frango cremoso · pão de queijo</p></div>
      <div class="cofcat"><h4>Pães &amp; acompanhamentos</h4><p>Pães variados · manteiga · cream cheese · geleia · patê de frango ou de ervas</p></div>
      <div class="cofcat"><h4>Doces &amp; frutas</h4><p>Bolo caseiro de laranja ou limão · brownie · frutas da estação · iogurte com granola</p></div>
      <div class="cofcat"><h4>Bebidas</h4><p>Café · leite · suco de laranja · suco de fruta da estação · água</p></div>
    </div>
    <div class="priceband">
      <div><span class="pl">Brunch corporativo</span><span class="pv" style="display:block;margin-top:4px">R$ 99 <small style="font-size:13px;font-family:'DM Sans';color:rgba(255,255,255,.7)">por pessoa</small></span></div>
      <div class="side">Servido durante a experiência<br>no espaço do <b>Itaú</b></div>
    </div>
    <p class="fineprint">Fotos ilustrativas da montagem. Cardápio adaptável a restrições alimentares. Valor por pessoa, já incluído nos planos Premium e Completo.</p>
    {foot("O brunch")}
  </section>'''

mimos = f'''
  <section class="slide">
{head_simple("Os mimos")}
    <span class="eyebrow orange">◆ Nos planos mais altos</span>
    <h2>Pra levar de <em>lembrança</em></h2>
    <p class="lead">Além da peça que cada um cria, os planos superiores somam o registro fotográfico profissional — e o Completo ainda soma um brinde personalizado com a marca do Itaú.</p>
    <div class="opts">
      <div class="opt">
        <div class="oph">{img("eventocorporativo.jpg", "Registro fotográfico profissional de um encontro corporativo", "center 42%")}</div>
        <div class="ob">
          <span class="otp">Nos planos mais altos</span>
          <h4>Registro fotográfico profissional</h4>
          <ul>
            <li>Um fotógrafo cobre o encontro inteiro</li>
            <li>Cada conversa e cada criação registradas</li>
            <li>Álbum digital pronto pro RH e pra comunicação interna</li>
          </ul>
          <span class="endpill">✓ Conteúdo pronto pra usar no LinkedIn</span>
        </div>
      </div>
      <div class="opt hl">
        <div class="oph"><span class="pctag">★ Plano completo</span>{img("brinde-corp-wide.jpg", "Brinde personalizado — kit corporativo premium", "center 50%")}</div>
        <div class="ob">
          <span class="otp dark">O brinde</span>
          <h4>Brinde personalizado</h4>
          <ul>
            <li>Um brinde pra cada pessoa do time</li>
            <li>Personalizado com a marca do Itaú</li>
            <li>Entregue no dia, junto da peça que cada um criou</li>
          </ul>
          <span class="endpill">✓ Um mimo que fica na mesa do time</span>
        </div>
      </div>
    </div>
    <div class="bnote" style="margin-top:14px">◆ Foto ilustrativa do brinde. A gente fecha com vocês o item e a personalização antes do encontro. 🧡</div>
    {foot("Os mimos")}
  </section>'''

investimento = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="eyebrow orange">◆ Escolham a experiência e o plano</span>
    <h2>A partir de <em>R$ 289</em></h2>
    <p class="lead">Valores por pessoa, para turma privada de 25 participantes, com profissional, materiais, estrutura, montagem e desmontagem no espaço do Itaú já inclusos.</p>
    <table class="itable">
      <thead><tr>
        <th class="corner"></th>
        <th>A experiência<span>profissional, materiais &amp; estrutura</span></th>
        <th>Premium<span>+ fotógrafo profissional<br>+ brunch corporativo</span></th>
        <th class="hl"><span class="pill">★ Mais completo</span><br>Completo<span>+ brinde personalizado</span></th>
      </tr></thead>
      <tbody>
        <tr>
          <td class="rl"><b>Sabonete ou Vela</b><span>experiência sensorial</span></td>
          <td class="val">R$ 289</td>
          <td class="val">R$ 439</td>
          <td class="val hl">R$ 539</td>
        </tr>
        <tr>
          <td class="rl"><b>Pintura em Porcelana</b><span>a mais criativa</span><span class="selo">★ Sugestão Elarah</span></td>
          <td class="val">R$ 349</td>
          <td class="val">R$ 499</td>
          <td class="val hl">R$ 599</td>
        </tr>
        <tr>
          <td class="rl"><b>Pintura ou Colagem</b><span>experiência colaborativa</span></td>
          <td class="val">R$ 369</td>
          <td class="val">R$ 519</td>
          <td class="val hl">R$ 619</td>
        </tr>
      </tbody>
    </table>
    <div class="bnote" style="margin-top:14px">◆ Valores por pessoa, para 25 participantes, em novembro de 2026. Totais da turma no plano de entrada: <b>R$ 7.225</b> (Sabonete ou Vela), <b>R$ 8.725</b> (Pintura em Porcelana) e <b>R$ 9.225</b> (Pintura ou Colagem). Os valores consideram a realização da experiência no espaço do Itaú, com profissional, materiais, estrutura, montagem e desmontagem inclusos. No plano Premium, estão incluídos brunch corporativo e fotógrafo profissional. O plano Completo acrescenta brinde personalizado. A Elarah emite nota fiscal e ajusta as condições de pagamento com o financeiro do Itaú.</div>
    {foot("Investimento")}
  </section>'''

contato = f'''
  <section class="slide">
{head_simple("Como funciona & contato")}
    <span class="eyebrow orange">◆ Simples e sob medida</span>
    <h2>É só reunir <em>o time</em></h2>
    <p class="lead">A Elarah cuida de toda a produção pro encontro ser leve do começo ao fim:</p>
    <div class="rule"></div>
    <div class="grid3">
      <div class="infocard"><span class="num">01</span><h3>Escolham a experiência e o plano</h3><p>A gente reserva a agenda pro time do Itaú em novembro de 2026.</p></div>
      <div class="infocard"><span class="num">02</span><h3>A gente leva tudo</h3><p>Profissional, materiais e estrutura, montados no espaço do Itaú.</p></div>
      <div class="infocard"><span class="num">03</span><h3>Cada experiência deixa uma lembrança</h3><p>O que foi criado continua com o time depois do dia.</p></div>
    </div>
    <div class="addon">
      <span class="plus">+</span>
      <div>
        <h4 style="font-family:'DM Serif Display',serif;font-weight:400;font-size:16px;color:var(--navy);margin:0 0 4px">Sob medida pro time</h4>
        <p style="font-size:11.5px;color:var(--muted);line-height:1.5;margin:0">Fala da liderança no encontro, brunch adaptável a restrições e brinde com a marca do Itaú. Emitimos nota fiscal e ajustamos o pagamento com o financeiro. 🧡</p>
      </div>
    </div>
    <div class="quote">
      <strong style="font-family:'DM Serif Display',serif;font-weight:400;font-size:23px;color:var(--navy);display:block;margin-bottom:8px">Bora reunir o time? ✦</strong>
      Nathália, me confirma a <strong>experiência</strong> e o <strong>plano</strong> que fazem mais sentido para o time, que a gente organiza os próximos passos e cuida de toda a produção.<br>
      <i>Elarah · Experiências</i> &nbsp;·&nbsp; WhatsApp <strong>+55 (11) 91445-5930</strong> &nbsp;·&nbsp; @elarah.oficial &nbsp;·&nbsp; elarah.com.br
    </div>
    <p class="fineprint">Proposta de experiência da Elarah para team building do Itaú — turma privada de 25 pessoas, em novembro de 2026, em São Paulo, com realização no espaço do próprio Itaú. Experiências à escolha, desenvolvidas para iniciantes: Sabonete ou Vela, Pintura em Porcelana ou Pintura/Colagem. Valores por pessoa no plano de entrada: R$ 289 (Sabonete ou Vela), R$ 349 (Pintura em Porcelana) e R$ 369 (Pintura ou Colagem). O plano Premium inclui registro fotográfico profissional e brunch corporativo servido durante a experiência; o plano Completo acrescenta brinde personalizado por participante. O brunch tem valor de R$ 99 por pessoa e já está contemplado nos planos Premium e Completo. Fotos do brunch e do brinde são ilustrativas; o cardápio pode ser adaptado a restrições alimentares e o item/personalização do brinde será definido na confirmação. A experiência inclui profissional, materiais, estrutura, montagem e desmontagem no espaço do Itaú. Emissão de nota fiscal e condições de pagamento serão alinhadas com o financeiro do Itaú. Proposta válida mediante confirmação da data, disponibilidade de agenda e definição da experiência escolhida.</p>
    {foot("Como funciona & contato")}
  </section>'''

deck = '<div class="deck">\n' + cover + proposito + experiencias + coffee + mimos + investimento + contato + '\n\n</div>\n\n'
html = head + deck + tail
out = ROOT + "/experiencia-team-building-itau.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| slides:", html.count('<section class="slide">'))
