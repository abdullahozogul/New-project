#!/usr/bin/env python3
"""RSS headlines + full article text for Colingual (AI-Cursor scraping workflow).

  pip install -r scraping/requirements.txt
  python scraping/news_pipeline.py --limit 3 --lang en
"""

from __future__ import annotations

import argparse
import json
import sys
from urllib.parse import quote

try:
    import httpx
except ImportError:
    print("Install httpx: pip install -r scraping/requirements.txt", file=sys.stderr)
    raise SystemExit(1) from None

from article_extract import extract_article_body
from news_rss import GOOGLE_NEWS_RSS, RSS2JSON, split_headline_source

GOOGLE_NEWS_RSS_TR = "https://news.google.com/rss?hl=tr&gl=TR&ceid=TR:tr"


def rss_url_for_lang(lang: str | None) -> str:
    return GOOGLE_NEWS_RSS_TR if (lang or "").lower() == "tr" else GOOGLE_NEWS_RSS


def fetch_headlines_for_lang(limit: int, lang: str | None) -> list[dict[str, str]]:
    url = f"{RSS2JSON}?rss_url={quote(rss_url_for_lang(lang), safe='')}"
    response = httpx.get(url, timeout=30.0)
    response.raise_for_status()
    payload = response.json()
    items = payload.get("items") or []

    headlines: list[dict[str, str]] = []
    for item in items[: limit * 2]:
        raw_title = (item.get("title") or "").strip()
        if not raw_title:
            continue
        title, source = split_headline_source(raw_title)
        summary = (item.get("description") or raw_title).replace("<", " ").replace(">", " ")
        summary = " ".join(summary.split())[:600]
        row: dict[str, str] = {
            "title": title,
            "summary": summary,
            "link": item.get("link") or "",
        }
        if source:
            row["source"] = source
        headlines.append(row)
        if len(headlines) >= limit:
            break
    return headlines


def enrich_with_article_body(headline: dict[str, str]) -> dict[str, str | None]:
    link = headline.get("link") or ""
    body = extract_article_body(link) if link else None
    result = dict(headline)
    if body:
        result["articleBody"] = body
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch RSS headlines and scrape article bodies")
    parser.add_argument("--limit", type=int, default=3)
    parser.add_argument("--lang", default="en")
    parser.add_argument("--scrape", action="store_true", default=True)
    args = parser.parse_args()

    headlines = fetch_headlines_for_lang(args.limit, args.lang)
    if args.scrape:
        headlines = [enrich_with_article_body(item) for item in headlines]

    print(json.dumps(headlines, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
