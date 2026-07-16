"""Build the Hidratei proposal (final) from the v6 source, applying all edits.
Reproducible: needs the v6 PDF and the images under /assets."""
import fitz
from PIL import Image, ImageDraw, ImageFilter
import io, math, sys

REPO = "/home/user/elarahplatform/"
SRC = REPO + "docs/orcamentos/Experiencia_Hidratei_Elarah_v6.pdf"
OUT = sys.argv[1] if len(sys.argv) > 1 else "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/Experiencia_Hidratei_Elarah_final.pdf"
A = REPO + "assets/"
CREAM = (1.0, 0.9843, 0.9647)
ORANGE = (0.9569, 0.4863, 0.1216)

# ---------- styled photo card (white frame, rounded, shadow, tilt) ----------
def styled_png(img_path, angle_ccw, pxpt=5.0, frame=0.055, prad=0.05, crad=0.075):
    photo = Image.open(img_path).convert("RGB")
    w, h = photo.size
    s = min(w, h)
    photo = photo.crop(((w-s)//2, (h-s)//2, (w-s)//2+s, (h-s)//2+s)).resize((460, 460), Image.LANCZOS)
    P = 460
    border = int(round(frame * P)); photo_r = int(round(prad * P))
    card = P + 2*border; card_r = int(round(crad * card))
    pmask = Image.new("L", (P, P), 0); ImageDraw.Draw(pmask).rounded_rectangle([0,0,P-1,P-1], radius=photo_r, fill=255)
    card_img = Image.new("RGBA", (card, card), (0,0,0,0))
    cmask = Image.new("L", (card, card), 0); ImageDraw.Draw(cmask).rounded_rectangle([0,0,card-1,card-1], radius=card_r, fill=255)
    card_img.paste(Image.new("RGBA",(card,card),(255,255,255,255)), (0,0), cmask)
    card_img.paste(photo.convert("RGBA"), (border,border), pmask)
    pad = int(round(0.16*card))
    canvas = Image.new("RGBA", (card+2*pad, card+2*pad), (0,0,0,0))
    shmask = Image.new("L", canvas.size, 0)
    ox, oy = int(0.012*card), int(0.03*card)
    ImageDraw.Draw(shmask).rounded_rectangle([pad+ox,pad+oy,pad+ox+card-1,pad+oy+card-1], radius=card_r, fill=95)
    shmask = shmask.filter(ImageFilter.GaussianBlur(0.06*card))
    canvas.paste(Image.new("RGBA",canvas.size,(60,40,25,255)), (0,0), shmask)
    canvas.paste(card_img, (pad,pad), card_img)
    rot = canvas.rotate(angle_ccw, resample=Image.BICUBIC, expand=True)
    return rot, (card+2*pad), card

def place_card(page, img_path, center, card_pt, angle):
    rot, canvas_px, card_px = styled_png(img_path, angle)
    canvas_pt = card_pt * (canvas_px/card_px)
    ppp = canvas_px/canvas_pt
    pw, ph = rot.size[0]/ppp, rot.size[1]/ppp
    cx, cy = center
    r = fitz.Rect(cx-pw/2, cy-ph/2, cx+pw/2, cy+ph/2)
    bio = io.BytesIO(); rot.save(bio, format="PNG")
    page.insert_image(r, stream=bio.getvalue(), keep_proportion=False, overlay=True)

def crop_aspect(img, aspect, vbias=0.5, hbias=0.5):
    im = Image.open(img).convert("RGB"); W, H = im.size
    if W/H > aspect:  # too wide -> crop width
        cw = round(H*aspect); ex = W-cw; l = round(ex*hbias); im = im.crop((l,0,l+cw,H))
    else:             # too tall -> crop height
        ch = round(W/aspect); ex = H-ch; t = round(ex*vbias); im = im.crop((0,t,W,t+ch))
    return im

def pill(page, rect, text, radius=None):
    r = fitz.Rect(rect); radius = radius or r.height/2
    page.draw_rect(r, color=None, fill=(0.13,0.1,0.08), fill_opacity=0.55, radius=radius/ r.height)
    # center the label
    page.insert_textbox(fitz.Rect(r.x0, r.y0+r.height/2-5, r.x1, r.y1), text,
                        fontname="hebo", fontsize=8.2, color=(1,1,1), align=1)

doc = fitz.open(SRC)

# ======== PAGE 1 — cover ========
p1 = doc[0]
cx = [i[0] for i in p1.get_images(full=True) if doc.extract_image(i[0])["width"]>2000][0]
rect1 = p1.get_image_rects(cx)[0]; asp1 = rect1.width/rect1.height
cov = crop_aspect(A+"hidrateicapa.jpg", asp1, vbias=0.42)
cw, ch = cov.size
ov = Image.new("L", (cov.size), 0); pxo = ov.load(); split = cw*0.62
for x in range(cw):
    a = 0.60*max(0.0,(split-x)/split) if x<split else 0.0
    c = int(a*255)
    if c:
        for y in range(ch): pxo[x,y]=c
bot = Image.new("L",(cov.size),0); pb=bot.load(); bs=int(ch*0.82)
for y in range(bs,ch):
    c=int(0.45*(y-bs)/(ch-bs)*255)
    for x in range(cw): pb[x,y]=c
dark = Image.new("RGB",(cov.size),(28,20,14))
cov = Image.composite(dark, cov, ov); cov = Image.composite(dark, cov, bot)
bio=io.BytesIO(); cov.save(bio,format="JPEG",quality=90); p1.replace_image(cx, stream=bio.getvalue())

# ======== PAGE 3 — enlarge the two sticker minis (~1.5x) ========
p3 = doc[2]; F=1.5; MARGIN=12.0; PH=594.96
size_a, size_a1 = 91.5*F, 79.5*F
bbox_a = size_a*1.099
cxa = MARGIN+bbox_a/2; cya = (PH-MARGIN)-bbox_a/2
cxa1 = cxa+73.5*F*0.80; cya1 = cya-28.5*F*0.80
place_card(p3, A+"hidrateiadesivo.jpg", (cxa,cya), size_a, 6.0)
place_card(p3, A+"hidrateiadesivo1.jpg", (cxa1,cya1), size_a1, -5.0)

# ======== PAGE 4 — Option 2 photo -> bedezzled box ========
p4 = doc[3]
x101 = [i[0] for i in p4.get_images(full=True) if doc.extract_image(i[0])["width"]==1200 and doc.extract_image(i[0])["height"]==1600][0]
r4 = p4.get_image_rects(x101)[0]
im4 = crop_aspect(A+"hidrateibedezzled.jpg", r4.width/r4.height, vbias=0.62)
bio=io.BytesIO(); im4.save(bio,format="JPEG",quality=92); p4.replace_image(x101, stream=bio.getvalue())
# NOTE: xref101 is shared with page 5; page 5 gets fully redesigned below.

# ======== PAGE 5 — Option 3: three square photo cards ========
p5 = doc[4]
# cover the left photo panel with cream (page bg), on top of the old photos
p5.draw_rect(fitz.Rect(0,0,434,595.5), color=None, fill=CREAM)
# redraw the OPÇÃO 3 pill
pill(p5, (19.5,19.5,89.2,45.8), "OPÇÃO 3")
# three cards (girls collaging + collage journal + bedazzled box), cascading
place_card(p5, A+"hidrateimeninas.jpg",  (150,160), 196, -5.0)
place_card(p5, A+"hidrateicolagem.jpg",  (282,335), 205,  5.0)
place_card(p5, A+"hidrateibedezzled.jpg",(148,490), 188, -4.0)

# ======== PAGE 6 — replace clashing emojis with elegant orange numerals ========
p6 = doc[5]
emojis = {"01":(65.2,94.1,83.9,111.7),"02":(258.4,94.1,277.1,111.7),
          "03":(451.7,94.1,470.4,111.7),"04":(644.9,94.1,663.6,111.7)}
cardx0 = [40.1,233.6,426.4,619.9]
for i,(num,bb) in enumerate(emojis.items()):
    # cover the emoji glyph with the white card bg
    p6.draw_rect(fitz.Rect(bb[0]-6,88,bb[2]+30,114), color=None, fill=(1,1,1))
    # draw the numeral in brand orange serif, left-aligned like the title
    p6.insert_text(fitz.Point(cardx0[i]+12, 111), num, fontname="tibo", fontsize=20, color=ORANGE)
# remove the small chat emoji in the WhatsApp button (cover with button white)
p6.draw_rect(fitz.Rect(82,489,101,506), color=None, fill=(1,1,1))

doc.save(OUT, garbage=4, deflate=True)
print("saved", OUT)
for i in range(6):
    doc[i].get_pixmap(dpi=118).save(f"/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/f_p{i+1}.png")
print("rendered all pages")
