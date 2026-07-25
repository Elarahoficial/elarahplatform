"""Transform the Pintura em Taça proposal:
- accent burnt-orange -> festive coral-pink (#A75D3A)
- lighten the dark cover + banners (happy/bright)
- remove '20 / vinte anos', personalise to Isa ('Parabéns, Isa! ... venha comemorar')
Phase A here = accent recolor + logo recolor. Later phases add lightening + text."""
import fitz, io, sys
from PIL import Image

SRC = "/root/.claude/uploads/9abf7e9a-5852-5ed9-badc-3da0f14e2577/d2b59d51-Pintura_em_Taca_Elarah_1.pdf"
OUT = sys.argv[1] if len(sys.argv) > 1 else "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/Ceramica_final.pdf"
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
put(p1, "Escolha a sua", FB, 34, CORAL_RGB, 70, 342)      # menu-style hero
put(p1, "experiência", FB, 34, CORAL_RGB, 70, 384)
put(p1, "vem criar com a gente", FI, 20, DARKt, 70.9, 418)
p1.draw_rect(fitz.Rect(70.9, 439, 116, 441.2), color=None, fill=CORAL_RGB)   # short accent rule
BODY = ('<p>Um menu de experiências pra reunir o grupo: '
        '<b style="color:#FF5E8A">pintura, cerâmica, bartenderia ou gastronomia</b>. '
        'Vocês escolhem o que criar (ou agitar!), relaxam, se divertem e levam pra casa a peça — '
        'ou a receita. '
        '<b style="color:#FF5E8A">Vocês escolhem o clima, a gente leva tudo até vocês.</b></p>')
p1.insert_htmlbox(fitz.Rect(70.9, 458, 302, 588), BODY,
                  css="p{margin:0;font-family:sans-serif;font-size:10.5px;line-height:1.5;color:#3F2F2C}")
# reword the cover footer (remove '10–15 CONVIDADAS' and 'ORÇAMENTO PARA 12')
rm(p1, [(66, 752, 548, 771)])
f1 = "EXPERIÊNCIA ELARAH  ·  29 DE AGOSTO  ·  "
put_spaced(p1, f1, 70.9, 766.5, 8.25, (0.247, 0.184, 0.173), FS, track=2.4)
fx = 70.9 + sum(FS.text_length(c, 8.25)+2.4 for c in f1)
put_spaced(p1, "ATÉ 12 PESSOAS", fx, 766.5, 8.25, (1, 0.3686, 0.5412), FSB, track=2.4)

# cover photo -> an on-theme art-creation shot (overhead group painting)
_cov = crop_ratio("/home/user/elarahplatform/assets/atelieleroy-2.jpg", 208.4/259.5, vbias=0.42)
_cb = io.BytesIO(); _cov.save(_cb, format="JPEG", quality=90)
p1.insert_image(fitz.Rect(315.8, 295.5, 524.2, 555), stream=_cb.getvalue())

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

# ---- 1) ONDE ACONTECE — two square venues: BETC + Aretha ----
put_spaced(p3, "✦ ONDE ACONTECE", 54, 232, 9, CORAL_RGB, FSB)
put(p3, "Escolha o seu ", FB, 19, (0.118, 0.086, 0.098), 54, 258)
put(p3, "local", FI, 19, CORAL_RGB, 54+FB.text_length("Escolha o seu ", 19), 258)
def sq_venue(path, x0, size, name, vbias=0.5):
    r = fitz.Rect(x0, 268, x0+size, 268+size)
    im = crop_ratio(path, 1.0, vbias); b = io.BytesIO(); im.save(b, format="JPEG", quality=90)
    p3.insert_image(r, stream=b.getvalue())
    put(p3, name, FSB, 9.5, DARKt, x0 + (size - FSB.text_length(name, 9.5))/2, 268+size+15)
