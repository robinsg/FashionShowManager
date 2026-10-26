"""
Atelier Runway & Wardrobe Management System
Python Web Server and HTML Rendering Engine
"""

import html
import json
import os
import sys
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import Any, Dict, List, Optional, Tuple

from db import FashionShowDatabase, DB_FILE_PATH, generate_item_id
from templates import render_page, escape

PORT = int(os.environ.get("PORT", 3000))
HOST = os.environ.get("HOST", "0.0.0.0")

db = FashionShowDatabase(DB_FILE_PATH)


def escape(val: Any) -> str:
    if val is None:
        return ""
    return html.escape(str(val))


class FashionShowHandler(BaseHTTPRequestHandler):

    def log_message(self, format: str, *args: Any) -> None:
        sys.stderr.write(f"[{self.log_date_time_string()}] {self.command} {self.path} - {format % args}\n")

    def parse_post_data(self) -> Dict[str, Any]:
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)
        content_type = self.headers.get("Content-Type", "")

        if "application/json" in content_type:
            try:
                return json.loads(body.decode("utf-8"))
            except Exception:
                return {}

        parsed = urllib.parse.parse_qs(body.decode("utf-8"))
        data = {}
        for key, value in parsed.items():
            if len(value) == 1:
                data[key] = value[0]
            else:
                data[key] = value
        return data

    def send_redirect(self, location: str) -> None:
        self.send_response(303)
        self.send_header("Location", location)
        self.end_headers()

    def send_html(self, content: str, status_code: int = 200) -> None:
        self.send_response(status_code)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(content.encode("utf-8"))

    def send_static_file(self, filepath: str) -> None:
        abs_path = os.path.abspath(filepath)
        root_dir = os.path.abspath(os.path.dirname(__file__))

        if not abs_path.startswith(root_dir):
            self.send_response(403)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"403 Forbidden")
            return

        if not os.path.isfile(abs_path):
            self.send_response(404)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"404 Not Found")
            return

        ext = os.path.splitext(abs_path)[1].lower()
        mime_types = {
            ".css": "text/css; charset=utf-8",
            ".js": "application/javascript; charset=utf-8",
            ".html": "text/html; charset=utf-8",
            ".json": "application/json; charset=utf-8",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".svg": "image/svg+xml",
            ".ico": "image/x-icon",
        }
        content_type = mime_types.get(ext, "application/octet-stream")

        try:
            with open(abs_path, "rb") as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(f"500 Internal Error: {e}".encode("utf-8"))

    def send_json(self, data: Any, status_code: int = 200) -> None:
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:
        parsed_url = urllib.parse.urlparse(self.path)
        req_path = parsed_url.path
        query_params = urllib.parse.parse_qs(parsed_url.query)

        if req_path.startswith("/css/") or req_path.startswith("/assets/"):
            return self.send_static_file("." + req_path)

        if req_path == "/api/status":
            all_data = db.get_all_data()
            return self.send_json({
                "status": "ok",
                "engine": "SQLite",
                "databaseFile": os.path.basename(db.db_path),
                "activeShowId": all_data["activeShowId"],
                "showsCount": len(all_data["shows"]),
            })

        if req_path == "/api/data":
            return self.send_json(db.get_all_data())

        if req_path == "/export":
            data = db.get_all_data()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Disposition", 'attachment; filename="fashion_show_backup.json"')
            self.end_headers()
            self.wfile.write(json.dumps(data, indent=2).encode("utf-8"))
            return

        all_data = db.get_all_data()
        active_show_id = all_data["activeShowId"]
        shows = all_data["shows"]
        active_show = next((s for s in shows if s["id"] == active_show_id), shows[0] if shows else None)

        if not active_show:
            return self.send_html("<h1>No Fashion Shows Available</h1>", 404)

        current_tab = query_params.get("tab", ["overview"])[0]
        msg = query_params.get("msg", [""])[0]

        html_content = render_page(active_show, shows, current_tab, query_params, msg)
        self.send_html(html_content)

    def do_POST(self) -> None:
        parsed_url = urllib.parse.urlparse(self.path)
        req_path = parsed_url.path
        params = self.parse_post_data()

        if req_path == "/api/reset":
            db.reset_to_default()
            return self.send_json({"success": True, "data": db.get_all_data()})

        if req_path == "/api/migrate":
            db.import_data(params)
            return self.send_json({
                "success": True,
                "migrated": True,
                "showsCount": len(params.get("shows", [])),
                "message": "Successfully migrated data into SQLite database.",
            })

        if req_path == "/api/active-show":
            show_id = params.get("showId")
            if show_id:
                db.set_active_show_id(show_id)
                return self.send_json({"success": True, "activeShowId": show_id})
            return self.send_json({"error": "showId is required"}, 400)

        if req_path == "/switch-show":
            show_id = params.get("show_id")
            if show_id:
                db.set_active_show_id(show_id)
            return self.send_redirect("/?tab=overview")

        if req_path == "/create-show":
            try:
                new_show = db.create_show(
                    name=params.get("name", "").strip() or "New Runway Show",
                    season=params.get("season", "Spring/Summer"),
                    year=int(params.get("year", 2026)),
                    date=params.get("date", "2026-05-18"),
                    venue=params.get("venue", "").strip() or "Catwalk Hall",
                    currency=params.get("currency", "£").strip() or "£",
                    catwalk_appearances=int(params.get("catwalkAppearances", 3)),
                )
                return self.send_redirect(f"/?tab=overview&msg=Show+'{urllib.parse.quote(new_show['name'])}'+created+successfully!")
            except Exception as e:
                return self.send_redirect(f"/?tab=overview&msg=Error:+{urllib.parse.quote(str(e))}")

        if req_path == "/edit-show":
            show_id = params.get("show_id")
            if show_id:
                try:
                    db.update_show(show_id, {
                        "name": params.get("name"),
                        "season": params.get("season"),
                        "year": params.get("year"),
                        "date": params.get("date"),
                        "venue": params.get("venue"),
                        "currency": params.get("currency"),
                        "catwalkAppearances": params.get("catwalkAppearances"),
                    })
                    return self.send_redirect("/?tab=overview&msg=Show+details+updated+successfully!")
                except Exception as e:
                    return self.send_redirect(f"/?tab=overview&msg=Error:+{urllib.parse.quote(str(e))}")
            return self.send_redirect("/?tab=overview")

        if req_path == "/duplicate-show":
            show_id = params.get("show_id")
            if show_id:
                try:
                    source = db.get_show_by_id(show_id)
                    copy_name = f"{source['name']} (Copy)" if source else "Copied Show"
                    db.duplicate_show(show_id, copy_name)
                    return self.send_redirect("/?tab=overview&msg=Duplicated+show+successfully!")
                except Exception as e:
                    return self.send_redirect(f"/?tab=overview&msg=Error:+{urllib.parse.quote(str(e))}")
            return self.send_redirect("/?tab=overview")

        if req_path == "/delete-show":
            show_id = params.get("show_id")
            if show_id:
                try:
                    db.delete_show(show_id)
                    return self.send_redirect("/?tab=overview&msg=Show+deleted+successfully!")
                except Exception as e:
                    return self.send_redirect(f"/?tab=overview&msg=Error:+{urllib.parse.quote(str(e))}")
            return self.send_redirect("/?tab=overview")

        if req_path == "/add-model":
            show_id = params.get("show_id")
            first_name = params.get("first_name", "")
            notes = params.get("notes", "")
            if show_id and first_name:
                try:
                    db.add_model(show_id, first_name, notes)
                    return self.send_redirect("/?tab=models&msg=Model+added+successfully!")
                except Exception as e:
                    return self.send_redirect(f"/?tab=models&msg=Error:+{urllib.parse.quote(str(e))}")
            return self.send_redirect("/?tab=models")

        if req_path == "/edit-model":
            show_id = params.get("show_id")
            model_id = params.get("model_id")
            if show_id and model_id:
                try:
                    db.update_model(show_id, model_id, {
                        "firstName": params.get("first_name"),
                        "notes": params.get("notes"),
                    })
                    return self.send_redirect("/?tab=models&msg=Model+updated+successfully!")
                except Exception as e:
                    return self.send_redirect(f"/?tab=models&msg=Error:+{urllib.parse.quote(str(e))}")
            return self.send_redirect("/?tab=models")

        if req_path == "/delete-model":
            show_id = params.get("show_id")
            model_id = params.get("model_id")
            if show_id and model_id:
                db.delete_model(show_id, model_id)
                return self.send_redirect("/?tab=models&msg=Model+removed+from+roster.")
            return self.send_redirect("/?tab=models")

        if req_path == "/reorder-model":
            show_id = params.get("show_id")
            model_id = params.get("model_id")
            direction = params.get("direction")
            if show_id and model_id and direction:
                show = db.get_show_by_id(show_id)
                if show:
                    models = show["models"]
                    idx = next((i for i, m in enumerate(models) if m["id"] == model_id), -1)
                    if direction == "up" and idx > 0:
                        models[idx], models[idx - 1] = models[idx - 1], models[idx]
                    elif direction == "down" and idx < len(models) - 1:
                        models[idx], models[idx + 1] = models[idx + 1], models[idx]
                    db.reorder_models(show_id, [m["id"] for m in models])
            return self.send_redirect("/?tab=models")

        if req_path == "/add-item":
            show_id = params.get("show_id")
            if show_id:
                try:
                    db.add_item(
                        show_id,
                        name=params.get("name", ""),
                        category=params.get("category", "clothing"),
                        price=float(params.get("price", 0.0)),
                        item_id=params.get("item_id"),
                    )
                    return self.send_redirect("/?tab=items&msg=Wardrobe+item+added+successfully!")
                except Exception as e:
                    return self.send_redirect(f"/?tab=items&msg=Error:+{urllib.parse.quote(str(e))}")
            return self.send_redirect("/?tab=items")

        if req_path == "/edit-item":
            show_id = params.get("show_id")
            item_id = params.get("item_id")
            if show_id and item_id:
                try:
                    updates = {}
                    if "name" in params:
                        updates["name"] = params["name"]
                    if "category" in params:
                        updates["category"] = params["category"]
                    if "price" in params:
                        updates["price"] = params["price"]
                    if "itemId" in params:
                        updates["itemId"] = params["itemId"]
                    db.update_item(show_id, item_id, updates)
                    return self.send_redirect("/?tab=items&msg=Item+updated+successfully!")
                except Exception as e:
                    return self.send_redirect(f"/?tab=items&msg=Error:+{urllib.parse.quote(str(e))}")
            return self.send_redirect("/?tab=items")

        if req_path == "/delete-item":
            show_id = params.get("show_id")
            item_id = params.get("item_id")
            if show_id and item_id:
                db.delete_item(show_id, item_id)
                return self.send_redirect("/?tab=items&msg=Wardrobe+item+deleted.")
            return self.send_redirect("/?tab=items")

        if req_path == "/set-theme":
            show_id = params.get("show_id")
            app_idx = int(params.get("appearance_index", 1))
            theme_name = params.get("theme_name", "")
            if show_id:
                db.set_appearance_theme(show_id, app_idx, theme_name)
            redirect_tab = params.get("redirect_tab", "matrix")
            return self.send_redirect(f"/?tab={redirect_tab}&msg=Appearance+theme+updated!")

        if req_path == "/save-assignment":
            show_id = params.get("show_id")
            model_id = params.get("model_id")
            app_idx = int(params.get("appearance_index", 1))

            clothing_ids = params.get("clothing_ids", [])
            if isinstance(clothing_ids, str):
                clothing_ids = [clothing_ids] if clothing_ids else []

            jewellery_ids = params.get("jewellery_ids", [])
            if isinstance(jewellery_ids, str):
                jewellery_ids = [jewellery_ids] if jewellery_ids else []

            footwear_id = params.get("footwear_id") or None

            if show_id and model_id:
                try:
                    db.set_assignment(show_id, model_id, app_idx, clothing_ids, jewellery_ids, footwear_id)
                    return self.send_redirect("/?tab=matrix&msg=Outfit+styled+successfully!")
                except Exception as e:
                    return self.send_redirect(f"/?tab=matrix&msg=Error:+{urllib.parse.quote(str(e))}")
            return self.send_redirect("/?tab=matrix")

        if req_path == "/reset-db":
            db.reset_to_default()
            return self.send_redirect("/?tab=overview&msg=Database+reset+to+default+showcase+data!")

        return self.send_redirect("/?tab=overview")


def run_server() -> None:
    server_address = (HOST, PORT)
    httpd = HTTPServer(server_address, FashionShowHandler)
    print(f"Fashion Show Manager Python Server running at http://{HOST if HOST != '0.0.0.0' else '127.0.0.1'}:{PORT}/")
    print(f"Connected SQLite database: {db.db_path}")

    pid_file = os.path.join(os.path.dirname(__file__), ".server.pid")
    with open(pid_file, "w") as f:
        f.write(str(os.getpid()))

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.server_close()
        if os.path.exists(pid_file):
            os.remove(pid_file)


if __name__ == "__main__":
    run_server()
