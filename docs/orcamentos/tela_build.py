"""Pintura em Tela no Sítio — dia de arte + brunch (20 pessoas, 12/09, 10h-15h).
São Lourenço da Serra. Transporte por conta do grupo. Opção de trazer uma foto
para virar quadro + registro fotográfico profissional. Valores: R$ 199 (só a
experiência) / R$ 259 (com brunch). Elarah coral-rosa. Foto do sítio pendente."""
import fitz, io, sys
from PIL import Image

SRC = "/root/.claude/uploads/9abf7e9a-5852-5ed9-badc-3da0f14e2577/d2b59d51-Pintura_em_Taca_Elarah_1.pdf"
OUT = sys.argv[1] if len(sys.argv) > 1 else "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/Tela_final.pdf"
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
put(p1, "Pintura", FB, 40, CORAL_RGB, 70, 350)
put(p1, "em Tela", FB, 40, CORAL_RGB, 70, 393)
put(p1, "um dia de arte no sítio", FI, 18.5, DARKt, 70.9, 425)
p1.draw_rect(fitz.Rect(70.9, 445, 116, 447.2), color=None, fill=CORAL_RGB)
BODY = ('<p>Um dia de arte ao ar livre pra reunir o grupo: cada convidado pinta a sua '
        '<b style="color:#FF5E8A">tela autoral</b> — do jeito que quiser, ou a partir de uma foto '
        'que traz de casa. Com brunch, ao ar livre, no sítio. '
        '<b style="color:#FF5E8A">A Elarah leva tudo até vocês — é só criar e curtir.</b></p>')
p1.insert_htmlbox(fitz.Rect(70.9, 462, 302, 592), BODY,
                  css="p{margin:0;font-family:sans-serif;font-size:10.5px;line-height:1.5;color:#3F2F2C}")
photo(p1, A_DIR+"tintaevinhocool.jpg", (315.8, 295.5, 524.2, 555.0), vbias=0.4)
rm(p1, [(66, 752, 548, 771)])
f1 = "EXPERIÊNCIA ELARAH  ·  PINTURA EM TELA  ·  "
put_spaced(p1, f1, 70.9, 766.5, 8.25, DARKt, FS, track=2.4)
fx = 70.9 + sum(FS.text_length(c, 8.25)+2.4 for c in f1)
put_spaced(p1, "POR PESSOA", fx, 766.5, 8.25, CORAL_RGB, FSB, track=2.4)

# ================= PAGE 2 — A EXPERIÊNCIA =================
p2 = d[1]
rm(p2, [(52, 113, 235, 128)])
put_spaced(p2, "✦ A ESTRELA DO ENCONTRO", 53.8, 124.2, 8.6, CORAL_RGB, FSB, track=2.4)
rm(p2, [(52, 128, 330, 168)])
put(p2, "Artista por ", FB, 27, NEARBLK, 53.8, 156.2)
put(p2, "um dia", FBI, 27, CORAL_RGB, 53.8+FB.text_length("Artista por ", 27), 156.2)
retext(p2, (52, 171, 505, 250),
       "Aqui cada convidado vira artista por um dia: pinta a própria tela, do zero, e leva "
       "pra casa a sua obra. Pode criar livremente ou trazer uma foto pra transformar em quadro. "
       "Uma experiência leve e relaxante, ao ar livre — o ateliê vai até o sítio, com tudo pronto.",
       10.5, width_rect=(53.8, 173, 505, 268))
rm(p2, [(40, 258, 558, 404)])
p2.draw_rect(fitz.Rect(40, 256, 558, 404), color=None, fill=CREAMbg)
put_spaced(p2, "✦ O QUE ESTÁ INCLUSO", 53.8, 292, 9, CORAL_RGB, FSB)
put(p2, "Tudo pronto ", FB, 18, NEARBLK, 53.8, 316)
put(p2, "pra criar", FI, 18, CORAL_RGB, 53.8+FB.text_length("Tudo pronto ", 18), 316)
INCL = [
    ("Telas, tintas e cavaletes", "todos os materiais inclusos"),
    ("Facilitadora dedicada", "conduz e ajuda cada convidado"),
    ("Cada um leva a sua obra", "a tela autoral, pra levar pra casa"),
    ("Traga uma foto", "e transforme em um quadro personalizado"),
]
for j, (a, b) in enumerate(INCL):
    yy = 348 + j*15.5
    p2.draw_circle((62, yy-2.6), 2.2, color=None, fill=CORAL_RGB)
    put(p2, a, FSB, 9.6, (0.29, 0.24, 0.22), 74, yy)
    put(p2, "— "+b, FS, 9.3, (0.5, 0.45, 0.42), 74+FSB.text_length(a, 9.6)+6, yy)
_VW = 157.2
for _pth, _x0, _vb in [("pintura.jpg", 51.8, 0.4), ("atelieleroy-2.jpg", 218.0, 0.5), ("quadropintado.jpg", 384.3, 0.55)]:
    photo(p2, A_DIR+_pth, (_x0, 436.5, _x0+_VW, 612.8), vbias=_vb)
