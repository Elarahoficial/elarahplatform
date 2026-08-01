"""Criando seu Perfume Natural — turma privada (base 10 pessoas).
Two location options: 1) no seu espaço (salão do condomínio/casa) sem custo de espaço;
2) em espaço parceiro Elarah. Values TBD (sob consulta) — Elara envia depois.
Elarah coral-rosa (#FF5E8A) brand. Built from the Pintura em Taça template."""
import fitz, io, sys
from PIL import Image

SRC = "/root/.claude/uploads/9abf7e9a-5852-5ed9-badc-3da0f14e2577/d2b59d51-Pintura_em_Taca_Elarah_1.pdf"
OUT = sys.argv[1] if len(sys.argv) > 1 else "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/Perfume_final.pdf"
CORAL = "1 .3686 .5412"   # #FF5E8A festive coral-pink
A_DIR = "/home/user/elarahplatform/assets/"

d = fitz.open(SRC)

# ---- accent recolor via content-stream string replacement (all pages) ----
ACCENT_SRCS = [".949 .4078 .2353", "1 .4784 .349"]
for pi in range(d.page_count):
    for x in d[pi].get_contents():
        s = d.xref_stream(x).decode("latin-1"); orig = s
        for src in ACCENT_SRCS:
            s = s.replace(src, CORAL)
        if s != orig:
            d.update_stream(x, s.encode("latin-1"))

# ---- recolor the Elarah logo (orange) -> coral-pink ----
logo_xref = [i[0] for i in d[0].get_images(full=True)
             if d.extract_image(i[0])["width"] == 727][0]
sm = fitz.Pixmap(d, d.extract_image(logo_xref)["smask"])
alpha = Image.frombytes("L", (sm.width, sm.height), sm.samples).resize((727, 227))
coral = Image.new("RGBA", (727, 227), (255, 94, 138, 255)); coral.putalpha(alpha)
bio = io.BytesIO(); coral.save(bio, format="PNG")
d[0].replace_image(logo_xref, stream=bio.getvalue())

# ---- lighten cover + recolor banners ----
DARK = ".247 .184 .173"
def swap(pi, pairs):
    for x in d[pi].get_contents():
        s = d.xref_stream(x).decode("latin-1"); o = s
        for a, b in pairs:
            s = s.replace(a, b)
        if s != o:
            d.update_stream(x, s.encode("latin-1"))
swap(0, [
    ("/Pattern CS/Pattern cs/P3 SCN/P3 scn", ".988 .945 .95 rg"),
    (".8549 .8078 .749 rg", DARK+" rg"), (".8549 .8078 .749 RG", DARK+" RG"),
    (".7882 .7373 .6745 rg", DARK+" rg"), (".7882 .7373 .6745 RG", DARK+" RG"),
    (".9843 .9647 .9373 rg", DARK+" rg"), (".9843 .9647 .9373 RG", DARK+" RG"),
])
BANNER = ".82 .306 .447 rg"
swap(1, [("/Pattern CS/Pattern cs/P32 SCN/P32 scn", BANNER)])
swap(2, [("/Pattern CS/Pattern cs/P50 SCN/P50 scn", BANNER)])
swap(3, [("/Pattern CS/Pattern cs/P61 SCN/P61 scn", BANNER)])

# ---- fonts + helpers ----
LF = "/usr/share/fonts/truetype/liberation/"
FB  = fitz.Font(fontfile=LF+"LiberationSerif-Bold.ttf")
FI  = fitz.Font(fontfile=LF+"LiberationSerif-Italic.ttf")
FBI = fitz.Font(fontfile=LF+"LiberationSerif-BoldItalic.ttf")
FSER = fitz.Font(fontfile=LF+"LiberationSerif-Regular.ttf")
FS  = fitz.Font(fontfile=LF+"LiberationSans-Regular.ttf")
FSB = fitz.Font(fontfile=LF+"LiberationSans-Bold.ttf")
CORAL_RGB = (1, 0.3686, 0.5412)
DARKt = (0.247, 0.184, 0.173)
CREAM = (0.984, 0.965, 0.937)
GOLD  = (0.902, 0.784, 0.4745)
MUTED = (0.549, 0.494, 0.455)
NEARBLK = (0.118, 0.086, 0.098)
BLUSH = (0.988, 0.945, 0.95)
CREAMbg = (0.9843, 0.9647, 0.9373)

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
def photo(page, path, rect, vbias=0.5):
    r = fitz.Rect(rect); im = crop_ratio(path, r.width/r.height, vbias)
    b = io.BytesIO(); im.save(b, format="JPEG", quality=90); page.insert_image(r, stream=b.getvalue())
