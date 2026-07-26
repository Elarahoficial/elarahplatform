"""Transform the Pintura em Taça proposal:
- accent burnt-orange -> festive coral-pink (#A75D3A)
- lighten the dark cover + banners (happy/bright)
- remove '20 / vinte anos', personalise to Isa ('Parabéns, Isa! ... venha comemorar')
Phase A here = accent recolor + logo recolor. Later phases add lightening + text."""
import fitz, io, sys
from PIL import Image, ImageDraw

SRC = "/root/.claude/uploads/9abf7e9a-5852-5ed9-badc-3da0f14e2577/d2b59d51-Pintura_em_Taca_Elarah_1.pdf"
OUT = sys.argv[1] if len(sys.argv) > 1 else "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/AMAI_Corp_final.pdf"
CORAL = "1 .3686 .5412"   # #FF5E8A festive coral-pink

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
coral = Image.new("RGBA", (727, 227), (255, 94, 138, 255)); coral.putalpha(alpha)
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
    ("/Pattern CS/Pattern cs/P3 SCN/P3 scn", ".988 .945 .95 rg"),  # dark cover bg -> soft blush
    (".8549 .8078 .749 rg", DARK+" rg"), (".8549 .8078 .749 RG", DARK+" RG"),   # #DACEBF
    (".7882 .7373 .6745 rg", DARK+" rg"), (".7882 .7373 .6745 RG", DARK+" RG"), # #C9BCAC
    (".9843 .9647 .9373 rg", DARK+" rg"), (".9843 .9647 .9373 RG", DARK+" RG"), # #FBF6EF (cover text)
])
# ---- banners on p2 & p4: near-black -> vibrant festive coral (cream text stays readable) ----
BANNER = ".82 .306 .447 rg"    # #D14E72 rich rose
swap(1, [("/Pattern CS/Pattern cs/P32 SCN/P32 scn", BANNER)])   # p2 quote banner
swap(2, [("/Pattern CS/Pattern cs/P50 SCN/P50 scn", BANNER)])   # p3 investment card
swap(3, [("/Pattern CS/Pattern cs/P61 SCN/P61 scn", BANNER)])   # p4 contact banner

# ================= TEXT CHANGES (remove '20/vinte anos', personalise to Isa) =================
LF = "/usr/share/fonts/truetype/liberation/"
FB  = fitz.Font(fontfile=LF+"LiberationSerif-Bold.ttf")
FI  = fitz.Font(fontfile=LF+"LiberationSerif-Italic.ttf")
FBI = fitz.Font(fontfile=LF+"LiberationSerif-BoldItalic.ttf")
FS  = fitz.Font(fontfile=LF+"LiberationSans-Regular.ttf")
CORAL_RGB = (1, 0.3686, 0.5412)
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
p1.draw_rect(fitz.Rect(58, 292, 313, 606), color=None, fill=(0.988, 0.945, 0.95))
put(p1, "Uma experiência", FB, 32, CORAL_RGB, 70, 342)      # neutral hero
put(p1, "inesquecível", FB, 32, CORAL_RGB, 70, 383)
put(p1, "criar juntas, no verde", FI, 20, DARKt, 70.9, 418)
p1.draw_rect(fitz.Rect(70.9, 439, 116, 441.2), color=None, fill=CORAL_RGB)   # short accent rule
BODY = ('<p>Uma experiência criativa pra o evento da AMAI: '
        '<b style="color:#FF5E8A">leve, mão na arte e memorável</b>. '
        'As convidadas escolhem a experiência — pintura em vaso com arranjo ou tufting —, '
        'criam e ainda curtem a gastronomia do O Jardim. '
        '<b style="color:#FF5E8A">Vocês escolhem o clima, a gente leva tudo até vocês.</b></p>')
p1.insert_htmlbox(fitz.Rect(70.9, 458, 302, 588), BODY,
                  css="p{margin:0;font-family:sans-serif;font-size:10.5px;line-height:1.5;color:#3F2F2C}")
