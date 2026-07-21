"""Transform the Pintura em Taça proposal:
- accent burnt-orange -> festive coral-pink (#FF5E8A)
- lighten the dark cover + banners (happy/bright)
- remove '20 / vinte anos', personalise to Isa ('Parabéns, Isa! ... venha comemorar')
Phase A here = accent recolor + logo recolor. Later phases add lightening + text."""
import fitz, io, sys
from PIL import Image

SRC = "/root/.claude/uploads/9abf7e9a-5852-5ed9-badc-3da0f14e2577/d2b59d51-Pintura_em_Taca_Elarah_1.pdf"
OUT = sys.argv[1] if len(sys.argv) > 1 else "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/Taca_Isa_final.pdf"
CORAL = "1 .3686 .5412"   # #FF5E8A

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

# ---- PAGE 1: replace the '20 / vinte anos' headline + reword body ----
p1 = d[0]
rm(p1, [(64, 286, 252, 410),      # the big '20' (below the coral eyebrow at y274-284)
        (70, 401, 252, 456),      # 'vinte anos — bora celebrar!'
        (70, 476, 305, 592)])     # body paragraph
put(p1, "Parabéns, Isa!", FB, 34, CORAL_RGB, 70, 360)
put(p1, "vem comemorar!", FI, 26, DARKt, 70.9, 405)
BODY = ('<p>O seu aniversário pede uma festa à altura: '
        '<b style="color:#FF5E8A">diferente, animada e inesquecível</b>. '
        'A pintura em taça é o ponto de partida — e a partir daí a gente '
        'transforma o seu dia numa experiência única. '
        '<b style="color:#FF5E8A">Você escolhe o clima, a Elarah faz acontecer.</b></p>')
p1.insert_htmlbox(fitz.Rect(70.9, 478, 300, 592), BODY,
                  css="p{margin:0;font-family:sans-serif;font-size:10.5px;line-height:1.5;color:#3F2F2C}")

# ---- PAGE 2 footer ----
p2 = d[1]
rm(p2, [(458, 793, 543, 803)])
put_right(p2, "Aniversário da Isa", FS, 7.9, MUTED, 541.4, 801.0)

# ---- PAGE 3: keep only 'por pessoa' (remove 'TOTAL PARA 12 CONVIDADAS' + value + divider) ----
p3 = d[2]
rm(p3, [(327, 359, 492, 405)])                                   # total label + R$ 3.456
p3.draw_rect(fitz.Rect(328, 350.5, 521, 355), color=None, fill=(0.82, 0.306, 0.447))  # hide divider

# ---- PAGE 3: add 'Onde acontece' — two venue options (Aretha & BETC) ----
FSB = fitz.Font(fontfile=LF+"LiberationSans-Bold.ttf")
A_DIR = "/home/user/elarahplatform/assets/"
def crop_ratio(path, ratio, vbias=0.5):
    im = Image.open(path).convert("RGB"); W, H = im.size
    if W/H > ratio:
        cw = round(H*ratio); l = (W-cw)//2; im = im.crop((l, 0, l+cw, H))
    else:
        ch = round(W/ratio); t = round((H-ch)*vbias); im = im.crop((0, t, W, t+ch))
    return im
def put_spaced(page, text, x, y, size, color, font, track=1.9):
    tw = fitz.TextWriter(page.rect); cx = x
    for ch in text:
        tw.append((cx, y), ch, font=font, fontsize=size); cx += font.text_length(ch, size)+track
    tw.write_text(page, color=color)
def venue(page, path, rect, name, vbias=0.5):
    r = fitz.Rect(rect)
    im = crop_ratio(path, r.width/r.height, vbias)
    b = io.BytesIO(); im.save(b, format="JPEG", quality=90)
    page.insert_image(r, stream=b.getvalue())
    put(page, name, FSB, 11, DARKt, r.x0, r.y1+16)

put_spaced(p3, "✦ ONDE ACONTECE", 53.8, 512, 9, CORAL_RGB, FSB)
put(p3, "Escolha o seu ", FB, 20, (0.118,0.086,0.098), 53.8, 543)
put(p3, "local", FI, 20, CORAL_RGB, 53.8+FB.text_length("Escolha o seu ", 20), 543)
GRID_Y = 566
venue(p3, A_DIR+"arethasoulkitchen.jpg", (53.8, GRID_Y, 293, GRID_Y+150), "Aretha Soul Kitchen")
venue(p3, A_DIR+"betchavas.jpg",         (301, GRID_Y, 541, GRID_Y+150), "BETC", vbias=0.42)

# ---- PAGE 4 banner headline + footer ----
p4 = d[3]
rm(p4, [(76, 534, 487, 559), (434, 793, 543, 803)])
x = 77.8
put(p4, "Uma festa pra Isa ", FB, 20.2, CREAM, x, 553.5)
x += FB.text_length("Uma festa pra Isa ", 20.2)
put(p4, "lembrar para sempre", FBI, 20.2, GOLD, x, 553.5)
put_right(p4, "Aniversário da Isa · 2026", FS, 7.9, MUTED, 541.4, 801.0)

d.save(OUT, garbage=4, deflate=True)
print("saved", OUT)
r2 = fitz.open(OUT)
for i in range(r2.page_count):
    r2[i].get_pixmap(dpi=100).save(f"/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/tz_p{i+1}.png")
print("rendered")
