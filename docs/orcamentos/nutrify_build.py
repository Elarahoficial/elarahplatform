"""Transform the Pintura em Taça proposal:
- accent burnt-orange -> festive coral-pink (#A75D3A)
- lighten the dark cover + banners (happy/bright)
- remove '20 / vinte anos', personalise to Isa ('Parabéns, Isa! ... venha comemorar')
Phase A here = accent recolor + logo recolor. Later phases add lightening + text."""
import fitz, io, sys
from PIL import Image

SRC = "/root/.claude/uploads/9abf7e9a-5852-5ed9-badc-3da0f14e2577/d2b59d51-Pintura_em_Taca_Elarah_1.pdf"
OUT = sys.argv[1] if len(sys.argv) > 1 else "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/Nutrify_final.pdf"
CORAL = ".655 .365 .227"   # #A75D3A

d = fitz.open(SRC)

# ---- accent recolor via content-stream string replacement (all pages) ----
ACCENT_SRCS = [".949 .4078 .2353", "1 .4784 .349"]
for pi in range(d.page_count):
    for x in d[pi].get_contents():
        s = d.xref_stream(x).decode("latin-1")
        orig = s
        for src in ACCENT_SRCS:
            s = s.replace(src, CORAL)
        if s != orig:
            d.update_stream(x, s.encode("latin-1"))

# ---- recolor the Elarah logo (orange) -> coral-pink, using its smask as alpha ----
logo_xref = [i[0] for i in d[0].get_images(full=True)
             if d.extract_image(i[0])["width"] == 727][0]
sm = fitz.Pixmap(d, d.extract_image(logo_xref)["smask"])
alpha = Image.frombytes("L", (sm.width, sm.height), sm.samples).resize((727, 227))
coral = Image.new("RGBA", (727, 227), (168, 93, 59, 255)); coral.putalpha(alpha)
bio = io.BytesIO(); coral.save(bio, format="PNG")
d[0].replace_image(logo_xref, stream=bio.getvalue())

# ---- lighten the dark COVER (page 1): bg -> soft blush, light text -> dark ----
DARK = ".247 .184 .173"          # #3F2F2C dark text
def swap(pi, pairs):
    for x in d[pi].get_contents():
        s = d.xref_stream(x).decode("latin-1"); o = s
        for a, b in pairs:
            s = s.replace(a, b)
        if s != o:
            d.update_stream(x, s.encode("latin-1"))
swap(0, [
    ("/Pattern CS/Pattern cs/P3 SCN/P3 scn", ".98 .965 .94 rg"),  # dark cover bg -> soft blush
    (".8549 .8078 .749 rg", DARK+" rg"), (".8549 .8078 .749 RG", DARK+" RG"),   # #DACEBF
    (".7882 .7373 .6745 rg", DARK+" rg"), (".7882 .7373 .6745 RG", DARK+" RG"), # #C9BCAC
    (".9843 .9647 .9373 rg", DARK+" rg"), (".9843 .9647 .9373 RG", DARK+" RG"), # #FBF6EF (cover text)
])
# ---- banners on p2 & p4: near-black -> vibrant festive coral (cream text stays readable) ----
BANNER = ".047 .427 .325 rg"    # #D14E72 rich rose
swap(1, [("/Pattern CS/Pattern cs/P32 SCN/P32 scn", BANNER)])   # p2 quote banner
swap(2, [("/Pattern CS/Pattern cs/P50 SCN/P50 scn", BANNER)])   # p3 investment card
swap(3, [("/Pattern CS/Pattern cs/P61 SCN/P61 scn", BANNER)])   # p4 contact banner

# ================= TEXT CHANGES (remove '20/vinte anos', personalise to Isa) =================
LF = "/usr/share/fonts/truetype/liberation/"
FB  = fitz.Font(fontfile=LF+"LiberationSerif-Bold.ttf")
FI  = fitz.Font(fontfile=LF+"LiberationSerif-Italic.ttf")
FBI = fitz.Font(fontfile=LF+"LiberationSerif-BoldItalic.ttf")
FS  = fitz.Font(fontfile=LF+"LiberationSans-Regular.ttf")
CORAL_RGB = (0.655, 0.365, 0.227)
DARKt = (0.247, 0.184, 0.173)
CREAM = (0.984, 0.965, 0.937)
GOLD  = (0.902, 0.784, 0.4745)
MUTED = (0.549, 0.494, 0.455)

