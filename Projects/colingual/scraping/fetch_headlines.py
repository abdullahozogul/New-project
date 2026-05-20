#!/usr/bin/env python3
"""CLI: Selenium headlines for Colingual dev API (babicmila/news-web-scraper pattern).

  pip install -r scraping/requirements.txt
  python scraping/fetch_headlines.py --limit 12 --site wired
  python scraping/fetch_headlines.py --limit 1 --site wired --with-body
"""

from __future__ import annotations

import argparse
import json
import sys

from news_rss import split_headline_source
from selenium_news import scrape_headlines


def headline_id(title: str, link: str) -> str:
    """Match Colingual `hashHeadlineId` in vite.config.ts (base36)."""
    seed = f"{title}::{link}"
    hash_val = 0
    for char in seed:
        hash_val = (hash_val << 5) - hash_val + ord(char)
        hash_val |= 0
    n = abs(hash_val)
    alphabet = "0123456789abcdefghijklmnopqrstuvwxyz"
    out = ""
    while n:
        n, remainder = divmod(n, 36)
        out = alphabet[remainder] + out
    return f"hn-{out or '0'}"


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch news headlines via Selenium")
    parser.add_argument("--limit", type=int, default=12)
    parser.add_argument("--site", default="wired", choices=["wired", "bbc"])
    parser.add_argument("--with-body", action="store_true")
    args = parser.parse_args()

    try:
        rows = scrape_headlines(
            limit=args.limit,
            site=args.site,
            with_body_for_first=args.with_body,
        )
    except Exception as exc:
        print(json.dumps({"error": str(exc), "items": []}), file=sys.stderr)
        raise SystemExit(1) from exc

    items = []
    for row in rows:
        title, parsed_source = split_headline_source(row.title)
        source = row.source or parsed_source or ""
        item = {
            "id": headline_id(row.title, row.link),
            "title": title,
            "summary": row.summary or title,
            "category": "World",
            "sourceName": source,
            "sourceUrl": row.link,
        }
        if row.article_body:
            item["articleBody"] = row.article_body
        items.append(item)

    print(json.dumps({"items": items}, ensure_ascii=False))


if __name__ == "__main__":
    main()