sq_venue(A_DIR+"betchavas.jpg", 54, 160, "BETC Havas Café", vbias=0.42)
sq_venue(A_DIR+"arethasoulkitchen.jpg", 230, 160, "Aretha Soul Kitchen")

# ---- 2) INVESTIMENTO — Aretha tiers (BETC is à la carte) ----
put_spaced(p3, "✦ INVESTIMENTO · NO ARETHA", 54, 462, 9, CORAL_RGB, FSB)
TIERS = [
    dict(name="Básico", tag="A experiência, em sua essência.", price="189", more=None,
         bullets=["Pintura ou cerâmica (tela, taça, prato, modelagem)", "Todos os materiais inclusos",
                  "Condução por facilitadora", "Cada um leva a sua peça autoral"], kind="plain"),
    dict(name="Premium", tag="Tudo incluso — a mais querida.", price="279",
         badge="O MAIS QUERIDINHO", more="TUDO DO BÁSICO, E MAIS",
         bullets=["Tudo incluso (bebida + coffee break)", "Registro fotográfico profissional",
                  "Avental personalizado"], kind="highlight"),
    dict(name="Signature", tag="A celebração completa, sem preocupação.", price="399",
         badge="TUDO RESOLVIDO", more="TUDO DO PREMIUM, E MAIS",
         bullets=["Docinhos & mimos", "Mesa de boas-vindas",
                  "Personalização (inicial ou nome)"], kind="dark"),
]
CX = [54, 220.5, 387]; CW = 154; CY0, CY1 = 482, 640
for i, t in enumerate(TIERS):
    card = fitz.Rect(CX[i], CY0, CX[i]+CW, CY1)
    if t["kind"] == "plain":
        p3.draw_rect(card, color=(0.906, 0.863, 0.796), fill=(1, 1, 1), width=1, radius=0.055)
        head, mut, body, acc, cream_txt = HEAD, MUTc, BODYc, CORALc, False
    elif t["kind"] == "highlight":
        p3.draw_rect(card, color=(1, 0.3686, 0.5412), fill=(1, 1, 1), width=1.6, radius=0.055)
        head, mut, body, acc, cream_txt = HEAD, MUTc, BODYc, CORALc, False
    else:
        p3.draw_rect(card, color=None, fill=(0.82, 0.306, 0.447), radius=0.055)
        head, mut, body, acc, cream_txt = CREAMc, "#F0D9DF", "#FBEDF0", GOLDc, True
    # badge pill (Premium / Signature)
    if t.get("badge"):
        bw = FSB.text_length(t["badge"], 6.3) + 0.8*(len(t["badge"])-1) + 17
        bx = CX[i] + (CW-bw)/2
        bcol = (1, 0.3686, 0.5412) if t["kind"] == "highlight" else (0.72, 0.55, 0.22)
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

# per-person note (Aretha prices; BETC is à la carte)
put(p3, "Valores por pessoa no Aretha — pintura ou cerâmica, mesmo valor. No BETC, à la carte (sob consulta).",
    FS, 7.6, (0.549, 0.494, 0.455), 54, 652)

# ---- personalization callout ----
_pz = crop_ratio(A_DIR+"personalizaçaobrindeescovapiranha.jpg", 1.0, vbias=0.42)
_pb = io.BytesIO(); _pz.save(_pb, format="JPEG", quality=92)
p3.insert_image(fitz.Rect(54, 664, 132, 742), stream=_pb.getvalue())
put_spaced(p3, "✦ PERSONALIZAÇÃO", 148, 686, 8.5, CORAL_RGB, FSB)
put(p3, "O brinde do ", FB, 15, (0.118, 0.086, 0.098), 148, 708)
put(p3, "Signature", FI, 15, CORAL_RGB, 148+FB.text_length("O brinde do ", 15), 708)
p3.insert_textbox(fitz.Rect(148, 718, 545, 748),
    "No último plano, cada pessoa ganha um brinde personalizado — com a inicial ou o "
    "nome de cada uma.", fontsize=8.7, fontname="lib",
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
put_right(p4, "Experiência Elarah · 2026", FS, 7.9, MUTED, 541.4, 801.0)

# ================= taça -> taça in the source paragraphs (redact + reinsert) =================
def retext(page, rect, text, size, color=(0.431, 0.388, 0.357), width_rect=None):
    page.add_redact_annot(fitz.Rect(rect))
    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE,
                          graphics=fitz.PDF_REDACT_LINE_ART_NONE,
                          text=fitz.PDF_REDACT_TEXT_REMOVE)
    page.insert_textbox(fitz.Rect(width_rect or rect), text, fontsize=size,
                        fontname="lib", fontfile=LF+"LiberationSans-Regular.ttf",
                        color=color, lineheight=1.42)
