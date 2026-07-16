import fitz
from PIL import Image, ImageDraw, ImageFilter
import io, sys

SRC_PDF = "/root/.claude/uploads/9abf7e9a-5852-5ed9-badc-3da0f14e2577/ceb33052-Experiencia_Hidratei_Elarah_6.pdf"
OUT_PDF = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/Experiencia_Hidratei_Elarah_7.pdf"
ASSETS = "/home/user/elarahplatform/assets/"

PXPT = 5.0  # px per pdf point (render resolution for stickers)

def styled_png(img_path, angle_ccw):
    """Return (PIL RGBA image, pad_ratio) where the CARD is centered in the canvas.
    angle_ccw: degrees, positive = counter-clockwise (PIL convention)."""
    photo = Image.open(img_path).convert("RGB")
    # square it (these assets are ~square already); force square by center-crop
    w, h = photo.size
    s = min(w, h)
    photo = photo.crop(((w-s)//2, (h-s)//2, (w-s)//2+s, (h-s)//2+s))
    P = 460  # photo side in px
    photo = photo.resize((P, P), Image.LANCZOS)

    border = int(round(0.055 * P))       # white frame thickness
    photo_r = int(round(0.05 * P))       # inner photo corner radius
    card = P + 2 * border
    card_r = int(round(0.075 * card))    # outer card corner radius

    # rounded mask for the inner photo
    pmask = Image.new("L", (P, P), 0)
    ImageDraw.Draw(pmask).rounded_rectangle([0, 0, P-1, P-1], radius=photo_r, fill=255)

    # white card
    card_img = Image.new("RGBA", (card, card), (0, 0, 0, 0))
    cmask = Image.new("L", (card, card), 0)
    ImageDraw.Draw(cmask).rounded_rectangle([0, 0, card-1, card-1], radius=card_r, fill=255)
    white = Image.new("RGBA", (card, card), (255, 255, 255, 255))
    card_img.paste(white, (0, 0), cmask)
    card_img.paste(photo.convert("RGBA"), (border, border), pmask)

    # shadow
    pad = int(round(0.16 * card))
    canvas = Image.new("RGBA", (card + 2*pad, card + 2*pad), (0, 0, 0, 0))
    sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    shmask = Image.new("L", canvas.size, 0)
    off_x, off_y = int(0.012*card), int(0.03*card)
    ImageDraw.Draw(shmask).rounded_rectangle(
        [pad+off_x, pad+off_y, pad+off_x+card-1, pad+off_y+card-1], radius=card_r, fill=95)
    shmask = shmask.filter(ImageFilter.GaussianBlur(0.06*card))
    black = Image.new("RGBA", canvas.size, (60, 40, 25, 255))
    canvas.paste(black, (0, 0), shmask)
    canvas.paste(card_img, (pad, pad), card_img)

    # rotate about center (card stays centered)
    rot = canvas.rotate(angle_ccw, resample=Image.BICUBIC, expand=True)
    # card size relative to full canvas (pre-rotation) in px:
    card_px = card
    canvas_px = card + 2*pad
    return rot, canvas_px, card_px

def place(page, img_path, center, card_pt, angle_ccw):
    rot, canvas_px, card_px = styled_png(img_path, angle_ccw)
    # pdf size of the FULL pre-rotation canvas:
    canvas_pt = card_pt * (canvas_px / card_px)
    # after expand, rotated png is larger; scale so that PNG maps preserving center.
    png_w, png_h = rot.size
    # the rotated png width in pdf = png_w/px * (canvas_pt/canvas_px_rot)... simpler:
    # px_per_pt for this sticker:
    px_per_pt = canvas_px / canvas_pt
    png_w_pt = png_w / px_per_pt
    png_h_pt = png_h / px_per_pt
    cx, cy = center
    rect = fitz.Rect(cx - png_w_pt/2, cy - png_h_pt/2, cx + png_w_pt/2, cy + png_h_pt/2)
    bio = io.BytesIO()
    rot.save(bio, format="PNG")
    page.insert_image(rect, stream=bio.getvalue(), keep_proportion=False, overlay=True)

FACTOR = float(sys.argv[1]) if len(sys.argv) > 1 else 1.5
A_ADES = float(sys.argv[2]) if len(sys.argv) > 2 else 6.0    # adesivo angle (ccw+)
A_ADES1 = float(sys.argv[3]) if len(sys.argv) > 3 else -5.0  # adesivo1 angle

doc = fitz.open(SRC_PDF)
page = doc[2]
# draw big sticker (94) first, then washi (98) on top.
# Anchor the collage card's bbox bottom-left near (margin, page_bottom-margin)
# and grow up/right; keep the washi overlapping its upper-right, scaling the gap.
MARGIN = 12.0
PAGE_H = 594.96
size_a = 91.5 * FACTOR
size_a1 = 79.5 * FACTOR
bbox_a = size_a * 1.099   # rotated square bounding box (~6 deg)
cx_a = MARGIN + bbox_a/2
cy_a = (PAGE_H - MARGIN) - bbox_a/2
# original center gap adesivo->adesivo1 was (73.5, -28.5); scale it with FACTOR
cx_a1 = cx_a + 73.5 * (FACTOR/1.0) * 0.80
cy_a1 = cy_a - 28.5 * (FACTOR/1.0) * 0.80
place(page, ASSETS+"hidrateiadesivo.jpg", (cx_a, cy_a), size_a, A_ADES)
place(page, ASSETS+"hidrateiadesivo1.jpg", (cx_a1, cy_a1), size_a1, A_ADES1)
print("centers:", (round(cx_a,1),round(cy_a,1)), (round(cx_a1,1),round(cy_a1,1)))
doc.save(OUT_PDF, garbage=4, deflate=True)
print("saved", OUT_PDF, "factor", FACTOR, "angles", A_ADES, A_ADES1)

# render page 3 for review
pix = doc[2].get_pixmap(dpi=120)
pix.save("/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/check_p3.png")
print("rendered check_p3.png")
