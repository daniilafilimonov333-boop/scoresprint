#!/usr/bin/env python3
"""Fetch FIFA World Cup 2026 match data and save it locally.

Data source: Wikipedia 2026 FIFA World Cup page.
This script extracts all 104 matches and stores current scores.
Unplayed matches have empty score fields.
"""

from __future__ import annotations

import csv
import json
import os
import re
from typing import Dict, List
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup

SOURCE_URL = "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup"
OUTPUT_CSV = "world_cup_2026_scores.csv"
OUTPUT_JSON = "world_cup_2026_scores.json"
PUBLIC_DIR = "public"


def clean_text(value: str) -> str:
    """Normalize whitespace and strip hidden unicode spaces used in HTML."""
    return " ".join(value.replace("\xa0", " ").split())


def get_stage_name(match_box) -> str:
    """Find the closest section heading before a match block."""
    for heading in match_box.find_all_previous(["h2", "h3", "h4"]):
        text = clean_text(heading.get_text(" ", strip=True)).replace("[edit]", "")
        if text and text != "Matches":
            return text
    return ""


def extract_fixture_number(score_text: str) -> str:
    """Extract fixture placeholder label for unplayed games (e.g., 'Match 53')."""
    match = re.search(r"Match\s+(\d+)", score_text)
    return match.group(1) if match else ""


def parse_scores() -> List[Dict[str, str]]:
    request = Request(SOURCE_URL, headers={"User-Agent": "WCScoresBot/1.0"})
    with urlopen(request) as response:
        html = response.read()

    soup = BeautifulSoup(html, "lxml")
    rows: List[Dict[str, str]] = []

    for index, box in enumerate(soup.select("div.footballbox"), start=1):
        home_el = box.select_one('th.fhome [itemprop="name"]')
        away_el = box.select_one('th.faway [itemprop="name"]')
        score_el = box.select_one("th.fscore")
        date_el = box.select_one(".fdate")
        time_el = box.select_one(".ftime")
        venue_el = box.select_one('[itemprop="location"] [itemprop="name address"]')

        home_team = clean_text(home_el.get_text(" ", strip=True)) if home_el else ""
        away_team = clean_text(away_el.get_text(" ", strip=True)) if away_el else ""
        score_text = clean_text(score_el.get_text(" ", strip=True)) if score_el else ""
        date_text = clean_text(date_el.get_text(" ", strip=True)) if date_el else ""
        time_text = clean_text(time_el.get_text(" ", strip=True)) if time_el else ""
        venue_text = clean_text(venue_el.get_text(" ", strip=True)) if venue_el else ""

        score_match = re.search(r"(\d+)\s*[–-]\s*(\d+)", score_text)
        played = score_match is not None

        rows.append(
            {
                "match_number": str(index),
                "stage": get_stage_name(box),
                "date": date_text,
                "time": time_text,
                "home_team": home_team,
                "away_team": away_team,
                "score": score_match.group(0) if played else "",
                "home_score": score_match.group(1) if played else "",
                "away_score": score_match.group(2) if played else "",
                "fixture_label": score_text if not played else "",
                "fixture_number": extract_fixture_number(score_text) if not played else "",
                "venue": venue_text,
                "played": "yes" if played else "no",
            }
        )

    return rows


def write_csv(rows: List[Dict[str, str]]) -> None:
    targets = [OUTPUT_CSV, os.path.join(PUBLIC_DIR, OUTPUT_CSV)]

    for target in targets:
        with open(target, "w", newline="", encoding="utf-8") as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=list(rows[0].keys()))
            writer.writeheader()
            writer.writerows(rows)


def write_json(rows: List[Dict[str, str]]) -> None:
    targets = [OUTPUT_JSON, os.path.join(PUBLIC_DIR, OUTPUT_JSON)]

    for target in targets:
        with open(target, "w", encoding="utf-8") as json_file:
            json.dump(rows, json_file, indent=2, ensure_ascii=False)


def main() -> None:
    os.makedirs(PUBLIC_DIR, exist_ok=True)
    rows = parse_scores()
    write_csv(rows)
    write_json(rows)

    played_count = sum(1 for row in rows if row["played"] == "yes")
    print(
        f"Saved {len(rows)} matches to {OUTPUT_CSV}, {OUTPUT_JSON}, and public copies"
    )
    print(f"Played: {played_count} | Remaining: {len(rows) - played_count}")


if __name__ == "__main__":
    main()