# p2 heading -> 'Pintura & Cerâmica'
d[1].add_redact_annot(fitz.Rect(52, 128, 375, 168))
d[1].apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE, graphics=fitz.PDF_REDACT_LINE_ART_NONE,
                      text=fitz.PDF_REDACT_TEXT_REMOVE)
put(d[1], "Pintura ", FB, 27, (0.118, 0.086, 0.098), 53.8, 156.2)
put(d[1], "& Cerâmica", FBI, 27, CORAL_RGB, 53.8+FB.text_length("Pintura ", 27), 156.2)
# p2 intro
retext(d[1], (52, 171, 505, 250),
       "Aqui cada pessoa vira artista por um dia: pinta ou modela, personaliza e leva para casa a "
       "própria peça autoral. Uma experiência criativa, relaxante e cheia de estilo — perfeita pra "
       "reunir o grupo e desacelerar do dia a dia. "
       "O ateliê vai até vocês, com tudo pronto.", 10.5, color=(0.431, 0.388, 0.357),
       width_rect=(53.8, 173, 502, 268))
# p2: remove the 'I / II / III' block (Criar/Celebrar/Levar + rule/dividers) ...
d[1].add_redact_annot(fitz.Rect(40, 258, 558, 402))
d[1].apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE,
                      graphics=fitz.PDF_REDACT_LINE_ART_NONE,
                      text=fitz.PDF_REDACT_TEXT_REMOVE)
d[1].draw_rect(fitz.Rect(40, 256, 558, 404), color=None, fill=(0.984, 0.965, 0.937))
# ... and put the painting options there (cada uma escolhe o que quiser)
put_spaced(d[1], "✦ AS OPÇÕES", 53.8, 292, 9, CORAL_RGB, FSB)
put(d[1], "Escolha a sua ", FB, 18, (0.118, 0.086, 0.098), 53.8, 316)
put(d[1], "arte", FI, 18, CORAL_RGB, 53.8+FB.text_length("Escolha a sua ", 18), 316)
OPTS4 = [("Pintura em tela", "sua arte numa tela pra pendurar"),
         ("Pintura em taça", "taças autorais pra brindar"),
         ("Pintura em cerâmica", "pratos e peças pintados à mão"),
         ("Modelagem em cerâmica", "modele a sua peça do zero")]
pos = [(53.8, 344), (300, 344), (53.8, 378), (300, 378)]
for (nm, ds), (x, yy) in zip(OPTS4, pos):
    d[1].draw_circle((x+3, yy-3.4), 2.2, color=None, fill=CORAL_RGB)
    put(d[1], nm, FSB, 10.5, (0.16, 0.12, 0.13), x+13, yy)
    d[1].insert_textbox(fitz.Rect(x+13, yy+2.5, x+248, yy+18), ds, fontsize=8, fontname="lib",
        fontfile=LF+"LiberationSans-Regular.ttf", color=(0.5, 0.45, 0.42), lineheight=1.2)
