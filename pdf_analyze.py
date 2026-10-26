import pymupdf
import sys

doc = pymupdf.open('diseño-mudgo.pdf.pdf')
total = len(doc)
print("Total pages:", total)

for i, page in enumerate(doc):
    text = page.get_text()
    sys.stdout.buffer.write(("=== PAGE %d ===\n" % (i+1)).encode('utf-8'))
    if text.strip():
        sys.stdout.buffer.write(text.encode('utf-8', errors='replace'))
    else:
        sys.stdout.buffer.write(b"[Image-only page]\n")
    sys.stdout.buffer.write(b"\n")
