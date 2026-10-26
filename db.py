"""
Atelier Runway & Wardrobe Management System
Python SQLite Database Persistence Layer
"""

import json
import os
import re
import sqlite3
from typing import Any, Dict, List, Optional, Tuple

DB_FILE_PATH = os.environ.get("SQLITE_DB_PATH", os.path.join(os.path.dirname(__file__), "fashion_show.db"))

DEFAULT_INITIAL_DATA: Dict[str, Any] = {
    "activeShowId": "show_2026_ss",
    "shows": [
        {
            "id": "show_2026_ss",
            "name": "LUMIÈRE // Haute Couture Spring/Summer 2026",
            "season": "Spring/Summer",
            "year": 2026,
            "date": "2026-05-18",
            "venue": "The Grand Pavilion Ballroom, Mayfair, London",
            "currency": "£",
            "catwalkAppearances": 4,
            "appearanceThemes": {
                "1": "Denim",
                "2": "Leisureware",
                "3": "Draped Eveningwear",
                "4": "Grand Finale",
            },
            "models": [
                {"id": "m1", "firstName": "Elena", "walkOrder": 1, "notes": "Show Opener. Wears sleek updos for appearances 1-2."},
                {"id": "m2", "firstName": "Sophia", "walkOrder": 2, "notes": "Requires quick shoe swap between Appearance 2 and 3."},
                {"id": "m3", "firstName": "Marcus", "walkOrder": 3, "notes": "Tailored fit; check blazer sleeve length."},
                {"id": "m4", "firstName": "Amara", "walkOrder": 4, "notes": "Statement jewellery focus; delicate ear clasp."},
                {"id": "m5", "firstName": "Chloe", "walkOrder": 5, "notes": "Show Closer (Finale look). Dramatic train."},
            ],
            "items": [
                {"id": "c1", "itemId": "silorg950", "name": "Silk Organza Trench Coat with Belt", "category": "clothing", "price": 950.00},
                {"id": "c2", "itemId": "hanchi1850", "name": "Hand-Pleated Chiffon Halter Gown", "category": "clothing", "price": 1850.00},
                {"id": "c3", "itemId": "taidou780", "name": "Tailored Double-Breasted Wool Blazer", "category": "clothing", "price": 780.00},
                {"id": "c4", "itemId": "higsil420", "name": "High-Waisted Silk Crepe Palazzo Trousers", "category": "clothing", "price": 420.00},
                {"id": "c5", "itemId": "drasat340", "name": "Draped Satin Corset Bodice Top", "category": "clothing", "price": 340.00},
                {"id": "c6", "itemId": "midvel890", "name": "Midnight Velvet Asymmetric Cape", "category": "clothing", "price": 890.00},
                {"id": "c7", "itemId": "metjac460", "name": "Metallic Jacquard Tiered Midi Skirt", "category": "clothing", "price": 460.00},
                {"id": "c8", "itemId": "scucas520", "name": "Sculptural Cashmere Turtleneck Knit", "category": "clothing", "price": 520.00},
                {"id": "c9", "itemId": "emecut1250", "name": "Emerald Cut-Out Evening Slip Dress", "category": "clothing", "price": 1250.00},
                {"id": "c10", "itemId": "strove610", "name": "Structured Oversized Tuxedo Waistcoat", "category": "clothing", "price": 610.00},
                {"id": "j1", "itemId": "18kcha1100", "name": "18k Champagne Gold Pavé Choker", "category": "jewellery", "price": 1100.00},
                {"id": "j2", "itemId": "casfre340", "name": "Cascading Freshwater Pearl Drop Earrings", "category": "jewellery", "price": 340.00},
                {"id": "j3", "itemId": "hambra260", "name": "Hammered Brass Architectural Cuff Bangle", "category": "jewellery", "price": 260.00},
                {"id": "j4", "itemId": "bessmo480", "name": "Bespoke Smoky Quartz Cocktail Ring", "category": "jewellery", "price": 480.00},
                {"id": "j5", "itemId": "laypla750", "name": "Layered Platinum Herringbone Chain", "category": "jewellery", "price": 750.00},
                {"id": "j6", "itemId": "diapav580", "name": "Diamond Pavé Orbit Ear Cuffs (Pair)", "category": "jewellery", "price": 580.00},
                {"id": "j7", "itemId": "carobs390", "name": "Carved Obsidian Brooch with Gold Setting", "category": "jewellery", "price": 390.00},
                {"id": "f1", "itemId": "satank560", "name": "Satin Ankle-Wrap Stiletto Sandals (Black)", "category": "footwear", "price": 560.00},
                {"id": "f2", "itemId": "patlea490", "name": "Patent Leather Pointed Slingback Mules (Champagne)", "category": "footwear", "price": 490.00},
                {"id": "f3", "itemId": "velpla530", "name": "Velvet Platform Block-Heel Pumps (Midnight Navy)", "category": "footwear", "price": 530.00},
                {"id": "f4", "itemId": "emblea820", "name": "Embossed Leather Sculpted Heel Boots (Burgundy)", "category": "footwear", "price": 820.00},
                {"id": "f5", "itemId": "minmet480", "name": "Minimalist Metallic Strappy Stiletto (Gold)", "category": "footwear", "price": 480.00},
            ],
            "assignments": {
                "m1_1": {"clothingIds": ["c1", "c4"], "jewelleryIds": ["j1", "j3"], "footwearId": "f2"},
                "m2_1": {"clothingIds": ["c3", "c5", "c4"], "jewelleryIds": ["j2", "j4"], "footwearId": "f1"},
                "m3_1": {"clothingIds": ["c3", "c8", "c4"], "jewelleryIds": ["j5"], "footwearId": "f4"},
                "m4_1": {"clothingIds": ["c5", "c7"], "jewelleryIds": ["j1", "j6", "j3"], "footwearId": "f1"},
                "m5_1": {"clothingIds": ["c10", "c4"], "jewelleryIds": ["j3", "j7"], "footwearId": "f2"},
                "m1_2": {"clothingIds": ["c3", "c5", "c7"], "jewelleryIds": ["j2", "j4"], "footwearId": "f1"},
                "m2_2": {"clothingIds": ["c8", "c7"], "jewelleryIds": ["j6", "j3"], "footwearId": "f3"},
                "m3_2": {"clothingIds": ["c1", "c4"], "jewelleryIds": ["j7"], "footwearId": "f4"},
                "m4_2": {"clothingIds": ["c10", "c8", "c4"], "jewelleryIds": ["j1", "j2"], "footwearId": "f5"},
                "m5_2": {"clothingIds": ["c3", "c4"], "jewelleryIds": ["j5", "j4"], "footwearId": "f1"},
                "m1_3": {"clothingIds": ["c9"], "jewelleryIds": ["j1", "j2", "j4"], "footwearId": "f5"},
                "m2_3": {"clothingIds": ["c9", "c6"], "jewelleryIds": ["j5", "j3"], "footwearId": "f3"},
                "m3_3": {"clothingIds": ["c3", "c10", "c4"], "jewelleryIds": ["j7", "j4"], "footwearId": "f4"},
                "m4_3": {"clothingIds": ["c2"], "jewelleryIds": ["j1", "j4", "j6"], "footwearId": "f5"},
                "m5_3": {"clothingIds": ["c6", "c5", "c4"], "jewelleryIds": ["j2", "j3"], "footwearId": "f1"},
                "m1_4": {"clothingIds": ["c2", "c6"], "jewelleryIds": ["j1", "j2", "j3", "j4"], "footwearId": "f5"},
                "m2_4": {"clothingIds": ["c1", "c2"], "jewelleryIds": ["j5", "j6"], "footwearId": "f1"},
                "m3_4": {"clothingIds": ["c6", "c3", "c4"], "jewelleryIds": ["j7", "j1"], "footwearId": "f4"},
                "m4_4": {"clothingIds": ["c9", "c6"], "jewelleryIds": ["j2", "j4", "j6"], "footwearId": "f3"},
                "m5_4": {"clothingIds": ["c2", "c6", "c10"], "jewelleryIds": ["j1", "j2", "j5"], "footwearId": "f5"},
            },
        },
        {
            "id": "show_2026_aw",
            "name": "NOIR // Autumn/Winter 2026 Gala Presentation",
            "season": "Autumn/Winter",
            "year": 2026,
            "date": "2026-10-24",
            "venue": "Royal Horticultural Halls, Westminster, London",
            "currency": "£",
            "catwalkAppearances": 3,
            "appearanceThemes": {
                "1": "Heavy Wool Tailoring",
                "2": "Leather & Cashmere",
                "3": "Gala Evening Noir",
            },
            "models": [
                {"id": "m1_aw", "firstName": "Freja", "walkOrder": 1, "notes": "Heavy wool look opener"},
                {"id": "m2_aw", "firstName": "Aria", "walkOrder": 2, "notes": "Leather boots change"},
                {"id": "m3_aw", "firstName": "Julian", "walkOrder": 3, "notes": "Structured coats"},
            ],
            "items": [
                {"id": "c_aw1", "itemId": "casdou1650", "name": "Cashmere Double-Face Greatcoat", "category": "clothing", "price": 1650.00},
                {"id": "c_aw2", "itemId": "leapan540", "name": "Leather Paneled Pencil Skirt", "category": "clothing", "price": 540.00},
                {"id": "c_aw3", "itemId": "merrib310", "name": "Merino Ribbed Polo Jumper", "category": "clothing", "price": 310.00},
                {"id": "j_aw1", "itemId": "brusil420", "name": "Brutalist Silver Torque Choker", "category": "jewellery", "price": 420.00},
                {"id": "f_aw1", "itemId": "ovenap890", "name": "Over-The-Knee Nappa Boots", "category": "footwear", "price": 890.00},
            ],
            "assignments": {
                "m1_aw_1": {"clothingIds": ["c_aw1", "c_aw3"], "jewelleryIds": ["j_aw1"], "footwearId": "f_aw1"},
                "m2_aw_1": {"clothingIds": ["c_aw2", "c_aw3"], "jewelleryIds": ["j_aw1"], "footwearId": "f_aw1"},
                "m3_aw_1": {"clothingIds": ["c_aw1"], "jewelleryIds": [], "footwearId": "f_aw1"},
            },
        },
    ],
}