# p3 intro
retext(d[2], (52, 171, 505, 220),
       "A experiência de pintura & cerâmica (tela, taça, prato ou modelagem) com toda a estrutura "
       "e os mimos. É só reunir o grupo — a Elarah leva tudo até vocês "
       "e cuida de cada detalhe.", 10.5, width_rect=(53.8, 173, 500, 232))
# p4 intro
retext(d[3], (52, 171, 482, 214),
       "Personalizamos cada detalhe com vocês — data, paleta de cores das peças e lista de "
       "convidadas. A experiência vai até o espaço parceiro, com toda a energia da Elarah.",
       10.5, width_rect=(53.8, 173, 478, 232))

# p2 vibe photos: left = group with their ceramics, middle = modelling clay
_lft = crop_ratio(A_DIR+"ceramica.jpg", 159.7/176.3, vbias=0.45)
_lb2 = io.BytesIO(); _lft.save(_lb2, format="JPEG", quality=90)
d[1].insert_image(fitz.Rect(51.8, 436.5, 211.5, 612.8), stream=_lb2.getvalue())
_mid = crop_ratio(A_DIR+"ceramicamodelagem.jpg", 175.5/176.3, vbias=0.5)
_b = io.BytesIO(); _mid.save(_b, format="JPEG", quality=90)
d[1].insert_image(fitz.Rect(210, 436.5, 385.5, 612.8), stream=_b.getvalue())

# ================= CORPORATE polish: eyebrows, banner, headings + Nutrify logo =================
FSER = fitz.Font(fontfile=LF+"LiberationSerif-Regular.ttf")
NEARBLK = (0.118, 0.086, 0.098)

# P1 eyebrow: 'UMA CELEBRAÇÃO ÚNICA' -> 'ENTRE AMIGAS'
rm(p1, [(69, 271, 300, 287)])
put_spaced(p1, "✦ EXPERIÊNCIA ELARAH", 70.9, 300, 8.6, CORAL_RGB, FSB, track=2.4)

# P2 eyebrow: 'A ESTRELA DA FESTA' -> 'A ESTRELA DO ENCONTRO'
rm(d[1], [(52, 113, 235, 128)])
put_spaced(d[1], "✦ A ESTRELA DO ENCONTRO", 53.8, 124.2, 8.6, CORAL_RGB, FSB, track=2.4)

# P2 banner text -> corporate
rm(d[1], [(98, 640, 500, 684)])
put(d[1], "Não é só um encontro — é arte, mão na massa e boas risadas.", FI, 12.8, CREAM, 100.7, 658.5)
put(d[1], "Uma tarde que vira memória com o grupo.", FB, 12.8, GOLD, 100.7, 678.0)

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
_insL = crop_ratio(A_DIR+"ceramica1.jpg", 242/224, vbias=0.5)
_ibL = io.BytesIO(); _insL.save(_ibL, format="JPEG", quality=90)
d[3].insert_image(fitz.Rect(52, 257, 294, 481), stream=_ibL.getvalue())

# ================= NEW PAGE: OPÇÃO JARDIM (dedicated showcase) =================
d.fullcopy_page(2, 3)           # clone p3 (frame + header + footer + copper theme); contact -> index 4
jp = d[3]
CREAMbg = (0.9843, 0.9647, 0.9373)
jp.draw_rect(fitz.Rect(42, 112, 553, 776), color=None, fill=CREAMbg)   # wipe cloned body, keep chrome
# re-tag header tagline (y65-74) + footer right
jp.add_redact_annot(fitz.Rect(410, 62, 541, 77))
jp.add_redact_annot(fitz.Rect(470, 789, 544, 806))
jp.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE, graphics=fitz.PDF_REDACT_LINE_ART_NONE,
                    text=fitz.PDF_REDACT_TEXT_REMOVE)
put_right(jp, "O JARDIM · AO AR LIVRE", FS, 8.6, MUTED, 541.4, 72)
put_right(jp, "Opção Jardim", FS, 7.9, MUTED, 541.4, 800.5)

