"""Lightweight JSON API for the GulfCoast Odds frontend.

Serves odds data and comparison results over HTTP.
No framework dependency -- uses Python's built-in http.server + our async pipeline.
"""

from __future__ import annotations
import asyncio
import json
import logging
import os
import sqlite3
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from threading import Thread
from urllib.parse import urlparse, parse_qs

from db import DB_PATH
from markets import list_markets, list_casinos, get_market

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("api")

PORT = int(os.environ.get("API_PORT", "8787"))
OPPORTUNITIES_FILE = os.path.join(os.path.dirname(__file__), "latest_opportunities.json")


def cors_headers() -> dict:
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
    }


class APIHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        for k, v in cors_headers().items():
            self.send_header(k, v)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/")
        params = parse_qs(parsed.query)

        routes = {
            "/api/opportunities": self.handle_opportunities,
            "/api/events": self.handle_events,
            "/api/sports": self.handle_sports,
            "/api/odds": self.handle_odds,
            "/api/status": self.handle_status,
            "/api/markets": self.handle_markets,
            "/api/casinos": self.handle_casinos,
        }

        handler = routes.get(path)
        if handler:
            try:
                data = handler(params)
                self._json_response(200, data)
            except Exception as e:
                log.exception("Error handling %s", path)
                self._json_response(500, {"error": str(e)})
        else:
            self._json_response(404, {"error": "not found"})

    def handle_opportunities(self, params):
        """Return latest +EV opportunities."""
        min_ev = float(params.get("min_ev", [0])[0])
        sport = params.get("sport", [None])[0]

        if not os.path.exists(OPPORTUNITIES_FILE):
            return {"opportunities": [], "message": "No comparison data yet. Run the pipeline first."}

        with open(OPPORTUNITIES_FILE) as f:
            opps = json.load(f)

        if min_ev > 0:
            opps = [o for o in opps if o["ev_percent"] >= min_ev]
        if sport:
            opps = [o for o in opps if sport.lower() in o.get("sport", "").lower()]

        return {
            "count": len(opps),
            "opportunities": opps,
        }

    def handle_events(self, params):
        """Return all TB events with latest odds."""
        sport = params.get("sport", [None])[0]
        limit = int(params.get("limit", [50])[0])

        db = sqlite3.connect(DB_PATH)
        db.row_factory = sqlite3.Row

        query = """
            SELECT e.id, e.sport_id, s.name as sport_name,
                   e.home_team, e.away_team, e.event_name,
                   e.start_time, e.is_live, e.market_group_id
            FROM events e
            LEFT JOIN sports s ON s.id = e.sport_id
            WHERE 1=1
        """
        args = []
        if sport:
            query += " AND LOWER(s.name) LIKE ?"
            args.append(f"%{sport.lower()}%")

        query += " ORDER BY e.start_time LIMIT ?"
        args.append(limit)

        events = [dict(r) for r in db.execute(query, args).fetchall()]

        # Attach latest odds
        for ev in events:
            odds = [dict(r) for r in db.execute("""
                SELECT market_type, selection, line, odds_american, odds_decimal, scraped_at
                FROM odds_snapshots
                WHERE event_id = ?
                ORDER BY scraped_at DESC
            """, (ev["id"],)).fetchall()]

            # Deduplicate to latest per market+selection
            seen = set()
            ev["odds"] = []
            for o in odds:
                key = f"{o['market_type']}|{o['selection']}"
                if key not in seen:
                    seen.add(key)
                    ev["odds"].append(o)

        db.close()
        return {"count": len(events), "events": events}

    def handle_sports(self, params):
        """Return list of available sports with event counts."""
        db = sqlite3.connect(DB_PATH)
        db.row_factory = sqlite3.Row

        sports = [dict(r) for r in db.execute("""
            SELECT s.id, s.name, COUNT(DISTINCT e.id) as event_count
            FROM sports s
            LEFT JOIN events e ON e.sport_id = s.id
            GROUP BY s.id, s.name
            HAVING event_count > 0
            ORDER BY event_count DESC
        """).fetchall()]

        db.close()
        return {"sports": sports}

    def handle_odds(self, params):
        """Return odds for a specific event."""
        event_id = params.get("event_id", [None])[0]
        if not event_id:
            return {"error": "event_id required"}

        db = sqlite3.connect(DB_PATH)
        db.row_factory = sqlite3.Row

        event = db.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
        if not event:
            db.close()
            return {"error": "event not found"}

        odds = [dict(r) for r in db.execute("""
            SELECT * FROM odds_snapshots
            WHERE event_id = ?
            ORDER BY scraped_at DESC
        """, (event_id,)).fetchall()]

        db.close()
        return {"event": dict(event), "odds_history": odds}

    def handle_status(self, params):
        """Return system status."""
        db = sqlite3.connect(DB_PATH)
        stats = {
            "sports": db.execute("SELECT COUNT(DISTINCT id) FROM sports").fetchone()[0],
            "events": db.execute("SELECT COUNT(DISTINCT id) FROM events").fetchone()[0],
            "snapshots": db.execute("SELECT COUNT(*) FROM odds_snapshots").fetchone()[0],
            "last_scrape": db.execute(
                "SELECT MAX(scraped_at) FROM odds_snapshots"
            ).fetchone()[0],
            "db_size_kb": round(os.path.getsize(DB_PATH) / 1024),
            "has_opportunities": os.path.exists(OPPORTUNITIES_FILE),
        }
        db.close()
        return stats

    def handle_markets(self, params):
        """Return available markets."""
        return {"markets": list_markets()}

    def handle_casinos(self, params):
        """Return casinos, optionally filtered by market."""
        market_id = params.get("market", [None])[0]
        return {"casinos": list_casinos(market_id)}

    def _json_response(self, code: int, data: dict):
        body = json.dumps(data).encode()
        self.send_response(code)
        for k, v in cors_headers().items():
            self.send_header(k, v)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        # Quieter logging
        log.debug(format, *args)


def start_server():
    server = HTTPServer(("0.0.0.0", PORT), APIHandler)
    log.info("API server running on http://0.0.0.0:%d", PORT)
    server.serve_forever()


if __name__ == "__main__":
    start_server()