rm(p2, [(98, 640, 500, 684)])
put(p2, "Não é só pintar — é criar, relaxar e levar pra casa a sua obra.", FI, 12.8, CREAM, 100.7, 658.5)
put(p2, "Um dia ao ar livre que vira memória (e quadro).", FB, 12.4, GOLD, 100.7, 678.0)
rm(p2, [(458, 793, 543, 803)])
put_right(p2, "Experiência Elarah", FS, 7.9, MUTED, 541.4, 801.0)

# ================= PAGE 3 — O SÍTIO + INVESTIMENTO =================
p3 = d[2]
rm(p3, [(40, 110, 560, 772)])
p3.draw_rect(fitz.Rect(40, 110, 558, 772), color=None, fill=CREAMbg)
put_spaced(p3, "✦ ONDE ACONTECE", 54, 148, 9, CORAL_RGB, FSB)
put(p3, "No sítio, ", FB, 25, NEARBLK, 54, 181)
put(p3, "ao ar livre", FI, 25, CORAL_RGB, 54+FB.text_length("No sítio, ", 25), 181)
p3.insert_textbox(fitz.Rect(54, 196, 541, 236),
    "Um dia de arte no sítio, em São Lourenço da Serra. A Elarah leva o profissional, "
    "as telas e todos os materiais — vocês cuidam do transporte e só curtem o dia.",
    fontsize=10.5, fontname="lib", fontfile=LF+"LiberationSans-Regular.ttf",
    color=(0.431, 0.388, 0.357), lineheight=1.5)
# sítio photo — pendente: placeholder + detalhes do encontro ao lado
sr = fitz.Rect(54, 252, 300, 404)
p3.draw_rect(sr, color=(0.86, 0.62, 0.70), fill=(0.988, 0.945, 0.95), width=1.1, radius=0.03,
             dashes="[4 3] 0")
_pw = FS.text_length("FOTO DO SÍTIO EM BREVE", 9) + 3.2*21
put_spaced(p3, "FOTO DO SÍTIO EM BREVE", sr.x0+(sr.width-_pw)/2, 330, 9, (0.72, 0.45, 0.55), FS, track=3.2)
put(p3, "Sítio · São Lourenço da Serra", FSB, 9.5, DARKt, 54, 420)
# detalhes do encontro (à direita)
put_spaced(p3, "✦ O ENCONTRO", 320, 268, 9, CORAL_RGB, FSB)
DET = [("Data", "12 de setembro"), ("Horário", "das 10h às 15h"),
       ("Grupo", "20 pessoas"), ("Duração", "5 horas de experiência")]
for j, (k, v) in enumerate(DET):
    yy = 296 + j*27
    put(p3, k.upper(), FSB, 7.6, CORAL_RGB, 320, yy)
    put(p3, v, FSER, 13, NEARBLK, 320, yy+15)
    p3.draw_line((320, yy+22), (528, yy+22), color=(0.9, 0.86, 0.83), width=0.6)
# ---- INVESTIMENTO (dois valores: só a experiência x com brunch) ----
put_spaced(p3, "✦ INVESTIMENTO", 54, 452, 9, CORAL_RGB, FSB)
put(p3, "por pessoa · você escolhe", FSER, 11, MUTED, 174, 452)
HEADc="#3F2F2C"; MUTc="#8C7E74"; BODYc="#4A3F3A"; CORALc="#FF5E8A"; GOLDc="#B8912E"; CREAMc="#FBF6EF"
OPTS = [
    dict(name="Só a experiência", price="199", tag="A pintura, com tudo incluso.", kind="plain",
         bullets=["Pintura em tela — livre ou a partir de foto",
                  "Telas, tintas, cavaletes e facilitadora",
                  "Cada um leva a sua obra pra casa"]),
    dict(name="Com brunch", price="259", tag="A experiência + brunch no sítio.", kind="dark",
         badge="O MAIS QUERIDINHO",
         bullets=["Tudo da experiência de pintura",
                  "Brunch completo, servido no sítio",
                  "Cada um leva a sua obra pra casa"]),
]
CX = [54, 300]; CW = 241; CY0, CY1 = 476, 636
for i, t in enumerate(OPTS):
    card = fitz.Rect(CX[i], CY0, CX[i]+CW, CY1)
    if t["kind"] == "plain":
        p3.draw_rect(card, color=(0.906, 0.863, 0.796), fill=(1, 1, 1), width=1.2, radius=0.05)
        head, mut, body, acc = HEADc, MUTc, BODYc, CORALc
    else:
        p3.draw_rect(card, color=None, fill=(0.82, 0.306, 0.447), radius=0.05)
        head, mut, body, acc = CREAMc, "#F0D9DF", "#FBEDF0", GOLDc
    if t.get("badge"):
        bw = FSB.text_length(t["badge"], 6.6) + 0.8*(len(t["badge"])-1) + 18
        bx = CX[i] + (CW-bw)/2
        p3.draw_rect(fitz.Rect(bx, CY0-9.5, bx+bw, CY0+9.5), color=None, fill=(0.72, 0.55, 0.22), radius=0.5)
        put_spaced(p3, t["badge"], bx+9, CY0+2.7, 6.6, (1, 1, 1), FSB, track=0.8)
    lis = "".join(f'<div class="li"><span class="mk">◆</span>&nbsp;{b}</div>' for b in t["bullets"])
    html = (f'<div class="nm">{t["name"]}</div><div class="tg">{t["tag"]}</div>'
            f'<div class="pr">R$&nbsp;{t["price"]}</div><div class="pp">POR PESSOA</div>{lis}')
    css = (f'.nm{{font-family:serif;font-size:18px;font-weight:bold;color:{head}}}'
           f'.tg{{font-size:8px;color:{mut};margin-top:3px}}'
           f'.pr{{font-family:serif;font-size:23px;font-weight:bold;color:{head};margin-top:9px}}'
           f'.pp{{font-size:6.5px;color:{mut};letter-spacing:1px}}'
           f'.li{{font-size:8.4px;color:{body};margin-top:6px;line-height:1.3}}'
           f'.mk{{color:{acc};font-size:6.5px}}')
    p3.insert_htmlbox(fitz.Rect(card.x0+15, card.y0+15, card.x1-13, card.y1-9), html, css=css)