def rm(page, rects):
    for r in rects:
        page.add_redact_annot(fitz.Rect(r))
    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE,
                          graphics=fitz.PDF_REDACT_LINE_ART_NONE,
                          text=fitz.PDF_REDACT_TEXT_REMOVE)
def put(page, text, font, size, color, x, y):
    tw = fitz.TextWriter(page.rect); tw.append((x, y), text, font=font, fontsize=size)
    tw.write_text(page, color=color)
def put_right(page, text, font, size, color, xr, y):
    put(page, text, font, size, color, xr - font.text_length(text, size), y)
def put_spaced(page, text, x, y, size, color, font, track=1.9):
    tw = fitz.TextWriter(page.rect); cx = x
    for ch in text:
        tw.append((cx, y), ch, font=font, fontsize=size); cx += font.text_length(ch, size)+track
    tw.write_text(page, color=color)
def crop_ratio(path, ratio, vbias=0.5):
    im = Image.open(path).convert("RGB"); W, H = im.size
    if W/H > ratio:
        cw = round(H*ratio); l = (W-cw)//2; im = im.crop((l, 0, l+cw, H))
    else:
        ch = round(W/ratio); t = round((H-ch)*vbias); im = im.crop((0, t, W, t+ch))
    return im
FSB = fitz.Font(fontfile=LF+"LiberationSans-Bold.ttf")

# ---- PAGE 1: replace the '20 / vinte anos' headline + reword body ----
p1 = d[0]
rm(p1, [(64, 286, 252, 410),      # the big '20' (below the coral eyebrow at y274-284)
        (70, 401, 252, 456),      # 'vinte anos — bora celebrar!'
        (70, 476, 305, 592)])     # body paragraph
# wipe the whole left column so nothing from the template lingers, then rebuild it TIGHT
p1.draw_rect(fitz.Rect(58, 292, 313, 606), color=None, fill=(0.976, 0.965, 0.937))
put(p1, "Uma pausa", FB, 37, CORAL_RGB, 70, 342)      # big display headline fills the void the '20' left
put(p1, "que nutre", FB, 37, CORAL_RGB, 70, 385)
put(p1, "vem criar com o time", FI, 20, DARKt, 70.9, 420)
p1.draw_rect(fitz.Rect(70.9, 441, 116, 443.2), color=None, fill=CORAL_RGB)   # short accent rule
BODY = ('<p>O Dia do Nutricionista pede uma pausa à altura: '
        '<b style="color:#A75D3A">leve, criativa e memorável</b>. '
        'A pintura em xícara, taça ou vela aromática é o ponto de partida — e a partir daí a Elarah '
        'transforma o dia da equipe numa experiência única. '
        '<b style="color:#A75D3A">Vocês escolhem o clima, a gente faz acontecer.</b></p>')
p1.insert_htmlbox(fitz.Rect(70.9, 458, 302, 588), BODY,
                  css="p{margin:0;font-family:sans-serif;font-size:10.5px;line-height:1.5;color:#3F2F2C}")
# reword the cover footer (remove '10–15 CONVIDADAS' and 'ORÇAMENTO PARA 12')
rm(p1, [(66, 752, 548, 771)])
f1 = "ELARAH × NUTRIFY  ·  XÍCARA · TAÇA · VELA  ·  "
put_spaced(p1, f1, 70.9, 766.5, 8.25, (0.247, 0.184, 0.173), FS, track=2.4)
fx = 70.9 + sum(FS.text_length(c, 8.25)+2.4 for c in f1)
put_spaced(p1, "POR PESSOA", fx, 766.5, 8.25, (0.655, 0.365, 0.227), FSB, track=2.4)

# ---- PAGE 2 footer ----
p2 = d[1]
rm(p2, [(458, 793, 543, 803)])
put_right(p2, "Dia do Nutricionista · Nutrify", FS, 7.9, MUTED, 541.4, 801.0)