# ---- heading (matches the other pages' rhythm) ----
put_spaced(jp, "✦ OPÇÃO JARDIM · SÁBADO · 16H ÀS 19H", 54, 122, 9, CORAL_RGB, FSB)
put(jp, "Uma tarde no ", FB, 25, NEARBLK, 54, 155)
put(jp, "jardim", FI, 25, CORAL_RGB, 54+FB.text_length("Uma tarde no ", 25), 155)
jp.insert_textbox(fitz.Rect(54, 170, 541, 226),
    "No sábado, das 16h às 19h, vocês reservam o espaço biblioteca do O Jardim — um café-ateliê "
    "cercado de verde. Pintura, cerâmica e tudo incluso, ao ar livre. O cenário perfeito para "
    "criar junto e curtir uma tarde diferente com o grupo.",
    fontsize=10.5, fontname="lib", fontfile=LF+"LiberationSans-Regular.ttf",
    color=(0.431, 0.388, 0.357), lineheight=1.5)

# ---- 3 garden photos (space -> identity -> gastronomia) ----
def jphoto(path, rect, vbias=0.5):
    r = fitz.Rect(rect); im = crop_ratio(path, r.width/r.height, vbias)
    b = io.BytesIO(); im.save(b, format="JPEG", quality=90); jp.insert_image(r, stream=b.getvalue())
jphoto(A_DIR+"ojardim1.jpg", (54, 240, 211.3, 434))
jphoto(A_DIR+"ojardim3.jpg", (218.9, 240, 376.2, 434))
jphoto(A_DIR+"ojardim4.jpg", (383.7, 240, 541, 434), vbias=0.55)

# ---- pricing (Básico / Premium / Signature — garden values) ----
put_spaced(jp, "✦ INVESTIMENTO NO JARDIM", 54, 468, 9, CORAL_RGB, FSB)
JTIERS = [
    dict(name="Básico", price="189", tag="Só a experiência, ao ar livre.", kind="plain", more=None,
         bullets=["Pintura ou cerâmica (tela, taça, prato...)", "Materiais + facilitadora", "Cada um leva a sua peça"]),
    dict(name="Premium", price="399", tag="Espaço reservado + tudo incluso.", kind="highlight",
         badge="O MAIS QUERIDINHO", more="TUDO DO BÁSICO, E MAIS",
         bullets=["Espaço biblioteca reservado (sáb, 16h–19h)", "Tudo incluso (coffee break)", "Espumante pra brinde"]),
    dict(name="Signature", price="529", tag="Tudo resolvido, no verde.", kind="dark",
         badge="TUDO RESOLVIDO", more="TUDO DO PREMIUM, E MAIS",
         bullets=["Docinhos & mimos", "Registro fotográfico", "Personalização (inicial ou nome)"]),
]
JCX = [54, 220.5, 387]; JCW = 154; JY0, JY1 = 490, 654
for i, t in enumerate(JTIERS):
    card = fitz.Rect(JCX[i], JY0, JCX[i]+JCW, JY1)
    if t["kind"] == "plain":
        jp.draw_rect(card, color=(0.906, 0.863, 0.796), fill=(1, 1, 1), width=1, radius=0.055)
        head, mut, body, acc = HEAD, MUTc, BODYc, CORALc
    elif t["kind"] == "highlight":
        jp.draw_rect(card, color=(1, 0.3686, 0.5412), fill=(1, 1, 1), width=1.6, radius=0.055)
        head, mut, body, acc = HEAD, MUTc, BODYc, CORALc
    else:
        jp.draw_rect(card, color=None, fill=(0.82, 0.306, 0.447), radius=0.055)
        head, mut, body, acc = CREAMc, "#F0D9DF", "#FBEDF0", GOLDc
    if t.get("badge"):
        bw = FSB.text_length(t["badge"], 6.3) + 0.8*(len(t["badge"])-1) + 17
        bx = JCX[i] + (JCW-bw)/2
        bcol = (1, 0.3686, 0.5412) if t["kind"] == "highlight" else (0.72, 0.55, 0.22)
        jp.draw_rect(fitz.Rect(bx, JY0-9, bx+bw, JY0+9), color=None, fill=bcol, radius=0.5)
        put_spaced(jp, t["badge"], bx+8.5, JY0+2.5, 6.3, (1, 1, 1), FSB, track=0.8)
    more_html = f'<div class="more">{t["more"]}</div>' if t.get("more") else ''
    lis = "".join(f'<div class="li"><span class="mk">◆</span>&nbsp;{b}</div>' for b in t["bullets"])
    html = (f'<div class="nm">{t["name"]}</div><div class="tg">{t["tag"]}</div>'
            f'<div class="pr">R$&nbsp;{t["price"]}</div><div class="pp">POR PESSOA</div>'
            f'{more_html}{lis}')
    css = (f'.nm{{font-family:serif;font-size:15px;font-weight:bold;color:{head}}}'
           f'.tg{{font-size:7px;color:{mut};margin-top:3px}}'
           f'.pr{{font-family:serif;font-size:22px;font-weight:bold;color:{head};margin-top:9px}}'
           f'.pp{{font-size:6.3px;color:{mut};letter-spacing:0.8px}}'
           f'.more{{font-size:6.5px;font-weight:bold;color:{acc};margin-top:8px}}'
           f'.li{{font-size:7.6px;color:{body};margin-top:5px;line-height:1.25}}'
           f'.mk{{color:{acc};font-size:6px}}')
    jp.insert_htmlbox(fitz.Rect(card.x0+11, card.y0+15, card.x1-10, card.y1-8), html, css=css)