# reword the cover footer (remove '10–15 CONVIDADAS' and 'ORÇAMENTO PARA 12')
rm(p1, [(66, 752, 548, 771)])
f1 = "ELARAH × AMAI  ·  EXPERIÊNCIA ELARAH  ·  "
put_spaced(p1, f1, 70.9, 766.5, 8.25, (0.247, 0.184, 0.173), FS, track=2.4)
fx = 70.9 + sum(FS.text_length(c, 8.25)+2.4 for c in f1)
put_spaced(p1, "PARA AS CONVIDADAS", fx, 766.5, 8.25, (1, 0.3686, 0.5412), FSB, track=2.4)

# ---- PAGE 2 footer ----
p2 = d[1]
rm(p2, [(458, 793, 543, 803)])
put_right(p2, "Experiência Elarah", FS, 7.9, MUTED, 541.4, 801.0)

# ================= PAGE 3: 3-tier pricing (189/289/389 por pessoa) + venues =================
A_DIR = "/home/user/elarahplatform/assets/"
HEAD = "#3F2F2C"; MUTc = "#8C7E74"; BODYc = "#4A3F3A"; CORALc = "#FF5E8A"; GOLDc = "#B8912E"; CREAMc = "#FBF6EF"
BLUSH = (0.9843, 0.9647, 0.9373)   # matches p3 page background (cream)

p3 = d[2]
# wipe the old body (list + single price card) and kill the old rose-card fill
rm(p3, [(40, 240, 560, 456)])
p3.draw_rect(fitz.Rect(40, 240, 558, 456), color=None, fill=BLUSH)

def venue(page, path, rect, name, vbias=0.5):
    r = fitz.Rect(rect); im = crop_ratio(path, r.width/r.height, vbias)
    b = io.BytesIO(); im.save(b, format="JPEG", quality=90)
    page.insert_image(r, stream=b.getvalue())
    put(page, name, FSB, 10.5, DARKt, r.x0, r.y1+14)

# ---- 1) ONDE ACONTECE — O Jardim em destaque (espaço + gastronomia) ----
put_spaced(p3, "✦ ONDE ACONTECE", 54, 230, 9, CORAL_RGB, FSB)
put(p3, "No ", FB, 19, (0.118, 0.086, 0.098), 54, 256)
put(p3, "O Jardim", FI, 19, CORAL_RGB, 54+FB.text_length("No ", 19), 256)
venue(p3, A_DIR+"amai7.jpg", (54, 268, 204, 418), "O espaço", vbias=0.5)
venue(p3, A_DIR+"ojardim4.jpg", (220, 268, 370, 418), "A gastronomia", vbias=0.55)
put_spaced(p3, "✦ COM REFEIÇÃO", 388, 296, 8, CORAL_RGB, FSB)
p3.insert_textbox(fitz.Rect(388, 308, 543, 418),
    "No plano Premium, o O Jardim já inclui o local, a experiência e a refeição completa "
    "— tudo num lugar só, cercadas de verde.",
    fontsize=9.5, fontname="lib", fontfile=LF+"LiberationSans-Regular.ttf",
    color=(0.431, 0.388, 0.357), lineheight=1.5)

# ---- 2) INVESTIMENTO — price table ----
put_spaced(p3, "✦ INVESTIMENTO", 54, 456, 9, CORAL_RGB, FSB)
put(p3, "cada experiência, o seu valor por pessoa", FI, 8.5, MUTED, 214, 455)
TABLE = (
    '<table>'
    '<tr class="hd"><th class="lbl">Experiência</th>'
    '<th>Básico<div class="s">A EXPERIÊNCIA</div></th>'
    '<th class="hl">Premium<div class="s">+ REFEIÇÃO INCLUSA</div></th>'
    '<th>Signature<div class="s">+ PERSONALIZAÇÃO</div></th></tr>'
    '<tr><td class="ex">Pintura em vaso com arranjo</td><td>R$&nbsp;299</td><td class="hl">R$&nbsp;399</td><td>R$&nbsp;499</td></tr>'
    '<tr><td class="ex">Tufting</td><td>R$&nbsp;585</td><td class="hl">R$&nbsp;689</td><td>R$&nbsp;789</td></tr>'
    '</table>')