# ================= PAGE 3: 3-tier pricing (189/289/389 por pessoa) + venues =================
A_DIR = "/home/user/elarahplatform/assets/"
HEAD = "#3F2F2C"; MUTc = "#8C7E74"; BODYc = "#4A3F3A"; CORALc = "#A75D3A"; GOLDc = "#B8912E"; CREAMc = "#FBF6EF"
BLUSH = (0.98, 0.965, 0.94)

p3 = d[2]
# wipe the old body: 'O que está incluso' + list + single price card + '10 a 15 / 12' note
rm(p3, [(40, 240, 560, 456)])
p3.draw_rect(fitz.Rect(276, 243, 554, 445), color=None, fill=BLUSH)   # cover old rose price card

TIERS = [
    dict(name="Básico", tag="A experiência, em sua essência.", price="189", more=None,
         bullets=["Pintura em xícara, taça ou vela aromática", "Todos os materiais inclusos",
                  "Condução por facilitadora", "Cada pessoa leva a sua peça autoral"], kind="plain"),
    dict(name="Premium", tag="Experiência + celebração.", price="289",
         badge="O MAIS QUERIDINHO", more="TUDO DO BÁSICO, E MAIS",
         bullets=["Coffee break de boas-vindas", "Registro fotográfico profissional",
                  "Avental personalizado"], kind="highlight"),
    dict(name="Signature", tag="A celebração completa, sem preocupação.", price="429",
         badge="TUDO RESOLVIDO", more="TUDO DO PREMIUM, E MAIS",
         bullets=["Coffee break reforçado", "Docinhos & mimos",
                  "Personalização com o logo da Nutrify"], kind="dark"),
]
CX = [54, 220.5, 387]; CW = 154; CY0, CY1 = 448, 636
put_spaced(p3, "✦ INVESTIMENTO", 54, 424, 9, CORAL_RGB, FSB)
for i, t in enumerate(TIERS):
    card = fitz.Rect(CX[i], CY0, CX[i]+CW, CY1)
    if t["kind"] == "plain":
        p3.draw_rect(card, color=(0.906, 0.863, 0.796), fill=(1, 1, 1), width=1, radius=0.055)
        head, mut, body, acc, cream_txt = HEAD, MUTc, BODYc, CORALc, False
    elif t["kind"] == "highlight":
        p3.draw_rect(card, color=(0.655, 0.365, 0.227), fill=(1, 1, 1), width=1.6, radius=0.055)
        head, mut, body, acc, cream_txt = HEAD, MUTc, BODYc, CORALc, False
    else:
        p3.draw_rect(card, color=None, fill=(0.047, 0.427, 0.325), radius=0.055)
        head, mut, body, acc, cream_txt = CREAMc, "#F0D9DF", "#FBEDF0", GOLDc, True
    # badge pill (Premium / Signature)
    if t.get("badge"):
        bw = FSB.text_length(t["badge"], 6.3) + 0.8*(len(t["badge"])-1) + 17
        bx = CX[i] + (CW-bw)/2
        bcol = (0.655, 0.365, 0.227) if t["kind"] == "highlight" else (0.72, 0.55, 0.22)
        p3.draw_rect(fitz.Rect(bx, CY0-9, bx+bw, CY0+9), color=None, fill=bcol, radius=0.5)
        put_spaced(p3, t["badge"], bx+8.5, CY0+2.5, 6.3, (1, 1, 1), FSB, track=0.8)
    # content via html (handles wrapping + bullets)
    more_html = f'<div class="more">{t["more"]}</div>' if t.get("more") else ''
    lis = "".join(f'<div class="li"><span class="mk">◆</span>&nbsp;{b}</div>' for b in t["bullets"])
    html = (f'<div class="nm">{t["name"]}</div><div class="tg">{t["tag"]}</div>'
            f'<div class="pr">R$&nbsp;{t["price"]}</div><div class="pp">POR PESSOA</div>'
            f'{more_html}{lis}')
    css = (f'.nm{{font-family:serif;font-size:15px;font-weight:bold;color:{head}}}'
           f'.tg{{font-size:7px;color:{mut};margin-top:3px}}'
           f'.pr{{font-family:serif;font-size:22px;font-weight:bold;color:{head};margin-top:10px}}'
           f'.pp{{font-size:6.5px;color:{mut};letter-spacing:1px}}'
           f'.more{{font-size:6.5px;font-weight:bold;color:{acc};margin-top:9px}}'
           f'.li{{font-size:7.6px;color:{body};margin-top:5px;line-height:1.25}}'
           f'.mk{{color:{acc};font-size:6px}}')
    p3.insert_htmlbox(fitz.Rect(card.x0+11, card.y0+16, card.x1-10, card.y1-8), html, css=css)

