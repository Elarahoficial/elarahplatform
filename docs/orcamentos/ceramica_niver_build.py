"""Aniversário na Cerâmica — 5 mulheres, mês de agosto. Modelagem à mão + pintura,
cada uma leva a sua peça. Dois lugares: Ateliê de cerâmica ou Jules L'Art Du Pain
(padaria em Campo Belo). Valores por pessoa sob consulta (Elara adiciona). Coral."""
import fitz, io, sys
from PIL import Image

SRC = "/root/.claude/uploads/9abf7e9a-5852-5ed9-badc-3da0f14e2577/d2b59d51-Pintura_em_Taca_Elarah_1.pdf"
OUT = sys.argv[1] if len(sys.argv) > 1 else "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/Ceramica_niver.pdf"
CORAL = "1 .3686 .5412"
A_DIR = "/home/user/elarahplatform/assets/"

d = fitz.open(SRC)

ACCENT_SRCS = [".949 .4078 .2353", "1 .4784 .349"]
for pi in range(d.page_count):
    for x in d[pi].get_contents():
        s = d.xref_stream(x).decode("latin-1"); orig = s
        for src in ACCENT_SRCS:
            s = s.replace(src, CORAL)
        if s != orig:
            d.update_stream(x, s.encode("latin-1"))

logo_xref = [i[0] for i in d[0].get_images(full=True)
             if d.extract_image(i[0])["width"] == 727][0]
sm = fitz.Pixmap(d, d.extract_image(logo_xref)["smask"])
alpha = Image.frombytes("L", (sm.width, sm.height), sm.samples).resize((727, 227))
coral = Image.new("RGBA", (727, 227), (255, 94, 138, 255)); coral.putalpha(alpha)
bio = io.BytesIO(); coral.save(bio, format="PNG")
d[0].replace_image(logo_xref, stream=bio.getvalue())

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
put(p1, "Cerâmica", FB, 40, CORAL_RGB, 70, 350)
put(p1, "à mão", FB, 40, CORAL_RGB, 70, 393)
put(p1, "um niver pra criar e celebrar", FI, 17.5, DARKt, 70.9, 425)
p1.draw_rect(fitz.Rect(70.9, 445, 116, 447.2), color=None, fill=CORAL_RGB)
BODY = ('<p>Um aniversário diferente pra reunir as amigas: cada uma modela a sua '
        '<b style="color:#FF5E8A">peça de cerâmica à mão</b>, pinta do seu jeito e leva pra casa '
        'de lembrança. Uma experiência sensorial e relaxante — '
        '<b style="color:#FF5E8A">a Elarah cuida de tudo, num espaço lindo só pra vocês.</b></p>')
p1.insert_htmlbox(fitz.Rect(70.9, 462, 302, 592), BODY,
                  css="p{margin:0;font-family:sans-serif;font-size:10.5px;line-height:1.5;color:#3F2F2C}")
photo(p1, A_DIR+"ceramica.jpg", (315.8, 295.5, 524.2, 555.0), vbias=0.4)
rm(p1, [(66, 752, 548, 771)])
f1 = "EXPERIÊNCIA ELARAH  ·  CERÂMICA  ·  "
put_spaced(p1, f1, 70.9, 766.5, 8.25, DARKt, FS, track=2.4)
fx = 70.9 + sum(FS.text_length(c, 8.25)+2.4 for c in f1)
put_spaced(p1, "POR PESSOA", fx, 766.5, 8.25, CORAL_RGB, FSB, track=2.4)

# ================= PAGE 2 — A EXPERIÊNCIA =================
p2 = d[1]
rm(p2, [(52, 113, 235, 128)])
put_spaced(p2, "✦ A ESTRELA DO ENCONTRO", 53.8, 124.2, 8.6, CORAL_RGB, FSB, track=2.4)
rm(p2, [(52, 128, 330, 168)])
put(p2, "Ceramista por ", FB, 27, NEARBLK, 53.8, 156.2)
put(p2, "um dia", FBI, 27, CORAL_RGB, 53.8+FB.text_length("Ceramista por ", 27), 156.2)
retext(p2, (52, 171, 505, 250),
       "Aqui cada convidada vira ceramista por um dia: molda a própria peça de cerâmica à mão, "
       "pinta do seu jeito e leva pra casa a sua criação. Uma experiência sensorial, relaxante e "
       "cheia de significado — perfeita pra celebrar entre amigas, com tudo pronto pra vocês.",
       10.5, width_rect=(53.8, 173, 505, 268))
