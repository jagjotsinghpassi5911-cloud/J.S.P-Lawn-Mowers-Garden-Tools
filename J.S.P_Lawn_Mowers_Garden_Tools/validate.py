"""Dependency-free checks for this four-page static website."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / 'public'
EXPECTED = {'index.html', 'products.html', 'about.html', 'login.html'}

class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids=[]; self.links=[]; self.images=[]; self.h1s=0
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if a.get('id'): self.ids.append(a['id'])
        if tag == 'h1': self.h1s += 1
        if tag == 'img': self.images.append(a)
        for key in ['href','src']:
            if a.get(key): self.links.append(a[key])

def main():
    files=list(PUBLIC.rglob('*.html'))
    assert {p.relative_to(PUBLIC).as_posix() for p in files} == EXPECTED, 'Expected exactly four HTML pages'
    pages={}
    for p in files:
        page=Page(); page.feed(p.read_text()); pages[p.name]=page
        assert page.h1s == 1, f'{p.name}: expected one H1'
        assert len(page.ids) == len(set(page.ids)), f'{p.name}: duplicate IDs'
        assert all(img.get('alt') for img in page.images), f'{p.name}: missing image alternative text'
    checked=0
    for name,page in pages.items():
        for link in page.links:
            parts=urlsplit(link)
            if parts.scheme or parts.netloc: continue
            target=(PUBLIC/unquote(parts.path)).resolve() if parts.path else PUBLIC/name
            assert target.is_relative_to(PUBLIC), f'Path outside public: {link}'
            assert target.is_file(), f'Broken local link: {name}: {link}'
            if parts.fragment and target.name in pages:
                assert unquote(parts.fragment) in pages[target.name].ids, f'Broken anchor: {link}'
            checked+=1
    sources=json.loads((PUBLIC/'assets/image-sources.json').read_text())
    for asset in sources:
        assert not asset.get('error'), asset
        path=PUBLIC/'assets/images'/asset['file']
        assert path.is_file() and path.stat().st_size > 0, str(path)
    config=json.loads((ROOT/'firebase.json').read_text())
    assert config['hosting']['public'] == 'public'
    assert 'rewrites' not in config['hosting'], 'Multi-page project must not route everything to index.html'
    print(f'PASS: 4 pages, unique IDs, image alt text, {checked} local references, {len(sources)} source images and Firebase configuration.')

if __name__ == '__main__': main()