put(jp, "Valores por pessoa no O Jardim · reserva do espaço biblioteca (sáb, 16h–19h) nos planos Premium e Signature.",
    FS, 7.6, (0.549, 0.494, 0.455), 54, 672)

# ================= NEW PAGE: BARTENDERIA & GASTRONOMIA =================
d.fullcopy_page(2, 4)           # clone p2 template; contact -> index 5
bp = d[4]
bp.draw_rect(fitz.Rect(42, 112, 553, 776), color=None, fill=CREAMbg)
bp.add_redact_annot(fitz.Rect(410, 62, 541, 77))
bp.add_redact_annot(fitz.Rect(470, 789, 544, 806))
bp.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE, graphics=fitz.PDF_REDACT_LINE_ART_NONE,
                    text=fitz.PDF_REDACT_TEXT_REMOVE)
put_right(bp, "DRINKS & SABORES", FS, 8.6, MUTED, 541.4, 72)
put_right(bp, "Bartenderia & Gastronomia", FS, 7.9, MUTED, 541.4, 800.5)

put_spaced(bp, "✦ BARTENDERIA & GASTRONOMIA", 54, 122, 9, CORAL_RGB, FSB)
put(bp, "Mão na ", FB, 25, NEARBLK, 54, 155)
put(bp, "coqueteleira", FI, 25, CORAL_RGB, 54+FB.text_length("Mão na ", 25), 155)
bp.insert_textbox(fitz.Rect(54, 170, 541, 226),
    "Prefere agitar a coqueteleira ou colocar a mão na massa? Vocês escolhem o tema — bartenderia "
    "ou gastronomia — e a Elarah leva a experiência completa até o grupo, com preço único por pessoa.",
    fontsize=10.5, fontname="lib", fontfile=LF+"LiberationSans-Regular.ttf",
    color=(0.431, 0.388, 0.357), lineheight=1.5)

def bphoto(path, rect, vbias=0.5):
    r = fitz.Rect(rect); im = crop_ratio(path, r.width/r.height, vbias)
    b = io.BytesIO(); im.save(b, format="JPEG", quality=90); bp.insert_image(r, stream=b.getvalue())
