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


def split_headline_source(raw_title: str) -> tuple[str, str | None]:
    """Google News RSS titles are often 'Headline - Publisher'."""
    trimmed = (raw_title or "").strip()
    sep = trimmed.rfind(" - ")
    if sep <= 0 or sep >= len(trimmed) - 3:
        return trimmed, None
    title = trimmed[:sep].strip()
    source = trimmed[sep + 3 :].strip()
    if not source or len(source) > 100 or len(title) < 8:
        return trimmed, None
    return title, source


def fetch_headlines(limit: int) -> list[dict[str, str]]:
    url = f"{RSS2JSON}?rss_url={quote(GOOGLE_NEWS_RSS, safe='')}"
    response = httpx.get(url, timeout=30.0)
    response.raise_for_status()
    payload = response.json()
    items = payload.get("items") or []

    headlines: list[dict[str, str]] = []
    for item in items[:limit]:
        raw_title = (item.get("title") or "").strip()
        if not raw_title:
            continue
        title, source = split_headline_source(raw_title)
        row: dict[str, str] = {
            "title": title,
            "summary": strip_html(item.get("description") or raw_title)[:600],
            "link": item.get("link") or "",
        }
        if source:
            row["source"] = source
        headlines.append(row)
    return headlines


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch live news headlines")
    parser.add_argument("--limit", type=int, default=8)
    args = parser.parse_args()
    headlines = fetch_headlines(args.limit)
    print(json.dumps(headlines, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
