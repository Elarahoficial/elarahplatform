# Convite Laura Mercier x Elarah · Experiencia Artistica (Oficina de Colagem) · uma das 15 selecionadas
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"
head = open(S + "/head.html", encoding="utf-8").read()  # fontes embutidas

css = '''
<style>
  body{padding:0 !important;margin:0;background:#fff}
  .invite{position:relative;width:100%;min-height:297mm;box-sizing:border-box;background:#ECE5DA;overflow:hidden;color:#2A2622}
  .art{position:absolute;top:0;right:0;height:100%;width:45%;z-index:1}
  .art img{width:100%;height:100%;object-fit:cover;object-position:left center;display:block}
  .art .fade{position:absolute;top:0;left:0;bottom:0;width:42%;background:linear-gradient(to right,#ECE5DA 8%,rgba(236,229,218,.5) 55%,rgba(236,229,218,0))}
  .art .fadetop{position:absolute;top:0;left:0;right:0;height:16%;background:linear-gradient(to bottom,#ECE5DA,rgba(236,229,218,0))}
  .art .fadebot{position:absolute;bottom:0;left:0;right:0;height:12%;background:linear-gradient(to top,#ECE5DA,rgba(236,229,218,0))}
  .content{position:relative;z-index:2;padding:20mm 18mm;max-width:63%;display:flex;flex-direction:column;min-height:297mm;box-sizing:border-box}
  .brands{display:flex;align-items:center;gap:16px;margin-bottom:34px}
  .lm{line-height:1}
  .lm .lmn{font-weight:800;font-size:23px;letter-spacing:.11em;color:#1E1B18}
  .lm .lms{display:block;font-size:8px;letter-spacing:.34em;color:#6E645A;margin-top:5px;font-weight:600}
  .brands .x{font-family:'DM Serif Display',serif;font-size:24px;color:#B06A44;line-height:1}
  .brands .elogo{height:30px;width:auto}
  .tagline{font-family:'DM Serif Display',serif;font-style:italic;font-size:22px;color:#8A6A55;margin-bottom:30px}
  .eyebrow{font-size:10.5px;letter-spacing:.26em;text-transform:uppercase;color:#6E645A;line-height:1.9;font-weight:600;margin-bottom:8px}
  .eyebrow b{color:#B06A44}
  h1.title{font-family:'DM Serif Display',serif;font-weight:400;font-size:58px;line-height:.98;color:#1E1B18;letter-spacing:.01em;margin:2px 0 8px}
  .sub{font-size:14px;letter-spacing:.24em;text-transform:uppercase;color:#3A342E;font-weight:600}
  .selbadge{align-self:flex-start;margin-top:24px;background:#B06A44;color:#FBF3EA;border-radius:999px;padding:11px 22px;font-size:12.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;box-shadow:0 12px 28px -16px rgba(176,106,68,.7)}
  .selbadge b{font-family:'DM Serif Display',serif;font-weight:400;font-size:15px;letter-spacing:.06em;text-transform:none}
  .details{display:flex;align-items:stretch;gap:0;margin-top:30px}
  .details .col{padding:0 20px;border-left:1px solid #CDB9A7}
  .details .col:first-child{padding-left:0;border-left:none}
  .details .ic{font-size:15px;margin-bottom:7px;color:#B06A44}
  .details .big{font-size:15px;font-weight:700;color:#1E1B18;letter-spacing:.02em}
  .details .small{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#6E645A;font-weight:600;margin-top:3px;line-height:1.5}
  .note{margin-top:26px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;line-height:2;color:#6E645A;font-weight:500;max-width:88%}
  .rulesm{width:44px;height:1px;background:#B06A44;margin:22px 0 0}
  .foot{margin-top:auto;padding-top:22px}
  .foot .tags{font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#3A342E;font-weight:600}
  .foot .by{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#8A6A55;margin-top:8px;font-weight:600}
  .foot .by b{color:#B06A44}
</style>'''

body = '''
<div class="invite">
  <div class="art">
    <img src="assets/lm-face.jpg" alt="Ilustração artística de um rosto">
    <div class="fade"></div><div class="fadetop"></div><div class="fadebot"></div>
  </div>
  <div class="content">
    <div class="brands">
      <div class="lm"><span class="lmn">LAURA MERCIER</span><span class="lms">Paris · New York</span></div>
      <span class="x">&times;</span>
      <img class="elogo" src="assets/logo.png" alt="Elarah">
    </div>
    <div class="tagline">Beleza também é arte.</div>
    <div class="eyebrow"><b>Laura Mercier</b> &amp; <b>Elarah</b> convidam você<br>para viver uma</div>
    <h1 class="title">Experiência<br>Artística</h1>
    <div class="sub">Oficina de Colagem</div>
    <div class="selbadge">✦ Você é uma das <b>15 selecionadas</b> ✦</div>
    <div class="details">
      <div class="col"><div class="ic">📅</div><div class="big">20/09/2026</div><div class="small">Domingo</div></div>
      <div class="col"><div class="ic">🕘</div><div class="big">09h</div><div class="small">Manhã</div></div>
      <div class="col"><div class="ic">📍</div><div class="big">Sephora</div><div class="small">Shopping Iguatemi<br>Faria Lima</div></div>
    </div>
    <div class="rulesm"></div>
    <p class="note">Explore sua criatividade e descubra novas formas de se expressar através da arte e da beleza.</p>
    <div class="foot">
      <div class="tags">Beleza &nbsp;|&nbsp; Arte &nbsp;|&nbsp; Expressão &nbsp;|&nbsp; Você</div>
      <div class="by">Uma experiência <b>Laura Mercier × Elarah</b> &nbsp;·&nbsp; @elarah</div>
    </div>
  </div>
</div>
</body></html>'''

html = head + css + body
out = ROOT + "/convite-laura-mercier-elarah.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out)