# small per-person note (no more '10 a 15 / 12')
put(p3, "Valores por pessoa · Coffee break incluso nos planos Premium e Signature.",
    FS, 7.6, (0.549, 0.494, 0.455), 54, 654)

# ---- venues 'Onde acontece' (Aretha & BETC) below the pricing ----
def venue(page, path, rect, name, vbias=0.5):
    r = fitz.Rect(rect); im = crop_ratio(path, r.width/r.height, vbias)
    b = io.BytesIO(); im.save(b, format="JPEG", quality=90)
    page.insert_image(r, stream=b.getvalue())
    put(page, name, FSB, 10.5, DARKt, r.x0, r.y1+14)

# ---- venues 'Onde acontece' (Aretha & BETC) below the pricing ----
put_spaced(p3, "✦ ONDE ACONTECE", 54, 258, 9, CORAL_RGB, FSB)
put(p3, "Escolha o seu ", FB, 19, (0.118, 0.086, 0.098), 54, 286)
put(p3, "local", FI, 19, CORAL_RGB, 54+FB.text_length("Escolha o seu ", 19), 286)
venue(p3, A_DIR+"arethasoulkitchen.jpg", (54, 296, 293, 386), "Aretha Soul Kitchen")
venue(p3, A_DIR+"betchavas.jpg",         (301, 296, 541, 386), "BETC Havas Café", vbias=0.42)

# ---- personalization callout (what 'personalização' means) ----
_pz = crop_ratio(A_DIR+"personalizaçãonutrify.jpg", 1.0, vbias=0.5)
_pb = io.BytesIO(); _pz.save(_pb, format="JPEG", quality=92)
p3.insert_image(fitz.Rect(54, 660, 150, 756), stream=_pb.getvalue())
put_spaced(p3, "✦ PERSONALIZAÇÃO", 166, 684, 8.5, CORAL_RGB, FSB)
put(p3, "Com a cara de ", FB, 15, (0.118, 0.086, 0.098), 166, 706)
put(p3, "vocês", FI, 15, CORAL_RGB, 166+FB.text_length("Com a cara de ", 15), 706)
p3.insert_textbox(fitz.Rect(166, 716, 545, 752),
    "Cada pessoa leva um mimo personalizado — a peça autoral e os itens com a "
    "inicial ou o logo da Nutrify.", fontsize=8.7, fontname="lib",
    fontfile=LF+"LiberationSans-Regular.ttf", color=(0.431, 0.388, 0.357), lineheight=1.4)

# ---- PAGE 4 banner headline + footer + disclaimer (remove '12 / 10 a 15') ----
p4 = d[3]
rm(p4, [(76, 534, 487, 559), (434, 793, 543, 803), (50, 655, 745, 686)])
p4.insert_textbox(fitz.Rect(53.8, 655, 538, 690),
    "Valores por pessoa. Bebidas, brunch, bolo, mesa de parabéns e itens "
    "personalizados conforme o plano escolhido. Proposta válida mediante confirmação de data.",
    fontsize=7.9, fontname="lib", fontfile=LF+"LiberationSans-Regular.ttf",
    color=(0.549, 0.494, 0.455), lineheight=1.35)
x = 77.8
put(p4, "Um dia que o time vai ", FB, 20.2, CREAM, x, 553.5)
x += FB.text_length("Um dia que o time vai ", 20.2)
put(p4, "lembrar para sempre", FBI, 20.2, GOLD, x, 553.5)
put_right(p4, "Dia do Nutricionista · Nutrify · 2026", FS, 7.9, MUTED, 541.4, 801.0)

