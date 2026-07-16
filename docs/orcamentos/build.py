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

def pill(page, rect, text):
    r = fitz.Rect(rect); rr = r.height/2
    # soft drop shadow (subtle, matches the glassy pills on the photo pages)
    sh = fitz.Rect(r.x0-0.6, r.y0+1.4, r.x1+0.6, r.y1+2.2)
    page.draw_rect(sh, color=None, fill=(0.13,0.1,0.08), fill_opacity=0.10, radius=(sh.height/2)/sh.height)
    # solid charcoal matching the perceived colour of the other OPÇÃO pills (~#5e5b56)
    page.draw_rect(r, color=None, fill=(0.37,0.357,0.337), radius=rr/r.height)
    # vertically-centred label
    page.insert_textbox(fitz.Rect(r.x0, r.y0+(r.height-8.2)/2-1.2, r.x1, r.y1), text,
                        fontname="hebo", fontsize=8.2, color=(1,1,1), align=1)

# ---------- flat orange line icons (replace the emojis) ----------
IC_ORANGE = (238,122,30,255); IC_PEACH = (255,220,187,255); _S=4
def _cv():
    im=Image.new("RGBA",(100*_S,100*_S),(0,0,0,0)); return im, ImageDraw.Draw(im)
def _R(*v): return [x*_S for x in v]
def ic_heart():
    im,d=_cv(); d.ellipse(_R(24,26,52,54),fill=IC_ORANGE); d.ellipse(_R(48,26,76,54),fill=IC_ORANGE)
    d.polygon(_R(27,42,73,42,50,74),fill=IC_ORANGE); return im
def ic_camera():
    im,d=_cv(); d.rounded_rectangle(_R(20,36,80,74),radius=8*_S,fill=IC_ORANGE)
    d.rounded_rectangle(_R(38,28,58,40),radius=4*_S,fill=IC_ORANGE); d.ellipse(_R(40,44,60,64),fill=IC_PEACH)
    d.ellipse(_R(46,50,54,58),fill=IC_ORANGE); d.ellipse(_R(68,42,74,48),fill=IC_PEACH); return im
def ic_gift():
    im,d=_cv(); d.rounded_rectangle(_R(24,44,76,78),radius=5*_S,fill=IC_ORANGE)
    d.rectangle(_R(45,44,55,78),fill=IC_PEACH); d.rectangle(_R(24,56,76,64),fill=IC_PEACH)
    d.polygon(_R(50,44,30,28,34,46),fill=IC_ORANGE); d.polygon(_R(50,44,70,28,66,46),fill=IC_ORANGE)
    d.ellipse(_R(46,40,54,48),fill=IC_ORANGE); return im
def place_icon(page, icon_im, center, size_pt):
    im = icon_im.resize((300,300), Image.LANCZOS)
    bio=io.BytesIO(); im.save(bio,format="PNG")
    cx,cy=center
    page.insert_image(fitz.Rect(cx-size_pt/2,cy-size_pt/2,cx+size_pt/2,cy+size_pt/2),
                      stream=bio.getvalue(), overlay=True)

doc = fitz.open(SRC)

# ======== remove the translucent cyan logo "chip" rectangles (pages 1 & 6) ========
# they are single filled rects in the page content stream; deleting the fill
# leaves the photo (p1) / cream (p6) underneath perfectly intact.
for _pi, _badge in [(0, b"3186 98 209 210 re\nf"), (5, b"3220 105 166 165 re\nf")]:
    _x = doc[_pi].get_contents()[0]
    _s = doc.xref_stream(_x)
    if _badge in _s:
        doc.update_stream(_x, _s.replace(_badge, b""))

# ======== LOGO — turn the cyan square badge into a transparent cyan drop ========
from PIL import ImageChops
_logo = Image.open(A+"hidrateilogo.jpg").convert("RGB")
_lw,_lh = _logo.size
_lr,_lg,_lb = _logo.split()
_minC = ImageChops.darker(ImageChops.darker(_lr,_lg),_lb)   # white drop -> high, cyan bg -> low
_alpha = _minC.point(lambda v: 0 if v<70 else (255 if v>200 else int((v-70)*255/130)))
_cyan = _logo.getpixel((5,5))                            # brand cyan (~9,177,214)
_drop = Image.composite(Image.new("RGBA",(_lw,_lh),_cyan+(255,)),
                        Image.new("RGBA",(_lw,_lh),(0,0,0,0)), _alpha)