def retext(page, rect, text, size, color=(0.431, 0.388, 0.357), width_rect=None):
    page.add_redact_annot(fitz.Rect(rect))
    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE,
                          graphics=fitz.PDF_REDACT_LINE_ART_NONE,
                          text=fitz.PDF_REDACT_TEXT_REMOVE)
    page.insert_textbox(fitz.Rect(width_rect or rect), text, fontsize=size,
                        fontname="lib", fontfile=LF+"LiberationSans-Regular.ttf",
                        color=color, lineheight=1.42)

# ================= PAGE 1 — COVER =================
p1 = d[0]
rm(p1, [(64, 286, 260, 410), (70, 401, 260, 456), (70, 476, 305, 592), (69, 271, 300, 287)])
p1.draw_rect(fitz.Rect(58, 292, 313, 606), color=None, fill=BLUSH)
put_spaced(p1, "✦ EXPERIÊNCIA ELARAH", 70.9, 300, 8.6, CORAL_RGB, FSB, track=2.4)
put(p1, "Perfume", FB, 40, CORAL_RGB, 70, 350)
put(p1, "Natural", FB, 40, CORAL_RGB, 70, 393)
put(p1, "crie a sua fragrância", FI, 19.5, DARKt, 70.9, 425)
p1.draw_rect(fitz.Rect(70.9, 445, 116, 447.2), color=None, fill=CORAL_RGB)
BODY = ('<p>Uma imersão de perfumaria botânica pra reunir o grupo: cada convidado vira '
        '<b style="color:#FF5E8A">perfumista por um dia</b>. Aprende a estrutura de uma fragrância '
        'e formula, do zero, o seu próprio perfume — que leva pra casa. '
        '<b style="color:#FF5E8A">Vocês escolhem o clima, a gente leva tudo até vocês.</b></p>')
p1.insert_htmlbox(fitz.Rect(70.9, 462, 302, 592), BODY,
                  css="p{margin:0;font-family:sans-serif;font-size:10.5px;line-height:1.5;color:#3F2F2C}")
# hero photo (template cover-photo slot) — decorative styled flat-lay
photo(p1, A_DIR+"perfumariamaes.jpg", (315.8, 295.5, 524.2, 555.0), vbias=0.45)
# footer
rm(p1, [(66, 752, 548, 771)])
f1 = "EXPERIÊNCIA ELARAH  ·  PERFUME NATURAL  ·  "
put_spaced(p1, f1, 70.9, 766.5, 8.25, DARKt, FS, track=2.4)
fx = 70.9 + sum(FS.text_length(c, 8.25)+2.4 for c in f1)
put_spaced(p1, "POR PESSOA", fx, 766.5, 8.25, CORAL_RGB, FSB, track=2.4)

# ================= PAGE 2 — A EXPERIÊNCIA =================
p2 = d[1]
# eyebrow
rm(p2, [(52, 113, 235, 128)])
put_spaced(p2, "✦ A ESTRELA DO ENCONTRO", 53.8, 124.2, 8.6, CORAL_RGB, FSB, track=2.4)
# main heading
rm(p2, [(52, 128, 330, 168)])
put(p2, "Perfumista por ", FB, 27, NEARBLK, 53.8, 156.2)
put(p2, "um dia", FBI, 27, CORAL_RGB, 53.8+FB.text_length("Perfumista por ", 27), 156.2)
# intro
retext(p2, (52, 171, 505, 250),
       "Mais que uma experiência rápida: um verdadeiro laboratório de perfumaria botânica, com 4 "
       "horas de teoria e prática. Você entende a estrutura de um perfume — famílias e pirâmide "
       "olfativa, notas de topo, coração e fundo — e formula, do zero, a sua própria fragrância. "
       "Uma imersão acessível pra iniciantes e rica pra quem já conhece.",
       10.5, width_rect=(53.8, 173, 505, 268))
