"""
Main launcher script for Atelier Fashion Show Runway & Wardrobe Management System
"""

import sys
import server
import test_app
import unittest

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        suite = unittest.defaultTestLoader.loadTestsFromModule(test_app)
        runner = unittest.TextTestRunner(verbosity=2)
        result = runner.run(suite)
        sys.exit(not result.wasSuccessful())
    else:
        server.run_server()