rm(p2, [(40, 258, 558, 404)])
p2.draw_rect(fitz.Rect(40, 256, 558, 404), color=None, fill=CREAMbg)
put_spaced(p2, "✦ O QUE ESTÁ INCLUSO", 53.8, 292, 9, CORAL_RGB, FSB)
put(p2, "Tudo pronto ", FB, 18, NEARBLK, 53.8, 316)
put(p2, "pra criar", FI, 18, CORAL_RGB, 53.8+FB.text_length("Tudo pronto ", 18), 316)
INCL = [
    ("Argila e todos os materiais", "tudo incluso, é só colocar a mão na massa"),
    ("Condução por ceramista", "acompanha e ajuda cada convidada"),
    ("Modelagem à mão + pintura", "molde a sua peça e pinte do seu jeito"),
    ("A sua peça é sua", "finalizada e entregue depois da queima"),
]
for j, (a, b) in enumerate(INCL):
    yy = 348 + j*15.5
    p2.draw_circle((62, yy-2.6), 2.2, color=None, fill=CORAL_RGB)
    put(p2, a, FSB, 9.6, (0.29, 0.24, 0.22), 74, yy)
    put(p2, "— "+b, FS, 9.3, (0.5, 0.45, 0.42), 74+FSB.text_length(a, 9.6)+6, yy)
_VW = 157.2
for _pth, _x0, _vb in [("ceramicamodelagem.jpg", 51.8, 0.45), ("ceramica1.jpg", 218.0, 0.5), ("ceramica2.jpg", 384.3, 0.5)]:
    photo(p2, A_DIR+_pth, (_x0, 436.5, _x0+_VW, 612.8), vbias=_vb)
rm(p2, [(98, 640, 500, 684)])
put(p2, "Não é só cerâmica — é criar com as mãos e celebrar junto.", FI, 12.8, CREAM, 100.7, 658.5)
put(p2, "Um niver que vira memória (e peça pra guardar pra sempre).", FB, 12.0, GOLD, 100.7, 678.0)
rm(p2, [(458, 793, 543, 803)])
put_right(p2, "Experiência Elarah", FS, 7.9, MUTED, 541.4, 801.0)

# ================= PAGE 3 — O SÍTIO + INVESTIMENTO =================
p3 = d[2]
rm(p3, [(40, 110, 560, 772)])
p3.draw_rect(fitz.Rect(40, 110, 558, 772), color=None, fill=CREAMbg)
put_spaced(p3, "✦ ONDE ACONTECE", 54, 148, 9, CORAL_RGB, FSB)
put(p3, "Escolha o seu ", FB, 25, NEARBLK, 54, 181)
put(p3, "lugar", FI, 25, CORAL_RGB, 54+FB.text_length("Escolha o seu ", 25), 181)
p3.insert_textbox(fitz.Rect(54, 196, 541, 236),
    "Não precisa ter local — a Elarah recebe vocês. Escolha entre os nossos ateliês parceiros "
    "ou o charme do Jules, a padaria em Campo Belo. É só chegar e criar.",
    fontsize=10.5, fontname="lib", fontfile=LF+"LiberationSans-Regular.ttf",
    color=(0.431, 0.388, 0.357), lineheight=1.5)
# dois espaços (fotos)
photo(p3, A_DIR+"torno.jpg", (54, 250, 294, 388), vbias=0.5)
put(p3, "Ateliês de Cerâmica", FSB, 10.5, DARKt, 54, 404)
put(p3, "modelagem à mão, no ateliê", FS, 8.2, MUTED, 54, 417)
photo(p3, A_DIR+"julescampobelo.jpg", (300, 250, 541, 388), vbias=0.5)
put(p3, "Jules L'Art Du Pain", FSB, 10.5, DARKt, 300, 404)
put(p3, "a padaria charmosa em Campo Belo", FS, 8.2, MUTED, 300, 417)
# endereços dos espaços parceiros
put_spaced(p3, "✦ NOSSOS ESPAÇOS", 54, 448, 9, CORAL_RGB, FSB)
p3.draw_line((54, 464), (541, 464), color=(0.9, 0.86, 0.83), width=0.6)
ADDR = [("Vila Mariana", "Rua França Pinto, 421"),
        ("Brooklin", "Rua Indiana, 669"),
        ("Praça da Árvore", "Rua das Rosas, 310 · casa 2"),
        ("Jules · Campo Belo", "a padaria (foto acima)")]
