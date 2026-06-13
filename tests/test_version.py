import unittest

from src import __version__


class TestVersion(unittest.TestCase):
    def test_version_is_correct(self):
        self.assertEqual(__version__, "0.1.0")


if __name__ == "__main__":
    unittest.main()