bphoto(A_DIR+"drinksclassicos.jpg", (54, 240, 211.3, 434))
bphoto(A_DIR+"drinkspetisco.jpg", (218.9, 240, 376.2, 434))
bphoto(A_DIR+"gastronomiamolecular.jpg", (383.7, 240, 541, 434))

put_spaced(bp, "✦ ONDE E QUANTO", 54, 468, 9, CORAL_RGB, FSB)
BTIERS = [
    dict(name="Jardim das Bandeiras", price="429", tag="Preço único · tema à escolha.", kind="highlight",
         badge="MAIS COMPLETO", plus="529",
         bullets=["Bartenderia ou gastronomia", "Experiência completa, tudo incluso"]),
    dict(name="Pacaembu", price="229", tag="Preço único · tema à escolha.", kind="plain", badge=None, plus="329",
         bullets=["Gin, caipirinha e mais", "Vocês escolhem o tema", "Materiais + bartender/chef"]),
]
BCX = [54, 313]; BCW = 228; BY0, BY1 = 492, 656
for i, t in enumerate(BTIERS):
    card = fitz.Rect(BCX[i], BY0, BCX[i]+BCW, BY1)
    if t["kind"] == "highlight":
        bp.draw_rect(card, color=(1, 0.3686, 0.5412), fill=(1, 1, 1), width=1.6, radius=0.05)
    else:
        bp.draw_rect(card, color=(0.906, 0.863, 0.796), fill=(1, 1, 1), width=1, radius=0.05)
    head, mut, body, acc = HEAD, MUTc, BODYc, CORALc
    if t.get("badge"):
        bw = FSB.text_length(t["badge"], 6.3) + 0.8*(len(t["badge"])-1) + 17
        bx = BCX[i] + (BCW-bw)/2
        bp.draw_rect(fitz.Rect(bx, BY0-9, bx+bw, BY0+9), color=None, fill=(1, 0.3686, 0.5412), radius=0.5)
        put_spaced(bp, t["badge"], bx+8.5, BY0+2.5, 6.3, (1, 1, 1), FSB, track=0.8)
    lis = "".join(f'<div class="li"><span class="mk">◆</span>&nbsp;{b}</div>' for b in t["bullets"])
    plus_html = (f'<div class="plus">+ personalização &nbsp;·&nbsp; R$&nbsp;{t["plus"]} / pessoa</div>'
                 if t.get("plus") else '')
    html = (f'<div class="nm">{t["name"]}</div><div class="tg">{t["tag"]}</div>'
            f'<div class="pr">R$&nbsp;{t["price"]}</div><div class="pp">POR PESSOA</div>{lis}{plus_html}')
    css = (f'.nm{{font-family:serif;font-size:15px;font-weight:bold;color:{head}}}'
           f'.tg{{font-size:7.5px;color:{mut};margin-top:3px}}'
           f'.pr{{font-family:serif;font-size:24px;font-weight:bold;color:{head};margin-top:10px}}'
           f'.pp{{font-size:6.5px;color:{mut};letter-spacing:1px}}'
           f'.li{{font-size:8px;color:{body};margin-top:6px;line-height:1.25}}'
           f'.mk{{color:{acc};font-size:6px}}'
           f'.plus{{margin-top:10px;font-size:8.5px;font-weight:bold;color:#FF5E8A}}')
    bp.insert_htmlbox(fitz.Rect(card.x0+14, card.y0+16, card.x1-12, card.y1-8), html, css=css)
put(bp, "Valores por pessoa · vocês escolhem o tema (bartenderia ou gastronomia).",
    FS, 7.6, (0.549, 0.494, 0.455), 54, 672)

d.save(OUT, garbage=4, deflate=True)
print("saved", OUT)
r2 = fitz.open(OUT)
for i in range(r2.page_count):
    r2[i].get_pixmap(dpi=100).save(f"/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/tz_p{i+1}.png")
print("rendered")
