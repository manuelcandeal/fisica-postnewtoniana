#!/usr/bin/env python3
"""
Lists all Studio note titles from a NotebookLM notebook.
Prints a JSON array of note titles to stdout so callers can parse it.
"""

import sys
import time
import json
import argparse
from pathlib import Path

from patchright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).parent))
from auth_manager import AuthManager
from browser_utils import BrowserFactory


def list_studio_notes(notebook_url: str) -> list:
    auth = AuthManager()
    if not auth.is_authenticated():
        print("Not authenticated. Run: python auth_manager.py setup", file=sys.stderr)
        return []

    playwright = sync_playwright().start()
    context = BrowserFactory.launch_persistent_context(playwright, headless=False)

    try:
        page = context.new_page()
        page.goto(notebook_url, wait_until="domcontentloaded", timeout=30000)
        time.sleep(10)

        # Scroll repeatedly to force-load all lazy-rendered notes
        for _ in range(12):
            page.evaluate("""
                () => {
                    const panel = document.querySelector('.panel-content-scrollable');
                    if (panel) panel.scrollTop += 500;
                }
            """)
            time.sleep(0.8)
        page.evaluate("() => { const p = document.querySelector('.panel-content-scrollable'); if(p) p.scrollTop=0; }")
        time.sleep(1)

        artifact_items = page.query_selector_all('.artifact-library-container [class*="artifact-title"]')
        titles = [item.inner_text().strip() for item in artifact_items if item.inner_text().strip()]
        return titles

    finally:
        context.close()
        playwright.stop()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--notebook-url', required=True)
    args = parser.parse_args()

    titles = list_studio_notes(args.notebook_url)
    print(json.dumps(titles, ensure_ascii=False))


if __name__ == '__main__':
    main()