tcss = (
    'table{width:100%;border-collapse:collapse;font-family:sans-serif}'
    '.hd th{font-family:serif;font-size:12.5px;font-weight:bold;color:#3F2F2C;'
    'padding:0 3px 7px 3px;text-align:center;border-bottom:2px solid #FF5E8A}'
    '.hd .lbl{text-align:left}'
    '.s{font-family:sans-serif;font-size:5.6px;font-weight:normal;color:#8C7E74;'
    'letter-spacing:0.4px;margin-top:2px}'
    'td{text-align:center;font-size:12.5px;font-weight:bold;color:#4A3F3A;'
    'padding:11px 3px;border-bottom:1px solid #EFE3DD}'
    '.ex{text-align:left;font-size:8.6px;color:#3F2F2C}'
    '.hl{color:#A8324F}')
p3.insert_htmlbox(fitz.Rect(54, 476, 541, 600), TABLE, css=tcss)
put(p3, "Valores por pessoa · Premium (no O Jardim) inclui a refeição · Signature inclui a personalização (o brinde).",
    FS, 7.6, (0.549, 0.494, 0.455), 54, 610)
put(p3, "Tufting no Aretha · Pintura em vaso também em Aretha, BETC ou Sterna Café.",
    FS, 7.6, (0.549, 0.494, 0.455), 54, 622)

# ---- personalization callout ----
_pz = crop_ratio(A_DIR+"personalizaçaobrindeescovapiranha.jpg", 1.0, vbias=0.42)
_pb = io.BytesIO(); _pz.save(_pb, format="JPEG", quality=92)
p3.insert_image(fitz.Rect(54, 640, 134, 720), stream=_pb.getvalue())
put_spaced(p3, "✦ PERSONALIZAÇÃO", 150, 662, 8.5, CORAL_RGB, FSB)
put(p3, "O brinde do ", FB, 15, (0.118, 0.086, 0.098), 150, 684)
put(p3, "Signature", FI, 15, CORAL_RGB, 150+FB.text_length("O brinde do ", 15), 684)
p3.insert_textbox(fitz.Rect(150, 694, 545, 728),
    "No plano Signature, cada pessoa ganha um brinde personalizado — com a inicial "
    "ou o nome de cada uma.", fontsize=8.7, fontname="lib",
    fontfile=LF+"LiberationSans-Regular.ttf", color=(0.431, 0.388, 0.357), lineheight=1.4)

# ---- PAGE 4 banner headline + footer + disclaimer (remove '12 / 10 a 15') ----
p4 = d[3]
rm(p4, [(76, 534, 487, 559), (434, 793, 543, 803), (50, 655, 745, 686)])
p4.insert_textbox(fitz.Rect(53.8, 655, 538, 690),
    "Valores por pessoa. Bebidas, brunch e itens personalizados conforme o plano "
    "escolhido. Proposta válida mediante confirmação de data.",
    fontsize=7.9, fontname="lib", fontfile=LF+"LiberationSans-Regular.ttf",
    color=(0.549, 0.494, 0.455), lineheight=1.35)
x = 77.8
put(p4, "Uma tarde que vocês vão ", FB, 20.2, CREAM, x, 553.5)
x += FB.text_length("Uma tarde que vocês vão ", 20.2)
put(p4, "lembrar para sempre", FBI, 20.2, GOLD, x, 553.5)
put_right(p4, "Elarah × AMAI · 2026", FS, 7.9, MUTED, 541.4, 801.0)
# banner sub: replace original template ('...pincelada, do bolo...') with neutral copy
rm(p4, [(76, 561, 432, 598)])
put(p4, "Do primeiro gesto criativo à última risada — cuidamos de cada detalhe",
    FI, 9.8, (0.835, 0.788, 0.733), 77.8, 576.5)
put(p4, "para que o evento seja tão especial quanto inesquecível.",
    FI, 9.8, (0.835, 0.788, 0.733), 77.8, 593.0)

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
d[1].add_redact_annot(fitz.Rect(52, 128, 375, 168))
d[1].apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE, graphics=fitz.PDF_REDACT_LINE_ART_NONE,
                      text=fitz.PDF_REDACT_TEXT_REMOVE)
