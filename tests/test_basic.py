import unittest

from src.mayomi import get_greeting


class TestMayomi(unittest.TestCase):
    def test_greeting(self):
        self.assertEqual(get_greeting(), "MAYOMI")


if __name__ == "__main__":
    unittest.main()
