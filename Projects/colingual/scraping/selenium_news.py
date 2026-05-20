"""
Selenium news scraper — adapted from babicmila/news-web-scraper (Wired XPath pattern).
https://github.com/babicmila/news-web-scraper

Uses headless Chrome (Selenium 4 built-in driver manager; no hardcoded chromedriver path).
"""

from __future__ import annotations

import re
import time
from dataclasses import dataclass
from typing import Callable
try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.common.by import By
except ImportError as exc:
    raise SystemExit(
        "Install selenium: pip install -r scraping/requirements.txt"
    ) from exc

try:
    import trafilatura
except ImportError:
    trafilatura = None  # type: ignore[assignment]


@dataclass
class ScrapedHeadline:
    title: str
    link: str
    source: str
    summary: str = ""
    article_body: str | None = None


def _clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "")).strip()


def create_headless_driver() -> webdriver.Chrome:
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument(
        "user-agent=Mozilla/5.0 (compatible; Colingual/1.0; language-learning)"
    )
    return webdriver.Chrome(options=options)


def scrape_wired(driver: webdriver.Chrome, limit: int) -> list[ScrapedHeadline]:
    """Original repo target: wired.com — XPath + link fallbacks."""
    driver.get("https://www.wired.com/")
    time.sleep(1.8)

    items: list[ScrapedHeadline] = []
    seen_links: set[str] = set()

    # Pattern from news-web-scraper (class names may shift; partial match)
    container_xpaths = [
        '//motion.div[contains(@class,"summary-item")]',
        '//motion.div[contains(@class,"SummaryItem")]',
        '//motion.div[contains(@class,"summary-item__content")]',
        '//div[contains(@class,"summary-item__content")]',
        '//motion.div[contains(@class,"SummaryItemContent")]',
    ]

    for xpath in container_xpaths:
        try:
            containers = driver.find_elements(By.XPATH, xpath)
        except Exception:
            containers = []

        for container in containers:
            try:
                anchor = container.find_element(By.XPATH, ".//a[contains(@href,'/story/')]")
                title_el = container.find_elements(By.XPATH, ".//a//h3 | .//h3 | .//h2")
                title = _clean_text(
                    title_el[0].text if title_el else anchor.text or anchor.get_attribute("aria-label") or ""
                )
                link = anchor.get_attribute("href") or ""
            except Exception:
                continue

            if not title or not link or link in seen_links:
                continue
            seen_links.add(link)
            items.append(
                ScrapedHeadline(
                    title=title,
                    link=link,
                    source="Wired",
                    summary=title,
                )
            )
            if len(items) >= limit:
                return items

    # Fallback: story links on homepage
    for anchor in driver.find_elements(By.XPATH, "//a[contains(@href,'/story/')]"):
        link = anchor.get_attribute("href") or ""
        if not link or link in seen_links:
            continue
        title = _clean_text(anchor.text or anchor.get_attribute("aria-label") or "")
        if len(title) < 12:
            continue
        seen_links.add(link)
        items.append(
            ScrapedHeadline(title=title, link=link, source="Wired", summary=title)
        )
        if len(items) >= limit:
            break

    return items


def scrape_bbc(driver: webdriver.Chrome, limit: int) -> list[ScrapedHeadline]:
    driver.get("https://www.bbc.com/news")
    time.sleep(1.8)

    items: list[ScrapedHeadline] = []
    seen: set[str] = set()

    for anchor in driver.find_elements(
        By.CSS_SELECTOR, 'a[href*="/news/"], a[data-testid="internal-link"]'
    ):
        link = anchor.get_attribute("href") or ""
        if "/news/" not in link or link in seen:
            continue
        title = _clean_text(anchor.text)
        if len(title) < 16:
            continue
        seen.add(link)
        items.append(
            ScrapedHeadline(title=title, link=link, source="BBC News", summary=title)
        )
        if len(items) >= limit:
            break

    return items


SITE_SCRAPERS: dict[str, Callable[[webdriver.Chrome, int], list[ScrapedHeadline]]] = {
    "wired": scrape_wired,
    "bbc": scrape_bbc,
}


def extract_article_body_from_html(html: str, max_chars: int = 6000) -> str | None:
    if not trafilatura:
        return None
    text = trafilatura.extract(html, include_comments=False, favor_precision=True)
    if not text:
        return None
    cleaned = _clean_text(text)
    return cleaned[:max_chars] if len(cleaned) >= 120 else None


def fetch_article_body(driver: webdriver.Chrome, url: str) -> str | None:
    try:
        driver.get(url)
        time.sleep(1.5)
        return extract_article_body_from_html(driver.page_source)
    except Exception:
        return None


def scrape_headlines(
    limit: int = 12,
    site: str = "wired",
    with_body_for_first: bool = False,
) -> list[ScrapedHeadline]:
    scraper = SITE_SCRAPERS.get(site.lower(), scrape_wired)
    driver = create_headless_driver()
    try:
        headlines = scraper(driver, limit)
        if with_body_for_first and headlines:
            body = fetch_article_body(driver, headlines[0].link)
            if body:
                headlines[0] = ScrapedHeadline(
                    title=headlines[0].title,
                    link=headlines[0].link,
                    source=headlines[0].source,
                    summary=body[:600],
                    article_body=body,
                )
        return headlines
    finally:
        driver.quit()
