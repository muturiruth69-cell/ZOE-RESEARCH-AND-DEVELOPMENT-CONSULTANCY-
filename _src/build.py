"""
Assemble the ZOE website.

Edit page content in _src/pages/*.html and the shared header/footer in
_src/partials/, then run from the project folder:

    py _src/build.py

Each page starts with a front-matter comment:

    <!--
    title: Page title
    description: Meta description
    nav: services        (which menu item is highlighted)
    three: yes           (load the Three.js 3D banner)
    -->
"""
import re
from pathlib import Path

SRC = Path(__file__).resolve().parent
OUT = SRC.parent
PARTIALS = SRC / "partials"

THREE = ''  # 3D banners retired in favour of real photography
MAIN = '<script src="assets/js/main.js?v=20261126a" defer></script>'


def read(p: Path) -> str:
    return p.read_text(encoding="utf-8")


def parse(page: str):
    m = re.match(r"\s*<!--(.*?)-->\s*", page, re.S)
    meta = {}
    if m:
        for line in m.group(1).strip().splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip()
        page = page[m.end():]
    return meta, page


def main():
    head, header, footer = (read(PARTIALS / n) for n in ("head.html", "header.html", "footer.html"))
    built = []
    for src in sorted((SRC / "pages").glob("*.html")):
        meta, body = parse(read(src))
        title = meta.get("title", "ZOE Research & Development Consultancy")
        desc = meta.get("description", "Smart Research. Smarter Decisions.")
        nav = meta.get("nav", "")
        scripts = (THREE if meta.get("three", "no") == "yes" else "") + MAIN

        h = header
        if nav:
            h = h.replace(f'data-nav="{nav}" href', f'data-nav="{nav}" aria-current="page" href')

        body = re.sub(r"\{\{viz:([\w-]+)\}\}", lambda m: read(PARTIALS / "viz" / (m.group(1) + ".svg")).strip(), body)
        html = (head.replace("{{title}}", title).replace("{{description}}", desc)
                + h + body.rstrip() + "\n" + footer.replace("{{scripts}}", scripts))
        (OUT / src.name).write_text(html, encoding="utf-8")
        built.append(src.name)
    print("Built:", ", ".join(built))


if __name__ == "__main__":
    main()
