#!/usr/bin/env python3
"""Fetch English headlines from Google News RSS (operator script).

Inspired by AI-Cursor-Scraping-Assistant workflow. Run locally to inspect
headlines before Colingual adapts them to CEFR levels via Gemini.

  pip install httpx
  python scraping/news_rss.py --limit 5
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from urllib.parse import quote

try:
    import httpx
except ImportError:
    print("Install httpx: pip install httpx", file=sys.stderr)
    raise SystemExit(1) from None

GOOGLE_NEWS_RSS = "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en"
RSS2JSON = "https://api.rss2json.com/v1/api.json"


def strip_html(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", value or "")).strip()


def fetch_headlines(limit: int) -> list[dict[str, str]]:
    url = f"{RSS2JSON}?rss_url={quote(GOOGLE_NEWS_RSS, safe='')}"
    response = httpx.get(url, timeout=30.0)
    response.raise_for_status()
    payload = response.json()
    items = payload.get("items") or []

    headlines: list[dict[str, str]] = []
    for item in items[:limit]:
        title = (item.get("title") or "").strip()
        if not title:
            continue
        headlines.append(
            {
                "title": title,
                "summary": strip_html(item.get("description") or title)[:600],
                "link": item.get("link") or "",
            }
        )
    return headlines


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch live news headlines")
    parser.add_argument("--limit", type=int, default=8)
    args = parser.parse_args()
    headlines = fetch_headlines(args.limit)
    print(json.dumps(headlines, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