def generate_item_id(name: str, price: float, existing_item_ids: Optional[List[str]] = None) -> str:
    """Generate lower-case unique item code prefix based on name and rounded price."""
    if not name or not isinstance(name, str):
        name = "item"
    words = re.findall(r"[a-z0-9]+", name.lower())
    if len(words) >= 2:
        prefix = words[0][:3] + words[1][:3]
    elif len(words) == 1:
        prefix = words[0][:6]
    else:
        prefix = "item"
    if not prefix:
        prefix = "item"

    price_num = int(abs(float(price or 0)))
    base_id = f"{prefix}{price_num}".lower()
    final_id = base_id
    counter = 2

    existing_set = {str(i).lower() for i in (existing_item_ids or []) if i}
    while final_id in existing_set:
        final_id = f"{base_id}-{counter}"
        counter += 1
    return final_id


class FashionShowDatabase:
    def __init__(self, db_path: str = DB_FILE_PATH):
        self.db_path = db_path
        self._init_schema()

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.execute("PRAGMA journal_mode = WAL;")
        return conn

    def _init_schema(self) -> None:
        with self.get_connection() as conn:
            cur = conn.cursor()

            # 1. Shows
            cur.execute("""
                CREATE TABLE IF NOT EXISTS shows (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    season TEXT,
                    year INTEGER,
                    date TEXT,
                    venue TEXT,
                    currency TEXT DEFAULT '£',
                    catwalk_appearances INTEGER DEFAULT 3,
                    appearance_themes TEXT,
                    created_at TEXT
                );
            """)

            # 2. Models
            cur.execute("""
                CREATE TABLE IF NOT EXISTS models (
                    id TEXT PRIMARY KEY,
                    show_id TEXT NOT NULL,
                    first_name TEXT NOT NULL,
                    walk_order INTEGER NOT NULL,
                    notes TEXT,
                    FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE
                );
            """)
            cur.execute("CREATE INDEX IF NOT EXISTS idx_models_show ON models(show_id);")

            # 3. Items
            cur.execute("""
                CREATE TABLE IF NOT EXISTS items (
                    id TEXT PRIMARY KEY,
                    show_id TEXT NOT NULL,
                    item_id TEXT,
                    name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    price REAL NOT NULL,
                    FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE
                );
            """)
            cur.execute("CREATE INDEX IF NOT EXISTS idx_items_show ON items(show_id);")

            # 4. Assignments
            cur.execute("""
                CREATE TABLE IF NOT EXISTS assignments (
                    show_id TEXT NOT NULL,
                    model_id TEXT NOT NULL,
                    appearance_index INTEGER NOT NULL,
                    clothing_ids TEXT NOT NULL,
                    jewellery_ids TEXT NOT NULL,
                    footwear_id TEXT,
                    PRIMARY KEY (show_id, model_id, appearance_index),
                    FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE
                );
            """)
            cur.execute("CREATE INDEX IF NOT EXISTS idx_assignments_show ON assignments(show_id);")

            # 5. App state
            cur.execute("""
                CREATE TABLE IF NOT EXISTS app_state (
                    key TEXT PRIMARY KEY,
                    value TEXT
                );
            """)

            conn.commit()

            # Seed if empty
            cur.execute("SELECT COUNT(*) as count FROM shows;")
            count = cur.fetchone()["count"]
            if count == 0:
                self.import_data(DEFAULT_INITIAL_DATA)

    def get_all_data(self) -> Dict[str, Any]:
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM shows ORDER BY created_at ASC;")
            show_rows = cur.fetchall()

            cur.execute("SELECT value FROM app_state WHERE key = 'activeShowId';")
            active_row = cur.fetchone()
            active_show_id = active_row["value"] if active_row else None

            shows = []
            for s in show_rows:
                show_id = s["id"]

                cur.execute("SELECT * FROM models WHERE show_id = ? ORDER BY walk_order ASC;", (show_id,))
                models = [
                    {
                        "id": m["id"],
                        "firstName": m["first_name"],
                        "walkOrder": m["walk_order"],
                        "notes": m["notes"] or "",
                    }
                    for m in cur.fetchall()
                ]

                cur.execute("SELECT * FROM items WHERE show_id = ?;", (show_id,))
                items = [
                    {
                        "id": i["id"],
                        "itemId": i["item_id"] or generate_item_id(i["name"], i["price"], []),
                        "name": i["name"],
                        "category": i["category"],
                        "price": float(i["price"]),
                    }
                    for i in cur.fetchall()
                ]

                cur.execute("SELECT * FROM assignments WHERE show_id = ?;", (show_id,))
                assignments = {}
                for a in cur.fetchall():
                    key = f"{a['model_id']}_{a['appearance_index']}"
                    assignments[key] = {
                        "clothingIds": json.loads(a["clothing_ids"] or "[]"),
                        "jewelleryIds": json.loads(a["jewellery_ids"] or "[]"),
                        "footwearId": a["footwear_id"],
                    }

                appearance_themes = {}
                if s["appearance_themes"]:
                    try:
                        appearance_themes = json.loads(s["appearance_themes"])
                    except Exception:
                        appearance_themes = {}

                shows.append({
                    "id": s["id"],
                    "name": s["name"],
                    "season": s["season"],
                    "year": s["year"],
                    "date": s["date"],
                    "venue": s["venue"],
                    "currency": s["currency"],
                    "catwalkAppearances": s["catwalk_appearances"],
                    "appearanceThemes": appearance_themes,
                    "models": models,
                    "items": items,
                    "assignments": assignments,
                })

            if not active_show_id and shows:
                active_show_id = shows[0]["id"]

            return {"activeShowId": active_show_id, "shows": shows}

    def import_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        if not data or "shows" not in data or not isinstance(data["shows"], list):
            raise ValueError("Invalid data format: shows array is required.")

        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("DELETE FROM assignments;")
            cur.execute("DELETE FROM items;")
            cur.execute("DELETE FROM models;")
            cur.execute("DELETE FROM shows;")

            for show in data["shows"]:
                cur.execute(
                    """
                    INSERT INTO shows (id, name, season, year, date, venue, currency, catwalk_appearances, appearance_themes, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        show["id"],
                        show["name"],
                        show.get("season", "Spring/Summer"),
                        int(show.get("year", 2026)),
                        show.get("date", "2026-05-18"),
                        show.get("venue", "Catwalk Hall"),
                        show.get("currency", "£"),
                        int(show.get("catwalkAppearances", 3)),
                        json.dumps(show.get("appearanceThemes", {})),
                        show.get("createdAt", "2026-05-18T00:00:00.000Z"),
                    ),
                )

                for idx, m in enumerate(show.get("models", [])):
                    cur.execute(
                        """
                        INSERT INTO models (id, show_id, first_name, walk_order, notes)
                        VALUES (?, ?, ?, ?, ?)
                        """,
                        (
                            m["id"],
                            show["id"],
                            m["firstName"],
                            m.get("walkOrder", idx + 1),
                            m.get("notes", ""),
                        ),
                    )

                show_item_codes = []
                for item in show.get("items", []):
                    code = item.get("itemId") or generate_item_id(item["name"], item.get("price", 0), show_item_codes)
                    show_item_codes.append(code)
                    cur.execute(
                        """
                        INSERT INTO items (id, show_id, item_id, name, category, price)
                        VALUES (?, ?, ?, ?, ?, ?)
                        """,
                        (
                            item["id"],
                            show["id"],
                            code,
                            item["name"],
                            item["category"],
                            float(item.get("price", 0.0)),
                        ),
                    )

                assignments = show.get("assignments", {})
                if isinstance(assignments, dict):
                    for key, ass in assignments.items():
                        parts = key.split("_")
                        app_idx = int(parts.pop())
                        model_id = "_".join(parts)
                        if model_id and app_idx:
                            cur.execute(
                                """
                                INSERT INTO assignments (show_id, model_id, appearance_index, clothing_ids, jewellery_ids, footwear_id)
                                VALUES (?, ?, ?, ?, ?, ?)
                                """,
                                (
                                    show["id"],
                                    model_id,
                                    app_idx,
                                    json.dumps(ass.get("clothingIds", [])),
                                    json.dumps(ass.get("jewelleryIds", [])),
                                    ass.get("footwearId"),
                                ),
                            )

            active_id = data.get("activeShowId") or (data["shows"][0]["id"] if data["shows"] else None)
            if active_id:
                cur.execute("INSERT OR REPLACE INTO app_state (key, value) VALUES ('activeShowId', ?)", (active_id,))

            conn.commit()
            return {"success": True, "showsCount": len(data["shows"])}

    def set_active_show_id(self, show_id: str) -> str:
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("INSERT OR REPLACE INTO app_state (key, value) VALUES ('activeShowId', ?)", (show_id,))
            conn.commit()
        return show_id

    def get_show_by_id(self, show_id: str) -> Optional[Dict[str, Any]]:
        all_data = self.get_all_data()
        for s in all_data["shows"]:
            if s["id"] == show_id:
                return s
        return None

    def create_show(
        self,
        name: str,
        season: str = "Spring/Summer",
        year: int = 2026,
        date: str = "2026-05-18",
        venue: str = "Catwalk Hall",
        currency: str = "£",
        catwalk_appearances: int = 3,
        appearance_themes: Optional[Dict[str, str]] = None,
        show_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        import time
        sid = show_id or f"show_{int(time.time() * 1000)}"
        appearances = max(1, min(5, int(catwalk_appearances or 3)))

        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO shows (id, name, season, year, date, venue, currency, catwalk_appearances, appearance_themes, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    sid,
                    name,
                    season,
                    int(year),
                    date,
                    venue,
                    currency,
                    appearances,
                    json.dumps(appearance_themes or {}),
                    "2026-05-18T00:00:00.000Z",
                ),
            )
            cur.execute("INSERT OR REPLACE INTO app_state (key, value) VALUES ('activeShowId', ?)", (sid,))
            conn.commit()

        return self.get_show_by_id(sid)  # type: ignore

    def update_show(self, show_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        current = self.get_show_by_id(show_id)
        if not current:
            return None

        name = updates.get("name", current["name"]).strip()
        season = updates.get("season", current["season"])
        year = int(updates.get("year", current["year"]))
        date = updates.get("date", current["date"])
        venue = updates.get("venue", current["venue"]).strip()
        currency = updates.get("currency", current["currency"]).strip() or "£"
        appearances = max(1, min(5, int(updates.get("catwalkAppearances", current["catwalkAppearances"]))))

        themes = dict(current.get("appearanceThemes", {}))
        if "appearanceThemes" in updates and isinstance(updates["appearanceThemes"], dict):
            themes.update(updates["appearanceThemes"])

        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute(
                """
                UPDATE shows
                SET name = ?, season = ?, year = ?, date = ?, venue = ?, currency = ?, catwalk_appearances = ?, appearance_themes = ?
                WHERE id = ?
                """,
                (name, season, year, date, venue, currency, appearances, json.dumps(themes), show_id),
            )
            conn.commit()

        return self.get_show_by_id(show_id)

    def delete_show(self, show_id: str) -> Optional[str]:
        all_data = self.get_all_data()
        if len(all_data["shows"]) <= 1:
            raise ValueError("Cannot delete the only existing fashion show.")

        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("DELETE FROM shows WHERE id = ?;", (show_id,))
            cur.execute("SELECT id FROM shows LIMIT 1;")
            remaining = cur.fetchone()
            rem_id = remaining["id"] if remaining else None
            if rem_id:
                cur.execute("INSERT OR REPLACE INTO app_state (key, value) VALUES ('activeShowId', ?)", (rem_id,))
            conn.commit()
            return rem_id

    def duplicate_show(self, source_show_id: str, new_name: str) -> Optional[Dict[str, Any]]:
        source = self.get_show_by_id(source_show_id)
        if not source:
            return None

        import time
        new_id = f"show_{int(time.time() * 1000)}"

        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO shows (id, name, season, year, date, venue, currency, catwalk_appearances, appearance_themes, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    new_id,
                    new_name or f"{source['name']} (Copy)",
                    source["season"],
                    source["year"],
                    source["date"],
                    source["venue"],
                    source["currency"],
                    source["catwalkAppearances"],
                    json.dumps(source.get("appearanceThemes", {})),
                    "2026-05-18T00:00:00.000Z",
                ),
            )

            for m in source["models"]:
                cur.execute(
                    "INSERT INTO models (id, show_id, first_name, walk_order, notes) VALUES (?, ?, ?, ?, ?)",
                    (m["id"], new_id, m["firstName"], m["walkOrder"], m["notes"]),
                )

            for i in source["items"]:
                cur.execute(
                    "INSERT INTO items (id, show_id, item_id, name, category, price) VALUES (?, ?, ?, ?, ?, ?)",
                    (i["id"], new_id, i["itemId"], i["name"], i["category"], i["price"]),
                )

            for key, ass in source["assignments"].items():
                parts = key.split("_")
                app_idx = int(parts.pop())
                model_id = "_".join(parts)
                cur.execute(
                    """
                    INSERT INTO assignments (show_id, model_id, appearance_index, clothing_ids, jewellery_ids, footwear_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (
                        new_id,
                        model_id,
                        app_idx,
                        json.dumps(ass.get("clothingIds", [])),
                        json.dumps(ass.get("jewelleryIds", [])),
                        ass.get("footwearId"),
                    ),
                )

            cur.execute("INSERT OR REPLACE INTO app_state (key, value) VALUES ('activeShowId', ?)", (new_id,))
            conn.commit()

        return self.get_show_by_id(new_id)

    # --- Models ---

    def add_model(self, show_id: str, first_name: str, notes: str = "") -> Dict[str, Any]:
        trimmed_name = (first_name or "").strip()
        if not trimmed_name:
            raise ValueError("Model first name is required.")

        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) as count FROM models WHERE show_id = ?;", (show_id,))
            count = cur.fetchone()["count"]
            if count >= 5:
                raise ValueError("Maximum of 5 models allowed per fashion show event.")

            import time, random
            mid = f"m_{int(time.time() * 1000)}_{random.randint(1000, 9999)}"
            next_order = count + 1

            cur.execute(
                "INSERT INTO models (id, show_id, first_name, walk_order, notes) VALUES (?, ?, ?, ?, ?)",
                (mid, show_id, trimmed_name, next_order, notes.strip()),
            )
            conn.commit()

        return {"id": mid, "showId": show_id, "firstName": trimmed_name, "walkOrder": next_order, "notes": notes.strip()}

    def update_model(self, show_id: str, model_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM models WHERE id = ? AND show_id = ?;", (model_id, show_id))
            current = cur.fetchone()
            if not current:
                return None

            first_name = updates.get("firstName", current["first_name"]).strip() or current["first_name"]
            notes = updates.get("notes", current["notes"] or "").strip()
            walk_order = int(updates.get("walkOrder", current["walk_order"]))

            cur.execute(
                "UPDATE models SET first_name = ?, notes = ?, walk_order = ? WHERE id = ? AND show_id = ?",
                (first_name, notes, walk_order, model_id, show_id),
            )

            if "walkOrder" in updates:
                self._normalize_walk_orders(conn, show_id)

            conn.commit()

        show = self.get_show_by_id(show_id)
        if show:
            for m in show["models"]:
                if m["id"] == model_id:
                    return m
        return None

    def delete_model(self, show_id: str, model_id: str) -> bool:
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("DELETE FROM models WHERE id = ? AND show_id = ?;", (model_id, show_id))
            cur.execute("DELETE FROM assignments WHERE model_id = ? AND show_id = ?;", (model_id, show_id))
            self._normalize_walk_orders(conn, show_id)
            conn.commit()
        return True

    def reorder_models(self, show_id: str, model_id_list: List[str]) -> None:
        with self.get_connection() as conn:
            cur = conn.cursor()
            for idx, mid in enumerate(model_id_list):
                cur.execute("UPDATE models SET walk_order = ? WHERE id = ? AND show_id = ?", (idx + 1, mid, show_id))
            conn.commit()

    def _normalize_walk_orders(self, conn: sqlite3.Connection, show_id: str) -> None:
        cur = conn.cursor()
        cur.execute("SELECT id FROM models WHERE show_id = ? ORDER BY walk_order ASC;", (show_id,))
        models = cur.fetchall()
        for idx, m in enumerate(models):
            cur.execute("UPDATE models SET walk_order = ? WHERE id = ?;", (idx + 1, m["id"]))

    # --- Items ---

    def add_item(self, show_id: str, name: str, category: str, price: float, item_id: Optional[str] = None) -> Dict[str, Any]:
        trimmed_name = (name or "").strip()
        if not trimmed_name:
            raise ValueError("Item name is required.")
        if category not in ("clothing", "jewellery", "footwear"):
            raise ValueError("Valid category required: clothing, jewellery, or footwear.")

        parsed_price = round(float(price or 0), 2)
        if parsed_price < 0:
            raise ValueError("Valid retail price is required.")

        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT item_id FROM items WHERE show_id = ?;", (show_id,))
            existing_codes = [r["item_id"] for r in cur.fetchall() if r["item_id"]]

            code = (item_id or "").strip().lower() if item_id else generate_item_id(trimmed_name, parsed_price, existing_codes)

            import time, random
            iid = f"itm_{int(time.time() * 1000)}_{random.randint(1000, 9999)}"

            cur.execute(
                "INSERT INTO items (id, show_id, item_id, name, category, price) VALUES (?, ?, ?, ?, ?, ?)",
                (iid, show_id, code, trimmed_name, category, parsed_price),
            )
            conn.commit()

        return {"id": iid, "showId": show_id, "itemId": code, "name": trimmed_name, "category": category, "price": parsed_price}

    def update_item(self, show_id: str, item_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM items WHERE id = ? AND show_id = ?;", (item_id, show_id))
            current = cur.fetchone()
            if not current:
                return None

            name = updates.get("name", current["name"]).strip() or current["name"]
            category = updates.get("category", current["category"])
            if category not in ("clothing", "jewellery", "footwear"):
                category = current["category"]

            price = current["price"]
            if "price" in updates:
                price = round(float(updates["price"]), 2)

            code = current["item_id"]
            if "itemId" in updates and updates["itemId"]:
                code = updates["itemId"].strip().lower()
            elif "name" in updates or "price" in updates:
                cur.execute("SELECT item_id FROM items WHERE show_id = ? AND id != ?;", (show_id, item_id))
                existing = [r["item_id"] for r in cur.fetchall() if r["item_id"]]
                code = generate_item_id(name, price, existing)

            cur.execute(
                "UPDATE items SET item_id = ?, name = ?, category = ?, price = ? WHERE id = ? AND show_id = ?",
                (code, name, category, price, item_id, show_id),
            )
            conn.commit()

        return {"id": item_id, "showId": show_id, "itemId": code, "name": name, "category": category, "price": price}

    def delete_item(self, show_id: str, item_id: str) -> bool:
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("DELETE FROM items WHERE id = ? AND show_id = ?;", (item_id, show_id))

            # Remove from assignments
            cur.execute("SELECT * FROM assignments WHERE show_id = ?;", (show_id,))
            for a in cur.fetchall():
                cloth = json.loads(a["clothing_ids"] or "[]")
                jewel = json.loads(a["jewellery_ids"] or "[]")
                foot = a["footwear_id"]
                changed = False

                if item_id in cloth:
                    cloth.remove(item_id)
                    changed = True
                if item_id in jewel:
                    jewel.remove(item_id)
                    changed = True
                if foot == item_id:
                    foot = None
                    changed = True

                if changed:
                    cur.execute(
                        """
                        UPDATE assignments
                        SET clothing_ids = ?, jewellery_ids = ?, footwear_id = ?
                        WHERE show_id = ? AND model_id = ? AND appearance_index = ?
                        """,
                        (json.dumps(cloth), json.dumps(jewel), foot, show_id, a["model_id"], a["appearance_index"]),
                    )
            conn.commit()
        return True

    # --- Assignments ---

    def set_assignment(
        self,
        show_id: str,
        model_id: str,
        appearance_index: int,
        clothing_ids: List[str],
        jewellery_ids: List[str],
        footwear_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        valid_clothing = (clothing_ids or [])[:4]
        valid_jewellery = (jewellery_ids or [])[:4]
        valid_footwear = footwear_id or None

        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO assignments (show_id, model_id, appearance_index, clothing_ids, jewellery_ids, footwear_id)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(show_id, model_id, appearance_index) DO UPDATE SET
                    clothing_ids = excluded.clothing_ids,
                    jewellery_ids = excluded.jewellery_ids,
                    footwear_id = excluded.footwear_id
                """,
                (
                    show_id,
                    model_id,
                    int(appearance_index),
                    json.dumps(valid_clothing),
                    json.dumps(valid_jewellery),
                    valid_footwear,
                ),
            )
            conn.commit()

        return {"clothingIds": valid_clothing, "jewelleryIds": valid_jewellery, "footwearId": valid_footwear}

    def set_appearance_theme(self, show_id: str, appearance_index: int, theme_name: str) -> Dict[str, str]:
        show = self.get_show_by_id(show_id)
        if not show:
            return {}

        themes = dict(show.get("appearanceThemes", {}))
        themes[str(appearance_index)] = (theme_name or "").strip()

        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("UPDATE shows SET appearance_themes = ? WHERE id = ?;", (json.dumps(themes), show_id))
            conn.commit()

        return themes

    def reset_to_default(self) -> Dict[str, Any]:
        return self.import_data(DEFAULT_INITIAL_DATA)
