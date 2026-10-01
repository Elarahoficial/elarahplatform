# Proposta Elarah · Encontro de Mulheres · Vela Aromática + Wax Melts + Coffee Break Pão e Talho
# 31/10 · 60 mulheres (2 turmas de 30) · regiao do ABC · local a definir.
# Vela R$249/p (R$14.940) · Wax Melts R$279/p (R$16.740). Coffee opcional (nao somar).
# Estetica editorial/clean/humana. Sem fornecedor/margem/comissao. Comunicacao no plural (nos).
import io, re

ROOT = "/home/user/elarahplatform"
ref = io.open(ROOT + "/orcamento-adriana.html", encoding="utf-8").read()
head = ref.split('<div class="deck">')[0]
tail = '<div class="toolbar">' + ref.split('<div class="toolbar">', 1)[1]

head = re.sub(r'<title>.*?</title>', '<title>Encontro de Mulheres · Experiência Sensorial · Elarah</title>', head, count=1, flags=re.DOTALL)
head = re.sub(r'<meta name="description"[^>]*>',
              '<meta name="description" content="Encontro de Mulheres · uma pausa para criar, sentir e compartilhar. Workshop de Vela Aromática ou Wax Melts para 60 participantes.">',
              head, count=1)

extra = '''
<style>
  /* experiencia */
  .exp{display:grid;grid-template-columns:1.04fr .96fr;gap:36px;margin-top:20px;align-items:center}
  .exp .ph{border-radius:20px;overflow:hidden;border:1px solid var(--line);box-shadow:0 20px 48px -28px rgba(0,0,0,.45);height:410px;position:relative}
  .exp .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .exp p.tx{font-size:14px;color:var(--ink);line-height:1.62;margin:0 0 10px}
  .exp p.tx b{color:var(--navy);font-weight:700}
  .kwpills{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
  .kwpills span{background:var(--card);border:1px solid var(--line);border-radius:999px;padding:10px 17px;font-size:12.5px;font-weight:700;color:var(--navy);box-shadow:0 10px 24px -20px rgba(0,0,0,.3)}
  .kwpills span.hl{background:var(--orange);color:#fff;border-color:transparent}
  /* incluso */
  .incstrip{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:20px}
  .incstrip figure{margin:0;border-radius:16px;overflow:hidden;height:156px;position:relative;border:1px solid var(--line);box-shadow:0 14px 32px -24px rgba(0,0,0,.4)}
  .incstrip img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .inclist2{list-style:none;margin:18px 0 0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:9px 26px}
  .inclist2 li{position:relative;padding-left:24px;font-size:12.5px;color:var(--ink);line-height:1.4}
  .inclist2 li .ck{position:absolute;left:0;top:1px;color:var(--orange);font-weight:800}
  .inclist2 li b{color:var(--navy);font-weight:700}
  .incnote{margin-top:16px;background:#FBF1EE;border-radius:14px;padding:15px 20px;font-size:13.5px;color:var(--navy);font-weight:700}
  .incnote span{color:var(--orange-dark)}
  /* investimento */
  .sugtag{display:inline-block;background:var(--orange);color:#fff;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:800;padding:7px 15px;border-radius:999px;margin-bottom:12px}
  .invwrap{display:grid;grid-template-columns:1.1fr .9fr;gap:20px;margin-top:8px;align-items:stretch}
  .invmain{background:linear-gradient(158deg,var(--navy),#241722);color:#fff;border-radius:22px;padding:36px 36px;display:flex;flex-direction:column;justify-content:center;box-shadow:0 22px 50px -28px rgba(0,0,0,.5)}
  .invmain .tag{font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:var(--orange);font-weight:700}
  .invmain .big{font-family:'DM Serif Display',serif;font-size:58px;line-height:1;margin:8px 0 2px}
  .invmain .per{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.72);font-weight:700}
  .invside{display:flex;flex-direction:column;justify-content:center;gap:14px}
  .invtot{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px 24px;box-shadow:0 14px 34px -26px rgba(0,0,0,.3)}
  .invtot .k{font-size:10px;letter-spacing:.13em;text-transform:uppercase;font-weight:700;color:var(--orange-dark)}
  .invtot .v{font-family:'DM Serif Display',serif;font-size:34px;color:var(--navy);margin-top:4px;line-height:1}
  .invnote{background:#FBF1EE;border-radius:14px;padding:13px 17px;font-size:12px;color:var(--navy-soft);line-height:1.5}
  /* wax melts */
  .waxsplit{display:grid;grid-template-columns:.95fr 1.05fr;gap:34px;margin-top:20px;align-items:center}
  .waxsplit .ph{border-radius:20px;overflow:hidden;border:1px solid var(--line);box-shadow:0 20px 48px -28px rgba(0,0,0,.45);height:380px;position:relative}
  .waxsplit .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .waxsplit p.tx{font-size:13.5px;color:var(--ink);line-height:1.6;margin:0 0 12px}
  .waxsplit p.tx b{color:var(--navy);font-weight:700}
  .waxinc{list-style:none;margin:0 0 16px;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:8px 22px}
  .waxinc li{position:relative;padding-left:22px;font-size:12px;color:var(--ink);line-height:1.4}
  .waxinc li .ck{position:absolute;left:0;top:1px;color:var(--orange);font-weight:800}
  .waxprice{display:flex;align-items:baseline;gap:16px;flex-wrap:wrap;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px 22px;box-shadow:0 14px 34px -26px rgba(0,0,0,.3)}
  .waxprice .pp{font-family:'DM Serif Display',serif;font-size:34px;color:var(--navy);line-height:1}
  .waxprice .pp small{font-family:'DM Sans',sans-serif;font-size:12px;color:var(--muted);font-weight:600}
  .waxprice .tt{font-size:12.5px;color:var(--navy-soft);font-weight:700}
  .waxprice .tt b{color:var(--orange-dark)}
  /* escolha (comparativo) */
  .cmp{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px;margin-top:22px;align-items:stretch;width:100%}
  .cmpc{background:var(--card);border:1px solid var(--line);border-radius:20px;overflow:hidden;box-shadow:0 16px 38px -26px rgba(0,0,0,.34);display:flex;flex-direction:column;min-width:0}
  .cmpc.hl{border:2px solid var(--orange)}
  .cmpc .cph{height:180px;position:relative;overflow:hidden}
  .cmpc .cph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .cmpc .cbd{padding:22px 24px 24px;display:flex;flex-direction:column;flex:1}
  .cmpc .nm{font-family:'DM Serif Display',serif;font-size:23px;color:var(--navy);line-height:1.05}
  .cmpc .sg{display:inline-block;align-self:flex-start;background:var(--orange);color:#fff;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:800;padding:5px 11px;border-radius:999px;margin-top:8px}
  .cmpc .pr{margin-top:12px;font-family:'DM Serif Display',serif;font-size:30px;color:var(--orange-dark);line-height:1}
  .cmpc .pr small{font-family:'DM Sans',sans-serif;font-size:12px;color:var(--muted);font-weight:600}
  .cmpc .ds{font-size:12.5px;color:var(--muted);line-height:1.55;margin:12px 0 0}
  .cmpc .ds b{color:var(--navy);font-weight:700}
  .cmpc .tot{margin-top:auto;padding-top:14px;font-size:12.5px;font-weight:700;color:var(--navy)}
  .cmpc .tot b{font-family:'DM Serif Display',serif;font-weight:400;font-size:17px;color:var(--navy)}
  /* coffee break */
  .cbg{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:20px;align-items:stretch}
  .cbc{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px 22px 24px;box-shadow:0 14px 34px -26px rgba(0,0,0,.3);display:flex;flex-direction:column;position:relative}
  .cbc.hl{border:2px solid var(--orange)}
  .cbc .sg{display:inline-block;align-self:flex-start;background:var(--orange);color:#fff;font-size:9px;letter-spacing:.12em;text-transform:uppercase;font-weight:800;padding:5px 11px;border-radius:999px;margin-bottom:9px}
  .cbc .nm{font-family:'DM Serif Display',serif;font-size:20px;color:var(--navy);line-height:1}
  .cbc .pr{margin-top:8px;font-size:12px;font-weight:700;color:var(--orange-dark)}
  .cbc .pr b{font-family:'DM Serif Display',serif;font-weight:400;font-size:22px;color:var(--navy)}
  .cbc .pr small{color:var(--muted);font-weight:600;display:block;margin-top:2px}
  .cbc ul{list-style:none;margin:13px 0 12px;padding:0;display:grid;gap:6px}
  .cbc ul li{position:relative;padding-left:18px;font-size:11px;color:var(--ink);line-height:1.35}
  .cbc ul li .ck{position:absolute;left:0;top:0;color:var(--orange);font-weight:800;font-size:10px}
  .cbc .tx{margin-top:auto;font-size:11px;color:var(--muted);line-height:1.45;font-style:italic}
  .cbnote{margin-top:15px;font-size:11px;color:var(--muted);line-height:1.5}
  /* fluxo */
  .flow{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:22px}
  .fstep{display:flex;align-items:flex-start;gap:16px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px 22px;box-shadow:0 12px 30px -26px rgba(0,0,0,.3)}
  .fstep .fn{width:36px;height:36px;flex:none;border-radius:999px;background:var(--orange);color:#fff;font-family:'DM Serif Display',serif;font-size:17px;display:flex;align-items:center;justify-content:center}
  .fstep h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;color:var(--navy);margin:0 0 4px;line-height:1.1}
  .fstep p{font-size:12px;color:var(--muted);line-height:1.45;margin:0}
  /* fechamento */
  .finwrap{display:grid;grid-template-columns:1.02fr .98fr;gap:38px;margin-top:20px;align-items:center}
  .finwrap .ph{border-radius:20px;overflow:hidden;border:1px solid var(--line);box-shadow:0 22px 52px -28px rgba(0,0,0,.45);height:420px;position:relative}
  .finwrap .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .finwrap .ftx p.lead{margin-top:0}
  .finsign{margin-top:20px;font-family:'DM Serif Display',serif;font-size:19px;color:var(--navy);line-height:1.3}
  .finsign em{font-style:italic;color:var(--orange)}
  .finsign .el{display:block;margin-top:10px;font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:var(--orange-dark);font-weight:700;font-family:'DM Sans',sans-serif}
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


# ===== 1 · CAPA =====
cover = f'''
  <section class="slide">
    <div class="slide__head">
      <div class="brand"><img src="assets/logo.png" alt="Elarah"></div>
      <div class="head-right"><span class="kicker">Encontro de Mulheres · Elarah</span></div>
    </div>
    <div class="cover">
      <div>
        <span class="eyebrow">✦ Experiência sensorial em grupo</span>
        <h1>Uma pausa para <em>criar, sentir e compartilhar</em></h1>
        <p class="lead">Experiência sensorial para <strong>60 participantes</strong>.</p>
        <div class="rule"></div>
        <div class="chips">
          <span class="chip"><b>31.10</b></span>
          <span class="chip"><b>2 turmas</b> de 30</span>
          <span class="chip">Local a definir</span>
        </div>
      </div>
      <div class="cover-photo">{img("aroma-meninas-jardim.jpg", "Mulheres criando e compartilhando juntas em uma experiência sensorial", "center 45%")}</div>
    </div>
    {foot("Encontro de Mulheres · 31.10")}
  </section>'''

# ===== 2 · A EXPERIÊNCIA =====
experiencia = f'''
  <section class="slide">
{head_simple("A experiência")}
    <span class="eyebrow orange">◆ A experiência</span>
    <h2>Vela <em>Aromática</em></h2>
    <div class="exp">
      <div class="ph">{img("teoriavela.jpg", "Processo de criação de uma vela aromática artesanal", "center 45%")}</div>
      <div>
        <p class="tx">Uma experiência delicada e criativa para <b>desacelerar, despertar os sentidos</b> e criar algo especial com as próprias mãos.</p>
        <p class="tx">Cada participante aprende a produzir sua <b>própria vela aromática artesanal</b>, acompanhando o processo e explorando aromas e possibilidades de personalização. Ao final, <b>leva para casa a peça que produziu</b>.</p>
        <div class="kwpills">
          <span>Criatividade</span><span>Aromas</span><span>Experiência sensorial</span><span>Conexão</span><span class="hl">Uma criação para levar para casa</span>
        </div>
      </div>
    </div>
    {foot("A experiência")}
  </section>'''

# ===== 3 · O QUE ESTÁ INCLUSO =====
incluso = f'''
  <section class="slide">
{head_simple("O que está incluso")}
    <span class="eyebrow orange">◆ O que está incluso</span>
    <h2>Tudo preparado para <em>viver a experiência</em></h2>
    <div class="incstrip">
      <figure>{img("sabonete-grupo-oficina.jpg", "Mulheres reunidas criando juntas", "center 40%")}</figure>
      <figure>{img("vela-aromatica-real.jpg", "Materiais e fragrâncias da experiência", "center 50%")}</figure>
      <figure>{img("bolocaseiro.jpg", "Cafezinho e bolo para acompanhar o encontro", "center 50%")}</figure>
    </div>
    <ul class="inclist2">
      <li><span class="ck">✓</span><b>Todos os materiais</b> para a produção da vela</li>
      <li><span class="ck">✓</span><b>Orientação</b> durante toda a oficina</li>
      <li><span class="ck">✓</span>Seleção de <b>fragrâncias</b></li>
      <li><span class="ck">✓</span><b>Recipiente de 170 ml</b></li>
      <li><span class="ck">✓</span>Materiais e insumos necessários</li>
      <li><span class="ck">✓</span><b>Vela artesanal</b> de cada uma para levar</li>
    </ul>
    <div class="incnote"><span>☕</span> <b>Cafezinho e bolo</b> também fazem parte da experiência.</div>
    {foot("O que está incluso")}
  </section>'''

# ===== 4 · INVESTIMENTO VELA =====
inv_vela = f'''
  <section class="slide">
{head_simple("Investimento")}
    <span class="sugtag">Nossa sugestão</span>
    <h2>Workshop de <em>Vela Aromática</em></h2>
    <p class="lead" style="max-width:62ch">Uma experiência sensorial, criativa e aconchegante para o grupo <strong>criar junto e sair do automático</strong> por algumas horas.</p>
    <div class="invwrap">
      <div class="invmain">
        <div class="tag">Investimento · por pessoa</div>
        <div class="big">R$ 249</div>
        <div class="per">workshop completo</div>
      </div>
      <div class="invside">
        <div class="invtot"><div class="k">Para 60 participantes</div><div class="v">R$ 14.940</div></div>
        <div class="invnote">60 participantes · 2 turmas de 30 · mesma experiência nos dois períodos.</div>
      </div>
    </div>
    {foot("Investimento · Vela Aromática")}
  </section>'''

# ===== 5 · SEGUNDA OPÇÃO · WAX MELTS =====
wax = f'''
  <section class="slide">
{head_simple("Segunda opção")}
    <span class="eyebrow orange">◆ Segunda opção</span>
    <h2>Workshop de <em>Wax Melts</em></h2>
    <div class="waxsplit">
      <div class="ph">{img("velaflor.jpg", "Peças de cera aromática moldadas em diferentes formas", "center 50%")}</div>
      <div>
        <p class="tx">Uma alternativa mais <b>criativa e visual</b>. Wax melts são pequenas <b>peças de cera aromática moldada</b>, criadas em diferentes formatos e usadas para perfumar ambientes.</p>
        <p class="tx">Durante a experiência, as participantes exploram <b>fragrâncias, formatos e composições</b> em uma atividade artesanal e sensorial.</p>
        <ul class="waxinc">
          <li><span class="ck">✓</span>Todos os materiais</li>
          <li><span class="ck">✓</span>Cera</li>
          <li><span class="ck">✓</span>Fragrâncias</li>
          <li><span class="ck">✓</span>Moldes</li>
          <li><span class="ck">✓</span>Formas e cores</li>
          <li><span class="ck">✓</span>Orientação completa</li>
        </ul>
        <div class="waxprice"><div class="pp">R$ 279 <small>/pessoa</small></div><div class="tt">Para 60 participantes<br><b>R$ 16.740</b></div></div>
      </div>
    </div>
    {foot("Segunda opção · Wax Melts")}
  </section>'''

# ===== 6 · ESCOLHA SUA EXPERIÊNCIA =====
escolha = f'''
  <section class="slide">
{head_simple("Escolha sua experiência")}
    <span class="eyebrow orange">◆ Escolha sua experiência</span>
    <h2>Duas formas de <em>criar junto</em></h2>
    <div class="cmp">
      <div class="cmpc hl">
        <div class="cph">{img("vela-grupo-oficina.jpg", "Workshop de vela aromática em grupo", "center 40%")}</div>
        <div class="cbd">
          <div class="nm">Vela Aromática</div>
          <span class="sg">Nossa sugestão</span>
          <div class="pr">R$ 249 <small>/pessoa</small></div>
          <p class="ds">Mais <b>clássica, sensorial e aconchegante</b>. Cada participante cria sua própria vela artesanal para levar para casa. <b>Inclui cafezinho + bolo.</b></p>
          <div class="tot">Para 60 pessoas: <b>R$ 14.940</b></div>
        </div>
      </div>
      <div class="cmpc">
        <div class="cph">{img("velasuculenta.jpg", "Workshop de wax melts, peças moldadas em formas e cores", "center 50%")}</div>
        <div class="cbd">
          <div class="nm">Wax Melts</div>
          <div class="pr">R$ 279 <small>/pessoa</small></div>
          <p class="ds">Mais <b>visual, criativa e artesanal</b>. Cada participante desenvolve pequenas peças aromáticas com moldes, fragrâncias e diferentes composições.</p>
          <div class="tot">Para 60 pessoas: <b>R$ 16.740</b></div>
        </div>
      </div>
    </div>
    {foot("Escolha sua experiência")}
  </section>'''

# ===== 7 · COFFEE BREAK OPCIONAL =====
LISTA_BASE = (
    '<li><span class="ck">✓</span>2 sabores de mini sanduíches</li>'
    '<li><span class="ck">✓</span>{salg}</li>'
    '<li><span class="ck">✓</span>{doce}</li>'
    '<li><span class="ck">✓</span>Fruta ou iogurte</li>'
    '<li><span class="ck">✓</span>1 tipo de suco · Água na Caixa</li>'
    '<li><span class="ck">✓</span>Café</li>'
    '<li><span class="ck">✓</span>Serviço de montagem + utensílios</li>'
)
coffee = f'''
  <section class="slide">
{head_simple("Coffee break opcional")}
    <span class="eyebrow orange">◆ Coffee break opcional · Pão e Talho</span>
    <h2>Para deixar o encontro <em>ainda mais completo</em></h2>
    <p class="lead" style="max-width:88ch">O Workshop de Vela Aromática <strong>já inclui cafezinho e bolo</strong>. Para quem quiser um momento ainda mais completo, preparamos três possibilidades de coffee break — <strong>opcional e contratado à parte</strong>.</p>
    <div class="cbg">
      <div class="cbc">
        <div class="nm">Essencial</div>
        <div class="pr"><b>R$ 90</b> /pessoa<small>R$ 5.400 · 60 participantes</small></div>
        <ul>{LISTA_BASE.format(salg="1 tipo de salgado", doce="1 tipo de doce")}</ul>
        <p class="tx">Uma composição leve e prática para acompanhar o encontro.</p>
      </div>
      <div class="cbc hl">
        <span class="sg">Nossa sugestão</span>
        <div class="nm">Clássico</div>
        <div class="pr"><b>R$ 114</b> /pessoa<small>R$ 6.840 · 60 participantes</small></div>
        <ul>{LISTA_BASE.format(salg="1 tipo de salgado", doce="1 tipo de doce")}</ul>
        <p class="tx">Uma composição completa e equilibrada para acompanhar a experiência.</p>
      </div>
      <div class="cbc">
        <div class="nm">Especial</div>
        <div class="pr"><b>R$ 142</b> /pessoa<small>R$ 8.520 · 60 participantes</small></div>
        <ul>{LISTA_BASE.format(salg="2 tipos de salgados", doce="2 tipos de doces")}</ul>
        <p class="tx">Uma composição mais completa para transformar o coffee break em parte importante do encontro.</p>
      </div>
    </div>
    <div class="cbnote">Sabores e escolhas dentro de cada categoria serão alinhados posteriormente, conforme disponibilidade e preferências do grupo. O coffee break é opcional e não está somado ao valor da experiência.</div>
    {foot("Coffee break opcional")}
  </section>'''

# ===== 8 · COMO FUNCIONA =====
como = f'''
  <section class="slide">
{head_simple("Como funciona")}
    <span class="eyebrow orange">◆ Como funciona</span>
    <h2>Simples do começo <em>ao fim</em></h2>
    <div class="flow">
      <div class="fstep"><div class="fn">1</div><div><h3>Escolhemos a experiência</h3><p>Vela Aromática ou Wax Melts.</p></div></div>
      <div class="fstep"><div class="fn">2</div><div><h3>Alinhamos os detalhes</h3><p>Definimos local, horários, dinâmica e necessidades do grupo.</p></div></div>
      <div class="fstep"><div class="fn">3</div><div><h3>Preparamos tudo</h3><p>Nós organizamos materiais, estrutura e todos os detalhes da experiência.</p></div></div>
      <div class="fstep"><div class="fn">4</div><div><h3>Vivemos o encontro</h3><p>O grupo cria junto e cada participante leva sua criação para casa.</p></div></div>
    </div>
    {foot("Como funciona")}
  </section>'''

# ===== 9 · FECHAMENTO =====
final = f'''
  <section class="slide">
{head_simple("Para fechar")}
    <span class="eyebrow orange">◆ Para fechar</span>
    <h2>Uma pausa no dia para criar com as próprias mãos — e <em>levar essa memória para casa</em></h2>
    <div class="finwrap">
      <div class="ph">{img("pintura-grupo.jpg", "Mulheres sorrindo e criando juntas", "center 35%")}</div>
      <div class="ftx">
        <p class="lead">Acreditamos que os melhores encontros são os que aproximam as pessoas de forma <strong>leve, criativa e natural</strong>. Vamos adorar preparar essa experiência com vocês.</p>
        <div class="finsign">Vocês escolhem a experiência. <em>Nós cuidamos do restante.</em><span class="el">Elarah</span></div>
      </div>
    </div>
    {foot("Para fechar")}
  </section>'''

deck = ('<div class="deck">\n' + cover + experiencia + incluso + inv_vela + wax + escolha + coffee + como + final + '\n\n</div>\n\n')
html = head + deck + tail
out = ROOT + "/proposta-encontro-mulheres.html"
io.open(out, "w", encoding="utf-8").write(html)
for bad in ["fornecedor", "repasse", "comiss", "margem"]:
    assert bad not in deck.lower(), f"PROIBIDO: {bad}"
for val in ["R$ 249", "R$ 14.940", "R$ 279", "R$ 16.740", "R$ 90", "R$ 5.400", "R$ 114", "R$ 6.840", "R$ 142", "R$ 8.520"]:
    assert val in deck, f"FALTA VALOR: {val}"
print("wrote", out, "| slides:", html.count('<section class="slide">'))
