import os
import sys

try:
    import fitz  # PyMuPDF
except ImportError:
    print("PyMuPDF not installed. Installing...")
    os.system(sys.executable + " -m pip install PyMuPDF")
    import fitz

input_dir = r"c:\Users\dutah\OneDrive\Desktop\Syntax\Web\lab-engineering\assets"
output_dir = r"c:\Users\dutah\OneDrive\Desktop\Syntax\Web\lab-engineering\assets_png"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

pdf_files = [f for f in os.listdir(input_dir) if f.endswith('.pdf')]

for pdf_file in pdf_files:
    pdf_path = os.path.join(input_dir, pdf_file)
    print(f"Processing {pdf_file}...")
    try:
        doc = fitz.open(pdf_path)
        # Process all pages
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            pix = page.get_pixmap(dpi=150)
            output_filename = f"{os.path.splitext(pdf_file)[0]}_page_{page_num + 1}.png"
            output_path = os.path.join(output_dir, output_filename)
            pix.save(output_path)
        print(f"  Saved {len(doc)} pages for {pdf_file}.")
    except Exception as e:
        print(f"  Failed to process {pdf_file}: {e}")

print("Done converting PDFs to PNGs.")