# middle block: 'o que está incluso' (wipe the I/II/III template block)
rm(p2, [(40, 258, 558, 404)])
p2.draw_rect(fitz.Rect(40, 256, 558, 404), color=None, fill=CREAMbg)
put_spaced(p2, "✦ A IMERSÃO", 53.8, 292, 9, CORAL_RGB, FSB)
put(p2, "O que está ", FB, 18, NEARBLK, 53.8, 316)
put(p2, "incluso", FI, 18, CORAL_RGB, 53.8+FB.text_length("O que está ", 18), 316)
INCL = [
    ("4 horas de imersão", "teoria e prática, lado a lado"),
    ("Apostila de +30 páginas", "todo o conteúdo pra levar pra casa"),
    ("+50 matérias-primas", "na bancada, pra formular do zero"),
    ("Mentoria especializada", "profissional com +12 anos de perfumaria"),
]
for j, (a, b) in enumerate(INCL):
    yy = 348 + j*15.5
    p2.draw_circle((62, yy-2.6), 2.2, color=None, fill=CORAL_RGB)
    put(p2, a, FSB, 9.6, (0.29, 0.24, 0.22), 74, yy)
    put(p2, "— "+b, FS, 9.3, (0.5, 0.45, 0.42), 74+FSB.text_length(a, 9.6)+6, yy)
# 3 equal vibe photos
_VW = 157.2
for _pth, _x0, _vb in [("perfumariaapresentação.jpg", 51.8, 0.3), ("perfumariaapresentação1.jpg", 218.0, 0.45), ("perfumariaapresentação2.jpg", 384.3, 0.25)]:
    photo(p2, A_DIR+_pth, (_x0, 436.5, _x0+_VW, 612.8), vbias=_vb)
# banner text
rm(p2, [(98, 640, 500, 684)])
put(p2, "Não é só um perfume — é memória, aroma e identidade.", FI, 12.8, CREAM, 100.7, 658.5)
put(p2, "Uma fragrância que só existe porque foi você quem criou.", FB, 12.2, GOLD, 100.7, 678.0)
# footer
rm(p2, [(458, 793, 543, 803)])
put_right(p2, "Experiência Elarah", FS, 7.9, MUTED, 541.4, 801.0)

# ================= PAGE 3 — DUAS OPÇÕES (local + investimento) =================
p3 = d[2]
rm(p3, [(40, 110, 560, 772)])
p3.draw_rect(fitz.Rect(40, 110, 558, 772), color=None, fill=CREAMbg)
# rebuild the whole body (template header + taça content wiped)
put_spaced(p3, "✦ AS DUAS OPÇÕES", 54, 150, 9, CORAL_RGB, FSB)
put(p3, "Onde você ", FB, 26, NEARBLK, 54, 185)
put(p3, "preferir", FI, 26, CORAL_RGB, 54+FB.text_length("Onde você ", 26), 185)
p3.insert_textbox(fitz.Rect(54, 200, 541, 246),
    "Você escolhe onde a experiência acontece — a gente leva o profissional, as essências "
    "naturais e todos os materiais até o grupo. Base para 10 convidados, durante a semana.",
    fontsize=10.5, fontname="lib", fontfile=LF+"LiberationSans-Regular.ttf",
    color=(0.431, 0.388, 0.357), lineheight=1.5)