put(d[1], "As ", FB, 27, (0.118, 0.086, 0.098), 53.8, 156.2)
put(d[1], "experiências", FBI, 27, CORAL_RGB, 53.8+FB.text_length("As ", 27), 156.2)
# p2 intro
retext(d[1], (52, 171, 505, 250),
       "Uma experiência criativa pra o evento da AMAI: cada convidada escolhe a experiência que "
       "mais tem a ver, coloca a mão na arte, se diverte e leva pra casa a sua peça autoral. Uma "
       "tarde pra criar e conectar — o ateliê vai até vocês, com tudo pronto.", 10.5,
       color=(0.431, 0.388, 0.357), width_rect=(53.8, 173, 502, 268))
# p2: remove the 'I / II / III' block (Criar/Celebrar/Levar + rule/dividers) ...
d[1].add_redact_annot(fitz.Rect(40, 258, 558, 402))
d[1].apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE,
                      graphics=fitz.PDF_REDACT_LINE_ART_NONE,
                      text=fitz.PDF_REDACT_TEXT_REMOVE)
d[1].draw_rect(fitz.Rect(40, 256, 558, 404), color=None, fill=(0.984, 0.965, 0.937))
# ... and put the painting options there (cada uma escolhe o que quiser)
put_spaced(d[1], "✦ AS OPÇÕES", 53.8, 292, 9, CORAL_RGB, FSB)
put(d[1], "2 experiências ", FB, 17, (0.118, 0.086, 0.098), 53.8, 315)
put(d[1], "pra escolher", FI, 17, CORAL_RGB, 53.8+FB.text_length("2 experiências ", 17), 315)
OPTS2 = [("Pintura em vaso com arranjo", "pinte o seu vaso e monte um arranjo de flores pra levar"),
         ("Tufting", "o seu quadrinho em tufting, moderno e feito à mão")]
for i, (nm, ds) in enumerate(OPTS2):
    yy = 348 + i*26
    d[1].draw_circle((57, yy-3.2), 2.3, color=None, fill=CORAL_RGB)
    put(d[1], nm, FSB, 11, (0.16, 0.12, 0.13), 68, yy)
    d[1].insert_textbox(fitz.Rect(68, yy+3, 505, yy+16), ds, fontsize=8.2, fontname="lib",
        fontfile=LF+"LiberationSans-Regular.ttf", color=(0.5, 0.45, 0.42), lineheight=1.2)
# p3 intro
retext(d[2], (52, 171, 505, 230),
       "A experiência que as convidadas escolherem, com toda a estrutura e os mimos. "
       "É só reunir o grupo — a Elarah leva tudo até vocês "
       "e cuida de cada detalhe.", 10.5, width_rect=(53.8, 173, 500, 232))
# p4 intro
retext(d[3], (52, 171, 482, 214),
       "Personalizamos cada detalhe com vocês — data, paleta de cores das peças e lista de "
       "participantes. A experiência vai até o O Jardim (ou espaço parceiro), com toda a energia da Elarah.",
       10.5, width_rect=(53.8, 173, 478, 232))

# p2 vibe: 3 photos of the EXACT same size + even gaps — arranjo, tufting, pessoas (evento AMAI)
_BG = (0.9843, 0.9647, 0.9373)
d[1].draw_rect(fitz.Rect(48, 430, 388, 629), color=None, fill=_BG)   # wipe left+mid (stop above banner y630.8)
d[1].draw_rect(fitz.Rect(384, 405, 545, 629), color=None, fill=_BG)  # wipe tall right (stop above banner)
_VW = 157.2
for _pth, _x0, _vb in [("buque.jpg", 51.8, 0.45), ("tuftingpacote8.jpg", 218.0, 0.4), ("amai2.jpg", 384.3, 0.4)]:
    _im = crop_ratio(A_DIR+_pth, _VW/176.3, vbias=_vb)
    _bb = io.BytesIO(); _im.save(_bb, format="JPEG", quality=90)
    d[1].insert_image(fitz.Rect(_x0, 436.5, _x0+_VW, 612.8), stream=_bb.getvalue())

