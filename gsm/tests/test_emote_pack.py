"""Check the shipped gecko stickers at their actual small-screen asset size."""
import hashlib
import json
import unittest
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
REACTIONS = {
    'neutral', 'huh', 'speechless', 'angry', 'cry', 'laugh', 'melon',
    'flat', 'okay', 'doubt', 'disgust', 'heh', 'heated', 'clap',
    'tableflip', 'hold-it', 'ignore', 'sweat', 'guilty', 'play-dead',
    'crash', 'peek', 'wait', 'plead', 'leave',
}


class GeckoEmotePackTests(unittest.TestCase):
    def test_complete_pack_has_distinct_transparent_webp_art(self):
        catalog = json.loads((ROOT / 'assets/emotes/gsm/manifest.json').read_text())
        self.assertEqual({item['id'] for item in catalog['items']}, REACTIONS)
        self.assertEqual(len(catalog['items']), len(REACTIONS))
        pictures = set()
        for item in catalog['items']:
            with self.subTest(emote=item['id']):
                path = ROOT / item['src']
                self.assertEqual(path, ROOT / 'assets/emotes/gsm' / (item['id'] + '.webp'))
                with Image.open(path) as image:
                    self.assertEqual(image.format, 'WEBP')
                    self.assertEqual(image.size, (160, 160))
                    self.assertIn('A', image.getbands())
                    rgba = image.convert('RGBA')
                    alpha = rgba.getchannel('A')
                    minimum, maximum = alpha.getextrema()
                    self.assertEqual(minimum, 0)
                    self.assertGreaterEqual(maximum, 245)
                    pixels = alpha.tobytes()
                    self.assertTrue(any(0 < value < 245 for value in pixels),
                                    'hand-drawn stickers keep their smooth transparent edges')
                    for border in ((0, 0, 160, 10), (0, 150, 160, 160),
                                   (0, 0, 10, 160), (150, 0, 160, 160)):
                        self.assertEqual(alpha.crop(border).getextrema(), (0, 0),
                                         'stickers need a safe transparent margin')
                    self.assertIsNotNone(alpha.getbbox())
                    coverage = sum(value > 32 for value in pixels) / (160 * 160)
                    self.assertGreater(coverage, .04, 'the reaction must be visibly drawn')
                    self.assertLess(coverage, .85, 'the sticker must retain a transparent surround')
                    pictures.add(hashlib.sha256(rgba.tobytes()).hexdigest())
                self.assertTrue(item['name'].strip())
                self.assertIn('守宫', item['alt'])
                self.assertNotIn('L0', item['alt'])
        self.assertEqual(len(pictures), len(REACTIONS), 'each reaction needs its own actual image')


if __name__ == '__main__':
    unittest.main()
