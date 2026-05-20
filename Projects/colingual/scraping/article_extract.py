#!/usr/bin/env python3
"""Extract article body from a news URL (trafilatura).

  pip install -r scraping/requirements.txt
  python scraping/article_extract.py "https://example.com/story"
"""

from __future__ import annotations

import json
import sys

try:
    import trafilatura
except ImportError:
    print("Install: pip install -r scraping/requirements.txt", file=sys.stderr)
    raise SystemExit(1) from None


def extract_article_body(url: str, max_chars: int = 6000) -> str | None:
    downloaded = trafilatura.fetch_url(url)
    if not downloaded:
        return None
    text = trafilatura.extract(
        downloaded,
        include_comments=False,
        include_tables=False,
        favor_precision=True,
    )
    if not text:
        return None
    cleaned = " ".join(text.split()).strip()
    if len(cleaned) < 120:
        return None
    return cleaned[:max_chars]


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python scraping/article_extract.py <url>", file=sys.stderr)
        raise SystemExit(2)
    url = sys.argv[1].strip()
    body = extract_article_body(url)
    print(json.dumps({"url": url, "articleBody": body}, ensure_ascii=False))


if __name__ == "__main__":
    main()