# ================= CORPORATE polish: eyebrows, banner, headings + Nutrify logo =================
FSER = fitz.Font(fontfile=LF+"LiberationSerif-Regular.ttf")
NEARBLK = (0.118, 0.086, 0.098)

# P1 eyebrow: 'UMA CELEBRAÇÃO ÚNICA' -> 'ENTRE AMIGAS'
rm(p1, [(69, 271, 300, 287)])
put_spaced(p1, "✦ EXPERIÊNCIA ELARAH", 70.9, 300, 8.6, CORAL_RGB, FSB, track=2.4)

# ---- AMAI logo co-brand (circular, top-right under header) ----
_al = Image.open(A_DIR+"amailogo.png").convert("RGBA")
_amask = Image.new("L", _al.size, 0)
ImageDraw.Draw(_amask).ellipse([1, 1, _al.size[0]-1, _al.size[1]-1], fill=255)
_al.putalpha(_amask)
_ab = io.BytesIO(); _al.save(_ab, format="PNG")
_algt = fitz.Rect(438, 120, 524, 206)
_albl = "PREPARADO PARA"
_alw = sum(FSB.text_length(c, 7.6)+2.2 for c in _albl) - 2.2
put_spaced(p1, _albl, (_algt.x0+_algt.x1)/2 - _alw/2, 112, 7.6, MUTED, FSB, track=2.2)
p1.insert_image(_algt, stream=_ab.getvalue(), keep_proportion=True)

# P2 eyebrow: 'A ESTRELA DA FESTA' -> 'A ESTRELA DO ENCONTRO'
rm(d[1], [(52, 113, 235, 128)])
put_spaced(d[1], "✦ A ESTRELA DO ENCONTRO", 53.8, 124.2, 8.6, CORAL_RGB, FSB, track=2.4)

# P2 banner text -> corporate
rm(d[1], [(98, 640, 500, 684)])
put(d[1], "Não é só um evento — é arte, sabor e conexão.", FI, 12.8, CREAM, 100.7, 658.5)
put(d[1], "Uma tarde que todas vão lembrar pra sempre.", FB, 12.8, GOLD, 100.7, 678.0)

# P4 heading: 'Bora marcar essa festa?' -> 'data?'
rm(d[3], [(53, 129, 327, 165)])
put(d[3], "Bora marcar essa ", FB, 27, NEARBLK, 53.8, 157.5)
put(d[3], "data?", FBI, 27, CORAL_RGB, 53.8+FB.text_length("Bora marcar essa ", 27), 157.5)

# P4 INSPIRAÇÃO line: 'Como a sua festa pode ser' -> 'Como o seu dia pode ser'
rm(d[3], [(53, 229, 300, 249)])
put_spaced(d[3], "✦ INSPIRAÇÃO", 53.8, 244.5, 8.2, CORAL_RGB, FSB, track=1.5)
put(d[3], "Como o seu dia pode ser", FSER, 14.2, NEARBLK, 149.4, 244.5)

# p4: replace the right 'inspiração' photo with a joyful group-painting shot
# p4 inspiration: left (was a painted taça — not in this budget!) + right (was duplicate of p2)
_insL = crop_ratio(A_DIR+"amai4.jpg", 242/224, vbias=0.5)
_ibL = io.BytesIO(); _insL.save(_ibL, format="JPEG", quality=90)
d[3].insert_image(fitz.Rect(52, 257, 294, 481), stream=_ibL.getvalue())
_ins = crop_ratio(A_DIR+"amai1.jpg", 240/224, vbias=0.5)
_ib = io.BytesIO(); _ins.save(_ib, format="JPEG", quality=90)
d[3].insert_image(fitz.Rect(302, 257, 542, 481), stream=_ib.getvalue())


d.save(OUT, garbage=4, deflate=True)
print("saved", OUT)
r2 = fitz.open(OUT)
for i in range(r2.page_count):
    r2[i].get_pixmap(dpi=100).save(f"/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/tz_p{i+1}.png")
print("rendered")