# unified investment — o mesmo valor nas duas opções (não são planos diferentes)
put_spaced(p3, "✦ INVESTIMENTO", 54, 270, 9, CORAL_RGB, FSB)
put(p3, "R$ 289", FB, 30, NEARBLK, 54, 304)
put(p3, "por pessoa · imersão de 4 horas", FS, 11, MUTED, 54+FB.text_length("R$ 289", 30)+14, 304)
put(p3, "O mesmo valor nas duas opções — você escolhe só onde acontece.",
    FI, 10.5, (0.5, 0.45, 0.42), 54, 325)

# two option cards (só o local muda — sem preço repetido)
HEADc="#3F2F2C"; MUTc="#8C7E74"; BODYc="#4A3F3A"; CORALc="#FF5E8A"; GOLDc="#B8912E"; CREAMc="#FBF6EF"
OPTS = [
    dict(name="No seu espaço", tag="Salão do condomínio, casa ou escritório.",
         badge="SEM CUSTO DE ESPAÇO", kind="highlight",
         bullets=["Levamos o profissional e toda a estrutura",
                  "Essências, materiais e frasco inclusos",
                  "Sem custo de espaço",
                  "Cada convidado leva o seu perfume"]),
    dict(name="Em espaço parceiro", tag="Ambiente lindo, tudo preparado.",
         badge="ESPAÇO INCLUSO", kind="dark",
         bullets=["No BETC Havas Café ou Jules L'Art Du Pain",
                  "Essências, materiais e frasco inclusos",
                  "Cada convidado leva o seu perfume",
                  "Jules sem custo · BETC consumação mín. R$&nbsp;50"]),
]
CX = [54, 300]; CW = 241; CY0, CY1 = 352, 488
for i, t in enumerate(OPTS):
    card = fitz.Rect(CX[i], CY0, CX[i]+CW, CY1)
    if t["kind"] == "highlight":
        p3.draw_rect(card, color=(1, 0.3686, 0.5412), fill=(1, 1, 1), width=1.6, radius=0.05)
        head, mut, body, acc, price_c = HEADc, MUTc, BODYc, CORALc, "#8C7E74"
    else:
        p3.draw_rect(card, color=None, fill=(0.82, 0.306, 0.447), radius=0.05)
        head, mut, body, acc, price_c = CREAMc, "#F0D9DF", "#FBEDF0", GOLDc, "#F0D9DF"
    bw = FSB.text_length(t["badge"], 6.6) + 0.8*(len(t["badge"])-1) + 18
    bx = CX[i] + (CW-bw)/2
    bcol = (1, 0.3686, 0.5412) if t["kind"] == "highlight" else (0.72, 0.55, 0.22)
    p3.draw_rect(fitz.Rect(bx, CY0-9.5, bx+bw, CY0+9.5), color=None, fill=bcol, radius=0.5)
    put_spaced(p3, t["badge"], bx+9, CY0+2.7, 6.6, (1, 1, 1), FSB, track=0.8)
    lis = "".join(f'<div class="li"><span class="mk">◆</span>&nbsp;{b}</div>' for b in t["bullets"])
    html = (f'<div class="nm">{t["name"]}</div><div class="tg">{t["tag"]}</div>'
            f'<div class="sp">&nbsp;</div>{lis}')
    css = (f'.nm{{font-family:serif;font-size:19px;font-weight:bold;color:{head}}}'
           f'.tg{{font-size:8.5px;color:{mut};margin-top:4px}}'
           f'.sp{{font-size:5px;line-height:0.6}}'
           f'.li{{font-size:9px;color:{body};margin-top:9px;line-height:1.3}}'
           f'.mk{{color:{acc};font-size:7px}}')
    p3.insert_htmlbox(fitz.Rect(card.x0+16, card.y0+16, card.x1-14, card.y1-12), html, css=css)
