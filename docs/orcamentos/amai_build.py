"""Transform the AMAI proposal into a clean Elarah-branded version:
- hide the supplier (Collage Club): remove 'BY COLLAGE CLUB' and the whole
  'QUEM SOMOS' page; relabel 'FORNECIDO PELO COLLAGE CLUB' -> 'FORNECIDO PELA ELARAH'
- remove the collage option page (already offered elsewhere)
- price R$130 -> R$159
Text edits keep the original Truetypewriter PolyglOTT font and its letter-spacing."""
import fitz, sys

SRC = "/root/.claude/uploads/9abf7e9a-5852-5ed9-badc-3da0f14e2577/b1cc5410-AMAI_1.pdf"
OUT = sys.argv[1] if len(sys.argv) > 1 else "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/AMAI_Elarah_final.pdf"
FONTFILE = "/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/tw_full.ttf"

font = fitz.Font(fontfile=FONTFILE)
ADV = 0.540  # per-char advance ratio (matches the doc's letter-spacing)

def remove_text(page, rect):
    page.add_redact_annot(fitz.Rect(rect))
    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE,
                          graphics=fitz.PDF_REDACT_LINE_ART_NONE,
                          text=fitz.PDF_REDACT_TEXT_REMOVE)

def write_spaced(page, text, x, y, size, color=(0,0,0)):
    tw = fitz.TextWriter(page.rect)
    cx = x
    for ch in text:
        tw.append((cx, y), ch, font=font, fontsize=size)
        cx += ADV * size
    tw.write_text(page, color=color)

d = fitz.open(SRC)

# ---- PAGE 1: drop 'BY COLLAGE CLUB', change price 130 -> 159 ----
p1 = d[0]
remove_text(p1, (388.0, 365.5, 559.0, 388.0))      # BY COLLAGE CLUB (whole line)
remove_text(p1, (352.5, 666.0, 559.0, 686.5))      # price line
write_spaced(p1, "R$159,00 POR PESSOA,", 353.3, 681.8, 19)

# ---- PAGES 3 & 4: relabel supplier line ----
for pg, y, rect in [(2, 300.6, (85.0, 287.0, 330.0, 305.0)),
                    (3, 222.0, (85.0, 208.5, 330.0, 226.0))]:
    remove_text(d[pg], rect)
    write_spaced(d[pg], "FORNECIDO PELA ELARAH:", 85.9, y, 16)

# ---- remove collage-option page (5) and supplier 'QUEM SOMOS' page (6) ----
d.delete_pages([4, 5])

d.save(OUT, garbage=4, deflate=True)
print("saved", OUT, "pages:", d.page_count)
# render for review
r = fitz.open(OUT)
for i in range(r.page_count):
    r[i].get_pixmap(dpi=100).save(f"/tmp/claude-0/-home-user-elarahplatform/9abf7e9a-5852-5ed9-badc-3da0f14e2577/scratchpad/ae_p{i+1}.png")
print("rendered")