_bio = io.BytesIO(); _drop.save(_bio, format="PNG"); DROP_PNG = _bio.getvalue()
_logo_xref = [i[0] for i in doc[0].get_images(full=True)
              if doc.extract_image(i[0])["width"]==447 and doc.extract_image(i[0])["height"]==447][0]
doc[0].replace_image(_logo_xref, stream=DROP_PNG)  # shared xref -> fixes every page

def redraw_drop(page, rect):
    page.insert_image(fitz.Rect(rect), stream=DROP_PNG, overlay=True)

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

# ======== PAGE 2 — replace card emojis with flat orange icons ========
p2 = doc[1]
PEACHf = (1.0, 0.863, 0.733)
# Neutralise the soft card shadows: their alpha soft-mask is ignored by some
# viewers (phones) and renders as a hard brown box. Cover the halo around each
# card with the page cream so the cards read clean (white + light border).
for strip in [
    (23,327,819,333),      # top edge above the cards
    (23,498,819,515),      # bottom edge below the cards (meets the quote banner)
    (23,333,40,498),       # left margin
    (283,333,299,498),     # gap between card 1 and 2
    (543,333,558,498),     # gap between card 2 and 3
    (802,333,819,498),     # right margin
]:
    p2.draw_rect(fitz.Rect(*strip), color=None, fill=CREAM)
p2emoji = [(66.7,362.1,89.1,383.2),(325.9,362.1,348.3,383.2),(585.0,362.1,607.5,383.2)]
for bb in p2emoji:  # remove the emoji glyph from the text layer, fill with box peach
    p2.add_redact_annot(fitz.Rect(bb[0]-2,bb[1]-2,bb[2]+2,bb[3]+2), fill=PEACHf)
p2.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE, graphics=fitz.PDF_REDACT_LINE_ART_NONE)
p2icons = [(ic_heart(),(77.9,372.6)), (ic_camera(),(337.1,372.6)), (ic_gift(),(596.25,372.6))]
for icon, ctr in p2icons:
    place_icon(p2, icon, ctr, 27)

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
# (numeral, emoji_bbox, icon_box_rect) — numeral centred inside the icon box
ICON = [
    ("01",(65.2,94.1,83.9,111.7),(52.9,79.1,209.6,127.1)),
    ("02",(258.4,94.1,277.1,111.7),(246.4,79.1,402.4,127.1)),
    ("03",(451.7,94.1,470.4,111.7),(439.1,79.1,595.9,127.1)),
    ("04",(644.9,94.1,663.6,111.7),(632.6,79.1,789.4,127.1)),
]
NUMSIZE = 23
# remove all emoji glyphs from the text layer first (fill white to match boxes/button)
for num, bb, box in ICON:
    p6.add_redact_annot(fitz.Rect(bb[0]-4,bb[1]-4,bb[2]+4,bb[3]+4), fill=(1,1,1))
p6.add_redact_annot(fitz.Rect(82,489,101,506), fill=(1,1,1))  # chat emoji in WhatsApp button
p6.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE, graphics=fitz.PDF_REDACT_LINE_ART_NONE)
for num, bb, box in ICON:
    bcx = (box[0]+box[2])/2; bcy = (box[1]+box[3])/2
    w = fitz.get_text_length(num, fontname="tibo", fontsize=NUMSIZE)
    p6.insert_text(fitz.Point(bcx-w/2, bcy+NUMSIZE*0.34), num,
                   fontname="tibo", fontsize=NUMSIZE, color=ORANGE)

doc.save(OUT, garbage=4, deflate=True)
print("saved", OUT)
for i in range(6):
    doc[i].get_pixmap(dpi=118).save(f"/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/f_p{i+1}.png")
print("rendered all pages")
