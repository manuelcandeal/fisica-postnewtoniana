#!/usr/bin/env python3
"""
Extract a note from NotebookLM Studio and generate a PDF with proper math rendering.
Uses browser-based PDF generation to preserve KaTeX-rendered formulas.
"""

import sys
import time
import json
import argparse
import shutil
import tempfile
from pathlib import Path

from patchright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).parent))
from auth_manager import AuthManager
from browser_utils import BrowserFactory


def extract_and_export_pdf(notebook_url: str, note_title_fragment: str, output_pdf: str, show_browser: bool = False):
    auth = AuthManager()
    if not auth.is_authenticated():
        print("Not authenticated. Run: python auth_manager.py setup")
        return False

    playwright = sync_playwright().start()
    context = BrowserFactory.launch_persistent_context(playwright, headless=not show_browser)

    try:
        page = context.new_page()
        print("Opening notebook...")
        page.goto(notebook_url, wait_until="domcontentloaded", timeout=30000)
        print("Waiting for page to fully render (10s)...")
        time.sleep(10)

        Path(output_pdf).parent.mkdir(parents=True, exist_ok=True)
        note_title_lower = note_title_fragment.lower()

        # Scroll artifact library to load all notes
        print("Loading all notes...")
        for _ in range(6):
            page.evaluate("""
                () => {
                    const panel = document.querySelector('.panel-content-scrollable');
                    if (panel) panel.scrollTop += 500;
                }
            """)
            time.sleep(0.8)
        page.evaluate("() => { const p = document.querySelector('.panel-content-scrollable'); if(p) p.scrollTop=0; }")
        time.sleep(1)

        # Get all artifact title elements and find best match
        artifact_items = page.query_selector_all('.artifact-library-container [class*="artifact-title"]')
        print(f"Found {len(artifact_items)} artifacts")

        target_el = None
        best_score = 0
        for item in artifact_items:
            text = item.inner_text().strip()
            text_lower = text.lower()
            score = 0
            if text_lower.startswith(note_title_lower[:10]):
                score = 3
            elif text_lower[:20].startswith(note_title_lower[:5]):
                score = 2
            elif note_title_lower[:10] in text_lower[:20]:
                score = 1
            if score > best_score:
                best_score = score
                target_el = item
                print(f"  Best match (score={score}): {text[:80]}")

        if not target_el:
            print(f"Could not find note: {note_title_fragment}")
            return False

        # Scroll the target into view and click it
        print("Opening note...")
        target_el.scroll_into_view_if_needed()
        time.sleep(0.5)
        target_el.click(force=True)
        time.sleep(4)

        # Extract the note HTML content from the editor
        note_html = page.evaluate("""
            () => {
                const editor = document.querySelector('.note-editor');
                if (editor) return editor.innerHTML;
                return null;
            }
        """)

        if not note_html:
            print("Could not find note editor content")
            return False

        # Build a complete standalone HTML document for PDF rendering
        # Use KaTeX from CDN (CSS + JS + autorender) to render math symbols correctly
        standalone_html = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"
    onload="renderMathInElement(document.body, {{
        delimiters: [
            {{left: '$$', right: '$$', display: true}},
            {{left: '$', right: '$', display: false}},
            {{left: '\\\\(', right: '\\\\)', display: false}},
            {{left: '\\\\[', right: '\\\\]', display: true}}
        ],
        throwOnError: false
    }});"></script>
<style>
  @page {{
    size: A4;
    margin: 2.5cm 2cm 2.5cm 2cm;
  }}
  * {{
    box-sizing: border-box;
  }}
  body {{
    font-family: 'Google Sans', Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #1a1a1a;
    max-width: 100%;
  }}
  h1, h2, h3, h4 {{
    font-weight: 600;
    margin-top: 1.2em;
    margin-bottom: 0.4em;
    color: #1a1a1a;
    page-break-after: avoid;
  }}
  h1 {{ font-size: 18pt; }}
  h2 {{ font-size: 15pt; }}
  h3 {{ font-size: 13pt; }}
  h4 {{ font-size: 11pt; }}
  p {{
    margin: 0 0 0.8em 0;
  }}
  ul, ol {{
    margin: 0.4em 0 0.8em 0;
    padding-left: 1.5em;
  }}
  li {{
    margin-bottom: 0.3em;
  }}
  /* KaTeX display math: center on its own line */
  .katex-display {{
    display: block;
    text-align: center;
    margin: 1em 0;
    overflow-x: auto;
  }}
  /* Inline math */
  .katex {{
    font-size: 1em;
  }}
  /* Block elements from NotebookLM */
  .paragraph {{
    margin-bottom: 0.6em;
  }}
  .heading3 {{
    font-size: 13pt;
    font-weight: 700;
    margin-top: 1.2em;
    margin-bottom: 0.4em;
  }}
  .heading2 {{
    font-size: 15pt;
    font-weight: 700;
    margin-top: 1.4em;
    margin-bottom: 0.4em;
  }}
  /* Bullet lists */
  .list-item {{
    margin-left: 1.2em;
    margin-bottom: 0.3em;
    list-style-type: disc;
  }}
  /* Remove Angular component markers */
  [_ngcontent-ng-c782087853],
  [_nghost-ng-c2480862737],
  [_nghost-ng-c2157455673],
  [_nghost-ng-c243751860] {{
    display: contents;
  }}
  /* Code/formula blocks */
  code {{
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
    background: #f5f5f5;
    padding: 0.1em 0.3em;
    border-radius: 3px;
  }}
  pre {{
    background: #f5f5f5;
    padding: 1em;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.85em;
    page-break-inside: avoid;
  }}
  /* Page break hints */
  h2, h3 {{
    page-break-before: auto;
  }}
  figure, table {{
    page-break-inside: avoid;
  }}
</style>
</head>
<body>
<div class="note-content">
{note_html}
</div>
</body>
</html>"""

        # Write HTML to a temp file with a safe name (avoids # and special chars in file:// URLs)
        tmp_dir = Path(tempfile.mkdtemp())
        tmp_html = tmp_dir / "note.html"
        tmp_pdf  = tmp_dir / "note.pdf"
        with open(tmp_html, 'w', encoding='utf-8') as f:
            f.write(standalone_html)

        # Generate PDF using a separate headless browser (page.pdf() requires headless)
        print(f"Generating PDF: {output_pdf}")
        pdf_browser = playwright.chromium.launch(headless=True, channel="chrome")
        try:
            pdf_page = pdf_browser.new_page()
            pdf_page.goto(tmp_html.as_uri(), wait_until="networkidle")
            pdf_page.wait_for_function("() => !document.querySelector('.katex-error') || true")
            time.sleep(2)
            pdf_page.pdf(
                path=str(tmp_pdf),
                format="A4",
                print_background=True,
                margin={"top": "2.5cm", "bottom": "2.5cm", "left": "2cm", "right": "2cm"},
            )
        finally:
            pdf_browser.close()

        # Move PDF to final destination and clean up temp dir
        shutil.move(str(tmp_pdf), output_pdf)
        shutil.rmtree(tmp_dir, ignore_errors=True)

        print(f"PDF generated: {output_pdf}")
        return True

    finally:
        context.close()
        playwright.stop()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--notebook-url', required=True)
    parser.add_argument('--note-title', required=True)
    parser.add_argument('--output', default='data/nota_fisica.pdf')
    parser.add_argument('--show-browser', action='store_true')
    args = parser.parse_args()

    ok = extract_and_export_pdf(
        notebook_url=args.notebook_url,
        note_title_fragment=args.note_title,
        output_pdf=args.output,
        show_browser=args.show_browser,
    )
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