# ================= taça -> taça in the source paragraphs (redact + reinsert) =================
def retext(page, rect, text, size, color=(0.431, 0.388, 0.357), width_rect=None):
    page.add_redact_annot(fitz.Rect(rect))
    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE,
                          graphics=fitz.PDF_REDACT_LINE_ART_NONE,
                          text=fitz.PDF_REDACT_TEXT_REMOVE)
    page.insert_textbox(fitz.Rect(width_rect or rect), text, fontsize=size,
                        fontname="lib", fontfile=LF+"LiberationSans-Regular.ttf",
                        color=color, lineheight=1.42)
# p2 heading 'Taça' -> 'Taça'
d[1].add_redact_annot(fitz.Rect(184, 130, 244, 165))
d[1].apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE, graphics=fitz.PDF_REDACT_LINE_ART_NONE,
                      text=fitz.PDF_REDACT_TEXT_REMOVE)
put(d[1], "Xícara, Taça ou Vela", FBI, 27, CORAL_RGB, 187.9, 156.2)
# p2 intro
retext(d[1], (52, 171, 505, 250),
       "Esqueça a confraternização de sempre! Aqui cada pessoa do time vira artista por um dia: pinta, "
       "personaliza e leva para casa a própria peça autoral. Uma experiência criativa, relaxante "
       "e cheia de estilo — perfeita pra integrar a equipe (e desacelerar na correria). "
       "O ateliê vai até você, com tudo pronto.", 10.5, color=(0.431, 0.388, 0.357),
       width_rect=(53.8, 173, 502, 268))
# p2: remove the 'I / II / III' block (Criar/Celebrar/Levar + rule/dividers) ...
d[1].add_redact_annot(fitz.Rect(40, 258, 558, 402))
d[1].apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE,
                      graphics=fitz.PDF_REDACT_LINE_ART_NONE,
                      text=fitz.PDF_REDACT_TEXT_REMOVE)
d[1].draw_rect(fitz.Rect(40, 256, 558, 404), color=None, fill=(0.984, 0.965, 0.937))
# ... and put a clean corporate 'Como funciona' 3-step there instead
put_spaced(d[1], "✦ COMO FUNCIONA", 53.8, 292, 9, CORAL_RGB, FSB)
put(d[1], "Simples ", FB, 18, (0.118, 0.086, 0.098), 53.8, 316)
put(d[1], "do começo ao fim", FI, 18, CORAL_RGB, 53.8+FB.text_length("Simples ", 18), 316)
STEPS = [("01", "Escolher", "Cada um escolhe a peça: xícara, taça ou vela aromática."),
         ("02", "Criar", "Pinta, personaliza e relaxa — com tudo pronto."),
         ("03", "Levar", "Leva para casa a própria peça autoral.")]
colx = [53.8, 230, 406]
for (num, ti, desc), x in zip(STEPS, colx):
    put(d[1], num, FB, 21, CORAL_RGB, x, 351)
    put(d[1], ti, FB, 12.5, (0.118, 0.086, 0.098), x+30, 351)
    d[1].insert_textbox(fitz.Rect(x, 360, x+152, 400), desc, fontsize=8.6, fontname="lib",
        fontfile=LF+"LiberationSans-Regular.ttf", color=(0.431, 0.388, 0.357), lineheight=1.35)
# p3 intro
retext(d[2], (52, 171, 505, 230),
       "A experiência de pintura (xícara, taça ou vela aromática) com toda a estrutura, os mimos e o "
       "registro profissional do dia. É só reunir o time — a Elarah leva tudo até vocês "
       "e cuida de cada detalhe.", 10.5, width_rect=(53.8, 173, 500, 232))
# p4 intro
retext(d[3], (52, 171, 482, 214),
       "Personalizamos cada detalhe com vocês — data, paleta de cores das peças e lista de "
       "participantes. A experiência vai até o espaço parceiro, com toda a energia da Elarah.",
       10.5, width_rect=(53.8, 173, 478, 232))