# partner venues strip (option 2 acontece aqui)
put_spaced(p3, "✦ ESPAÇOS PARCEIROS", 54, 512, 9, CORAL_RGB, FSB)
put(p3, "onde a opção parceira acontece", FSER, 11, MUTED, 232, 512)
photo(p3, A_DIR+"betchavas.jpg", (54, 524, 294, 640), vbias=0.42)
put(p3, "BETC Havas Café", FSB, 10.5, DARKt, 54, 656)
put(p3, "consumação mínima de R$ 50", FS, 8.2, MUTED, 54+FSB.text_length("BETC Havas Café", 10.5)+10, 656)
photo(p3, A_DIR+"julescampobelo.jpg", (300, 524, 541, 640), vbias=0.5)
put(p3, "Jules L'Art Du Pain", FSB, 10.5, DARKt, 300, 656)
put(p3, "sem custo de espaço", FS, 8.2, MUTED, 300+FSB.text_length("Jules L'Art Du Pain", 10.5)+10, 656)
put(p3, "Base para 10 convidados · durante a semana · valor por pessoa nas duas opções.",
    FS, 7.8, (0.549, 0.494, 0.455), 54, 686)
# header tagline (top-right) + footer
rm(p3, [(410, 62, 541, 77), (458, 793, 543, 803)])
put_right(p3, "A SUA EXPERIÊNCIA", FS, 8.6, MUTED, 541.4, 72)
put_right(p3, "Investimento", FS, 7.9, MUTED, 541.4, 801.0)

# ================= PAGE 4 — PRÓXIMO PASSO / CONTATO =================
p4 = d[3]
# intro
retext(p4, (52, 171, 482, 214),
       "Personalizamos cada detalhe com vocês — data, menu de aromas e lista de convidados. "
       "A experiência vai até onde você preferir, com toda a energia da Elarah.",
       10.5, width_rect=(53.8, 173, 478, 232))
# heading
rm(p4, [(53, 129, 327, 165)])
put(p4, "Bora marcar essa ", FB, 27, NEARBLK, 53.8, 157.5)
put(p4, "data?", FBI, 27, CORAL_RGB, 53.8+FB.text_length("Bora marcar essa ", 27), 157.5)
# inspiração line
rm(p4, [(53, 229, 300, 249)])
put_spaced(p4, "✦ INSPIRAÇÃO", 53.8, 244.5, 8.2, CORAL_RGB, FSB, track=1.5)
put(p4, "Como o seu dia pode ser", FSER, 14.2, NEARBLK, 149.4, 244.5)
# two inspiration photos (equal)
photo(p4, A_DIR+"aniv-decor.jpg", (52, 257, 294, 481), vbias=0.45)
photo(p4, A_DIR+"perfumariadecor.jpg", (302, 257, 542, 481), vbias=0.45)
# banner headline
rm(p4, [(76, 534, 487, 559), (76, 561, 432, 598)])
x = 77.8
put(p4, "Uma tarde que vocês vão ", FB, 20.2, CREAM, x, 553.5)
put(p4, "lembrar para sempre", FBI, 20.2, GOLD, x+FB.text_length("Uma tarde que vocês vão ", 20.2), 553.5)
put(p4, "Do primeiro aroma à última risada — cuidamos de cada detalhe",
    FI, 9.8, (0.835, 0.788, 0.733), 77.8, 576.5)
put(p4, "para que o encontro seja tão especial quanto inesquecível.",
    FI, 9.8, (0.835, 0.788, 0.733), 77.8, 593.0)
# disclaimer + footer
rm(p4, [(434, 793, 543, 803), (50, 655, 745, 686)])
p4.insert_textbox(fitz.Rect(53.8, 655, 538, 690),
    "Valor por pessoa: R$ 289. Imersão de 4 horas, com apostila, matérias-primas e frasco "
    "inclusos. Proposta válida mediante confirmação de data.",
    fontsize=7.9, fontname="lib", fontfile=LF+"LiberationSans-Regular.ttf",
    color=(0.549, 0.494, 0.455), lineheight=1.35)
put_right(p4, "Experiência Elarah · 2026", FS, 7.9, MUTED, 541.4, 801.0)

d.save(OUT, garbage=4, deflate=True)
print("saved", OUT)
r2 = fitz.open(OUT)
for i in range(r2.page_count):
    r2[i].get_pixmap(dpi=115).save(f"/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/pf_p{i+1}.png")
print("rendered", r2.page_count)