# foto profissional add-on + nota
p3.draw_rect(fitz.Rect(54, 652, 541, 694), color=(0.906, 0.863, 0.796), fill=(1, 1, 1), width=1, radius=0.05)
p3.draw_rect(fitz.Rect(54, 652, 60, 694), color=None, fill=CORAL_RGB)
put_spaced(p3, "✦ OPCIONAL", 78, 670, 8, CORAL_RGB, FSB)
put(p3, "Registro fotográfico profissional", FB, 12.5, NEARBLK, 78, 688)
put_right(p3, "valor sob consulta", FI, 10.5, MUTED, 528, 686)
put(p3, "Valores por pessoa · transporte por conta do grupo · proposta para 12 de setembro.",
    FS, 7.8, (0.549, 0.494, 0.455), 54, 712)
rm(p3, [(410, 62, 541, 77), (458, 793, 543, 803)])
put_right(p3, "O SÍTIO · INVESTIMENTO", FS, 8.6, MUTED, 541.4, 72)
put_right(p3, "Investimento", FS, 7.9, MUTED, 541.4, 801.0)

# ================= PAGE 4 — PRÓXIMO PASSO / CONTATO =================
p4 = d[3]
retext(p4, (52, 171, 482, 214),
       "Personalizamos cada detalhe com vocês — data, tema das telas e lista de convidados. "
       "E dá pra repetir todo mês: a cada encontro, um novo dia de arte no sítio.",
       10.5, width_rect=(53.8, 173, 486, 232))
rm(p4, [(53, 129, 327, 165)])
put(p4, "Bora marcar essa ", FB, 27, NEARBLK, 53.8, 157.5)
put(p4, "data?", FBI, 27, CORAL_RGB, 53.8+FB.text_length("Bora marcar essa ", 27), 157.5)
rm(p4, [(53, 229, 300, 249)])
put_spaced(p4, "✦ INSPIRAÇÃO", 53.8, 244.5, 8.2, CORAL_RGB, FSB, track=1.5)
put(p4, "Como o seu dia pode ser", FSER, 14.2, NEARBLK, 149.4, 244.5)
photo(p4, A_DIR+"pinturaportaretrato.jpg", (52, 257, 294, 481), vbias=0.5)
photo(p4, A_DIR+"ojardim4.jpg", (302, 257, 542, 481), vbias=0.5)
rm(p4, [(76, 534, 487, 559), (76, 561, 432, 598)])
x = 77.8
put(p4, "Uma tarde que vocês vão ", FB, 20.2, CREAM, x, 553.5)
put(p4, "lembrar para sempre", FBI, 20.2, GOLD, x+FB.text_length("Uma tarde que vocês vão ", 20.2), 553.5)
put(p4, "Do primeiro traço à última risada — cuidamos de cada detalhe",
    FI, 9.8, (0.835, 0.788, 0.733), 77.8, 576.5)
put(p4, "para que o dia seja tão especial quanto inesquecível.",
    FI, 9.8, (0.835, 0.788, 0.733), 77.8, 593.0)
rm(p4, [(434, 793, 543, 803), (50, 655, 745, 686)])
p4.insert_textbox(fitz.Rect(53.8, 655, 538, 690),
    "Valores por pessoa: R$ 199 (só a experiência) ou R$ 259 (com brunch). Registro fotográfico "
    "opcional. Transporte por conta do grupo. Proposta válida mediante confirmação de data.",
    fontsize=7.9, fontname="lib", fontfile=LF+"LiberationSans-Regular.ttf",
    color=(0.549, 0.494, 0.455), lineheight=1.35)
put_right(p4, "Experiência Elarah · 2026", FS, 7.9, MUTED, 541.4, 801.0)

d.save(OUT, garbage=4, deflate=True)
print("saved", OUT)
r2 = fitz.open(OUT)
for i in range(r2.page_count):
    r2[i].get_pixmap(dpi=115).save(f"/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/te_p{i+1}.png")
print("rendered", r2.page_count)