# p2: replace the busy left photo with the group-painting workshop shot
_lft = crop_ratio(A_DIR+"atelieleroy-2.jpg", 159.7/176.3, vbias=0.5)
_lb2 = io.BytesIO(); _lft.save(_lb2, format="JPEG", quality=90)
d[1].insert_image(fitz.Rect(51.8, 436.5, 211.5, 612.8), stream=_lb2.getvalue())
# p2: replace the middle 'vibe' photo with a painted-glass (pintura em taça) photo
_mid = crop_ratio(A_DIR+"pinturatacanova.jpg", 175.5/176.3, vbias=0.5)
_b = io.BytesIO(); _mid.save(_b, format="JPEG", quality=90)
d[1].insert_image(fitz.Rect(210, 436.5, 385.5, 612.8), stream=_b.getvalue())

# ================= CORPORATE polish: eyebrows, banner, headings + Nutrify logo =================
FSER = fitz.Font(fontfile=LF+"LiberationSerif-Regular.ttf")
NEARBLK = (0.118, 0.086, 0.098)

# P1 eyebrow: 'UMA CELEBRAÇÃO ÚNICA' -> 'DIA DO NUTRICIONISTA'
rm(p1, [(69, 271, 300, 287)])
put_spaced(p1, "✦ DIA DO NUTRICIONISTA", 70.9, 300, 8.6, CORAL_RGB, FSB, track=2.4)

# P1 cover co-brand: Nutrify logo in the upper-right whitespace
_lg = Image.open(A_DIR+"logonutrify.png").convert("RGBA").crop((9, 0, 1733, 1659))
_lb = io.BytesIO(); _lg.save(_lb, format="PNG")
_lgt = fitz.Rect(422, 120, 524, 212)           # tucked right under the 'ELARAH · EXPERIÊNCIAS' header
_lbl = "PREPARADO PARA"
_lw = sum(FSB.text_length(c, 7.6)+2.2 for c in _lbl) - 2.2
put_spaced(p1, _lbl, (_lgt.x0+_lgt.x1)/2 - _lw/2, 112, 7.6, MUTED, FSB, track=2.2)
p1.insert_image(_lgt, stream=_lb.getvalue(), keep_proportion=True)

# P2 eyebrow: 'A ESTRELA DA FESTA' -> 'A ESTRELA DO ENCONTRO'
rm(d[1], [(52, 113, 235, 128)])
put_spaced(d[1], "✦ A ESTRELA DO ENCONTRO", 53.8, 124.2, 8.6, CORAL_RGB, FSB, track=2.4)

# P2 banner text -> corporate
rm(d[1], [(98, 640, 500, 684)])
put(d[1], "Não é só um evento — é arte, pausa e conexão.", FI, 12.8, CREAM, 100.7, 658.5)
put(d[1], "Um dia que o time inteiro vai lembrar.", FB, 12.8, GOLD, 100.7, 678.0)

# P4 heading: 'Bora marcar essa festa?' -> 'data?'
rm(d[3], [(53, 129, 327, 165)])
put(d[3], "Bora marcar essa ", FB, 27, NEARBLK, 53.8, 157.5)
put(d[3], "data?", FBI, 27, CORAL_RGB, 53.8+FB.text_length("Bora marcar essa ", 27), 157.5)

# P4 INSPIRAÇÃO line: 'Como a sua festa pode ser' -> 'Como o seu dia pode ser'
rm(d[3], [(53, 229, 300, 249)])
put_spaced(d[3], "✦ INSPIRAÇÃO", 53.8, 244.5, 8.2, CORAL_RGB, FSB, track=1.5)
put(d[3], "Como o seu dia pode ser", FSER, 14.2, NEARBLK, 149.4, 244.5)

# p4: replace the right 'inspiração' photo with a joyful group-painting shot
_ins = crop_ratio(A_DIR+"nutrify1.jpg", 240/224, vbias=0.5)
_ib = io.BytesIO(); _ins.save(_ib, format="JPEG", quality=90)
d[3].insert_image(fitz.Rect(302, 257, 542, 481), stream=_ib.getvalue())

d.save(OUT, garbage=4, deflate=True)
print("saved", OUT)
r2 = fitz.open(OUT)
for i in range(r2.page_count):
    r2[i].get_pixmap(dpi=100).save(f"/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/tz_p{i+1}.png")
print("rendered")