for j, (k, v) in enumerate(ADDR):
    xx = 54 + (j % 2)*250; yy = 484 + (j // 2)*25
    put(p3, k, FSB, 9.2, CORAL_RGB, xx, yy)
    put(p3, v, FS, 9.0, (0.4, 0.36, 0.34), xx, yy+13)
p3.draw_line((54, 540), (541, 540), color=(0.9, 0.86, 0.83), width=0.6)
# investimento (a partir de R$ 199 · modelagem)
p3.draw_rect(fitz.Rect(54, 560, 541, 640), color=(0.906, 0.863, 0.796), fill=(1, 1, 1), width=1.2, radius=0.05)
p3.draw_rect(fitz.Rect(54, 560, 60, 640), color=None, fill=CORAL_RGB)
put_spaced(p3, "✦ INVESTIMENTO · MODELAGEM EM CERÂMICA", 80, 586, 9, CORAL_RGB, FSB)
put(p3, "A partir de ", FB, 16, NEARBLK, 80, 614)
_ax = 80 + FB.text_length("A partir de ", 16)
put(p3, "R$ 199", FB, 22, CORAL_RGB, _ax, 614)
put(p3, "por pessoa", FS, 10, MUTED, _ax + FB.text_length("R$ 199", 22) + 8, 614)
put_right(p3, "5 mulheres · mês de agosto", FS, 9, MUTED, 528, 612)
put(p3, "Inclui a argila, os materiais, a condução e a queima da peça. Valor final conforme o espaço escolhido.",
    FS, 7.8, (0.549, 0.494, 0.455), 54, 662)
rm(p3, [(410, 62, 541, 77), (458, 793, 543, 803)])
put_right(p3, "ONDE ACONTECE · INVESTIMENTO", FS, 8.6, MUTED, 541.4, 72)
put_right(p3, "Investimento", FS, 7.9, MUTED, 541.4, 801.0)

# ================= PAGE 4 — PRÓXIMO PASSO / CONTATO =================
p4 = d[3]
retext(p4, (52, 171, 482, 214),
       "Personalizamos cada detalhe com vocês — data, o espaço e a lista de convidadas. "
       "É só escolher o dia de agosto que a Elarah cuida de todo o resto.",
       10.5, width_rect=(53.8, 173, 486, 232))
rm(p4, [(53, 129, 327, 165)])
put(p4, "Bora marcar essa ", FB, 27, NEARBLK, 53.8, 157.5)
put(p4, "data?", FBI, 27, CORAL_RGB, 53.8+FB.text_length("Bora marcar essa ", 27), 157.5)
rm(p4, [(53, 229, 300, 249)])
put_spaced(p4, "✦ INSPIRAÇÃO", 53.8, 244.5, 8.2, CORAL_RGB, FSB, track=1.5)
put(p4, "O que vocês vão levar pra casa", FSER, 14.2, NEARBLK, 149.4, 244.5)
photo(p4, A_DIR+"ceramicacool.jpg", (52, 257, 294, 481), vbias=0.5)
photo(p4, A_DIR+"pinturapratoceramica.jpg", (302, 257, 542, 481), vbias=0.5)
rm(p4, [(76, 534, 487, 559), (76, 561, 432, 598)])
x = 77.8
put(p4, "Uma tarde que vocês vão ", FB, 20.2, CREAM, x, 553.5)
put(p4, "lembrar para sempre", FBI, 20.2, GOLD, x+FB.text_length("Uma tarde que vocês vão ", 20.2), 553.5)
put(p4, "Do primeiro toque no barro à última risada — cuidamos de cada detalhe",
    FI, 9.8, (0.835, 0.788, 0.733), 77.8, 576.5)
put(p4, "para que o niver seja tão especial quanto inesquecível.",
    FI, 9.8, (0.835, 0.788, 0.733), 77.8, 593.0)
rm(p4, [(434, 793, 543, 803), (50, 655, 745, 686)])
p4.insert_textbox(fitz.Rect(53.8, 655, 538, 690),
    "Valor por pessoa a partir de R$ 199 (modelagem em cerâmica), para 5 pessoas. Inclui argila, "
    "materiais, condução e a queima da peça. Proposta válida mediante confirmação de data e espaço.",
    fontsize=7.9, fontname="lib", fontfile=LF+"LiberationSans-Regular.ttf",
    color=(0.549, 0.494, 0.455), lineheight=1.35)
put_right(p4, "Experiência Elarah · 2026", FS, 7.9, MUTED, 541.4, 801.0)

d.save(OUT, garbage=4, deflate=True)
print("saved", OUT)
r2 = fitz.open(OUT)
for i in range(r2.page_count):
    r2[i].get_pixmap(dpi=115).save(f"/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/ce_p{i+1}.png")
print("rendered", r2.page_count)
