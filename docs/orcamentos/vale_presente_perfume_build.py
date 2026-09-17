# Vale-presente (gift card) personalizado · Criando seu Perfume Natural · 03/10 14h-15h30
# Um card A4 elegante por presenteado (nome personalizado).
S = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad"
ROOT = "/home/user/elarahplatform"

head = open(S + "/head.html", encoding="utf-8").read()  # traz as fontes embutidas

giftcss = '''
<style>
  body{padding:0 !important;background:#fff;margin:0}
  .gc{position:relative;width:100%;min-height:297mm;box-sizing:border-box;background:#F5F0E6;
      padding:19mm 17mm;page-break-after:always;display:flex;flex-direction:column;align-items:center;text-align:center;color:#2E3A2E}
  .gc:last-child{page-break-after:auto}
  .gc::before{content:"";position:absolute;inset:8mm;border:1.4px solid #B08D4C;pointer-events:none}
  .gc::after{content:"";position:absolute;inset:9.4mm;border:.5px solid rgba(176,141,76,.55);pointer-events:none}
  .gc-logo{height:24px;margin-bottom:9px;opacity:.92}
  .gc-eyebrow{font-size:12px;letter-spacing:.34em;text-transform:uppercase;color:#B08D4C;font-weight:700;margin-bottom:15px}
  .gc-photo{width:100%;height:84mm;border-radius:8px;overflow:hidden;box-shadow:0 20px 44px -26px rgba(0,0,0,.5);margin-bottom:19px;border:1px solid rgba(46,58,46,.14)}
  .gc-photo img{width:100%;height:100%;object-fit:cover;display:block}
  .gc-title{font-family:'DM Serif Display',serif;font-weight:400;font-size:37px;line-height:1.06;color:#2E3A2E;margin-bottom:9px}
  .gc-title em{font-style:italic;color:#8E6E39}
  .gc-desc{font-size:13px;color:#7C7568;line-height:1.55;max-width:108mm;margin:0 auto 17px}
  .gc-rule{width:58px;height:2px;background:#B08D4C;margin:0 auto 17px}
  .gc-para{font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#9A9184;font-weight:700;margin-bottom:6px}
  .gc-name{font-family:'DM Serif Display',serif;font-size:33px;color:#2E3A2E;line-height:1.12;margin-bottom:13px}
  .gc-when{display:inline-block;background:#2E3A2E;color:#fff;border-radius:999px;padding:9px 22px;font-size:13px;font-weight:600;margin-bottom:10px}
  .gc-where{font-size:12px;color:#7C7568;font-weight:600;margin-bottom:18px}
  .gc-msg{font-size:12.5px;color:#7C7568;line-height:1.55;max-width:100mm;margin:0 auto}
  .gc-foot{margin-top:auto;font-size:10.5px;color:#8A8276;line-height:1.7;padding-top:16px}
  .gc-foot b{color:#2E3A2E;font-weight:700}
  .gc-foot span{display:block;font-size:9.5px;opacity:.85;margin-top:3px}
</style>'''


def card(nome):
    return f'''
  <section class="gc">
    <img class="gc-logo" src="assets/logo.png" alt="Elarah">
    <div class="gc-eyebrow">Vale-Presente</div>
    <div class="gc-photo"><img src="assets/perfumaria-oficina.jpg" alt="Experiência de perfumaria natural" style="object-position:center 45%"></div>
    <h1 class="gc-title">Criando seu <em>Perfume Natural</em></h1>
    <p class="gc-desc">Uma experiência sensorial pra criar, do zero, a sua própria fragrância natural — escolhendo as notas que mais combinam com você e levando o perfume pra casa. 🤍</p>
    <div class="gc-rule"></div>
    <div class="gc-para">Para</div>
    <div class="gc-name">{nome}</div>
    <div class="gc-when">03 de outubro de 2026 · 14h00 às 15h30</div>
    <div class="gc-where">📍 Rua Joel Jorge de Melo, 75 · Vila Mariana · São Paulo</div>
    <p class="gc-msg">Um presente escolhido com carinho pra você viver uma tarde de aromas, calma e criatividade. Aproveite cada gotinha. 🌿</p>
    <div class="gc-foot">
      <b>Elarah</b> · Experiências criativas &nbsp;·&nbsp; elarah.com.br &nbsp;·&nbsp; @elarah
      <span>Apresente este vale-presente no dia da experiência. Válido para a data e horário acima.</span>
    </div>
  </section>'''


nomes = ["Débora Kimura", "Fernanda Leime"]
html = head + giftcss + "\n".join(card(n) for n in nomes) + "\n</body></html>"
out = ROOT + "/vale-presente-perfume.html"
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, "| cards:", html.count('<section class="gc">'))
