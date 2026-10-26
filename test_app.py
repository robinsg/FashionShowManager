"""
Automated Test Suite for Fashion Show Manager Python Application
Uses unittest with a dedicated test SQLite database to guarantee zero impact on production data.
"""

import json
import os
import shutil
import tempfile
import threading
import time
import urllib.parse
import urllib.request
import unittest

# Point test suite to dedicated test database BEFORE importing db and server
TEST_DB_PATH = os.path.join(tempfile.gettempdir(), "test_fashion_show_suite.db")
os.environ["SQLITE_DB_PATH"] = TEST_DB_PATH

from db import FashionShowDatabase, DEFAULT_INITIAL_DATA, generate_item_id
import server


class TestFashionShowDatabase(unittest.TestCase):

    def setUp(self):
        if os.path.exists(TEST_DB_PATH):
            os.remove(TEST_DB_PATH)
        self.db = FashionShowDatabase(TEST_DB_PATH)

    def tearDown(self):
        if os.path.exists(TEST_DB_PATH):
            os.remove(TEST_DB_PATH)

    def test_database_initialization_and_seeding(self):
        data = self.db.get_all_data()
        self.assertEqual(len(data["shows"]), 2, "Should seed 2 default fashion shows")
        self.assertEqual(data["activeShowId"], "show_2026_ss", "Should set default active show")
        self.assertEqual(len(data["shows"][0]["models"]), 5, "Should have 5 models in first show")
        self.assertEqual(len(data["shows"][0]["items"]), 22, "Should have 22 wardrobe items in first show")
        self.assertEqual(len(data["shows"][0]["assignments"]), 20, "Should have 20 assignments")

    def test_show_crud_operations(self):
        new_show = self.db.create_show(
            name="Milan Fashion Gala 2027",
            season="Spring/Summer",
            year=2027,
            date="2027-04-10",
            venue="Palazzo Reale, Milan",
            currency="€",
            catwalk_appearances=3,
            appearance_themes={"1": "Silk Couture"},
        )
        self.assertEqual(new_show["name"], "Milan Fashion Gala 2027")
        self.assertEqual(self.db.get_all_data()["activeShowId"], new_show["id"])

        updated = self.db.update_show(new_show["id"], {"venue": "Duomo Hall"})
        self.assertEqual(updated["venue"], "Duomo Hall")

        copy_show = self.db.duplicate_show(new_show["id"], "Milan Copy")
        self.assertEqual(copy_show["name"], "Milan Copy")
        self.assertEqual(len(self.db.get_all_data()["shows"]), 4)

        self.db.delete_show(copy_show["id"])
        self.assertEqual(len(self.db.get_all_data()["shows"]), 3)

    def test_model_operations_and_5_model_constraint(self):
        show = self.db.get_show_by_id("show_2026_ss")
        # Default show already has 5 models, adding a 6th should raise ValueError
        with self.assertRaises(ValueError):
            self.db.add_model(show["id"], "Naomi")

        # Delete 1 model then add
        self.db.delete_model(show["id"], "m5")
        model = self.db.add_model(show["id"], "Naomi", "Lead walk")
        self.assertEqual(model["firstName"], "Naomi")
        self.assertEqual(model["walkOrder"], 5)

    def test_item_and_assignment_operations(self):
        show = self.db.get_show_by_id("show_2026_ss")
        item = self.db.add_item(show["id"], "Maruti pumps", "footwear", 115.00)
        self.assertEqual(item["itemId"], "marpum115")

        assignment = self.db.set_assignment(
            show["id"], "m1", 1, clothing_ids=["c1"], jewellery_ids=["j1"], footwear_id=item["id"]
        )
        self.assertEqual(assignment["footwearId"], item["id"])

        self.db.delete_item(show["id"], item["id"])
        updated_show = self.db.get_show_by_id(show["id"])
        self.assertIsNone(updated_show["assignments"]["m1_1"]["footwearId"])


class TestHTTPServerIntegration(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        if os.path.exists(TEST_DB_PATH):
            os.remove(TEST_DB_PATH)
        server.db = FashionShowDatabase(TEST_DB_PATH)

        cls.port = 3899
        server.PORT = cls.port
        server.HOST = "127.0.0.1"

        cls.server_address = ("127.0.0.1", cls.port)
        cls.httpd = server.HTTPServer(cls.server_address, server.FashionShowHandler)
        cls.server_thread = threading.Thread(target=cls.httpd.serve_forever)
        cls.server_thread.daemon = True
        cls.server_thread.start()
        time.sleep(0.3)

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()
        if os.path.exists(TEST_DB_PATH):
            os.remove(TEST_DB_PATH)

    def test_api_status_endpoint(self):
        url = f"http://127.0.0.1:{self.port}/api/status"
        req = urllib.request.urlopen(url)
        self.assertEqual(req.status, 200)
        data = json.loads(req.read().decode("utf-8"))
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["engine"], "SQLite")

    def test_server_side_rendered_pages(self):
        # Ensure active show is show_2026_ss
        server.db.set_active_show_id("show_2026_ss")

        # GET Overview
        req = urllib.request.urlopen(f"http://127.0.0.1:{self.port}/?tab=overview")
        self.assertEqual(req.status, 200)
        html = req.read().decode("utf-8")
        self.assertIn("HEIDI BOUTIQUE", html)
        self.assertIn("LUMIÈRE // Haute Couture", html)

        # GET Models
        req = urllib.request.urlopen(f"http://127.0.0.1:{self.port}/?tab=models")
        html = req.read().decode("utf-8")
        self.assertIn("Models Roster", html)
        self.assertIn("Elena", html)

    def test_post_form_actions(self):
        # Create Show Form POST
        post_data = urllib.parse.urlencode({
            "name": "Test Python Show 2028",
            "season": "Autumn/Winter",
            "year": "2028",
            "date": "2028-11-20",
            "venue": "London Fashion Centre",
            "currency": "£",
            "catwalkAppearances": "3",
        }).encode("utf-8")

        req = urllib.request.Request(
            f"http://127.0.0.1:{self.port}/create-show",
            data=post_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            method="POST",
        )
        res = urllib.request.urlopen(req)
        self.assertEqual(res.status, 200)

        # Confirm new show renders
        req_page = urllib.request.urlopen(f"http://127.0.0.1:{self.port}/?tab=overview")
        page_html = req_page.read().decode("utf-8")
        self.assertIn("Test Python Show 2028", page_html)


if __name__ == "__main__":
    unittest.main()
